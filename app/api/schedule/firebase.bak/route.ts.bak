// app/api/schedule/firebase/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { 
  getActiveSchedule, 
  createSchedule, 
  getMonthlyGoalsBySchedule,
  calculateScheduleProgress,
  createMonthlyGoal,
  createPersonalEvent 
} from '@/lib/firebase/schedule'
import { createSchedule as generateScheduleWithAI } from '@/lib/gemini/client'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

// 認証ヘルパー関数
async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  
  // TODO: Firebase認証トークンの検証
  // 一時的にトークンをユーザーIDとして使用
  const token = authHeader.split('Bearer ')[1]
  return token
}

// GET /api/schedule/firebase - 現在のスケジュール取得
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // アクティブなスケジュールを取得
    const schedule = await getActiveSchedule(userId)
    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // 月間目標を取得
    const monthlyGoals = await getMonthlyGoalsBySchedule(schedule.id!)

    // 学習実績を取得
    const sessionsQuery = query(
      collection(db, 'studySessions'),
      where('userId', '==', userId),
      where('startTime', '>=', schedule.createdAt)
    )
    const sessionsSnapshot = await getDocs(sessionsQuery)
    const studySessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // 進捗を計算
    const { status, progress } = await calculateScheduleProgress(schedule, studySessions)

    // 次のマイルストーンを取得
    const eventsQuery = query(
      collection(db, 'personalEvents'),
      where('scheduleId', '==', schedule.id)
    )
    const eventsSnapshot = await getDocs(eventsQuery)
    const events = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    const now = new Date()
    const nextMilestone = events
      .filter(event => new Date(event.startDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0]

    return NextResponse.json({
      ...schedule,
      monthlyGoals,
      personalEvents: events,
      nextMilestone,
      status,
      progress
    })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/schedule/firebase - 新規スケジュール作成
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req)
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

    // 学習履歴を取得
    const recentSessionsQuery = query(
      collection(db, 'studySessions'),
      where('userId', '==', userId),
      where('startTime', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    )
    const sessionsSnapshot = await getDocs(recentSessionsQuery)
    const recentSessions = sessionsSnapshot.docs.map(doc => doc.data())

    // 弱点情報を取得
    const weakPointsQuery = query(
      collection(db, 'weakPoints'),
      where('userId', '==', userId),
      where('mastered', '==', false)
    )
    const weakPointsSnapshot = await getDocs(weakPointsQuery)
    const weakPoints = weakPointsSnapshot.docs.map(doc => doc.data())

    // Gemini APIでスケジュール生成
    const generatedPlan = await generateScheduleWithAI({
      userId,
      targetDate,
      targetUniversities: aspirations,
      availableHoursPerDay: preferences.studyHoursPerDay,
      preferredSubjects: subjectGoals.map((g: any) => g.name),
      currentLevel: subjectGoals.reduce((acc: any, g: any) => {
        acc[g.name] = g.currentScore
        return acc
      }, {})
    })

    // スケジュールを作成
    const scheduleId = await createSchedule(userId, {
      targetDate: new Date(targetDate),
      targetScore,
      currentScore,
      totalTargetHours: generatedPlan.totalEstimatedHours || 500,
      isActive: true
    })

    // 月間目標を作成
    const monthlyGoalPromises = generatedPlan.schedule.map(async (monthPlan) => {
      const [year, month] = monthPlan.month.split('-').map(Number)
      return createMonthlyGoal({
        scheduleId,
        month,
        year,
        totalHours: monthPlan.subjects.reduce((sum, s) => sum + (s.hours || 0), 0),
        subjectGoals: monthPlan.subjects.map(s => ({
          subject: s.subject,
          targetHours: s.hours || 0,
          completedHours: 0,
          topics: s.topics || [],
          priority: s.priority || 'medium'
        }))
      })
    })
    await Promise.all(monthlyGoalPromises)

    // 個人イベントを作成
    const eventPromises = personalEvents.map((event: any) =>
      createPersonalEvent({
        scheduleId,
        title: event.title,
        type: event.type,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        description: event.description
      })
    )
    await Promise.all(eventPromises)

    // 作成したスケジュールを返す
    const createdSchedule = await getActiveSchedule(userId)
    const monthlyGoals = await getMonthlyGoalsBySchedule(scheduleId)

    return NextResponse.json({
      ...createdSchedule,
      monthlyGoals
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}