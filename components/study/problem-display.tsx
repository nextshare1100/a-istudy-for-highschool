'use client';

import { useState } from 'react';
import { Problem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { MathDisplay } from '@/components/ui/math-display';

interface ProblemDisplayProps {
  problem: Problem;
  showAnswer?: boolean;
  onShowHint?: () => void;
  hintsUsed: number;
}

export function ProblemDisplay({
  problem,
  showAnswer = false,
  onShowHint,
  hintsUsed,
}: ProblemDisplayProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);

  const handleShowHint = () => {
    if (currentHint < problem.hints.length) {
      setCurrentHint(currentHint + 1);
      onShowHint?.();
    }
  };

  const difficultyColors = {
    basic: 'bg-green-100 text-green-800',
    standard: 'bg-blue-100 text-blue-800',
    advanced: 'bg-orange-100 text-orange-800',
    expert: 'bg-red-100 text-red-800',
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">問題</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">{problem.topic}</Badge>
            {problem.subtopic && (
              <Badge variant="outline">{problem.subtopic}</Badge>
            )}
            <Badge className={cn(difficultyColors[problem.difficulty])}>
              {problem.difficulty === 'basic' && '基礎'}
              {problem.difficulty === 'standard' && '標準'}
              {problem.difficulty === 'advanced' && '応用'}
              {problem.difficulty === 'expert' && '発展'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 問題文 */}
        <div className="space-y-4">
          <div className="text-lg leading-relaxed">
            <MathDisplay content={problem.question} />
          </div>
          
          {/* 問題画像 */}
          {problem.questionImages?.map((imageUrl, index) => (
            <div key={index} className="relative w-full h-64 md:h-96">
              <Image
                src={imageUrl}
                alt={`問題画像${index + 1}`}
                fill
                className="object-contain"
              />
            </div>
          ))}
        </div>

        {/* ヒント */}
        {problem.hints.length > 0 && !showAnswer && (
          <div className="space-y-2">
            {Array.from({ length: currentHint }).map((_, index) => (
              <div
                key={index}
                className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <p className="text-sm">{problem.hints[index]}</p>
                </div>
              </div>
            ))}
            
            {currentHint < problem.hints.length && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowHint}
                className="w-full"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                ヒントを表示 ({currentHint}/{problem.hints.length})
              </Button>
            )}
          </div>
        )}

        {/* 解答・解説 */}
        {showAnswer && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">正解</h3>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <MathDisplay 
                  content={
                    Array.isArray(problem.correctAnswer) 
                      ? problem.correctAnswer.join('、')
                      : problem.correctAnswer
                  } 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant="ghost"
                onClick={() => setShowExplanation(!showExplanation)}
                className="w-full justify-between"
              >
                <span>解説を見る</span>
                <ChevronRight 
                  className={cn(
                    "w-4 h-4 transition-transform",
                    showExplanation && "rotate-90"
                  )}
                />
              </Button>
              
              {showExplanation && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div className="prose prose-sm max-w-none">
                    <MathDisplay content={problem.explanation} />
                  </div>
                  
                  {problem.explanationImages?.map((imageUrl, index) => (
                    <div key={index} className="relative w-full h-64">
                      <Image
                        src={imageUrl}
                        alt={`解説画像${index + 1}`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ))}
                  
                  {problem.relatedConcepts.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm mb-2">関連概念</h4>
                      <div className="flex flex-wrap gap-2">
                        {problem.relatedConcepts.map((concept, index) => (
                          <Badge key={index} variant="secondary">
                            {concept}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {problem.commonMistakes.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm mb-2">
                        よくある間違い
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {problem.commonMistakes.map((mistake, index) => (
                          <li key={index} className="text-sm text-gray-600">
                            {mistake}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}