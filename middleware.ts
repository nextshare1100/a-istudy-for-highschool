import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, setRateLimitHeaders, createRateLimitResponse, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

// 本番環境のベースURL
const PRODUCTION_URL = 'https://a-istudy-highschool.vercel.app';

// 保護されたパス（認証が必要）
const protectedPaths = [
  '/dashboard',
  '/study',
  '/analysis',
  '/settings',
  '/home',
  '/problems',
  '/timer',
  '/schedule',
];

// 認証不要のパス
const publicPaths = [
  '/login',
  '/register',
  '/terms',
  '/privacy',
];

// レート制限を適用するAPIパス
const rateLimitedPaths = Object.keys(RATE_LIMIT_CONFIGS);

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

  // APIルートのレート制限チェック
  if (path.startsWith('/api/')) {
    // 特定のAPIパスに対するレート制限
    const hasSpecificLimit = rateLimitedPaths.some(limitedPath => 
      path.startsWith(limitedPath)
    );
    
    if (hasSpecificLimit) {
      // エンドポイント固有のレート制限を適用
      const rateLimitResult = await checkRateLimit(request, null, path);
      
      if (!rateLimitResult.success) {
        // パスに対応する設定を取得
        const config = RATE_LIMIT_CONFIGS[path as keyof typeof RATE_LIMIT_CONFIGS] || 
                      RATE_LIMIT_CONFIGS.default;
        const errorResponse = createRateLimitResponse(config, rateLimitResult);
        
        const response = NextResponse.json(errorResponse, { status: 429 });
        setRateLimitHeaders(response.headers, rateLimitResult);
        
        // ログ出力（本番環境では適切なロギングサービスを使用）
        console.log(`Rate limit exceeded for ${path} from ${request.headers.get('x-forwarded-for') || 'unknown'}`);
        
        return response;
      }
      
      // レート制限をパスしたので、ヘッダーを追加して続行
      const response = NextResponse.next();
      setRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    } else {
      // デフォルトのレート制限（その他のAPIエンドポイント）
      const rateLimitResult = await checkRateLimit(request);
      
      if (!rateLimitResult.success) {
        const config = RATE_LIMIT_CONFIGS.default;
        const errorResponse = createRateLimitResponse(config, rateLimitResult);
        
        const response = NextResponse.json(errorResponse, { status: 429 });
        setRateLimitHeaders(response.headers, rateLimitResult);
        
        return response;
      }
      
      const response = NextResponse.next();
      setRateLimitHeaders(response.headers, rateLimitResult);
      return response;
    }
  }

  // 保護されたページへのアクセスチェック（認証のみ）
  if (protectedPaths.some(protectedPath => path.startsWith(protectedPath))) {
    // 認証トークンの確認のみ
    const token = request.cookies.get('auth-token');
    if (!token) {
      // 開発環境では通常のリダイレクト、本番環境では本番URLへリダイレクト
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.redirect(new URL('/login', request.url));
      } else {
        // 本番環境では常に本番URLにリダイレクト
        return NextResponse.redirect(new URL('/login', PRODUCTION_URL));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // APIルート
    '/api/:path*',
    // 保護されたルート
    '/dashboard/:path*',
    '/study/:path*',
    '/analysis/:path*',
    '/settings/:path*',
    '/home/:path*',
    '/problems/:path*',
    '/timer/:path*',
    '/schedule/:path*',
    // その他のルート（静的ファイル以外）
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
}