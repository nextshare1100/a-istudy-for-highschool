// app/api/subscription/create-checkout-session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { auth } from '@/lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

// キャンペーンコード設定
const CAMPAIGN_CODES: Record<string, string> = {
  'LAUNCH2024': 'coupon_campaign_launch2024',
  'STUDENT50': 'coupon_campaign_student50',
  'FIRST_MONTH_FREE': 'coupon_campaign_first_month'
};

export async function POST(req: NextRequest) {
  try {
    const { 
      userId, 
      priceId, 
      campaignCode,
      successUrl, 
      cancelUrl 
    } = await req.json();

    // ユーザー認証確認
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      );
    }

    // Firebaseでユーザー情報を取得
    const firebaseUser = await getAuth().getUser(userId);
    
    // Stripeカスタマーを作成または取得
    let customerId: string;
    
    // 既存のカスタマーを検索
    const existingCustomers = await stripe.customers.list({
      email: firebaseUser.email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      // 新規カスタマーを作成
      const customer = await stripe.customers.create({
        email: firebaseUser.email,
        metadata: {
          firebaseUserId: userId,
          displayName: firebaseUser.displayName || ''
        }
      });
      customerId = customer.id;
    }

    // チェックアウトセッションのパラメータ
    const sessionParams: any = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId || process.env.STRIPE_PRICE_ID,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          firebaseUserId: userId
        }
      },
      locale: 'ja'
    };

    // キャンペーンコードが指定されている場合
    if (campaignCode && CAMPAIGN_CODES[campaignCode.toUpperCase()]) {
      const couponId = CAMPAIGN_CODES[campaignCode.toUpperCase()];
      
      // クーポンの存在確認
      try {
        await stripe.coupons.retrieve(couponId);
        sessionParams.subscription_data.coupon = couponId;
      } catch (error) {
        console.error('Invalid coupon:', couponId);
        return NextResponse.json(
          { error: 'Invalid campaign code' },
          { status: 400 }
        );
      }
    }

    // チェックアウトセッションを作成
    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    });
    
  } catch (error: any) {
    console.error('Create checkout session error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}