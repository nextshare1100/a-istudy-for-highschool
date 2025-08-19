'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { useAIGeneration } from '@/hooks/use-ai-generation';
import { InterviewQuestion } from '@/types/interview';

interface AIQuestionGeneratorProps {
  onQuestionsGenerated: (questions: InterviewQuestion[]) => void;
}

export function AIQuestionGenerator({ onQuestionsGenerated }: AIQuestionGeneratorProps) {
  const { loading, generateInterviewQuestions } = useAIGeneration();
  const [params, setParams] = useState({
    category: 'motivation',
    difficulty: 'medium',
    university: '',
    faculty: '',
  });

  const handleGenerate = async () => {
    try {
      const questions = await generateInterviewQuestions(params);
      onQuestionsGenerated(questions);
    } catch (error) {
      console.error('Failed to generate questions:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          AI質問生成
        </CardTitle>
        <CardDescription>
          条件を指定して、AIが面接質問を生成します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">カテゴリ</Label>
            <Select
              value={params.category}
              onValueChange={(value) => setParams({ ...params, category: value })}
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="motivation">志望動機</SelectItem>
                <SelectItem value="self_pr">自己PR</SelectItem>
                <SelectItem value="student_life">学生生活</SelectItem>
                <SelectItem value="future_goals">将来の目標</SelectItem>
                <SelectItem value="academic">学業</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="difficulty">難易度</Label>
            <Select
              value={params.difficulty}
              onValueChange={(value) => setParams({ ...params, difficulty: value })}
            >
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">初級</SelectItem>
                <SelectItem value="medium">中級</SelectItem>
                <SelectItem value="hard">上級</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="university">大学名（任意）</Label>
            <Input
              id="university"
              placeholder="例: 東京大学"
              value={params.university}
              onChange={(e) => setParams({ ...params, university: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="faculty">学部（任意）</Label>
            <Input
              id="faculty"
              placeholder="例: 工学部"
              value={params.faculty}
              onChange={(e) => setParams({ ...params, faculty: e.target.value })}
            />
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              質問を生成
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}