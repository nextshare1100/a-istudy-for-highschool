import * as functions from 'firebase-functions'
import { db } from '../lib/db'
import { sendNotification } from '../lib/notifications'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface DailyReport {
  date: Date
  studyTime: number
  subjectsStudied: {
    subject: string
    duration: number
    topics: string[]
  }[]
  goalsAchieved: number
  goalsTotal: number
  tomorrowsPlan: {
    subject: string
    topic: string
    targetTime: number
    startTime: string
  }[]
  encouragement: string
  suggestions: string[]
}

// 毎日21:00に実行
export const dailyStudyReport = functions.pubsub
  .schedule('0 21 * * *')
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    console.log('Daily study report started')
    
    try {
      // アクティブなユーザーを取得
      const activeUsers = await getActiveUsersWithSchedule()
      
      for (const user of activeUsers) {
        try {
          // 本日の学習データを集計
          const todaysSessions = await getTodaysSessions(user.id)
          
          // 本日の目標を取得
          const dailyGoals = await getDailyGoals(user.id, user.schedule)
          
          // 達成度を計算
          const achievement = calculateAchievement(todaysSessions, dailyGoals)
          
          // 明日の計画を生成
          const tomorrowsPlan = await generateTomorrowsPlan(user.id, user.schedule, achievement)
          
          // 励ましメッセージを生成
          const encouragement = generateEncouragement(achievement, todaysSessions)
          
          // 提案を生成
          const suggestions = generateSuggestions(todaysSessions, dailyGoals, achievement)
          
          // レポートを作成
          const report: DailyReport = {
            date: new Date(),
            studyTime: todaysSessions.reduce((sum, s) => sum + s.duration, 0),
            subjectsStudied: aggregateBySubject(todaysSessions),
            goalsAchieved: achievement.achieved,
            goalsTotal: achievement.total,
            tomorrowsPlan,
            encouragement,
            suggestions
          }
          
          // 通知を送信
          await sendNotification({
            userId: user.id,
            title: '本日の学習レポート',
            body: formatReportSummary(report),
            data: {
              type: 'daily_report',
              reportId: await saveReport(user.id, report)
            }
          })
          
          // 統計を更新
          await updateDailyStats(user.id, report)
          
        } catch (userError) {
          console.error(`Error processing user ${user.id}:`, userError)
        }
      }
      
      console.log('Daily study report completed')
    } catch (error) {
      console.error('Error in daily study report:', error)
      throw error
    }
  })

// アクティブなスケジュールを持つユーザーを取得
async function getActiveUsersWithSchedule() {
  const schedules = await db.schedule.findMany({
    where: {
      isActive: true,
      targetDate: {
        gt: new Date() // 目標日が未来
      }
    },
    include: {
      user: true,
      monthlyGoals: {
        include: {
          subjectGoals: true
        }
      }
    }
  })
  
  return schedules.map(schedule => ({
    id: schedule.userId,
    email: schedule.user.email,
    schedule
  }))
}

// 本日の学習セッションを取得
async function getTodaysSessions(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  return await db.studySession.findMany({
    where: {
      userId,
      startTime: {
        gte: today,
        lt: tomorrow
      }
    },
    include: {
      questions: true
    }
  })
}

// 本日の目標を取得
async function getDailyGoals(userId: string, schedule: any) {
  const currentMonth = new Date().getMonth() + 1
  const monthlyGoal = schedule.monthlyGoals.find((g: any) => g.month === currentMonth)
  
  if (!monthlyGoal) {
    return []
  }
  
  // 月間目標を日割り計算
  const daysInMonth = new Date(new Date().getFullYear(), currentMonth, 0).getDate()
  
  return monthlyGoal.subjectGoals.map((goal: any) => ({
    subject: goal.subject,
    dailyTarget: goal.targetHours / daysInMonth * 60, // 分単位
    topics: goal.topics
  }))
}

// 達成度を計算
function calculateAchievement(sessions: any[], goals: any[]) {
  let achieved = 0
  let total = goals.length
  
  goals.forEach(goal => {
    const studyTime = sessions
      .filter(s => s.subject === goal.subject)
      .reduce((sum, s) => sum + s.duration, 0)
    
    if (studyTime >= goal.dailyTarget * 0.8) { // 80%以上で達成
      achieved++
    }
  })
  
  return { achieved, total, percentage: total > 0 ? (achieved / total) * 100 : 0 }
}

