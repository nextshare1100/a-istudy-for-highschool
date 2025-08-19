import { useState, useEffect } from 'react'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

interface ChallengeAnalytics {
  dailyChallenges: {
    completed: number
    total: number
    averageScore: number
    subjectDistribution: { [subject: string]: number }
    difficultyBreakdown: {
      easy: { completed: number; accuracy: number }
      medium: { completed: number; accuracy: number }
      hard: { completed: number; accuracy: number }
    }
  }
  weeklyChallenges: {
    completed: number
    total: number
    averageCompletionRate: number
    currentWeekProgress: number
  }
  monthlyChallenges: {
    currentMilestone: string
    totalQuestions: number
    monthlyTarget: number
    questionsToday: number
    questionsThisWeek: number
  }
  trends: {
    dailyCompletionRate: Array<{ date: string; rate: number }>
    weeklyProgress: Array<{ week: string; progress: number }>
    monthlyMilestones: Array<{ month: string; milestone: string; questions: number }>
  }
}

export function useChallengeAnalytics(
  userId: string,
  dateRange: 'today' | 'week' | 'month' | 'year' | 'custom',
  customRange?: { from: Date; to: Date }
) {
  const [analytics, setAnalytics] = useState<ChallengeAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchChallengeAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)

        const { startDate, endDate } = getDateRange(dateRange, customRange)

        // デイリーチャレンジの統計を取得
        const dailyStats = await getDailyChallengeStats(userId, startDate, endDate)
        
        // 週間チャレンジの統計を取得
        const weeklyStats = await getWeeklyChallengeStats(userId, startDate, endDate)
        
        // 月間チャレンジの統計を取得
        const monthlyStats = await getMonthlyChallengeStats(userId)

        // トレンドデータを取得
        const trends = await getChallenglengeTrends(userId, startDate, endDate)

        setAnalytics({
          dailyChallenges: dailyStats,
          weeklyChallenges: weeklyStats,
          monthlyChallenges: monthlyStats,
          trends
        })
      } catch (err) {
        console.error('Error fetching challenge analytics:', err)
        setError('チャレンジ分析データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchChallengeAnalytics()
  }, [userId, dateRange, customRange])

  return { analytics, loading, error }
}

function getDateRange(
  range: 'today' | 'week' | 'month' | 'year' | 'custom',
  customRange?: { from: Date; to: Date }
) {
  const now = new Date()
  let startDate = new Date()
  let endDate = now

  switch (range) {
    case 'today':
      startDate.setHours(0, 0, 0, 0)
      break
    case 'week':
      startDate.setDate(now.getDate() - 7)
      break
    case 'month':
      startDate.setMonth(now.getMonth() - 1)
      break
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1)
      break
    case 'custom':
      if (customRange) {
        startDate = customRange.from
        endDate = customRange.to
      }
      break
  }

  return { startDate, endDate }
}

async function getDailyChallengeStats(userId: string, startDate: Date, endDate: Date) {
  const statusQuery = query(
    collection(db, 'users', userId, 'dailyChallengeStatus'),
    where('completedAt', '>=', Timestamp.fromDate(startDate)),
    where('completedAt', '<=', Timestamp.fromDate(endDate)),
    orderBy('completedAt', 'desc')
  )

  const statusDocs = await getDocs(statusQuery)
  
  let completed = 0
  let totalScore = 0
  let totalQuestions = 0
  const subjectDistribution: { [subject: string]: number } = {}
  const difficultyStats = {
    easy: { completed: 0, totalScore: 0, totalQuestions: 0 },
    medium: { completed: 0, totalScore: 0, totalQuestions: 0 },
    hard: { completed: 0, totalScore: 0, totalQuestions: 0 }
  }

  for (const doc of statusDocs.docs) {
    const status = doc.data()
    if (status.completed) {
      completed++
      totalScore += status.score || 0
      totalQuestions += status.totalQuestions || 0

      // チャレンジの詳細情報を取得
      const challengeDoc = await getDocs(
        query(
          collection(db, 'dailyChallenges'),
          where('__name__', '==', status.challengeId)
        )
      )

      if (!challengeDoc.empty) {
        const challenge = challengeDoc.docs[0].data()
        
        // 科目別カウント
        subjectDistribution[challenge.subject] = (subjectDistribution[challenge.subject] || 0) + 1
        
        // 難易度別統計
        const difficulty = challenge.difficulty as 'easy' | 'medium' | 'hard'
        difficultyStats[difficulty].completed++
        difficultyStats[difficulty].totalScore += status.score || 0
        difficultyStats[difficulty].totalQuestions += status.totalQuestions || 0
      }
    }
  }

  // 日数を計算して総数を推定
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const total = Math.min(days, statusDocs.size + Math.floor(days * 0.2)) // 未完了分を推定

  return {
    completed,
    total,
    averageScore: totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0,
    subjectDistribution,
    difficultyBreakdown: {
      easy: {
        completed: difficultyStats.easy.completed,
        accuracy: difficultyStats.easy.totalQuestions > 0 
          ? Math.round((difficultyStats.easy.totalScore / difficultyStats.easy.totalQuestions) * 100)
          : 0
      },
      medium: {
        completed: difficultyStats.medium.completed,
        accuracy: difficultyStats.medium.totalQuestions > 0
          ? Math.round((difficultyStats.medium.totalScore / difficultyStats.medium.totalQuestions) * 100)
          : 0
      },
      hard: {
        completed: difficultyStats.hard.completed,
        accuracy: difficultyStats.hard.totalQuestions > 0
          ? Math.round((difficultyStats.hard.totalScore / difficultyStats.hard.totalQuestions) * 100)
          : 0
      }
    }
  }
}

