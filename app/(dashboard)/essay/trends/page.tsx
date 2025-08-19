'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { TrendingUp, Calendar, Globe, Lightbulb, FileText } from 'lucide-react';
import { useAIGeneration } from '@/hooks/use-ai-generation';
import { CurrentAffair } from '@/lib/essay/current-affairs';

export default function TrendsPage() {
  const router = useRouter();
  const [trends, setTrends] = useState<CurrentAffair[]>([]);
  const { getCurrentTrends, loading } = useAIGeneration();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    try {
      const data = await getCurrentTrends();
      setTrends(data);
    } catch (error) {
      console.error('Failed to fetch trends:', error);
    }
  };

  const categories = [
    { id: 'all', label: 'すべて', icon: Globe },
    { id: 'politics', label: '政治', icon: FileText },
    { id: 'economy', label: '経済', icon: TrendingUp },
    { id: 'society', label: '社会', icon: Globe },
    { id: 'environment', label: '環境', icon: Globe },
    { id: 'technology', label: '科学技術', icon: Lightbulb },
    { id: 'international', label: '国際', icon: Globe },
  ];

  const filteredTrends = selectedCategory === 'all' 
    ? trends 
    : trends.filter(t => t.category === selectedCategory);

  const getImportanceColor = (importance: number) => {
    if (importance >= 4) return 'destructive';
    if (importance >= 3) return 'secondary';
    return 'default';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">時事問題</h1>
        <p className="text-gray-600 mt-2">
          最新の社会問題を把握して、小論文の準備をしましょう
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>2024-2025年の重要トピック</CardTitle>
          <CardDescription>
            大学入試で出題される可能性が高い時事問題
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid grid-cols-7 w-full">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <TabsTrigger key={cat.id} value={cat.id}>
                    <Icon className="mr-2 h-4 w-4" />
                    {cat.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-6 space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                </div>
              ) : filteredTrends.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  該当する時事問題がありません
                </div>
              ) : (
                filteredTrends.map((trend) => (
                  <Card key={trend.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{trend.title}</CardTitle>
                          <CardDescription>{trend.summary}</CardDescription>
                        </div>
                        <Badge variant={getImportanceColor(trend.importance)}>
                          重要度: {trend.importance}/5
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">関連キーワード</h4>
                        <div className="flex flex-wrap gap-2">
                          {trend.keywords.map((keyword) => (
                            <Badge key={keyword} variant="outline">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">想定される小論文テーマ</h4>
                        <ul className="space-y-2">
                          {trend.essayPrompts.map((prompt, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-blue-600 mt-0.5">•</span>
                              <span className="text-sm">{prompt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">関連学部</h4>
                        <div className="flex gap-2">
                          {trend.relevantFaculties?.map((faculty) => (
                            <Badge key={faculty} variant="secondary">
                              {faculty}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button 
                        className="w-full"
                        onClick={() => {
                          // 時事問題を基にした小論文テーマ作成ページへ
                          router.push(`/essay/write?trend=${trend.id}`);
                        }}
                      >
                        この時事問題で小論文を書く
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}