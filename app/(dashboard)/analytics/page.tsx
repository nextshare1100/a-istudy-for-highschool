'use client'

import { useState, useEffect } from 'react'
import { 
  Calendar, 
  TrendingUp, 
  Clock, 
  Target,
  AlertCircle,
  BarChart3,
  Brain,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
  Loader2,
  Activity,
  Plus,
  Info,
  ChevronRight,
  BookOpen,
  Trophy,
  Filter,
  User,
  CheckCircle,
  PieChart,
  Settings,
  Search,
  Grid3X3,
  Type,
  MessageSquare,
  Calculator,
  Circle,
  Menu,
  X
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ComposedChart,
  Legend
} from 'recharts'

// ブレークポイント定義
const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024
}

// レスポンシブ対応スタイルオブジェクト
const styles = {
  pageContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #dbeafe 100%)',
    position: 'relative' as const,
    paddingBottom: '60px',
  },
  header: {
    background: 'white',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky' as const,
    top: 0,
    zIndex: 40,
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '16px 24px',
    '@media (max-width: 640px)': {
      padding: '12px 16px',
    }
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  headerIcon: {
    padding: '10px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    borderRadius: '12px',
    color: 'white',
    boxShadow: '0 2px 6px rgba(99, 102, 241, 0.3)',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    '@media (max-width: 640px)': {
      fontSize: '20px',
    }
  },
  subtitle: {
    color: '#6b7280',
    marginTop: '4px',
    fontSize: '14px',
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #9333ea 0%, #6366f1 100%)',
    color: 'white',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 6px rgba(147, 51, 234, 0.3)',
    '@media (max-width: 640px)': {
      padding: '8px 16px',
      fontSize: '13px',
    }
  },
  secondaryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 20px',
    background: 'white',
    color: '#374151',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '14px',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  tabButton: {
    base: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '10px 24px',
      borderRadius: '10px',
      fontWeight: '600',
      fontSize: '14px',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      border: '1px solid transparent',
      position: 'relative' as const,
      whiteSpace: 'nowrap' as const,
      '@media (max-width: 640px)': {
        padding: '8px 12px',
        fontSize: '13px',
        gap: '4px',
      }
    },
    inactive: {
      background: 'white',
      color: '#6b7280',
      border: '1px solid #e5e7eb',
    },
    active: {
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      color: 'white',
      boxShadow: '0 2px 6px rgba(99, 102, 241, 0.4)',
      transform: 'scale(1.05)',
    }
  },
  dateRangeButton: {
    base: {
      padding: '8px 16px',
      borderRadius: '10px',
      fontWeight: '600',
      fontSize: '13px',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      border: '1px solid transparent',
      '@media (max-width: 640px)': {
        padding: '6px 12px',
        fontSize: '12px',
      }
    },
    inactive: {
      background: 'white',
      color: '#6b7280',
      border: '1px solid #e5e7eb',
    },
    active: {
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      color: 'white',
      boxShadow: '0 2px 6px rgba(99, 102, 241, 0.4)',
    }
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    '@media (max-width: 640px)': {
      padding: '16px',
    }
  },
  mainCard: {
    background: 'linear-gradient(135deg, #ffffff 95%, #f9fafb 100%)',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.1)',
    padding: '24px',
    position: 'relative' as const,
    overflow: 'hidden',
    '@media (max-width: 640px)': {
      padding: '16px',
      borderRadius: '12px',
    }
  },
  metricCard: {
    base: {
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      padding: '20px',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative' as const,
      overflow: 'hidden',
      '@media (max-width: 640px)': {
        padding: '16px',
        borderRadius: '12px',
      }
    },
    hover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
      borderColor: '#c7d2fe',
    },
    gradients: {
      purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      pink: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      blue: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      orange: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      green: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      indigo: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      gray: 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)',
    }
  },
  weaknessCard: {
    base: {
      padding: '16px',
      borderRadius: '12px',
      background: '#f9fafb',
      border: '1px solid #e5e7eb',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '@media (max-width: 640px)': {
        padding: '12px',
      }
    },
    hover: {
      background: '#f3f4f6',
      transform: 'translateX(2px)',
    }
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center' as const,
    '@media (max-width: 640px)': {
      padding: '32px 16px',
    }
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '500',
    '@media (max-width: 640px)': {
      padding: '3px 10px',
      fontSize: '11px',
    }
  },
  levelCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    marginBottom: '16px',
    '@media (max-width: 640px)': {
      padding: '12px',
    }
  },
  chartCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e5e7eb',
    '@media (max-width: 640px)': {
      padding: '16px',
      borderRadius: '12px',
    }
  },
  infoBox: {
    padding: '12px',
    borderRadius: '10px',
    background: '#dbeafe',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    '@media (max-width: 640px)': {
      padding: '10px',
      fontSize: '13px',
    }
  }
}

