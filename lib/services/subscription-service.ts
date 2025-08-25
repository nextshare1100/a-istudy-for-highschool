import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import type { UserSubscription } from '@/types/subscription';

// 開発モードの判定
const isDevelopmentMode = process.env.NEXT_PUBLIC_PAYMENT_DEV_MODE === 'true';

export const subscriptionService = {
  // 現在のサブスクリプションを取得（全プラットフォーム対応）
  async getCurrentSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      // subscriptionIdはuserIdと同じになるように変更
      const subsDoc = await getDoc(doc(db, 'subscriptions', userId));
      if (subsDoc.exists()) {
        const data = subsDoc.data();
        return {
          userId,
          subscriptionId: userId, // userIdと同じ
          status: data.status || 'free',
          platform: data.platform,
          priceId: data.priceId || data.productId,
          currentPeriodEnd: data.currentPeriodEnd?.toDate(),
          currentPeriodStart: data.currentPeriodStart?.toDate(),
          cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          
          // iOS固有の情報
          iosReceiptData: data.iosReceiptData,
          iosTransactionId: data.iosTransactionId,
          iosOriginalTransactionId: data.iosOriginalTransactionId,
          
          // Android固有の情報
          androidPurchaseToken: data.androidPurchaseToken,
          androidOrderId: data.androidOrderId,
          androidProductId: data.productId,
        };
      }
      
      // サブスクリプションが見つからない場合はフリープランとして返す
      return {
        userId,
        status: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  },
  
  // プラットフォームを判定
  getPlatform(): 'web' | 'ios' | 'android' {
    if (typeof window === 'undefined') return 'web';
    
    // React Native WebView
    if ((window as any).ReactNativeWebView) {
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
        return 'ios';
      } else if (userAgent.includes('android')) {
        return 'android';
      }
    }
    
    // Capacitor/Cordova
    if ((window as any).Capacitor) {
      const platform = (window as any).Capacitor.getPlatform();
      if (platform === 'ios') return 'ios';
      if (platform === 'android') return 'android';
    }
    
    return 'web';
  },
  
  // 認証トークンを取得するヘルパー関数
  async getAuthToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;
      if (!user) return null;
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  },
  
  // iOS レシート検証
  async verifyIOSReceipt(receiptData: string): Promise<any> {
    // 開発モードの場合はモックレスポンスを返す
    if (isDevelopmentMode) {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      // モックサブスクリプションを作成
      const mockSubscription = {
        userId: user.uid,
        platform: 'ios' as const,
        status: 'active' as const,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
        iosReceiptData: 'mock_receipt_data',
        iosTransactionId: 'mock_transaction_' + Date.now(),
        productId: 'com.aistudy.monthly_subscription',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Firestoreに保存（usersコレクションに保存）
      try {
        const { setDoc, doc } = await import('firebase/firestore');
        // usersコレクションのユーザードキュメントを更新
        await setDoc(doc(db, 'users', user.uid), {
          subscriptionStatus: 'active',
          subscriptionId: user.uid,
          platform: 'ios',
          iosReceiptData: mockSubscription.iosReceiptData,
          iosTransactionId: mockSubscription.iosTransactionId,
          productId: mockSubscription.productId,
          currentPeriodStart: mockSubscription.currentPeriodStart,
          currentPeriodEnd: mockSubscription.currentPeriodEnd,
          updatedAt: new Date()
        }, { merge: true });
        console.log('Subscription saved to users collection successfully');
      } catch (error) {
        console.error('Failed to save subscription:', error);
      }
      
      return { success: true, subscription: mockSubscription };
    }
    
    // 本番環境の処理
    const token = await this.getAuthToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch('/api/payment/ios/verify-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ receiptData })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'レシート検証に失敗しました');
    }
    
    return response.json();
  },
  
  // Android 購入検証
  async verifyAndroidPurchase(purchaseToken: string, productId: string): Promise<any> {
    // 開発モードの場合はモックレスポンスを返す
    if (isDevelopmentMode) {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      // モックサブスクリプションを作成
      const mockSubscription = {
        userId: user.uid,
        platform: 'android' as const,
        status: 'active' as const,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
        androidPurchaseToken: 'mock_purchase_token',
        androidOrderId: 'mock_order_' + Date.now(),
        productId: productId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Firestoreに保存（usersコレクションに保存）
      try {
        const { setDoc, doc } = await import('firebase/firestore');
        // usersコレクションのユーザードキュメントを更新
        await setDoc(doc(db, 'users', user.uid), {
          subscriptionStatus: 'active',
          subscriptionId: user.uid,
          platform: 'android',
          androidPurchaseToken: mockSubscription.androidPurchaseToken,
          androidOrderId: mockSubscription.androidOrderId,
          productId: mockSubscription.productId,
          currentPeriodStart: mockSubscription.currentPeriodStart,
          currentPeriodEnd: mockSubscription.currentPeriodEnd,
          updatedAt: new Date()
        }, { merge: true });
        console.log('Subscription saved to users collection successfully');
      } catch (error) {
        console.error('Failed to save subscription:', error);
      }
      
      return { success: true, subscription: mockSubscription };
    }
    
    // 本番環境の処理
    const token = await this.getAuthToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch('/api/payment/android/verify-purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ purchaseToken, productId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '購入検証に失敗しました');
    }
    
    return response.json();
  },
  
  // クーポンコードの適用
  async applyCouponCode(code: string, platform: 'ios' | 'android'): Promise<any> {
    const token = await this.getAuthToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await fetch('/api/payment/apply-coupon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ couponCode: code, platform })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'クーポンの適用に失敗しました');
    }
    
    return response.json();
  },
  
  // クーポンコードの検証（適用前チェック）
  async validateCouponCode(code: string, platform: 'ios' | 'android'): Promise<{
    isValid: boolean;
    type?: string;
    description?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`/api/payment/apply-coupon?code=${encodeURIComponent(code)}&platform=${platform}`);
      return response.json();
    } catch (error) {
      return { isValid: false, error: '検証エラーが発生しました' };
    }
  },
  
  // サブスクリプションのキャンセル（Web版のみ）
  async cancelSubscription(subscriptionId: string): Promise<any> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch('/api/subscription/cancel', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subscriptionId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel subscription');
    }
    
    return response.json();
  },
  
  // サブスクリプションの再開（Web版のみ）
  async resumeSubscription(subscriptionId: string): Promise<any> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch('/api/subscription/resume', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subscriptionId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to resume subscription');
    }
    
    return response.json();
  },
  
  // カスタマーポータルを開く（Web版のみ）
  async openCustomerPortal(): Promise<string> {
    const token = await this.getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create portal session');
    }
    
    const data = await response.json();
    return data.url;
  },
  
  // 支払い履歴の取得
  async getPaymentHistory(userId: string, limitCount: number = 10): Promise<any[]> {
    try {
      const paymentsQuery = query(
        collection(db, 'paymentHistory'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(paymentsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        purchaseDate: doc.data().purchaseDate?.toDate()
      }));
    } catch (error) {
      console.error('Error getting payment history:', error);
      return [];
    }
  },
  
  // WebViewメッセージハンドラーの設定
  setupMessageHandlers(): void {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('message', async (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        switch (data.type) {
          case 'iosReceipt':
            if (data.receiptData) {
              await this.verifyIOSReceipt(data.receiptData);
            }
            break;
            
          case 'androidPurchase':
            if (data.purchaseToken && data.productId) {
              await this.verifyAndroidPurchase(data.purchaseToken, data.productId);
            }
            break;
            
          case 'purchaseSuccess':
            window.location.reload();
            break;
            
          case 'purchaseError':
            console.error('Purchase error:', data.message);
            break;
        }
      } catch (error) {
        console.error('Message handler error:', error);
      }
    });
  }
};

