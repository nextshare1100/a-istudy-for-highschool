'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DailyChallengeRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const challengeId = searchParams.get('id');

  useEffect(() => {
    if (challengeId) {
      router.replace(`/problems/daily-challenge/${challengeId}`);
    } else {
      router.replace('/home');
    }
  }, [challengeId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}
