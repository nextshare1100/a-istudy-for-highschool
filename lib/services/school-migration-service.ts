import { 
  collection, 
  doc, 
  getDocs,
  query,
  where,
  updateDoc,
  addDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { stripe } from '@/lib/stripe/client';
import type { SchoolContract, MigrationNotification } from '@/types/subscription';

export class SchoolMigrationService {
  // 学校契約時に既存ユーザーを検出
  async detectExistingUsers(emailDomains: string[]): Promise<string[]> {
    const existingUserIds: string[] = [];
    
    for (const domain of emailDomains) {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('email', '>=', '@' + domain),
        where('email', '<=', '@' + domain + '\uf8ff')
      );
      
      const snapshot = await getDocs(q);
      existingUserIds.push(...snapshot.docs.map(doc => doc.id));
    }
    
    return existingUserIds;
  }
  
  // ユーザーへの移行通知を作成
  async notifyUserForMigration(
    userId: string, 
    schoolName: string,
    schoolId: string
  ): Promise<void> {
    const notification: Omit<MigrationNotification, 'id'> = {
      userId,
      type: 'school_contract_available',
      title: `${schoolName}がA-IStudyと契約しました`,
      message: '無料で全機能が利用できるようになります。学習データはすべて引き継がれます。',
      schoolName,
      schoolId,
      actions: [
        { label: '学校アカウントに移行', action: 'migrate' },
        { label: '個人プランを継続', action: 'keep' }
      ],
      read: false,
      createdAt: new Date()
    };
    
    await addDoc(collection(db, 'notifications'), notification);
    
    // TODO: プッシュ通知やメール通知の実装
  }
  
  // 実際の移行処理
  async migrateToSchoolAccount(
    userId: string, 
    schoolId: string
  ): Promise<{ success: boolean; refundAmount?: number }> {
    try {
      const batch = writeBatch(db);
      
      // 1. ユーザー情報更新
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        schoolId,
        accountStatus: 'school',
        previousAccountStatus: 'personal',
        migratedAt: serverTimestamp()
      });
      
      // 2. 既存のサブスクリプション情報を取得
      const subsRef = collection(db, 'subscriptions');
      const subsQuery = query(
        subsRef,
        where('userId', '==', userId),
        where('status', 'in', ['active', 'trialing'])
      );
      const subsSnapshot = await getDocs(subsQuery);
      
      let refundAmount = 0;
      
      if (!subsSnapshot.empty) {
        const subscription = subsSnapshot.docs[0].data();
        
        // Stripeサブスクリプションをキャンセル（日割り返金付き）
        if (subscription.stripeSubscriptionId) {
          const canceledSub = await stripe.subscriptions.del(
            subscription.stripeSubscriptionId,
            {
              prorate: true, // 日割り返金
              invoice_now: true
            }
          );
          
          // 返金額を計算（実際の返金額はStripeのWebhookで確定）
          refundAmount = canceledSub.latest_invoice?.amount_remaining || 0;
        }
        
        // サブスクリプションドキュメントを更新
        batch.update(doc(db, 'subscriptions', subsSnapshot.docs[0].id), {
          status: 'canceled',
          canceledAt: serverTimestamp(),
          cancelReason: 'school_migration'
        });
      }
      
      await batch.commit();
      
      return { success: true, refundAmount };
    } catch (error) {
      console.error('Migration error:', error);
      return { success: false };
    }
  }
  
  // 個人プラン継続を選択した場合の記録
  async recordKeepPersonalPlan(userId: string, schoolId: string): Promise<void> {
    await updateDoc(doc(db, 'users', userId), {
      declinedSchoolMigration: true,
      declinedSchoolId: schoolId,
      declinedAt: serverTimestamp()
    });
  }
}