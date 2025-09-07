// components/model-usage-indicator.tsx

'use client'

import { useModelStats } from '@/hooks/use-model-stats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ModelUsageIndicator() {
  const { stats, loading, error, refresh, resetStats } = useModelStats();

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          モデル使用状況の取得に失敗しました: {error}
        </AlertDescription>
      </Alert>
    );
  }

  const allModelsUnavailable = stats.every(s => !s.available);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Gemini API 使用状況</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          利用可能なモデルから自動的に選択されます
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {stats.map((stat) => (
          <div key={stat.model} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{stat.model}</span>
                <Badge 
                  variant={stat.available ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {stat.available ? '利用可能' : '制限中'}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>本日: {stat.usage.dailyCount.toLocaleString()} / {stat.limits.perDay.toLocaleString()}</span>
                <span>{Math.round((stat.usage.dailyCount / stat.limits.perDay) * 100)}%</span>
              </div>
              <Progress 
                value={(stat.usage.dailyCount / stat.limits.perDay) * 100} 
                className="h-1.5"
              />
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>分間: {stat.usage.minuteCount} / {stat.limits.perMinute}</span>
            </div>
          </div>
        ))}

        {allModelsUnavailable && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              すべてのモデルが制限に達しています。
              しばらく待ってから再試行してください。
            </AlertDescription>
          </Alert>
        )}

        {process.env.NODE_ENV === 'development' && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => resetStats()}
              className="w-full"
            >
              使用状況をリセット（開発用）
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}