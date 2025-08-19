// lib/analytics/improved-analytics.ts

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs,
  Timestamp,
  startAt,
  endAt,
  doc,
  getDoc,
  onSnapshot
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { auth } from '../firebase/config'
import { 
  TimerSession, 
  MockExamResult,
  QuizResult,
  UserProfile,
  Problem
} from '../firebase/firestore'
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  format,
  subDays,
  eachDayOfInterval,
  differenceInDays,
  parseISO
} from 'date-fns'

// ========== 型定義 ==========

export interface StudyTimeStats {
  todayTime: number
  weeklyTotal: number
  monthlyTotal: number
  weeklyTrend: Array<{ date: string; hours: number }>
  subjectDistribution: Array<{ subject: string; time: number; percentage: number }>
  hasData: boolean
}

export interface WeaknessAnalysisData {
  subject: string
  unit: string
  accuracy: number
  totalQuestions: number
  incorrectPatterns: string[]
  improvementTrend: number[]
  lastStudied: Date | null
  focusScore: number
  prerequisiteGaps: string[]
  confidence: 'high' | 'medium' | 'low' // データの信頼度
}

export interface EfficiencyAnalysisData {
  hourlyFocus: Array<{ hour: number; focusScore: number; studyTime: number }>
  subjectEfficiency: Array<{ subject: string; efficiency: number; avgDuration: number }>
  breakPatterns: {
    avgBreakInterval: number
    optimalBreakDuration: number
    currentPattern: string
  }
  pomodoroComparison: {
    userAvgFocus: number
    pomodoroAvgFocus: number
    recommendation: string
  }
  weeklyPatterns: Array<{ day: string; morning: number; afternoon: number; evening: number }>
  dataQuality: 'sufficient' | 'partial' | 'insufficient'
}

export interface PerformancePredictionData {
  currentScore: number
  predictedScore: number
  confidenceInterval: [number, number]
  targetScore: number
  requiredStudyHours: number
  subjectPredictions: Array<{
    subject: string
    current: number
    predicted: number
    potential: number
    recommendedHours: number
  }>
  historicalData: Array<{
    date: string
    actualScore: number
    studyHours: number
  }>
  scenarioAnalysis: Array<{
    studyHours: number
    predictedScore: number
    lowerBound: number
    upperBound: number
  }>
  reliability: 'high' | 'medium' | 'low'
}

// ========== データ取得のヘルパー関数 ==========

async function getTimerSessionsInRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<TimerSession[]> {
  try {
    const q = query(
      collection(db, 'timerSessions'),
      where('userId', '==', userId),
      where('startTime', '>=', Timestamp.fromDate(startDate)),
      where('startTime', '<=', Timestamp.fromDate(endDate)),
      orderBy('startTime', 'desc')
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TimerSession))
  } catch (error) {
    console.error('Error fetching timer sessions:', error)
    return []
  }
}

async function getQuizResultsInRange(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<QuizResult[]> {
  try {
    const q = query(
      collection(db, 'quizResults'),
      where('userId', '==', userId),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'desc')
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QuizResult))
  } catch (error) {
    console.error('Error fetching quiz results:', error)
    return []
  }
}

// ========== 学習時間統計 ==========

