// lib/revenuecat.ts
import { Purchases, CustomerInfo, PurchasesOfferings } from '@revenuecat/purchases-capacitor';

export class RevenueCatService {
  private static instance: RevenueCatService;
  private isConfigured = false;

  static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  async configure(apiKey: string, userId?: string) {
    if (this.isConfigured) return;

    try {
      await Purchases.configure({
        apiKey: apiKey,
        appUserId: userId,
      });
      this.isConfigured = true;
      console.log('RevenueCat configured successfully');
    } catch (error) {
      console.error('Failed to configure RevenueCat:', error);
      throw error;
    }
  }

  async getOfferings(): Promise<PurchasesOfferings | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current ? offerings : null;
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return null;
    }
  }

  async purchasePackage(packageToPurchase: any): Promise<CustomerInfo | null> {
    try {
      const result = await Purchases.purchasePackage({
        aPackage: packageToPurchase
      });
      return result.customerInfo;
    } catch (error) {
      console.error('Purchase failed:', error);
      // ユーザーがキャンセルした場合はnullを返す
      if ((error as any).userCancelled) {
        return null;
      }
      throw error;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  async restorePurchases(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.restorePurchases();
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      return null;
    }
  }

  // プレミアム機能にアクセスできるかチェック
  async hasActiveSubscription(): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      if (!customerInfo) return false;

      // 'premium'というentitlement IDを想定
      // 実際のentitlement IDに置き換えてください
      return typeof customerInfo.entitlements.active['premium'] !== 'undefined';
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }
}

// デフォルトのAPIキー（環境変数から取得）
export const getRevenueCatApiKey = (): string => {
  // iOS/Android用の異なるAPIキーを使用する場合
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    const platform = (window as any).Capacitor.getPlatform();
    if (platform === 'ios') {
      return process.env.NEXT_PUBLIC_REVENUECAT_IOS_API_KEY || '';
    } else if (platform === 'android') {
      return process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY || '';
    }
  }
  
  // フォールバック
  return process.env.NEXT_PUBLIC_REVENUECAT_API_KEY || '';
};