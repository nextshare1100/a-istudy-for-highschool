import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  query,
  where,
  updateDoc,
  increment,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { stripe } from '@/lib/stripe/client';
import type { CampaignCode } from '@/types/subscription';

export const campaignService = {
  // キャンペーンコードの検証
  async validateCode(code: string): Promise<{
    isValid: boolean;
    campaign?: CampaignCode;
    error?: string;
  }> {
    try {
      const campaignsRef = collection(db, 'campaignCodes');
      const q = query(campaignsRef, where('code', '==', code.toUpperCase()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { isValid: false, error: 'キャンペーンコードが見つかりません' };
      }
      
      const campaignDoc = snapshot.docs[0];
      const campaignData = {
        id: campaignDoc.id,
        ...campaignDoc.data()
      } as CampaignCode;
      
      // 有効期限チェック
      const now = new Date();
      if (campaignData.validUntil && new Date(campaignData.validUntil) < now) {
        return { isValid: false, error: 'キャンペーンコードの有効期限が切れています' };
      }
      
      // 使用回数チェック
      if (campaignData.usageLimit && campaignData.usedCount >= campaignData.usageLimit) {
        return { isValid: false, error: 'キャンペーンコードの使用上限に達しています' };
      }
      
      return { isValid: true, campaign: campaignData };
    } catch (error) {
      console.error('Campaign validation error:', error);
      return { isValid: false, error: 'エラーが発生しました' };
    }
  },

  // 使用回数のインクリメント
  async incrementUsageCount(campaignId: string): Promise<void> {
    const campaignRef = doc(db, 'campaignCodes', campaignId);
    await updateDoc(campaignRef, {
      usedCount: increment(1),
      updatedAt: serverTimestamp()
    });
  },

  // ユーザーのキャンペーン使用記録
  async recordUserCampaignUsage(userId: string, code: string): Promise<void> {
    await setDoc(doc(db, 'users', userId, 'campaignUsage', code), {
      code: code.toUpperCase(),
      usedAt: serverTimestamp()
    });
  },

  // Stripeチェックアウトセッション作成（完全無料）
  async createFreeCheckoutSession(
    userId: string,
    userEmail: string,
    priceId: string,
    campaign: CampaignCode
  ) {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      discounts: [{
        coupon: campaign.stripeCouponId // 100% OFFクーポン
      }],
      subscription_data: {
        trial_period_days: 0, // トライアルではなくクーポン適用
        metadata: {
          userId,
          campaignCode: campaign.code
        }
      },
      customer_email: userEmail,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        userId,
        campaignCode: campaign.code
      }
    });
    
    return session;
  }
};