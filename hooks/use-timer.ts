import { useEffect, useCallback, useRef } from 'react';
import { useStudyStore } from '@/store/study-store';

export function useTimer() {
  const {
    timerState,
    timerSeconds,
    timerType,
    pomodoroConfig,
    startTimer,
    pauseTimer,
    resetTimer,
    skipBreak,
  } = useStudyStore();

  const workerRef = useRef<Worker | null>(null);

  // Web Worker を使用した正確なタイマー
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // タイマー用Web Workerの作成
    const workerCode = `
      let interval;
      self.addEventListener('message', (e) => {
        if (e.data === 'start') {
          interval = setInterval(() => {
            self.postMessage('tick');
          }, 1000);
        } else if (e.data === 'stop') {
          clearInterval(interval);
        }
      });
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    workerRef.current.addEventListener('message', (e) => {
      if (e.data === 'tick' && timerState === 'running') {
        useStudyStore.getState()._tick();
      }
    });

    return () => {
      workerRef.current?.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, []);

  // タイマー状態に応じてWorkerを制御
  useEffect(() => {
    if (!workerRef.current) return;

    if (timerState === 'running') {
      workerRef.current.postMessage('start');
    } else {
      workerRef.current.postMessage('stop');
    }
  }, [timerState]);

  // 通知権限のリクエスト
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // 初回マウント時に通知権限をリクエスト
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  return {
    timerState,
    timerSeconds,
    timerType,
    pomodoroConfig,
    startTimer,
    pauseTimer,
    resetTimer,
    skipBreak,
    isBreakTime: timerState === 'break',
    isRunning: timerState === 'running',
    isPaused: timerState === 'paused',
  };
}