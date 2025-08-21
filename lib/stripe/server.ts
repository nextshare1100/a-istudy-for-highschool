import Stripe from 'stripe';

// デバッグ用ログ
const stripeKey = process.env.STRIPE_SECRET_KEY;
console.log('Stripe initialization - Key exists:', !!stripeKey);
console.log('Stripe initialization - Key type:', typeof stripeKey);
console.log('Stripe initialization - Key length:', stripeKey?.length);

if (!stripeKey) {
  throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

// サーバーサイドStripeクライアント
export const stripe = new Stripe(stripeKey, {
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
