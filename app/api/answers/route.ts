import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { Answer, Problem, CanvasAnswerData } from '@/types';
import { CanvasAnswerChecker } from '@/lib/canvas-answer-checker';

// 管理SDKの初期化
initAdmin();
const db = getFirestore();

// 認証チェック
async function validateUser(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken.uid;
  } catch {
    return null;
  }
}

// 正誤判定
function checkAnswer(
  userAnswer: string | string[] | CanvasAnswerData,
  correctAnswer: string | string[],
  problemType: Problem['type'],
  problem: Problem
): { isCorrect: boolean; accuracy?: number; feedback?: string } {
  // Canvas回答の場合
  if (problem.canvasData?.answerType && isCanvasAnswer(userAnswer)) {
    return CanvasAnswerChecker.checkAnswer(userAnswer as CanvasAnswerData, problem);
  }

  // 配列の場合
  if (Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
    if (problemType === 'sequence_sort') {
      // 順序が重要な場合
      return { isCorrect: JSON.stringify(userAnswer) === JSON.stringify(correctAnswer) };
    } else {
      // 順序が重要でない場合（複数選択など）
      const sortedUser = [...userAnswer].sort();
      const sortedCorrect = [...correctAnswer].sort();
      return { isCorrect: JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect) };
    }
  }

  // 文字列の場合
  if (typeof userAnswer === 'string' && typeof correctAnswer === 'string') {
    // 大文字小文字を区別しない、前後の空白を除去
    const normalizedUser = userAnswer.trim().toLowerCase();
    const normalizedCorrect = correctAnswer.trim().toLowerCase();
    
    // 数式の場合は特別な処理
    if (normalizedUser.includes('=') || normalizedCorrect.includes('=')) {
      // スペースを除去して比較
      return { isCorrect: normalizedUser.replace(/\s/g, '') === normalizedCorrect.replace(/\s/g, '') };
    }
    
    return { isCorrect: normalizedUser === normalizedCorrect };
  }

  return { isCorrect: false };
}

// Canvas回答かどうかチェック
function isCanvasAnswer(answer: any): answer is CanvasAnswerData {
  return answer && typeof answer === 'object' && 'type' in answer && 'drawnElements' in answer;
}

// POST: 解答の送信
export async function POST(request: NextRequest) {
  const userId = await validateUser(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      problemId,
      sessionId,
      answer,
      timeSpent,
      confidence,
      hintsUsed = 0,
    } = body;

    // 必須フィールドのチェック
    if (!problemId || !sessionId || answer === undefined || !timeSpent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 問題の取得
    const problemDoc = await db.collection('problems').doc(problemId).get();
    if (!problemDoc.exists) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }

    const problem = problemDoc.data() as Problem;

    // 正誤判定
    const checkResult = checkAnswer(answer, problem.correctAnswer, problem.type, problem);
    const isCorrect = checkResult.isCorrect;
    const accuracy = checkResult.accuracy;
    const canvasFeedback = checkResult.feedback;

    // 解答の保存
    const answerData: Omit<Answer, 'id'> = {
      userId,
      problemId,
      sessionId,
      userAnswer: answer,
      isCorrect,
      timeSpent,
      confidence,
      hintsUsed,
      answeredAt: new Date(),
      subject: problem.subject,
      topic: problem.topic,
      difficulty: problem.difficulty,
      problemType: problem.type,
      points: isCorrect ? problem.points : 0,
    };

    // Canvas回答の場合は追加データを保存
    if (isCanvasAnswer(answer)) {
      answerData.canvasAnswerData = answer;
      answerData.accuracy = accuracy;
    }

    const answerRef = await db.collection('answers').add(answerData);

    // ユーザーの進捗データを更新
    await updateUserProgress(userId, problem, isCorrect, timeSpent);

    // セッションデータの更新
    await updateSessionData(sessionId, isCorrect, timeSpent);

    // リアルタイムフィードバック
    const feedback = canvasFeedback || generateFeedback(isCorrect, problem, answer, hintsUsed);

    return NextResponse.json({
      success: true,
      answerId: answerRef.id,
      isCorrect,
      correctAnswer: problem.correctAnswer,
      explanation: problem.explanation,
      feedback,
      accuracy,
      points: isCorrect ? problem.points : 0,
    });

  } catch (error) {
    console.error('Error submitting answer:', error);
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    );
  }
}

