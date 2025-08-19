// lib/stripe/firestore-helpers.ts
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserSubscription, PaymentHistory } from '@/types/subscription';

// ユーザーのStripe Customer IDを取得
export async function getStripeCustomerId(userId: string): Promise<string | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    return userData?.stripeCustomerId || null;
  } catch (error) {
    console.error('Error getting Stripe customer ID:', error);
    return null;
  }
}

// Stripe Customer IDを保存
export async function saveStripeCustomerId(userId: string, customerId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      stripeCustomerId: customerId,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving Stripe customer ID:', error);
    throw error;
  }
}

// サブスクリプション情報を取得
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const subDoc = await getDoc(doc(db, 'subscriptions', userId));
    if (!subDoc.exists()) {
      return null;
    }
    
    const data = subDoc.data();
    return {
      ...data,
      currentPeriodEnd: data.currentPeriodEnd?.toDate(),
      trialEndsAt: data.trialEndsAt?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as UserSubscription;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
}

// サブスクリプション情報を保存/更新
export async function saveUserSubscription(
  userId: string, 
  subscriptionData: Partial<UserSubscription>
): Promise<void> {
  try {
    const docRef = doc(db, 'subscriptions', userId);
    const existingDoc = await getDoc(docRef);
    
    if (existingDoc.exists()) {
      // 更新
      await updateDoc(docRef, {
        ...subscriptionData,
        updatedAt: serverTimestamp(),
      });
    } else {
      // 新規作成
      await setDoc(docRef, {
        userId,
        status: 'free',
        ...subscriptionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error saving user subscription:', error);
    throw error;
  }
}

// 支払い履歴を保存
export async function savePaymentHistory(
  userId: string,
  payment: Omit<PaymentHistory, 'id' | 'createdAt'>
): Promise<void> {
  try {
    const paymentsRef = collection(db, 'users', userId, 'payments');
    await setDoc(doc(paymentsRef), {
      ...payment,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving payment history:', error);
    throw error;
  }
}

// 支払い履歴を取得
export async function getPaymentHistory(
  userId: string,
  limitCount: number = 10
): Promise<PaymentHistory[]> {
  try {
    const paymentsRef = collection(db, 'users', userId, 'payments');
    const q = query(
      paymentsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
    })) as PaymentHistory[];
  } catch (error) {
    console.error('Error getting payment history:', error);
    return [];
  }
}

// サブスクリプションがアクティブかチェック
export async function isSubscriptionActive(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  
  if (!subscription) {
    return false;
  }
  
  // アクティブまたはトライアル中の場合
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    // 期限をチェック
    if (subscription.currentPeriodEnd) {
      return subscription.currentPeriodEnd > new Date();
    }
    if (subscription.trialEndsAt) {
      return subscription.trialEndsAt > new Date();
    }
    return true;
  }
  
  return false;
}

// Webhookイベントの重複処理を防ぐ
export async function isWebhookEventProcessed(eventId: string): Promise<boolean> {
  try {
    const eventDoc = await getDoc(doc(db, 'webhookEvents', eventId));
    return eventDoc.exists();
  } catch (error) {
    console.error('Error checking webhook event:', error);
    return false;
  }
}

// Webhookイベントを処理済みとしてマーク
export async function markWebhookEventProcessed(eventId: string): Promise<void> {
  try {
    await setDoc(doc(db, 'webhookEvents', eventId), {
      processedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error marking webhook event as processed:', error);
    throw error;
  }
}