'use client';

import { useRouter } from 'next/navigation';
import { Clock, Target } from 'lucide-react';

export function HomeProgressCards() {
  const router = useRouter();
  
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div 
        onClick={() => router.push('/progress')} 
        className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-sm text-gray-600">今日の学習時間</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">2時間15</span>
          <span className="text-sm text-gray-600">分</span>
        </div>
        <div className="mt-2 text-xs text-blue-600">
          進捗詳細を見る →
        </div>
      </div>
      
      <div 
        onClick={() => router.push('/analytics')} 
        className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Target className="w-5 h-5 text-green-600" />
          </div>
          <span className="text-sm text-gray-600">週間目標達成率</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">78</span>
          <span className="text-sm text-gray-600">%</span>
        </div>
        <div className="mt-2 text-xs text-green-600">
          分析を見る →
        </div>
      </div>
    </div>
  );
}
