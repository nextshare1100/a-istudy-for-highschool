// app/(dashboard)/essay/write/[themeId]/loading.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function EssayWriteLoading() {
  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-10 w-20" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      {/* テーマ情報 */}
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Skeleton className="h-5 w-16 mb-2" />
              <Skeleton className="h-20 w-full" />
            </div>
            <div>
              <Skeleton className="h-5 w-20 mb-2" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-7 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 作成エリア */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full mb-6" />
          
          {/* アクションボタン */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}