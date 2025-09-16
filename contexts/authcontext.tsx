'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore'
import { useRouter, usePathname } from 'next/navigation'
import { setCookie, deleteCookie } from 'cookies-next'

interface UserData {
  uid: string
  email: string
  displayName: string
  grade?: string
  school?: string
  subjects?: string[]
  aspirations?: string[]
  photoURL?: string
  subscriptionStatus?: 'free' | 'premium' | 'corporate'
  corporateId?: string
  corporateExpired?: boolean
  dailyChallenges?: {
    [date: string]: any
  }
  studyStats?: {
    currentStreak?: number
    longestStreak?: number
    lastActiveDate?: any
    totalStudyTime?: number
    subjectProgress?: {
      [subject: string]: number
    }
  }
  subscription?: {
    isActive: boolean
    isInTrial: boolean
    status: 'active' | 'trial' | 'expired' | 'cancelled' | 'none'
    expirationDate?: any
    autoRenewing?: boolean
    platform?: 'ios' | 'android' | 'web'
    productId?: string
  }
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUserData: () => Promise<void>
  isPremium: boolean
  isCorporate: boolean
  hasActiveSubscription: boolean
  isInTrial: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  refreshUserData: async () => {},
  isPremium: false,
  isCorporate: false,
  hasActiveSubscription: false,
  isInTrial: false
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // ユーザーデータの取得
  const fetchUserData = async (uid: string): Promise<UserData | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData
        
        // 企業ユーザーの有効期限チェック
        if (data.subscriptionStatus === 'corporate' && data.corporateId) {
          const corporateDoc = await getDoc(doc(db, 'corporates', data.corporateId))
          if (corporateDoc.exists()) {
            const corporate = corporateDoc.data()
            const now = new Date()
            const expiredAt = corporate.expiredAt?.toDate() || null
            
            if (expiredAt && expiredAt < now) {
              data.corporateExpired = true
            }
          }
        }
        
        return data
      }
      return null
    } catch (error) {
      console.error('Error fetching user data:', error)
      return null
    }
  }

  // 認証状態の監視
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true)
      
      if (firebaseUser) {
        setUser(firebaseUser)
        setCookie('auth-token', firebaseUser.uid, { maxAge: 60 * 60 * 24 * 30 })
        
        const data = await fetchUserData(firebaseUser.uid)
        setUserData(data)
      } else {
        setUser(null)
        setUserData(null)
        deleteCookie('auth-token')
      }
      
      setLoading(false)
    })

    return () => unsubscribeAuth()
  }, [])

  // ユーザーデータのリアルタイム監視
  useEffect(() => {
    let unsubscribeFirestore: Unsubscribe | null = null
    
    if (user) {
      unsubscribeFirestore = onSnapshot(
        doc(db, 'users', user.uid),
        (snapshot) => {
          if (snapshot.exists()) {
            setUserData(snapshot.data() as UserData)
          }
        },
        (error) => {
          console.error('Error listening to user data:', error)
          setError('ユーザーデータの取得に失敗しました')
        }
      )
    }

    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore()
      }
    }
  }, [user])

  // 未認証ユーザーのリダイレクト
  useEffect(() => {
    if (!loading && !user) {
      // 公開パスのリスト
      const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/terms', '/privacy']
      
      if (!publicPaths.includes(pathname)) {
        console.log('Not authenticated, redirecting to login')
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
      }
    }
  }, [user, loading, pathname, router])

  // サブスクリプションチェックとリダイレクト
  useEffect(() => {
    if (!loading && user && userData) {
      const subscription = userData.subscription
      const hasActiveSubscription = subscription?.isActive || false
      const isInTrial = subscription?.isInTrial || false
      
      // サブスクリプション関連のパスは除外
      const isSubscriptionPath = pathname === '/subscription/onboarding' || 
                               pathname === '/account/subscription'
      
      // 認証関連のパスは除外
      const isAuthPath = pathname === '/login' || 
                        pathname === '/register' ||
                        pathname === '/forgot-password' ||
                        pathname === '/reset-password'
      
      // サブスクリプションがない場合は強制リダイレクト
      if (!hasActiveSubscription && !isInTrial && !isSubscriptionPath && !isAuthPath) {
        console.log('No active subscription, redirecting to onboarding')
        router.push('/subscription/onboarding')
      }
    }
  }, [user, userData, loading, pathname, router])

  // ログイン
  const login = async (email: string, password: string) => {
    // Firebase AuthのsignInWithEmailAndPasswordは
    // 自動的にonAuthStateChangedをトリガーするので
    // ここでは特に何もしない
  }

  // ログアウト
  const logout = async () => {
    try {
      await firebaseSignOut(auth)
      deleteCookie('auth-token')
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      setError('ログアウトに失敗しました')
    }
  }

  // ユーザーデータの再取得
  const refreshUserData = async () => {
    if (user) {
      const data = await fetchUserData(user.uid)
      setUserData(data)
    }
  }

  // サブスクリプション状態の計算
  const subscription = userData?.subscription
  const hasActiveSubscription = subscription?.isActive || false
  const isInTrial = subscription?.isInTrial || false
  const isPremium = hasActiveSubscription && !isInTrial
  const isCorporate = userData?.subscriptionStatus === 'corporate' && !userData?.corporateExpired

  const value = {
    user,
    userData,
    loading,
    error,
    login,
    logout,
    refreshUserData,
    isPremium,
    isCorporate,
    hasActiveSubscription,
    isInTrial
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}