// lib/gemini/services/quickLearningGenerator.ts

import { genAI, MODELS, SAFETY_SETTINGS } from '../config';
import { QUICK_LEARNING_PROMPTS } from '../prompts/quickLearning';

export interface QuickQuestion {
  id: string;
  content: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  hint?: string;
  relatedConcepts?: string[];
  difficulty: 1 | 2 | 3;
  estimatedTime: number;
}

export class QuickLearningGenerator {
  private model;
  
  constructor() {
    this.model = genAI.getGenerativeModel({
      model: MODELS.FLASH,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: SAFETY_SETTINGS,
    });
  }

  // メイン生成メソッド
  async generateQuestions(params: {
    subject: string;
    unit: string;
    count: number;
    sessionType: 'morning' | 'evening' | 'random';
  }): Promise<QuickQuestion[]> {
    try {
      // 基本プロンプトを取得
      const basePrompt = QUICK_LEARNING_PROMPTS.GENERATE_QUICK_QUESTIONS(params);
      
      // 科目別の詳細を追加
      const subjectPrompt = this.getSubjectSpecificPrompt(params.subject, params.unit);
      
      const fullPrompt = basePrompt + '\n\n' + subjectPrompt;
      
      // Geminiで生成
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      // JSON解析
      return this.parseResponse(text);
      
    } catch (error) {
      console.error('Question generation error:', error);
      
      // エラー時は再試行
      if (error instanceof Error && error.message.includes('parse')) {
        return this.retryWithConstraints(params, error.message);
      }
      
      throw error;
    }
  }

  // 科目別プロンプト取得
  private getSubjectSpecificPrompt(subject: string, unit: string): string {
    const subjectMap: { [key: string]: keyof typeof QUICK_LEARNING_PROMPTS.SUBJECT_SPECIFIC } = {
      '数学': 'math',
      '英語': 'english',
      '理科': 'science',
      '物理': 'science',
      '化学': 'science',
      '生物': 'science',
    };
    
    const promptKey = subjectMap[subject];
    if (promptKey && QUICK_LEARNING_PROMPTS.SUBJECT_SPECIFIC[promptKey]) {
      return QUICK_LEARNING_PROMPTS.SUBJECT_SPECIFIC[promptKey](unit);
    }
    
    return '';
  }

  // レスポンス解析
  private parseResponse(text: string): QuickQuestion[] {
    try {
      // JSONを抽出
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const jsonStr = jsonMatch[1];
      const questions = JSON.parse(jsonStr);
      
      // バリデーション
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }
      
      return questions.map(q => this.validateQuestion(q));
      
    } catch (error) {
      console.error('Parse error:', error);
      console.error('Raw response:', text);
      throw new Error('Failed to parse AI response');
    }
  }

  // 問題のバリデーション
  private validateQuestion(q: any): QuickQuestion {
    // 必須フィールドチェック
    if (!q.content || !Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error('Invalid question format');
    }
    
    if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
      throw new Error('Invalid correctAnswer');
    }
    
    return {
      id: q.id || `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: q.content.trim(),
      options: q.options.map((opt: string) => opt.trim()),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      hint: q.hint,
      relatedConcepts: q.relatedConcepts || [],
      difficulty: q.difficulty || 2,
      estimatedTime: q.estimatedTime || 20,
    };
  }

  // エラー時の再試行
  private async retryWithConstraints(
    params: any,
    errorMessage: string
  ): Promise<QuickQuestion[]> {
    const originalPrompt = QUICK_LEARNING_PROMPTS.GENERATE_QUICK_QUESTIONS(params);
    const retryPrompt = QUICK_LEARNING_PROMPTS.REGENERATE_WITH_CONSTRAINTS(
      originalPrompt,
      errorMessage
    );
    
    const result = await this.model.generateContent(retryPrompt);
    const response = await result.response;
    const text = response.text();
    
    return this.parseResponse(text);
  }

  // 復習問題生成
  async generateReviewQuestions(params: {
    previousQuestions: Array<{
      content: string;
      userAnswer: number;
      isCorrect: boolean;
    }>;
    subject: string;
  }): Promise<QuickQuestion[]> {
    const prompt = QUICK_LEARNING_PROMPTS.REVIEW_PROMPTS.GENERATE_REVIEW_QUESTIONS(params);
    
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return this.parseResponse(text);
  }
}