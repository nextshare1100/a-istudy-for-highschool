'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Tag, Sparkles, Loader2, XCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { toast } from '@/components/ui/use-toast';
import { getStripe } from "@/lib/stripe/client";

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, refreshUserProfile } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [campaignCode, setCampaignCode] = useState('');
  const [checkingSession, setCheckingSession] = useState(false);
  
  // URLパラメータを確認
  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';
  const sessionId = searchParams.get('session_id');
  const isWelcome = searchParams.get('welcome') === 'true';
  
  // 成功時のセッション確認と処理
  useEffect(() => {
    const checkSessionAndRefresh = async () => {
      if (isSuccess && sessionId && user) {
        setCheckingSession(true);
        try {
          // セッション情報を確認（オプション：より確実にするため）
          const response = await fetch('/api/stripe/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, userId: user.uid }),
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log('Session verification:', data);
          }
          
          // ユーザープロファイルを再取得（Webhookが処理されるまでの保険）
          // 少し待ってから再取得（Webhookの処理時間を考慮）
          await new Promise(resolve => setTimeout(resolve, 2000));
          await refreshUserProfile();
          
          // 成功メッセージ
          toast({
            title: '✅ 決済が完了しました！',
            description: 'プレミアムプランへようこそ！すべての機能をご利用いただけます。',
          });
          
          // ダッシュボードへリダイレクト
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
          
        } catch (error) {
          console.error('Session verification error:', error);
          // エラーがあってもユーザープロファイルの再取得は試みる
          await refreshUserProfile();
        } finally {
          setCheckingSession(false);
        }
      }
    };
    
    checkSessionAndRefresh();
  }, [isSuccess, sessionId, user, refreshUserProfile, router]);
  
  // キャンセル時の処理
  useEffect(() => {
    if (isCanceled) {
      toast({
        title: '決済がキャンセルされました',
        description: 'プランの選択からやり直してください。',
        variant: 'destructive',
      });
    }
  }, [isCanceled]);
  
  const features = [
    'AIによる学習分析と最適化',
    '全教科の学習管理システム',
    '詳細な進捗レポートとグラフ',
    '志望校合格に向けた学習計画',
    '過去問題の分析と対策',
    'カスタム学習目標の設定',
    '学習データのエクスポート機能',
    '24時間365日利用可能'
  ];
  
  const handleCheckout = async (withCampaignCode: boolean = false) => {
    if (!user) {
      router.push('/login?redirect=/subscription/register');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const body: any = {
        priceType: 'monthly',
        userId: user.uid,
      };
      
      // キャンペーンコードがある場合は追加
      if (withCampaignCode && campaignCode.trim()) {
        body.campaignCode = campaignCode.trim().toUpperCase();
      }
      
      // Checkout セッションを作成
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'チェックアウトセッションの作成に失敗しました');
      }
      
      const { sessionId } = await response.json();
      
      // Stripe Checkout にリダイレクト
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripeの読み込みに失敗しました');
      }
      
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        console.error('Stripe redirect error:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'エラー',
        description: error.message || '決済処理中にエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // 決済処理中の表示
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <h2 className="text-xl font-semibold">決済を確認しています...</h2>
            <p className="text-muted-foreground">
              しばらくお待ちください。自動的にダッシュボードへ移動します。
            </p>
          </div>
        </Card>
      </div>
    );
  }
  
  // 決済成功時の表示（確認完了後）
  if (isSuccess && !checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">決済が完了しました！</h2>
            <p className="text-muted-foreground">
              プレミアムプランへようこそ！まもなくダッシュボードへ移動します。
            </p>
            <div className="pt-4">
              <Button onClick={() => router.push('/dashboard')}>
                今すぐダッシュボードへ
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  // すでにサブスクリプションがある場合
  if (userProfile?.subscriptionStatus === 'active' && !isSuccess) {
    return (
      <div className="container max-w-4xl py-16 px-4">
        <Card className="p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">プレミアムプラン利用中</h2>
            <p className="text-muted-foreground">
              すべての機能をご利用いただけます
            </p>
            <div className="pt-4">
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                ダッシュボードに戻る
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  // 通常のプラン選択画面
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-5xl py-16 px-4">
        {/* ウェルカムメッセージ（新規登録時） */}
        {isWelcome && (
          <Alert className="mb-8 border-primary/20 bg-primary/5">
            <Sparkles className="h-4 w-4" />
            <AlertDescription className="text-base">
              <strong>アカウント作成ありがとうございます！</strong><br />
              プレミアムプランに登録して、すべての機能をご利用ください。
            </AlertDescription>
          </Alert>
        )}
        
        {/* ヘッダー */}
        <div className="text-center space-y-4 mb-12">
          <Badge className="mb-2" variant="secondary">
            学習効率を最大化
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight">
            月額980円で、合格への最短ルートを
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AIがあなたの学習データを分析し、最適な学習プランを提案。
            効率的な学習で、目標達成を実現します。
          </p>
        </div>
        
        {/* キャンペーンコード入力欄 */}
        <Card className="p-6 mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Tag className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  キャンペーンコードをお持ちの方
                  <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  特別キャンペーンコードで初月無料！今すぐ始めましょう
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="例: STUDYTRACKER2024"
                  value={campaignCode}
                  onChange={(e) => setCampaignCode(e.target.value.toUpperCase())}
                  className="sm:max-w-xs"
                  disabled={isLoading}
                />
                <Button 
                  onClick={() => handleCheckout(true)}
                  disabled={isLoading || !campaignCode.trim()}
                  className="whitespace-nowrap"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      処理中...
                    </>
                  ) : (
                    'コードを使用して始める'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
        
        {/* メインプランカード */}
        <Card className="p-8 shadow-xl border-2">
          <div className="space-y-6">
            {/* プランヘッダー */}
            <div className="text-center space-y-4">
              <Badge variant="default" className="mb-2">
                人気No.1
              </Badge>
              <h2 className="text-3xl font-bold">プレミアムプラン</h2>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold tracking-tight">¥980</span>
                <span className="text-muted-foreground text-lg">/ 月</span>
              </div>
              <p className="text-muted-foreground">
                すべての機能が使い放題。いつでもキャンセル可能
              </p>
            </div>
            
            {/* 機能リスト */}
            <div className="border-y py-6">
              <h3 className="font-semibold mb-4 text-center">含まれる機能</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* CTAボタン */}
            <div className="space-y-4">
              <Button 
                onClick={() => handleCheckout(false)}
                size="lg"
                className="w-full text-lg font-semibold h-12"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    処理中...
                  </>
                ) : (
                  '今すぐ始める'
                )}
              </Button>
              
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <span>✓ SSL暗号化</span>
                  <span>✓ 安全な決済</span>
                  <span>✓ 即時キャンセル可</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  決済はStripeを通じて安全に処理されます
                </p>
              </div>
            </div>
          </div>
        </Card>
        
        {/* 追加情報 */}
        <Alert className="mt-8">
          <AlertDescription>
            <strong>安心の保証：</strong>
            ご満足いただけない場合は、いつでもキャンセル可能です。
            日割り計算での返金には対応しておりません。
          </AlertDescription>
        </Alert>
        
        {/* FAQ的な情報 */}
        <div className="mt-12 text-center text-sm text-muted-foreground max-w-2xl mx-auto space-y-2">
          <p>
            領収書の発行や法人契約をご希望の場合は、
            <a href="mailto:support@studytracker.jp" className="text-primary hover:underline">
              お問い合わせ
            </a>
            ください。
          </p>
          <p>
            よくあるご質問は
            <a href="/faq" className="text-primary hover:underline">
              こちら
            </a>
            をご覧ください。
          </p>
        </div>
      </div>
      
      {/* ローディングオーバーレイ */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="font-medium">決済ページへ移動しています...</span>
          </Card>
        </div>
      )}
    </div>
  );
}