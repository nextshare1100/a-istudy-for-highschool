'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { essayService } from '@/lib/firebase/services/essay-service';
import { essayAnalyzer } from '@/lib/essay/essayAnalyzer';
import { EssaySubmission, EssayEvaluation, EssayTheme } from '@/types/essay';
import { Loader2, FileText, BarChart, MessageSquare } from 'lucide-react';

export default function EssayReviewPage() {
  const params = useParams();
  const essayId = params.essayId as string;
  
  const [submission, setSubmission] = useState<EssaySubmission | null>(null);
  const [theme, setTheme] = useState<EssayTheme | null>(null);
  const [evaluation, setEvaluation] = useState<EssayEvaluation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEssayData();
  }, [essayId]);

  const loadEssayData = async () => {
    try {
      const submissionData = await essayService.getSubmission(essayId);
      if (!submissionData) {
        throw new Error('小論文が見つかりません');
      }
      setSubmission(submissionData);

      const themeData = await essayService.getTheme(submissionData.themeId);
      if (themeData) {
        setTheme(themeData);
      }

      // 既存の評価を確認
      if (submissionData.evaluationId) {
        const evalData = await essayService.getEvaluation(submissionData.evaluationId);
        if (evalData) {
          setEvaluation(evalData);
        }
      }
    } catch (err) {
      console.error('データ読み込みエラー:', err);
      setError('データの読み込みに失敗しました');
    }
  };

  const handleAnalyze = async () => {
    if (!submission || !theme) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const analysis = await essayAnalyzer.analyzeEssay(submission, theme);
      setEvaluation(analysis);
      
      // 評価結果を保存
      await essayService.saveEvaluation(analysis);
      await essayService.updateSubmission(submission.id!, {
        evaluationId: analysis.id,
        status: 'evaluated'
      });
    } catch (err) {
      console.error('分析エラー:', err);
      setError('分析に失敗しました');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!submission || !theme) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">小論文レビュー</h1>
        <p className="text-muted-foreground mt-1">{theme.title}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 小論文本文 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                提出内容
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: submission.content }}
              />
              <div className="mt-4 text-sm text-muted-foreground">
                文字数: {submission.wordCount} / {theme.maxLength}文字
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 評価パネル */}
        <div className="space-y-4">
          {!evaluation ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground mb-4">
                  まだ評価されていません
                </p>
                <Button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <BarChart className="mr-2 h-4 w-4" />
                      AI分析を実行
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 総合スコア */}
              <Card>
                <CardHeader>
                  <CardTitle>総合評価</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">
                      {evaluation.overallScore}
                    </div>
                    <div className="text-sm text-muted-foreground">/ 100点</div>
                  </div>
                  <Progress value={evaluation.overallScore} className="mt-4" />
                </CardContent>
              </Card>

              {/* 項目別スコア */}
              <Card>
                <CardHeader>
                  <CardTitle>項目別評価</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(evaluation.scores).map(([key, score]) => (
                    <div key={key}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">
                          {key === 'structure' && '構成'}
                          {key === 'logic' && '論理性'}
                          {key === 'specificity' && '具体性'}
                          {key === 'expression' && '表現力'}
                          {key === 'relevance' && 'テーマ適合性'}
                        </span>
                        <span className="text-sm font-medium">
                          {score.score}/10
                        </span>
                      </div>
                      <Progress value={score.score * 10} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* 詳細フィードバック */}
      {evaluation && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              詳細フィードバック
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="strengths">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="strengths">良い点</TabsTrigger>
                <TabsTrigger value="improvements">改善点</TabsTrigger>
                <TabsTrigger value="suggestions">提案</TabsTrigger>
              </TabsList>
              
              <TabsContent value="strengths" className="mt-4">
                <ul className="list-disc pl-5 space-y-1">
                  {evaluation.feedback.strengths.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </TabsContent>
              
              <TabsContent value="improvements" className="mt-4">
                <ul className="list-disc pl-5 space-y-1">
                  {evaluation.feedback.improvements.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </TabsContent>
              
              <TabsContent value="suggestions" className="mt-4">
                <ul className="list-disc pl-5 space-y-1">
                  {evaluation.feedback.suggestions.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
