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
  Timestamp,
  doc,
  setDoc 
} from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface AnalysisRequest {
  userId: string;
  subject: string;
  timeframe: 'week' | 'month' | 'all';
  force?: boolean;
}

interface WeakPoint {
  topic: string;
  errorType: string;
  frequency: number;
  lastOccurred: Date;
  severity: 'high' | 'medium' | 'low';
}

export async function POST(request: Request) {
  try {
    const body: AnalysisRequest = await request.json();
    const { userId, subject, timeframe, force = false } = body;

    if (!userId || !subject || !timeframe) {
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

    // キャッシュチェック（forceフラグがfalseの場合）
    if (!force) {
      const cacheKey = `analysis_${userId}_${subject}_${timeframe}`;
      const cachedAnalysis = await getCachedAnalysis(cacheKey);
      if (cachedAnalysis && isAnalysisRecent(cachedAnalysis.analyzedAt)) {
        return NextResponse.json(cachedAnalysis);
      }
    }

    // 期間設定
    const dateFrom = getDateFrom(timeframe);
    
    // 解答データの取得
    const answersQuery = query(
      collection(db, 'answers'),
      where('userId', '==', userId),
      where('subject', '==', subject),
      where('createdAt', '>=', Timestamp.fromDate(dateFrom)),
      orderBy('createdAt', 'desc')
    );

    const answersSnapshot = await getDocs(answersQuery);
    const answers = answersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (answers.length === 0) {
      return NextResponse.json({
        analysis: {
          overallTrend: 'no_data',
          weakPoints: [],
          strengths: [],
          recommendations: ['まずは問題を解いてみましょう！'],
          predictedMastery: 0
        },
        analyzedAt: new Date().toISOString()
      });
    }

    // 弱点分析
    const weakPoints = analyzeWeakPoints(answers);
    
    // AI分析の実行
    const aiAnalysis = await performAIAnalysis(answers, weakPoints, subject);

    // 結果をキャッシュに保存
    const analysis = {
      analysis: {
        overallTrend: aiAnalysis.trend,
        weakPoints: weakPoints.slice(0, 5), // トップ5の弱点
        strengths: aiAnalysis.strengths,
        recommendations: aiAnalysis.recommendations,
        predictedMastery: aiAnalysis.predictedMastery,
        insights: aiAnalysis.insights
      },
      analyzedAt: new Date().toISOString(),
      dataPoints: answers.length
    };

    // キャッシュに保存
    await saveAnalysisCache(`analysis_${userId}_${subject}_${timeframe}`, analysis);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error analyzing progress:', error);
    return NextResponse.json(
      { error: 'Failed to analyze progress' },
      { status: 500 }
    );
  }
}

// 弱点分析関数
function analyzeWeakPoints(answers: any[]): WeakPoint[] {
  const incorrectAnswers = answers.filter(a => !a.isCorrect);
  const weakPointsMap = new Map<string, WeakPoint>();

  incorrectAnswers.forEach(answer => {
    const key = `${answer.topic}_${answer.errorType || 'unknown'}`;
    const existing = weakPointsMap.get(key);

    if (existing) {
      existing.frequency++;
      if (new Date(answer.createdAt) > existing.lastOccurred) {
        existing.lastOccurred = new Date(answer.createdAt);
      }
    } else {
      weakPointsMap.set(key, {
        topic: answer.topic,
        errorType: answer.errorType || '概念理解不足',
        frequency: 1,
        lastOccurred: new Date(answer.createdAt),
        severity: 'medium' // 後で頻度に応じて更新
      });
    }
  });

  // 頻度に基づいて重要度を設定
  const weakPoints = Array.from(weakPointsMap.values());
  weakPoints.forEach(wp => {
    if (wp.frequency >= 5) wp.severity = 'high';
    else if (wp.frequency >= 3) wp.severity = 'medium';
    else wp.severity = 'low';
  });

  // 頻度順にソート
  return weakPoints.sort((a, b) => b.frequency - a.frequency);
}

// AI分析の実行
async function performAIAnalysis(
  answers: any[], 
  weakPoints: WeakPoint[],
  subject: string
) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // 分析用データの準備
  const totalQuestions = answers.length;
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const correctRate = correctAnswers / totalQuestions;
  
  // トピック別の正答率
  const topicStats = calculateTopicStats(answers);

  const prompt = `
以下の学習データを分析して、高校生の${subject}の学習状況を評価してください。

## 全体統計
- 総問題数: ${totalQuestions}
- 正解数: ${correctAnswers}
- 正答率: ${(correctRate * 100).toFixed(1)}%

## トピック別正答率
${JSON.stringify(topicStats, null, 2)}

## 主な弱点
${weakPoints.slice(0, 5).map(wp => 
  `- ${wp.topic}: ${wp.errorType} (頻度: ${wp.frequency}回)`
).join('\n')}

以下の形式で分析結果を提供してください：
{
  "trend": "improving" | "stable" | "declining",
  "strengths": ["強みのトピック1", "強みのトピック2"],
  "recommendations": ["具体的な学習アドバイス1", "具体的な学習アドバイス2", "具体的な学習アドバイス3"],
  "predictedMastery": 予測習熟度(0-100),
  "insights": "全体的な学習状況の分析（100文字程度）"
}
`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  
  try {
    return JSON.parse(text);
  } catch {
    // JSONパースに失敗した場合のフォールバック
    return {
      trend: correctRate > 0.7 ? 'improving' : 'stable',
      strengths: [],
      recommendations: ['AIによる詳細分析に失敗しました。もう一度お試しください。'],
      predictedMastery: Math.round(correctRate * 100),
      insights: '分析を完了できませんでした。'
    };
  }
}

// トピック別統計の計算
function calculateTopicStats(answers: any[]) {
  const topicMap = new Map<string, { correct: number; total: number }>();

  answers.forEach(answer => {
    const topic = answer.topic;
    const stats = topicMap.get(topic) || { correct: 0, total: 0 };
    stats.total++;
    if (answer.isCorrect) stats.correct++;
    topicMap.set(topic, stats);
  });

  const result: Record<string, number> = {};
  topicMap.forEach((stats, topic) => {
    result[topic] = Math.round((stats.correct / stats.total) * 100);
  });

  return result;
}

// 日付範囲の取得
function getDateFrom(timeframe: 'week' | 'month' | 'all'): Date {
  const now = new Date();
  switch (timeframe) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'all':
      return new Date(0); // 全期間
  }
}

// キャッシュ関連の関数
async function getCachedAnalysis(cacheKey: string) {
  try {
    const cacheDoc = await getDocs(
      query(
        collection(db, 'analysisCache'),
        where('key', '==', cacheKey),
        limit(1)
      )
    );
    
    if (!cacheDoc.empty) {
      return cacheDoc.docs[0].data();
    }
  } catch (error) {
    console.error('Cache read error:', error);
  }
  return null;
}

async function saveAnalysisCache(cacheKey: string, analysis: any) {
  try {
    await setDoc(doc(db, 'analysisCache', cacheKey), {
      key: cacheKey,
      ...analysis,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Cache save error:', error);
  }
}

function isAnalysisRecent(analyzedAt: string): boolean {
  const analysisDate = new Date(analyzedAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - analysisDate.getTime()) / (1000 * 60 * 60);
  return hoursDiff < 6; // 6時間以内は最新とみなす
}