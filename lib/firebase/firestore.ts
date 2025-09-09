import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  addDoc,
  serverTimestamp,
  onSnapshot,
  increment,
  arrayUnion,
  deleteDoc,
  writeBatch,
  FieldValue
} from 'firebase/firestore'
import { db, auth } from './config'

// ========== 型定義 ==========
export interface Problem {
  id?: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  content: string;
  answer: string;
  explanation?: string;
  status?: string;
  isPublic?: boolean;
  createdAt?: any;
  updatedAt?: any;
  userId?: string;
  createdBy?: string;
  usageCount?: number;
  avgTimeSpent?: number;
  avgCorrectRate?: number;
  lastUsedAt?: any;
}

export interface ExtendedProblem extends Problem {
  generationParameters?: any;
  validationResults?: any;
  educationalMetadata?: {
    bloomsTaxonomyLevel: string[];
    prerequisiteTopics: string[];
    estimatedSolvingTime: number;
    cognitiveLoad: 'low' | 'medium' | 'high';
  };
  generationHistory?: Array<{
    timestamp: Timestamp;
    parameters: any;
    version: number;
  }>;
}

interface StudySession {
  id: string;
  userId: string;
  subjectId: string;
  topicId: string;
  topicName?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  questionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers?: number;
  [key: string]: any;
}

