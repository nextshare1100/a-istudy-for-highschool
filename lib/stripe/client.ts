import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

// クライアントサイドStripeインスタンス
let stripePromise: Promise<any>;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// サーバーサイドStripeインスタンス（互換性のため）
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

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
    id: process.env.STRIPE_PRICE_MONTHLY_ID || 'price_1RxjMpCnww52X0oq6MrixLpz',
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
  SETUP_FEE: {
    id: process.env.STRIPE_PRICE_SETUP_FEE_ID || 'price_1RxjWNCnww52X0oqeSy9OxbK',
    name: '初回登録料',
    price: 500,
    type: 'one_time' as const,
  }
} as const;

// 無料トライアル設定
export const FREE_TRIAL_DAYS = 30;

// キャンペーンコード
export const CAMPAIGN_CODES = {
  AISTUDYTRIAL: {
    code: 'AISTUDYTRIAL',
    description: '30日間無料トライアル',
    trialDays: 30,
    setupFeeWaived: true,
  },
  AISTUDY2024: {
    code: 'AISTUDY2024',
    description: '30日間無料トライアル（旧コード）',
    trialDays: 30,
    setupFeeWaived: true,
  }
} as const;

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

// Stripe関連のユーティリティ関数
export const stripeUtils = {
  // 価格のフォーマット
  formatPrice: (amount: number): string => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount);
  },

  // サブスクリプション状態の確認
  isActiveSubscription: (status: string): boolean => {
    return ['active', 'trialing'].includes(status);
  },

  // エラーメッセージの日本語化
  getErrorMessage: (error: any): string => {
    if (error.type === 'StripeCardError') {
      switch (error.code) {
        case 'card_declined':
          return 'カードが拒否されました。別のカードをお試しください。';
        case 'insufficient_funds':
          return '残高不足です。';
        case 'invalid_cvc':
          return 'セキュリティコードが正しくありません。';
        default:
          return 'カード情報に問題があります。';
      }
    }
    return '決済処理中にエラーが発生しました。';
  },
};

// デフォルトエクスポート
export default stripe;