import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { differenceInDays, startOfWeek, endOfWeek } from 'date-fns';

interface ProgressData {
  overall: {
    mastery: number;
    totalTime: number;
    totalQuestions: number;
    correctRate: number;
  };
  subjects: SubjectProgress[];
  recentActivity: Activity[];
  lastUpdated: string;
}

interface SubjectProgress {
  subject: string;
  mastery: number;
  topics: Record<string, number>;
  lastStudied: Date;
  totalTime: number;
}

interface Activity {
  id: string;
  subject: string;
  topic: string;
  isCorrect: boolean;
  createdAt: Date;
}

interface UseProgressOptions {
  subject?: string;
  dateFrom?: Date;
  dateTo?: Date;
  realtimeUpdates?: boolean;
}

export function useProgress(options: UseProgressOptions = {}) {
  const { userId } = useAuth();
  const queryClient = useQueryClient();
  const { subject, dateFrom, dateTo, realtimeUpdates = true } = options;

  // メインのクエリキー
  const queryKey = ['progress', userId, subject, dateFrom?.toISOString(), dateTo?.toISOString()];

  // 進捗データの取得
  const { data, isLoading, error } = useQuery<ProgressData>({
    queryKey,
    queryFn: async () => {
      if (!userId) throw new Error('User not authenticated');

      const params = new URLSearchParams({
        userId,
        ...(subject && { subject }),
        ...(dateFrom && { dateFrom: dateFrom.toISOString() }),
        ...(dateTo && { dateTo: dateTo.toISOString() })
      });

      const response = await fetch(`/api/progress?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch progress data');
      }

      return response.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5分
    refetchInterval: 30 * 1000, // 30秒
  });

  // リアルタイム更新の設定
  useEffect(() => {
    if (!userId || !realtimeUpdates) return;

    const unsubscribes: Unsubscribe[] = [];

    // 進捗データのリアルタイム監視
    const progressQuery = query(
      collection(db, 'progress'),
      where('userId', '==', userId),
      ...(subject ? [where('subject', '==', subject)] : [])
    );

    const unsubscribeProgress = onSnapshot(progressQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified' || change.type === 'added') {
          queryClient.invalidateQueries({ queryKey });
        }
      });
    });

    unsubscribes.push(unsubscribeProgress);

    // 解答データのリアルタイム監視（最新のもののみ）
    const answersQuery = query(
      collection(db, 'answers'),
      where('userId', '==', userId),
      ...(subject ? [where('subject', '==', subject)] : [])
    );

    const unsubscribeAnswers = onSnapshot(answersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          queryClient.invalidateQueries({ queryKey });
        }
      });
    });

    unsubscribes.push(unsubscribeAnswers);

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [userId, subject, realtimeUpdates, queryClient, queryKey]);

  // 分析実行のミューテーション
  const analyzeProgress = useMutation({
    mutationFn: async ({ 
      timeframe = 'week', 
      force = false 
    }: { 
      timeframe?: 'week' | 'month' | 'all'; 
      force?: boolean;
    }) => {
      if (!userId) throw new Error('User not authenticated');

      const response = await fetch('/api/progress/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({
          userId,
          subject: subject || 'all',
          timeframe,
          force
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze progress');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    }
  });

  // 計算されたメトリクス
  const metrics = useMemo(() => {
    if (!data) return null;

    const { overall, subjects, recentActivity } = data;

    // トレンドの計算（過去7日間の活動から）
    const weekActivity = recentActivity.filter(activity => {
      const daysDiff = differenceInDays(new Date(), new Date(activity.createdAt));
      return daysDiff <= 7;
    });

    const trend = calculateTrend(weekActivity);

    // 最も弱いトピックの特定
    const weakestTopic = findWeakestTopic(subjects);

    // 今週の学習時間
    const weeklyStudyTime = calculateWeeklyStudyTime(subjects);

    // 習熟度の成長率
    const growthRate = calculateGrowthRate(recentActivity);

    return {
      trend,
      weakestTopic,
      weeklyStudyTime,
      growthRate,
      streakDays: calculateStreakDays(recentActivity),
      averageCorrectRate: overall.correctRate,
      topPerformingSubject: findTopSubject(subjects),
      improvementAreas: findImprovementAreas(subjects)
    };
  }, [data]);

  return {
    progress: data,
    isLoading,
    error,
    metrics,
    analyzeProgress: analyzeProgress.mutate,
    isAnalyzing: analyzeProgress.isPending,
    analysisError: analyzeProgress.error,
    refresh: () => queryClient.invalidateQueries({ queryKey })
  };
}

// ヘルパー関数
function calculateTrend(activities: Activity[]): 'improving' | 'stable' | 'declining' {
  if (activities.length < 5) return 'stable';

  const recentCorrectRate = activities.slice(0, Math.floor(activities.length / 2))
    .filter(a => a.isCorrect).length / Math.floor(activities.length / 2);
  
  const olderCorrectRate = activities.slice(Math.floor(activities.length / 2))
    .filter(a => a.isCorrect).length / (activities.length - Math.floor(activities.length / 2));

  const diff = recentCorrectRate - olderCorrectRate;
  
  if (diff > 0.1) return 'improving';
  if (diff < -0.1) return 'declining';
  return 'stable';
}

function findWeakestTopic(subjects: SubjectProgress[]): { subject: string; topic: string; mastery: number } | null {
  let weakest = { subject: '', topic: '', mastery: 100 };

  subjects.forEach(subject => {
    Object.entries(subject.topics).forEach(([topic, mastery]) => {
      if (mastery < weakest.mastery) {
        weakest = { subject: subject.subject, topic, mastery };
      }
    });
  });

  return weakest.subject ? weakest : null;
}

function calculateWeeklyStudyTime(subjects: SubjectProgress[]): number {
  const weekStart = startOfWeek(new Date());
  
  return subjects.reduce((total, subject) => {
    if (subject.lastStudied && new Date(subject.lastStudied) >= weekStart) {
      return total + (subject.totalTime || 0);
    }
    return total;
  }, 0);
}

function calculateGrowthRate(activities: Activity[]): number {
  if (activities.length < 10) return 0;

  const firstHalf = activities.slice(Math.floor(activities.length / 2));
  const secondHalf = activities.slice(0, Math.floor(activities.length / 2));

  const firstRate = firstHalf.filter(a => a.isCorrect).length / firstHalf.length;
  const secondRate = secondHalf.filter(a => a.isCorrect).length / secondHalf.length;

  return ((secondRate - firstRate) / firstRate) * 100;
}

function calculateStreakDays(activities: Activity[]): number {
  if (activities.length === 0) return 0;

  const dates = activities.map(a => new Date(a.createdAt).toDateString());
  const uniqueDates = Array.from(new Set(dates)).sort().reverse();

  let streak = 0;
  const today = new Date().toDateString();
  
  for (let i = 0; i < uniqueDates.length; i++) {
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - i);
    
    if (uniqueDates[i] === expectedDate.toDateString()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function findTopSubject(subjects: SubjectProgress[]): string {
  if (subjects.length === 0) return '';
  
  return subjects.reduce((top, current) => 
    current.mastery > (subjects.find(s => s.subject === top)?.mastery || 0) 
      ? current.subject 
      : top
  , subjects[0].subject);
}

function findImprovementAreas(subjects: SubjectProgress[]): string[] {
  return subjects
    .filter(s => s.mastery < 60)
    .map(s => s.subject)
    .slice(0, 3);
}

// 認証トークンの取得（Clerk用）
async function getAuthToken(): Promise<string> {
  // Clerkのトークン取得ロジック
  return '';
}