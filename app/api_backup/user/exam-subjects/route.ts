// app/api/user/exam-subjects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// モックデータ（実際はデータベースから取得）
const mockUserExamSubjects = {
  "英語": true, // すべて受験
  "数学": ["数学I・A", "数学II・B・C"], // 特定の科目のみ
  "国語": ["現代文", "古典"], // 両方受験
  "理科": ["物理", "化学"], // 物理と化学を受験
  "地理歴史": ["日本史探究"], // 日本史のみ
  "公民": false, // 受験しない
  "情報": true // 受験する
};

// トークン検証（簡易実装）
async function verifyToken(token: string | null): Promise<{ valid: boolean; userId?: string }> {
  if (!token) {
    return { valid: false };
  }

  // 実際の実装では JWT の検証やデータベースでのセッション確認を行う
  // ここではモック実装
  if (token.startsWith('Bearer ')) {
    const actualToken = token.substring(7);
    // トークンが存在すれば有効とする（開発用）
    if (actualToken) {
      return { valid: true, userId: 'mock-user-id' };
    }
  }

  return { valid: false };
}

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { valid, userId } = await verifyToken(authorization);

    if (!valid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 実際の実装ではデータベースから取得
    // const userDoc = await db.collection('users').doc(userId).get();
    // const examSubjects = userDoc.data()?.examSubjects || {};

    return NextResponse.json({
      success: true,
      examSubjects: mockUserExamSubjects,
      userId: userId
    });

  } catch (error) {
    console.error('Error fetching exam subjects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const headersList = headers();
    const authorization = headersList.get('authorization');
    const { valid, userId } = await verifyToken(authorization);

    if (!valid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { examSubjects } = body;

    if (!examSubjects || typeof examSubjects !== 'object') {
      return NextResponse.json(
        { error: 'Invalid exam subjects data' },
        { status: 400 }
      );
    }

    // 実際の実装ではデータベースに保存
    // await db.collection('users').doc(userId).update({
    //   examSubjects: examSubjects,
    //   updatedAt: new Date()
    // });

    return NextResponse.json({
      success: true,
      message: 'Exam subjects updated successfully',
      examSubjects: examSubjects
    });

  } catch (error) {
    console.error('Error updating exam subjects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}