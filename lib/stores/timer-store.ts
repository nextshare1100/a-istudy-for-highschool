// lib/stores/timer-store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { subscribeWithSelector } from 'zustand/middleware'

interface TimerContent {
  mainTheme: string
  subTopics: string[]
  materials: string[]
  goals: string[]
}

interface ActiveTimer {
  sessionId: string
  startTime: number
  subject: string
  unit: string
  content?: TimerContent
  isPaused?: boolean
  pausedAt?: number
  accumulatedTime?: number
  elapsedTime?: number
}

interface TimerStore {
  // 状態
  activeTimer: ActiveTimer | null
  
  // アクション
  setActiveTimer: (timer: ActiveTimer) => void
  updateActiveTimer: (updates: Partial<ActiveTimer>) => void
  clearActiveTimer: () => void
  
  // ヘルパー
  isTimerActive: () => boolean
  getElapsedTime: () => number
  
  // オフライン同期用
  pendingUpdates: Array<{ timestamp: number; data: any }>
  addPendingUpdate: (data: any) => void
  clearPendingUpdates: () => void
}

// デバッグ用ログ
const debugLog = (action: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[TimerStore] ${action}`, data || '')
  }
}

export const useTimerStore = create<TimerStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // 初期状態
        activeTimer: null,
        pendingUpdates: [],
        
        // アクティブタイマーを設定
        setActiveTimer: (timer) => {
          debugLog('setActiveTimer', timer)
          set({ activeTimer: timer })
        },
        
        // アクティブタイマーを更新
        updateActiveTimer: (updates) => {
          debugLog('updateActiveTimer', updates)
          set((state) => ({
            activeTimer: state.activeTimer 
              ? { ...state.activeTimer, ...updates }
              : null
          }))
        },
        
        // アクティブタイマーをクリア
        clearActiveTimer: () => {
          debugLog('clearActiveTimer')
          set({ activeTimer: null })
        },
        
        // タイマーがアクティブかチェック
        isTimerActive: () => !!get().activeTimer?.sessionId,
        
        // 経過時間を取得
        getElapsedTime: () => {
          const timer = get().activeTimer
          if (!timer) return 0
          
          if (timer.elapsedTime !== undefined) {
            return timer.elapsedTime
          }
          
          if (timer.isPaused) {
            return timer.accumulatedTime || 0
          }
          
          const now = Date.now()
          const elapsed = Math.floor((now - timer.startTime) / 1000)
          return elapsed + (timer.accumulatedTime || 0)
        },
        
        // オフライン更新を追加
        addPendingUpdate: (data) => {
          debugLog('addPendingUpdate', data)
          set((state) => ({
            pendingUpdates: [
              ...state.pendingUpdates,
              { timestamp: Date.now(), data }
            ]
          }))
        },
        
        // オフライン更新をクリア
        clearPendingUpdates: () => {
          debugLog('clearPendingUpdates')
          set({ pendingUpdates: [] })
        }
      }),
      {
        name: 'timer-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          activeTimer: state.activeTimer,
          pendingUpdates: state.pendingUpdates
        }),
        version: 1,
        migrate: (persistedState: any, version: number) => {
          debugLog('migrate', { persistedState, version })
          // 将来のマイグレーション処理
          return persistedState
        }
      }
    )
  )
)

// セレクター
export const selectActiveTimer = (state: TimerStore) => state.activeTimer
export const selectIsTimerActive = (state: TimerStore) => state.isTimerActive()
export const selectElapsedTime = (state: TimerStore) => state.getElapsedTime()
export const selectPendingUpdates = (state: TimerStore) => state.pendingUpdates

// リスナー設定用のヘルパー
export const subscribeToActiveTimer = (callback: (timer: ActiveTimer | null) => void) => {
  return useTimerStore.subscribe(
    (state) => state.activeTimer,
    callback
  )
}

// オフライン同期用のヘルパー
export const syncPendingUpdates = async () => {
  const { pendingUpdates, clearPendingUpdates } = useTimerStore.getState()
  
  if (pendingUpdates.length === 0) return
  
  debugLog('Syncing pending updates', { count: pendingUpdates.length })
  
  try {
    // 実際の実装ではここでFirebaseに更新を送信
    for (const update of pendingUpdates) {
      // await sendUpdateToFirebase(update.data)
      debugLog('Syncing update', update)
    }
    
    clearPendingUpdates()
  } catch (error) {
    debugLog('Sync failed', error)
    throw error
  }
}

// ストアの初期化時にセッション復旧をチェック
if (typeof window !== 'undefined') {
  const checkSessionRecovery = () => {
    const state = useTimerStore.getState()
    if (state.activeTimer) {
      debugLog('Session recovery check', state.activeTimer)
      
      // セッションが古すぎる場合（24時間以上）はクリア
      const sessionAge = Date.now() - state.activeTimer.startTime
      if (sessionAge > 24 * 60 * 60 * 1000) {
        debugLog('Session too old, clearing')
        state.clearActiveTimer()
      }
    }
  }
  
  // DOM読み込み完了後にチェック
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkSessionRecovery)
  } else {
    checkSessionRecovery()
  }
  
  // オンライン復帰時に同期
  window.addEventListener('online', () => {
    debugLog('Online, syncing pending updates')
    syncPendingUpdates().catch(console.error)
  })
}