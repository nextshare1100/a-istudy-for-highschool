import { NextRequest, NextResponse } from 'next/server';
import { stripe } from "@/lib/stripe/server"
import { campaignService } from '@/lib/services/campaign-service';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  
  try {
    const event = stripe.webhooks.constructEvent(
      await req.text(),
      sig,
      webhookSecret
    );
    
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // キャンペーンコード利用の場合
        if (session.metadata?.campaignCode) {
          const userId = session.metadata.userId;
          const campaignCode = session.metadata.campaignCode;
          
          // ユーザー情報を更新
          await updateDoc(doc(db, 'users', userId), {
            appliedCampaignCode: campaignCode,
            subscriptionStatus: 'active'
          });
          
          // キャンペーン使用を記録
          await campaignService.recordUserCampaignUsage(userId, campaignCode);
          
          // 使用回数をインクリメント
          const validation = await campaignService.validateCode(campaignCode);
          if (validation.campaign?.id) {
            await campaignService.incrementUsageCount(validation.campaign.id);
          }
        }
        break;
        
      case 'subscription.deleted':
        // 学校移行によるキャンセルの場合
        const subscription = event.data.object;
        if (subscription.cancellation_details?.comment === 'school_migration') {
          // 返金処理の完了を記録
          console.log('School migration cancellation processed:', subscription.id);
        }
        break;
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}