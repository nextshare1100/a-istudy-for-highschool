'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, User } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'

export default function DebugHomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState('初期化中...')
  const router = useRouter()

  useEffect(() => {
    setStep('認証状態を監視中...')
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setStep('認証状態変更を検出')
      console.log('Debug: Auth state changed:', currentUser?.uid || 'null')
      
      if (currentUser) {
        setStep('ユーザー認証済み')
        setUser(currentUser)
        
        // 段階的にデータを読み込み
        setTimeout(() => setStep('ユーザーデータ読み込み完了'), 1000)
        setTimeout(() => setStep('すべて完了'), 2000)
        setTimeout(() => setLoading(false), 2500)
      } else {
        setStep('未認証 - ログインページへ')
        router.push('/login')
      }
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <h2>デバッグモード</h2>
        <p>{step}</p>
        <p>現在のステップ: {loading ? 'ローディング中' : '完了'}</p>
        {user && <p>ユーザー: {user.email}</p>}
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>デバッグホーム画面</h1>
      <p>認証成功！</p>
      <p>ユーザー: {user?.email}</p>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => router.push('/problems/create')}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          問題作成
        </button>
        
        <button 
          onClick={() => {
            window.location.reload()
          }}
          style={{
            background: '#10b981',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          リロード
        </button>
      </div>
    </div>
  )
}