export async function getStudyTimeStats(
  userId: string,
  dateRange: 'today' | 'week' | 'month' | 'year' | 'custom',
  customRange?: { from: Date; to: Date }
): Promise<StudyTimeStats> {
  try {
    let startDate: Date
    let endDate: Date

    const now = new Date()
    
    switch (dateRange) {
      case 'today':
        startDate = startOfDay(now)
        endDate = endOfDay(now)
        break
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 })
        endDate = endOfWeek(now, { weekStartsOn: 1 })
        break
      case 'month':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case 'year':
        startDate = startOfYear(now)
        endDate = endOfYear(now)
        break
      case 'custom':
        if (!customRange) throw new Error('Custom range required')
        startDate = customRange.from
        endDate = customRange.to
        break
    }

    // データ取得
    const sessions = await getTimerSessionsInRange(userId, startDate, endDate)
    
    // データがない場合のデフォルト値
    if (sessions.length === 0) {
      return {
        todayTime: 0,
        weeklyTotal: 0,
        monthlyTotal: 0,
        weeklyTrend: generateEmptyWeeklyTrend(),
        subjectDistribution: [],
        hasData: false
      }
    }

    // 完了したセッションのみをフィルタ
    const completedSessions = sessions.filter(s => s.endTime && s.elapsedSeconds > 0)

    // 今日の学習時間
    const todaySessions = completedSessions.filter(s => {
      const sessionDate = s.startTime instanceof Timestamp ? s.startTime.toDate() : s.startTime
      return sessionDate >= startOfDay(now) && sessionDate <= endOfDay(now)
    })
    const todayTime = todaySessions.reduce((sum, s) => sum + s.elapsedSeconds, 0)

    // 週間トレンド（過去7日間）
    const weeklyTrend = calculateWeeklyTrend(completedSessions, now)

    // 週間・月間の合計
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const monthStart = startOfMonth(now)
    
    const weeklyTotal = completedSessions
      .filter(s => {
        const sessionDate = s.startTime instanceof Timestamp ? s.startTime.toDate() : s.startTime
        return sessionDate >= weekStart
      })
      .reduce((sum, s) => sum + s.elapsedSeconds, 0) / 3600

    const monthlyTotal = completedSessions
      .filter(s => {
        const sessionDate = s.startTime instanceof Timestamp ? s.startTime.toDate() : s.startTime
        return sessionDate >= monthStart
      })
      .reduce((sum, s) => sum + s.elapsedSeconds, 0) / 3600

    // 科目別の分布
    const subjectDistribution = calculateSubjectDistribution(completedSessions)

    return {
      todayTime: todayTime / 60, // 分に変換
      weeklyTotal,
      monthlyTotal,
      weeklyTrend,
      subjectDistribution,
      hasData: true
    }
  } catch (error) {
    console.error('Error getting study time stats:', error)
    return {
      todayTime: 0,
      weeklyTotal: 0,
      monthlyTotal: 0,
      weeklyTrend: generateEmptyWeeklyTrend(),
      subjectDistribution: [],
      hasData: false
    }
  }
}

// ========== 弱点分析 ==========

