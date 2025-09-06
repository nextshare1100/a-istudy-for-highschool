import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // 静的ファイルはスキップ
  if (
    path.startsWith('/_next/static') ||
    path.startsWith('/_next/image') ||
    path.includes('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // 削除されたパスへのリダイレクト
  if (path.startsWith('/subscription') || path.startsWith('/payment')) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // 一時的に認証チェックを完全に無効化
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}
