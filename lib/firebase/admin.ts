// lib/firebase/admin.ts
import { initializeApp, cert, getApps, App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

let app: App

// Firebase Admin SDKの初期化
function initAdmin() {
  if (getApps().length === 0) {
    // 環境変数からサービスアカウントキーを取得
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }

    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      throw new Error('Firebase Admin SDK の環境変数が設定されていません')
    }

    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    })
  } else {
    app = getApps()[0]
  }
  
  return app
}

// 初期化を確実に行う
initAdmin()

// Auth インスタンスをエクスポート
export const adminAuth = getAuth(app)

// Firestore インスタンスをエクスポート
export const adminFirestore = getFirestore(app)

// トークン検証関数
export async function verifyIdToken(token: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token)
    return { success: true, decodedToken }
  } catch (error) {
    console.error('トークン検証エラー:', error)
    return { success: false, error: 'Invalid token' }
  }
}

// カスタムクレームの設定
export async function setCustomUserClaims(uid: string, claims: Record<string, any>) {
  try {
    await adminAuth.setCustomUserClaims(uid, claims)
    return { success: true }
  } catch (error) {
    console.error('カスタムクレーム設定エラー:', error)
    return { success: false, error: 'Failed to set custom claims' }
  }
}

// ユーザーの無効化
export async function disableUser(uid: string) {
  try {
    await adminAuth.updateUser(uid, { disabled: true })
    return { success: true }
  } catch (error) {
    console.error('ユーザー無効化エラー:', error)
    return { success: false, error: 'Failed to disable user' }
  }
}

// ユーザーの有効化
export async function enableUser(uid: string) {
  try {
    await adminAuth.updateUser(uid, { disabled: false })
    return { success: true }
  } catch (error) {
    console.error('ユーザー有効化エラー:', error)
    return { success: false, error: 'Failed to enable user' }
  }
}