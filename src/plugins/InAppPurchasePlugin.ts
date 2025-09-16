// src/plugins/InAppPurchasePlugin.ts
import { registerPlugin } from '@capacitor/core';

export interface InAppPurchasePlugin {
  initialize(): Promise<{ success: boolean }>;
  
  getProducts(): Promise<{
    products: Array<{
      id: string;
      displayName: string;
      description: string;
      price: number;
      displayPrice: string;
      subscription?: {
        subscriptionPeriod: {
          unit: string;
          value: number;
        };
        introductoryOffer?: {
          price: number;
          displayPrice: string;
          period: {
            unit: string;
            value: number;
          };
          periodCount: number;
        };
      };
    }>;
  }>;
  
  purchase(): Promise<{
    success: boolean;
    cancelled?: boolean;
    pending?: boolean;
    transactionId?: string;
    originalTransactionId?: string;
    purchaseDate?: string;
    expirationDate?: string;
    isActive?: boolean;
    isInTrialPeriod?: boolean;
  }>;
  
  restore(): Promise<{
    success: boolean;
    purchases: Array<{
      transactionId: string;
      originalTransactionId: string;
      productId: string;
      purchaseDate: string;
      expirationDate?: string;
    }>;
    isActive: boolean;
    expirationDate?: string;
  }>;
  
  checkStatus(): Promise<{
    isActive: boolean;
    isInTrialPeriod: boolean;
    expirationDate?: string;
    willRenew: boolean;
  }>;
  
  addListener(
    eventName: 'transactionUpdated',
    listenerFunc: (data: {
      transactionId: string;
      productId: string;
      purchaseDate: string;
    }) => void
  ): Promise<{ remove: () => void }>;
}

// プラグインを登録（Web実装も含む）
const InAppPurchase = registerPlugin<InAppPurchasePlugin>('InAppPurchase', {
  web: () => import('./web').then(m => new m.InAppPurchasePluginWeb()),
});

export { InAppPurchase };