export async function getWeaknessAnalysis(userId: string): Promise<WeaknessAnalysisData[]> {
  try {
    const thirtyDaysAgo = subDays(new Date(), 30)
    
    // 過去30日間のデータを取得
    const [sessions, quizResults] = await Promise.all([
      getTimerSessionsInRange(userId, thirtyDaysAgo, new Date()),
      getQuizResultsInRange(userId, thirtyDaysAgo, new Date())
    ])

    // データが少ない場合は模試結果も参照
    let mockExamData: MockExamResult[] = []
    if (quizResults.length < 50) {
      const mockExamQuery = query(
        collection(db, 'users', userId, 'mockExamResults'),
        orderBy('examDate', 'desc'),
        limit(5)
      )
      const mockExamSnapshot = await getDocs(mockExamQuery)
      mockExamData = mockExamSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MockExamResult))
    }

    // 単元別の統計を集計
    const unitStats = new Map<string, {
      subject: string
      unit: string
      totalQuestions: number
      correctAnswers: number
      totalTime: number
      focusScores: number[]
      lastStudied: Date | null
      sessions: TimerSession[]
    }>()

    // クイズ結果から統計を作成
    quizResults.forEach(result => {
      const key = `${result.subject}-${result.unit}`
      if (!unitStats.has(key)) {
        unitStats.set(key, {
          subject: result.subject,
          unit: result.unit,
          totalQuestions: 0,
          correctAnswers: 0,
          totalTime: 0,
          focusScores: [],
          lastStudied: null,
          sessions: []
        })
      }
      
      const stat = unitStats.get(key)!
      stat.totalQuestions++
      if (result.isCorrect) stat.correctAnswers++
      
      const resultDate = result.createdAt instanceof Timestamp 
        ? result.createdAt.toDate() 
        : new Date(result.createdAt)
      
      if (!stat.lastStudied || resultDate > stat.lastStudied) {
        stat.lastStudied = resultDate
      }
    })

    // セッションデータを統合
    sessions.forEach(session => {
      const key = `${session.subjectId}-${session.unitId}`
      if (!unitStats.has(key)) {
        unitStats.set(key, {
          subject: session.subjectId,
          unit: session.unitId,
          totalQuestions: 0,
          correctAnswers: 0,
          totalTime: 0,
          focusScores: [],
          lastStudied: null,
          sessions: []
        })
      }
      
      const stat = unitStats.get(key)!
      stat.totalTime += session.elapsedSeconds
      stat.focusScores.push(session.focusScore || 75)
      stat.sessions.push(session)
      
      const sessionDate = session.startTime instanceof Timestamp 
        ? session.startTime.toDate() 
        : session.startTime
      
      if (!stat.lastStudied || sessionDate > stat.lastStudied) {
        stat.lastStudied = sessionDate
      }
    })

    // 模試結果から弱点を補完
    if (mockExamData.length > 0) {
      const latestExam = mockExamData[0]
      latestExam.subjectResults.forEach(result => {
        if (result.deviation < 50) {
          const key = `${result.subject}-模試結果`
          if (!unitStats.has(key)) {
            unitStats.set(key, {
              subject: result.subject,
              unit: '総合',
              totalQuestions: 100, // 仮の値
              correctAnswers: Math.round(result.deviation), // 偏差値を仮の正答率として使用
              totalTime: 0,
              focusScores: [],
              lastStudied: latestExam.examDate instanceof Timestamp 
                ? latestExam.examDate.toDate() 
                : new Date(),
              sessions: []
            })
          }
        }
      })
    }

    // 弱点データを生成
    const weaknessData: WeaknessAnalysisData[] = []
    
    unitStats.forEach((stat, key) => {
      const accuracy = stat.totalQuestions > 0 
        ? stat.correctAnswers / stat.totalQuestions 
        : 0.5 // データがない場合は50%と仮定
      
      const avgFocusScore = stat.focusScores.length > 0
        ? stat.focusScores.reduce((a, b) => a + b, 0) / stat.focusScores.length
        : 75
      
      // 弱点の判定基準
      const isWeakness = accuracy < 0.7 || avgFocusScore < 80
      
      if (isWeakness) {
        const confidence = getConfidenceLevel(stat.totalQuestions, stat.sessions.length)
        
        weaknessData.push({
          subject: stat.subject,
          unit: stat.unit,
          accuracy: accuracy * 100,
          totalQuestions: stat.totalQuestions,
          incorrectPatterns: analyzeIncorrectPatterns(stat.sessions, quizResults, stat.subject, stat.unit),
          improvementTrend: calculateImprovementTrend(quizResults, stat.subject, stat.unit),
          lastStudied: stat.lastStudied,
          focusScore: avgFocusScore,
          prerequisiteGaps: analyzePrerequisiteGaps(stat.sessions, stat.subject, stat.unit),
          confidence
        })
      }
    })

    // 信頼度とスコアでソート
    return weaknessData.sort((a, b) => {
      // 信頼度の高いものを優先
      const confidenceOrder = { high: 0, medium: 1, low: 2 }
      const confidenceDiff = confidenceOrder[a.confidence] - confidenceOrder[b.confidence]
      if (confidenceDiff !== 0) return confidenceDiff
      
      // 同じ信頼度なら正答率の低い順
      return a.accuracy - b.accuracy
    }).slice(0, 10) // 上位10件まで
  } catch (error) {
    console.error('Error getting weakness analysis:', error)
    return []
  }
}

// ========== 学習効率分析 ==========

export async function getEfficiencyAnalysis(
  userId: string, 
  dateRange: string
): Promise<EfficiencyAnalysisData> {
  try {
    const endDate = new Date()
    const startDate = subDays(endDate, dateRange === 'week' ? 7 : 30)
    
    const sessions = await getTimerSessionsInRange(userId, startDate, endDate)
    
    // データ品質の判定
    const dataQuality = getDataQualityLevel(sessions.length, dateRange)
    
    // データが不足している場合のデフォルト値
    if (sessions.length === 0) {
      return generateDefaultEfficiencyData(dataQuality)
    }

    // 時間帯別分析
    const hourlyFocus = calculateHourlyEfficiency(sessions)
    
    // 科目別効率
    const subjectEfficiency = calculateSubjectEfficiency(sessions)
    
    // 休憩パターン分析
    const breakPatterns = analyzeBreakPatterns(sessions)
    
    // ポモドーロ法との比較
    const pomodoroComparison = compareToPomodoroTechnique(sessions)
    
    // 週間パターン
    const weeklyPatterns = analyzeWeeklyPatterns(sessions)

    return {
      hourlyFocus,
      subjectEfficiency,
      breakPatterns,
      pomodoroComparison,
      weeklyPatterns,
      dataQuality
    }
  } catch (error) {
    console.error('Error getting efficiency analysis:', error)
    return generateDefaultEfficiencyData('insufficient')
  }
}

