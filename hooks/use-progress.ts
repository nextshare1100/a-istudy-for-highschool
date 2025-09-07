import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  Unsubscribe,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { useAnalyticsStore } from '@/store/analyticsStore';

export function useProgress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.uid || 'test-user';
  
  // Zustand storeからデータを取得
  const { 
    sessions, 
    metrics, 
    fetchSessions, 
    fetchMetrics,
    isLoading,
    error 
  } = useAnalyticsStore();

  // 初回データ取得
  useEffect(() => {
    if (userId) {
      fetchSessions({ userId });
      fetchMetrics();
    }
  }, [userId, fetchSessions, fetchMetrics]);

  // リアルタイム更新の設定
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'studySessions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newSessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // storeを更新
      useAnalyticsStore.setState({ sessions: newSessions });
      
      // メトリクスを再計算
      fetchMetrics();
    });

    return () => unsubscribe();
  }, [userId, fetchMetrics]);

  // 進捗データの計算
  const progress = useMemo(() => {
    if (!sessions.length) return null;

    // 科目別の進捗を計算
    const subjectProgress = sessions.reduce((acc, session) => {
      const subject = session.subjectId;
      if (!acc[subject]) {
        acc[subject] = {
          totalTime: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          sessions: 0
        };
      }
      
      acc[subject].totalTime += session.duration;
      acc[subject].totalQuestions += session.questionsAnswered;
      acc[subject].correctAnswers += session.correctAnswers;
      acc[subject].sessions += 1;
      
      return acc;
    }, {} as Record<string, any>);

    // 科目別データを整形
    const subjects = Object.entries(subjectProgress).map(([subject, data]) => ({
      subject,
      mastery: Math.round((data.correctAnswers / data.totalQuestions) * 100) || 0,
      lastStudied: sessions.find(s => s.subjectId === subject)?.endTime || null,
      topics: {} // TODO: トピック別の詳細データ
    }));

    // 全体の進捗
    const overall = {
      mastery: Math.round(
        subjects.reduce((sum, s) => sum + s.mastery, 0) / subjects.length
      ) || 0,
      totalTime: sessions.reduce((sum, s) => sum + s.duration, 0),
      correctRate: sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length / 100 || 0
    };

    return {
      overall,
      subjects,
      recentActivity: sessions.slice(0, 10).map(s => ({
        id: s.id,
        subject: s.subjectId,
        topic: s.topicId || '',
        createdAt: s.endTime,
        isCorrect: s.accuracy > 70
      }))
    };
  }, [sessions]);

  // AI分析の実行
  const analyzeProgress = useMutation({
    mutationFn: async (params: { timeframe: string }) => {
      const response = await fetch('/api/analytics/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          timeframe: params.timeframe,
          sessions
        })
      });
      
      if (!response.ok) throw new Error('Analysis failed');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['analysis', userId], data);
    }
  });

  return {
    progress,
    metrics,
    isLoading,
    error,
    analyzeProgress: analyzeProgress.mutate,
    isAnalyzing: analyzeProgress.isPending
  };
}
