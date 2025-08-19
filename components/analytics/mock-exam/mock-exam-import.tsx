'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import {
  Upload,
  FileSpreadsheet,
  FileImage,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Eye,
  Save,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { saveMockExamResult } from '@/lib/firebase/firestore'
import { Timestamp } from 'firebase/firestore'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

// ブラウザ互換性のためのポリフィル
if (typeof window !== 'undefined' && !Array.prototype.includes) {
  Array.prototype.includes = function(searchElement: any) {
    return this.indexOf(searchElement) !== -1
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
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    marginBottom: '12px'
  },
  cardHeader: {
    padding: '12px',
    borderBottom: '1px solid #e9ecef'
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: '4px'
  },
  cardDescription: {
    fontSize: '11px',
    color: '#636e72'
  },
  cardContent: {
    padding: '12px'
  },
  tabs: {
    marginBottom: '16px'
  },
  tabList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '6px',
    backgroundColor: 'white',
    padding: '6px',
    borderRadius: '10px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    marginBottom: '16px'
  },
  tab: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#636e72',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent'
  },
  tabActive: {
    backgroundColor: '#6c5ce7',
    color: 'white',
    boxShadow: '0 2px 6px rgba(108, 92, 231, 0.3)'
  },
  dropzone: {
    border: '2px dashed #e9ecef',
    borderRadius: '10px',
    padding: '24px 12px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  dropzoneActive: {
    borderColor: '#6c5ce7',
    backgroundColor: 'rgba(108, 92, 231, 0.05)'
  },
  dropzoneDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  alert: {
    padding: '10px',
    borderRadius: '8px',
    backgroundColor: '#f0f4ff',
    border: '1px solid #6c5ce7',
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    fontSize: '11px'
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent',
    width: '100%'
  },
  primaryButton: {
    backgroundColor: '#6c5ce7',
    color: 'white',
    boxShadow: '0 2px 6px rgba(108, 92, 231, 0.3)'
  },
  secondaryButton: {
    backgroundColor: 'white',
    color: '#2d3436',
    border: '1px solid #e9ecef'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '11px'
  },
  tableWrapper: {
    overflowX: 'auto' as const,
    WebkitOverflowScrolling: 'touch' as const,
    marginBottom: '12px'
  },
  tableHeader: {
    backgroundColor: '#f8f9fa',
    borderBottom: '1px solid #e9ecef'
  },
  tableHeaderCell: {
    padding: '8px 6px',
    textAlign: 'left' as const,
    fontSize: '10px',
    fontWeight: '600',
    color: '#636e72',
    whiteSpace: 'nowrap' as const
  },
  tableRow: {
    borderBottom: '1px solid #e9ecef',
    transition: 'background-color 0.2s ease'
  },
  tableCell: {
    padding: '8px 6px',
    fontSize: '10px',
    color: '#2d3436'
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '9px',
    fontWeight: '600',
    gap: '2px'
  },
  badgeSecondary: {
    backgroundColor: '#e9ecef',
    color: '#636e72'
  },
  badgeSuccess: {
    backgroundColor: '#27ae60',
    color: 'white'
  },
  badgeWarning: {
    backgroundColor: '#f39c12',
    color: 'white'
  },
  badgeError: {
    backgroundColor: '#e74c3c',
    color: 'white'
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
  select: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #e9ecef',
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer',
    backgroundColor: 'white',
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const,
    boxSizing: 'border-box' as const
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '24px',
    color: '#636e72',
    fontSize: '12px'
  },
  progressBar: {
    width: '100%',
    height: '6px',
    backgroundColor: '#e9ecef',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '12px'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6c5ce7',
    transition: 'width 0.3s ease'
  },
  checkbox: {
    width: '14px',
    height: '14px',
    cursor: 'pointer'
  },
  scrollArea: {
    maxHeight: '250px',
    overflowY: 'auto' as const,
    border: '1px solid #e9ecef',
    borderRadius: '6px',
    WebkitOverflowScrolling: 'touch' as const
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '4px',
    marginTop: '12px',
    flexWrap: 'wrap' as const
  },
  pageButton: {
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #e9ecef',
    backgroundColor: 'white',
    color: '#2d3436',
    fontSize: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  pageButtonActive: {
    backgroundColor: '#6c5ce7',
    color: 'white',
    border: '1px solid #6c5ce7'
  },
  pageButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  filterSection: {
    padding: '12px',
    borderBottom: '1px solid #e9ecef'
  },
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #e9ecef',
    fontSize: '12px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box' as const
  }
}

