import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, FieldValue } from '@/lib/firebase-admin';

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
    const { corporateId } = body;

    if (!corporateId) {
      return NextResponse.json(
        { error: 'corporateId is required' }, 
        { status: 400 }
      );
    }

    // トランザクションで処理
    const result = await db.runTransaction(async (transaction) => {
      // 法人契約を取得
      const contractRef = db.collection('corporate_contracts').doc(corporateId);
      const contractDoc = await transaction.get(contractRef);

      if (!contractDoc.exists) {
        throw new Error('Contract not found');
      }

      const contractData = contractDoc.data()!;

      // 再度契約の有効性をチェック
      if (contractData.status !== 'active') {
        throw new Error('Contract is not active');
      }

      const contractEndDate = new Date(contractData.contractEndDate);
      if (contractEndDate < new Date()) {
        throw new Error('Contract has expired');
      }

      if (contractData.currentUsers >= contractData.maxUsers) {
        throw new Error('Maximum users reached');
      }

      // ユーザー情報を取得
      const userRef = db.collection('users').doc(userId);
      const userDoc = await transaction.get(userRef);
      const userData = userDoc.data() || {};

      // 法人契約ユーザーとして登録
      const corporateUserRef = db.collection('corporate_users').doc(userId);
      transaction.set(corporateUserRef, {
        userId,
        corporateId,
        companyName: contractData.companyName,
        activatedAt: new Date().toISOString(),
        previousSubscriptionStatus: userData.subscriptionStatus || 'free'
      });

      // ユーザーのサブスクリプションステータスを更新
      transaction.update(userRef, {
        subscriptionStatus: 'corporate',
        corporateId,
        corporateCompanyName: contractData.companyName,
        corporateActivatedAt: new Date().toISOString(),
        updatedAt: FieldValue.serverTimestamp()
      });

      // 法人契約の利用者数を増やす
      transaction.update(contractRef, {
        currentUsers: FieldValue.increment(1),
        updatedAt: new Date().toISOString()
      });

      return {
        success: true,
        corporateId,
        companyName: contractData.companyName,
        contractEndDate: contractData.contractEndDate
      };
    });

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      message: '法人契約の登録が完了しました',
      contract: result
    });

  } catch (error) {
    console.error('Error activating corporate contract:', error);
    
    // エラーメッセージのマッピング
    let errorMessage = 'Internal server error';
    let statusCode = 500;

    if (error instanceof Error) {
      switch (error.message) {
        case 'Contract not found':
          errorMessage = '法人契約が見つかりません';
          statusCode = 404;
          break;
        case 'Contract is not active':
          errorMessage = 'この法人契約は無効です';
          statusCode = 400;
          break;
        case 'Contract has expired':
          errorMessage = 'この法人契約は期限切れです';
          statusCode = 400;
          break;
        case 'Maximum users reached':
          errorMessage = '利用者数が上限に達しています';
          statusCode = 400;
          break;
        default:
          errorMessage = error.message;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: statusCode }
    );
  }
}