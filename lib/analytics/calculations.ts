// lib/analytics/calculations.ts

/**
 * 学習分析のための統計計算ユーティリティ関数群
 */

/**
 * 移動平均を計算
 */
export function calculateMovingAverage(
  data: number[],
  windowSize: number = 7
): number[] {
  if (data.length < windowSize) {
    return data
  }
  
  const result: number[] = []
  for (let i = windowSize - 1; i < data.length; i++) {
    const window = data.slice(i - windowSize + 1, i + 1)
    const average = window.reduce((sum, val) => sum + val, 0) / windowSize
    result.push(average)
  }
  
  return result
}

/**
 * 標準偏差を計算
 */
export function calculateStandardDeviation(data: number[]): number {
  if (data.length === 0) return 0
  
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length
  const squaredDifferences = data.map(val => Math.pow(val - mean, 2))
  const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / data.length
  
  return Math.sqrt(variance)
}

/**
 * 偏差値を計算
 */
export function calculateDeviation(
  score: number,
  mean: number,
  standardDeviation: number
): number {
  if (standardDeviation === 0) return 50
  
  return 50 + (10 * (score - mean)) / standardDeviation
}

/**
 * パーセンタイルを計算
 */
export function calculatePercentile(
  data: number[],
  value: number
): number {
  if (data.length === 0) return 0
  
  const sorted = [...data].sort((a, b) => a - b)
  const index = sorted.findIndex(v => v >= value)
  
  if (index === -1) return 100
  if (index === 0) return 0
  
  return (index / data.length) * 100
}

/**
 * 成長率を計算
 */
export function calculateGrowthRate(
  oldValue: number,
  newValue: number
): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0
  
  return ((newValue - oldValue) / oldValue) * 100
}

/**
 * 学習効率スコアを計算
 */
export function calculateEfficiencyScore(
  correctAnswers: number,
  totalQuestions: number,
  timeSpentMinutes: number
): number {
  if (totalQuestions === 0 || timeSpentMinutes === 0) return 0
  
  const accuracy = correctAnswers / totalQuestions
  const questionsPerMinute = totalQuestions / timeSpentMinutes
  
  // 正答率と解答速度を組み合わせたスコア
  return accuracy * questionsPerMinute * 100
}

/**
 * トレンドを分析（上昇/下降/横ばい）
 */
export function analyzeTrend(
  data: number[],
  threshold: number = 0.05
): 'increasing' | 'decreasing' | 'stable' {
  if (data.length < 2) return 'stable'
  
  // 線形回帰で傾きを計算
  const n = data.length
  const xSum = (n * (n - 1)) / 2
  const xSquaredSum = (n * (n - 1) * (2 * n - 1)) / 6
  const ySum = data.reduce((sum, val) => sum + val, 0)
  const xySum = data.reduce((sum, val, index) => sum + val * index, 0)
  
  const slope = (n * xySum - xSum * ySum) / (n * xSquaredSum - xSum * xSum)
  const averageY = ySum / n
  const normalizedSlope = slope / averageY
  
  if (normalizedSlope > threshold) return 'increasing'
  if (normalizedSlope < -threshold) return 'decreasing'
  return 'stable'
}

/**
 * 週間統計を計算
 */
export function calculateWeeklyStats(
  dailyData: Array<{ date: Date; value: number }>
): Array<{ week: string; average: number; total: number; count: number }> {
  const weeklyStats = new Map<string, { total: number; count: number }>()
  
  dailyData.forEach(({ date, value }) => {
    const weekStart = getWeekStart(date)
    const weekKey = weekStart.toISOString().split('T')[0]
    
    if (!weeklyStats.has(weekKey)) {
      weeklyStats.set(weekKey, { total: 0, count: 0 })
    }
    
    const stats = weeklyStats.get(weekKey)!
    stats.total += value
    stats.count++
  })
  
  return Array.from(weeklyStats.entries()).map(([week, stats]) => ({
    week,
    average: stats.total / stats.count,
    total: stats.total,
    count: stats.count
  }))
}

/**
 * 週の開始日を取得（月曜日）
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

/**
 * 目標達成予測
 */
