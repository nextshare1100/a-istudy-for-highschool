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
    <Card className="w-full max-w-md mx-auto my-4 md:my-6">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
          AI質問生成
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          条件を指定して、AIが面接質問を生成します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-sm">カテゴリ</Label>
            <Select
              value={params.category}
              onValueChange={(value) => setParams({ ...params, category: value })}
            >
              <SelectTrigger id="category" className="h-9 md:h-10 text-sm">
                <SelectValue placeholder="カテゴリを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="motivation">志望動機</SelectItem>
                <SelectItem value="academic">学業・研究</SelectItem>
                <SelectItem value="future">将来の目標</SelectItem>
                <SelectItem value="personal">人物像</SelectItem>
                <SelectItem value="current_affairs">時事問題</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="difficulty" className="text-sm">難易度</Label>
            <Select
              value={params.difficulty}
              onValueChange={(value) => setParams({ ...params, difficulty: value })}
            >
              <SelectTrigger id="difficulty" className="h-9 md:h-10 text-sm">
                <SelectValue placeholder="難易度を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">初級</SelectItem>
                <SelectItem value="medium">中級</SelectItem>
                <SelectItem value="hard">上級</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="university" className="text-sm">志望大学（任意）</Label>
            <Input
              id="university"
              placeholder="例: 東京大学"
              value={params.university}
              onChange={(e) => setParams({ ...params, university: e.target.value })}
              className="h-9 md:h-10 text-sm"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="faculty" className="text-sm">志望学部（任意）</Label>
            <Input
              id="faculty"
              placeholder="例: 工学部"
              value={params.faculty}
              onChange={(e) => setParams({ ...params, faculty: e.target.value })}
              className="h-9 md:h-10 text-sm"
            />
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full h-9 md:h-10 text-sm md:text-base"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-3 w-3 md:h-4 md:w-4" />
              質問を生成
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
