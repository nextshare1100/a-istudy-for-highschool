// ========== データモデル定義 ==========
// models/User.ts
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  platform: { type: String, enum: ['web', 'ios', 'android'], required: true },
  
  // 認証情報
  firebaseUid: { type: String, required: true, unique: true },
  
  // サブスクリプション状態
  subscriptionStatus: {
    type: String,
    enum: ['free', 'trial', 'active', 'cancelled', 'expired'],
    default: 'free'
  },
  
  // プラットフォーム別の決済情報
  paymentInfo: {
    // Web (Stripe)
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    
    // iOS
    iosTransactionId: String,
    iosOriginalTransactionId: String,
    iosReceiptData: String,
    
    // Android
    androidPurchaseToken: String,
    androidOrderId: String,
    androidProductId: String
  },
  
  // 共通のサブスクリプション情報
  subscription: {
    startDate: Date,
    endDate: Date,
    nextBillingDate: Date,
    registrationFeePaid: { type: Boolean, default: false },
    registrationFeeDate: Date,
    trialEndDate: Date
  },
  
  // クーポン情報
  appliedCoupon: {
    code: String,
    type: { type: String, enum: ['trial_30days', 'discount_50', 'discount_100'] },
    appliedAt: Date
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', UserSchema);

// ========== クーポンモデル ==========
// models/Coupon.ts
const CouponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    enum: ['trial_30days', 'discount_50', 'discount_100'],
    required: true 
  },
  description: String,
  validFrom: { type: Date, default: Date.now },
  validUntil: Date,
  maxUses: { type: Number, default: -1 }, // -1 = 無制限
  usedCount: { type: Number, default: 0 },
  platforms: [{ type: String, enum: ['web', 'ios', 'android', 'all'] }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const Coupon = mongoose.model('Coupon', CouponSchema);

// ========== Stripe決済処理 (Web用) ==========
// services/stripe-service.ts
import Stripe from 'stripe';
import { User } from '../models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export class StripeService {
  // Stripeチェックアウトセッション作成
  static async createCheckoutSession(userId: string, couponCode?: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    // 既存の顧客IDがあれば使用、なければ新規作成
    let customerId = user.paymentInfo?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user._id.toString() }
      });
      customerId = customer.id;
      user.paymentInfo.stripeCustomerId = customerId;
      await user.save();
    }
    
    // 基本的なセッションパラメータ
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: process.env.STRIPE_PRICE_ID_MONTHLY!,
        quantity: 1
      }],
      success_url: `${process.env.APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/payment/cancel`,
      metadata: {
        userId: user._id.toString(),
        platform: 'web'
      }
    };
    
    // クーポンコードの処理
    if (couponCode) {
      const coupon = await this.validateCoupon(couponCode);
      if (coupon.type === 'trial_30days') {
        sessionParams.subscription_data = {
          trial_period_days: 30,
          metadata: { couponCode }
        };
      } else {
        // Stripeクーポンを適用
        sessionParams.discounts = [{
          coupon: couponCode.toUpperCase()
        }];
      }
    }
    
    const session = await stripe.checkout.sessions.create(sessionParams);
    return session;
  }
  
  // Webhookイベント処理
  static async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
    }
  }
  
  private static async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    if (!userId) return;
    
    const user = await User.findById(userId);
    if (!user) return;
    
    // サブスクリプション情報を取得
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    
    user.paymentInfo.stripeSubscriptionId = subscription.id;
    user.subscriptionStatus = subscription.status === 'trialing' ? 'trial' : 'active';
    user.subscription = {
      startDate: new Date(subscription.current_period_start * 1000),
      endDate: new Date(subscription.current_period_end * 1000),
      nextBillingDate: new Date(subscription.current_period_end * 1000),
      registrationFeePaid: true,
      registrationFeeDate: new Date()
    };
    
    await user.save();
  }
  
  private static async validateCoupon(code: string) {
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true,
      $or: [
        { platforms: 'all' },
        { platforms: 'web' }
      ]
    });
    
    if (!coupon) throw new Error('Invalid coupon code');
    if (coupon.validUntil && coupon.validUntil < new Date()) {
      throw new Error('Coupon has expired');
    }
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      throw new Error('Coupon usage limit reached');
    }
    
    return coupon;
  }
}

// ========== iOS/Android アプリ内購入処理 ==========
// services/iap-service.ts
import { User } from '../models/User';
import fetch from 'node-fetch';

