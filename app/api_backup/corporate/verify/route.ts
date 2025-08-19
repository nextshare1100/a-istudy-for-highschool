import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const adminAuth = getAdminAuth();
    const db = getAdminFirestore();
    
    // 認証チェック
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // リクエストボディの取得
    const body = await request.json();
    const { qrCode, corporateId } = body;

    // バリデーション
    if (!qrCode && !corporateId) {
      return NextResponse.json(
        { error: 'Either qrCode or corporateId is required' }, 
        { status: 400 }
      );
    }

    // 既に法人契約を利用しているかチェック
    const corporateUserDoc = await db.collection('corporate_users').doc(userId).get();
    if (corporateUserDoc.exists) {
      const existingData = corporateUserDoc.data();
      return NextResponse.json({
        error: 'Already registered',
        message: 'このアカウントは既に法人契約を利用しています',
        corporateId: existingData?.corporateId
      }, { status: 400 });
    }

    // 法人契約を検索
    let contractDoc;
    
    if (qrCode) {
      // QRコードで検索
      const contractsSnapshot = await db.collection('corporate_contracts')
        .where('qrCode', '==', qrCode)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (contractsSnapshot.empty) {
        return NextResponse.json({
          error: 'Invalid code',
          message: 'QRコードが無効です'
        }, { status: 404 });
      }

      contractDoc = contractsSnapshot.docs[0];
    } else if (corporateId) {
      // 法人IDで検索
      contractDoc = await db.collection('corporate_contracts').doc(corporateId).get();

      if (!contractDoc.exists) {
        return NextResponse.json({
          error: 'Invalid code',
          message: '法人IDが無効です'
        }, { status: 404 });
      }
    }

    const contractData = contractDoc!.data()!;

    // 契約の有効性チェック
    if (contractData.status !== 'active') {
      return NextResponse.json({
        error: 'Contract inactive',
        message: 'この法人契約は現在無効です'
      }, { status: 400 });
    }

    // 契約期限チェック
    const contractEndDate = new Date(contractData.contractEndDate);
    if (contractEndDate < new Date()) {
      // 契約を期限切れに更新
      await contractDoc!.ref.update({
        status: 'expired',
        updatedAt: new Date().toISOString()
      });

      return NextResponse.json({
        error: 'Contract expired',
        message: 'この法人契約は期限切れです'
      }, { status: 400 });
    }

    // 利用者数チェック
    if (contractData.currentUsers >= contractData.maxUsers) {
      return NextResponse.json({
        error: 'Max users reached',
        message: '利用者数が上限に達しています'
      }, { status: 400 });
    }

    // ユーザー情報を取得
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // レスポンス（確認画面用の情報）
    return NextResponse.json({
      success: true,
      contract: {
        corporateId: contractData.corporateId,
        companyName: contractData.companyName,
        contractEndDate: contractData.contractEndDate,
        remainingSlots: contractData.maxUsers - contractData.currentUsers
      },
      user: {
        email: userData?.email || decodedToken.email,
        currentSubscriptionStatus: userData?.subscriptionStatus || 'free'
      }
    });

  } catch (error) {
    console.error('Error verifying corporate contract:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}