'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged, signOut, updatePassword, deleteUser } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { getUserProfile, updateUserProfile } from '@/lib/firebase/firestore'
import { 
  User, 
  Bell, 
  BookOpen, 
  CreditCard, 
  LogOut, 
  Trash2, 
  Save,
  ChevronLeft,
  Crown,
  AlertCircle,
  Loader2,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface UserProfile {
  displayName: string
  email: string
  subjects: { [key: string]: boolean }
  dailyGoal: number
  notifications: {
    reminder: boolean
    achievement: boolean
    marketing: boolean
  }
  subscription: {
    plan: 'free' | 'premium'
    status: 'active' | 'cancelled' | 'expired'
    expiresAt?: Date
  }
}

// スタンドアロンコンポーネント（モバイル最適化）
const Card = ({ children, style = {} }: { children: React.ReactNode, style?: React.CSSProperties }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    ...style
  }}>
    {children}
  </div>
)

const CardHeader = ({ children, style = {} }: { children: React.ReactNode, style?: React.CSSProperties }) => (
  <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', ...style }}>
    {children}
  </div>
)

const CardTitle = ({ children, style = {} }: { children: React.ReactNode, style?: React.CSSProperties }) => (
  <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', ...style }}>
    {children}
  </h3>
)

const CardDescription = ({ children, style = {} }: { children: React.ReactNode, style?: React.CSSProperties }) => (
  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', ...style }}>
    {children}
  </p>
)

const CardContent = ({ children, style = {} }: { children: React.ReactNode, style?: React.CSSProperties }) => (
  <div style={{ padding: '1rem', boxSizing: 'border-box', ...style }}>
    {children}
  </div>
)

const Button = ({ 
  children, 
  variant = 'default', 
  size = 'default',
  onClick,
  disabled = false,
  style = {},
  className = ''
}: {
  children: React.ReactNode,
  variant?: 'default' | 'outline' | 'ghost' | 'destructive',
  size?: 'default' | 'sm',
  onClick?: () => void,
  disabled?: boolean,
  style?: React.CSSProperties,
  className?: string
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.5rem',
    fontSize: size === 'sm' ? '0.75rem' : '0.813rem',
    fontWeight: '500',
    transition: 'all 0.2s',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    border: 'none',
    padding: size === 'sm' ? '0.375rem 0.75rem' : '0.5rem 1rem',
    gap: '0.25rem',
    width: className?.includes('w-full') ? '100%' : 'auto'
  }
  
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: '#2563eb',
      color: 'white',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#374151',
      border: '1px solid #d1d5db',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#6b7280',
    },
    destructive: {
      backgroundColor: '#dc2626',
      color: 'white',
    }
  }
  
  return (
    <button 
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...style
      }}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled) {
          if (variant === 'default') {
            e.currentTarget.style.backgroundColor = '#1d4ed8'
          } else if (variant === 'outline') {
            e.currentTarget.style.backgroundColor = '#f9fafb'
          } else if (variant === 'destructive') {
            e.currentTarget.style.backgroundColor = '#b91c1c'
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          if (variant === 'default') {
            e.currentTarget.style.backgroundColor = '#2563eb'
          } else if (variant === 'outline') {
            e.currentTarget.style.backgroundColor = 'transparent'
          } else if (variant === 'destructive') {
            e.currentTarget.style.backgroundColor = '#dc2626'
          }
        }
      }}
    >
      {children}
    </button>
  )
}

const Input = ({ 
  type = 'text',
  placeholder, 
  value, 
  onChange,
  disabled = false,
  id,
  style = {}
}: {
  type?: string,
  placeholder?: string,
  value?: string,
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
  disabled?: boolean,
  id?: string,
  style?: React.CSSProperties
}) => (
  <input 
    type={type}
    id={id}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    disabled={disabled}
    style={{
      width: '100%',
      height: '36px',
      borderRadius: '0.5rem',
      border: '1px solid #d1d5db',
      backgroundColor: disabled ? '#f9fafb' : 'white',
      padding: '0 0.75rem',
      fontSize: '0.813rem',
      outline: 'none',
      transition: 'all 0.2s',
      cursor: disabled ? 'not-allowed' : 'text',
      boxSizing: 'border-box',
      ...style
    }}
    onFocus={(e) => {
      if (!disabled) {
        e.currentTarget.style.borderColor = '#3b82f6'
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
      }
    }}
    onBlur={(e) => {
      e.currentTarget.style.borderColor = '#d1d5db'
      e.currentTarget.style.boxShadow = 'none'
    }}
  />
)

