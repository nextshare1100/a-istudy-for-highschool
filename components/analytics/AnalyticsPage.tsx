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
  Activity
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Legend
} from 'recharts'

type DateRange = 'today' | 'week' | 'month' | 'year'

interface AnalyticsPageProps {
  userId?: string
  timerSessions?: any[]
  quizResults?: any[]
  mockExamResults?: any[]
  userProfile?: any
  onDateRangeChange?: (range: DateRange) => void
}

const COLORS = ['#667eea', '#f093fb', '#4facfe', '#fa709a', '#fee140', '#30cfd0']
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

// 日付ヘルパー関数
const subDays = (date: Date, days: number) => {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d
}

// モックデータ生成
const generateMockData = () => {
  const now = new Date()
  const mockTimerSessions = []
  const mockQuizResults = []
  
  // 過去30日分のデータを生成
  for (let i = 0; i < 30; i++) {
    const date = subDays(now, i)
    const sessionsPerDay = Math.floor(Math.random() * 3) + 1
    
    for (let j = 0; j < sessionsPerDay; j++) {
      const startTime = new Date(date)
      startTime.setHours(Math.floor(Math.random() * 12) + 8)
      const elapsedSeconds = Math.floor(Math.random() * 3600) + 1800
      const endTime = new Date(startTime.getTime() + elapsedSeconds * 1000)
      
      mockTimerSessions.push({
        id: `session-${i}-${j}`,
        subjectId: ['数学', '英語', '物理', '化学', '国語'][Math.floor(Math.random() * 5)],
        unitId: ['基礎', '応用', '演習'][Math.floor(Math.random() * 3)],
        startTime,
        endTime,
        elapsedSeconds,
        focusScore: Math.floor(Math.random() * 30) + 70
      })
      
      const problemsPerSession = Math.floor(Math.random() * 10) + 5
      for (let k = 0; k < problemsPerSession; k++) {
        mockQuizResults.push({
          id: `quiz-${i}-${j}-${k}`,
          subject: mockTimerSessions[mockTimerSessions.length - 1].subjectId,
          unit: mockTimerSessions[mockTimerSessions.length - 1].unitId,
          isCorrect: Math.random() > 0.3,
          timeSpent: Math.floor(Math.random() * 300) + 60,
          createdAt: new Date(startTime.getTime() + Math.random() * elapsedSeconds * 1000)
        })
      }
    }
  }
  
  const mockExamResults = []
  for (let i = 0; i < 5; i++) {
    mockExamResults.push({
      id: `exam-${i}`,
      examDate: subDays(now, i * 30),
      deviation: 50 + i * 2 + Math.random() * 5,
      subjectResults: [
        { subject: '英語', deviation: 50 + i * 2 + Math.random() * 10 },
        { subject: '数学', deviation: 48 + i * 2 + Math.random() * 10 },
        { subject: '物理', deviation: 52 + i * 2 + Math.random() * 10 },
        { subject: '化学', deviation: 51 + i * 2 + Math.random() * 10 },
        { subject: '国語', deviation: 49 + i * 2 + Math.random() * 10 }
      ]
    })
  }
  
  return { mockTimerSessions, mockQuizResults, mockExamResults }
}

