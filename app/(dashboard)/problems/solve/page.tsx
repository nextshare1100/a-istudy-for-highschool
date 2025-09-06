'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase/config'
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Brain,
  BookOpen,
  Target,
  TrendingUp,
  Award,
  RefreshCw,
  ChevronRight,
  Shuffle,
  AlertCircle,
  FileText,
  Languages
} from 'lucide-react'

// 統合された問題型定義
interface Problem {
  id: string
  createdBy?: string
  creatorId?: string
  creatorName?: string
  subject: string
  grade?: number
  difficulty: string
  topic: string
  type: string // 'multiple_choice' | 'fill_in_blank' | 'solution_sequence' | 'sentence_sequence' | 'event_sequence' | 'reading_comprehension' | 'vocabulary'
  problemType?: string // 旧形式の互換性
  question: string
  
  // 選択問題用
  options?: string[]
  choices?: string[] // 旧形式の互換性
  correctAnswer: string | string[]
  
  // 穴埋め問題用
  formulaTemplate?: string
  formulaBlanks?: string[]
  answer?: string | string[]
  
  // 並び替え問題用
  sequences?: string[]
  solutionSteps?: string[] // 旧形式の互換性
  
  // 長文読解用
  passageTitle?: string
  passageText?: string
  
  // 語彙問題用
  vocabularyType?: string
  targetWord?: string
  
  // 共通
  explanation: string
  hints?: string[]
  
  // メタデータ
  metadata?: {
    targetDeviationValue?: number
    difficultyLevel?: string
    categoryName?: string
    subjectName?: string
  }
}

interface StudyResult {
  correct: boolean
  timeSpent: number
  userAnswer: string | string[]
  attempts: number
}

