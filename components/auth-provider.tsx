// components/auth-provider.tsx

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName?: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  updateUserProfile: async () => {},
  signInWithGoogle: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    // Googleログインのリダイレクト結果を処理
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          router.push('/dashboard')
        }
      })
      .catch((error) => {
        console.error('Redirect result error:', error)
      })

    return () => unsubscribe()
  }, [router])

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Sign in error:', error)
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      
      if (displayName) {
        await updateProfile(user, { displayName })
      }
      
      router.push('/onboarding')
    } catch (error: any) {
      console.error('Sign up error:', error)
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error: any) {
      console.error('Logout error:', error)
      throw new Error('ログアウトに失敗しました')
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      console.error('Password reset error:', error)
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    if (!user) throw new Error('ユーザーがログインしていません')
    
    try {
      await updateProfile(user, { displayName, photoURL })
      // ユーザー情報を再読み込み
      setUser({ ...user, displayName, photoURL: photoURL || user.photoURL })
    } catch (error: any) {
      console.error('Profile update error:', error)
      throw new Error('プロフィールの更新に失敗しました')
    }
  }

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      
      // モバイルデバイスの検出
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      
      if (isMobile) {
        // モバイルではリダイレクト方式を使用
        await signInWithRedirect(auth, provider)
      } else {
        // デスクトップではポップアップ方式を使用
        const result = await signInWithPopup(auth, provider)
        if (result.user) {
          router.push('/dashboard')
        }
      }
    } catch (error: any) {
      console.error('Google sign in error:', error)
      throw new Error(getAuthErrorMessage(error.code))
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    resetPassword,
    updateUserProfile,
    signInWithGoogle,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// エラーメッセージの日本語化
function getAuthErrorMessage(errorCode: string): string {
  const errorMessages: { [key: string]: string } = {
    'auth/email-already-in-use': 'このメールアドレスは既に使用されています',
    'auth/invalid-email': 'メールアドレスの形式が正しくありません',
    'auth/operation-not-allowed': 'この操作は許可されていません',
    'auth/weak-password': 'パスワードは6文字以上で設定してください',
    'auth/user-disabled': 'このアカウントは無効化されています',
    'auth/user-not-found': 'アカウントが見つかりません',
    'auth/wrong-password': 'パスワードが正しくありません',
    'auth/invalid-credential': 'メールアドレスまたはパスワードが正しくありません',
    'auth/too-many-requests': 'ログイン試行回数が多すぎます。しばらく時間をおいてから再度お試しください',
    'auth/network-request-failed': 'ネットワークエラーが発生しました',
    'auth/popup-closed-by-user': 'ログインがキャンセルされました',
    'auth/cancelled-popup-request': 'ログイン処理がキャンセルされました',
    'auth/popup-blocked': 'ポップアップがブロックされました。ブラウザの設定を確認してください',
  }
  
  return errorMessages[errorCode] || 'エラーが発生しました'
}