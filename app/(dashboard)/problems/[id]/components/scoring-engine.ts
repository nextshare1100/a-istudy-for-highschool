// app/(dashboard)/problems/[id]/components/scoring-engine.ts

import { Problem } from '@/types/problem';

export interface ScoringResult {
  isCorrect: boolean;
  score: number; // 0-100
  partialCredit?: {
    category: string;
    points: number;
    feedback: string;
  }[];
  feedback: string;
}

export class ScoringEngine {
  /**
   * 解答を採点する
   */
  static score(problem: Problem, userAnswer: any): ScoringResult {
    switch (problem.type) {
      case 'multiple_choice':
        return this.scoreMultipleChoice(problem, userAnswer);
      
      case 'fill_in_blank':
        return this.scoreFillInBlank(problem, userAnswer);
      
      case 'calculation':
        return this.scoreCalculation(problem, userAnswer);
      
      case 'essay':
        return this.scoreEssay(problem, userAnswer);
      
      case 'graph':
      case 'diagram':
        return this.scoreCanvas(problem, userAnswer);
      
      default:
        return {
          isCorrect: false,
          score: 0,
          feedback: '採点できない問題形式です',
        };
    }
  }

  /**
   * 選択問題の採点
   */
  private static scoreMultipleChoice(problem: Problem, userAnswer: any): ScoringResult {
    const correctAnswer = parseInt(problem.content.answer as string);
    const isCorrect = userAnswer.answer === correctAnswer;
    
    return {
      isCorrect,
      score: isCorrect ? 100 : 0,
      feedback: isCorrect 
        ? '正解です！' 
        : `不正解です。正解は選択肢${correctAnswer + 1}です。`,
    };
  }

  /**
   * 穴埋め問題の採点
   */
  private static scoreFillInBlank(problem: Problem, userAnswer: any): ScoringResult {
    const correctAnswer = problem.content.answer as string;
    const userAnswerText = userAnswer.answer.trim();
    
    // 完全一致
    if (userAnswerText === correctAnswer) {
      return {
        isCorrect: true,
        score: 100,
        feedback: '正解です！',
      };
    }
    
    // 部分一致（大文字小文字を無視）
    if (userAnswerText.toLowerCase() === correctAnswer.toLowerCase()) {
      return {
        isCorrect: true,
        score: 90,
        feedback: '正解です！（大文字小文字の違いがありました）',
      };
    }
    
    // 数値の場合の近似判定
    const userNum = parseFloat(userAnswerText);
    const correctNum = parseFloat(correctAnswer);
    if (!isNaN(userNum) && !isNaN(correctNum)) {
      const diff = Math.abs(userNum - correctNum);
      const tolerance = correctNum * 0.01; // 1%の誤差を許容
      
      if (diff <= tolerance) {
        return {
          isCorrect: true,
          score: 95,
          feedback: '正解です！（わずかな誤差がありました）',
        };
      }
    }
    
    return {
      isCorrect: false,
      score: 0,
      feedback: `不正解です。正解は「${correctAnswer}」です。`,
    };
  }

  /**
   * 計算問題の採点
   */
  private static scoreCalculation(problem: Problem, userAnswer: any): ScoringResult {
    const correctAnswer = problem.content.answer as string;
    const userAnswerText = userAnswer.answer;
    
    // 最終答えの抽出（簡易版）
    const answerMatch = userAnswerText.match(/答え[：:]\s*(.+?)(?:\n|$)/);
    const finalAnswer = answerMatch ? answerMatch[1].trim() : userAnswerText.trim();
    
    // 計算過程のチェック
    const hasProcess = userAnswerText.length > 50; // 簡易的な判定
    const processScore = hasProcess ? 30 : 0;
    
    // 答えの正誤判定
    const isAnswerCorrect = this.compareCalculationAnswer(finalAnswer, correctAnswer);
    const answerScore = isAnswerCorrect ? 70 : 0;
    
    const totalScore = processScore + answerScore;
    
    return {
      isCorrect: totalScore >= 70,
      score: totalScore,
      partialCredit: [
        {
          category: '計算過程',
          points: processScore,
          feedback: hasProcess ? '計算過程が示されています' : '計算過程を示してください',
        },
        {
          category: '最終解答',
          points: answerScore,
          feedback: isAnswerCorrect ? '正解です' : `不正解です。正解は ${correctAnswer} です`,
        },
      ],
      feedback: totalScore >= 90 
        ? '素晴らしい解答です！' 
        : totalScore >= 70 
        ? '正解ですが、計算過程をもう少し詳しく書きましょう' 
        : '不正解です。解説を確認してください。',
    };
  }