// ========== 成績予測 ==========

export async function getPerformancePrediction(userId: string): Promise<PerformancePredictionData> {
  try {
    // 模試結果を取得
    const mockExamQuery = query(
      collection(db, 'users', userId, 'mockExamResults'),
      orderBy('examDate', 'desc'),
      limit(10)
    )
    const mockExamSnapshot = await getDocs(mockExamQuery)
    const examResults = mockExamSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MockExamResult))
    
    // データ信頼性の判定
    const reliability = getReliabilityLevel(examResults.length)
    
    if (examResults.length === 0) {
      return generateDefaultPrediction(reliability)
    }
    
    // 学習時間データの取得
    const historicalData = await analyzeHistoricalCorrelation(userId, examResults)
    
    // 予測計算
    const prediction = calculatePrediction(historicalData, examResults)
    
    // 科目別予測
    const subjectPredictions = calculateSubjectPredictions(examResults[0])
    
    // シナリオ分析
    const scenarioAnalysis = generateScenarioAnalysis(prediction, examResults[0].deviation)
    
    return {
      currentScore: examResults[0].deviation,
      predictedScore: prediction.predicted,
      confidenceInterval: prediction.interval,
      targetScore: 65, // デフォルト目標
      requiredStudyHours: prediction.requiredHours,
      subjectPredictions,
      historicalData,
      scenarioAnalysis,
      reliability
    }
  } catch (error) {
    console.error('Error getting performance prediction:', error)
    return generateDefaultPrediction('low')
  }
}

// ========== ヘルパー関数 ==========

function generateEmptyWeeklyTrend(): Array<{ date: string; hours: number }> {
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']
  const trend = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i)
    trend.push({
      date: weekdays[date.getDay()],
      hours: 0
    })
  }
  
  return trend
}

function calculateWeeklyTrend(
  sessions: TimerSession[], 
  baseDate: Date
): Array<{ date: string; hours: number }> {
  const weekdays = ['日', '月', '火', '水', '木', '金', '土']
  const trend = []
  
  for (let i = 6; i >= 0; i--) {
    const date = subDays(baseDate, i)
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)
    
    const daySessions = sessions.filter(s => {
      const sessionDate = s.startTime instanceof Timestamp ? s.startTime.toDate() : s.startTime
      return sessionDate >= dayStart && sessionDate <= dayEnd
    })
    
    const hours = daySessions.reduce((sum, s) => sum + s.elapsedSeconds, 0) / 3600
    
    trend.push({
      date: weekdays[date.getDay()],
      hours: Math.round(hours * 10) / 10 // 小数点1位まで
    })
  }
  
  return trend
}

function calculateSubjectDistribution(sessions: TimerSession[]): Array<{
  subject: string
  time: number
  percentage: number
}> {
  const subjectTime = new Map<string, number>()
  
  sessions.forEach(session => {
    const current = subjectTime.get(session.subjectId) || 0
    subjectTime.set(session.subjectId, current + session.elapsedSeconds)
  })
  
  const totalTime = Array.from(subjectTime.values()).reduce((a, b) => a + b, 0)
  
  return Array.from(subjectTime.entries())
    .map(([subject, time]) => ({
      subject,
      time: time / 3600, // 時間に変換
      percentage: totalTime > 0 ? (time / totalTime) * 100 : 0
    }))
    .sort((a, b) => b.time - a.time)
}

