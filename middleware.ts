import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // 静的ファイルとAPIはスキップ
  const skipPaths = [
    '/_next',
    '/api',
    '/favicon.ico',
    '/manifest.json',
    '/sw.js',
    '/icons',
    '/images'
  ];
  
  if (skipPaths.some(p => path.startsWith(p))) {
    return NextResponse.next();
  }

  // 認証不要のパス
  const publicPaths = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/terms',
    '/privacy'
  ];
  
  if (publicPaths.includes(path)) {
    return NextResponse.next();
  }

  // サブスクリプション関連のパス（これらは認証後にアクセス可能）
  const subscriptionPaths = [
    '/subscription/onboarding',
    '/account/subscription'
  ];
  
  if (subscriptionPaths.includes(path)) {
    return NextResponse.next();
  }

  // 認証チェック（クッキーベース）
  const authToken = request.cookies.get('auth-token');
  
  if (!authToken) {
    // 未認証の場合はログイン画面へリダイレクト
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  // ここで本来はサブスクリプションチェックを行いたいが、
  // Middlewareでは直接Firebaseにアクセスできないため、
  // クライアント側でチェックする必要がある
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}