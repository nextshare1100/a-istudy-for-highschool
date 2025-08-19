// hooks/useDailyChallengeAutoUpdate.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { User } from 'firebase/auth'
import { 
  getDailyChallenge as getDailyChallengeNew,
  generateDailyChallenge,
  getDailyChallengeStatus,
  getUserScheduleSettings,
  type DailyChallenge,
  type UserScheduleSettings
} from '@/lib/firebase/dailyChallenge'

interface DailyChallengeData {
  id: string
  subject: string
  difficulty: string
  completed: boolean
  expiresAt: Date
  problemCount: number
  timeSlot?: 'morning' | 'evening'
}

interface UseDailyChallengeAutoUpdateProps {
  user: User | null
}

interface UseDailyChallengeAutoUpdateReturn {
  dailyChallenge: DailyChallengeData | null
  isLoading: boolean
  scheduleSettings: UserScheduleSettings
  checkForNewChallenge: () => Promise<void>
  hasNewChallenge: boolean
}

// シングルトンパターンで重複実行を防ぐ
let isCheckingGlobal = false

export function useDailyChallengeAutoUpdate({ user }: UseDailyChallengeAutoUpdateProps): UseDailyChallengeAutoUpdateReturn {
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallengeData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasNewChallenge, setHasNewChallenge] = useState(false)
  const [scheduleSettings, setScheduleSettings] = useState<UserScheduleSettings>({
    morningTime: '07:00',
    eveningTime: '20:00',
    enableMorning: true,
    enableEvening: true,
    notificationsEnabled: true
  })
  const [lastCheckedTime, setLastCheckedTime] = useState<string>('')
  const checkingRef = useRef(false)

  console.log('useDailyChallengeAutoUpdate hook rendered', { 
    userId: user?.uid, 
    dailyChallenge: dailyChallenge?.id,
    isLoading 
  })

  // 現在の時間スロットを判定
  const getCurrentTimeSlot = useCallback((): 'morning' | 'evening' | null => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinute
    
    console.log('Getting current time slot', {
      currentTime: `${currentHour}:${currentMinute.toString().padStart(2, '0')}`,
      scheduleSettings
    })
    
    // 朝の時間判定（朝の設定時刻から12時まで）
    if (scheduleSettings.enableMorning) {
      const [morningHour, morningMinute] = scheduleSettings.morningTime.split(':').map(Number)
      const morningTimeInMinutes = morningHour * 60 + morningMinute
      if (currentTimeInMinutes >= morningTimeInMinutes && currentHour < 12) {
        console.log('Current time slot: morning')
        return 'morning'
      }
    }
    
    // 夜の時間判定（夜の設定時刻から24時まで）
    if (scheduleSettings.enableEvening) {
      const [eveningHour, eveningMinute] = scheduleSettings.eveningTime.split(':').map(Number)
      const eveningTimeInMinutes = eveningHour * 60 + eveningMinute
      if (currentTimeInMinutes >= eveningTimeInMinutes) {
        console.log('Current time slot: evening')
        return 'evening'
      }
    }
    
    console.log('Current time slot: none')
    return null
  }, [scheduleSettings])

  // 過去の未生成チャレンジをチェックして生成する関数
  const checkAndGenerateMissedChallenges = useCallback(async (userId: string) => {
    if (!userId) return null
    
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinute
    
    console.log('Checking for missed challenge generation times...', {
      userId,
      currentTime: `${currentHour}:${currentMinute.toString().padStart(2, '0')}`
    })
    
    try {
      // 朝のチャレンジチェック
      if (scheduleSettings.enableMorning) {
        const [morningHour, morningMinute] = scheduleSettings.morningTime.split(':').map(Number)
        const morningTimeInMinutes = morningHour * 60 + morningMinute
        
        // 朝の時間を過ぎているかチェック（12時まで）
        if (currentTimeInMinutes >= morningTimeInMinutes && currentHour < 12) {
          console.log('Morning challenge time has passed, checking if generation is needed...')
          
          // 朝のチャレンジを取得または生成
          const morningChallenge = await getDailyChallengeNew(userId, 'morning')
          if (morningChallenge) {
            console.log('Morning challenge exists or generated:', morningChallenge.id)
            return morningChallenge
          }
        }
      }
      
      // 夜のチャレンジチェック
      if (scheduleSettings.enableEvening) {
        const [eveningHour, eveningMinute] = scheduleSettings.eveningTime.split(':').map(Number)
        const eveningTimeInMinutes = eveningHour * 60 + eveningMinute
        
        // 夜の時間を過ぎているかチェック
        if (currentTimeInMinutes >= eveningTimeInMinutes) {
          console.log('Evening challenge time has passed, checking if generation is needed...')
          
          // 夜のチャレンジを取得または生成
          const eveningChallenge = await getDailyChallengeNew(userId, 'evening')
          if (eveningChallenge) {
            console.log('Evening challenge exists or generated:', eveningChallenge.id)
            return eveningChallenge
          }
        }
      }
      
      // どちらの時間帯でもない場合は、デフォルトのチャレンジを取得
      console.log('No specific time slot, getting default challenge...')
      const defaultChallenge = await getDailyChallengeNew(userId)
      if (defaultChallenge) {
        console.log('Default challenge found:', defaultChallenge.id)
      }
      return defaultChallenge
    } catch (error) {
      console.error('Error in checkAndGenerateMissedChallenges:', error)
      return null
    }
  }, [scheduleSettings])

  // チャレンジを取得する関数
  const fetchChallenge = useCallback(async (userId: string, timeSlot?: 'morning' | 'evening') => {
    if (!userId) {
      console.log('No userId provided to fetchChallenge')
      return
    }

    // 既に取得中の場合はスキップ
    if (checkingRef.current || isCheckingGlobal) {
      console.log('Already fetching challenge, skipping...')
      return
    }

    checkingRef.current = true
    isCheckingGlobal = true

    try {
      console.log(`Fetching challenge for userId: ${userId}, timeSlot: ${timeSlot || 'default'}`)
      
      // まず過去の未生成チャレンジをチェック
      const challenge = await checkAndGenerateMissedChallenges(userId)
      
      if (challenge) {
        console.log('Challenge fetched successfully:', challenge)
        
        // チャレンジのステータスを取得
        const status = await getDailyChallengeStatus(userId, challenge.id)
        
        // expiresAtの処理
        let expiresAt: Date
        if (challenge.expiresAt) {
          if (typeof challenge.expiresAt.toDate === 'function') {
            expiresAt = challenge.expiresAt.toDate()
          } else if (challenge.expiresAt instanceof Date) {
            expiresAt = challenge.expiresAt
          } else {
            expiresAt = new Date(challenge.expiresAt)
          }
        } else {
          // expiresAtがない場合は今日の23:59:59に設定
          expiresAt = new Date()
          expiresAt.setHours(23, 59, 59, 999)
        }
        
        const challengeData: DailyChallengeData = {
          id: challenge.id,
          subject: challenge.subject || '未設定',
          difficulty: challenge.difficulty || 'medium',
          completed: status?.completed || false,
          expiresAt: expiresAt,
          problemCount: challenge.problemIds?.length || 0,
          timeSlot: challenge.timeSlot
        }
        
        console.log('Challenge data prepared:', challengeData)
        
        // 新しいチャレンジかどうかをチェック
        if (!dailyChallenge || dailyChallenge.id !== challenge.id) {
          console.log('New challenge detected!')
          setHasNewChallenge(true)
          
          // ブラウザ通知を送信
          if (scheduleSettings.notificationsEnabled && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              try {
                const timeSlotText = timeSlot === 'morning' ? '朝' : timeSlot === 'evening' ? '夜' : ''
                new Notification('新しいデイリーチャレンジ', {
                  body: `${challenge.subject}の${timeSlotText}のチャレンジが開始されました！`,
                  icon: '/favicon.ico',
                  tag: 'daily-challenge'
                })
              } catch (error) {
                console.error('Notification error:', error)
              }
            }
          }
        }
        
        setDailyChallenge(challengeData)
      } else {
        console.log('No challenge found')
        setDailyChallenge(null)
      }
    } catch (error) {
      console.error('Error fetching challenge:', error)
      setDailyChallenge(null)
    } finally {
      checkingRef.current = false
      isCheckingGlobal = false
      setIsLoading(false)
    }
  }, [dailyChallenge, scheduleSettings.notificationsEnabled, checkAndGenerateMissedChallenges])

  // 新しいチャレンジをチェックする関数
  const checkForNewChallenge = useCallback(async () => {
    if (!user?.uid) {
      console.log('Cannot check for new challenge: no user')
      return
    }
    
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
    
    // 同じ時刻に複数回チェックしないようにする
    if (currentTime === lastCheckedTime) {
      return
    }
    
    console.log(`Checking for new challenge at ${currentTime}`)
    setLastCheckedTime(currentTime)
    
    // 朝のチャレンジチェック（定刻）
    if (scheduleSettings.enableMorning && currentTime === scheduleSettings.morningTime) {
      console.log('Morning challenge time detected!')
      await fetchChallenge(user.uid, 'morning')
      return
    }
    
    // 夜のチャレンジチェック（定刻）
    if (scheduleSettings.enableEvening && currentTime === scheduleSettings.eveningTime) {
      console.log('Evening challenge time detected!')
      await fetchChallenge(user.uid, 'evening')
      return
    }
    
    // 現在の時間スロットに応じたチャレンジを取得（ページ更新時用）
    const currentSlot = getCurrentTimeSlot()
    if (!dailyChallenge && !checkingRef.current) {
      console.log('No challenge loaded, fetching for current slot:', currentSlot)
      await fetchChallenge(user.uid, currentSlot || undefined)
    }
  }, [user, scheduleSettings, lastCheckedTime, getCurrentTimeSlot, fetchChallenge, dailyChallenge])

  // ユーザーが変更されたときの処理
  useEffect(() => {
    if (!user) {
      console.log('No user, resetting state')
      setDailyChallenge(null)
      setIsLoading(false)
      return
    }

    console.log('User changed, loading data for:', user.uid)
    setIsLoading(true)

    // スケジュール設定とチャレンジを読み込む
    const loadUserData = async () => {
      try {
        // スケジュール設定を取得
        console.log('Loading user schedule settings...')
        const userScheduleSettings = await getUserScheduleSettings(user.uid)
        if (userScheduleSettings) {
          setScheduleSettings(userScheduleSettings)
          console.log('User schedule settings loaded:', userScheduleSettings)
        }
        
        // 初回のチャレンジ取得（重複防止のため少し遅延）
        console.log('Initial challenge fetch scheduled...')
        setTimeout(async () => {
          if (!checkingRef.current) {
            const currentSlot = getCurrentTimeSlot()
            await fetchChallenge(user.uid, currentSlot || undefined)
          }
        }, 500)
      } catch (error) {
        console.error('Error loading user data:', error)
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [user?.uid]) // userのuidが変更されたときのみ実行

  // スケジュール設定が変更されたときに再チェック
  useEffect(() => {
    if (user?.uid && !isLoading) {
      console.log('Schedule settings changed, rechecking...')
      checkForNewChallenge()
    }
  }, [scheduleSettings, user?.uid, isLoading])

  // 定期的なチェック（1分ごと）
  useEffect(() => {
    if (!user?.uid) {
      console.log('Skipping interval setup: no user')
      return
    }
    
    console.log('Setting up interval for periodic checks...')
    
    // 初回チェック（少し遅延）
    const initialTimeout = setTimeout(() => {
      checkForNewChallenge()
    }, 2000)
    
    // 1分ごとにチェック
    const interval = setInterval(() => {
      checkForNewChallenge()
    }, 60000)
    
    return () => {
      console.log('Cleaning up timers')
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [checkForNewChallenge, user?.uid])

  // 通知権限のリクエスト
  useEffect(() => {
    if (scheduleSettings.notificationsEnabled && 'Notification' in window) {
      if (Notification.permission === 'default') {
        console.log('Requesting notification permission...')
        Notification.requestPermission().catch(console.error)
      }
    }
  }, [scheduleSettings.notificationsEnabled])

  return {
    dailyChallenge,
    isLoading,
    scheduleSettings,
    checkForNewChallenge,
    hasNewChallenge
  }
}