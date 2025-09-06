'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { 
  Edit, 
  Trash2, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  Search,
  FileDown,
  FileSpreadsheet,
  X,
  Plus
} from 'lucide-react'
import { getMockExamResults, deleteMockExamResult } from '@/lib/firebase/firestore'
import { deleteImage } from '@/lib/firebase/storage'
import { Timestamp } from 'firebase/firestore'
import { useRouter } from 'next/navigation'

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
  header: {
    marginBottom: '16px'
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: '4px'
  },
  subtitle: {
    fontSize: '12px',
    color: '#636e72'
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    flexWrap: 'wrap' as const
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    outline: 'none'
  },
  primaryButton: {
    backgroundColor: '#6c5ce7',
    color: 'white',
    boxShadow: '0 2px 8px rgba(108, 92, 231, 0.3)'
  },
  secondaryButton: {
    backgroundColor: 'white',
    color: '#2d3436',
    border: '1px solid #e9ecef'
  },
  filterButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px',
    borderRadius: '6px',
    fontSize: '12px',
    backgroundColor: 'white',
    color: '#2d3436',
    border: '1px solid #e9ecef',
    cursor: 'pointer'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    marginBottom: '12px'
  },
  cardHeader: {
    padding: '12px',
    borderBottom: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardBody: {
    padding: '12px'
  },
  badge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '600',
    marginRight: '4px'
  },
  deviationValue: {
    fontSize: '24px',
    fontWeight: '700',
    textAlign: 'center' as const
  },
  progressBar: {
    width: '100%',
    height: '6px',
    backgroundColor: '#e9ecef',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '4px'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6c5ce7',
    transition: 'width 0.3s ease'
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: '#636e72'
  },
  filterSection: {
    padding: '12px',
    borderBottom: '1px solid #e9ecef'
  },
  inputGroup: {
    marginBottom: '12px'
  },
  label: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#2d3436',
    marginBottom: '4px',
    display: 'block'
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #e9ecef',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box' as const
  },
  select: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #e9ecef',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
    boxSizing: 'border-box' as const
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px',
    marginTop: '16px'
  },
  pageButton: {
    padding: '6px 10px',
    borderRadius: '4px',
    border: '1px solid #e9ecef',
    backgroundColor: 'white',
    color: '#2d3436',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  pageButtonActive: {
    backgroundColor: '#6c5ce7',
    color: 'white',
    border: '1px solid #6c5ce7'
  },
  iconButton: {
    padding: '6px',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease'
  },
  listItem: {
    borderBottom: '1px solid #e9ecef',
    padding: '12px 0'
  },
  listItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px'
  },
  listItemTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: '4px'
  },
  listItemMeta: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    fontSize: '11px',
    color: '#636e72'
  },
  actionButtons: {
    display: 'flex',
    gap: '4px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    marginTop: '8px'
  },
  statItem: {
    textAlign: 'center' as const
  },
  statLabel: {
    fontSize: '10px',
    color: '#636e72'
  },
  statValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3436'
  }
}

