'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'

interface UserData {
  email?: string;
  displayName?: string;
  subscriptionStatus?: 'free' | 'premium' | 'corporate';
  corporateId?: string;
  corporateCompanyName?: string;
  corporateActivatedAt?: string;
  corporateExpiredAt?: string;
  role?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  isAdmin: boolean
  isPremium: boolean
  isCorporate: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  // ユーザーデータを取得する関数
  const fetchUserData = async (uid: string): Promise<UserData | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        const data = userDoc.data() as UserData
        
        // 法人契約の有効性を確認
        if (data.subscriptionStatus === 'corporate' && data.corporateId) {
          const contractDoc = await getDoc(doc(db, 'corporate_contracts', data.corporateId))
          if (contractDoc.exists()) {
            const contractData = contractDoc.data()
            
            // 契約が期限切れの場合
            if (contractData.status === 'expired' || 
                new Date(contractData.contractEndDate) < new Date()) {
              // ステータスは更新しないが、フラグを立てる
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

  // ユーザーデータをリアルタイムで監視
  useEffect(() => {
    if (!user) {
      setUserData(null)
      return
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists()) {
          setUserData(doc.data() as UserData)
        }
      },
      (error) => {
        console.error('Error listening to user data:', error)
      }
    )

    return () => unsubscribe()
  }, [user])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      
      if (user) {
        const data = await fetchUserData(user.uid)
        setUserData(data)
      } else {
        setUserData(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    await signOut(auth)
    setUserData(null)
  }

  const refreshUserData = async () => {
    if (user) {
      const data = await fetchUserData(user.uid)
      setUserData(data)
    }
  }

  // 便利なゲッター
  const isAdmin = userData?.role === 'admin'
  const isPremium = userData?.subscriptionStatus === 'premium' || userData?.subscriptionStatus === 'corporate'
  const isCorporate = userData?.subscriptionStatus === 'corporate' && !userData?.corporateExpired

  const value = {
    user,
    userData,
    loading,
    isAdmin,
    isPremium,
    isCorporate,
    signIn,
    signUp,
    logout,
    refreshUserData
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}