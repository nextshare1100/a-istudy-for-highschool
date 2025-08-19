'use client';

import React, { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { School, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';

interface MigrationNotificationProps {
  schoolName: string;
  schoolId: string;
  onComplete?: () => void;
}

export function MigrationNotification({ 
  schoolName, 
  schoolId,
  onComplete 
}: MigrationNotificationProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  
  const handleMigrate = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    try {
      // 本番環境では実際のAPIを呼び出す
      // const result = await migrationService.migrateToSchoolAccount(
      //   user.uid,
      //   schoolId
      // );
      
      // デモ用の処理
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setMigrationComplete(true);
      setTimeout(() => {
        onComplete?.();
        router.refresh();
      }, 2000);
    } catch (error) {
      console.error('Migration error:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleKeep = async () => {
    if (!user) return;
    
    setIsProcessing(true);
    try {
      // 本番環境では実際のAPIを呼び出す
      // await migrationService.recordKeepPersonalPlan(user.uid, schoolId);
      
      // デモ用の処理
      await new Promise(resolve => setTimeout(resolve, 1000));
      onComplete?.();
    } catch (error) {
      console.error('Keep plan error:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (migrationComplete) {
    return (
      <Alert className="border-green-500 bg-green-50">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <AlertTitle>移行完了</AlertTitle>
        <AlertDescription>
          学校アカウントへの移行が完了しました。全機能を無料でご利用いただけます。
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Alert className="border-blue-500 bg-blue-50">
      <School className="h-5 w-5 text-blue-600" />
      <AlertTitle className="text-lg">🎉 お知らせ</AlertTitle>
      <AlertDescription className="space-y-4">
        <p>
          <strong>{schoolName}</strong>がA-IStudyと契約しました！
          学校アカウントに移行すると、無料で全機能をご利用いただけます。
        </p>
        
        <div className="space-y-2 text-sm bg-white/50 p-3 rounded">
          <p>✅ 現在の学習データは全て引き継がれます</p>
          <p>✅ 未使用期間分は自動的に返金されます</p>
          <p>✅ 卒業後も特別価格で継続可能</p>
        </div>
        
        <div className="flex gap-3">
          <Button 
            onClick={handleMigrate} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            学校アカウントに移行する
          </Button>
          <Button 
            variant="outline" 
            onClick={handleKeep}
            disabled={isProcessing}
          >
            個人プランを継続する
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}