'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { getUserProfile } from '@/lib/firebase/firestore'
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { getStudyTimeStats, getEfficiencyAnalysis, calculateUserStreak, getWeakSubjects, getUserLevel } from '@/lib/firebase/improved-analytics'
import { getActiveSchedule, getDailyTasksForDate } from '@/lib/firebase/schedule'
import type { DailyStudyPlan, StudySession } from '@/lib/firebase/schedule'
import { getUserScheduleSettings, updateUserScheduleSettings } from '@/lib/firebase/dailyChallenge'
import { useDailyChallengeAutoUpdate } from '@/hooks/useDailyChallengeAutoUpdate'
import { 
  generateAffiliateLink, 
  trackAffiliateClick, 
  getPersonalizedRecommendations,
  AffiliateProduct 
} from '@/lib/amazon/affiliate'
import { Settings, Sun, Moon, Clock, Bell, BookOpen, ArrowRight, Calendar, Target, Timer, ChevronRight, Brain, X } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface UserData {
  displayName: string | null
  studyTime: number
  currentStreak: number
  subjects: string[]
  hasData: boolean
}

interface SubjectData {
  name: string
  progress: number
  studyTime: number
  problemCount: number
  accuracy: number
  streak: number
  color: string
}

interface RecentProblem {
  id: string
  question: string
  subject: string
  difficulty: string
  createdAt: Timestamp
  unit?: string
  topic?: string
}