export default function SolveProblemPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // 回答状態
  const [userAnswer, setUserAnswer] = useState('')
  const [userAnswers, setUserAnswers] = useState<string[]>([]) // 穴埋め用
  const [selectedChoice, setSelectedChoice] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  
  // タイマー
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)
  
  // 並び替え問題用
  const [shuffledItems, setShuffledItems] = useState<string[]>([])
  const [orderedItems, setOrderedItems] = useState<string[]>([])
  
  const router = useRouter()
  const params = useParams()
  const problemId = params?.id as string | undefined

  // 問題タイプの正規化
  const getProblemType = (problem: Problem): string => {
    return problem.type || problem.problemType || 'multiple_choice'
  }

  // キーワード抽出関数
  const extractKeywords = (explanation: string): string[] => {
    const keywords: string[] = []
    
    const quotedTerms = explanation.match(/「([^」]+)」/g)
    if (quotedTerms) {
      keywords.push(...quotedTerms.map(term => term.replace(/[「」]/g, '')))
    }
    
    const importantPatterns = [
      /[ぁ-んァ-ヶー一-龠０-９ａ-ｚＡ-Ｚ]+(?:法|定理|原理|効果|現象|反応|構造|機能|システム|理論)/g,
      /[A-Za-z]+[A-Za-z0-9]*/g,
    ]
    
    importantPatterns.forEach(pattern => {
      const matches = explanation.match(pattern)
      if (matches) {
        keywords.push(...matches.filter(m => m.length > 2))
      }
    })
    
    return [...new Set(keywords)].slice(0, 8)
  }

  // タイマー更新
  useEffect(() => {
    if (!submitted) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [startTime, submitted])

  // 問題の取得
  useEffect(() => {
    if (!problemId) return

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login')
        return
      }
      
      setCurrentUser(user)
      
      try {
        // まず通常の problems コレクションから取得を試みる
        let problemDoc = await getDoc(doc(db, 'problems', problemId))
        
        // 存在しない場合は customProblems コレクションから取得
        if (!problemDoc.exists()) {
          problemDoc = await getDoc(doc(db, 'customProblems', problemId))
        }
        
        if (!problemDoc.exists()) {
          setError('問題が見つかりません')
          setLoading(false)
          return
        }
        
        const problemData = { id: problemDoc.id, ...problemDoc.data() } as Problem
        setProblem(problemData)
        
        const problemType = getProblemType(problemData)
        
        // 並び替え問題の場合、項目をシャッフル
        if (['solution_sequence', 'sentence_sequence', 'event_sequence', 'solution-order'].includes(problemType)) {
          const items = problemData.sequences || problemData.solutionSteps || []
          const shuffled = [...items].sort(() => Math.random() - 0.5)
          setShuffledItems(shuffled)
        }
        
        // 穴埋め問題の場合、回答配列を初期化
        if (['fill_in_blank', 'formula-fill'].includes(problemType)) {
          const blanksCount = problemData.answer instanceof Array ? problemData.answer.length : 
                              problemData.formulaBlanks ? problemData.formulaBlanks.length : 0
          setUserAnswers(new Array(blanksCount).fill(''))
        }
        
        setStartTime(Date.now())
        setLoading(false)
      } catch (error) {
        console.error('問題の取得エラー:', error)
        setError('問題の読み込みに失敗しました')
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [problemId, router])

  // 時間のフォーマット
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 回答のチェック
  const checkAnswer = () => {
    if (!problem) return false
    
    const problemType = getProblemType(problem)
    
    switch (problemType) {
      case 'multiple_choice':
      case 'multiple-choice':
      case 'reading_comprehension':
      case 'vocabulary':
        return selectedChoice === problem.correctAnswer
        
      case 'descriptive':
        return false // 自己採点
        
      case 'fill_in_blank':
      case 'formula-fill':
        const correctAnswers = problem.answer instanceof Array ? problem.answer : 
                              problem.formulaBlanks || []
        return correctAnswers.every((answer, index) => 
          userAnswers[index]?.trim().toLowerCase() === answer.toLowerCase()
        )
        
      case 'solution_sequence':
      case 'sentence_sequence':
      case 'event_sequence':
      case 'solution-order':
        const correctSequence = problem.sequences || problem.solutionSteps || []
        return JSON.stringify(orderedItems) === JSON.stringify(correctSequence)
        
      default:
        return false
    }
  }

  // 回答を提出
  const handleSubmit = async () => {
    if (!problem || !currentUser) return
    
    const correct = checkAnswer()
    setIsCorrect(correct)
    setSubmitted(true)
    setAttempts(attempts + 1)
    
    try {
      const problemType = getProblemType(problem)
      const studySession: StudyResult = {
        correct,
        timeSpent: elapsedTime,
        userAnswer: ['multiple_choice', 'reading_comprehension', 'vocabulary'].includes(problemType) ? selectedChoice :
                    problemType === 'descriptive' ? userAnswer :
                    ['fill_in_blank', 'formula-fill'].includes(problemType) ? userAnswers :
                    orderedItems,
        attempts: attempts + 1
      }
      
      await addDoc(collection(db, 'studySessions'), {
        userId: currentUser.uid,
        problemId: problem.id,
        problemType: problemType,
        subject: problem.subject,
        topic: problem.topic,
        difficulty: problem.difficulty,
        ...studySession,
        createdAt: serverTimestamp()
      })
    } catch (error) {
      console.error('学習記録の保存エラー:', error)
    }
    
    if (correct) {
      setTimeout(() => setShowExplanation(true), 1000)
    }
  }

  // もう一度挑戦
  const handleRetry = () => {
    setSubmitted(false)
    setIsCorrect(false)
    setShowExplanation(false)
    setSelectedChoice('')
    setUserAnswer('')
    const problemType = getProblemType(problem!)
    if (['fill_in_blank', 'formula-fill'].includes(problemType)) {
      const blanksCount = problem?.answer instanceof Array ? problem.answer.length :
                         problem?.formulaBlanks ? problem.formulaBlanks.length : 0
      setUserAnswers(new Array(blanksCount).fill(''))
    }
    setOrderedItems([])
    setStartTime(Date.now())
  }

  // 並び替え問題の操作
  const addToOrder = (item: string) => {
    if (!orderedItems.includes(item)) {
      setOrderedItems([...orderedItems, item])
    }
  }

  const removeFromOrder = (index: number) => {
    setOrderedItems(orderedItems.filter((_, i) => i !== index))
  }

  // 穴埋め問題のテンプレート表示
  const renderFillInBlankTemplate = () => {
    if (!problem) return null
    
    if (problem.question.includes('____') || problem.question.includes('□')) {
      // 問題文に空欄が含まれている場合
      const parts = problem.question.split(/____|\□/)
      return (
        <div className="p-4 bg-gray-50 rounded-lg">
          {parts.map((part, index) => (
            <span key={index}>
              {part}
              {index < parts.length - 1 && (
                <input
                  type="text"
                  value={userAnswers[index] || ''}
                  onChange={(e) => {
                    const newAnswers = [...userAnswers]
                    newAnswers[index] = e.target.value
                    setUserAnswers(newAnswers)
                  }}
                  disabled={submitted}
                  className={`inline-block mx-1 px-3 py-1 rounded border-2 ${
                    submitted
                      ? userAnswers[index]?.trim().toLowerCase() === 
                        (problem.answer instanceof Array ? problem.answer[index] : '').toLowerCase()
                        ? 'border-green-500 bg-green-100'
                        : 'border-red-500 bg-red-100'
                      : 'border-blue-300 bg-yellow-100'
                  } ${submitted ? 'cursor-not-allowed' : ''}`}
                  style={{ width: '120px' }}
                />
              )}
            </span>
          ))}
        </div>
      )
    } else if (problem.formulaTemplate) {
      // 旧形式の互換性
      return (
        <div className="p-4 bg-gray-50 rounded-lg font-mono text-lg">
          {problem.formulaTemplate.split(/\[|\]/).map((part, index) => (
            <span key={index}>
              {index % 2 === 0 ? (
                part
              ) : (
                <input
                  type="text"
                  value={userAnswers[Math.floor(index / 2)] || ''}
                  onChange={(e) => {
                    const newAnswers = [...userAnswers]
                    newAnswers[Math.floor(index / 2)] = e.target.value
                    setUserAnswers(newAnswers)
                  }}
                  disabled={submitted}
                  className={`inline-block mx-1 px-3 py-1 rounded border-2 ${
                    submitted
                      ? userAnswers[Math.floor(index / 2)]?.trim().toLowerCase() === 
                        (problem.formulaBlanks?.[Math.floor(index / 2)] || '').toLowerCase()
                        ? 'border-green-500 bg-green-100'
                        : 'border-red-500 bg-red-100'
                      : 'border-blue-300 bg-yellow-100'
                  } ${submitted ? 'cursor-not-allowed' : ''}`}
                  style={{ width: '80px' }}
                />
              )}
            </span>
          ))}
        </div>
      )
    } else {
      // 通常の入力フィールド
      return (
        <div className="space-y-2">
          {userAnswers.map((answer, index) => (
            <div key={index}>
              <Label>空欄{index + 1}</Label>
              <Input
                type="text"
                value={answer}
                onChange={(e) => {
                  const newAnswers = [...userAnswers]
                  newAnswers[index] = e.target.value
                  setUserAnswers(newAnswers)
                }}
                disabled={submitted}
                className={submitted
                  ? answer.trim().toLowerCase() === 
                    (problem.answer instanceof Array ? problem.answer[index] : '').toLowerCase()
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : ''
                }
              />
            </div>
          ))}
        </div>
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>問題を読み込んでいます...</p>
        </div>
      </div>
    )
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <p className="text-red-600 mb-4">{error || '問題が見つかりません'}</p>
          <Button onClick={() => router.push('/problems')}>
            問題一覧に戻る
          </Button>
        </div>
      </div>
    )
  }

  const problemType = getProblemType(problem)

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6 fade-in">
          <Button
            variant="outline"
            onClick={() => router.push('/problems')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            問題一覧
          </Button>
          
          {!submitted && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={20} />
              <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
            </div>
          )}
        </div>

        {/* 問題情報 */}
        <div className="card-custom mb-6 fade-in">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
              {problem.metadata?.subjectName || problem.subject}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
              {problem.topic}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
              {problem.difficulty === 'easy' ? '基礎' : 
               problem.difficulty === 'medium' || problem.difficulty === 'normal' ? '標準' : '発展'}
            </span>
            {problem.metadata?.targetDeviationValue && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                偏差値 {problem.metadata.targetDeviationValue}
              </span>
            )}
            {problem.vocabularyType && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                <Languages size={14} className="inline mr-1" />
                {problem.vocabularyType === 'kanji' ? '漢字' :
                 problem.vocabularyType === 'kobun' ? '古文' :
                 problem.vocabularyType === 'kanbun' ? '漢文' :
                 problem.vocabularyType === 'english_word' ? '英単語' :
                 problem.vocabularyType === 'english_idiom' ? '英熟語' : 
                 problem.vocabularyType}
              </span>
            )}
          </div>
        </div>

        {/* 長文読解の場合、文章を表示 */}
        {problemType === 'reading_comprehension' && problem.passageText && (
          <div className="card-custom mb-6 fade-in" style={{animationDelay: '0.1s'}}>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FileText className="text-blue-500" size={24} />
              {problem.passageTitle || '文章'}
            </h2>
            <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
              <p className="text-base leading-relaxed whitespace-pre-wrap">{problem.passageText}</p>
            </div>
          </div>
        )}

        {/* 問題文 */}
        <div className="card-custom mb-6 fade-in" style={{animationDelay: '0.2s'}}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Brain className="text-blue-500" size={24} />
            問題
          </h2>
          <div className="text-lg leading-relaxed">
            {/* 語彙問題の場合、対象単語を強調 */}
            {problemType === 'vocabulary' && problem.targetWord ? (
              <p>
                {problem.question.split(problem.targetWord).map((part, index, array) => (
                  <span key={index}>
                    {part}
                    {index < array.length - 1 && (
                      <span className="font-bold text-blue-600 bg-blue-50 px-1 rounded">
                        {problem.targetWord}
                      </span>
                    )}
                  </span>
                ))}
              </p>
            ) : (
              <p>{problem.question}</p>
            )}
          </div>
        </div>

        {/* 回答エリア */}
        {!showExplanation && (
          <div className="card-custom mb-6 fade-in" style={{animationDelay: '0.3s'}}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="text-orange-500" size={20} />
              回答
            </h3>

            {/* 選択式・長文読解・語彙問題 */}
            {['multiple_choice', 'multiple-choice', 'reading_comprehension', 'vocabulary'].includes(problemType) && 
             (problem.options || problem.choices) && (
              <div className="space-y-3">
                {(problem.options || problem.choices || []).map((choice, index) => (
                  <button
                    key={index}
                    onClick={() => !submitted && setSelectedChoice(choice)}
                    disabled={submitted}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      submitted
                        ? selectedChoice === choice
                          ? isCorrect
                            ? 'border-green-500 bg-green-50'
                            : 'border-red-500 bg-red-50'
                          : problem.correctAnswer === choice
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        : selectedChoice === choice
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                    } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className="font-medium">{choice}</span>
                    {submitted && problem.correctAnswer === choice && (
                      <CheckCircle className="inline-block ml-2 text-green-500" size={20} />
                    )}
                    {submitted && selectedChoice === choice && !isCorrect && (
                      <XCircle className="inline-block ml-2 text-red-500" size={20} />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* 記述式 */}
            {problemType === 'descriptive' && (
              <div>
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={submitted}
                  placeholder="回答を入力してください"
                  className="w-full p-3 border rounded-lg bg-white/50 min-h-[150px]"
                />
                {submitted && (
                  <p className="mt-2 text-sm text-gray-600">
                    記述式問題は自己採点です。解説を確認して理解度を確かめてください。
                  </p>
                )}
              </div>
            )}

            {/* 穴埋め */}
            {['fill_in_blank', 'formula-fill'].includes(problemType) && renderFillInBlankTemplate()}

            {/* 並び替え問題 */}
            {['solution_sequence', 'sentence_sequence', 'event_sequence', 'solution-order'].includes(problemType) && (
              <div className="grid md:grid-cols-2 gap-4">
                {/* 選択肢 */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Shuffle size={16} />
                    {problemType === 'sentence_sequence' ? '文の要素' :
                     problemType === 'event_sequence' ? '出来事' : '手順'}
                    （クリックして追加）
                  </h4>
                  <div className="space-y-2">
                    {shuffledItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => !submitted && addToOrder(item)}
                        disabled={submitted || orderedItems.includes(item)}
                        className={`w-full p-3 text-left rounded-lg border transition-all ${
                          orderedItems.includes(item)
                            ? 'border-gray-300 bg-gray-100 opacity-50'
                            : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                        } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className="text-sm">{item}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 回答 */}
                <div>
                  <h4 className="font-medium mb-2">
                    正しい順序（クリックして削除）
                  </h4>
                  <div className="space-y-2">
                    {orderedItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => !submitted && removeFromOrder(index)}
                        disabled={submitted}
                        className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                          submitted
                            ? item === (problem.sequences || problem.solutionSteps)?.[index]
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-500 bg-red-50'
                            : 'border-blue-500 bg-blue-50 hover:border-red-400'
                        } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className="font-bold mr-2">{index + 1}.</span>
                        <span className="text-sm">{item}</span>
                      </button>
                    ))}
                    {orderedItems.length === 0 && (
                      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                        上の{problemType === 'sentence_sequence' ? '要素' :
                             problemType === 'event_sequence' ? '出来事' : '手順'}をクリックして追加
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 提出ボタン・結果表示 */}
        {!showExplanation && (
          <div className="text-center mb-6 fade-in" style={{animationDelay: '0.4s'}}>
            {!submitted ? (
              <Button
                onClick={handleSubmit}
                disabled={
                  (['multiple_choice', 'multiple-choice', 'reading_comprehension', 'vocabulary'].includes(problemType) && !selectedChoice) ||
                  (problemType === 'descriptive' && !userAnswer.trim()) ||
                  (['fill_in_blank', 'formula-fill'].includes(problemType) && userAnswers.some(a => !a.trim())) ||
                  (['solution_sequence', 'sentence_sequence', 'event_sequence', 'solution-order'].includes(problemType) && orderedItems.length === 0)
                }
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 px-8 py-3 text-lg"
              >
                回答を提出
                <ChevronRight className="ml-2" size={20} />
              </Button>
            ) : (
              <div className="space-y-4">
                {/* 結果表示 */}
                <div className={`inline-flex items-center gap-3 px-6 py-4 rounded-lg ${
                  isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {isCorrect ? (
                    <>
                      <CheckCircle size={32} />
                      <div className="text-left">
                        <p className="text-2xl font-bold">正解！</p>
                        <p className="text-sm">素晴らしい！よくできました。</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle size={32} />
                      <div className="text-left">
                        <p className="text-2xl font-bold">
                          {problemType === 'descriptive' ? '回答を確認' : '不正解'}
                        </p>
                        <p className="text-sm">
                          {problemType === 'descriptive' 
                            ? '解説を読んで理解を深めましょう' 
                            : 'もう一度考えてみましょう'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* アクションボタン */}
                <div className="flex justify-center gap-3">
                  {!isCorrect && problemType !== 'descriptive' && (
                    <Button
                      variant="outline"
                      onClick={handleRetry}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw size={16} />
                      もう一度挑戦
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowExplanation(true)}
                    className="flex items-center gap-2"
                  >
                    <BookOpen size={16} />
                    解説を見る
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 解説 */}
        {showExplanation && (
          <div className="card-custom fade-in bg-gradient-to-r from-blue-50 to-purple-50">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="text-blue-500" size={20} />
              解説
            </h3>
            
            {/* 正解の表示 */}
            {submitted && (
              <div className="mb-4 p-4 bg-white/70 rounded-lg">
                <p className="font-medium mb-2">正解:</p>
                {['multiple_choice', 'multiple-choice', 'reading_comprehension', 'vocabulary'].includes(problemType) ? (
                  <p className="text-lg font-bold text-green-600">{problem.correctAnswer}</p>
                ) : ['fill_in_blank', 'formula-fill'].includes(problemType) ? (
                  <div className="space-y-1">
                    {(problem.answer instanceof Array ? problem.answer : problem.formulaBlanks || []).map((answer, index) => (
                      <p key={index} className="font-bold text-green-600">
                        空欄{index + 1}: {answer}
                      </p>
                    ))}
                  </div>
                ) : ['solution_sequence', 'sentence_sequence', 'event_sequence', 'solution-order'].includes(problemType) ? (
                  <ol className="space-y-2">
                    {(problem.sequences || problem.solutionSteps || []).map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="font-bold text-blue-600">{index + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </div>
            )}

            {/* 記述式問題のキーワード */}
            {problemType === 'descriptive' && (
              <div className="mb-6 space-y-4">
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Target className="text-yellow-600" size={18} />
                    解答に含めるべきキーワード
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {extractKeywords(problem.explanation).map((keyword, index) => (
                      <span key={index} className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ヒント */}
            {problem.hints && problem.hints.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">ヒント</h4>
                <ul className="space-y-1">
                  {problem.hints.map((hint, index) => (
                    <li key={index} className="text-sm">• {hint}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* 解説文 */}
            <div className="prose max-w-none">
              <h4 className="font-medium mb-2">詳細解説</h4>
              <p className="whitespace-pre-wrap">{problem.explanation}</p>
            </div>

            {/* 学習成果 */}
            <div className="mt-6 p-4 bg-white/70 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Award className="text-yellow-500" size={18} />
                学習成果
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">解答時間</p>
                  <p className="text-lg font-bold">{formatTime(elapsedTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">試行回数</p>
                  <p className="text-lg font-bold">{attempts}回</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">正答率</p>
                  <p className="text-lg font-bold">
                    {isCorrect ? '100%' : problemType === 'descriptive' ? '-' : '0%'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">難易度</p>
                  <p className="text-lg font-bold">
                    {problem.difficulty === 'easy' ? '基礎' : 
                     problem.difficulty === 'medium' || problem.difficulty === 'normal' ? '標準' : '発展'}
                  </p>
                </div>
              </div>
            </div>

            {/* 次のアクション */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/problems')}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                問題一覧に戻る
              </Button>
              <Button
                onClick={() => router.push('/problems/create')}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                <Brain size={16} />
                新しい問題を作成
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}