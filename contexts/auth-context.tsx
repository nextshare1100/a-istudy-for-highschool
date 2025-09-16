'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userId: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userId: '',
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Capacitor環境での認証タイムアウト処理
    const authTimeout = setTimeout(() => {
      if (loading) {
        console.log('Auth timeout - setting loading to false');
        setLoading(false);
      }
    }, 5000); // 5秒でタイムアウト

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user?.uid || 'null');
      setUser(user);
      setLoading(false);
      clearTimeout(authTimeout);
    }, (error) => {
      console.error('Auth error:', error);
      setLoading(false);
      clearTimeout(authTimeout);
    });

    return () => {
      unsubscribe();
      clearTimeout(authTimeout);
    };
  }, [loading]);

  const value = {
    user,
    loading,
    userId: user?.uid || '',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
