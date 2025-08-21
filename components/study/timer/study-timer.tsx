// components/study/timer/study-timer.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Square, Coffee, Edit, Plus, X, AlertCircle, Clock, Target, BookOpen, Zap, Timer, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { StudyFeedbackForm } from './study-feedback-form'
import { StudyContentForm } from './study-content-form'
import { useTimerStore } from '@/lib/stores/timer-store'
import { 
  startTimerSessionWithContent, 
  endTimerSessionWithFeedback,
  toggleTimerPause,
  recordBreak,
  updateStudyContent
} from '@/lib/firebase/firestore'
import { auth } from '@/lib/firebase/config'

interface StudyTimerProps {
  subjects?: Array<{ id: string; name: string; units: Array<{ id: string; name: string }> }>
}

interface StudyContent {
  mainTheme: string
  subTopics: string[]
  materials: string[]
  goals: string[]
}

type TimerMode = 'countup' | 'countdown' | 'pomodoro'
type PomodoroState = 'work' | 'break' | 'longBreak'

const POMODORO_WORK_TIME = 25 * 60 // 25分
const POMODORO_BREAK_TIME = 5 * 60 // 5分
const POMODORO_LONG_BREAK_TIME = 15 * 60 // 15分
const POMODORO_SESSIONS_BEFORE_LONG_BREAK = 4

// カウントダウンのプリセット時間（分）
const COUNTDOWN_PRESETS = [10, 25, 30, 45, 60, 90]

