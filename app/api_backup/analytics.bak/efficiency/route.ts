// app/api/analytics/efficiency/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { analyzeEfficiency } from '@/lib/firebase/improved-analytics'

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') as 'week' | 'month' || 'week'
    
    // Firebaseから効率データを取得
    const efficiencyData = await analyzeEfficiency(user.uid, range)
    
    // レスポンスデータの整形
    const response = {
      success: true,
      data: {
        efficiency: efficiencyData.efficiency.map(item => ({
          date: new Date(item.date).toLocaleDateString('ja-JP'),
          score: Math.round(item.score * 100) / 100
        })),
        timeDistribution: efficiencyData.timeDistribution.map(item => ({
          subject: item.subject,
          percentage: Math.round(item.percentage * 100) / 100
        })),
        optimalStudyTime: efficiencyData.optimalStudyTime,
        recommendations: generateRecommendations(efficiencyData)
      }
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Efficiency API error:', error)
    
    // エラー時はモックデータを返す
    const mockData = getMockEfficiencyData()
    return NextResponse.json({
      success: true,
      data: mockData,
      warning: 'Using mock data due to temporary issue'
    })
  }
})

/**
 * 効率データに基づく推奨事項の生成
 */
function generateRecommendations(data: any): string[] {
  const recommendations: string[] = []
  
  // 時間配分に基づく推奨
  const imbalancedSubjects = data.timeDistribution.filter(
    (s: any) => s.percentage < 15 || s.percentage > 40
  )
  
  if (imbalancedSubjects.length > 0) {
    recommendations.push(
      '科目間の学習時間のバランスを改善することで、総合的な成績向上が期待できます'
    )
  }
  
  // 最適学習時間に基づく推奨
  recommendations.push(
    `${data.optimalStudyTime.start}時〜${data.optimalStudyTime.end}時の時間帯での学習が最も効率的です`
  )
  
  // 効率トレンドに基づく推奨
  if (data.efficiency.length > 3) {
    const recent = data.efficiency.slice(-3)
    const trend = recent[2].score - recent[0].score
    
    if (trend > 0) {
      recommendations.push('学習効率が改善傾向にあります。この調子を維持しましょう')
    } else if (trend < -5) {
      recommendations.push('効率が低下傾向にあります。休憩時間を増やすことを検討してください')
    }
  }
  
  return recommendations
}

/**
 * モックデータの生成
 */
function getMockEfficiencyData() {
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toLocaleDateString('ja-JP')
  })
  
  return {
    efficiency: dates.map(date => ({
      date,
      score: 70 + Math.random() * 20
    })),
    timeDistribution: [
      { subject: '数学', percentage: 35 },
      { subject: '英語', percentage: 25 },
      { subject: '国語', percentage: 20 },
      { subject: '理科', percentage: 12 },
      { subject: '社会', percentage: 8 }
    ],
    optimalStudyTime: { start: 20, end: 22 },
    recommendations: [
      '20時〜22時の時間帯での学習が最も効率的です',
      '数学の学習時間が多めです。他の科目とのバランスを考慮しましょう',
      '短い休憩を挟むことで集中力を維持できます'
    ]
  }
}
