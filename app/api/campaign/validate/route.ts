import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const { userId, campaignCode } = await req.json();
    
    if (!userId || !campaignCode) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています' },
        { status: 400 }
      );
    }
    
    const normalizedCode = campaignCode.trim().toUpperCase();
    
    // AISTUDYTRIALの場合のみ重複チェック
    if (normalizedCode === 'AISTUDYTRIAL') {
      // キャンペーン使用履歴をチェック
      const usageDoc = await adminFirestore
        .collection('campaignUsage')
        .doc(`${userId}_AISTUDYTRIAL`)
        .get();
      
      if (usageDoc.exists) {
        return NextResponse.json({
          valid: false,
          error: 'このキャンペーンコードは既に使用されています',
          alreadyUsed: true
        });
      }
      
      // ユーザードキュメントでも確認（念のため）
      const userDoc = await adminFirestore
        .collection('users')
        .doc(userId)
        .get();
      
      const userData = userDoc.data();
      if (userData?.usedCampaigns?.includes('AISTUDYTRIAL')) {
        return NextResponse.json({
          valid: false,
          error: 'このキャンペーンコードは既に使用されています',
          alreadyUsed: true
        });
      }
      
      return NextResponse.json({
        valid: true,
        message: '初月無料キャンペーンが適用されます'
      });
    }
    
    // その他のキャンペーンコードはStripeで検証
    return NextResponse.json({
      valid: true,
      message: 'キャンペーンコードが適用されます'
    });
    
  } catch (error) {
    console.error('Campaign validation error:', error);
    return NextResponse.json(
      { error: 'キャンペーンコードの検証中にエラーが発生しました' },
      { status: 500 }
    );
  }
}