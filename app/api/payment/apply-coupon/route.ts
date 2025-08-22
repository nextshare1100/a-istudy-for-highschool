import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, FieldValue } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  console.log('=== Apply Coupon API Called ===');
  
  try {
    // 認証トークンの検証
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const auth = getAdminAuth();
    
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { error: '無効な認証トークンです' },
        { status: 401 }
      );
    }
    
    const userId = decodedToken.uid;
    const { couponCode, platform } = await request.json();
    
    if (!couponCode || !platform) {
      return NextResponse.json(
        { error: 'クーポンコードとプラットフォームが必要です' },
        { status: 400 }
      );
    }
    
    if (!['ios', 'android'].includes(platform)) {
      return NextResponse.json(
        { error: '無効なプラットフォームです' },
        { status: 400 }
      );
    }
    
    const db = getAdminFirestore();
    const normalizedCode = couponCode.trim().toUpperCase();
    
    // ユーザー情報を取得
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    
    if (!userData) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }
    
    // 既にクーポンを使用している場合はエラー
    if (userData.appCouponCode) {
      return NextResponse.json(
        { error: '既にクーポンコードが適用されています' },
        { status: 400 }
      );
    }
    
    // クーポンコードの検証
    const couponRef = db.collection('appCoupons').doc(normalizedCode);
    const couponDoc = await couponRef.get();
    
    if (!couponDoc.exists) {
      return NextResponse.json(
        { error: '無効なクーポンコードです' },
        { status: 400 }
      );
    }
    
    const couponData = couponDoc.data()!;
    
    // クーポンの有効性チェック
    if (!couponData.isActive) {
      return NextResponse.json(
        { error: 'このクーポンコードは無効です' },
        { status: 400 }
      );
    }
    
    // プラットフォームチェック
    if (!couponData.platforms.includes('all') && !couponData.platforms.includes(platform)) {
      return NextResponse.json(
        { error: `このクーポンコードは${platform}では使用できません` },
        { status: 400 }
      );
    }
    
    // 有効期限チェック
    const now = new Date();
    if (couponData.validFrom && new Date(couponData.validFrom.toDate()) > now) {
      return NextResponse.json(
        { error: 'このクーポンコードはまだ有効になっていません' },
        { status: 400 }
      );
    }
    
    if (couponData.validUntil && new Date(couponData.validUntil.toDate()) < now) {
      return NextResponse.json(
        { error: 'このクーポンコードの有効期限が切れています' },
        { status: 400 }
      );
    }
    
    // 使用回数チェック
    if (couponData.maxUses > 0 && couponData.usedCount >= couponData.maxUses) {
      return NextResponse.json(
        { error: 'このクーポンコードの使用上限に達しています' },
        { status: 400 }
      );
    }
    
    // 同一ユーザーの重複使用チェック
    const usageQuery = await db.collection('couponUsage')
      .where('userId', '==', userId)
      .where('couponCode', '==', normalizedCode)
      .limit(1)
      .get();
    
    if (!usageQuery.empty) {
      return NextResponse.json(
        { error: 'このクーポンコードは既に使用されています' },
        { status: 400 }
      );
    }
    
    // トランザクションでクーポンを適用
    await db.runTransaction(async (transaction) => {
      // クーポン使用回数を増やす
      transaction.update(couponRef, {
        usedCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp()
      });
      
      // ユーザー情報を更新
      const updateData: any = {
        appCouponCode: normalizedCode,
        appCouponAppliedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      
      // クーポンタイプに応じた処理
      let trialEndDate: Date | null = null;
      
      if (couponData.type === 'trial_30days') {
        // 30日間の無料トライアル
        trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 30);
        
        updateData.appTrialEndDate = trialEndDate;
        updateData.subscriptionStatus = 'trial';
      }
      // 他のクーポンタイプ（discount_50、discount_100）は
      // 実際の購入時に適用される
      
      transaction.update(userRef, updateData);
      
      // クーポン使用履歴を記録
      const usageRef = db.collection('couponUsage').doc();
      transaction.set(usageRef, {
        userId,
        couponCode: normalizedCode,
        platform,
        appliedAt: FieldValue.serverTimestamp(),
        metadata: {
          userEmail: userData.email,
          couponType: couponData.type
        }
      });
    });
    
    console.log(`Coupon ${normalizedCode} applied for user ${userId}`);
    
    // レスポンスデータ
    const responseData: any = {
      success: true,
      message: 'クーポンが適用されました',
      couponType: couponData.type
    };
    
    if (couponData.type === 'trial_30days') {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 30);
      responseData.trialEndDate = trialEndDate.toISOString();
    }
    
    return NextResponse.json(responseData);
    
  } catch (error: any) {
    console.error('Apply coupon error:', error);
    return NextResponse.json(
      { 
        error: 'クーポン適用中にエラーが発生しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// GET: クーポンコードの検証（適用前の確認用）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const couponCode = searchParams.get('code');
    const platform = searchParams.get('platform');
    
    if (!couponCode || !platform) {
      return NextResponse.json(
        { error: 'クーポンコードとプラットフォームが必要です' },
        { status: 400 }
      );
    }
    
    const db = getAdminFirestore();
    const normalizedCode = couponCode.trim().toUpperCase();
    
    // クーポンコードの検証
    const couponRef = db.collection('appCoupons').doc(normalizedCode);
    const couponDoc = await couponRef.get();
    
    if (!couponDoc.exists) {
      return NextResponse.json({
        isValid: false,
        error: '無効なクーポンコードです'
      });
    }
    
    const couponData = couponDoc.data()!;
    const now = new Date();
    
    // 各種チェック
    if (!couponData.isActive) {
      return NextResponse.json({
        isValid: false,
        error: 'このクーポンコードは無効です'
      });
    }
    
    if (!couponData.platforms.includes('all') && !couponData.platforms.includes(platform)) {
      return NextResponse.json({
        isValid: false,
        error: `このクーポンコードは${platform}では使用できません`
      });
    }
    
    if (couponData.validFrom && new Date(couponData.validFrom.toDate()) > now) {
      return NextResponse.json({
        isValid: false,
        error: 'このクーポンコードはまだ有効になっていません'
      });
    }
    
    if (couponData.validUntil && new Date(couponData.validUntil.toDate()) < now) {
      return NextResponse.json({
        isValid: false,
        error: 'このクーポンコードの有効期限が切れています'
      });
    }
    
    if (couponData.maxUses > 0 && couponData.usedCount >= couponData.maxUses) {
      return NextResponse.json({
        isValid: false,
        error: 'このクーポンコードの使用上限に達しています'
      });
    }
    
    // クーポンタイプごとの説明
    const typeDescriptions: Record<string, string> = {
      trial_30days: '30日間の無料トライアル',
      discount_50: '50%割引',
      discount_100: '初月無料'
    };
    
    return NextResponse.json({
      isValid: true,
      type: couponData.type,
      description: typeDescriptions[couponData.type] || ''
    });
    
  } catch (error: any) {
    console.error('Validate coupon error:', error);
    return NextResponse.json(
      { 
        isValid: false,
        error: 'クーポン検証中にエラーが発生しました'
      },
      { status: 500 }
    );
  }
}