export class IAPService {
  // iOS レシート検証
  static async verifyIOSReceipt(receiptData: string, userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    // Apple検証エンドポイント
    const verifyUrl = process.env.NODE_ENV === 'production'
      ? 'https://buy.itunes.apple.com/verifyReceipt'
      : 'https://sandbox.itunes.apple.com/verifyReceipt';
    
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': receiptData,
        'password': process.env.APPLE_SHARED_SECRET
      })
    });
    
    const result = await response.json();
    
    if (result.status !== 0) {
      throw new Error(`Apple receipt validation failed: ${result.status}`);
    }
    
    // レシートから購入情報を抽出
    const latestReceipt = result.latest_receipt_info?.[0];
    if (!latestReceipt) {
      throw new Error('No purchase found in receipt');
    }
    
    // 初回登録料の購入を確認
    const registrationFeePurchase = result.latest_receipt_info.find(
      (item: any) => item.product_id === process.env.IOS_REGISTRATION_FEE_ID
    );
    
    // 月額サブスクリプションの購入を確認
    const subscriptionPurchase = result.latest_receipt_info.find(
      (item: any) => item.product_id === process.env.IOS_SUBSCRIPTION_ID
    );
    
    // ユーザー情報を更新
    user.platform = 'ios';
    user.paymentInfo.iosReceiptData = receiptData;
    
    if (registrationFeePurchase) {
      user.paymentInfo.iosTransactionId = registrationFeePurchase.transaction_id;
      user.paymentInfo.iosOriginalTransactionId = registrationFeePurchase.original_transaction_id;
      user.subscription.registrationFeePaid = true;
      user.subscription.registrationFeeDate = new Date(parseInt(registrationFeePurchase.purchase_date_ms));
    }
    
    if (subscriptionPurchase) {
      const expiresDate = new Date(parseInt(subscriptionPurchase.expires_date_ms));
      user.subscriptionStatus = expiresDate > new Date() ? 'active' : 'expired';
      user.subscription.startDate = new Date(parseInt(subscriptionPurchase.original_purchase_date_ms));
      user.subscription.endDate = expiresDate;
      user.subscription.nextBillingDate = expiresDate;
    }
    
    await user.save();
    
    return {
      success: true,
      registrationFeePaid: !!registrationFeePurchase,
      subscriptionActive: user.subscriptionStatus === 'active',
      expiresAt: user.subscription.endDate
    };
  }
  
  // Android購入検証
  static async verifyAndroidPurchase(purchaseToken: string, productId: string, userId: string) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    // Google Play APIクライアントの初期化
    const { google } = require('googleapis');
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
      scopes: ['https://www.googleapis.com/auth/androidpublisher']
    });
    
    const androidPublisher = google.androidpublisher({
      version: 'v3',
      auth: await auth.getClient()
    });
    
    try {
      let purchaseData;
      
      // 製品タイプに応じて適切なAPIを使用
      if (productId === process.env.ANDROID_REGISTRATION_FEE_ID) {
        // 一回限りの購入（登録料）
        const response = await androidPublisher.purchases.products.get({
          packageName: process.env.ANDROID_PACKAGE_NAME,
          productId: productId,
          token: purchaseToken
        });
        purchaseData = response.data;
        
        if (purchaseData.purchaseState === 0) { // 0 = 購入済み
          user.subscription.registrationFeePaid = true;
          user.subscription.registrationFeeDate = new Date(parseInt(purchaseData.purchaseTimeMillis));
          user.paymentInfo.androidOrderId = purchaseData.orderId;
        }
      } else if (productId === process.env.ANDROID_SUBSCRIPTION_ID) {
        // サブスクリプション
        const response = await androidPublisher.purchases.subscriptions.get({
          packageName: process.env.ANDROID_PACKAGE_NAME,
          subscriptionId: productId,
          token: purchaseToken
        });
        purchaseData = response.data;
        
        const expiryTime = new Date(parseInt(purchaseData.expiryTimeMillis));
        user.subscriptionStatus = expiryTime > new Date() ? 'active' : 'expired';
        user.subscription.startDate = new Date(parseInt(purchaseData.startTimeMillis));
        user.subscription.endDate = expiryTime;
        user.subscription.nextBillingDate = expiryTime;
      }
      
      user.platform = 'android';
      user.paymentInfo.androidPurchaseToken = purchaseToken;
      user.paymentInfo.androidProductId = productId;
      
      await user.save();
      
      return {
        success: true,
        registrationFeePaid: user.subscription.registrationFeePaid,
        subscriptionActive: user.subscriptionStatus === 'active',
        expiresAt: user.subscription.endDate
      };
    } catch (error) {
      console.error('Android purchase verification failed:', error);
      throw new Error('Purchase verification failed');
    }
  }
  
  // クーポンコード適用（iOS/Android用）
  static async applyCoupon(userId: string, couponCode: string, platform: 'ios' | 'android') {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    // 既にクーポンが適用されている場合はエラー
    if (user.appliedCoupon?.code) {
      throw new Error('Coupon already applied');
    }
    
    // クーポンの検証
    const coupon = await Coupon.findOne({
      code: couponCode.toUpperCase(),
      isActive: true,
      $or: [
        { platforms: 'all' },
        { platforms: platform }
      ]
    });
    
    if (!coupon) throw new Error('Invalid coupon code');
    if (coupon.validUntil && coupon.validUntil < new Date()) {
      throw new Error('Coupon has expired');
    }
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      throw new Error('Coupon usage limit reached');
    }
    
    // クーポンを適用
    user.appliedCoupon = {
      code: coupon.code,
      type: coupon.type,
      appliedAt: new Date()
    };
    
    // クーポンタイプに応じた処理
    if (coupon.type === 'trial_30days') {
      // 30日間の無料トライアル
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 30);
      
      user.subscriptionStatus = 'trial';
      user.subscription.trialEndDate = trialEndDate;
      user.subscription.startDate = new Date();
      user.subscription.endDate = trialEndDate;
      user.subscription.nextBillingDate = trialEndDate;
    }
    
    // クーポン使用回数を更新
    coupon.usedCount += 1;
    await coupon.save();
    
    await user.save();
    
    return {
      success: true,
      message: 'Coupon applied successfully',
      trialEndDate: user.subscription.trialEndDate
    };
  }
}

