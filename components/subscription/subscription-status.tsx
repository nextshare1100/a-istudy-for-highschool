'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Calendar, CreditCard, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/auth-store';
import { subscriptionService } from '@/lib/services/subscription-service';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export function SubscriptionStatus() {
  const { user } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { data: subscription, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription', user?.uid],
    queryFn: () => subscriptionService.getCurrentSubscription(user!.uid),
    enabled: !!user,
  });
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (error || !subscription) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          サブスクリプション情報の取得に失敗しました
        </AlertDescription>
      </Alert>
    );
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">有効</Badge>;
      case 'trialing':
        return <Badge variant="secondary">トライアル中</Badge>;
      case 'past_due':
        return <Badge variant="destructive">支払い遅延</Badge>;
      case 'canceled':
        return <Badge variant="outline">キャンセル済み</Badge>;
      default:
        return <Badge variant="outline">フリー</Badge>;
    }
  };
  
  const handleManageSubscription = async () => {
    setIsUpdating(true);
    try {
      const url = await subscriptionService.openCustomerPortal();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to open customer portal:', error);
      alert('カスタマーポータルを開けませんでした。もう一度お試しください。');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleCancelSubscription = async () => {
    if (!subscription?.subscriptionId) return;
    
    const confirmed = window.confirm(
      '本当にサブスクリプションをキャンセルしますか？\n現在の期間終了まではご利用いただけます。'
    );
    
    if (!confirmed) return;
    
    setIsUpdating(true);
    try {
      await subscriptionService.cancelSubscription(subscription.subscriptionId);
      await refetch();
      alert('サブスクリプションのキャンセルを受け付けました。現在の期間終了まではご利用いただけます。');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      alert('キャンセルに失敗しました。もう一度お試しください。');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleResumeSubscription = async () => {
    if (!subscription?.subscriptionId) return;
    
    setIsUpdating(true);
    try {
      await subscriptionService.resumeSubscription(subscription.subscriptionId);
      await refetch();
      alert('サブスクリプションを再開しました。');
    } catch (error) {
      console.error('Failed to resume subscription:', error);
      alert('再開に失敗しました。もう一度お試しください。');
    } finally {
      setIsUpdating(false);
    }
  };
  
  // 日付のフォーマット処理
  const formatDate = (date: Date | undefined) => {
    if (!date) return '---';
    // Date オブジェクトかどうかを確認
    const dateObj = date instanceof Date ? date : new Date(date);
    return format(dateObj, 'yyyy年M月d日', { locale: ja });
  };
  
  const formatShortDate = (date: Date | undefined) => {
    if (!date) return '---';
    const dateObj = date instanceof Date ? date : new Date(date);
    return format(dateObj, 'M月d日', { locale: ja });
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>現在のプラン</CardTitle>
          {getStatusBadge(subscription.status)}
        </div>
        <CardDescription>
          {subscription.status === 'active' 
            ? 'プレミアムプランをご利用中です'
            : subscription.status === 'trialing'
              ? `無料トライアル期間中（${formatShortDate(subscription.trialEndsAt || subscription.currentPeriodEnd)}まで）`
              : 'フリープランをご利用中です'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {(subscription.status === 'active' || subscription.status === 'trialing') && subscription.currentPeriodEnd && (
          <>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>次回更新日</span>
              </div>
              <span className="font-medium">
                {formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>
          </>
        )}
        
        {subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              このサブスクリプションは{formatShortDate(subscription.currentPeriodEnd)}に終了予定です
            </AlertDescription>
          </Alert>
        )}
        
        {subscription.status === 'past_due' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              支払いに失敗しました。支払い方法を更新してください。
            </AlertDescription>
          </Alert>
        )}
        
        <div className="pt-4 space-y-2">
          {subscription.status === 'active' && subscription.stripeCustomerId && (
            <Button 
              onClick={handleManageSubscription}
              variant="outline"
              className="w-full"
              disabled={isUpdating}
            >
              {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              支払い方法を管理
            </Button>
          )}
          
          {subscription.status === 'active' && (
            subscription.cancelAtPeriodEnd ? (
              <Button 
                onClick={handleResumeSubscription}
                className="w-full"
                disabled={isUpdating}
              >
                {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                サブスクリプションを再開
              </Button>
            ) : (
              <Button 
                onClick={handleCancelSubscription}
                variant="destructive"
                className="w-full"
                disabled={isUpdating}
              >
                {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                サブスクリプションをキャンセル
              </Button>
            )
          )}
          
          {subscription.status === 'free' && (
            <Button 
              onClick={() => window.location.href = '/pricing'}
              className="w-full"
            >
              プレミアムプランにアップグレード
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}