// 科目ごとに集計
function aggregateBySubject(sessions: any[]) {
  const bySubject: Record<string, any> = {}
  
  sessions.forEach(session => {
    if (!bySubject[session.subject]) {
      bySubject[session.subject] = {
        subject: session.subject,
        duration: 0,
        topics: new Set()
      }
    }
    
    bySubject[session.subject].duration += session.duration
    session.questions.forEach((q: any) => {
      bySubject[session.subject].topics.add(q.topic)
    })
  })
  
  return Object.values(bySubject).map(s => ({
    ...s,
    topics: Array.from(s.topics)
  }))
}

// 明日の計画を生成
async function generateTomorrowsPlan(userId: string, schedule: any, achievement: any) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // 明日の個人予定を確認
  const tomorrowEvents = schedule.personalEvents.filter((event: any) => {
    const eventDate = new Date(event.startDate)
    return eventDate.toDateString() === tomorrow.toDateString()
  })
  
  // 利用可能な学習時間を計算
  let availableHours = 6 // デフォルト6時間
  if (tomorrowEvents.length > 0) {
    availableHours = Math.max(2, availableHours - tomorrowEvents.length * 2)
  }
  
  // 優先順位に基づいて時間配分
  const currentMonth = tomorrow.getMonth() + 1
  const monthlyGoal = schedule.monthlyGoals.find((g: any) => g.month === currentMonth)
  
  if (!monthlyGoal) {
    return []
  }
  
  const plan = monthlyGoal.subjectGoals
    .sort((a: any, b: any) => a.priority - b.priority)
    .slice(0, 3) // 上位3科目
    .map((goal: any, index: number) => ({
      subject: goal.subject,
      topic: goal.topics[0] || '総合演習',
      targetTime: Math.floor(availableHours * 60 / 3), // 均等配分
      startTime: `${9 + index * 3}:00` // 9時、12時、15時
    }))
  
  return plan
}

// 励ましメッセージを生成
function generateEncouragement(achievement: any, sessions: any[]): string {
  const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0)
  
  if (achievement.percentage >= 100) {
    return '素晴らしい！今日の目標を完全達成しました！この調子で明日も頑張りましょう！🎉'
  } else if (achievement.percentage >= 80) {
    return 'よく頑張りました！ほぼ目標達成です。明日は100%を目指しましょう！💪'
  } else if (achievement.percentage >= 50) {
    return `${Math.floor(totalTime / 60)}時間の学習お疲れ様でした。少しずつ前進しています。明日も一緒に頑張りましょう！`
  } else if (totalTime > 0) {
    return '今日も学習を始められたことが素晴らしいです。小さな一歩も大きな成果につながります！'
  } else {
    return '今日は忙しかったようですね。明日は新しい気持ちでスタートしましょう！'
  }
}

