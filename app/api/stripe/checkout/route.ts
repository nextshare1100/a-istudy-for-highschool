import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  console.log('=== Stripe Checkout API Called ===');
  
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    const { priceType, userId, campaignCode } = body;

    // 環境変数の確認
    console.log('Environment check:', {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      priceIdMonthly: process.env.STRIPE_PRICE_MONTHLY_ID,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    });

    if (!userId) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    // Firebase でユーザー情報を取得
    let firebaseUser;
    try {
      const auth = getAdminAuth();
      firebaseUser = await auth.getUser(userId);
      console.log('Firebase user found:', firebaseUser.email);
    } catch (error) {
      console.error('Firebase getUser error:', error);
      return NextResponse.json(
        { error: '無効なユーザーです' },
        { status: 401 }
      );
    }

    // Stripe 顧客を作成または取得
    let customerId: string;
    
    // 既存の顧客を検索
    console.log('Searching for existing Stripe customer...');
    const existingCustomers = await stripe.customers.list({
      email: firebaseUser.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      console.log('Existing customer found:', customerId);
    } else {
      // 新規顧客を作成（preferred_localesを追加）
      console.log('Creating new Stripe customer...');
      const customer = await stripe.customers.create({
        email: firebaseUser.email,
        metadata: {
          firebaseUserId: userId,
          displayName: firebaseUser.displayName || ''
        },
        preferred_locales: ['ja'], // 日本語を優先言語に設定
      });
      customerId = customer.id;
      console.log('New customer created:', customerId);
    }

    // 価格IDの取得（現在は月額プランのみ）
    const priceId = process.env.STRIPE_PRICE_MONTHLY_ID;
    
    if (!priceId) {
      console.error('Price ID is not defined!');
      return NextResponse.json(
        { error: '料金プランが設定されていません' },
        { status: 500 }
      );
    }
    
    console.log('Using price ID:', priceId);

    // 開発環境と本番環境でURLを切り替え
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : process.env.NEXT_PUBLIC_APP_URL;

    // チェックアウトセッションのパラメータ
    const sessionParams: any = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${baseUrl}/subscription/register?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription/register?canceled=true`,
      subscription_data: {
        metadata: {
          firebaseUserId: userId
        }
      },
      locale: 'ja', // 日本語を明示的に指定
      customer_update: {
        address: 'auto', // 住所の自動更新を許可
      },
      // 自動税金計算（オプション）
      automatic_tax: {
        enabled: false
      },
      // 請求先住所の収集
      billing_address_collection: 'required',
      // 電話番号の収集（オプション）
      phone_number_collection: {
        enabled: true
      },
      // 通貨を明示的に指定
      currency: 'jpy',
    };

    // キャンペーンコードの処理
    if (campaignCode && campaignCode.trim()) {
      const normalizedCode = campaignCode.trim().toUpperCase();
      console.log('Checking campaign code:', normalizedCode);
      
      // 特別なキャンペーンコード「AISTUDY2024」の場合
      if (normalizedCode === 'AISTUDY2024') {
        // 30日間の無料トライアルを設定
        sessionParams.subscription_data.trial_period_days = 30;
        sessionParams.subscription_data.metadata.campaignCode = normalizedCode;
        console.log('Applied 30-day trial for AISTUDY2024');
      } else {
        // その他のStripeクーポンコード
        try {
          const coupon = await stripe.coupons.retrieve(normalizedCode);
          console.log('Valid coupon found:', normalizedCode);
          
          sessionParams.discounts = [{
            coupon: normalizedCode
          }];
          
          sessionParams.subscription_data.metadata.campaignCode = normalizedCode;
        } catch (error) {
          console.error('Invalid coupon:', normalizedCode);
          return NextResponse.json(
            { error: '無効なキャンペーンコードです' },
            { status: 400 }
          );
        }
      }
    }

    // チェックアウトセッションを作成
    console.log('Creating checkout session with locale:', sessionParams.locale);
    const session = await stripe.checkout.sessions.create(sessionParams);
    console.log('Checkout session created:', session.id);
    console.log('Session URL:', session.url);

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
    
  } catch (error: any) {
    console.error('Create checkout session error:', error);
    console.error('Error details:', {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode
    });
    
    // エラーメッセージの日本語化
    let errorMessage = '決済処理中にエラーが発生しました';
    
    if (error.type === 'StripeInvalidRequestError') {
      if (error.message.includes('No such coupon')) {
        errorMessage = '無効なキャンペーンコードです';
      } else if (error.message.includes('Customer')) {
        errorMessage = 'お客様情報の処理でエラーが発生しました';
      } else if (error.message.includes('price')) {
        errorMessage = '料金プランの設定にエラーがあります';
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        details: process.env.NODE_ENV === 'development' ? error.message : undefined 
      },
      { status: error.statusCode || 500 }
    );
  }
}