function getConfidenceLevel(
  totalQuestions: number, 
  sessionCount: number
): 'high' | 'medium' | 'low' {
  if (totalQuestions >= 30 && sessionCount >= 5) return 'high'
  if (totalQuestions >= 10 && sessionCount >= 2) return 'medium'
  return 'low'
}

function getDataQualityLevel(
  sessionCount: number,
  dateRange: string
): 'sufficient' | 'partial' | 'insufficient' {
  const minSessions = dateRange === 'week' ? 7 : 20
  if (sessionCount >= minSessions) return 'sufficient'
  if (sessionCount >= minSessions / 2) return 'partial'
  return 'insufficient'
}

function getReliabilityLevel(examCount: number): 'high' | 'medium' | 'low' {
  if (examCount >= 5) return 'high'
  if (examCount >= 2) return 'medium'
  return 'low'
}

function analyzeIncorrectPatterns(
  sessions: TimerSession[],
  quizResults: QuizResult[],
  subject: string,
  unit: string
): string[] {
  const patterns: string[] = []
  
  // セッションベースの分析
  const unitSessions = sessions.filter(s => 
    s.subjectId === subject && s.unitId === unit
  )
  
  if (unitSessions.length > 0) {
    const avgDuration = unitSessions.reduce((sum, s) => sum + s.elapsedSeconds, 0) / unitSessions.length / 60
    
    if (avgDuration < 15) {
      patterns.push('学習時間が短い傾向')
    }
    
    const avgBreaks = unitSessions.reduce((sum, s) => sum + (s.breaks || 0), 0) / unitSessions.length
    if (avgBreaks > 3) {
      patterns.push('集中力の維持が困難')
    }
  }
  
  // クイズ結果ベースの分析
  const unitQuizResults = quizResults.filter(q => 
    q.subject === subject && q.unit === unit && !q.isCorrect
  )
  
  if (unitQuizResults.length > 3) {
    patterns.push('反復練習が必要')
  }
  
  return patterns
}

function calculateImprovementTrend(
  quizResults: QuizResult[],
  subject: string,
  unit: string
): number[] {
  const unitResults = quizResults
    .filter(q => q.subject === subject && q.unit === unit)
    .sort((a, b) => {
      const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : new Date(a.createdAt).getTime()
      const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : new Date(b.createdAt).getTime()
      return aTime - bTime
    })
  
  if (unitResults.length < 2) return []
  
  // 最新5回分の正答率を計算
  const recentResults = unitResults.slice(-5)
  return recentResults.map((_, index) => {
    const windowResults = recentResults.slice(0, index + 1)
    const correct = windowResults.filter(r => r.isCorrect).length
    return (correct / windowResults.length) * 100
  })
}

function analyzePrerequisiteGaps(
  sessions: TimerSession[],
  subject: string,
  unit: string
): string[] {
  const gaps: string[] = []
  
  // フィードバックから課題を抽出
  sessions.forEach(session => {
    if (session.feedback && session.feedback.struggles) {
      gaps.push(...session.feedback.struggles)
    }
  })
  
  // 頻出する課題を返す
  const gapCounts = new Map<string, number>()
  gaps.forEach(gap => {
    gapCounts.set(gap, (gapCounts.get(gap) || 0) + 1)
  })
  
  return Array.from(gapCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([gap]) => gap)
}

function calculateHourlyEfficiency(sessions: TimerSession[]): Array<{
  hour: number
  focusScore: number
  studyTime: number
}> {
  const hourlyData = new Map<number, {
    totalFocus: number
    totalTime: number
    count: number
  }>()
  
  sessions.forEach(session => {
    const hour = session.startTime instanceof Timestamp 
      ? session.startTime.toDate().getHours()
      : new Date(session.startTime).getHours()
    
    const data = hourlyData.get(hour) || { totalFocus: 0, totalTime: 0, count: 0 }
    data.totalFocus += session.focusScore || 75
    data.totalTime += session.elapsedSeconds
    data.count++
    hourlyData.set(hour, data)
  })
  
  return Array.from({ length: 24 }, (_, hour) => {
    const data = hourlyData.get(hour)
    return {
      hour,
      focusScore: data ? Math.round(data.totalFocus / data.count) : 0,
      studyTime: data ? Math.round(data.totalTime / 60) : 0
    }
  })
}

