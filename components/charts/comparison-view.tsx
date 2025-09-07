'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Award,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line
} from 'recharts'
import { cn } from '@/lib/utils'
import { getComparisonData, ComparisonData } from '@/lib/firebase/improved-analytics'

interface Props {
  userId?: string
  dateRange?: string
}

export default function ComparisonView({ userId = '', dateRange = 'week' }: Props) {
  const [data, setData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [comparisonType, setComparisonType] = useState<'average' | 'period' | 'target'>('average')

  useEffect(() => {
    if (userId) {
      loadComparisonData()
    }
  }, [userId, dateRange])

  const loadComparisonData = async () => {
    setLoading(true)
    try {
      const comparisonData = await getComparisonData(userId, dateRange)
      setData(comparisonData)
    } catch (error) {
      console.error('Failed to load comparison data:', error)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">比較データの読み込みに失敗しました</p>
      </div>
    )
  }

  const radarData = data.myStats.subjects.map((subject, index) => ({
    subject: subject.name,
    自分: subject.score,
    平均: data.averageStats.subjects[index]?.score || 0
  }))

  return (
    <div className="space-y-6">
      {/* Ranking Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold">全体ランキング</h3>
                {data.rankingData.trend === 'up' && (
                  <Badge variant="default" className="bg-green-500">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    上昇中
                  </Badge>
                )}
                {data.rankingData.trend === 'down' && (
                  <Badge variant="default" className="bg-red-500">
                    <ArrowDown className="w-3 h-3 mr-1" />
                    下降中
                  </Badge>
                )}
                {data.rankingData.trend === 'stable' && (
                  <Badge variant="secondary">
                    <Minus className="w-3 h-3 mr-1" />
                    安定
                  </Badge>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{data.rankingData.myRank}位</span>
                <span className="text-muted-foreground">/ {data.rankingData.totalUsers}人中</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                上位{100 - data.rankingData.percentile}%
              </p>
            </div>
            <Award className="w-12 h-12 text-yellow-500" />
          </div>
          <Progress value={data.rankingData.percentile} className="mt-4" />
        </CardContent>
      </Card>

      {/* Comparison Tabs */}
      <Tabs value={comparisonType} onValueChange={(v) => setComparisonType(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="average">平均との比較</TabsTrigger>
          <TabsTrigger value="period">期間比較</TabsTrigger>
          <TabsTrigger value="target">目標比較</TabsTrigger>
        </TabsList>

        <TabsContent value="average" className="space-y-6">
          {/* Stats Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ComparisonCard
              title="学習時間"
              myValue={data.myStats.studyTime}
              compareValue={data.averageStats.studyTime}
              unit="時間/月"
              format="time"
            />
            <ComparisonCard
              title="集中度"
              myValue={data.myStats.accuracy}
              compareValue={data.averageStats.accuracy}
              unit="%"
              format="percentage"
            />
            <ComparisonCard
              title="継続率"
              myValue={data.myStats.consistency}
              compareValue={data.averageStats.consistency}
              unit="%"
              format="percentage"
            />
          </div>

          {/* Radar Chart */}
          {radarData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>科目別比較</CardTitle>
                <CardDescription>
                  あなたのスコアと平均スコアの比較
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="自分"
                      dataKey="自分"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="平均"
                      dataKey="平均"
                      stroke="#ef4444"
                      fill="#ef4444"
                      fillOpacity={0.3}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Detailed Comparison */}
          {data.myStats.subjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>詳細比較</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.myStats.subjects.map((subject, index) => {
                    const avgScore = data.averageStats.subjects[index]?.score || 0
                    const diff = subject.score - avgScore
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium w-16">{subject.name}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={subject.score} className="w-32" />
                            <span className="text-sm w-12">{Math.round(subject.score)}点</span>
                          </div>
                        </div>
                        <Badge variant={diff > 0 ? 'default' : diff < 0 ? 'destructive' : 'secondary'}>
                          {diff > 0 ? '+' : ''}{Math.round(diff)}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="period" className="space-y-6">
          {/* Period Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PeriodComparisonCard
              title="学習時間"
              lastValue={data.periodComparison.lastMonth.studyTime}
              currentValue={data.periodComparison.thisMonth.studyTime}
              unit="時間"
            />
            <PeriodComparisonCard
              title="テスト実施数"
              lastValue={data.periodComparison.lastMonth.testsCompleted}
              currentValue={data.periodComparison.thisMonth.testsCompleted}
              unit="回"
            />
            <PeriodComparisonCard
              title="平均スコア"
              lastValue={data.periodComparison.lastMonth.avgScore}
              currentValue={data.periodComparison.thisMonth.avgScore}
              unit="点"
            />
          </div>

          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>月次推移</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={[
                    { month: '先月', ...data.periodComparison.lastMonth },
                    { month: '今月', ...data.periodComparison.thisMonth }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="studyTime"
                    stroke="#3b82f6"
                    name="学習時間"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="avgScore"
                    stroke="#10b981"
                    name="平均スコア"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="target" className="space-y-6">
          {/* Target Progress */}
          <Card>
            <CardHeader>
              <CardTitle>目標達成状況</CardTitle>
              <CardDescription>
                月間学習時間目標: {data.targetComparison.target}時間
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>実績</span>
                    <span className="font-bold">
                      {Math.round(data.targetComparison.actual)} / {data.targetComparison.target}時間
                    </span>
                  </div>
                  <Progress value={data.targetComparison.progress} className="h-3" />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">残り日数</p>
                    <p className="text-2xl font-bold">
                      {Math.max(0, 30 - new Date().getDate())}日
                    </p>
                  </div>
                  <div className="text-center p-4 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">必要な日次時間</p>
                    <p className="text-2xl font-bold">
                      {Math.round((data.targetComparison.target - data.targetComparison.actual) / 
                        Math.max(1, 30 - new Date().getDate()))}時間
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Target Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>週次目標ブレークダウン</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { week: '第1週', target: 75, actual: 80 },
                    { week: '第2週', target: 75, actual: 70 },
                    { week: '第3週', target: 75, actual: Math.round(data.targetComparison.actual - 150) },
                    { week: '第4週', target: 75, actual: 0 }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="target" fill="#cbd5e1" name="目標" />
                  <Bar dataKey="actual" fill="#3b82f6" name="実績" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ComparisonCardProps {
  title: string
  myValue: number
  compareValue: number
  unit: string
  format: 'time' | 'percentage' | 'number'
}

function ComparisonCard({ title, myValue, compareValue, unit, format }: ComparisonCardProps) {
  const diff = myValue - compareValue
  const percentDiff = compareValue > 0 ? ((myValue - compareValue) / compareValue * 100).toFixed(1) : '0'

  return (
    <Card>
      <CardContent className="p-6">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">{title}</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span>あなた</span>
            <span className="font-bold text-lg">
              {Math.round(myValue)}{unit}
            </span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>平均</span>
            <span>{Math.round(compareValue)}{unit}</span>
          </div>
          <div className="pt-2 border-t">
            <Badge variant={diff > 0 ? 'default' : 'destructive'}>
              {diff > 0 ? '+' : ''}{percentDiff}%
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface PeriodComparisonCardProps {
  title: string
  lastValue: number
  currentValue: number
  unit: string
}

function PeriodComparisonCard({ title, lastValue, currentValue, unit }: PeriodComparisonCardProps) {
  const diff = currentValue - lastValue
  const percentDiff = lastValue > 0 ? ((currentValue - lastValue) / lastValue * 100).toFixed(1) : '0'

  return (
    <Card>
      <CardContent className="p-6">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">{title}</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{Math.round(currentValue)}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {diff > 0 ? (
            <ArrowUp className="w-4 h-4 text-green-500" />
          ) : diff < 0 ? (
            <ArrowDown className="w-4 h-4 text-red-500" />
          ) : (
            <Minus className="w-4 h-4 text-gray-500" />
          )}
          <span className={cn(
            "text-sm font-medium",
            diff > 0 ? "text-green-500" : diff < 0 ? "text-red-500" : "text-gray-500"
          )}>
            {diff > 0 ? '+' : ''}{percentDiff}% vs 先月
          </span>
        </div>
      </CardContent>
    </Card>
  )
}