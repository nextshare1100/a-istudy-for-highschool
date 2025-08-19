'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { getUserProfile } from '@/lib/firebase/firestore'
import { 
  createStudySession, 
  addProblemToSession, 
  recordAnswer,
  completeStudySession,
  StudyProblem 
} from '@/lib/ai/study-session'
import { Button } from '@/components/ui/button'
import { 
  Brain, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  BookOpen,
  Target,
  Loader2,
  Home,
  BarChart
} from 'lucide-react'

interface Problem extends StudyProblem {
  subject: string;
  grade: number;
  type: string;
}

export default function StudyPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [sessionId, setSessionId] = useState<string>('')
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [loading, setLoading] = useState(false)
  const [problemStartTime, setProblemStartTime] = useState<number>(0)
  const [sessionStats, setSessionStats] = useState({
    totalProblems: 0,
    correctAnswers: 0,
    totalTime: 0
  })
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login')
        return
      }
      
      setCurrentUser(user)
      const profile = await getUserProfile(user.uid)
      if (profile) {
        setUserProfile(profile)
        if (profile.subjects.length > 0 && !selectedSubject) {
          setSelectedSubject(profile.subjects[0])
        }
      }
    })

    return () => unsubscribe()
  }, [router, selectedSubject])

  // 学習セッションの開始
  const startSession = async () => {
    if (!selectedSubject || !currentUser) return

    try {
      const newSessionId = await createStudySession(currentUser.uid, selectedSubject)
      setSessionId(newSessionId)
      setSessionStats({ totalProblems: 0, correctAnswers: 0, totalTime: 0 })
      generateNewProblem(newSessionId)
    } catch (error) {
      console.error('セッション開始エラー:', error)
    }
  }

  // 新しい問題を生成
  const generateNewProblem = async (currentSessionId?: string) => {
    setLoading(true)
    setShowResult(false)
    setSelectedAnswer('')
    
    try {
      const response = await fetch('/api/ai/generate-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject,
          grade: userProfile?.grade || 1,
          difficulty: 'basic'
        })
      })

      const data = await response.json()
      
      if (data.success && data.problem) {
        const problem = data.problem
        setCurrentProblem(problem)
        setProblemStartTime(Date.now())
        
        // セッションに問題を追加
        if (currentSessionId || sessionId) {
          await addProblemToSession(currentSessionId || sessionId, {
            question: problem.question,
            choices: problem.choices,
            correctAnswer: problem.answer,
            explanation: problem.explanation,
            topic: problem.topic,
            difficulty: problem.difficulty
          })
        }
      }
    } catch (error) {
      console.error('問題生成エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  // 回答を送信
  const submitAnswer = async () => {
    if (!selectedAnswer || !currentProblem || !sessionId) return

    const timeSpent = Math.floor((Date.now() - problemStartTime) / 1000)
    
    try {
      const correct = await recordAnswer(
        sessionId,
        currentProblem.id,
        selectedAnswer,
        timeSpent
      )
      
      setIsCorrect(correct)
      setShowResult(true)
      
      // 統計を更新
      setSessionStats(prev => ({
        totalProblems: prev.totalProblems + 1,
        correctAnswers: prev.correctAnswers + (correct ? 1 : 0),
        totalTime: prev.totalTime + timeSpent
      }))
    } catch (error) {
      console.error('回答記録エラー:', error)
    }
  }

  // セッションを終了
  const endSession = async () => {
    if (!sessionId) return

    try {
      await completeStudySession(sessionId)
      router.push('/home')
    } catch (error) {
      console.error('セッション終了エラー:', error)
    }
  }

  if (!userProfile || !userProfile.subjects.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">学習科目が設定されていません</p>
          <Button onClick={() => router.push('/profile')}>
            プロファイル設定へ
          </Button>
        </div>
      </div>
    )
  }

  const accuracy = sessionStats.totalProblems > 0
    ? Math.round((sessionStats.correctAnswers / sessionStats.totalProblems) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI学習モード
          </h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/home')}
              className="flex items-center gap-2"
            >
              <Home size={16} />
              ホーム
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/study/history')}
              className="flex items-center gap-2"
            >
              <BarChart size={16} />
              学習履歴
            </Button>
          </div>
        </div>

        {/* 科目選択 */}
        {!sessionId && (
          <div className="card-custom mb-6 fade-in">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="text-blue-500" size={20} />
              学習する科目を選択
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {userProfile.subjects.map((subject: string) => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedSubject === subject
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
            <Button
              onClick={startSession}
              disabled={!selectedSubject}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Brain className="mr-2" size={20} />
              学習を開始
            </Button>
          </div>
        )}

        {/* 学習セッション */}
        {sessionId && (
          <>
            {/* セッション統計 */}
            <div className="grid grid-cols-3 gap-[10px] mb-6">
              <div className="card-custom text-center fade-in">
                <p className="text-2xl font-bold text-gray-800">
                  {sessionStats.totalProblems}
                </p>
                <p className="text-sm text-gray-600">問題数</p>
              </div>
              <div className="card-custom text-center fade-in" style={{animationDelay: '0.1s'}}>
                <p className="text-2xl font-bold text-green-600">
                  {accuracy}%
                </p>
                <p className="text-sm text-gray-600">正答率</p>
              </div>
              <div className="card-custom text-center fade-in" style={{animationDelay: '0.2s'}}>
                <p className="text-2xl font-bold text-gray-800">
                  {Math.floor(sessionStats.totalTime / 60)}:{(sessionStats.totalTime % 60).toString().padStart(2, '0')}
                </p>
                <p className="text-sm text-gray-600">学習時間</p>
              </div>
            </div>

            {/* 問題表示 */}
            <div className="card-custom fade-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Target className="text-purple-500" size={20} />
                  {selectedSubject}の問題
                </h2>
                {currentProblem && (
                  <span className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                    {currentProblem.topic}
                  </span>
                )}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                  <p className="text-gray-600">問題を生成中...</p>
                </div>
              ) : currentProblem ? (
                <>
                  <div className="mb-6">
                    <p className="text-lg mb-4">{currentProblem.question}</p>
                    
                    {currentProblem.choices && (
                      <div className="space-y-3">
                        {currentProblem.choices.map((choice, index) => (
                          <button
                            key={index}
                            onClick={() => !showResult && setSelectedAnswer(choice.split(')')[0])}
                            disabled={showResult}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                              showResult
                                ? choice.startsWith(currentProblem.correctAnswer)
                                  ? 'border-green-500 bg-green-50'
                                  : selectedAnswer === choice.split(')')[0]
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-gray-200'
                                : selectedAnswer === choice.split(')')[0]
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {choice}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {!showResult ? (
                    <Button
                      onClick={submitAnswer}
                      disabled={!selectedAnswer}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      回答する
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      {/* 結果表示 */}
                      <div className={`p-4 rounded-lg ${
                        isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {isCorrect ? (
                            <>
                              <CheckCircle className="text-green-600" size={24} />
                              <span className="font-semibold text-green-600">正解！</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="text-red-600" size={24} />
                              <span className="font-semibold text-red-600">不正解</span>
                            </>
                          )}
                        </div>
                        <p className="text-gray-700">{currentProblem.explanation}</p>
                      </div>

                      {/* アクションボタン */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={() => generateNewProblem()}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                        >
                          <RefreshCw className="mr-2" size={16} />
                          次の問題
                        </Button>
                        <Button
                          variant="outline"
                          onClick={endSession}
                          className="flex-1"
                        >
                          学習を終了
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-600">
                  問題を読み込んでいます...
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}