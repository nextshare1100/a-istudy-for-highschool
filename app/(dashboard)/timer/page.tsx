'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Play, Pause, Square, Coffee, Clock, Target, TrendingUp, 
  Calendar, Award, BookOpen, BarChart3, ChevronRight, 
  Timer, Brain, Zap, Trophy, ArrowLeft, Plus, Filter,
  Download, RefreshCw, ChevronDown, Edit
} from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { StudyTimer } from '@/components/study/timer/study-timer'
import { TimerHistory } from '@/components/study/timer/timer-history'
import { useTimerStore } from '@/lib/stores/timer-store'
import { getRecentTimerSessions } from '@/lib/firebase/firestore'
import { auth } from '@/lib/firebase/config'

// 教科データ（2025年度共通テスト対応）
const subjects = [
  // 国語
  {
    id: 'japanese',
    name: '国語',
    units: [
      { id: 'modern_critical', name: '現代文（評論・論説）' },
      { id: 'modern_literary', name: '現代文（小説・随筆）' },
      { id: 'classical_prose', name: '古文（物語・随筆・日記）' },
      { id: 'classical_poetry', name: '古文（和歌・俳諧）' },
      { id: 'chinese_prose', name: '漢文（思想・史伝）' },
      { id: 'chinese_poetry', name: '漢文（詩）' }
    ]
  },
  
  // 地理歴史
  {
    id: 'geography_comprehensive',
    name: '地理総合',
    units: [
      { id: 'maps_gis', name: '地図とGIS' },
      { id: 'international_understanding', name: '国際理解と国際協力' },
      { id: 'disaster_prevention', name: '自然環境と防災' }
    ]
  },
  {
    id: 'geography_exploration',
    name: '地理探究',
    units: [
      { id: 'modern_world_systems', name: '現代世界の系統地理的考察' },
      { id: 'regional_characteristics', name: '現代世界の地誌的考察' },
      { id: 'contemporary_issues', name: '現代世界におけるこれからの日本の国土像' }
    ]
  },
  {
    id: 'history_comprehensive',
    name: '歴史総合',
    units: [
      { id: 'modern_transformation', name: '近代化と私たち' },
      { id: 'international_order', name: '国際秩序の変化や大衆化と私たち' },
      { id: 'globalization', name: 'グローバル化と私たち' }
    ]
  },
  {
    id: 'japanese_history_exploration',
    name: '日本史探究',
    units: [
      { id: 'ancient_medieval', name: '原始・古代の日本と東アジア' },
      { id: 'medieval_period', name: '中世の日本と世界' },
      { id: 'early_modern', name: '近世の日本と世界' },
      { id: 'modern_japan', name: '近現代の地域・日本と世界' }
    ]
  },
  {
    id: 'world_history_exploration',
    name: '世界史探究',
    units: [
      { id: 'ancient_civilizations', name: '世界史へのまなざし' },
      { id: 'regional_world_formation', name: '諸地域の歴史的特質の形成' },
      { id: 'regional_interaction', name: '諸地域の交流・再編' },
      { id: 'global_integration', name: '諸地域の結合・変容' },
      { id: 'contemporary_world', name: '地球世界の課題' }
    ]
  },
  
  // 公民
  {
    id: 'civics',
    name: '公共',
    units: [
      { id: 'public_space', name: '公共的な空間をつくる私たち' },
      { id: 'democratic_society', name: '公共的な空間における人間としてのあり方生き方' },
      { id: 'sustainable_society', name: '公共的な空間における基本的原理' }
    ]
  },
  {
    id: 'ethics',
    name: '倫理',
    units: [
      { id: 'human_existence', name: '現代に生きる自己の課題と人間としての在り方生き方' },
      { id: 'international_society', name: '国際社会に生きる日本人としての自覚' }
    ]
  },
  {
    id: 'politics_economics',
    name: '政治・経済',
    units: [
      { id: 'modern_democracy', name: '現代日本の政治' },
      { id: 'modern_economy', name: '現代日本の経済' },
      { id: 'international_politics_economy', name: '現代の国際政治・経済' }
    ]
  },
  
  // 数学
  {
    id: 'math1',
    name: '数学Ⅰ',
    units: [
      { id: 'numbers_expressions', name: '数と式' },
      { id: 'quadratic_functions', name: '2次関数' },
      { id: 'trigonometry', name: '図形と計量' },
      { id: 'data_analysis', name: 'データの分析' }
    ]
  },
  {
    id: 'math_a',
    name: '数学A',
    units: [
      { id: 'geometry', name: '図形の性質' },
      { id: 'counting_probability', name: '場合の数と確率' },
      { id: 'number_theory', name: '数学と人間の活動' }
    ]
  },
  {
    id: 'math2',
    name: '数学Ⅱ',
    units: [
      { id: 'expressions_proofs', name: '式と証明' },
      { id: 'complex_numbers', name: '複素数と方程式' },
      { id: 'figures_equations', name: '図形と方程式' },
      { id: 'trigonometric_functions', name: '三角関数' },
      { id: 'exponential_logarithm', name: '指数関数・対数関数' },
      { id: 'differentiation_integration', name: '微分・積分の考え' }
    ]
  },
  {
    id: 'math_b',
    name: '数学B',
    units: [
      { id: 'sequences', name: '数列' },
      { id: 'statistics', name: '統計的な推測' },
      { id: 'mathematical_structures', name: '数学と社会生活' }
    ]
  },
  {
    id: 'math_c',
    name: '数学C',
    units: [
      { id: 'vectors', name: 'ベクトル' },
      { id: 'plane_curves', name: '平面上の曲線と複素数平面' },
      { id: 'mathematical_exploration', name: '数学的な表現の工夫' }
    ]
  },
  {
    id: 'math3',
    name: '数学Ⅲ',
    units: [
      { id: 'limits', name: '極限' },
      { id: 'differential_calculus', name: '微分法' },
      { id: 'integral_calculus', name: '積分法' }
    ]
  },
  
  // 理科
  {
    id: 'physics_basic',
    name: '物理基礎',
    units: [
      { id: 'motion_force', name: '物体の運動とエネルギー' },
      { id: 'phenomena', name: '様々な物理現象とエネルギーの利用' }
    ]
  },
  {
    id: 'physics',
    name: '物理',
    units: [
      { id: 'mechanics', name: '様々な運動' },
      { id: 'waves', name: '波' },
      { id: 'electricity_magnetism', name: '電気と磁気' },
      { id: 'atoms', name: '原子' }
    ]
  },
  {
    id: 'chemistry_basic',
    name: '化学基礎',
    units: [
      { id: 'composition', name: '化学と物質' },
      { id: 'chemical_reactions', name: '物質の変化' }
    ]
  },
  {
    id: 'chemistry',
    name: '化学',
    units: [
      { id: 'states_of_matter', name: '物質の状態と平衡' },
      { id: 'chemical_changes', name: '物質の変化と平衡' },
      { id: 'inorganic', name: '無機物質の性質' },
      { id: 'organic', name: '有機化合物の性質' },
      { id: 'polymers', name: '化学が果たす役割' }
    ]
  },
  {
    id: 'biology_basic',
    name: '生物基礎',
    units: [
      { id: 'cells_energy', name: '生物の特徴' },
      { id: 'heredity', name: '遺伝子とその働き' },
      { id: 'human_body', name: '生物の体内環境の維持' },
      { id: 'ecosystem', name: '生物の多様性と生態系' }
    ]
  },
  {
    id: 'biology',
    name: '生物',
    units: [
      { id: 'life_phenomena', name: '生物と遺伝子' },
      { id: 'reproduction_development', name: '生殖と発生' },
      { id: 'environmental_response', name: '生物の環境応答' },
      { id: 'ecology_environment', name: '生態と環境' },
      { id: 'evolution_phylogeny', name: '生物の進化と系統' }
    ]
  },
  {
    id: 'earth_science_basic',
    name: '地学基礎',
    units: [
      { id: 'earth_in_universe', name: '宇宙における地球' },
      { id: 'changing_earth', name: '変動する地球' },
      { id: 'atmosphere_ocean', name: '大気と海洋' },
      { id: 'earth_environment', name: '地球の環境' }
    ]
  },
  {
    id: 'earth_science',
    name: '地学',
    units: [
      { id: 'earth_overview', name: '地球の概観' },
      { id: 'earth_activity_history', name: '地球の活動と歴史' },
      { id: 'earth_atmosphere_ocean', name: '地球の大気と海洋' },
      { id: 'universe_structure', name: '宇宙の構造' }
    ]
  },
  
  // 英語
  {
    id: 'english_reading',
    name: '英語リーディング',
    units: [
      { id: 'vocabulary_grammar', name: '語彙・文法' },
      { id: 'short_passages', name: '短文読解' },
      { id: 'long_passages', name: '長文読解' },
      { id: 'argumentative_texts', name: '論説文' },
      { id: 'narrative_texts', name: '物語文' },
      { id: 'visual_information', name: '図表読み取り' }
    ]
  },
  {
    id: 'english_listening',
    name: '英語リスニング',
    units: [
      { id: 'short_conversations', name: '短い対話' },
      { id: 'long_conversations', name: '長い対話' },
      { id: 'short_monologues', name: '短い説明文' },
      { id: 'long_monologues', name: '長い説明文' },
      { id: 'discussions', name: '討論' },
      { id: 'lectures', name: '講義' }
    ]
  },
  
  // 情報
  {
    id: 'information1',
    name: '情報Ⅰ',
    units: [
      { id: 'information_society', name: '情報社会の問題解決' },
      { id: 'communication_design', name: 'コミュニケーションと情報デザイン' },
      { id: 'computer_programming', name: 'コンピュータとプログラミング' },
      { id: 'network_data', name: '情報通信ネットワークとデータの活用' }
    ]
  }
];

