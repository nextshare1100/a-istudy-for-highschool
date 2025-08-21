'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home } from 'lucide-react';

export default function SubscriptionCancelPage() {
  const router = useRouter();
  
  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">キャンセルが完了しました</CardTitle>
          <CardDescription>
            サブスクリプションは現在の期間終了まで有効です
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm">
              ご利用期間終了まで、引き続きすべての機能をご利用いただけます。
              いつでもサブスクリプションを再開できます。
            </p>
          </div>
          
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push('/account')} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              アカウントページへ
            </Button>
            <Button onClick={() => router.push('/')}>
              ホームへ戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}