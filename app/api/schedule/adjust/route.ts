import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'
import { adjustSchedule } from '@/lib/gemini'

// POST /api/schedule/adjust - スケジュールの自動調整
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { scheduleId, reason, manualTrigger = false } = body

    // 現在のスケジュールを取得
    const schedule = await db.schedule.findFirst({
      where: {
        id: scheduleId,
        userId,
        isActive: true
      },
      include: {
        monthlyGoals: {
          include: {
            subjectGoals: true
          }
        },
        personalEvents: true,
        aspirations: {
          include: {
            university: true
          }
        }
      }
    })

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // 最近の学習実績を取得
    const recentSessions = await db.studySession.findMany({
      where: {
        userId,
        startTime: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 過去30日
        }
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    // 進捗状況を分析
    const currentMonth = new Date().getMonth()
    const currentMonthGoal = schedule.monthlyGoals.find(g => g.month === currentMonth + 1)
    
    if (!currentMonthGoal) {
      return NextResponse.json({ error: 'No goal for current month' }, { status: 400 })
    }

    // 月間の学習時間を集計
    const monthStart = new Date(new Date().getFullYear(), currentMonth, 1)
    const monthSessions = recentSessions.filter(s => s.startTime >= monthStart)
    
    const subjectHours: Record<string, number> = {}
    monthSessions.forEach(session => {
      if (!subjectHours[session.subject]) {
        subjectHours[session.subject] = 0
      }
      subjectHours[session.subject] += session.duration / 60
    })

    // 進捗率を計算
    const progressBySubject = currentMonthGoal.subjectGoals.map(goal => ({
      subject: goal.subject,
      targetHours: goal.targetHours,
      actualHours: subjectHours[goal.subject] || 0,
      progressRate: ((subjectHours[goal.subject] || 0) / goal.targetHours) * 100
    }))

    // 調整が必要かチェック
    const needsAdjustment = checkIfAdjustmentNeeded(progressBySubject, schedule, manualTrigger)

    if (!needsAdjustment.needed) {
      return NextResponse.json({
        adjusted: false,
        reason: 'No adjustment needed',
        currentProgress: progressBySubject
      })
    }

    // 最新の習熟度データを取得
    const latestProgress = await db.progress.findMany({
      where: {
        userId
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Gemini APIで調整案を生成
    const adjustmentPlan = await adjustSchedule({
      currentSchedule: schedule,
      progressBySubject,
      recentPerformance: latestProgress.map(p => ({
        subject: p.subject,
        score: p.score,
        trend: p.trend
      })),
      remainingDays: Math.floor((new Date(schedule.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      adjustmentReason: needsAdjustment.reason
    })

    // 調整内容を記録
    const changes = []

    // 月次目標の更新
    for (const monthPlan of adjustmentPlan.updatedMonthlyPlans) {
      const existingGoal = schedule.monthlyGoals.find(g => 
        g.month === monthPlan.month && g.year === monthPlan.year
      )

      if (existingGoal) {
        // 既存の目標を更新
        await db.monthlyGoal.update({
          where: { id: existingGoal.id },
          data: {
            totalHours: monthPlan.totalHours,
            subjectGoals: {
              deleteMany: {}, // 既存の科目目標を削除
              create: monthPlan.subjects.map(subject => ({
                subject: subject.name,
                targetHours: subject.hours,
                topics: subject.topics,
                priority: subject.priority
              }))
            }
          }
        })

        changes.push({
          type: 'monthly_goal_update',
          month: monthPlan.month,
          before: {
            totalHours: existingGoal.totalHours,
            subjects: existingGoal.subjectGoals
          },
          after: {
            totalHours: monthPlan.totalHours,
            subjects: monthPlan.subjects
          }
        })
      } else {
        // 新しい月次目標を作成
        await db.monthlyGoal.create({
          data: {
            scheduleId: schedule.id,
            month: monthPlan.month,
            year: monthPlan.year,
            totalHours: monthPlan.totalHours,
            subjectGoals: {
              create: monthPlan.subjects.map(subject => ({
                subject: subject.name,
                targetHours: subject.hours,
                topics: subject.topics,
                priority: subject.priority
              }))
            }
          }
        })

        changes.push({
          type: 'monthly_goal_create',
          month: monthPlan.month,
          data: monthPlan
        })
      }
    }

    // 調整戦略を更新
    if (adjustmentPlan.newStrategy !== schedule.adjustmentStrategy) {
      await db.schedule.update({
        where: { id: schedule.id },
        data: {
          adjustmentStrategy: adjustmentPlan.newStrategy,
          lastAdjustedAt: new Date()
        }
      })

      changes.push({
        type: 'strategy_update',
        before: schedule.adjustmentStrategy,
        after: adjustmentPlan.newStrategy
      })
    }

    // 調整履歴を記録
    await db.scheduleAdjustment.create({
      data: {
        scheduleId: schedule.id,
        reason: needsAdjustment.reason,
        changes: JSON.stringify(changes),
        suggestedActions: adjustmentPlan.suggestedActions
      }
    })

    // 更新されたスケジュールを取得
    const updatedSchedule = await db.schedule.findUnique({
      where: { id: schedule.id },
      include: {
        monthlyGoals: {
          include: {
            subjectGoals: true
          }
        }
      }
    })

    return NextResponse.json({
      adjusted: true,
      reason: needsAdjustment.reason,
      changes,
      suggestedActions: adjustmentPlan.suggestedActions,
      newSchedule: updatedSchedule
    })

  } catch (error) {
    console.error('Error adjusting schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 調整が必要かチェックする関数
function checkIfAdjustmentNeeded(
  progressBySubject: any[],
  schedule: any,
  manualTrigger: boolean
): { needed: boolean; reason: string } {
  
  // 手動トリガーの場合は常に調整
  if (manualTrigger) {
    return { needed: true, reason: 'Manual adjustment requested' }
  }

  const now = new Date()
  const monthProgress = (now.getDate() / 30) * 100 // 月の経過率

  // 各科目の進捗をチェック
  const significantlyBehind = progressBySubject.filter(p => 
    p.progressRate < monthProgress - 20 // 20%以上の遅れ
  )

  const significantlyAhead = progressBySubject.filter(p => 
    p.progressRate > monthProgress + 30 // 30%以上の進み
  )

  // 大幅な遅れがある場合
  if (significantlyBehind.length > 0) {
    return {
      needed: true,
      reason: `${significantlyBehind.map(s => s.subject).join(', ')}の進捗が大幅に遅れています`
    }
  }

  // 大幅な進みがある場合
  if (significantlyAhead.length > 0) {
    return {
      needed: true,
      reason: `${significantlyAhead.map(s => s.subject).join(', ')}の進捗が予定より大幅に進んでいます`
    }
  }

  // 最後の調整から30日以上経過
  const lastAdjustment = schedule.lastAdjustedAt
  if (lastAdjustment && (now.getTime() - new Date(lastAdjustment).getTime()) > 30 * 24 * 60 * 60 * 1000) {
    return {
      needed: true,
      reason: '定期レビューのタイミングです'
    }
  }

  return { needed: false, reason: '' }
}