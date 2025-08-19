'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Calendar, Target, Clock, BookOpen, TrendingUp, AlertCircle, Save, CheckCircle } from 'lucide-react'
import { saveStudyPlan, applyPlanToCalendar } from '@/lib/firebase/study-plan'
import { StudyPlan, Phase, PhaseSubject, Milestone, DayOfWeek } from '@/types/study-plan'
import { useAuth } from '@/hooks/use-auth'

// UIコンポーネントの簡易実装
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow ${className}`}>{children}</div>
)

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pb-3 ${className}`}>{children}</div>
)

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-xl font-semibold ${className}`}>{children}</h2>
)

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`}>{children}</p>
)

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-3 ${className}`}>{children}</div>
)

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary',
  className = '' 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean; 
  variant?: 'primary' | 'secondary' | 'success';
  className?: string 
}) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    success: 'bg-green-600 text-white hover:bg-green-700'
  }
  
  // 認証状態のチェック
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">学習計画を作成するにはログインが必要です。</p>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

const Badge = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ${className}`}>
    {children}
  </span>
)

const Progress = ({ value, className = '' }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
      style={{ width: `${value}%` }}
    />
  </div>
)

interface University {
  id: string
  name: string
  requiredScore: number // 偏差値
  faculties?: string[]
}

interface Subject {
  name: string
  category: string
  currentScore: number
  targetScore: number
  importance: 'high' | 'medium' | 'low'
  isSelected: boolean
}

// 共通テスト科目の定義
const commonTestSubjects = {
  国語: {
    required: ['現代文', '古文', '漢文'],
    optional: []
  },
  数学: {
    required: [],
    optional: ['数学IA', '数学IIB', '数学III']
  },
  理科: {
    基礎: ['物理基礎', '化学基礎', '生物基礎', '地学基礎'],
    専門: ['物理', '化学', '生物', '地学']
  },
  社会: {
    required: [],
    optional: ['世界史B', '日本史B', '地理B', '現代社会', '倫理', '政治・経済', '倫理・政経']
  },
  外国語: {
    required: ['英語'],
    optional: ['リスニング']
  }
}

