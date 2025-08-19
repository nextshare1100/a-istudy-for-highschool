'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useStudyStore } from '@/store/study-store';
import { useAuthStore } from '@/store/auth-store';
import { StudySession } from '@/components/study/study-session';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function StudySessionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const subject = params.subject as string;
  const topic = params.topic as string;
  const difficulty = searchParams.get('difficulty') as 'basic' | 'standard' | 'advanced' || 'standard';
  const timerType = searchParams.get('timer') as 'pomodoro' | 'normal' | 'none' || 'pomodoro';

  const user = useAuthStore((state) => state.user);
  const userProfile = useAuthStore((state) => state.userProfile);
  const { currentSession, startSession } = useStudyStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeSession = async () => {
      if (!user || !userProfile) {
        setError('ユーザー情報が取得できません');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        await startSession({
          subject,
          topic,
          difficulty,
          timerType,
          userProfile,
        });
      } catch (err) {
        console.error('セッション開始エラー:', err);
        setError('学習セッションの開始に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [subject, topic, difficulty, timerType, user, userProfile, startSession]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-gray-600">問題を生成しています...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button
          className="mt-4"
          onClick={() => router.push(`/study/${subject}`)}
        >
          戻る
        </Button>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Alert>
          <AlertDescription>
            セッションが開始されていません
          </AlertDescription>
        </Alert>
        <Button
          className="mt-4"
          onClick={() => router.push(`/study/${subject}`)}
        >
          戻る
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <StudySession
        subject={subject}
        topic={topic}
        timerType={timerType}
      />
    </div>
  );
}