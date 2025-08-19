import { create } from 'zustand';
import { Problem, StudySession, Answer, UserProfile } from '@/types';
import { db } from '@/lib/firebase/client';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { geminiService } from '@/lib/gemini/client';

interface StudyState {
  // 現在の学習セッション
  currentSession: StudySession | null;
  currentProblem: Problem | null;
  problemQueue: Problem[];
  
  // タイマー状態
  timerState: 'idle' | 'running' | 'paused' | 'break';
  timerSeconds: number;
  timerType: 'pomodoro' | 'normal' | 'none';
  pomodoroConfig: {
    workTime: number;
    breakTime: number;
    currentCycle: number;
    totalCycles: number;
  };
  
  // 学習統計（セッション内）
  sessionStats: {
    totalProblems: number;
    correctAnswers: number;
    totalTime: number;
    avgTimePerProblem: number;
  };
  
  // 内部状態
  sessionStartTime: number;
  problemStartTime: number;
  timerInterval: NodeJS.Timeout | null;
  
  // アクション
  startSession: (params: {
    subject: string;
    topic: string;
    difficulty: 'basic' | 'standard' | 'advanced';
    timerType: 'pomodoro' | 'normal' | 'none';
    userProfile: UserProfile;
  }) => Promise<void>;
  
  endSession: () => Promise<void>;
  
  submitAnswer: (
    answer: string | string[],
    confidence: number,
    hintsUsed: number
  ) => Promise<boolean>;
  
  nextProblem: () => void;
  
  // タイマーアクション
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipBreak: () => void;
  
  // 内部メソッド
  _tick: () => void;
  _generateProblems: (request: any) => Promise<void>;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  // 初期状態
  currentSession: null,
  currentProblem: null,
  problemQueue: [],
  
  timerState: 'idle',
  timerSeconds: 0,
  timerType: 'none',
  pomodoroConfig: {
    workTime: 25 * 60, // 25分
    breakTime: 5 * 60, // 5分
    currentCycle: 1,
    totalCycles: 4,
  },
  
  sessionStats: {
    totalProblems: 0,
    correctAnswers: 0,
    totalTime: 0,
    avgTimePerProblem: 0,
  },
  
  sessionStartTime: 0,
  problemStartTime: 0,
  timerInterval: null,
  
  // セッション開始
  startSession: async (params) => {
    const { subject, topic, difficulty, timerType, userProfile } = params;
    
    try {
      // セッションをFirestoreに作成
      const sessionRef = await addDoc(collection(db, 'studySessions'), {
        userId: userProfile.uid,
        subject,
        topic,
        startedAt: serverTimestamp(),
        problemCount: 0,
        correctCount: 0,
        accuracy: 0,
        timerType,
        createdAt: serverTimestamp(),
      });
      
      const session: StudySession = {
        id: sessionRef.id,
        userId: userProfile.uid,
        subject,
        topic,
        startedAt: Timestamp.now(),
        problemCount: 0,
        correctCount: 0,
        accuracy: 0,
        timerType,
        createdAt: Timestamp.now(),
      };
      
      // 問題を生成
      await get()._generateProblems({
        subject,
        topic,
        difficulty,
        count: 10,
        userProfile,
      });
      
      // タイマー設定
      const timerSeconds = timerType === 'pomodoro' 
        ? get().pomodoroConfig.workTime 
        : 0;
      
      set({
        currentSession: session,
        currentProblem: get().problemQueue[0],
        problemQueue: get().problemQueue.slice(1),
        timerType,
        timerSeconds,
        timerState: 'idle',
        sessionStartTime: Date.now(),
        problemStartTime: Date.now(),
        sessionStats: {
          totalProblems: 0,
          correctAnswers: 0,
          totalTime: 0,
          avgTimePerProblem: 0,
        },
      });
    } catch (error) {
      console.error('セッション開始エラー:', error);
      throw error;
    }
  },
  
  // セッション終了
  endSession: async () => {
    const { currentSession, sessionStats, timerInterval } = get();
    if (!currentSession) return;
    
    // タイマー停止
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    const duration = Math.floor((Date.now() - get().sessionStartTime) / 1000 / 60);
    
    // セッションを更新
    await updateDoc(doc(db, 'studySessions', currentSession.id), {
      endedAt: serverTimestamp(),
      duration,
      problemCount: sessionStats.totalProblems,
      correctCount: sessionStats.correctAnswers,
      accuracy: sessionStats.totalProblems > 0 
        ? Math.round((sessionStats.correctAnswers / sessionStats.totalProblems) * 100)
        : 0,
    });
    
    set({
      currentSession: null,
      currentProblem: null,
      problemQueue: [],
      timerState: 'idle',
      timerInterval: null,
    });
  },
  
