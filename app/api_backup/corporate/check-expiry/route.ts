import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

export async function GET(request: Request) {
  try {
    // Cron jobのシークレットトークンを確認（Vercel Cron用）
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getAdminFirestore();
    const now = new Date();

    // 期限切れの契約を取得
    const contractsSnapshot = await db.collection('corporate_contracts')
      .where('status', '==', 'active')
      .where('contractEndDate', '<=', now.toISOString())
      .get();

    let expiredCount = 0;
    const batch = db.batch();

    for (const doc of contractsSnapshot.docs) {
      // 契約を期限切れに更新
      batch.update(doc.ref, {
        status: 'expired',
        updatedAt: now.toISOString()
      });
      expiredCount++;
    }

    if (expiredCount > 0) {
      await batch.commit();

      // 期限切れになった契約に紐づくユーザーのステータスを更新
      const corporateUsersSnapshot = await db.collection('corporate_users')
        .where('corporateId', 'in', contractsSnapshot.docs.map(doc => doc.id))
        .get();

      const userBatch = db.batch();
      
      for (const userDoc of corporateUsersSnapshot.docs) {
        const userData = userDoc.data();
        const userRef = db.collection('users').doc(userData.userId);
        
        // ユーザーのサブスクリプションステータスを元に戻す
        userBatch.update(userRef, {
          subscriptionStatus: userData.previousSubscriptionStatus || 'free',
          corporateId: null,
          corporateCompanyName: null,
          corporateExpiredAt: now.toISOString()
        });
      }

      await userBatch.commit();
    }

    return NextResponse.json({
      success: true,
      expiredContracts: expiredCount,
      checkedAt: now.toISOString()
    });

  } catch (error) {
    console.error('Error checking corporate contract expiry:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}