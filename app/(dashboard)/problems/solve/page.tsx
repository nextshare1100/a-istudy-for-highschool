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
  AlertCircle
} from 'lucide-react'

interface Problem {
  id: string
  creatorId: string
  creatorName: string
  subject: string
  grade: number
  difficulty: string
  topic: string
  problemType: 'multiple-choice' | 'descriptive' | 'formula-fill' | 'solution-order'
  question: string
  choices?: string[]
  correctAnswer: string
  formulaTemplate?: string
  formulaBlanks?: string[]
  solutionSteps?: string[]
  explanation: string
  metadata?: {
    targetDeviationValue?: number
    difficultyLevel?: string
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
  const [userAnswers, setUserAnswers] = useState<string[]>([]) // 穴埋め・並び替え用
  const [selectedChoice, setSelectedChoice] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  
  // タイマー
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [elapsedTime, setElapsedTime] = useState(0)
  
  // 並び替え問題用
  const [shuffledSteps, setShuffledSteps] = useState<string[]>([])
  const [orderedSteps, setOrderedSteps] = useState<string[]>([])
  
  const router = useRouter()
  const params = useParams()
  const problemId = params?.id as string | undefined

  // キーワード抽出関数（簡易版）
  const extractKeywords = (explanation: string): string[] => {
    // 解説文から重要そうなキーワードを抽出
    const keywords: string[] = []
    
    // 「」で囲まれた用語を抽出
    const quotedTerms = explanation.match(/「([^」]+)」/g)
    if (quotedTerms) {
      keywords.push(...quotedTerms.map(term => term.replace(/[「」]/g, '')))
    }
    
    // 重要そうな専門用語のパターン（例）
    const importantPatterns = [
      /[ぁ-んァ-ヶー一-龠０-９ａ-ｚＡ-Ｚ]+(?:法|定理|原理|効果|現象|反応|構造|機能|システム|理論)/g,
      /[A-Za-z]+[A-Za-z0-9]*/g, // 英語の専門用語
    ]
    
    importantPatterns.forEach(pattern => {
      const matches = explanation.match(pattern)
      if (matches) {
        keywords.push(...matches.filter(m => m.length > 2))
      }
    })
    
    // 重複を除去して返す
    return [...new Set(keywords)].slice(0, 8) // 最大8個まで
  }

  // 話の流れ抽出関数
  const extractFlowPoints = (explanation: string): string[] => {
    const points: string[] = []
    
    // 箇条書きや番号付きリストを探す
    const listPatterns = [
      /(?:①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩)(.+?)(?=(?:①|②|③|④|⑤|⑥|⑦|⑧|⑨|⑩)|$)/g,
      /(?:\d+[.)、])\s*(.+?)(?=(?:\d+[.)、])|$)/g,
      /(?:・|•|▪|▸)\s*(.+?)(?=(?:・|•|▪|▸)|$)/g,
    ]
    
    for (const pattern of listPatterns) {
      const matches = explanation.matchAll(pattern)
      for (const match of matches) {
        if (match[1]) {
          points.push(match[1].trim())
        }
      }
      if (points.length > 0) break
    }
    
    // リストが見つからない場合は、文を分割してポイントを抽出
    if (points.length === 0) {
      const sentences = explanation.split(/[。！？]/).filter(s => s.trim().length > 10)
      
      // キーとなる接続詞で始まる文を優先
      const keyPhrases = ['まず', '次に', 'そして', '最後に', 'したがって', 'つまり', 'よって', '結果']
      const keyPoints = sentences.filter(s => keyPhrases.some(phrase => s.includes(phrase)))
      
      if (keyPoints.length > 0) {
        points.push(...keyPoints.slice(0, 5))
      } else {
        // 最初の数文を使用
        points.push(...sentences.slice(0, 4))
      }
    }
    
    return points.map(p => p.replace(/^\s*[。、]/g, '').trim()).filter(p => p.length > 0)
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
    // problemIdが存在しない場合は早期リターン
    if (!problemId) {
      console.log('Problem ID is not available yet')
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login')
        return
      }
      
      setCurrentUser(user)
      