export default function TimerPage() {
  const router = useRouter()
  const { activeTimer } = useTimerStore()
  const [activeTab, setActiveTab] = useState<'timer' | 'history'>('timer')
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalTime: 0,
    todayTime: 0,
    weekStreak: 0,
    averageFocus: 0,
    averageTime: 0
  })
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  // 連続日数計算
  const calculateStreak = (sessions: any[]) => {
    if (sessions.length === 0) return 0
    
    const dates = sessions.map(s => {
      const date = s.startTime.toDate()
      return format(date, 'yyyy-MM-dd')
    })
    const uniqueDates = Array.from(new Set(dates)).sort().reverse()
    
    let streak = 0
    const today = format(new Date(), 'yyyy-MM-dd')
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = format(
        new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        'yyyy-MM-dd'
      )
      if (uniqueDates[i] === expectedDate) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`
  }

  // 統計情報の取得
  useEffect(() => {
    const fetchStats = async () => {
      const user = auth.currentUser
      if (!user) return

      try {
        const sessions = await getRecentTimerSessions(user.uid, 30)
        
        // 統計計算
        const totalSessions = sessions.length
        const totalTime = sessions.reduce((acc, s) => acc + s.elapsedSeconds, 0)
        const avgTime = totalSessions > 0 ? totalTime / totalSessions : 0
        const avgFocus = totalSessions > 0
          ? sessions.reduce((acc, s) => acc + s.focusScore, 0) / totalSessions
          : 0
        
        // 今日の学習時間
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todaySessions = sessions.filter(s => 
          s.startTime.toDate() >= today
        )
        const todayTime = todaySessions.reduce((acc, s) => acc + s.elapsedSeconds, 0)
        
        // 連続学習日数（簡易版）
        const weekStreak = calculateStreak(sessions)
        
        setStats({
          totalSessions,
          totalTime,
          todayTime,
          weekStreak,
          averageFocus: Math.round(avgFocus),
          averageTime: Math.round(avgTime)
        })
        
        // 最近のセッション
        setRecentSessions(sessions.slice(0, 5))
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoadingStats(false)
      }
    }

    fetchStats()
  }, [])

  // モバイル最適化されたスタイル
  const styles = {
    wrapper: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      paddingTop: '60px', // ヘッダー分の余白
      paddingBottom: '80px', // フッター分の余白
    },
    container: {
      padding: '12px',
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '20px',
    },
    title: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '4px',
    },
    subtitle: {
      fontSize: '13px',
      color: '#6b7280',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
      marginBottom: '20px',
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      textAlign: 'center' as const,
    },
    statIcon: {
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '8px',
    },
    statValue: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '2px',
    },
    statLabel: {
      fontSize: '11px',
      color: '#6b7280',
    },
    quickActions: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '8px',
      marginBottom: '20px',
    },
    quickActionCard: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '12px 8px',
      textAlign: 'center' as const,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      border: '2px solid transparent',
    },
    quickActionIcon: {
      width: '28px',
      height: '28px',
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 6px',
      color: '#9333ea',
    },
    quickActionTitle: {
      fontSize: '11px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '2px',
    },
    quickActionDescription: {
      fontSize: '10px',
      color: '#6b7280',
    },
    tabNavigation: {
      display: 'flex',
      gap: '8px',
      marginBottom: '16px',
      backgroundColor: 'white',
      padding: '6px',
      borderRadius: '10px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    tabButton: {
      flex: 1,
      padding: '8px 16px',
      border: 'none',
      backgroundColor: 'transparent',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: '600',
      color: '#6b7280',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
    },
    tabButtonActive: {
      backgroundImage: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
      color: 'white',
    },
    contentArea: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      marginBottom: '20px',
    },
    recentSessions: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    recentSessionsHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },
    recentSessionsTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#1f2937',
    },
    viewAllButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      color: '#9333ea',
      fontSize: '12px',
      fontWeight: '500',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
    },
    sessionList: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
    },
    sessionItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    sessionIcon: {
      width: '36px',
      height: '36px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#9333ea',
      flexShrink: 0,
    },
    sessionContent: {
      flex: 1,
    },
    sessionSubject: {
      fontSize: '13px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '2px',
    },
    sessionMeta: {
      display: 'flex',
      gap: '12px',
      fontSize: '11px',
      color: '#6b7280',
    },
    sessionMetaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    sessionScore: {
      textAlign: 'right' as const,
    },
    sessionScoreValue: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#9333ea',
    },
    sessionScoreLabel: {
      fontSize: '10px',
      color: '#6b7280',
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '40px 20px',
      color: '#6b7280',
    },
    emptyStateIcon: {
      width: '60px',
      height: '60px',
      backgroundColor: '#f9fafb',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px',
      color: '#d1d5db',
    },
    emptyStateTitle: {
      fontSize: '14px',
      fontWeight: '600',
      marginBottom: '6px',
    },
    emptyStateDescription: {
      fontSize: '12px',
    },
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>学習タイマー</h1>
          <p style={styles.subtitle}>集中して学習を進めよう</p>
        </div>

        {/* クイックアクション */}
        {!activeTimer && (
          <div style={styles.quickActions}>
            <div style={styles.quickActionCard} onClick={() => setActiveTab('timer')}>
              <div style={styles.quickActionIcon}>
                <Play size={16} />
              </div>
              <h3 style={styles.quickActionTitle}>新しい学習</h3>
              <p style={styles.quickActionDescription}>開始する</p>
            </div>
            
            <div style={styles.quickActionCard} onClick={() => setActiveTab('timer')}>
              <div style={styles.quickActionIcon}>
                <Target size={16} />
              </div>
              <h3 style={styles.quickActionTitle}>ポモドーロ</h3>
              <p style={styles.quickActionDescription}>25分集中</p>
            </div>
            
            <div style={styles.quickActionCard} onClick={() => router.push('/analytics')}>
              <div style={styles.quickActionIcon}>
                <BarChart3 size={16} />
              </div>
              <h3 style={styles.quickActionTitle}>学習分析</h3>
              <p style={styles.quickActionDescription}>統計を確認</p>
            </div>
          </div>
        )}

        {/* タブナビゲーション */}
        <div style={styles.tabNavigation}>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === 'timer' ? styles.tabButtonActive : {})
            }}
            onClick={() => setActiveTab('timer')}
          >
            <Timer size={16} />
            タイマー
          </button>
          <button
            style={{
              ...styles.tabButton,
              ...(activeTab === 'history' ? styles.tabButtonActive : {})
            }}
            onClick={() => setActiveTab('history')}
          >
            <Clock size={16} />
            学習履歴
          </button>
        </div>

        {/* メインコンテンツ */}
        <div style={styles.contentArea}>
          {activeTab === 'timer' ? (
            <StudyTimer subjects={subjects} />
          ) : (
            <TimerHistory subjects={subjects} />
          )}
        </div>

        {/* 最近の学習セッション */}
        {activeTab === 'timer' && !activeTimer && (
          <div style={styles.recentSessions}>
            <div style={styles.recentSessionsHeader}>
              <h2 style={styles.recentSessionsTitle}>最近の学習</h2>
              <button style={styles.viewAllButton} onClick={() => setActiveTab('history')}>
                すべて見る
                <ChevronRight size={14} />
              </button>
            </div>
            
            {recentSessions.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyStateIcon}>
                  <Clock size={30} />
                </div>
                <h3 style={styles.emptyStateTitle}>学習履歴がありません</h3>
                <p style={styles.emptyStateDescription}>
                  タイマーを使って学習を記録しましょう
                </p>
              </div>
            ) : (
              <div style={styles.sessionList}>
                {recentSessions.map((session, index) => (
                  <div key={index} style={styles.sessionItem}>
                    <div style={styles.sessionIcon}>
                      <BookOpen size={18} />
                    </div>
                    <div style={styles.sessionContent}>
                      <h4 style={styles.sessionSubject}>
                        {subjects.find(s => s.id === session.subjectId)?.name || session.subjectId}
                      </h4>
                      <div style={styles.sessionMeta}>
                        <span style={styles.sessionMetaItem}>
                          <Calendar size={12} />
                          {format(session.startTime.toDate(), 'MM/dd')}
                        </span>
                        <span style={styles.sessionMetaItem}>
                          <Clock size={12} />
                          {formatDuration(session.elapsedSeconds)}
                        </span>
                      </div>
                    </div>
                    <div style={styles.sessionScore}>
                      <div style={styles.sessionScoreValue}>{session.focusScore}%</div>
                      <div style={styles.sessionScoreLabel}>集中度</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}