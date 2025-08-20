'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// 動的インポートでホームページコンポーネントを読み込む
const HomePage = dynamic(() => import('./(dashboard)/home/page'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePage />
    </Suspense>
  );
}