// Base64エンコードされたプレースホルダー画像
const PLACEHOLDER_SVG = 'data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPgogIAogIDwhLS0g6Y+J562GIC0tPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDUwLCA0MCkiPgogICAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZmZkOTNkIiByeD0iMiIvPgogICAgPHBvbHlnb24gcG9pbnRzPSIwLDgwIDEwLDkwIDIwLDgwIiBmaWxsPSIjZjhiNTAwIi8+CiAgICA8cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMjAiIGhlaWdodD0iMTUiIGZpbGw9IiNmZjZiNmIiIHJ4PSIyIi8+CiAgICA8cmVjdCB4PSIwIiB5PSIxNSIgd2lkdGg9IjIwIiBoZWlnaHQ9IjgiIGZpbGw9IiM0ZWNkYzQiLz4KICAgIDxyZWN0IHg9IjgiIHk9IjcwIiB3aWR0aD0iNCIgaGVpZ2h0PSIxMCIgZmlsbD0iIzMzMyIvPgogICAgPHBvbHlnb24gcG9pbnRzPSI4LDgwIDEwLDkwIDEyLDgwIiBmaWxsPSIjMzMzIi8+CiAgPC9nPgogIAogIDwhLS0g44OO44O844OIIC0tPgogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDkwLCA2MCkiPgogICAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZmZmIiBzdHJva2U9IiNkZGQiIHN0cm9rZS13aWR0aD0iMiIgcng9IjMiLz4KICAgIDxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMCIgaGVpZ2h0PSI4MCIgZmlsbD0iI2ZmNmI2YiIgcng9IjMiLz4KICAgIDxjaXJjbGUgY3g9IjUiIGN5PSIxMCIgcj0iMiIgZmlsbD0iI2ZmZiIvPgogICAgPGNpcmNsZSBjeD0iNSIgY3k9IjIwIiByPSIyIiBmaWxsPSIjZmZmIi8+CiAgICA8Y2lyY2xlIGN4PSI1IiBjeT0iMzAiIHI9IjIiIGZpbGw9IiNmZmYiLz4KICAgIDxjaXJjbGUgY3g9IjUiIGN5PSI0MCIgcj0iMiIgZmlsbD0iI2ZmZiIvPgogICAgPGNpcmNsZSBjeD0iNSIgY3k9IjUwIiByPSIyIiBmaWxsPSIjZmZmIi8+CiAgICA8Y2lyY2xlIGN4PSI1IiBjeT0iNjAiIHI9IjIiIGZpbGw9IiNmZmYiLz4KICAgIDxjaXJjbGUgY3g9IjUiIGN5PSI3MCIgcj0iMiIgZmlsbD0iI2ZmZiIvPgogIDwvZz4KPC9zdmc+'

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [greeting, setGreeting] = useState('こんにちは')
  const [currentDate, setCurrentDate] = useState('')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  
  // ユーザーデータ
  const [userData, setUserData] = useState<UserData>({
    displayName: null,
    studyTime: 0,
    currentStreak: 0,
    subjects: [],
    hasData: false
  })
  const [displaySubjects, setDisplaySubjects] = useState<SubjectData[]>([])
  
  // チャレンジ関連
  const [dailyChallenge, setDailyChallenge] = useState<any>(null)
  const [challengeTimeLeft, setChallengeTimeLeft] = useState<string>('')
  const [showNewChallengeNotification, setShowNewChallengeNotification] = useState(false)
  const [showTimeSettings, setShowTimeSettings] = useState(false)
  const [scheduleSettings, setScheduleSettings] = useState({
    morningTime: '07:00',
    eveningTime: '20:00',
    enableMorning: true,
    enableEvening: true,
    notificationsEnabled: true
  })
  const [savingSettings, setSavingSettings] = useState(false)
  
  // スケジュール関連
  const [todaySchedule, setTodaySchedule] = useState<DailyStudyPlan | null>(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  
  // 問題関連
  const [recentProblems, setRecentProblems] = useState<RecentProblem[]>([])
  const [problemsLoading, setProblemsLoading] = useState(false)
  
  // アフィリエイト関連
  const [affiliateProducts, setAffiliateProducts] = useState<AffiliateProduct[]>([])
  const [affiliateLoading, setAffiliateLoading] = useState(true)
  
  // デイリーチャレンジ自動更新フック
  const {
    dailyChallenge: autoUpdatedChallenge,
    isLoading: isChallengeLoading,
    scheduleSettings: autoScheduleSettings,
    checkForNewChallenge,
    hasNewChallenge
  } = useDailyChallengeAutoUpdate({ user: currentUser })
  
  const subjectColors: { [key: string]: string } = {
    '現代文': '#10b981',
    '古文': '#059669',
    '漢文': '#047857',
    '世界史A': '#f97316',
    '世界史B': '#ea580c',
    '日本史A': '#dc2626',
    '日本史B': '#b91c1c',
    '地理A': '#06b6d4',
    '地理B': '#0891b2',
    '現代社会': '#a855f7',
    '倫理': '#9333ea',
    '政治・経済': '#7c3aed',
    '倫理、政治・経済': '#6d28d9',
    '数学I': '#3b82f6',
    '数学I・A': '#2563eb',
    '数学II': '#1d4ed8',
    '数学II・B': '#1e40af',
    '数学III': '#1e3a8a',
    '数学A': '#2563eb',
    '数学B': '#1e40af',
    '数学C': '#1e3a8a',
    '簿記・会計': '#312e81',
    '情報関係基礎': '#4338ca',
    '物理基礎': '#f59e0b',
    '物理': '#d97706',
    '化学基礎': '#8b5cf6',
    '化学': '#7c3aed',
    '生物基礎': '#ec4899',
    '生物': '#db2777',
    '地学基礎': '#14b8a6',
    '地学': '#0d9488',
    '英語（リーディング）': '#ef4444',
    '英語（リスニング）': '#dc2626',
    'ドイツ語': '#991b1b',
    'フランス語': '#7f1d1d',
    '中国語': '#450a0a',
    '韓国語': '#7c2d12'
  }

  const getSubjectColor = (subject: string): string => {
    return subjectColors[subject] || '#6b7280'
  }

  const loadAffiliateProducts = async (userId: string) => {
    setAffiliateLoading(true)
    try {
      const [weakSubjects, userLevel, studyStats] = await Promise.all([
        getWeakSubjects(userId).catch(() => []),
        getUserLevel(userId).catch(() => 'beginner' as const),
        getStudyTimeStats(userId, 'month').catch(() => ({ 
          monthlyTotal: 0,
          todayTime: 0,
          weeklyTotal: 0,
          weeklyTrend: [],
          subjectDistribution: []
        }))
      ])
      
      const totalStudyHours = Math.floor(studyStats.monthlyTotal)
      
      const recommendations = await getPersonalizedRecommendations({
        userId,
        weakSubjects: weakSubjects.length > 0 ? weakSubjects : undefined,
        userLevel,
        studyHours: totalStudyHours
      })
      
      setAffiliateProducts(recommendations)
    } catch (error) {
      console.error('Error loading affiliate products:', error)
      const defaultRecommendations = await getPersonalizedRecommendations({
        userId,
        userLevel: 'beginner',
        studyHours: 0
      })
      setAffiliateProducts(defaultRecommendations)
    } finally {
      setAffiliateLoading(false)
    }
  }

  const loadTodaySchedule = async (userId: string) => {
    try {
      setScheduleLoading(true)
      const activeSchedule = await getActiveSchedule(userId)
      
      if (activeSchedule?.id) {
        const today = new Date()
        const dailyTasks = await getDailyTasksForDate(activeSchedule.id, today)
        setTodaySchedule(dailyTasks)
      } else {
        setTodaySchedule(null)
      }
    } catch (error) {
      console.error('Error loading today schedule:', error)
      setTodaySchedule(null)
    } finally {
      setScheduleLoading(false)
    }
  }

  const loadRecentProblems = async (userId: string) => {
    try {
      setProblemsLoading(true)
      const problemsQuery = query(
        collection(db, 'problems'),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(3)
      )
      
      const snapshot = await getDocs(problemsQuery)
      const problems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RecentProblem[]
      
      const validProblems = problems.filter(p => 
        p.question && 
        p.question.trim() !== '' &&
        !p.question.includes('問題文の生成に失敗しました')
      )
      
      setRecentProblems(validProblems)
    } catch (error) {
      console.error('Error loading recent problems:', error)
      setRecentProblems([])
    } finally {
      setProblemsLoading(false)
    }
  }

  const refreshUserData = async () => {
    const user = currentUser || auth.currentUser
    if (!user) return

    try {
      setLoading(true)
      const userProfile = await getUserProfile(user.uid)
      console.log('Refreshed user profile:', userProfile)
      
      const studyStats = await getStudyTimeStats(user.uid, 'month')
      const currentStreak = await calculateUserStreak(user.uid)
      
      loadAffiliateProducts(user.uid)
      loadTodaySchedule(user.uid)
      loadRecentProblems(user.uid)
      
      if (userProfile && userProfile.subjects) {
        const subjectKeys = Object.keys(userProfile.subjects)
        console.log('Refreshed subject keys:', subjectKeys)
        
        const userData: UserData = {
          displayName: userProfile.displayName || user.displayName,
          studyTime: Math.floor(studyStats.monthlyTotal * 60),
          currentStreak: currentStreak,
          subjects: subjectKeys,
          hasData: true
        }
        setUserData(userData)
        
        if (subjectKeys.length > 0) {
          await generateSubjectCardsWithAnalytics(userData, user.uid)
        } else {
          console.log('No subjects found in profile')
          setDisplaySubjects([])
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateChallengeManually = async () => {
    if (!currentUser) return
    
    try {
      console.log('Manually generating challenge...')
      const { getDailyChallenge } = await import('@/lib/firebase/dailyChallenge')
      const newChallenge = await getDailyChallenge(currentUser.uid)
      
      if (newChallenge) {
        console.log('Manual challenge generated:', newChallenge)
        await checkForNewChallenge()
      }
    } catch (error) {
      console.error('Error generating challenge manually:', error)
    }
  }

  const startDailyChallenge = () => {
    if (dailyChallenge) {
      router.push(`/problems/daily-challenge/${dailyChallenge.id}`)
    }
  }

  const handleSaveTimeSettings = async () => {
    if (!currentUser) return
    
    setSavingSettings(true)
    try {
      await updateUserScheduleSettings(currentUser.uid, scheduleSettings)
      setShowTimeSettings(false)
    } catch (error) {
      console.error('Error saving time settings:', error)
    } finally {
      setSavingSettings(false)
    }
  }

  const handleProductClick = (product: AffiliateProduct, userId: string) => {
    trackAffiliateClick(product, userId)
    
    const affiliateUrl = generateAffiliateLink(product.asin)
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer')
  }

  const getRandomSubjects = (subjects: string[], count: number): string[] => {
    const shuffled = [...subjects].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(count, subjects.length))
  }

  const generateSubjectCardsWithAnalytics = async (userData: UserData, userId: string) => {
    try {
      const studyStats = await getStudyTimeStats(userId, 'month')
      const efficiencyData = await getEfficiencyAnalysis(userId, 'month')
      
      let selectedSubjects: string[] = []
      
      if (userData.subjects && userData.subjects.length > 0) {
        const subjectDataFromStats = studyStats.subjectDistribution
          .filter(s => userData.subjects.includes(s.subject))
          .slice(0, 4)
          .map(s => s.subject)
        
        const remainingSubjects = userData.subjects.filter(s => !subjectDataFromStats.includes(s))
        selectedSubjects = [...subjectDataFromStats, ...remainingSubjects].slice(0, 4)
        
        const subjectDataArray: SubjectData[] = selectedSubjects.map(subjectName => {
          const statsData = studyStats.subjectDistribution.find(s => s.subject === subjectName)
          const efficiencyInfo = efficiencyData.subjectEfficiency.find(s => s.subject === subjectName)
          
          return {
            name: subjectName,
            studyTime: statsData ? Math.floor(statsData.time * 60) : 0,
            progress: statsData ? Math.min(Math.floor((statsData.time / 100) * 100), 100) : 0,
            accuracy: efficiencyInfo ? Math.floor(efficiencyInfo.efficiency) : 0,
            problemCount: 0,
            streak: 0,
            color: getSubjectColor(subjectName)
          }
        })
        
        setDisplaySubjects(subjectDataArray)
      } else {
        setDisplaySubjects([])
      }
    } catch (error) {
      console.error('Error generating subject cards with analytics:', error)
      generateSubjectCards(userData)
    }
  }

  const generateSubjectCards = (userData: UserData) => {
    let selectedSubjects: string[]
    
    if (userData.subjects && userData.subjects.length > 0) {
      selectedSubjects = userData.subjects.length <= 4 
        ? userData.subjects 
        : getRandomSubjects(userData.subjects, 4)
    } else {
      selectedSubjects = []
    }
    
    const subjectDataArray: SubjectData[] = selectedSubjects.map(subject => ({
      name: subject,
      progress: userData.hasData ? Math.floor(Math.random() * 100) : 0,
      studyTime: userData.hasData ? Math.floor(Math.random() * 120) : 0,
      problemCount: userData.hasData ? Math.floor(Math.random() * 50) : 0,
      accuracy: userData.hasData ? Math.floor(Math.random() * 100) : 0,
      streak: userData.hasData ? Math.floor(Math.random() * 10) : 0,
      color: getSubjectColor(subject)
    }))
    
    setDisplaySubjects(subjectDataArray)
  }

  const getStudyTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'concept': '概念学習',
      'practice': '問題演習',
      'review': '復習',
      'test': 'テスト'
    }
    return labels[type] || type
  }

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }
  
  const getDifficultyInfo = (difficulty: string) => {
    const difficultyMap = {
      easy: { label: '基礎', color: '#10b981', bg: '#d1fae5' },
      medium: { label: '標準', color: '#3b82f6', bg: '#dbeafe' },
      hard: { label: '発展', color: '#8b5cf6', bg: '#e9d5ff' }
    }
    return difficultyMap[difficulty as keyof typeof difficultyMap] || difficultyMap.medium
  }

  const getUserData = (): UserData => {
    return {
      displayName: null,
      studyTime: 0,
      currentStreak: 0,
      subjects: [],
      hasData: false
    }
  }

  // 初期化（挨拶と日付設定）
  useEffect(() => {
    const now = new Date()
    const hour = now.getHours()
    
    let greetingText = 'こんにちは'
    if (hour < 12) greetingText = 'おはようございます'
    else if (hour >= 18) greetingText = 'こんばんは'
    
    setGreeting(greetingText)
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long' 
    }
    const dateStr = now.toLocaleDateString('ja-JP', options)
    setCurrentDate(dateStr)
  }, [])

  // 認証状態監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)
      
      if (user) {
        try {
          const userProfile = await getUserProfile(user.uid)
          console.log('User profile:', userProfile)
          
          const studyStats = await getStudyTimeStats(user.uid, 'month')
          const currentStreak = await calculateUserStreak(user.uid)
          
          loadAffiliateProducts(user.uid)
          loadTodaySchedule(user.uid)
          loadRecentProblems(user.uid)
          
          if (userProfile && userProfile.subjects) {
            const subjectKeys = Object.keys(userProfile.subjects)
            console.log('Subject keys:', subjectKeys)
            
            const userData: UserData = {
              displayName: userProfile.displayName || user.displayName,
              studyTime: Math.floor(studyStats.monthlyTotal * 60),
              currentStreak: currentStreak,
              subjects: subjectKeys,
              hasData: true
            }
            setUserData(userData)
            
            if (subjectKeys.length > 0) {
              await generateSubjectCardsWithAnalytics(userData, user.uid)
            } else {
              console.log('No subjects found in profile')
              setDisplaySubjects([])
            }
          } else {
            console.log('No profile or subjects')
            const mockUserData = getUserData()
            setUserData(mockUserData)
            generateSubjectCards(mockUserData)
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          const mockUserData = getUserData()
          setUserData(mockUserData)
          generateSubjectCards(mockUserData)
        }
      } else {
        const mockUserData = getUserData()
        setUserData(mockUserData)
        generateSubjectCards(mockUserData)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // チャレンジ時間更新
  useEffect(() => {
    const updateTimeLeft = () => {
      if (dailyChallenge && dailyChallenge.expiresAt) {
        const now = new Date()
        const expires = new Date(dailyChallenge.expiresAt)
        const diff = expires.getTime() - now.getTime()
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          setChallengeTimeLeft(`${hours}時間${minutes}分`)
        } else {
          setChallengeTimeLeft('期限切れ')
        }
      }
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 60000)

    return () => clearInterval(interval)
  }, [dailyChallenge])

  // データ自動更新
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    const handleFocus = () => {
      if (isRefreshing) return
      
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        console.log('Page focused, refreshing data...')
        setIsRefreshing(true)
        refreshUserData().finally(() => {
          setIsRefreshing(false)
        })
      }, 500)
    }

    window.addEventListener('focus', handleFocus)
    
    if (document.visibilityState === 'visible' && !isRefreshing) {
      setIsRefreshing(true)
      refreshUserData().finally(() => {
        setIsRefreshing(false)
      })
    }

    return () => {
      window.removeEventListener('focus', handleFocus)
      clearTimeout(timeoutId)
    }
  }, [currentUser])

  // デイリーチャレンジ監視
  useEffect(() => {
    console.log('Auto updated challenge:', autoUpdatedChallenge)
    if (autoUpdatedChallenge) {
      setDailyChallenge(autoUpdatedChallenge)
      
      if (hasNewChallenge) {
        setShowNewChallengeNotification(true)
        
        setTimeout(() => {
          setShowNewChallengeNotification(false)
        }, 5000)
      }
    }
  }, [autoUpdatedChallenge, hasNewChallenge])

  useEffect(() => {
    setScheduleSettings(autoScheduleSettings)
  }, [autoScheduleSettings])

  // URLパラメータ処理（削除済みのサブスクリプション関連を除く）
  useEffect(() => {
    const updated = searchParams.get('updated')
    
    if (updated === 'true') {
      console.log('Settings updated, refreshing data...')
      refreshUserData()
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams])

  const progressOffset = userData.hasData 
    ? 565 - (565 * Math.min(userData.studyTime / 120, 1))
    : 565

  const hours = Math.floor(userData.studyTime / 60)
  const minutes = userData.studyTime % 60
  const timeDisplay = `${hours}:${minutes.toString().padStart(2, '0')}`

  return (
    <>
      <style jsx global>{`
        .main-content {
          padding: 12px;
          max-width: 370px;
          margin: 0 auto;
        }
        
        .greeting-section {
          text-align: center;
          margin-bottom: 16px;
        }
        
        .greeting {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 2px;
        }
        
        .date {
          font-size: 11px;
          opacity: 0.7;
        }
        
        .welcome-message {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          text-align: center;
        }
        
        .welcome-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 6px;
          color: #3b82f6;
        }
        
        .welcome-text {
          font-size: 11px;
          color: #636e72;
          line-height: 1.5;
        }
        
        /* 科目設定促進バナー */
        .subject-setup-banner {
          background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 16px rgba(253, 203, 110, 0.3);
          position: relative;
          overflow: hidden;
        }
        
        .subject-setup-banner::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 200px;
          height: 200px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
        }
        
        .banner-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          color: #2d3436;
        }
        
        .banner-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }
        
        .banner-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 6px;
        }
        
        .banner-description {
          font-size: 12px;
          margin-bottom: 16px;
          opacity: 0.9;
          max-width: 280px;
          line-height: 1.5;
        }
        
        .banner-button {
          background: #2d3436;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        
        .banner-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(45, 52, 54, 0.3);
        }
        
        .banner-note {
          font-size: 10px;
          margin-top: 12px;
          opacity: 0.7;
        }
        
        /* 本日の学習スケジュール */
        .today-schedule-section {
          margin-bottom: 16px;
        }
        
        .today-schedule-card {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 2px 12px rgba(79, 70, 229, 0.25);
          position: relative;
          overflow: hidden;
          color: white;
        }
        
        .today-schedule-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 150px;
          height: 150px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }
        
        .schedule-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
        }
        
        .schedule-title-section {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .schedule-icon {
          width: 24px;
          height: 24px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .schedule-title {
          font-size: 13px;
          font-weight: 700;
        }
        
        .schedule-link {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 500;
          color: white;
          text-decoration: none;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 2px;
        }
        
        .schedule-link:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .schedule-sessions {
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
          z-index: 1;
        }
        
        .session-item {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 8px;
          padding: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s ease;
        }
        
        .session-item:hover {
          background: rgba(255, 255, 255, 0.15);
          transform: translateX(1px);
        }
        
        .session-info {
          flex: 1;
        }
        
        .session-time {
          font-size: 9px;
          opacity: 0.9;
          margin-bottom: 1px;
        }
        
        .session-subject {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 2px;
        }
        
        .session-details {
          display: flex;
          gap: 6px;
          font-size: 9px;
          opacity: 0.8;
          flex-wrap: wrap;
        }
        
        .session-detail-item {
          display: flex;
          align-items: center;
          gap: 1px;
        }
        
        .session-type-badge {
          background: rgba(255, 255, 255, 0.2);
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 9px;
          font-weight: 500;
        }
        
        .schedule-summary {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          z-index: 1;
        }
        
        .summary-item {
          text-align: center;
        }
        
        .summary-value {
          font-size: 14px;
          font-weight: 700;
          display: block;
        }
        
        .summary-label {
          font-size: 9px;
          opacity: 0.8;
          margin-top: 1px;
        }
        
        .no-schedule-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          box-shadow: 0 1px 6px rgba(0,0,0,0.05);
        }
        
        .no-schedule-icon {
          width: 40px;
          height: 40px;
          background: #f3f4f6;
          border-radius: 50%;
          margin: 0 auto 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .no-schedule-title {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 6px;
          color: #1f2937;
        }
        
        .no-schedule-text {
          font-size: 10px;
          color: #6b7280;
          margin-bottom: 12px;
          line-height: 1.4;
        }
        
        .create-schedule-button {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        
        .create-schedule-button:hover {
          background: #4338ca;
          transform: translateY(-1px);
        }
        
        /* 新しいチャレンジ通知のスタイル */
        .new-challenge-notification {
          position: fixed;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
          z-index: 1000;
          animation: slideDown 0.3s ease-out;
          display: flex;
          align-items: center;
          gap: 8px;
          max-width: 90%;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -100%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        
        .notification-icon {
          width: 20px;
          height: 20px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .notification-content {
          flex: 1;
        }
        
        .notification-title {
          font-weight: 600;
          margin-bottom: 2px;
          font-size: 12px;
        }
        
        .notification-text {
          font-size: 11px;
          opacity: 0.9;
        }
        
        .notification-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 2px;
          opacity: 0.8;
          transition: opacity 0.2s;
          font-size: 12px;
        }
        
        .notification-close:hover {
          opacity: 1;
        }
        
        /* チャレンジカードのスタイル */
        .challenges-section {
          margin-bottom: 16px;
        }
        
        .challenges-grid {
          display: grid;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        /* デイリーチャレンジカード */
        .daily-challenge-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 2px 12px rgba(102, 126, 234, 0.25);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .daily-challenge-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.35);
        }
        
        /* チャレンジカードのパルスアニメーション（新規時） */
        .daily-challenge-card.new-challenge {
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 2px 12px rgba(102, 126, 234, 0.25);
          }
          50% {
            box-shadow: 0 2px 16px rgba(102, 126, 234, 0.5);
          }
        }
        
        .daily-challenge-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 120px;
          height: 120px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }
        
        .challenge-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
        }
        
        .challenge-title-section {
          color: white;
        }
        
        .challenge-label {
          font-size: 9px;
          font-weight: 500;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 1px;
        }
        
        .challenge-title {
          font-size: 14px;
          font-weight: 700;
        }
        
        .challenge-time {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 9px;
          font-weight: 500;
          color: white;
        }
        
        .challenge-content {
          position: relative;
          z-index: 1;
        }
        
        .challenge-subject-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 4px 8px;
          border-radius: 12px;
          margin-bottom: 6px;
          color: white;
          font-size: 10px;
          font-weight: 500;
        }
        
        .challenge-info {
          display: flex;
          gap: 12px;
          margin-bottom: 10px;
          color: white;
        }
        
        .challenge-info-item {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        
        .challenge-info-label {
          font-size: 9px;
          opacity: 0.8;
        }
        
        .challenge-info-value {
          font-size: 12px;
          font-weight: 600;
        }
        
        .challenge-button {
          background: white;
          color: #667eea;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }
        
        .challenge-button:hover {
          transform: scale(1.01);
        }
        
        .challenge-button.completed {
          background: rgba(255, 255, 255, 0.3);
          color: white;
          cursor: default;
        }
        
        .challenge-button.completed:hover {
          transform: none;
        }
        
        /* 時間設定ボタン */
        .time-settings-button {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: none;
          padding: 4px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: white;
        }
        
        .time-settings-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        /* 手動生成ボタン */
        .manual-generate-button {
          background: #10b981;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 6px;
          transition: all 0.2s ease;
        }
        
        .manual-generate-button:hover {
          background: #059669;
          transform: translateY(-1px);
        }
        
        /* 時間設定モーダル */
        .time-settings-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        
        .time-settings-content {
          background: white;
          border-radius: 12px;
          padding: 20px;
          max-width: 350px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .time-settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .time-settings-title {
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .time-settings-close {
          background: none;
          border: none;
          padding: 6px;
          cursor: pointer;
          color: #6b7280;
        }
        
        .time-setting-item {
          margin-bottom: 20px;
        }
        
        .time-setting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .time-setting-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
        }
        
        .toggle-switch {
          position: relative;
          width: 36px;
          height: 20px;
          background: #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        
        .toggle-switch.active {
          background: #3b82f6;
        }
        
        .toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          transition: transform 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        
        .toggle-switch.active .toggle-thumb {
          transform: translateX(16px);
        }
        
        .time-input-group {
          margin-left: 22px;
        }
        
        .time-input-label {
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 6px;
        }
        
        .time-input {
          width: 100px;
          padding: 6px 10px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 12px;
        }
        
        .time-input:focus {
          outline: none;
          border-color: #3b82f6;
        }
        
        .time-hint {
          font-size: 10px;
          color: #9ca3af;
          margin-top: 4px;
          line-height: 1.4;
        }
        
        .time-settings-footer {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        
        .time-settings-cancel {
          flex: 1;
          padding: 8px 16px;
          background: #f3f4f6;
          color: #374151;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        }
        
        .time-settings-save {
          flex: 1;
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
        }
        
        .time-settings-save:disabled {
          background: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
        }
        
        /* 既存のスタイル */
        .progress-ring-container {
          position: relative;
          width: 200px;
          height: 200px;
          margin: 0 auto 20px;
          transition: transform 0.2s ease;
        }
        
        .progress-ring-container:hover {
          transform: scale(1.02);
        }
        
        .progress-ring {
          transform: rotate(-90deg);
        }
        
        .ring-bg {
          fill: none;
          stroke: rgba(255,255,255,0.3);
          stroke-width: 16;
        }
        
        .ring-progress {
          fill: none;
          stroke: #6c5ce7;
          stroke-width: 16;
          stroke-linecap: round;
          stroke-dasharray: 565;
          stroke-dashoffset: 565;
          transition: stroke-dashoffset 0.5s ease;
        }
        
        .ring-content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }
        
        .total-time {
          font-size: 36px;
          font-weight: 700;
          line-height: 1;
        }
        
        .time-label {
          font-size: 11px;
          opacity: 0.7;
          margin-top: 6px;
        }
        
        .streak-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: white;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 500;
          margin-top: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .streak-badge::before {
          content: '🔥';
          font-size: 12px;
        }
        
        .streak-badge.no-streak {
          opacity: 0.5;
        }
        
        .subjects-overview {
          margin-bottom: 16px;
        }
        
        .section-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        
        .subject-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        
        .subject-card {
          background: white;
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease;
          cursor: pointer;
          text-decoration: none;
          color: inherit;
          display: block;
        }
        
        .subject-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .subject-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
        }
        
        .subject-card[data-subject]::before { 
          background: var(--subject-color);
        }
        
        .subject-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .subject-name {
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          opacity: 0.8;
        }
        
        .subject-menu {
          width: 16px;
          height: 16px;
          background: none;
          border: none;
          color: #636e72;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .subject-menu::after {
          content: '•••';
          font-size: 12px;
          letter-spacing: 1px;
        }
        
        .subject-main-info {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 10px;
        }
        
        .subject-time {
          font-size: 24px;
          font-weight: 700;
        }
        
        .subject-unit {
          font-size: 11px;
          color: #636e72;
        }
        
        .subject-chart {
          position: relative;
          width: 56px;
          height: 56px;
          margin: 0 auto 8px;
        }
        
        .circular-chart {
          transform: rotate(-90deg);
        }
        
        .chart-bg {
          fill: none;
          stroke: #f0f0f0;
          stroke-width: 6;
        }
        
        .chart-progress {
          fill: none;
          stroke-width: 6;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.5s ease;
          stroke-dasharray: 226;
          stroke-dashoffset: 226;
        }
        
        .subject-card[data-subject] .chart-progress { 
          stroke: var(--subject-color);
        }
        
        .chart-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 14px;
          font-weight: 700;
        }
        
        .subject-stats {
          display: flex;
          justify-content: space-between;
          padding-top: 8px;
          border-top: 1px solid #f0f0f0;
        }
        
        .stat-item {
          text-align: center;
          flex: 1;
        }
        
        .stat-value {
          font-size: 12px;
          font-weight: 600;
          display: block;
        }
        
        .stat-label {
          font-size: 8px;
          color: #636e72;
          text-transform: uppercase;
          margin-top: 1px;
        }
        
        .empty-schedule {
          background: white;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          margin-bottom: 16px;
        }
        
        .empty-icon {
          width: 56px;
          height: 56px;
          background: #f0f0f0;
          border-radius: 50%;
          margin: 0 auto 12px;
        }
        
        .empty-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 6px;
        }
        
        .empty-text {
          font-size: 11px;
          color: #636e72;
          margin-bottom: 16px;
        }
        
        .empty-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
        }
        
        .quick-start {
          display: block;
          margin: 0 auto 16px;
          background: #6c5ce7;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 24px;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 4px 16px rgba(108, 92, 231, 0.3);
          cursor: pointer;
        }
        
        /* アフィリエイトセクション */
        .affiliate-section {
          margin: 32px 0 20px;
        }
        
        .affiliate-loading {
          text-align: center;
          padding: 40px 16px;
          background: #f8f9fa;
          border-radius: 16px;
        }
        
        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #ff9900;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 12px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading-text {
          font-size: 11px;
          color: #6b7280;
        }
        
        .affiliate-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        
        .affiliate-card {
          background: white;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
          position: relative;
        }
        
        .affiliate-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .recommendation-badge {
          position: absolute;
          top: 4px;
          left: 4px;
          right: 4px;
          background: rgba(59, 130, 246, 0.95);
          color: white;
          padding: 2px 4px;
          border-radius: 10px;
          font-size: 8px;
          font-weight: 600;
          z-index: 1;
          text-align: center;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .product-image-container {
          width: 100%;
          height: 90px;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
        }
        
        .product-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        
        .product-info {
          padding: 8px 6px;
        }
        
        .product-title {
          font-size: 10px;
          font-weight: 600;
          line-height: 1.2;
          margin-bottom: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          color: #111;
        }
        
        .product-description {
          display: none;
        }
        
        .product-footer {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .product-price {
          display: flex;
          align-items: baseline;
          gap: 1px;
          justify-content: center;
        }
        
        .price-symbol {
          font-size: 9px;
          color: #B12704;
        }
        
        .price-value {
          font-size: 13px;
          font-weight: 700;
          color: #B12704;
        }
        
        .buy-button {
          display: flex;
          align-items: center;
          gap: 2px;
          background: #FFD814;
          color: #0F1111;
          border: 1px solid #FCD200;
          padding: 3px 6px;
          border-radius: 10px;
          font-size: 9px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          justify-content: center;
        }
        
        .buy-button:hover {
          background: #F7CA00;
          border-color: #F2C200;
        }
        
        .amazon-logo {
          height: 8px;
          width: auto;
        }
        
        .affiliate-disclaimer {
          margin-top: 16px;
          text-align: center;
          font-size: 9px;
          color: #9ca3af;
        }
        
        /* 直近の問題セクション */
        .recent-problems-section {
          margin: 16px 0;
        }
        
        .recent-problems-card {
          background: white;
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 1px 6px rgba(0,0,0,0.05);
        }
        
        .recent-problems-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .recent-problems-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .recent-problems-icon {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .view-all-link {
          color: #6366f1;
          text-decoration: none;
          font-size: 10px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 1px;
          transition: all 0.2s ease;
        }
        
        .view-all-link:hover {
          color: #4f46e5;
          transform: translateX(1px);
        }
        
        .recent-problems-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .recent-problem-item {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 8px 8px 6px 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          color: inherit;
          display: block;
        }
        
        .recent-problem-item:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
          transform: translateX(1px);
        }
        
        .problem-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        
        .problem-info {
          flex: 1;
        }
        
        .problem-meta {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 4px;
        }
        
        .problem-subject {
          font-size: 9px;
          font-weight: 600;
          padding: 1px 4px;
          border-radius: 3px;
          background: white;
          border: 1px solid #e5e7eb;
        }
        
        .problem-difficulty {
          font-size: 9px;
          font-weight: 500;
          padding: 1px 4px;
          border-radius: 3px;
        }
        
        .problem-question {
          font-size: 10px;
          line-height: 1.3;
          color: #374151;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .problem-date {
          font-size: 9px;
          color: #9ca3af;
          margin-top: 2px;
        }
        
        .problem-arrow {
          color: #9ca3af;
          flex-shrink: 0;
          margin-top: 2px;
        }
        
        .no-problems {
          text-align: center;
          padding: 20px;
          color: #6b7280;
        }
        
        .no-problems-icon {
          margin: 0 auto 10px;
          color: #d1d5db;
        }
        
        .create-problem-button {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 10px;
          transition: all 0.2s ease;
        }
        
        .create-problem-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
        }
      `}</style>

      {/* 新しいチャレンジの通知 */}
      {showNewChallengeNotification && dailyChallenge && (
        <div className="new-challenge-notification">
          <div className="notification-icon">
            🎯
          </div>
          <div className="notification-content">
            <div className="notification-title">新しいデイリーチャレンジ！</div>
            <div className="notification-text">
              {dailyChallenge.subject}の{dailyChallenge.timeSlot === 'morning' ? '朝' : '夜'}のチャレンジが開始されました
            </div>
          </div>
          <button 
            className="notification-close"
            onClick={() => setShowNewChallengeNotification(false)}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        <div className="greeting-section">
          <div className="greeting">
            {greeting}{userData.displayName && `、${userData.displayName}さん`}
          </div>
          <div className="date">{currentDate}</div>
        </div>
        
        {/* Welcome Message for New Users */}
        {!userData.hasData && (
          <div className="welcome-message">
            <div className="welcome-title">ようこそ A-IStudy へ！</div>
            <div className="welcome-text">
              まずは学習したい科目を選んで、今日の学習を始めましょう。<br />
              毎日の学習記録が自動的に保存され、あなたの成長を可視化します。
            </div>
          </div>
        )}
        
        {/* 科目未設定時の促進バナー（hasDataがtrueで科目が0の場合のみ表示） */}
        {userData.subjects.length === 0 && userData.hasData && (
          <div className="subject-setup-banner">
            <div className="banner-content">
              <div className="banner-icon">
                <BookOpen size={24} color="#2d3436" />
              </div>
              <h2 className="banner-title">
                受験科目を設定しましょう
              </h2>
              <p className="banner-description">
                科目を設定することで、あなた専用の学習プランが作成されます。
                AIが最適な問題を選んで出題します。
              </p>
              <button className="banner-button" onClick={() => router.push('/settings')}>
                科目を設定する
                <ArrowRight size={16} />
              </button>
              <p className="banner-note">
                ※ 科目未設定でも全科目からランダムに出題されます
              </p>
            </div>
          </div>
        )}
        
        {/* 本日の学習スケジュール */}
        {userData.hasData && (
          <section className="today-schedule-section">
            <h2 className="section-title">本日の学習スケジュール</h2>
            
            {scheduleLoading ? (
              <div className="today-schedule-card">
                <div className="schedule-header">
                  <div className="schedule-title-section">
                    <div className="schedule-icon">
                      <Calendar size={16} />
                    </div>
                    <div className="schedule-title">読み込み中...</div>
                  </div>
                </div>
              </div>
            ) : todaySchedule ? (
              <div className="today-schedule-card">
                <div className="schedule-header">
                  <div className="schedule-title-section">
                    <div className="schedule-icon">
                      <Calendar size={20} />
                    </div>
                    <div className="schedule-title">今日の学習プラン</div>
                  </div>
                  <Link href="/schedule" className="schedule-link">
                    詳細
                    <ArrowRight size={12} />
                  </Link>
                </div>
                
                <div className="schedule-sessions">
                  {todaySchedule.studySessions.slice(0, 3).map((session, index) => (
                    <div key={index} className="session-item">
                      <div className="session-info">
                        <div className="session-time">
                          {session.startTime} - {session.endTime}
                        </div>
                        <div className="session-subject">{session.subject}</div>
                        <div className="session-details">
                          <div className="session-detail-item">
                            <Target size={10} />
                            {session.unit}
                          </div>
                          <div className="session-detail-item">
                            <Timer size={10} />
                            {Math.round(timeToMinutes(session.endTime) - timeToMinutes(session.startTime))}分
                          </div>
                          {session.targetProblems > 0 && (
                            <div className="session-detail-item">
                              📝 {session.targetProblems}問
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="session-type-badge">
                        {getStudyTypeLabel(session.studyType)}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="schedule-summary">
                  <div className="summary-item">
                    <span className="summary-value">
                      {Math.round(todaySchedule.totalStudyMinutes / 60)}h
                      {todaySchedule.totalStudyMinutes % 60 > 0 && `${todaySchedule.totalStudyMinutes % 60}m`}
                    </span>
                    <span className="summary-label">総学習時間</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-value">{todaySchedule.studySessions.length}</span>
                    <span className="summary-label">セッション</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-value">{todaySchedule.focusSubjects.length}</span>
                    <span className="summary-label">科目数</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-schedule-card">
                <div className="no-schedule-icon">
                  <Calendar size={28} color="#9ca3af" />
                </div>
                <h3 className="no-schedule-title">学習スケジュールが設定されていません</h3>
                <p className="no-schedule-text">
                  AIがあなたの目標と現在の実力から最適な学習プランを作成します。
                </p>
                <button 
                  className="create-schedule-button"
                  onClick={() => router.push('/schedule')}
                >
                  <Target size={16} />
                  学習プランを作成
                </button>
              </div>
            )}
          </section>
        )}
        
        {/* Challenges Section - デイリーチャレンジのみ */}
        <div className="challenges-section">
          <div className="challenges-grid">
            {/* Daily Challenge Card - 新規チャレンジ時にアニメーション追加 */}
            {dailyChallenge && (
              <div 
                className={`daily-challenge-card ${hasNewChallenge ? 'new-challenge' : ''}`}
                style={{ position: 'relative' }}
              >
                <button
                  className="time-settings-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowTimeSettings(true)
                  }}
                >
                  <Settings size={14} />
                </button>
                
                <div onClick={!dailyChallenge.completed ? startDailyChallenge : undefined}>
                  <div className="challenge-header">
                    <div className="challenge-title-section">
                      <div className="challenge-label">本日のチャレンジ</div>
                      <div className="challenge-title">デイリーチャレンジ</div>
                    </div>
                    <div className="challenge-time">
                      残り {challengeTimeLeft}
                    </div>
                  </div>
                  <div className="challenge-content">
                    <div className="challenge-subject-badge">
                      <span style={{ color: getSubjectColor(dailyChallenge.subject) }}>●</span>
                      {dailyChallenge.subject}
                    </div>
                    <div className="challenge-info">
                      <div className="challenge-info-item">
                        <span className="challenge-info-label">問題数</span>
                        <span className="challenge-info-value">{dailyChallenge.problemCount}問</span>
                      </div>
                      <div className="challenge-info-item">
                        <span className="challenge-info-label">難易度</span>
                        <span className="challenge-info-value">
                          {dailyChallenge.difficulty === 'easy' ? '基礎' : 
                           dailyChallenge.difficulty === 'medium' ? '標準' : '応用'}
                        </span>
                      </div>
                      <div className="challenge-info-item">
                        <span className="challenge-info-label">報酬</span>
                        <span className="challenge-info-value">+50 XP</span>
                      </div>
                    </div>
                    <button className={`challenge-button ${dailyChallenge.completed ? 'completed' : ''}`}>
                      {dailyChallenge.completed ? '✓ 完了済み' : 'チャレンジを開始 →'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* ローディング状態の表示 */}
            {isChallengeLoading && !dailyChallenge && (
              <div className="daily-challenge-card" style={{ opacity: 0.6 }}>
                <div className="challenge-header">
                  <div className="challenge-title-section">
                    <div className="challenge-label">本日のチャレンジ</div>
                    <div className="challenge-title">読み込み中...</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* チャレンジが存在しない場合の表示 */}
            {!isChallengeLoading && !dailyChallenge && (
              <div className="daily-challenge-card" style={{ 
                background: 'linear-gradient(135deg, #e5e7eb 0%, #f3f4f6 100%)',
                cursor: 'default' 
              }}>
                <div className="challenge-header">
                  <div className="challenge-title-section">
                    <div className="challenge-label" style={{ color: '#6b7280' }}>本日のチャレンジ</div>
                    <div className="challenge-title" style={{ color: '#6b7280' }}>チャレンジがありません</div>
                  </div>
                </div>
                <div className="challenge-content">
                  <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '12px' }}>
                    デイリーチャレンジは設定した時間に自動生成されます
                  </p>
                  <div style={{ display: 'flex', gap: '6px', flexDirection: 'column' }}>
                    <button 
                      className="challenge-button" 
                      style={{ background: '#3b82f6', color: 'white' }}
                      onClick={() => setShowTimeSettings(true)}
                    >
                      時間設定を開く
                    </button>
                    <button 
                      className="manual-generate-button"
                      onClick={generateChallengeManually}
                    >
                      今すぐチャレンジを生成
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="progress-ring-container" onClick={() => router.push('/timer')} style={{ cursor: 'pointer' }}>
          <svg className="progress-ring" width="200" height="200">
            <circle className="ring-bg" cx="100" cy="100" r="90"></circle>
            <circle 
              className="ring-progress" 
              cx="100" 
              cy="100" 
              r="90" 
              style={{ strokeDashoffset: progressOffset }}
            ></circle>
          </svg>
          <div className="ring-content">
            <div className="total-time">{timeDisplay}</div>
            <div className="time-label">今日の学習時間</div>
            <div className={`streak-badge ${userData.currentStreak === 0 ? 'no-streak' : ''}`}>
              {userData.currentStreak}日連続
            </div>
          </div>
        </div>
        
        {/* Empty Schedule for Non-authenticated users */}
        {!userData.hasData && (
          <div className="empty-schedule">
            <div className="empty-icon"></div>
            <div className="empty-title">学習スケジュールが設定されていません</div>
            <div className="empty-text">設定画面から受験科目を選んで、学習を始めましょう</div>
            <button className="empty-button" onClick={() => router.push('/settings')}>科目を設定する</button>
          </div>
        )}
        
        <button className="quick-start" onClick={() => router.push('/problems/create')}>問題を生成する →</button>
        
        {/* 直近の問題セクション */}
        {userData.hasData && (
          <section className="recent-problems-section">
            <div className="recent-problems-card">
              <div className="recent-problems-header">
                <div className="recent-problems-title">
                  <div className="recent-problems-icon">
                    <Brain size={14} />
                  </div>
                  <span>最近作成した問題</span>
                </div>
                <Link href="/problems" className="view-all-link">
                  すべて見る
                  <ChevronRight size={12} />
                </Link>
              </div>
              
              {problemsLoading ? (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <div className="loading-spinner"></div>
                  <p className="loading-text">読み込み中...</p>
                </div>
              ) : recentProblems.length > 0 ? (
                <div className="recent-problems-list">
                  {recentProblems.map((problem) => {
                    const difficultyInfo = getDifficultyInfo(problem.difficulty)
                    const subjectColor = getSubjectColor(problem.subject)
                    
                    return (
                      <Link
                        key={problem.id}
                        href={`/problems/${problem.id}`}
                        className="recent-problem-item"
                      >
                        <div className="problem-content">
                          <div className="problem-info">
                            <div className="problem-meta">
                              <span 
                                className="problem-subject"
                                style={{ 
                                  color: subjectColor,
                                  borderColor: subjectColor
                                }}
                              >
                                {problem.subject}
                              </span>
                              <span 
                                className="problem-difficulty"
                                style={{ 
                                  backgroundColor: difficultyInfo.bg,
                                  color: difficultyInfo.color
                                }}
                              >
                                {difficultyInfo.label}
                              </span>
                            </div>
                            <p className="problem-question">
                              {problem.question}
                            </p>
                            <p className="problem-date">
                              {format(problem.createdAt.toDate(), 'M/d HH:mm', { locale: ja })}
                            </p>
                          </div>
                          <ChevronRight size={14} className="problem-arrow" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="no-problems">
                  <Brain size={32} className="no-problems-icon" />
                  <p style={{ fontSize: '11px' }}>まだ問題を作成していません</p>
                  <button 
                    className="create-problem-button"
                    onClick={() => router.push('/problems/create')}
                  >
                    問題を作成する
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
        
        {/* Amazon アフィリエイト商品セクション */}
        <section className="affiliate-section">
          <h2 className="section-title">おすすめ学習アイテム</h2>
          
          {affiliateLoading ? (
            <div className="affiliate-loading">
              <div className="loading-spinner"></div>
              <p className="loading-text">あなたに最適な商品を選定中...</p>
            </div>
          ) : (
            <div className="affiliate-grid">
              {affiliateProducts.slice(0, 4).map((product) => (
                <div 
                  key={product.asin} 
                  className="affiliate-card"
                  onClick={() => handleProductClick(product, currentUser?.uid || '')}
                >
                  {product.recommendationReason && (
                    <div className="recommendation-badge">
                      {product.recommendationReason}
                    </div>
                  )}
                  
                  <div className="product-image-container">
                    <img 
                      src={product.imageUrl} 
                      alt={product.title}
                      className="product-image"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.onerror = null;
                        target.src = PLACEHOLDER_SVG;
                      }}
                    />
                  </div>
                  
                  <div className="product-info">
                    <h3 className="product-title">{product.title}</h3>
                    {product.description && (
                      <p className="product-description">{product.description}</p>
                    )}
                    
                    <div className="product-footer">
                      <div className="product-price">
                        <span className="price-symbol">¥</span>
                        <span className="price-value">{product.price.toLocaleString()}</span>
                      </div>
                      
                      <button className="buy-button">
                        <img 
                          src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" 
                          alt="Amazon"
                          className="amazon-logo"
                        />
                        <span>で購入</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="affiliate-disclaimer">
            <p>※ 価格は変動する場合があります。各商品はAmazonアソシエイトリンクです。</p>
          </div>
        </section>
      </main>

      {/* 時間設定モーダル */}
      {showTimeSettings && (
        <div className="time-settings-modal" onClick={() => setShowTimeSettings(false)}>
          <div className="time-settings-content" onClick={(e) => e.stopPropagation()}>
            <div className="time-settings-header">
              <h3 className="time-settings-title">
                <Clock size={16} />
                デイリーチャレンジ時間設定
              </h3>
              <button className="time-settings-close" onClick={() => setShowTimeSettings(false)}>
                <X size={16} />
              </button>
            </div>

            {/* 朝のチャレンジ設定 */}
            <div className="time-setting-item">
              <div className="time-setting-row">
                <label className="time-setting-label">
                  <Sun size={16} color="#f59e0b" />
                  朝のチャレンジ
                </label>
                <button
                  className={`toggle-switch ${scheduleSettings.enableMorning ? 'active' : ''}`}
                  onClick={() => setScheduleSettings({
                    ...scheduleSettings,
                    enableMorning: !scheduleSettings.enableMorning
                  })}
                >
                  <span className="toggle-thumb"></span>
                </button>
              </div>
              
              {scheduleSettings.enableMorning && (
                <div className="time-input-group">
                  <div className="time-input-label">生成時刻</div>
                  <input
                    type="time"
                    value={scheduleSettings.morningTime}
                    onChange={(e) => setScheduleSettings({
                      ...scheduleSettings,
                      morningTime: e.target.value
                    })}
                    className="time-input"
                  />
                  <div className="time-hint">
                    朝の通勤・通学時間に合わせて設定しましょう
                  </div>
                </div>
              )}
            </div>

            {/* 夜のチャレンジ設定 */}
            <div className="time-setting-item">
              <div className="time-setting-row">
                <label className="time-setting-label">
                  <Moon size={16} color="#3b82f6" />
                  夜のチャレンジ
                </label>
                <button
                  className={`toggle-switch ${scheduleSettings.enableEvening ? 'active' : ''}`}
                  onClick={() => setScheduleSettings({
                    ...scheduleSettings,
                    enableEvening: !scheduleSettings.enableEvening
                  })}
                >
                  <span className="toggle-thumb"></span>
                </button>
              </div>
              
              {scheduleSettings.enableEvening && (
                <div className="time-input-group">
                  <div className="time-input-label">生成時刻</div>
                  <input
                    type="time"
                    value={scheduleSettings.eveningTime}
                    onChange={(e) => setScheduleSettings({
                      ...scheduleSettings,
                      eveningTime: e.target.value
                    })}
                    className="time-input"
                  />
                  <div className="time-hint">
                    帰宅後や就寝前の学習時間に合わせて設定しましょう
                  </div>
                </div>
              )}
            </div>

            {/* 通知設定 */}
            <div className="time-setting-item">
              <div className="time-setting-row">
                <label className="time-setting-label">
                  <Bell size={16} color="#6b7280" />
                  通知を受け取る
                </label>
                <button
                  className={`toggle-switch ${scheduleSettings.notificationsEnabled ? 'active' : ''}`}
                  onClick={() => setScheduleSettings({
                    ...scheduleSettings,
                    notificationsEnabled: !scheduleSettings.notificationsEnabled
                  })}
                >
                  <span className="toggle-thumb"></span>
                </button>
              </div>
              
              {scheduleSettings.notificationsEnabled && (
                <div className="time-input-group">
                  <div className="time-hint">
                    新しいチャレンジが生成されたときにブラウザ通知でお知らせします
                  </div>
                </div>
              )}
            </div>

            <div className="time-settings-footer">
              <button className="time-settings-cancel" onClick={() => setShowTimeSettings(false)}>
                キャンセル
              </button>
              <button 
                className="time-settings-save" 
                onClick={handleSaveTimeSettings}
                disabled={savingSettings || (!scheduleSettings.enableMorning && !scheduleSettings.enableEvening)}
              >
                {savingSettings ? '保存中...' : '設定を保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}