// ユーザー進捗の更新
async function updateUserProgress(
  userId: string,
  problem: Problem,
  isCorrect: boolean,
  timeSpent: number
): Promise<void> {
  const progressRef = db
    .collection('users')
    .doc(userId)
    .collection('progress')
    .doc(problem.subject);

  const progressDoc = await progressRef.get();
  
  if (progressDoc.exists) {
    // 既存の進捗データを更新
    await progressRef.update({
      totalProblems: FieldValue.increment(1),
      correctAnswers: FieldValue.increment(isCorrect ? 1 : 0),
      totalTime: FieldValue.increment(timeSpent),
      [`topics.${problem.topic}.total`]: FieldValue.increment(1),
      [`topics.${problem.topic}.correct`]: FieldValue.increment(isCorrect ? 1 : 0),
      [`difficulties.${problem.difficulty}.total`]: FieldValue.increment(1),
      [`difficulties.${problem.difficulty}.correct`]: FieldValue.increment(isCorrect ? 1 : 0),
      lastUpdated: FieldValue.serverTimestamp(),
    });
  } else {
    // 新規作成
    await progressRef.set({
      userId,
      subject: problem.subject,
      totalProblems: 1,
      correctAnswers: isCorrect ? 1 : 0,
      totalTime: timeSpent,
      topics: {
        [problem.topic]: {
          total: 1,
          correct: isCorrect ? 1 : 0,
        },
      },
      difficulties: {
        [problem.difficulty]: {
          total: 1,
          correct: isCorrect ? 1 : 0,
        },
      },
      createdAt: FieldValue.serverTimestamp(),
      lastUpdated: FieldValue.serverTimestamp(),
    });
  }
}

// セッションデータの更新
async function updateSessionData(
  sessionId: string,
  isCorrect: boolean,
  timeSpent: number
): Promise<void> {
  const sessionRef = db.collection('study_sessions').doc(sessionId);
  
  await sessionRef.update({
    totalAnswered: FieldValue.increment(1),
    correctAnswers: FieldValue.increment(isCorrect ? 1 : 0),
    totalTime: FieldValue.increment(timeSpent),
    lastActivity: FieldValue.serverTimestamp(),
  });
}

// フィードバック生成
function generateFeedback(
  isCorrect: boolean,
  problem: Problem,
  userAnswer: string | string[] | CanvasAnswerData,
  hintsUsed: number
): string {
  if (isCorrect) {
    if (hintsUsed === 0) {
      return '素晴らしい！ヒントを使わずに正解できました。';
    } else if (hintsUsed === 1) {
      return '正解です！少しのヒントで理解できましたね。';
    } else {
      return '正解です。ヒントを活用してよく考えましたね。';
    }
  } else {
    if (problem.type === 'multiple_choice' && problem.options && typeof userAnswer === 'string') {
      // 選択した誤答に応じたフィードバック
      const selectedIndex = problem.options.indexOf(userAnswer);
      if (selectedIndex >= 0) {
        // 誤答パターンに応じたフィードバック（将来的に実装）
        return '惜しい！もう一度問題文を読み返してみましょう。';
      }
    }
    
    return '不正解です。解説をよく読んで、なぜその答えになるのか理解しましょう。';
  }
}

// GET: 解答履歴の取得
export async function GET(request: NextRequest) {
  const userId = await validateUser(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const subject = searchParams.get('subject');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = db
      .collection('answers')
      .where('userId', '==', userId)
      .orderBy('answeredAt', 'desc');

    if (sessionId) {
      query = query.where('sessionId', '==', sessionId);
    }
    if (subject) {
      query = query.where('subject', '==', subject);
    }

    query = query.limit(limit);

    const snapshot = await query.get();
    const answers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Answer));

    return NextResponse.json({
      answers,
      count: answers.length,
    });

  } catch (error) {
    console.error('Error fetching answers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch answers' },
      { status: 500 }
    );
  }
}