export default function AIStudyPlanGeneratorEnhanced() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const userId = user?.uid || ''
  
  const [targetUniversities, setTargetUniversities] = useState<University[]>([])
  const [targetDate, setTargetDate] = useState('')
  const [targetScore, setTargetScore] = useState(65) // 目標偏差値
  const [currentScore, setCurrentScore] = useState(50) // 現在の偏差値
  const [subjects, setSubjects] = useState<Subject[]>([
    // 国語
    { name: '現代文', category: '国語', currentScore: 50, targetScore: 65, importance: 'high', isSelected: false },
    { name: '古文', category: '国語', currentScore: 48, targetScore: 63, importance: 'medium', isSelected: false },
    { name: '漢文', category: '国語', currentScore: 45, targetScore: 60, importance: 'medium', isSelected: false },
    // 数学
    { name: '数学IA', category: '数学', currentScore: 52, targetScore: 68, importance: 'high', isSelected: false },
    { name: '数学IIB', category: '数学', currentScore: 50, targetScore: 65, importance: 'high', isSelected: false },
    { name: '数学III', category: '数学', currentScore: 48, targetScore: 63, importance: 'medium', isSelected: false },
    // 英語
    { name: '英語', category: '外国語', currentScore: 48, targetScore: 65, importance: 'high', isSelected: false },
    { name: 'リスニング', category: '外国語', currentScore: 45, targetScore: 63, importance: 'high', isSelected: false },
    // 理科
    { name: '物理基礎', category: '理科', currentScore: 50, targetScore: 65, importance: 'medium', isSelected: false },
    { name: '化学基礎', category: '理科', currentScore: 48, targetScore: 63, importance: 'medium', isSelected: false },
    { name: '生物基礎', category: '理科', currentScore: 52, targetScore: 65, importance: 'medium', isSelected: false },
    { name: '物理', category: '理科', currentScore: 48, targetScore: 65, importance: 'high', isSelected: false },
    { name: '化学', category: '理科', currentScore: 50, targetScore: 67, importance: 'high', isSelected: false },
    { name: '生物', category: '理科', currentScore: 52, targetScore: 65, importance: 'high', isSelected: false },
    // 社会
    { name: '世界史B', category: '社会', currentScore: 50, targetScore: 65, importance: 'medium', isSelected: false },
    { name: '日本史B', category: '社会', currentScore: 52, targetScore: 67, importance: 'medium', isSelected: false },
    { name: '地理B', category: '社会', currentScore: 48, targetScore: 63, importance: 'medium', isSelected: false },
    { name: '現代社会', category: '社会', currentScore: 50, targetScore: 65, importance: 'low', isSelected: false },
    { name: '倫理', category: '社会', currentScore: 48, targetScore: 63, importance: 'low', isSelected: false },
    { name: '政治・経済', category: '社会', currentScore: 50, targetScore: 65, importance: 'low', isSelected: false },
    { name: '倫理・政経', category: '社会', currentScore: 49, targetScore: 64, importance: 'medium', isSelected: false }
  ])
  const [examType, setExamType] = useState<'common' | 'private'>('common')
  const [studyHoursPerDay, setStudyHoursPerDay] = useState(4)
  const [weakPoints, setWeakPoints] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [planName, setPlanName] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

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

  const toggleSubjectSelection = (index: number) => {
    const updated = [...subjects]
    updated[index].isSelected = !updated[index].isSelected
    setSubjects(updated)
  }

  const getSelectedSubjects = () => {
    return subjects.filter(s => s.isSelected)
  }

  const handleGeneratePlan = async () => {
    setIsGenerating(true)
    
    // 実際の実装では、ここでAPIを呼び出します
    setTimeout(() => {
      const mockPlan = generateMockStudyPlan()
      setGeneratedPlan(mockPlan)
      setIsGenerating(false)
      setPlanName(`${targetUniversities[0]?.name || '大学'}合格計画 - ${new Date().toLocaleDateString('ja-JP')}`)
    }, 2000)
  }

  const generateMockStudyPlan = () => {
    const adjustedDeadline = calculateAdjustedDeadline(targetDate)
    const today = new Date()
    const deadline = new Date(adjustedDeadline)
    const totalWeeks = Math.floor((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7))
    
    const phases: Phase[] = [
      {
        name: '基礎固め期',
        weeks: Math.floor(totalWeeks * 0.3),
        startWeek: 0,
        endWeek: Math.floor(totalWeeks * 0.3),
        description: '全科目の基礎を徹底的に固める',
        goals: ['基礎問題90%正答率', '弱点分野の特定'],
        subjects: getSelectedSubjects().map(s => ({
          name: s.name,
          weeklyHours: Math.floor(studyHoursPerDay * 7 * 0.35),
          focus: '基礎概念の理解と定着',
          materials: ['基礎問題集', '教科書の完全理解']
        }))
      },
      {
        name: '実力養成期',
        weeks: Math.floor(totalWeeks * 0.4),
        startWeek: Math.floor(totalWeeks * 0.3),
        endWeek: Math.floor(totalWeeks * 0.7),
        description: '標準〜応用レベルの問題演習',
        goals: ['模試で目標偏差値-5以内', '応用問題への対応力'],
        subjects: getSelectedSubjects().map(s => ({
          name: s.name,
          weeklyHours: Math.floor(studyHoursPerDay * 7 * 0.4),
          focus: '標準問題の習熟と応用力養成',
          materials: ['標準問題集', '過去問演習']
        }))
      },
      {
        name: '仕上げ期',
        weeks: Math.floor(totalWeeks * 0.2),
        startWeek: Math.floor(totalWeeks * 0.7),
        endWeek: Math.floor(totalWeeks * 0.9),
        description: '目標レベル到達と安定化',
        goals: ['目標偏差値達成', '得点の安定化'],
        subjects: getSelectedSubjects().map(s => ({
          name: s.name,
          weeklyHours: Math.floor(studyHoursPerDay * 7 * 0.3),
          focus: '実戦演習と弱点補強',
          materials: ['過去問', '予想問題集']
        }))
      },
      {
        name: '維持・調整期',
        weeks: Math.floor(totalWeeks * 0.1),
        startWeek: Math.floor(totalWeeks * 0.9),
        endWeek: totalWeeks,
        description: '実力維持と最終調整',
        goals: ['コンディション調整', '実力の維持'],
        subjects: getSelectedSubjects().map(s => ({
          name: s.name,
          weeklyHours: Math.floor(studyHoursPerDay * 7 * 0.2),
          focus: '総復習と体調管理',
          materials: ['要点整理', '間違いノート']
        }))
      }
    ]
    
    return {
      summary: {
        totalWeeks,
        targetAchievementWeek: totalWeeks,
        bufferWeeks: Math.floor(totalWeeks * 0.1),
        totalStudyHours: totalWeeks * studyHoursPerDay * 7,
        adjustedDeadline,
        dailyStudyHours: studyHoursPerDay
      },
      phases,
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

  const handleSavePlan = async () => {
    if (!generatedPlan || !planName || !user) return
    
    setIsSaving(true)
    setSaveStatus('saving')
    
    try {
      // StudyPlan型に変換
      const studyPlan: Omit<StudyPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'version'> = {
        name: planName,
        targetDate: new Date(targetDate),
        adjustedDeadline: new Date(generatedPlan.summary.adjustedDeadline),
        targetUniversities,
        subjects: subjects.map(s => ({
          ...s,
          weeklyHours: s.isSelected ? Math.floor(studyHoursPerDay * 7 / getSelectedSubjects().length) : 0
        })),
        summary: generatedPlan.summary,
        phases: generatedPlan.phases,
        weeklyTemplate: generatedPlan.weeklyTemplate,
        milestones: generatedPlan.milestones,
        isActive: true,
        status: 'active'
      }
      
      const planId = await saveStudyPlan(userId, studyPlan)
      console.log('計画保存成功:', planId)
      
      setSaveStatus('saved')
      
      // カレンダーに適用するか確認
      if (window.confirm('計画をカレンダーに適用しますか？')) {
        await handleApplyToCalendar(planId)
      }
    } catch (error) {
      console.error('計画保存エラー:', error)
      setSaveStatus('error')
      alert('計画の保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleApplyToCalendar = async (planId?: string) => {
    if (!planId && !generatedPlan) return
    
    setIsApplying(true)
    
    try {
      // planIdが渡されていない場合は、最初に計画を保存
      let actualPlanId = planId
      if (!actualPlanId) {
        await handleSavePlan()
        // TODO: 保存後のplanIdを取得
        return
      }
      
      await applyPlanToCalendar(actualPlanId)
      alert('計画をカレンダーに適用しました')
      
      // スケジュールページへ遷移
      router.push('/schedule')
    } catch (error) {
      console.error('カレンダー適用エラー:', error)
      alert('カレンダーへの適用に失敗しました')
    } finally {
      setIsApplying(false)
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

        {/* 受験科目選択 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              受験科目選択
            </CardTitle>
            <CardDescription>
              共通テストで受験する科目を選択してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 国語 */}
              <div>
                <h3 className="font-medium mb-2 text-gray-700">国語（必須3科目）</h3>
                <div className="grid grid-cols-3 gap-2">
                  {subjects.filter(s => s.category === '国語').map((subject, idx) => {
                    const index = subjects.findIndex(s => s.name === subject.name)
                    return (
                      <label key={subject.name} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subject.isSelected}
                          onChange={() => toggleSubjectSelection(index)}
                          className="rounded"
                        />
                        <span className="text-sm">{subject.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* 数学 */}
              <div>
                <h3 className="font-medium mb-2 text-gray-700">数学（文系：IA・IIB、理系：+III）</h3>
                <div className="grid grid-cols-3 gap-2">
                  {subjects.filter(s => s.category === '数学').map((subject, idx) => {
                    const index = subjects.findIndex(s => s.name === subject.name)
                    return (
                      <label key={subject.name} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subject.isSelected}
                          onChange={() => toggleSubjectSelection(index)}
                          className="rounded"
                        />
                        <span className="text-sm">{subject.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* 英語 */}
              <div>
                <h3 className="font-medium mb-2 text-gray-700">外国語（必須）</h3>
                <div className="grid grid-cols-3 gap-2">
                  {subjects.filter(s => s.category === '外国語').map((subject, idx) => {
                    const index = subjects.findIndex(s => s.name === subject.name)
                    return (
                      <label key={subject.name} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subject.isSelected}
                          onChange={() => toggleSubjectSelection(index)}
                          className="rounded"
                        />
                        <span className="text-sm">{subject.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* 理科 */}
              <div>
                <h3 className="font-medium mb-2 text-gray-700">理科（基礎2科目 or 専門1科目）</h3>
                <div className="mb-2">
                  <p className="text-xs text-gray-600">基礎科目（2科目選択）</p>
                  <div className="grid grid-cols-4 gap-2 mt-1">
                    {subjects.filter(s => s.category === '理科' && s.name.includes('基礎')).map((subject, idx) => {
                      const index = subjects.findIndex(s => s.name === subject.name)
                      return (
                        <label key={subject.name} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={subject.isSelected}
                            onChange={() => toggleSubjectSelection(index)}
                            className="rounded"
                          />
                          <span className="text-xs">{subject.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-600">専門科目（1-2科目選択）</p>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {subjects.filter(s => s.category === '理科' && !s.name.includes('基礎')).map((subject, idx) => {
                      const index = subjects.findIndex(s => s.name === subject.name)
                      return (
                        <label key={subject.name} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={subject.isSelected}
                            onChange={() => toggleSubjectSelection(index)}
                            className="rounded"
                          />
                          <span className="text-sm">{subject.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* 社会 */}
              <div>
                <h3 className="font-medium mb-2 text-gray-700">社会（1-2科目選択）</h3>
                <div className="grid grid-cols-3 gap-2">
                  {subjects.filter(s => s.category === '社会').map((subject, idx) => {
                    const index = subjects.findIndex(s => s.name === subject.name)
                    return (
                      <label key={subject.name} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={subject.isSelected}
                          onChange={() => toggleSubjectSelection(index)}
                          className="rounded"
                        />
                        <span className="text-sm">{subject.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                選択科目数: {getSelectedSubjects().length}科目
              </p>
            </div>
          </CardContent>
        </Card>

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
            {getSelectedSubjects().map((subject, index) => (
              <div key={subject.name} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{subject.name}</h3>
                  <select
                    value={subject.importance}
                    onChange={(e) => {
                      const updated = [...subjects]
                      const actualIndex = subjects.findIndex(s => s.name === subject.name)
                      updated[actualIndex].importance = e.target.value as any
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
                        const actualIndex = subjects.findIndex(s => s.name === subject.name)
                        updated[actualIndex].currentScore = Number(e.target.value)
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
                        const actualIndex = subjects.findIndex(s => s.name === subject.name)
                        updated[actualIndex].targetScore = Number(e.target.value)
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
        
        {(!targetDate || targetUniversities.length === 0 || getSelectedSubjects().length === 0) && (
          <p className="text-sm text-yellow-600 mt-2 flex items-center justify-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {!targetDate && '目標時期を設定してください'}
            {targetDate && targetUniversities.length === 0 && '志望校を選択してください'}
            {targetDate && targetUniversities.length > 0 && getSelectedSubjects().length === 0 && '受験科目を選択してください'}
          </p>
        )}
      </div>

      {/* 生成された計画 */}
      {generatedPlan && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              生成された学習計画
            </h2>
            <div className="flex gap-2">
              {saveStatus === 'saved' && (
                <Badge className="bg-green-100 text-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  保存済み
                </Badge>
              )}
            </div>
          </div>
          
          {/* 計画名入力 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">計画名</label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="例：東京大学合格計画2024"
            />
          </div>
          
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

          {/* アクションボタン */}
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <Button
              onClick={handleSavePlan}
              disabled={!planName || isSaving || saveStatus === 'saved'}
              variant={saveStatus === 'saved' ? 'success' : 'secondary'}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  保存中...
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  保存済み
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  計画を保存
                </>
              )}
            </Button>
            
            <Button
              onClick={() => handleApplyToCalendar()}
              disabled={isApplying || (!planName && saveStatus !== 'saved')}
              variant="primary"
              className="flex-1"
            >
              {isApplying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  適用中...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  カレンダーに適用
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}