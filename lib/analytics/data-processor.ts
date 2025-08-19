import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns'
import useSWR from 'swr'

// エラー型定義
export class DataProcessingError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'DataProcessingError'
  }
}

// Web Worker管理クラス
class WorkerManager {
  private static instance: WorkerManager
  private workers: Map<string, Worker> = new Map()
  private maxWorkers = navigator.hardwareConcurrency || 4

  static getInstance(): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager()
    }
    return WorkerManager.instance
  }

  getWorker(id: string): Worker {
    if (!this.workers.has(id)) {
      if (this.workers.size >= this.maxWorkers) {
        // 最も古いWorkerを終了
        const oldestId = Array.from(this.workers.keys())[0]
        this.terminateWorker(oldestId)
      }
      
      try {
        const worker = new Worker('/workers/analytics-worker.js')
        this.workers.set(id, worker)
      } catch (error) {
        throw new DataProcessingError('Failed to create worker', 'WORKER_CREATE_ERROR')
      }
    }
    return this.workers.get(id)!
  }

  terminateWorker(id: string) {
    const worker = this.workers.get(id)
    if (worker) {
      worker.terminate()
      this.workers.delete(id)
    }
  }

  terminateAll() {
    this.workers.forEach(worker => worker.terminate())
    this.workers.clear()
  }
}

// データ処理用のWeb Worker（タイムアウト付き）
export const processLargeDataset = async (
  data: any[], 
  operation: string,
  timeout: number = 30000 // 30秒
): Promise<any> => {
  const workerId = `${operation}-${Date.now()}`
  const workerManager = WorkerManager.getInstance()
  
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout
    let isCompleted = false

    try {
      const worker = workerManager.getWorker(workerId)
      
      // タイムアウト設定
      timeoutId = setTimeout(() => {
        if (!isCompleted) {
          isCompleted = true
          workerManager.terminateWorker(workerId)
          reject(new DataProcessingError('Processing timeout', 'TIMEOUT_ERROR'))
        }
      }, timeout)

      // メッセージハンドラ
      worker.onmessage = (e) => {
        if (!isCompleted) {
          isCompleted = true
          clearTimeout(timeoutId)
          
          if (e.data.error) {
            reject(new DataProcessingError(e.data.error, 'PROCESSING_ERROR'))
          } else {
            resolve(e.data)
          }
        }
      }

      // エラーハンドラ
      worker.onerror = (error) => {
        if (!isCompleted) {
          isCompleted = true
          clearTimeout(timeoutId)
          workerManager.terminateWorker(workerId)
          reject(new DataProcessingError(error.message || 'Worker error', 'WORKER_ERROR'))
        }
      }

      // データ送信
      worker.postMessage({ data, operation })
    } catch (error) {
      if (!isCompleted) {
        isCompleted = true
        clearTimeout(timeoutId!)
        reject(error)
      }
    }
  })
}

// 仮想化用のカスタムフック（メモリ効率化版）
export const useVirtualizedData = <T>(
  data: T[], 
  itemsPerPage: number = 50,
  preloadPages: number = 2
) => {
  const [page, setPage] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const scrollPositionRef = useRef(0)
  
  const { virtualizedData, totalPages, hasMore } = useMemo(() => {
    const start = Math.max(0, (page - preloadPages) * itemsPerPage)
    const end = Math.min(data.length, (page + preloadPages + 1) * itemsPerPage)
    
    return {
      virtualizedData: data.slice(start, end),
      totalPages: Math.ceil(data.length / itemsPerPage),
      hasMore: (page + 1) * itemsPerPage < data.length
    }
  }, [data, page, itemsPerPage, preloadPages])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      setIsLoading(true)
      // 非同期でページを更新（UIブロッキングを避ける）
      requestAnimationFrame(() => {
        setPage(p => p + 1)
        setIsLoading(false)
      })
    }
  }, [hasMore, isLoading])

  const reset = useCallback(() => {
    setPage(0)
    scrollPositionRef.current = 0
  }, [])

  const goToPage = useCallback((pageNumber: number) => {
    const validPage = Math.max(0, Math.min(pageNumber, totalPages - 1))
    setPage(validPage)
  }, [totalPages])

  return {
    data: virtualizedData,
    page,
    totalPages,
    hasMore,
    isLoading,
    loadMore,
    reset,
    goToPage,
    scrollPosition: scrollPositionRef.current
  }
}

// データキャッシング用のカスタムフック（エラーハンドリング強化版）
export const useCachedAnalytics = <T>(
  key: string, 
  fetcher: () => Promise<T>,
  options?: {
    refreshInterval?: number
    retryCount?: number
    retryDelay?: number
    staleTime?: number
    onError?: (error: Error) => void
  }
) => {
  const { 
    refreshInterval = 60000, // 1分
    retryCount = 3,
    retryDelay = 1000,
    staleTime = 300000, // 5分
    onError
  } = options || {}

  const { data, error, mutate, isValidating } = useSWR<T>(key, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval,
    dedupingInterval: staleTime,
    errorRetryCount: retryCount,
    errorRetryInterval: retryDelay,
    onError: (err) => {
      console.error(`Analytics cache error for key ${key}:`, err)
      onError?.(err)
    }
  })

  const refresh = useCallback(async () => {
    try {
      await mutate()
    } catch (error) {
      console.error('Failed to refresh analytics data:', error)
      throw error
    }
  }, [mutate])

  return {
    data,
    error,
    loading: !data && !error,
    isValidating,
    refresh,
    isStale: data ? Date.now() - (data as any)._timestamp > staleTime : false
  }
}

