'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { format, subMonths } from 'date-fns'
import { ja } from 'date-fns/locale'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertCircle,
  Trophy,
  BookOpen,
  Brain,
  ChevronRight,
  Minus,
  RefreshCw
} from 'lucide-react'
import { getMockExamResults, saveMockExamGoals, getMockExamGoals } from '@/lib/firebase/firestore'
import { Timestamp } from 'firebase/firestore'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts'

// ブラウザ互換性のためのポリフィル
if (typeof window !== 'undefined' && !Object.entries) {
  Object.entries = function(obj: any) {
    return Object.keys(obj).map(key => [key, obj[key]])
  }
}

// モバイル最適化スタイル定義
const styles = {
  container: {
    padding: '12px',
    maxWidth: '370px',
    margin: '0 auto',
    backgroundColor: '#f8f9fa',
    minHeight: '100vh',
    paddingBottom: '80px'
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px'
  },
  loadingText: {
    color: '#636e72',
    fontSize: '12px'
  },
  grid: {
    display: 'grid',
    gap: '8px',
    marginBottom: '12px'
  },
  gridCols2: {
    gridTemplateColumns: 'repeat(2, 1fr)'
  },
  gridCols1: {
    gridTemplateColumns: '1fr'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflow: 'hidden'
  },
  cardHeader: {
    padding: '10px 12px',
    borderBottom: '1px solid #e9ecef'
  },
  cardHeaderFlex: {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0',
    paddingBottom: '0'
  },
  cardTitle: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#636e72'
  },
  cardTitleLarge: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: '2px'
  },
  cardDescription: {
    fontSize: '10px',
    color: '#636e72'
  },
  cardContent: {
    padding: '12px'
  },
  cardContentSmall: {
    padding: '10px 12px'
  },
  metricValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#2d3436'
  },
  metricSubtext: {
    fontSize: '9px',
    color: '#636e72',
    marginTop: '2px'
  },
  trendUp: {
    color: '#27ae60'
  },
  trendDown: {
    color: '#e74c3c'
  },
  trendNeutral: {
    color: '#636e72'
  },
  alert: {
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: '#f0f4ff',
    border: '1px solid #6c5ce7',
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    fontSize: '11px'
  },
  alertIcon: {
    flexShrink: 0
  },
  alertText: {
    fontSize: '11px',
    color: '#2d3436'
  },
  formGroup: {
    marginBottom: '12px'
  },
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '500',
    marginBottom: '4px',
    color: '#2d3436'
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #e9ecef',
    fontSize: '12px',
    outline: 'none',
    transition: 'all 0.2s ease',
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const,
    boxSizing: 'border-box' as const
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    width: '100%',
    padding: '8px 12px',
    backgroundColor: '#6c5ce7',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    WebkitTapHighlightColor: 'transparent'
  },
  progressBar: {
    position: 'relative' as const,
    width: '100%',
    height: '6px',
    backgroundColor: '#e9ecef',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6c5ce7',
    transition: 'width 0.3s ease'
  },
  progressMarker: {
    position: 'absolute' as const,
    top: 0,
    height: '6px',
    width: '2px',
    backgroundColor: '#6c5ce7'
  },
  badge: {
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: '600'
  },
  badgeSuccess: {
    backgroundColor: '#d4f4dd',
    color: '#27ae60'
  },
  badgeError: {
    backgroundColor: '#ffeaea',
    color: '#e74c3c'
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  listItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '6px',
    marginBottom: '6px',
    fontSize: '11px',
    color: '#2d3436'
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#2d3436'
  },
  subjectItem: {
    marginBottom: '12px'
  },
  subjectHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    flexWrap: 'wrap' as const,
    gap: '6px'
  },
  subjectName: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  subjectScore: {
    fontSize: '11px',
    color: '#636e72'
  },
  subjectDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: '#636e72',
    marginTop: '4px',
    flexWrap: 'wrap' as const,
    gap: '6px'
  },
  chartContainer: {
    width: '100%',
    height: '180px'
  }
}

