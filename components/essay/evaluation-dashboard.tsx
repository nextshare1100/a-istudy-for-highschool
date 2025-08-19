import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EssayEvaluation } from '@/types/essay';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface EvaluationDashboardProps {
  evaluation: EssayEvaluation;
  content: string;
}

export function EvaluationDashboard({ evaluation, content }: EvaluationDashboardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* 総合スコア */}
      <Card>
        <CardHeader>
          <CardTitle>評価結果</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className={`text-6xl font-bold ${getScoreColor(evaluation.score)}`}>
              {evaluation.score}
              <span className="text-2xl font-normal text-gray-600">/100</span>
            </div>
            <p className="text-gray-600">{evaluation.overall}</p>
          </div>
        </CardContent>
      </Card>

      {/* 詳細評価 */}
      <Card>
        <CardHeader>
          <CardTitle>詳細評価</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="structure" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="structure">構成</TabsTrigger>
              <TabsTrigger value="content">内容</TabsTrigger>
              <TabsTrigger value="expression">表現</TabsTrigger>
            </TabsList>

            <TabsContent value="structure" className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">構成評価</span>
                <div className="flex items-center gap-2">
                  {getScoreIcon(evaluation.structure.score)}
                  <span className={`font-bold ${getScoreColor(evaluation.structure.score)}`}>
                    {evaluation.structure.score}/100
                  </span>
                </div>
              </div>
              <Progress value={evaluation.structure.score} className="h-3" />
              <p className="text-sm text-gray-600">{evaluation.structure.feedback}</p>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">内容評価</span>
                <div className="flex items-center gap-2">
                  {getScoreIcon(evaluation.content.score)}
                  <span className={`font-bold ${getScoreColor(evaluation.content.score)}`}>
                    {evaluation.content.score}/100
                  </span>
                </div>
              </div>
              <Progress value={evaluation.content.score} className="h-3" />
              <p className="text-sm text-gray-600">{evaluation.content.feedback}</p>
            </TabsContent>

            <TabsContent value="expression" className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">表現評価</span>
                <div className="flex items-center gap-2">
                  {getScoreIcon(evaluation.expression.score)}
                  <span className={`font-bold ${getScoreColor(evaluation.expression.score)}`}>
                    {evaluation.expression.score}/100
                  </span>
                </div>
              </div>
              <Progress value={evaluation.expression.score} className="h-3" />
              <p className="text-sm text-gray-600">{evaluation.expression.feedback}</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 改善提案 */}
      <Card>
        <CardHeader>
          <CardTitle>改善提案</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {evaluation.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="text-sm">{suggestion}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}