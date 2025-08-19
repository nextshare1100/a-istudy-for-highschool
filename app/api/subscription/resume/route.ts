import { NextRequest, NextResponse } from 'next/server';
import { stripe } from "@/lib/stripe/server"
import { verifyIdToken, getAdminFirestore } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split('Bearer ')[1];
    
    let userId: string;
    try {
      const decodedToken = await verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    
    // Admin Firestoreを使用
    const adminDb = getAdminFirestore();
    
    // ユーザーのサブスクリプション情報を取得
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (!userData?.subscriptionId) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 400 }
      );
    }
    
    // Stripeでサブスクリプションのキャンセルを取り消し
    const subscription = await stripe.subscriptions.update(
      userData.subscriptionId,
      {
        cancel_at_period_end: false
      }
    );
    
    // Firestoreを更新（バッチ処理）
    const batch = adminDb.batch();
    
    // ユーザードキュメントを更新
    batch.update(adminDb.collection('users').doc(userId), {
      cancelAtPeriodEnd: false,
      canceledAt: null,
      updatedAt: new Date()
    });
    
    // サブスクリプションドキュメントを更新
    const subsRef = adminDb.collection('subscriptions').doc(userId);
    const subsDoc = await subsRef.get();
    
    if (subsDoc.exists) {
      batch.update(subsRef, {
        cancelAtPeriodEnd: false,
        canceledAt: null,
        updatedAt: new Date()
      });
    }
    
    await batch.commit();
    
    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });
  } catch (error) {
    console.error('Subscription resume error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to resume subscription' },
      { status: 500 }
    );
  }
}