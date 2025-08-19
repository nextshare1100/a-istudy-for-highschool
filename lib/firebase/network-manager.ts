// lib/firebase/network-manager.ts
import { enableNetwork, disableNetwork } from 'firebase/firestore'
import { db } from './config'

class NetworkManager {
  private isOnline: boolean = true
  private retryQueue: Array<() => Promise<void>> = []
  private reconnectTimeout: NodeJS.Timeout | null = null
  private isEnablingNetwork: boolean = false
  private isNetworkEnabled: boolean = true
  private enableNetworkPromise: Promise<void> | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
    }
  }

  private handleOnline = async () => {
    console.log('Network: Online')
    this.isOnline = true
    
    // 既にネットワークが有効化されている場合はスキップ
    if (this.isNetworkEnabled) {
      return
    }

    try {
      await this.enableNetworkSafe()
      await this.processRetryQueue()
    } catch (error) {
      console.error('Error handling online event:', error)
    }
  }

  private handleOffline = async () => {
    console.log('Network: Offline')
    this.isOnline = false
    this.isNetworkEnabled = false
    
    // enableNetworkが進行中の場合は完了を待つ
    if (this.enableNetworkPromise) {
      try {
        await this.enableNetworkPromise
      } catch (error) {
        // エラーは無視
      }
    }

    try {
      await disableNetwork(db)
    } catch (error) {
      console.error('Error disabling network:', error)
    }
  }

  private async enableNetworkSafe(): Promise<void> {
    // 既に有効化されている場合はスキップ
    if (this.isNetworkEnabled) {
      return
    }

    // 既に有効化処理中の場合は、その処理の完了を待つ
    if (this.isEnablingNetwork && this.enableNetworkPromise) {
      return this.enableNetworkPromise
    }

    this.isEnablingNetwork = true
    
    this.enableNetworkPromise = (async () => {
      try {
        await enableNetwork(db)
        this.isNetworkEnabled = true
        console.log('Network enabled successfully')
      } catch (error: any) {
        // Target ID already exists エラーは無視
        if (error?.message?.includes('Target ID already exists')) {
          console.log('Network already enabled (Target ID exists)')
          this.isNetworkEnabled = true
        } else {
          console.error('Error enabling network:', error)
          throw error
        }
      } finally {
        this.isEnablingNetwork = false
        this.enableNetworkPromise = null
      }
    })()

    return this.enableNetworkPromise
  }

  private async processRetryQueue() {
    const queueCopy = [...this.retryQueue]
    this.retryQueue = []

    for (const operation of queueCopy) {
      try {
        await operation()
      } catch (error) {
        console.error('Retry operation failed:', error)
      }
    }
  }

  async ensureConnection(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('No network connection')
    }

    return this.enableNetworkSafe()
  }

  addToRetryQueue(operation: () => Promise<void>) {
    this.retryQueue.push(operation)
  }

  cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    this.retryQueue = []
  }

  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      isNetworkEnabled: this.isNetworkEnabled,
      isEnablingNetwork: this.isEnablingNetwork,
      retryQueueLength: this.retryQueue.length
    }
  }
}

// シングルトンインスタンス
let networkManagerInstance: NetworkManager | null = null

// クリーンアップ関数
export function cleanupNetworkManager() {
  if (networkManagerInstance) {
    networkManagerInstance.cleanup()
    networkManagerInstance = null
  }
}

// ネットワークマネージャーの取得
export function getNetworkManager(): NetworkManager {
  if (!networkManagerInstance) {
    networkManagerInstance = new NetworkManager()
  }
  return networkManagerInstance
}

export async function ensureOnline(): Promise<void> {
  const manager = getNetworkManager()
  return manager.ensureConnection()
}