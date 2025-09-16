import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

// 環境変数が使えない場合のフォールバック
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
}

// デバッグログを追加
console.log('[Firebase] Initializing with config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey.substring(0, 10) + '...'
});

let app: ReturnType<typeof initializeApp>
let auth: ReturnType<typeof getAuth>
let db: ReturnType<typeof getFirestore>
let storage: ReturnType<typeof getStorage>

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig)
    console.log('[Firebase] App initialized successfully')
    
    // Capacitor環境用のFirestore設定
    const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor
    
    if (isCapacitor) {
      // Capacitor環境では軽量な設定を使用
      db = getFirestore(app)
    } else {
      // ブラウザ環境では持続化キャッシュを使用
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      })
    }
  } else {
    app = getApp()
    console.log('[Firebase] Using existing app instance')
    db = getFirestore(app)
  }
  
  auth = getAuth(app)
  storage = getStorage(app)
  
  // 接続状態の監視
  auth.onAuthStateChanged((user) => {
    console.log('[Firebase] Auth state changed:', user ? `User: ${user.uid}` : 'No user')
  });
  
} catch (error) {
  console.error('[Firebase] Initialization error:', error)
  throw error
}

// エミュレーター設定（開発環境のみ）
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  // @ts-ignore
  if (!auth.emulatorConfig) {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  }
  
  try {
    // @ts-ignore
    if (!db._settings?.host?.includes('localhost:8080')) {
      connectFirestoreEmulator(db, 'localhost', 8080)
    }
  } catch (error) {
    console.log('Firestore emulator may already be connected')
  }
  
  try {
    // @ts-ignore
    if (!storage._delegate?._location?.host?.includes('localhost:9199')) {
      connectStorageEmulator(storage, 'localhost', 9199)
    }
  } catch (error) {
    console.log('Storage emulator may already be connected')
  }
}

export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
  )
  
  return Promise.race([promise, timeoutPromise])
}

export const ensureOnline = async () => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!navigator.onLine) {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!navigator.onLine) {
      throw new Error('インターネット接続がありません。オンラインになってから再度お試しください。');
    }
  }
  
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const testDoc = doc(db, '_test_', '_connection_');
    await withTimeout(getDoc(testDoc), 5000).catch(() => {
      // エラーは無視
    });
  } catch (error) {
    console.warn('Firestore connection check failed:', error);
  }
};

export { app, auth, db, storage }
export default app