// hooks/use-study-session.ts
import { useState, useCallback } from 'react'
import { Problem } from '@/types/study'

interface StudySessionData {
  currentSession: any
  currentProblem: Problem | null
  currentIndex: number
  problemQueue: Problem[]
  sessionStats: {
    accuracy: number
    totalProblems: number
    correctAnswers: number
    averageTime: number
    hintsUsed: number
  }
  todaysGoal: any
  progress: { percentage: number } | null
  isSubmitting: boolean
  showExplanation: boolean
}

export function useStudySession() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)
  
  // デモ用の固定データ
  const mockData: StudySessionData = {
    currentSession: { id: 'demo-session' },
    currentProblem: null,
    currentIndex: 0,
    problemQueue: [],
    sessionStats: {
      accuracy: 0,
      totalProblems: 0,
      correctAnswers: 0,
      averageTime: 0,
      hintsUsed: 0
    },
    todaysGoal: null,
    progress: null,
    isSubmitting,
    showExplanation
  }

  const submitAnswer = useCallback(async (answer: string | string[], confidence: number) => {
    setIsSubmitting(true)
    
    // デモ用：2秒待機して成功を返す
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubmitting(false)
    return Math.random() > 0.5 // ランダムに正解/不正解
  }, [])

  const nextProblem = useCallback(() => {
    setShowExplanation(false)
  }, [])

  const previousProblem = useCallback(() => {
    setShowExplanation(false)
  }, [])

  const endSession = useCallback(async () => {
    console.log('Session ended')
  }, [])

  return {
    ...mockData,
    submitAnswer,
    nextProblem,
    previousProblem,
    endSession
  }
}