async function getWeeklyChallengeStats(userId: string, startDate: Date, endDate: Date) {
  const statusQuery = query(
    collection(db, 'users', userId, 'weeklyChallengeStatus'),
    where('completedAt', '>=', Timestamp.fromDate(startDate)),
    where('completedAt', '<=', Timestamp.fromDate(endDate))
  )

  const statusDocs = await getDocs(statusQuery)
  
  let completed = 0
  let totalCompletionRate = 0
  let currentWeekProgress = 0

  for (const doc of statusDocs.docs) {
    const status = doc.data()
    if (status.completed) {
      completed++
    }
    totalCompletionRate += status.completionRate || 0
  }

  // 現在の週の進捗を取得
  const currentWeekStart = new Date()
  const day = currentWeekStart.getDay()
  const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1)
  currentWeekStart.setDate(diff)
  currentWeekStart.setHours(0, 0, 0, 0)

  const currentWeekQuery = query(
    collection(db, 'users', userId, 'weeklyChallengeStatus'),
    where('createdAt', '>=', Timestamp.fromDate(currentWeekStart))
  )

  const currentWeekDocs = await getDocs(currentWeekQuery)
  if (!currentWeekDocs.empty) {
    currentWeekProgress = Math.round((currentWeekDocs.docs[0].data().completionRate || 0) * 100)
  }

  // 週数を計算
  const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7))

  return {
    completed,
    total: weeks,
    averageCompletionRate: statusDocs.size > 0 
      ? Math.round((totalCompletionRate / statusDocs.size) * 100)
      : 0,
    currentWeekProgress
  }
}

async function getMonthlyChallengeStats(userId: string) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const statusQuery = query(
    collection(db, 'users', userId, 'monthlyChallengeStatus'),
    where('createdAt', '>=', Timestamp.fromDate(monthStart))
  )

  const statusDocs = await getDocs(statusQuery)
  
  if (statusDocs.empty) {
    return {
      currentMilestone: 'none',
      totalQuestions: 0,
      monthlyTarget: 300,
      questionsToday: 0,
      questionsThisWeek: 0
    }
  }

  const currentStatus = statusDocs.docs[0].data()
  
  // 今日の問題数を計算（簡易版）
  const questionsToday = 0 // TODO: デイリーチャレンジの履歴から計算
  
  // 今週の問題数を計算
  const weekNumber = Math.ceil(now.getDate() / 7)
  const questionsThisWeek = currentStatus.weeklyProgress?.[weekNumber]?.totalQuestions || 0

  return {
    currentMilestone: currentStatus.currentMilestone || 'none',
    totalQuestions: currentStatus.totalQuestions || 0,
    monthlyTarget: 300,
    questionsToday,
    questionsThisWeek
  }
}

async function getChallenglengeTrends(userId: string, startDate: Date, endDate: Date) {
  // デイリー完了率のトレンド
  const dailyTrend: Array<{ date: string; rate: number }> = []
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dayStart = new Date(currentDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(currentDate)
    dayEnd.setHours(23, 59, 59, 999)
    
    const dayQuery = query(
      collection(db, 'users', userId, 'dailyChallengeStatus'),
      where('completedAt', '>=', Timestamp.fromDate(dayStart)),
      where('completedAt', '<=', Timestamp.fromDate(dayEnd))
    )
    
    const dayDocs = await getDocs(dayQuery)
    const completed = dayDocs.docs.filter(doc => doc.data().completed).length
    
    dailyTrend.push({
      date: currentDate.toISOString().split('T')[0],
      rate: completed > 0 ? 100 : 0
    })
    
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // 週間進捗のトレンド（最大4週間）
  const weeklyProgress: Array<{ week: string; progress: number }> = []
  const weeksQuery = query(
    collection(db, 'users', userId, 'weeklyChallengeStatus'),
    orderBy('createdAt', 'desc'),
    where('createdAt', '>=', Timestamp.fromDate(startDate))
  )
  
  const weeksDocs = await getDocs(weeksQuery)
  weeksDocs.docs.forEach(doc => {
    const data = doc.data()
    const weekStart = data.createdAt.toDate()
    weeklyProgress.push({
      week: `${weekStart.getMonth() + 1}/${weekStart.getDate()}の週`,
      progress: Math.round((data.completionRate || 0) * 100)
    })
  })

  // 月間マイルストーンのトレンド
  const monthlyMilestones: Array<{ month: string; milestone: string; questions: number }> = []
  const monthsQuery = query(
    collection(db, 'users', userId, 'monthlyChallengeStatus'),
    orderBy('createdAt', 'desc')
  )
  
  const monthsDocs = await getDocs(monthsQuery)
  monthsDocs.docs.forEach(doc => {
    const data = doc.data()
    const month = data.createdAt.toDate()
    monthlyMilestones.push({
      month: `${month.getFullYear()}年${month.getMonth() + 1}月`,
      milestone: data.currentMilestone || 'none',
      questions: data.totalQuestions || 0
    })
  })

  return {
    dailyCompletionRate: dailyTrend,
    weeklyProgress: weeklyProgress.slice(0, 4).reverse(),
    monthlyMilestones: monthlyMilestones.slice(0, 3).reverse()
  }
}