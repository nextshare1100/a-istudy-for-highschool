'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SubscriptionSuccessHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  
  useEffect(() => {
    const subscriptionStatus = searchParams.get('subscription');
    const isWelcome = searchParams.get('welcome');
    
    if (subscriptionStatus === 'success') {
      setShowSuccess(true);
      
      // URLからパラメータを削除（クリーンなURLにする）
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);
  
  if (!showSuccess) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-2 duration-300">
      <Alert className="border-green-200 bg-green-50 shadow-lg">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 pr-8">
          <strong>プレミアムプランへようこそ！</strong>
          <br />
          アカウント登録とお支払いが正常に完了しました。
          すべての機能をご利用いただけます。
        </AlertDescription>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 text-green-600 hover:text-green-800"
          onClick={() => setShowSuccess(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
    </div>
  );
}