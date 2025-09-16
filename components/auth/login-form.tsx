'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Mail, Lock, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // リダイレクト先を取得
  const intendedRedirect = searchParams.get('redirect') || '/home'

  // レスポンシブ対応
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // スタイル定義（変更なし）
  const styles = {
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: isMobile ? '16px' : '20px',
    },
    inputSection: {
      marginBottom: '0',
    },
    label: {
      display: 'block',
      fontSize: isMobile ? '13px' : '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: isMobile ? '6px' : '8px',
    },
    inputWrapper: {
      position: 'relative' as const,
    },
    input: {
      width: '100%',
      padding: isMobile ? '12px 14px' : '14px 16px',
      paddingRight: isMobile ? '40px' : '48px',
      borderRadius: isMobile ? '10px' : '12px',
      border: '2px solid #e5e7eb',
      fontSize: isMobile ? '14px' : '16px',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
      backgroundColor: 'white',
      boxSizing: 'border-box' as const,
      outline: 'none',
    },
    inputFocus: {
      borderColor: '#3b82f6',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
    },
    inputError: {
      borderColor: '#ef4444',
    },
    inputIcon: {
      position: 'absolute' as const,
      right: isMobile ? '12px' : '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9ca3af',
    },
    passwordToggle: {
      position: 'absolute' as const,
      right: isMobile ? '12px' : '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#6b7280',
      padding: '4px',
      transition: 'color 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    passwordToggleHover: {
      color: '#374151',
    },
    errorAlert: {
      backgroundColor: '#fee2e2',
      border: '1px solid #fca5a5',
      borderRadius: isMobile ? '10px' : '12px',
      padding: isMobile ? '12px' : '16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: isMobile ? '10px' : '12px',
    },
    errorIcon: {
      flexShrink: 0,
    },
    errorContent: {
      flex: 1,
    },
    errorTitle: {
      fontWeight: '600',
      color: '#7f1d1d',
      marginBottom: '4px',
      fontSize: isMobile ? '13px' : '14px',
    },
    errorText: {
      fontSize: isMobile ? '12px' : '14px',
      color: '#991b1b',
    },
    submitButton: {
      width: '100%',
      padding: isMobile ? '14px 20px' : '16px 24px',
      borderRadius: isMobile ? '10px' : '12px',
      border: 'none',
      backgroundColor: '#3b82f6',
      color: 'white',
      fontSize: isMobile ? '14px' : '16px',
      fontWeight: '700',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isMobile ? '6px' : '8px',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
      marginTop: isMobile ? '8px' : '12px',
    },
    submitButtonHover: {
      backgroundColor: '#2563eb',
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)',
    },
    submitButtonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    forgotPassword: {
      textAlign: 'right' as const,
      marginTop: isMobile ? '4px' : '6px',
    },
    forgotPasswordLink: {
      fontSize: isMobile ? '12px' : '13px',
      color: '#3b82f6',
      textDecoration: 'none',
      fontWeight: '500',
      transition: 'color 0.2s',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0,
      textAlign: 'right' as const,
      width: '100%',
    },
    forgotPasswordLinkHover: {
      color: '#2563eb',
      textDecoration: 'underline',
    },
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('ログイン試行中...')
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      console.log('ログイン成功:', user.uid)
      
      // 最終ログイン時刻を更新（エラーが出ても続行）
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          lastLoginAt: serverTimestamp()
        })
      } catch (error) {
        console.error('最終ログイン更新エラー:', error)
      }
      
      // 決済システムを削除したため、直接ホーム画面へ遷移
      console.log('ホーム画面へリダイレクト:', intendedRedirect)
      toast({
        title: 'ログインしました',
        description: 'ホーム画面へ移動します',
      })
      
      // 少し遅延を入れて認証状態が確実に更新されるようにする
      setTimeout(() => {
        router.push(intendedRedirect);
      }, 100);
      
    } catch (err: any) {
      console.error('Login error:', err)
      
      // エラーメッセージの日本語化
      switch (err.code) {
        case 'auth/invalid-email':
          setError('無効なメールアドレスです')
          break
        case 'auth/user-disabled':
          setError('このアカウントは無効化されています')
          break
        case 'auth/user-not-found':
          setError('アカウントが見つかりません')
          break
        case 'auth/wrong-password':
          setError('パスワードが間違っています')
          break
        case 'auth/invalid-credential':
          setError('メールアドレスまたはパスワードが間違っています')
          break
        case 'auth/network-request-failed':
          setError('ネットワークエラーが発生しました')
          break
        case 'auth/too-many-requests':
          setError('ログイン試行回数が多すぎます。しばらくしてからお試しください')
          break
        default:
          setError('ログインに失敗しました: ' + (err.message || '不明なエラー'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* エラー表示 */}
        {error && (
          <div style={styles.errorAlert}>
            <AlertCircle size={isMobile ? 18 : 20} color="#ef4444" style={styles.errorIcon} />
            <div style={styles.errorContent}>
              <div style={styles.errorTitle}>
                エラー
              </div>
              <div style={styles.errorText}>
                {error}
              </div>
            </div>
          </div>
        )}

        {/* メールアドレス入力 */}
        <div style={styles.inputSection}>
          <label style={styles.label} htmlFor="email">
            メールアドレス
          </label>
          <div style={styles.inputWrapper}>
            <input
              id="email"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                ...styles.input,
                ...(focusedInput === 'email' ? styles.inputFocus : {}),
                ...(error ? styles.inputError : {}),
              }}
              onFocus={() => {
                setFocusedInput('email')
                setError('')
              }}
              onBlur={() => setFocusedInput(null)}
            />
            <Mail size={isMobile ? 18 : 20} style={styles.inputIcon} />
          </div>
        </div>

        {/* パスワード入力 */}
        <div style={styles.inputSection}>
          <label style={styles.label} htmlFor="password">
            パスワード
          </label>
          <div style={styles.inputWrapper}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{
                ...styles.input,
                ...(focusedInput === 'password' ? styles.inputFocus : {}),
                ...(error ? styles.inputError : {}),
              }}
              onFocus={() => {
                setFocusedInput('password')
                setError('')
              }}
              onBlur={() => setFocusedInput(null)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                ...styles.passwordToggle,
                ...(hoveredButton === 'password-toggle' ? styles.passwordToggleHover : {}),
              }}
              onMouseEnter={() => setHoveredButton('password-toggle')}
              onMouseLeave={() => setHoveredButton(null)}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff size={isMobile ? 18 : 20} />
              ) : (
                <Eye size={isMobile ? 18 : 20} />
              )}
            </button>
          </div>
          <div style={styles.forgotPassword}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                router.push('/forgot-password');
              }}
              style={{
                ...styles.forgotPasswordLink,
                ...(hoveredButton === 'forgot' ? styles.forgotPasswordLinkHover : {}),
              }}
              onMouseEnter={() => setHoveredButton('forgot')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              パスワードを忘れた方
            </button>
          </div>
        </div>

        {/* ログインボタン */}
        <button
          type="submit"
          disabled={loading}
          style={{
            ...styles.submitButton,
            ...(loading ? styles.submitButtonDisabled : {}),
            ...(hoveredButton === 'submit' && !loading ? styles.submitButtonHover : {}),
          }}
          onMouseEnter={() => !loading && setHoveredButton('submit')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          {loading ? (
            <>
              <Loader2 size={isMobile ? 16 : 20} className="animate-spin" />
              ログイン中...
            </>
          ) : (
            <>
              ログイン
              <ArrowRight size={isMobile ? 16 : 20} />
            </>
          )}
        </button>
      </form>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </>
  )
}