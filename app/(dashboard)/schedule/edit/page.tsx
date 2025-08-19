'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Loader2, Calendar, Target, School, User, Sparkles, Download, Save } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import GoalSetting from '@/components/schedule/goal-setting'
import AspirationSelector from '@/components/schedule/aspiration-selector'

interface StepConfig {
  id: string
  title: string
  description: string
  icon: React.ReactNode
}

interface GeneratedSchedule {
  id: string
  name: string
  monthlyPlans: {
    month: number
    subjects: {
      name: string
      hours: number
      topics: string[]
    }[]
    totalHours: number
  }[]
  dailyAverage: number
  weekendHours: number
  adjustmentStrategy: string
}

const steps: StepConfig[] = [
  {
    id: 'goal',
    title: '目標設定',
    description: '試験日と目標スコアを設定します',
    icon: <Target className="h-5 w-5" />
  },
  {
    id: 'current',
    title: '現在の実力確認',
    description: '各科目の現在のレベルを確認します',
    icon: <User className="h-5 w-5" />
  },
  {
    id: 'aspiration',
    title: '志望校選択',
    description: '目指す大学・学部を選択します',
    icon: <School className="h-5 w-5" />
  },
  {
    id: 'schedule',
    title: '個人予定入力',
    description: '学習に影響する予定を登録します',
    icon: <Calendar className="h-5 w-5" />
  },
  {
    id: 'generate',
    title: 'AI生成確認',
    description: '最適な学習計画を生成します',
    icon: <Sparkles className="h-5 w-5" />
  }
]

