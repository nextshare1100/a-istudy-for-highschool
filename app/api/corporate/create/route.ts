import { NextResponse } from 'next/server';
import { adminAuth, db } from '@/lib/firebase-admin';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';

// 法人IDの生成
function generateCorporateId(): string {
  const part1 = nanoid(4).toUpperCase();
  const part2 = nanoid(4).toUpperCase();
  const part3 = nanoid(4).toUpperCase();
  const part4 = nanoid(4).toUpperCase();
  return `CORP-${part1}-${part2}-${part3}-${part4}`;
}

export async function POST(request: Request) {
  try {
    // 認証チェック（管理者権限が必要）
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // 管理者権限チェック（カスタムクレームで管理）
    const user = await adminAuth.getUser(decodedToken.uid);
    if (!user.customClaims?.admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // リクエストボディの取得
    const body = await request.json();
    const { 
      companyName, 
      maxUsers, 
      contractEndDate,
      contactEmail,
      notes 
    } = body;

    // バリデーション
    if (!companyName || !maxUsers || !contractEndDate) {
      return NextResponse.json(
        { error: 'Missing required fields: companyName, maxUsers, contractEndDate' }, 
        { status: 400 }
      );
    }

    if (typeof maxUsers !== 'number' || maxUsers < 1) {
      return NextResponse.json(
        { error: 'maxUsers must be a positive number' }, 
        { status: 400 }
      );
    }

    // 日付の検証
    const endDate = new Date(contractEndDate);
    if (isNaN(endDate.getTime()) || endDate <= new Date()) {
      return NextResponse.json(
        { error: 'contractEndDate must be a valid future date' }, 
        { status: 400 }
      );
    }

    // 法人契約データの作成
    const corporateId = generateCorporateId();
    const qrCodeId = nanoid(32); // QRコード用のUUID
    const contractData = {
      corporateId,
      qrCode: qrCodeId,
      companyName,
      maxUsers,
      currentUsers: 0,
      contractEndDate: endDate.toISOString(),
      status: 'active' as const,
      contactEmail: contactEmail || null,
      notes: notes || null,
      createdAt: new Date().toISOString(),
      createdBy: decodedToken.uid,
      updatedAt: new Date().toISOString()
    };

    // Firestoreに保存
    await db.collection('corporate_contracts').doc(corporateId).set(contractData);

    // QRコードの生成
    const qrCodeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/corporate?qr=${qrCodeId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // レスポンス
    return NextResponse.json({
      success: true,
      contract: {
        corporateId,
        qrCode: qrCodeId,
        companyName,
        maxUsers,
        currentUsers: 0,
        contractEndDate: endDate.toISOString(),
        status: 'active',
        qrCodeDataUrl,
        qrCodeUrl
      }
    });

  } catch (error) {
    console.error('Error creating corporate contract:', error);
    
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