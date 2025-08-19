import { cn } from '@/lib/utils';

interface WordCounterProps {
  current: number;
  min: number;
  max: number;
}

export function WordCounter({ current, min, max }: WordCounterProps) {
  const percentage = (current / max) * 100;
  const isUnderMin = current < min;
  const isOverMax = current > max;
  const isOptimal = current >= min && current <= max;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span
          className={cn(
            "font-medium",
            isUnderMin && "text-orange-600",
            isOptimal && "text-green-600",
            isOverMax && "text-red-600"
          )}
        >
          {current}文字
        </span>
        <span className="text-gray-500">
          {min}〜{max}文字
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300",
            isUnderMin && "bg-orange-400",
            isOptimal && "bg-green-500",
            isOverMax && "bg-red-500"
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {isUnderMin && (
        <p className="text-xs text-orange-600">
          あと{min - current}文字必要です
        </p>
      )}
      {isOverMax && (
        <p className="text-xs text-red-600">
          {current - max}文字超過しています
        </p>
      )}
    </div>
  );
}