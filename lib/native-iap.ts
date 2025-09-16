// lib/native-iap.ts
import { InAppPurchase } from '@/src/plugins/InAppPurchasePlugin';
import { Capacitor } from '@capacitor/core';

export class NativeIAPManager {
  private static instance: NativeIAPManager;
  private initialized = false;
  
  private constructor() {}
  
  static getInstance(): NativeIAPManager {
    if (!NativeIAPManager.instance) {
      NativeIAPManager.instance = new NativeIAPManager();
    }
    return NativeIAPManager.instance;
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 開発環境の場合
    if (!Capacitor.isNativePlatform()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEV] IAP initialized (mock mode)');
        this.initialized = true;
        return;
      }
      return;
    }
    
    try {
      await InAppPurchase.initialize();
      
      // トランザクションアップデートを監視
      await InAppPurchase.addListener('transactionUpdated', (data) => {
        console.log('Transaction updated:', data);
        // 必要に応じてFirestoreを更新
      });
      
      this.initialized = true;
      console.log('Native IAP initialized');
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      throw error;
    }
  }
  
  async getProductInfo() {
    // 開発環境用のモック
    if (!Capacitor.isNativePlatform()) {
      if (process.env.NODE_ENV === 'development') {
        return {
          id: 'dev_monthly',
          displayName: 'A-IStudy プレミアム',
          description: 'すべての機能が利用可能',
          price: '¥980',
          hasFreeTrial: true,
          trialPeriod: {
            value: 30,
            unit: 'day'
          }
        };
      }
      throw new Error('This feature is only available in the native app');
    }
    
    try {
      const { products } = await InAppPurchase.getProducts();
      
      if (products.length === 0) {
        return null;
      }
      
      const product = products[0];
      return {
        id: product.id,
        displayName: product.displayName,
        description: product.description,
        price: product.displayPrice,
        hasFreeTrial: !!product.subscription?.introductoryOffer,
        trialPeriod: product.subscription?.introductoryOffer ? {
          value: product.subscription.introductoryOffer.period.value,
          unit: product.subscription.introductoryOffer.period.unit
        } : null
      };
    } catch (error) {
      console.error('Failed to get product info:', error);
      return null;
    }
  }
  
  async purchaseSubscription() {
    // 開発環境用のモック
    if (!Capacitor.isNativePlatform()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEV] Simulating purchase...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
          success: true,
          isActive: true,
          expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isInTrial: true
        };
      }
      throw new Error('This feature is only available in the native app');
    }
    
    try {
      const result = await InAppPurchase.purchase();
      
      if (result.success) {
        // サーバーで検証（推奨）
        await this.verifyPurchase({
          transactionId: result.transactionId!,
          platform: Capacitor.getPlatform()
        });
        
        return {
          success: true,
          isActive: result.isActive || false,
          expirationDate: result.expirationDate,
          isInTrial: result.isInTrial || false
        };
      } else if (result.cancelled) {
        return {
          success: false,
          cancelled: true
        };
      } else if (result.pending) {
        return {
          success: false,
          pending: true
        };
      }
      
      return { success: false };
    } catch (error: any) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }
  
  async restorePurchases() {
    // 開発環境用のモック
    if (!Capacitor.isNativePlatform()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEV] Simulating restore...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          success: false,
          message: 'No purchases to restore (dev mode)'
        };
      }
      throw new Error('This feature is only available in the native app');
    }
    
    try {
      const result = await InAppPurchase.restore();
      
      if (result.success && result.purchases.length > 0) {
        // 最新の購入を検証
        for (const purchase of result.purchases) {
          await this.verifyPurchase({
            transactionId: purchase.transactionId,
            platform: Capacitor.getPlatform()
          });
        }
        
        return {
          success: true,
          isActive: result.isActive,
          expirationDate: result.expirationDate
        };
      }
      
      return {
        success: false,
        message: 'No purchases to restore'
      };
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }
  
  async checkSubscriptionStatus() {
    // 開発環境用のモック
    if (!Capacitor.isNativePlatform()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEV] Returning mock subscription status');
        const mockTrialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        return {
          isActive: true,
          isInTrial: true,
          expirationDate: mockTrialEnd,
          willRenew: true
        };
      }
      return {
        isActive: false,
        isInTrial: false,
        expirationDate: null,
        willRenew: false
      };
    }
    
    try {
      const status = await InAppPurchase.checkStatus();
      
      return {
        isActive: status.isActive,
        isInTrial: status.isInTrial,
        expirationDate: status.expirationDate ? new Date(status.expirationDate) : null,
        willRenew: status.willRenew
      };
    } catch (error) {
      console.error('Failed to check status:', error);
      return {
        isActive: false,
        isInTrial: false,
        expirationDate: null,
        willRenew: false
      };
    }
  }
  
  private async verifyPurchase(data: {
    transactionId: string;
    platform: string;
  }) {
    try {
      const response = await fetch('/api/verify-purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Purchase verification failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Verification error:', error);
      // 検証に失敗してもローカルでは成功として扱う
    }
  }
  
  private async getAuthToken(): Promise<string> {
    // 開発環境用のモック
    if (process.env.NODE_ENV === 'development' && !Capacitor.isNativePlatform()) {
      return 'dev-token';
    }
    
    // Firebase Authトークンを取得
    const { auth } = await import('@/lib/firebase');
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    return user.getIdToken();
  }
}

// シングルトンインスタンスをエクスポート
export const iapManager = NativeIAPManager.getInstance();