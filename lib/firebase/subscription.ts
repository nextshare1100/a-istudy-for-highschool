import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const startFreeTrial = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  
  // 既存のサブスクリプション状態を確認
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();
  
  if (userData?.subscription?.status) {
    throw new Error('既にサブスクリプションが存在します');
  }
  
  // トライアル開始日と終了日を設定
  const now = new Date();
  const trialEndDate = new Date(now);
  trialEndDate.setDate(trialEndDate.getDate() + 30);
  
  await updateDoc(userRef, {
    subscription: {
      status: 'trial',
      trialStartDate: serverTimestamp(),
      trialEndDate: trialEndDate,
      isActive: true,
      autoRenew: false
    }
  });
  
  return {
    success: true,
    trialEndDate
  };
};

export const checkSubscriptionStatus = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  const subscription = userDoc.data()?.subscription;
  
  if (!subscription) return null;
  
  // トライアル期限チェック
  if (subscription.status === 'trial' && subscription.trialEndDate) {
    const now = new Date();
    const endDate = subscription.trialEndDate.toDate();
    
    if (now > endDate) {
      // トライアル期限切れ
      await updateDoc(userRef, {
        'subscription.status': 'expired',
        'subscription.isActive': false
      });
      return { ...subscription, status: 'expired', isActive: false };
    }
  }
  
  return subscription;
};
