'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Loader2,
  BookOpen,
  Target,
  TrendingUp,
  Brain
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import confetti from 'canvas-confetti';

// Suspense境界のためのコンポーネント
function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setError('セッションIDが見つかりません');
      setIsLoading(false);
      return;
    }

    // セッション情報の取得
    fetchSessionData(sessionId);
    
    // 成功のコンフェッティ演出
    triggerConfetti();
  }, [searchParams]);

  const fetchSessionData = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/stripe/session?session_id=${sessionId}`);
      
      if (!response.ok) {
        throw new Error('セッション情報の取得に失敗しました');
      }
      
      const data = await response.json();
      setSessionData(data);
    } catch (error) {
      console.error('Session fetch error:', error);
      setError('決済情報の確認中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const premiumFeatures = [
    {
      icon: Brain,
      title: 'AI学習アシスタント',
      description: '個人に最適化された学習プランを自動生成'
    },
    {
      icon: Target,
      title: '志望校合格分析',
      description: 'リアルタイムで合格可能性を予測'
    },
    {
      icon: TrendingUp,
      title: '詳細な進捗分析',
      description: '学習効率を可視化し、弱点を克服'
    },
    {
      icon: BookOpen,
      title: '無制限の問題演習',
      description: '全教科の問題を無制限に利用可能'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-lg">決済情報を確認中...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <X className="w-12 h-12 mx-auto mb-4" />
          </div>
          <h2 className="text-xl font-semibold mb-2">エラーが発生しました</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push('/subscription')}>
            登録ページに戻る
          </Button>
        </Card>
      </div>
    );
  }

  const isTrialPeriod = sessionData?.subscription?.trial_end ? true : false;
  const campaignCode = sessionData?.metadata?.campaignCode;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-4xl py-16 px-4">
        {/* 成功メッセージ */}
        <Card className="p-8 md:p-12 text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            登録が完了しました！
          </h1>
          
          <p className="text-lg text-muted-foreground mb-2">
            A-IStudy プレミアムプランへようこそ
          </p>
          
          {isTrialPeriod && campaignCode === 'AISTUDYTRIAL' && (
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mt-4">
              <Sparkles className="w-4 h-4" />
              初月無料キャンペーン適用中
            </div>
          )}
        </Card>

        {/* プレミアム機能の紹介 */}
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            今すぐ使える機能
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 次のステップ */}
        <Card className="p-8 bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/20">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">
              さあ、学習を始めましょう！
            </h3>
            <p className="text-muted-foreground mb-6">
              まずは学習目標を設定して、AIがあなたに最適な学習プランを作成します
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                ダッシュボードへ
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => router.push('/goals/setup')}
              >
                学習目標を設定
              </Button>
            </div>
          </div>
        </Card>

        {/* 重要な情報 */}
        {isTrialPeriod && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              {campaignCode === 'AISTUDYTRIAL' 
                ? '無料期間終了後は月額980円が自動的に請求されます。'
                : 'トライアル期間終了後は月額980円が自動的に請求されます。'}
            </p>
            <p className="mt-2">
              サブスクリプションはいつでも
              <Button
                variant="link"
                className="px-1 h-auto"
                onClick={() => router.push('/account/subscription')}
              >
                アカウント設定
              </Button>
              からキャンセルできます。
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// メインコンポーネント
export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}