// 型定義
interface ImportedData {
  examDate?: string
  examProvider?: string
  examName?: string
  totalScore?: number
  totalMaxScore?: number
  deviation?: number
  nationalRank?: number
  totalParticipants?: number
  subjects?: Array<{
    name: string
    score: number
    maxScore: number
    deviation: number
  }>
}

interface ImportHistory {
  id: string
  fileName: string
  importDate: Date
  recordCount: number
  status: 'success' | 'partial' | 'failed'
}

interface FieldMapping {
  source: string
  target: string
  transform?: (value: any) => any
}

// カラムマッピングのデフォルト設定
const DEFAULT_MAPPINGS: Record<string, string> = {
  '実施日': 'examDate',
  '模試日': 'examDate',
  '日付': 'examDate',
  '提供元': 'examProvider',
  '模試名': 'examName',
  '総得点': 'totalScore',
  '満点': 'totalMaxScore',
  '偏差値': 'deviation',
  '全国順位': 'nationalRank',
  '順位': 'nationalRank',
  '受験者数': 'totalParticipants'
}

// サンプルCSVテンプレート
const SAMPLE_CSV_TEMPLATE = `実施日,模試提供元,模試名,総得点,満点,偏差値,全国順位,受験者数,国語得点,国語満点,国語偏差値,数学得点,数学満点,数学偏差値,英語得点,英語満点,英語偏差値
2024/11/15,河合塾,全統記述模試,420,600,65.5,12345,98765,140,200,62.3,150,200,68.2,130,200,65.8`

