import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit,
  Timestamp 
} from 'firebase/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const subject = searchParams.get('subject');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // 進捗データの取得
    const progressQuery = query(
      collection(db, 'progress'),
      where('userId', '==', userId),
      ...(subject ? [where('subject', '==', subject)] : [])
    );

    const progressSnapshot = await getDocs(progressQuery);
    const progressData = progressSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 解答データから統計を計算
    let answersQuery = query(
      collection(db, 'answers'),
      where('userId', '==', userId),
      ...(subject ? [where('subject', '==', subject)] : []),
      orderBy('createdAt', 'desc')
    );

    // 期間指定がある場合
    if (dateFrom || dateTo) {
      const conditions = [];
      if (dateFrom) {
        conditions.push(where('createdAt', '>=', Timestamp.fromDate(new Date(dateFrom))));
      }
      if (dateTo) {
        conditions.push(where('createdAt', '<=', Timestamp.fromDate(new Date(dateTo))));
      }
      answersQuery = query(answersQuery, ...conditions);
    }

    const answersSnapshot = await getDocs(answersQuery);
    const answers = answersSnapshot.docs.map(doc => doc.data());

    // 統計情報の計算
    const stats = calculateStats(answers);

    // 科目別の進捗データ整形
    const subjectsProgress = subject ? 
      progressData : 
      await getSubjectsProgress(userId);

    // 最近のアクティビティ
    const recentActivityQuery = query(
      collection(db, 'answers'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const recentSnapshot = await getDocs(recentActivityQuery);
    const recentActivity = recentSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));

    const response = {
      overall: {
        mastery: calculateOverallMastery(progressData),
        totalTime: stats.totalTime,
        totalQuestions: stats.totalQuestions,
        correctRate: stats.correctRate
      },
      subjects: subjectsProgress,
      recentActivity,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, subject, updates } = body;

    if (!userId || !subject || !updates) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 認証チェック
    const token = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await auth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 進捗データの更新
    const progressRef = doc(db, 'progress', `${userId}_${subject}`);
    await updateDoc(progressRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}

// ヘルパー関数
function calculateStats(answers: any[]) {
  const totalQuestions = answers.length;
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const totalTime = answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0);

  return {
    totalQuestions,
    correctAnswers,
    correctRate: totalQuestions > 0 ? correctAnswers / totalQuestions : 0,
    totalTime
  };
}

function calculateOverallMastery(progressData: any[]) {
  if (progressData.length === 0) return 0;
  
  const totalMastery = progressData.reduce((sum, p) => sum + (p.mastery || 0), 0);
  return Math.round(totalMastery / progressData.length);
}

async function getSubjectsProgress(userId: string) {
  const subjects = ['math', 'english', 'japanese', 'science', 'social'];
  const subjectsProgress = [];

  for (const subject of subjects) {
    const progressQuery = query(
      collection(db, 'progress'),
      where('userId', '==', userId),
      where('subject', '==', subject)
    );
    
    const snapshot = await getDocs(progressQuery);
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      subjectsProgress.push({
        subject,
        mastery: data.mastery || 0,
        topics: data.topics || {},
        lastStudied: data.lastStudied?.toDate(),
        totalTime: data.totalTime || 0
      });
    }
  }

  return subjectsProgress;
}