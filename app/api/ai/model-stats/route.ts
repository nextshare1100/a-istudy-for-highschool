// app/api/ai/model-stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getModelUsageStats, getGeminiClient } from '@/lib/gemini/client';

export async function GET(request: NextRequest) {
  try {
    const stats = getModelUsageStats();
    
    return NextResponse.json({
      success: true,
      models: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting model stats:', error);
    return NextResponse.json(
      { error: 'Failed to get model statistics' },
      { status: 500 }
    );
  }
}

// 使用状況リセット（開発用）
export async function POST(request: NextRequest) {
  try {
    const { modelName } = await request.json();
    const client = getGeminiClient();
    
    client.resetUsageStats(modelName);
    
    return NextResponse.json({
      success: true,
      message: `Reset usage stats for ${modelName || 'all models'}`
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reset stats' },
      { status: 500 }
    );
  }
}