const Label = ({ children, htmlFor, style = {} }: { 
  children: React.ReactNode, 
  htmlFor?: string,
  style?: React.CSSProperties 
}) => (
  <label 
    htmlFor={htmlFor}
    style={{ 
      display: 'block',
      fontSize: '0.813rem', 
      fontWeight: '500', 
      color: '#374151',
      marginBottom: '0.375rem',
      ...style 
    }}
  >
    {children}
  </label>
)

const Switch = ({ 
  checked, 
  onCheckedChange 
}: { 
  checked: boolean, 
  onCheckedChange: (checked: boolean) => void 
}) => {
  return (
    <button
      onClick={() => onCheckedChange(!checked)}
      style={{
        position: 'relative',
        width: '40px',
        height: '22px',
        backgroundColor: checked ? '#3b82f6' : '#e5e7eb',
        borderRadius: '9999px',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        padding: 0
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '20px' : '2px',
          width: '18px',
          height: '18px',
          backgroundColor: 'white',
          borderRadius: '50%',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
        }}
      />
    </button>
  )
}

const Select = ({ children, value, onValueChange }: {
  children: React.ReactNode,
  value?: string,
  onValueChange?: (value: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div style={{ position: 'relative' }}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { 
            isOpen, 
            setIsOpen, 
            value, 
            onValueChange 
          })
        }
        return child
      })}
    </div>
  )
}

const SelectTrigger = ({ children, isOpen, setIsOpen }: any) => (
  <button
    onClick={() => setIsOpen?.(!isOpen)}
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      height: '36px',
      borderRadius: '0.5rem',
      border: '1px solid #d1d5db',
      backgroundColor: 'white',
      padding: '0 0.75rem',
      fontSize: '0.813rem',
      outline: 'none',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}
  >
    {children}
    <ChevronLeft style={{
      width: '14px',
      height: '14px',
      transform: isOpen ? 'rotate(-90deg)' : 'rotate(-270deg)',
      transition: 'transform 0.2s'
    }} />
  </button>
)

const SelectValue = ({ value }: { value?: string }) => (
  <span>{value ? `${value === '30' ? '30分' : value === '60' ? '1時間' : value === '90' ? '1時間30分' : value === '120' ? '2時間' : value === '180' ? '3時間' : '4時間'}` : '選択してください'}</span>
)

const SelectContent = ({ children, isOpen, setIsOpen, onValueChange }: any) => {
  if (!isOpen) return null
  
  return (
    <div style={{
      position: 'absolute',
      zIndex: 50,
      marginTop: '0.25rem',
      width: '100%',
      maxHeight: '200px',
      overflow: 'auto',
      borderRadius: '0.5rem',
      border: '1px solid #d1d5db',
      backgroundColor: 'white',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { 
            setIsOpen, 
            onValueChange 
          })
        }
        return child
      })}
    </div>
  )
}

const SelectItem = ({ children, value, setIsOpen, onValueChange }: any) => (
  <div
    style={{
      padding: '0.5rem 0.75rem',
      fontSize: '0.813rem',
      cursor: 'pointer',
      transition: 'background-color 0.1s'
    }}
    onClick={() => {
      onValueChange?.(value)
      setIsOpen?.(false)
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#f3f4f6'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent'
    }}
  >
    {children}
  </div>
)

const Tabs = ({ children, defaultValue }: {
  children: React.ReactNode,
  defaultValue: string
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue)
  
  return (
    <div>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { 
            activeTab, 
            setActiveTab
          })
        }
        return child
      })}
    </div>
  )
}