export default function ScheduleEditPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedSchedules, setGeneratedSchedules] = useState<GeneratedSchedule[]>([])
  const [selectedSchedule, setSelectedSchedule] = useState<string>('')

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    // AIスケジュール生成のシミュレーション
    setTimeout(() => {
      setGeneratedSchedules([
        {
          id: '1',
          name: 'バランス重視プラン',
          monthlyPlans: [
            {
              month: 7,
              subjects: [
                { name: '数学', hours: 40, topics: ['微分積分', 'ベクトル'] },
                { name: '英語', hours: 35, topics: ['長文読解', '文法'] },
                { name: '物理', hours: 30, topics: ['力学', '電磁気'] },
                { name: '化学', hours: 25, topics: ['有機化学'] }
              ],
              totalHours: 130
            }
          ],
          dailyAverage: 4.3,
          weekendHours: 8,
          adjustmentStrategy: '週次レビューで柔軟に調整'
        },
        {
          id: '2',
          name: '弱点克服プラン',
          monthlyPlans: [
            {
              month: 7,
              subjects: [
                { name: '数学', hours: 50, topics: ['微分積分集中'] },
                { name: '英語', hours: 40, topics: ['文法強化'] },
                { name: '物理', hours: 25, topics: ['力学基礎'] },
                { name: '化学', hours: 20, topics: ['理論化学'] }
              ],
              totalHours: 135
            }
          ],
          dailyAverage: 4.5,
          weekendHours: 9,
          adjustmentStrategy: '苦手科目を優先的に学習'
        }
      ])
      setIsGenerating(false)
    }, 3000)
  }

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'goal':
        return <GoalSetting />
      
      case 'current':
        return (
          <Card>
            <CardHeader>
              <CardTitle>現在の実力を確認</CardTitle>
              <CardDescription>最新の模試結果または自己評価を入力してください</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <RadioGroup defaultValue="mock">
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="mock" id="mock" />
                    <Label htmlFor="mock" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">模試結果から自動取得</p>
                        <p className="text-sm text-gray-600">最新の模試データを使用します</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg">
                    <RadioGroupItem value="manual" id="manual" />
                    <Label htmlFor="manual" className="flex-1 cursor-pointer">
                      <div>
                        <p className="font-medium">手動で入力</p>
                        <p className="text-sm text-gray-600">各科目のスコアを直接入力します</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-3">最新の模試結果</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>数学</span>
                      <span className="font-medium">65/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>英語</span>
                      <span className="font-medium">72/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>物理</span>
                      <span className="font-medium">68/100</span>
                    </div>
                    <div className="flex justify-between">
                      <span>化学</span>
                      <span className="font-medium">70/100</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between font-medium">
                      <span>合計</span>
                      <span>275/400</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      
      case 'aspiration':
        return <AspirationSelector />
      
      case 'schedule':
        return (
          <Card>
            <CardHeader>
              <CardTitle>個人予定の確認</CardTitle>
              <CardDescription>すでに登録されている予定と追加したい予定を確認してください</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertDescription>
                  定期テストや部活の大会など、学習時間に影響する予定を正確に登録することで、より実現可能な計画を作成できます。
                </AlertDescription>
              </Alert>
              <div className="text-center py-8 text-gray-500">
                個人予定の入力フォームは目標設定画面で完了しています
              </div>
            </CardContent>
          </Card>
        )
      
      case 'generate':
        return (
          <div className="space-y-6">
            {!isGenerating && generatedSchedules.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>スケジュール生成の準備完了</CardTitle>
                  <CardDescription>
                    入力された情報を基に、AIが最適な学習スケジュールを生成します
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">生成される内容</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• 月別の学習計画</li>
                        <li>• 科目別の時間配分</li>
                        <li>• 重点学習トピック</li>
                        <li>• 調整戦略の提案</li>
                      </ul>
                    </div>
                    <Button 
                      onClick={handleGenerate}
                      className="w-full"
                      size="lg"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      スケジュールを生成
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isGenerating && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                    <div>
                      <p className="font-medium">AIがスケジュールを生成中...</p>
                      <p className="text-sm text-gray-600 mt-1">
                        あなたの目標と現在の実力を分析しています
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isGenerating && generatedSchedules.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">生成されたスケジュール</h3>
                {generatedSchedules.map((schedule) => (
                  <Card 
                    key={schedule.id}
                    className={`cursor-pointer transition-all ${
                      selectedSchedule === schedule.id ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedSchedule(schedule.id)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {schedule.name}
                        {selectedSchedule === schedule.id && (
                          <Check className="h-5 w-5 text-blue-500" />
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">1日平均学習時間</p>
                          <p className="font-medium">{schedule.dailyAverage}時間</p>
                        </div>
                        <div>
                          <p className="text-gray-600">週末学習時間</p>
                          <p className="font-medium">{schedule.weekendHours}時間</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">月間学習配分</p>
                        <div className="space-y-1">
                          {schedule.monthlyPlans[0].subjects.map((subject) => (
                            <div key={subject.name} className="flex items-center justify-between">
                              <span className="text-sm">{subject.name}</span>
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={(subject.hours / schedule.monthlyPlans[0].totalHours) * 100} 
                                  className="w-24 h-2"
                                />
                                <span className="text-xs text-gray-500 w-12 text-right">
                                  {subject.hours}h
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">
                          <strong>調整戦略:</strong> {schedule.adjustmentStrategy}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="flex gap-2 mt-6">
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={!selectedSchedule}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDFでダウンロード
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!selectedSchedule}
                    onClick={() => router.push('/schedule')}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    このプランを保存
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/schedule')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            スケジュールに戻る
          </Button>
          
          <h1 className="text-3xl font-bold">スケジュール作成</h1>
          <p className="text-gray-600 mt-2">
            AIがあなたに最適な学習計画を作成します
          </p>
        </div>

        {/* ステップインジケーター */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center ${
                    index < steps.length - 1 ? 'flex-1' : ''
                  }`}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      index <= currentStep
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {index < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        index < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h3 className="font-semibold">{steps[currentStep].title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {steps[currentStep].description}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* メインコンテンツ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* ナビゲーションボタン */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            前へ
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              次へ
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => router.push('/schedule')}
              disabled={!selectedSchedule && generatedSchedules.length > 0}
            >
              完了
              <Check className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}