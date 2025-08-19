// app/api/quick-learning/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { QuickLearningGenerator } from '@/lib/gemini/services/quickLearningGenerator';

const generator = new QuickLearningGenerator();

export async function POST(request: NextRequest) {
  try {
    // 開発環境では認証をスキップ
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (!isDevelopment) {
      // 本番環境でのみ認証チェック
      const authHeader = request.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      // TODO: 本番環境でのトークン検証
    }
    
    // リクエストボディ
    const body = await request.json();
    console.log('Request received:', body);
    
    const {
      subject,
      unit,
      count = 2,
      sessionType = 'random'
    } = body;
    
    // バリデーション
    if (!subject || !unit) {
      return NextResponse.json(
        { error: 'Subject and unit are required' },
        { status: 400 }
      );
    }
    
    // 問題生成
    const questions = await generator.generateQuestions({
      subject,
      unit,
      count,
      sessionType: sessionType as 'morning' | 'evening' | 'random'
    });
    
    // レスポンス
    return NextResponse.json({
      success: true,
      questions,
      generatedAt: new Date().toISOString(),
      sessionId: `session_${Date.now()}`
    });
    
  } catch (error) {
    console.error('API Error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false,
          error: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// ヘルスチェック
export async function GET() {
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  
  return NextResponse.json({
    status: 'ok',
    service: 'quick-learning-generator',
    hasApiKey,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}