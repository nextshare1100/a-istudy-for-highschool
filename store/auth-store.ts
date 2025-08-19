import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from 'firebase/auth'
import { UserProfile, ScheduleTask } from '@/types'
import { auth } from '@/lib/firebase'
import { signOut } from 'firebase/auth'

interface Deadline {
  id: string
  title: string
  dueDate: Date
  subject: string
}

interface AuthState {
  // 基本認証情報
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  initialized: boolean
  
  // チャット3から取得するデータ
  studyStreak: number
  totalStudyTime: number
  
  // チャット4から取得するデータ
  todaysTasks: ScheduleTask[]
  upcomingDeadlines: Deadline[]
  
  // チャット5のサブスクリプション状態
  subscriptionStatus: 'free' | 'active' | 'cancelled' | 'past_due'
  subscriptionEndDate: Date | null
  
  // アクション
  initialize: () => Promise<void>
  setUser: (user: User | null) => void
  setUserProfile: (profile: UserProfile | null) => void
  fetchIntegratedData: () => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  error: string | null
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初期状態
      user: null,
      userProfile: null,
      loading: false,
      initialized: false,
      error: null,
      studyStreak: 0,
      totalStudyTime: 0,
      todaysTasks: [],
      upcomingDeadlines: [],
      subscriptionStatus: 'free',
      subscriptionEndDate: null,

      // 初期化
      initialize: async () => {
        set({ loading: true, error: null })
        try {
          // Firebase Authの現在のユーザーを取得
          const currentUser = auth.currentUser
          if (currentUser) {
            set({ user: currentUser })
            
            // ユーザープロファイルを取得
            // TODO: Firestoreからプロファイルを取得
            // const profile = await userService.getProfile(currentUser.uid)
            // set({ userProfile: profile })
            
            // 統合データを取得
            await get().fetchIntegratedData()
          }
        } catch (error) {
          set({ error: '初期化に失敗しました' })
        } finally {
          set({ loading: false, initialized: true })
        }
      },

      // ユーザー設定
      setUser: (user) => set({ user }),
      
      // プロファイル設定
      setUserProfile: (profile) => set({ userProfile: profile }),

      // 統合データ取得
      fetchIntegratedData: async () => {
        const { user } = get()
        if (!user) return

        try {
          // 進捗データを取得（チャット3のAPI）
          const progressResponse = await fetch('/api/progress/summary', {
            headers: {
              'Authorization': `Bearer ${await user.getIdToken()}`
            }
          })
          
          if (progressResponse.ok) {
            const progressData = await progressResponse.json()
            set({
              studyStreak: progressData.studyStreak || 0,
              totalStudyTime: progressData.totalStudyTime || 0
            })
          }

          // スケジュールデータを取得（チャット4のAPI）
          const today = new Date().toISOString().split('T')[0]
          const scheduleResponse = await fetch(`/api/schedule/tasks?date=${today}`, {
            headers: {
              'Authorization': `Bearer ${await user.getIdToken()}`
            }
          })
          
          if (scheduleResponse.ok) {
            const scheduleData = await scheduleResponse.json()
            set({ todaysTasks: scheduleData.tasks || [] })
          }

          // サブスクリプション状態を取得
          // TODO: Firestoreまたは専用APIから取得
          const subscriptionResponse = await fetch('/api/subscription/status', {
            headers: {
              'Authorization': `Bearer ${await user.getIdToken()}`
            }
          })
          
          if (subscriptionResponse.ok) {
            const subscriptionData = await subscriptionResponse.json()
            set({
              subscriptionStatus: subscriptionData.status || 'free',
              subscriptionEndDate: subscriptionData.endDate ? new Date(subscriptionData.endDate) : null
            })
          }
        } catch (error) {
          console.error('統合データの取得に失敗:', error)
        }
      },

      // ログアウト
      logout: async () => {
        set({ loading: true })
        try {
          await signOut(auth)
          
          // 状態をリセット
          set({
            user: null,
            userProfile: null,
            studyStreak: 0,
            totalStudyTime: 0,
            todaysTasks: [],
            upcomingDeadlines: [],
            subscriptionStatus: 'free',
            subscriptionEndDate: null,
            loading: false,
            error: null
          })
        } catch (error) {
          set({ error: 'ログアウトに失敗しました', loading: false })
        }
      },

      // エラークリア
      clearError: () => set({ error: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // 永続化する項目を選択
        userProfile: state.userProfile,
        subscriptionStatus: state.subscriptionStatus,
        subscriptionEndDate: state.subscriptionEndDate
      })
    }
  )
)