// バッチ処理用のキュー管理
export class BatchProcessor<T, R> {
  private queue: Array<{ data: T; resolve: (value: R) => void; reject: (error: any) => void }> = []
  private processing = false
  private batchSize: number
  private processFn: (batch: T[]) => Promise<R[]>
  private debounceTime: number
  private timer?: NodeJS.Timeout

  constructor(
    processFn: (batch: T[]) => Promise<R[]>,
    batchSize: number = 100,
    debounceTime: number = 100
  ) {
    this.processFn = processFn
    this.batchSize = batchSize
    this.debounceTime = debounceTime
  }

  async add(data: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve, reject })
      this.scheduleProcessing()
    })
  }

  private scheduleProcessing() {
    if (this.timer) {
      clearTimeout(this.timer)
    }

    this.timer = setTimeout(() => {
      this.process()
    }, this.debounceTime)

    // バッチサイズに達したら即座に処理
    if (this.queue.length >= this.batchSize) {
      clearTimeout(this.timer)
      this.process()
    }
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return

    this.processing = true
    const batch = this.queue.splice(0, this.batchSize)

    try {
      const results = await this.processFn(batch.map(item => item.data))
      batch.forEach((item, index) => {
        item.resolve(results[index])
      })
    } catch (error) {
      batch.forEach(item => {
        item.reject(error)
      })
    } finally {
      this.processing = false
      
      // 残りのアイテムがあれば処理を続ける
      if (this.queue.length > 0) {
        this.scheduleProcessing()
      }
    }
  }

  clear() {
    if (this.timer) {
      clearTimeout(this.timer)
    }
    this.queue = []
  }
}

// 集計関数（パフォーマンス最適化版）
export const aggregateStudyData = (sessions: any[]) => {
  // Map を使用して効率的に集計
  const aggregatedMap = new Map<string, {
    totalTime: number
    sessions: number
    subjects: Set<string>
  }>()

  for (const session of sessions) {
    const date = format(new Date(session.startTime), 'yyyy-MM-dd')
    const existing = aggregatedMap.get(date)
    
    if (existing) {
      existing.totalTime += session.duration
      existing.sessions += 1
      existing.subjects.add(session.subject)
    } else {
      aggregatedMap.set(date, {
        totalTime: session.duration,
        sessions: 1,
        subjects: new Set([session.subject])
      })
    }
  }

  // 結果を配列に変換
  return Array.from(aggregatedMap.entries())
    .map(([date, data]) => ({
      date,
      totalTime: data.totalTime,
      sessions: data.sessions,
      uniqueSubjects: data.subjects.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// 弱点スコア計算（重み付け調整可能版）
export const calculateWeaknessScore = (
  accuracy: number,
  totalQuestions: number,
  improvementRate: number,
  weights = {
    accuracy: 0.5,
    volume: 0.3,
    improvement: 0.2
  }
) => {
  // 重みの合計が1になるように正規化
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0)
  const normalizedWeights = {
    accuracy: weights.accuracy / totalWeight,
    volume: weights.volume / totalWeight,
    improvement: weights.improvement / totalWeight
  }

  const accuracyScore = accuracy * normalizedWeights.accuracy
  const volumeScore = Math.min(totalQuestions / 100, 1) * normalizedWeights.volume * 100
  const improvementScore = improvementRate * normalizedWeights.improvement

  return Math.max(0, Math.min(100, 100 - (accuracyScore + volumeScore + improvementScore)))
}

// 効率スコア計算（詳細版）
export const calculateEfficiencyScore = (
  focusTime: number,
  totalTime: number,
  correctAnswers: number,
  totalAnswers: number,
  breaksTaken: number = 0,
  optimalBreaks: number = 0
) => {
  // 基本スコア計算
  const focusRatio = totalTime > 0 ? focusTime / totalTime : 0
  const accuracy = totalAnswers > 0 ? correctAnswers / totalAnswers : 0
  
  // 休憩ペナルティ計算
  let breakPenalty = 0
  if (optimalBreaks > 0 && breaksTaken > optimalBreaks) {
    breakPenalty = Math.min(0.2, (breaksTaken - optimalBreaks) * 0.05)
  }
  
  // 最終スコア（0-100の範囲）
  const baseScore = (focusRatio * 0.6 + accuracy * 0.4) * (1 - breakPenalty)
  return Math.round(Math.max(0, Math.min(100, baseScore * 100)))
}

// メモリリーク防止用のクリーンアップフック
export const useCleanup = (cleanupFn: () => void) => {
  const cleanupRef = useRef(cleanupFn)
  cleanupRef.current = cleanupFn

  useEffect(() => {
    return () => {
      cleanupRef.current()
    }
  }, [])
}

// パフォーマンスモニタリング
export const usePerformanceMonitor = (componentName: string) => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const startTime = performance.now()
      
      return () => {
        const endTime = performance.now()
        const duration = endTime - startTime
        
        if (duration > 1000) {
          console.warn(`${componentName} was mounted for ${duration.toFixed(2)}ms`)
        }
      }
    }
  }, [componentName])
}