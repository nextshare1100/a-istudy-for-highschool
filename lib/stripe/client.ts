import { loadStripe } from '@stripe/stripe-js';

// クライアントサイドStripeインスタンス
let stripePromise: Promise<any>;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// 料金プラン定義（SUBSCRIPTION_TIERSに名前を変更）
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'フリープラン',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      '基本的な学習機能',
      '1日10問まで',
      '基本的な進捗管理',
    ],
  },
  premium: {
    name: 'プレミアムプラン',
    monthlyPrice: 980,
    yearlyPrice: 9800,
    features: [
      '全機能利用可能',
      'AI問題生成無制限',
      '詳細な進捗分析',
      '個別学習計画',
      '優先サポート',
    ],
  },
} as const;

// 料金プラン定義（既存のコードとの互換性のため）
export const PRICE_PLANS = {
  MONTHLY: {
    id: process.env.STRIPE_PRICE_MONTHLY_ID || 'price_1RoLOlCcOncv9TiEoG2fYH3R',
    name: '月額プラン',
    price: 980,
    interval: 'month' as const,
    features: [
      '全機能利用可能',
      'AI問題生成無制限',
      '詳細な進捗分析',
      '個別学習計画',
      '優先サポート',
    ],
  },
} as const;

// 無料トライアル設定
export const FREE_TRIAL_DAYS = 7;

// 機能制限の定義
export const FEATURE_LIMITS = {
  FREE: {
    problemsPerDay: 10,
    detailedAnalysis: false,
    aiSchedule: false,
    exportData: false,
  },
  PREMIUM: {
    problemsPerDay: -1, // 無制限
    detailedAnalysis: true,
    aiSchedule: true,
    exportData: true,
  },
} as const;
