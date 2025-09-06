import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const db = admin.firestore();

interface Answer {
  id: string;
  userId: string;
  sessionId: string;
  questionId: string;
  subject: string;
  topic: string;
  subtopic?: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  timeSpent: number;
  createdAt: Timestamp;
}

interface Progress {
  userId: string;
  subject: string;
  mastery: number;
  topics: Record<string, number>;
  totalQuestions: number;
  correctAnswers: number;
  totalTime: number;
  lastStudied: Timestamp;
  streakDays: number;
  weakPoints: WeakPoint[];
  updatedAt: Timestamp;
}

interface WeakPoint {
  topic: string;
  subtopic?: string;
  errorType: string;
  frequency: number;
  lastOccurred: Timestamp;
  examples: string[];
}

// 解答作成時にトリガーされる関数
export const onAnswerCreated = functions.firestore
  .document('answers/{answerId}')
  .onCreate(async (snap, context) => {
    const answer = snap.data() as Answer;
    
    try {
      // 1. 進捗データの取得または作成
      const progressId = `${answer.userId}_${answer.subject}`;
      const progressRef = db.collection('progress').doc(progressId);
      const progressDoc = await progressRef.get();
      
      let progress: Progress;
      if (progressDoc.exists) {
        progress = progressDoc.data() as Progress;
      } else {
        // 新規作成
        progress = {
          userId: answer.userId,
          subject: answer.subject,
          mastery: 0,
          topics: {},
          totalQuestions: 0,
          correctAnswers: 0,
          totalTime: 0,
          lastStudied: Timestamp.now(),
          streakDays: 1,
          weakPoints: [],
          updatedAt: Timestamp.now()
        };
      }

      // 2. 基本統計の更新
      progress.totalQuestions++;
      if (answer.isCorrect) {
        progress.correctAnswers++;
      }
      progress.totalTime += answer.timeSpent;
      progress.lastStudied = Timestamp.now();

      // 3. トピック別習熟度の更新
      await updateTopicMastery(progress, answer);

      // 4. 弱点分析の更新（不正解の場合）
      if (!answer.isCorrect) {
        await updateWeakPoints(progress, answer);
      }

      // 5. 全体習熟度の再計算
      progress.mastery = calculateOverallMastery(progress);

      // 6. 連続学習日数の更新
      await updateStreakDays(progress, progressDoc.exists ? progressDoc.data() : null);

      // 7. 進捗データの保存
      progress.updatedAt = Timestamp.now();
      await progressRef.set(progress);

      // 8. マイルストーン達成チェック
      await checkMilestones(answer.userId, progress);

      // 9. 週次/月次レポートの更新
      await updatePeriodicReports(answer.userId, answer.subject, progress);

      console.log(`Progress updated for user ${answer.userId} in ${answer.subject}`);
    } catch (error) {
      console.error('Error updating progress:', error);
      throw error;
    }
  });

// トピック別習熟度の更新
async function updateTopicMastery(progress: Progress, answer: Answer) {
  const topic = answer.topic;
  
  // 現在のトピック習熟度を取得
  const currentMastery = progress.topics[topic] || 0;
  
  // 最近の解答履歴を取得（最大20件）
  const recentAnswers = await db.collection('answers')
    .where('userId', '==', answer.userId)
    .where('subject', '==', answer.subject)
    .where('topic', '==', topic)
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();

  // 正答率と難易度を考慮した習熟度計算
  let totalWeight = 0;
  let weightedCorrect = 0;
  
  recentAnswers.docs.forEach((doc, index) => {
    const data = doc.data() as Answer;
    const recencyWeight = Math.exp(-index * 0.1); // 新しい解答ほど重み大
    const difficultyWeight = data.difficulty === 'hard' ? 1.5 : 
                           data.difficulty === 'medium' ? 1.0 : 0.7;
    
    const weight = recencyWeight * difficultyWeight;
    totalWeight += weight;
    if (data.isCorrect) {
      weightedCorrect += weight;
    }
  });

  // 新しい習熟度を計算（忘却曲線を考慮）
  const rawMastery = totalWeight > 0 ? (weightedCorrect / totalWeight) * 100 : 0;
  const decayFactor = calculateDecayFactor(progress.lastStudied);
  const newMastery = Math.round(rawMastery * decayFactor);

  progress.topics[topic] = Math.max(0, Math.min(100, newMastery));
}

