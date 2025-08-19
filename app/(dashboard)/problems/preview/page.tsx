'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ChevronRight, BookOpen, Brain, Target, Zap, Loader2, 
  PenTool, FileText, Calculator, BarChart, Eye, EyeOff, 
  CheckCircle, Circle, Info, AlertCircle, TrendingUp, Clock,
  Award, Lightbulb, Grid3X3, Type, BookOpenCheck, MessageSquare,
  RefreshCw, XCircle, ArrowLeft
} from 'lucide-react';

// 型定義
interface GenerateProblemRequest {
  subject: string;
  topic: string;
  difficulty: string;
  type: string;
  includeCanvas: boolean;
  additionalRequirements: string;
}

interface Problem {
  id: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: string;
  type: string;
  content: {
    question: string;
    options?: string[];
    answer: string | string[];
    explanation: string;
    hints?: string[];
    canvasData?: any;
    estimatedTime?: number;
  };
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// CircleDot アイコンコンポーネント
const CircleDot: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);

// スタイルオブジェクト
const styles = {
  pageContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #dbeafe 100%)',
    position: 'relative' as const,
  },
  mainCard: {
    background: 'linear-gradient(135deg, #ffffff 95%, #f9fafb 100%)',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.1)',
    padding: '32px',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  stepNumber: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
  },
  categoryButton: {
    base: {
      position: 'relative' as const,
      padding: '24px',
      borderRadius: '20px',
      border: '2px solid #e5e7eb',
      background: 'white',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      transform: 'translateY(0)',
    },
    hover: {
      transform: 'translateY(-4px) scale(1.02)',
      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
      borderColor: '#c7d2fe',
    },
    selected: {
      background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
      border: '2px solid #6366f1',
      transform: 'scale(1.05)',
      boxShadow: '0 12px 32px rgba(99, 102, 241, 0.2)',
    }
  },
  iconBox: {
    base: {
      padding: '12px',
      borderRadius: '12px',
      background: '#f3f4f6',
      color: '#6b7280',
      transition: 'all 0.3s ease',
    },
    selected: {
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      color: 'white',
      transform: 'scale(1.1)',
      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
    }
  },
  subjectButton: {
    base: {
      position: 'relative' as const,
      padding: '20px',
      borderRadius: '16px',
      border: '2px solid #e5e7eb',
      background: 'white',
      textAlign: 'left' as const,
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    },
    hover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
      borderColor: '#c7d2fe',
      background: '#fafbff',
    },
    selected: {
      background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
      border: '2px solid #6366f1',
      transform: 'scale(1.02)',
      boxShadow: '0 8px 20px rgba(99, 102, 241, 0.15)',
    }
  },
  topicButton: {
    base: {
      position: 'relative' as const,
      padding: '16px',
      borderRadius: '12px',
      border: '2px solid #e5e7eb',
      background: 'white',
      textAlign: 'left' as const,
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      fontSize: '14px',
    },
    hover: {
      transform: 'translateX(4px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      borderColor: '#86efac',
      background: '#f0fdf4',
    },
    selected: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
      transform: 'scale(1.02)',
      boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)',
      fontWeight: '600',
    }
  },
  difficultyButton: {
    base: {
      position: 'relative' as const,
      padding: '24px',
      borderRadius: '20px',
      border: '2px solid #e5e7eb',
      background: 'white',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      overflow: 'hidden',
    },
    selected: {
      borderColor: '#6b7280',
      boxShadow: '0 16px 32px rgba(0, 0, 0, 0.1)',
      transform: 'scale(1.05)',
    }
  },
  problemTypeButton: {
    base: {
      position: 'relative' as const,
      padding: '20px',
      borderRadius: '20px',
      border: '2px solid #e5e7eb',
      background: 'white',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      overflow: 'hidden',
    },
    hover: {
      transform: 'translateY(-4px) scale(1.02)',
      boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
      borderColor: '#c084fc',
    },
    selected: {
      borderColor: '#9333ea',
      boxShadow: '0 16px 32px rgba(147, 51, 234, 0.2)',
      transform: 'scale(1.05)',
    }
  },
  generateButton: {
    padding: '20px 48px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #9333ea 0%, #6366f1 100%)',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '18px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 8px 24px rgba(147, 51, 234, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  checkmark: {
    position: 'absolute' as const,
    top: '-8px',
    right: '-8px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    borderRadius: '50%',
    padding: '4px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    animation: 'bounce 0.5s ease',
  }
};

