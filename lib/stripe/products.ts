// lib/stripe/products.ts
export const SUBSCRIPTION_PLANS = {
  PREMIUM: {
    name: 'プレミアムプラン',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!,
    price: 980,
    currency: 'jpy',
    interval: 'month' as const,
    features: [
      'AIによる学習分析と最適化',
      '全教科の学習管理',
      '詳細な進捗レポート',
      '志望校合格に向けた学習計画',
      '24時間365日利用可能',
      'カスタム学習目標の設定',
      '学習データのエクスポート',
      '優先サポート'
    ]
  }
};

// Stripeで事前に作成が必要なクーポン設定
export const CAMPAIGN_COUPONS = {
  LAUNCH2024: {
    id: 'coupon_campaign_launch2024',
    percentOff: 100,
    duration: 'once',
    name: 'ローンチキャンペーン2024'
  },
  STUDENT50: {
    id: 'coupon_campaign_student50',
    percentOff: 50,
    duration: 'repeating',
    durationInMonths: 3,
    name: '学生応援キャンペーン'
  },
  FIRST_MONTH_FREE: {
    id: 'coupon_campaign_first_month',
    percentOff: 100,
    duration: 'once',
    name: '初月無料キャンペーン'
  }
};

// 価格フォーマット用ヘルパー
export function formatPrice(amount: number, currency: string = 'jpy'): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}