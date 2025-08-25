import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  console.log('=== Stripe Checkout API Called ===');
  
  try {
    // Stripeの初期化を関数内で行う（エラー回避のため）
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY is missing');
      return NextResponse.json(
        { error: 'Stripe設定エラー' },
        { status: 500 }
      );
    }
    
    const Stripe = require('stripe');
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { priceType, userId, campaignCode } = body;

    // 環境変数の確認
    console.log('Environment check:', {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      priceIdMonthly: process.env.STRIPE_PRICE_MONTHLY_ID,
      priceIdSetupFee: process.env.STRIPE_PRICE_SETUP_FEE_ID,
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
      console.log('Admin Auth initialized successfully');
      firebaseUser = await auth.getUser(userId);
      console.log('Firebase user found:', firebaseUser.email);
    } catch (error: any) {
      console.error('Firebase getUser error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        userId: userId
      });
      console.error('Firebase Admin SDK initialization status:', {
        projectId: process.env.FIREBASE_PROJECT_ID,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY
      });
      
      // より具体的なエラーメッセージ
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: 'ユーザーが見つかりません。再度ログインしてください。' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: 'ユーザー認証に失敗しました。再度ログインしてください。' },
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

    // 価格IDの取得
    const monthlyPriceId = process.env.STRIPE_PRICE_MONTHLY_ID;
    const setupFeePriceId = process.env.STRIPE_PRICE_SETUP_FEE_ID;
    
    if (!monthlyPriceId || !setupFeePriceId) {
      console.error('Price IDs are not defined!');
      console.error('monthlyPriceId:', monthlyPriceId);
      console.error('setupFeePriceId:', setupFeePriceId);
      return NextResponse.json(
        { error: '料金プランが設定されていません' },
        { status: 500 }
      );
    }
    
    console.log('Using price IDs:', { monthlyPriceId, setupFeePriceId });

    // 本番URLに固定
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://a-istudy-highschool.vercel.app';

    console.log('Using base URL for redirect:', baseUrl);

    // 基本的なラインアイテム（月額プラン）
    const lineItems = [{
      price: monthlyPriceId,
      quantity: 1,
    }];

    // キャンペーンコードの処理
    let isTrialApplied = false;
    
    if (campaignCode && campaignCode.trim()) {
      const normalizedCode = campaignCode.trim().toUpperCase();
      console.log('Checking campaign code:', normalizedCode);
      
      // 特別なキャンペーンコード「AISTUDYTRIAL」の場合
      if (normalizedCode === 'AISTUDYTRIAL') {
        isTrialApplied = true;
        console.log('Applied 30-day trial for AISTUDYTRIAL');
      } else if (normalizedCode === 'AISTUDY2024') {
        isTrialApplied = true;
        console.log('Applied 30-day trial for AISTUDY2024');
      } else {
        // その他のStripeクーポンコード
        try {
          const coupon = await stripe.coupons.retrieve(normalizedCode);
          console.log('Valid coupon found:', normalizedCode);
        } catch (error) {
          console.error('Invalid coupon:', normalizedCode);
          return NextResponse.json(
            { error: '無効なキャンペーンコードです' },
            { status: 400 }
          );
        }
      }
    }

    // トライアルが適用されていない場合のみ、初回登録料を追加
    if (!isTrialApplied) {
      lineItems.push({
        price: setupFeePriceId,
        quantity: 1,
      });
      console.log('Added setup fee to line items');
    }

    // チェックアウトセッションのパラメータ（修正版）
    const sessionParams: any = {
      customer: customerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'subscription',
      success_url: `${baseUrl}/subscription/register?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription/register?canceled=true`,
      locale: 'ja',
      currency: 'jpy',
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true
      },
      allow_promotion_codes: true,
      // 重要: セッションレベルのメタデータを追加
      metadata: {
        firebaseUserId: userId
      }
    };

    // トライアルが適用されている場合
    if (isTrialApplied && campaignCode) {
      sessionParams.subscription_data = {
        trial_period_days: 30,
        metadata: {
          firebaseUserId: userId
        }
      };
      
      // キャンペーンコードがStripeのクーポンの場合
      if (campaignCode.trim().toUpperCase() !== 'AISTUDYTRIAL' && 
          campaignCode.trim().toUpperCase() !== 'AISTUDY2024') {
        sessionParams.discounts = [{
          coupon: campaignCode.trim().toUpperCase()
        }];
      }
    } else {
      // トライアルなしの場合
      sessionParams.subscription_data = {
        metadata: {
          firebaseUserId: userId
        }
      };
    }

    // チェックアウトセッションを作成
    console.log('Creating checkout session with params:', {
      ...sessionParams,
      line_items: lineItems.map(item => ({
        price: item.price,
        quantity: item.quantity
      }))
    });
    
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
      statusCode: error.statusCode,
      stack: error.stack
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