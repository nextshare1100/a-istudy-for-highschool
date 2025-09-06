import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { auth } from '../firebase';

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
});

export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  // 認証チェック
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'ユーザーが認証されていません'
    );
  }
  
  const userId = context.auth.uid;
  const { priceType, successUrl, cancelUrl } = data;
  
  // パラメータ検証
  if (!priceType || !['monthly', 'yearly'].includes(priceType)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      '無効な価格タイプです'
    );
  }
  
  try {
    // ユーザー情報を取得
    const userRecord = await auth.getUser(userId);
    
    // 価格IDを取得
    const priceId = priceType === 'monthly' 
      ? functions.config().stripe.price_monthly_id
      : functions.config().stripe.price_yearly_id;
    
    // Checkout セッションを作成
    const session = await stripe.checkout.sessions.create({
      customer_email: userRecord.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${functions.config().app.url}/subscription/success`,
      cancel_url: cancelUrl || `${functions.config().app.url}/subscription`,
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          firebaseUserId: userId,
        },
      },
      metadata: {
        firebaseUserId: userId,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      locale: 'ja',
    });
    
    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error: any) {
    console.error('Checkout session creation failed:', error);
    throw new functions.https.HttpsError(
      'internal',
      '決済セッションの作成に失敗しました',
      error.message
    );
  }
});

// カスタマーポータルセッションを作成
export const createPortalSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'ユーザーが認証されていません'
    );
  }
  
  const { returnUrl } = data;
  
  try {
    // ユーザーのStripe顧客IDを取得
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const userData = userDoc.data();
    
    if (!userData?.stripeCustomerId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Stripe顧客IDが見つかりません'
      );
    }
    
    const session = await stripe.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: returnUrl || `${functions.config().app.url}/settings/billing`,
      locale: 'ja',
    });
    
    return { url: session.url };
  } catch (error: any) {
    console.error('Portal session creation failed:', error);
    throw new functions.https.HttpsError(
      'internal',
      'カスタマーポータルの作成に失敗しました',
      error.message
    );
  }
});