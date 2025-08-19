import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, X, Target, TrendingUp, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Timer } from './timer';
import { ProblemDisplay } from './problem-display';
import { AnswerInput } from './answer-input';
import { useStudySession } from '@/hooks/use-study-session';
import { useStudyStore } from '@/store/study-store';

interface StudySessionProps {
  subject: string;
  topic: string;
  className?: string;
}

export function StudySession({ subject, topic, className }: StudySessionProps) {
  const router = useRouter();
  const {
    currentSession,
    currentProblem,
    currentIndex,
    problemQueue,
    sessionStats,
    todaysGoal,
    progress,
    isSubmitting,
    showExplanation,
    submitAnswer,
    nextProblem,
    previousProblem,
    endSession,
  } = useStudySession();

  const [showEndDialog, setShowEndDialog] = useState(false);
  const [lastAnswerResult, setLastAnswerResult] = useState<boolean | null>(null);

  // セッション開始時の初期化
  useEffect(() => {
    if (!currentSession && subject && topic) {
      // セッションが開始されていない場合は親コンポーネントで開始
      router.push(`/study/${subject}/${topic}`);
    }
  }, [currentSession, subject, topic, router]);

  // 解答送信処理
  const handleSubmitAnswer = async (answer: string | string[], confidence: number) => {
    const result = await submitAnswer(answer, confidence);
    setLastAnswerResult(result);
    return result;
  };

  // 次の問題へ
  const handleNextProblem = () => {
    if (currentIndex >= problemQueue.length - 1) {
      setShowEndDialog(true);
    } else {
      nextProblem();
      setLastAnswerResult(null);
    }
  };

  // セッション終了処理
  const handleEndSession = async () => {
    await endSession();
  };

  if (!currentSession || !currentProblem) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="p-8">
          <CardContent>
            <p className="text-muted-foreground">セッションを読み込んでいます...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{subject} - {topic}</h1>
          <Badge variant="outline" className="text-base">
            {currentIndex + 1} / {problemQueue.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowEndDialog(true)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* 進捗バー */}
      <Progress value={progress?.percentage || 0} className="h-2" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* メインエリア */}
        <div className="lg:col-span-2 space-y-4">
          {/* 問題表示 */}
          <ProblemDisplay
            problem={currentProblem}
            showAnswer={showExplanation || lastAnswerResult !== null}
          />

          {/* 解答結果 */}
          {lastAnswerResult !== null && (
            <Alert className={lastAnswerResult ? 'border-green-500' : 'border-red-500'}>
              <AlertDescription className="flex items-center gap-2">
                {lastAnswerResult ? (
                  <>
                    <span className="text-2xl">🎉</span>
                    <span className="font-medium">正解です！素晴らしい！</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">💪</span>
                    <span className="font-medium">
                      不正解です。解説をよく読んで理解を深めましょう。
                    </span>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* 解答入力 */}
          {!showExplanation && lastAnswerResult === null && (
            <AnswerInput
              problem={currentProblem}
              onSubmit={handleSubmitAnswer}
              disabled={isSubmitting}
            />
          )}

          {/* ナビゲーションボタン */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={previousProblem}
              disabled={currentIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              前の問題
            </Button>
            <Button
              onClick={handleNextProblem}
              disabled={lastAnswerResult === null && !showExplanation}
            >
              {currentIndex >= problemQueue.length - 1 ? (
                <>セッション終了</>
              ) : (
                <>
                  次の問題
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* サイドバー */}
        <div className="space-y-4">
          {/* タイマー */}
          <Timer />

          {/* セッション統計 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">セッション統計</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">正答率</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {sessionStats.accuracy.toFixed(1)}%
                  </span>
                  <Progress
                    value={sessionStats.accuracy}
                    className="w-20 h-2"
                  />
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">解答済み</p>
                  <p className="font-medium">{sessionStats.totalProblems}問</p>
                </div>
                <div>
                  <p className="text-muted-foreground">正解数</p>
                  <p className="font-medium">{sessionStats.correctAnswers}問</p>
                </div>
                <div>
                  <p className="text-muted-foreground">平均時間</p>
                  <p className="font-medium">
                    {Math.floor(sessionStats.averageTime / 60)}分
                    {sessionStats.averageTime % 60}秒
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">ヒント使用</p>
                  <p className="font-medium">{sessionStats.hintsUsed}回</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 今日の目標 */}
          {todaysGoal && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  今日の目標
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">学習時間</span>
                    <span>
                      {todaysGoal.completedMinutes}/{todaysGoal.targetMinutes}分
                    </span>
                  </div>
                  <Progress
                    value={(todaysGoal.completedMinutes / todaysGoal.targetMinutes) * 100}
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">問題数</span>
                    <span>
                      {todaysGoal.completedProblems}/{todaysGoal.targetProblems}問
                    </span>
                  </div>
                  <Progress
                    value={(todaysGoal.completedProblems / todaysGoal.targetProblems) * 100}
                    className="h-2"
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">重点科目</p>
                  <div className="flex flex-wrap gap-1">
                    {todaysGoal.topics.map((t, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 学習のヒント */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                学習のコツ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>まず自力で解いてみましょう</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>ヒントは段階的に使いましょう</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>間違えた問題の解説をしっかり読みましょう</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>定期的に休憩を取りましょう</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* セッション終了確認ダイアログ */}
      <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>セッションを終了しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              現在の進捗が保存され、結果画面に移動します。
              {currentIndex < problemQueue.length - 1 && (
                <span className="block mt-2 text-orange-600">
                  まだ {problemQueue.length - currentIndex - 1} 問の未解答問題があります。
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndSession}>
              終了する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}