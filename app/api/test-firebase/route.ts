// app/api/test-firebase/route.ts
import { NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export async function GET() {
  console.log('=== Firebase Admin SDK Test ===');
  
  try {
    // 環境変数の確認
    console.log('Environment check:', {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    
    // テストドキュメントを作成
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: 'Firebase Admin SDK test',
      createdBy: 'test-endpoint'
    };
    
    console.log('Attempting to write document...');
    
    await adminFirestore
      .collection('subscriptions')
      .doc('admin_test')
      .set(testDoc);
    
    console.log('Document created successfully');
    
    // 書き込んだデータを読み取って確認
    const savedDoc = await adminFirestore
      .collection('subscriptions')
      .doc('admin_test')
      .get();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Document created successfully',
      data: savedDoc.data(),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    
  } catch (error: any) {
    console.error('Firebase Admin SDK Error:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      code: error.code,
      details: error.toString()
    }, { status: 500 });
  }
}