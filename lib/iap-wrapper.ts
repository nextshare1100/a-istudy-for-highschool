import { Capacitor } from '@capacitor/core';
import { mockIAP } from './iap-mock';

const isDevelopment = process.env.NODE_ENV === 'development';
const isWeb = Capacitor.getPlatform() === 'web';

export const IAP = isDevelopment || isWeb ? mockIAP : {
  // 本番用のIAP実装をここに
  initialize: async () => {
    // RevenueCatまたはCapacitor IAPの初期化
  },
  getProducts: async () => {
    // 実際の商品情報取得
  },
  purchase: async (productId: string) => {
    // 実際の購入処理
  }
};
