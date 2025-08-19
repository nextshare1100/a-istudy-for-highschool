import { useEffect, useCallback } from 'react';
import { useStudyStore } from '@/store/study-store';
import { useRouter } from 'next/navigation';

export function useStudySession() {
  const router = useRouter();
  const {
    currentSession,
    currentProblem,
    problemQueue,
    sessionStats,
    timerState,
    submitAnswer,
    nextProblem,
    endSession,
  } = useStudyStore();

  // セッション終了時の処理
  const handleSessionComplete = useCallback(async () => {
    if (!currentSession) return;

    await endSession();
    router.push(`/study/complete/${currentSession.id}`);
  }, [currentSession, endSession, router]);

  // ページ離脱時の警告
  useEffect(() => {
    if (!currentSession) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentSession]);

  // 自動保存
  useEffect(() => {
    if (!currentSession || !sessionStats) return;

    const interval = setInterval(() => {
      // セッション統計を定期的に保存
      // （実装は省略）
    }, 30000); // 30秒ごと

    return () => clearInterval(interval);
  }, [currentSession, sessionStats]);

  return {
    currentSession,
    currentProblem,
    problemQueue,
    sessionStats,
    timerState,
    submitAnswer,
    nextProblem,
    handleSessionComplete,
    isLastProblem: problemQueue.length === 0,
    totalProblems: sessionStats.totalProblems + problemQueue.length + (currentProblem ? 1 : 0),
  };
}