export default function AnalyticsPage(props: AnalyticsPageProps) {
  const [dateRange, setDateRange] = useState<DateRange>('week')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSubject, setSelectedSubject] = useState('')
  
  // モックデータを使用
  const mockData = generateMockData()
  const timerSessions = props.timerSessions || mockData.mockTimerSessions
  const quizResults = props.quizResults || mockData.mockQuizResults
  const mockExamResults = props.mockExamResults || mockData.mockExamResults
  const userProfile = props.userProfile || { studyStats: { currentStreak: 12 } }
  
  const [stats, setStats] = useState({
    todayStudyTime: 0,
    targetAchievement: 0,
    weeklyTrend: [],
    recentExamScore: null,
    topWeaknesses: [],
    studyStreak: 0,
    subjectStats: []
  })

  useEffect(() => {
    setLoading(true)
    
    const now = new Date()
    let startDate = new Date()
    
    switch (dateRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
    }

    const filteredSessions = timerSessions.filter(s => s.startTime >= startDate)
    const filteredQuizResults = quizResults.filter(q => q.createdAt >= startDate)

    // 統計計算
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todaySessions = filteredSessions.filter(s => s.startTime >= today && s.endTime)
    const todayStudyTime = todaySessions.reduce((sum, s) => sum + s.elapsedSeconds, 0) / 60

    const targetAchievement = (todayStudyTime / 360) * 100

    // 週間トレンド
    const weeklyTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i)
      const dayStr = WEEKDAYS[date.getDay()]
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      
      const daySessions = filteredSessions.filter(s => {
        return s.startTime >= dayStart && s.startTime <= dayEnd && s.endTime
      })
      
      const hours = daySessions.reduce((sum, s) => sum + s.elapsedSeconds, 0) / 3600
      weeklyTrend.push({ date: dayStr, hours: Number(hours.toFixed(1)) })
    }

    // 弱点分析
    const unitStats = {}
    filteredQuizResults.forEach(result => {
      const key = `${result.subject}_${result.unit}`
      if (!unitStats[key]) {
        unitStats[key] = { correct: 0, total: 0 }
      }
      unitStats[key].total++
      if (result.isCorrect) {
        unitStats[key].correct++
      }
    })
    
    const topWeaknesses = Object.entries(unitStats)
      .map(([key, stats]) => {
        const [subject, unit] = key.split('_')
        const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
        return { subject, unit, accuracy }
      })
      .filter(w => w.accuracy < 70)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5)

    // 科目別統計
    const subjectStatsMap = {}
    filteredSessions.forEach(session => {
      if (!session.endTime) return
      const subject = session.subjectId
      if (!subjectStatsMap[subject]) {
        subjectStatsMap[subject] = {
          subject,
          totalTime: 0,
          totalProblems: 0,
          correctProblems: 0,
          accuracy: 0,
          units: {}
        }
      }
      subjectStatsMap[subject].totalTime += session.elapsedSeconds
    })
    
    filteredQuizResults.forEach(result => {
      const subject = result.subject
      if (!subjectStatsMap[subject]) {
        subjectStatsMap[subject] = {
          subject,
          totalTime: 0,
          totalProblems: 0,
          correctProblems: 0,
          accuracy: 0,
          units: {}
        }
      }
      subjectStatsMap[subject].totalProblems++
      if (result.isCorrect) {
        subjectStatsMap[subject].correctProblems++
      }
    })
    
    Object.values(subjectStatsMap).forEach(stat => {
      stat.accuracy = stat.totalProblems > 0 
        ? (stat.correctProblems / stat.totalProblems) * 100 
        : 0
    })

    setStats({
      todayStudyTime,
      targetAchievement,
      weeklyTrend,
      recentExamScore: mockExamResults[0]?.deviation || null,
      topWeaknesses,
      studyStreak: userProfile?.studyStats?.currentStreak || 0,
      subjectStats: Object.values(subjectStatsMap)
    })

    if (props.onDateRangeChange) {
      props.onDateRangeChange(dateRange)
    }
    
    setTimeout(() => setLoading(false), 500)
  }, [dateRange])

  const renderMetricCard = (title, value, icon, gradient, trend, subtitle, progress) => {
    const Icon = icon
    return (
      <div style={{
        background: gradient,
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '200px',
          height: '200px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%'
        }} />
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: '12px',
              fontWeight: '500',
              color: 'rgba(255, 255, 255, 0.9)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px'
            }}>
              {title}
            </p>
            <p style={{
              fontSize: '32px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '4px'
            }}>
              {value}
            </p>
            {subtitle && (
              <p style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)'
              }}>
                {subtitle}
              </p>
            )}
            {trend !== undefined && (
              <p style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginTop: '4px'
              }}>
                {trend > 0 ? <ArrowUp size={16} /> : trend < 0 ? <ArrowDown size={16} /> : <Minus size={16} />}
                {Math.abs(trend)}%
              </p>
            )}
            {progress !== undefined && (
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                overflow: 'hidden',
                marginTop: '12px'
              }}>
                <div style={{
                  width: `${Math.min(progress, 100)}%`,
                  height: '100%',
                  backgroundColor: 'white',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            )}
          </div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            padding: '12px',
            borderRadius: '50%'
          }}>
            <Icon size={24} color="white" />
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <Loader2 size={48} style={{ animation: 'spin 1s linear infinite', color: '#6c5ce7' }} />
          <p style={{ color: '#636e72' }}>データを読み込んでいます...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: '概要', icon: BarChart3 },
    { id: 'weakness', label: '弱点分析', icon: AlertCircle },
    { id: 'efficiency', label: '学習効率', icon: Zap },
    { id: 'prediction', label: '成績予測', icon: TrendingUp },
    { id: 'comparison', label: '比較分析', icon: Brain }
  ]

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '24px'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          marginBottom: '4px',
          color: '#2d3436'
        }}>
          学習分析ダッシュボード
        </h1>
        <p style={{
          fontSize: '14px',
          color: '#636e72'
        }}>
          あなたの学習状況を詳しく分析します
        </p>
      </div>

      {/* Date Range Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '32px'
      }}>
        {[
          { value: 'today', label: '今日' },
          { value: 'week', label: '今週' },
          { value: 'month', label: '今月' },
          { value: 'year', label: '今年' }
        ].map(option => (
          <button
            key={option.value}
            onClick={() => setDateRange(option.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: dateRange === option.value ? '#6c5ce7' : 'white',
              color: dateRange === option.value ? 'white' : '#636e72',
              boxShadow: dateRange === option.value 
                ? '0 4px 12px rgba(108, 92, 231, 0.3)' 
                : '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        marginBottom: '24px',
        display: 'flex',
        gap: '4px'
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: activeTab === tab.id ? '#f0f4ff' : 'transparent',
                color: activeTab === tab.id ? '#6c5ce7' : '#636e72'
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Metric Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {renderMetricCard(
              '本日の学習時間',
              `${Math.floor(stats.todayStudyTime / 60)}時間${Math.round(stats.todayStudyTime % 60)}分`,
              Clock,
              'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            )}
            {renderMetricCard(
              '目標達成率',
              `${Math.round(stats.targetAchievement)}%`,
              Target,
              'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              undefined,
              '1日6時間目標',
              stats.targetAchievement
            )}
            {renderMetricCard(
              '連続学習日数',
              `${stats.studyStreak}日`,
              Calendar,
              'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              undefined,
              '素晴らしい継続です！'
            )}
            {renderMetricCard(
              '直近の模試偏差値',
              stats.recentExamScore ? stats.recentExamScore.toFixed(1) : '-',
              TrendingUp,
              'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
            )}
          </div>

          {/* Charts Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '24px'
          }}>
            {/* Weekly Study Trend */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}>
                <BarChart3 size={20} color="#6c5ce7" />
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2d3436'
                }}>
                  週間学習時間推移
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={stats.weeklyTrend}>
                  <defs>
                    <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                  <XAxis dataKey="date" stroke="#636e72" />
                  <YAxis stroke="#636e72" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="#6c5ce7" 
                    fillOpacity={1} 
                    fill="url(#colorStudy)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Top Weaknesses */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}>
                <AlertCircle size={20} color="#e74c3c" />
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2d3436'
                }}>
                  弱点トップ5
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {stats.topWeaknesses.length > 0 ? (
                  stats.topWeaknesses.map((weakness, index) => (
                    <div key={index} style={{
                      padding: '16px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e9ecef'
                      e.currentTarget.style.transform = 'translateX(4px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <div>
                          <span style={{
                            fontWeight: '600',
                            fontSize: '16px',
                            color: '#2d3436'
                          }}>
                            {weakness.subject}
                          </span>
                          <span style={{
                            marginLeft: '8px',
                            fontSize: '14px',
                            color: '#636e72'
                          }}>
                            {weakness.unit}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: weakness.accuracy < 50 ? '#e74c3c' :
                                weakness.accuracy < 70 ? '#f39c12' : '#27ae60'
                        }}>
                          {Math.round(weakness.accuracy)}%
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${weakness.accuracy}%`,
                          height: '100%',
                          backgroundColor: weakness.accuracy < 50 ? '#e74c3c' :
                                         weakness.accuracy < 70 ? '#f39c12' : '#27ae60',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#636e72'
                  }}>
                    <p>データが不足しています</p>
                    <p style={{ fontSize: '14px', marginTop: '8px' }}>
                      問題演習を行うと弱点が表示されます
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weakness Analysis Tab */}
      {activeTab === 'weakness' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {mockExamResults.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#2d3436',
                marginBottom: '24px'
              }}>
                科目別パフォーマンス
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={mockExamResults[0].subjectResults.map(r => ({
                  name: r.subject,
                  score: r.deviation,
                  average: 50
                }))}>
                  <PolarGrid stroke="#e9ecef" />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar 
                    name="あなたのスコア" 
                    dataKey="score" 
                    stroke="#6c5ce7" 
                    fill="#6c5ce7" 
                    fillOpacity={0.6} 
                  />
                  <Radar 
                    name="平均スコア" 
                    dataKey="average" 
                    stroke="#e74c3c" 
                    fill="#e74c3c" 
                    fillOpacity={0.3} 
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#2d3436',
              marginBottom: '24px'
            }}>
              単元別詳細分析
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '12px',
              marginBottom: '24px'
            }}>
              {stats.subjectStats.map(stat => (
                <button
                  key={stat.subject}
                  onClick={() => setSelectedSubject(stat.subject)}
                  style={{
                    padding: '12px',
                    backgroundColor: selectedSubject === stat.subject ? '#6c5ce7' : '#f8f9fa',
                    color: selectedSubject === stat.subject ? 'white' : '#2d3436',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {stat.subject}
                </button>
              ))}
            </div>

            {selectedSubject && (
              <div style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <h4 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#2d3436',
                  marginBottom: '16px'
                }}>
                  {selectedSubject}の分析
                </h4>
                <p style={{
                  fontSize: '14px',
                  color: '#636e72'
                }}>
                  詳細な単元別分析データを表示
                </p>
              </div>
            )}

            {!selectedSubject && (
              <div style={{
                textAlign: 'center',
                padding: '60px',
                color: '#636e72'
              }}>
                <AlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                  上の科目ボタンをタップして分析を開始
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Efficiency Analysis Tab */}
      {activeTab === 'efficiency' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#2d3436',
              marginBottom: '24px'
            }}>
              時間帯別学習効率
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={(() => {
                // 時間帯別に実データを集計
                const hourlyData = {}
                for (let hour = 0; hour < 24; hour++) {
                  hourlyData[hour] = { totalEfficiency: 0, totalMinutes: 0, count: 0 }
                }
                
                // セッションデータから時間帯別に集計
                timerSessions.forEach(session => {
                  if (session.startTime && session.endTime) {
                    const hour = new Date(session.startTime).getHours()
                    const minutes = session.elapsedSeconds / 60
                    hourlyData[hour].totalMinutes += minutes
                    hourlyData[hour].totalEfficiency += session.focusScore || 75
                    hourlyData[hour].count++
                  }
                })
                
                // 表示用データを生成（データがある時間帯のみ）
                const chartData = []
                for (let hour = 6; hour <= 23; hour++) {
                  if (hourlyData[hour].count > 0) {
                    chartData.push({
                      time: `${hour}時`,
                      efficiency: Math.round(hourlyData[hour].totalEfficiency / hourlyData[hour].count),
                      studyMinutes: Math.round(hourlyData[hour].totalMinutes)
                    })
                  }
                }
                
                // データがない場合はメッセージ用の空配列を返す
                return chartData.length > 0 ? chartData : []
              })()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" orientation="left" stroke="#6c5ce7" />
                <YAxis yAxisId="right" orientation="right" stroke="#f093fb" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px'
                  }}
                />
                <Bar yAxisId="left" dataKey="studyMinutes" fill="#6c5ce7" opacity={0.3} />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#f093fb" 
                  strokeWidth={3}
                  dot={{ fill: '#f093fb' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
            {/* データがない場合のメッセージ */}
            {timerSessions.filter(s => s.endTime).length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#636e72'
              }}>
                <p>学習データがありません</p>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>
                  タイマーを使用して学習を記録すると、時間帯別の効率が表示されます
                </p>
              </div>
            )}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              textAlign: 'center'
            }}>
              <Activity size={32} color="#6c5ce7" style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', color: '#636e72', marginBottom: '4px' }}>
                平均集中時間
              </p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#2d3436' }}>
                {(() => {
                  const completedSessions = timerSessions.filter(s => s.endTime)
                  if (completedSessions.length === 0) return '-'
                  const avgSeconds = completedSessions.reduce((sum, s) => sum + s.elapsedSeconds, 0) / completedSessions.length
                  return `${Math.round(avgSeconds / 60)}分`
                })()}
              </p>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              textAlign: 'center'
            }}>
              <Brain size={32} color="#f093fb" style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', color: '#636e72', marginBottom: '4px' }}>
                平均フォーカススコア
              </p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#2d3436' }}>
                {(() => {
                  const sessionsWithScore = timerSessions.filter(s => s.focusScore)
                  if (sessionsWithScore.length === 0) return '-'
                  const avgScore = sessionsWithScore.reduce((sum, s) => sum + s.focusScore, 0) / sessionsWithScore.length
                  return Math.round(avgScore)
                })()}
              </p>
            </div>

            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              textAlign: 'center'
            }}>
              <Clock size={32} color="#4facfe" style={{ marginBottom: '12px' }} />
              <p style={{ fontSize: '14px', color: '#636e72', marginBottom: '4px' }}>
                総学習セッション
              </p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#2d3436' }}>
                {timerSessions.filter(s => s.endTime).length}回
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Performance Prediction Tab */}
      {activeTab === 'prediction' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {mockExamResults.length > 0 ? (
            <>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#2d3436',
                  marginBottom: '24px'
                }}>
                  偏差値予測
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { month: '現在', actual: 58, predicted: 58 },
                    { month: '1ヶ月後', actual: null, predicted: 60 },
                    { month: '2ヶ月後', actual: null, predicted: 62 },
                    { month: '3ヶ月後', actual: null, predicted: 64 },
                    { month: '4ヶ月後', actual: null, predicted: 65 },
                    { month: '5ヶ月後', actual: null, predicted: 66 },
                    { month: '6ヶ月後', actual: null, predicted: 68 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[40, 80]} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#6c5ce7" 
                      strokeWidth={3}
                      dot={{ fill: '#6c5ce7', r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="#f093fb" 
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ fill: '#f093fb', r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{
                backgroundColor: 'white',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#2d3436',
                  marginBottom: '24px'
                }}>
                  成績向上要因
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: '学習時間', value: 35 },
                        { name: '学習効率', value: 25 },
                        { name: '弱点克服', value: 40 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[0, 1, 2].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '60px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              textAlign: 'center'
            }}>
              <TrendingUp size={48} color="#6c5ce7" style={{ marginBottom: '16px', opacity: 0.5 }} />
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#2d3436',
                marginBottom: '8px'
              }}>
                模試結果を登録してください
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#636e72'
              }}>
                模試結果を登録すると、成績予測が表示されます
              </p>
            </div>
          )}
        </div>
      )}

      {/* Comparison Analysis Tab */}
      {activeTab === 'comparison' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{
            backgroundColor: '#f0f4ff',
            borderRadius: '16px',
            padding: '24px',
            border: '2px solid #6c5ce7',
            textAlign: 'center'
          }}>
            <Brain size={48} color="#6c5ce7" style={{ marginBottom: '16px' }} />
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#2d3436',
              marginBottom: '8px'
            }}>
              比較分析機能は準備中です
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#636e72'
            }}>
              他の受験生との比較や目標大学との差分分析機能を開発中です
            </p>
          </div>
        </div>
      )}
    </div>
  )
}