// components/quiz/QuizComponent.tsx - 問題演習結果保存機能を含む実装例

'use client'

import { useState, useEffect } from 'react'
import { saveQuizResult } from '@/lib/firebase/firestore'
import { AlertCircle, CheckCircle, Clock, HelpCircle, Send } from 'lucide-react'

interface QuizComponentProps {
  problem: {
    id: string
    subject: string
    unit: string
    topic?: string
    difficulty: 'easy' | 'medium' | 'hard'
    question: string
    options?: string[]
    answer: string | string[]
    explanation: string
    hints?: string[]
  }
  sessionId?: string // タイマーセッションと連携する場合
  onComplete?: (isCorrect: boolean) => void
}

export default function QuizComponent({ problem, sessionId, onComplete }: QuizComponentProps) {
  const [userAnswer, setUserAnswer] = useState<string>('')
  const [startTime] = useState(Date.now())
  const [showResult, setShowResult] = useState(false)
  const [attemptNumber, setAttemptNumber] = useState(1)
  const [hintUsed, setHintUsed] = useState(false)
  const [currentHintIndex, setCurrentHintIndex] = useState(-1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState(false)

  // 回答をチェック
  const checkAnswer = (userAns: string, correctAns: string | string[]): boolean => {
    if (Array.isArray(correctAns)) {
      return correctAns.some(ans => 
        ans.toLowerCase().trim() === userAns.toLowerCase().trim()
      )
    }
    return userAns.toLowerCase().trim() === correctAns.toLowerCase().trim()
  }

  // 回答を提出
  const handleSubmit = async () => {
    if (!userAnswer.trim()) return

    setIsSubmitting(true)
    setError(null)

    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    const correct = checkAnswer(userAnswer, problem.answer)
    setIsCorrect(correct)

    try {
      // 問題演習結果を保存
      await saveQuizResult({
        problemId: problem.id,
        subject: problem.subject,
        unit: problem.unit,
        topic: problem.topic,
        difficulty: problem.difficulty,
        isCorrect: correct,
        userAnswer,
        correctAnswer: problem.answer,
        timeSpent,
        attemptNumber,
        sessionId,
        hint_used: hintUsed
      })

      setShowResult(true)

      // 正解した場合、または3回間違えた場合は完了
      if (correct || attemptNumber >= 3) {
        setTimeout(() => {
          onComplete?.(correct)
        }, 2000)
      } else {
        // 不正解の場合、再挑戦の準備
        setTimeout(() => {
          setShowResult(false)
          setUserAnswer('')
          setAttemptNumber(prev => prev + 1)
        }, 3000)
      }
    } catch (err) {
      console.error('Error saving quiz result:', err)
      setError('結果の保存に失敗しました。もう一度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ヒントを表示
  const showHint = () => {
    if (!problem.hints || problem.hints.length === 0) return
    
    setHintUsed(true)
    if (currentHintIndex < problem.hints.length - 1) {
      setCurrentHintIndex(prev => prev + 1)
    }
  }

  // 難易度の色を取得
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '#27ae60'
      case 'medium': return '#f39c12'
      case 'hard': return '#e74c3c'
      default: return '#636e72'
    }
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      {/* 問題ヘッダー */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{
            backgroundColor: '#f0f4ff',
            color: '#6c5ce7',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {problem.subject}
          </span>
          <span style={{
            backgroundColor: '#f8f9fa',
            color: '#636e72',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            {problem.unit}
          </span>
        </div>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <span style={{
            color: getDifficultyColor(problem.difficulty),
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {problem.difficulty === 'easy' ? '基礎' : 
             problem.difficulty === 'medium' ? '標準' : '応用'}
          </span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#636e72',
            fontSize: '14px'
          }}>
            <Clock size={16} />
            <span>{Math.floor((Date.now() - startTime) / 1000)}秒</span>
          </div>
        </div>
      </div>

      {/* 問題文 */}
      <div style={{
        fontSize: '18px',
        lineHeight: '1.8',
        color: '#2d3436',
        marginBottom: '32px',
        whiteSpace: 'pre-wrap'
      }}>
        {problem.question}
      </div>

      {/* ヒント表示 */}
      {hintUsed && currentHintIndex >= 0 && problem.hints && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px'
          }}>
            <HelpCircle size={20} color="#f39c12" />
            <div>
              <p style={{
                color: '#856404',
                margin: 0,
                fontWeight: '600',
                marginBottom: '4px'
              }}>
                ヒント {currentHintIndex + 1}
              </p>
              <p style={{ color: '#856404', margin: 0 }}>
                {problem.hints[currentHintIndex]}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 回答入力 */}
      {!showResult && (
        <>
          {problem.options ? (
            // 選択式問題
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '24px'
            }}>
              {problem.options.map((option, index) => (
                <label
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: userAnswer === option ? '#f0f4ff' : '#f8f9fa',
                    border: `2px solid ${userAnswer === option ? '#6c5ce7' : 'transparent'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <input
                    type="radio"
                    value={option}
                    checked={userAnswer === option}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    style={{ marginRight: '12px' }}
                  />
                  <span style={{ fontSize: '16px', color: '#2d3436' }}>
                    {option}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            // 記述式問題
            <textarea
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="回答を入力してください"
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '16px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid #e9ecef',
                outline: 'none',
                resize: 'vertical',
                marginBottom: '24px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#6c5ce7'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e9ecef'
              }}
            />
          )}

          {/* エラーメッセージ */}
          {error && (
            <div style={{
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} color="#e74c3c" />
              <span style={{ color: '#e74c3c', fontSize: '14px' }}>{error}</span>
            </div>
          )}

          {/* アクションボタン */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'space-between'
          }}>
            <button
              onClick={showHint}
              disabled={!problem.hints || problem.hints.length === 0 || 
                       currentHintIndex >= problem.hints.length - 1}
              style={{
                padding: '12px 24px',
                backgroundColor: 'white',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#636e72',
                cursor: problem.hints && currentHintIndex < problem.hints.length - 1 
                  ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (problem.hints && currentHintIndex < problem.hints.length - 1) {
                  e.currentTarget.style.borderColor = '#6c5ce7'
                  e.currentTarget.style.color = '#6c5ce7'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e9ecef'
                e.currentTarget.style.color = '#636e72'
              }}
            >
              <HelpCircle size={20} />
              ヒント
              {problem.hints && ` (${currentHintIndex + 1}/${problem.hints.length})`}
            </button>

            <button
              onClick={handleSubmit}
              disabled={!userAnswer.trim() || isSubmitting}
              style={{
                padding: '12px 32px',
                backgroundColor: userAnswer.trim() ? '#6c5ce7' : '#e9ecef',
                color: userAnswer.trim() ? 'white' : '#b2bec3',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: userAnswer.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  送信中...
                </>
              ) : (
                <>
                  <Send size={20} />
                  回答する
                </>
              )}
            </button>
          </div>

          {/* 試行回数表示 */}
          {attemptNumber > 1 && (
            <p style={{
              textAlign: 'center',
              marginTop: '16px',
              color: '#636e72',
              fontSize: '14px'
            }}>
              {attemptNumber}回目の挑戦
            </p>
          )}
        </>
      )}

      {/* 結果表示 */}
      {showResult && (
        <div style={{
          marginTop: '32px',
          padding: '24px',
          backgroundColor: isCorrect ? '#d4edda' : '#f8d7da',
          borderRadius: '12px',
          border: `1px solid ${isCorrect ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            {isCorrect ? (
              <>
                <CheckCircle size={24} color="#155724" />
                <h3 style={{ margin: 0, color: '#155724' }}>正解です！</h3>
              </>
            ) : (
              <>
                <AlertCircle size={24} color="#721c24" />
                <h3 style={{ margin: 0, color: '#721c24' }}>
                  不正解... {attemptNumber < 3 ? 'もう一度挑戦してください' : ''}
                </h3>
              </>
            )}
          </div>

          {(!isCorrect && attemptNumber >= 3) && (
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: '8px'
            }}>
              <p style={{
                margin: 0,
                marginBottom: '8px',
                fontWeight: '600',
                color: '#721c24'
              }}>
                正解:
              </p>
              <p style={{ margin: 0, color: '#2d3436' }}>
                {Array.isArray(problem.answer) ? problem.answer.join(' または ') : problem.answer}
              </p>
            </div>
          )}

          {(isCorrect || attemptNumber >= 3) && (
            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: '8px'
            }}>
              <h4 style={{
                margin: 0,
                marginBottom: '12px',
                color: '#2d3436'
              }}>
                解説
              </h4>
              <p style={{
                margin: 0,
                color: '#2d3436',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {problem.explanation}
              </p>
            </div>
          )}
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