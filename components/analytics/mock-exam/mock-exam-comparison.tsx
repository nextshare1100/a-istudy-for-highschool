'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { 
  Download, 
  Plus, 
  X, 
  TrendingUp, 
  TrendingDown,
  Minus,
  FileImage,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { getMockExamResults } from '@/lib/firebase/firestore'
import { Timestamp } from 'firebase/firestore'
import {
  LineChart,
  Line,
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
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

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
  section: {
    marginBottom: '12px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflow: 'hidden'
  },
  cardHeader: {
    padding: '12px',
    borderBottom: '1px solid #e9ecef'
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: '2px'
  },
  cardDescription: {
    fontSize: '11px',
    color: '#636e72'
  },
  cardContent: {
    padding: '12px'
  },
  select: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #e9ecef',
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer',
    backgroundColor: 'white',
    boxSizing: 'border-box' as const
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: '500',
    gap: '4px',
    border: '1px solid',
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginRight: '6px',
    marginBottom: '6px'
  },
  badgeClose: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0,0,0,0.1)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '2px',
    transition: 'background-color 0.2s ease'
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    outline: 'none',
    width: '100%'
  },
  secondaryButton: {
    backgroundColor: 'white',
    color: '#2d3436',
    border: '1px solid #e9ecef'
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px'
  },
  tabs: {
    marginBottom: '12px'
  },
  tabList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '4px',
    backgroundColor: 'white',
    padding: '4px',
    borderRadius: '8px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    marginBottom: '12px'
  },
  tab: {
    padding: '6px 8px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#636e72',
    fontSize: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none'
  },
  tabActive: {
    backgroundColor: '#6c5ce7',
    color: 'white',
    boxShadow: '0 2px 6px rgba(108, 92, 231, 0.3)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '10px'
  },
  tableWrapper: {
    overflowX: 'auto' as const,
    marginBottom: '12px'
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e9ecef'
  },
  tableHeaderCell: {
    padding: '8px 6px',
    textAlign: 'center' as const,
    fontSize: '9px',
    fontWeight: '600',
    color: '#636e72',
    whiteSpace: 'nowrap' as const
  },
  tableRow: {
    borderBottom: '1px solid #e9ecef'
  },
  tableCell: {
    padding: '8px 6px',
    fontSize: '10px',
    color: '#2d3436',
    textAlign: 'center' as const
  },
  colorDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginRight: '4px'
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '32px',
    color: '#636e72',
    fontSize: '12px'
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
  tooltipContent: {
    backgroundColor: 'white',
    border: '1px solid #e9ecef',
    borderRadius: '6px',
    padding: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  subheader: {
    fontSize: '9px',
    color: '#636e72',
    fontWeight: '400',
    borderBottom: '1px solid #e9ecef'
  },
  chartContainer: {
    width: '100%',
    height: '200px'
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

// 定数
const PROVIDER_LABELS: Record<string, string> = {
  kawai: '河合塾',
  sundai: '駿台',
  toshin: '東進',
  benesse: 'ベネッセ',
  other: 'その他'
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

const COLORS = ['#6c5ce7', '#74b9ff', '#a29bfe', '#fd79a8', '#fdcb6e']

export default function MockExamComparison() {
  const [examResults, setExamResults] = useState<MockExamResult[]>([])
  const [selectedExams, setSelectedExams] = useState<MockExamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [exportLoading, setExportLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('deviation')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true)
        fetchExamResults()
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
      setExamResults(results)
    } catch (error) {
      console.error('データの取得に失敗しました', error)
    } finally {
      setLoading(false)
    }
  }

  // 模試を選択に追加
  const addExamToComparison = (examId: string) => {
    const exam = examResults.find(e => e.id === examId)
    if (exam && selectedExams.length < 3) {
      setSelectedExams([...selectedExams, exam])
    } else if (selectedExams.length >= 3) {
      alert('比較できる模試は最大3つまでです')
    }
  }

  // 模試を選択から削除
  const removeExamFromComparison = (examId: string) => {
    setSelectedExams(selectedExams.filter(exam => exam.id !== examId))
  }

  // 偏差値推移データの準備
  const prepareDeviationData = () => {
    const allSubjects = new Set<string>()
    selectedExams.forEach(exam => {
      exam.subjectResults.forEach(subject => {
        allSubjects.add(subject.subject)
      })
    })

    return Array.from(allSubjects).map(subject => {
      const data: any = { subject: SUBJECT_LABELS[subject] || subject }
      selectedExams.forEach((exam, index) => {
        const subjectResult = exam.subjectResults.find(s => s.subject === subject)
        data[`exam${index}`] = subjectResult?.deviation || 0
      })
      return data
    })
  }

  // レーダーチャートデータの準備
  const prepareRadarData = () => {
    const subjects = ['japanese', 'math', 'english']
    return subjects.map(subject => {
      const data: any = { subject: SUBJECT_LABELS[subject] }
      selectedExams.forEach((exam, index) => {
        const subjectResult = exam.subjectResults.find(s => s.subject === subject)
        data[`exam${index}`] = subjectResult?.deviation || 0
      })
      return data
    })
  }

  // 順位変動データの準備
  const prepareRankData = () => {
    return selectedExams
      .sort((a, b) => a.examDate.toDate().getTime() - b.examDate.toDate().getTime())
      .map(exam => ({
        date: format(exam.examDate.toDate(), 'MM/dd'),
        examName: exam.examName,
        rank: exam.nationalRank,
        participants: exam.totalParticipants,
        percentile: ((exam.totalParticipants - exam.nationalRank + 1) / exam.totalParticipants * 100).toFixed(1)
      }))
  }

  // PDFエクスポート
  const exportToPDF = async () => {
    setExportLoading(true)
    try {
      const element = document.getElementById('comparison-content')
      if (!element) return

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 190
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
      pdf.save(`模試比較_${format(new Date(), 'yyyyMMdd')}.pdf`)

      alert('PDFファイルを保存しました')
    } catch (error) {
      alert('PDFの生成に失敗しました')
    } finally {
      setExportLoading(false)
    }
  }

  // 画像エクスポート
  const exportToImage = async () => {
    setExportLoading(true)
    try {
      const element = document.getElementById('comparison-content')
      if (!element) return

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true
      })

      const link = document.createElement('a')
      link.download = `模試比較_${format(new Date(), 'yyyyMMdd')}.png`
      link.href = canvas.toDataURL()
      link.click()

      alert('画像ファイルを保存しました')
    } catch (error) {
      alert('画像の生成に失敗しました')
    } finally {
      setExportLoading(false)
    }
  }

  // 差分計算
  const calculateDifference = (current: number, previous: number) => {
    const diff = current - previous
    if (diff > 0) return { value: `+${diff.toFixed(1)}`, trend: 'up' }
    if (diff < 0) return { value: diff.toFixed(1), trend: 'down' }
    return { value: '±0', trend: 'neutral' }
  }

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

  return (
    <div style={styles.container}>
      {/* 模試選択セクション */}
      <div style={{ ...styles.card, ...styles.section }}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>比較する模試を選択</h2>
          <p style={styles.cardDescription}>
            最大3つまでの模試結果を比較できます
          </p>
        </div>
        <div style={styles.cardContent}>
          <div style={{ marginBottom: '12px' }}>
            <select
              style={styles.select}
              onChange={(e) => {
                if (e.target.value) {
                  addExamToComparison(e.target.value)
                  e.target.value = ''
                }
              }}
              value=""
            >
              <option value="">模試を選択して追加</option>
              {examResults
                .filter(exam => !selectedExams.find(s => s.id === exam.id))
                .map(exam => (
                  <option key={exam.id} value={exam.id}>
                    {exam.examName} - {format(exam.examDate.toDate(), 'yyyy/MM/dd')}
                  </option>
                ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {selectedExams.map((exam, index) => (
              <div
                key={exam.id}
                style={{
                  ...styles.badge,
                  borderColor: COLORS[index]
                }}
              >
                <div
                  style={{
                    ...styles.colorDot,
                    backgroundColor: COLORS[index]
                  }}
                />
                <span style={{ fontSize: '9px' }}>
                  {exam.examName} ({format(exam.examDate.toDate(), 'MM/dd')})
                </span>
                <button
                  style={styles.badgeClose}
                  onClick={() => removeExamFromComparison(exam.id!)}
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedExams.length >= 2 && (
        <>
          {/* エクスポートボタン */}
          <div style={styles.buttonGroup}>
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={exportToImage}
              disabled={exportLoading}
            >
              <FileImage size={14} />
              画像保存
            </button>
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={exportToPDF}
              disabled={exportLoading}
            >
              <FileText size={14} />
              PDF保存
            </button>
          </div>

          <div id="comparison-content">
            {/* 基本情報比較 */}
            <div style={{ ...styles.card, ...styles.section }}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>基本情報比較</h3>
              </div>
              <div style={styles.cardContent}>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeader}>
                        <th style={{ ...styles.tableHeaderCell, textAlign: 'left', fontSize: '9px' }}>項目</th>
                        {selectedExams.map((exam, index) => (
                          <th key={exam.id} style={styles.tableHeaderCell}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              gap: '2px',
                              flexDirection: 'column' as const
                            }}>
                              <div
                                style={{
                                  ...styles.colorDot,
                                  backgroundColor: COLORS[index]
                                }}
                              />
                              <span style={{ fontSize: '8px' }}>{exam.examName}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={styles.tableRow}>
                        <td style={{ ...styles.tableCell, textAlign: 'left', fontWeight: '500' }}>実施日</td>
                        {selectedExams.map(exam => (
                          <td key={exam.id} style={styles.tableCell}>
                            {format(exam.examDate.toDate(), 'MM/dd')}
                          </td>
                        ))}
                      </tr>
                      <tr style={styles.tableRow}>
                        <td style={{ ...styles.tableCell, textAlign: 'left', fontWeight: '500' }}>提供元</td>
                        {selectedExams.map(exam => (
                          <td key={exam.id} style={styles.tableCell}>
                            {PROVIDER_LABELS[exam.examProvider]}
                          </td>
                        ))}
                      </tr>
                      <tr style={styles.tableRow}>
                        <td style={{ ...styles.tableCell, textAlign: 'left', fontWeight: '500' }}>総合偏差値</td>
                        {selectedExams.map((exam, index) => {
                          const diff = index > 0 
                            ? calculateDifference(exam.deviation, selectedExams[index - 1].deviation)
                            : null
                          return (
                            <td key={exam.id} style={styles.tableCell}>
                              <div style={{ fontSize: '14px', fontWeight: '700' }}>{exam.deviation}</div>
                              {diff && (
                                <div style={{
                                  fontSize: '9px',
                                  color: diff.trend === 'up' ? '#27ae60' : 
                                        diff.trend === 'down' ? '#e74c3c' : 
                                        '#636e72',
                                  marginTop: '2px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '2px'
                                }}>
                                  {diff.trend === 'up' && <TrendingUp size={10} />}
                                  {diff.trend === 'down' && <TrendingDown size={10} />}
                                  {diff.trend === 'neutral' && <Minus size={10} />}
                                  {diff.value}
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                      <tr style={styles.tableRow}>
                        <td style={{ ...styles.tableCell, textAlign: 'left', fontWeight: '500' }}>得点率</td>
                        {selectedExams.map(exam => (
                          <td key={exam.id} style={styles.tableCell}>
                            {((exam.totalScore / exam.totalMaxScore) * 100).toFixed(1)}%
                          </td>
                        ))}
                      </tr>
                      <tr style={styles.tableRow}>
                        <td style={{ ...styles.tableCell, textAlign: 'left', fontWeight: '500' }}>全国順位</td>
                        {selectedExams.map(exam => (
                          <td key={exam.id} style={styles.tableCell}>
                            {exam.nationalRank.toLocaleString()}位
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* グラフ比較 */}
            <div style={{ ...styles.card, ...styles.section }}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>詳細分析</h3>
              </div>
              <div style={styles.cardContent}>
                {/* タブ */}
                <div style={styles.tabs}>
                  <div style={styles.tabList}>
                    <button
                      style={{
                        ...styles.tab,
                        ...(activeTab === 'deviation' ? styles.tabActive : {})
                      }}
                      onClick={() => setActiveTab('deviation')}
                    >
                      偏差値
                    </button>
                    <button
                      style={{
                        ...styles.tab,
                        ...(activeTab === 'radar' ? styles.tabActive : {})
                      }}
                      onClick={() => setActiveTab('radar')}
                    >
                      レーダー
                    </button>
                    <button
                      style={{
                        ...styles.tab,
                        ...(activeTab === 'rank' ? styles.tabActive : {})
                      }}
                      onClick={() => setActiveTab('rank')}
                    >
                      順位
                    </button>
                  </div>
                </div>
                
                {activeTab === 'deviation' && (
                  <div style={styles.chartContainer}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={prepareDeviationData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subject" fontSize={9} />
                        <YAxis domain={[0, 80]} fontSize={9} />
                        <Tooltip />
                        <Legend fontSize={9} />
                        {selectedExams.map((exam, index) => (
                          <Bar
                            key={exam.id}
                            dataKey={`exam${index}`}
                            fill={COLORS[index]}
                            name={exam.examName}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {activeTab === 'radar' && (
                  <div style={styles.chartContainer}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={prepareRadarData()}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" fontSize={9} />
                        <PolarRadiusAxis domain={[0, 80]} fontSize={9} />
                        <Tooltip />
                        <Legend fontSize={9} />
                        {selectedExams.map((exam, index) => (
                          <Radar
                            key={exam.id}
                            name={exam.examName}
                            dataKey={`exam${index}`}
                            stroke={COLORS[index]}
                            fill={COLORS[index]}
                            fillOpacity={0.3}
                          />
                        ))}
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {activeTab === 'rank' && (
                  <div style={styles.chartContainer}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={prepareRankData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={9} />
                        <YAxis 
                          reversed
                          label={{ value: '順位', angle: -90, position: 'insideLeft', style: { fontSize: 9 } }}
                          fontSize={9}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload
                              return (
                                <div style={styles.tooltipContent}>
                                  <p style={{ fontWeight: '600', marginBottom: '4px', fontSize: '10px' }}>{data.examName}</p>
                                  <p style={{ fontSize: '9px' }}>順位: {data.rank.toLocaleString()}位</p>
                                  <p style={{ fontSize: '9px' }}>上位: {data.percentile}%</p>
                                  <p style={{ fontSize: '9px' }}>受験者数: {data.participants.toLocaleString()}人</p>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="rank"
                          stroke="#6c5ce7"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* 科目別詳細比較 */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>科目別詳細比較</h3>
              </div>
              <div style={styles.cardContent}>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeader}>
                        <th style={{ ...styles.tableHeaderCell, textAlign: 'left' }}>科目</th>
                        {selectedExams.map((exam, index) => (
                          <th key={exam.id} colSpan={2} style={styles.tableHeaderCell}>
                            <div style={{
                              ...styles.colorDot,
                              backgroundColor: COLORS[index],
                              margin: '0 auto 2px'
                            }}/>
                            <span style={{ fontSize: '8px' }}>{exam.examName}</span>
                          </th>
                        ))}
                      </tr>
                      <tr style={styles.subheader}>
                        <th style={{ ...styles.tableHeaderCell, textAlign: 'left' }}></th>
                        {selectedExams.map(exam => (
                          <React.Fragment key={exam.id}>
                            <th style={{ ...styles.tableHeaderCell, fontSize: '8px' }}>得点</th>
                            <th style={{ ...styles.tableHeaderCell, fontSize: '8px' }}>偏差値</th>
                          </React.Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(SUBJECT_LABELS).slice(0, 5).map(([subject, label]) => {
                        const hasData = selectedExams.some(exam => 
                          exam.subjectResults.some(s => s.subject === subject)
                        )
                        if (!hasData) return null

                        return (
                          <tr key={subject} style={styles.tableRow}>
                            <td style={{ ...styles.tableCell, textAlign: 'left', fontWeight: '500' }}>{label}</td>
                            {selectedExams.map(exam => {
                              const subjectResult = exam.subjectResults.find(s => s.subject === subject)
                              if (!subjectResult) {
                                return (
                                  <React.Fragment key={exam.id}>
                                    <td colSpan={2} style={{ ...styles.tableCell, color: '#636e72' }}>
                                      -
                                    </td>
                                  </React.Fragment>
                                )
                              }
                              return (
                                <React.Fragment key={exam.id}>
                                  <td style={styles.tableCell}>
                                    {subjectResult.score}/{subjectResult.maxScore}
                                  </td>
                                  <td style={{ ...styles.tableCell, fontWeight: '600' }}>
                                    {subjectResult.deviation}
                                  </td>
                                </React.Fragment>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {selectedExams.length < 2 && (
        <div style={styles.card}>
          <div style={styles.emptyState}>
            <p style={{ marginBottom: '12px' }}>
              比較するには2つ以上の模試を選択してください
            </p>
          </div>
        </div>
      )}
    </div>
  )
}