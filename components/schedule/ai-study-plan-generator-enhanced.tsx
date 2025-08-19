'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Calendar, Target, Clock, BookOpen, TrendingUp, AlertCircle, Brain, Trophy, Rocket, ChevronRight, Check, Star } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useSchedule } from '@/hooks/use-schedule'

export default function AIStudyPlanGeneratorEnhanced() {
  const router = useRouter()
  const { user } = useAuth()
  const { createSchedule: createScheduleAPI, schedule: existingSchedule } = useSchedule()
  
  const [targetDate, setTargetDate] = useState('')
  const [targetScore, setTargetScore] = useState(65)
  const [currentScore, setCurrentScore] = useState(50)
  const [subjects, setSubjects] = useState([
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
    { name: '物理', category: '理科', currentScore: 48, targetScore: 65, importance: 'high', isSelected: false },
    { name: '化学', category: '理科', currentScore: 50, targetScore: 67, importance: 'high', isSelected: false },
    // 社会
    { name: '世界史B', category: '社会', currentScore: 50, targetScore: 65, importance: 'medium', isSelected: false },
    { name: '日本史B', category: '社会', currentScore: 52, targetScore: 67, importance: 'medium', isSelected: false },
    { name: '地理B', category: '社会', currentScore: 48, targetScore: 63, importance: 'medium', isSelected: false },
  ])
  const [studyHoursPerDay, setStudyHoursPerDay] = useState(4)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState(null)
  const [generatedSchedule, setGeneratedSchedule] = useState(null)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // 日付選択用の状態
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState(new Date().getDate())
  const [showDatePicker, setShowDatePicker] = useState(false)
  
  // スケジュール設定
  const [schedule, setSchedule] = useState({
    school: { enabled: true, start: '08:30', end: '16:00' },
    cram: { enabled: false, start: '18:00', end: '21:00' },
    club: { enabled: false, start: '16:30', end: '18:30' }
  })

  // 大学情報の追加
  const [universityName, setUniversityName] = useState('')
  const [department, setDepartment] = useState('')
  
  // 学年情報の追加
  const [gradeLevel, setGradeLevel] = useState('高校3年')

  const categoryIcons = {
    '国語': '📚',
    '数学': '🔢',
    '外国語': '🌍',
    '理科': '🔬',
    '社会': '🗾'
  }

  // モバイル最適化されたスタイル定義
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      width: '100%',
      position: 'relative' as const,
      overflow: 'hidden',
      paddingTop: '60px', // ダッシュボードヘッダー分の余白
      paddingBottom: '80px', // フッター分の余白
    },
    mainContent: {
      position: 'relative' as const,
      width: '100%',
      padding: '12px',
    },
    headerContainer: {
      textAlign: 'center' as const,
      marginBottom: '20px',
    },
    headerBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '12px',
      padding: '8px 16px',
      backgroundColor: 'white',
      borderRadius: '20px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    },
    title: {
      fontSize: '18px',
      fontWeight: 'bold',
      background: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
    subtitle: {
      fontSize: '13px',
      color: '#4b5563',
      fontWeight: '500',
      lineHeight: '1.5',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      marginBottom: '16px',
      overflow: 'hidden',
    },
    cardHeader: {
      padding: '16px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    cardTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#1f2937',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    cardContent: {
      padding: '16px',
    },
    primaryButton: {
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: '600',
      color: 'white',
      background: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      boxShadow: '0 4px 12px rgba(147, 51, 234, 0.3)',
      transition: 'all 0.3s ease',
    },
    primaryButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
    quickSelectButton: {
      padding: '10px',
      borderRadius: '8px',
      border: '2px solid #e5e7eb',
      backgroundColor: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      textAlign: 'center' as const,
    },
    quickSelectButtonActive: {
      background: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
      color: 'white',
      borderColor: 'transparent',
    },
    checkbox: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: 'transparent',
    },
    checkboxInput: {
      width: '18px',
      height: '18px',
      borderRadius: '4px',
      border: '2px solid #d1d5db',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      backgroundColor: 'white',
      flexShrink: 0,
    },
    checkboxInputChecked: {
      background: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
      borderColor: 'transparent',
    },
    rangeSlider: {
      width: '100%',
      height: '8px',
      borderRadius: '4px',
      backgroundColor: '#e5e7eb',
      WebkitAppearance: 'none',
      appearance: 'none',
      cursor: 'pointer',
      outline: 'none',
    },
    label: {
      display: 'block',
      fontSize: '12px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '6px',
    },
    input: {
      width: '100%',
      padding: '10px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      fontSize: '14px',
      transition: 'all 0.2s',
      outline: 'none',
    },
    errorMessage: {
      marginBottom: '16px',
      padding: '12px',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    successMessage: {
      marginBottom: '16px',
      padding: '12px',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      border: '1px solid rgba(34, 197, 94, 0.3)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    datePicker: {
      position: 'absolute' as const,
      top: '100%',
      marginTop: '8px',
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      border: '1px solid #e5e7eb',
      padding: '12px',
      zIndex: 50,
    },
    phaseCard: {
      position: 'relative' as const,
      overflow: 'hidden',
      borderRadius: '10px',
      backgroundColor: 'white',
      padding: '16px',
      border: '2px solid #e5e7eb',
      marginBottom: '12px',
    },
    phaseBorder: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '4px',
      height: '100%',
    },
    milestoneItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      marginBottom: '8px',
    },
  }

  // 月の日数を取得
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate()
  }

  // 日付を更新
  const updateTargetDate = () => {
    const newDate = new Date(selectedYear, selectedMonth - 1, selectedDay)
    setTargetDate(newDate.toISOString().split('T')[0])
    setShowDatePicker(false)
  }

  const calculateAdjustedDeadline = (date) => {
    const target = new Date(date)
    const today = new Date()
    const totalDays = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const adjustedDays = Math.floor(totalDays * 0.9)
    const adjustedDate = new Date(today.getTime() + adjustedDays * 24 * 60 * 60 * 1000)
    return adjustedDate.toISOString().split('T')[0]
  }

  const toggleSubjectSelection = (index) => {
    const updated = [...subjects]
    updated[index].isSelected = !updated[index].isSelected
    setSubjects(updated)
  }

  const getSelectedSubjects = () => subjects.filter(s => s.isSelected)

  // 利用可能時間を計算する関数
  const calculateAvailableTime = (day: string): number => {
    let totalMinutes = studyHoursPerDay * 60
    
    // 平日の場合
    if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day)) {
      if (schedule.school.enabled) totalMinutes = Math.min(totalMinutes, 6 * 60) // 学校がある日は最大6時間
    }
    
    return totalMinutes
  }

  const handleGeneratePlan = async () => {
    if (!user) {
      setError('ログインしてください')
      return
    }

    if (!targetDate || getSelectedSubjects().length === 0) {
      setError('目標時期と受験科目を選択してください')
      return
    }

    setIsGenerating(true)
    setError(null)
    setShowSuccess(false)

    try {
      // 選択された科目のみを抽出
      const selectedSubjects = getSelectedSubjects()
      
      // 目標偏差値の計算（選択科目の平均）
      const targetDeviation = selectedSubjects.length > 0
        ? Math.round(selectedSubjects.reduce((sum, s) => sum + s.targetScore, 0) / selectedSubjects.length)
        : targetScore
      
      const currentDeviation = selectedSubjects.length > 0
        ? Math.round(selectedSubjects.reduce((sum, s) => sum + s.currentScore, 0) / selectedSubjects.length)
        : currentScore

      // 科目別の優先順位を作成
      const priorities: { [subject: string]: 'high' | 'medium' | 'low' } = {}
      const targetProblems: { [subject: string]: number } = {}
      const currentGrades: { [subject: string]: number } = {}
      
      selectedSubjects.forEach(subject => {
        priorities[subject.name] = subject.importance as 'high' | 'medium' | 'low'
        currentGrades[subject.name] = subject.currentScore
        
        // 科目タイプに応じた目標問題数を設定
        if (subject.name.includes('数学') || subject.category === '数学') {
          targetProblems[subject.name] = 15
        } else if (subject.category === '外国語') {
          targetProblems[subject.name] = 20
        } else if (subject.category === '理科') {
          targetProblems[subject.name] = 12
        } else if (subject.category === '国語') {
          targetProblems[subject.name] = 10
        } else {
          targetProblems[subject.name] = 10
        }
      })

      // grades オブジェクトを作成（AISchedulePlannerが期待する構造に合わせる）
      const grades = {
        currentGrades,
        targetGrade: targetDeviation,
        priorities,
        targetProblems,
        // 以下を追加
        subjects: selectedSubjects.reduce((acc, subject) => {
          if (!acc[subject.category]) {
            acc[subject.category] = []
          }
          acc[subject.category].push({
            name: subject.name,
            currentScore: subject.currentScore,
            targetScore: subject.targetScore,
            importance: subject.importance
          })
          return acc
        }, {}),
        // カテゴリ別の目標問題数も追加
        categoryTargetProblems: {
          '国語': { min: 8, max: 12, optimal: 10 },
          '数学': { min: 12, max: 18, optimal: 15 },
          '外国語': { min: 15, max: 25, optimal: 20 },
          '理科': { min: 10, max: 15, optimal: 12 },
          '社会': { min: 8, max: 12, optimal: 10 }
        }
      }

      // 大学情報を構築
      const universityGoal = {
        universityName: universityName || '志望大学',
        department: department || '志望学部',
        requiredDeviation: targetDeviation - 5,
        safeDeviation: targetDeviation,
        examSubjects: selectedSubjects.map(subject => ({
          subject: subject.name,
          weight: 100,
          minDeviation: subject.targetScore - 5,
          criticalTopics: []
        })),
        examDate: new Date(targetDate)
      }

      // 制約条件を構築
      const constraints = {
        weeklySchedule: {
          monday: {
            fixedBlocks: [
              ...(schedule.school.enabled ? [{ 
                start: '08:00', 
                end: '16:00', 
                type: 'school' as const, 
                isFlexible: false,
                description: '学校'
              }] : []),
              ...(schedule.cram.enabled ? [{ 
                start: '18:00', 
                end: '20:00', 
                type: 'cram_school' as const, 
                isFlexible: false,
                description: '塾'
              }] : []),
              ...(schedule.club.enabled ? [{ 
                start: '16:30', 
                end: '18:00', 
                type: 'club' as const, 
                isFlexible: true,
                description: '部活'
              }] : [])
            ],
            availableStudyTime: calculateAvailableTime('monday'),
            preferredSubjects: []
          },
          tuesday: {
            fixedBlocks: [
              ...(schedule.school.enabled ? [{ 
                start: '08:00', 
                end: '16:00', 
                type: 'school' as const, 
                isFlexible: false,
                description: '学校'
              }] : [])
            ],
            availableStudyTime: calculateAvailableTime('tuesday'),
            preferredSubjects: []
          },
          wednesday: {
            fixedBlocks: [
              ...(schedule.school.enabled ? [{ 
                start: '08:00', 
                end: '16:00', 
                type: 'school' as const, 
                isFlexible: false,
                description: '学校'
              }] : [])
            ],
            availableStudyTime: calculateAvailableTime('wednesday'),
            preferredSubjects: []
          },
          thursday: {
            fixedBlocks: [
              ...(schedule.school.enabled ? [{ 
                start: '08:00', 
                end: '16:00', 
                type: 'school' as const, 
                isFlexible: false,
                description: '学校'
              }] : [])
            ],
            availableStudyTime: calculateAvailableTime('thursday'),
            preferredSubjects: []
          },
          friday: {
            fixedBlocks: [
              ...(schedule.school.enabled ? [{ 
                start: '08:00', 
                end: '16:00', 
                type: 'school' as const, 
                isFlexible: false,
                description: '学校'
              }] : [])
            ],
            availableStudyTime: calculateAvailableTime('friday'),
            preferredSubjects: []
          },
          saturday: {
            fixedBlocks: [],
            availableStudyTime: calculateAvailableTime('saturday'),
            preferredSubjects: []
          },
          sunday: {
            fixedBlocks: [],
            availableStudyTime: calculateAvailableTime('sunday'),
            preferredSubjects: []
          }
        },
        examPreparationDays: 30,
        bufferTimePercentage: 15,
        preferredStudyDuration: {
          min: 60,
          max: 120,
          optimal: 90
        },
        breakPattern: {
          shortBreak: 10,
          longBreak: 30,
          frequency: 90
        }
      }
      
      // 総学習時間を計算
      const totalDays = Math.floor((new Date(targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      const totalTargetHours = totalDays * studyHoursPerDay
      
      // createSchedule 関数に渡すパラメータを作成
      const createScheduleParams = {
        userId: user.uid,
        examDate: new Date(targetDate),
        targetDate: new Date(targetDate),  // 追加
        targetScore: targetDeviation,       // 追加
        currentScore: currentDeviation,     // 追加
        totalTargetHours: totalTargetHours, // 追加
        isActive: true,                     // 追加
        weeklySchedule: constraints.weeklySchedule,
        grades,  // gradesオブジェクトを追加
        preferences: {
          studyDuration: constraints.preferredStudyDuration,
          breakPattern: constraints.breakPattern
        },
        studyGoals: selectedSubjects.map(s => s.name),
        userPreferences: {},
        // 以下を追加
        subjects: selectedSubjects.map(s => ({
          name: s.name,
          category: s.category,
          currentScore: s.currentScore,
          targetScore: s.targetScore,
          importance: s.importance,
          isSelected: true
        })),
        universityGoal: universityGoal,
        constraints: constraints,
        studyHoursPerDay: studyHoursPerDay,
        adjustedDeadline: calculateAdjustedDeadline(targetDate),
        // 学年情報を追加（高校3年生と仮定）
        gradeLevel: gradeLevel,
        // AI生成用のフラグ
        useAI: true
      }
      
      // スケジュールを作成（use-schedule.tsのcreateSchedule関数を使用）
      const createdSchedule = await createScheduleAPI(createScheduleParams)
      
      if (createdSchedule) {
        setGeneratedSchedule(createdSchedule)
        setShowSuccess(true)
        
        // ローカルで計画を生成して表示
        const mockPlan = generateMockStudyPlan()
        setGeneratedPlan(mockPlan)
        
        // スケジュール作成後、月次スケジュールの生成をトリガー
        try {
          // 現在の年月を取得
          const now = new Date()
          const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
          
          // 月次スケジュール生成のためのデータを準備
          console.log('月次スケジュール生成をトリガー', {
            scheduleId: createdSchedule.id,
            yearMonth,
            subjects: selectedSubjects.map(s => s.name)
          })
        } catch (error) {
          console.error('月次スケジュール生成エラー:', error)
          // エラーが発生してもメインの処理は続行
        }
        
        // 3秒後にスケジュールページへ遷移
        setTimeout(() => {
          router.push('/schedule')
        }, 3000)
      } else {
        throw new Error('スケジュールの作成に失敗しました')
      }
      
    } catch (error) {
      console.error('スケジュール作成エラー:', error)
      
      // エラーメッセージをより分かりやすく
      if (error instanceof Error) {
        if (error.message.includes('必須フィールド')) {
          setError('スケジュールの作成に必要な情報が不足しています。もう一度お試しください。')
        } else if (error.message.includes('priorities')) {
          setError('学習目標の優先順位が設定されていません。科目を選択し、重要度を確認してください。')
        } else if (error.message.includes('数学') || error.message.includes('targetProblems')) {
          setError('科目別の目標問題数の設定に問題があります。もう一度お試しください。')
        } else {
          setError(error.message || 'スケジュールの作成に失敗しました')
        }
      } else {
        setError('スケジュールの作成に失敗しました。もう一度お試しください。')
      }
    } finally {
      setIsGenerating(false)
    }
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
          name: '🌱 基礎固め期',
          weeks: Math.floor(totalWeeks * 0.3),
          description: '全科目の基礎を徹底的に固める',
          goals: ['基礎問題90%正答率', '弱点分野の特定'],
          color: 'from-green-400 to-emerald-500'
        },
        {
          name: '💪 実力養成期',
          weeks: Math.floor(totalWeeks * 0.4),
          description: '標準〜応用レベルの問題演習',
          goals: ['模試で目標偏差値-5以内', '応用問題への対応力'],
          color: 'from-blue-400 to-indigo-500'
        },
        {
          name: '🚀 仕上げ期',
          weeks: Math.floor(totalWeeks * 0.2),
          description: '目標レベル到達と安定化',
          goals: ['目標偏差値達成', '得点の安定化'],
          color: 'from-purple-400 to-pink-500'
        },
        {
          name: '✨ 維持・調整期',
          weeks: Math.floor(totalWeeks * 0.1),
          description: '実力維持と最終調整',
          goals: ['コンディション調整', '実力の維持'],
          color: 'from-yellow-400 to-orange-500'
        }
      ],
      milestones: [
        { week: Math.floor(totalWeeks * 0.25), target: '基礎完成', metric: '85%正答率', icon: '🎯' },
        { week: Math.floor(totalWeeks * 0.5), target: '中間目標', metric: `偏差値${currentScore + (targetScore - currentScore) * 0.5}`, icon: '📈' },
        { week: Math.floor(totalWeeks * 0.75), target: '応用力完成', metric: `偏差値${targetScore - 3}`, icon: '💯' },
        { week: Math.floor(totalWeeks * 0.9), target: '目標達成', metric: `偏差値${targetScore}`, icon: '🏆' }
      ]
    }
  }

  // アニメーションキーフレーム
  useEffect(() => {
    const styleSheet = document.createElement('style')
    styleSheet.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .custom-range::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: linear-gradient(135deg, #9333ea 0%, #3b82f6 100%);
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(147, 51, 234, 0.3);
        border: 2px solid white;
      }
      .custom-range::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: linear-gradient(135deg, #9333ea 0%, #3b82f6 100%);
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(147, 51, 234, 0.3);
        border: 2px solid white;
      }
    `
    document.head.appendChild(styleSheet)
    return () => document.head.removeChild(styleSheet)
  }, [])

  return (
    <div style={styles.container}>
      <div style={styles.mainContent}>
        {/* ヘッダー */}
        <div style={styles.headerContainer}>
          <div style={styles.headerBadge}>
            <Brain style={{ width: '20px', height: '20px', color: '#9333ea' }} />
            <h1 style={styles.title}>AI学習計画ジェネレーター</h1>
          </div>
          <p style={styles.subtitle}>
            <span style={{ fontWeight: 'bold', color: '#9333ea' }}>あなたの生活にコミットした</span>
            <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>予定を作成</span>
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div style={styles.errorMessage}>
            <AlertCircle style={{ width: '16px', height: '16px', color: '#ef4444', flexShrink: 0 }} />
            <p style={{ color: '#dc2626', fontSize: '12px', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* 成功メッセージ */}
        {showSuccess && (
          <div style={styles.successMessage}>
            <Check style={{ width: '16px', height: '16px', color: '#22c55e', flexShrink: 0 }} />
            <p style={{ color: '#16a34a', fontSize: '12px', margin: 0 }}>
              スケジュールを作成しました！まもなくスケジュール画面へ移動します...
            </p>
          </div>
        )}

        {/* 志望大学情報 */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Trophy size={18} color="#9333ea" />
            <h2 style={styles.cardTitle}>志望大学情報</h2>
          </div>
          <div style={styles.cardContent}>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>学年</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                style={styles.input}
              >
                <option value="高校1年">高校1年生</option>
                <option value="高校2年">高校2年生</option>
                <option value="高校3年">高校3年生</option>
                <option value="浪人生">浪人生</option>
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={styles.label}>志望大学名</label>
              <input
                type="text"
                value={universityName}
                onChange={(e) => setUniversityName(e.target.value)}
                placeholder="例：東京大学"
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>志望学部・学科</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="例：理科一類"
                style={styles.input}
              />
            </div>
          </div>
        </div>

        {/* 目標設定 */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Target style={{ width: '18px', height: '18px', color: '#9333ea' }} />
            <h2 style={styles.cardTitle}>目標設定</h2>
          </div>
          <div style={styles.cardContent}>
            <div style={{ marginBottom: '20px' }}>
              <label style={styles.label}>🎯 目標達成時期</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { months: 3, label: '3ヶ月後', icon: '🌱' },
                    { months: 6, label: '6ヶ月後', icon: '📚' },
                    { months: 12, label: '1年後', icon: '🎓' }
                  ].map(({ months, label, icon }) => (
                    <button
                      key={months}
                      onClick={() => {
                        const date = new Date()
                        date.setMonth(date.getMonth() + months)
                        setTargetDate(date.toISOString().split('T')[0])
                      }}
                      style={{
                        ...styles.quickSelectButton,
                        ...(targetDate && Math.abs(new Date(targetDate).getTime() - new Date(new Date().setMonth(new Date().getMonth() + months)).getTime()) < 7 * 24 * 60 * 60 * 1000 ? styles.quickSelectButtonActive : {})
                      }}
                    >
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>{icon}</div>
                      <div style={{ fontSize: '11px', fontWeight: '600' }}>{label}</div>
                    </button>
                  ))}
                </div>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    style={{
                      width: '100%',
                      padding: '10px 10px 10px 32px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontSize: '14px'
                    }}
                  >
                    <Calendar style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: '#9ca3af' }} />
                    {targetDate ? new Date(targetDate).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : '日付を選択'}
                  </button>
                  
                  {showDatePicker && (
                    <div style={styles.datePicker}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* 年選択 */}
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>年</label>
                          <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            style={{
                              width: '100%',
                              marginTop: '4px',
                              padding: '8px',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              fontSize: '13px'
                            }}
                          >
                            {[...Array(3)].map((_, i) => {
                              const year = new Date().getFullYear() + i
                              return <option key={year} value={year}>{year}年</option>
                            })}
                          </select>
                        </div>
                        
                        {/* 月選択 */}
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>月</label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginTop: '4px' }}>
                            {[...Array(12)].map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setSelectedMonth(i + 1)}
                                style={{
                                  padding: '6px',
                                  fontSize: '11px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  backgroundColor: selectedMonth === i + 1 ? '#9333ea' : '#f3f4f6',
                                  color: selectedMonth === i + 1 ? 'white' : '#374151'
                                }}
                              >
                                {i + 1}月
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* 日選択 */}
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: '600', color: '#6b7280' }}>日</label>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(7, 1fr)', 
                            gap: '4px', 
                            marginTop: '4px',
                            maxHeight: '150px',
                            overflowY: 'auto'
                          }}>
                            {[...Array(getDaysInMonth(selectedYear, selectedMonth))].map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setSelectedDay(i + 1)}
                                style={{
                                  padding: '6px',
                                  fontSize: '11px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  backgroundColor: selectedDay === i + 1 ? '#9333ea' : '#f3f4f6',
                                  color: selectedDay === i + 1 ? 'white' : '#374151'
                                }}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px', paddingTop: '8px' }}>
                          <button
                            onClick={updateTargetDate}
                            style={{
                              flex: 1,
                              padding: '8px',
                              backgroundColor: '#9333ea',
                              color: 'white',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '500'
                            }}
                          >
                            決定
                          </button>
                          <button
                            onClick={() => setShowDatePicker(false)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              backgroundColor: '#e5e7eb',
                              color: '#374151',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '500'
                            }}
                          >
                            キャンセル
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {targetDate && (
                  <div style={{
                    padding: '10px',
                    backgroundColor: 'rgba(147, 51, 234, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <p style={{ fontSize: '12px', fontWeight: '500', color: '#7c3aed' }}>
                      今から約 {Math.ceil((new Date(targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30))} ヶ月後
                    </p>
                    <p style={{ fontSize: '11px', color: '#9333ea', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Rocket style={{ width: '12px', height: '12px' }} />
                      実質目標: {calculateAdjustedDeadline(targetDate)} (余裕を持った計画)
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label style={styles.label}>
                📊 目標偏差値: <span style={{ fontSize: '18px', color: '#9333ea' }}>{targetScore}</span>
              </label>
              <input
                type="range"
                min="40"
                max="80"
                value={targetScore}
                onChange={(e) => setTargetScore(Number(e.target.value))}
                className="custom-range"
                style={styles.rangeSlider}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                <span>40</span>
                <span>60</span>
                <span>80</span>
              </div>
            </div>
          </div>
        </div>

        {/* 受験科目選択 */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <BookOpen style={{ width: '18px', height: '18px', color: '#3b82f6' }} />
            <h2 style={styles.cardTitle}>受験科目選択</h2>
          </div>
          <div style={styles.cardContent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.entries(
                subjects.reduce((acc, subject) => {
                  if (!acc[subject.category]) acc[subject.category] = []
                  acc[subject.category].push(subject)
                  return acc
                }, {})
              ).map(([category, categorySubjects]) => (
                <div key={category} style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <h3 style={{ fontWeight: '600', fontSize: '14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '16px' }}>{categoryIcons[category]}</span>
                    {category}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                    {categorySubjects.map(subject => {
                      const index = subjects.findIndex(s => s.name === subject.name)
                      return (
                        <div
                          key={subject.name}
                          onClick={() => toggleSubjectSelection(index)}
                          style={styles.checkbox}
                        >
                          <div style={{
                            ...styles.checkboxInput,
                            ...(subject.isSelected ? styles.checkboxInputChecked : {})
                          }}>
                            {subject.isSelected && <Check style={{ width: '12px', height: '12px', color: 'white' }} />}
                          </div>
                          <span style={{ color: '#374151', fontSize: '12px' }}>{subject.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
              borderRadius: '8px'
            }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Star style={{ width: '14px', height: '14px' }} />
                選択科目数: <span style={{ fontSize: '16px' }}>{getSelectedSubjects().length}</span>科目
              </p>
            </div>
          </div>
        </div>

        {/* 現在の学力 */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <TrendingUp style={{ width: '18px', height: '18px', color: '#10b981' }} />
            <h2 style={styles.cardTitle}>現在の学力</h2>
          </div>
          <div style={styles.cardContent}>
            <div>
              <label style={styles.label}>
                現在の偏差値: <span style={{ fontSize: '18px', color: '#10b981' }}>{currentScore}</span>
              </label>
              <input
                type="range"
                min="30"
                max="70"
                value={currentScore}
                onChange={(e) => setCurrentScore(Number(e.target.value))}
                className="custom-range"
                style={styles.rangeSlider}
              />
            </div>
          </div>
        </div>

        {/* 生活スケジュール */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Calendar style={{ width: '18px', height: '18px', color: '#ec4899' }} />
            <h2 style={styles.cardTitle}>生活スケジュール</h2>
          </div>
          <div style={styles.cardContent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { key: 'school', label: '🏫 学校', bgColor: '#eff6ff' },
                { key: 'cram', label: '📚 塾・予備校', bgColor: '#faf5ff' },
                { key: 'club', label: '⚽ 部活・習い事', bgColor: '#f0fdf4' }
              ].map(({ key, label, bgColor }) => (
                <div key={key} style={{
                  padding: '12px',
                  backgroundColor: bgColor,
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={schedule[key].enabled}
                        onChange={(e) => setSchedule({...schedule, [key]: {...schedule[key], enabled: e.target.checked}})}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span style={{ fontWeight: '600', fontSize: '14px' }}>{label}</span>
                    </label>
                  </div>
                  {schedule[key].enabled && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11px', color: '#6b7280' }}>開始時刻</label>
                        <input
                          type="time"
                          value={schedule[key].start}
                          onChange={(e) => setSchedule({...schedule, [key]: {...schedule[key], start: e.target.value}})}
                          style={{
                            width: '100%',
                            padding: '6px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: '#6b7280' }}>終了時刻</label>
                        <input
                          type="time"
                          value={schedule[key].end}
                          onChange={(e) => setSchedule({...schedule, [key]: {...schedule[key], end: e.target.value}})}
                          style={{
                            width: '100%',
                            padding: '6px',
                            border: '2px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 学習時間 */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Clock style={{ width: '18px', height: '18px', color: '#6366f1' }} />
            <h2 style={styles.cardTitle}>学習時間設定</h2>
          </div>
          <div style={styles.cardContent}>
            <label style={styles.label}>
              1日の学習可能時間: <span style={{ fontSize: '18px', color: '#6366f1' }}>{studyHoursPerDay}</span>時間
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={studyHoursPerDay}
              onChange={(e) => setStudyHoursPerDay(Number(e.target.value))}
              className="custom-range"
              style={styles.rangeSlider}
            />
            <p style={{ fontSize: '11px', color: '#6366f1', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle style={{ width: '12px', height: '12px' }} />
              実際の計画では{(studyHoursPerDay * 0.9).toFixed(1)}時間で計算（余裕を持たせるため）
            </p>
          </div>
        </div>

        {/* 生成ボタン */}
        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          <button
            onClick={handleGeneratePlan}
            disabled={!targetDate || getSelectedSubjects().length === 0 || isGenerating}
            style={{
              ...styles.primaryButton,
              ...(isGenerating || !targetDate || getSelectedSubjects().length === 0 ? styles.primaryButtonDisabled : {})
            }}
          >
            {isGenerating ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                AIが最適な計画を生成中...
              </>
            ) : (
              <>
                <Sparkles style={{ width: '16px', height: '16px' }} />
                学習計画を生成する
                <ChevronRight style={{ width: '14px', height: '14px' }} />
              </>
            )}
          </button>
          
          {(!targetDate || getSelectedSubjects().length === 0) && (
            <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <AlertCircle style={{ width: '12px', height: '12px' }} />
              {!targetDate && '目標時期を設定してください'}
              {targetDate && getSelectedSubjects().length === 0 && '受験科目を選択してください'}
            </p>
          )}
        </div>

        {/* 生成された計画 */}
        {generatedPlan && (
          <div style={{ ...styles.card, animation: 'fadeIn 0.5s ease-out' }}>
            <div style={styles.cardHeader}>
              <Rocket style={{ width: '18px', height: '18px', color: '#9333ea' }} />
              <h2 style={styles.cardTitle}>あなた専用の学習計画</h2>
            </div>
            <div style={styles.cardContent}>
              <div style={{
                marginBottom: '20px',
                padding: '12px',
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
                borderRadius: '8px'
              }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '12px', color: '#7c3aed' }}>📊 計画サマリー</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', padding: '10px', borderRadius: '6px' }}>
                    <span style={{ color: '#6b7280', fontSize: '11px' }}>総期間</span>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#9333ea' }}>{generatedPlan.summary.totalWeeks}週間</p>
                  </div>
                  <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', padding: '10px', borderRadius: '6px' }}>
                    <span style={{ color: '#6b7280', fontSize: '11px' }}>総学習時間</span>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>{generatedPlan.summary.totalStudyHours}時間</p>
                  </div>
                </div>
              </div>

              {/* フェーズ */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontWeight: 'bold', fontSize: '14px', color: '#374151', marginBottom: '12px' }}>🎯 学習フェーズ</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {generatedPlan.phases.map((phase, index) => (
                    <div key={index} style={styles.phaseCard}>
                      <div style={{
                        ...styles.phaseBorder,
                        background: `linear-gradient(180deg, ${phase.color})`
                      }} />
                      <div style={{ paddingLeft: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>{phase.name}</h4>
                          <span style={{
                            padding: '4px 10px',
                            backgroundColor: 'rgba(147, 51, 234, 0.1)',
                            color: '#7c3aed',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            {phase.weeks}週間
                          </span>
                        </div>
                        <p style={{ color: '#6b7280', marginBottom: '8px', fontSize: '12px' }}>{phase.description}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {phase.goals.map((goal, i) => (
                            <span key={i} style={{
                              padding: '4px 10px',
                              backgroundColor: '#f3f4f6',
                              borderRadius: '12px',
                              fontSize: '11px'
                            }}>
                              ✓ {goal}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* マイルストーン */}
              <div>
                <h3 style={{ fontWeight: 'bold', fontSize: '14px', color: '#374151', marginBottom: '12px' }}>🏆 マイルストーン</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {generatedPlan.milestones.map((milestone, index) => (
                    <div key={index} style={styles.milestoneItem}>
                      <div style={{ fontSize: '20px' }}>{milestone.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontWeight: '600', fontSize: '12px' }}>{milestone.target}</span>
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>第{milestone.week}週</span>
                        </div>
                        <p style={{ fontSize: '11px', color: '#6b7280' }}>{milestone.metric}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
      `}</style>
    </div>
  )
}