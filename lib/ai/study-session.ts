import { 
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from '../firebase/config';

// 学習セッションの型定義
export interface StudySession {
  id: string;
  userId: string;
  subject: string;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  problems: StudyProblem[];
  totalProblems: number;
  correctAnswers: number;
  totalTime: number; // 秒単位
  status: 'active' | 'completed';
}

export interface StudyProblem {
  id: string;
  question: string;
  choices?: string[];
  correctAnswer: string;
  userAnswer?: string;
  isCorrect?: boolean;
  explanation: string;
  topic: string;
  difficulty: string;
  answeredAt?: Timestamp;
  timeSpent?: number; // 秒単位
}

// 学習統計の型定義
export interface StudyStats {
  totalSessions: number;
  totalProblems: number;
  totalCorrect: number;
  averageAccuracy: number;
  subjectStats: {
    [subject: string]: {
      sessions: number;
      problems: number;
      correct: number;
      accuracy: number;
      totalTime: number;
    };
  };
}

// 新しい学習セッションを開始
export async function createStudySession(
  userId: string,
  subject: string
): Promise<string> {
  try {
    const sessionId = doc(collection(db, 'studySessions')).id;
    const sessionRef = doc(db, 'studySessions', sessionId);
    
    const newSession: StudySession = {
      id: sessionId,
      userId,
      subject,
      startedAt: serverTimestamp() as Timestamp,
      problems: [],
      totalProblems: 0,
      correctAnswers: 0,
      totalTime: 0,
      status: 'active'
    };
    
    await setDoc(sessionRef, newSession);
    return sessionId;
  } catch (error) {
    console.error('学習セッション作成エラー:', error);
    throw error;
  }
}

// 学習セッションに問題を追加
export async function addProblemToSession(
  sessionId: string,
  problem: Omit<StudyProblem, 'id'>
): Promise<void> {
  try {
    const sessionRef = doc(db, 'studySessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      throw new Error('セッションが見つかりません');
    }
    
    const sessionData = sessionDoc.data() as StudySession;
    const problemId = `problem_${Date.now()}`;
    
    const newProblem: StudyProblem = {
      id: problemId,
      ...problem
    };
    
    await updateDoc(sessionRef, {
      problems: [...sessionData.problems, newProblem],
      totalProblems: increment(1)
    });
  } catch (error) {
    console.error('問題追加エラー:', error);
    throw error;
  }
}

// 回答を記録
export async function recordAnswer(
  sessionId: string,
  problemId: string,
  userAnswer: string,
  timeSpent: number
): Promise<boolean> {
  try {
    const sessionRef = doc(db, 'studySessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      throw new Error('セッションが見つかりません');
    }
    
    const sessionData = sessionDoc.data() as StudySession;
    const problems = sessionData.problems.map(p => {
      if (p.id === problemId) {
        const isCorrect = p.correctAnswer === userAnswer;
        return {
          ...p,
          userAnswer,
          isCorrect,
          answeredAt: serverTimestamp() as Timestamp,
          timeSpent
        };
      }
      return p;
    });
    
    const correctCount = problems.filter(p => p.isCorrect).length;
    
    await updateDoc(sessionRef, {
      problems,
      correctAnswers: correctCount,
      totalTime: increment(timeSpent)
    });
    
    return problems.find(p => p.id === problemId)?.isCorrect || false;
  } catch (error) {
    console.error('回答記録エラー:', error);
    throw error;
  }
}

// 学習セッションを終了
export async function completeStudySession(sessionId: string): Promise<void> {
  try {
    const sessionRef = doc(db, 'studySessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      throw new Error('セッションが見つかりません');
    }
    
    const sessionData = sessionDoc.data() as StudySession;
    
    // セッションを完了
    await updateDoc(sessionRef, {
      endedAt: serverTimestamp(),
      status: 'completed'
    });
    
    // ユーザーの統計を更新
    const userRef = doc(db, 'users', sessionData.userId);
    await updateDoc(userRef, {
      totalStudyTime: increment(Math.floor(sessionData.totalTime / 60)), // 分単位
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('セッション終了エラー:', error);
    throw error;
  }
}

// ユーザーの学習履歴を取得
export async function getUserStudySessions(
  userId: string,
  limitCount: number = 10
): Promise<StudySession[]> {
  try {
    const q = query(
      collection(db, 'studySessions'),
      where('userId', '==', userId),
      where('status', '==', 'completed'),
      orderBy('endedAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as StudySession));
  } catch (error) {
    console.error('学習履歴取得エラー:', error);
    throw error;
  }
}

// ユーザーの学習統計を計算
export async function calculateUserStats(userId: string): Promise<StudyStats> {
  try {
    const q = query(
      collection(db, 'studySessions'),
      where('userId', '==', userId),
      where('status', '==', 'completed')
    );
    
    const querySnapshot = await getDocs(q);
    const sessions = querySnapshot.docs.map(doc => doc.data() as StudySession);
    
    const stats: StudyStats = {
      totalSessions: sessions.length,
      totalProblems: 0,
      totalCorrect: 0,
      averageAccuracy: 0,
      subjectStats: {}
    };
    
    sessions.forEach(session => {
      stats.totalProblems += session.totalProblems;
      stats.totalCorrect += session.correctAnswers;
      
      if (!stats.subjectStats[session.subject]) {
        stats.subjectStats[session.subject] = {
          sessions: 0,
          problems: 0,
          correct: 0,
          accuracy: 0,
          totalTime: 0
        };
      }
      
      const subjectStat = stats.subjectStats[session.subject];
      subjectStat.sessions++;
      subjectStat.problems += session.totalProblems;
      subjectStat.correct += session.correctAnswers;
      subjectStat.totalTime += session.totalTime;
    });
    
    // 正答率の計算
    stats.averageAccuracy = stats.totalProblems > 0
      ? (stats.totalCorrect / stats.totalProblems) * 100
      : 0;
    
    // 科目別正答率の計算
    Object.keys(stats.subjectStats).forEach(subject => {
      const subjectStat = stats.subjectStats[subject];
      subjectStat.accuracy = subjectStat.problems > 0
        ? (subjectStat.correct / subjectStat.problems) * 100
        : 0;
    });
    
    return stats;
  } catch (error) {
    console.error('統計計算エラー:', error);
    throw error;
  }
}