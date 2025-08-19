// lib/subscription/check-subscription.ts
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { SubscriptionStatus } from '@/types/subscription';

export async function checkSubscription(userId: string | null | undefined): Promise<{
  active: boolean;
  status: SubscriptionStatus;
  currentPeriodEnd?: Date;
}> {
  // userIdがない場合はinactiveを返す
  if (!userId) {
    return {
      active: false,
      status: 'inactive'
    };
  }

  try {
    // Firestoreからサブスクリプション情報を取得
    const subDoc = await getDoc(doc(db, 'subscriptions', userId));
    
    if (!subDoc.exists()) {
      return {
        active: false,
        status: 'inactive'
      };
    }

    const data = subDoc.data();
    const currentPeriodEnd = data.currentPeriodEnd?.toDate();
    
    // サブスクリプションがアクティブかチェック
    const isActive = data.status === 'active' && 
                    (!currentPeriodEnd || currentPeriodEnd > new Date());

    return {
      active: isActive,
      status: data.status || 'inactive',
      currentPeriodEnd
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return {
      active: false,
      status: 'inactive'
    };
  }
}

export async function hasActiveSubscription(userId: string | null | undefined): Promise<boolean> {
  if (!userId) return false;
  const { active } = await checkSubscription(userId);
  return active;
}