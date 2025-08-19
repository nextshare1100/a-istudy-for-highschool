import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { db } from '@/lib/db'
import { createSchedule } from '@/lib/gemini'

// GET /api/schedule - 現在のスケジュール取得
export async function GET(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 現在のアクティブなスケジュールを取得
    const schedule = await db.schedule.findFirst({
      where: {
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

    // 進捗状況を計算
    const now = new Date()
    const targetDate = new Date(schedule.targetDate)
    const totalDays = Math.floor((targetDate.getTime() - schedule.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    const elapsedDays = Math.floor((now.getTime() - schedule.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    const remainingDays = Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // 学習実績を取得
    const studySessions = await db.studySession.findMany({
      where: {
        userId,
        startTime: {
          gte: schedule.createdAt
        }
      }
    })

    // 進捗計算
    const totalStudyHours = studySessions.reduce((sum, session) => {
      return sum + (session.duration / 60)
    }, 0)

    const expectedHours = (elapsedDays / totalDays) * schedule.totalTargetHours
    const status = totalStudyHours >= expectedHours * 0.9 ? 'on_track' : 
                  totalStudyHours >= expectedHours * 0.7 ? 'slightly_behind' : 'behind'

    // 次のマイルストーンを取得
    const nextMilestone = schedule.personalEvents
      .filter(event => new Date(event.startDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0]

    return NextResponse.json({
      id: schedule.id,
      userId: schedule.userId,
      targetDate: schedule.targetDate,
      targetScore: schedule.targetScore,
      currentScore: schedule.currentScore,
      monthlyGoals: schedule.monthlyGoals,
      personalEvents: schedule.personalEvents,
      aspirations: schedule.aspirations,
      nextMilestone,
      status,
      progress: {
        totalDays,
        elapsedDays,
        remainingDays,
        totalStudyHours,
        expectedHours,
        percentage: Math.round((totalStudyHours / schedule.totalTargetHours) * 100)
      }
    })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/schedule - 新規スケジュール作成
export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      targetDate,
      targetScore,
      currentScore,
      subjectGoals,
      aspirations,
      personalEvents,
      preferences
    } = body

    // 既存のアクティブなスケジュールを非アクティブに
    await db.schedule.updateMany({
      where: {
        userId,
        isActive: true
      },
      data: {
        isActive: false
      }
    })

    // ユーザーの学習履歴を取得
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

    // 弱点情報を取得
    const weakPoints = await db.weakPoint.findMany({
      where: {
        userId,
        mastered: false
      }
    })

    // Gemini APIでスケジュール生成
    const generatedPlan = await createSchedule({
      targetDate,
      targetScore,
      currentScore,
      subjectGoals,
      aspirations,
      personalEvents,
      preferences,
      studyHistory: recentSessions.map(session => ({
        subject: session.subject,
        duration: session.duration,
        date: session.startTime
      })),
      weakPoints: weakPoints.map(wp => ({
        subject: wp.subject,
        topic: wp.topic,
        errorRate: wp.errorRate
      }))
    })

    // データベースに保存
    const schedule = await db.schedule.create({
      data: {
        userId,
        targetDate: new Date(targetDate),
        targetScore,
        currentScore,
        totalTargetHours: generatedPlan.totalHours,
        isActive: true,
        monthlyGoals: {
          create: generatedPlan.monthlyPlans.map(plan => ({
            month: plan.month,
            year: plan.year,
            totalHours: plan.totalHours,
            subjectGoals: {
              create: plan.subjects.map(subject => ({
                subject: subject.name,
                targetHours: subject.hours,
                topics: subject.topics,
                priority: subject.priority
              }))
            }
          }))
        },
        personalEvents: {
          create: personalEvents.map((event: any) => ({
            title: event.title,
            type: event.type,
            startDate: new Date(event.startDate),
            endDate: new Date(event.endDate),
            description: event.description
          }))
        },
        aspirations: {
          create: aspirations.map((asp: any) => ({
            universityId: asp.universityId,
            priority: asp.priority
          }))
        },
        adjustmentStrategy: generatedPlan.adjustmentStrategy
      },
      include: {
        monthlyGoals: {
          include: {
            subjectGoals: true
          }
        },
        personalEvents: true,
        aspirations: true
      }
    })

    return NextResponse.json(schedule, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/schedule - スケジュール更新
export async function PUT(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { scheduleId, updates } = body

    // スケジュールの所有者確認
    const schedule = await db.schedule.findFirst({
      where: {
        id: scheduleId,
        userId
      }
    })

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // スケジュール更新
    const updatedSchedule = await db.schedule.update({
      where: {
        id: scheduleId
      },
      data: updates,
      include: {
        monthlyGoals: {
          include: {
            subjectGoals: true
          }
        },
        personalEvents: true,
        aspirations: true
      }
    })

    return NextResponse.json(updatedSchedule)
  } catch (error) {
    console.error('Error updating schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}