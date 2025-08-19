'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, 
  Zap, 
  Coffee, 
  Brain,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { cn } from '@/lib/utils'
import { getEfficiencyAnalysis, EfficiencyAnalysisData } from '@/lib/firebase/improved-analytics'

interface Props {
  userId: string
  dateRange: string
}

export default function EfficiencyAnalysis({ userId, dateRange }: Props) {
  const [data, setData] = useState<EfficiencyAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState('time-pattern')

  useEffect(() => {
    loadEfficiencyData()
  }, [userId, dateRange])

  const loadEfficiencyData = async () => {
    setLoading(true)
    try {
      const efficiencyData = await getEfficiencyAnalysis(userId, dateRange)
      setData(efficiencyData)
    } catch (error) {
      console.error('Failed to load efficiency data:', error)
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
        <p className="text-muted-foreground">データの読み込みに失敗しました</p>
      </div>
    )
  }

  const optimalHours = data.hourlyFocus
    .filter(h => h.focusScore > 80)
    .map(h => h.hour)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  平均集中度
                </p>
                <p className="text-2xl font-bold">{Math.round(data.pomodoroComparison.userAvgFocus)}%</p>
              </div>
              <Brain className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  最適学習時間帯
                </p>
                <p className="text-2xl font-bold">
                  {optimalHours.length > 0 
                    ? `${optimalHours[0]}:00-${optimalHours[optimalHours.length - 1]}:00`
                    : '未特定'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  休憩間隔
                </p>
                <p className="text-2xl font-bold">{data.breakPatterns.avgBreakInterval}分</p>
              </div>
              <Coffee className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  効率改善余地
                </p>
                <p className="text-2xl font-bold">
                  +{Math.round((85 - data.pomodoroComparison.userAvgFocus) * 0.5)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedView} onValueChange={setSelectedView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="time-pattern">時間帯分析</TabsTrigger>
          <TabsTrigger value="subject">科目別効率</TabsTrigger>
          <TabsTrigger value="breaks">休憩パターン</TabsTrigger>
          <TabsTrigger value="recommendations">推奨事項</TabsTrigger>
        </TabsList>

        <TabsContent value="time-pattern" className="space-y-6">
          {/* Hourly Focus Chart */}
          <Card>
            <CardHeader>
              <CardTitle>時間帯別集中度</CardTitle>
              <CardDescription>
                24時間の集中度スコアと学習時間
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.hourlyFocus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(hour) => `${hour}時`}
                  />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="focusScore"
                    stroke="#8884d8"
                    name="集中度スコア"
                    strokeWidth={2}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="studyTime"
                    fill="#82ca9d"
                    name="学習時間（分）"
                    opacity={0.6}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Pattern Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle>週間学習パターン</CardTitle>
              <CardDescription>
                曜日×時間帯の学習時間分布
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.weeklyPatterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="morning" stackId="a" fill="#fbbf24" name="朝" />
                  <Bar dataKey="afternoon" stackId="a" fill="#60a5fa" name="昼" />
                  <Bar dataKey="evening" stackId="a" fill="#a78bfa" name="夜" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subject" className="space-y-6">
          {/* Subject Efficiency Radar */}
          <Card>
            <CardHeader>
              <CardTitle>科目別学習効率</CardTitle>
              <CardDescription>
                各科目の効率スコアと平均学習時間
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={data.subjectEfficiency}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="効率スコア"
                    dataKey="efficiency"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>

              <div className="mt-6 space-y-3">
                {data.subjectEfficiency.map((subject, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{subject.subject}</span>
                      <Badge variant={subject.efficiency > 80 ? 'default' : 'secondary'}>
                        効率 {Math.round(subject.efficiency)}%
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      平均 {Math.round(subject.avgDuration)}分/セッション
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breaks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>休憩パターン分析</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">現在の休憩パターン</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>平均学習時間</span>
                      <span className="font-bold">{data.breakPatterns.avgBreakInterval}分</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>平均休憩時間</span>
                      <span className="font-bold">{data.breakPatterns.optimalBreakDuration}分</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>パターン評価</span>
                      <Badge variant="secondary">{data.breakPatterns.currentPattern}</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">ポモドーロ法との比較</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>あなたの集中度</span>
                        <span>{Math.round(data.pomodoroComparison.userAvgFocus)}%</span>
                      </div>
                      <Progress value={data.pomodoroComparison.userAvgFocus} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>ポモドーロ法平均</span>
                        <span>{data.pomodoroComparison.pomodoroAvgFocus}%</span>
                      </div>
                      <Progress value={data.pomodoroComparison.pomodoroAvgFocus} />
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {data.pomodoroComparison.recommendation}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>学習効率改善の推奨事項</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <RecommendationItem
                  icon={Clock}
                  title="最適な学習時間帯を活用"
                  description={
                    optimalHours.length > 0
                      ? `${optimalHours[0]}時-${optimalHours[optimalHours.length - 1]}時が最も集中度が高い時間帯です。重要な科目はこの時間に配置しましょう。`
                      : "まだ十分なデータがありません。学習を続けることで最適な時間帯が分かります。"
                  }
                  impact="high"
                />
                <RecommendationItem
                  icon={Coffee}
                  title="規則的な休憩を導入"
                  description={`現在の休憩間隔は${data.breakPatterns.avgBreakInterval}分です。${
                    data.breakPatterns.currentPattern === '理想的' 
                      ? '理想的なペースを維持しましょう。'
                      : '50分学習→10分休憩のサイクルを試してみてください。'
                  }`}
                  impact="medium"
                />
                <RecommendationItem
                  icon={Zap}
                  title="科目ローテーションの最適化"
                  description="効率の高い科目から始めて、集中力が落ちてきたら軽い科目に切り替えると良いでしょう。"
                  impact="medium"
                />
                <RecommendationItem
                  icon={Brain}
                  title="アクティブラーニングの導入"
                  description="受動的な学習から能動的な学習へ。問題演習の比率を増やしましょう。"
                  impact="high"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface RecommendationItemProps {
  icon: any
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
}

function RecommendationItem({ icon: Icon, title, description, impact }: RecommendationItemProps) {
  const impactColors = {
    high: 'text-green-500 bg-green-50 dark:bg-green-950',
    medium: 'text-blue-500 bg-blue-50 dark:bg-blue-950',
    low: 'text-gray-500 bg-gray-50 dark:bg-gray-950'
  }

  const impactLabels = {
    high: '高効果',
    medium: '中効果',
    low: '低効果'
  }

  return (
    <div className="flex gap-4 p-4 rounded-lg border">
      <div className={cn("p-2 rounded-lg", impactColors[impact])}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium">{title}</h4>
          <Badge variant={impact === 'high' ? 'default' : 'secondary'}>
            {impactLabels[impact]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}