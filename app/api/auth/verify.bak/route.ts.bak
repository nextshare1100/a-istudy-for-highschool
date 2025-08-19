import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase'
import { signInWithCustomToken } from 'firebase/auth'

// 簡易的なトークン検証
// 本番環境では Firebase Admin SDK を使用することを推奨
async function verifyIdToken(token: string) {
  try {
    // クライアントサイドのFirebase Authを使用した簡易検証
    // トークンの形式チェック
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid token format')
    }

    // ペイロードのデコード
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString()
    )

    // 有効期限チェック
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error('Token expired')
    }

    return {
      uid: payload.user_id || payload.sub,
      email: payload.email,
    }
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    const decoded = await verifyIdToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      uid: decoded.uid,
      email: decoded.email,
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Token verification failed' },
      { status: 401 }
    )
  }
}
