import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { UserSubscription } from '@/types/subscription';

export const subscriptionService = {
  // 現在のサブスクリプションを取得
  async getCurrentSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      // まずユーザードキュメントから取得を試みる
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      
      if (userData?.subscriptionId) {
        // サブスクリプションコレクションから詳細を取得
        const subsDoc = await getDoc(doc(db, 'subscriptions', userId));
        if (subsDoc.exists()) {
          const data = subsDoc.data();
          return {
            userId,
            stripeCustomerId: userData.stripeCustomerId,
            subscriptionId: userData.subscriptionId,
            status: data.status || userData.subscriptionStatus || 'free',
            priceId: data.priceId,
            currentPeriodEnd: data.currentPeriodEnd?.toDate(),
            cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
            trialEndsAt: data.trialEndsAt?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          };
        }
      }
      
      // サブスクリプションが見つからない場合はフリープランとして返す
      return {
        userId,
        status: 'free',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
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
  
  // サブスクリプションのキャンセル
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
  
  // サブスクリプションの再開
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
  
  // カスタマーポータルを開く
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
  }
};