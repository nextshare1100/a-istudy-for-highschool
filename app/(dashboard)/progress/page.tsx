'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProgress } from '@/hooks/use-progress';
import { useAnalyticsStore } from '@/store/analyticsStore';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Brain,
  ChevronRight,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

// 科目の日本語表記マッピング
const subjectLabels: Record<string, string> = {
  math: '数学',
  english: '英語',
  japanese: '国語',
  science: '理科',
  social: '社会'
};

export default function ProgressPage() {
  const router = useRouter();
  const { progress, metrics, isLoading, analyzeProgress, isAnalyzing } = useProgress();
  const [activeTab, setActiveTab] = useState<'overview' | 'subject'>('overview');
  
  // Storeから追加のデータを取得
  const { weaknesses, fetchWeaknesses } = useAnalyticsStore();
  
  useEffect(() => {
    fetchWeaknesses();
  }, [fetchWeaknesses]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 rounded-2xl"></div>
            <div className="h-24 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // 実際のメトリクスを使用
  const weeklyHours = metrics ? Math.floor(metrics.weeklyStudyTime / 3600) : 0;
  const weeklyMinutes = metrics ? Math.floor((metrics.weeklyStudyTime % 3600) / 60) : 0;
  const targetAchievement = metrics?.targetAchievement || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">学習進捗</h1>
          <button
            onClick={() => analyzeProgress({ timeframe: 'week' })}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50"
          >
            {isAnalyzing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
            AI分析
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* サマリーカード */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">今週の学習時間</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">{weeklyHours}時間{weeklyMinutes}</span>
              <span className="text-sm text-gray-600">分</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              目標: 週20時間
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-600">目標達成率</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">{targetAchievement}</span>
              <span className="text-sm text-gray-600">%</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              習熟度70%以上: {progress?.subjects.filter(s => s.mastery >= 70).length || 0}/{progress?.subjects.length || 5}科目
            </div>
          </div>
        </div>

        {/* タブ */}
        <div className="flex gap-2 bg-white rounded-2xl p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'overview' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            概要
          </button>
          <button
            onClick={() => setActiveTab('subject')}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'subject' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            科目別
          </button>
        </div>

        {/* タブコンテンツ */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* 週間進捗グラフ */}
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-3">週間学習時間</h3>
              <div className="flex justify-between items-end h-32">
                {['月', '火', '水', '木', '金', '土', '日'].map((day, index) => {
                  // TODO: 実際の日別データを使用
                  const height = Math.random() * 100;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full max-w-[30px] bg-gray-100 rounded-full relative h-24">
                        <div 
                          className="absolute bottom-0 w-full bg-blue-500 rounded-full transition-all"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 弱点分析 */}
            {weaknesses.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="text-base font-semibold text-gray-900">弱点分析</h3>
                </div>
                <div className="divide-y">
                  {weaknesses.slice(0, 3).map((weakness) => (
                    <div key={weakness.topicId} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{weakness.topicName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            エラー率: {Math.round(weakness.errorRate)}%
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          weakness.weaknessScore > 70 
                            ? 'bg-red-100 text-red-700'
                            : weakness.weaknessScore > 40
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {weakness.weaknessScore > 70 ? '要復習' : weakness.weaknessScore > 40 ? '注意' : '良好'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 最近の学習 */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-base font-semibold text-gray-900">最近の学習</h3>
              </div>
              <div className="divide-y">
                {progress?.recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {subjectLabels[activity.subject] || activity.subject}
                          {activity.topic && ` - ${activity.topic}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.createdAt).toLocaleString('ja-JP')}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        activity.isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subject' && (
          <div className="space-y-4">
            {progress?.subjects.map((subject) => (
              <div 
                key={subject.subject}
                onClick={() => router.push(`/progress/${subject.subject}`)}
                className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">
                      {subjectLabels[subject.subject] || subject.subject}
                    </h3>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${subject.mastery}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      習熟度: {subject.mastery}% • 最終学習: {
                        subject.lastStudied 
                          ? new Date(subject.lastStudied).toLocaleDateString('ja-JP')
                          : '未学習'
                      }
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
