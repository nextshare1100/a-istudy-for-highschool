// 環境変数の検証
export const validateFirebaseConfig = () => {
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ];

  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('Missing Firebase config:', missing);
    throw new Error(`Firebase設定が不足しています: ${missing.join(', ')}`);
  }
};

// アプリ起動時に呼び出す
if (typeof window !== 'undefined') {
  validateFirebaseConfig();
}
