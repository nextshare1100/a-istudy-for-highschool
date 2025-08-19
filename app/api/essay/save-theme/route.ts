// app/api/essay/save-theme/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, adminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const { success, decodedToken } = await verifyIdToken(token);
    
    if (!success || !decodedToken) {
      return NextResponse.json({ error: '無効なトークンです' }, { status: 401 });
    }

    // リクエストボディの取得
    const body = await request.json();
    const { theme } = body;

    if (!theme) {
      return NextResponse.json({ error: 'テーマデータが必要です' }, { status: 400 });
    }

    // テーマデータの検証
    if (!theme.title || !theme.description) {
      return NextResponse.json(
        { error: 'タイトルと説明は必須です' },
        { status: 400 }
      );
    }

    // テーマデータに必要な情報を追加
    const themeData = {
      ...theme,
      userId: decodedToken.uid,
      userEmail: decodedToken.email || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      // デフォルト値の設定
      isPublic: theme.isPublic || false,
      isActive: true,
      viewCount: 0,
      usageCount: 0,
      // メタデータ
      metadata: {
        source: 'user_generated',
        version: '1.0',
        ...(theme.metadata || {})
      }
    };

    // Admin SDKを使用して保存（セキュリティルールをバイパス）
    const docRef = await adminFirestore
      .collection('essay_themes')
      .add(themeData);

    console.log(`[Success] Theme saved: ${docRef.id} by user: ${decodedToken.uid}`);

    // 保存成功のレスポンス
    return NextResponse.json({
      success: true,
      themeId: docRef.id,
      message: 'テーマが正常に保存されました'
    });

  } catch (error) {
    console.error('[Error] Saving theme:', error);
    
    // エラーの種類に応じたレスポンス
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        return NextResponse.json(
          { error: '権限がありません' },
          { status: 403 }
        );
      }
      if (error.message.includes('network')) {
        return NextResponse.json(
          { error: 'ネットワークエラーが発生しました' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'テーマの保存に失敗しました' },
      { status: 500 }
    );
  }
}

// テーマの更新用エンドポイント
export async function PUT(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const { success, decodedToken } = await verifyIdToken(token);
    
    if (!success || !decodedToken) {
      return NextResponse.json({ error: '無効なトークンです' }, { status: 401 });
    }

    // リクエストボディの取得
    const body = await request.json();
    const { themeId, updates } = body;

    if (!themeId || !updates) {
      return NextResponse.json(
        { error: 'テーマIDと更新データが必要です' },
        { status: 400 }
      );
    }

    // 既存のテーマを取得して所有者を確認
    const themeDoc = await adminFirestore
      .collection('essay_themes')
      .doc(themeId)
      .get();

    if (!themeDoc.exists) {
      return NextResponse.json(
        { error: 'テーマが見つかりません' },
        { status: 404 }
      );
    }

    const themeData = themeDoc.data();
    if (themeData?.userId !== decodedToken.uid) {
      return NextResponse.json(
        { error: 'このテーマを編集する権限がありません' },
        { status: 403 }
      );
    }

    // 更新データの準備（一部のフィールドは更新不可）
    const allowedUpdates = {
      title: updates.title,
      description: updates.description,
      category: updates.category,
      wordLimit: updates.wordLimit,
      timeLimit: updates.timeLimit,
      difficulty: updates.difficulty,
      keywords: updates.keywords,
      isPublic: updates.isPublic,
      updatedAt: FieldValue.serverTimestamp()
    };

    // undefined値を除去
    const cleanedUpdates = Object.entries(allowedUpdates)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    // 更新実行
    await adminFirestore
      .collection('essay_themes')
      .doc(themeId)
      .update(cleanedUpdates);

    console.log(`[Success] Theme updated: ${themeId} by user: ${decodedToken.uid}`);

    return NextResponse.json({
      success: true,
      message: 'テーマが更新されました'
    });

  } catch (error) {
    console.error('[Error] Updating theme:', error);
    return NextResponse.json(
      { error: 'テーマの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// テーマの削除用エンドポイント
export async function DELETE(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const { success, decodedToken } = await verifyIdToken(token);
    
    if (!success || !decodedToken) {
      return NextResponse.json({ error: '無効なトークンです' }, { status: 401 });
    }

    // URLからテーマIDを取得
    const { searchParams } = new URL(request.url);
    const themeId = searchParams.get('themeId');

    if (!themeId) {
      return NextResponse.json(
        { error: 'テーマIDが必要です' },
        { status: 400 }
      );
    }

    // 既存のテーマを取得して所有者を確認
    const themeDoc = await adminFirestore
      .collection('essay_themes')
      .doc(themeId)
      .get();

    if (!themeDoc.exists) {
      return NextResponse.json(
        { error: 'テーマが見つかりません' },
        { status: 404 }
      );
    }

    const themeData = themeDoc.data();
    if (themeData?.userId !== decodedToken.uid) {
      return NextResponse.json(
        { error: 'このテーマを削除する権限がありません' },
        { status: 403 }
      );
    }

    // 削除実行
    await adminFirestore
      .collection('essay_themes')
      .doc(themeId)
      .delete();

    console.log(`[Success] Theme deleted: ${themeId} by user: ${decodedToken.uid}`);

    return NextResponse.json({
      success: true,
      message: 'テーマが削除されました'
    });

  } catch (error) {
    console.error('[Error] Deleting theme:', error);
    return NextResponse.json(
      { error: 'テーマの削除に失敗しました' },
      { status: 500 }
    );
  }
}