  /**
   * 記述問題の採点（簡易版）
   */
  private static scoreEssay(problem: Problem, userAnswer: any): ScoringResult {
    const userText = userAnswer.answer;
    const modelAnswer = problem.content.answer as string;
    
    // 文字数チェック
    const lengthScore = this.scoreLengthRequirement(userText, 200, 400);
    
    // キーワードチェック（モデル解答から抽出）
    const keywords = this.extractKeywords(modelAnswer);
    const keywordScore = this.scoreKeywordPresence(userText, keywords);
    
    const totalScore = Math.round((lengthScore * 0.3 + keywordScore * 0.7));
    
    return {
      isCorrect: totalScore >= 60,
      score: totalScore,
      partialCredit: [
        {
          category: '文字数',
          points: Math.round(lengthScore * 0.3),
          feedback: `${userText.length}文字（推奨: 200-400文字）`,
        },
        {
          category: 'キーワード',
          points: Math.round(keywordScore * 0.7),
          feedback: `重要なキーワードの含有率: ${keywordScore}%`,
        },
      ],
      feedback: '記述問題は自動採点が困難なため、参考スコアです。解説と比較して自己評価してください。',
    };
  }

  /**
   * Canvas問題の採点（簡易版）
   */
  private static scoreCanvas(problem: Problem, userAnswer: any): ScoringResult {
    // Canvas採点は複雑なため、簡易的な実装
    const hasCanvasData = userAnswer.canvasData && userAnswer.canvasData.length > 0;
    const hasTextAnswer = userAnswer.answer && userAnswer.answer.trim().length > 0;
    
    if (problem.type === 'graph' && hasTextAnswer) {
      // グラフ問題で数値解答がある場合
      return this.scoreFillInBlank(problem, userAnswer);
    }
    
    return {
      isCorrect: hasCanvasData,
      score: hasCanvasData ? 50 : 0,
      feedback: 'Canvas問題は自動採点が困難です。解答例と比較して自己評価してください。',
    };
  }

  /**
   * 計算答えの比較
   */
  private static compareCalculationAnswer(userAnswer: string, correctAnswer: string): boolean {
    // 数式記号を統一
    const normalize = (str: string) => str
      .replace(/\s+/g, '')
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\$/g, '');
    
    return normalize(userAnswer) === normalize(correctAnswer);
  }

  /**
   * 文字数要件の採点
   */
  private static scoreLengthRequirement(text: string, min: number, max: number): number {
    const length = text.length;
    if (length < min) {
      return Math.max(0, (length / min) * 100);
    } else if (length > max) {
      return Math.max(0, 100 - ((length - max) / max) * 50);
    }
    return 100;
  }

  /**
   * キーワード抽出（簡易版）
   */
  private static extractKeywords(text: string): string[] {
    // 名詞や重要そうな単語を抽出（実際はもっと高度な処理が必要）
    const words = text.split(/[、。\s]+/);
    return words.filter(word => word.length >= 2);
  }

  /**
   * キーワード含有率の採点
   */
  private static scoreKeywordPresence(text: string, keywords: string[]): number {
    if (keywords.length === 0) return 100;
    
    const foundCount = keywords.filter(keyword => text.includes(keyword)).length;
    return Math.round((foundCount / keywords.length) * 100);
  }
}