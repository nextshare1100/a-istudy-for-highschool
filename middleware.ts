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

  // /subscription/onboardingは許可
  if (path === '/subscription/onboarding') {
    return NextResponse.next();
  }

  // その他の/subscriptionパスはリダイレクト
  if (path.startsWith('/subscription') && path !== '/subscription/onboarding') {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // /paymentパスはリダイレクト
  if (path.startsWith('/payment')) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}