export function predictGoalAchievement(
  currentValue: number,
  targetValue: number,
  historicalData: Array<{ date: Date; value: number }>,
  targetDate: Date
): {
  willAchieve: boolean
  predictedValue: number
  confidence: number
  daysRemaining: number
} {
  const now = new Date()
  const daysRemaining = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  
  if (historicalData.length < 3) {
    // データ不足の場合
    return {
      willAchieve: currentValue >= targetValue,
      predictedValue: currentValue,
      confidence: 0,
      daysRemaining
    }
  }
  
  // 過去のデータから成長率を計算
  const values = historicalData.map(d => d.value)
  const trend = analyzeTrend(values)
  const growthRate = calculateAverageGrowthRate(values)
  
  // 予測値を計算
  const predictedValue = currentValue * Math.pow(1 + growthRate / 100, daysRemaining / 30)
  const willAchieve = predictedValue >= targetValue
  
  // 信頼度を計算（データの安定性に基づく）
  const stdDev = calculateStandardDeviation(values)
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const cv = mean > 0 ? stdDev / mean : 1 // 変動係数
  const confidence = Math.max(0, Math.min(100, (1 - cv) * 100))
  
  return {
    willAchieve,
    predictedValue: Math.round(predictedValue * 10) / 10,
    confidence: Math.round(confidence),
    daysRemaining
  }
}

/**
 * 平均成長率を計算
 */
function calculateAverageGrowthRate(values: number[]): number {
  if (values.length < 2) return 0
  
  const growthRates: number[] = []
  for (let i = 1; i < values.length; i++) {
    const rate = calculateGrowthRate(values[i - 1], values[i])
    growthRates.push(rate)
  }
  
  return growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length
}

/**
 * 学習パターンを分析
 */
export function analyzeStudyPatterns(
  sessions: Array<{
    timestamp: Date
    duration: number
    efficiency: number
  }>
): {
  preferredTimes: Array<{ hour: number; frequency: number }>
  averageSessionLength: number
  consistency: number
  bestPerformanceTime: number
} {
  if (sessions.length === 0) {
    return {
      preferredTimes: [],
      averageSessionLength: 0,
      consistency: 0,
      bestPerformanceTime: 20
    }
  }
  
  // 時間帯別の頻度
  const hourFrequency = new Map<number, number>()
  const hourEfficiency = new Map<number, { total: number; count: number }>()
  
  sessions.forEach(session => {
    const hour = session.timestamp.getHours()
    hourFrequency.set(hour, (hourFrequency.get(hour) || 0) + 1)
    
    if (!hourEfficiency.has(hour)) {
      hourEfficiency.set(hour, { total: 0, count: 0 })
    }
    const efficiency = hourEfficiency.get(hour)!
    efficiency.total += session.efficiency
    efficiency.count++
  })
  
  // 好みの時間帯
  const preferredTimes = Array.from(hourFrequency.entries())
    .map(([hour, frequency]) => ({ hour, frequency }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 3)
  
  // 平均セッション長
  const averageSessionLength = sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length
  
  // 一貫性（日々の学習時間のばらつき）
  const dailyDurations = aggregateDailyDurations(sessions)
  const consistency = calculateConsistency(dailyDurations)
  
  // 最高パフォーマンス時間
  let bestPerformanceTime = 20
  let maxEfficiency = 0
  
  hourEfficiency.forEach((data, hour) => {
    const avgEfficiency = data.total / data.count
    if (avgEfficiency > maxEfficiency) {
      maxEfficiency = avgEfficiency
      bestPerformanceTime = hour
    }
  })
  
  return {
    preferredTimes,
    averageSessionLength: Math.round(averageSessionLength),
    consistency: Math.round(consistency),
    bestPerformanceTime
  }
}

/**
 * 日別の学習時間を集計
 */
function aggregateDailyDurations(
  sessions: Array<{ timestamp: Date; duration: number }>
): number[] {
  const dailyMap = new Map<string, number>()
  
  sessions.forEach(session => {
    const dateKey = session.timestamp.toDateString()
    dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + session.duration)
  })
  
  return Array.from(dailyMap.values())
}

/**
 * 一貫性スコアを計算（0-100）
 */
function calculateConsistency(values: number[]): number {
  if (values.length < 2) return 100
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const stdDev = calculateStandardDeviation(values)
  
  // 変動係数の逆数をスコアに変換
  const cv = mean > 0 ? stdDev / mean : 1
  return Math.max(0, Math.min(100, (1 - cv) * 100))
}
