'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/config'
import { completeDailyChallenge } from '@/lib/firebase/dailyChallenge'

interface Problem {
  id: string
  subject: string
  difficulty: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface DailyChallenge {
  id: string
  userId?: string
  subject: string
  difficulty: string
  problemIds: string[]
  expiresAt: Date
}

interface ProblemResult {
  problemId: string
  isCorrect: boolean
  timeSpent: number
  difficulty: 'easy' | 'medium' | 'hard'
  selectedAnswer: number
  correctAnswer: number
}

export default function DailyChallengeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const challengeId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null)
  const [problems, setProblems] = useState<Problem[]>([])
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [score, setScore] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [startTime, setStartTime] = useState<number>(Date.now())
  
  // 時間計測用の新しいstate
  const [problemStartTime, setProblemStartTime] = useState<number>(Date.now())
  const [problemResults, setProblemResults] = useState<ProblemResult[]>([])
  const [currentTime, setCurrentTime] = useState(0)

  // タイマー表示用のuseEffect
  useEffect(() => {
    if (!showResult && !completed && problems.length > 0) {
      const timer = setInterval(() => {
        setCurrentTime(Math.floor((Date.now() - problemStartTime) / 1000))
      }, 1000)
      
      return () => clearInterval(timer)
    }
  }, [problemStartTime, showResult, completed, problems.length])

  // 問題が変わるたびに時間をリセット
  useEffect(() => {
    if (!showResult) {
      setProblemStartTime(Date.now())
      setCurrentTime(0)
    }
  }, [currentProblemIndex])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid)
        setStartTime(Date.now())
        await loadChallenge(user.uid)
      } else {
        router.push('/login')
      }
    })

    return () => unsubscribe()
  }, [challengeId])

  const loadChallenge = async (uid: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const challengeDoc = await getDoc(doc(db, 'dailyChallenges', challengeId))
      
      if (!challengeDoc.exists()) {
        setError('チャレンジが見つかりません')
        setLoading(false)
        return
      }
      
      const challengeData = challengeDoc.data()
      
      if (challengeData.userId && challengeData.userId !== uid) {
        setError('このチャレンジへのアクセス権限がありません')
        setLoading(false)
        return
      }
      
      const challenge: DailyChallenge = {
        id: challengeDoc.id,
        userId: challengeData.userId,
        subject: challengeData.subject,
        difficulty: challengeData.difficulty,
        problemIds: challengeData.problemIds || [],
        expiresAt: challengeData.expiresAt.toDate()
      }
      
      setChallenge(challenge)
      
      if (!challenge.problemIds || challenge.problemIds.length === 0) {
        setError('まだ、問題は生成されていません')
        setLoading(false)
        return
      }
      
      if (new Date() > challenge.expiresAt) {
        setError('このチャレンジは期限切れです')
        setLoading(false)
        return
      }
      
      const statusDoc = await getDoc(
        doc(db, `users/${uid}/dailyChallengeStatus`, challengeId)
      )
      
      if (statusDoc.exists() && statusDoc.data().completed) {
        setCompleted(true)
        setScore(statusDoc.data().score || 0)
        setLoading(false)
        return
      }
      
      const problemPromises = challenge.problemIds.map(async (problemId) => {
        const problemDoc = await getDoc(doc(db, 'problems', problemId))
        if (problemDoc.exists()) {
          return {
            id: problemDoc.id,
            ...problemDoc.data()
          } as Problem
        }
        return null
      })
      
      const problemsData = await Promise.all(problemPromises)
      const validProblems = problemsData.filter(p => p !== null) as Problem[]
      
      if (validProblems.length === 0) {
        setError('問題データが見つかりません')
        setLoading(false)
        return
      }
      
      setProblems(validProblems)
      setLoading(false)
      
    } catch (error) {
      console.error('Error loading challenge:', error)
      setError('チャレンジの読み込みに失敗しました')
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return
    setSelectedAnswer(answerIndex)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return
    
    const currentProblem = problems[currentProblemIndex]
    const correct = selectedAnswer === currentProblem.correctAnswer
    
    // 問題にかかった時間を計算
    const problemTimeSpent = Math.floor((Date.now() - problemStartTime) / 1000)
    
    // 結果を記録
    const result: ProblemResult = {
      problemId: currentProblem.id,
      isCorrect: correct,
      timeSpent: problemTimeSpent,
      difficulty: currentProblem.difficulty as 'easy' | 'medium' | 'hard',
      selectedAnswer: selectedAnswer,
      correctAnswer: currentProblem.correctAnswer
    }
    
    setProblemResults([...problemResults, result])
    
    setIsCorrect(correct)
    setShowResult(true)
    
    if (correct) {
      setScore(score + 1)
    }
  }

  const handleNextProblem = async () => {
    if (currentProblemIndex < problems.length - 1) {
      setCurrentProblemIndex(currentProblemIndex + 1)
      setSelectedAnswer(null)
      setShowResult(false)
      setIsCorrect(false)
    } else {
      // チャレンジ完了
      if (userId && challenge) {
        try {
          const totalTimeSpent = Math.floor((Date.now() - startTime) / 1000)
          
          // 改善版のcompleteDailyChallengeを呼び出し
          await completeDailyChallenge(
            userId,
            challenge.id,
            score,
            problems.length,
            totalTimeSpent,
            problemResults // 各問題の詳細結果を渡す
          )
          setCompleted(true)
        } catch (error) {
          console.error('Error completing challenge:', error)
        }
      }
    }
  }

  const handleReturnHome = () => {
    router.push('/home')
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>読み込み中...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2>{error}</h2>
        {error === 'まだ、問題は生成されていません' && (
          <p className="error-detail">
            問題データが準備されていません。<br />
            管理者に問題の作成を依頼してください。
          </p>
        )}
        {error === 'このチャレンジへのアクセス権限がありません' && (
          <p className="error-detail">
            このチャレンジは他のユーザーのものです。<br />
            ホームに戻って新しいチャレンジを始めてください。
          </p>
        )}
        <button onClick={handleReturnHome} className="return-button">
          ホームに戻る
        </button>
      </div>
    )
  }

  if (completed) {
    const scorePercentage = Math.round((score / problems.length) * 100)
    const isPerfect = score === problems.length
    const isExcellent = scorePercentage >= 80
    const isGood = scorePercentage >= 60
    
    // 総学習時間の計算
    const totalTimeSpent = problemResults.reduce((sum, result) => sum + result.timeSpent, 0)
    const averageTimePerProblem = Math.round(totalTimeSpent / problems.length)
    
    return (
      <>
        <style jsx>{`
          .completion-wrapper {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
          }
          
          .completion-wrapper::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -30%;
            width: 600px;
            height: 600px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            animation: float 20s ease-in-out infinite;
          }
          
          .completion-wrapper::after {
            content: '';
            position: absolute;
            bottom: -30%;
            left: -20%;
            width: 400px;
            height: 400px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 50%;
            animation: float 15s ease-in-out infinite reverse;
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-20px) scale(1.05); }
          }
          
          .completion-card {
            background: white;
            border-radius: 24px;
            padding: 48px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
            position: relative;
            z-index: 1;
          }
          
          @media (max-width: 640px) {
            .completion-card {
              padding: 32px 24px;
            }
          }
          
          .celebration-header {
            text-align: center;
            margin-bottom: 40px;
            position: relative;
          }
          
          .trophy-container {
            position: relative;
            display: inline-block;
            margin-bottom: 24px;
          }
          
          .trophy-icon {
            font-size: 80px;
            display: block;
            animation: bounce 1s ease-out;
          }
          
          @keyframes bounce {
            0% { transform: scale(0) rotate(-180deg); }
            50% { transform: scale(1.2) rotate(10deg); }
            75% { transform: scale(0.9) rotate(-5deg); }
            100% { transform: scale(1) rotate(0); }
          }
          
          .sparkle {
            position: absolute;
            font-size: 20px;
            animation: sparkle 1.5s ease-out forwards;
          }
          
          .sparkle-1 { top: 0; left: -20px; animation-delay: 0.2s; }
          .sparkle-2 { top: 0; right: -20px; animation-delay: 0.4s; }
          .sparkle-3 { bottom: 0; left: 0; animation-delay: 0.6s; }
          .sparkle-4 { bottom: 0; right: 0; animation-delay: 0.8s; }
          
          @keyframes sparkle {
            0% { transform: scale(0) rotate(0); opacity: 0; }
            50% { transform: scale(1) rotate(180deg); opacity: 1; }
            100% { transform: scale(0) rotate(360deg); opacity: 0; }
          }
          
          .completion-title {
            font-size: 32px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 8px;
          }
          
          .completion-subtitle {
            font-size: 16px;
            color: #6b7280;
            font-weight: 500;
          }
          
          .score-section {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            border-radius: 16px;
            padding: 32px;
            margin-bottom: 24px;
            text-align: center;
          }
          
          .score-display {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-bottom: 16px;
          }
          
          .score-number {
            font-size: 48px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          .score-divider {
            font-size: 32px;
            color: #9ca3af;
            margin: 0 4px;
          }
          
          .score-total {
            font-size: 32px;
            color: #6b7280;
            font-weight: 600;
          }
          
          .percentage-badge {
            display: inline-block;
            background: ${isPerfect ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' :
                         isExcellent ? 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)' :
                         isGood ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' :
                         'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'};
            color: white;
            padding: 8px 24px;
            border-radius: 20px;
            font-size: 20px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 32px;
          }
          
          .stat-card {
            background: #fafafa;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            border: 1px solid #e5e7eb;
          }
          
          .stat-icon {
            font-size: 24px;
            margin-bottom: 8px;
          }
          
          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 4px;
          }
          
          .stat-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .reward-section {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 32px;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .reward-section::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(251, 191, 36, 0.1) 0%, transparent 70%);
            animation: pulse 2s ease-in-out infinite;
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(0.8); opacity: 0.5; }
            50% { transform: scale(1.2); opacity: 0.8; }
          }
          
          .reward-title {
            font-size: 14px;
            color: #92400e;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
          }
          
          .reward-value {
            font-size: 32px;
            font-weight: 700;
            color: #d97706;
            position: relative;
            z-index: 1;
          }
          
          .action-buttons {
            display: flex;
            gap: 12px;
          }
          
          .home-button {
            flex: 1;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }
          
          .home-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
          }
          
          .share-button {
            background: white;
            color: #667eea;
            border: 2px solid #667eea;
            padding: 16px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .share-button:hover {
            background: #f8f9ff;
          }
          
          .motivational-message {
            text-align: center;
            font-size: 14px;
            color: #6b7280;
            line-height: 1.6;
            margin-top: 24px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
          }
        `}</style>
        
        <div className="completion-wrapper">
          <div className="completion-card">
            <div className="celebration-header">
              <div className="trophy-container">
                <span className="trophy-icon">
                  {isPerfect ? '🏆' : isExcellent ? '🎉' : isGood ? '✨' : '💪'}
                </span>
                <span className="sparkle sparkle-1">✨</span>
                <span className="sparkle sparkle-2">✨</span>
                <span className="sparkle sparkle-3">✨</span>
                <span className="sparkle sparkle-4">✨</span>
              </div>
              <h1 className="completion-title">
                {isPerfect ? 'パーフェクト！' : 
                 isExcellent ? '素晴らしい成績です！' : 
                 isGood ? 'よく頑張りました！' : 'チャレンジ完了！'}
              </h1>
              <p className="completion-subtitle">
                今日のデイリーチャレンジを完了しました
              </p>
            </div>
            
            <div className="score-section">
              <div className="score-display">
                <span className="score-number">{score}</span>
                <span className="score-divider">/</span>
                <span className="score-total">{problems.length}</span>
              </div>
              <div className="percentage-badge">
                {scorePercentage}%
              </div>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">⏱️</div>
                <div className="stat-value">{formatTime(totalTimeSpent)}</div>
                <div className="stat-label">総時間</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-value">{formatTime(averageTimePerProblem)}</div>
                <div className="stat-label">平均解答時間</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-value">{challenge?.difficulty === 'easy' ? '基礎' : 
                                            challenge?.difficulty === 'medium' ? '標準' : '応用'}</div>
                <div className="stat-label">難易度</div>
              </div>
            </div>
            
            <div className="reward-section">
              <div className="reward-title">獲得報酬</div>
              <div className="reward-value">+50 XP</div>
            </div>
            
            <div className="action-buttons">
              <button onClick={handleReturnHome} className="home-button">
                ホームに戻る
              </button>
              <button className="share-button">
                📤
              </button>
            </div>
            
            <p className="motivational-message">
              {isPerfect ? '完璧な成績です！この調子で明日も頑張りましょう！' :
               isExcellent ? '素晴らしい成績です！継続することが大切です。' :
               isGood ? '良い調子です！毎日の積み重ねが実力につながります。' :
               '今日もお疲れさまでした。明日もチャレンジしましょう！'}
            </p>
          </div>
        </div>
      </>
    )
  }

  const currentProblem = problems[currentProblemIndex]
  const progress = ((currentProblemIndex + 1) / problems.length) * 100

  return (
    <>
      <style jsx>{`
        .loading-container, .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          text-align: center;
        }
        
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #f0f0f0;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }
        
        .error-container h2 {
          font-size: 24px;
          margin-bottom: 16px;
          color: #333;
        }
        
        .error-detail {
          color: #666;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        
        .challenge-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .progress-section {
          margin-bottom: 24px;
        }
        
        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .progress-text {
          font-size: 14px;
          color: #666;
        }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #f0f0f0;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s ease;
        }
        
        .problem-card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          margin-bottom: 24px;
        }
        
        .problem-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .subject-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f0f0f0;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .header-right {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        .timer-display {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #666;
          background: #f0f0f0;
          padding: 6px 12px;
          border-radius: 20px;
        }
        
        .timer-display.warning {
          background: #fef3c7;
          color: #d97706;
        }
        
        .timer-display.critical {
          background: #fee2e2;
          color: #ef4444;
        }
        
        .difficulty-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          color: white;
        }
        
        .difficulty-badge.easy {
          background: #10b981;
        }
        
        .difficulty-badge.medium {
          background: #f59e0b;
        }
        
        .difficulty-badge.hard {
          background: #ef4444;
        }
        
        .question {
          font-size: 18px;
          line-height: 1.6;
          margin-bottom: 32px;
          color: #333;
        }
        
        .options-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .option-button {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 16px;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 16px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .option-button:hover:not(.disabled) {
          border-color: #667eea;
          background: #f8f9ff;
        }
        
        .option-button.selected {
          border-color: #667eea;
          background: #f8f9ff;
        }
        
        .option-button.correct {
          border-color: #10b981;
          background: #d1fae5;
        }
        
        .option-button.incorrect {
          border-color: #ef4444;
          background: #fee2e2;
        }
        
        .option-button.disabled {
          cursor: default;
        }
        
        .option-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f0f0f0;
          font-weight: 600;
          margin-right: 16px;
          flex-shrink: 0;
        }
        
        .option-button.selected .option-number {
          background: #667eea;
          color: white;
        }
        
        .option-button.correct .option-number {
          background: #10b981;
          color: white;
        }
        
        .option-button.incorrect .option-number {
          background: #ef4444;
          color: white;
        }
        
        .result-section {
          margin-top: 24px;
          padding: 20px;
          border-radius: 12px;
          background: #f8f9ff;
        }
        
        .result-section.correct {
          background: #d1fae5;
        }
        
        .result-section.incorrect {
          background: #fee2e2;
        }
        
        .result-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        
        .result-header.correct {
          color: #059669;
        }
        
        .result-header.incorrect {
          color: #dc2626;
        }
        
        .explanation {
          font-size: 14px;
          line-height: 1.6;
          color: #666;
        }
        
        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
        
        .submit-button, .next-button, .return-button {
          flex: 1;
          padding: 14px 24px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .submit-button {
          background: #667eea;
          color: white;
        }
        
        .submit-button:hover:not(:disabled) {
          background: #5a67d8;
        }
        
        .submit-button:disabled {
          background: #e0e0e0;
          color: #999;
          cursor: not-allowed;
        }
        
        .next-button {
          background: #10b981;
          color: white;
        }
        
        .next-button:hover {
          background: #059669;
        }
        
        .return-button {
          background: #f0f0f0;
          color: #666;
        }
        
        .return-button:hover {
          background: #e0e0e0;
        }
      `}</style>

      <div className="challenge-container">
        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-text">
              問題 {currentProblemIndex + 1} / {problems.length}
            </span>
            <span className="progress-text">
              {challenge?.subject}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="problem-card">
          <div className="problem-header">
            <span className="subject-badge">
              {currentProblem.subject}
            </span>
            <div className="header-right">
              <div className={`timer-display ${
                currentTime > 120 ? 'critical' : currentTime > 90 ? 'warning' : ''
              }`}>
                <span>⏱️</span>
                <span>{formatTime(currentTime)}</span>
              </div>
              <span className={`difficulty-badge ${currentProblem.difficulty}`}>
                {currentProblem.difficulty === 'easy' ? '基礎' :
                 currentProblem.difficulty === 'medium' ? '標準' : '応用'}
              </span>
            </div>
          </div>

          <div className="question">
            {currentProblem.question}
          </div>

          <div className="options-list">
            {currentProblem.options.map((option, index) => (
              <button
                key={index}
                className={`option-button 
                  ${selectedAnswer === index ? 'selected' : ''}
                  ${showResult && index === currentProblem.correctAnswer ? 'correct' : ''}
                  ${showResult && selectedAnswer === index && !isCorrect ? 'incorrect' : ''}
                  ${showResult ? 'disabled' : ''}
                `}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
              >
                <span className="option-number">{index + 1}</span>
                <span>{option}</span>
              </button>
            ))}
          </div>

          {showResult && (
            <div className={`result-section ${isCorrect ? 'correct' : 'incorrect'}`}>
              <div className={`result-header ${isCorrect ? 'correct' : 'incorrect'}`}>
                {isCorrect ? '✓ 正解！' : '✗ 不正解'}
              </div>
              <div className="explanation">
                {currentProblem.explanation}
              </div>
            </div>
          )}

          <div className="action-buttons">
            {!showResult ? (
              <button
                className="submit-button"
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
              >
                回答する
              </button>
            ) : (
              <button
                className="next-button"
                onClick={handleNextProblem}
              >
                {currentProblemIndex < problems.length - 1 ? '次の問題へ' : '結果を見る'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}