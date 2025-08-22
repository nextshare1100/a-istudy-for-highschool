// scripts/create-app-coupons.js
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function createAppCoupons() {
  const coupons = [
    {
      code: 'A-ISTUDY1MONTH',
      type: 'trial_30days',
      validFrom: new Date(),
      validUntil: new Date('2025-12-31'),
      maxUses: 1000100, // 100万100回に変更（テスト用）
      usedCount: 0,
      platforms: ['ios', 'android'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  for (const coupon of coupons) {
    await db.collection('appCoupons').doc(coupon.code).set(coupon);
    console.log(`Created coupon: ${coupon.code} (max uses: ${coupon.maxUses.toLocaleString()})`);
  }
  
  console.log('All coupons created successfully!');
  process.exit(0);
}

createAppCoupons().catch(error => {
  console.error('Error creating coupons:', error);
  process.exit(1);
});