// カラーパレット
const COLORS = ['#6366f1', '#f472b6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

// データ品質バッジの設定
const DATA_QUALITY_CONFIG = {
  high: { bg: '#d1fae5', color: '#064e3b', label: '高信頼度' },
  medium: { bg: '#fef3c7', color: '#92400e', label: '中信頼度' },
  low: { bg: '#fee2e2', color: '#991b1b', label: '低信頼度' },
  sufficient: { bg: '#d1fae5', color: '#064e3b', label: '十分なデータ' },
  partial: { bg: '#fef3c7', color: '#92400e', label: '部分的データ' },
  insufficient: { bg: '#fee2e2', color: '#991b1b', label: 'データ不足' }
}

// ダミーデータ生成（データなし状態）
const generateDummyData = () => {
  return {
    studyTimeStats: {
      hasData: false,
      todayTime: 0,
      weeklyTotal: 0,
      weeklyTrend: [],
      subjectDistribution: []
    },
    weaknessData: [],
    efficiencyData: {
      dataQuality: 'insufficient',
      hourlyFocus: [],
      pomodoroComparison: {
        userAvgFocus: 0,
        pomodoroAvgFocus: 85,
        recommendation: 'データが蓄積されると分析結果が表示されます'
      },
      breakPatterns: {
        avgBreakInterval: 0,
        currentPattern: 'データ不足',
        optimalBreakDuration: 25
      },
      subjectEfficiency: [],
      weeklyPatterns: []
    },
    predictionData: {
      currentScore: null,
      predictedScore: null,
      confidenceInterval: [0, 0],
      reliability: 'low',
      requiredStudyHours: 0,
      historicalData: [],
      scenarioAnalysis: [],
      subjectPredictions: []
    }
  }
}

// カスタムフック: 画面サイズ検出
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  })

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    ...windowSize,
    isMobile: windowSize.width < BREAKPOINTS.mobile,
    isTablet: windowSize.width >= BREAKPOINTS.mobile && windowSize.width < BREAKPOINTS.tablet,
    isDesktop: windowSize.width >= BREAKPOINTS.desktop,
  }
}