// 提案を生成
function generateSuggestions(sessions: any[], goals: any[], achievement: any): string[] {
  const suggestions: string[] = []
  
  // 目標未達成の科目
  goals.forEach(goal => {
    const studyTime = sessions
      .filter(s => s.subject === goal.subject)
      .reduce((sum, s) => sum + s.duration, 0)
    
    if (studyTime < goal.dailyTarget * 0.5) {
      suggestions.push(`${goal.subject}の学習時間が不足しています。明日は重点的に取り組みましょう`)
    }
  })
  
  // 長時間学習していない場合
  const maxSessionDuration = Math.max(...sessions.map(s => s.duration), 0)
  if (maxSessionDuration < 60) {
    suggestions.push('集中して学習する時間を確保しましょう。60分以上の連続学習が効果的です')
  }
  
  // バランスの偏り
  const subjectCounts = sessions.reduce((acc, s) => {
    acc[s.subject] = (acc[s.subject] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  if (Object.keys(subjectCounts).length === 1 && goals.length > 1) {
    suggestions.push('複数科目をバランスよく学習することをお勧めします')
  }
  
  return suggestions.slice(0, 3) // 最大3つの提案
}

// レポートのサマリーをフォーマット
function formatReportSummary(report: DailyReport): string {
  const hours = Math.floor(report.studyTime / 60)
  const minutes = report.studyTime % 60
  const timeStr = hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`
  
  return `本日の学習時間: ${timeStr}\n達成度: ${report.goalsAchieved}/${report.goalsTotal}目標\n${report.encouragement}`
}

// レポートを保存
async function saveReport(userId: string, report: DailyReport): Promise<string> {
  const saved = await db.dailyReport.create({
    data: {
      userId,
      date: report.date,
      totalStudyTime: report.studyTime,
      subjectsData: JSON.stringify(report.subjectsStudied),
      goalsAchieved: report.goalsAchieved,
      goalsTotal: report.goalsTotal,
      tomorrowsPlan: JSON.stringify(report.tomorrowsPlan),
      encouragement: report.encouragement,
      suggestions: report.suggestions
    }
  })
  
  return saved.id
}

// 日次統計を更新
async function updateDailyStats(userId: string, report: DailyReport) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // 既存の統計を検索
  const existingStats = await db.dailyStats.findFirst({
    where: {
      userId,
      date: today
    }
  })
  
  if (existingStats) {
    // 更新
    await db.dailyStats.update({
      where: { id: existingStats.id },
      data: {
        totalStudyTime: report.studyTime,
        subjectsStudied: report.subjectsStudied.length,
        goalsAchieved: report.goalsAchieved,
        goalsTotal: report.goalsTotal,
        achievementRate: report.goalsTotal > 0 ? (report.goalsAchieved / report.goalsTotal) * 100 : 0
      }
    })
  } else {
    // 新規作成
    await db.dailyStats.create({
      data: {
        userId,
        date: today,
        totalStudyTime: report.studyTime,
        subjectsStudied: report.subjectsStudied.length,
        goalsAchieved: report.goalsAchieved,
        goalsTotal: report.goalsTotal,
        achievementRate: report.goalsTotal > 0 ? (report.goalsAchieved / report.goalsTotal) * 100 : 0
      }
    })
  }
  
  // 週間・月間の統計も更新
  await updateWeeklyStats(userId)
  await updateMonthlyStats(userId)
}

// 週間統計を更新
async function updateWeeklyStats(userId: string) {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - dayOfWeek)
  weekStart.setHours(0, 0, 0, 0)
  
  const weekStats = await db.dailyStats.findMany({
    where: {
      userId,
      date: {
        gte: weekStart,
        lte: today
      }
    }
  })
  
  if (weekStats.length > 0) {
    const totalTime = weekStats.reduce((sum, stat) => sum + stat.totalStudyTime, 0)
    const avgAchievement = weekStats.reduce((sum, stat) => sum + stat.achievementRate, 0) / weekStats.length
    
    await db.weeklyStats.upsert({
      where: {
        userId_weekStart: {
          userId,
          weekStart
        }
      },
      update: {
        totalStudyTime: totalTime,
        averageAchievementRate: avgAchievement,
        daysStudied: weekStats.length
      },
      create: {
        userId,
        weekStart,
        totalStudyTime: totalTime,
        averageAchievementRate: avgAchievement,
        daysStudied: weekStats.length
      }
    })
  }
}

// 月間統計を更新
async function updateMonthlyStats(userId: string) {
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const monthStats = await db.dailyStats.findMany({
    where: {
      userId,
      date: {
        gte: monthStart,
        lte: today
      }
    }
  })
  
  if (monthStats.length > 0) {
    const totalTime = monthStats.reduce((sum, stat) => sum + stat.totalStudyTime, 0)
    const avgAchievement = monthStats.reduce((sum, stat) => sum + stat.achievementRate, 0) / monthStats.length
    
    await db.monthlyStats.upsert({
      where: {
        userId_month_year: {
          userId,
          month: today.getMonth() + 1,
          year: today.getFullYear()
        }
      },
      update: {
        totalStudyTime: totalTime,
        averageAchievementRate: avgAchievement,
        daysStudied: monthStats.length
      },
      create: {
        userId,
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        totalStudyTime: totalTime,
        averageAchievementRate: avgAchievement,
        daysStudied: monthStats.length
      }
    })
  }
}