      try {
        console.log('Fetching problem with ID:', problemId)
        const problemDoc = await getDoc(doc(db, 'customProblems', problemId))
        
        if (!problemDoc.exists()) {
          setError('問題が見つかりません')
          setLoading(false)
          return
        }
        
        const problemData = { id: problemDoc.id, ...problemDoc.data() } as Problem
        setProblem(problemData)
        
        // 並び替え問題の場合、手順をシャッフル
        if (problemData.problemType === 'solution-order' && problemData.solutionSteps) {
          const shuffled = [...problemData.solutionSteps].sort(() => Math.random() - 0.5)
          setShuffledSteps(shuffled)
        }
        
        // 穴埋め問題の場合、回答配列を初期化
        if (problemData.problemType === 'formula-fill' && problemData.formulaBlanks) {
          setUserAnswers(new Array(problemData.formulaBlanks.length).fill(''))
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
    
    switch (problem.problemType) {
      case 'multiple-choice':
        return selectedChoice === problem.correctAnswer
        
      case 'descriptive':
        // 記述式は自己採点のため、ここでは常にfalseを返す
        return false
        
      case 'formula-fill':
        // すべての空欄が正解と一致するかチェック
        return problem.formulaBlanks?.every((blank, index) => 
          userAnswers[index]?.trim().toLowerCase() === blank.toLowerCase()
        ) || false
        
      case 'solution-order':
        // 手順の順序が正しいかチェック
        return JSON.stringify(orderedSteps) === JSON.stringify(problem.solutionSteps)
        
      default:
        return false
    }
  }

  // 回答を提出
  const handleSubmit = async () => {
    if (!problem || !currentUser) return
    
    // 回答チェック
    const correct = checkAnswer()
    setIsCorrect(correct)
    setSubmitted(true)
    setAttempts(attempts + 1)
    
    // 学習記録を保存
    try {
      const studySession: StudyResult = {
        correct,
        timeSpent: elapsedTime,
        userAnswer: problem.problemType === 'multiple-choice' ? selectedChoice : 
                    problem.problemType === 'descriptive' ? userAnswer :
                    problem.problemType === 'formula-fill' ? userAnswers :
                    orderedSteps,
        attempts: attempts + 1
      }
      
      await addDoc(collection(db, 'studySessions'), {
        userId: currentUser.uid,
        problemId: problem.id,
        problemType: problem.problemType,
        subject: problem.subject,
        topic: problem.topic,
        difficulty: problem.difficulty,
        ...studySession,
        createdAt: serverTimestamp()
      })
    } catch (error) {
      console.error('学習記録の保存エラー:', error)
    }
    
    // 正解の場合は自動的に解説を表示
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
    setUserAnswers(new Array(problem?.formulaBlanks?.length || 0).fill(''))
    setOrderedSteps([])
    setStartTime(Date.now())
  }

  // 並び替え問題の操作
  const addToOrder = (step: string) => {
    if (!orderedSteps.includes(step)) {
      setOrderedSteps([...orderedSteps, step])
    }
  }

  const removeFromOrder = (index: number) => {
    setOrderedSteps(orderedSteps.filter((_, i) => i !== index))
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
          
          {/* タイマー */}
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
              {problem.subject}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
              {problem.topic}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
              {problem.difficulty === 'easy' ? '基礎' : 
               problem.difficulty === 'normal' ? '標準' : '発展'}
            </span>
            {problem.metadata?.targetDeviationValue && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                偏差値 {problem.metadata.targetDeviationValue}
              </span>
            )}
          </div>
        </div>

        {/* 問題文 */}
        <div className="card-custom mb-6 fade-in" style={{animationDelay: '0.1s'}}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Brain className="text-blue-500" size={24} />
            問題
          </h2>
          <p className="text-lg leading-relaxed">{problem.question}</p>
        </div>

        {/* 回答エリア */}
        {!showExplanation && (
          <div className="card-custom mb-6 fade-in" style={{animationDelay: '0.2s'}}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="text-orange-500" size={20} />
              回答
            </h3>

            {/* 選択式 */}
            {problem.problemType === 'multiple-choice' && problem.choices && (
              <div className="space-y-3">
                {problem.choices.map((choice, index) => (
                  <button
                    key={index}
                    onClick={() => !submitted && setSelectedChoice(String.fromCharCode(65 + index))}
                    disabled={submitted}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      submitted
                        ? selectedChoice === String.fromCharCode(65 + index)
                          ? isCorrect
                            ? 'border-green-500 bg-green-50'
                            : 'border-red-500 bg-red-50'
                          : problem.correctAnswer === String.fromCharCode(65 + index)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        : selectedChoice === String.fromCharCode(65 + index)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                    } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className="font-medium">
                      {String.fromCharCode(65 + index)}) {choice}
                    </span>
                    {submitted && problem.correctAnswer === String.fromCharCode(65 + index) && (
                      <CheckCircle className="inline-block ml-2 text-green-500" size={20} />
                    )}
                    {submitted && selectedChoice === String.fromCharCode(65 + index) && !isCorrect && (
                      <XCircle className="inline-block ml-2 text-red-500" size={20} />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* 記述式 */}
            {problem.problemType === 'descriptive' && (
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

            {/* 公式穴埋め */}
            {problem.problemType === 'formula-fill' && problem.formulaTemplate && (
              <div>
                <div className="p-4 bg-gray-50 rounded-lg font-mono text-lg mb-4">
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
                                problem.formulaBlanks?.[Math.floor(index / 2)]?.toLowerCase()
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
                {submitted && problem.formulaBlanks && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium">正解:</p>
                    {problem.formulaBlanks.map((blank, index) => (
                      <span key={index} className="inline-block mr-4">
                        空欄{index + 1}: <span className="font-bold text-green-600">{blank}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 解法並び替え */}
            {problem.problemType === 'solution-order' && (
              <div className="grid md:grid-cols-2 gap-4">
                {/* 選択肢 */}
                <div>
                  <h4 className="font-medium mb-2">手順（クリックして追加）</h4>
                  <div className="space-y-2">
                    {shuffledSteps.map((step, index) => (
                      <button
                        key={index}
                        onClick={() => !submitted && addToOrder(step)}
                        disabled={submitted || orderedSteps.includes(step)}
                        className={`w-full p-3 text-left rounded-lg border transition-all ${
                          orderedSteps.includes(step)
                            ? 'border-gray-300 bg-gray-100 opacity-50'
                            : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                        } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {step}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 回答 */}
                <div>
                  <h4 className="font-medium mb-2">正しい順序（クリックして削除）</h4>
                  <div className="space-y-2">
                    {orderedSteps.map((step, index) => (
                      <button
                        key={index}
                        onClick={() => !submitted && removeFromOrder(index)}
                        disabled={submitted}
                        className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                          submitted
                            ? step === problem.solutionSteps?.[index]
                              ? 'border-green-500 bg-green-50'
                              : 'border-red-500 bg-red-50'
                            : 'border-blue-500 bg-blue-50 hover:border-red-400'
                        } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className="font-bold mr-2">{index + 1}.</span>
                        {step}
                      </button>
                    ))}
                    {orderedSteps.length === 0 && (
                      <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                        上の手順をクリックして追加
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
          <div className="text-center mb-6 fade-in" style={{animationDelay: '0.3s'}}>
            {!submitted ? (
              <Button
                onClick={handleSubmit}
                disabled={
                  (problem.problemType === 'multiple-choice' && !selectedChoice) ||
                  (problem.problemType === 'descriptive' && !userAnswer.trim()) ||
                  (problem.problemType === 'formula-fill' && userAnswers.some(a => !a.trim())) ||
                  (problem.problemType === 'solution-order' && orderedSteps.length === 0)
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
                          {problem.problemType === 'descriptive' ? '回答を確認' : '不正解'}
                        </p>
                        <p className="text-sm">
                          {problem.problemType === 'descriptive' 
                            ? '解説を読んで理解を深めましょう' 
                            : 'もう一度考えてみましょう'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* アクションボタン */}
                <div className="flex justify-center gap-3">
                  {!isCorrect && problem.problemType !== 'descriptive' && (
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
            
            {/* 記述式問題の場合：キーワードと話の流れ */}
            {problem.problemType === 'descriptive' && (
              <div className="mb-6 space-y-4">
                {/* キーワード */}
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

                {/* 話の流れ */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="text-blue-600" size={18} />
                    解答の流れ
                  </h4>
                  <ol className="space-y-2">
                    {extractFlowPoints(problem.explanation).map((point, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-200 text-blue-700 rounded-full text-xs flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        <span className="text-sm">{point}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* 自己採点のヒント */}
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle className="text-green-600" size={18} />
                    自己採点のポイント
                  </h4>
                  <ul className="space-y-1 text-sm">
                    <li>• 上記のキーワードが含まれているか確認</li>
                    <li>• 論理的な流れで説明できているか確認</li>
                    <li>• 問題で求められた内容に答えているか確認</li>
                  </ul>
                </div>
              </div>
            )}
            
            {/* 正解の表示（並び替え問題の場合） */}
            {problem.problemType === 'solution-order' && problem.solutionSteps && (
              <div className="mb-4 p-4 bg-white/70 rounded-lg">
                <p className="font-medium mb-2">正しい手順:</p>
                <ol className="space-y-2">
                  {problem.solutionSteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="font-bold text-blue-600">{index + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
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
                    {isCorrect ? '100%' : problem.problemType === 'descriptive' ? '-' : '0%'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">難易度</p>
                  <p className="text-lg font-bold">
                    {problem.difficulty === 'easy' ? '基礎' : 
                     problem.difficulty === 'normal' ? '標準' : '発展'}
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
              <Button
                onClick={() => router.push('/study')}
                className="flex items-center gap-2"
              >
                <TrendingUp size={16} />
                AI学習を続ける
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}