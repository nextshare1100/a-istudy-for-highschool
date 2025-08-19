'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function RegisterContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">サブスクリプション登録</h1>
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          登録が完了しました！
        </div>
      )}
      
      {canceled && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          登録がキャンセルされました。
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg p-6">
        <p>A-IStudyへようこそ！</p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