// 開発モード用のヘルパー関数をエクスポート
export async function verifyIOSReceipt(
  userId: string,
  receipt: string,
  transactionId: string,
  productId: string,
  isSandbox: boolean = true
): Promise<{ success: boolean; subscription?: any }> {
  // 開発モードの場合はモックレスポンスを返す
  if (isDevelopmentMode) {
    // モックサブスクリプションを作成
    const mockSubscription = {
      userId,
      platform: 'ios' as const,
      status: 'active' as const,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
      iosReceiptData: 'mock_receipt_data',
      iosTransactionId: transactionId,
      productId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Firestoreに保存（usersコレクションに保存）
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      // usersコレクションのユーザードキュメントを更新
      await setDoc(doc(db, 'users', userId), {
        subscriptionStatus: 'active',
        subscriptionId: userId,
        platform: 'ios',
        iosReceiptData: mockSubscription.iosReceiptData,
        iosTransactionId: mockSubscription.iosTransactionId,
        productId: mockSubscription.productId,
        currentPeriodStart: mockSubscription.currentPeriodStart,
        currentPeriodEnd: mockSubscription.currentPeriodEnd,
        updatedAt: new Date()
      }, { merge: true });
      console.log('Subscription saved to users collection successfully');
    } catch (error) {
      console.error('Failed to save subscription:', error);
    }
    
    return { success: true, subscription: mockSubscription };
  }
  
  // 本番環境の処理
  try {
    const response = await fetch('/api/payment/ios/verify-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, receipt, transactionId, productId, isSandbox })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'レシート検証に失敗しました');
    }
    
    return response.json();
  } catch (error) {
    console.error('iOS receipt verification error:', error);
    return { success: false };
  }
}