  // 解答送信
  submitAnswer: async (answer, confidence, hintsUsed) => {
    const { currentSession, currentProblem, sessionStats } = get();
    if (!currentSession || !currentProblem) return false;
    
    const timeSpent = Math.floor((Date.now() - get().problemStartTime) / 1000);
    
    // 正誤判定
    let isCorrect = false;
    if (Array.isArray(currentProblem.correctAnswer) && Array.isArray(answer)) {
      isCorrect = 
        currentProblem.correctAnswer.length === answer.length &&
        currentProblem.correctAnswer.every(a => answer.includes(a));
    } else {
      isCorrect = currentProblem.correctAnswer === answer;
    }
    
    // 解答を保存
    await addDoc(collection(db, 'answers'), {
      userId: currentSession.userId,
      sessionId: currentSession.id,
      problemId: currentProblem.id,
      userAnswer: answer,
      isCorrect,
      timeSpent,
      hintsUsed,
      confidence,
      answeredAt: serverTimestamp(),
    });
    
    // 統計更新
    const newTotalProblems = sessionStats.totalProblems + 1;
    const newCorrectAnswers = sessionStats.correctAnswers + (isCorrect ? 1 : 0);
    const newTotalTime = sessionStats.totalTime + timeSpent;
    
    set({
      sessionStats: {
        totalProblems: newTotalProblems,
        correctAnswers: newCorrectAnswers,
        totalTime: newTotalTime,
        avgTimePerProblem: Math.floor(newTotalTime / newTotalProblems),
      },
    });
    
    return isCorrect;
  },
  
  // 次の問題へ
  nextProblem: () => {
    const { problemQueue } = get();
    
    if (problemQueue.length > 0) {
      set({
        currentProblem: problemQueue[0],
        problemQueue: problemQueue.slice(1),
        problemStartTime: Date.now(),
      });
    } else {
      set({
        currentProblem: null,
      });
    }
  },
  
  // タイマー開始
  startTimer: () => {
    const { timerType, timerInterval } = get();
    
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    const interval = setInterval(() => {
      get()._tick();
    }, 1000);
    
    set({
      timerState: 'running',
      timerInterval: interval,
    });
  },
  
  // タイマー一時停止
  pauseTimer: () => {
    const { timerInterval } = get();
    
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    set({
      timerState: 'paused',
      timerInterval: null,
    });
  },
  
  // タイマーリセット
  resetTimer: () => {
    const { timerInterval, timerType, pomodoroConfig } = get();
    
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    const timerSeconds = timerType === 'pomodoro' 
      ? pomodoroConfig.workTime 
      : 0;
    
    set({
      timerState: 'idle',
      timerSeconds,
      timerInterval: null,
    });
  },
  
  // 休憩スキップ
  skipBreak: () => {
    const { pomodoroConfig } = get();
    
    set({
      timerState: 'idle',
      timerSeconds: pomodoroConfig.workTime,
      pomodoroConfig: {
        ...pomodoroConfig,
        currentCycle: pomodoroConfig.currentCycle + 1,
      },
    });
  },
  
  // タイマー更新（内部）
  _tick: () => {
    const { timerState, timerSeconds, timerType, pomodoroConfig } = get();
    
    if (timerState !== 'running') return;
    
    if (timerType === 'pomodoro') {
      if (timerSeconds > 0) {
        set({ timerSeconds: timerSeconds - 1 });
      } else {
        // タイマー終了
        if (get().timerState === 'break') {
          // 休憩終了 → 作業開始
          set({
            timerState: 'idle',
            timerSeconds: pomodoroConfig.workTime,
            pomodoroConfig: {
              ...pomodoroConfig,
              currentCycle: pomodoroConfig.currentCycle + 1,
            },
          });
          
          // 通知
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('休憩終了', {
              body: '作業を再開しましょう！',
              icon: '/icon-192x192.png',
            });
          }
        } else {
          // 作業終了 → 休憩開始
          set({
            timerState: 'break',
            timerSeconds: pomodoroConfig.breakTime,
          });
          
          // 通知
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('作業終了', {
              body: '5分間の休憩を取りましょう！',
              icon: '/icon-192x192.png',
            });
          }
        }
      }
    } else if (timerType === 'normal') {
      // 通常タイマーはカウントアップ
      set({ timerSeconds: timerSeconds + 1 });
    }
  },
  
  // 問題生成（内部）
  _generateProblems: async (request) => {
    try {
      const problems = await geminiService.generateProblems(request);
      
      // Firestoreに保存
      const savedProblems = await Promise.all(
        problems.map(async (problem) => {
          const ref = await addDoc(collection(db, 'problems'), {
            ...problem,
            createdAt: serverTimestamp(),
          });
          return { ...problem, id: ref.id };
        })
      );
      
      set({
        problemQueue: savedProblems,
      });
    } catch (error) {
      console.error('問題生成エラー:', error);
      throw error;
    }
  },
}));