const TabsList = ({ children, activeTab, setActiveTab }: any) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    backgroundColor: '#f3f4f6',
    padding: '0.25rem',
    borderRadius: '0.5rem',
    gap: '0.25rem',
    marginBottom: '1rem'
  }}>
    {React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<any>, { 
          activeTab, 
          setActiveTab 
        })
      }
      return child
    })}
  </div>
)

const TabsTrigger = ({ children, value, activeTab, setActiveTab }: any) => (
  <button
    onClick={() => setActiveTab?.(value)}
    style={{
      padding: '0.375rem 0.5rem',
      borderRadius: '0.375rem',
      fontSize: '0.75rem',
      fontWeight: '500',
      transition: 'all 0.2s',
      border: 'none',
      cursor: 'pointer',
      backgroundColor: activeTab === value ? 'white' : 'transparent',
      color: activeTab === value ? '#111827' : '#6b7280',
      boxShadow: activeTab === value ? '0 1px 3px 0 rgba(0, 0, 0, 0.1)' : 'none'
    }}
  >
    {children}
  </button>
)

const TabsContent = ({ children, value, activeTab }: any) => {
  if (activeTab !== value) return null
  return <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{children}</div>
}

const useToast = () => {
  const toast = ({ title, description, variant }: {
    title: string,
    description?: string,
    variant?: 'default' | 'destructive'
  }) => {
    // 簡易的なトースト実装
    const toastEl = document.createElement('div')
    toastEl.style.cssText = `
      position: fixed;
      bottom: 70px;
      left: 50%;
      transform: translateX(-50%);
      background: ${variant === 'destructive' ? '#dc2626' : '#111827'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
      max-width: 320px;
      text-align: center;
    `
    toastEl.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 2px; font-size: 14px">${title}</div>
      ${description ? `<div style="font-size: 12px; opacity: 0.9">${description}</div>` : ''}
    `
    document.body.appendChild(toastEl)
    
    setTimeout(() => {
      toastEl.style.animation = 'slideOut 0.3s ease-in'
      setTimeout(() => {
        document.body.removeChild(toastEl)
      }, 300)
    }, 3000)
  }
  
  return { toast }
}

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const { toast } = useToast()
  const router = useRouter()

  const subjectCategories = {
    '国語': ['現代文', '古文', '漢文'],
    '地理歴史': ['世界史A', '世界史B', '日本史A', '日本史B', '地理A', '地理B'],
    '公民': ['現代社会', '倫理', '政治・経済', '倫理、政治・経済'],
    '数学①': ['数学I', '数学I・A'],
    '数学②': ['数学II', '数学II・B', '簿記・会計', '情報関係基礎'],
    '理科①': ['物理基礎', '化学基礎', '生物基礎', '地学基礎'],
    '理科②': ['物理', '化学', '生物', '地学'],
    '外国語': ['英語（リーディング）', '英語（リスニング）', 'ドイツ語', 'フランス語', '中国語', '韓国語']
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        try {
          // 実際のユーザープロファイルを取得
          const userProfile = await getUserProfile(currentUser.uid)
          console.log('Fetched user profile:', userProfile)
          
          if (userProfile) {
            // subjects を配列形式に変換
            const subjectsArray = userProfile.subjects 
              ? Object.keys(userProfile.subjects).filter(key => userProfile.subjects[key])
              : []
            
            setSelectedSubjects(subjectsArray)
            
            setProfile({
              displayName: userProfile.displayName || currentUser.displayName || 'ゲスト',
              email: currentUser.email || '',
              subjects: userProfile.subjects || {},
              dailyGoal: userProfile.dailyGoal || 120,
              notifications: userProfile.notifications || {
                reminder: true,
                achievement: true,
                marketing: false
              },
              subscription: userProfile.subscription || {
                plan: 'premium',
                status: 'active',
                expiresAt: new Date('2024-12-31')
              }
            })
          } else {
            // デフォルトプロファイル
            setProfile({
              displayName: currentUser.displayName || 'ゲスト',
              email: currentUser.email || '',
              subjects: {},
              dailyGoal: 120,
              notifications: {
                reminder: true,
                achievement: true,
                marketing: false
              },
              subscription: {
                plan: 'premium',
                status: 'active',
                expiresAt: new Date('2024-12-31')
              }
            })
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          // エラー時はデフォルト値を使用
          setProfile({
            displayName: currentUser.displayName || 'ゲスト',
            email: currentUser.email || '',
            subjects: {},
            dailyGoal: 120,
            notifications: {
              reminder: true,
              achievement: true,
              marketing: false
            },
            subscription: {
              plan: 'premium',
              status: 'active',
              expiresAt: new Date('2024-12-31')
            }
          })
        }
      } else {
        router.push('/login')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const handleProfileUpdate = async () => {
    if (!user || !profile) return
    
    setSaving(true)
    try {
      // プロファイル更新処理
      await updateUserProfile(user.uid, {
        displayName: profile.displayName,
        dailyGoal: profile.dailyGoal,
        notifications: profile.notifications
      })
      
      toast({
        title: "更新しました",
        description: "変更が保存されました",
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "エラー",
        description: "更新に失敗しました",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSubjectsUpdate = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      // subjects をオブジェクト形式に変換
      const subjectsObj: { [key: string]: boolean } = {}
      selectedSubjects.forEach(subject => {
        subjectsObj[subject] = true
      })
      
      console.log('Saving subjects:', subjectsObj)
      
      // Firestoreに保存
      await updateUserProfile(user.uid, {
        subjects: subjectsObj
      })
      
      toast({
        title: "保存しました",
        description: "科目設定を更新しました",
      })
      
      // ホーム画面に戻る（更新パラメータ付き）
      setTimeout(() => {
        router.push('/home?updated=true')
      }, 500)
    } catch (error) {
      console.error('Error updating subjects:', error)
      toast({
        title: "エラー",
        description: "保存に失敗しました",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "エラー",
        description: "パスワードが一致しません",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      if (user) {
        await updatePassword(user, newPassword)
        toast({
          title: "変更しました",
          description: "パスワードを更新しました",
        })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: "変更に失敗しました",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirm('本当にアカウントを削除しますか？\nこの操作は取り消せません。')) {
      if (confirm('すべてのデータが削除されます。本当によろしいですか？')) {
        try {
          if (user) {
            await deleteUser(user)
            router.push('/login')
          }
        } catch (error) {
          toast({
            title: "エラー",
            description: "削除に失敗しました",
            variant: "destructive",
          })
        }
      }
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading || !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 style={{ width: '24px', height: '24px', animation: 'spin 1s linear infinite', color: '#9ca3af' }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', paddingBottom: '60px' }}>
      <style jsx>{`
        @keyframes slideIn {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translate(-50%, 0); opacity: 1; }
          to { transform: translate(-50%, 100%); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* ヘッダー */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <div style={{ padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link href="/home" style={{ textDecoration: 'none' }}>
                <Button variant="ghost" size="sm">
                  <ChevronLeft style={{ width: '16px', height: '16px' }} />
                  戻る
                </Button>
              </Link>
              <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>設定</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut style={{ width: '14px', height: '14px' }} />
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main style={{ padding: '1rem' }}>
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">プロフィール</TabsTrigger>
            <TabsTrigger value="study">学習設定</TabsTrigger>
            <TabsTrigger value="subscription">サブスク</TabsTrigger>
            <TabsTrigger value="account">アカウント</TabsTrigger>
          </TabsList>

          {/* プロフィール設定 */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User style={{ width: '18px', height: '18px' }} />
                  プロフィール設定
                </CardTitle>
                <CardDescription>
                  表示名やメールアドレスを変更できます
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <Label htmlFor="displayName">表示名</Label>
                    <Input
                      id="displayName"
                      value={profile.displayName}
                      onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                    />
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      メールアドレスは変更できません
                    </p>
                  </div>
                  <Button onClick={handleProfileUpdate} disabled={saving} size="sm">
                    {saving ? (
                      <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Save style={{ width: '14px', height: '14px' }} />
                    )}
                    保存
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card style={{ marginTop: '0.75rem' }}>
              <CardHeader>
                <CardTitle>パスワード変更</CardTitle>
                <CardDescription>
                  セキュリティのため定期的な変更をお勧めします
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div>
                    <Label htmlFor="currentPassword">現在のパスワード</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">新しいパスワード</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <Button onClick={handlePasswordChange} disabled={saving} size="sm">
                    パスワードを変更
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 学習設定 */}
          <TabsContent value="study">
            <Card>
              <CardHeader>
                <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen style={{ width: '18px', height: '18px' }} />
                  学習設定
                </CardTitle>
                <CardDescription>
                  受験科目や学習目標を設定します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <Label>受験科目（共通テスト）</Label>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.75rem' }}>
                      現在選択中: {selectedSubjects.length}科目
                    </p>
                    {Object.entries(subjectCategories).map(([category, subjects]) => (
                      <div key={category} style={{ marginTop: '0.75rem' }}>
                        <h4 style={{ 
                          fontSize: '0.813rem', 
                          fontWeight: '500', 
                          color: '#374151',
                          borderBottom: '1px solid #e5e7eb',
                          paddingBottom: '0.25rem',
                          marginBottom: '0.5rem'
                        }}>
                          {category}
                        </h4>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr',
                          gap: '0.375rem',
                          paddingLeft: '0.75rem'
                        }}>
                          {subjects.map((subject) => (
                            <label
                              key={subject}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                cursor: 'pointer',
                                padding: '0.25rem',
                                borderRadius: '0.25rem',
                                transition: 'background-color 0.2s',
                                fontSize: '0.813rem'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f9fafb'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedSubjects.includes(subject)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedSubjects([...selectedSubjects, subject])
                                  } else {
                                    setSelectedSubjects(selectedSubjects.filter(s => s !== subject))
                                  }
                                }}
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '0.25rem',
                                  border: '1px solid #d1d5db',
                                  cursor: 'pointer',
                                  accentColor: '#2563eb'
                                }}
                              />
                              <span>{subject}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label htmlFor="dailyGoal">1日の学習目標（分）</Label>
                    <Select
                      value={profile.dailyGoal.toString()}
                      onValueChange={(value) => setProfile({ ...profile, dailyGoal: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30分</SelectItem>
                        <SelectItem value="60">1時間</SelectItem>
                        <SelectItem value="90">1時間30分</SelectItem>
                        <SelectItem value="120">2時間</SelectItem>
                        <SelectItem value="180">3時間</SelectItem>
                        <SelectItem value="240">4時間</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSubjectsUpdate} disabled={saving} size="sm">
                    {saving ? (
                      <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Save style={{ width: '14px', height: '14px' }} />
                    )}
                    科目設定を保存
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card style={{ marginTop: '0.75rem' }}>
              <CardHeader>
                <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell style={{ width: '18px', height: '18px' }} />
                  通知設定
                </CardTitle>
                <CardDescription>
                  学習リマインダーや達成通知を管理します
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <Label style={{ marginBottom: '0.125rem' }}>学習リマインダー</Label>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>毎日の学習時間に通知</p>
                    </div>
                    <Switch
                      checked={profile.notifications.reminder}
                      onCheckedChange={(checked) => 
                        setProfile({
                          ...profile,
                          notifications: { ...profile.notifications, reminder: checked }
                        })
                      }
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <Label style={{ marginBottom: '0.125rem' }}>達成通知</Label>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>目標達成時に通知</p>
                    </div>
                    <Switch
                      checked={profile.notifications.achievement}
                      onCheckedChange={(checked) => 
                        setProfile({
                          ...profile,
                          notifications: { ...profile.notifications, achievement: checked }
                        })
                      }
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <Label style={{ marginBottom: '0.125rem' }}>お知らせ</Label>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>新機能やキャンペーン情報</p>
                    </div>
                    <Switch
                      checked={profile.notifications.marketing}
                      onCheckedChange={(checked) => 
                        setProfile({
                          ...profile,
                          notifications: { ...profile.notifications, marketing: checked }
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* サブスクリプション */}
          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CreditCard style={{ width: '18px', height: '18px' }} />
                  サブスクリプション
                </CardTitle>
                <CardDescription>
                  現在のプラン情報を確認できます
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{
                    padding: '0.75rem',
                    background: 'linear-gradient(to right, #dbeafe, #e0e7ff)',
                    borderRadius: '0.5rem',
                    border: '1px solid #93c5fd'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '600' }}>A-IStudy プラン</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                        ¥980<span style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>/月</span>
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#4b5563', marginBottom: '0.75rem' }}>
                      すべての学習機能をご利用いただけます
                    </p>
                    <div style={{ fontSize: '0.75rem' }}>
                      <p style={{ marginBottom: '0.375rem' }}>
                        ステータス: 
                        <span style={{
                          marginLeft: '0.375rem',
                          fontWeight: '500',
                          color: profile.subscription.status === 'active' ? '#059669' : 
                                 profile.subscription.status === 'cancelled' ? '#ea580c' : 
                                 '#dc2626'
                        }}>
                          {profile.subscription.status === 'active' ? '利用中' :
                           profile.subscription.status === 'cancelled' ? '解約済み' :
                           '期限切れ'}
                        </span>
                      </p>
                      {profile.subscription.expiresAt && (
                        <p>
                          {profile.subscription.status === 'cancelled' ? '利用期限' : '次回更新日'}: 
                          <span style={{ marginLeft: '0.375rem', fontWeight: '500' }}>
                            {profile.subscription.expiresAt.toLocaleDateString('ja-JP')}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {profile.subscription.status === 'active' && (
                    <>
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#f9fafb',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem'
                      }}>
                        <p style={{ color: '#4b5563' }}>
                          解約すると、利用期限後はサービスをご利用いただけなくなります。
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/account/subscription')}
                        className="w-full"
                        size="sm"
                      >
                        サブスクリプションを解約
                      </Button>
                    </>
                  )}

                  {profile.subscription.status === 'cancelled' && (
                    <div style={{
                      padding: '0.75rem',
                      backgroundColor: '#fef3c7',
                      borderRadius: '0.5rem',
                      border: '1px solid #fcd34d',
                      fontSize: '0.75rem'
                    }}>
                      <p style={{ color: '#92400e' }}>
                        解約手続きが完了しています。利用期限まではサービスをご利用いただけます。
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* アカウント管理 */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle style={{ color: '#dc2626' }}>危険な操作</CardTitle>
                <CardDescription>
                  これらの操作は取り消すことができません
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#fef2f2',
                  borderRadius: '0.5rem',
                  border: '1px solid #fecaca'
                }}>
                  <h3 style={{ fontWeight: '500', color: '#991b1b', marginBottom: '0.375rem', fontSize: '0.875rem' }}>
                    アカウント削除
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#b91c1c', marginBottom: '0.75rem' }}>
                    アカウントを削除すると、すべてのデータが完全に削除され、
                    復元することはできません。
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    size="sm"
                  >
                    <Trash2 style={{ width: '14px', height: '14px' }} />
                    アカウントを削除
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* フッター */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTop: '1px solid #e5e7eb',
        padding: '0.375rem 0.75rem'
      }}>
        <div style={{
          maxWidth: '448px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-around'
        }}>
          <Link href="/home" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0.375rem',
              color: '#6b7280'
            }}>
              <svg style={{ width: '22px', height: '22px', marginBottom: '0.125rem' }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span style={{ fontSize: '0.688rem' }}>ホーム</span>
            </div>
          </Link>
          
          <Link href="/problems" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0.375rem',
              color: '#6b7280'
            }}>
              <svg style={{ width: '22px', height: '22px', marginBottom: '0.125rem' }} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
              </svg>
              <span style={{ fontSize: '0.688rem' }}>学習</span>
            </div>
          </Link>
          
          <Link href="/analytics" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0.375rem',
              color: '#6b7280'
            }}>
              <BarChart3 style={{ width: '22px', height: '22px', marginBottom: '0.125rem' }} />
              <span style={{ fontSize: '0.688rem' }}>分析</span>
            </div>
          </Link>
          
          <Link href="/settings" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0.375rem',
              color: '#2563eb'
            }}>
              <svg style={{ width: '22px', height: '22px', marginBottom: '0.125rem' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span style={{ fontSize: '0.688rem' }}>設定</span>
            </div>
          </Link>
        </div>
      </nav>
    </div>
  )
}