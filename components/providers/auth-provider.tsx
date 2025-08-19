// components/providers/auth-provider.tsx
'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setUserProfile } = useAuthStore();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email);
      
      if (firebaseUser) {
        // Firebaseユーザーを保存
        setUser(firebaseUser);
        
        // ユーザープロフィールを取得
        try {
          const response = await fetch(`/api/users/${firebaseUser.uid}`);
          if (response.ok) {
            const profile = await response.json();
            setUserProfile(profile);
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });
    
    return () => unsubscribe();
  }, [setUser, setUserProfile]);
  
  return <>{children}</>;
}

// app/layout.tsx で使用
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}