// Android購入検証
export async function verifyAndroidPurchase(
  userId: string,
  purchaseToken: string,
  productId: string,
  orderId: string
): Promise<{ success: boolean; subscription?: any }> {
  // 開発モードの場合はモックレスポンスを返す
  if (isDevelopmentMode) {
    // モックサブスクリプションを作成
    const mockSubscription = {
      userId,
      platform: 'android' as const,
      status: 'active' as const,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
      androidPurchaseToken: 'mock_purchase_token',
      androidOrderId: orderId,
      productId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Firestoreに保存（usersコレクションに保存）
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      // usersコレクションのユーザードキュメントを更新
      await setDoc(doc(db, 'users', userId), {
        subscriptionStatus: 'active',
        subscriptionId: userId,
        platform: 'android',
        androidPurchaseToken: mockSubscription.androidPurchaseToken,
        androidOrderId: mockSubscription.androidOrderId,
        productId: mockSubscription.productId,
        currentPeriodStart: mockSubscription.currentPeriodStart,
        currentPeriodEnd: mockSubscription.currentPeriodEnd,
        updatedAt: new Date()
      }, { merge: true });
      console.log('Subscription saved to users collection successfully');
    } catch (error) {
      console.error('Failed to save subscription:', error);
    }
    
    return { success: true, subscription: mockSubscription };
  }
  
  // 本番環境の処理
  try {
    const response = await fetch('/api/payment/android/verify-purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, purchaseToken, productId, orderId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '購入検証に失敗しました');
    }
    
    return response.json();
  } catch (error) {
    console.error('Android purchase verification error:', error);
    return { success: false };
  }
}

// クーポン適用
export async function applyAppCoupon(
  userId: string,
  couponCode: string
): Promise<{ success: boolean; message: string; discount?: any }> {
  try {
    const response = await fetch('/api/payment/apply-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, couponCode })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'クーポンの適用に失敗しました');
    }
    
    return response.json();
  } catch (error) {
    console.error('Coupon application error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'クーポンの適用に失敗しました' 
    };
  }
}