function calculateSubjectEfficiency(sessions: TimerSession[]): Array<{
  subject: string
  efficiency: number
  avgDuration: number
}> {
  const subjectData = new Map<string, {
    totalFocus: number
    totalTime: number
    count: number
  }>()
  
  sessions.forEach(session => {
    const data = subjectData.get(session.subjectId) || { 
      totalFocus: 0, 
      totalTime: 0, 
      count: 0 
    }
    data.totalFocus += session.focusScore || 75
    data.totalTime += session.elapsedSeconds
    data.count++
    subjectData.set(session.subjectId, data)
  })
  
  return Array.from(subjectData.entries())
    .map(([subject, data]) => ({
      subject,
      efficiency: Math.round(data.totalFocus / data.count),
      avgDuration: Math.round(data.totalTime / data.count / 60)
    }))
    .sort((a, b) => b.efficiency - a.efficiency)
}

function analyzeBreakPatterns(sessions: TimerSession[]) {
  const sessionsWithBreaks = sessions.filter(s => s.elapsedSeconds > 900) // 15分以上
  
  if (sessionsWithBreaks.length === 0) {
    return {
      avgBreakInterval: 50,
      optimalBreakDuration: 15,
      currentPattern: 'データ不足'
    }
  }
  
  const intervals = sessionsWithBreaks.map(s => {
    const breaksCount = s.breaks || 0
    return breaksCount > 0 ? s.elapsedSeconds / (breaksCount + 1) / 60 : s.elapsedSeconds / 60
  })
  
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
  
  let pattern = '不規則'
  if (avgInterval >= 45 && avgInterval <= 60) {
    pattern = '理想的'
  } else if (avgInterval < 30) {
    pattern = '頻繁すぎる'
  } else if (avgInterval > 90) {
    pattern = '間隔が長すぎる'
  }
  
  return {
    avgBreakInterval: Math.round(avgInterval),
    optimalBreakDuration: 15,
    currentPattern: pattern
  }
}

function compareToPomodoroTechnique(sessions: TimerSession[]) {
  const avgFocus = sessions.length > 0
    ? sessions.reduce((sum, s) => sum + (s.focusScore || 75), 0) / sessions.length
    : 0
  
  const recommendation = avgFocus < 75
    ? 'ポモドーロ・テクニックの導入を推奨'
    : avgFocus < 85
    ? '現在の方法を改善する余地があります'
    : '現在の学習方法は効果的です'
  
  return {
    userAvgFocus: Math.round(avgFocus),
    pomodoroAvgFocus: 85,
    recommendation
  }
}

function analyzeWeeklyPatterns(sessions: TimerSession[]): Array<{
  day: string
  morning: number
  afternoon: number
  evening: number
}> {
  const dayNames = ['日', '月', '火', '水', '木', '金', '土']
  const patterns = new Map<string, {
    morning: number
    afternoon: number
    evening: number
  }>()
  
  // 初期化
  dayNames.forEach(day => {
    patterns.set(day, { morning: 0, afternoon: 0, evening: 0 })
  })
  
  sessions.forEach(session => {
    const date = session.startTime instanceof Timestamp 
      ? session.startTime.toDate()
      : new Date(session.startTime)
    const dayName = dayNames[date.getDay()]
    const hour = date.getHours()
    const time = session.elapsedSeconds / 60 // 分に変換
    
    const pattern = patterns.get(dayName)!
    if (hour >= 5 && hour < 12) {
      pattern.morning += time
    } else if (hour >= 12 && hour < 18) {
      pattern.afternoon += time
    } else {
      pattern.evening += time
    }
  })
  
  return dayNames.map(day => ({
    day,
    ...patterns.get(day)!
  }))
}

function generateDefaultEfficiencyData(
  dataQuality: 'sufficient' | 'partial' | 'insufficient'
): EfficiencyAnalysisData {
  return {
    hourlyFocus: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      focusScore: 0,
      studyTime: 0
    })),
    subjectEfficiency: [],
    breakPatterns: {
      avgBreakInterval: 50,
      optimalBreakDuration: 15,
      currentPattern: 'データ不足'
    },
    pomodoroComparison: {
      userAvgFocus: 0,
      pomodoroAvgFocus: 85,
      recommendation: 'データが蓄積されると分析が表示されます'
    },
    weeklyPatterns: ['日', '月', '火', '水', '木', '金', '土'].map(day => ({
      day,
      morning: 0,
      afternoon: 0,
      evening: 0
    })),
    dataQuality
  }
}

