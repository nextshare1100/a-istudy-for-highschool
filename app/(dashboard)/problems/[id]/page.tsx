'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import AnswerForm from '@/components/AnswerForm'
import { 
  ArrowLeft, 
  BookOpen, 
  Brain, 
  CheckCircle, 
  XCircle,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowRight,
  Home,
  Plus,
  List
} from 'lucide-react'

// 難易度の表示設定
const DIFFICULTY_CONFIG = {
  easy: { label: '基礎', color: '#10b981', bgColor: '#d1fae5', textColor: '#065f46', icon: '🌱' },
  medium: { label: '標準', color: '#3b82f6', bgColor: '#dbeafe', textColor: '#1e40af', icon: '📘' },
  normal: { label: '標準', color: '#3b82f6', bgColor: '#dbeafe', textColor: '#1e40af', icon: '📘' },
  hard: { label: '発展', color: '#dc2626', bgColor: '#fee2e2', textColor: '#991b1b', icon: '🔥' }
}

interface Problem {
  id: string
  subject: string
  gradeLevel?: number
  unit?: string
  difficulty: string
  question: string
  options?: string[]
  sequences?: string[]
  type?: string
  correctAnswer: number | string | string[]
  explanation: string | any
  targetDeviation?: number
  format?: string  // 問題形式（normal/selective）
  requiredCount?: number  // 選択式の場合の必要数
  unnecessaryOptions?: string[]  // 不要な選択肢のラベル
}

