// scripts/checkContracts.ts
import * as dotenv from 'dotenv';
import { getAdminFirestore } from '../lib/firebase-admin';

// 環境変数を読み込む
dotenv.config({ path: '.env.local' });

async function checkContracts() {
  try {
    const db = getAdminFirestore();
    
    console.log('🔍 Checking corporate contracts...\n');
    
    // すべての法人契約を取得
    const contractsSnapshot = await db.collection('corporate_contracts').get();
    
    if (contractsSnapshot.empty) {
      console.log('No corporate contracts found.');
      return;
    }
    
    console.log(`Found ${contractsSnapshot.size} contracts:\n`);
    
    for (const doc of contractsSnapshot.docs) {
      const data = doc.data();
      const endDate = new Date(data.contractEndDate);
      const now = new Date();
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`📋 Contract: ${data.corporateId}`);
      console.log(`   Company: ${data.companyName}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Users: ${data.currentUsers}/${data.maxUsers}`);
      console.log(`   End Date: ${endDate.toLocaleDateString()}`);
      console.log(`   Days Remaining: ${daysRemaining > 0 ? daysRemaining : 'EXPIRED'}`);
      console.log('');
    }
    
    // 法人契約ユーザーの統計
    const corporateUsersSnapshot = await db.collection('corporate_users').get();
    console.log(`\n👥 Total corporate users: ${corporateUsersSnapshot.size}`);
    
  } catch (error) {
    console.error('❌ Error checking contracts:', error);
    process.exit(1);
  }
}

checkContracts().then(() => process.exit(0));