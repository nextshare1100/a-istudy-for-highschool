'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { loadStripe } from '@stripe/stripe-js';
import { 
  CheckCircle2, 
  Tag, 
  Sparkles, 
  Loader2, 
  Building, 
  Clock,
  Target,
  BookOpen,
  Award,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  X
} from 'lucide-react';

// Stripe設定をファイル内に含める
let stripePromise: Promise<any>;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [campaignCode, setCampaignCode] = useState('');
  const [showCampaignNotice, setShowCampaignNotice] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // 決済成功時の処理
  useEffect(() => {
    const isSuccess = searchParams.get('success') === 'true';
    const sessionId = searchParams.get('session_id');
    
    if (isSuccess && sessionId) {
      // 成功メッセージを表示
      alert('サブスクリプション登録が完了しました！\n\nご登録ありがとうございます。');
      
      // URLパラメータをクリーンアップ
      window.history.replaceState({}, '', '/subscription/register');
      
      // 2秒後にホーム画面へ遷移
      setTimeout(() => {
        router.push('/home');  // ホームページへ遷移
      }, 2000);
    }
  }, [searchParams, router]);
  
  // レスポンシブ対応
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 実際のユーザー情報を取得
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // 実際のユーザー情報を使用
        setUserProfile({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          subscriptionStatus: 'free' // TODO: Firestoreから実際のステータスを取得
        });
      } else {
        // 未ログインの場合はログインページへリダイレクト
        router.push('/login?redirect=/subscription/register');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [router]);
  
  const features = [
    { icon: Award, title: '志望校合格率が平均35%向上', description: 'AIが最短ルートで合格へ導く個別カリキュラムを作成' },
    { icon: TrendingUp, title: '学習時間を40%短縮', description: 'AIが弱点を瞬時に分析し、必要な部分だけを集中学習' },
    { icon: Target, title: 'リアルタイムで成績予測', description: '現在の実力から志望校の合格可能性を常に可視化' },
    { icon: Zap, title: '苦手科目の克服を2倍速に', description: 'AIが個人の理解度に合わせて問題の難易度を自動調整' },
    { icon: Clock, title: '過去問10年分を完全攻略', description: '出題傾向をAIが分析し、頻出問題を優先的に対策' }
  ];
  
  // URLパラメータから新規ユーザーかどうかを判定
  const [isNewUser, setIsNewUser] = useState(false);
  
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setIsNewUser(searchParams.get('welcome') === 'true');
    
    const savedCampaignCode = sessionStorage.getItem('pendingCampaignCode');
    if (savedCampaignCode) {
      setCampaignCode(savedCampaignCode);
      sessionStorage.removeItem('pendingCampaignCode');
    }
  }, []);
  
  // 本番環境の決済処理
  const handleCheckout = async (withCampaignCode: boolean = false) => {
    if (withCampaignCode && campaignCode.trim() && !showCampaignNotice) {
      setShowCampaignNotice(true);
      return;
    }
    
    if (!userProfile?.uid) {
      alert('ログインが必要です');
      router.push('/login?redirect=/subscription/register');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const body: any = {
        priceType: 'monthly',
        userId: userProfile.uid,
      };
      
      // キャンペーンコードがある場合は追加
      if (withCampaignCode && campaignCode.trim()) {
        body.campaignCode = campaignCode.trim().toUpperCase();
      }
      
      // Checkout セッションを作成
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'チェックアウトセッションの作成に失敗しました');
      }
      
      const { sessionId } = await response.json();
      
      // Stripe Checkout にリダイレクト
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripeの読み込みに失敗しました');
      }
      
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        console.error('Stripe redirect error:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || '決済処理中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // スタイル定義
  const styles = {
    wrapper: {
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", sans-serif',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: isMobile ? '16px' : '24px',
    },
    header: {
      textAlign: 'center' as const,
      paddingTop: isMobile ? '20px' : '48px',
      paddingBottom: isMobile ? '20px' : '48px',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: isMobile ? '4px' : '6px',
      padding: isMobile ? '4px 12px' : '6px 16px',
      backgroundColor: '#dbeafe',
      color: '#1e40af',
      borderRadius: '20px',
      fontSize: isMobile ? '12px' : '14px',
      fontWeight: '600',
      marginBottom: isMobile ? '12px' : '16px',
    },
    title: {
      fontSize: isMobile ? '22px' : '40px',
      fontWeight: '800',
      color: '#1f2937',
      marginBottom: isMobile ? '12px' : '16px',
      lineHeight: 1.2,
    },
    subtitle: {
      fontSize: isMobile ? '14px' : '18px',
      color: '#6b7280',
      maxWidth: '600px',
      margin: '0 auto',
      lineHeight: 1.6,
    },
    alert: {
      backgroundColor: 'white',
      borderRadius: isMobile ? '10px' : '12px',
      padding: isMobile ? '12px' : '16px',
      marginBottom: isMobile ? '16px' : '24px',
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '8px' : '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
    },
    alertIcon: {
      flexShrink: 0,
    },
    alertContent: {
      flex: 1,
      fontSize: isMobile ? '12px' : '14px',
      color: '#374151',
    },
    alertButton: {
      padding: isMobile ? '4px 8px' : '6px 12px',
      borderRadius: isMobile ? '6px' : '8px',
      border: 'none',
      backgroundColor: '#3b82f6',
      color: 'white',
      fontSize: isMobile ? '11px' : '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      whiteSpace: 'nowrap' as const,
    },
    campaignCard: {
      backgroundColor: 'white',
      borderRadius: isMobile ? '12px' : '16px',
      padding: isMobile ? '16px' : '24px',
      marginBottom: isMobile ? '20px' : '32px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      border: '2px solid #8b5cf6',
      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)',
    },
    campaignHeader: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: isMobile ? '12px' : '16px',
      marginBottom: isMobile ? '16px' : '20px',
    },
    campaignIcon: {
      width: isMobile ? '36px' : '48px',
      height: isMobile ? '36px' : '48px',
      borderRadius: isMobile ? '10px' : '12px',
      backgroundColor: '#8b5cf6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    campaignContent: {
      flex: 1,
    },
    campaignTitle: {
      fontSize: isMobile ? '16px' : '18px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '6px' : '8px',
    },
    campaignDescription: {
      fontSize: isMobile ? '13px' : '14px',
      color: '#6b7280',
    },
    campaignInput: {
      display: 'flex',
      gap: isMobile ? '10px' : '12px',
      flexDirection: isMobile ? 'column' as const : 'row' as const,
    },
    input: {
      flex: 1,
      padding: isMobile ? '10px 12px' : '12px 16px',
      borderRadius: isMobile ? '8px' : '10px',
      border: '1px solid #e5e7eb',
      fontSize: isMobile ? '14px' : '15px',
      fontFamily: 'inherit',
      transition: 'all 0.2s',
    },
    campaignButton: {
      padding: isMobile ? '10px 16px' : '12px 24px',
      borderRadius: isMobile ? '8px' : '10px',
      border: 'none',
      backgroundColor: '#8b5cf6',
      color: 'white',
      fontSize: isMobile ? '13px' : '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isMobile ? '6px' : '8px',
      transition: 'all 0.2s',
      whiteSpace: 'nowrap' as const,
    },
    campaignNotice: {
      backgroundColor: '#fef3c7',
      border: '1px solid #fcd34d',
      borderRadius: isMobile ? '8px' : '10px',
      padding: isMobile ? '12px' : '16px',
      marginTop: isMobile ? '12px' : '16px',
    },
    noticeText: {
      fontSize: isMobile ? '12px' : '13px',
      color: '#78350f',
      marginBottom: isMobile ? '10px' : '12px',
    },
    noticeButtons: {
      display: 'flex',
      gap: isMobile ? '6px' : '8px',
    },
    noticeButton: {
      padding: isMobile ? '6px 12px' : '8px 16px',
      borderRadius: isMobile ? '6px' : '8px',
      border: 'none',
      fontSize: isMobile ? '12px' : '13px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    primaryNoticeButton: {
      backgroundColor: '#f59e0b',
      color: 'white',
    },
    secondaryNoticeButton: {
      backgroundColor: 'white',
      color: '#78350f',
      border: '1px solid #fcd34d',
    },
    mainCard: {
      backgroundColor: 'white',
      borderRadius: isMobile ? '16px' : '20px',
      padding: isMobile ? '20px' : '40px',
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      marginBottom: isMobile ? '20px' : '32px',
    },
    planHeader: {
      textAlign: 'center' as const,
      marginBottom: isMobile ? '20px' : '32px',
    },
    planBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: isMobile ? '4px' : '6px',
      padding: isMobile ? '3px 10px' : '4px 12px',
      backgroundColor: '#dcfce7',
      color: '#166534',
      borderRadius: '16px',
      fontSize: isMobile ? '11px' : '12px',
      fontWeight: '600',
      marginBottom: isMobile ? '10px' : '12px',
    },
    planTitle: {
      fontSize: isMobile ? '20px' : '28px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: isMobile ? '12px' : '16px',
    },
    priceContainer: {
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'center',
      gap: isMobile ? '6px' : '8px',
      marginBottom: isMobile ? '6px' : '8px',
    },
    price: {
      fontSize: isMobile ? '32px' : '48px',
      fontWeight: '800',
      color: '#1f2937',
    },
    priceUnit: {
      fontSize: isMobile ? '16px' : '18px',
      color: '#6b7280',
    },
    planSubtitle: {
      fontSize: isMobile ? '13px' : '14px',
      color: '#6b7280',
    },
    featureGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: isMobile ? '12px' : '20px',
      marginBottom: isMobile ? '20px' : '32px',
    },
    featureItem: {
      display: 'flex',
      gap: isMobile ? '10px' : '12px',
    },
    featureIconContainer: {
      width: isMobile ? '32px' : '40px',
      height: isMobile ? '32px' : '40px',
      borderRadius: isMobile ? '8px' : '10px',
      backgroundColor: '#eff6ff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: isMobile ? '13px' : '14px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '2px',
    },
    featureDescription: {
      fontSize: isMobile ? '12px' : '13px',
      color: '#6b7280',
      lineHeight: 1.4,
    },
    ctaContainer: {
      textAlign: 'center' as const,
    },
    ctaButton: {
      width: '100%',
      maxWidth: '400px',
      padding: isMobile ? '12px 20px' : '16px 32px',
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
      marginBottom: isMobile ? '12px' : '16px',
    },
    securityInfo: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isMobile ? '12px' : '16px',
      fontSize: isMobile ? '11px' : '12px',
      color: '#6b7280',
      marginBottom: isMobile ? '6px' : '8px',
      flexWrap: 'wrap' as const,
    },
    paymentNote: {
      fontSize: isMobile ? '10px' : '11px',
      color: '#9ca3af',
      textAlign: 'center' as const,
    },
    guaranteeCard: {
      backgroundColor: '#f0fdf4',
      borderRadius: isMobile ? '10px' : '12px',
      padding: isMobile ? '16px' : '20px',
      marginBottom: isMobile ? '20px' : '32px',
      border: '1px solid #86efac',
    },
    guaranteeContent: {
      fontSize: isMobile ? '13px' : '14px',
      color: '#166534',
      lineHeight: 1.6,
    },
    skipButton: {
      display: 'block',
      margin: '0 auto',
      padding: isMobile ? '10px 20px' : '12px 24px',
      borderRadius: isMobile ? '8px' : '10px',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#6b7280',
      fontSize: isMobile ? '13px' : '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    footer: {
      textAlign: 'center' as const,
      padding: isMobile ? '20px 0' : '32px 0',
      fontSize: isMobile ? '12px' : '13px',
      color: '#6b7280',
      lineHeight: 1.6,
    },
    footerLink: {
      color: '#3b82f6',
      textDecoration: 'none',
      transition: 'color 0.2s',
    },
    loadingOverlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    loadingCard: {
      backgroundColor: 'white',
      borderRadius: isMobile ? '10px' : '12px',
      padding: isMobile ? '20px' : '24px',
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '12px' : '16px',
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
    },
    spinner: {
      animation: 'spin 1s linear infinite',
    },
    successCard: {
      backgroundColor: 'white',
      borderRadius: isMobile ? '12px' : '16px',
      padding: isMobile ? '24px 20px' : '48px',
      textAlign: 'center' as const,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      maxWidth: '600px',
      margin: '0 auto',
    },
    successIcon: {
      width: isMobile ? '48px' : '64px',
      height: isMobile ? '48px' : '64px',
      borderRadius: '50%',
      backgroundColor: '#dcfce7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: isMobile ? '0 auto 16px' : '0 auto 24px',
    },
    successTitle: {
      fontSize: isMobile ? '20px' : '24px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: isMobile ? '6px' : '8px',
    },
    successDescription: {
      fontSize: isMobile ? '14px' : '16px',
      color: '#6b7280',
      marginBottom: isMobile ? '24px' : '32px',
    },
    homeButton: {
      padding: isMobile ? '10px 20px' : '12px 24px',
      borderRadius: isMobile ? '8px' : '10px',
      border: '1px solid #e5e7eb',
      backgroundColor: 'white',
      color: '#4b5563',
      fontSize: isMobile ? '13px' : '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: isMobile ? '6px' : '8px',
      transition: 'all 0.2s',
    },
  };

  if (authLoading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.container}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <div style={{ textAlign: 'center' }}>
              <Loader2 size={isMobile ? 24 : 32} className="animate-spin" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: '#6b7280', fontSize: isMobile ? '14px' : '16px' }}>読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // すでにサブスクリプションがある場合
  if (userProfile?.subscriptionStatus === 'active' || userProfile?.subscriptionStatus === 'corporate') {
    return (
      <div style={styles.wrapper}>
        <div style={styles.container}>
          <div style={styles.successCard}>
            <div style={styles.successIcon}>
              <CheckCircle2 size={isMobile ? 24 : 32} color="#22c55e" />
            </div>
            <h2 style={styles.successTitle}>
              {userProfile.subscriptionStatus === 'corporate' ? '法人契約プラン利用中' : 'プレミアムプラン利用中'}
            </h2>
            <p style={styles.successDescription}>
              すべての機能をご利用いただけます
            </p>
            <button
              style={styles.homeButton}
              onClick={() => router.push('/home')}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              ホームに戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* ヘッダー */}
        <div style={styles.header}>
          <div style={styles.badge}>
            <Sparkles size={isMobile ? 14 : 16} />
            学習効率を最大化
          </div>
          <h1 style={styles.title}>
            月額980円で、<br />合格への最短ルートを
          </h1>
          <p style={styles.subtitle}>
            AIがあなたの学習データを分析し、最適な学習プランを提案。
            効率的な学習で、目標達成を実現します。
          </p>
        </div>

        {/* 新規ユーザー向けウェルカムメッセージ */}
        {isNewUser && (
          <div style={{ ...styles.alert, backgroundColor: '#dcfce7', borderColor: '#86efac' }}>
            <CheckCircle2 size={isMobile ? 16 : 20} color="#22c55e" style={styles.alertIcon} />
            <div style={styles.alertContent}>
              <strong>アカウント作成ありがとうございます！</strong>
              <br />
              A-IStudyの全機能をご利用いただくには、以下のプランにご登録ください。
            </div>
          </div>
        )}
        
        {/* 法人契約への誘導 */}
        <div style={{ ...styles.alert, backgroundColor: '#dbeafe', borderColor: '#93c5fd' }}>
          <Building size={isMobile ? 16 : 20} color="#2563eb" style={styles.alertIcon} />
          <div style={styles.alertContent}>
            法人契約をお持ちの方は、QRコードまたは法人IDで無料利用できます
          </div>
          <button
            style={styles.alertButton}
            onClick={() => router.push('/corporate')}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
          >
            法人契約の有効化 →
          </button>
        </div>
        
        {/* キャンペーンコード入力欄 */}
        <div style={styles.campaignCard}>
          <div style={styles.campaignHeader}>
            <div style={styles.campaignIcon}>
              <Tag size={isMobile ? 20 : 24} color="white" />
            </div>
            <div style={styles.campaignContent}>
              <h3 style={styles.campaignTitle}>
                キャンペーンコードをお持ちの方
                <Sparkles size={isMobile ? 14 : 16} color="#f59e0b" className="animate-pulse" />
              </h3>
              <p style={styles.campaignDescription}>
                特別キャンペーンコードで初月無料！今すぐ始めましょう
              </p>
            </div>
          </div>
          
          <div style={styles.campaignInput}>
            <input
              style={styles.input}
              placeholder="例: AISTUDY2024"
              value={campaignCode}
              onChange={(e) => {
                setCampaignCode(e.target.value.toUpperCase());
                setShowCampaignNotice(false);
              }}
              disabled={isLoading}
              onFocus={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
            <button
              style={{
                ...styles.campaignButton,
                opacity: isLoading || !campaignCode.trim() ? 0.6 : 1,
                cursor: isLoading || !campaignCode.trim() ? 'not-allowed' : 'pointer',
              }}
              onClick={() => handleCheckout(true)}
              disabled={isLoading || !campaignCode.trim()}
              onMouseEnter={(e) => {
                if (!isLoading && campaignCode.trim()) {
                  e.currentTarget.style.backgroundColor = '#7c3aed';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#8b5cf6';
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={isMobile ? 14 : 16} className="animate-spin" />
                  処理中...
                </>
              ) : (
                'コードを使用して始める'
              )}
            </button>
          </div>
          
          {/* キャンペーンコード使用時の注意書き */}
          {showCampaignNotice && (
            <div style={styles.campaignNotice}>
              <div style={styles.noticeText}>
                <strong>ご確認ください：</strong>
                <br />
                キャンペーンコードを使用すると初月は無料となりますが、
                <span style={{ fontWeight: '700', color: '#92400e' }}>2ヶ月目以降は月額980円が自動的に請求されます。</span>
                いつでもキャンセル可能です。
              </div>
              <div style={styles.noticeButtons}>
                <button
                  style={{ ...styles.noticeButton, ...styles.primaryNoticeButton }}
                  onClick={() => {
                    setShowCampaignNotice(false);
                    handleCheckout(true);
                  }}
                  disabled={isLoading}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f59e0b'}
                >
                  理解して続ける
                </button>
                <button
                  style={{ ...styles.noticeButton, ...styles.secondaryNoticeButton }}
                  onClick={() => setShowCampaignNotice(false)}
                  disabled={isLoading}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef3c7'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* メインプランカード */}
        <div style={styles.mainCard}>
          <div style={styles.planHeader}>
            <div style={styles.planBadge}>
              <Award size={isMobile ? 12 : 14} />
              人気No.1
            </div>
            <h2 style={styles.planTitle}>基本プラン</h2>
            <div style={styles.priceContainer}>
              <span style={styles.price}>¥980</span>
              <span style={styles.priceUnit}>/ 月</span>
              <span style={{ fontSize: isMobile ? '14px' : '16px', color: '#6b7280', marginLeft: '4px' }}>
                +500円<span style={{ fontSize: isMobile ? '11px' : '12px' }}>(初月のみ)</span>
              </span>
            </div>
            <p style={{ ...styles.planSubtitle, marginBottom: '4px' }}>
              すべての機能が使い放題。<br />いつでもキャンセル可能
            </p>
            <p style={{ fontSize: isMobile ? '11px' : '12px', color: '#9ca3af', marginTop: '4px', marginBottom: '20px' }}>
              ※初月は初期登録費用として500円をいただきます。
            </p>
            
            {/* CTAボタン */}
            <button
              style={{
                ...styles.ctaButton,
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                marginBottom: isMobile ? '24px' : '32px',
              }}
              onClick={() => handleCheckout(false)}
              disabled={isLoading}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(59, 130, 246, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#3b82f6';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={isMobile ? 16 : 20} className="animate-spin" />
                  処理中...
                </>
              ) : (
                <>
                  今すぐ始める
                  <ArrowRight size={isMobile ? 16 : 20} />
                </>
              )}
            </button>
          </div>
          
          {/* 機能リスト */}
          <div style={styles.featureGrid}>
            {features.map((feature, index) => (
              <div key={index} style={styles.featureItem}>
                <div style={styles.featureIconContainer}>
                  <feature.icon size={isMobile ? 16 : 20} color="#3b82f6" />
                </div>
                <div style={styles.featureContent}>
                  <div style={styles.featureTitle}>{feature.title}</div>
                  <div style={styles.featureDescription}>{feature.description}</div>
                </div>
              </div>
            ))}
          </div>
          
          {/* CTAコンテナ */}
          <div style={styles.ctaContainer}>
            <div style={styles.securityInfo}>
              <span>✓ SSL暗号化</span>
              <span>✓ 安全な決済</span>
              <span>✓ 即時キャンセル可</span>
            </div>
            <p style={styles.paymentNote}>
              決済はStripeを通じて安全に処理されます
            </p>
          </div>
        </div>
        
        {/* 保証情報 */}
        <div style={styles.guaranteeCard}>
          <div style={styles.guaranteeContent}>
            <strong>安心の保証：</strong>
            ご満足いただけない場合は、いつでもキャンセル可能です。
            日割り計算での返金には対応しておりません。
          </div>
        </div>
        
        {/* フッター */}
        <div style={styles.footer}>
          <p>
            領収書の発行や法人での一括契約をご希望の場合は、
            <a 
              href="mailto:support@aistudy.jp" 
              style={styles.footerLink}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#3b82f6'}
            >
              お問い合わせ
            </a>
            ください。
          </p>
          <p>
            よくあるご質問は
            <a 
              href="/faq" 
              style={styles.footerLink}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#3b82f6'}
            >
              こちら
            </a>
            をご覧ください。
          </p>
        </div>
      </div>
      
      {/* ローディングオーバーレイ */}
      {isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingCard}>
            <Loader2 size={isMobile ? 20 : 24} className="animate-spin" />
            <span style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '600', color: '#1f2937' }}>
              決済ページへ移動しています...
            </span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }
      `}</style>
    </div>
  );
}