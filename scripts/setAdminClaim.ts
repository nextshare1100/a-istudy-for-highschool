// scripts/setAdminClaim.ts
import * as dotenv from 'dotenv';
import { getAdminAuth, getAdminFirestore } from '../lib/firebase-admin';

// 環境変数を読み込む
dotenv.config({ path: '.env.local' });

async function setAdminClaim(email: string) {
  try {
    const auth = getAdminAuth();
    const db = getAdminFirestore();
    
    // メールアドレスからユーザーを取得
    const user = await auth.getUserByEmail(email);
    
    // 管理者権限を設定
    await auth.setCustomUserClaims(user.uid, {
      admin: true
    });
    
    // Firestoreのユーザードキュメントも更新
    await db.collection('users').doc(user.uid).update({
      role: 'admin',
      updatedAt: new Date().toISOString()
    });
    
    console.log(`✅ Successfully set admin claim for user: ${email} (${user.uid})`);
  } catch (error) {
    console.error('❌ Error setting admin claim:', error);
    process.exit(1);
  }
}

// コマンドライン引数からメールアドレスを取得
const email = process.argv[2];
if (!email) {
  console.error('Usage: npm run set-admin <email>');
  process.exit(1);
}

setAdminClaim(email).then(() => process.exit(0));