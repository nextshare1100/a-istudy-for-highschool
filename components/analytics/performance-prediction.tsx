'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  Target, 
  Brain, 
  Calculator,
  ChevronRight,
  Info
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  BarChart,
  Bar,
  ComposedChart,
  Scatter
} from 'recharts'
import { cn } from '@/lib/utils'
import { getPerformancePrediction, PerformancePredictionData } from '@/lib/firebase/improved-analytics'

interface Props {
  userId: string
}

export default function PerformancePrediction({ userId }: Props) {
  const [data, setData] = useState<PerformancePredictionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [targetScore, setTargetScore] = useState(70)
  const [weeklyStudyHours, setWeeklyStudyHours] = useState([40])

  useEffect(() => {
    loadPredictionData()
  }, [userId])

  const loadPredictionData = async () => {
    setLoading(true)
    try {
      const predictionData = await getPerformancePrediction(userId)
      setData(predictionData)
      setTargetScore(predictionData.targetScore)
    } catch (error) {
      console.error('Failed to load prediction data:', error)
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
        <p className="text-muted-foreground">予測データがありません。模試結果を登録してください。</p>
      </div>
    )
  }

  const monthsToTarget = Math.ceil(data.requiredStudyHours / (weeklyStudyHours[0] * 4))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  現在の偏差値
                </p>
                <p className="text-2xl font-bold">{data.currentScore}</p>
              </div>
              <Calculator className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  予測偏差値
                </p>
                <p className="text-2xl font-bold">{data.predictedScore}</p>
                <p className="text-xs text-muted-foreground">
                  ±{data.confidenceInterval[1] - data.predictedScore}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  目標達成まで
                </p>
                <p className="text-2xl font-bold">{data.requiredStudyHours}時間</p>
                <p className="text-xs text-muted-foreground">
                  約{monthsToTarget}ヶ月
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  改善可能性
                </p>
                <p className="text-2xl font-bold">
                  {data.predictedScore > data.currentScore ? '高' : '中'}
                </p>
                <p className="text-xs text-muted-foreground">
                  最大+{Math.round((80 - data.currentScore) * 0.3)}点
                </p>
              </div>
              <Brain className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="prediction">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="prediction">成績予測</TabsTrigger>
          <TabsTrigger value="subjects">科目別分析</TabsTrigger>
          <TabsTrigger value="scenarios">シナリオ分析</TabsTrigger>
          <TabsTrigger value="roadmap">学習ロードマップ</TabsTrigger>
        </TabsList>

        <TabsContent value="prediction" className="space-y-6">
          {/* Historical Trend with Prediction */}
          <Card>
            <CardHeader>
              <CardTitle>成績推移と予測</CardTitle>
              <CardDescription>
                過去の実績に基づく将来予測
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.historicalData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart 
                      data={[
                        ...data.historicalData,
                        { date: '予測', actualScore: null, studyHours: weeklyStudyHours[0] * 4, predicted: data.predictedScore }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" domain={[50, 80]} />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="predicted"
                        fill="#8884d8"
                        fillOpacity={0.3}
                        stroke="#8884d8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="予測偏差値"
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="actualScore"
                        stroke="#82ca9d"
                        strokeWidth={3}
                        name="実績偏差値"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="studyHours"
                        fill="#ffc658"
                        opacity={0.6}
                        name="学習時間"
                      />
                      <ReferenceLine 
                        y={targetScore} 
                        stroke="red" 
                        strokeDasharray="3 3"
                        label="目標"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>

                  <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertTitle>予測精度について</AlertTitle>
                    <AlertDescription>
                      この予測は過去{data.historicalData.length}回の模試データと学習時間の相関に基づいています。
                      信頼区間は95%で±{data.confidenceInterval[1] - data.predictedScore}点です。
                    </AlertDescription>
                  </Alert>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">履歴データがありません</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>科目別改善予測</CardTitle>
              <CardDescription>
                各科目の現在値、予測値、潜在能力
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.subjectPredictions.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={data.subjectPredictions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis domain={[50, 80]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="current" fill="#94a3b8" name="現在" />
                      <Bar dataKey="predicted" fill="#3b82f6" name="予測" />
                      <Bar dataKey="potential" fill="#10b981" name="潜在能力" />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-6 space-y-3">
                    {data.subjectPredictions.map((subject, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{subject.subject}</span>
                          <Badge variant={subject.predicted > subject.current ? 'default' : 'secondary'}>
                            +{subject.predicted - subject.current}点見込み
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            推奨学習時間: {subject.recommendedHours}時間
                          </span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">科目別データがありません</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>What-ifシナリオ分析</CardTitle>
              <CardDescription>
                学習時間を変更した場合の成績予測
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <label className="text-sm font-medium">
                  週間学習時間: {weeklyStudyHours[0]}時間
                </label>
                <Slider
                  value={weeklyStudyHours}
                  onValueChange={setWeeklyStudyHours}
                  min={10}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>

              {data.scenarioAnalysis.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={data.scenarioAnalysis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="studyHours" 
                        label={{ value: '週間学習時間', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        domain={[60, 80]}
                        label={{ value: '予測偏差値', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="upperBound"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.3}
                        name="上限"
                      />
                      <Area
                        type="monotone"
                        dataKey="lowerBound"
                        stackId="2"
                        stroke="#8884d8"
                        fill="white"
                        name="下限"
                      />
                      <Line
                        type="monotone"
                        dataKey="predictedScore"
                        stroke="#8884d8"
                        strokeWidth={3}
                        name="予測値"
                      />
                      <ReferenceLine 
                        x={weeklyStudyHours[0]} 
                        stroke="red" 
                        strokeWidth={2}
                        label="現在の設定"
                      />
                      <ReferenceLine 
                        y={targetScore} 
                        stroke="green" 
                        strokeDasharray="3 3"
                        label="目標"
                      />
                    </AreaChart>
                  </ResponsiveContainer>

                  <Alert className="mt-4">
                    <AlertDescription>
                      週{weeklyStudyHours[0]}時間の学習を継続した場合、
                      約{monthsToTarget}ヶ月で目標偏差値{targetScore}に到達する見込みです。
                    </AlertDescription>
                  </Alert>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-muted-foreground">シナリオ分析データがありません</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-6">
          <StudyRoadmap 
            currentScore={data.currentScore}
            targetScore={targetScore}
            requiredHours={data.requiredStudyHours}
            subjects={data.subjectPredictions}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface RoadmapProps {
  currentScore: number
  targetScore: number
  requiredHours: number
  subjects: Array<{
    subject: string
    current: number
    predicted: number
    potential: number
    recommendedHours: number
  }>
}

function StudyRoadmap({ currentScore, targetScore, requiredHours, subjects }: RoadmapProps) {
  const milestones = [
    { month: 1, score: currentScore + 2, focus: '基礎固め', hours: Math.round(requiredHours * 0.3) },
    { month: 2, score: currentScore + 4, focus: '弱点克服', hours: Math.round(requiredHours * 0.6) },
    { month: 3, score: targetScore, focus: '総仕上げ', hours: requiredHours }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>目標達成への学習ロードマップ</CardTitle>
        <CardDescription>
          偏差値{targetScore}達成までの段階的計画
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {milestones.map((milestone, index) => (
          <div key={index} className="relative">
            {index < milestones.length - 1 && (
              <div className="absolute left-6 top-12 h-full w-0.5 bg-border" />
            )}
            <div className="flex gap-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center font-bold",
                index === 0 ? "bg-blue-500 text-white" :
                index === milestones.length - 1 ? "bg-green-500 text-white" :
                "bg-orange-500 text-white"
              )}>
                {milestone.month}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{milestone.month}ヶ月目</h4>
                    <p className="text-sm text-muted-foreground">
                      目標偏差値: {milestone.score} | {milestone.focus}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {milestone.hours}時間
                  </Badge>
                </div>
                <div className="mt-3 p-3 bg-secondary rounded-lg">
                  <p className="text-sm font-medium mb-2">重点科目:</p>
                  <div className="flex flex-wrap gap-2">
                    {subjects
                      .sort((a, b) => (b.potential - b.current) - (a.potential - a.current))
                      .slice(0, 3)
                      .map((subject, i) => (
                        <Badge key={i} variant="secondary">
                          {subject.subject}
                        </Badge>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        <Alert>
          <Brain className="h-4 w-4" />
          <AlertTitle>学習アドバイス</AlertTitle>
          <AlertDescription>
            最初の1ヶ月は基礎固めに集中し、2ヶ月目から応用問題に取り組みましょう。
            毎週の進捗確認を欠かさず行うことが重要です。
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}