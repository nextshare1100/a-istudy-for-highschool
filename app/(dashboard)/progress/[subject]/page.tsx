'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, TrendingUp, AlertCircle, Star, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';

interface TopicData {
  id: string;
  name: string;
  description: string;
  subtopics: string[];
  totalProblems: number;
  solvedProblems: number;
  accuracy: number;
  lastStudied: Date | null;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  isWeakness: boolean;
  isRecommended: boolean;
  prerequisiteTopics: string[];
}

// 科目別のトピックデータ（実際はAPIから取得）
const TOPICS_BY_SUBJECT: Record<string, Omit<TopicData, 'solvedProblems' | 'accuracy' | 'lastStudied' | 'isWeakness' | 'isRecommended'>[]> = {
  '数学': [
    {
      id: 'quadratic-functions',
      name: '二次関数',
      description: '二次関数の基本から応用まで',
      subtopics: ['グラフの描き方', '最大・最小', '二次方程式', '二次不等式'],
      totalProblems: 50,
      difficulty: 'medium',
      estimatedTime: 120,
      prerequisiteTopics: [],
    },
    {
      id: 'trigonometry',
      name: '三角関数',
      description: '三角比から三角関数まで',
      subtopics: ['三角比', '正弦定理・余弦定理', '三角関数のグラフ', '加法定理'],
      totalProblems: 60,
      difficulty: 'hard',
      estimatedTime: 150,
      prerequisiteTopics: ['quadratic-functions'],
    },
    {
      id: 'calculus',
      name: '微分・積分',
      description: '微分と積分の基礎',
      subtopics: ['極限', '微分法', '積分法', '面積・体積'],
      totalProblems: 80,
      difficulty: 'hard',
      estimatedTime: 180,
      prerequisiteTopics: ['quadratic-functions', 'trigonometry'],
    },
  ],
  '英語': [
    {
      id: 'grammar-basics',
      name: '基礎文法',
      description: '時制・受動態・関係詞など',
      subtopics: ['時制', '受動態', '関係詞', '仮定法'],
      totalProblems: 40,
      difficulty: 'easy',
      estimatedTime: 90,
      prerequisiteTopics: [],
    },
    {
      id: 'reading-comprehension',
      name: '長文読解',
      description: '読解力を高める演習',
      subtopics: ['要約', '内容理解', '語彙推測', '論理展開'],
      totalProblems: 50,
      difficulty: 'medium',
      estimatedTime: 120,
      prerequisiteTopics: ['grammar-basics'],
    },
  ],
  // 他の科目も同様に定義
};

