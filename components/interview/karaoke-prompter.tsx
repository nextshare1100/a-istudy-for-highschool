import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface KaraokePrompterProps {
  script: string;
  targetDuration: number;
  isPlaying: boolean;
  onComplete: () => void;
  onSegmentChange?: (index: number) => void;
}

export function KaraokePrompter({
  script,
  targetDuration,
  isPlaying,
  onComplete,
  onSegmentChange,
}: KaraokePrompterProps) {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const segments = script.split(/[、。！？]/);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const totalSegments = segments.length;
      const segmentDuration = (targetDuration * 1000) / totalSegments;

      intervalRef.current = setInterval(() => {
        setCurrentSegmentIndex((prev) => {
          const next = prev + 1;
          if (next >= totalSegments) {
            onComplete();
            return prev;
          }
          onSegmentChange?.(next);
          return next;
        });
        setProgress((prev) => Math.min(prev + (100 / totalSegments), 100));
      }, segmentDuration);
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
  }, [isPlaying, segments.length, targetDuration, onComplete, onSegmentChange]);

  return (
    <div className="karaoke-prompter space-y-4">
      <div className="script-display bg-gray-50 p-6 rounded-lg min-h-[200px]">
        <div className="text-lg leading-relaxed">
          {segments.map((segment, index) => (
            <span
              key={index}
              className={cn(
                "transition-all duration-300 inline-block mr-1",
                index === currentSegmentIndex && "text-blue-600 font-bold text-xl scale-110",
                index < currentSegmentIndex && "text-gray-400",
                index > currentSegmentIndex && "text-gray-700"
              )}
            >
              {segment}
              {index < segments.length - 1 && '、'}
            </span>
          ))}
        </div>
      </div>
      
      <div className="progress-section">
        <Progress value={progress} className="h-3" />
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>経過: {Math.floor((progress / 100) * targetDuration)}秒</span>
          <span>目標: {targetDuration}秒</span>
        </div>
      </div>
    </div>
  );
}