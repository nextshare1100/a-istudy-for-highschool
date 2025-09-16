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

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Firebase設定のバリデーション
function validateConfig() {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId']
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig])
  
  if (missingFields.length > 0) {
    console.error('Missing Firebase config fields:', missingFields)
    throw new Error(`Missing Firebase configuration: ${missingFields.join(', ')}`)
  }
}

// Initialize Firebase
let app: ReturnType<typeof initializeApp>
let auth: ReturnType<typeof getAuth>
let db: ReturnType<typeof getFirestore>
let storage: ReturnType<typeof getStorage>

try {
  validateConfig()
  
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig)
    
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
    db = getFirestore(app)
  }
  
  // Initialize other services
  auth = getAuth(app)
  storage = getStorage(app)
} catch (error) {
  console.error('Firebase initialization error:', error)
  throw error
}

// エミュレーター設定（開発環境のみ）
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  // エミュレーターが既に接続されているかチェック
  // @ts-ignore
  if (!auth.emulatorConfig) {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
  }
  
  // Firestoreエミュレーターの接続
  try {
    // @ts-ignore - _settingsは内部プロパティ
    if (!db._settings?.host?.includes('localhost:8080')) {
      connectFirestoreEmulator(db, 'localhost', 8080)
    }
  } catch (error) {
    console.log('Firestore emulator may already be connected')
  }
  
  // Storageエミュレーターの接続
  try {
    // @ts-ignore
    if (!storage._delegate?._location?.host?.includes('localhost:9199')) {
      connectStorageEmulator(storage, 'localhost', 9199)
    }
  } catch (error) {
    console.log('Storage emulator may already be connected')
  }
}

// Firestoreクエリにタイムアウトを追加するヘルパー関数
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
  )
  
  return Promise.race([promise, timeoutPromise])
}

// オンライン状態を確認する関数
export const ensureOnline = async () => {
  // ブラウザ環境でのみ実行
  if (typeof window === 'undefined') {
    return;
  }

  // オンライン状態をチェック
  if (!navigator.onLine) {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!navigator.onLine) {
      throw new Error('インターネット接続がありません。オンラインになってから再度お試しください。');
    }
  }
  
  // Firestoreの接続状態も確認（タイムアウト付き）
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const testDoc = doc(db, '_test_', '_connection_');
    await withTimeout(getDoc(testDoc), 5000).catch(() => {
      // エラーは無視（ドキュメントが存在しなくても問題ない）
    });
  } catch (error) {
    console.warn('Firestore connection check failed:', error);
  }
};

// Named exports
export { app, auth, db, storage }

// Default export
export default app
