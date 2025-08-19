'use client';

import { useEffect, useState } from 'react';
import { useStudyStore } from '@/store/study-store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, Coffee, Timer as TimerIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimerProps {
  type: 'pomodoro' | 'normal';
}

export function Timer({ type }: TimerProps) {
  const {
    timerState,
    timerSeconds,
    pomodoroConfig,
    startTimer,
    pauseTimer,
    resetTimer,
    skipBreak,
  } = useStudyStore();

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Page Visibility APIを使用してバックグラウンドでも動作
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 時間のフォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 進捗率の計算
  const getProgress = () => {
    if (type === 'pomodoro') {
      const totalTime = timerState === 'break' 
        ? pomodoroConfig.breakTime 
        : pomodoroConfig.workTime;
      return ((totalTime - timerSeconds) / totalTime) * 100;
    } else {
      // 通常タイマーは60分を最大として表示
      return (timerSeconds / 3600) * 100;
    }
  };

  const isBreakTime = type === 'pomodoro' && timerState === 'break';

  return (
    <Card className={cn(
      "w-full max-w-md transition-colors",
      isBreakTime && "bg-green-50 border-green-200"
    )}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* タイマー表示 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {isBreakTime ? (
                <Coffee className="w-6 h-6 text-green-600" />
              ) : (
                <TimerIcon className="w-6 h-6 text-primary" />
              )}
              <span className="text-sm font-medium text-gray-600">
                {isBreakTime ? '休憩時間' : (
                  type === 'pomodoro' 
                    ? `作業時間 (${pomodoroConfig.currentCycle}/${pomodoroConfig.totalCycles})`
                    : '学習時間'
                )}
              </span>
            </div>
            <div className={cn(
              "text-6xl font-bold tabular-nums",
              isBreakTime ? "text-green-600" : "text-primary"
            )}>
              {formatTime(timerSeconds)}
            </div>
          </div>

          {/* プログレスバー */}
          {type === 'pomodoro' && (
            <Progress 
              value={getProgress()} 
              className={cn(
                "h-2",
                isBreakTime && "[&>div]:bg-green-600"
              )}
            />
          )}

          {/* コントロールボタン */}
          <div className="flex gap-2">
            {timerState === 'idle' || timerState === 'paused' ? (
              <Button
                onClick={startTimer}
                className="flex-1"
                variant={isBreakTime ? "outline" : "default"}
              >
                <Play className="w-4 h-4 mr-2" />
                {timerState === 'idle' ? 'スタート' : '再開'}
              </Button>
            ) : (
              <Button
                onClick={pauseTimer}
                className="flex-1"
                variant="outline"
              >
                <Pause className="w-4 h-4 mr-2" />
                一時停止
              </Button>
            )}
            
            <Button
              onClick={resetTimer}
              variant="outline"
              size="icon"
              disabled={timerState === 'idle'}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          {/* 休憩スキップボタン */}
          {isBreakTime && timerState === 'running' && (
            <Button
              onClick={skipBreak}
              variant="ghost"
              className="w-full"
            >
              休憩をスキップして次の作業へ
            </Button>
          )}

          {/* ポモドーロ情報 */}
          {type === 'pomodoro' && !isBreakTime && (
            <div className="text-center text-sm text-gray-600">
              作業時間: {pomodoroConfig.workTime / 60}分 / 
              休憩時間: {pomodoroConfig.breakTime / 60}分
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}