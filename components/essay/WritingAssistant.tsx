'use client';

import React, { useState, useEffect } from 'react';
import { Lightbulb, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

interface WritingAssistantProps {
  content: string;
  theme: any;
  wordCount: number;
  timeLeft: number;
}

export const WritingAssistant: React.FC<WritingAssistantProps> = ({
  content,
  theme,
  wordCount,
  timeLeft
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [structure, setStructure] = useState<any>(null);
  
  useEffect(() => {
    const analyzePacing = () => {
      const progress = wordCount / theme.wordLimit;
      const timeProgress = 1 - (timeLeft / (theme.timeLimit * 60));
      
      if (timeProgress > 0.5 && progress < 0.3) {
        setSuggestions(prev => [...prev, {
          type: 'warning',
          message: '時間に対して進捗が遅れています。要点を整理して書きましょう。'
        }]);
      }
      
      // 構成チェック
      const paragraphs = content.split('\n\n').filter(p => p.trim());
      if (paragraphs.length >= 3 && !structure) {
        setStructure({
          intro: paragraphs[0].length,
          body: paragraphs.slice(1, -1).reduce((sum, p) => sum + p.length, 0),
          conclusion: paragraphs[paragraphs.length - 1]?.length || 0
        });
      }
    };
    
    const timer = setTimeout(analyzePacing, 5000);
    return () => clearTimeout(timer);
  }, [content, wordCount, timeLeft, theme]);
  
  return (
    <div className="writing-assistant">
      <h4>執筆アシスタント</h4>
      
      {/* ペース配分 */}
      <div className="pacing-meter">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${(wordCount / theme.wordLimit) * 100}%` }}
          />
        </div>
        <span>{Math.round((wordCount / theme.wordLimit) * 100)}% 完成</span>
      </div>
      
      {/* リアルタイムヒント */}
      <div className="suggestions">
        {suggestions.map((suggestion, index) => (
          <div key={index} className={`suggestion ${suggestion.type}`}>
            {suggestion.type === 'warning' ? <AlertCircle /> : <Lightbulb />}
            <span>{suggestion.message}</span>
          </div>
        ))}
      </div>
      
      {/* 構成分析 */}
      {structure && (
        <div className="structure-analysis">
          <h5>構成バランス</h5>
          <div className="structure-bars">
            <div className="bar intro" style={{ height: `${structure.intro / 10}px` }}>
              序論
            </div>
            <div className="bar body" style={{ height: `${structure.body / 20}px` }}>
              本論
            </div>
            <div className="bar conclusion" style={{ height: `${structure.conclusion / 10}px` }}>
              結論
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
