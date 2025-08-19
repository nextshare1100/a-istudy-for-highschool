import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdmin } from '@/lib/firebase-admin';
import { Problem } from '@/types';
import { GeneratedProblem } from '@/types/gemini';

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

// GET: 問題一覧の取得
export async function GET(request: NextRequest) {
  const userId = await validateUser(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty');
    const hasCanvas = searchParams.get('hasCanvas');
    const limit = parseInt(searchParams.get('limit') || '20');
    const lastId = searchParams.get('lastId');

    let query = db.collection('problems').orderBy('createdAt', 'desc');

    // フィルタリング
    if (subject) {
      query = query.where('subject', '==', subject);
    }
    if (topic) {
      query = query.where('topic', '==', topic);
    }
    if (difficulty) {
      query = query.where('difficulty', '==', difficulty);
    }
    // Canvas付き問題のフィルタリング
    if (hasCanvas === 'true') {
      query = query.where('canvasConfig', '!=', null);
    }

    // ページネーション
    if (lastId) {
      const lastDoc = await db.collection('problems').doc(lastId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    query = query.limit(limit);

    const snapshot = await query.get();
    const problems = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Problem));

    return NextResponse.json({
      problems,
      hasMore: snapshot.docs.length === limit,
      lastId: snapshot.docs[snapshot.docs.length - 1]?.id,
    });

  } catch (error) {
    console.error('Error fetching problems:', error);
    return NextResponse.json(
      { error: 'Failed to fetch problems' },
      { status: 500 }
    );
  }
}

// POST: 問題の保存（バッチ保存対応）
export async function POST(request: NextRequest) {
  const userId = await validateUser(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { problems, sessionId } = body;

    if (!problems || !Array.isArray(problems)) {
      return NextResponse.json(
        { error: 'Invalid problems data' },
        { status: 400 }
      );
    }

    const batch = db.batch();
    const savedProblems: Problem[] = [];
    const timestamp = new Date();

    for (const generatedProblem of problems as GeneratedProblem[]) {
      const problemRef = db.collection('problems').doc();
      
      // GeneratedProblemからProblem型への変換（Canvas対応）
      const problem: Omit<Problem, 'id'> = {
        question: generatedProblem.question,
        type: generatedProblem.type,
        options: generatedProblem.options,
        correctAnswer: generatedProblem.correctAnswer,
        explanation: generatedProblem.explanation,
        hints: generatedProblem.hints,
        difficulty: generatedProblem.difficulty,
        subject: body.subject || '',
        topic: body.topic || '',
        subtopic: body.subtopic,
        imageUrl: generatedProblem.imageUrl,
        points: generatedProblem.points,
        estimatedTime: generatedProblem.estimatedTime,
        tags: generatedProblem.tags,
        createdAt: timestamp,
        createdBy: 'gemini',
        sessionId,
        generatedFor: userId,
        // Canvas設定を追加
        canvasConfig: generatedProblem.canvasConfig || null,
      };

      batch.set(problemRef, problem);
      savedProblems.push({
        id: problemRef.id,
        ...problem,
      });
    }

    await batch.commit();

    // 問題生成履歴の記録
    await db.collection('problem_generation_history').add({
      userId,
      sessionId,
      problemCount: savedProblems.length,
      subject: body.subject,
      topic: body.topic,
      difficulty: body.difficulty,
      hasCanvas: savedProblems.some(p => p.canvasConfig !== null),
      createdAt: timestamp,
    });

    return NextResponse.json({
      success: true,
      problems: savedProblems,
      count: savedProblems.length,
    });

  } catch (error) {
    console.error('Error saving problems:', error);
    return NextResponse.json(
      { error: 'Failed to save problems' },
      { status: 500 }
    );
  }
}

// PUT: 問題の更新（Canvas設定の更新を含む）
export async function PUT(request: NextRequest) {
  const userId = await validateUser(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { problemId, updates } = body;

    if (!problemId) {
      return NextResponse.json(
        { error: 'Problem ID is required' },
        { status: 400 }
      );
    }

    // 更新者の権限チェック
    const problemDoc = await db.collection('problems').doc(problemId).get();
    if (!problemDoc.exists) {
      return NextResponse.json(
        { error: 'Problem not found' },
        { status: 404 }
      );
    }

    const problemData = problemDoc.data();
    
    // 作成者または管理者のみ更新可能
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (problemData?.generatedFor !== userId && userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }

    // 更新データの準備
    const updateData = {
      ...updates,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    // Canvas設定の検証
    if (updates.canvasConfig) {
      updateData.canvasConfig = {
        width: updates.canvasConfig.width || 600,
        height: updates.canvasConfig.height || 400,
        gridSize: updates.canvasConfig.gridSize || 20,
        showGrid: updates.canvasConfig.showGrid !== false,
        showAxes: updates.canvasConfig.showAxes !== false,
        elements: updates.canvasConfig.elements || [],
        answerConfig: updates.canvasConfig.answerConfig || null,
      };
    }

    await db.collection('problems').doc(problemId).update(updateData);

    return NextResponse.json({
      success: true,
      problemId,
      updated: updateData,
    });

  } catch (error) {
    console.error('Error updating problem:', error);
    return NextResponse.json(
      { error: 'Failed to update problem' },
      { status: 500 }
    );
  }
}

// DELETE: 問題の削除（管理者のみ）
export async function DELETE(request: NextRequest) {
  const userId = await validateUser(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get('id');

    if (!problemId) {
      return NextResponse.json(
        { error: 'Problem ID is required' },
        { status: 400 }
      );
    }

    // 管理者チェック（実装は認証システムに依存）
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    await db.collection('problems').doc(problemId).delete();

    return NextResponse.json({
      success: true,
      deletedId: problemId,
    });

  } catch (error) {
    console.error('Error deleting problem:', error);
    return NextResponse.json(
      { error: 'Failed to delete problem' },
      { status: 500 }
    );
  }
}