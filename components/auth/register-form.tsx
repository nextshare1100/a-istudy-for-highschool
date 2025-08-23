'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { createUserProfile, saveTermsAgreement } from '@/lib/firebase/firestore'
import { toast } from '@/components/ui/use-toast'
import { GraduationCap, FileText, Lock, Mail, User, Shield, Sparkles, ChevronDown } from 'lucide-react'
import { TERMS_OF_SERVICE } from '@/constants/terms'

type Grade = '高校1年' | '高校2年' | '高校3年'

export function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [grade, setGrade] = useState<Grade>('高校1年')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showGradeDropdown, setShowGradeDropdown] = useState(false)
  const router = useRouter()
  
  // 利用規約関連の状態
  const [showTerms, setShowTerms] = useState(false)
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [parentalConsent, setParentalConsent] = useState(false)
  
  // フォームがすべて入力されているかチェック
  const isFormValid = email && password && displayName && grade
  
  // 未成年者かどうかの判定
  const isMinor = grade !== '高校3年'
  
  // すべての同意が完了しているかチェック
  const allAgreed = termsAgreed && privacyAgreed && (!isMinor || parentalConsent)
  
  // 登録ボタンが有効かどうか
  const canRegister = isFormValid && allAgreed && !loading

  // モバイル判定 - SSR対応
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    // クライアントサイドでのみ実行
    setIsClient(true)
    
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768)
      }
    }
    
    checkMobile()
    
    // イベントリスナーもクライアントサイドでのみ追加
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile)
      return () => window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // スタイル定義（モバイル対応）
  const styles = {
    form: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: isMobile ? '12px' : '20px',
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    fieldGroup: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: isMobile ? '4px' : '8px',
    },
    label: {
      fontSize: isMobile ? '12px' : '14px',
      fontWeight: '500',
      color: '#374151',
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '4px' : '8px',
    },
    icon: {
      width: isMobile ? '14px' : '16px',
      height: isMobile ? '14px' : '16px',
      color: '#9CA3AF',
    },
    input: {
      width: '100%',
      height: isMobile ? '36px' : '44px',
      padding: isMobile ? '0 12px' : '0 16px',
      fontSize: isMobile ? '13px' : '15px',
      border: '1px solid #E5E7EB',
      borderRadius: isMobile ? '6px' : '8px',
      backgroundColor: '#FFFFFF',
      transition: 'all 0.2s',
      outline: 'none',
      fontFamily: 'inherit',
      boxSizing: 'border-box' as const,
      WebkitAppearance: 'none' as const,
      MozAppearance: 'none' as const,
      appearance: 'none' as const,
    },
    inputFocus: {
      borderColor: '#6366F1',
      boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
    },
    selectButton: {
      width: '100%',
      height: isMobile ? '36px' : '44px',
      padding: isMobile ? '0 12px' : '0 16px',
      fontSize: isMobile ? '13px' : '15px',
      border: '1px solid #E5E7EB',
      borderRadius: isMobile ? '6px' : '8px',
      backgroundColor: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
      boxSizing: 'border-box' as const,
      WebkitAppearance: 'none' as const,
      MozAppearance: 'none' as const,
      appearance: 'none' as const,
    },
    dropdown: {
      position: 'absolute' as const,
      top: '100%',
      left: 0,
      right: 0,
      marginTop: '4px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: isMobile ? '6px' : '8px',
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden',
      zIndex: 10,
    },
    dropdownItem: {
      padding: isMobile ? '8px 12px' : '12px 16px',
      fontSize: isMobile ? '13px' : '15px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      borderBottom: '1px solid #F3F4F6',
    },
    helpText: {
      fontSize: isMobile ? '10px' : '12px',
      color: '#6B7280',
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '2px' : '4px',
    },
    termsSection: {
      backgroundColor: '#F9FAFB',
      borderRadius: isMobile ? '8px' : '12px',
      padding: isMobile ? '10px' : '16px',
      border: '1px solid #E5E7EB',
      boxSizing: 'border-box' as const,
      width: '100%',
    },
    termsSectionHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '4px' : '8px',
      fontSize: isMobile ? '12px' : '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: isMobile ? '8px' : '12px',
    },
    checkboxContainer: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: isMobile ? '8px' : '12px',
      cursor: 'pointer',
      marginBottom: isMobile ? '6px' : '10px',
    },
    checkbox: {
      width: isMobile ? '16px' : '20px',
      height: isMobile ? '16px' : '20px',
      borderRadius: '4px',
      border: '2px solid #D1D5DB',
      backgroundColor: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: '2px',
      transition: 'all 0.2s',
      cursor: 'pointer',
    },
    checkboxChecked: {
      backgroundColor: '#6366F1',
      borderColor: '#6366F1',
    },
    checkboxText: {
      fontSize: isMobile ? '11px' : '14px',
      color: '#374151',
      lineHeight: '1.5',
      wordBreak: 'keep-all' as const,
      flex: 1,
    },
    link: {
      color: '#6366F1',
      fontWeight: '500',
      textDecoration: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      gap: isMobile ? '2px' : '4px',
      cursor: 'pointer',
      transition: 'color 0.2s',
    },
    parentalConsentBox: {
      backgroundColor: '#FEF3C7',
      padding: isMobile ? '8px' : '12px',
      borderRadius: isMobile ? '6px' : '8px',
      border: '1px solid #FCD34D',
    },
    errorBox: {
      backgroundColor: '#FEE2E2',
      border: '1px solid #FECACA',
      color: '#DC2626',
      padding: isMobile ? '8px 12px' : '12px 16px',
      borderRadius: isMobile ? '6px' : '8px',
      fontSize: isMobile ? '11px' : '14px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: isMobile ? '6px' : '8px',
    },
    submitButton: {
      width: '100%',
      height: isMobile ? '40px' : '48px',
      background: 'linear-gradient(to right, #8B5CF6, #3B82F6, #6366F1)',
      color: '#FFFFFF',
      fontSize: isMobile ? '14px' : '16px',
      fontWeight: '600',
      border: 'none',
      borderRadius: isMobile ? '6px' : '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isMobile ? '6px' : '8px',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
    },
    submitButtonHover: {
      transform: 'translateY(-1px)',
      boxShadow: '0 6px 20px rgba(99, 102, 241, 0.35)',
    },
    submitButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
      transform: 'none',
    },
    warningBox: {
      fontSize: isMobile ? '10px' : '12px',
      textAlign: 'center' as const,
      color: '#D97706',
      backgroundColor: '#FEF3C7',
      padding: isMobile ? '6px 8px' : '8px 12px',
      borderRadius: isMobile ? '6px' : '8px',
    },
    modal: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: isMobile ? '12px' : '20px',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: isMobile ? '12px' : '16px',
      maxWidth: isMobile ? '100%' : '800px',
      width: '100%',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column' as const,
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
    },
    modalHeader: {
      padding: isMobile ? '16px' : '24px',
      borderBottom: '1px solid #E5E7EB',
    },
    modalTitle: {
      fontSize: isMobile ? '16px' : '20px',
      fontWeight: '700',
      color: '#1F2937',
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '6px' : '8px',
    },
    modalBody: {
      padding: isMobile ? '16px' : '24px',
      overflowY: 'auto' as const,
      flex: 1,
    },
    modalFooter: {
      padding: isMobile ? '12px 16px' : '16px 24px',
      borderTop: '1px solid #E5E7EB',
      display: 'flex',
      justifyContent: 'flex-end',
    },
    closeButton: {
      padding: isMobile ? '6px 16px' : '8px 24px',
      fontSize: isMobile ? '12px' : '14px',
      fontWeight: '500',
      border: '1px solid #E5E7EB',
      borderRadius: '6px',
      backgroundColor: '#FFFFFF',
      color: '#374151',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
    },
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!canRegister) {
      setError('すべての項目を入力し、利用規約に同意してください')
      return
    }
    
    setError('')
    setLoading(true)

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      await updateProfile(user, {
        displayName: displayName
      })

      await createUserProfile(user.uid, email, displayName, {
        grade: grade,
        gradeUpdatedAt: new Date()
      })
      
      await saveTermsAgreement(user.uid, {
        termsVersion: '2024.12',
        isMinor,
        parentalConsent: isMinor ? parentalConsent : null
      })

      console.log('新規登録成功:', user.uid, '学年:', grade)
      
      toast({
        title: '✨ アカウントを作成しました',
        description: 'プランを選択してください',
      })
      
      // SSR対応: windowオブジェクトの存在を確認
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = 'https://a-istudy-highschool.vercel.app/subscription/register?welcome=true';
        }
      }, 1500);
      
    } catch (err: any) {
      console.error('Registration error:', err)
      
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('このメールアドレスは既に使用されています')
          break
        case 'auth/invalid-email':
          setError('無効なメールアドレスです')
          break
        case 'auth/weak-password':
          setError('パスワードは6文字以上で設定してください')
          break
        case 'auth/operation-not-allowed':
          setError('この操作は許可されていません')
          break
        case 'auth/network-request-failed':
          setError('ネットワークエラーが発生しました')
          break
        default:
          setError('登録に失敗しました: ' + err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // SSR中はローディング状態を表示
  if (!isClient) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        color: '#6B7280'
      }}>
        <div>読み込み中...</div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* お名前 */}
        <div style={styles.fieldGroup}>
          <label htmlFor="displayName" style={styles.label}>
            <User style={styles.icon} />
            お名前
          </label>
          <input
            id="displayName"
            type="text"
            placeholder="山田太郎"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            disabled={loading}
            style={styles.input}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366F1'
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E5E7EB'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* メールアドレス */}
        <div style={styles.fieldGroup}>
          <label htmlFor="email" style={styles.label}>
            <Mail style={styles.icon} />
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            style={styles.input}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366F1'
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E5E7EB'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* 学年 */}
        <div style={styles.fieldGroup}>
          <label htmlFor="grade" style={styles.label}>
            <GraduationCap style={styles.icon} />
            学年
          </label>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowGradeDropdown(!showGradeDropdown)}
              style={styles.selectButton}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#6366F1'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span>{grade === '高校1年' ? '高校1年生' : grade === '高校2年' ? '高校2年生' : '高校3年生（受験生）'}</span>
              <ChevronDown style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px', color: '#6B7280' }} />
            </button>
            {showGradeDropdown && (
              <div style={styles.dropdown}>
                {(['高校1年', '高校2年', '高校3年'] as Grade[]).map((g) => (
                  <div
                    key={g}
                    style={styles.dropdownItem}
                    onClick={() => {
                      setGrade(g)
                      setShowGradeDropdown(false)
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F3F4F6'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    {g === '高校1年' ? '高校1年生' : g === '高校2年' ? '高校2年生' : '高校3年生（受験生）'}
                  </div>
                ))}
              </div>
            )}
          </div>
          <p style={styles.helpText}>
            <Sparkles style={{ width: isMobile ? '10px' : '12px', height: isMobile ? '10px' : '12px' }} />
            学年に応じて最適な学習プランを提供します
          </p>
        </div>

        {/* パスワード */}
        <div style={styles.fieldGroup}>
          <label htmlFor="password" style={styles.label}>
            <Lock style={styles.icon} />
            パスワード
          </label>
          <input
            id="password"
            type="password"
            placeholder="6文字以上"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={styles.input}
            onFocus={(e) => {
              e.target.style.borderColor = '#6366F1'
              e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#E5E7EB'
              e.target.style.boxShadow = 'none'
            }}
          />
          <p style={styles.helpText}>
            <Shield style={{ width: isMobile ? '10px' : '12px', height: isMobile ? '10px' : '12px' }} />
            パスワードは安全に暗号化されます
          </p>
        </div>

        {/* 利用規約同意セクション */}
        <div style={styles.termsSection}>
          <div style={styles.termsSectionHeader}>
            <Shield style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px', color: '#6366F1' }} />
            利用規約への同意
          </div>
          
          <div>
            <label style={styles.checkboxContainer}>
              <div style={{
                ...styles.checkbox,
                ...(termsAgreed ? styles.checkboxChecked : {})
              }}>
                {termsAgreed && (
                  <svg width={isMobile ? "12" : "14"} height={isMobile ? "12" : "14"} viewBox="0 0 14 14" fill="none">
                    <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                style={{ display: 'none' }}
              />
              <span style={styles.checkboxText}>
                <span
                  style={styles.link}
                  onClick={(e) => {
                    e.preventDefault()
                    setShowTerms(true)
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#4F46E5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6366F1'
                  }}
                >
                  <FileText style={{ width: isMobile ? '12px' : '14px', height: isMobile ? '12px' : '14px' }} />
                  利用規約
                </span>
                を読み、同意します
              </span>
            </label>

            <label style={styles.checkboxContainer}>
              <div style={{
                ...styles.checkbox,
                ...(privacyAgreed ? styles.checkboxChecked : {})
              }}>
                {privacyAgreed && (
                  <svg width={isMobile ? "12" : "14"} height={isMobile ? "12" : "14"} viewBox="0 0 14 14" fill="none">
                    <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={privacyAgreed}
                onChange={(e) => setPrivacyAgreed(e.target.checked)}
                style={{ display: 'none' }}
              />
              <span style={styles.checkboxText}>
                <span
                  style={styles.link}
                  onClick={(e) => {
                    e.preventDefault()
                    setShowTerms(true)
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#4F46E5'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6366F1'
                  }}
                >
                  <FileText style={{ width: '14px', height: '14px' }} />
                  プライバシーポリシー
                </span>
                を読み、同意します
              </span>
            </label>

            {isMinor && (
              <div style={styles.parentalConsentBox}>
                <label style={styles.checkboxContainer}>
                  <div style={{
                    ...styles.checkbox,
                    ...(parentalConsent ? styles.checkboxChecked : {})
                  }}>
                    {parentalConsent && (
                      <svg width={isMobile ? "12" : "14"} height={isMobile ? "12" : "14"} viewBox="0 0 14 14" fill="none">
                        <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={parentalConsent}
                    onChange={(e) => setParentalConsent(e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <div>
                    <span style={{ ...styles.checkboxText, fontWeight: '600' }}>
                      保護者の同意を得ています
                    </span>
                    <p style={{ fontSize: isMobile ? '10px' : '12px', color: '#D97706', marginTop: '2px' }}>
                      18歳未満の方は保護者の同意が必要です
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div style={styles.errorBox}>
            <svg width={isMobile ? "16" : "20"} height={isMobile ? "16" : "20"} viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
              <path d="M10 8V10M10 14H10.01M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* 登録ボタン */}
        <button
          type="submit"
          disabled={!canRegister}
          style={{
            ...styles.submitButton,
            ...(canRegister ? {} : styles.submitButtonDisabled)
          }}
          onMouseEnter={(e) => {
            if (canRegister) {
              Object.assign(e.currentTarget.style, styles.submitButtonHover)
            }
          }}
          onMouseLeave={(e) => {
            if (canRegister) {
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.25)'
            }
          }}
        >
          {loading ? (
            <>
              <svg
                style={{ animation: 'spin 1s linear infinite' }}
                width={isMobile ? "16" : "20"}
                height={isMobile ? "16" : "20"}
                viewBox="0 0 20 20"
                fill="none"
              >
                <path opacity="0.25" d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2Z" stroke="currentColor" strokeWidth="3"/>
                <path opacity="0.75" d="M2 10C2 5.58172 5.58172 2 10 2" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              登録中...
            </>
          ) : (
            <>
              新規登録
              <Sparkles style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px' }} />
            </>
          )}
        </button>
        
        {/* 同意が必要なメッセージ */}
        {!allAgreed && isFormValid && (
          <div style={styles.warningBox}>
            ⚠️ 利用規約への同意が必要です
          </div>
        )}
      </form>

      {/* 利用規約モーダル */}
      {showTerms && (
        <div style={styles.modal} onClick={() => setShowTerms(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                <FileText style={{ width: isMobile ? '16px' : '20px', height: isMobile ? '16px' : '20px', color: '#6366F1' }} />
                利用規約・プライバシーポリシー
              </h2>
            </div>
            
            <div style={styles.modalBody}>
              <div style={{ fontSize: isMobile ? '12px' : '14px', lineHeight: '1.8', color: '#374151', whiteSpace: 'pre-wrap' }}>
                {TERMS_OF_SERVICE}
              </div>
            </div>
            
            <div style={styles.modalFooter}>
              <button
                onClick={() => setShowTerms(false)}
                style={styles.closeButton}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF'
                }}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}