import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { 
  createSchedule as createScheduleFirebase,
  getActiveSchedule,
  updateSchedule as updateScheduleFirebase,
  calculateScheduleProgress,
  createMonthlyGoal,
  getMonthlyGoalsBySchedule,
  createPersonalEvent,
  AISchedulePlanner,
  monthlyScheduleManager,
  type Schedule,
  type MonthlyGoal,
  type PersonalEvent,
  type UniversityRequirement,
  type UserConstraints,
  type EnhancedSchedule,
  type MonthlyScheduleStatus,
  type MonthlyGenerationLog
} from '@/lib/firebase/schedule';
import { getRecentTimerSessions } from '@/lib/firebase/firestore';
import { toast } from '@/components/ui/use-toast';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ========== メインのスケジュール管理フック ==========
export function useSchedule() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // アクティブなスケジュールを取得
  const fetchSchedule = useCallback(async () => {
    if (!user) {
      setSchedule(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const activeSchedule = await getActiveSchedule(user.uid);
      setSchedule(activeSchedule);
      
      if (activeSchedule) {
        const goals = await getMonthlyGoalsBySchedule(activeSchedule.id!);
        setMonthlyGoals(goals);
      }
    } catch (err) {
      console.error('スケジュール取得エラー:', err);
      setError('スケジュールの取得に失敗しました');
      toast({
        title: "エラー",
        description: "スケジュールの取得に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // スケジュールを作成（AI統合対応）
  const createSchedule = async (
    scheduleData: Omit<Schedule, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    options?: {
      useAI?: boolean;
      universityGoal?: UniversityRequirement;
      constraints?: UserConstraints;
    }
  ): Promise<string | null> => {
    if (!user) {
      setError('ユーザーが認証されていません');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      let scheduleId: string;

      if (options?.useAI && options.universityGoal && options.constraints) {
        // AI駆動のスケジュール生成
        const planner = new AISchedulePlanner();
        const aiSchedule = await planner.generateComprehensiveSchedule(
          user.uid,
          options.universityGoal,
          options.constraints
        );
        scheduleId = aiSchedule.id!;
        
        // 月次目標も自動生成
        if (aiSchedule.detailedAnalysis) {
          await planner.generateMonthlyGoals(scheduleId, aiSchedule.detailedAnalysis);
        }
      } else {
        // 通常のスケジュール作成
        scheduleId = await createScheduleFirebase(user.uid, scheduleData);
      }

      await fetchSchedule();
      
      toast({
        title: "成功",
        description: options?.useAI 
          ? "AIスケジュールが生成されました" 
          : "スケジュールが作成されました",
      });
      
      return scheduleId;
    } catch (err) {
      console.error('スケジュール作成エラー:', err);
      setError('スケジュールの作成に失敗しました');
      toast({
        title: "エラー",
        description: "スケジュールの作成に失敗しました",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // スケジュールを更新
  const updateSchedule = async (
    scheduleId: string,
    updates: Partial<Schedule>
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      await updateScheduleFirebase(scheduleId, updates);
      await fetchSchedule();
      
      toast({
        title: "成功",
        description: "スケジュールが更新されました",
      });
      
      return true;
    } catch (err) {
      console.error('スケジュール更新エラー:', err);
      setError('スケジュールの更新に失敗しました');
      toast({
        title: "エラー",
        description: "スケジュールの更新に失敗しました",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 進捗を計算
  const getProgress = async (): Promise<{
    overallProgress: number;
    subjectProgress: { [subject: string]: number };
    isOnTrack: boolean;
  } | null> => {
    if (!schedule?.id) return null;

    try {
      return await calculateScheduleProgress(schedule.id);
    } catch (err) {
      console.error('進捗計算エラー:', err);
      return null;
    }
  };

  return {
    schedule,
    monthlyGoals,
    loading,
    error,
    createSchedule,
    updateSchedule,
    getProgress,
    refetch: fetchSchedule,
  };
}

// ========== 月次スケジュール管理フック ==========
export function useMonthlySchedule(scheduleId?: string) {
  const { user } = useAuth();
  const [status, setStatus] = useState<MonthlyScheduleStatus | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<MonthlyGenerationLog[]>([]);
  const [loading, setLoading] = useState(true);

  // 現在の月の状態をチェック
  const checkStatus = useCallback(async (year?: number, month?: number) => {
    if (!scheduleId || !user) {
      setStatus(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const targetYear = year || new Date().getFullYear();
      const targetMonth = month || new Date().getMonth() + 1;
      
      const monthlyStatus = await monthlyScheduleManager.checkMonthlyScheduleStatus(
        scheduleId,
        targetYear,
        targetMonth
      );
      
      setStatus(monthlyStatus);
      
      // 月初（1-3日）かつ未生成の場合は自動生成を提案
      const today = new Date();
      if (today.getDate() <= 3 && monthlyStatus.status === 'pending') {
        console.log('📅 月初のため、月次スケジュールの自動生成を推奨します');
      }
      
    } catch (error) {
      console.error('月次スケジュール状態チェックエラー:', error);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [scheduleId, user]);

  // 月次スケジュールを生成
  const generateMonthlySchedule = async (
    year?: number,
    month?: number,
    options?: {
      force?: boolean;
      isAutomatic?: boolean;
    }
  ): Promise<boolean> => {
    if (!scheduleId || !user || isGenerating) {
      return false;
    }

    try {
      setIsGenerating(true);
      
      const targetYear = year || new Date().getFullYear();
      const targetMonth = month || new Date().getMonth() + 1;
      
      const result = await monthlyScheduleManager.generateMonthlySchedule(
        user.uid,
        scheduleId,
        targetYear,
        targetMonth,
        options
      );
      
      if (result) {
        // 状態を再チェック
        await checkStatus(targetYear, targetMonth);
        
        if (!options?.isAutomatic) {
          toast({
            title: "月次スケジュール生成完了",
            description: `${targetYear}年${targetMonth}月のスケジュールが生成されました`,
          });
        }
        
        return true;
      }
      
      return false;
      
    } catch (error) {
      console.error('月次スケジュール生成エラー:', error);
      
      if (!options?.isAutomatic) {
        toast({
          title: "エラー",
          description: "月次スケジュールの生成に失敗しました",
          variant: "destructive",
        });
      }
      
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  // 生成履歴を取得
  const fetchGenerationLogs = useCallback(async () => {
    if (!scheduleId) {
      setGenerationLogs([]);
      return;
    }

    try {
      const q = query(
        collection(db, 'monthlyGenerationLogs'),
        where('scheduleId', '==', scheduleId),
        orderBy('generatedAt', 'desc'),
        limit(12) // 過去1年分
      );
      
      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MonthlyGenerationLog));
      
      setGenerationLogs(logs);
    } catch (error) {
      console.error('生成履歴取得エラー:', error);
      setGenerationLogs([]);
    }
  }, [scheduleId]);

  // 初回ロード時と依存関係変更時に実行
  useEffect(() => {
    checkStatus();
    fetchGenerationLogs();
  }, [scheduleId, checkStatus, fetchGenerationLogs]);

  // 自動生成のチェック（アプリ起動時に1回だけ実行）
  useEffect(() => {
    if (user && scheduleId) {
      monthlyScheduleManager.checkAndGenerateMonthlySchedule(user.uid)
        .catch(console.error);
    }
  }, [user, scheduleId]);

  return {
    status,
    isGenerating,
    generationLogs,
    loading,
    generateMonthlySchedule,
    checkStatus,
    refetchLogs: fetchGenerationLogs,
  };
}

// ========== 月次進捗トラッキングフック ==========
export function useMonthlyProgress(scheduleId?: string, year?: number, month?: number) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<{
    totalHours: number;
    targetHours: number;
    progressPercentage: number;
    subjectProgress: Array<{
      subject: string;
      actual: number;
      target: number;
      percentage: number;
    }>;
    dailyAverage: number;
    remainingDays: number;
    projectedTotal: number;
    isOnTrack: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const calculateProgress = useCallback(async () => {
    if (!user || !scheduleId) {
      setProgress(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const targetYear = year || new Date().getFullYear();
      const targetMonth = month || new Date().getMonth() + 1;
      
      // 月次目標を取得
      const monthlyGoals = await getMonthlyGoalsBySchedule(scheduleId);
      const currentMonthGoal = monthlyGoals.find(
        g => g.year === targetYear && g.month === targetMonth
      );
      
      if (!currentMonthGoal) {
        setProgress(null);
        return;
      }
      
      // 実績データを取得
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0);
      const today = new Date();
      const currentDate = today > endDate ? endDate : today;
      
      const sessions = await getRecentTimerSessions(user.uid, 1000);
      const monthSessions = sessions.filter(session => {
        const sessionDate = session.startTime.toDate();
        return sessionDate >= startDate && sessionDate <= currentDate;
      });
      
      // 科目別の実績を集計
      const subjectActual: { [subject: string]: number } = {};
      let totalActualHours = 0;
      
      monthSessions.forEach(session => {
        const hours = session.elapsedSeconds / 3600;
        totalActualHours += hours;
        
        if (session.subjectId) {
          subjectActual[session.subjectId] = (subjectActual[session.subjectId] || 0) + hours;
        }
      });
      
      // 進捗を計算
      const progressPercentage = currentMonthGoal.totalHours > 0
        ? Math.round((totalActualHours / currentMonthGoal.totalHours) * 100)
        : 0;
      
      // 科目別進捗
      const subjectProgress = currentMonthGoal.subjectGoals.map(goal => ({
        subject: goal.subject,
        actual: Math.round((subjectActual[goal.subject] || 0) * 10) / 10,
        target: goal.targetHours,
        percentage: goal.targetHours > 0
          ? Math.round(((subjectActual[goal.subject] || 0) / goal.targetHours) * 100)
          : 0
      }));
      
      // 日別平均と予測
      const daysElapsed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
      const remainingDays = daysInMonth - daysElapsed;
      const dailyAverage = totalActualHours / daysElapsed;
      const projectedTotal = dailyAverage * daysInMonth;
      
      // 進捗が順調かどうか
      const expectedProgress = (daysElapsed / daysInMonth) * 100;
      const isOnTrack = progressPercentage >= expectedProgress - 10; // 10%の余裕を見る
      
      setProgress({
        totalHours: Math.round(totalActualHours * 10) / 10,
        targetHours: currentMonthGoal.totalHours,
        progressPercentage,
        subjectProgress,
        dailyAverage: Math.round(dailyAverage * 10) / 10,
        remainingDays,
        projectedTotal: Math.round(projectedTotal * 10) / 10,
        isOnTrack
      });
      
    } catch (error) {
      console.error('月次進捗計算エラー:', error);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, [user, scheduleId, year, month]);

  useEffect(() => {
    calculateProgress();
  }, [calculateProgress]);

  return {
    progress,
    loading,
    refetch: calculateProgress
  };
}

// ========== 今日のタスク管理フック ==========
export function useTodayTasks() {
  const { user } = useAuth();
  const { schedule } = useSchedule();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!schedule?.detailedAnalysis) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // 今日の日付に該当するタスクを取得
      const today = new Date();
      const todayTasks = schedule.detailedAnalysis.achievementTasks
        .filter(task => {
          const taskDate = new Date(task.deadline);
          return taskDate.toDateString() === today.toDateString();
        })
        .sort((a, b) => {
          const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

      setTasks(todayTasks);
    } catch (err) {
      console.error('今日のタスク取得エラー:', err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [schedule]);

  const completeTask = async (taskId: string): Promise<boolean> => {
    try {
      // タスク完了処理の実装
      toast({
        title: "タスク完了",
        description: "お疲れ様でした！",
      });
      return true;
    } catch (err) {
      console.error('タスク完了エラー:', err);
      return false;
    }
  };

  return {
    tasks,
    loading,
    completeTask,
  };
}

// ========== 週間スケジュール管理フック ==========
export function useWeeklySchedule() {
  const { user } = useAuth();
  const { schedule } = useSchedule();
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklyData = async () => {
      if (!user || !schedule) {
        setWeeklyData([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // 今週の学習データを取得
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        
        const sessions = await getRecentTimerSessions(user.uid, 100);
        
        // 日別に集計
        const dailyData: { [key: string]: number } = {};
        sessions.forEach(session => {
          const date = session.startTime.toDate().toLocaleDateString();
          if (!dailyData[date]) {
            dailyData[date] = 0;
          }
          dailyData[date] += session.elapsedSeconds / 3600; // 時間に変換
        });

        // 週間データに変換
        const weekData = Object.entries(dailyData).map(([date, hours]) => ({
          date,
          hours: Math.round(hours * 10) / 10,
          target: 4, // 目標時間（仮）
        }));

        setWeeklyData(weekData);
      } catch (err) {
        console.error('週間データ取得エラー:', err);
        setWeeklyData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyData();
  }, [user, schedule]);

  return {
    weeklyData,
    loading,
  };
}

// ========== ユーティリティ関数 ==========
export function calculateDaysUntilTarget(targetDate: Date): number {
  const today = new Date();
  const target = new Date(targetDate);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function formatStudyHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}時間${mins}分`;
}

export function getScheduleStatus(
  targetProgress: number,
  actualProgress: number
): 'on_track' | 'slightly_behind' | 'behind' {
  const difference = actualProgress - targetProgress;
  
  if (difference >= -5) return 'on_track';
  if (difference >= -15) return 'slightly_behind';
  return 'behind';
}

// 型定義のエクスポート
export type {
  Schedule,
  MonthlyGoal,
  PersonalEvent,
  UniversityRequirement,
  UserConstraints,
  EnhancedSchedule,
  MonthlyScheduleStatus,
  MonthlyGenerationLog
} from '@/lib/firebase/schedule';