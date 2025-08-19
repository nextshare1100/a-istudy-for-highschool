'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { StudySession } from '@/components/study/study-session';
import { useStudySession } from '@/hooks/use-study-session';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StudyOptions {
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  problemCount?: number;
  problemType?: string;
}

export default function StudySessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { currentSession, startSession } = useStudySession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subject = decodeURIComponent(params.subject as string);
  const topic = decodeURIComponent(params.topic as string);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // セッションが既に開始されている場合
    if (currentSession) {
      // 異なる科目/トピックの場合は警告
      if (currentSession.subject !== subject || currentSession.topic !== topic) {
        setError('別のセッションが進行中です。先に終了してください。');
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      return;
    }

    // 新しいセッションを開始
    const initSession = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // URLパラメータから設定を取得
        const searchParams = new URLSearchParams(window.location.search);
        const options: StudyOptions = {
          difficulty: searchParams.get('difficulty') as any || undefined,
          problemCount: searchParams.get('count') ? parseInt(searchParams.get('count')!) : undefined,
          problemType: searchParams.get('type') || undefined,
        };

        await startSession(subject, topic, options);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to start session:', err);
        setError('セッションの開始に失敗しました。もう一度お試しください。');
        setIsLoading(false);
      }
    };

    initSession();
  }, [user, subject, topic, currentSession, startSession, router]);

  // ローディング中
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="p-8">
          <CardContent className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-lg font-medium">学習セッションを準備しています...</p>
            <p className="text-sm text-muted-foreground">問題を生成中です</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // エラー表示
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/study/${subject}`)}>
            トピック選択に戻る
          </Button>
          {currentSession && (
            <Button variant="outline" onClick={() => router.push('/study/current')}>
              現在のセッションに戻る
            </Button>
          )}
        </div>
      </div>
    );
  }

  // セッションが開始されていない場合
  if (!currentSession) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            セッションが開始されていません。
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => router.push(`/study/${subject}`)}
          className="mt-4"
        >
          トピック選択に戻る
        </Button>
      </div>
    );
  }

  // メインの学習画面
  return <StudySession subject={subject} topic={topic} />;
}