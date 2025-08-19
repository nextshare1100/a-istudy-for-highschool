// lib/api/auth.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/config'
import { DecodedIdToken } from 'firebase-admin/auth'
import * as admin from 'firebase-admin'

// Firebase Admin SDKの初期化（まだ初期化されていない場合）
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  } catch (error) {
    console.error('Firebase admin initialization error:', error)
  }
}

export interface AuthenticatedRequest extends NextRequest {
  user?: DecodedIdToken
}

/**
 * JWT/Firebaseトークンを検証する認証ミドルウェア
 */
export async function verifyAuth(
  request: NextRequest
): Promise<{ success: boolean; user?: DecodedIdToken; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: '認証トークンが見つかりません' }
    }

    const token = authHeader.substring(7)
    
    if (!token) {
      return { success: false, error: '無効なトークン形式です' }
    }

    // Firebase認証トークンの検証
    try {
      const decodedToken = await admin.auth().verifyIdToken(token)
      return { success: true, user: decodedToken }
    } catch (firebaseError) {
      console.error('Firebase token verification error:', firebaseError)
      
      // 開発環境用のフォールバック（本番環境では削除すること）
      if (process.env.NODE_ENV === 'development' && token === 'dev-token') {
        return {
          success: true,
          user: {
            uid: 'dev-user-id',
            email: 'dev@example.com',
          } as DecodedIdToken,
        }
      }
      
      return { success: false, error: '無効な認証トークンです' }
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { success: false, error: 'サーバーエラーが発生しました' }
  }
}

/**
 * 認証が必要なAPIルートのラッパー関数
 */
export function withAuth(
  handler: (
    request: NextRequest,
    user: DecodedIdToken,
    context?: any
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    const authResult = await verifyAuth(request)
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }
    
    return handler(request, authResult.user!, context)
  }
}

/**
 * ユーザーIDから権限を確認する
 */
export async function checkUserPermissions(
  userId: string,
  requiredPermissions: string[]
): Promise<boolean> {
  try {
    // Firestoreからユーザー情報を取得
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get()
    
    if (!userDoc.exists) {
      return false
    }
    
    const userData = userDoc.data()
    const userPermissions = userData?.permissions || []
    
    // 必要な権限がすべて含まれているか確認
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    )
  } catch (error) {
    console.error('Permission check error:', error)
    return false
  }
}

/**
 * APIレート制限のチェック（オプション）
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  limit: number = 100,
  windowMinutes: number = 60
): Promise<boolean> {
  try {
    const now = Date.now()
    const windowStart = now - (windowMinutes * 60 * 1000)
    
    // Firestoreでレート制限をチェック
    const requestsRef = admin.firestore()
      .collection('api_requests')
      .where('userId', '==', userId)
      .where('endpoint', '==', endpoint)
      .where('timestamp', '>=', windowStart)
    
    const snapshot = await requestsRef.get()
    
    if (snapshot.size >= limit) {
      return false
    }
    
    // リクエストを記録
    await admin.firestore().collection('api_requests').add({
      userId,
      endpoint,
      timestamp: now,
    })
    
    return true
  } catch (error) {
    console.error('Rate limit check error:', error)
    // エラーの場合は制限しない
    return true
  }
}