export default function ProblemDetailPage() {
  const router = useRouter()
  const params = useParams()
  const problemId = params.id as string
  
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  const [isSavingResult, setIsSavingResult] = useState(false)
  const [resultSaved, setResultSaved] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login')
        return
      }
      setCurrentUser(user)
    })

    return () => unsubscribe()
  }, [router])

  // 問題データの取得
  useEffect(() => {
    const loadProblem = async () => {
      if (!problemId) return
      
      try {
        const docRef = doc(db, 'problems', problemId)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const problemData = {
            id: docSnap.id,
            ...docSnap.data()
          } as Problem
          
          // デバッグ用ログ
          console.log('=== Problem Data Debug ===')
          console.log('Full problem data:', problemData)
          console.log('Problem type:', problemData.type)
          console.log('Problem options:', problemData.options)
          console.log('Problem sequences:', problemData.sequences)
          console.log('Correct answer:', problemData.correctAnswer)
          console.log('UserId:', problemData.userId)
          console.log('CreatedBy:', problemData.createdBy)
          console.log('========================')
          
          setProblem(problemData)
        } else {
          console.error('問題が見つかりません')
        }
      } catch (error) {
        console.error('問題取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProblem()
  }, [problemId])

  // 解答結果を保存
  const saveResult = async () => {
    if (!currentUser || !problem || selectedAnswer === null || resultSaved) return
    
    setIsSavingResult(true)
    const isCorrect = checkAnswer(selectedAnswer, problem.correctAnswer)
    
    try {
      await addDoc(collection(db, 'users', currentUser.uid, 'attempts'), {
        problemId: problem.id,
        subject: problem.subject,
        difficulty: problem.difficulty,
        unit: problem.unit || '',
        selectedAnswer: selectedAnswer,
        correctAnswer: problem.correctAnswer,
        isCorrect: isCorrect,
        attemptedAt: serverTimestamp(),
        timeSpent: null,
        targetDeviation: problem.targetDeviation || null,
        problemType: problem.type || 'multiple_choice'
      })
      
      setResultSaved(true)
      console.log('解答結果を保存しました')
    } catch (error) {
      console.error('解答結果の保存に失敗しました:', error)
    } finally {
      setIsSavingResult(false)
    }
  }

  // 答え合わせ
  const checkAnswer = (userAnswer: any, correctAnswer: any): boolean => {
    if (!problem) return false

    switch (problem.type) {
      case 'multiple_choice':
        return userAnswer === correctAnswer
      
      case 'fill_in_blank':
        if (Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
          return correctAnswer.every((correct, index) => 
            correct.toLowerCase().trim() === userAnswer[index]?.toLowerCase().trim()
          )
        }
        return false
      
      case 'solution_sequence':
      case 'sentence_sequence':
      case 'event_sequence':
        // 文字列形式の答え（例: "D, A, B, C, E"）を比較
        return userAnswer === correctAnswer
      
      case 'essay':
        // 論述問題は自動採点なし
        return true
      
      default:
        return userAnswer === correctAnswer
    }
  }

  const handleAnswerSubmit = async (answer: any) => {
    setSelectedAnswer(answer)
    setShowAnswer(true)
    setShowExplanation(true)
    await saveResult()
  }

  const handleReset = () => {
    setSelectedAnswer(null)
    setShowAnswer(false)
    setShowExplanation(false)
    setResultSaved(false)
  }

  // 同じ条件で新しい問題を生成
  const generateSameProblem = async () => {
    if (!problem || !currentUser || isGenerating) return
    
    // 認証状態を再確認
    const user = auth.currentUser
    if (!user) {
      alert('ログインが必要です。ページを再読み込みしてください。')
      router.push('/login')
      return
    }
    
    setIsGenerating(true)
    
    try {
      // 問題生成APIを呼び出す
      const response = await fetch('/api/ai/generate-problem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: problem.subject,
          topic: problem.unit || problem.subject,
          difficulty: problem.difficulty,
          problemType: problem.type || 'multiple_choice',
          includeCanvas: false,
          additionalRequirements: '',
          subjectName: problem.subject
        }),
      })

      if (!response.ok) {
        throw new Error('問題生成に失敗しました')
      }

      // Server-Sent Eventsでストリーミングレスポンスを処理
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      let generatedData: any = {
        question: '',
        options: [],
        correctAnswer: '',
        explanation: '',
        type: problem.type || 'multiple_choice'
      }

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              switch (data.status) {
                case 'question_ready':
                  generatedData.question = data.question
                  if (data.format) {
                    generatedData.format = data.format
                  }
                  break
                  
                case 'options_ready':
                  generatedData.options = data.options
                  if (data.format === 'selective') {
                    generatedData.format = 'selective'
                    generatedData.requiredCount = data.requiredCount
                    generatedData.unnecessaryOptions = data.unnecessaryOptions
                  }
                  break
                  
                case 'answer_ready':
                  generatedData.correctAnswer = data.answer
                  break
                  
                case 'explanation_ready':
                  generatedData.explanation = data.explanation
                  break
                  
                case 'complete':
                  // 問題生成完了
                  break
                  
                case 'error':
                  throw new Error(data.error || '問題生成エラー')
              }
            } catch (e) {
              console.error('JSONパースエラー:', e)
            }
          }
        }
      }

      // Firestoreに保存する前に再度認証確認
      const currentAuth = auth.currentUser
      if (!currentAuth) {
        throw new Error('認証が切れています。再度ログインしてください。')
      }

      // Firestoreに保存
      const problemData: any = {
        subject: problem.subject,
        unit: problem.unit || '',
        difficulty: problem.difficulty,
        question: generatedData.question,
        options: generatedData.options || [],
        type: problem.type || 'multiple_choice',
        correctAnswer: generatedData.correctAnswer,
        explanation: generatedData.explanation,
        userId: currentAuth.uid,
        createdBy: currentAuth.uid, // セキュリティルールに合わせて追加
        createdAt: serverTimestamp()
      }
      
      // nullやundefinedを除外
      if (problem.targetDeviation !== null && problem.targetDeviation !== undefined) {
        problemData.targetDeviation = problem.targetDeviation
      }
      
      if (problem.gradeLevel !== null && problem.gradeLevel !== undefined) {
        problemData.gradeLevel = problem.gradeLevel
      }
      
      // 選択式並び替え問題の場合のみ追加
      if (generatedData.format === 'selective') {
        problemData.format = 'selective'
        if (generatedData.requiredCount !== undefined) {
          problemData.requiredCount = generatedData.requiredCount
        }
        if (generatedData.unnecessaryOptions !== undefined) {
          problemData.unnecessaryOptions = generatedData.unnecessaryOptions
        }
      }
      
      console.log('Saving problem data:', problemData)
      
      const docRef = await addDoc(collection(db, 'problems'), problemData)
      
      // 新しい問題のデータをセット
      const newProblem = {
        id: docRef.id,
        ...problemData,
        createdAt: new Date() // Timestampの代わりにDateを使用
      } as Problem
      
      // 状態をリセットして新しい問題を表示
      setProblem(newProblem)
      setSelectedAnswer(null)
      setShowAnswer(false)
      setShowExplanation(false)
      setResultSaved(false)
      
      // URLを新しい問題のIDに更新（ページ遷移なし）
      window.history.pushState(null, '', `/problems/${docRef.id}`)
      
    } catch (error) {
      console.error('問題生成エラー:', error)
      if (error instanceof Error && error.message.includes('permissions')) {
        alert('問題の保存権限がありません。管理者にお問い合わせください。')
      } else if (error instanceof Error && error.message.includes('認証')) {
        alert(error.message)
        router.push('/login')
      } else {
        alert('問題の生成に失敗しました。もう一度お試しください。')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const formatCorrectAnswer = () => {
    if (!problem) return ''
    
    switch (problem.type) {
      case 'multiple_choice':
        return problem.options?.[problem.correctAnswer as number] || ''
      
      case 'fill_in_blank':
        if (Array.isArray(problem.correctAnswer)) {
          return problem.correctAnswer.join(', ')
        }
        return problem.correctAnswer
      
      case 'solution_sequence':
      case 'sentence_sequence':
      case 'event_sequence':
        // 正解の順序（例: "D, A, B, C, E"）を表示
        return `正しい順序: ${problem.correctAnswer}`
      
      default:
        return problem.correctAnswer
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
          <p className="text-gray-600">問題を読み込んでいます...</p>
        </div>
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">問題が見つかりません</h2>
          <p className="text-gray-600 mb-4">この問題は存在しないか、削除された可能性があります。</p>
          <button
            onClick={() => router.push('/problems')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all"
          >
            <ArrowLeft size={16} />
            問題一覧に戻る
          </button>
        </div>
      </div>
    )
  }

  const isCorrect = checkAnswer(selectedAnswer, problem.correctAnswer)
  const difficultyConfig = DIFFICULTY_CONFIG[problem.difficulty as keyof typeof DIFFICULTY_CONFIG] || DIFFICULTY_CONFIG.medium

  return (
    <>
      <style jsx global>{`
        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        
        .detail-content {
          padding: 16px;
          max-width: 1000px;
          margin: 0 auto;
          min-height: 100vh;
          background: linear-gradient(to bottom, #f0f9ff, #ffffff, #faf5ff);
        }
        
        @media (min-width: 768px) {
          .detail-content {
            padding: 20px;
          }
        }
        
        .detail-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 12px;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .back-button:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
        
        .difficulty-badge {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 500;
        }
        
        .problem-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          margin-bottom: 16px;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        @media (min-width: 768px) {
          .problem-card {
            padding: 24px;
            border-radius: 16px;
          }
        }
        
        .problem-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .subject-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .subject-text {
          flex: 1;
        }
        
        .subject-name {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 2px;
        }
        
        .subject-unit {
          font-size: 12px;
          color: #6b7280;
        }
        
        .question-text {
          font-size: 15px;
          font-weight: 500;
          color: #111827;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        
        @media (min-width: 768px) {
          .question-text {
            font-size: 16px;
            margin-bottom: 24px;
          }
        }
        
        .action-buttons {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-top: 16px;
          flex-wrap: wrap;
        }
        
        .secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 16px;
          background: white;
          color: #374151;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          flex: 1;
          min-width: 120px;
        }
        
        .secondary-button:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
        
        @media (min-width: 768px) {
          .secondary-button {
            font-size: 14px;
            padding: 10px 20px;
          }
        }
        
        .result-card {
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .result-card.correct {
          background: #d1fae5;
          border: 2px solid #10b981;
        }
        
        .result-card.incorrect {
          background: #fee2e2;
          border: 2px solid #ef4444;
        }
        
        .result-icon {
          flex-shrink: 0;
        }
        
        .result-content {
          flex: 1;
        }
        
        .result-title {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 2px;
        }
        
        .result-card.correct .result-title {
          color: #065f46;
        }
        
        .result-card.incorrect .result-title {
          color: #991b1b;
        }
        
        .result-text {
          font-size: 12px;
          white-space: pre-wrap;
        }
        
        .result-card.correct .result-text {
          color: #047857;
        }
        
        .result-card.incorrect .result-text {
          color: #dc2626;
        }
        
        .explanation-card {
          background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
          border: 2px solid #3b82f6;
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 16px;
        }
        
        .explanation-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        
        .explanation-icon {
          width: 32px;
          height: 32px;
          background: #3b82f6;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .explanation-title {
          font-size: 15px;
          font-weight: 700;
          color: #1e40af;
        }
        
        .explanation-text {
          font-size: 13px;
          color: #1e3a8a;
          line-height: 1.5;
          white-space: pre-wrap;
        }
        
        @media (min-width: 768px) {
          .explanation-text {
            font-size: 14px;
          }
        }
        
        .explanation-section {
          margin-bottom: 12px;
        }
        
        .explanation-section:last-child {
          margin-bottom: 0;
        }
        
        .explanation-label {
          font-weight: 600;
          margin-bottom: 2px;
          color: #1e40af;
          font-size: 12px;
        }
        
        .meta-info {
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
          margin-top: 20px;
        }
        
        .navigation-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          margin-top: 20px;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        @media (min-width: 768px) {
          .navigation-card {
            padding: 24px;
            border-radius: 16px;
          }
        }
        
        .navigation-title {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 16px;
          text-align: center;
        }
        
        .navigation-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        
        @media (min-width: 768px) {
          .navigation-buttons {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          }
        }
        
        .nav-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 12px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        @media (min-width: 768px) {
          .nav-button {
            padding: 12px 16px;
            font-size: 14px;
            gap: 8px;
          }
        }
        
        .nav-button:hover {
          background: #f9fafb;
          border-color: #667eea;
          color: #667eea;
          transform: translateY(-1px);
        }
        
        .nav-button.primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
        }
        
        .nav-button.primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .save-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #d1fae5;
          color: #065f46;
          border-radius: 6px;
          font-size: 11px;
          margin-top: 12px;
        }
        
        /* 選択肢表示のモバイル対応 */
        .options-container {
          background: linear-gradient(to right, #f0f9ff, #f5f3ff);
          border: 2px solid #e0e7ff;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
        }
        
        .options-header {
          font-size: 12px;
          font-weight: 600;
          color: #4338ca;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .selective-notice {
          background: linear-gradient(to right, #fef3c7, #fde68a);
          border: 2px solid #fbbf24;
          border-radius: 6px;
          padding: 8px;
          margin-bottom: 10px;
        }
        
        .selective-notice-title {
          font-size: 10px;
          font-weight: 600;
          color: #92400e;
          margin-bottom: 2px;
        }
        
        .selective-notice-text {
          font-size: 10px;
          color: #78350f;
        }
        
        .option-item {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          padding: 8px 10px;
          background: white;
          borderRadius: 6px;
          border: 1px solid #e5e7eb;
          position: relative;
          margin-bottom: 6px;
        }
        
        .option-item:last-child {
          margin-bottom: 0;
        }
        
        .option-label {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          borderRadius: 4px;
          fontWeight: 600;
          fontSize: 10px;
          flexShrink: 0;
        }
        
        .option-text {
          fontSize: 11px;
          color: #374151;
          lineHeight: 1.4;
          flex: 1;
        }
        
        .unnecessary-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          background: #ef4444;
          color: white;
          fontSize: 10px;
          padding: 2px 6px;
          borderRadius: 4px;
          fontWeight: 600;
        }
      `}</style>

      <div className="detail-content">
        <div className="detail-header">
          <button className="back-button" onClick={() => router.push('/problems')}>
            <ArrowLeft size={14} />
            問題一覧に戻る
          </button>
          
          <span 
            className="difficulty-badge" 
            style={{ 
              backgroundColor: difficultyConfig.bgColor,
              color: difficultyConfig.textColor
            }}
          >
            {difficultyConfig.icon} {difficultyConfig.label}
          </span>
        </div>

        <div className="problem-card">
          <div className="problem-info">
            <div className="subject-icon">
              <BookOpen size={18} />
            </div>
            <div className="subject-text">
              <h2 className="subject-name">{problem.subject}</h2>
              {problem.unit && (
                <p className="subject-unit">単元: {problem.unit}</p>
              )}
            </div>
          </div>
          
          <h3 className="question-text">{problem.question}</h3>
          
          {/* 並び替え問題の選択肢表示 */}
          {['solution_sequence', 'sentence_sequence', 'event_sequence'].includes(problem.type || '') && 
           problem.options && problem.options.length > 0 && (
            <div className="options-container">
              <h4 className="options-header">
                📋 選択肢
              </h4>
              
              {/* 選択式の場合の注意事項 */}
              {problem.format === 'selective' && problem.requiredCount && (
                <div className="selective-notice">
                  <p className="selective-notice-title">
                    ⚠️ 注意：選択式問題です
                  </p>
                  <p className="selective-notice-text">
                    以下の選択肢から<strong>{problem.requiredCount}個</strong>を選んで、正しい順序に並び替えてください。
                    {problem.unnecessaryOptions && problem.unnecessaryOptions.length > 0 && (
                      <span style={{ display: 'block', marginTop: '2px', fontSize: '10px' }}>
                        （不要な選択肢が{problem.unnecessaryOptions.length}個含まれています）
                      </span>
                    )}
                  </p>
                </div>
              )}
              
              <div>
                {problem.options.map((option, index) => (
                  <div
                    key={index}
                    className="option-item"
                    style={{
                      opacity: problem.unnecessaryOptions?.includes(String.fromCharCode(65 + index)) && showAnswer ? 0.5 : 1
                    }}
                  >
                    <span className="option-label">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="option-text">
                      {option}
                    </span>
                    {/* 不要な選択肢の表示（解答後） */}
                    {showAnswer && problem.unnecessaryOptions?.includes(String.fromCharCode(65 + index)) && (
                      <span className="unnecessary-badge">
                        不要
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* AnswerFormコンポーネントを使用 */}
          {!showAnswer && (
            <AnswerForm
              problem={problem}
              onSubmit={handleAnswerSubmit}
              disabled={showAnswer}
            />
          )}
        </div>

        {/* 結果表示 */}
        {showAnswer && (
          <>
            <div className={`result-card ${isCorrect ? 'correct' : 'incorrect'}`}>
              <div className="result-icon">
                {isCorrect ? (
                  <CheckCircle size={24} color="#10b981" />
                ) : (
                  <XCircle size={24} color="#ef4444" />
                )}
              </div>
              <div className="result-content">
                <h4 className="result-title">
                  {isCorrect ? '正解です！' : '不正解'}
                </h4>
                <p className="result-text">
                  {isCorrect 
                    ? 'よくできました。次の問題にも挑戦してみましょう。' 
                    : `正解:\n${formatCorrectAnswer()}`
                  }
                </p>
              </div>
            </div>
            
            {resultSaved && (
              <div className="save-indicator">
                <CheckCircle size={12} />
                解答結果を保存しました
              </div>
            )}

            {/* アクションボタン */}
            <div className="action-buttons">
              <button
                onClick={handleReset}
                className="secondary-button"
              >
                <RefreshCw size={14} />
                もう一度解く
              </button>
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="secondary-button"
              >
                {showExplanation ? <EyeOff size={14} /> : <Eye size={14} />}
                解説を{showExplanation ? '隠す' : '見る'}
              </button>
            </div>
          </>
        )}

        {/* 解説 */}
        {showExplanation && problem.explanation && (
          <div className="explanation-card">
            <div className="explanation-header">
              <div className="explanation-icon">
                <Brain size={18} />
              </div>
              <h4 className="explanation-title">解説</h4>
            </div>
            <div className="explanation-text">
              {typeof problem.explanation === 'string' ? (
                problem.explanation
              ) : problem.explanation && typeof problem.explanation === 'object' ? (
                <>
                  {problem.explanation.overview && (
                    <div className="explanation-section">
                      <div className="explanation-label">概要:</div>
                      {problem.explanation.overview}
                    </div>
                  )}
                  {problem.explanation.solution && (
                    <div className="explanation-section">
                      <div className="explanation-label">解法:</div>
                      {problem.explanation.solution}
                    </div>
                  )}
                  {problem.explanation.keyPoints && (
                    <div className="explanation-section">
                      <div className="explanation-label">重要ポイント:</div>
                      {problem.explanation.keyPoints}
                    </div>
                  )}
                  {problem.explanation.commonMistakes && (
                    <div className="explanation-section">
                      <div className="explanation-label">よくある間違い:</div>
                      {typeof problem.explanation.commonMistakes === 'string' ? (
                        problem.explanation.commonMistakes
                      ) : (
                        <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                          {JSON.stringify(problem.explanation.commonMistakes, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                  {problem.explanation.extensions && (
                    <div className="explanation-section">
                      <div className="explanation-label">発展:</div>
                      {problem.explanation.extensions}
                    </div>
                  )}
                </>
              ) : (
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {JSON.stringify(problem.explanation, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* ナビゲーション */}
        {showAnswer && (
          <div className="navigation-card">
            <h3 className="navigation-title">次のアクション</h3>
            <div className="navigation-buttons">
              <button
                onClick={() => router.push('/problems')}
                className="nav-button"
              >
                <Home size={16} />
                問題一覧へ
              </button>
              
              <button
                onClick={() => router.push('/problems/create')}
                className="nav-button primary"
              >
                <Plus size={16} />
                新規作成
              </button>
              
              <button
                onClick={generateSameProblem}
                disabled={isGenerating}
                className="nav-button"
                style={{
                  opacity: isGenerating ? 0.7 : 1,
                  cursor: isGenerating ? 'not-allowed' : 'pointer'
                }}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <BookOpen size={16} />
                    同じ単元
                  </>
                )}
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="nav-button"
              >
                <RefreshCw size={16} />
                再挑戦
              </button>
            </div>
          </div>
        )}

        {/* 問題情報（デバッグ用） */}
        {problem.targetDeviation && (
          <div className="meta-info">
            目標偏差値: {problem.targetDeviation} | 学年レベル: {problem.gradeLevel || '-'}
          </div>
        )}
      </div>
    </>
  )
}