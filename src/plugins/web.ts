// src/plugins/web.ts
import { WebPlugin } from '@capacitor/core';
import type { InAppPurchasePlugin } from './InAppPurchasePlugin';

export class InAppPurchasePluginWeb extends WebPlugin implements InAppPurchasePlugin {
  async initialize(): Promise<{ success: boolean }> {
    console.log('InAppPurchase: Web環境では外部決済を使用してください');
    return { success: true };
  }

  async getProducts(): Promise<{ products: any[] }> {
    // Web用の商品情報を返す
    return { 
      products: [{
        id: 'web_monthly',
        displayName: 'A-IStudyプレミアム（Web版）',
        description: '全機能アクセス',
        price: 980,
        displayPrice: '¥980',
        subscription: {
          subscriptionPeriod: {
            unit: 'month',
            value: 1
          }
        }
      }]
    };
  }

  async purchase(): Promise<{
    success: boolean;
    cancelled?: boolean;
    pending?: boolean;
    transactionId?: string;
    originalTransactionId?: string;
    purchaseDate?: string;
    expirationDate?: string;
    isActive?: boolean;
    isInTrialPeriod?: boolean;
  }> {
    // Stripeなどの外部決済へリダイレクト
    console.log('Web決済ページへリダイレクトします...');
    
    // 例：Stripe Checkoutへ
    window.location.href = 'https://checkout.stripe.com/pay/...';
    
    return { success: false, pending: true };
  }

  async restore(): Promise<{
    success: boolean;
    purchases: any[];
    isActive: boolean;
    expirationDate?: string;
  }> {
    // Web版ではサーバーAPIで確認
    console.log('サーバーでサブスクリプション状態を確認してください');
    return { success: false, purchases: [], isActive: false };
  }

  async checkStatus(): Promise<{
    isActive: boolean;
    isInTrialPeriod: boolean;
    expirationDate?: string;
    willRenew: boolean;
  }> {
    // FirestoreやサーバーAPIから取得
    try {
      const response = await fetch('/api/subscription/status');
      const data = await response.json();
      return data;
    } catch {
      return { isActive: false, isInTrialPeriod: false, willRenew: false };
    }
  }
}