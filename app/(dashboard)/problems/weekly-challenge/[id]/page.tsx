'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { 
  getWeeklyChallenge, 
  getWeeklyChallengeStatus, 
  completeWeeklySession,
  getWeeklyProgressSummary
} from '@/lib/firebase/weeklyChallenge'
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
  todayCompleted: boolean
  progressSummary: any
}

export default function WeeklyChallengePage() {
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
    todayCompleted: false,
    progressSummary: null
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
      const challenge = await getWeeklyChallenge(1, ['数学']) // 仮の値
      if (!challenge || challenge.id !== challengeId) {
        setState(prev => ({ ...prev, error: 'チャレンジが見つかりません', loading: false }))
        return
      }

      const status = await getWeeklyChallengeStatus(uid, challengeId)
      const progressSummary = await getWeeklyProgressSummary(uid)

      // 今日既に完了しているかチェック
      const today = new Date().toISOString().split('T')[0]
      const todayCompleted = status?.dailyCompletions?.[today] || false

      if (todayCompleted) {
        setState(prev => ({
          ...prev,
          challenge,
          status,
          progressSummary,
          todayCompleted: true,
          loading: false
        }))
        return
      }

      // 今日の問題を取得
      const todaySubjects = progressSummary?.todaySubjects || challenge.subjects.slice(0, 2)
      const problems = await getProblems({
        subjects: todaySubjects,
        limit: 10,
        difficulty: challenge.difficulty
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
        progressSummary,
        loading: false
      }))
    } catch (error) {
      console.error('Error loading challenge:', error)
      setState(prev => ({ ...prev, error: 'チャレンジの読み込みに失敗しました', loading: false }))
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

      const result = await completeWeeklySession(
        userId,
        challengeId,
        state.problems.map(p => p.id!),
        score
      )

      // 結果画面へ遷移
      router.push(`/problems/weekly-challenge/${challengeId}/result?score=${score}&total=${state.problems.length}&achieved=${result.achieved}&xp=${result.xpEarned}`)
    } catch (error) {
      console.error('Error completing session:', error)
    }
  }

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-red-600 mb-4">エラー</h2>
          <p className="text-gray-600 mb-6">{state.error}</p>
          <button
            onClick={() => router.push('/home')}
            className="w-full py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  if (state.todayCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <h1 className="text-3xl font-bold text-pink-600 mb-6">今日の分は完了済み！</h1>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">完了日数</span>
              <span className="font-bold">{state.progressSummary?.daysCompleted || 0} / 7日</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">達成率</span>
              <span className="font-bold">{Math.floor((state.status?.completionRate || 0) * 100)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">残り日数</span>
              <span className="font-bold">{state.progressSummary?.remainingDays || 0}日</span>
            </div>
          </div>

          <div className="bg-pink-100 rounded-lg p-4 mb-6">
            <p className="text-pink-800">
              お疲れさまでした！明日また新しい問題に挑戦しましょう。
            </p>
          </div>

          <button
            onClick={() => router.push('/home')}
            className="w-full py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  const currentProblem = state.problems[state.currentProblemIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-2xl mx-auto p-4">
        {/* 進捗バー */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">問題 {state.currentProblemIndex + 1} / {state.problems.length}</span>
            <span className="text-pink-600 font-bold">
              {state.progressSummary?.daysCompleted || 0}/7日目
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-pink-600 to-purple-600 h-3 rounded-full transition-all"
              style={{ width: `${((state.currentProblemIndex + 1) / state.problems.length) * 100}%` }}
            />
          </div>
        </div>

        {/* 今日の科目 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <p className="text-sm text-gray-600 mb-2">今日の科目</p>
          <div className="flex gap-2">
            {(state.progressSummary?.todaySubjects || []).map((subject: string) => (
              <span key={subject} className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm font-medium">
                {subject}
              </span>
            ))}
          </div>
        </div>

        {/* 問題カード */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm font-medium mb-4">
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
                    : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50'
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
              className="w-full mt-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium"
            >
              {state.currentProblemIndex < state.problems.length - 1 ? '次の問題へ' : '今日の分を完了'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}