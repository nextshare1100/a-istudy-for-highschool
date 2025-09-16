// lib/apple-receipt-verification.ts
import jwt from 'jsonwebtoken';
import axios from 'axios';

interface AppleReceiptResponse {
  status: number;
  receipt: {
    in_app: Array<{
      product_id: string;
      transaction_id: string;
      original_transaction_id: string;
      purchase_date_ms: string;
      expires_date_ms?: string;
      is_trial_period?: string;
      is_in_intro_offer_period?: string;
    }>;
  };
  latest_receipt_info?: Array<{
    product_id: string;
    transaction_id: string;
    expires_date_ms: string;
    is_trial_period: string;
    is_in_intro_offer_period: string;
    auto_renew_status: string;
  }>;
  pending_renewal_info?: Array<{
    auto_renew_status: string;
    product_id: string;
  }>;
}

export async function verifyAppleReceipt(receiptData: string) {
  const verifyUrl = process.env.NODE_ENV === 'production'
    ? 'https://buy.itunes.apple.com/verifyReceipt'
    : 'https://sandbox.itunes.apple.com/verifyReceipt';

  const sharedSecret = process.env.APPLE_SHARED_SECRET;
  
  if (!sharedSecret) {
    throw new Error('Apple shared secret not configured');
  }

  try {
    // Appleのサーバーにレシートを送信
    const response = await axios.post<AppleReceiptResponse>(verifyUrl, {
      'receipt-data': receiptData,
      'password': sharedSecret,
      'exclude-old-transactions': true
    });

    const { data } = response;

    // ステータスコードのチェック
    if (data.status !== 0) {
      console.error('Apple receipt verification failed with status:', data.status);
      throw new Error(`Invalid receipt: status ${data.status}`);
    }

    // 最新のサブスクリプション情報を取得
    const latestReceipt = data.latest_receipt_info?.[0];
    const renewalInfo = data.pending_renewal_info?.[0];

    if (!latestReceipt) {
      throw new Error('No subscription found in receipt');
    }

    // 有効期限の確認
    const expirationDate = new Date(parseInt(latestReceipt.expires_date_ms));
    const now = new Date();
    const isActive = expirationDate > now;

    // トライアル期間かどうか
    const isInTrial = latestReceipt.is_trial_period === 'true' || 
                     latestReceipt.is_in_intro_offer_period === 'true';

    // 自動更新状態
    const autoRenewing = renewalInfo?.auto_renew_status === '1';

    return {
      productId: latestReceipt.product_id,
      transactionId: latestReceipt.transaction_id,
      status: 'verified',
      isActive,
      isInTrial,
      expirationDate,
      originalPurchaseDate: new Date(parseInt(data.receipt.in_app[0].purchase_date_ms)),
      autoRenewing,
    };

  } catch (error: any) {
    console.error('Apple receipt verification error:', error);
    
    if (error.response?.data?.status === 21007) {
      // Sandboxレシートが本番環境に送信された場合
      console.log('Retrying with sandbox environment...');
      return verifyAppleReceiptWithSandbox(receiptData);
    }
    
    throw error;
  }
}

// Sandboxへのリトライ
async function verifyAppleReceiptWithSandbox(receiptData: string) {
  const response = await axios.post<AppleReceiptResponse>(
    'https://sandbox.itunes.apple.com/verifyReceipt',
    {
      'receipt-data': receiptData,
      'password': process.env.APPLE_SHARED_SECRET,
      'exclude-old-transactions': true
    }
  );

  const { data } = response;
  
  if (data.status !== 0) {
    throw new Error(`Invalid receipt: status ${data.status}`);
  }

  const latestReceipt = data.latest_receipt_info?.[0];
  const renewalInfo = data.pending_renewal_info?.[0];

  if (!latestReceipt) {
    throw new Error('No subscription found in receipt');
  }

  const expirationDate = new Date(parseInt(latestReceipt.expires_date_ms));
  const isActive = expirationDate > new Date();
  const isInTrial = latestReceipt.is_trial_period === 'true';
  const autoRenewing = renewalInfo?.auto_renew_status === '1';

  return {
    productId: latestReceipt.product_id,
    transactionId: latestReceipt.transaction_id,
    status: 'verified',
    isActive,
    isInTrial,
    expirationDate,
    originalPurchaseDate: new Date(parseInt(data.receipt.in_app[0].purchase_date_ms)),
    autoRenewing,
  };
}