export function StudyTimer({ subjects = [] }: StudyTimerProps) {
  const { toast } = useToast()
  const { setActiveTimer, clearActiveTimer, updateActiveTimer, activeTimer } = useTimerStore()
  
  // 高精度タイマー用のref
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const pausedTimeRef = useRef<number>(0)
  const lastUpdateRef = useRef<number>(0)
  
  // 状態管理
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedUnit, setSelectedUnit] = useState('')
  const [showContentForm, setShowContentForm] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [studyContent, setStudyContent] = useState<StudyContent | null>(null)
  const [breaks, setBreaks] = useState(0)
  const [pauseCount, setPauseCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  // タイマーモード関連の状態
  const [timerMode, setTimerMode] = useState<TimerMode>('countup')
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>('work')
  const [pomodoroSessions, setPomodoroSessions] = useState(0)
  const [targetTime, setTargetTime] = useState(POMODORO_WORK_TIME)
  const [countdownMinutes, setCountdownMinutes] = useState(25)
  const [showCountdownSetter, setShowCountdownSetter] = useState(false)
  
  // カスタムドロップダウンの開閉状態
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 音声通知用
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 教科カテゴリーの定義（問題作成ファイルと統一）
  const SUBJECT_CATEGORIES = {
    mathematics: {
      name: '数学',
      subjects: {
        math1: { name: '数学Ⅰ', units: ['数と式', '図形と計量', '2次関数', 'データの分析'] },
        mathA: { name: '数学A', units: ['場合の数と確率', '整数の性質', '図形の性質'] },
        math2: { name: '数学Ⅱ', units: ['式と証明', '複素数と方程式', '図形と方程式', '三角関数', '指数関数・対数関数', '微分法と積分法'] },
        mathB: { name: '数学B', units: ['数列', '統計的な推測'] },
        mathC: { name: '数学C', units: ['ベクトル', '平面上の曲線と複素数平面'] },
        math3: { name: '数学Ⅲ', units: ['極限', '微分法', '積分法'] }
      }
    },
    japanese: {
      name: '国語',
      subjects: {
        japanese: { 
          name: '国語', 
          units: ['現代文（評論）', '現代文（物語）', '古文', '漢文'] 
        }
      }
    },
    english: {
      name: '英語',
      subjects: {
        englishReading: { 
          name: '英語リーディング', 
          units: ['総合問題'] // 英語は単元なし
        }
      }
    },
    science: {
      name: '理科',
      subjects: {
        physicsBase: { name: '物理基礎', units: ['運動の表し方', '様々な力とその働き', '力学的エネルギー', '熱', '波', '電気', 'エネルギーの利用'] },
        physics: { name: '物理', units: ['様々な運動', '波', '電気と磁気', '原子'] },
        chemistryBase: { name: '化学基礎', units: ['物質の構成', '物質の変化', '化学反応', '化学が拓く世界'] },
        chemistry: { name: '化学', units: ['物質の状態と平衡', '物質の変化と平衡', '無機物質', '有機化合物', '高分子化合物'] },
        biologyBase: { name: '生物基礎', units: ['生物の特徴', '遺伝子とその働き', '生物の体内環境の維持', '生物の多様性と生態系'] },
        biology: { name: '生物', units: ['生命現象と物質', '生殖と発生', '生物の環境応答', '生態と環境', '生物の進化と系統'] },
        earthScienceBase: { name: '地学基礎', units: ['宇宙における地球', '変動する地球', '大気と海洋', '地球の環境'] },
        earthScience: { name: '地学', units: ['地球の概観', '地球の活動と歴史', '地球の大気と海洋', '宇宙の構造'] }
      }
    },
    socialStudies: {
      name: '地理歴史・公民',
      subjects: {
        geographyComprehensive: { name: '地理総合', units: ['地図と地理情報システム', '国際理解と国際協力', '持続可能な地域づくり', '防災'] },
        geography: { name: '地理探究', units: ['現代世界の系統地理的考察', '現代世界の地誌的考察', '現代日本に求められる国土像'] },
        historyComprehensive: { name: '歴史総合', units: ['近代化と私たち', '国際秩序の変化や大衆化と私たち', 'グローバル化と私たち'] },
        japaneseHistory: { name: '日本史探究', units: ['原始・古代の日本と東アジア', '中世の日本と世界', '近世の日本と世界', '近現代の地域・日本と世界'] },
        worldHistory: { name: '世界史探究', units: ['世界史への扉', '諸地域の歴史的特質の形成', '諸地域の交流・再編', '諸地域の結合・変容', '地球世界の到来'] },
        civicsBase: { name: '公共', units: ['公共の扉', '自立した主体としてよりよい社会の形成に参画する私たち', '持続可能な社会づくりの主体となる私たち'] },
        ethics: { name: '倫理', units: ['現代に生きる自己の課題と人間としての在り方生き方', '国際社会に生きる日本人としての自覚'] },
        politicsEconomics: { name: '政治・経済', units: ['現代日本における政治・経済の諸課題', 'グローバル化する国際社会の諸課題'] }
      }
    },
    information: {
      name: '情報',
      subjects: {
        information1: { name: '情報Ⅰ', units: ['情報社会の問題解決', 'コミュニケーションと情報デザイン', 'コンピュータとプログラミング', '情報通信ネットワークとデータの活用'] }
      }
    }
  }

  // カテゴリーに基づく科目の取得
  const getSubjectsByCategory = (categoryId: string) => {
    return Object.entries(SUBJECT_CATEGORIES[categoryId]?.subjects || {}).map(([id, subject]) => ({
      id,
      name: subject.name,
      units: subject.units
    }))
  }

  // 単元の取得
  const getUnitsBySubject = (categoryId: string, subjectId: string) => {
    const subject = SUBJECT_CATEGORIES[categoryId]?.subjects[subjectId]
    return subject?.units?.map((unit, index) => ({
      id: `${subjectId}_unit_${index}`,
      name: unit
    })) || []
  }

  // 高精度タイマーのアップデート関数
  const updateTimer = useCallback(() => {
    if (!startTimeRef.current || isPaused || !isActive) return
    
    const now = performance.now()
    const elapsedMs = now - startTimeRef.current + pausedTimeRef.current
    const elapsedSeconds = Math.floor(elapsedMs / 1000)
    
    // 秒が変わった時のみ更新
    if (elapsedSeconds !== lastUpdateRef.current && elapsedSeconds >= 0 && elapsedSeconds < 86400) {
      lastUpdateRef.current = elapsedSeconds
      
      if (timerMode === 'countup') {
        setSeconds(elapsedSeconds)
      } else {
        // ポモドーロモード・カウントダウンモード: カウントダウン
        const remainingSeconds = targetTime - elapsedSeconds
        
        if (remainingSeconds <= 0) {
          // タイマー終了
          if (timerMode === 'pomodoro') {
            handlePomodoroComplete()
          } else {
            // カウントダウン終了
            handleCountdownComplete()
          }
        } else {
          setSeconds(remainingSeconds)
        }
      }
    }
    
    if (isActive && !isPaused) {
      animationFrameRef.current = requestAnimationFrame(updateTimer)
    }
  }, [isActive, isPaused, timerMode, targetTime])

  // ポモドーロ完了処理
  const handlePomodoroComplete = () => {
    // 音声通知
    playNotificationSound()
    
    // タイマーを一時停止
    setIsPaused(true)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    if (pomodoroState === 'work') {
      // 作業セッション完了
      const newSessions = pomodoroSessions + 1
      setPomodoroSessions(newSessions)
      
      // 次の状態を決定
      if (newSessions % POMODORO_SESSIONS_BEFORE_LONG_BREAK === 0) {
        setPomodoroState('longBreak')
        setTargetTime(POMODORO_LONG_BREAK_TIME)
        toast({
          title: '🎉 お疲れさまでした！',
          description: `${newSessions}セッション完了！長い休憩を取りましょう（${POMODORO_LONG_BREAK_TIME / 60}分）`,
        })
      } else {
        setPomodoroState('break')
        setTargetTime(POMODORO_BREAK_TIME)
        toast({
          title: '✅ セッション完了！',
          description: `休憩時間です（${POMODORO_BREAK_TIME / 60}分）`,
        })
      }
    } else {
      // 休憩完了
      setPomodoroState('work')
      setTargetTime(POMODORO_WORK_TIME)
      toast({
        title: '💪 休憩終了！',
        description: '次のセッションを開始しましょう',
      })
    }
    
    // タイマーリセット
    startTimeRef.current = null
    pausedTimeRef.current = 0
    lastUpdateRef.current = 0
  }

  // カウントダウン完了処理
  const handleCountdownComplete = () => {
    // 音声通知
    playNotificationSound()
    
    // タイマーを停止
    setIsActive(false)
    setIsPaused(false)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    
    toast({
      title: '⏰ タイマー終了！',
      description: `${countdownMinutes}分のタイマーが終了しました`,
    })
    
    // フィードバックフォームを表示
    setShowFeedbackForm(true)
  }

  // 通知音の再生
  const playNotificationSound = () => {
    try {
      // シンプルなビープ音を生成
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.error('Failed to play notification sound:', error)
    }
  }

  // Timer logic with requestAnimationFrame
  useEffect(() => {
    if (isActive && !isPaused) {
      if (!startTimeRef.current) {
        startTimeRef.current = performance.now()
      }
      animationFrameRef.current = requestAnimationFrame(updateTimer)
    } else if (isPaused && startTimeRef.current) {
      // 一時停止時の経過時間を保存
      pausedTimeRef.current += performance.now() - startTimeRef.current
      startTimeRef.current = null
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isActive, isPaused, updateTimer])

  // タイマーモード変更時の処理
  const handleTimerModeChange = (mode: TimerMode) => {
    if (isActive) {
      toast({
        title: 'エラー',
        description: 'タイマー実行中はモードを変更できません',
        variant: 'destructive'
      })
      return
    }
    
    setTimerMode(mode)
    if (mode === 'pomodoro') {
      setSeconds(POMODORO_WORK_TIME)
      setTargetTime(POMODORO_WORK_TIME)
      setPomodoroState('work')
      setPomodoroSessions(0)
    } else if (mode === 'countdown') {
      setSeconds(countdownMinutes * 60)
      setTargetTime(countdownMinutes * 60)
      setShowCountdownSetter(true)
    } else {
      setSeconds(0)
    }
  }

  // カウントダウン時間の設定
  const handleCountdownTimeSet = (minutes: number) => {
    setCountdownMinutes(minutes)
    setSeconds(minutes * 60)
    setTargetTime(minutes * 60)
    setShowCountdownSetter(false)
  }

  // 認証状態の確認
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        setError('ログインが必要です')
      } else {
        setError(null)
      }
    })
    
    return () => unsubscribe()
  }, [])

  // ページ離脱警告
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isActive && sessionId) {
        e.preventDefault()
        e.returnValue = '学習が進行中です。このまま離れると記録が失われる可能性があります。'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isActive, sessionId])

  // ドロップダウンの外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdown])

  // カスタムドロップダウンコンポーネント（インラインスタイル版）
  const CustomDropdown = ({ 
    value, 
    onChange, 
    options, 
    placeholder, 
    disabled, 
    id 
  }: {
    value: string
    onChange: (value: string) => void
    options: Array<{ id: string; name: string }>
    placeholder: string
    disabled?: boolean
    id: string
  }) => {
    const isOpen = openDropdown === id
    const selectedOption = options.find(opt => opt.id === value)

    const dropdownStyles = {
      wrapper: {
        position: 'relative' as const,
        width: '100%'
      },
      button: {
        width: '100%',
        height: '48px',
        padding: '0 48px 0 16px',
        backgroundColor: disabled ? '#f5f5f5' : 'white',
        border: `2px solid ${isOpen ? '#667eea' : '#e5e7eb'}`,
        borderRadius: '12px',
        fontSize: '15px',
        fontWeight: 500,
        color: disabled ? '#9e9e9e' : '#2d3436',
        cursor: disabled ? 'not-allowed' : 'pointer',
        outline: 'none',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        textAlign: 'left' as const,
        position: 'relative' as const,
        boxShadow: isOpen ? '0 0 0 3px rgba(102, 126, 234, 0.1)' : 'none'
      },
      buttonHover: {
        borderColor: '#667eea'
      },
      placeholder: {
        color: '#9e9e9e'
      },
      icon: {
        position: 'absolute' as const,
        right: '16px',
        top: '50%',
        transform: `translateY(-50%) ${isOpen ? 'rotate(180deg)' : ''}`,
        transition: 'transform 0.2s ease',
        color: '#636e72',
        pointerEvents: 'none' as const,
        width: '20px',
        height: '20px'
      },
      list: {
        position: 'absolute' as const,
        top: 'calc(100% + 8px)',
        left: 0,
        right: 0,
        backgroundColor: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
        padding: '8px',
        zIndex: 1000,
        maxHeight: '280px',
        overflowY: 'auto' as const
      },
      option: {
        width: '100%',
        padding: '14px 16px',
        marginBottom: '4px',
        borderRadius: '8px',
        fontSize: '15px',
        fontWeight: 500,
        color: '#2d3436',
        backgroundColor: 'white',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        textAlign: 'left' as const,
        display: 'block'
      },
      optionHover: {
        backgroundColor: '#f0f0f0'
      },
      optionSelected: {
        backgroundColor: '#667eea',
        color: 'white'
      },
      mobileButton: {
        height: '44px',
        fontSize: '16px',
        padding: '0 44px 0 16px',
        borderRadius: '10px'
      },
      mobileIcon: {
        right: '14px',
        width: '18px',
        height: '18px'
      },
      mobileList: {
        maxHeight: '240px',
        padding: '6px'
      },
      mobileOption: {
        padding: '16px',
        fontSize: '16px',
        marginBottom: '2px'
      }
    }

    const isMobile = window.innerWidth <= 640

    return (
      <div style={dropdownStyles.wrapper}>
        <button
          style={{
            ...dropdownStyles.button,
            ...(isMobile && dropdownStyles.mobileButton)
          }}
          onClick={() => !disabled && setOpenDropdown(isOpen ? null : id)}
          disabled={disabled}
          type="button"
          onMouseEnter={(e) => {
            if (!disabled && !isOpen) {
              e.currentTarget.style.borderColor = '#667eea'
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && !isOpen) {
              e.currentTarget.style.borderColor = '#e5e7eb'
            }
          }}
        >
          <span style={!selectedOption ? dropdownStyles.placeholder : {}}>
            {selectedOption?.name || placeholder}
          </span>
          <svg
            style={{
              ...dropdownStyles.icon,
              ...(isMobile && dropdownStyles.mobileIcon)
            }}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        
        {isOpen && !disabled && (
          <div 
            style={{
              ...dropdownStyles.list,
              ...(isMobile && dropdownStyles.mobileList)
            }} 
            ref={dropdownRef}
          >
            {options.map(option => (
              <button
                key={option.id}
                style={{
                  ...dropdownStyles.option,
                  ...(value === option.id && dropdownStyles.optionSelected),
                  ...(isMobile && dropdownStyles.mobileOption)
                }}
                onClick={() => {
                  onChange(option.id)
                  setOpenDropdown(null)
                }}
                type="button"
                onMouseEnter={(e) => {
                  if (value !== option.id) {
                    e.currentTarget.style.backgroundColor = '#f0f0f0'
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== option.id) {
                    e.currentTarget.style.backgroundColor = 'white'
                  }
                }}
              >
                {option.name}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 時間のフォーマット
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 集中度スコアの計算
  const calculateFocusScore = () => {
    if (timerMode === 'countup') {
      if (seconds === 0) return 100
      const totalTime = seconds
      const activeTime = totalTime - (pauseCount * 30)
      const focusRate = (activeTime / totalTime) * 100
      const breakPenalty = Math.min(breaks * 5, 30)
      return Math.max(0, Math.round(focusRate - breakPenalty))
    } else {
      // カウントダウン・ポモドーロモード
      const elapsedTime = targetTime - seconds
      if (elapsedTime === 0) return 100
      const activeTime = elapsedTime - (pauseCount * 30)
      const focusRate = (activeTime / elapsedTime) * 100
      const breakPenalty = timerMode === 'pomodoro' ? 0 : Math.min(breaks * 5, 30)
      return Math.max(0, Math.round(focusRate - breakPenalty))
    }
  }

  // 学習内容フォームの表示
  const handleShowContentForm = () => {
    if (!selectedCategory || !selectedSubject || !selectedUnit) {
      toast({
        title: 'エラー',
        description: '教科、科目、単元を選択してください',
        variant: 'destructive'
      })
      return
    }
    setShowContentForm(true)
  }

  // 学習内容なしで即座に開始
  const handleQuickStart = async () => {
    if (!selectedCategory || !selectedSubject || !selectedUnit) {
      toast({
        title: 'エラー',
        description: '教科、科目、単元を選択してください',
        variant: 'destructive'
      })
      return
    }

    // デフォルトの学習内容を設定
    const defaultContent: StudyContent = {
      mainTheme: '学習内容未設定',
      subTopics: [],
      materials: [],
      goals: []
    }
    
    await handleContentSubmit(defaultContent)
  }

  // 学習内容の設定とタイマー開始
  const handleContentSubmit = async (content: StudyContent, skipForm = false) => {
    setStudyContent(content)
    setLoading(true)
    setError(null)
    
    // 認証確認
    const user = auth.currentUser
    if (!user) {
      setError('ログインが必要です')
      toast({
        title: 'エラー',
        description: 'タイマーを使用するにはログインが必要です',
        variant: 'destructive'
      })
      setLoading(false)
      return
    }
    
    try {
      // Firebase統合: セッション開始
      const result = await startTimerSessionWithContent(
        selectedSubject,  // 科目ID（例：math1）
        selectedUnit,     // 単元ID
        content
      )
      
      if (result.success && result.sessionId) {
        setSessionId(result.sessionId)
        setIsActive(true)
        
        setActiveTimer({
          sessionId: result.sessionId,
          startTime: Date.now(),
          subject: `${SUBJECT_CATEGORIES[selectedCategory]?.name} - ${SUBJECT_CATEGORIES[selectedCategory]?.subjects[selectedSubject]?.name}`,
          unit: getUnitsBySubject(selectedCategory, selectedSubject).find(u => u.id === selectedUnit)?.name || '',
          content,
          elapsedTime: 0
        })
        
        // タイマーのリセット
        startTimeRef.current = performance.now()
        pausedTimeRef.current = 0
        lastUpdateRef.current = 0
        
        // フォームをスキップしていない場合のみ閉じる
        if (!skipForm) {
          setShowContentForm(false)
        }
        
        toast({
          title: '学習開始',
          description: skipForm ? 'タイマーを開始しました（学習内容は後で設定できます）' : 'タイマーを開始しました',
        })
      } else {
        throw new Error('セッションの開始に失敗しました')
      }
    } catch (error: any) {
      setError(error.message || 'タイマーの開始に失敗しました')
      toast({
        title: 'エラー',
        description: error.message || 'タイマーの開始に失敗しました',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // 一時停止/再開
  const handlePauseResume = async () => {
    if (!sessionId) return
    
    setLoading(true)
    try {
      const result = await toggleTimerPause(sessionId)
      if (result.success) {
        if (!isPaused) {
          // 一時停止
          setPauseCount(pauseCount + 1)
          updateActiveTimer({ isPaused: true, pausedAt: Date.now() })
        } else {
          // 再開時は新しい開始時間を設定
          startTimeRef.current = performance.now()
          updateActiveTimer({ isPaused: false, pausedAt: undefined })
        }
        setIsPaused(!isPaused)
        toast({
          title: isPaused ? '再開' : '一時停止',
          description: isPaused ? 'タイマーを再開しました' : 'タイマーを一時停止しました',
        })
      }
    } catch (error: any) {
      toast({
        title: 'エラー',
        description: '操作に失敗しました',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // 休憩
  const handleBreak = async () => {
    if (!sessionId) return
    
    setLoading(true)
    try {
      const result = await recordBreak(sessionId)
      if (result.success) {
        setBreaks(breaks + 1)
        toast({
          title: '休憩',
          description: '休憩を記録しました',
        })
      }
    } catch (error: any) {
      toast({
        title: 'エラー',
        description: '休憩の記録に失敗しました',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // 学習内容の更新
  const handleContentUpdate = async (newContent: StudyContent) => {
    if (!sessionId) return
    
    try {
      const result = await updateStudyContent(sessionId, newContent)
      if (result.success) {
        setStudyContent(newContent)
        updateActiveTimer({ content: newContent })
        toast({
          title: '更新完了',
          description: '学習内容を更新しました',
        })
      }
    } catch (error: any) {
      toast({
        title: 'エラー',
        description: '学習内容の更新に失敗しました',
        variant: 'destructive'
      })
    }
  }

  // タイマー停止
  const handleStop = () => {
    setIsActive(false)
    setIsPaused(false)
    setShowContentForm(false)
    setShowFeedbackForm(true)
  }

  // フィードバック送信後の処理
  const handleFeedbackSubmit = () => {
    const totalTime = timerMode === 'countup' ? seconds : (targetTime - seconds)
    toast({
      title: '学習終了',
      description: `学習時間: ${formatTime(totalTime)}`,
    })
    
    // リセット
    if (timerMode === 'pomodoro') {
      setSeconds(POMODORO_WORK_TIME)
      setPomodoroState('work')
      setPomodoroSessions(0)
      setTargetTime(POMODORO_WORK_TIME)
    } else if (timerMode === 'countdown') {
      setSeconds(countdownMinutes * 60)
      setTargetTime(countdownMinutes * 60)
    } else {
      setSeconds(0)
    }
    
    setSelectedCategory('')
    setSelectedSubject('')
    setSelectedUnit('')
    setStudyContent(null)
    setBreaks(0)
    setPauseCount(0)
    setSessionId(null)
    setError(null)
    clearActiveTimer()
    
    // 高精度タイマーのリセット
    startTimeRef.current = null
    pausedTimeRef.current = 0
    lastUpdateRef.current = 0
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  return (
    <>
      <style jsx>{`
        .timer-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .timer-box {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .timer-mode-selector {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          background: #f5f5f5;
          padding: 4px;
          border-radius: 12px;
        }
        
        .timer-mode-button {
          flex: 1;
          padding: 10px 16px;
          border: none;
          background: transparent;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #636e72;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        
        .timer-mode-button.active {
          background: white;
          color: #667eea;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .timer-mode-button:hover:not(.active) {
          color: #2d3436;
        }
        
        .timer-display {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .timer-value {
          font-size: 64px;
          font-weight: 700;
          font-family: 'Monaco', 'Menlo', monospace;
          color: #2d3436;
          letter-spacing: 2px;
        }
        
        .timer-value.countdown {
          color: #9b59b6;
        }
        
        .timer-value.pomodoro-work {
          color: #e74c3c;
        }
        
        .timer-value.pomodoro-break {
          color: #27ae60;
        }
        
        .timer-value.pomodoro-longBreak {
          color: #3498db;
        }
        
        .pomodoro-state {
          display: inline-block;
          padding: 6px 16px;
          background: #f0f0f0;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          color: #636e72;
          margin-bottom: 16px;
        }
        
        .pomodoro-state.work {
          background: #fee;
          color: #e74c3c;
        }
        
        .pomodoro-state.break {
          background: #efe;
          color: #27ae60;
        }
        
        .pomodoro-state.longBreak {
          background: #e6f2ff;
          color: #3498db;
        }
        
        .timer-status {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin-top: 16px;
        }
        
        .status-item {
          text-align: center;
        }
        
        .status-label {
          font-size: 12px;
          color: #636e72;
          margin-bottom: 4px;
        }
        
        .status-value {
          font-size: 18px;
          font-weight: 600;
          color: #2d3436;
        }
        
        .button-group {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          min-width: 140px;
          justify-content: center;
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .btn-secondary {
          background: #e0e0e0;
          color: #2d3436;
        }
        
        .btn-secondary:hover:not(:disabled) {
          background: #bdc3c7;
        }
        
        .btn-outline {
          background: white;
          color: #2d3436;
          border: 2px solid #e0e0e0;
        }
        
        .btn-outline:hover:not(:disabled) {
          border-color: #667eea;
          color: #667eea;
        }
        
        .btn-danger {
          background: #e74c3c;
          color: white;
        }
        
        .btn-danger:hover:not(:disabled) {
          background: #c0392b;
        }
        
        .btn-success {
          background: #27ae60;
          color: white;
        }
        
        .btn-success:hover:not(:disabled) {
          background: #229954;
        }
        
        .btn-warning {
          background: #f39c12;
          color: white;
        }
        
        .btn-warning:hover:not(:disabled) {
          background: #e67e22;
        }
        
        .countdown-setter {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
          text-align: center;
        }
        
        .countdown-setter-title {
          font-size: 16px;
          font-weight: 600;
          color: #2d3436;
          margin-bottom: 16px;
        }
        
        .preset-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 16px;
        }
        
        .preset-button {
          padding: 8px 16px;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #636e72;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .preset-button:hover {
          border-color: #9b59b6;
          color: #9b59b6;
        }
        
        .preset-button.active {
          background: #9b59b6;
          color: white;
          border-color: #9b59b6;
        }
        
        .custom-time-input {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
        }
        
        .time-input {
          width: 80px;
          padding: 8px 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          text-align: center;
          outline: none;
        }
        
        .time-input:focus {
          border-color: #9b59b6;
        }
        
        .time-unit {
          font-size: 14px;
          color: #636e72;
        }
        
        .error-box {
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 8px;
          padding: 12px 16px;
          color: #c0392b;
          font-size: 14px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .error-link {
          color: #e74c3c;
          text-decoration: underline;
          cursor: pointer;
        }
        
        .content-box {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin-top: 24px;
        }
        
        .content-header {
          font-size: 16px;
          font-weight: 600;
          color: #2d3436;
          margin-bottom: 16px;
        }
        
        .content-section {
          margin-bottom: 16px;
        }
        
        .content-section:last-child {
          margin-bottom: 0;
        }
        
        .content-label {
          font-size: 14px;
          font-weight: 600;
          color: #636e72;
          margin-bottom: 8px;
        }
        
        .content-text {
          font-size: 14px;
          color: #2d3436;
        }
        
        .badge-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .badge {
          display: inline-block;
          padding: 4px 12px;
          background: #e0e0e0;
          color: #2d3436;
          border-radius: 16px;
          font-size: 12px;
        }
        
        .goal-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .goal-item {
          font-size: 14px;
          color: #2d3436;
          padding-left: 16px;
          position: relative;
          margin-bottom: 4px;
        }
        
        .goal-item:before {
          content: '•';
          position: absolute;
          left: 0;
          color: #667eea;
        }
        
        .add-content-btn {
          width: 100%;
          margin-top: 24px;
          background: white;
          border: 2px dashed #667eea;
          color: #667eea;
          padding: 16px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .add-content-btn:hover {
          background: #f8f9fa;
          border-color: #764ba2;
          color: #764ba2;
        }
        
        /* モバイル専用スタイル */
        @media (max-width: 640px) {
          .timer-container {
            padding: 0 12px;
            padding-bottom: 80px;
          }
          
          .timer-box {
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .timer-mode-selector {
            margin-bottom: 16px;
          }
          
          .timer-mode-button {
            font-size: 12px;
            padding: 8px 12px;
          }
          
          .timer-display {
            margin-bottom: 20px;
          }
          
          .timer-value {
            font-size: 40px;
            letter-spacing: 1px;
          }
          
          .pomodoro-state {
            font-size: 12px;
            padding: 4px 12px;
            margin-bottom: 12px;
          }
          
          .timer-status {
            gap: 16px;
            margin-top: 12px;
          }
          
          .status-label {
            font-size: 11px;
          }
          
          .status-value {
            font-size: 16px;
          }
          
          .button-group {
            gap: 8px;
          }
          
          .btn {
            min-width: auto;
            padding: 10px 16px;
            font-size: 13px;
            border-radius: 10px;
          }
          
          .btn svg {
            width: 16px;
            height: 16px;
          }
          
          .countdown-setter {
            padding: 16px;
            margin-bottom: 16px;
          }
          
          .countdown-setter-title {
            font-size: 14px;
            margin-bottom: 12px;
          }
          
          .preset-buttons {
            gap: 6px;
            margin-bottom: 12px;
          }
          
          .preset-button {
            padding: 6px 12px;
            font-size: 12px;
          }
          
          .custom-time-input {
            margin-top: 12px;
          }
          
          .time-input {
            width: 60px;
            padding: 6px 10px;
            font-size: 14px;
          }
          
          .time-unit {
            font-size: 12px;
          }
          
          .error-box {
            font-size: 12px;
            padding: 10px 12px;
            margin-bottom: 12px;
          }
          
          .content-box {
            padding: 16px;
            margin-top: 16px;
            border-radius: 10px;
          }
          
          .content-header {
            font-size: 14px;
            margin-bottom: 12px;
          }
          
          .content-section {
            margin-bottom: 12px;
          }
          
          .content-label {
            font-size: 12px;
            margin-bottom: 6px;
          }
          
          .content-text {
            font-size: 13px;
          }
          
          .badge {
            font-size: 11px;
            padding: 3px 10px;
          }
          
          .goal-item {
            font-size: 13px;
          }
          
          .add-content-btn {
            margin-top: 16px;
            padding: 12px;
            font-size: 14px;
          }
        }
      `}</style>

      <div className="timer-container">
        {/* エラー表示 */}
        {error && (
          <div className="error-box">
            <AlertCircle size={16} />
            <span>{error}</span>
            {error.includes('ログイン') && (
              <a className="error-link" onClick={() => window.location.href = '/auth/signin'}>
                ログインページへ
              </a>
            )}
          </div>
        )}

        <div className="timer-box">
          {/* タイマーモード選択 */}
          {!isActive && (
            <div className="timer-mode-selector">
              <button
                className={`timer-mode-button ${timerMode === 'countup' ? 'active' : ''}`}
                onClick={() => handleTimerModeChange('countup')}
              >
                <TrendingUp size={16} />
                カウントアップ
              </button>
              <button
                className={`timer-mode-button ${timerMode === 'countdown' ? 'active' : ''}`}
                onClick={() => handleTimerModeChange('countdown')}
              >
                <Clock size={16} />
                カウントダウン
              </button>
              <button
                className={`timer-mode-button ${timerMode === 'pomodoro' ? 'active' : ''}`}
                onClick={() => handleTimerModeChange('pomodoro')}
              >
                <Timer size={16} />
                ポモドーロ
              </button>
            </div>
          )}

          {/* カウントダウン時間設定 */}
          {!isActive && timerMode === 'countdown' && showCountdownSetter && (
            <div className="countdown-setter">
              <h3 className="countdown-setter-title">タイマー時間を設定</h3>
              <div className="preset-buttons">
                {COUNTDOWN_PRESETS.map(minutes => (
                  <button
                    key={minutes}
                    className={`preset-button ${countdownMinutes === minutes ? 'active' : ''}`}
                    onClick={() => handleCountdownTimeSet(minutes)}
                  >
                    {minutes}分
                  </button>
                ))}
              </div>
              <div className="custom-time-input">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={countdownMinutes}
                  onChange={(e) => {
                    const value = Math.max(1, Math.min(180, parseInt(e.target.value) || 1))
                    setCountdownMinutes(value)
                    handleCountdownTimeSet(value)
                  }}
                  className="time-input"
                />
                <span className="time-unit">分</span>
              </div>
            </div>
          )}

          {/* タイマー表示 */}
          <div className="timer-display">
            {timerMode === 'pomodoro' && isActive && (
              <div className={`pomodoro-state ${pomodoroState}`}>
                {pomodoroState === 'work' ? '作業中' : pomodoroState === 'break' ? '休憩中' : '長い休憩中'}
              </div>
            )}
            
            <div className={`timer-value ${timerMode === 'countdown' ? 'countdown' : ''} ${timerMode === 'pomodoro' ? `pomodoro-${pomodoroState}` : ''}`}>
              {formatTime(seconds)}
            </div>
            
            {isActive && (
              <div className="timer-status">
                <div className="status-item">
                  <div className="status-label">集中度</div>
                  <div className="status-value">{calculateFocusScore()}%</div>
                </div>
                {timerMode === 'pomodoro' ? (
                  <div className="status-item">
                    <div className="status-label">セッション</div>
                    <div className="status-value">{pomodoroSessions}回</div>
                  </div>
                ) : (
                  <div className="status-item">
                    <div className="status-label">休憩</div>
                    <div className="status-value">{breaks}回</div>
                  </div>
                )}
                <div className="status-item">
                  <div className="status-label">停止</div>
                  <div className="status-value">{pauseCount}回</div>
                </div>
              </div>
            )}
          </div>

          {/* 教科・科目・単元選択 */}
          {!isActive && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth <= 640 ? '1fr' : 'repeat(3, 1fr)',
                gap: window.innerWidth <= 640 ? '12px' : '16px',
                marginBottom: '24px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{
                    fontSize: window.innerWidth <= 640 ? '12px' : '14px',
                    fontWeight: 600,
                    color: '#636e72',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <BookOpen size={window.innerWidth <= 640 ? 14 : 16} style={{ color: '#667eea' }} />
                    <span>教科</span>
                  </label>
                  <CustomDropdown
                    id="category"
                    value={selectedCategory}
                    onChange={(value) => {
                      setSelectedCategory(value)
                      setSelectedSubject('')
                      setSelectedUnit('')
                    }}
                    options={Object.entries(SUBJECT_CATEGORIES).map(([id, cat]) => ({ id, name: cat.name }))}
                    placeholder="教科を選択"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{
                    fontSize: window.innerWidth <= 640 ? '12px' : '14px',
                    fontWeight: 600,
                    color: '#636e72',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <BookOpen size={window.innerWidth <= 640 ? 14 : 16} style={{ color: '#667eea' }} />
                    <span>科目</span>
                  </label>
                  <CustomDropdown
                    id="subject"
                    value={selectedSubject}
                    onChange={(value) => {
                      setSelectedSubject(value)
                      setSelectedUnit('')
                    }}
                    options={getSubjectsByCategory(selectedCategory)}
                    placeholder="科目を選択"
                    disabled={!selectedCategory}
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{
                    fontSize: window.innerWidth <= 640 ? '12px' : '14px',
                    fontWeight: 600,
                    color: '#636e72',
                    marginBottom: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Target size={window.innerWidth <= 640 ? 14 : 16} style={{ color: '#667eea' }} />
                    <span>単元</span>
                  </label>
                  <CustomDropdown
                    id="unit"
                    value={selectedUnit}
                    onChange={setSelectedUnit}
                    options={getUnitsBySubject(selectedCategory, selectedSubject)}
                    placeholder="単元を選択"
                    disabled={!selectedSubject}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 操作ボタン */}
          <div className="button-group">
            {!isActive ? (
              <>
                <button 
                  className="btn btn-primary"
                  onClick={handleQuickStart}
                  disabled={!selectedCategory || !selectedSubject || !selectedUnit || loading}
                >
                  <Play size={20} />
                  すぐに開始
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={handleShowContentForm}
                  disabled={!selectedCategory || !selectedSubject || !selectedUnit || loading}
                >
                  <Edit size={20} />
                  内容設定
                </button>
              </>
            ) : (
              <>
                <button 
                  className={`btn ${isPaused ? 'btn-success' : 'btn-warning'}`}
                  onClick={handlePauseResume}
                  disabled={loading}
                >
                  {isPaused ? (
                    <>
                      <Play size={20} />
                      再開
                    </>
                  ) : (
                    <>
                      <Pause size={20} />
                      一時停止
                    </>
                  )}
                </button>
                
                {timerMode === 'countup' && (
                  <button 
                    className="btn btn-outline"
                    onClick={handleBreak}
                    disabled={isPaused || loading}
                  >
                    <Coffee size={20} />
                    休憩
                  </button>
                )}
                
                <button 
                  className="btn btn-danger"
                  onClick={handleStop}
                  disabled={loading}
                >
                  <Square size={20} />
                  終了
                </button>
              </>
            )}
          </div>

          {/* 学習内容表示 */}
          {studyContent && isActive && studyContent.mainTheme !== '学習内容未設定' && (
            <div className="content-box">
              <h3 className="content-header">学習内容</h3>
              
              <div className="content-section">
                <div className="content-label">学習テーマ</div>
                <div className="content-text">{studyContent.mainTheme}</div>
              </div>
              
              {studyContent.subTopics.length > 0 && (
                <div className="content-section">
                  <div className="content-label">サブトピック</div>
                  <div className="badge-list">
                    {studyContent.subTopics.map((topic, i) => (
                      <span key={i} className="badge">{topic}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {studyContent.goals.length > 0 && (
               <div className="content-section">
                 <div className="content-label">目標</div>
                 <ul className="goal-list">
                   {studyContent.goals.slice(0, 3).map((goal, i) => (
                     <li key={i} className="goal-item">{goal}</li>
                   ))}
                   {studyContent.goals.length > 3 && (
                     <li className="goal-item" style={{ fontStyle: 'italic', color: '#636e72' }}>
                       他{studyContent.goals.length - 3}件
                     </li>
                   )}
                 </ul>
               </div>
             )}
             
             <button
               className="btn btn-outline"
               onClick={() => setShowContentForm(true)}
               style={{ width: '100%', marginTop: '16px' }}
             >
               <Edit size={18} />
               学習内容を編集
             </button>
           </div>
         )}

         {/* 学習内容未設定時の追加ボタン */}
         {isActive && studyContent?.mainTheme === '学習内容未設定' && (
           <button
             className="add-content-btn"
             onClick={() => setShowContentForm(true)}
           >
             <Plus size={20} />
             学習内容を追加
           </button>
         )}
       </div>
     </div>

     {/* 学習内容フォーム */}
     {!showFeedbackForm && (
       <StudyContentForm
         open={showContentForm}
         onClose={() => setShowContentForm(false)}
         onSubmit={isActive ? handleContentUpdate : handleContentSubmit}
         sessionId={sessionId}
         isUpdate={isActive}
       />
     )}

     {/* フィードバックフォーム */}
     <StudyFeedbackForm
       open={showFeedbackForm}
       onClose={() => setShowFeedbackForm(false)}
       onSubmit={handleFeedbackSubmit}
       sessionId={sessionId}
       elapsedTime={timerMode === 'countup' ? seconds : (targetTime - seconds)}
     />
   </>
 )
}