export default function SubjectTopicPage() {
  const router = useRouter();
  const params = useParams();
  const subject = params.subject as string;
  const { user } = useAuth();

  // トピック進捗データの取得
  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ['topic-progress', subject],
    queryFn: async () => {
      const response = await fetch(`/api/progress/topics?subject=${subject}`, {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch progress');
      return response.json();
    },
    enabled: !!user,
  });

  // 弱点分析データの取得
  const { data: weaknessData } = useQuery({
    queryKey: ['weakness-analysis', subject],
    queryFn: async () => {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
        body: JSON.stringify({
          action: 'analyzeWeakness',
          data: {
            subject,
            period: 'month',
            includeRecommendations: true,
          },
        }),
      });
      if (!response.ok) throw new Error('Failed to analyze weakness');
      return response.json();
    },
    enabled: !!user,
  });

  // スケジュール推奨データの取得
  const { data: scheduleData } = useQuery({
    queryKey: ['topic-recommendations', subject],
    queryFn: async () => {
      const response = await fetch(`/api/schedule/recommendations?subject=${subject}`, {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      return response.json();
    },
    enabled: !!user,
  });

  const baseTopics = TOPICS_BY_SUBJECT[subject] || [];
  
  // トピックデータと進捗データのマージ
  const topicsWithProgress = baseTopics.map(topic => {
    const progress = progressData?.[topic.id] || {};
    const isWeakness = weaknessData?.data?.weaknesses?.some((w: any) => w.topic === topic.id) || false;
    const isRecommended = scheduleData?.recommendedTopics?.includes(topic.id) || false;
    
    return {
      ...topic,
      solvedProblems: progress.solvedProblems || 0,
      accuracy: progress.accuracy || 0,
      lastStudied: progress.lastStudied ? new Date(progress.lastStudied) : null,
      isWeakness,
      isRecommended,
    };
  });

  // 推奨順にソート
  const sortedTopics = [...topicsWithProgress].sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    if (a.isWeakness && !b.isWeakness) return -1;
    if (!a.isWeakness && b.isWeakness) return 1;
    return 0;
  });

  const handleTopicClick = (topicId: string) => {
    router.push(`/study/${subject}/${topicId}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      hard: 'text-red-600 bg-red-100',
    };
    return colors[difficulty as keyof typeof colors] || '';
  };

  if (progressLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* ヘッダー */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/study')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          科目選択に戻る
        </Button>
        <h1 className="text-3xl font-bold mb-2">{subject} - トピック選択</h1>
        <p className="text-muted-foreground">学習したいトピックを選択してください</p>
      </div>

      {/* 弱点アラート */}
      {weaknessData?.data?.weaknesses && weaknessData.data.weaknesses.length > 0 && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>弱点が検出されました：</strong>
            {weaknessData.data.weaknesses.slice(0, 3).map((w: any) => w.topic).join('、')}
            を重点的に学習することをお勧めします。
          </AlertDescription>
        </Alert>
      )}

      {/* トピックリスト */}
      <div className="space-y-4">
        {sortedTopics.map((topic) => {
          const completionRate = topic.totalProblems > 0
            ? (topic.solvedProblems / topic.totalProblems) * 100
            : 0;

          const isLocked = topic.prerequisiteTopics.some(
            prereq => !topicsWithProgress.find(t => t.id === prereq)?.solvedProblems
          );

          return (
            <Card
              key={topic.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                topic.isRecommended ? 'ring-2 ring-primary ring-offset-2' : ''
              } ${isLocked ? 'opacity-60' : ''}`}
              onClick={() => !isLocked && handleTopicClick(topic.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold">{topic.name}</h3>
                      {topic.isRecommended && (
                        <Badge variant="default">
                          <Star className="mr-1 h-3 w-3" />
                          推奨
                        </Badge>
                      )}
                      {topic.isWeakness && (
                        <Badge variant="destructive">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          弱点
                        </Badge>
                      )}
                      <Badge className={getDifficultyColor(topic.difficulty)}>
                        {topic.difficulty === 'easy' ? '基礎' :
                         topic.difficulty === 'medium' ? '標準' : '応用'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-3">{topic.description}</p>
                    
                    {/* サブトピック */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {topic.subtopics.map((subtopic, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {subtopic}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <p className="text-sm text-muted-foreground mb-1">
                      <Clock className="inline h-3 w-3 mr-1" />
                      推定 {topic.estimatedTime}分
                    </p>
                    {topic.lastStudied && (
                      <p className="text-sm text-muted-foreground">
                        最終: {topic.lastStudied.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* 進捗バー */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">進捗</span>
                    <span>
                      {topic.solvedProblems} / {topic.totalProblems}問 
                      ({completionRate.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                  
                  {topic.accuracy > 0 && (
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-muted-foreground">正答率</span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {topic.accuracy.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* 前提条件 */}
                {isLocked && (
                  <Alert className="mt-4">
                    <AlertDescription className="text-sm">
                      このトピックを学習するには、先に以下のトピックを完了してください：
                      {topic.prerequisiteTopics.join('、')}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  className="w-full mt-4" 
                  disabled={isLocked}
                  variant={topic.isRecommended ? 'default' : 'outline'}
                >
                  {isLocked ? '前提条件を満たしていません' : '学習を開始'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}