// ========== REST APIエンドポイント ==========
// routes/payment.routes.ts
import express from 'express';
import { authenticateUser } from '../middleware/auth';
import { StripeService } from '../services/stripe-service';
import { IAPService } from '../services/iap-service';

const router = express.Router();

// Web: Stripeチェックアウトセッション作成
router.post('/web/create-checkout', authenticateUser, async (req, res) => {
  try {
    const { couponCode } = req.body;
    const session = await StripeService.createCheckoutSession(req.user.id, couponCode);
    
    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Web: Stripe Webhook
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    await StripeService.handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

// iOS: レシート検証
router.post('/ios/verify-receipt', authenticateUser, async (req, res) => {
  try {
    const { receiptData } = req.body;
    const result = await IAPService.verifyIOSReceipt(receiptData, req.user.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Android: 購入検証
router.post('/android/verify-purchase', authenticateUser, async (req, res) => {
  try {
    const { purchaseToken, productId } = req.body;
    const result = await IAPService.verifyAndroidPurchase(
      purchaseToken,
      productId,
      req.user.id
    );
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 共通: クーポン適用（iOS/Android）
router.post('/apply-coupon', authenticateUser, async (req, res) => {
  try {
    const { couponCode, platform } = req.body;
    
    if (!['ios', 'android'].includes(platform)) {
      throw new Error('Invalid platform');
    }
    
    const result = await IAPService.applyCoupon(
      req.user.id,
      couponCode,
      platform as 'ios' | 'android'
    );
    
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// 共通: サブスクリプション状態確認
router.get('/subscription-status', authenticateUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw new Error('User not found');
    
    res.json({
      status: user.subscriptionStatus,
      platform: user.platform,
      registrationFeePaid: user.subscription?.registrationFeePaid || false,
      endDate: user.subscription?.endDate,
      nextBillingDate: user.subscription?.nextBillingDate,
      appliedCoupon: user.appliedCoupon
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

// ========== 環境変数設定例 (.env) ==========
/*
# MongoDB
MONGODB_URI=mongodb://localhost:27017/myapp

# Stripe (Web決済)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PRICE_ID_MONTHLY=price_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Apple (iOS)
APPLE_SHARED_SECRET=xxxxx
IOS_REGISTRATION_FEE_ID=com.myapp.registration_fee
IOS_SUBSCRIPTION_ID=com.myapp.monthly_subscription

# Google (Android)
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./google-service-account.json
ANDROID_PACKAGE_NAME=com.myapp
ANDROID_REGISTRATION_FEE_ID=registration_fee
ANDROID_SUBSCRIPTION_ID=monthly_subscription

# App
APP_URL=https://myapp.com
JWT_SECRET=xxxxx
*/