'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { 
  getMonthlyChallenge, 
  getMonthlyChallengeStatus, 
  startMonthlySession,
  completeMonthlySession,
  getMonthlyProgressSummary
} from '@/lib/firebase/monthlyChallenge'
import { getProblems } from '@/lib/firebase/firestore'
import { Problem } from '@/types'

interface ChallengeState {
  challenge: any
  status: any
  problems: Problem[]
  currentProblemIndex: number
  answers: number[]
  showResult: boolean
  isCorrect: boolean
  loading: boolean
  error: string | null
  sessionStarted: boolean
  questionsToday: number
  currentMilestone: string
  nextMilestone: any
}

export default function MonthlyChallengePage() {
  const params = useParams()
  const router = useRouter()
  const challengeId = params.id as string
  const [userId, setUserId] = useState<string | null>(null)
  
  const [state, setState] = useState<ChallengeState>({
    challenge: null,
    status: null,
    problems: [],
    currentProblemIndex: 0,
    answers: [],
    showResult: false,
    isCorrect: false,
    loading: true,
    error: null,
    sessionStarted: false,
    questionsToday: 0,
    currentMilestone: 'none',
    nextMilestone: null
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      setUserId(user.uid)
      await loadChallenge(user.uid)
    })

    return () => unsubscribe()
  }, [challengeId, router])

  const loadChallenge = async (uid: string) => {
    try {
      // チャレンジとステータスを取得
      const challenge = await getMonthlyChallenge(1, ['数学']) // 仮の値
      if (!challenge || challenge.id !== challengeId) {
        setState(prev => ({ ...prev, error: 'チャレンジが見つかりません', loading: false }))
        return
      }

      const status = await getMonthlyChallengeStatus(uid, challengeId)
      const summary = await getMonthlyProgressSummary(uid)

      // 今日の問題を取得（10問）
      const problems = await getProblems({
        subjects: challenge.subjects,
        limit: 10,
        excludeIds: status?.completedProblemIds || []
      })

      if (problems.length === 0) {
        setState(prev => ({ ...prev, error: '問題が見つかりません', loading: false }))
        return
      }

      setState(prev => ({
        ...prev,
        challenge,
        status,
        problems,
        questionsToday: summary?.questionsToday || 0,
        currentMilestone: status?.currentMilestone || 'none',
        nextMilestone: summary?.nextMilestone || null,
        loading: false
      }))
    } catch (error) {
      console.error('Error loading challenge:', error)
      setState(prev => ({ ...prev, error: 'チャレンジの読み込みに失敗しました', loading: false }))
    }
  }

  const startSession = async () => {
    if (!userId) return
    
    try {
      await startMonthlySession(userId, challengeId)
      setState(prev => ({ ...prev, sessionStarted: true }))
    } catch (error) {
      console.error('Error starting session:', error)
    }
  }

  const handleAnswer = (optionIndex: number) => {
    const currentProblem = state.problems[state.currentProblemIndex]
    const isCorrect = optionIndex === currentProblem.correctAnswer
    
    setState(prev => ({
      ...prev,
      answers: [...prev.answers, optionIndex],
      showResult: true,
      isCorrect
    }))
  }

  const nextProblem = () => {
    if (state.currentProblemIndex < state.problems.length - 1) {
      setState(prev => ({
        ...prev,
        currentProblemIndex: prev.currentProblemIndex + 1,
        showResult: false,
        isCorrect: false
      }))
    } else {
      completeSession()
    }
  }

  const completeSession = async () => {
    if (!userId) return
    
    try {
      const score = state.answers.filter((answer, index) => 
        answer === state.problems[index].correctAnswer
      ).length

      const result = await completeMonthlySession(
        userId,
        challengeId,
        state.problems.map(p => p.id!),
        score,
        300 // 5分（仮の値）
      )

      // 結果画面へ遷移
      router.push(`/problems/monthly-challenge/${challengeId}/result?score=${score}&total=${state.problems.length}&milestone=${result.currentMilestone}&xp=${result.xpEarned}`)
    } catch (error) {
      console.error('Error completing session:', error)
    }
  }

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-red-600 mb-4">エラー</h2>
          <p className="text-gray-600 mb-6">{state.error}</p>
          <button
            onClick={() => router.push('/home')}
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  if (!state.sessionStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <h1 className="text-3xl font-bold text-purple-600 mb-6">月間チャレンジ</h1>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">今月の進捗</span>
              <span className="font-bold">{state.status?.totalQuestions || 0}問</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">現在のランク</span>
              <span className="font-bold">
                {state.currentMilestone === 'none' ? '未達成' :
                 state.currentMilestone === 'bronze' ? '🥉 ブロンズ' :
                 state.currentMilestone === 'silver' ? '🥈 シルバー' :
                 state.currentMilestone === 'gold' ? '🥇 ゴールド' : '💎 プラチナ'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">今日の問題数</span>
              <span className="font-bold">{state.questionsToday}問</span>
            </div>
          </div>

          {state.nextMilestone && (
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-purple-600 mb-1">次の目標</p>
              <p className="font-bold text-lg">{state.nextMilestone.name}</p>
              <p className="text-sm text-gray-600">
                あと{state.nextMilestone.questionsNeeded}問で+{state.nextMilestone.xpReward}XP
              </p>
            </div>
          )}

          <button
            onClick={startSession}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-bold text-lg hover:from-purple-700 hover:to-blue-700 transition-all"
          >
            今日の10問を始める
          </button>
        </div>
      </div>
    )
  }

  const currentProblem = state.problems[state.currentProblemIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-2xl mx-auto p-4">
        {/* 進捗バー */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">問題 {state.currentProblemIndex + 1} / {state.problems.length}</span>
            <span className="text-purple-600 font-bold">
              今月: {(state.status?.totalQuestions || 0) + state.currentProblemIndex + 1}問目
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${((state.currentProblemIndex + 1) / state.problems.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 問題カード */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-medium mb-4">
              {currentProblem.subject}
            </span>
            <h2 className="text-xl font-bold text-gray-800 whitespace-pre-wrap">
              {currentProblem.question}
            </h2>
          </div>

          {/* 選択肢 */}
          <div className="space-y-3">
            {currentProblem.options.map((option, index) => (
              <button
                key={index}
                onClick={() => !state.showResult && handleAnswer(index)}
                disabled={state.showResult}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  state.showResult
                    ? index === currentProblem.correctAnswer
                      ? 'border-green-500 bg-green-50'
                      : index === state.answers[state.currentProblemIndex]
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                }`}
              >
                <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
              </button>
            ))}
          </div>

          {/* 結果表示 */}
          {state.showResult && (
            <div className={`mt-6 p-4 rounded-lg ${state.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
              <p className={`font-bold ${state.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                {state.isCorrect ? '正解！' : '不正解'}
              </p>
              {currentProblem.explanation && (
                <p className="mt-2 text-gray-700">{currentProblem.explanation}</p>
              )}
            </div>
          )}

          {/* 次へボタン */}
          {state.showResult && (
            <button
              onClick={nextProblem}
              className="w-full mt-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              {state.currentProblemIndex < state.problems.length - 1 ? '次の問題へ' : '結果を見る'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}