// 弱点分析の更新
async function updateWeakPoints(progress: Progress, answer: Answer) {
  const errorType = determineErrorType(answer);
  
  // 既存の弱点を検索
  const existingIndex = progress.weakPoints.findIndex(
    wp => wp.topic === answer.topic && wp.errorType === errorType
  );

  if (existingIndex >= 0) {
    // 既存の弱点を更新
    const weakPoint = progress.weakPoints[existingIndex];
    weakPoint.frequency++;
    weakPoint.lastOccurred = Timestamp.now();
    
    // 例を追加（最大3つ）
    if (!weakPoint.examples.includes(answer.questionId)) {
      weakPoint.examples.push(answer.questionId);
      if (weakPoint.examples.length > 3) {
        weakPoint.examples.shift();
      }
    }
  } else {
    // 新しい弱点を追加
    progress.weakPoints.push({
      topic: answer.topic,
      subtopic: answer.subtopic,
      errorType,
      frequency: 1,
      lastOccurred: Timestamp.now(),
      examples: [answer.questionId]
    });
  }

  // 弱点を頻度順にソート（最大10件）
  progress.weakPoints.sort((a, b) => b.frequency - a.frequency);
  if (progress.weakPoints.length > 10) {
    progress.weakPoints = progress.weakPoints.slice(0, 10);
  }
}

// エラータイプの判定
function determineErrorType(answer: Answer): string {
  // 実際の実装では、より詳細な分析を行う
  // ここでは簡易的な判定
  const userAnswer = answer.userAnswer.toLowerCase();
  const correctAnswer = answer.correctAnswer.toLowerCase();

  if (answer.subject === 'math') {
    if (userAnswer.includes('計算') || /\d/.test(userAnswer)) {
      return '計算ミス';
    } else if (userAnswer.includes('公式') || userAnswer.includes('定理')) {
      return '公式の理解不足';
    }
  } else if (answer.subject === 'english') {
    if (userAnswer.includes('grammar') || userAnswer.includes('文法')) {
      return '文法ミス';
    } else if (userAnswer.includes('vocabulary') || userAnswer.includes('語彙')) {
      return '語彙不足';
    }
  }

  return '概念理解不足';
}

// 全体習熟度の計算
function calculateOverallMastery(progress: Progress): number {
  const topics = Object.values(progress.topics);
  if (topics.length === 0) return 0;

  // 各トピックの重要度を考慮（ここでは均等）
  const totalMastery = topics.reduce((sum, mastery) => sum + mastery, 0);
  return Math.round(totalMastery / topics.length);
}

// 忘却曲線に基づく減衰係数の計算
function calculateDecayFactor(lastStudied: Timestamp): number {
  const now = Date.now();
  const lastStudiedMs = lastStudied.toMillis();
  const daysSince = (now - lastStudiedMs) / (1000 * 60 * 60 * 24);

  // エビングハウスの忘却曲線に基づく簡易計算
  if (daysSince <= 1) return 1.0;
  if (daysSince <= 7) return 0.9;
  if (daysSince <= 30) return 0.8;
  return 0.7;
}

// 連続学習日数の更新
async function updateStreakDays(progress: Progress, previousData: any) {
  if (!previousData) {
    progress.streakDays = 1;
    return;
  }

  const lastStudied = previousData.lastStudied as Timestamp;
  const lastDate = new Date(lastStudied.toMillis());
  const today = new Date();

  // 日付のみを比較（時刻は無視）
  lastDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    // 同じ日
    return;
  } else if (daysDiff === 1) {
    // 連続
    progress.streakDays = (previousData.streakDays || 0) + 1;
  } else {
    // 連続が途切れた
    progress.streakDays = 1;
  }
}

// マイルストーン達成チェック
async function checkMilestones(userId: string, progress: Progress) {
  const milestones = [
    { name: 'first_perfect', condition: () => progress.topics[Object.keys(progress.topics)[0]] >= 100 },
    { name: 'week_streak', condition: () => progress.streakDays >= 7 },
    { name: 'master_subject', condition: () => progress.mastery >= 80 },
    { name: '100_questions', condition: () => progress.totalQuestions >= 100 },
  ];

  for (const milestone of milestones) {
    if (milestone.condition()) {
      // 通知を作成
      await db.collection('notifications').add({
        userId,
        type: 'milestone',
        milestone: milestone.name,
        subject: progress.subject,
        createdAt: Timestamp.now(),
        read: false
      });
    }
  }
}

// 週次/月次レポートの更新
async function updatePeriodicReports(userId: string, subject: string, progress: Progress) {
  const now = new Date();
  const weekKey = `${now.getFullYear()}-W${getWeekNumber(now)}`;
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 週次レポート
  const weekReportRef = db.collection('weeklyReports').doc(`${userId}_${weekKey}`);
  await weekReportRef.set({
    [subject]: {
      mastery: progress.mastery,
      questionsAnswered: progress.totalQuestions,
      correctRate: progress.correctAnswers / progress.totalQuestions,
      studyTime: progress.totalTime,
      updatedAt: Timestamp.now()
    }
  }, { merge: true });

  // 月次レポート
  const monthReportRef = db.collection('monthlyReports').doc(`${userId}_${monthKey}`);
  await monthReportRef.set({
    [subject]: {
      mastery: progress.mastery,
      questionsAnswered: progress.totalQuestions,
      correctRate: progress.correctAnswers / progress.totalQuestions,
      studyTime: progress.totalTime,
      weakPoints: progress.weakPoints.slice(0, 5),
      updatedAt: Timestamp.now()
    }
  }, { merge: true });
}

// 週番号を取得するヘルパー関数
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}