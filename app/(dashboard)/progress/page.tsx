'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgressChart } from '@/components/progress/progress-chart';
import { WeaknessAnalysis } from '@/components/progress/weakness-analysis';
import { StudyHistory } from '@/components/progress/study-history';
import { useProgress } from '@/hooks/use-progress';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Brain,
  ChevronRight,
  FileText,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { formatDuration } from 'date-fns';
import { ja } from 'date-fns/locale';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'weakness' | 'history'>('overview');

  // ローディング状態
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">進捗データを取得できませんでした。</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              再読み込み
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // グラフ用データの整形
  const chartData = {
    timeSeries: progress.recentActivity.map(activity => ({
      date: activity.createdAt.toString(),
      mastery: progress.overall.mastery,
      correctRate: progress.overall.correctRate * 100,
    })),
    topicData: progress.subjects.flatMap(subject => 
      Object.entries(subject.topics || {}).map(([topic, mastery]) => ({
        topic: `${subjectLabels[subject.subject]} - ${topic}`,
        mastery,
        questions: 0,
        lastStudied: subject.lastStudied?.toString() || ''
      }))
    ),
    radarData: progress.subjects.map(subject => ({
      subject: subjectLabels[subject.subject],
      current: subject.mastery,
      target: 80,
      average: 65
    }))
  };

  // 弱点データ（仮のデータ - 実際はAPIから取得）
  const weakPoints = [
    {
      id: '1',
      topic: '二次関数',
      subtopic: '頂点の求め方',
      errorType: '概念理解不足',
      frequency: 5,
      lastOccurred: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      severity: 'high' as const,
      examples: ['y = 2x² + 4x + 1 の頂点を求める問題'],
      improvementRate: 30
    },
    {
      id: '2',
      topic: '英文法',
      subtopic: '仮定法',
      errorType: '文法ミス',
      frequency: 3,
      lastOccurred: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      severity: 'medium' as const,
      examples: ['If I were you, I would...の構文'],
      improvementRate: 60
    }
  ];

  const recommendations = [
    {
      id: '1',
      weakPointId: '1',
      type: 'practice' as const,
      title: '二次関数基礎演習',
      description: '頂点の求め方を基礎から復習',
      estimatedTime: 30,
      priority: 5
    },
    {
      id: '2',
      weakPointId: '2',
      type: 'video' as const,
      title: '仮定法マスター講座',
      description: '仮定法の使い方を動画で解説',
      estimatedTime: 20,
      priority: 4
    }
  ];

  // 学習履歴データ（仮のデータ）
  const studySessions = progress.recentActivity.slice(0, 10).map((activity, index) => ({
    id: activity.id,
    date: activity.createdAt,
    subject: activity.subject,
    topic: activity.topic,
    totalQuestions: 10,
    correctAnswers: activity.isCorrect ? 8 : 6,
    timeSpent: 900 + index * 120,
    timerType: index % 3 === 0 ? 'pomodoro' as const : undefined,
    mastery: 70 + index * 2
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">📊 学習進捗ダッシュボード</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => analyzeProgress({ timeframe: 'week' })}
            disabled={isAnalyzing}
          >
            <Sparkles className="w-4 h-4 mr-1" />
            AI分析を実行
          </Button>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-1" />
            レポート生成
          </Button>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総合進捗</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.overall.mastery}%</div>
            <Progress value={progress.overall.mastery} className="mt-2" />
            {metrics?.trend && (
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.trend === 'improving' ? '上昇傾向' : 
                 metrics.trend === 'declining' ? '下降傾向' : '安定'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今週の学習時間</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor((metrics?.weeklyStudyTime || 0) / 3600)}時間
              {Math.floor(((metrics?.weeklyStudyTime || 0) % 3600) / 60)}分
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              目標: 週20時間
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">目標達成</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progress.subjects.filter(s => s.mastery >= 70).length}/{progress.subjects.length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              習熟度70%以上の科目
            </p>
          </CardContent>
        </Card>
      </div>

      {/* タブ切り替え */}
      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('overview')}
        >
          概要
        </Button>
        <Button
          variant={activeTab === 'weakness' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('weakness')}
        >
          弱点分析
        </Button>
        <Button
          variant={activeTab === 'history' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('history')}
        >
          学習履歴
        </Button>
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 進捗グラフ */}
          <ProgressChart data={chartData} />

          {/* 科目別進捗 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">🎯 科目別進捗</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progress.subjects.map((subject) => (
                  <div
                    key={subject.subject}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/progress/${subject.subject}`)}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{subjectLabels[subject.subject]}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex-1">
                          <Progress value={subject.mastery} className="h-2" />
                        </div>
                        <span className="text-sm font-medium">{subject.mastery}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        最終学習: {subject.lastStudied ? 
                          formatDuration(
                            { seconds: Math.floor((Date.now() - new Date(subject.lastStudied).getTime()) / 1000) },
                            { locale: ja }
                          ) + '前' : 
                          '未学習'
                        }
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 最近の弱点（概要） */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">🔍 最近の弱点</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setActiveTab('weakness')}
              >
                すべて見る
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <WeaknessAnalysis 
                weakPoints={weakPoints.slice(0, 3)} 
                recommendations={recommendations}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'weakness' && (
        <WeaknessAnalysis 
          weakPoints={weakPoints} 
          recommendations={recommendations}
          onActionClick={(action, weakPoint) => {
            console.log('Action clicked:', action, weakPoint);
            // アクションに応じた処理
          }}
        />
      )}

      {activeTab === 'history' && (
        <StudyHistory 
          sessions={studySessions}
          onSessionClick={(session) => {
            console.log('Session clicked:', session);
          }}
          onDeleteSession={(sessionId) => {
            console.log('Delete session:', sessionId);
          }}
          onExport={(format, sessionIds) => {
            console.log('Export:', format, sessionIds);
          }}
        />
      )}
    </div>
  );
}