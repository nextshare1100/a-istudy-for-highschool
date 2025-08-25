'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Mic, PenTool, ChevronRight, Target, Clock, BarChart3, BookOpen, Brain, Calendar, Award, TrendingUp, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function SecondaryExamPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const styles = {
    pageContainer: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #dbeafe 100%)',
      paddingBottom: isMobile ? '80px' : '40px',
    },
    mainContent: {
      maxWidth: isMobile ? '100%' : '1200px',
      margin: '0 auto',
      padding: isMobile ? '16px 12px' : '24px',
    },
    headerSection: {
      background: 'white',
      borderRadius: isMobile ? '12px' : '20px',
      padding: isMobile ? '16px' : '32px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
      marginBottom: isMobile ? '16px' : '32px',
      textAlign: 'center',
    },
    practiceCardsGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
      gap: isMobile ? '12px' : '24px',
      marginBottom: isMobile ? '20px' : '40px',
    },
    practiceCard: {
      borderRadius: isMobile ? '16px' : '20px',
      padding: isMobile ? '16px' : '28px',
      position: 'relative' as const,
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      color: 'white',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
      gap: isMobile ? '8px' : '16px',
    },
    statCard: {
      background: 'white',
      borderRadius: isMobile ? '8px' : '12px',
      padding: isMobile ? '12px' : '20px',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      transition: 'all 0.2s ease',
    },
    sectionContainer: {
      background: 'white',
      borderRadius: isMobile ? '12px' : '16px',
      padding: isMobile ? '16px' : '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      marginBottom: isMobile ? '16px' : '24px',
    }
  }

  return (
    <div style={styles.pageContainer}>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .practice-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .quick-link:hover {
          background: #f3f4f6;
          transform: translateX(4px);
        }
      `}</style>

      <main style={styles.mainContent}>
        {/* ヘッダーセクション */}
        <div style={styles.headerSection}>
          <div style={{
            display: 'inline-flex',
            padding: isMobile ? '10px' : '14px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: '12px',
            marginBottom: isMobile ? '12px' : '20px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
          }}>
            <Brain size={isMobile ? 24 : 32} color="white" />
          </div>
          
          <h1 style={{
            fontSize: isMobile ? '24px' : '36px',
            fontWeight: 'bold',
            marginBottom: isMobile ? '8px' : '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            二次試験対策
          </h1>
          
          <p style={{
            fontSize: isMobile ? '14px' : '18px',
            color: '#6b7280',
            lineHeight: 1.6,
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            面接と小論文で差をつけよう。
            {!isMobile && <br />}
            AIによる評価とフィードバックで、効率的に実力を向上させることができます。
          </p>
        </div>
        
        {/* 練習カード */}
        <div style={styles.practiceCardsGrid}>
          {/* 面接対策カード */}
          <div 
            className="practice-card"
            style={{
              ...styles.practiceCard,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
            onClick={() => router.push('/interview')}
          >
            <div style={{
              position: 'absolute',
              top: '-30%',
              right: '-10%',
              width: isMobile ? '120px' : '200px',
              height: isMobile ? '120px' : '200px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: isMobile ? '16px' : '24px',
              }}>
                <div>
                  <div style={{
                    fontSize: isMobile ? '10px' : '12px',
                    fontWeight: '500',
                    opacity: 0.9,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '4px',
                  }}>
                    インタラクティブ練習
                  </div>
                  <h2 style={{
                    fontSize: isMobile ? '20px' : '28px',
                    fontWeight: '700',
                  }}>
                    面接対策
                  </h2>
                </div>
                <div style={{
                  padding: isMobile ? '10px' : '14px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                }}>
                  <Mic size={isMobile ? 20 : 24} />
                </div>
              </div>
              
              <p style={{
                fontSize: isMobile ? '13px' : '16px',
                marginBottom: isMobile ? '16px' : '24px',
                opacity: 0.9,
                lineHeight: 1.6,
              }}>
                本番さながらの面接練習で、自信を持って臨めるようになります
              </p>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '8px' : '12px',
                marginBottom: isMobile ? '16px' : '24px',
              }}>
                <FeatureItem icon={Target} text="カラオケ式ペース練習" isMobile={isMobile} />
                <FeatureItem icon={Clock} text="音声録音・文字起こし" isMobile={isMobile} />
                <FeatureItem icon={BarChart3} text="AI評価・フィードバック" isMobile={isMobile} />
              </div>
              
              <button style={{
                width: '100%',
                padding: isMobile ? '12px' : '16px',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: isMobile ? '10px' : '12px',
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}>
                練習を始める
                <ChevronRight size={isMobile ? 16 : 18} />
              </button>
            </div>
          </div>

          {/* 小論文対策カード */}
          <div 
            className="practice-card"
            style={{
              ...styles.practiceCard,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            }}
            onClick={() => router.push('/essay')}
          >
            <div style={{
              position: 'absolute',
              top: '-30%',
              right: '-10%',
              width: isMobile ? '120px' : '200px',
              height: isMobile ? '120px' : '200px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: isMobile ? '16px' : '24px',
              }}>
                <div>
                  <div style={{
                    fontSize: isMobile ? '10px' : '12px',
                    fontWeight: '500',
                    opacity: 0.9,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '4px',
                  }}>
                    論理的思考力強化
                  </div>
                  <h2 style={{
                    fontSize: isMobile ? '20px' : '28px',
                    fontWeight: '700',
                  }}>
                    小論文対策
                  </h2>
                </div>
                <div style={{
                  padding: isMobile ? '10px' : '14px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                }}>
                  <PenTool size={isMobile ? 20 : 24} />
                </div>
              </div>
              
              <p style={{
                fontSize: isMobile ? '13px' : '16px',
                marginBottom: isMobile ? '16px' : '24px',
                opacity: 0.9,
                lineHeight: 1.6,
              }}>
                論理的思考力と文章力を鍛えて、説得力のある小論文を書けるようになります
              </p>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: isMobile ? '8px' : '12px',
                marginBottom: isMobile ? '16px' : '24px',
              }}>
                <FeatureItem icon={Target} text="学部別テーマ練習" isMobile={isMobile} />
                <FeatureItem icon={Clock} text="リアルタイム文字数カウント" isMobile={isMobile} />
                <FeatureItem icon={BarChart3} text="構成・内容・表現の評価" isMobile={isMobile} />
              </div>
              
              <button style={{
                width: '100%',
                padding: isMobile ? '12px' : '16px',
                background: 'white',
                color: '#f093fb',
                border: 'none',
                borderRadius: isMobile ? '10px' : '12px',
                fontSize: isMobile ? '14px' : '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}>
                練習を始める
                <ChevronRight size={isMobile ? 16 : 18} />
              </button>
            </div>
          </div>
        </div>

        {/* 練習実績セクション */}
        <div style={styles.sectionContainer}>
          <h2 style={{
            fontSize: isMobile ? '16px' : '20px',
            fontWeight: '600',
            marginBottom: isMobile ? '12px' : '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Award size={isMobile ? 18 : 22} color="#6366f1" />
            練習実績
          </h2>
          
          <div style={styles.statsGrid}>
            <div className="stat-card" style={styles.statCard}>
              <div style={{
                fontSize: isMobile ? '24px' : '32px',
                fontWeight: '700',
                color: '#667eea',
                marginBottom: '4px',
              }}>0</div>
              <div style={{ fontSize: isMobile ? '11px' : '14px', color: '#6b7280' }}>
                面接練習回数
              </div>
            </div>
            
            <div className="stat-card" style={styles.statCard}>
              <div style={{
                fontSize: isMobile ? '24px' : '32px',
                fontWeight: '700',
                color: '#f093fb',
                marginBottom: '4px',
              }}>0</div>
              <div style={{ fontSize: isMobile ? '11px' : '14px', color: '#6b7280' }}>
                小論文作成数
              </div>
            </div>
            
            <div className="stat-card" style={styles.statCard}>
              <div style={{
                fontSize: isMobile ? '24px' : '32px',
                fontWeight: '700',
                color: '#10b981',
                marginBottom: '4px',
              }}>--</div>
              <div style={{ fontSize: isMobile ? '11px' : '14px', color: '#6b7280' }}>
                平均評価スコア
              </div>
            </div>
            
            <div className="stat-card" style={styles.statCard}>
              <div style={{
                fontSize: isMobile ? '24px' : '32px',
                fontWeight: '700',
                color: '#f59e0b',
                marginBottom: '4px',
              }}>0</div>
              <div style={{ fontSize: isMobile ? '11px' : '14px', color: '#6b7280' }}>
                連続練習日数
              </div>
            </div>
          </div>
        </div>

        {/* アドバイスセクション */}
        <div style={{
          ...styles.sectionContainer,
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          textAlign: 'center',
        }}>
          <h3 style={{
            fontSize: isMobile ? '16px' : '20px',
            fontWeight: '600',
            marginBottom: isMobile ? '8px' : '12px',
          }}>
            💡 二次試験対策のポイント
          </h3>
          <p style={{
            fontSize: isMobile ? '13px' : '16px',
            lineHeight: 1.6,
            opacity: 0.9,
            maxWidth: '800px',
            margin: '0 auto',
          }}>
            面接と小論文は、練習量が結果に直結します。
            {!isMobile && <br />}
            毎日少しずつでも練習を重ねることで、確実に実力が向上します。
            {!isMobile && <br />}
            AIのフィードバックを参考に、弱点を克服していきましょう。
          </p>
        </div>

        {/* クイックリンクセクション */}
        {!isMobile && (
          <div style={styles.sectionContainer}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <BookOpen size={22} color="#6366f1" />
              関連リンク
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <QuickLink
                icon={Calendar}
                title="スケジュール管理"
                description="学習計画を立てて効率的に対策"
                onClick={() => router.push('/schedule')}
              />
              <QuickLink
                icon={TrendingUp}
                title="学習分析"
                description="あなたの成長を可視化"
                onClick={() => router.push('/analytics')}
              />
              <QuickLink
                icon={FileText}
                title="過去問演習"
                description="実践的な問題に挑戦"
                onClick={() => router.push('/problems')}
              />
              <QuickLink
                icon={Brain}
                title="共通テスト対策"
                description="基礎力を固める"
                onClick={() => router.push('/problems')}
              />
            </div>
          </div>
        )}

        {/* 戻るボタン */}
        <div style={{ textAlign: 'center', marginTop: isMobile ? '24px' : '40px' }}>
          <button
            onClick={() => router.push('/problems')}
            style={{
              padding: isMobile ? '12px 20px' : '16px 32px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: isMobile ? '12px' : '16px',
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.3)';
            }}
          >
            共通テスト対策に戻る →
          </button>
        </div>
      </main>
    </div>
  )
}

// フィーチャーアイテムコンポーネント
function FeatureItem({ icon: Icon, text, isMobile }: { icon: any, text: string, isMobile: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: isMobile ? '8px' : '12px',
      color: 'white',
      fontSize: isMobile ? '12px' : '14px',
    }}>
      <Icon size={isMobile ? 14 : 18} style={{ opacity: 0.8 }} />
      <span>{text}</span>
    </div>
  )
}

// クイックリンクコンポーネント（デスクトップのみ）
function QuickLink({ icon: Icon, title, description, onClick }: { 
  icon: any, 
  title: string, 
  description: string, 
  onClick: () => void 
}) {
  return (
    <div
      className="quick-link"
      onClick={onClick}
      style={{
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div style={{
        padding: '10px',
        background: '#f3f4f6',
        borderRadius: '8px',
        color: '#6366f1',
      }}>
        <Icon size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px' }}>{title}</h3>
        <p style={{ fontSize: '12px', color: '#6b7280' }}>{description}</p>
      </div>
      <ChevronRight size={16} color="#9ca3af" />
    </div>
  )
}