// ========== ユーザープロファイル関連 ==========
export async function getUserProfile(userId: string) {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

export async function updateUserProfile(userId: string, data: any) {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function createUserProfile(userId: string, data: any) {
  const docRef = doc(db, 'users', userId);
  await setDoc(docRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

// ========== タイマーセッション関連 ==========
export async function getRecentTimerSessions(userId: string, limitCount: number = 10) {
  const q = query(
    collection(db, 'timerSessions'),
    where('userId', '==', userId),
    orderBy('startTime', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function startTimerSessionWithContent(userId: string, content: any) {
  try {
    const docRef = await addDoc(collection(db, 'timerSessions'), {
      userId,
      ...content,
      startTime: serverTimestamp(),
      status: 'active'
    });
    return { success: true, sessionId: docRef.id };
  } catch (error: any) {
    console.error('Error starting timer session:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleTimerPause(sessionId: string, isPaused: boolean) {
  try {
    const docRef = doc(db, 'timerSessions', sessionId);
    await updateDoc(docRef, { 
      isPaused, 
      lastUpdated: serverTimestamp() 
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling timer pause:', error);
    return { success: false, error: error.message };
  }
}

export async function recordBreak(sessionId: string, breakData: any) {
  try {
    const docRef = doc(db, 'timerSessions', sessionId);
    await updateDoc(docRef, {
      breaks: arrayUnion(breakData),
      lastUpdated: serverTimestamp()
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error recording break:', error);
    return { success: false, error: error.message };
  }
}

export async function updateStudyContent(sessionId: string, content: any) {
  try {
    const docRef = doc(db, 'timerSessions', sessionId);
    await updateDoc(docRef, {
      content,
      lastUpdated: serverTimestamp()
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error updating study content:', error);
    return { success: false, error: error.message };
  }
}

export async function endTimerSessionWithFeedback(sessionId: string, feedback: any) {
  try {
    const docRef = doc(db, 'timerSessions', sessionId);
    await updateDoc(docRef, {
      ...feedback,
      endTime: serverTimestamp(),
      status: 'completed'
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error ending timer session:', error);
    return { success: false, error: error.message };
  }
}

export async function submitStudyFeedback(sessionId: string, feedback: any) {
  try {
    const docRef = doc(db, 'timerSessions', sessionId);
    await updateDoc(docRef, {
      feedback,
      feedbackSubmittedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    return { success: false, error: error.message };
  }
}

// ========== 学習分析関連 ==========
export async function getStudySessions(
  userId: string,
  dateRange?: { start: Date; end: Date }
): Promise<StudySession[]> {
  let constraints = [
    where('userId', '==', userId),
    orderBy('endTime', 'desc')
  ];

  if (dateRange) {
    constraints.push(
      where('endTime', '>=', dateRange.start),
      where('endTime', '<=', dateRange.end)
    );
  }

  const q = query(collection(db, 'studySessions'), ...constraints);
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId || userId,
      subjectId: data.subjectId || '',
      topicId: data.topicId || '',
      topicName: data.topicName || '',
      startTime: data.startTime?.toDate() || new Date(),
      endTime: data.endTime?.toDate() || new Date(),
      duration: data.duration || 0,
      questionsAnswered: data.questionsAnswered || 0,
      correctAnswers: data.correctAnswers || 0,
      incorrectAnswers: data.incorrectAnswers || 0,
      ...data
    } as StudySession;
  });
}

export async function getWeaknessAnalysis(userId: string) {
  const sessions = await getStudySessions(userId);
  
  const topicStats = new Map();
  
  sessions.forEach((session: StudySession) => {
    if (!session.topicId) return;
    
    const key = `${session.subjectId}_${session.topicId}`;
    if (!topicStats.has(key)) {
      topicStats.set(key, {
        topicId: session.topicId,
        topicName: session.topicName || session.topicId,
        subjectId: session.subjectId,
        totalQuestions: 0,
        incorrectAnswers: 0,
        sessions: 0,
        lastPracticed: session.endTime
      });
    }
    
    const stats = topicStats.get(key);
    stats.totalQuestions += session.questionsAnswered || 0;
    stats.incorrectAnswers += (session.questionsAnswered || 0) - (session.correctAnswers || 0);
    stats.sessions += 1;
    
    if (session.endTime > stats.lastPracticed) {
      stats.lastPracticed = session.endTime;
    }
  });
  
  const weaknesses = Array.from(topicStats.values())
    .map(stats => ({
      ...stats,
      errorRate: (stats.incorrectAnswers / stats.totalQuestions) * 100 || 0,
      weaknessScore: calculateWeaknessScore(stats),
      improvementTrend: 0,
      recommendedActions: []
    }))
    .filter(w => w.errorRate > 20)
    .sort((a, b) => b.weaknessScore - a.weaknessScore);
  
  return weaknesses;
}

function calculateWeaknessScore(stats: any): number {
  const errorWeight = 0.5;
  const frequencyWeight = 0.3;
  const recencyWeight = 0.2;
  
  const errorScore = stats.errorRate;
  const frequencyScore = Math.min(100, stats.totalQuestions / 10 * 100);
  const daysSinceLastPractice = (Date.now() - stats.lastPracticed) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.min(100, daysSinceLastPractice * 10);
  
  return Math.round(
    errorScore * errorWeight +
    frequencyScore * frequencyWeight +
    recencyScore * recencyWeight
  );
}

export async function calculateStudyMetrics(userId: string) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const [weekSessions, monthSessions] = await Promise.all([
    getStudySessions(userId, { start: weekAgo, end: now }),
    getStudySessions(userId, { start: monthAgo, end: now })
  ]);
  
  const weeklyStudyTime = weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const monthlyStudyTime = monthSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  
  const totalQuestions = monthSessions.reduce((sum, s) => sum + (s.questionsAnswered || 0), 0);
  const totalCorrect = monthSessions.reduce((sum, s) => sum + (s.correctAnswers || 0), 0);
  const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  
  const studyStreak = await calculateStudyStreak(userId);
  
  const weeklyGoal = 20 * 3600;
  const targetAchievement = Math.round((weeklyStudyTime / weeklyGoal) * 100);
  
  return {
    weeklyStudyTime,
    monthlyStudyTime,
    overallAccuracy: Math.round(overallAccuracy),
    studyStreak,
    targetAchievement: Math.min(100, targetAchievement),
    weeklyAverage: Math.round(weeklyStudyTime / 7),
    monthlyGrowth: 0
  };
}

async function calculateStudyStreak(userId: string): Promise<number> {
  const q = query(
    collection(db, 'studySessions'),
    where('userId', '==', userId),
    orderBy('endTime', 'desc'),
    limit(30)
  );
  
  const snapshot = await getDocs(q);
  const sessions = snapshot.docs.map(doc => doc.data().endTime?.toDate());
  
  if (sessions.length === 0) return 0;
  
  const studyDates = new Set(
    sessions.map(date => date.toISOString().split('T')[0])
  );
  
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    
    if (studyDates.has(dateStr)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  
  return streak;
}

// ========== 模擬試験関連 ==========
export async function getMockExamResults(userId: string) {
  const q = query(
    collection(db, 'mockExams'),
    where('userId', '==', userId),
    orderBy('examDate', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function saveMockExamResult(data: any) {
  const docRef = await addDoc(collection(db, 'mockExams'), {
    ...data,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function deleteMockExamResult(examId: string) {
  await deleteDoc(doc(db, 'mockExams', examId));
}

export async function getMockExamGoals(userId: string) {
  const docRef = doc(db, 'mockExamGoals', userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

export async function saveMockExamGoals(userId: string, goals: any) {
  const docRef = doc(db, 'mockExamGoals', userId);
  await setDoc(docRef, goals, { merge: true });
}

export async function analyzeMockExamGrowth(userId: string) {
  const results = await getMockExamResults(userId);
  // TODO: 成長分析ロジックの実装
  return { growth: 0, trend: 'stable' };
}

// ========== その他の関数 ==========
export async function getProblems(filters: any) {
  const constraints = Object.entries(filters).map(([k, v]) => where(k, '==', v));
  const q = query(collection(db, 'problems'), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getEssaySubmissions(userId: string) {
  const q = query(
    collection(db, 'essays'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getQuizResults(userId: string) {
  const q = query(
    collection(db, 'quizResults'),
    where('userId', '==', userId),
    orderBy('completedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function saveTermsAgreement(userId: string, agreementData: any) {
  const docRef = doc(db, 'termsAgreements', userId);
  await setDoc(docRef, {
    ...agreementData,
    agreedAt: serverTimestamp()
  });
}
