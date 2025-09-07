// app/api/ai/analyze/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { IntegratedAnalyzer } from '@/lib/ai/core/analyzer';
import { validateAnalysisRequest } from '@/lib/ai/utils/validator';
import { transformAnalysisResponse } from '@/lib/ai/utils/transformer';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const analyzer = new IntegratedAnalyzer();

export async function POST(request: NextRequest) {
  try {
    // 認証確認
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // リクエストボディの取得と検証
    const body = await request.json();
    const validationResult = validateAnalysisRequest(body);
    
    if (!validationResult.valid) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.errors },
        { status: 400 }
      );
    }

    // 分析リクエストの構築
    const analysisRequest = {
      userId: session.user.id,
      period: body.period || 'month',
      analysisType: body.type || 'comprehensive',
      options: {
        includeAI: body.includeAI !== false,
        includePrediction: body.includePrediction !== false,
        includeRecommendations: body.includeRecommendations !== false
      },
      userProfile: await getUserProfile(session.user.id),
      historicalData: await getHistoricalData(session.user.id, body.period)
    };

    // 統合分析の実行
    const analysis = await analyzer.analyze(analysisRequest);

    // レスポンスの変換（クライアント用に最適化）
    const response = transformAnalysisResponse(analysis, body.format);

    // 分析結果のキャッシュ
    await cacheAnalysisResult(session.user.id, analysis);

    return NextResponse.json({
      success: true,
      data: response,
      metadata: {
        analysisId: analysis.analysisId,
        timestamp: analysis.timestamp,
        confidence: analysis.confidence,
        nextUpdate: analysis.nextAnalysisDate
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded', retryAfter: 60 },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Analysis failed', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// SSE対応のストリーミング分析
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      
      try {
        // 段階的に分析結果を送信
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ status: 'analyzing', progress: 0 })}\n\n`)
        );

        // 弱点分析
        const weakness = await analyzer.analyzeWeakness(session.user.id);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            status: 'progress', 
            progress: 25, 
            partial: { weakness } 
          })}\n\n`)
        );

        // 効率分析
        const efficiency = await analyzer.analyzeEfficiency(session.user.id);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            status: 'progress', 
            progress: 50, 
            partial: { efficiency } 
          })}\n\n`)
        );

        // AI分析
        const insights = await analyzer.generateInsights(session.user.id);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            status: 'progress', 
            progress: 75, 
            partial: { insights } 
          })}\n\n`)
        );

        // 完了
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            status: 'complete', 
            progress: 100,
            message: 'Analysis complete'
          })}\n\n`)
        );

      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            status: 'error', 
            error: error.message 
          })}\n\n`)
        );
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

// ヘルパー関数
async function getUserProfile(userId: string) {
  // ユーザープロファイルの取得ロジック
  return {
    academicLevel: 'high-school',
    targetScore: 65,
    examDate: new Date('2024-03-01'),
    dailyStudyHours: 3,
    lifestyle: {
      morningPerson: true,
      hasClubActivities: true,
      commuteTime: 30
    }
  };
}

async function getHistoricalData(userId: string, period: string) {
  // 過去のデータ取得ロジック
  return {
    sessions: [],
    exams: [],
    challenges: []
  };
}

async function cacheAnalysisResult(userId: string, analysis: any) {
  // Redis等でのキャッシュロジック
  return;
}