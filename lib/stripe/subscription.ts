// lib/stripe/subscription.ts

import { stripe } from './client';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { Stripe } from 'stripe';

// 定数
export const FREE_TRIAL_DAYS = 0; // トライアルなし（キャンペーンコードで対応）

// Stripeカスタマーの作成または取得
export async function createOrRetrieveCustomer(
  userId: string,
  email: string
): Promise<string> {
  // Firestoreからカスタマー情報を取得
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();

  if (userData?.stripeCustomerId) {
    return userData.stripeCustomerId;
  }

  // 新規カスタマー作成
  const customer = await stripe.customers.create({
    email,
    metadata: {
      firebaseUserId: userId,
    },
  });

  // FirestoreにカスタマーIDを保存
  await updateDoc(userRef, {
    stripeCustomerId: customer.id,
    updatedAt: new Date(),
  });

  return customer.id;
}

// Checkoutセッションの作成
export async function createCheckoutSession({
  userId,
  userEmail,
  priceId,
  successUrl,
  cancelUrl,
  campaignCode,
}: {
  userId: string;
  userEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  campaignCode?: string;
}) {
  const customerId = await createOrRetrieveCustomer(userId, userEmail);

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      trial_period_days: FREE_TRIAL_DAYS,
      metadata: {
        firebaseUserId: userId,
      },
    },
    metadata: {
      userId: userId,
    },
    allow_promotion_codes: true,
    locale: 'ja',
  };

  // キャンペーンコードが指定されている場合
  if (campaignCode && campaignCode.trim()) {
    const normalizedCode = campaignCode.trim().toUpperCase();
    
    try {
      // Stripeでクーポンの存在確認
      const coupon = await stripe.coupons.retrieve(normalizedCode);
      
      if (coupon && coupon.valid) {
        // ディスカウントとして適用
        sessionParams.discounts = [{
          coupon: normalizedCode
        }];
        
        // メタデータにキャンペーン情報を追加
        sessionParams.subscription_data!.metadata!.campaignCode = normalizedCode;
      }
    } catch (error) {
      console.error('Invalid campaign code:', normalizedCode);
      // 無効なクーポンコードの場合はエラーをスロー
      throw new Error('無効なキャンペーンコードです');
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return session;
}

// カスタマーポータルセッションの作成
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
    locale: 'ja',
  });

  return session;
}

// サブスクリプション状態の取得
export async function getSubscriptionStatus(userId: string) {
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  const customerId = userDoc.data()?.stripeCustomerId;

  if (!customerId) {
    return null;
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 1,
  });

  return subscriptions.data[0] || null;
}

// サブスクリプション情報の更新
export async function updateSubscriptionStatus(
  userId: string,
  subscription: Stripe.Subscription
) {
  const subscriptionData = {
    id: subscription.id,
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000)
      : null,
    trialEnd: subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null,
  };

  // Firestoreに保存
  await setDoc(
    doc(db, 'subscriptions', subscription.id),
    {
      ...subscriptionData,
      userId,
      stripePriceId: subscription.items.data[0].price.id,
      stripeCustomerId: subscription.customer,
      createdAt: new Date(subscription.created * 1000),
      updatedAt: new Date(),
    },
    { merge: true }
  );

  // ユーザードキュメントも更新
  await updateDoc(doc(db, 'users', userId), {
    subscriptionStatus: subscription.status === 'active' ? 'premium' : 'free',
    subscriptionId: subscription.id,
    updatedAt: new Date(),
  });
}

// サブスクリプションのキャンセル
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  return subscription;
}

// サブスクリプションの再開
export async function resumeSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  return subscription;
}

// 支払い方法の更新
export async function updatePaymentMethod(
  customerId: string,
  paymentMethodId: string
) {
  // 支払い方法をカスタマーにアタッチ
  await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });

  // デフォルトの支払い方法として設定
  await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}

// 請求履歴の取得
export async function getBillingHistory(customerId: string, limit: number = 10) {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });

  return invoices.data.map(invoice => ({
    id: invoice.id,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status,
    created: new Date(invoice.created * 1000),
    invoicePdf: invoice.invoice_pdf,
  }));
}

// キャンペーンコードの検証
export async function validateCampaignCode(code: string): Promise<{
  isValid: boolean;
  discount?: Stripe.Coupon;
  error?: string;
}> {
  try {
    const normalizedCode = code.trim().toUpperCase();
    const coupon = await stripe.coupons.retrieve(normalizedCode);
    
    if (!coupon.valid) {
      return { isValid: false, error: 'このキャンペーンコードは無効です' };
    }
    
    // 有効期限チェック
    if (coupon.redeem_by && new Date(coupon.redeem_by * 1000) < new Date()) {
      return { isValid: false, error: 'このキャンペーンコードの有効期限が切れています' };
    }
    
    return { isValid: true, discount: coupon };
  } catch (error) {
    return { isValid: false, error: 'キャンペーンコードが見つかりません' };
  }
}