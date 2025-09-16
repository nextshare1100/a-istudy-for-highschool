'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { iapManager } from '@/lib/native-iap';
import { Capacitor } from '@capacitor/core';
import { 
  Crown, 
  CheckCircle, 
  Sparkles, 
  ArrowRight,
  Loader2,
  Shield,
  Clock,
  CreditCard,
  X
} from 'lucide-react';

export default function SubscriptionOnboardingPage() {
  const router = useRouter();
  const { user, hasActiveSubscription, isInTrial } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // ユーザーがログインしていない場合はログイン画面へ
    if (!user) {
      router.push('/login?redirect=/subscription/onboarding');
      return;
    }

    // 既にサブスクリプションを持っている場合はホームへ
    if (hasActiveSubscription || isInTrial) {
      router.push('/home');
      return;
    }

    // Web環境の場合は別の決済フローへ
    if (!Capacitor.isNativePlatform()) {
      // 現在はWebでの決済は未実装のため、エラーメッセージを表示
      setError('現在、Webブラウザからの購入はサポートされていません。iOSまたはAndroidアプリをご利用ください。');
      setIsInitializing(false);
      return;
    }

    // 製品情報を取得
    loadProductInfo();
  }, [user, hasActiveSubscription, isInTrial, router]);

  const loadProductInfo = async () => {
    try {
      await iapManager.initialize();
      const info = await iapManager.getProductInfo();
      setProductInfo(info);
    } catch (error) {
      console.error('Failed to load product info:', error);
      setError('製品情報の取得に失敗しました。アプリを再起動してお試しください。');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleStartTrial = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await iapManager.purchaseSubscription();
      
      if (result.success) {
        // 購入成功 - ホーム画面へ
        router.push('/home?welcome=true');
      } else if (result.cancelled) {
        setError('サービスをご利用いただくには、プレミアムプランへの登録が必要です。');
      }
    } catch (error: any) {
      setError(error.message || '購入処理中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 初期化中の画面
  if (isInitializing) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Loader2 style={{ width: '48px', height: '48px', animation: 'spin 1s linear infinite', color: '#3b82f6' }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '448px',
        backgroundColor: 'white',
        borderRadius: '1rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* ヘッダー - スキップボタンなし（必須登録） */}
        <div style={{
          background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
          padding: '2rem',
          textAlign: 'center',
          color: 'white',
          position: 'relative'
        }}>
          <Crown style={{ width: '48px', height: '48px', margin: '0 auto 1rem' }} />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            A-IStudy プレミアム
          </h1>
          <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            AIの力で学習効率を最大化
          </p>
        </div>

        {/* 必須登録の通知 */}
        <div style={{
          backgroundColor: '#fef3c7',
          padding: '1rem',
          borderBottom: '1px solid #fde68a'
        }}>
          <p style={{
            fontSize: '0.875rem',
            color: '#92400e',
            margin: 0,
            textAlign: 'center',
            fontWeight: '600'
          }}>
            ⚠️ サービスご利用にはプレミアムプランへの登録が必要です
          </p>
        </div>

        {/* コンテンツ */}
        <div style={{ padding: '2rem' }}>
          {/* 価格情報 */}
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#dcfce7',
              borderRadius: '9999px',
              marginBottom: '1rem'
            }}>
              <Sparkles style={{ width: '16px', height: '16px', color: '#16a34a' }} />
              <span style={{ color: '#16a34a', fontWeight: '600', fontSize: '0.875rem' }}>
                30日間無料トライアル
              </span>
            </div>
            
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827' }}>
              ¥980
              <span style={{ fontSize: '1rem', fontWeight: 'normal', color: '#6b7280' }}>/月</span>
            </div>
            
            <p style={{ fontSize: '0.813rem', color: '#6b7280', marginTop: '0.5rem' }}>
              {productInfo?.hasFreeTrial ? '最初の30日間は無料' : 'いつでもキャンセル可能'}
            </p>
          </div>

          {/* 特典リスト */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '2rem'
          }}>
            {[
              'AI学習分析で弱点を克服',
              '全教科の問題を無制限生成',
              '詳細な進捗レポート',
              '志望校合格に向けた学習プラン',
              'オフラインでも学習可能'
            ].map((benefit, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <CheckCircle style={{ 
                  width: '20px', 
                  height: '20px', 
                  color: '#10b981',
                  flexShrink: 0
                }} />
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>
                  {benefit}
                </span>
              </div>
            ))}
          </div>

          {/* セキュリティ情報 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            backgroundColor: '#f3f4f6',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <Shield style={{ width: '16px', height: '16px', color: '#6b7280' }} />
            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
              決済はApp Store/Google Playで安全に処理されます
            </p>
          </div>

          {/* 無料トライアル情報 */}
          <div style={{
            padding: '1rem',
            backgroundColor: '#eff6ff',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <Clock style={{ width: '16px', height: '16px', color: '#2563eb' }} />
              <span style={{ fontWeight: '600', color: '#1e40af', fontSize: '0.875rem' }}>
                無料トライアルについて
              </span>
            </div>
            <ul style={{
              fontSize: '0.75rem',
              color: '#3730a3',
              margin: 0,
              paddingLeft: '1.5rem',
              lineHeight: '1.5'
            }}>
              <li>今すぐ開始、30日間は課金されません</li>
              <li>トライアル期間中にキャンセル可能</li>
              <li>31日目から自動的に課金開始</li>
            </ul>
          </div>

          {/* エラー表示 */}
          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              marginBottom: '1rem'
            }}>
              <p style={{
                fontSize: '0.813rem',
                color: '#dc2626',
                margin: 0
              }}>
                {error}
              </p>
            </div>
          )}

          {/* CTAボタン */}
          <button
            onClick={handleStartTrial}
            disabled={loading || !!error}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: loading || !!error ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading || !!error ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              marginBottom: '1rem'
            }}
            onMouseEnter={(e) => {
              if (!loading && !error) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && !error) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            {loading ? (
              <>
                <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                処理中...
              </>
            ) : (
              <>
                無料トライアルを開始
                <ArrowRight style={{ width: '20px', height: '20px' }} />
              </>
            )}
          </button>

          {/* 決済方法の説明 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            justifyContent: 'center',
            marginBottom: '0.5rem'
          }}>
            <CreditCard style={{ width: '14px', height: '14px', color: '#6b7280' }} />
            <p style={{
              fontSize: '0.75rem',
              color: '#6b7280',
              margin: 0
            }}>
              決済方法の登録が必要です
            </p>
          </div>

          {/* ログアウトオプション */}
          <div style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #e5e7eb'
          }}>
            <button
              onClick={() => {
                // ログアウト処理
                router.push('/logout');
              }}
              style={{
                color: '#6b7280',
                fontSize: '0.813rem',
                textDecoration: 'underline',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              別のアカウントでログイン
            </button>
          </div>
        </div>
      </div>

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
  );
}