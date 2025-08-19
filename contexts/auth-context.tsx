// contexts/auth-context.tsx
'use client'

import { createContext, useContext, ReactNode } from 'react'
import { User } from 'firebase/auth'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/config'

interface AuthContextType {
  user: User | null | undefined
  loading: boolean
  error: Error | undefined
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: undefined,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, loading, error] = useAuthState(auth)
  
  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)