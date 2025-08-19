import React, { useState, useCallback, useEffect } from 'react'
import { Calendar, Plus, Trash2, Upload, Save, Eye, Loader2, FileText, Calculator, School, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'

// 模試提供元のリスト
const EXAM_PROVIDERS = [
  { value: 'kawai', label: '河合塾' },
  { value: 'sundai', label: '駿台' },
  { value: 'toshin', label: '東進' },
  { value: 'benesse', label: 'ベネッセ' },
  { value: 'other', label: 'その他' }
]

// よく使われる模試名
const COMMON_EXAM_NAMES = {
  kawai: ['全統記述模試', '全統マーク模試', '全統共通テスト模試', 'プライムステージ'],
  sundai: ['駿台全国模試', '駿台共通テスト模試', '駿台・ベネッセ記述模試'],
  toshin: ['東進共通テスト本番レベル模試', '東進難関大本番レベル模試'],
  benesse: ['進研模試', 'ベネッセ・駿台記述模試'],
  other: []
}

// 科目リスト
const SUBJECTS = [
  { value: 'japanese', label: '国語' },
  { value: 'math', label: '数学' },
  { value: 'english', label: '英語' },
  { value: 'physics', label: '物理' },
  { value: 'chemistry', label: '化学' },
  { value: 'biology', label: '生物' },
  { value: 'earth_science', label: '地学' },
  { value: 'japanese_history', label: '日本史' },
  { value: 'world_history', label: '世界史' },
  { value: 'geography', label: '地理' },
  { value: 'civics', label: '公民' }
]

// モバイル最適化スタイル
const styles = {
  container: {
    maxWidth: '370px',
    margin: '0 auto',
    padding: '12px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
  cardContent: {
    padding: '16px'
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: '4px',
    margin: 0
  },
  description: {
    fontSize: '12px',
    color: '#636e72',
    marginBottom: '16px',
    margin: 0
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    padding: '0 8px'
  },
  progressStep: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative' as const
  },
  progressCircle: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    backgroundColor: '#e9ecef',
    color: '#636e72'
  },
  progressCircleActive: {
    backgroundColor: '#6c5ce7',
    color: 'white',
    boxShadow: '0 2px 6px rgba(108, 92, 231, 0.3)'
  },
  progressCircleCompleted: {
    backgroundColor: '#27ae60',
    color: 'white'
  },
  progressLine: {
    flex: 1,
    height: '2px',
    backgroundColor: '#e9ecef',
    margin: '0 6px',
    transition: 'background-color 0.3s ease'
  },
  progressLineCompleted: {
    backgroundColor: '#27ae60'
  },
  tabContainer: {
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
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '4px',
    padding: '10px',
    borderRadius: '8px',
    borderWidth: '0',
    borderStyle: 'none',
    backgroundColor: 'transparent',
    color: '#636e72',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    position: 'relative' as const,
    fontFamily: 'inherit',
    WebkitTapHighlightColor: 'transparent'
  },
  tabActive: {
    backgroundColor: '#6c5ce7',
    color: 'white',
    boxShadow: '0 2px 6px rgba(108, 92, 231, 0.3)'
  },
  tabCompleted: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#27ae60'
  },
  tabIcon: {
    width: '16px',
    height: '16px'
  },
  tabLabel: {
    fontSize: '11px',
    fontWeight: '600'
  },
  completedMark: {
    position: 'absolute' as const,
    top: '2px',
    right: '2px',
    width: '12px',
    height: '12px',
    color: '#27ae60'
  },
  sectionContainer: {
    marginBottom: '16px'
  },
  sectionHeader: {
    backgroundColor: '#f3f4f6',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '12px'
  },
  sectionHeaderPurple: {
    backgroundColor: '#f0f4ff'
  },
  sectionHeaderBlue: {
    backgroundColor: '#e6f2ff'
  },
  sectionHeaderGreen: {
    backgroundColor: '#e8f8f0'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '2px',
    margin: 0,
    color: '#2d3436'
  },
  sectionTitlePurple: {
    color: '#6c5ce7'
  },
  sectionTitleBlue: {
    color: '#3498db'
  },
  sectionTitleGreen: {
    color: '#27ae60'
  },
  sectionDescription: {
    fontSize: '11px',
    margin: 0,
    color: '#636e72'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '12px',
    marginBottom: '12px'
  },
  formGroup: {
    marginBottom: '12px'
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: '4px'
  },
  required: {
    color: '#e74c3c'
  },
  input: {
    width: '100%',
    height: '36px',
    padding: '0 10px',
    fontSize: '14px',
    borderRadius: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e9ecef',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    backgroundColor: 'white',
    boxSizing: 'border-box' as const,
    WebkitAppearance: 'none' as const
  },
  inputFocus: {
    borderColor: '#6c5ce7',
    boxShadow: '0 0 0 2px rgba(108, 92, 231, 0.1)'
  },
  inputError: {
    borderColor: '#e74c3c'
  },
  select: {
    width: '100%',
    height: '36px',
    padding: '0 30px 0 10px',
    fontSize: '14px',
    borderRadius: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e9ecef',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    backgroundColor: 'white',
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='none'%3E%3Cpath d='M5 6l3 3 3-3' stroke='%23636e72' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    boxSizing: 'border-box' as const,
    WebkitAppearance: 'none' as const
  },
  errorText: {
    fontSize: '10px',
    color: '#e74c3c',
    marginTop: '2px'
  },
  dateButton: {
    width: '100%',
    height: '36px',
    padding: '0 10px',
    fontSize: '14px',
    borderRadius: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e9ecef',
    outline: 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    backgroundColor: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    textAlign: 'left' as const,
    boxSizing: 'border-box' as const,
    WebkitTapHighlightColor: 'transparent'
  },
  datePickerPopup: {
    position: 'absolute' as const,
    top: '100%',
    left: '0',
    marginTop: '4px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e9ecef',
    padding: '8px',
    zIndex: 50,
    width: '100%'
  },
  uploadSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '12px'
  },
  uploadButton: {
    padding: '8px 12px',
    backgroundColor: 'white',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e9ecef',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#2d3436',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    WebkitTapHighlightColor: 'transparent'
  },
  uploadButtonHover: {
    backgroundColor: '#f8f9fa',
    borderColor: '#6c5ce7',
    color: '#6c5ce7'
  },
  uploadSuccess: {
    fontSize: '11px',
    color: '#27ae60',
    fontWeight: '500',
    display: 'block',
    marginTop: '6px'
  },
  subjectCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '12px',
    position: 'relative' as const,
    marginBottom: '8px'
  },
  deleteButton: {
    position: 'absolute' as const,
    top: '8px',
    right: '8px',
    padding: '4px',
    backgroundColor: 'transparent',
    borderWidth: '0',
    borderStyle: 'none',
    cursor: 'pointer',
    color: '#e74c3c',
    transition: 'color 0.2s ease',
    WebkitTapHighlightColor: 'transparent'
  },
  deleteButtonHover: {
    color: '#c0392b'
  },
  addButton: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    borderWidth: '2px',
    borderStyle: 'dashed',
    borderColor: '#e9ecef',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#636e72',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    WebkitTapHighlightColor: 'transparent'
  },
  addButtonHover: {
    borderColor: '#6c5ce7',
    color: '#6c5ce7',
    backgroundColor: '#faf8ff'
  },
  actionBar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    paddingTop: '16px',
    borderTop: '1px solid #e9ecef',
    marginTop: '16px'
  },
  actionBarButtons: {
    display: 'flex',
    gap: '6px'
  },
  button: {
    padding: '10px 16px',
    borderRadius: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e9ecef',
    backgroundColor: 'white',
    color: '#2d3436',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    outline: 'none',
    flex: 1,
    WebkitTapHighlightColor: 'transparent'
  },
  buttonPrimary: {
    backgroundColor: '#6c5ce7',
    color: 'white',
    borderWidth: '0',
    borderStyle: 'none',
    boxShadow: '0 2px 6px rgba(108, 92, 231, 0.3)'
  },
  buttonPrimaryHover: {
    backgroundColor: '#5a4ad1',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 10px rgba(108, 92, 231, 0.4)'
  },
  buttonFullWidth: {
    width: '100%'
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  modal: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    padding: '0',
    zIndex: 100
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '16px 16px 0 0',
    width: '100%',
    maxHeight: '85vh',
    overflow: 'auto',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
    WebkitOverflowScrolling: 'touch' as const
  },
  modalHeader: {
    padding: '16px',
    borderBottom: '1px solid #e9ecef',
    position: 'sticky' as const,
    top: 0,
    backgroundColor: 'white',
    zIndex: 10
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '700',
    margin: 0,
    color: '#2d3436'
  },
  modalBody: {
    padding: '16px',
    paddingBottom: '32px'
  },
  previewSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px'
  },
  previewTitle: {
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '8px',
    color: '#2d3436'
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '8px'
  },
  previewItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  previewLabel: {
    fontSize: '11px',
    color: '#636e72'
  },
  previewValue: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#2d3436'
  },
  assessmentBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '600',
    marginRight: '4px'
  },
  assessmentA: {
    backgroundColor: '#27ae60',
    color: 'white'
  },
  assessmentB: {
    backgroundColor: '#3498db',
    color: 'white'
  },
  assessmentC: {
    backgroundColor: '#f39c12',
    color: 'white'
  },
  assessmentD: {
    backgroundColor: '#e67e22',
    color: 'white'
  },
  assessmentE: {
    backgroundColor: '#e74c3c',
    color: 'white'
  },
  closeButton: {
    padding: '10px 20px',
    backgroundColor: '#636e72',
    color: 'white',
    borderWidth: '0',
    borderStyle: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    width: '100%',
    WebkitTapHighlightColor: 'transparent'
  },
  navigationButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '8px',
    marginTop: '16px'
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 12px',
    borderRadius: '6px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#e9ecef',
    backgroundColor: 'white',
    color: '#636e72',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    WebkitTapHighlightColor: 'transparent'
  },
  navButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
}

