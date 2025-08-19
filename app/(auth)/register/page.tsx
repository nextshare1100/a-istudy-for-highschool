'use client'

import { RegisterForm } from '@/components/auth/register-form';
import Link from 'next/link';
import { Sparkles, CheckCircle, Gift, Zap, Brain, GraduationCap, Target, BookOpen, TrendingUp, Users, Info, ArrowRight, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function RegisterPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // スタイル定義（モバイル最適化済み）
  const styles = {
    wrapper: {
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", sans-serif',
    },
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: isMobile ? '12px' : '24px',
    },
    header: {
      textAlign: 'center' as const,
      paddingTop: isMobile ? '16px' : '48px',
      paddingBottom: isMobile ? '12px' : '32px',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: isMobile ? '3px' : '6px',
      padding: isMobile ? '3px 8px' : '6px 16px',
      backgroundColor: '#e0e7ff',
      color: '#4338ca',
      borderRadius: '20px',
      fontSize: isMobile ? '10px' : '14px',
      fontWeight: '600',
      marginBottom: isMobile ? '8px' : '16px',
    },
    title: {
      fontSize: isMobile ? '20px' : '36px',
      fontWeight: '800',
      color: '#1f2937',
      marginBottom: isMobile ? '8px' : '16px',
      lineHeight: 1.2,
      margin: 0,
    },
    subtitle: {
      fontSize: isMobile ? '12px' : '18px',
      color: '#6b7280',
      maxWidth: '600px',
      margin: '0 auto',
      lineHeight: 1.5,
    },
    benefitsCard: {
      backgroundColor: 'white',
      borderRadius: isMobile ? '8px' : '16px',
      padding: isMobile ? '12px' : '24px',
      marginBottom: isMobile ? '12px' : '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
    },
    benefitsTitle: {
      fontSize: isMobile ? '12px' : '16px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: isMobile ? '8px' : '16px',
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '4px' : '8px',
      margin: 0,
    },
    benefitsList: {
      display: 'grid',
      gap: isMobile ? '6px' : '12px',
    },
    benefitItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: isMobile ? '8px' : '12px',
    },
    benefitIcon: {
      width: isMobile ? '24px' : '32px',
      height: isMobile ? '24px' : '32px',
      borderRadius: '6px',
      backgroundColor: '#dbeafe',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    benefitContent: {
      flex: 1,
    },
    benefitTitle: {
      fontSize: isMobile ? '11px' : '14px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '1px',
      margin: 0,
    },
    benefitDescription: {
      fontSize: isMobile ? '10px' : '13px',
      color: '#6b7280',
      margin: 0,
      lineHeight: 1.3,
    },
    mainCard: {
      backgroundColor: 'white',
      borderRadius: isMobile ? '12px' : '20px',
      padding: isMobile ? '16px' : '32px',
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      marginBottom: isMobile ? '12px' : '24px',
    },
    campaignBanner: {
      backgroundColor: '#dcfce7',
      borderRadius: isMobile ? '8px' : '12px',
      padding: isMobile ? '8px' : '16px',
      marginBottom: isMobile ? '12px' : '20px',
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '8px' : '12px',
      border: '1px solid #bbf7d0',
    },
    campaignIcon: {
      width: isMobile ? '28px' : '40px',
      height: isMobile ? '28px' : '40px',
      backgroundColor: '#22c55e',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    campaignContent: {
      flex: 1,
    },
    campaignTitle: {
      fontSize: isMobile ? '11px' : '14px',
      fontWeight: '600',
      color: '#15803d',
      marginBottom: '1px',
    },
    campaignText: {
      fontSize: isMobile ? '10px' : '13px',
      color: '#166534',
    },
    loginCard: {
      backgroundColor: 'white',
      borderRadius: isMobile ? '8px' : '16px',
      padding: isMobile ? '12px' : '24px',
      marginBottom: isMobile ? '12px' : '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      textAlign: 'center' as const,
    },
    loginButton: {
      padding: isMobile ? '8px 16px' : '12px 24px',
      borderRadius: isMobile ? '6px' : '10px',
      border: '1px solid #e5e7eb',
      backgroundColor: 'white',
      color: '#374151',
      fontSize: isMobile ? '11px' : '14px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isMobile ? '4px' : '8px',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
      marginTop: isMobile ? '8px' : '16px',
      textDecoration: 'none',
    },
    statsSection: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: isMobile ? '8px' : '16px',
      marginBottom: isMobile ? '12px' : '24px',
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: isMobile ? '8px' : '12px',
      padding: isMobile ? '8px' : '16px',
      textAlign: 'center' as const,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
    },
    statIcon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isMobile ? '2px' : '6px',
      marginBottom: isMobile ? '2px' : '6px',
    },
    statValue: {
      fontSize: isMobile ? '14px' : '24px',
      fontWeight: '700',
      color: '#1f2937',
    },
    statLabel: {
      fontSize: isMobile ? '9px' : '12px',
      color: '#6b7280',
    },
    infoCard: {
      backgroundColor: '#eff6ff',
      borderRadius: isMobile ? '8px' : '12px',
      padding: isMobile ? '8px' : '16px',
      display: 'flex',
      gap: isMobile ? '6px' : '12px',
      alignItems: 'flex-start',
    },
    infoContent: {
      flex: 1,
      fontSize: isMobile ? '10px' : '13px',
      color: '#1e40af',
      lineHeight: 1.4,
    },
    termsText: {
      fontSize: isMobile ? '9px' : '12px',
      color: '#6b7280',
      textAlign: 'center' as const,
      marginTop: isMobile ? '12px' : '24px',
      lineHeight: 1.4,
    },
    termsLink: {
      color: '#3b82f6',
      textDecoration: 'underline',
    },
    pulseAnimation: {
      position: 'relative' as const,
      display: 'flex',
      height: '6px',
      width: '6px',
    },
    pulseDot: {
      position: 'absolute' as const,
      display: 'inline-flex',
      height: '100%',
      width: '100%',
      borderRadius: '50%',
      backgroundColor: '#22c55e',
      opacity: 0.75,
      animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
    },
    pulseCenter: {
      position: 'relative' as const,
      display: 'inline-flex',
      borderRadius: '50%',
      height: '6px',
      width: '6px',
      backgroundColor: '#22c55e',
    },
  };

  // モバイル版
  if (isMobile) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.container}>
          {/* ヘッダー */}
          <div style={styles.header}>
            <div style={styles.badge}>
              <GraduationCap size={12} />
              高校生向け学習支援
            </div>
            <h1 style={styles.title}>
              A-IStudyに新規登録
            </h1>
            <p style={styles.subtitle}>
              無料で始めて、AIの力で学習効率を最大化しましょう。
            </p>
          </div>

          {/* キャンペーンバナー */}
          <div style={styles.campaignBanner}>
            <div style={styles.campaignIcon}>
              <Gift size={16} color="white" />
            </div>
            <div style={styles.campaignContent}>
              <div style={styles.campaignTitle}>期間限定キャンペーン</div>
              <div style={styles.campaignText}>
                今なら初月無料でお試しいただけます
              </div>
            </div>
          </div>

          {/* 特典説明カード */}
          <div style={styles.benefitsCard}>
            <h2 style={styles.benefitsTitle}>
              <Sparkles size={14} />
              プレミアムプランの特典
            </h2>
            <div style={styles.benefitsList}>
              <div style={styles.benefitItem}>
                <div style={styles.benefitIcon}>
                  <Brain size={14} color="#3b82f6" />
                </div>
                <div style={styles.benefitContent}>
                  <div style={styles.benefitTitle}>AIによる学習分析</div>
                  <div style={styles.benefitDescription}>
                    あなたの学習パターンを分析し、最適化
                  </div>
                </div>
              </div>
              <div style={styles.benefitItem}>
                <div style={styles.benefitIcon}>
                  <BookOpen size={14} color="#3b82f6" />
                </div>
                <div style={styles.benefitContent}>
                  <div style={styles.benefitTitle}>全教科対応</div>
                  <div style={styles.benefitDescription}>
                    主要5教科から副教科まで完全カバー
                  </div>
                </div>
              </div>
              <div style={styles.benefitItem}>
                <div style={styles.benefitIcon}>
                  <Target size={14} color="#3b82f6" />
                </div>
                <div style={styles.benefitContent}>
                  <div style={styles.benefitTitle}>志望校合格サポート</div>
                  <div style={styles.benefitDescription}>
                    目標に向けた最適な学習プランを提案
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* メインカード（登録フォーム） */}
          <div style={styles.mainCard}>
            <RegisterForm />
          </div>

          {/* ログインカード */}
          <div style={styles.loginCard}>
            <p style={{
              fontSize: '11px',
              color: '#6b7280',
              margin: 0,
            }}>
              すでにアカウントをお持ちの方
            </p>
            <Link
              href="/login"
              style={{
                ...styles.loginButton,
                ...(hoveredButton === 'login' ? {
                  backgroundColor: '#f3f4f6',
                  borderColor: '#7c3aed',
                  color: '#7c3aed',
                } : {})
              }}
              onMouseEnter={() => setHoveredButton('login')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              ログインはこちら
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* 統計情報 */}
          <div style={styles.statsSection}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Users size={12} color="#3b82f6" />
                <span style={styles.statValue}>10,000+</span>
              </div>
              <div style={styles.statLabel}>利用者数</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <GraduationCap size={12} color="#8b5cf6" />
                <span style={styles.statValue}>98%</span>
              </div>
              <div style={styles.statLabel}>満足度</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Target size={12} color="#10b981" />
                <span style={styles.statValue}>85%</span>
              </div>
              <div style={styles.statLabel}>成績向上</div>
            </div>
          </div>

          {/* 情報カード */}
          <div style={styles.infoCard}>
            <Info size={12} color="#1e40af" style={{ flexShrink: 0 }} />
            <div style={styles.infoContent}>
              <strong>セキュリティ：</strong>
              お客様の個人情報は最高レベルのセキュリティで保護されます。
              SSL暗号化通信により、安全にご登録いただけます。
            </div>
          </div>

          {/* 利用規約 */}
          <p style={styles.termsText}>
            登録することで、
            <Link href="/terms" style={styles.termsLink}>利用規約</Link>
            および
            <Link href="/privacy" style={styles.termsLink}>プライバシーポリシー</Link>
            に同意したものとみなされます。
          </p>
        </div>

        <style jsx>{`
          @keyframes ping {
            75%, 100% {
              transform: scale(2);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    );
  }

  // デスクトップ版
  return (
    <div className="min-h-screen flex">
      {/* 左側 - 登録フォーム */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className={`bg-white rounded-2xl shadow-xl p-8`}>
            {/* キャンペーンバナー */}
            <div className={`mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl`}>
              <div className={`flex items-center gap-3`}>
                <div className={`p-2 bg-green-100 rounded-lg`}>
                  <Gift className="w-5 h-5" color="#059669" />
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold text-green-800`}>
                    期間限定キャンペーン
                  </p>
                  <p className={`text-xs text-green-600`}>
                    今なら初月無料でお試しいただけます
                  </p>
                </div>
              </div>
            </div>
            
            <div className={`space-y-2 text-center mb-8`}>
              <h2 className={`text-2xl font-bold text-gray-900`}>
                学習を始めましょう
              </h2>
              <p className={`text-base text-gray-600`}>
                30秒で簡単登録、すぐに利用開始
              </p>
            </div>
            
            <RegisterForm />
            
            <div className={`mt-6 pt-6 border-t border-gray-100`}>
              <div className="text-center">
                <p className={`text-sm text-gray-600 mb-3`}>
                  すでにアカウントをお持ちの方
                </p>
                <Link
                  href="/login"
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium`}
                >
                  ログインはこちら
                </Link>
              </div>
            </div>
          </div>
          
          <p className={`text-center text-xs text-gray-500 mt-6`}>
            登録することで、
            <Link href="/terms" className="underline">利用規約</Link>
            および
            <Link href="/privacy" className="underline">プライバシーポリシー</Link>
            に同意したものとみなされます。
          </p>
        </div>
      </div>
      
      {/* 右側 - 特典説明（デスクトップのみ） */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-12 text-white">
        <div className="max-w-xl mx-auto flex flex-col justify-center">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                <Brain className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold">A-IStudy</h1>
            </div>
            
            <h2 className="text-4xl font-bold mb-6">
              今すぐ始めて
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                成績アップを実現
              </span>
            </h2>
            
            <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur rounded-xl mb-8">
              <Zap className="w-6 h-6 text-yellow-300" />
              <div>
                <p className="font-semibold">特別オファー実施中</p>
                <p className="text-sm text-white/90">
                  キャンペーンコード利用で初月無料
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 mb-12">
            <h3 className="text-lg font-semibold mb-4">
              プレミアムプランに含まれる機能
            </h3>
            {[
              'AIによる学習分析と最適化',
              '全教科の学習管理',
              '詳細な進捗レポート',
              '志望校合格サポート',
              '24時間365日利用可能',
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span className="text-white/90">{benefit}</span>
              </div>
            ))}
          </div>
          
          <div className="space-y-6">
            <div className="p-6 bg-white/10 backdrop-blur rounded-xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                  <span className="text-lg font-bold">田</span>
                </div>
                <div>
                  <p className="font-semibold">田中 さくらさん</p>
                  <p className="text-sm text-white/80">高校2年生</p>
                </div>
              </div>
              <p className="text-white/90 leading-relaxed">
                「A-IStudyのおかげで効率的に勉強できるようになりました。
                特にAIの分析機能が素晴らしく、自分の弱点が明確になります。」
              </p>
              <div className="flex gap-1 mt-3">
                {[...Array(5)].map((_, i) => (
                  <Sparkles key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/60">
                月額わずか980円
              </p>
              <p className="text-sm text-white/60">
                いつでもキャンセル可能
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}