// 解答表示コンポーネント
const ShowAnswerSection: React.FC<{ problem: Problem; mode: 'preview' | 'solve' }> = ({ problem, mode }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);

  const hints = problem.content.hints || [];

  // 解答モードでは最初は答えを隠す
  useEffect(() => {
    if (mode === 'solve') {
      setShowAnswer(false);
      setShowHint(false);
      setHintLevel(0);
    }
  }, [mode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ヒントセクション */}
      {hints.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 8px 24px rgba(251, 191, 36, 0.2)',
          border: '1px solid #fbbf24',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                padding: '8px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '8px',
                color: 'white',
                boxShadow: '0 4px 8px rgba(245, 158, 11, 0.3)',
              }}>
                <Lightbulb size={20} />
              </div>
              ヒント
            </h3>
            <button
              onClick={() => {
                if (!showHint) {
                  setShowHint(true);
                  setHintLevel(1);
                } else if (hintLevel < hints.length) {
                  setHintLevel(hintLevel + 1);
                } else {
                  setShowHint(false);
                  setHintLevel(0);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: '#fef3c7',
                color: '#92400e',
                borderRadius: '8px',
                border: '1px solid #fbbf24',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#fde68a';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fef3c7';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Eye size={20} />
              {!showHint ? 'ヒントを見る' : hintLevel < hints.length ? `次のヒント (${hintLevel}/${hints.length})` : 'ヒントを隠す'}
            </button>
          </div>
          
          {showHint && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {hints.slice(0, hintLevel).map((hint, index) => (
                <div key={index} style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '12px',
                  border: '1px solid #fbbf24',
                  animation: 'fadeIn 0.3s ease',
                }}>
                  <p style={{ color: '#92400e' }}>
                    <span style={{ fontWeight: 'bold' }}>ヒント{index + 1}: </span>
                    {hint}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 解答・解説セクション */}
      <div style={{
        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 8px 24px rgba(16, 185, 129, 0.2)',
        border: '1px solid #34d399',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              padding: '8px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '8px',
              color: 'white',
              boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)',
            }}>
              <CheckCircle size={20} />
            </div>
            解答・解説
          </h3>
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: showAnswer ? '#e5e7eb' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: showAnswer ? '#374151' : 'white',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
              boxShadow: showAnswer ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {showAnswer ? <EyeOff size={20} /> : <Eye size={20} />}
            {showAnswer ? '解答を隠す' : '解答を見る'}
          </button>
        </div>

        {showAnswer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.3s ease' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #34d399',
            }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={16} />
                解答
              </h4>
              <p style={{ color: '#065f46', fontSize: '18px', fontWeight: '500' }}>
                {Array.isArray(problem.content.answer) 
                  ? problem.content.answer.join(', ') 
                  : problem.content.answer}
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #34d399',
            }}>
              <h4 style={{ fontWeight: 'bold', marginBottom: '12px', color: '#064e3b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpenCheck size={16} />
                解説
              </h4>
              <p style={{ whiteSpace: 'pre-wrap', color: '#065f46', lineHeight: '1.6' }}>
                {problem.content.explanation}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 問題解答コンポーネント
const SolveProblemSection: React.FC<{ 
  problem: Problem; 
  onComplete: (result: { correct: boolean; timeSpent: number; attempts: number }) => void;
  onBack: () => void;
}> = ({ problem, onComplete, onBack }) => {
  const [selectedChoice, setSelectedChoice] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [userAnswers, setUserAnswers] = useState<string[]>([]); // 穴埋め問題用
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [partialScore, setPartialScore] = useState(0); // 部分点

  // 穴埋め問題の初期化
  useEffect(() => {
    if (problem.type === 'fill_in_blank' && problem.content.answer && Array.isArray(problem.content.answer)) {
      setUserAnswers(new Array(problem.content.answer.length).fill(''));
    }
  }, [problem]);

  // タイマー更新
  useEffect(() => {
    if (!submitted) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [startTime, submitted]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // キーワード抽出関数（記述問題の採点用）
  const extractKeywords = (text: string): string[] => {
    const keywords: string[] = [];
    
    // 「」で囲まれた用語を抽出
    const quotedTerms = text.match(/「([^」]+)」/g);
    if (quotedTerms) {
      keywords.push(...quotedTerms.map(term => term.replace(/[「」]/g, '')));
    }
    
    // 重要そうな専門用語のパターン
    const importantPatterns = [
      /[ぁ-んァ-ヶー一-龠０-９ａ-ｚＡ-Ｚ]+(?:法|定理|原理|効果|現象|反応|構造|機能|システム|理論)/g,
    ];
    
    importantPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        keywords.push(...matches.filter(m => m.length > 2));
      }
    });
    
    return [...new Set(keywords)];
  };

  // 記述問題の採点（キーワードベース）
  const scoreEssayAnswer = (userAnswer: string, modelAnswer: string): { score: number; matchedKeywords: string[]; missingKeywords: string[] } => {
    const keywords = extractKeywords(modelAnswer);
    const userAnswerLower = userAnswer.toLowerCase();
    const matchedKeywords: string[] = [];
    const missingKeywords: string[] = [];

    keywords.forEach(keyword => {
      if (userAnswerLower.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    });

    const score = keywords.length > 0 ? (matchedKeywords.length / keywords.length) * 100 : 0;
    return { score, matchedKeywords, missingKeywords };
  };

  const handleSubmit = () => {
    let correct = false;
    let score = 0;
    
    if (problem.type === 'multiple_choice' && problem.content.options) {
      // 選択式の場合
      const correctAnswer = problem.content.answer.toString();
      const selectedOption = problem.content.options[parseInt(selectedChoice)];
      correct = selectedOption === correctAnswer;
      score = correct ? 100 : 0;
    } else if (problem.type === 'fill_in_blank' && Array.isArray(problem.content.answer)) {
      // 穴埋め問題の場合
      let correctCount = 0;
      problem.content.answer.forEach((answer, index) => {
        if (userAnswers[index]?.trim().toLowerCase() === answer.toString().toLowerCase()) {
          correctCount++;
        }
      });
      score = (correctCount / problem.content.answer.length) * 100;
      correct = score === 100;
    } else if (problem.type === 'calculation') {
      // 計算問題の場合（数値の許容誤差を考慮）
      const correctAnswer = parseFloat(problem.content.answer.toString());
      const userAnswerNum = parseFloat(userAnswer);
      if (!isNaN(correctAnswer) && !isNaN(userAnswerNum)) {
        const tolerance = Math.abs(correctAnswer) * 0.01; // 1%の誤差を許容
        correct = Math.abs(correctAnswer - userAnswerNum) <= tolerance;
        score = correct ? 100 : 0;
      } else {
        correct = userAnswer.trim().toLowerCase() === problem.content.answer.toString().toLowerCase();
        score = correct ? 100 : 0;
      }
    } else if (problem.type === 'essay' || problem.type === 'descriptive') {
      // 記述式の場合（キーワードベースの採点）
      const result = scoreEssayAnswer(userAnswer, problem.content.answer.toString());
      score = result.score;
      correct = score >= 80; // 80%以上で正解とする
    } else {
      // その他の場合（完全一致）
      correct = userAnswer.trim().toLowerCase() === problem.content.answer.toString().toLowerCase();
      score = correct ? 100 : 0;
    }

    setPartialScore(score);
    setIsCorrect(correct);
    setSubmitted(true);
    setAttempts(attempts + 1);

    // 正解の場合は自動的に解説を表示
    if (correct) {
      setTimeout(() => setShowExplanation(true), 1000);
    }
  };

  const handleRetry = () => {
    setSubmitted(false);
    setIsCorrect(false);
    setShowExplanation(false);
    setSelectedChoice('');
    setUserAnswer('');
    setUserAnswers(new Array(userAnswers.length).fill(''));
    setPartialScore(0);
  };

  const handleComplete = () => {
    onComplete({
      correct: isCorrect,
      timeSpent: elapsedTime,
      attempts: attempts
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#6366f1';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <ArrowLeft size={16} />
          問題選択に戻る
        </button>

        {!submitted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
            <Clock size={20} />
            <span style={{ fontFamily: 'monospace', fontSize: '18px' }}>{formatTime(elapsedTime)}</span>
          </div>
        )}
      </div>

      {/* 問題情報 */}
      <div style={styles.mainCard}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
          <span style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
            color: '#1e3a8a',
            borderRadius: '9999px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          }}>
            {(() => {
              for (const [catKey, catData] of Object.entries(SUBJECT_CATEGORIES)) {
                if (catData.subjects[problem.subject as keyof typeof catData.subjects]) {
                  return catData.subjects[problem.subject as keyof typeof catData.subjects].name;
                }
              }
              return problem.subject;
            })()}
          </span>
          <span style={{
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
            color: '#064e3b',
            borderRadius: '9999px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          }}>
            {problem.topic}
          </span>
          <span style={{
            padding: '8px 16px',
            background: DIFFICULTY_LEVELS.find(d => d.value === problem.difficulty)?.bgColor,
            color: DIFFICULTY_LEVELS.find(d => d.value === problem.difficulty)?.textColor,
            borderRadius: '9999px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          }}>
            難易度: {DIFFICULTY_LEVELS.find(d => d.value === problem.difficulty)?.name}
          </span>
        </div>

        {/* 問題文 */}
        <div style={{
          marginBottom: '32px',
          padding: '24px',
          background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
          borderRadius: '16px',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              padding: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(99, 102, 241, 0.3)',
            }}>
              <Brain size={24} />
            </div>
            問題
          </h2>
          <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#1f2937' }}>
            {problem.content.question}
          </p>
        </div>

        {/* 回答エリア */}
        {!showExplanation && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={20} color="#f59e0b" />
              回答
            </h3>

            {problem.type === 'multiple_choice' && problem.content.options ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {problem.content.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => !submitted && setSelectedChoice(String(index))}
                    disabled={submitted}
                    style={{
                      width: '100%',
                      padding: '16px',
                      textAlign: 'left',
                      borderRadius: '12px',
                      border: '2px solid',
                      borderColor: submitted
                        ? selectedChoice === String(index)
                          ? isCorrect ? '#10b981' : '#ef4444'
                          : problem.content.options![index] === problem.content.answer ? '#10b981' : '#e5e7eb'
                        : selectedChoice === String(index) ? '#6366f1' : '#e5e7eb',
                      background: submitted
                        ? selectedChoice === String(index)
                          ? isCorrect ? '#d1fae5' : '#fee2e2'
                          : problem.content.options![index] === problem.content.answer ? '#d1fae5' : '#f9fafb'
                        : selectedChoice === String(index) ? '#eff6ff' : 'white',
                      cursor: submitted ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: submitted ? 0.8 : 1,
                    }}
                  >
                    <span style={{ fontWeight: '500' }}>
                      {String.fromCharCode(65 + index)}) {option}
                    </span>
                    {submitted && problem.content.options![index] === problem.content.answer && (
                      <CheckCircle size={20} color="#10b981" style={{ display: 'inline-block', marginLeft: '8px', verticalAlign: 'middle' }} />
                    )}
                    {submitted && selectedChoice === String(index) && !isCorrect && (
                      <XCircle size={20} color="#ef4444" style={{ display: 'inline-block', marginLeft: '8px', verticalAlign: 'middle' }} />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={submitted}
                placeholder="回答を入力してください"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  minHeight: '150px',
                  resize: 'vertical',
                  fontSize: '16px',
                  background: submitted ? '#f9fafb' : 'white',
                  cursor: submitted ? 'not-allowed' : 'text',
                }}
              />
            )}
          </div>
        )}

        {/* 提出ボタン・結果表示 */}
        {!showExplanation && (
          <div style={{ textAlign: 'center' }}>
            {!submitted ? (
              <button
                onClick={handleSubmit}
                disabled={
                  problem.type === 'multiple_choice' ? !selectedChoice : 
                  problem.type === 'fill_in_blank' ? userAnswers.some(a => !a.trim()) :
                  !userAnswer.trim()
                }
                style={{
                  ...styles.generateButton,
                  opacity: (
                    problem.type === 'multiple_choice' ? !selectedChoice : 
                    problem.type === 'fill_in_blank' ? userAnswers.some(a => !a.trim()) :
                    !userAnswer.trim()
                  ) ? 0.5 : 1,
                  cursor: (
                    problem.type === 'multiple_choice' ? !selectedChoice : 
                    problem.type === 'fill_in_blank' ? userAnswers.some(a => !a.trim()) :
                    !userAnswer.trim()
                  ) ? 'not-allowed' : 'pointer',
                }}
              >
                回答を提出
                <ChevronRight size={24} />
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  background: isCorrect ? '#d1fae5' : '#fee2e2',
                  color: isCorrect ? '#064e3b' : '#7f1d1d',
                }}>
                  {isCorrect ? (
                    <>
                      <CheckCircle size={32} />
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>正解！</p>
                        <p style={{ fontSize: '14px' }}>素晴らしい！よくできました。</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle size={32} />
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
                          {(problem.type === 'essay' || problem.type === 'descriptive') && partialScore > 0
                            ? `部分点: ${Math.round(partialScore)}%`
                            : '不正解'}
                        </p>
                        <p style={{ fontSize: '14px' }}>
                          {(problem.type === 'essay' || problem.type === 'descriptive')
                            ? '解説を確認して理解を深めましょう'
                            : 'もう一度考えてみましょう'}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  {!isCorrect && !(problem.type === 'essay' || problem.type === 'descriptive') && (
                    <button
                      onClick={handleRetry}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 24px',
                        background: 'white',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#6366f1';
                        e.currentTarget.style.background = '#f0f9ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.background = 'white';
                      }}
                    >
                      <RefreshCw size={16} />
                      もう一度挑戦
                    </button>
                  )}
                  <button
                    onClick={() => setShowExplanation(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      color: 'white',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                      transition: 'all 0.2s ease',
                      border: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                    }}
                  >
                    <BookOpen size={16} />
                    解説を見る
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 解説表示 */}
      {showExplanation && (
        <>
          <ShowAnswerSection problem={problem} mode="solve" />
          
          {/* 学習成果 */}
          <div style={styles.mainCard}>
            <h4 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} color="#f59e0b" />
              学習成果
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
              textAlign: 'center',
            }}>
              <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '12px' }}>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>解答時間</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>{formatTime(elapsedTime)}</p>
              </div>
              <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '12px' }}>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>試行回数</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>{attempts}回</p>
              </div>
              <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '12px' }}>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>正答率</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                  {(problem.type === 'essay' || problem.type === 'descriptive')
                    ? `${Math.round(partialScore)}%`
                    : problem.type === 'fill_in_blank' && submitted
                      ? `${Math.round(partialScore)}%`
                      : isCorrect ? '100%' : '0%'}
                </p>
              </div>
              <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '12px' }}>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>難易度</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                  {DIFFICULTY_LEVELS.find(d => d.value === problem.difficulty)?.name}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                onClick={handleComplete}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }}
              >
                学習を完了
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// 教科と科目の定義
const SUBJECT_CATEGORIES = {
  mathematics: {
    name: '数学',
    icon: <Calculator className="h-5 w-5" />,
    color: 'blue',
    subjects: {
      math1a: {
        name: '数学Ⅰ・A',
        topics: [
          '数と式',
          '集合と論理',
          '2次関数',
          '図形と計量',
          '三角比',
          '場合の数と確率',
          '整数の性質',
          '図形の性質'
        ]
      },
      math2b: {
        name: '数学Ⅱ・B',
        topics: [
          '式と証明',
          '複素数と方程式',
          '図形と方程式',
          '三角関数',
          '指数関数・対数関数',
          '微分法',
          '積分法',
          'ベクトル',
          '数列'
        ]
      },
      math3: {
        name: '数学Ⅲ',
        topics: [
          '複素数平面',
          '極限',
          '微分法',
          '微分法の応用',
          '積分法',
          '積分法の応用',
          '2次曲線',
          '媒介変数表示と極座標'
        ]
      }
    }
  },
  japanese: {
    name: '国語',
    icon: <Type className="h-5 w-5" />,
    color: 'purple',
    subjects: {
      modernJapanese: {
        name: '現代文',
        topics: [
          '評論',
          '小説',
          '随筆',
          '詩歌',
          '論理的文章',
          '実用的文章'
        ]
      },
      classicalJapanese: {
        name: '古文',
        topics: [
          '古文単語',
          '古典文法',
          '物語（源氏・竹取等）',
          '日記・随筆（枕草子・更級日記等）',
          '和歌・歌論',
          '説話・軍記'
        ]
      },
      classicalChinese: {
        name: '漢文',
        topics: [
          '漢文句法',
          '故事成語',
          '思想（論語・孟子等）',
          '史伝',
          '詩文',
          '日本漢文'
        ]
      }
    }
  },
  english: {
    name: '英語',
    icon: <MessageSquare className="h-5 w-5" />,
    color: 'indigo',
    subjects: {
      english: {
        name: '英語',
        topics: [
          '語彙・イディオム',
          '文法・語法',
          '長文読解',
          'リスニング',
          '英作文',
          'コミュニケーション英語'
        ]
      }
    }
  },
  science: {
    name: '理科',
    icon: <Brain className="h-5 w-5" />,
    color: 'green',
    subjects: {
      physics: {
        name: '物理',
        topics: [
          '力学（運動の法則）',
          '力学（エネルギーと運動量）',
          '熱力学',
          '波動',
          '電磁気',
          '原子物理'
        ]
      },
      chemistry: {
        name: '化学',
        topics: [
          '物質の構成',
          '物質の変化と平衡',
          '無機物質',
          '有機化合物',
          '高分子化合物',
          '化学反応とエネルギー'
        ]
      },
      biology: {
        name: '生物',
        topics: [
          '生命現象と物質',
          '生殖と発生',
          '生物の環境応答',
          '生態と環境',
          '生物の進化と系統',
          '遺伝情報の発現と発生'
        ]
      },
      earthScience: {
        name: '地学',
        topics: [
          '地球の構成と活動',
          '大気と海洋',
          '宇宙の構成',
          '地球の歴史',
          '地球環境',
          '自然災害'
        ]
      }
    }
  },
  socialStudies: {
    name: '社会',
    icon: <BookOpen className="h-5 w-5" />,
    color: 'orange',
    subjects: {
      japaneseHistory: {
        name: '日本史',
        topics: [
          '原始・古代',
          '中世',
          '近世',
          '近代（明治・大正）',
          '近代（昭和戦前）',
          '現代（戦後）',
          '文化史',
          'テーマ史'
        ]
      },
      worldHistory: {
        name: '世界史',
        topics: [
          '古代オリエント・ギリシア・ローマ',
          '中世ヨーロッパ',
          'イスラーム世界',
          '中国史',
          '近代ヨーロッパ',
          '帝国主義と世界大戦',
          '現代世界',
          '文化史・地域史'
        ]
      },
      geography: {
        name: '地理',
        topics: [
          '地図と地理情報',
          '自然環境（地形・気候）',
          '資源と産業',
          '人口・都市・村落',
          '生活文化と民族・宗教',
          '現代世界の諸地域',
          '日本の地理',
          '地球的課題'
        ]
      },
      civics: {
        name: '現代社会',
        topics: [
          '現代の政治',
          '現代の経済',
          '現代社会の諸課題',
          '倫理分野',
          '国際社会'
        ]
      },
      ethics: {
        name: '倫理',
        topics: [
          '青年期の課題',
          '西洋思想',
          '東洋思想',
          '日本思想',
          '現代の倫理的課題'
        ]
      },
      politicsEconomics: {
        name: '政治・経済',
        topics: [
          '民主政治の基本原理',
          '日本国憲法',
          '現代日本の政治',
          '現代の経済',
          '日本経済',
          '国際政治',
          '国際経済'
        ]
      }
    }
  }
};

