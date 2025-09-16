'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { getUserProfile } from '@/lib/firebase/firestore'
import Link from 'next/link'
import { FirebaseErrorBoundary } from '@/components/FirebaseErrorBoundary'
import { useFirebaseCleanup } from '@/hooks/useFirebaseCleanup'

// PWAインストールプロンプト用のインターフェース
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function DashboardContent({
  children,
}: {
  children: React.ReactNode
}) {
  // QueryClientの初期化
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }))

  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState<string>('ゲスト')
  const [loading, setLoading] = useState(true)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isMountedRef = useRef(true)

  // Firebaseクリーンアップフックを使用
  useFirebaseCleanup()

  // PWA関連の処理
  useEffect(() => {
    // スタンドアロンモードの検出
    const checkStandalone = () => {
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                                 (window.navigator as any).standalone ||
                                 document.referrer.includes('android-app://');
      setIsStandalone(isInStandaloneMode);
    };
    
    checkStandalone();

    // インストールプロンプトのイベントリスナー
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // インストールされていない場合のみプロンプトを表示
      if (!isStandalone && !localStorage.getItem('pwa-install-dismissed')) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // アプリがインストールされた時
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      setShowInstallPrompt(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  // PWAインストール処理
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  // インストールプロンプトを閉じる
  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  useEffect(() => {
    // コンポーネントのマウント状態を追跡
    isMountedRef.current = true
    
    console.log('DashboardLayout - Current pathname:', pathname)
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // アンマウント後は処理しない
      if (!isMountedRef.current) return
      
      if (currentUser) {
        setUser(currentUser)
        try {
          // getUserProfileは一度だけ実行
          const userProfile = await getUserProfile(currentUser.uid)
          
          // アンマウント後は状態を更新しない
          if (isMountedRef.current && userProfile) {
            setDisplayName(userProfile.displayName || currentUser.displayName || 'ゲスト')
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
          // エラーが発生してもゲスト表示を継続
          if (isMountedRef.current) {
            setDisplayName(currentUser.displayName || 'ゲスト')
          }
        }
      } else {
        // ログインページ以外でログインしていない場合はリダイレクト
        if (pathname !== '/login' && pathname !== '/signup') {
          router.push('/login')
        }
      }
      
      if (isMountedRef.current) {
        setLoading(false)
      }
    })

    return () => {
      isMountedRef.current = false
      unsubscribe()
    }
  }, [router, pathname])

  // ページタイトルに基づくアクティブタブの判定を改善
  const getActiveTab = () => {
    if (pathname === '/home') return 'home';
    if (pathname.startsWith('/problems')) return 'problems';
    if (pathname.startsWith('/secondary-exam') || pathname.startsWith('/essay') || pathname.startsWith('/interview')) return 'secondary-exam';
    if (pathname.startsWith('/analytics')) return 'analytics';
    if (pathname.startsWith('/settings')) return 'settings';
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <>
        <style jsx global>{`
          body {
            padding-top: 60px;
            padding-bottom: 80px;
            font-family: -apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif;
            background: #f0f4ff;
            color: #2d3436;
            min-height: 100vh;
            -webkit-user-select: none;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
          }
          
          /* PWAスタンドアロンモード用のスタイル */
          .pwa-standalone body {
            padding-top: calc(60px + env(safe-area-inset-top));
            padding-bottom: calc(80px + env(safe-area-inset-bottom));
          }
          
          .dashboard-layout {
            min-height: 100vh;
          }
          
          .fixed-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #3b82f6;
            padding: 12px 16px;
            padding-top: calc(12px + env(safe-area-inset-top));
            box-shadow: 0 2px 12px rgba(59, 130, 246, 0.15);
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            align-items: center;
            height: calc(60px + env(safe-area-inset-top));
          }
          
          .header-left {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .app-logo {
            font-size: 20px;
            font-weight: 700;
            color: white;
            cursor: pointer;
            text-decoration: none;
            transition: opacity 0.2s;
          }
          
          .app-logo:hover {
            opacity: 0.8;
          }
          
          .user-name {
            font-size: 14px;
            color: white;
            opacity: 0.9;
            max-width: 120px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .header-right {
            display: flex;
            gap: 8px;
            align-items: center;
          }
          
          .header-icon-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            -webkit-tap-highlight-color: transparent;
          }
          
          .header-icon-btn:hover, .header-icon-btn:active {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(0.95);
          }
          
          .header-icon-btn svg {
            width: 20px;
            height: 20px;
          }
          
          /* 通知バッジ */
          .notification-badge {
            position: absolute;
            top: 4px;
            right: 4px;
            background: #ef4444;
            color: white;
            font-size: 10px;
            font-weight: 600;
            padding: 1px 4px;
            border-radius: 10px;
            min-width: 16px;
            text-align: center;
          }
          
          .fixed-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            display: flex;
            justify-content: space-around;
            padding: 12px 0;
            padding-bottom: calc(12px + env(safe-area-inset-bottom));
            box-shadow: 0 -2px 12px rgba(0,0,0,0.05);
            z-index: 1000;
            border-top: 1px solid rgba(0,0,0,0.05);
          }
          
          .tab {
            text-align: center;
            padding: 8px;
            font-size: 12px;
            color: #636e72;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            flex: 1;
            max-width: 80px;
            -webkit-tap-highlight-color: transparent;
            border-radius: 8px;
          }
          
          .tab.active {
            color: #6c5ce7;
            background: rgba(108, 92, 231, 0.1);
          }
          
          .tab:hover:not(.active) {
            color: #555;
            background: rgba(0,0,0,0.05);
          }
          
          .tab:active {
            transform: scale(0.95);
          }
          
          .tab-icon {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s;
          }
          
          .tab.active .tab-icon {
            transform: scale(1.1);
          }
          
          .tab.active svg {
            color: #6c5ce7;
          }
          
          .tab span {
            font-size: 11px;
            font-weight: 500;
          }
          
          .tab.active span {
            font-weight: 600;
          }
          
          /* インストールプロンプト */
          .install-prompt {
            position: fixed;
            bottom: 100px;
            left: 20px;
            right: 20px;
            background: white;
            border-radius: 16px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 2000;
            display: flex;
            align-items: center;
            gap: 16px;
            animation: slideUp 0.3s ease-out;
            border: 1px solid rgba(0,0,0,0.1);
          }
          
          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          .install-prompt-icon {
            width: 48px;
            height: 48px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            flex-shrink: 0;
          }
          
          .install-prompt-content {
            flex: 1;
          }
          
          .install-prompt-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 4px;
            color: #1f2937;
          }
          
          .install-prompt-description {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.4;
          }
          
          .install-prompt-actions {
            display: flex;
            gap: 12px;
            flex-direction: column;
          }
          
          .install-prompt-button {
            padding: 8px 16px;
            border-radius: 8px;
            border: none;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            min-width: 80px;
            white-space: nowrap;
          }
          
          .install-prompt-button.primary {
            background: #3b82f6;
            color: white;
          }
          
          .install-prompt-button.primary:hover {
            background: #2563eb;
          }
          
          .install-prompt-button.secondary {
            background: #f3f4f6;
            color: #374151;
          }
          
          .install-prompt-button.secondary:hover {
            background: #e5e7eb;
          }
          
          /* モバイル最適化 */
          @media (max-width: 640px) {
            .user-name {
              display: none;
            }
            
            .header-right {
              gap: 6px;
            }
            
            .header-icon-btn {
              width: 32px;
              height: 32px;
            }
            
            .header-icon-btn svg {
              width: 18px;
              height: 18px;
            }
            
            .install-prompt {
              left: 16px;
              right: 16px;
              padding: 16px;
            }
            
            .install-prompt-actions {
              flex-direction: row;
            }
            
            @media (min-width: 400px) {
              .user-name {
                display: block;
              }
              
              .header-icon-btn {
                width: 36px;
                height: 36px;
              }
              
              .header-icon-btn svg {
                width: 20px;
                height: 20px;
              }
            }
          }
          
          /* 特定ページでのスタイル調整 */
          .problems-page .tab[href="/problems"] {
            color: #6c5ce7;
            background: rgba(108, 92, 231, 0.1);
          }
          
          /* iOS Safari固有の調整 */
          @supports (-webkit-touch-callout: none) {
            .fixed-header {
              -webkit-backdrop-filter: blur(10px);
              backdrop-filter: blur(10px);
              background: rgba(59, 130, 246, 0.95);
            }
            
            .fixed-footer {
              -webkit-backdrop-filter: blur(10px);
              backdrop-filter: blur(10px);
              background: rgba(255, 255, 255, 0.95);
            }
          }
          
          /* アクセシビリティ改善 */
          @media (prefers-reduced-motion: reduce) {
            .tab,
            .header-icon-btn,
            .install-prompt {
              transition: none;
            }
            
            .install-prompt {
              animation: none;
            }
          }
          
          /* ダークモード対応の準備 */
          @media (prefers-color-scheme: dark) {
            /* 将来のダークモード対応用 */
          }
        `}</style>

        <div className="dashboard-layout">
          {/* Fixed Header */}
          <header className="fixed-header">
            <div className="header-left">
              <Link href="/home" className="app-logo">
                A-IStudy
              </Link>
              <div className="user-name">{displayName}</div>
            </div>
            <div className="header-right">
              {/* スケジュールアイコン */}
              <button 
                className="header-icon-btn" 
                onClick={() => router.push('/schedule')}
                aria-label="スケジュール"
                title="スケジュール"
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 8h12v8H4V8z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* タイマーアイコン */}
              <button 
                className="header-icon-btn" 
                onClick={() => router.push('/timer')}
                aria-label="タイマー"
                title="タイマー"
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* 通知アイコン */}
              <button 
                className="header-icon-btn" 
                onClick={() => router.push('/notifications')}
                aria-label="通知"
                title="通知"
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                {/* 通知バッジ（通知がある場合に表示） */}
                {/* <span className="notification-badge">3</span> */}
              </button>
              
              {/* 設定アイコン */}
              <button 
                className="header-icon-btn" 
                onClick={() => router.push('/settings')}
                aria-label="設定"
                title="設定"
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </header>

          {/* Main Content */}
          <main>
            {children}
          </main>

          {/* PWAインストールプロンプト */}
          {showInstallPrompt && !isStandalone && (
            <div className="install-prompt">
              <div className="install-prompt-icon">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="install-prompt-content">
                <div className="install-prompt-title">A-IStudyをインストール</div>
                <div className="install-prompt-description">
                  ホーム画面に追加してアプリのように使えます
                </div>
              </div>
              <div className="install-prompt-actions">
                <button 
                  className="install-prompt-button primary"
                  onClick={handleInstallClick}
                >
                  インストール
                </button>
                <button 
                  className="install-prompt-button secondary"
                  onClick={dismissInstallPrompt}
                >
                  後で
                </button>
              </div>
            </div>
          )}

          {/* Fixed Footer */}
          <nav className="fixed-footer">
            <Link href="/home" className={`tab ${getActiveTab() === 'home' ? 'active' : ''}`}>
              <div className="tab-icon">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              <span>ホーム</span>
            </Link>
            
            <Link href="/problems" className={`tab ${getActiveTab() === 'problems' ? 'active' : ''}`}>
              <div className="tab-icon">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
              </div>
              <span>学習</span>
            </Link>
            
            <Link href="/secondary-exam" className={`tab ${getActiveTab() === 'secondary-exam' ? 'active' : ''}`}>
              <div className="tab-icon">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h2a1 1 0 100-2h2A4 4 0 0116 7v6a4 4 0 01-4 4h-1.535a4 4 0 01-3.464-2 4 4 0 01-3.465 2H6a4 4 0 01-4-4V7a4 4 0 014-4h1a1 1 0 000 2zm5 2a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1V8a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <span>二次試験</span>
            </Link>
            
            <Link href="/analytics" className={`tab ${getActiveTab() === 'analytics' ? 'active' : ''}`}>
              <div className="tab-icon">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <span>分析</span>
            </Link>
            
            <Link href="/settings" className={`tab ${getActiveTab() === 'settings' ? 'active' : ''}`}>
              <div className="tab-icon">
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </div>
              <span>設定</span>
            </Link>
          </nav>
        </div>
      </>
    </QueryClientProvider>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <FirebaseErrorBoundary>
      <DashboardContent>
        {children}
      </DashboardContent>
    </FirebaseErrorBoundary>
  )
}