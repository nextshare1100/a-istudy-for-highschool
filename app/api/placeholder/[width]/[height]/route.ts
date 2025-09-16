import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { width: string; height: string } }
) {
  const { width, height } = params;
  const text = request.nextUrl.searchParams.get('text') || '';
  
  // 外部のplaceholder APIにリダイレクト
  return NextResponse.redirect(
    `https://via.placeholder.com/${width}x${height}/667eea/ffffff?text=${encodeURIComponent(text)}`
  );
}
