import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, FieldValue } from '@/lib/firebase-admin';
import { google } from 'googleapis';

// Google Play Developer APIのスコープ
const GOOGLE_PLAY_SCOPE = 'https://www.googleapis.com/auth/androidpublisher';

// 購入タイプ
type PurchaseType = 'one_time' | 'subscription';

// Google Play購入情報の型定義
interface ProductPurchase {
  kind: string;
  purchaseTimeMillis: string;
  purchaseState: number;
  consumptionState: number;
  developerPayload?: string;
  orderId: string;
  purchaseType?: number;
  acknowledgementState: number;
  purchaseToken: string;
  productId: string;
  obfuscatedExternalAccountId?: string;
  obfuscatedExternalProfileId?: string;
}

interface SubscriptionPurchase {
  kind: string;
  startTimeMillis: string;
  expiryTimeMillis: string;
  autoRenewing: boolean;
  priceCurrencyCode: string;
  priceAmountMicros: string;
  countryCode: string;
  developerPayload?: string;
  paymentState?: number;
  cancelReason?: number;
  userCancellationTimeMillis?: string;
  orderId: string;
  linkedPurchaseToken?: string;
  purchaseType?: number;
  acknowledgementState: number;
  obfuscatedExternalAccountId?: string;
  obfuscatedExternalProfileId?: string;
}