// 型定義
interface MockExamResult {
  id?: string
  examDate: Timestamp
  examProvider: string
  examName: string
  examType: 'comprehensive' | 'subject_specific'
  totalScore: number
  totalMaxScore: number
  deviation: number
  nationalRank: number
  totalParticipants: number
  subjectResults: SubjectResult[]
  universityAssessments?: UniversityAssessment[]
}

interface SubjectResult {
  subject: string
  score: number
  maxScore: number
  deviation: number
  rank?: number
}

interface UniversityAssessment {
  universityName: string
  department: string
  assessment: 'A' | 'B' | 'C' | 'D' | 'E'
  probability: number
}

interface TargetGoal {
  deviation: number
  universityName: string
  department: string
}

const SUBJECT_LABELS: Record<string, string> = {
  japanese: '国語',
  math: '数学',
  english: '英語',
  physics: '物理',
  chemistry: '化学',
  biology: '生物',
  earth_science: '地学',
  japanese_history: '日本史',
  world_history: '世界史',
  geography: '地理',
  civics: '公民'
}

const COLORS = {
  primary: '#6c5ce7',
  secondary: '#a29bfe',
  warning: '#f39c12',
  danger: '#e74c3c',
  info: '#3498db'
}

// 入力値のサニタイズ
const sanitizeInput = (value: string): string => {
  return value.replace(/[<>\"\']/g, '').trim().slice(0, 100)
}

// 数値のバリデーション
const validateNumber = (value: number, min: number, max: number): number => {
  const num = Number(value)
  if (isNaN(num)) return min
  return Math.max(min, Math.min(max, num))
}

export default function MockExamDashboard() {
  const [examResults, setExamResults] = useState<MockExamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [targetGoal, setTargetGoal] = useState<TargetGoal>({
    deviation: 65,
    universityName: '',
    department: ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState(0)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true)
        fetchExamResults()
        loadTargetGoal()
      } else {
        setIsAuthenticated(false)
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const fetchExamResults = async () => {
    try {
      setLoading(true)
      const results = await getMockExamResults()
      // 最新20件のみ表示（パフォーマンス対策）
      setExamResults(results.slice(0, 20))
    } catch (error) {
      console.error('データの取得に失敗しました', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTargetGoal = async () => {
    try {
      const firebaseGoals = await getMockExamGoals()
      if (firebaseGoals) {
        setTargetGoal({
          deviation: validateNumber(firebaseGoals.deviation, 0, 100),
          universityName: sanitizeInput(firebaseGoals.universityName || ''),
          department: sanitizeInput(firebaseGoals.department || '')
        })
      }
    } catch (error) {
      console.error('目標の読み込みに失敗しました:', error)
    }
  }

  const saveTargetGoal = useCallback(async () => {
    // レート制限
    const now = Date.now()
    if (now - lastSaveTime < 2000) {
      alert('しばらく待ってから保存してください')
      return
    }
    
    setIsSaving(true)
    setLastSaveTime(now)
    
    try {
      const sanitizedGoal = {
        deviation: validateNumber(targetGoal.deviation, 0, 100),
        universityName: sanitizeInput(targetGoal.universityName),
        department: sanitizeInput(targetGoal.department)
      }
      
      await saveMockExamGoals(sanitizedGoal)
      alert('目標を保存しました')
    } catch (error) {
      console.error('目標の保存に失敗しました:', error)
      alert('目標の保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }, [targetGoal, lastSaveTime])

  // メモ化された計算
  const latestExam = useMemo(() => examResults[0], [examResults])
  const previousExam = useMemo(() => examResults[1], [examResults])

  const calculateStats = useCallback(() => {
    if (examResults.length === 0) return null

    const deviations = examResults.map(e => e.deviation)
    const average = deviations.reduce((a, b) => a + b, 0) / deviations.length
    const max = Math.max(...deviations)
    const min = Math.min(...deviations)

    const threeMonthsAgo = subMonths(new Date(), 3)
    const recentResults = examResults.filter(e => 
      e.examDate.toDate() >= threeMonthsAgo
    )
    
    const recentAverage = recentResults.length > 0
      ? recentResults.reduce((a, b) => a + b.deviation, 0) / recentResults.length
      : average

    return { average, max, min, recentAverage }
  }, [examResults])

  const stats = useMemo(() => calculateStats(), [calculateStats])

  const prepareTrendData = useCallback(() => {
    return examResults
      .slice(0, 10)
      .reverse()
      .map(exam => ({
        date: format(exam.examDate.toDate(), 'MM/dd'),
        deviation: exam.deviation,
        target: targetGoal.deviation
      }))
  }, [examResults, targetGoal.deviation])

  const analyzeSubjectStrengths = useCallback(() => {
    if (!latestExam) return []

    const subjects = latestExam.subjectResults.map(s => ({
      ...s,
      label: SUBJECT_LABELS[s.subject] || s.subject,
      strength: s.deviation - latestExam.deviation
    }))

    return subjects.sort((a, b) => b.strength - a.strength)
  }, [latestExam])

  const calculateGrowthRate = useCallback(() => {
    if (examResults.length < 2) return null

    const oldestDeviation = examResults[examResults.length - 1].deviation
    const latestDeviation = examResults[0].deviation
    const growth = ((latestDeviation - oldestDeviation) / oldestDeviation) * 100

    return growth
  }, [examResults])

  const predictGoalAchievement = useCallback(() => {
    if (examResults.length < 3 || !targetGoal.deviation) return null

    const recentGrowths = []
    for (let i = 0; i < Math.min(3, examResults.length - 1); i++) {
      const growth = examResults[i].deviation - examResults[i + 1].deviation
      recentGrowths.push(growth)
    }
    
    const avgGrowth = recentGrowths.reduce((a, b) => a + b, 0) / recentGrowths.length
    const currentDeviation = latestExam.deviation
    const remainingGap = targetGoal.deviation - currentDeviation

    if (avgGrowth <= 0) return null

    const examsNeeded = Math.ceil(remainingGap / avgGrowth)
    return examsNeeded
  }, [examResults, targetGoal.deviation, latestExam])

  if (!isAuthenticated) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingText}>ログインが必要です</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingText}>データを読み込んでいます...</div>
      </div>
    )
  }

  if (!latestExam) {
    return (
      <div style={styles.container}>
        <div style={styles.alert}>
          <AlertCircle size={16} color="#6c5ce7" style={styles.alertIcon} />
          <div style={styles.alertText}>
            まだ模試結果が登録されていません。模試結果を入力してください。
          </div>
        </div>
      </div>
    )
  }

  const subjectStrengths = useMemo(() => analyzeSubjectStrengths(), [analyzeSubjectStrengths])
  const growthRate = useMemo(() => calculateGrowthRate(), [calculateGrowthRate])
  const examsToGoal = useMemo(() => predictGoalAchievement(), [predictGoalAchievement])
  const trendData = useMemo(() => prepareTrendData(), [prepareTrendData])

  return (
    <div style={styles.container}>
      {/* サマリーカード */}
      <div style={{ ...styles.grid, ...styles.gridCols2 }}>
        {/* 最新偏差値 */}
        <div style={styles.card}>
          <div style={{ ...styles.cardHeader, ...styles.cardHeaderFlex }}>
            <div style={styles.cardTitle}>最新偏差値</div>
            {previousExam && (
              <div>
                {latestExam.deviation > previousExam.deviation ? (
                  <TrendingUp size={12} style={styles.trendUp} />
                ) : latestExam.deviation < previousExam.deviation ? (
                  <TrendingDown size={12} style={styles.trendDown} />
                ) : (
                  <Minus size={12} style={styles.trendNeutral} />
                )}
              </div>
            )}
          </div>
          <div style={styles.cardContentSmall}>
            <div style={styles.metricValue}>{latestExam.deviation}</div>
            {previousExam && (
              <p style={{
                ...styles.metricSubtext,
                ...(latestExam.deviation > previousExam.deviation ? styles.trendUp : 
                    latestExam.deviation < previousExam.deviation ? styles.trendDown : 
                    styles.trendNeutral)
              }}>
                前回比 {latestExam.deviation > previousExam.deviation && '+'}
                {(latestExam.deviation - previousExam.deviation).toFixed(1)}
              </p>
            )}
          </div>
        </div>

        {/* 平均偏差値 */}
        <div style={styles.card}>
          <div style={{ ...styles.cardHeader, ...styles.cardHeaderFlex }}>
            <div style={styles.cardTitle}>平均偏差値</div>
            <Brain size={12} color="#636e72" />
          </div>
          <div style={styles.cardContentSmall}>
            <div style={styles.metricValue}>{stats?.average.toFixed(1)}</div>
            <p style={styles.metricSubtext}>
              3ヶ月: {stats?.recentAverage.toFixed(1)}
            </p>
          </div>
        </div>

        {/* 全国順位 */}
        <div style={styles.card}>
          <div style={{ ...styles.cardHeader, ...styles.cardHeaderFlex }}>
            <div style={styles.cardTitle}>全国順位</div>
            <Trophy size={12} color="#636e72" />
          </div>
          <div style={styles.cardContentSmall}>
            <div style={styles.metricValue}>
              {latestExam.nationalRank.toLocaleString()}
            </div>
            <p style={styles.metricSubtext}>
              上位 {((latestExam.totalParticipants - latestExam.nationalRank + 1) / latestExam.totalParticipants * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* 成長率 */}
        <div style={styles.card}>
          <div style={{ ...styles.cardHeader, ...styles.cardHeaderFlex }}>
            <div style={styles.cardTitle}>成長率</div>
            <BookOpen size={12} color="#636e72" />
          </div>
          <div style={styles.cardContentSmall}>
            <div style={styles.metricValue}>
              {growthRate !== null ? (
                <>
                  {growthRate > 0 && '+'}
                  {growthRate.toFixed(1)}%
                </>
              ) : (
                '-'
              )}
            </div>
            <p style={styles.metricSubtext}>
              初回からの変化
            </p>
          </div>
        </div>
      </div>

      {/* 偏差値トレンド */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitleLarge}>偏差値トレンド</h3>
          <p style={styles.cardDescription}>
            過去10回分の推移
          </p>
        </div>
        <div style={styles.cardContent}>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorDeviation" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={9} />
                <YAxis domain={[40, 80]} fontSize={9} />
                <Tooltip 
                  contentStyle={{
                    fontSize: '10px',
                    padding: '4px 8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="deviation"
                  stroke={COLORS.primary}
                  fillOpacity={1}
                  fill="url(#colorDeviation)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke={COLORS.danger}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 目標設定 */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitleLarge}>目標設定</h3>
          <p style={styles.cardDescription}>
            目標偏差値と志望校を設定
          </p>
        </div>
        <div style={styles.cardContent}>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="target-deviation">
              目標偏差値
            </label>
            <input
              id="target-deviation"
              type="number"
              style={styles.input}
              value={targetGoal.deviation}
              onChange={(e) => setTargetGoal({
                ...targetGoal,
                deviation: validateNumber(Number(e.target.value), 0, 100)
              })}
              min="0"
              max="100"
            />
          </div>
          
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="target-university">
              志望大学
            </label>
            <input
              id="target-university"
              type="text"
              style={styles.input}
              value={targetGoal.universityName}
              onChange={(e) => setTargetGoal({
                ...targetGoal,
                universityName: sanitizeInput(e.target.value)
              })}
              placeholder="例: 東京大学"
              maxLength={50}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="target-department">
              志望学部
            </label>
            <input
              id="target-department"
              type="text"
              style={styles.input}
              value={targetGoal.department}
              onChange={(e) => setTargetGoal({
                ...targetGoal,
                department: sanitizeInput(e.target.value)
              })}
              placeholder="例: 理科一類"
              maxLength={50}
            />
          </div>

          <button
            style={styles.button}
            onClick={saveTargetGoal}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} />
                保存中...
              </>
            ) : (
              <>
                <Target size={12} />
                目標を保存
              </>
            )}
          </button>

          {examsToGoal !== null && targetGoal.deviation > latestExam.deviation && (
            <div style={{ ...styles.alert, marginTop: '12px' }}>
              <AlertCircle size={12} color="#6c5ce7" style={styles.alertIcon} />
              <div style={styles.alertText}>
                現在のペースでは、あと約{examsToGoal}回の模試で目標偏差値に到達する見込みです。
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 科目別強弱分析 */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitleLarge}>科目別強弱分析</h3>
          <p style={styles.cardDescription}>
            最新模試での科目別偏差値
          </p>
        </div>
        <div style={styles.cardContent}>
          <div>
            {subjectStrengths.map((subject) => {
              const isStrong = subject.strength > 2
              const isWeak = subject.strength < -2
              
              return (
                <div key={subject.subject} style={styles.subjectItem}>
                  <div style={styles.subjectHeader}>
                    <div style={styles.subjectName}>
                      <span style={{ fontWeight: '500', fontSize: '11px' }}>{subject.label}</span>
                      {isStrong && (
                        <span style={{ ...styles.badge, ...styles.badgeSuccess }}>
                          得意
                        </span>
                      )}
                      {isWeak && (
                        <span style={{ ...styles.badge, ...styles.badgeError }}>
                          苦手
                        </span>
                      )}
                    </div>
                    <span style={styles.subjectScore}>
                      偏差値 {subject.deviation}
                    </span>
                  </div>
                  <div style={styles.progressBar}>
                    <div 
                      style={{
                        ...styles.progressFill,
                        width: `${Math.min(100, (subject.deviation / 80) * 100)}%`
                      }}
                    />
                    <div 
                      style={{
                        ...styles.progressMarker,
                        left: `${Math.min(100, (latestExam.deviation / 80) * 100)}%`
                      }}
                    />
                  </div>
                  <div style={styles.subjectDetails}>
                    <span>
                      総合との差: {subject.strength > 0 && '+'}{subject.strength.toFixed(1)}
                    </span>
                    <span>
                      得点率: {((subject.score / subject.maxScore) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 次回模試での目標 */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitleLarge}>次回模試での目標</h3>
          <p style={styles.cardDescription}>
            現在の成績から算出した推奨目標
          </p>
        </div>
        <div style={styles.cardContent}>
          {targetGoal.deviation > latestExam.deviation && (
            <div style={{ ...styles.alert, marginBottom: '12px' }}>
              <Target size={12} color="#6c5ce7" style={styles.alertIcon} />
              <div style={styles.alertText}>
                目標偏差値まであと{' '}
                <span style={{ fontWeight: '700' }}>
                  {(targetGoal.deviation - latestExam.deviation).toFixed(1)}
                </span>{' '}
                ポイントです。
              </div>
            </div>
          )}

          <div>
            <h4 style={styles.sectionTitle}>総合目標</h4>
            <ul style={styles.list}>
              <li style={styles.listItem}>
                <ChevronRight size={12} color="#636e72" style={{ flexShrink: 0 }} />
                <span>
                  偏差値{' '}
                  <span style={{ fontWeight: '600' }}>
                    {Math.min(latestExam.deviation + 2, targetGoal.deviation).toFixed(1)}
                  </span>{' '}
                  を目指す
                </span>
              </li>
              <li style={styles.listItem}>
                <ChevronRight size={12} color="#636e72" style={{ flexShrink: 0 }} />
                <span>
                  得点率を{' '}
                  <span style={{ fontWeight: '600' }}>
                    {Math.min(
                      ((latestExam.totalScore / latestExam.totalMaxScore) * 100) + 5,
                      95
                    ).toFixed(0)}%
                  </span>{' '}
                  まで上げる
                </span>
              </li>
            </ul>
          </div>

          <div style={{ marginTop: '12px' }}>
            <h4 style={styles.sectionTitle}>科目別重点項目</h4>
            <ul style={styles.list}>
              {subjectStrengths
                .filter(s => s.strength < -2)
                .slice(0, 3)
                .map((subject) => (
                  <li key={subject.subject} style={styles.listItem}>
                    <ChevronRight size={12} color="#636e72" style={{ flexShrink: 0 }} />
                    <span>
                      {subject.label}の偏差値を{' '}
                      <span style={{ fontWeight: '600' }}>
                        {(subject.deviation + 3).toFixed(0)}
                      </span>{' '}
                      まで改善
                    </span>
                  </li>
                ))}
              {subjectStrengths.filter(s => s.strength < -2).length === 0 && (
                <li style={styles.listItem}>
                  <ChevronRight size={12} color="#636e72" style={{ flexShrink: 0 }} />
                  <span>全科目バランスよく得点率を向上</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}