// 入力値のサニタイズ
const sanitizeInput = (value: string): string => {
  if (typeof value !== 'string') return ''
  return value.replace(/[<>\"\']/g, '').trim().slice(0, 100)
}

// 数値のバリデーション
const validateNumber = (value: any, min: number, max: number): number => {
  const num = Number(value)
  if (isNaN(num)) return min
  return Math.max(min, Math.min(max, num))
}

// 日付のバリデーション
const validateDate = (dateStr: string): boolean => {
  if (!dateStr) return false
  const date = new Date(dateStr)
  return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100
}

// ページネーション設定
const ITEMS_PER_PAGE = 5

export default function MockExamImport() {
  const [importedData, setImportedData] = useState<ImportedData[]>([])
  const [mappings, setMappings] = useState<FieldMapping[]>([])
  const [showMapping, setShowMapping] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [ocrProcessing, setOcrProcessing] = useState(false)
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([])
  const [selectedRows, setSelectedRows] = useState<number[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')
  const [currentPage, setCurrentPage] = useState(1)
  const [lastImportTime, setLastImportTime] = useState(0)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user)
    })
    return () => unsubscribe()
  }, [])

  // ファイルドロップゾーン設定
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // ファイルサイズ制限（10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert('ファイルサイズが大きすぎます（最大10MB）')
      return
    }

    const fileType = file.name.split('.').pop()?.toLowerCase()

    if (fileType === 'csv') {
      handleCSVImport(file)
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      handleExcelImport(file)
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType || '')) {
      handleImageImport(file)
    } else {
      alert('対応していないファイル形式です')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif']
    },
    maxFiles: 1,
    disabled: processing || ocrProcessing
  })

  // CSV インポート処理
  const handleCSVImport = useCallback((file: File) => {
    setProcessing(true)
    
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          alert('データが見つかりません')
          setProcessing(false)
          return
        }

        // 最大100件まで
        const limitedData = results.data.slice(0, 100)
        
        const headers = Object.keys(limitedData[0] || {})
        const autoMappings = createAutoMappings(headers)
        setMappings(autoMappings)
        
        const parsed = parseImportedData(limitedData, autoMappings)
        setImportedData(parsed)
        setShowMapping(true)
        setProcessing(false)
      },
      error: (error) => {
        alert('インポートエラー: ' + error.message)
        setProcessing(false)
      }
    })
  }, [])

  // Excel インポート処理
  const handleExcelImport = useCallback(async (file: File) => {
    setProcessing(true)
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      if (jsonData.length === 0) {
        throw new Error('データが見つかりません')
      }
      
      // 最大100件まで
      const limitedData = jsonData.slice(0, 100)
      
      const headers = Object.keys(limitedData[0])
      const autoMappings = createAutoMappings(headers)
      setMappings(autoMappings)
      
      const parsed = parseImportedData(limitedData, autoMappings)
      setImportedData(parsed)
      setShowMapping(true)
    } catch (error) {
      alert('Excelファイルの読み込みに失敗しました')
    } finally {
      setProcessing(false)
    }
  }, [])

  // 画像インポート処理（OCR）
  const handleImageImport = useCallback(async (file: File) => {
    setOcrProcessing(true)
    
    setTimeout(() => {
      alert('OCR機能は現在開発中です。CSV/Excelファイルをご利用ください。')
      setOcrProcessing(false)
    }, 2000)
  }, [])

  // 自動マッピング作成
  const createAutoMappings = useCallback((headers: string[]): FieldMapping[] => {
    return headers.map(header => {
      const target = DEFAULT_MAPPINGS[header] || ''
      return {
        source: header,
        target,
        transform: undefined
      }
    })
  }, [])

  // データパース処理
  const parseImportedData = useCallback((data: any[], mappings: FieldMapping[]): ImportedData[] => {
    return data.map(row => {
      const parsed: ImportedData = {}
      
      mappings.forEach(mapping => {
        if (mapping.target && row[mapping.source] !== undefined) {
          const value = mapping.transform 
            ? mapping.transform(row[mapping.source])
            : row[mapping.source]
          
          if (mapping.target === 'examDate' && typeof value === 'string') {
            parsed[mapping.target] = sanitizeInput(value)
          } else if (mapping.target === 'examName' || mapping.target === 'examProvider') {
            parsed[mapping.target as keyof ImportedData] = sanitizeInput(String(value))
          } else {
            parsed[mapping.target as keyof ImportedData] = value
          }
        }
      })
      
      const subjects = extractSubjectData(row)
      if (subjects.length > 0) {
        parsed.subjects = subjects
      }
      
      return parsed
    })
  }, [])

  // 科目データ抽出
  const extractSubjectData = useCallback((row: any) => {
    const subjects = []
    const subjectNames = ['国語', '数学', '英語', '物理', '化学', '生物', '日本史', '世界史', '地理']
    
    for (const subject of subjectNames) {
      if (row[`${subject}得点`] !== undefined) {
        subjects.push({
          name: subject,
          score: validateNumber(row[`${subject}得点`], 0, 1000),
          maxScore: validateNumber(row[`${subject}満点`], 1, 1000),
          deviation: validateNumber(row[`${subject}偏差値`], 0, 100)
        })
      }
    }
    
    return subjects
  }, [])

  // マッピング更新
  const updateMapping = useCallback((index: number, value: string) => {
    const newMappings = [...mappings]
    newMappings[index].target = value
    setMappings(newMappings)
    
    const reparsed = parseImportedData(importedData, newMappings)
    setImportedData(reparsed)
  }, [mappings, importedData, parseImportedData])

  // データ保存処理
  const saveImportedData = useCallback(async () => {
    // レート制限
    const now = Date.now()
    if (now - lastImportTime < 3000) {
      alert('しばらく待ってから保存してください')
      return
    }

    setProcessing(true)
    setLastImportTime(now)
    
    let successCount = 0
    let failCount = 0
    
    try {
      for (const index of selectedRows) {
        const data = importedData[index]
        
        // バリデーション
        if (!data.examDate || !validateDate(data.examDate)) {
          failCount++
          continue
        }
        
        if (!data.examName || data.examName.length === 0) {
          failCount++
          continue
        }
        
        try {
          const mockExamResult = {
            examDate: Timestamp.fromDate(new Date(data.examDate)),
            examProvider: sanitizeInput(data.examProvider || 'other'),
            examName: sanitizeInput(data.examName),
            examType: 'comprehensive' as const,
            totalScore: validateNumber(data.totalScore, 0, 10000),
            totalMaxScore: validateNumber(data.totalMaxScore, 1, 10000),
            deviation: validateNumber(data.deviation, 0, 100),
            nationalRank: validateNumber(data.nationalRank, 1, 1000000),
            totalParticipants: validateNumber(data.totalParticipants, 1, 1000000),
            subjectResults: (data.subjects || []).map(s => ({
              subject: convertSubjectName(s.name),
              score: s.score,
              maxScore: s.maxScore,
              deviation: s.deviation
            }))
          }
          
          await saveMockExamResult(mockExamResult)
          successCount++
        } catch (error) {
          failCount++
        }
      }
      
      const history: ImportHistory = {
        id: Date.now().toString(),
        fileName: 'インポートファイル',
        importDate: new Date(),
        recordCount: successCount,
        status: failCount === 0 ? 'success' : successCount === 0 ? 'failed' : 'partial'
      }
      setImportHistory([history, ...importHistory.slice(0, 9)]) // 最大10件まで
      
      alert(`${successCount}件のデータを正常にインポートしました${failCount > 0 ? `（${failCount}件失敗）` : ''}`)
      
      setImportedData([])
      setSelectedRows([])
      setShowMapping(false)
      setShowPreview(false)
      setCurrentPage(1)
    } catch (error) {
      alert('データの保存に失敗しました')
    } finally {
      setProcessing(false)
    }
  }, [selectedRows, importedData, lastImportTime, importHistory])

  // 科目名変換
  const convertSubjectName = useCallback((name: string): string => {
    const mapping: Record<string, string> = {
      '国語': 'japanese',
      '数学': 'math',
      '英語': 'english',
      '物理': 'physics',
      '化学': 'chemistry',
      '生物': 'biology',
      '日本史': 'japanese_history',
      '世界史': 'world_history',
      '地理': 'geography',
      '公民': 'civics',
      '地学': 'earth_science'
    }
    return mapping[name] || name.toLowerCase()
  }, [])

  // サンプルファイルダウンロード
  const downloadSampleFile = useCallback(() => {
    const blob = new Blob([SAMPLE_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '模試結果インポートテンプレート.csv'
    link.click()
  }, [])

  // 全選択/全解除
  const toggleAllSelection = useCallback(() => {
    const currentPageData = paginatedData
    const currentPageIndexes = currentPageData.map((_, index) => (currentPage - 1) * ITEMS_PER_PAGE + index)
    
    const allSelected = currentPageIndexes.every(index => selectedRows.includes(index))
    
    if (allSelected) {
      setSelectedRows(selectedRows.filter(row => !currentPageIndexes.includes(row)))
    } else {
      const validIndexes = currentPageIndexes.filter(index => {
        const data = importedData[index]
        return data.examDate && data.examName
      })
      setSelectedRows([...new Set([...selectedRows, ...validIndexes])])
    }
  }, [selectedRows, currentPage, importedData])

  // 行選択切り替え
  const toggleRowSelection = useCallback((index: number) => {
    if (selectedRows.includes(index)) {
      setSelectedRows(selectedRows.filter(i => i !== index))
    } else {
      setSelectedRows([...selectedRows, index])
    }
  }, [selectedRows])

  // ページネーション計算
  const totalPages = Math.ceil(importedData.length / ITEMS_PER_PAGE)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return importedData.slice(start, start + ITEMS_PER_PAGE)
  }, [importedData, currentPage])

  if (!isAuthenticated) {
    return (
      <div style={styles.emptyState}>
        <p>ログインが必要です</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      {/* ファイルアップロードエリア */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>模試結果をインポート</h2>
          <p style={styles.cardDescription}>
            CSV、Excel、画像ファイルから一括インポート
          </p>
        </div>
        <div style={styles.cardContent}>
          {/* タブ */}
          <div style={styles.tabs}>
            <div style={styles.tabList}>
              <button
                style={{
                  ...styles.tab,
                  ...(activeTab === 'upload' ? styles.tabActive : {})
                }}
                onClick={() => setActiveTab('upload')}
              >
                アップロード
              </button>
              <button
                style={{
                  ...styles.tab,
                  ...(activeTab === 'history' ? styles.tabActive : {})
                }}
                onClick={() => setActiveTab('history')}
              >
                履歴
              </button>
            </div>

            {activeTab === 'upload' && (
              <div>
                <div
                  {...getRootProps()}
                  style={{
                    ...styles.dropzone,
                    ...(isDragActive ? styles.dropzoneActive : {}),
                    ...(processing || ocrProcessing ? styles.dropzoneDisabled : {})
                  }}
                >
                  <input {...getInputProps()} />
                  
                  {processing || ocrProcessing ? (
                    <div>
                      <RefreshCw size={32} style={{ 
                        animation: 'spin 1s linear infinite', 
                        color: '#6c5ce7',
                        marginBottom: '12px'
                      }} />
                      <p style={{ color: '#636e72', marginBottom: '12px', fontSize: '12px' }}>
                        {ocrProcessing ? 'OCR処理中...' : 'ファイルを処理中...'}
                      </p>
                      <div style={styles.progressBar}>
                        <div style={{
                          ...styles.progressFill,
                          width: '33%'
                        }} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} style={{ 
                        color: '#636e72',
                        marginBottom: '12px'
                      }} />
                      <p style={{ 
                        fontSize: '14px', 
                        fontWeight: '600',
                        marginBottom: '4px'
                      }}>
                        ファイルをドラッグ&ドロップ
                      </p>
                      <p style={{ 
                        fontSize: '11px', 
                        color: '#636e72',
                        marginBottom: '12px'
                      }}>
                        または、タップして選択
                      </p>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: '8px',
                        flexWrap: 'wrap' as const
                      }}>
                        <div style={{
                          ...styles.badge,
                          ...styles.badgeSecondary
                        }}>
                          <FileSpreadsheet size={12} />
                          CSV/Excel
                        </div>
                        <div style={{
                          ...styles.badge,
                          ...styles.badgeSecondary
                        }}>
                          <FileImage size={12} />
                          画像 (OCR)
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  style={{ 
                    ...styles.button, 
                    ...styles.secondaryButton,
                    marginTop: '12px'
                  }}
                  onClick={downloadSampleFile}
                >
                  <Download size={14} />
                  サンプルCSVダウンロード
                </button>

                <div style={styles.alert}>
                  <AlertCircle size={14} color="#6c5ce7" />
                  <div>
                    CSVファイルは文字コードUTF-8で保存してください。
                    画像からの読み取り（OCR）は現在開発中です。
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div style={styles.tableWrapper}>
                {importHistory.length === 0 ? (
                  <div style={styles.emptyState}>
                    インポート履歴がありません
                  </div>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr style={styles.tableHeader}>
                        <th style={styles.tableHeaderCell}>日時</th>
                        <th style={styles.tableHeaderCell}>件数</th>
                        <th style={styles.tableHeaderCell}>ステータス</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importHistory.map((history) => (
                        <tr key={history.id} style={styles.tableRow}>
                          <td style={styles.tableCell}>
                            {format(history.importDate, 'MM/dd HH:mm', { locale: ja })}
                          </td>
                          <td style={styles.tableCell}>{history.recordCount}件</td>
                          <td style={styles.tableCell}>
                            <div style={{
                              ...styles.badge,
                              ...(history.status === 'success' ? styles.badgeSuccess : 
                                  history.status === 'partial' ? styles.badgeWarning : 
                                  styles.badgeError)
                            }}>
                              {history.status === 'success' && <CheckCircle size={10} />}
                              {history.status === 'partial' && <AlertCircle size={10} />}
                              {history.status === 'failed' && <XCircle size={10} />}
                              {history.status === 'success' ? '成功' :
                               history.status === 'partial' ? '一部成功' :
                               '失敗'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* データマッピング画面 */}
      {showMapping && !showPreview && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>データマッピング設定</h3>
            <p style={styles.cardDescription}>
              項目の対応を確認してください
            </p>
          </div>
          <div style={styles.cardContent}>
            <div style={{ display: 'grid', gap: '8px' }}>
              {mappings.slice(0, 5).map((mapping, index) => (
                <div key={index} style={styles.formGroup}>
                  <label style={styles.label}>{mapping.source}</label>
                  <select
                    style={styles.select}
                    value={mapping.target}
                    onChange={(e) => updateMapping(index, e.target.value)}
                  >
                    <option value="">なし</option>
                    <option value="examDate">実施日</option>
                    <option value="examProvider">模試提供元</option>
                    <option value="examName">模試名</option>
                    <option value="totalScore">総得点</option>
                    <option value="totalMaxScore">満点</option>
                    <option value="deviation">偏差値</option>
                    <option value="nationalRank">全国順位</option>
                    <option value="totalParticipants">受験者数</option>
                  </select>
                </div>
              ))}
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '8px',
              marginTop: '16px'
            }}>
              <button
                style={{ 
                  ...styles.button, 
                  ...styles.secondaryButton
                }}
                onClick={() => {
                  setShowMapping(false)
                  setImportedData([])
                  setMappings([])
                }}
              >
                キャンセル
              </button>
              <button
                style={{ 
                  ...styles.button, 
                  ...styles.primaryButton
                }}
                onClick={() => setShowPreview(true)}
                disabled={!mappings.some(m => m.target)}
              >
                プレビュー
              </button>
            </div>
          </div>
        </div>
      )}

      {/* プレビュー画面 */}
      {showPreview && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>インポートデータのプレビュー</h3>
            <p style={styles.cardDescription}>
              保存するデータを選択
            </p>
          </div>
          <div style={styles.cardContent}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '8px'
              }}>
                <input
                  type="checkbox"
                  style={styles.checkbox}
                  checked={paginatedData.length > 0 && paginatedData.every((_, index) => 
                    selectedRows.includes((currentPage - 1) * ITEMS_PER_PAGE + index)
                  )}
                  onChange={toggleAllSelection}
                />
                <span style={{ fontSize: '11px', color: '#636e72' }}>
                  {selectedRows.length} / {importedData.length} 件選択中
                </span>
              </div>
            </div>

            <div style={styles.scrollArea}>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={{ ...styles.tableHeaderCell, width: '30px' }}>選択</th>
                      <th style={styles.tableHeaderCell}>模試名</th>
                      <th style={styles.tableHeaderCell}>実施日</th>
                      <th style={styles.tableHeaderCell}>偏差値</th>
                      <th style={styles.tableHeaderCell}>状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((data, pageIndex) => {
                      const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + pageIndex
                      const isValid = data.examDate && validateDate(data.examDate) && data.examName
                      
                      return (
                        <tr key={globalIndex} style={styles.tableRow}>
                          <td style={styles.tableCell}>
                            <input
                              type="checkbox"
                              style={styles.checkbox}
                              checked={selectedRows.includes(globalIndex)}
                              onChange={() => toggleRowSelection(globalIndex)}
                              disabled={!isValid}
                            />
                          </td>
                          <td style={styles.tableCell}>{data.examName || '-'}</td>
                          <td style={styles.tableCell}>{data.examDate || '-'}</td>
                          <td style={styles.tableCell}>{data.deviation || '-'}</td>
                          <td style={styles.tableCell}>
                            {isValid ? (
                              <div style={{
                                ...styles.badge,
                                backgroundColor: '#d4f4dd',
                                color: '#27ae60'
                              }}>
                                <CheckCircle size={8} />
                                有効
                              </div>
                            ) : (
                              <div style={{
                                ...styles.badge,
                                backgroundColor: '#ffeaea',
                                color: '#e74c3c'
                              }}>
                                <XCircle size={8} />
                                無効
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  style={{
                    ...styles.pageButton,
                    ...(currentPage === 1 ? styles.pageButtonDisabled : {})
                  }}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={12} />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span style={{ color: '#636e72', fontSize: '10px' }}>...</span>
                      )}
                      <button
                        style={{
                          ...styles.pageButton,
                          ...(currentPage === page ? styles.pageButtonActive : {})
                        }}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
                
                <button
                  style={{
                    ...styles.pageButton,
                    ...(currentPage === totalPages ? styles.pageButtonDisabled : {})
                  }}
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              gap: '8px',
              marginTop: '16px'
            }}>
              <button
                style={{ 
                  ...styles.button, 
                  ...styles.secondaryButton
                }}
                onClick={() => {
                  setShowPreview(false)
                  setShowMapping(false)
                  setImportedData([])
                  setSelectedRows([])
                  setCurrentPage(1)
                }}
              >
                キャンセル
              </button>
              <button
                style={{ 
                  ...styles.button, 
                  ...styles.primaryButton
                }}
                onClick={saveImportedData}
                disabled={selectedRows.length === 0 || processing}
              >
                {processing ? (
                  <>
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    {selectedRows.length}件を保存
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}