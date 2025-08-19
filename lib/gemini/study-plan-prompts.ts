import React, { useState } from 'react'
import { Sparkles, Calendar, Target, Clock, BookOpen, TrendingUp, AlertCircle } from 'lucide-react'

interface University {
  id: string
  name: string
  requiredScore: number // 偏差値
  faculties?: string[]
}

interface Subject {
  name: string
  currentScore: number
  targetScore: number
  importance: 'high' | 'medium' | 'low'
}

export default function AIStudyPlanGenerator() {
  const [targetUniversities, setTargetUniversities] = useState<University[]>([])
  const [targetDate, setTargetDate] = useState('')
  const [targetScore, setTargetScore] = useState(65) // 目標偏差値
  const [currentScore, setCurrentScore] = useState(50) // 現在の偏差値
  const [subjects, setSubjects] = useState<Subject[]>([
    { name: '英語', currentScore: 48, targetScore: 65, importance: 'high' },
    { name: '数学', currentScore: 52, targetScore: 68, importance: 'high' },
    { name: '国語', currentScore: 50, targetScore: 63, importance: 'medium' }
  ])
  const [studyHoursPerDay, setStudyHoursPerDay] = useState(4)
  const [weakPoints, setWeakPoints] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<any>(null)

  // 人気大学リスト
  const popularUniversities: University[] = [
    { id: '1', name: '東京大学', requiredScore: 75 },
    { id: '2', name: '京都大学', requiredScore: 72 },
    { id: '3', name: '早稲田大学', requiredScore: 68 },
    { id: '4', name: '慶應義塾大学', requiredScore: 69 },
    { id: '5', name: 'MARCH', requiredScore: 60 },
    { id: '6', name: '関関同立', requiredScore: 58 }
  ]

  const calculateAdjustedDeadline = (date: string) => {
    const target = new Date(date)
    const today = new Date()
    const totalDays = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const adjustedDays = Math.floor(totalDays * 0.9) // 90%の期間で達成
    const adjustedDate = new Date(today.getTime() + adjustedDays * 24 * 60 * 60 * 1000)
    return adjustedDate.toISOString().split('T')[0]
  }

  const handleGeneratePlan = async () => {
    setIsGenerating(true)
    
    // 実際の実装では、ここでAPIを呼び出します
    setTimeout(() => {
      const mockPlan = generateMockStudyPlan()
      setGeneratedPlan(mockPlan)
      setIsGenerating(false)
    }, 2000)
  }

  const generateMockStudyPlan = () => {
    const adjustedDeadline = calculateAdjustedDeadline(targetDate)
    const today = new Date()
    const deadline = new Date(adjustedDeadline)
    const totalWeeks = Math.floor((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7))
    
    return {
      summary: {
        totalWeeks,
        targetAchievementWeek: totalWeeks,
        bufferWeeks: Math.floor(totalWeeks * 0.1),
        totalStudyHours: totalWeeks * studyHoursPerDay * 7,
        adjustedDeadline
      },
      phases: [
        {
          name: '基礎固め期',
          weeks: Math.floor(totalWeeks * 0.3),
          description: '全科目の基礎を徹底的に固める',
          goals: ['基礎問題90%正答率', '弱点分野の特定'],
          subjects: subjects.map(s => ({
            name: s.name,
            weeklyHours: Math.floor(studyHoursPerDay * 7 * 0.35),
            focus: '基礎概念の理解と定着',
            materials: ['基礎問題集', '教科書の完全理解']
          }))
        },
        {
          name: '実力養成期',
          weeks: Math.floor(totalWeeks * 0.4),
          description: '標準〜応用レベルの問題演習',
          goals: ['模試で目標偏差値-5以内', '応用問題への対応力'],
          subjects: subjects.map(s => ({
            name: s.name,
            weeklyHours: Math.floor(studyHoursPerDay * 7 * 0.4),
            focus: '標準問題の習熟と応用力養成',
            materials: ['標準問題集', '過去問演習']
          }))
        },
        {
          name: '仕上げ期',
          weeks: Math.floor(totalWeeks * 0.2),
          description: '目標レベル到達と安定化',
          goals: ['目標偏差値達成', '得点の安定化'],
          subjects: subjects.map(s => ({
            name: s.name,
            weeklyHours: Math.floor(studyHoursPerDay * 7 * 0.3),
            focus: '実戦演習と弱点補強',
            materials: ['過去問', '予想問題集']
          }))
        },
        {
          name: '維持・調整期',
          weeks: Math.floor(totalWeeks * 0.1),
          description: '実力維持と最終調整',
          goals: ['コンディション調整', '実力の維持'],
          subjects: subjects.map(s => ({
            name: s.name,
            weeklyHours: Math.floor(studyHoursPerDay * 7 * 0.2),
            focus: '総復習と体調管理',
            materials: ['要点整理', '間違いノート']
          }))
        }
      ],
      weeklyTemplate: {
        monday: { hours: studyHoursPerDay, subjects: ['数学', '英語'] },
        tuesday: { hours: studyHoursPerDay, subjects: ['国語', '英語'] },
        wednesday: { hours: studyHoursPerDay, subjects: ['数学', '理科'] },
        thursday: { hours: studyHoursPerDay, subjects: ['英語', '社会'] },
        friday: { hours: studyHoursPerDay, subjects: ['数学', '国語'] },
        saturday: { hours: studyHoursPerDay + 2, subjects: ['弱点補強', '模試演習'] },
        sunday: { hours: studyHoursPerDay + 1, subjects: ['週の復習', '次週準備'] }
      },
      milestones: [
        {
          week: Math.floor(totalWeeks * 0.25),
          target: '基礎完成度チェック',
          metric: '基礎問題正答率85%以上'
        },
        {
          week: Math.floor(totalWeeks * 0.5),
          target: '中間目標達成',
          metric: `偏差値${currentScore + (targetScore - currentScore) * 0.5}以上`
        },
        {
          week: Math.floor(totalWeeks * 0.75),
          target: '応用力完成',
          metric: `偏差値${targetScore - 3}以上で安定`
        },
        {
          week: Math.floor(totalWeeks * 0.9),
          target: '目標達成',
          metric: `偏差値${targetScore}以上を2回連続`
        }
      ]
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-purple-500" />
          AI学習計画生成
        </h1>
        <p className="text-gray-600">
          目標を10%前倒しで達成する、余裕のある学習計画を作成します
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {/* 目標設定 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            目標設定
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">目標達成時期</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                min={new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]}
                className="w-full p-2 border rounded-lg"
              />
              {targetDate && (
                <p className="text-xs text-gray-500 mt-1">
                  実質目標: {calculateAdjustedDeadline(targetDate)} (90%地点)
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                目標偏差値: {targetScore}
              </label>
              <input
                type="range"
                min="40"
                max="80"
                value={targetScore}
                onChange={(e) => setTargetScore(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>40</span>
                <span>60</span>
                <span>80</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">志望校（複数選択可）</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {popularUniversities.map(uni => (
                <button
                  key={uni.id}
                  onClick={() => {
                    if (targetUniversities.find(u => u.id === uni.id)) {
                      setTargetUniversities(targetUniversities.filter(u => u.id !== uni.id))
                    } else {
                      setTargetUniversities([...targetUniversities, uni])
                    }
                  }}
                  className={`p-2 text-sm rounded-lg border transition-colors ${
                    targetUniversities.find(u => u.id === uni.id)
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {uni.name}
                  <span className="text-xs block">偏差値 {uni.requiredScore}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 現在の学力 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            現在の学力
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              現在の偏差値: {currentScore}
            </label>
            <input
              type="range"
              min="30"
              max="70"
              value={currentScore}
              onChange={(e) => setCurrentScore(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            {subjects.map((subject, index) => (
              <div key={subject.name} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{subject.name}</h3>
                  <select
                    value={subject.importance}
                    onChange={(e) => {
                      const updated = [...subjects]
                      updated[index].importance = e.target.value as any
                      setSubjects(updated)
                    }}
                    className="text-sm p-1 border rounded"
                  >
                    <option value="high">重要</option>
                    <option value="medium">普通</option>
                    <option value="low">低</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <label className="text-gray-600">現在: {subject.currentScore}</label>
                    <input
                      type="range"
                      min="30"
                      max="70"
                      value={subject.currentScore}
                      onChange={(e) => {
                        const updated = [...subjects]
                        updated[index].currentScore = Number(e.target.value)
                        setSubjects(updated)
                      }}
                      className="w-full h-1"
                    />
                  </div>
                  <div>
                    <label className="text-gray-600">目標: {subject.targetScore}</label>
                    <input
                      type="range"
                      min="40"
                      max="80"
                      value={subject.targetScore}
                      onChange={(e) => {
                        const updated = [...subjects]
                        updated[index].targetScore = Number(e.target.value)
                        setSubjects(updated)
                      }}
                      className="w-full h-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 学習時間 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            学習時間設定
          </h2>
          
          <label className="block text-sm font-medium mb-2">
            1日の学習可能時間: {studyHoursPerDay}時間
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={studyHoursPerDay}
            onChange={(e) => setStudyHoursPerDay(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-sm text-gray-600 mt-2">
            実際の計画では{(studyHoursPerDay * 0.9).toFixed(1)}時間で計算（余裕を持たせるため）
          </p>
        </div>
      </div>

      {/* 生成ボタン */}
      <div className="text-center mb-8">
        <button
          onClick={handleGeneratePlan}
          disabled={!targetDate || targetUniversities.length === 0 || isGenerating}
          className={`px-8 py-4 rounded-lg font-semibold text-white inline-flex items-center gap-2 transition-all ${
            !targetDate || targetUniversities.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
          }`}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              学習計画を生成
            </>
          )}
        </button>
        
        {(!targetDate || targetUniversities.length === 0) && (
          <p className="text-sm text-yellow-600 mt-2 flex items-center justify-center gap-1">
            <AlertCircle className="h-4 w-4" />
            目標時期と志望校を設定してください
          </p>
        )}
      </div>

      {/* 生成された計画 */}
      {generatedPlan && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            生成された学習計画
          </h2>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">計画サマリー</h3>
            <div className="grid md:grid-cols-3 gap-2 text-sm">
              <div>
                <span className="text-gray-600">総期間:</span>
                <span className="font-medium ml-1">{generatedPlan.summary.totalWeeks}週間</span>
              </div>
              <div>
                <span className="text-gray-600">目標達成予定:</span>
                <span className="font-medium ml-1">{generatedPlan.summary.adjustedDeadline}</span>
              </div>
              <div>
                <span className="text-gray-600">総学習時間:</span>
                <span className="font-medium ml-1">{generatedPlan.summary.totalStudyHours}時間</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {generatedPlan.phases.map((phase: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{phase.name}</h3>
                  <span className="text-sm text-gray-600">{phase.weeks}週間</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{phase.description}</p>
                <div className="text-sm">
                  <span className="font-medium">目標:</span>
                  <ul className="list-disc list-inside text-gray-600">
                    {phase.goals.map((goal: string, i: number) => (
                      <li key={i}>{goal}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-3">マイルストーン</h3>
            <div className="space-y-2">
              {generatedPlan.milestones.map((milestone: any, index: number) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <span className="text-sm">
                    第{milestone.week}週: {milestone.target} - {milestone.metric}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}