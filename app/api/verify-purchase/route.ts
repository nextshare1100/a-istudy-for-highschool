// app/api/verify-purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';
import { db } from '@/lib/firebase-admin';
import { verifyAppleReceipt } from '@/lib/apple-receipt-verification';
import { verifyGoogleReceipt } from '@/lib/google-receipt-verification';

export async function POST(req: NextRequest) {
  try {
    // 認証チェック
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { transactionId, platform, receipt } = await req.json();

    if (!transactionId || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // プラットフォームに応じて検証
    let verificationResult;
    
    if (platform === 'ios') {
      verificationResult = await verifyAppleReceipt(receipt);
    } else if (platform === 'android') {
      verificationResult = await verifyGoogleReceipt(transactionId);
    } else {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    // 検証結果をFirestoreに保存
    const db = getAdminFirestore();
    const subscriptionData = {
      userId,
      platform,
      transactionId,
      productId: verificationResult.productId,
      status: verificationResult.status,
      isActive: verificationResult.isActive,
      isInTrial: verificationResult.isInTrial,
      expirationDate: verificationResult.expirationDate,
      originalPurchaseDate: verificationResult.originalPurchaseDate,
      lastVerified: new Date(),
      autoRenewing: verificationResult.autoRenewing,
    };

    // ユーザードキュメントを更新
    await db.collection('users').doc(userId).update({
      subscription: subscriptionData,
      updatedAt: new Date(),
    });

    // 購入履歴を記録
    await db.collection('purchases').add({
      ...subscriptionData,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      subscription: {
        isActive: verificationResult.isActive,
        isInTrial: verificationResult.isInTrial,
        expirationDate: verificationResult.expirationDate,
      },
    });

  } catch (error: any) {
    console.error('Purchase verification error:', error);
    
    // エラーの種類に応じたレスポンス
    if (error.message === 'Invalid receipt') {
      return NextResponse.json(
        { error: 'Invalid receipt' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}