import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimeLimitTimerProps {
  timeLimit: number; // 分
  onTimeUp: () => void;
  autoStart?: boolean;
}

export function TimeLimitTimer({
  timeLimit,
  onTimeUp,
  autoStart = false,
}: TimeLimitTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60); // 秒
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, onTimeUp]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const percentage = (timeRemaining / (timeLimit * 60)) * 100;
  const isWarning = percentage <= 20;
  const isCritical = percentage <= 10;

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={toggleTimer}
        className={cn(
          isRunning && "bg-red-50 border-red-200",
          !isRunning && "bg-gray-50"
        )}
      >
        <Clock className="mr-2 h-4 w-4" />
        {isRunning ? 'タイマー停止' : 'タイマー開始'}
      </Button>
      
      <div
        className={cn(
          "flex items-center gap-2 font-mono text-lg",
          isWarning && !isCritical && "text-orange-600",
          isCritical && "text-red-600"
        )}
      >
        {isCritical && <AlertTriangle className="h-5 w-5 animate-pulse" />}
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
    </div>
  );
}