export async function POST(request: NextRequest) {
  console.log('=== Android Purchase Verification API Called ===');
  
  try {
    // 認証トークンの検証
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const auth = getAdminAuth();
    
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: '無効な認証トークンです' },
        { status: 401 }
      );
    }
    
    const userId = decodedToken.uid;
    const { purchaseToken, productId } = await request.json();
    
    if (!purchaseToken || !productId) {
      return NextResponse.json(
        { error: '購入トークンと商品IDが必要です' },
        { status: 400 }
      );
    }
    
    // Google Play APIクライアントの初期化
    const androidPublisher = await initializeGooglePlayAPI();
    
    // パッケージ名
    const packageName = process.env.ANDROID_PACKAGE_NAME;
    if (!packageName) {
      console.error('ANDROID_PACKAGE_NAME is not configured');
      return NextResponse.json(
        { error: 'サーバー設定エラー' },
        { status: 500 }
      );
    }
    
    const db = getAdminFirestore();
    const userRef = db.collection('users').doc(userId);
    const now = new Date();
    
    // 商品タイプを判定
    const isRegistrationFee = productId === 'registration_fee';
    const purchaseType: PurchaseType = isRegistrationFee ? 'one_time' : 'subscription';
    
    try {
      let purchaseData: ProductPurchase | SubscriptionPurchase;
      let expiresAt: Date | null = null;
      let subscriptionActive = false;
      
      if (purchaseType === 'one_time') {
        // 一回限りの購入（登録料）
        const response = await androidPublisher.purchases.products.get({
          packageName,
          productId,
          token: purchaseToken
        });
        
        purchaseData = response.data as ProductPurchase;
        
        // 購入状態の確認（0 = 購入済み）
        if (purchaseData.purchaseState !== 0) {
          return NextResponse.json(
            { error: '購入が完了していません' },
            { status: 400 }
          );
        }
      } else {
        // サブスクリプション
        const response = await androidPublisher.purchases.subscriptions.get({
          packageName,
          subscriptionId: productId,
          token: purchaseToken
        });
        
        purchaseData = response.data as SubscriptionPurchase;
        
        // サブスクリプションの有効期限を確認
        const subData = purchaseData as SubscriptionPurchase;
        expiresAt = new Date(parseInt(subData.expiryTimeMillis));
        subscriptionActive = expiresAt > now;
      }
      
      // トランザクション開始
      const batch = db.batch();
      
      // ユーザー情報の更新
      const updateData: any = {
        platform: 'android',
        updatedAt: now
      };
      
      if (isRegistrationFee) {
        // 登録料の処理
        updateData.registrationFeePaid = true;
        updateData.registrationFeeDate = new Date(parseInt((purchaseData as ProductPurchase).purchaseTimeMillis));
        updateData.androidRegistrationOrderId = purchaseData.orderId;
        
        // 購入履歴に記録
        const paymentRef = db.collection('paymentHistory').doc(purchaseData.orderId);
        batch.set(paymentRef, {
          userId,
          type: 'registration_fee',
          platform: 'android',
          amount: 500,
          currency: 'JPY',
          orderId: purchaseData.orderId,
          productId,
          purchaseToken,
          purchaseDate: new Date(parseInt((purchaseData as ProductPurchase).purchaseTimeMillis)),
          createdAt: now
        });
      } else {
        // サブスクリプションの処理
        const subData = purchaseData as SubscriptionPurchase;
        const subscriptionId = `android_${purchaseToken}`;
        
        updateData.subscriptionId = subscriptionId;
        updateData.subscriptionStatus = subscriptionActive ? 'active' : 'expired';
        updateData.androidSubscriptionToken = purchaseToken;
        
        // サブスクリプション情報を保存
        const subscriptionRef = db.collection('subscriptions').doc(subscriptionId);
        batch.set(subscriptionRef, {
          userId,
          platform: 'android',
          status: subscriptionActive ? 'active' : 'expired',
          productId,
          purchaseToken,
          orderId: subData.orderId,
          currentPeriodStart: new Date(parseInt(subData.startTimeMillis)),
          currentPeriodEnd: expiresAt,
          autoRenewing: subData.autoRenewing,
          priceAmount: parseInt(subData.priceAmountMicros) / 1000000,
          priceCurrency: subData.priceCurrencyCode,
          createdAt: new Date(parseInt(subData.startTimeMillis)),
          updatedAt: now
        }, { merge: true });
      }
      
      // ユーザー情報を更新
      batch.update(userRef, updateData);
      
      // Android購入履歴を保存
      const purchaseRef = db.collection('androidPurchases').doc();
      batch.set(purchaseRef, {
        userId,
        productId,
        purchaseToken,
        orderId: purchaseData.orderId,
        purchaseType,
        processedAt: now,
        expiresAt: expiresAt || null
      });
      
      // 購入の承認（まだ承認されていない場合）
      if (purchaseData.acknowledgementState === 0) {
        await acknowledgePurchase(androidPublisher, packageName, productId, purchaseToken, purchaseType);
      }
      
      // バッチ実行
      await batch.commit();
      
      console.log(`Android purchase verified for user ${userId}`);
      
      return NextResponse.json({
        success: true,
        registrationFeePaid: isRegistrationFee || updateData.registrationFeePaid,
        subscriptionActive,
        expiresAt,
        orderId: purchaseData.orderId
      });
      
    } catch (error: any) {
      console.error('Google Play API error:', error);
      
      // エラーメッセージの解析
      if (error.code === 404) {
        return NextResponse.json(
          { error: '購入情報が見つかりません' },
          { status: 404 }
        );
      } else if (error.code === 401) {
        return NextResponse.json(
          { error: 'Google Play APIの認証に失敗しました' },
          { status: 500 }
        );
      }
      
      throw error;
    }
    
  } catch (error: any) {
    console.error('Android purchase verification error:', error);
    return NextResponse.json(
      { 
        error: '購入検証中にエラーが発生しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Google Play Developer APIの初期化
async function initializeGooglePlayAPI() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not configured');
  }
  
  let keyData;
  try {
    // Base64エンコードされている場合はデコード
    if (serviceAccountKey.startsWith('{')) {
      keyData = JSON.parse(serviceAccountKey);
    } else {
      keyData = JSON.parse(Buffer.from(serviceAccountKey, 'base64').toString());
    }
  } catch (error) {
    console.error('Failed to parse service account key:', error);
    throw new Error('Invalid service account key format');
  }
  
  const auth = new google.auth.GoogleAuth({
    credentials: keyData,
    scopes: [GOOGLE_PLAY_SCOPE]
  });
  
  const androidPublisher = google.androidpublisher({
    version: 'v3',
    auth
  });
  
  return androidPublisher;
}

// 購入の承認
async function acknowledgePurchase(
  androidPublisher: any,
  packageName: string,
  productId: string,
  purchaseToken: string,
  purchaseType: PurchaseType
) {
  try {
    if (purchaseType === 'one_time') {
      await androidPublisher.purchases.products.acknowledge({
        packageName,
        productId,
        token: purchaseToken
      });
    } else {
      await androidPublisher.purchases.subscriptions.acknowledge({
        packageName,
        subscriptionId: productId,
        token: purchaseToken
      });
    }
    console.log('Purchase acknowledged successfully');
  } catch (error) {
    console.error('Failed to acknowledge purchase:', error);
    // 承認エラーは無視（購入自体は有効）
  }
}