// 日付をフォーマットする関数
const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}年${month}月${day}日`
}

export default function MockExamForm() {
  const [activeTab, setActiveTab] = useState('basic')
  const [showPreview, setShowPreview] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [showCalendar, setShowCalendar] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)

  // フォームデータの初期値
  const [formData, setFormData] = useState<any>({
    examProvider: '',
    examName: '',
    examDate: null,
    examType: 'comprehensive',
    totalScore: 0,
    totalMaxScore: 0,
    deviation: 0,
    nationalRank: 1,
    totalParticipants: 1,
    subjectResults: [],
    universityAssessments: [],
  })

  // 現在のステップ番号を取得
  const getCurrentStep = () => {
    const steps = ['basic', 'overall', 'subjects', 'assessment']
    return steps.indexOf(activeTab)
  }

  // タブのインデックスを取得
  const getTabIndex = (tabValue: string) => {
    const tabs = ['basic', 'overall', 'subjects', 'assessment']
    return tabs.indexOf(tabValue)
  }

  // フォームデータの更新
  const updateFormData = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }))
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // バリデーション
  const validateTab = (tabName: string): boolean => {
    const newErrors: Record<string, string> = {}

    if (tabName === 'basic') {
      if (!formData.examProvider) newErrors.examProvider = '模試提供元を選択してください'
      if (!formData.examName) newErrors.examName = '模試名を入力してください'
      if (!formData.examDate) newErrors.examDate = '実施日を選択してください'
    } else if (tabName === 'overall') {
      if (formData.totalScore > formData.totalMaxScore) {
        newErrors.totalScore = '総得点が満点を超えています'
      }
      if (formData.totalMaxScore === 0) {
        newErrors.totalMaxScore = '満点を入力してください'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // タブ切り替え時の処理
  const handleTabChange = (value: string) => {
    // 現在のタブのバリデーション
    if (validateTab(activeTab)) {
      if (!completedSteps.includes(activeTab)) {
        setCompletedSteps([...completedSteps, activeTab])
      }
    }
    setActiveTab(value)
  }

  // 前へ/次へナビゲーション
  const navigateToPrevious = () => {
    const tabs = ['basic', 'overall', 'subjects', 'assessment']
    const currentIndex = tabs.indexOf(activeTab)
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1])
    }
  }

  const navigateToNext = () => {
    const tabs = ['basic', 'overall', 'subjects', 'assessment']
    const currentIndex = tabs.indexOf(activeTab)
    
    if (validateTab(activeTab)) {
      if (!completedSteps.includes(activeTab)) {
        setCompletedSteps([...completedSteps, activeTab])
      }
      if (currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1])
      }
    }
  }

  // 画像アップロード処理
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('画像サイズは5MB以下にしてください')
        return
      }
      
      setUploadedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  // 科目追加
  const addSubject = () => {
    setFormData((prev: any) => ({
      ...prev,
      subjectResults: [...prev.subjectResults, {
        subject: '',
        score: 0,
        maxScore: 100,
        deviation: 50
      }]
    }))
  }

  // 科目削除
  const removeSubject = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      subjectResults: prev.subjectResults.filter((_: any, i: number) => i !== index)
    }))
  }

  // 科目データ更新
  const updateSubject = (index: number, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      subjectResults: prev.subjectResults.map((subject: any, i: number) => 
        i === index ? { ...subject, [field]: value } : subject
      )
    }))
  }

  // 大学判定追加
  const addUniversity = () => {
    setFormData((prev: any) => ({
      ...prev,
      universityAssessments: [...prev.universityAssessments, {
        universityName: '',
        department: '',
        assessment: 'C',
        probability: 50
      }]
    }))
  }

  // 大学判定削除
  const removeUniversity = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      universityAssessments: prev.universityAssessments.filter((_: any, i: number) => i !== index)
    }))
  }

  // 大学判定データ更新
  const updateUniversity = (index: number, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      universityAssessments: prev.universityAssessments.map((uni: any, i: number) => 
        i === index ? { ...uni, [field]: value } : uni
      )
    }))
  }

  // フォーム送信処理
  const handleSubmit = async () => {
    // 全タブのバリデーション
    const allValid = ['basic', 'overall'].every(tab => validateTab(tab))
    
    if (!allValid) {
      alert('必須項目を入力してください')
      return
    }

    setIsSubmitting(true)
    try {
      // 実際の保存処理をここに実装
      console.log('Submitting:', formData)
      
      // 成功メッセージ
      alert('模試結果を正常に保存しました')
      
      // フォームをリセット
      setFormData({
        examProvider: '',
        examName: '',
        examDate: null,
        examType: 'comprehensive',
        totalScore: 0,
        totalMaxScore: 0,
        deviation: 0,
        nationalRank: 1,
        totalParticipants: 1,
        subjectResults: [],
        universityAssessments: [],
      })
      setCompletedSteps([])
      setActiveTab('basic')
      setUploadedImage(null)
      setUploadedFile(null)
    } catch (error) {
      alert('保存中にエラーが発生しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const tabs = [
    { value: 'basic', label: '基本情報', icon: FileText },
    { value: 'overall', label: '総合結果', icon: Calculator },
    { value: 'subjects', label: '科目別', icon: FileText },
    { value: 'assessment', label: '大学判定', icon: School },
  ]

  return (
    <>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.cardContent}>
            <div style={{ marginBottom: '16px' }}>
              <h1 style={styles.title}>模試結果入力</h1>
              <p style={styles.description}>
                外部模試の結果を入力してください
              </p>
            </div>

            {/* 進捗インジケーター */}
            <div style={styles.progressContainer}>
              {['基本', '総合', '科目', '判定'].map((label, index) => (
                <React.Fragment key={index}>
                  <div style={styles.progressStep}>
                    <div style={{
                      ...styles.progressCircle,
                      ...(index < getCurrentStep() ? styles.progressCircleCompleted : {}),
                      ...(index === getCurrentStep() ? styles.progressCircleActive : {})
                    }}>
                      {index < getCurrentStep() ? <CheckCircle style={{ width: '14px', height: '14px' }} /> : index + 1}
                    </div>
                  </div>
                  {index < 3 && (
                    <div style={{
                      ...styles.progressLine,
                      ...(index < getCurrentStep() ? styles.progressLineCompleted : {})
                    }} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* タブ */}
            <div style={styles.tabContainer}>
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.value
                const isCompleted = completedSteps.includes(tab.value)
                
                return (
                  <button
                    key={tab.value}
                    style={{
                      ...styles.tab,
                      ...(isActive ? styles.tabActive : {}),
                      ...(isCompleted && !isActive ? styles.tabCompleted : {})
                    }}
                    onClick={() => handleTabChange(tab.value)}
                  >
                    <Icon style={styles.tabIcon} />
                    <span style={styles.tabLabel}>{tab.label}</span>
                    {isCompleted && !isActive && (
                      <CheckCircle style={styles.completedMark} />
                    )}
                  </button>
                )
              })}
            </div>

            {/* 基本情報タブ */}
            {activeTab === 'basic' && (
              <div style={styles.sectionContainer}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      模試提供元 <span style={styles.required}>*</span>
                    </label>
                    <select
                      value={formData.examProvider}
                      onChange={(e) => updateFormData('examProvider', e.target.value)}
                      style={{
                        ...styles.select,
                        ...(errors.examProvider ? styles.inputError : {}),
                        ...(focusedInput === 'examProvider' ? styles.inputFocus : {})
                      }}
                      onFocus={() => setFocusedInput('examProvider')}
                      onBlur={() => setFocusedInput(null)}
                    >
                      <option value="">選択してください</option>
                      {EXAM_PROVIDERS.map((provider) => (
                        <option key={provider.value} value={provider.value}>
                          {provider.label}
                        </option>
                      ))}
                    </select>
                    {errors.examProvider && (
                      <p style={styles.errorText}>{errors.examProvider}</p>
                    )}
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      模試名 <span style={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.examName}
                      onChange={(e) => updateFormData('examName', e.target.value)}
                      placeholder="例: 全統記述模試"
                      list="exam-names"
                      style={{
                        ...styles.input,
                        ...(errors.examName ? styles.inputError : {}),
                        ...(focusedInput === 'examName' ? styles.inputFocus : {})
                      }}
                      onFocus={() => setFocusedInput('examName')}
                      onBlur={() => setFocusedInput(null)}
                    />
                    <datalist id="exam-names">
                      {formData.examProvider && 
                        COMMON_EXAM_NAMES[formData.examProvider as keyof typeof COMMON_EXAM_NAMES]?.map((name) => (
                          <option key={name} value={name} />
                        ))
                      }
                    </datalist>
                    {errors.examName && (
                      <p style={styles.errorText}>{errors.examName}</p>
                    )}
                  </div>

                  <div style={{ ...styles.formGroup, position: 'relative' }}>
                    <label style={styles.label}>
                      実施日 <span style={styles.required}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCalendar(!showCalendar)}
                      style={{
                        ...styles.dateButton,
                        ...(errors.examDate ? styles.inputError : {}),
                        ...(focusedInput === 'examDate' ? styles.inputFocus : {})
                      }}
                      onFocus={() => setFocusedInput('examDate')}
                      onBlur={() => setFocusedInput(null)}
                    >
                      <span style={{ color: formData.examDate ? '#2d3436' : '#9ca3af' }}>
                        {formData.examDate ? formatDate(formData.examDate) : '日付を選択'}
                      </span>
                      <Calendar style={{ width: '14px', height: '14px', color: '#9ca3af' }} />
                    </button>
                    {showCalendar && (
                      <div style={styles.datePickerPopup}>
                        <input
                          type="date"
                          onChange={(e) => {
                            const date = new Date(e.target.value)
                            updateFormData('examDate', date)
                            setShowCalendar(false)
                          }}
                          style={{ ...styles.input, marginBottom: 0 }}
                        />
                      </div>
                    )}
                    {errors.examDate && (
                      <p style={styles.errorText}>{errors.examDate}</p>
                    )}
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      模試タイプ <span style={styles.required}>*</span>
                    </label>
                    <select
                      value={formData.examType}
                      onChange={(e) => updateFormData('examType', e.target.value)}
                      style={{
                        ...styles.select,
                        ...(focusedInput === 'examType' ? styles.inputFocus : {})
                      }}
                      onFocus={() => setFocusedInput('examType')}
                      onBlur={() => setFocusedInput(null)}
                    >
                      <option value="comprehensive">総合模試</option>
                      <option value="subject_specific">科目別模試</option>
                    </select>
                  </div>
                </div>

                <div style={styles.uploadSection}>
                  <label style={styles.label}>
                    成績表の画像（任意）
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    style={styles.uploadButton}
                  >
                    <Upload style={{ width: '14px', height: '14px' }} />
                    画像を選択
                  </button>
                  {uploadedImage && (
                    <span style={styles.uploadSuccess}>
                      画像が選択されました
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 総合結果タブ */}
            {activeTab === 'overall' && (
              <div style={styles.sectionContainer}>
                <div style={{ ...styles.sectionHeader, ...styles.sectionHeaderPurple }}>
                  <h3 style={{ ...styles.sectionTitle, ...styles.sectionTitlePurple }}>総合成績</h3>
                  <p style={{ ...styles.sectionDescription }}>
                    模試全体の成績を入力
                  </p>
                </div>

                <div style={styles.formGrid}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        得点 <span style={styles.required}>*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.totalScore}
                        onChange={(e) => updateFormData('totalScore', Number(e.target.value))}
                        placeholder="0"
                        style={{
                          ...styles.input,
                          ...(errors.totalScore ? styles.inputError : {}),
                          ...(focusedInput === 'totalScore' ? styles.inputFocus : {})
                        }}
                        onFocus={() => setFocusedInput('totalScore')}
                        onBlur={() => setFocusedInput(null)}
                      />
                      {errors.totalScore && (
                        <p style={styles.errorText}>{errors.totalScore}</p>
                      )}
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>
                        満点 <span style={styles.required}>*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.totalMaxScore}
                        onChange={(e) => updateFormData('totalMaxScore', Number(e.target.value))}
                        placeholder="0"
                        style={{
                          ...styles.input,
                          ...(errors.totalMaxScore ? styles.inputError : {}),
                          ...(focusedInput === 'totalMaxScore' ? styles.inputFocus : {})
                        }}
                        onFocus={() => setFocusedInput('totalMaxScore')}
                        onBlur={() => setFocusedInput(null)}
                      />
                      {errors.totalMaxScore && (
                        <p style={styles.errorText}>{errors.totalMaxScore}</p>
                      )}
                    </div>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>
                      偏差値 <span style={styles.required}>*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.deviation}
                      onChange={(e) => updateFormData('deviation', Number(e.target.value))}
                      placeholder="50.0"
                      style={{
                        ...styles.input,
                        ...(focusedInput === 'deviation' ? styles.inputFocus : {})
                      }}
                      onFocus={() => setFocusedInput('deviation')}
                      onBlur={() => setFocusedInput(null)}
                    />
                    <p style={{ fontSize: '10px', color: '#636e72', marginTop: '2px' }}>
                      総合偏差値を入力（0-100）
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>全国順位</label>
                      <input
                        type="number"
                        value={formData.nationalRank}
                        onChange={(e) => updateFormData('nationalRank', Number(e.target.value))}
                        placeholder="1"
                        style={{
                          ...styles.input,
                          ...(focusedInput === 'nationalRank' ? styles.inputFocus : {})
                        }}
                        onFocus={() => setFocusedInput('nationalRank')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>受験者数</label>
                      <input
                        type="number"
                        value={formData.totalParticipants}
                        onChange={(e) => updateFormData('totalParticipants', Number(e.target.value))}
                        placeholder="1"
                        style={{
                          ...styles.input,
                          ...(focusedInput === 'totalParticipants' ? styles.inputFocus : {})
                        }}
                        onFocus={() => setFocusedInput('totalParticipants')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 科目別タブ */}
            {activeTab === 'subjects' && (
              <div style={styles.sectionContainer}>
                <div style={{ ...styles.sectionHeader, ...styles.sectionHeaderBlue }}>
                  <h3 style={{ ...styles.sectionTitle, ...styles.sectionTitleBlue }}>科目別成績</h3>
                  <p style={{ ...styles.sectionDescription }}>
                    各科目の成績を入力
                  </p>
                </div>

                {formData.subjectResults.map((subject: any, index: number) => (
                  <div key={index} style={styles.subjectCard}>
                    <button
                      type="button"
                      onClick={() => removeSubject(index)}
                      style={styles.deleteButton}
                    >
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                    </button>

                    <div style={{ paddingRight: '24px' }}>
                      <div style={styles.formGroup}>
                        <label style={{ ...styles.label, fontSize: '11px' }}>科目</label>
                        <select
                          value={subject.subject}
                          onChange={(e) => updateSubject(index, 'subject', e.target.value)}
                          style={{ ...styles.select, fontSize: '13px' }}
                        >
                          <option value="">選択</option>
                          {SUBJECTS.map((subj) => (
                            <option key={subj.value} value={subj.value}>
                              {subj.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                        <div>
                          <label style={{ ...styles.label, fontSize: '10px' }}>得点</label>
                          <input
                            type="number"
                            value={subject.score}
                            onChange={(e) => updateSubject(index, 'score', Number(e.target.value))}
                            placeholder="0"
                            style={{ ...styles.input, fontSize: '13px' }}
                          />
                        </div>

                        <div>
                          <label style={{ ...styles.label, fontSize: '10px' }}>満点</label>
                          <input
                            type="number"
                            value={subject.maxScore}
                            onChange={(e) => updateSubject(index, 'maxScore', Number(e.target.value))}
                            placeholder="100"
                            style={{ ...styles.input, fontSize: '13px' }}
                          />
                        </div>

                        <div>
                          <label style={{ ...styles.label, fontSize: '10px' }}>偏差値</label>
                          <input
                            type="number"
                            step="0.1"
                            value={subject.deviation}
                            onChange={(e) => updateSubject(index, 'deviation', Number(e.target.value))}
                            placeholder="50.0"
                            style={{ ...styles.input, fontSize: '13px' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addSubject}
                  style={styles.addButton}
                >
                  <Plus style={{ width: '14px', height: '14px' }} />
                  科目を追加
                </button>
              </div>
            )}

            {/* 大学判定タブ */}
            {activeTab === 'assessment' && (
              <div style={styles.sectionContainer}>
                <div style={{ ...styles.sectionHeader, ...styles.sectionHeaderGreen }}>
                  <h3 style={{ ...styles.sectionTitle, ...styles.sectionTitleGreen }}>大学判定結果</h3>
                  <p style={{ ...styles.sectionDescription }}>
                    志望大学の判定結果
                  </p>
                </div>

                {formData.universityAssessments.map((uni: any, index: number) => (
                  <div key={index} style={styles.subjectCard}>
                    <button
                      type="button"
                      onClick={() => removeUniversity(index)}
                      style={styles.deleteButton}
                    >
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                    </button>

                    <div style={{ paddingRight: '24px' }}>
                      <div style={styles.formGroup}>
                        <label style={{ ...styles.label, fontSize: '11px' }}>大学名</label>
                        <input
                          type="text"
                          value={uni.universityName}
                          onChange={(e) => updateUniversity(index, 'universityName', e.target.value)}
                          placeholder="例: 東京大学"
                          style={{ ...styles.input, fontSize: '13px' }}
                        />
                      </div>

                      <div style={styles.formGroup}>
                        <label style={{ ...styles.label, fontSize: '11px' }}>学部</label>
                        <input
                          type="text"
                          value={uni.department}
                          onChange={(e) => updateUniversity(index, 'department', e.target.value)}
                          placeholder="例: 理科一類"
                          style={{ ...styles.input, fontSize: '13px' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <div>
                          <label style={{ ...styles.label, fontSize: '10px' }}>判定</label>
                          <select
                            value={uni.assessment}
                            onChange={(e) => updateUniversity(index, 'assessment', e.target.value)}
                            style={{ ...styles.select, fontSize: '13px' }}
                          >
                            {['A', 'B', 'C', 'D', 'E'].map((grade) => (
                              <option key={grade} value={grade}>
                                {grade}判定
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ ...styles.label, fontSize: '10px' }}>合格率(%)</label>
                          <input
                            type="number"
                            value={uni.probability}
                            onChange={(e) => updateUniversity(index, 'probability', Number(e.target.value))}
                            placeholder="50"
                            style={{ ...styles.input, fontSize: '13px' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addUniversity}
                  style={styles.addButton}
                >
                  <Plus style={{ width: '14px', height: '14px' }} />
                  大学判定を追加
                </button>
              </div>
            )}

            {/* ナビゲーションボタン */}
            <div style={styles.navigationButtons}>
              <button
                type="button"
                onClick={navigateToPrevious}
                disabled={getTabIndex(activeTab) === 0}
                style={{
                  ...styles.navButton,
                  ...(getTabIndex(activeTab) === 0 ? styles.navButtonDisabled : {})
                }}
              >
                <ChevronLeft style={{ width: '14px', height: '14px' }} />
                前へ
              </button>

              <button
                type="button"
                onClick={navigateToNext}
                disabled={getTabIndex(activeTab) === 3}
                style={{
                  ...styles.navButton,
                  ...(getTabIndex(activeTab) === 3 ? styles.navButtonDisabled : {})
                }}
              >
                次へ
                <ChevronRight style={{ width: '14px', height: '14px' }} />
              </button>
            </div>

            {/* アクションバー */}
            <div style={styles.actionBar}>
              <div style={styles.actionBarButtons}>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('入力内容をリセットしますか？')) {
                      setFormData({
                        examProvider: '',
                        examName: '',
                        examDate: null,
                        examType: 'comprehensive',
                        totalScore: 0,
                        totalMaxScore: 0,
                        deviation: 0,
                        nationalRank: 1,
                        totalParticipants: 1,
                        subjectResults: [],
                        universityAssessments: [],
                      })
                      setCompletedSteps([])
                      setActiveTab('basic')
                    }
                  }}
                  style={styles.button}
                >
                  リセット
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  style={styles.button}
                >
                  <Eye style={{ width: '14px', height: '14px' }} />
                  プレビュー
                </button>
              </div>
              <button 
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{
                  ...styles.button,
                  ...styles.buttonPrimary,
                  ...styles.buttonFullWidth,
                  ...(isSubmitting ? styles.buttonDisabled : {})
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save style={{ width: '14px', height: '14px' }} />
                    保存する
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* プレビューモーダル */}
      {showPreview && (
        <div style={styles.modal} onClick={() => setShowPreview(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>入力内容のプレビュー</h2>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.previewSection}>
                <h3 style={styles.previewTitle}>基本情報</h3>
                <div style={styles.previewGrid}>
                  <div style={styles.previewItem}>
                    <span style={styles.previewLabel}>模試提供元</span>
                    <span style={styles.previewValue}>
                      {EXAM_PROVIDERS.find(p => p.value === formData.examProvider)?.label || '-'}
                    </span>
                  </div>
                  <div style={styles.previewItem}>
                    <span style={styles.previewLabel}>模試名</span>
                    <span style={styles.previewValue}>{formData.examName || '-'}</span>
                  </div>
                  <div style={styles.previewItem}>
                    <span style={styles.previewLabel}>実施日</span>
                    <span style={styles.previewValue}>
                      {formData.examDate ? formatDate(formData.examDate) : '-'}
                    </span>
                  </div>
                  <div style={styles.previewItem}>
                    <span style={styles.previewLabel}>模試タイプ</span>
                    <span style={styles.previewValue}>
                      {formData.examType === 'comprehensive' ? '総合模試' : '科目別模試'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ ...styles.previewSection, backgroundColor: '#f0f4ff' }}>
                <h3 style={styles.previewTitle}>総合結果</h3>
                <div style={styles.previewGrid}>
                  <div style={styles.previewItem}>
                    <span style={styles.previewLabel}>総得点</span>
                    <span style={styles.previewValue}>
                      {formData.totalScore} / {formData.totalMaxScore}
                    </span>
                  </div>
                  <div style={styles.previewItem}>
                    <span style={styles.previewLabel}>偏差値</span>
                    <span style={styles.previewValue}>{formData.deviation}</span>
                  </div>
                  <div style={styles.previewItem}>
                    <span style={styles.previewLabel}>全国順位</span>
                    <span style={styles.previewValue}>
                      {formData.nationalRank} / {formData.totalParticipants}
                    </span>
                  </div>
                </div>
              </div>

              {formData.subjectResults.length > 0 && (
                <div style={{ ...styles.previewSection, backgroundColor: '#e6f2ff' }}>
                  <h3 style={styles.previewTitle}>科目別結果</h3>
                  <div style={{ marginTop: '8px' }}>
                    {formData.subjectResults.map((subject: any, index: number) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '6px 0',
                        borderBottom: index < formData.subjectResults.length - 1 ? '1px solid #e9ecef' : 'none',
                        fontSize: '11px'
                      }}>
                        <span style={{ fontWeight: '500' }}>
                          {SUBJECTS.find(s => s.value === subject.subject)?.label || '-'}
                        </span>
                        <span style={{ color: '#636e72' }}>
                          {subject.score}/{subject.maxScore} (偏差値: {subject.deviation})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.universityAssessments.length > 0 && (
                <div style={{ ...styles.previewSection, backgroundColor: '#e8f8f0' }}>
                  <h3 style={styles.previewTitle}>大学判定</h3>
                  <div style={{ marginTop: '8px' }}>
                    {formData.universityAssessments.map((uni: any, index: number) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '6px 0',
                        borderBottom: index < formData.universityAssessments.length - 1 ? '1px solid #e9ecef' : 'none',
                        fontSize: '11px'
                      }}>
                        <span style={{ fontWeight: '500' }}>
                          {uni.universityName} {uni.department}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{
                            ...styles.assessmentBadge,
                            ...(uni.assessment === 'A' ? styles.assessmentA :
                                uni.assessment === 'B' ? styles.assessmentB :
                                uni.assessment === 'C' ? styles.assessmentC :
                                uni.assessment === 'D' ? styles.assessmentD :
                                styles.assessmentE)
                          }}>
                            {uni.assessment}判定
                          </span>
                          <span style={{ color: '#636e72', fontSize: '10px' }}>
                            ({uni.probability}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '16px' }}>
                <button
                  onClick={() => setShowPreview(false)}
                  style={styles.closeButton}
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}