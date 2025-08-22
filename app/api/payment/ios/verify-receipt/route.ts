import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, FieldValue } from '@/lib/firebase-admin';

// Apple検証エンドポイント
const APPLE_VERIFY_RECEIPT_URL = {
  production: 'https://buy.itunes.apple.com/verifyReceipt',
  sandbox: 'https://sandbox.itunes.apple.com/verifyReceipt'
};

// レシート検証レスポンスの型定義
interface AppleReceiptResponse {
  status: number;
  environment: 'Production' | 'Sandbox';
  receipt: {
    bundle_id: string;
    application_version: string;
    in_app: InAppPurchase[];
  };
  latest_receipt_info?: InAppPurchase[];
  latest_receipt?: string;
  pending_renewal_info?: PendingRenewalInfo[];
}

interface InAppPurchase {
  product_id: string;
  transaction_id: string;
  original_transaction_id: string;
  purchase_date_ms: string;
  original_purchase_date_ms: string;
  expires_date_ms?: string;
  is_trial_period?: string;
  cancellation_date_ms?: string;
}

interface PendingRenewalInfo {
  product_id: string;
  original_transaction_id: string;
  auto_renew_status: string;
  expiration_intent?: string;
}

export async function POST(request: NextRequest) {
  console.log('=== iOS Receipt Verification API Called ===');
  
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
    const { receiptData } = await request.json();
    
    if (!receiptData) {
      return NextResponse.json(
        { error: 'レシートデータが必要です' },
        { status: 400 }
      );
    }
    
    // Appleのシークレットキー
    const sharedSecret = process.env.APPLE_SHARED_SECRET;
    if (!sharedSecret) {
      console.error('APPLE_SHARED_SECRET is not configured');
      return NextResponse.json(
        { error: 'サーバー設定エラー' },
        { status: 500 }
      );
    }
    
    // まず本番環境で検証を試みる
    let verifyResponse = await verifyWithApple(
      APPLE_VERIFY_RECEIPT_URL.production,
      receiptData,
      sharedSecret
    );
    
    // サンドボックスレシートの場合は再試行
    if (verifyResponse.status === 21007) {
      console.log('Retrying with sandbox environment...');
      verifyResponse = await verifyWithApple(
        APPLE_VERIFY_RECEIPT_URL.sandbox,
        receiptData,
        sharedSecret
      );
    }
    
    // エラーステータスの処理
    if (verifyResponse.status !== 0) {
      console.error('Apple receipt validation failed:', verifyResponse.status);
      return NextResponse.json(
        { error: getAppleErrorMessage(verifyResponse.status) },
        { status: 400 }
      );
    }
    
    // レシート情報を解析
    const latestReceiptInfo = verifyResponse.latest_receipt_info || verifyResponse.receipt.in_app;
    if (!latestReceiptInfo || latestReceiptInfo.length === 0) {
      return NextResponse.json(
        { error: '購入情報が見つかりません' },
        { status: 400 }
      );
    }
    
    const db = getAdminFirestore();
    const userRef = db.collection('users').doc(userId);
    const now = new Date();
    
    // 初回登録料の購入を確認
    const registrationFeePurchase = latestReceiptInfo.find(
      item => item.product_id === 'com.aistudy.registration_fee'
    );
    
    // 月額サブスクリプションの購入を確認
    const subscriptionPurchase = latestReceiptInfo
      .filter(item => item.product_id === 'com.aistudy.monthly_subscription')
      .sort((a, b) => parseInt(b.purchase_date_ms) - parseInt(a.purchase_date_ms))[0];
    
    // トランザクション開始
    const batch = db.batch();
    
    // ユーザー情報の更新
    const updateData: any = {
      platform: 'ios',
      updatedAt: now
    };
    
    let subscriptionStatus = 'free';
    let subscriptionActive = false;
    let expiresAt: Date | null = null;
    
    // 初回登録料の処理
    if (registrationFeePurchase) {
      updateData.registrationFeePaid = true;
      updateData.registrationFeeDate = new Date(parseInt(registrationFeePurchase.purchase_date_ms));
      updateData.iosRegistrationTransactionId = registrationFeePurchase.transaction_id;
      
      // 購入履歴に記録
      const paymentRef = db.collection('paymentHistory').doc(registrationFeePurchase.transaction_id);
      batch.set(paymentRef, {
        userId,
        type: 'registration_fee',
        platform: 'ios',
        amount: 500,
        currency: 'JPY',
        transactionId: registrationFeePurchase.transaction_id,
        productId: registrationFeePurchase.product_id,
        purchaseDate: new Date(parseInt(registrationFeePurchase.purchase_date_ms)),
        createdAt: now
      });
    }
    
    // サブスクリプションの処理
    if (subscriptionPurchase && subscriptionPurchase.expires_date_ms) {
      const expiryDate = new Date(parseInt(subscriptionPurchase.expires_date_ms));
      expiresAt = expiryDate;
      
      if (expiryDate > now) {
        subscriptionStatus = 'active';
        subscriptionActive = true;
        
        // サブスクリプション情報を保存
        const subscriptionRef = db.collection('subscriptions').doc(subscriptionPurchase.original_transaction_id);
        batch.set(subscriptionRef, {
          userId,
          platform: 'ios',
          status: 'active',
          productId: subscriptionPurchase.product_id,
          transactionId: subscriptionPurchase.transaction_id,
          originalTransactionId: subscriptionPurchase.original_transaction_id,
          currentPeriodStart: new Date(parseInt(subscriptionPurchase.purchase_date_ms)),
          currentPeriodEnd: expiryDate,
          isTrialPeriod: subscriptionPurchase.is_trial_period === 'true',
          createdAt: new Date(parseInt(subscriptionPurchase.original_purchase_date_ms)),
          updatedAt: now
        }, { merge: true });
        
        updateData.subscriptionId = subscriptionPurchase.original_transaction_id;
        updateData.subscriptionStatus = 'active';
        updateData.iosOriginalTransactionId = subscriptionPurchase.original_transaction_id;
      } else {
        subscriptionStatus = 'expired';
        updateData.subscriptionStatus = 'expired';
      }
    }
    
    // 最新のレシートを保存
    if (verifyResponse.latest_receipt) {
      updateData.iosLatestReceipt = verifyResponse.latest_receipt;
    }
    
    // ユーザー情報を更新
    batch.update(userRef, updateData);
    
    // レシート履歴を保存
    const receiptRef = db.collection('iosReceipts').doc();
    batch.set(receiptRef, {
      userId,
      receiptData: verifyResponse.latest_receipt || receiptData,
      environment: verifyResponse.environment,
      processedAt: now,
      transactions: latestReceiptInfo.map(item => ({
        productId: item.product_id,
        transactionId: item.transaction_id,
        purchaseDate: new Date(parseInt(item.purchase_date_ms))
      }))
    });
    
    // バッチ実行
    await batch.commit();
    
    console.log(`iOS receipt verified for user ${userId}`);
    
    return NextResponse.json({
      success: true,
      registrationFeePaid: !!registrationFeePurchase,
      subscriptionActive,
      subscriptionStatus,
      expiresAt,
      environment: verifyResponse.environment
    });
    
  } catch (error: any) {
    console.error('iOS receipt verification error:', error);
    return NextResponse.json(
      { 
        error: 'レシート検証中にエラーが発生しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Appleサーバーへのレシート検証リクエスト
async function verifyWithApple(
  url: string,
  receiptData: string,
  password: string
): Promise<AppleReceiptResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      'receipt-data': receiptData,
      'password': password,
      'exclude-old-transactions': true
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Apple API request failed: ${response.status}`);
  }
  
  return response.json();
}

// Appleのエラーコードをユーザーフレンドリーなメッセージに変換
function getAppleErrorMessage(status: number): string {
  const errorMessages: Record<number, string> = {
    21000: 'App Storeに接続できませんでした',
    21002: 'レシートデータの形式が正しくありません',
    21003: 'レシートを認証できませんでした',
    21004: 'シークレットキーが一致しません',
    21005: 'レシートサーバーが一時的に利用できません',
    21006: 'このレシートは有効ですが、サブスクリプションは期限切れです',
    21007: 'このレシートはテスト環境のレシートです',
    21008: 'このレシートは本番環境のレシートです',
    21010: 'このレシートは承認されていません'
  };
  
  return errorMessages[status] || `レシート検証エラー (${status})`;
}