async function analyzeHistoricalCorrelation(
  userId: string,
  examResults: MockExamResult[]
): Promise<Array<{ date: string; actualScore: number; studyHours: number }>> {
  const historicalData: Array<{ date: string; actualScore: number; studyHours: number }> = []
  
  for (const exam of examResults.slice(0, 6)) {
    const examDate = exam.examDate instanceof Timestamp 
      ? exam.examDate.toDate()
      : new Date()
    const monthStart = startOfMonth(examDate)
    const monthEnd = endOfMonth(examDate)
    
    const sessions = await getTimerSessionsInRange(userId, monthStart, monthEnd)
    const totalHours = sessions.reduce((sum, s) => sum + s.elapsedSeconds, 0) / 3600
    
    historicalData.push({
      date: format(examDate, 'yyyy-MM'),
      actualScore: exam.deviation,
      studyHours: totalHours
    })
  }
  
  return historicalData.sort((a, b) => a.date.localeCompare(b.date))
}

function calculatePrediction(
  historicalData: Array<{ date: string; actualScore: number; studyHours: number }>,
  examResults: MockExamResult[]
): {
  predicted: number
  interval: [number, number]
  requiredHours: number
} {
  if (historicalData.length < 2) {
    const currentScore = examResults[0]?.deviation || 50
    return {
      predicted: currentScore + 2,
      interval: [currentScore, currentScore + 4],
      requiredHours: 200
    }
  }
  
  // 簡単な線形回帰
  const n = historicalData.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  
  historicalData.forEach(data => {
    sumX += data.studyHours
    sumY += data.actualScore
    sumXY += data.studyHours * data.actualScore
    sumX2 += data.studyHours * data.studyHours
  })
  
  const denominator = n * sumX2 - sumX * sumX
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0.05
  const intercept = (sumY - slope * sumX) / n
  
  const avgMonthlyHours = sumX / n
  const predictedScore = Math.max(30, Math.min(80, slope * avgMonthlyHours + intercept))
  
  const confidence = historicalData.length >= 5 ? 2 : 4
  
  return {
    predicted: Math.round(predictedScore),
    interval: [
      Math.round(predictedScore - confidence),
      Math.round(predictedScore + confidence)
    ] as [number, number],
    requiredHours: Math.max(50, Math.round((65 - intercept) / Math.max(0.01, slope)))
  }
}

function calculateSubjectPredictions(latestExam: MockExamResult): Array<{
  subject: string
  current: number
  predicted: number
  potential: number
  recommendedHours: number
}> {
  if (!latestExam || !latestExam.subjectResults) return []
  
  return latestExam.subjectResults.map(result => {
    const improvementPotential = (100 - result.deviation) * 0.2
    const predicted = result.deviation + improvementPotential * 0.3
    const potential = result.deviation + improvementPotential
    
    return {
      subject: result.subject,
      current: result.deviation,
      predicted: Math.round(predicted),
      potential: Math.round(potential),
      recommendedHours: Math.round(50 + (potential - result.deviation) * 5)
    }
  })
}

function generateScenarioAnalysis(
  prediction: { predicted: number },
  currentScore: number
): Array<{
  studyHours: number
  predictedScore: number
  lowerBound: number
  upperBound: number
}> {
  return Array.from({ length: 10 }, (_, i) => {
    const hours = (i + 1) * 50
    const improvement = Math.log(hours / 50) * 5
    const predicted = Math.min(80, currentScore + improvement)
    
    return {
      studyHours: hours,
      predictedScore: Math.round(predicted),
      lowerBound: Math.max(currentScore, Math.round(predicted - 3)),
      upperBound: Math.min(80, Math.round(predicted + 3))
    }
  })
}

