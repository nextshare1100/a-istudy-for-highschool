// scripts/fixUserProfile.ts
import * as dotenv from 'dotenv';
import { getAdminFirestore } from '../lib/firebase-admin';

// 環境変数を読み込む
dotenv.config({ path: '.env.local' });

async function fixUserProfile(uid: string) {
  try {
    const db = getAdminFirestore();
    
    // ユーザードキュメントを取得
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      console.log('User not found');
      return;
    }
    
    const userData = userDoc.data();
    console.log('Current user data:', userData);
    
    // メールアドレスが配列形式で保存されている場合、文字列に変換
    let email = userData?.email;
    if (typeof email === 'object' && !Array.isArray(email)) {
      // オブジェクト形式の場合、文字列に変換
      email = Object.values(email).join('');
    }
    
    // 正しい形式でユーザーデータを更新
    const updatedData = {
      uid: uid,
      email: email || userData?.['0'] ? Object.values(userData).filter((v, i) => i <= 24).join('') : '',
      createdAt: userData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      studyStats: userData?.studyStats || {},
      subscriptionStatus: userData?.subscriptionStatus || 'free',
      role: userData?.role || 'user'
    };
    
    // データを更新
    await db.collection('users').doc(uid).set(updatedData, { merge: true });
    
    console.log('✅ User profile fixed:', updatedData);
    
  } catch (error) {
    console.error('❌ Error fixing user profile:', error);
    process.exit(1);
  }
}

// コマンドライン引数からUIDを取得
const uid = process.argv[2];
if (!uid) {
  console.error('Usage: npm run fix-profile <uid>');
  console.error('Example: npm run fix-profile Yxjrs1tvgKhY5hHUf7Lqh2ZCIH62');
  process.exit(1);
}

fixUserProfile(uid).then(() => process.exit(0));