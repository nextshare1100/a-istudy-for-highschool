// components/study/timer/timer-widget.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronUp, ChevronDown, Clock, Pause, Play, X, Move, Maximize2, Minimize2, Target, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTimerStore } from '@/lib/stores/timer-store'
import { toggleTimerPause } from '@/lib/firebase/firestore'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

// デバッグモード設定
const DEBUG_MODE = process.env.NODE_ENV === 'development'

interface Position {
  x: number
  y: number
}

const debugLog = (action: string, data?: any) => {
  if (DEBUG_MODE) {
    console.log(`[TimerWidget] ${action}`, data || '')
  }
}

export function TimerWidget() {
  const { toast } = useToast()
  const router = useRouter()
  const widgetRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()
  const startTimeRef = useRef<number>()
  const accumulatedTimeRef = useRef<number>(0)
  
  const [isMinimized, setIsMinimized] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 })
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [error, setError] = useState<string | null>(null)
  
  // activeTimerのみを取得（updateActiveTimerは別途取得）
  const activeTimer = useTimerStore((state) => state.activeTimer)
  const updateActiveTimer = useTimerStore((state) => state.updateActiveTimer)
  const clearActiveTimer = useTimerStore((state) => state.clearActiveTimer)

  // 時間のフォーマット
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: secs.toString().padStart(2, '0'),
      formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
  }

  // タイマー更新ロジック
  const updateTimer = () => {
    if (!isPaused && startTimeRef.current && activeTimer) {
      const now = Date.now()
      const currentElapsed = Math.floor((now - startTimeRef.current) / 1000) + accumulatedTimeRef.current
      
      // 有効な範囲内の値のみ更新（0以上、24時間以内）
      if (currentElapsed >= 0 && currentElapsed < 86400 && currentElapsed !== elapsed) {
        setElapsed(currentElapsed)
      }
      
      animationFrameRef.current = requestAnimationFrame(updateTimer)
    }
  }

  // 一時停止/再開
  const handlePauseResume = async () => {
    if (!activeTimer?.sessionId) return

    try {
      debugLog('Toggling pause', { sessionId: activeTimer.sessionId, isPaused })
      
      const result = await toggleTimerPause(activeTimer.sessionId)
      if (result.success) {
        if (isPaused) {
          // 再開
          startTimeRef.current = Date.now()
          setIsPaused(false)
          updateActiveTimer({ isPaused: false })
          animationFrameRef.current = requestAnimationFrame(updateTimer)
          toast({
            title: '学習再開',
            description: 'タイマーを再開しました',
          })
        } else {
          // 一時停止
          accumulatedTimeRef.current = elapsed
          setIsPaused(true)
          updateActiveTimer({ isPaused: true })
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
          }
          toast({
            title: '一時停止',
            description: 'タイマーを一時停止しました',
          })
        }
      }
    } catch (error: any) {
      debugLog('Error toggling pause', error)
      setError('操作に失敗しました')
      toast({
        title: 'エラー',
        description: '操作に失敗しました',
        variant: 'destructive'
      })
    }
  }

  // タイマーページへ移動
  const navigateToTimer = () => {
    debugLog('Navigating to timer page')
    router.push('/timer')
  }

  // ウィジェットを閉じる
  const handleClose = () => {
    if (confirm('タイマーを終了しますか？学習記録は保存されます。')) {
      debugLog('Closing widget')
      clearActiveTimer()
    }
  }

  // ドラッグ開始
  const handleDragStart = (e: React.MouseEvent) => {
    if (!widgetRef.current) return
    
    const rect = widgetRef.current.getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setIsDragging(true)
    debugLog('Drag started', { x: e.clientX, y: e.clientY })
  }

  // ドラッグ中
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !widgetRef.current) return
    
    const newX = Math.max(0, Math.min(window.innerWidth - widgetRef.current.offsetWidth, e.clientX - dragOffset.x))
    const newY = Math.max(0, Math.min(window.innerHeight - widgetRef.current.offsetHeight, e.clientY - dragOffset.y))
    
    setPosition({ x: newX, y: newY })
  }, [isDragging, dragOffset])

  // ドラッグ終了
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    debugLog('Drag ended', position)
  }, [position])

  // ドラッグイベントのセットアップ
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove)
      document.addEventListener('mouseup', handleDragEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove)
        document.removeEventListener('mouseup', handleDragEnd)
      }
    }
  }, [isDragging, handleDragMove, handleDragEnd])

  // アクティブタイマーの監視
  useEffect(() => {
    // activeTimerが変更された時のみ実行
    if (!activeTimer || !activeTimer.sessionId) {
      // タイマーがない場合はリセット
      setElapsed(0)
      setIsPaused(false)
      accumulatedTimeRef.current = 0
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = undefined
      }
      return
    }

    debugLog('Active timer detected', activeTimer)
    
    // タイムスタンプの妥当性チェック
    const now = Date.now()
    const timeDiff = now - activeTimer.startTime
    
    // 未来の日付や異常な値の場合はスキップ
    if (timeDiff < 0 || timeDiff > 24 * 60 * 60 * 1000) {
      debugLog('Invalid timer timestamp, clearing', { startTime: activeTimer.startTime, now })
      clearActiveTimer()
      return
    }
    
    // 既存の経過時間を設定
    if (activeTimer.elapsedTime !== undefined) {
      setElapsed(activeTimer.elapsedTime)
      accumulatedTimeRef.current = activeTimer.elapsedTime
    }
    
    // 一時停止状態を設定
    if (activeTimer.isPaused) {
      setIsPaused(true)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = undefined
      }
    } else {
      setIsPaused(false)
      startTimeRef.current = Date.now() - (activeTimer.elapsedTime || 0) * 1000
      
      // すでにアニメーションが動いている場合はスキップ
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(updateTimer)
      }
    }
  }, [activeTimer?.sessionId, activeTimer?.isPaused]) // 依存配列を限定

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // ウィジェットの位置を保存・復元
  useEffect(() => {
    const savedPosition = localStorage.getItem('timerWidgetPosition')
    if (savedPosition) {
      try {
        const parsed = JSON.parse(savedPosition)
        setPosition(parsed)
        debugLog('Restored position', parsed)
      } catch (e) {
        debugLog('Failed to restore position', e)
      }
    }
  }, [])

  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem('timerWidgetPosition', JSON.stringify(position))
    }
  }, [position, isDragging])

  // アクティブタイマーがない場合は表示しない
  if (!activeTimer || !activeTimer.sessionId) {
    return null
  }

  const timeData = formatTime(elapsed)

  return (
    <div 
      ref={widgetRef}
      className={cn(
        "fixed z-50 transition-all duration-300",
        isDragging && "cursor-move select-none"
      )}
      style={{
        right: `${position.x}px`,
        bottom: `${position.y}px`,
      }}
    >
      <Card className={cn(
        "backdrop-blur-lg bg-white/90 dark:bg-gray-900/90 shadow-2xl border-0",
        "transition-all duration-300 ease-in-out",
        isMinimized ? "w-56" : "w-80"
      )}>
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Clock className="h-4 w-4" />
              </div>
              <span className="font-semibold text-sm tracking-wide">学習中</span>
              {isPaused && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full animate-pulse">
                  一時停止
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                onMouseDown={handleDragStart}
              >
                <Move className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? (
                  <Maximize2 className="h-3.5 w-3.5" />
                ) : (
                  <Minimize2 className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={handleClose}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* コンテンツ */}
        {!isMinimized && (
          <div className="p-5 space-y-4">
            {/* エラー表示 */}
            {error && (
              <div className="text-xs text-red-500 text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                {error}
              </div>
            )}

            {/* タイマー表示 */}
            <div 
              className="text-center cursor-pointer group"
              onClick={navigateToTimer}
            >
              <div className="flex items-center justify-center gap-1 mb-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                  <div className="relative bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-2xl px-6 py-3 shadow-lg">
                    <div className="flex items-baseline gap-1 font-mono text-4xl font-bold tabular-nums">
                      <span>{timeData.hours}</span>
                      <span className="text-3xl opacity-60">:</span>
                      <span>{timeData.minutes}</span>
                      <span className="text-3xl opacity-60">:</span>
                      <span>{timeData.seconds}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span>{activeTimer.subject}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {activeTimer.unit}
                </div>
              </div>
            </div>

            {/* 学習内容 */}
            {activeTimer.content?.mainTheme && activeTimer.content.mainTheme !== '学習内容未設定' && (
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      今日のテーマ
                    </p>
                    <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                      {activeTimer.content.mainTheme}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 操作ボタン */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePauseResume}
                className={cn(
                  "relative overflow-hidden transition-all",
                  isPaused 
                    ? "border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20" 
                    : "border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                )}
              >
                {isPaused ? (
                  <>
                    <Play className="mr-1.5 h-3.5 w-3.5" />
                    再開
                  </>
                ) : (
                  <>
                    <Pause className="mr-1.5 h-3.5 w-3.5" />
                    一時停止
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={navigateToTimer}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
              >
                <Maximize2 className="mr-1.5 h-3.5 w-3.5" />
                詳細画面
              </Button>
            </div>

            {/* プログレスバー */}
            <div className="relative h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "absolute inset-y-0 left-0 transition-all duration-1000",
                  isPaused 
                    ? "bg-gradient-to-r from-orange-400 to-orange-500" 
                    : "bg-gradient-to-r from-blue-500 to-purple-500"
                )}
                style={{ width: `${Math.min(100, (elapsed / 3600) * 100)}%` }}
              >
                <div className="absolute inset-0 bg-white/30 animate-pulse" />
              </div>
            </div>

            {/* デバッグ情報 */}
            {DEBUG_MODE && (
              <div className="text-xs text-gray-400 dark:text-gray-600 border-t pt-3 space-y-1 font-mono">
                <div>Session: {activeTimer.sessionId.slice(-8)}</div>
                <div>Pos: ({Math.round(position.x)}, {Math.round(position.y)})</div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}