// 難易度レベル
const DIFFICULTY_LEVELS = [
  { 
    id: 'high_basic', 
    name: '基礎', 
    difficulty: '偏差値 45~55', 
    value: 'easy', 
    color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    bgColor: '#d1fae5',
    textColor: '#064e3b',
    icon: <Circle className="h-4 w-4" />,
    description: '教科書の例題レベル'
  },
  { 
    id: 'high_standard', 
    name: '標準', 
    difficulty: '偏差値 55~65', 
    value: 'medium', 
    color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    bgColor: '#dbeafe',
    textColor: '#1e3a8a',
    icon: <CircleDot className="h-4 w-4" />,
    description: 'センター試験レベル'
  },
  { 
    id: 'high_advanced', 
    name: '発展', 
    difficulty: '偏差値 65~70', 
    value: 'hard', 
    color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    bgColor: '#e9d5ff',
    textColor: '#581c87',
    icon: <Target className="h-4 w-4" />,
    description: '難関大学入試レベル'
  },
  { 
    id: 'top_university', 
    name: '最難関', 
    difficulty: '偏差値 70~75', 
    value: 'expert', 
    color: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    bgColor: '#fee2e2',
    textColor: '#7f1d1d',
    icon: <Award className="h-4 w-4" />,
    description: '最難関大学・オリンピックレベル'
  },
];