// 型定義（既存のものと同じ）
interface MockExamResult {
  id: string
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
  imageUrl?: string
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

interface FilterSettings {
  provider: string
  dateFrom: Date | null
  dateTo: Date | null
  searchTerm: string
  examType: string
}

const PROVIDER_LABELS: Record<string, string> = {
  kawai: '河合塾',
  sundai: '駿台',
  toshin: '東進',
  benesse: 'ベネッセ',
  other: 'その他'
}

const ITEMS_PER_PAGE = 10

export default function MockExamList() {
  const router = useRouter()
  const [examResults, setExamResults] = useState<MockExamResult[]>([])
  const [filteredResults, setFilteredResults] = useState<MockExamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterSettings>({
    provider: 'all',
    dateFrom: null,
    dateTo: null,
    searchTerm: '',
    examType: 'all'
  })

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

  useEffect(() => {
    let results = [...examResults]

    if (filters.provider !== 'all') {
      results = results.filter(r => r.examProvider === filters.provider)
    }

    if (filters.examType !== 'all') {
      results = results.filter(r => r.examType === filters.examType)
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      results = results.filter(r => 
        r.examName.toLowerCase().includes(searchLower) ||
        PROVIDER_LABELS[r.examProvider].toLowerCase().includes(searchLower)
      )
    }

    setFilteredResults(results)
    setCurrentPage(1)
  }, [examResults, filters])

  const fetchExamResults = async () => {
    try {
      setLoading(true)
      const results = await getMockExamResults()
      setExamResults(results)
    } catch (error) {
      console.error('データの取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (id: string) => {
    router.push(`/analytics/mock-exam?tab=form&edit=${id}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return

    try {
      const targetExam = examResults.find(e => e.id === id)
      
      if (targetExam?.imageUrl) {
        await deleteImage(targetExam.imageUrl)
      }
      
      await deleteMockExamResult(id)
      await fetchExamResults()
    } catch (error) {
      console.error('削除に失敗しました:', error)
    }
  }

  const exportToCSV = () => {
    const csvData = filteredResults.map(exam => ({
      '実施日': format(exam.examDate.toDate(), 'yyyy-MM-dd'),
      '模試提供元': PROVIDER_LABELS[exam.examProvider],
      '模試名': exam.examName,
      '総得点': exam.totalScore,
      '満点': exam.totalMaxScore,
      '偏差値': exam.deviation,
      '全国順位': exam.nationalRank,
      '受験者数': exam.totalParticipants
    }))

    const headers = Object.keys(csvData[0] || {})
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => row[header as keyof typeof row]).join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `模試結果_${format(new Date(), 'yyyyMMdd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE)
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const getDeviationColor = (deviation: number) => {
    if (deviation >= 65) return '#27ae60'
    if (deviation >= 55) return '#3498db'
    if (deviation >= 45) return '#f39c12'
    return '#e74c3c'
  }

  if (!isAuthenticated) {
    return (
      <div style={styles.emptyState}>
        <p>ログインが必要です</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={styles.emptyState}>
        <p>データを読み込んでいます...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <div style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={styles.title}>模試結果一覧</h1>
            <p style={styles.subtitle}>
              {filteredResults.length}件の結果
              {filters.searchTerm && ' (フィルタ適用中)'}
            </p>
          </div>
          <button
            style={styles.filterButton}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} />
            {showFilters && <X size={14} />}
          </button>
        </div>
        <div style={styles.buttonGroup}>
          <button
            style={{...styles.button, ...styles.secondaryButton}}
            onClick={exportToCSV}
          >
            <Download size={14} />
            CSV出力
          </button>
          <button
            style={{...styles.button, ...styles.primaryButton}}
            onClick={() => router.push('/analytics/mock-exam/add')}
          >
            <Plus size={14} />
            結果を追加
          </button>
        </div>
      </div>

      {/* フィルター */}
      {showFilters && (
        <div style={styles.card}>
          <div style={styles.filterSection}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>検索</label>
              <input
                style={styles.input}
                placeholder="模試名で検索..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>模試提供元</label>
              <select
                style={styles.select}
                value={filters.provider}
                onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
              >
                <option value="all">すべて</option>
                <option value="kawai">河合塾</option>
                <option value="sundai">駿台</option>
                <option value="toshin">東進</option>
                <option value="benesse">ベネッセ</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>模試タイプ</label>
              <select
                style={styles.select}
                value={filters.examType}
                onChange={(e) => setFilters({ ...filters, examType: e.target.value })}
              >
                <option value="all">すべて</option>
                <option value="comprehensive">総合模試</option>
                <option value="subject_specific">科目別模試</option>
              </select>
            </div>

            <button
              style={{
                ...styles.button,
                backgroundColor: 'transparent',
                color: '#636e72',
                border: 'none',
                padding: '8px',
                width: '100%'
              }}
              onClick={() => setFilters({
                provider: 'all',
                dateFrom: null,
                dateTo: null,
                searchTerm: '',
                examType: 'all'
              })}
            >
              <X size={14} />
              フィルタをクリア
            </button>
          </div>
        </div>
      )}

      {/* リスト表示 */}
      <div>
        {paginatedResults.length === 0 ? (
          <div style={styles.card}>
            <div style={styles.emptyState}>
              {filters.searchTerm
                ? 'フィルタ条件に一致する結果がありません'
                : 'まだ模試結果が登録されていません'}
            </div>
          </div>
        ) : (
          paginatedResults.map((exam) => {
            const scoreRate = ((exam.totalScore / exam.totalMaxScore) * 100).toFixed(1)
            const rankPercentage = ((exam.totalParticipants - exam.nationalRank + 1) / exam.totalParticipants * 100).toFixed(1)
            const bestAssessment = exam.universityAssessments?.[0]

            return (
              <div key={exam.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.listItemTitle}>{exam.examName}</div>
                    <div style={styles.listItemMeta}>
                      <span>{format(exam.examDate.toDate(), 'yyyy/MM/dd')}</span>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: '#e9ecef',
                        color: '#2d3436'
                      }}>
                        {PROVIDER_LABELS[exam.examProvider]}
                      </span>
                      {exam.examType === 'subject_specific' && (
                        <span style={{
                          ...styles.badge,
                          backgroundColor: '#f0f4ff',
                          color: '#6c5ce7'
                        }}>
                          科目別
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={styles.actionButtons}>
                    <button
                      style={styles.iconButton}
                      onClick={() => handleEdit(exam.id)}
                    >
                      <Edit size={16} color="#636e72" />
                    </button>
                    <button
                      style={styles.iconButton}
                      onClick={() => handleDelete(exam.id)}
                    >
                      <Trash2 size={16} color="#e74c3c" />
                    </button>
                  </div>
                </div>
                
                <div style={styles.cardBody}>
                  <div style={{
                    ...styles.deviationValue,
                    color: getDeviationColor(exam.deviation)
                  }}>
                    偏差値 {exam.deviation}
                  </div>
                  
                  <div style={styles.statsGrid}>
                    <div style={styles.statItem}>
                      <div style={styles.statLabel}>得点率</div>
                      <div style={styles.statValue}>{scoreRate}%</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={styles.statLabel}>順位</div>
                      <div style={styles.statValue}>{exam.nationalRank.toLocaleString()}位</div>
                    </div>
                    <div style={styles.statItem}>
                      <div style={styles.statLabel}>上位</div>
                      <div style={styles.statValue}>{rankPercentage}%</div>
                    </div>
                  </div>

                  {bestAssessment && (
                    <div style={{ marginTop: '8px', textAlign: 'center' }}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: bestAssessment.assessment === 'A' ? '#27ae60' : 
                                       bestAssessment.assessment === 'B' ? '#3498db' : '#f39c12',
                        color: 'white'
                      }}>
                        {bestAssessment.assessment}判定
                      </span>
                      <span style={{ fontSize: '11px', color: '#636e72' }}>
                        {bestAssessment.universityName}
                      </span>
                    </div>
                  )}
                  
                  <div style={styles.progressBar}>
                    <div style={{
                      ...styles.progressFill,
                      width: `${scoreRate}%`
                    }} />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={{
              ...styles.pageButton,
              opacity: currentPage === 1 ? 0.5 : 1,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={14} />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <button
                  key={page}
                  style={{
                    ...styles.pageButton,
                    ...(currentPage === page ? styles.pageButtonActive : {})
                  }}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            } else if (
              page === currentPage - 2 ||
              page === currentPage + 2
            ) {
              return <span key={page} style={{ color: '#636e72', fontSize: '12px' }}>...</span>
            }
            return null
          })}
          
          <button
            style={{
              ...styles.pageButton,
              opacity: currentPage === totalPages ? 0.5 : 1,
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}