import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('Cancel subscription endpoint hit');
  
  try {
    // 一時的にモックレスポンスを返す
    return NextResponse.json({
      success: true,
      message: 'Cancel endpoint is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in cancel endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS メソッドも追加（CORS対応）
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}