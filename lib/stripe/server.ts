import Stripe from 'stripe';

// デバッグ用ログ
console.log('Stripe initialization - STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY);
console.log('Stripe initialization - Key prefix:', process.env.STRIPE_SECRET_KEY?.substring(0, 7));

// サーバーサイドStripeクライアント
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
  typescript: true,
});

// 料金プラン定義（サーバー側でも使用）
export const PRICE_PLANS = {
  MONTHLY: {
    id: process.env.STRIPE_PRICE_MONTHLY_ID || '',
    name: '月額プラン',
    price: 980,
    interval: 'month' as const,
  },
} as const;