export default function ImprovedAnalyticsPage() {
  const { isMobile, isTablet, isDesktop } = useWindowSize()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Simple navigation function for demo purposes
  const navigate = (path: string) => {
    console.log(`Navigating to: ${path}`)
    window.location.hash = path
  }
  
  const [dateRange, setDateRange] = useState('week')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [userLevel, setUserLevel] = useState('beginner')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    setTimeout(() => {
      setData(generateDummyData())
      setLoading(false)
    }, 1000)
  }, [dateRange])

  const tabs = [
    { id: 'overview', label: '概要', icon: BarChart3, color: 'blue' },
    { id: 'weakness', label: '弱点', icon: AlertCircle, color: 'red' },
    { id: 'efficiency', label: '効率', icon: Zap, color: 'yellow' },
    { id: 'prediction', label: '予測', icon: TrendingUp, color: 'green' }
  ]

  const dateRanges = [
    { value: 'today', label: '今日' },
    { value: 'week', label: '今週' },
    { value: 'month', label: '今月' },
    { value: 'year', label: '今年' }
  ]

  const renderDataQualityBadge = (quality: string) => {
    const config = DATA_QUALITY_CONFIG[quality as keyof typeof DATA_QUALITY_CONFIG] || DATA_QUALITY_CONFIG.low
    const badgeStyle = {
      ...styles.badge,
      background: config.bg,
      color: config.color,
    }
    
    if (isMobile) {
      badgeStyle.padding = '3px 10px'
      badgeStyle.fontSize = '11px'
    }
    
    return (
      <span style={badgeStyle}>
        <Info size={isMobile ? 12 : 14} />
        {config.label}
      </span>
    )
  }

  const renderEmptyState = (title: string, description: string, actionLabel?: string, actionPath?: string) => {
    const emptyStyle = { ...styles.emptyState }
    if (isMobile) {
      emptyStyle.padding = '32px 16px'
    }
    
    return (
      <div style={emptyStyle}>
        <AlertCircle style={{ color: '#9ca3af', marginBottom: '16px' }} size={isMobile ? 40 : 48} />
        <h3 style={{ 
          fontSize: isMobile ? '18px' : '20px', 
          fontWeight: '600', 
          color: '#1f2937', 
          marginBottom: '8px' 
        }}>
          {title}
        </h3>
        <p style={{ 
          color: '#6b7280', 
          marginBottom: '24px', 
          maxWidth: '500px', 
          fontSize: isMobile ? '13px' : '14px' 
        }}>
          {description}
        </p>
        {actionLabel && actionPath && (
          <button
            onClick={() => navigate(actionPath)}
            style={{
              ...styles.primaryButton,
              padding: isMobile ? '8px 16px' : '10px 20px',
              fontSize: isMobile ? '13px' : '14px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(147, 51, 234, 0.3)';
            }}
          >
            {actionLabel}
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    )
  }

  const renderMetricCard = (
    title: string, 
    value: string, 
    icon: any, 
    gradient: string, 
    hasData: boolean = true, 
    subtitle: string | null = null, 
    progress: number | null = null
  ) => {
    const Icon = icon
    const cardStyle = {
      ...styles.metricCard.base,
      background: hasData ? gradient : styles.metricCard.gradients.gray,
    }
    
    if (isMobile) {
      cardStyle.padding = '16px'
      cardStyle.borderRadius = '12px'
    }
    
    return (
      <div 
        style={cardStyle}
        onMouseEnter={(e) => {
          if (hasData) {
            Object.assign(e.currentTarget.style, styles.metricCard.hover);
          }
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, cardStyle);
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: hasData ? 'rgba(255, 255, 255, 0.3)' : '#e5e7eb',
          borderRadius: '16px 16px 0 0',
        }} />
        
        <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '500',
              color: hasData ? 'rgba(255, 255, 255, 0.9)' : '#6b7280',
              marginBottom: '4px'
            }}>
              {title}
            </p>
            <p style={{
              fontSize: isMobile ? '20px' : '28px',
              fontWeight: 'bold',
              color: hasData ? 'white' : '#9ca3af'
            }}>
              {value}
            </p>
            {subtitle && (
              <p style={{
                fontSize: isMobile ? '11px' : '12px',
                color: hasData ? 'rgba(255, 255, 255, 0.8)' : '#6b7280',
                marginTop: '4px'
              }}>
                {subtitle}
              </p>
            )}
            {progress !== null && hasData && (
              <div style={{
                marginTop: '12px',
                height: '6px',
                borderRadius: '3px',
                background: 'rgba(255, 255, 255, 0.3)',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  background: 'white',
                  width: `${Math.min(progress, 100)}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            )}
          </div>
          <div style={{
            padding: isMobile ? '10px' : '12px',
            borderRadius: '10px',
            background: hasData ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb'
          }}>
            <Icon size={isMobile ? 20 : 24} style={{ color: hasData ? 'white' : '#9ca3af' }} />
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={styles.pageContainer}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={styles.pageContainer}>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @media (max-width: 640px) {
          .hide-mobile { display: none !important; }
        }
      `}</style>

      {/* ヘッダー */}
      <div style={styles.header}>
        <div style={{
          ...styles.headerContent,
          padding: isMobile ? '12px 16px' : '16px 24px',
        }}>
          {/* モバイル用ヘッダー */}
          {isMobile ? (
            <>
              {/* 上段: タイトルとメニューボタン */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    ...styles.headerIcon,
                    padding: '8px',
                  }}>
                    <BarChart3 size={20} />
                  </div>
                  <h1 style={{
                    ...styles.title,
                    fontSize: '20px',
                  }}>
                    学習分析
                  </h1>
                </div>
                
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  style={{
                    padding: '8px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>

              {/* モバイルメニュー */}
              {mobileMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  padding: '16px',
                  zIndex: 50,
                }}>
                  {/* ユーザーレベル */}
                  <div style={{
                    ...styles.levelCard,
                    marginBottom: '12px',
                    padding: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        padding: '6px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        borderRadius: '6px',
                        color: 'white',
                      }}>
                        <Activity size={16} />
                      </div>
                      <div>
                        <p style={{ fontSize: '11px', color: '#6b7280' }}>学習レベル</p>
                        <p style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                          {userLevel === 'advanced' ? '上級者' :
                           userLevel === 'intermediate' ? '中級者' : '初級者'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 模試追加ボタン */}
                  <button
                    style={{
                      ...styles.primaryButton,
                      width: '100%',
                      padding: '10px',
                      fontSize: '14px',
                      marginBottom: '12px',
                    }}
                    onClick={() => {
                      navigate('/analytics/mock-exam')
                      setMobileMenuOpen(false)
                    }}
                  >
                    <Plus size={16} />
                    模試追加
                  </button>

                  {/* タブ */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '12px'
                  }}>
                    {tabs.map(tab => {
                      const Icon = tab.icon
                      const isActive = activeTab === tab.id
                      
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id)
                            setMobileMenuOpen(false)
                          }}
                          style={{
                            ...styles.tabButton.base,
                            ...(isActive ? styles.tabButton.active : styles.tabButton.inactive),
                            padding: '8px 12px',
                            fontSize: '13px',
                          }}
                        >
                          <Icon size={14} />
                          <span>{tab.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* 期間選択 */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px'
                  }}>
                    {dateRanges.map(range => (
                      <button
                        key={range.value}
                        onClick={() => {
                          setDateRange(range.value)
                          setMobileMenuOpen(false)
                        }}
                        style={{
                          ...styles.dateRangeButton.base,
                          ...(dateRange === range.value ? styles.dateRangeButton.active : styles.dateRangeButton.inactive),
                          padding: '6px 12px',
                          fontSize: '12px',
                        }}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 下段: 現在のタブと期間 */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                fontSize: '13px',
                color: '#6b7280'
              }}>
                <span>{tabs.find(t => t.id === activeTab)?.label} • {dateRanges.find(r => r.value === dateRange)?.label}</span>
              </div>
            </>
          ) : (
            <>
              {/* デスクトップ版ヘッダー */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={styles.headerTitle}>
                  <div style={styles.headerIcon}>
                    <BarChart3 size={24} />
                  </div>
                  <div>
                    <h1 style={styles.title}>
                      学習分析
                    </h1>
                  </div>
                </div>
                
                <button
                  style={styles.primaryButton}
                  onClick={() => navigate('/analytics/mock-exam')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(147, 51, 234, 0.3)';
                  }}
                >
                  <Plus size={16} />
                  模試追加
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '16px', alignItems: 'center' }}>
                {/* ユーザーレベル */}
                <div style={{ ...styles.levelCard, marginBottom: 0, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        padding: '8px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        borderRadius: '8px',
                        color: 'white',
                      }}>
                        <Activity size={20} />
                      </div>
                      <div>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>学習レベル</p>
                        <p style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                          {userLevel === 'advanced' ? '上級者' :
                           userLevel === 'intermediate' ? '中級者' : '初級者'}
                        </p>
                      </div>
                    </div>
                    <Target size={20} style={{ color: '#6b7280' }} />
                  </div>
                </div>

                {/* 期間選択 */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {dateRanges.map(range => (
                    <button
                      key={range.value}
                      onClick={() => setDateRange(range.value)}
                      style={{
                        ...styles.dateRangeButton.base,
                        ...(dateRange === range.value ? styles.dateRangeButton.active : styles.dateRangeButton.inactive),
                      }}
                      onMouseEnter={(e) => {
                        if (dateRange !== range.value) {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (dateRange !== range.value) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>

                {/* タブ */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  {tabs.map(tab => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                          ...styles.tabButton.base,
                          ...(isActive ? styles.tabButton.active : styles.tabButton.inactive),
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }
                        }}
                      >
                        <Icon size={16} />
                        <span>{tab.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* メインコンテンツ */}
      <div style={{
        ...styles.mainContent,
        padding: isMobile ? '16px' : '24px',
      }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {/* メトリックカード */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 
                                   isTablet ? 'repeat(2, 1fr)' : 
                                   'repeat(auto-fit, minmax(280px, 1fr))',
              gap: isMobile ? '12px' : '16px',
              marginBottom: '24px'
            }}>
              {renderMetricCard(
                '本日の学習時間',
                data?.studyTimeStats?.hasData 
                  ? `${Math.floor((data?.studyTimeStats?.todayTime || 0) / 60)}時間${Math.round((data?.studyTimeStats?.todayTime || 0) % 60)}分`
                  : '記録なし',
                Clock,
                styles.metricCard.gradients.purple,
                data?.studyTimeStats?.hasData || false,
                data?.studyTimeStats?.hasData ? null : '学習開始',
                null
              )}
              {renderMetricCard(
                '目標達成率',
                data?.studyTimeStats?.hasData 
                  ? `${Math.round(((data?.studyTimeStats?.todayTime || 0) / 360) * 100)}%`
                  : '未計測',
                Target,
                styles.metricCard.gradients.pink,
                data?.studyTimeStats?.hasData || false,
                data?.studyTimeStats?.hasData ? '1日6時間' : '目標設定',
                data?.studyTimeStats?.hasData ? ((data?.studyTimeStats?.todayTime || 0) / 360) * 100 : 0
              )}
              {renderMetricCard(
                '連続日数',
                '0日',
                Calendar,
                styles.metricCard.gradients.blue,
                false,
                '継続開始',
                null
              )}
              {renderMetricCard(
                '模試偏差値',
                data?.predictionData?.currentScore ? data.predictionData.currentScore.toFixed(1) : '未登録',
                TrendingUp,
                styles.metricCard.gradients.orange,
                data?.predictionData?.reliability !== 'low',
                data?.predictionData?.currentScore ? null : '登録する',
                null
              )}
            </div>

            {/* チャートセクション */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))', 
              gap: '16px' 
            }}>
              {/* 週間学習時間推移 */}
              <div style={{
                ...styles.chartCard,
                padding: isMobile ? '16px' : '24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={isMobile ? 18 : 20} style={{ color: '#6366f1' }} />
                    <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', color: '#1f2937' }}>
                      週間学習時間
                    </h3>
                  </div>
                  {data?.studyTimeStats?.hasData && (
                    <span style={{ fontSize: isMobile ? '12px' : '14px', color: '#6b7280' }}>
                      計: {data.studyTimeStats.weeklyTotal.toFixed(1)}h
                    </span>
                  )}
                </div>
                
                {data?.studyTimeStats?.hasData ? (
                  <ResponsiveContainer width="100%" height={isMobile ? 200 : 300}>
                    <AreaChart data={data.studyTimeStats.weeklyTrend}>
                      <defs>
                        <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={isMobile ? 10 : 12} />
                      <YAxis stroke="#6b7280" fontSize={isMobile ? 10 : 12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: isMobile ? '11px' : '12px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="#6366f1" 
                        fillOpacity={1} 
                        fill="url(#colorStudy)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  renderEmptyState(
                    'まだデータがありません',
                    'アプリの利用を続けることで、学習データが蓄積され、詳細な分析が可能になります。',
                    'タイマーを開始',
                    '/timer'
                  )
                )}
              </div>

              {/* 弱点トップ5 */}
              <div style={{
                ...styles.chartCard,
                padding: isMobile ? '16px' : '24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={isMobile ? 18 : 20} style={{ color: '#ef4444' }} />
                    <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: '600', color: '#1f2937' }}>
                      弱点トップ5
                    </h3>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {data?.weaknessData?.length > 0 ? (
                    data.weaknessData.slice(0, 5).map((weakness: any, index: number) => (
                      <div 
                        key={index} 
                        style={{
                          ...styles.weaknessCard.base,
                          padding: isMobile ? '12px' : '16px',
                        }}
                        onMouseEnter={(e) => {
                          Object.assign(e.currentTarget.style, styles.weaknessCard.hover);
                        }}
                        onMouseLeave={(e) => {
                          Object.assign(e.currentTarget.style, {
                            ...styles.weaknessCard.base,
                            padding: isMobile ? '12px' : '16px',
                          });
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '600', color: '#1f2937' }}>
                              {weakness.subject}
                            </span>
                            <span style={{ fontSize: isMobile ? '11px' : '12px', color: '#6b7280' }}>
                              {weakness.unit}
                            </span>
                          </div>
                          <span style={{
                            fontSize: isMobile ? '13px' : '14px',
                            fontWeight: 'bold',
                            color: weakness.accuracy < 50 ? '#ef4444' :
                                   weakness.accuracy < 70 ? '#f59e0b' : '#10b981'
                          }}>
                            {Math.round(weakness.accuracy)}%
                          </span>
                        </div>
                        <div style={{
                          height: '6px',
                          borderRadius: '3px',
                          background: '#e5e7eb',
                          overflow: 'hidden'
                        }}>
                          <div 
                            style={{
                              height: '100%',
                              transition: 'width 0.3s ease',
                              background: weakness.accuracy < 50 ? '#ef4444' :
                                        weakness.accuracy < 70 ? '#f59e0b' : '#10b981',
                              width: `${weakness.accuracy}%`
                            }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    renderEmptyState(
                      'まだ分析データがありません',
                      'アプリの利用を続けて問題演習を行うことで、あなたの苦手分野が自動的に分析されます。',
                      '問題演習を開始',
                      '/problems'
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 弱点分析タブ */}
        {activeTab === 'weakness' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{
              ...styles.mainCard,
              padding: isMobile ? '16px' : '24px',
            }}>
              <h3 style={{ 
                fontSize: isMobile ? '18px' : '20px', 
                fontWeight: '600', 
                color: '#1f2937', 
                marginBottom: '16px' 
              }}>
                弱点分析結果
              </h3>
              
              {data?.weaknessData?.length > 0 ? (
                <>
                  <div style={{ 
                    display: 'flex', 
                    gap: '16px', 
                    color: '#6b7280', 
                    fontSize: isMobile ? '13px' : '14px', 
                    marginBottom: '24px' 
                  }}>
                    <span>検出: {data.weaknessData.length}件</span>
                    <span>•</span>
                    <span>期間: 30日間</span>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isMobile ? '1fr' : 
                                       isTablet ? 'repeat(2, 1fr)' : 
                                       'repeat(auto-fill, minmax(350px, 1fr))', 
                    gap: '16px' 
                  }}>
                    {data.weaknessData.map((weakness: any, index: number) => (
                      <div 
                        key={index}
                        style={{
                          borderRadius: '12px',
                          border: '1px solid #e5e7eb',
                          padding: isMobile ? '16px' : '20px',
                          transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#c7d2fe';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'start', 
                          justifyContent: 'space-between', 
                          marginBottom: '12px' 
                        }}>
                          <div>
                            <h4 style={{ 
                              fontSize: isMobile ? '15px' : '16px', 
                              fontWeight: '600', 
                              color: '#1f2937' 
                            }}>
                              {weakness.subject} - {weakness.unit}
                            </h4>
                            <p style={{ 
                              marginTop: '4px', 
                              fontSize: isMobile ? '12px' : '13px', 
                              color: '#6b7280' 
                            }}>
                              正答率: {Math.round(weakness.accuracy)}% | 
                              問題数: {weakness.totalQuestions}問
                            </p>
                          </div>
                          {renderDataQualityBadge(weakness.confidence)}
                        </div>
                        
                        <button
                          style={{
                            width: '100%',
                            padding: isMobile ? '8px 14px' : '10px 16px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            color: 'white',
                            borderRadius: '8px',
                            fontSize: isMobile ? '13px' : '14px',
                            fontWeight: '500',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onClick={() => navigate(`/problems?subject=${weakness.subject}&unit=${weakness.unit}`)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.02)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          この単元を学習
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                renderEmptyState(
                  'まだ分析データがありません',
                  'アプリの利用を続けることで、あなたの学習パターンや苦手分野が明確になり、効果的な学習プランを提案できるようになります。',
                  '問題演習を開始',
                  '/problems'
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}