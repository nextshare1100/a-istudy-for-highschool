'use client'

import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, BookOpen, Brain, Target, GraduationCap, TrendingUp, Users, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function LoginPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [userCount, setUserCount] = useState<number>(10000);
  const [satisfactionRate, setSatisfactionRate] = useState<number>(98);
  const [improvementRate, setImprovementRate] = useState<number>(85);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 統計値の動的変更ロジック
  useEffect(() => {
    const updateStats = () => {
      const now = new Date();
      const cachedStats = localStorage.getItem('statsData');
      
      if (cachedStats) {
        const { satisfaction, improvement, lastSatisfactionUpdate, lastImprovementUpdate } = JSON.parse(cachedStats);
        
        // 満足度の更新（1日ごと、20%の確率で変更）
        const daysSinceSatisfactionUpdate = Math.floor((now.getTime() - lastSatisfactionUpdate) / (24 * 60 * 60 * 1000));
        let newSatisfaction = satisfaction;
        
        if (daysSinceSatisfactionUpdate >= 1) {
          // 20%の確率で変更
          if (Math.random() < 0.2) {
            // 現在の値に基づいて上下を決定
            if (satisfaction === 96) {
              newSatisfaction = 97;
            } else if (satisfaction === 99) {
              newSatisfaction = 98;
            } else {
              // 97 or 98の場合は上下ランダム
              newSatisfaction = satisfaction + (Math.random() < 0.5 ? 1 : -1);
            }
          }
        }
        
        // 成績向上率の更新（約10-15日に1回変更）
        const daysSinceImprovementUpdate = Math.floor((now.getTime() - lastImprovementUpdate) / (24 * 60 * 60 * 1000));
        let newImprovement = improvement;
        
        // 月に2-3回 = 10-15日に1回程度の変更
        if (daysSinceImprovementUpdate >= 10) {
          const changeChance = Math.min((daysSinceImprovementUpdate - 9) * 0.1, 0.5); // 10日目から確率が上がる
          if (Math.random() < changeChance) {
            // 80-92%の範囲で変動
            const direction = Math.random() < 0.5 ? 1 : -1;
            newImprovement = improvement + direction;
            
            // 範囲制限
            if (newImprovement < 80) newImprovement = 81;
            if (newImprovement > 92) newImprovement = 91;
          }
        }
        
        // 値が変更された場合は保存
        if (newSatisfaction !== satisfaction || newImprovement !== improvement) {
          const updatedStats = {
            satisfaction: newSatisfaction,
            improvement: newImprovement,
            lastSatisfactionUpdate: newSatisfaction !== satisfaction ? now.getTime() : lastSatisfactionUpdate,
            lastImprovementUpdate: newImprovement !== improvement ? now.getTime() : lastImprovementUpdate
          };
          localStorage.setItem('statsData', JSON.stringify(updatedStats));
          setSatisfactionRate(newSatisfaction);
          setImprovementRate(newImprovement);
        } else {
          setSatisfactionRate(satisfaction);
          setImprovementRate(improvement);
        }
      } else {
        // 初回アクセス時
        const initialStats = {
          satisfaction: 98,
          improvement: 85,
          lastSatisfactionUpdate: now.getTime(),
          lastImprovementUpdate: now.getTime()
        };
        localStorage.setItem('statsData', JSON.stringify(initialStats));
        setSatisfactionRate(98);
        setImprovementRate(85);
      }
    };
    
    updateStats();
    
    // 1時間ごとにチェック
    const interval = setInterval(updateStats, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // リアルタイムでユーザー数を取得
  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        // ローカルストレージから前回の取得情報を確認
        const cachedData = localStorage.getItem('userCountData');
        const now = new Date().getTime();
        
        if (cachedData) {
          const { count, timestamp } = JSON.parse(cachedData);
          const oneDayInMs = 24 * 60 * 60 * 1000; // 1日のミリ秒
          
          // 1日以内のデータならキャッシュを使用
          if (now - timestamp < oneDayInMs) {
            setUserCount(formatUserCount(count));
            return;
          }
        }
        
        // Firestoreから新しいデータを取得
        const usersCollection = collection(db, 'users');
        const snapshot = await getCountFromServer(usersCollection);
        const actualCount = snapshot.data().count;
        
        // 表示用にフォーマット
        const displayCount = formatUserCount(actualCount);
        setUserCount(displayCount);
        
        // キャッシュに保存
        localStorage.setItem('userCountData', JSON.stringify({
          count: actualCount,
          timestamp: now
        }));
        
      } catch (error) {
        console.error('Error fetching user count:', error);
        // エラー時はデフォルト値を使用
        setUserCount(10000);
      }
    };

    // ユーザー数を段階的に表示するフォーマット関数
    const formatUserCount = (count: number): number => {
      if (count <= 500) {
        // 500人までは1人単位
        return count;
      } else if (count <= 1000) {
        // 501-1000人は10人単位
        return Math.floor(count / 10) * 10;
      } else if (count <= 5000) {
        // 1001-5000人は50人単位
        return Math.floor(count / 50) * 50;
      } else if (count <= 10000) {
        // 5001-10000人は100人単位
        return Math.floor(count / 100) * 100;
      } else if (count <= 50000) {
        // 10001-50000人は500人単位
        return Math.floor(count / 500) * 500;
      } else if (count <= 100000) {
        // 50001-100000人は1000人単位
        return Math.floor(count / 1000) * 1000;
      } else {
        // 100001人以上は5000人単位
        return Math.floor(count / 5000) * 5000;
      }
    };

    fetchUserCount();
    
    // 1日ごとに更新をチェック（ページが開いている場合）
    const dailyInterval = setInterval(() => {
      fetchUserCount();
    }, 24 * 60 * 60 * 1000); // 24時間ごと

    return () => clearInterval(dailyInterval);
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
    registerCard: {
      backgroundColor: 'white',
      borderRadius: isMobile ? '8px' : '16px',
      padding: isMobile ? '12px' : '24px',
      marginBottom: isMobile ? '12px' : '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      textAlign: 'center' as const,
    },
    registerButton: {
      width: '100%',
      padding: isMobile ? '8px 12px' : '16px 24px',
      borderRadius: isMobile ? '8px' : '12px',
      border: 'none',
      backgroundColor: '#3b82f6',
      color: 'white',
      fontSize: isMobile ? '11px' : '16px',
      fontWeight: '700',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isMobile ? '3px' : '8px',
      transition: 'all 0.2s',
      fontFamily: 'inherit',
      marginTop: isMobile ? '8px' : '16px',
      boxSizing: 'border-box' as const,
    },
    campaignBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: isMobile ? '4px' : '8px',
      padding: isMobile ? '4px 10px' : '8px 16px',
      backgroundColor: '#dcfce7',
      borderRadius: '20px',
      marginTop: isMobile ? '8px' : '16px',
    },
    campaignText: {
      fontSize: isMobile ? '10px' : '13px',
      color: '#15803d',
      fontWeight: '600',
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
              A-IStudyにログイン
            </h1>
            <p style={styles.subtitle}>
              AIがあなたの学習を最適化。
              効率的に目標を達成しましょう。
            </p>
          </div>

          {/* 特典説明カード */}
          <div style={styles.benefitsCard}>
            <h2 style={styles.benefitsTitle}>
              <Sparkles size={14} />
              A-IStudyの特典
            </h2>
            <div style={styles.benefitsList}>
              <div style={styles.benefitItem}>
                <div style={styles.benefitIcon}>
                  <BookOpen size={14} color="#3b82f6" />
                </div>
                <div style={styles.benefitContent}>
                  <div style={styles.benefitTitle}>全教科対応</div>
                  <div style={styles.benefitDescription}>
                    主要5教科から副教科まで、幅広くカバー
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
                    AIが最適な学習プランを提案
                  </div>
                </div>
              </div>
              <div style={styles.benefitItem}>
                <div style={styles.benefitIcon}>
                  <TrendingUp size={14} color="#3b82f6" />
                </div>
                <div style={styles.benefitContent}>
                  <div style={styles.benefitTitle}>成績向上を実現</div>
                  <div style={styles.benefitDescription}>
                    弱点を分析し、効率的な学習を支援
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* メインカード（ログインフォーム） */}
          <div style={styles.mainCard}>
            <LoginForm />
          </div>

          {/* 新規登録カード */}
          <div style={styles.registerCard}>
            <p style={{
              fontSize: '11px',
              color: '#6b7280',
              margin: 0,
            }}>
              アカウントをお持ちでない方
            </p>
            <button
              onClick={(e) => {
                e.preventDefault();
                router.push('/register');
              }}
              style={{
                ...styles.registerButton,
                textDecoration: 'none',
                ...(hoveredButton === 'register' ? {
                  backgroundColor: '#2563eb',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)',
                } : {})
              }}
              onMouseEnter={() => setHoveredButton('register')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <Sparkles size={12} />
              <span style={{ whiteSpace: 'nowrap' }}>新規登録して始める</span>
              <ArrowRight size={12} />
            </button>
            <div style={styles.campaignBadge}>
              <span style={styles.pulseAnimation}>
                <span style={styles.pulseDot}></span>
                <span style={styles.pulseCenter}></span>
              </span>
              <span style={styles.campaignText}>
                今すぐ始めて学習をスタート
              </span>
            </div>
          </div>

          {/* 統計情報 */}
          <div style={styles.statsSection}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Users size={12} color="#3b82f6" />
                <span style={styles.statValue}>{userCount.toLocaleString()}+</span>
              </div>
              <div style={styles.statLabel}>利用者数</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <GraduationCap size={12} color="#8b5cf6" />
                <span style={styles.statValue}>{satisfactionRate}%</span>
              </div>
              <div style={styles.statLabel}>満足度</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Target size={12} color="#10b981" />
                <span style={styles.statValue}>{improvementRate}%</span>
              </div>
              <div style={styles.statLabel}>成績向上</div>
            </div>
          </div>

          {/* 利用規約 */}
          <p style={styles.termsText}>
            ログインすることで、
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
      {/* 左側 - 特徴説明（デスクトップのみ） */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-12 text-white">
        <div className="max-w-xl mx-auto flex flex-col justify-center">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-white/20 backdrop-blur rounded-xl">
                <Brain className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold">A-IStudy</h1>
            </div>
            
            <h2 className="text-4xl font-bold mb-6">
              AIがあなたの学習を
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">
                最適化します
              </span>
            </h2>
            
            <p className="text-lg text-white/90 leading-relaxed">
              一人ひとりに合わせたパーソナライズド学習で、
              効率的に目標を達成しましょう。
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/20 backdrop-blur rounded-lg mt-1">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">全教科対応</h3>
                <p className="text-white/80 text-sm">
                  主要5教科から副教科まで、幅広くカバー
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/20 backdrop-blur rounded-lg mt-1">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">目標達成サポート</h3>
                <p className="text-white/80 text-sm">
                  志望校合格に向けた最適な学習プランを提案
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/20 backdrop-blur rounded-lg mt-1">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI分析</h3>
                <p className="text-white/80 text-sm">
                  学習データを分析し、弱点を的確に把握
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-sm text-white/60">
              すでに{userCount.toLocaleString()}人以上の高校生が利用中
            </p>
          </div>
        </div>
      </div>
      
      {/* 右側 - ログインフォーム */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className={`bg-white rounded-2xl shadow-xl p-8`}>
            <div className={`space-y-2 text-center mb-8`}>
              <h2 className={`text-2xl font-bold text-gray-900`}>
                おかえりなさい
              </h2>
              <p className={`text-base text-gray-600`}>
                学習を続けるにはログインしてください
              </p>
            </div>
            
            <LoginForm />
            
            <div className={`mt-6 pt-6 border-t border-gray-100`}>
              <div className="text-center">
                <p className={`text-sm text-gray-600 mb-4`}>
                  初めての方はこちら
                </p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    router.push('/register');
                  }}
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-base bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium`}
                >
                  <Sparkles className="w-4 h-4" />
                  新規登録して始める
                </button>
                
                <div className="mt-4">
                  <span className={`inline-flex items-center gap-1 text-xs text-green-600 font-medium`}>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    今すぐ始めて学習をスタート
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <p className={`text-center text-xs text-gray-500 mt-6`}>
            ログインすることで、
            <button
              onClick={(e) => {
                e.preventDefault();
                router.push('/terms');
              }}
              className="underline bg-transparent border-none cursor-pointer p-0 text-gray-500"
            >
              利用規約
            </button>
            および
            <button
              onClick={(e) => {
                e.preventDefault();
                router.push('/privacy');
              }}
              className="underline bg-transparent border-none cursor-pointer p-0 text-gray-500"
            >
              プライバシーポリシー
            </button>
            に同意したものとみなされます。
          </p>
        </div>
      </div>
    </div>
  );
}