// lib/google-receipt-verification.ts
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

interface GooglePurchase {
  kind: string;
  purchaseTimeMillis: string;
  purchaseState: number;
  consumptionState: number;
  developerPayload: string;
  orderId: string;
  purchaseType: number;
  acknowledgementState: number;
  purchaseToken: string;
  productId: string;
  quantity: number;
  obfuscatedExternalAccountId: string;
  obfuscatedExternalProfileId: string;
  regionCode: string;
}

interface GoogleSubscription {
  kind: string;
  startTimeMillis: string;
  expiryTimeMillis: string;
  autoRenewing: boolean;
  priceCurrencyCode: string;
  priceAmountMicros: string;
  introductoryPriceInfo?: {
    introductoryPriceCurrencyCode: string;
    introductoryPriceAmountMicros: string;
    introductoryPricePeriod: string;
    introductoryPriceCycles: number;
  };
  countryCode: string;
  developerPayload: string;
  paymentState: number;
  cancelReason?: number;
  userCancellationTimeMillis?: string;
  orderId: string;
  linkedPurchaseToken?: string;
  purchaseType: number;
  acknowledgementState: number;
  promotionType?: number;
  promotionCode?: string;
  obfuscatedExternalAccountId?: string;
  obfuscatedExternalProfileId?: string;
}

export async function verifyGoogleReceipt(purchaseToken: string) {
  // サービスアカウントの認証情報
  const serviceAccount = JSON.parse(
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'
  );

  if (!serviceAccount.client_email) {
    throw new Error('Google service account not configured');
  }

  // JWT クライアントの作成
  const jwtClient = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });

  // Google Play Developer API クライアントの作成
  const androidPublisher = google.androidpublisher({
    version: 'v3',
    auth: jwtClient,
  });

  const packageName = process.env.ANDROID_PACKAGE_NAME || 'com.aistudy.app';
  const subscriptionId = process.env.ANDROID_SUBSCRIPTION_ID || 'premium_monthly';

  try {
    // サブスクリプション情報を取得
    const response = await androidPublisher.purchases.subscriptions.get({
      packageName,
      subscriptionId,
      token: purchaseToken,
    });

    const subscription = response.data as GoogleSubscription;

    // 支払い状態の確認
    const isPaymentPending = subscription.paymentState === 0;
    const isPaymentReceived = subscription.paymentState === 1;
    
    if (!isPaymentReceived && !isPaymentPending) {
      throw new Error('Payment not received');
    }

    // 有効期限の確認
    const expirationDate = new Date(parseInt(subscription.expiryTimeMillis));
    const startDate = new Date(parseInt(subscription.startTimeMillis));
    const now = new Date();
    const isActive = expirationDate > now && isPaymentReceived;

    // トライアル期間かどうかの判定
    const isInTrial = !!subscription.introductoryPriceInfo && 
                     subscription.paymentState === 2; // Free trial

    // キャンセル済みかどうか
    const isCancelled = subscription.userCancellationTimeMillis !== undefined;

    // 購入確認（Acknowledgement）が必要な場合
    if (subscription.acknowledgementState === 0) {
      await acknowledgePurchase(androidPublisher, packageName, subscriptionId, purchaseToken);
    }

    return {
      productId: subscriptionId,
      transactionId: subscription.orderId,
      status: 'verified',
      isActive,
      isInTrial,
      expirationDate,
      originalPurchaseDate: startDate,
      autoRenewing: subscription.autoRenewing && !isCancelled,
      paymentPending: isPaymentPending,
      cancelledDate: subscription.userCancellationTimeMillis 
        ? new Date(parseInt(subscription.userCancellationTimeMillis))
        : undefined,
    };

  } catch (error: any) {
    console.error('Google receipt verification error:', error);
    
    if (error.code === 410) {
      // サブスクリプションが期限切れ
      return {
        productId: subscriptionId,
        transactionId: '',
        status: 'expired',
        isActive: false,
        isInTrial: false,
        expirationDate: new Date(0),
        originalPurchaseDate: new Date(0),
        autoRenewing: false,
      };
    }
    
    throw error;
  }
}

// 購入確認（Acknowledgement）
async function acknowledgePurchase(
  androidPublisher: any,
  packageName: string,
  subscriptionId: string,
  purchaseToken: string
) {
  try {
    await androidPublisher.purchases.subscriptions.acknowledge({
      packageName,
      subscriptionId,
      token: purchaseToken,
      requestBody: {
        developerPayload: JSON.stringify({
          acknowledged: true,
          timestamp: new Date().toISOString(),
        }),
      },
    });
    console.log('Purchase acknowledged successfully');
  } catch (error) {
    console.error('Failed to acknowledge purchase:', error);
    // エラーを投げずに続行（既に確認済みの可能性）
  }
}