function generateDefaultPrediction(reliability: 'high' | 'medium' | 'low'): PerformancePredictionData {
  return {
    currentScore: 50,
    predictedScore: 52,
    confidenceInterval: [48, 56],
    targetScore: 65,
    requiredStudyHours: 300,
    subjectPredictions: [],
    historicalData: [],
    scenarioAnalysis: [],
    reliability
  }
}

// ========== リアルタイム監視 ==========

export function subscribeToStudyStats(
  userId: string,
  callback: (stats: StudyTimeStats) => void
): () => void {
  const today = new Date()
  const q = query(
    collection(db, 'timerSessions'),
    where('userId', '==', userId),
    where('startTime', '>=', Timestamp.fromDate(startOfDay(today))),
    where('startTime', '<=', Timestamp.fromDate(endOfDay(today)))
  )
  
  return onSnapshot(q, async (snapshot) => {
    const stats = await getStudyTimeStats(userId, 'today')
    callback(stats)
  })
}

// ========== 弱点科目の取得 ==========

export async function getWeakSubjects(userId: string): Promise<Array<{subject: string, accuracy: number}>> {
  try {
    const weaknessData = await getWeaknessAnalysis(userId)
    
    if (weaknessData.length > 0) {
      // 弱点データから科目別に集計
      const subjectMap = new Map<string, { totalAccuracy: number; count: number }>()
      
      weaknessData.forEach(w => {
        const current = subjectMap.get(w.subject) || { totalAccuracy: 0, count: 0 }
        subjectMap.set(w.subject, {
          totalAccuracy: current.totalAccuracy + w.accuracy,
          count: current.count + 1
        })
      })
      
      // 平均正答率を計算
      return Array.from(subjectMap.entries())
        .map(([subject, data]) => ({
          subject,
          accuracy: data.totalAccuracy / data.count
        }))
        .filter(item => item.accuracy < 70)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3)
    }
    
    // 模試結果から取得を試みる
    const mockExamQuery = query(
      collection(db, 'users', userId, 'mockExamResults'),
      orderBy('examDate', 'desc'),
      limit(1)
    )
    const mockExamSnapshot = await getDocs(mockExamQuery)
    
    if (!mockExamSnapshot.empty) {
      const latestExam = mockExamSnapshot.docs[0].data() as MockExamResult
      return latestExam.subjectResults
        .map(result => ({
          subject: result.subject,
          accuracy: result.deviation
        }))
        .filter(item => item.accuracy < 50)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3)
    }
    
    // データがない場合のデフォルト値
    return [
      { subject: '数学', accuracy: 45 },
      { subject: '英語', accuracy: 48 },
      { subject: '物理', accuracy: 50 }
    ]
  } catch (error) {
    console.error('Error getting weak subjects:', error)
    return []
  }
}

// ========== ストリーク計算 ==========

export async function calculateUserStreak(userId: string): Promise<number> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (!userDoc.exists()) return 0
    
    const userData = userDoc.data() as UserProfile
    return userData.studyStats?.currentStreak || 0
  } catch (error) {
    console.error('Error calculating streak:', error)
    return 0
  }
}

// ========== ユーザーレベル判定 ==========

export async function getUserLevel(userId: string): Promise<'beginner' | 'intermediate' | 'advanced'> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (!userDoc.exists()) return 'beginner'
    
    const userData = userDoc.data() as UserProfile
    let score = 0
    
    // 1. 総学習時間
    const totalHours = (userData.studyStats?.totalStudyTime || 0) / 3600
    if (totalHours >= 100) score += 3
    else if (totalHours >= 20) score += 2
    else score += 1
    
    // 2. ストリーク
    const streak = userData.studyStats?.currentStreak || 0
    if (streak >= 30) score += 3
    else if (streak >= 7) score += 2
    else score += 1
    
    // 3. 問題演習統計
    const accuracy = userData.stats?.totalQuestions > 0
      ? (userData.stats.correctAnswers / userData.stats.totalQuestions) * 100
      : 0
    
    if (accuracy >= 80) score += 3
    else if (accuracy >= 60) score += 2
    else score += 1
    
    const avgScore = score / 3
    if (avgScore >= 2.5) return 'advanced'
    if (avgScore >= 1.8) return 'intermediate'
    return 'beginner'
  } catch (error) {
    console.error('Error getting user level:', error)
    return 'beginner'
  }
}