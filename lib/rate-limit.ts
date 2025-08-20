// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';
import { NextRequest } from 'next/server';

// レート制限の設定インターフェース
interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  message: string;
}

// レート制限の設定
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // 認証関連
  '/api/auth/register': {
    maxAttempts: 10,
    windowMs: 3600000, // 1時間
    message: '登録リクエストが多すぎます。1時間後に再度お試しください。'
  },
  '/api/auth/login': {
    maxAttempts: 5,
    windowMs: 900000, // 15分
    message: 'ログイン試行が多すぎます。15分後に再度お試しください。'
  },
  '/api/auth/reset-password': {
    maxAttempts: 3,
    windowMs: 3600000, // 1時間
    message: 'パスワードリセットリクエストが多すぎます。1時間後に再度お試しください。'
  },
  
  // Stripe関連
  '/api/stripe/checkout': {
    maxAttempts: 3,
    windowMs: 300000, // 5分
    message: '決済処理が多すぎます。5分後に再度お試しください。'
  },
  '/api/stripe/manage': {
    maxAttempts: 10,
    windowMs: 600000, // 10分
    message: 'リクエストが多すぎます。10分後に再度お試しください。'
  },
  '/api/stripe/webhook': {
    maxAttempts: 100,
    windowMs: 60000, // 1分（Webhookは頻度高め）
    message: 'Webhookリクエストが多すぎます。'
  },
  
  // 学習関連API
  '/api/study': {
    maxAttempts: 60,
    windowMs: 60000, // 1分
    message: 'リクエストが多すぎます。しばらくお待ちください。'
  },
  '/api/analysis': {
    maxAttempts: 30,
    windowMs: 60000, // 1分
    message: '分析リクエストが多すぎます。しばらくお待ちください。'
  },
  
  // デフォルト
  default: {
    maxAttempts: 100,
    windowMs: 60000, // 1分
    message: 'リクエストが多すぎます。しばらくお待ちください。'
  }
};

// レート制限用のキャッシュ
const rateLimitCache = new LRUCache<string, number[]>({
  max: 5000, // 最大5000ユーザー分のデータを保持
  ttl: 3600000, // 1時間でデータを自動削除
});

// IPアドレスを取得
function getClientIp(request: NextRequest): string {
  // Vercelのヘッダーから実際のIPを取得
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp.trim();
  }
  
  return 'unknown';
}

// レート制限の結果
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

// レート制限チェック関数
export async function checkRateLimit(
  request: NextRequest,
  userId?: string | null,
  endpoint?: string
): Promise<RateLimitResult> {
  // エンドポイントの設定を取得
  const path = endpoint || request.nextUrl.pathname;
  
  // 最も一致する設定を見つける
  let config: RateLimitConfig = RATE_LIMIT_CONFIGS.default;
  let matchedPath = 'default';
  
  // 完全一致を先にチェック
  if (RATE_LIMIT_CONFIGS[path]) {
    config = RATE_LIMIT_CONFIGS[path];
    matchedPath = path;
  } else {
    // 部分一致をチェック（最長マッチ）
    const sortedPaths = Object.keys(RATE_LIMIT_CONFIGS)
      .filter(key => key !== 'default' && path.startsWith(key))
      .sort((a, b) => b.length - a.length);
    
    if (sortedPaths.length > 0) {
      matchedPath = sortedPaths[0];
      config = RATE_LIMIT_CONFIGS[matchedPath];
    }
  }
  
  // 識別子を作成（ユーザーIDまたはIPアドレス）
  const identifier = userId || getClientIp(request);
  const key = `${matchedPath}:${identifier}`;
  
  // 現在時刻
  const now = Date.now();
  
  // このユーザーの過去のアクセス記録を取得
  const attempts = rateLimitCache.get(key) || [];
  
  // 時間枠内のアクセスのみをフィルタリング
  const recentAttempts = attempts.filter(
    timestamp => now - timestamp < config.windowMs
  );
  
  // 制限チェック
  if (recentAttempts.length >= config.maxAttempts) {
    // 最も古いアクセスからのリセット時刻を計算
    const oldestAttempt = Math.min(...recentAttempts);
    const resetTime = new Date(oldestAttempt + config.windowMs);
    const retryAfter = Math.ceil((resetTime.getTime() - now) / 1000); // 秒単位
    
    return {
      success: false,
      limit: config.maxAttempts,
      remaining: 0,
      reset: resetTime,
      retryAfter
    };
  }
  
  // 新しいアクセスを記録
  recentAttempts.push(now);
  rateLimitCache.set(key, recentAttempts);
  
  // リセット時刻（現在時刻 + ウィンドウ時間）
  const resetTime = new Date(now + config.windowMs);
  
  return {
    success: true,
    limit: config.maxAttempts,
    remaining: config.maxAttempts - recentAttempts.length,
    reset: resetTime
  };
}

// レート制限エラーレスポンス生成
export function createRateLimitResponse(
  config: RateLimitConfig,
  result: RateLimitResult
) {
  const minutes = Math.ceil((result.retryAfter || 0) / 60);
  const message = minutes > 0 
    ? `${config.message} (あと${minutes}分お待ちください)`
    : config.message;
  
  return {
    error: message,
    code: 'RATE_LIMIT_EXCEEDED',
    limit: result.limit,
    reset: result.reset.toISOString(),
    retryAfter: result.retryAfter
  };
}

// ミドルウェア用のヘルパー関数
export function setRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult
) {
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toISOString());
  
  // Retry-Afterヘッダー（RFC準拠）
  if (result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString());
  }
}

// レート制限情報を取得（デバッグ用）
export function getRateLimitInfo(identifier: string, endpoint: string): {
  attempts: number;
  resetTime: Date | null;
} {
  const key = `${endpoint}:${identifier}`;
  const attempts = rateLimitCache.get(key) || [];
  const now = Date.now();
  const config = RATE_LIMIT_CONFIGS[endpoint] || RATE_LIMIT_CONFIGS.default;
  
  const recentAttempts = attempts.filter(
    timestamp => now - timestamp < config.windowMs
  );
  
  if (recentAttempts.length === 0) {
    return { attempts: 0, resetTime: null };
  }
  
  const oldestAttempt = Math.min(...recentAttempts);
  const resetTime = new Date(oldestAttempt + config.windowMs);
  
  return { 
    attempts: recentAttempts.length, 
    resetTime 
  };
}

// キャッシュをクリア（テスト用）
export function clearRateLimitCache() {
  rateLimitCache.clear();
}