// 問題形式
const PROBLEM_TYPES = [
  { 
    id: 'multiple_choice', 
    name: '選択問題', 
    description: '4つの選択肢から正解を選ぶ', 
    icon: <Grid3X3 className="h-5 w-5" />,
    color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
  },
  { 
    id: 'fill_in_blank', 
    name: '穴埋め問題', 
    description: '空欄に適切な答えを記入', 
    icon: <Type className="h-5 w-5" />,
    color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
  },
  { 
    id: 'essay', 
    name: '記述問題', 
    description: '詳細な説明を記述する', 
    icon: <FileText className="h-5 w-5" />,
    color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
  },
  { 
    id: 'calculation', 
    name: '計算問題', 
    description: '数値を求める', 
    icon: <Calculator className="h-5 w-5" />,
    color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
  },
  { 
    id: 'graph', 
    name: 'グラフ問題', 
    description: 'グラフを読み取る・描く', 
    icon: <BarChart className="h-5 w-5" />,
    color: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
  },
  { 
    id: 'diagram', 
    name: '図形問題', 
    description: '図形を扱う問題', 
    icon: <PenTool className="h-5 w-5" />,
    color: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
  },
];

// Canvasコンポーネントのプレースホルダー
const ProblemCanvas: React.FC<{ subjectType: string; readOnly: boolean; showGrid: boolean }> = ({ subjectType, readOnly, showGrid }) => {
  return (
    <div style={{
      height: '384px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9fafb',
      borderRadius: '12px',
      border: '2px dashed #d1d5db',
    }}>
      <div style={{ textAlign: 'center' }}>
        <Grid3X3 size={48} color="#9ca3af" style={{ margin: '0 auto 12px' }} />
        <p style={{ color: '#6b7280' }}>図形・グラフ表示エリア</p>
        <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '8px' }}>
          実際の実装では Canvas が表示されます
        </p>
      </div>
    </div>
  );
};

