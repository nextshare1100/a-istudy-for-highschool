import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface PaceVisualizerProps {
  targetWPM: number;
  currentWPM: number;
  elapsedTime: number;
  totalTime: number;
}

export function PaceVisualizer({
  targetWPM,
  currentWPM,
  elapsedTime,
  totalTime,
}: PaceVisualizerProps) {
  const [paceRatio, setPaceRatio] = useState(1);
  const [paceStatus, setPaceStatus] = useState<'slow' | 'good' | 'fast'>('good');

  useEffect(() => {
    const ratio = currentWPM / targetWPM;
    setPaceRatio(ratio);
    
    if (ratio < 0.8) {
      setPaceStatus('slow');
    } else if (ratio > 1.2) {
      setPaceStatus('fast');
    } else {
      setPaceStatus('good');
    }
  }, [currentWPM, targetWPM]);

  const timeProgress = (elapsedTime / totalTime) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>ペース分析</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* スピードメーター */}
        <div className="relative h-32 flex items-center justify-center">
          <div className="relative w-48 h-24">
            {/* メーターの背景 */}
            <div className="absolute inset-0 border-8 border-gray-200 rounded-t-full border-b-0" />
            
            {/* カラーゾーン */}
            <div className="absolute inset-0 overflow-hidden rounded-t-full">
              <div className="absolute left-0 w-1/3 h-full bg-orange-200 opacity-50" />
              <div className="absolute left-1/3 w-1/3 h-full bg-green-200 opacity-50" />
              <div className="absolute right-0 w-1/3 h-full bg-red-200 opacity-50" />
            </div>
            
            {/* 針 */}
            <div
              className="absolute bottom-0 left-1/2 w-1 h-20 bg-gray-800 origin-bottom transition-transform duration-300"
              style={{
                transform: `translateX(-50%) rotate(${(paceRatio - 1) * 90}deg)`,
              }}
            >
              <div className="absolute -top-2 -left-2 w-5 h-5 bg-gray-800 rounded-full" />
            </div>
          </div>
        </div>

        {/* ラベル */}
        <div className="flex justify-between text-sm">
          <span className="text-orange-600">遅い</span>
          <span className="text-green-600">適切</span>
          <span className="text-red-600">速い</span>
        </div>

        {/* 数値表示 */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">目標ペース</p>
            <p className="text-lg font-semibold">{targetWPM} 文字/分</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">現在のペース</p>
            <p className="text-lg font-semibold">{currentWPM} 文字/分</p>
          </div>
        </div>

        {/* アドバイス */}
        <div
          className={cn(
            "p-3 rounded-lg text-center font-medium",
            paceStatus === 'slow' && "bg-orange-100 text-orange-800",
            paceStatus === 'good' && "bg-green-100 text-green-800",
            paceStatus === 'fast' && "bg-red-100 text-red-800"
          )}
        >
          {paceStatus === 'slow' && "もう少しテンポを上げましょう"}
          {paceStatus === 'good' && "良いペースです！この調子で続けましょう"}
          {paceStatus === 'fast' && "少し落ち着いて話しましょう"}
        </div>

        {/* 時間経過 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>経過時間</span>
            <span>{Math.floor(elapsedTime)}秒 / {totalTime}秒</span>
          </div>
          <Progress value={timeProgress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}