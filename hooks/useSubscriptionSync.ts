// hooks/useSubscriptionSync.ts
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { iapManager } from '@/lib/native-iap';
import { Capacitor } from '@capacitor/core';

export interface SubscriptionStatus {
  isActive: boolean;
  isInTrial: boolean;
  expirationDate: Date | null;
  autoRenewing: boolean;
  platform?: 'ios' | 'android' | 'web';
  productId?: string;
  status: 'active' | 'trial' | 'expired' | 'cancelled' | 'none';
  daysRemaining?: number;
  trialDaysRemaining?: number;
}

export function useSubscriptionSync() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    isActive: false,
    isInTrial: false,
    expirationDate: null,
    autoRenewing: false,
    status: 'none'
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Firestoreからサブスクリプション状態を監視
  useEffect(() => {
    if (!user) {
      setSubscription({
        isActive: false,
        isInTrial: false,
        expirationDate: null,
        autoRenewing: false,
        status: 'none'
      });
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const sub = data.subscription;
          
          if (sub) {
            const expirationDate = sub.expirationDate?.toDate() || null;
            const now = new Date();
            
            // 残り日数を計算
            let daysRemaining = 0;
            if (expirationDate) {
              daysRemaining = Math.ceil(
                (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );
            }

            // ステータスを決定
            let status: SubscriptionStatus['status'] = 'none';
            if (sub.isActive && sub.isInTrial) {
              status = 'trial';
            } else if (sub.isActive) {
              status = 'active';
            } else if (sub.status === 'cancelled') {
              status = 'cancelled';
            } else if (expirationDate && expirationDate < now) {
              status = 'expired';
            }

            setSubscription({
              isActive: sub.isActive || false,
              isInTrial: sub.isInTrial || false,
              expirationDate,
              autoRenewing: sub.autoRenewing || false,
              platform: sub.platform,
              productId: sub.productId,
              status,
              daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
              trialDaysRemaining: sub.isInTrial ? daysRemaining : undefined
            });
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Subscription sync error:', error);
        setError('サブスクリプション情報の取得に失敗しました');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ネイティブアプリの場合、定期的に同期
  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;

    const syncWithNative = async () => {
      try {
        setSyncing(true);
        const status = await iapManager.checkSubscriptionStatus();
        
        // ネイティブとFirestoreの状態が異なる場合は更新
        if (status.isActive !== subscription.isActive || 
            status.isInTrial !== subscription.isInTrial) {
          
          await updateDoc(doc(db, 'users', user.uid), {
            'subscription.isActive': status.isActive,
            'subscription.isInTrial': status.isInTrial,
            'subscription.expirationDate': status.expirationDate,
            'subscription.autoRenewing': status.willRenew,
            'subscription.lastSynced': new Date()
          });
        }
      } catch (error) {
        console.error('Native sync error:', error);
      } finally {
        setSyncing(false);
      }
    };

    // 初回同期
    syncWithNative();

    // 1時間ごとに同期
    const interval = setInterval(syncWithNative, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, subscription.isActive, subscription.isInTrial]);

  // 手動同期
  const syncSubscription = async () => {
    if (!user || !Capacitor.isNativePlatform()) return;

    try {
      setSyncing(true);
      setError(null);
      
      const status = await iapManager.checkSubscriptionStatus();
      
      await updateDoc(doc(db, 'users', user.uid), {
        'subscription.isActive': status.isActive,
        'subscription.isInTrial': status.isInTrial,
        'subscription.expirationDate': status.expirationDate,
        'subscription.autoRenewing': status.willRenew,
        'subscription.lastSynced': new Date()
      });
      
    } catch (error: any) {
      console.error('Manual sync error:', error);
      setError('同期に失敗しました');
    } finally {
      setSyncing(false);
    }
  };

  // 購入の復元
  const restorePurchases = async () => {
    if (!user || !Capacitor.isNativePlatform()) return;

    try {
      setSyncing(true);
      setError(null);
      
      const result = await iapManager.restorePurchases();
      
      if (result.success) {
        // 復元成功
        return { success: true };
      } else {
        setError(result.message || '復元する購入履歴がありません');
        return { success: false, error: result.message };
      }
      
    } catch (error: any) {
      console.error('Restore error:', error);
      setError('購入の復元に失敗しました');
      return { success: false, error: error.message };
    } finally {
      setSyncing(false);
    }
  };

  return {
    subscription,
    loading,
    syncing,
    error,
    syncSubscription,
    restorePurchases,
    isSubscribed: subscription.isActive,
    canAccessPremium: subscription.isActive || subscription.isInTrial
  };
}