export default function CreateProblemPage() {
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState<GenerateProblemRequest>({
    subject: '',
    topic: '',
    difficulty: 'medium',
    type: 'multiple_choice',
    includeCanvas: false,
    additionalRequirements: ''
  });
  const [generatedProblem, setGeneratedProblem] = useState<Problem | null>(null);
  const [mode, setMode] = useState<'generate' | 'preview' | 'solve'>('generate');
  const [solveResult, setSolveResult] = useState<{ correct: boolean; timeSpent: number; attempts: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    
    // シミュレート：実際にはAPIを呼び出す
    setTimeout(() => {
      // ダミーの問題データを生成
      const dummyProblem: Problem = {
        id: 'preview',
        title: '二次関数の最大値・最小値問題',
        subject: formData.subject,
        topic: formData.topic,
        difficulty: formData.difficulty,
        type: formData.type,
        content: {
          question: `二次関数 f(x) = -x² + 4x + 5 について、次の問いに答えなさい。

(1) この関数の頂点の座標を求めなさい。
(2) x の定義域が -1 ≤ x ≤ 3 のとき、f(x) の最大値と最小値を求めなさい。`,
          options: formData.type === 'multiple_choice' ? [
            '最大値: 9 (x = 2), 最小値: 0 (x = -1)',
            '最大値: 9 (x = 2), 最小値: 2 (x = 3)',
            '最大値: 8 (x = 1), 最小値: 0 (x = -1)',
            '最大値: 8 (x = 1), 最小値: 2 (x = 3)'
          ] : undefined,
          answer: formData.type === 'multiple_choice' 
            ? '最大値: 9 (x = 2), 最小値: 0 (x = -1)'
            : '(1) 頂点の座標: (2, 9)\n(2) 最大値: 9 (x = 2 のとき), 最小値: 0 (x = -1 のとき)',
          explanation: `(1) f(x) = -x² + 4x + 5 を平方完成すると：
f(x) = -(x² - 4x) + 5
     = -(x² - 4x + 4 - 4) + 5
     = -(x - 2)² + 4 + 5
     = -(x - 2)² + 9

よって、頂点の座標は (2, 9) です。

(2) グラフは下に凸の放物線で、頂点が (2, 9) です。
定義域 -1 ≤ x ≤ 3 において：
- x = 2 で最大値 9 をとります
- 端点での値を計算すると：
  f(-1) = -(-1)² + 4(-1) + 5 = -1 - 4 + 5 = 0
  f(3) = -(3)² + 4(3) + 5 = -9 + 12 + 5 = 8
  
したがって、最小値は 0 (x = -1 のとき) です。`,
          hints: [
            '平方完成を使って頂点の座標を求めましょう',
            '定義域の端点での値も忘れずに計算しましょう',
            'グラフの概形を描いてみると分かりやすいです'
          ],
          canvasData: formData.includeCanvas ? {} : undefined,
          estimatedTime: 15
        },
        tags: ['二次関数', '最大値・最小値', '平方完成'],
        createdBy: 'user123',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setGeneratedProblem(dummyProblem);
      setMode('preview');
      setLoading(false);
    }, 2000);
  };

  const handleSave = async () => {
    setLoading(true);
    
    // シミュレート：実際にはFirebaseに保存
    setTimeout(() => {
      alert('問題を保存しました！');
      setLoading(false);
      // 実際にはルーターで遷移: router.push(`/problems/${problemId}`);
    }, 1000);
  };

  const handleStartSolving = () => {
    setMode('solve');
    setSolveResult(null);
  };

  const handleSolveComplete = (result: { correct: boolean; timeSpent: number; attempts: number }) => {
    setSolveResult(result);
    alert(`学習完了！\n正解: ${result.correct ? 'はい' : 'いいえ'}\n解答時間: ${Math.floor(result.timeSpent / 60)}分${result.timeSpent % 60}秒\n試行回数: ${result.attempts}回`);
    setMode('preview');
  };

  const handleBackToGenerate = () => {
    setMode('generate');
    setGeneratedProblem(null);
    setSolveResult(null);
  };

  const selectedCategoryData = selectedCategory ? SUBJECT_CATEGORIES[selectedCategory as keyof typeof SUBJECT_CATEGORIES] : null;
  const selectedSubject = formData.subject && selectedCategoryData 
    ? selectedCategoryData.subjects[formData.subject as keyof typeof selectedCategoryData.subjects] 
    : null;

  return (
    <div style={styles.pageContainer}>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '40px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #9333ea 0%, #6366f1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            <div style={{
              padding: '12px',
              background: 'linear-gradient(135deg, #9333ea 0%, #6366f1 100%)',
              borderRadius: '12px',
              color: 'white',
              boxShadow: '0 8px 16px rgba(147, 51, 234, 0.3)',
            }}>
              <Sparkles size={32} />
            </div>
            AI問題生成
          </h1>
          <p style={{ color: '#4b5563', fontSize: '18px' }}>
            AIが最適な問題を自動生成します。学習したい内容を選択してください。
          </p>
        </div>

        {mode === 'generate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* STEP 1: 教科選択 */}
            <div style={styles.mainCard}>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={styles.stepNumber}>1</div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>教科を選択</h2>
                </div>
                <p style={{ color: '#6b7280', marginLeft: '52px' }}>まず学習したい教科を選んでください</p>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '16px',
              }}>
                {Object.entries(SUBJECT_CATEGORIES).map(([key, category]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedCategory(key);
                      setFormData({ ...formData, subject: '', topic: '' });
                    }}
                    style={{
                      ...styles.categoryButton.base,
                      ...(selectedCategory === key ? styles.categoryButton.selected : {}),
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategory !== key) {
                        Object.assign(e.currentTarget.style, styles.categoryButton.hover);
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategory !== key) {
                        Object.assign(e.currentTarget.style, styles.categoryButton.base);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        ...styles.iconBox.base,
                        ...(selectedCategory === key ? styles.iconBox.selected : {}),
                      }}>
                        {category.icon}
                      </div>
                      <span style={{ fontWeight: '600', fontSize: '18px' }}>{category.name}</span>
                    </div>
                    {selectedCategory === key && (
                      <div style={styles.checkmark}>
                        <CheckCircle size={20} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 2: 科目選択 */}
            {selectedCategoryData && (
              <div style={{ ...styles.mainCard, animation: 'fadeIn 0.3s ease' }}>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={styles.stepNumber}>2</div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>科目を選択</h2>
                  </div>
                  <p style={{ color: '#6b7280', marginLeft: '52px' }}>{selectedCategoryData.name}の中から科目を選んでください</p>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px',
                }}>
                  {Object.entries(selectedCategoryData.subjects).map(([key, subject]) => (
                    <button
                      key={key}
                      onClick={() => setFormData({ ...formData, subject: key, topic: '' })}
                      style={{
                        ...styles.subjectButton.base,
                        ...(formData.subject === key ? styles.subjectButton.selected : {}),
                      }}
                      onMouseEnter={(e) => {
                        if (formData.subject !== key) {
                          Object.assign(e.currentTarget.style, styles.subjectButton.hover);
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.subject !== key) {
                          Object.assign(e.currentTarget.style, styles.subjectButton.base);
                        }
                      }}
                    >
                      <div style={{ fontWeight: '600', fontSize: '18px', marginBottom: '8px' }}>{subject.name}</div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {subject.topics.length}個の単元
                      </div>
                      {formData.subject === key && (
                        <div style={styles.checkmark}>
                          <CheckCircle size={20} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: 単元選択 */}
            {selectedSubject && (
              <div style={{ ...styles.mainCard, animation: 'fadeIn 0.3s ease' }}>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      ...styles.stepNumber,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    }}>3</div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>単元を選択</h2>
                  </div>
                  <p style={{ color: '#6b7280', marginLeft: '52px' }}>{selectedSubject.name}の学習したい単元を選んでください</p>
                </div>
                {selectedSubject.topics && selectedSubject.topics.length > 0 ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '12px',
                  }}>
                    {selectedSubject.topics.map((topic) => (
                      <button
                        key={topic}
                        onClick={() => setFormData({ ...formData, topic })}
                        style={{
                          ...styles.topicButton.base,
                          ...(formData.topic === topic ? styles.topicButton.selected : {}),
                        }}
                        onMouseEnter={(e) => {
                          if (formData.topic !== topic) {
                            Object.assign(e.currentTarget.style, styles.topicButton.hover);
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (formData.topic !== topic) {
                            Object.assign(e.currentTarget.style, styles.topicButton.base);
                          }
                        }}
                      >
                        <span style={{ fontWeight: '500' }}>{topic}</span>
                        {formData.topic === topic && (
                          <div style={{ ...styles.checkmark, padding: '2px' }}>
                            <CheckCircle size={16} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                    <AlertCircle size={48} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
                    <p>この科目の単元データがまだ登録されていません。</p>
                    <p style={{ fontSize: '14px', marginTop: '8px' }}>しばらくお待ちください。</p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: 難易度選択 */}
            {selectedSubject && formData.topic && (
              <div style={{ ...styles.mainCard, animation: 'fadeIn 0.3s ease' }}>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      ...styles.stepNumber,
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    }}>4</div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>難易度を選択</h2>
                  </div>
                  <p style={{ color: '#6b7280', marginLeft: '52px' }}>目標とする難易度レベルを選んでください</p>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '16px',
                }}>
                  {DIFFICULTY_LEVELS.map((level) => (
                    <button
                      key={level.id}
                      onClick={() => setFormData({ ...formData, difficulty: level.value as any })}
                      style={{
                        ...styles.difficultyButton.base,
                        ...(formData.difficulty === level.value ? styles.difficultyButton.selected : {}),
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        if (formData.difficulty !== level.value) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)';
                        }
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: level.color,
                        opacity: 0.1,
                        borderRadius: '20px',
                      }}></div>
                      <div style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '4px 12px',
                            borderRadius: '9999px',
                            fontSize: '14px',
                            fontWeight: '500',
                            background: level.bgColor,
                            color: level.textColor,
                          }}>
                            {level.icon}
                            {level.name}
                          </span>
                          {formData.difficulty === level.value && (
                            <CheckCircle size={20} color="#10b981" />
                          )}
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                            {level.difficulty}
                          </p>
                          <p style={{ fontSize: '12px', color: '#6b7280' }}>{level.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: 問題形式 */}
            {selectedSubject && formData.topic && formData.difficulty && (
              <div style={{ ...styles.mainCard, animation: 'fadeIn 0.3s ease' }}>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      ...styles.stepNumber,
                      background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 100%)',
                    }}>5</div>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>問題形式を選択</h2>
                  </div>
                  <p style={{ color: '#6b7280', marginLeft: '52px' }}>出題形式を選んでください</p>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '16px',
                }}>
                  {PROBLEM_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setFormData({ ...formData, type: type.id as any })}
                      style={{
                        ...styles.problemTypeButton.base,
                        ...(formData.type === type.id ? styles.problemTypeButton.selected : {}),
                      }}
                      onMouseEnter={(e) => {
                        if (formData.type !== type.id) {
                          Object.assign(e.currentTarget.style, styles.problemTypeButton.hover);
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (formData.type !== type.id) {
                          Object.assign(e.currentTarget.style, styles.problemTypeButton.base);
                        }
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: type.color,
                        opacity: 0.1,
                        borderRadius: '20px',
                      }}></div>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{
                          padding: '12px',
                          borderRadius: '8px',
                          background: type.color,
                          color: 'white',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        }}>
                          {type.icon}
                        </div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <h3 style={{ fontWeight: '600', marginBottom: '4px' }}>{type.name}</h3>
                          <p style={{ fontSize: '14px', color: '#6b7280' }}>{type.description}</p>
                        </div>
                        {formData.type === type.id && (
                          <CheckCircle size={20} color="#9333ea" style={{ flexShrink: 0 }} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* オプションセクション */}
            {formData.subject && formData.topic && formData.difficulty && formData.type && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px',
                animation: 'fadeIn 0.3s ease',
              }}>
                {/* Canvas図形オプション */}
                {['math1a', 'math2b', 'math3', 'physics', 'chemistry', 'earthScience'].includes(formData.subject) && (
                  <div style={{
                    background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                    borderRadius: '20px',
                    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.2)',
                    border: '1px solid #a5b4fc',
                    padding: '24px',
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <div style={{
                        padding: '8px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        color: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(99, 102, 241, 0.3)',
                      }}>
                        <Grid3X3 size={20} />
                      </div>
                      図形・グラフオプション
                    </h3>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      gap: '12px',
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.includeCanvas}
                        onChange={(e) => setFormData({ ...formData, includeCanvas: e.target.checked })}
                        style={{
                          width: '20px',
                          height: '20px',
                          accentColor: '#6366f1',
                          cursor: 'pointer',
                        }}
                      />
                      <span style={{ color: '#1e293b', fontWeight: '500' }}>
                        図形やグラフを含む問題を生成
                      </span>
                    </label>
                    <p style={{ marginTop: '8px', fontSize: '14px', color: '#475569' }}>
                      チェックすると、問題に関連する図形やグラフが自動生成されます
                    </p>
                  </div>
                )}

                {/* 追加要件 */}
                <div style={{
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 24px rgba(251, 191, 36, 0.2)',
                  border: '1px solid #fbbf24',
                  padding: '24px',
                  gridColumn: !['math1a', 'math2b', 'math3', 'physics', 'chemistry', 'earthScience'].includes(formData.subject) ? 'span 2' : 'auto',
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <div style={{
                      padding: '8px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 8px rgba(245, 158, 11, 0.3)',
                    }}>
                      <Info size={20} />
                    </div>
                    追加要件（任意）
                  </h3>
                  <textarea
                    value={formData.additionalRequirements}
                    onChange={(e) => setFormData({ ...formData, additionalRequirements: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid #fbbf24',
                      borderRadius: '12px',
                      resize: 'none',
                      outline: 'none',
                      background: 'white',
                      transition: 'all 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#f59e0b';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#fbbf24';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    rows={3}
                    placeholder="例: 応用問題にしてください、実生活に関連した問題にしてください"
                  />
                </div>
              </div>
            )}

            {/* 生成ボタン */}
            {formData.subject && formData.topic && formData.difficulty && formData.type && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                animation: 'fadeIn 0.3s ease',
              }}>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    ...styles.generateButton,
                    opacity: loading ? 0.5 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(147, 51, 234, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(147, 51, 234, 0.3)';
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Zap size={24} />
                      AIで問題を生成
                      <ChevronRight size={24} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* 生成された問題のプレビューモード */}
        {mode === 'preview' && generatedProblem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={styles.mainCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>生成された問題</h2>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: '#4b5563',
                  background: '#f3f4f6',
                  padding: '8px 16px',
                  borderRadius: '8px',
                }}>
                  <Clock size={16} />
                  推定解答時間: {generatedProblem.content.estimatedTime || 15}分
                </div>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                <span style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  color: '#1e3a8a',
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                }}>
                  {(() => {
                    // カテゴリを見つける
                    for (const [catKey, catData] of Object.entries(SUBJECT_CATEGORIES)) {
                      if (catData.subjects[generatedProblem.subject as keyof typeof catData.subjects]) {
                        return catData.subjects[generatedProblem.subject as keyof typeof catData.subjects].name;
                      }
                    }
                    return generatedProblem.subject;
                  })()}
                </span>
                <span style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                  color: '#064e3b',
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                }}>
                  {generatedProblem.topic}
                </span>
                <span style={{
                  padding: '8px 16px',
                  background: DIFFICULTY_LEVELS.find(d => d.value === generatedProblem.difficulty)?.bgColor,
                  color: DIFFICULTY_LEVELS.find(d => d.value === generatedProblem.difficulty)?.textColor,
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                }}>
                  難易度: {DIFFICULTY_LEVELS.find(d => d.value === generatedProblem.difficulty)?.name}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
                }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <div style={{
                      padding: '8px',
                      background: '#374151',
                      color: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 8px rgba(55, 65, 81, 0.3)',
                    }}>
                      <FileText size={20} />
                    </div>
                    問題
                  </h3>
                  <p style={{ whiteSpace: 'pre-wrap', color: '#1f2937', lineHeight: '1.8' }}>
                    {generatedProblem.content.question}
                  </p>
                </div>

                {generatedProblem.content.options && generatedProblem.content.options.length > 0 && (
                  <div style={{
                    background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
                  }}>
                    <h4 style={{ fontWeight: '600', marginBottom: '16px', color: '#1e3a8a' }}>選択肢</h4>
                    <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {generatedProblem.content.options.map((option, index) => (
                        <li key={index} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          background: 'white',
                          borderRadius: '8px',
                          padding: '12px',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}>
                          <span style={{
                            marginRight: '12px',
                            fontWeight: '600',
                            color: '#2563eb',
                            background: '#dbeafe',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span style={{ color: '#374151' }}>{option}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {generatedProblem.content.canvasData && (
                  <div style={{
                    background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
                  }}>
                    <h4 style={{
                      fontWeight: '600',
                      marginBottom: '12px',
                      color: '#581c87',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}>
                      <div style={{
                        padding: '8px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                        color: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(99, 102, 241, 0.3)',
                      }}>
                        <Grid3X3 size={20} />
                      </div>
                      図形・グラフ
                    </h4>
                    <ProblemCanvas
                      subjectType={generatedProblem.subject as any}
                      readOnly={true}
                      showGrid={true}
                    />
                  </div>
                )}
              </div>
            </div>

            <ShowAnswerSection problem={generatedProblem} mode="preview" />

            <div style={{ display: 'flex', gap: '16px' }}>
              <button
                onClick={handleBackToGenerate}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                  color: '#1f2937',
                  borderRadius: '16px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                }}
              >
                <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                新しい問題を生成
              </button>
              <button
                onClick={handleStartSolving}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: 'white',
                  borderRadius: '16px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(99, 102, 241, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                }}
              >
                <Target size={20} />
                この問題を解く
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  background: loading 
                    ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  borderRadius: '16px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  opacity: loading ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                    保存中...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    保存する
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* 問題解答モード */}
        {mode === 'solve' && generatedProblem && (
          <SolveProblemSection
            problem={generatedProblem}
            onComplete={handleSolveComplete}
            onBack={() => setMode('preview')}
          />
        )}
      </div>

      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}