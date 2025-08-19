// lib/firebase-admin.ts - 完全版
import { initializeApp, getApps, cert, ServiceAccount, App } from 'firebase-admin/app'
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore'
import { getAuth, Auth } from 'firebase-admin/auth'

let adminApp: App | undefined
let adminDb: Firestore | undefined
let adminAuth: Auth | undefined

// Admin SDKの初期化
export function initAdmin(): App {
  if (!adminApp && getApps().length === 0) {
    try {
      // 環境変数から認証情報を取得
      const projectId = process.env.FIREBASE_PROJECT_ID
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

      if (!projectId || !clientEmail || !privateKey) {
        console.error('Missing Firebase Admin environment variables')
        throw new Error('Firebase Admin環境変数が設定されていません')
      }

      const serviceAccount: ServiceAccount = {
        projectId,
        clientEmail,
        privateKey,
      }

      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId,
      })

      console.log('Firebase Admin initialized successfully')
    } catch (error) {
      console.error('Firebase Admin initialization error:', error)
      throw error
    }
  }
  
  return adminApp!
}

// Admin Firestoreのインスタンスを取得
export function getAdminFirestore(): Firestore {
  if (!adminDb) {
    initAdmin()
    adminDb = getFirestore(adminApp!)
  }
  return adminDb
}

// Admin Authのインスタンスを取得
export function getAdminAuth(): Auth {
  if (!adminAuth) {
    initAdmin()
    adminAuth = getAuth(adminApp!)
  }
  return adminAuth
}

// IDトークンの検証
export async function verifyIdToken(token: string): Promise<any> {
  try {
    const auth = getAdminAuth()
    const decodedToken = await auth.verifyIdToken(token)
    return decodedToken
  } catch (error) {
    console.error('Error verifying token:', error)
    throw new Error('Invalid authentication token')
  }
}

// ユーザーの存在確認
export async function verifyUserExists(uid: string): Promise<boolean> {
  try {
    const auth = getAdminAuth()
    await auth.getUser(uid)
    return true
  } catch (error) {
    return false
  }
}

// カスタムクレームの設定
export async function setCustomUserClaims(
  uid: string, 
  claims: Record<string, any>
): Promise<void> {
  try {
    const auth = getAdminAuth()
    await auth.setCustomUserClaims(uid, claims)
  } catch (error) {
    console.error('Error setting custom claims:', error)
    throw error
  }
}

// バッチ処理用のFirestoreバッチを取得
export function getAdminBatch() {
  const db = getAdminFirestore()
  return db.batch()
}

// タイムスタンプの取得
export function getServerTimestamp() {
  const admin = require('firebase-admin')
  return admin.firestore.FieldValue.serverTimestamp()
}

// 互換性のためのエクスポート（既存のコードとの互換性を保つため）
export const auth = {
  getUser: async (uid: string) => {
    const adminAuth = getAdminAuth();
    return adminAuth.getUser(uid);
  },
  verifyIdToken: async (token: string) => {
    const adminAuth = getAdminAuth();
    return adminAuth.verifyIdToken(token);
  },
  setCustomUserClaims: async (uid: string, claims: Record<string, any>) => {
    const adminAuth = getAdminAuth();
    return adminAuth.setCustomUserClaims(uid, claims);
  },
  createUser: async (properties: any) => {
    const adminAuth = getAdminAuth();
    return adminAuth.createUser(properties);
  },
  updateUser: async (uid: string, properties: any) => {
    const adminAuth = getAdminAuth();
    return adminAuth.updateUser(uid, properties);
  },
  deleteUser: async (uid: string) => {
    const adminAuth = getAdminAuth();
    return adminAuth.deleteUser(uid);
  },
  listUsers: async (maxResults?: number, pageToken?: string) => {
    const adminAuth = getAdminAuth();
    return adminAuth.listUsers(maxResults, pageToken);
  }
};

export const db = {
  collection: (path: string) => {
    const adminDb = getAdminFirestore();
    return adminDb.collection(path);
  },
  doc: (path: string) => {
    const adminDb = getAdminFirestore();
    return adminDb.doc(path);
  },
  collectionGroup: (collectionId: string) => {
    const adminDb = getAdminFirestore();
    return adminDb.collectionGroup(collectionId);
  },
  batch: () => {
    const adminDb = getAdminFirestore();
    return adminDb.batch();
  },
  runTransaction: async (updateFunction: any) => {
    const adminDb = getAdminFirestore();
    return adminDb.runTransaction(updateFunction);
  }
};

// FieldValueをエクスポート（法人契約システムで使用）
export { FieldValue }