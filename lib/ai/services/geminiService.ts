// lib/ai/services/geminiService.ts

import { getGeminiClient } from '@/lib/gemini/client';
import { ANALYSIS_PROMPTS } from '../prompts/analysis';
import { cacheService } from './cacheService';
import { 
  WeaknessPattern,
  EfficiencyPattern,
  StrategicPlan,
  AIAnalysisResult
} from '@/types/ai/analytics';

export class GeminiService {
  private client = getGeminiClient();

  /**
   * 弱点パターンの分析
   */
  async analyzeWeaknessPatterns(params: {
    weaknesses: WeaknessAnalysisData[];
    studyHistory: StudyHistory[];
    userLevel: string;
  }): Promise<AIInsight> {
    const cacheKey = `weakness_${params.userLevel}_${this.hashData(params.weaknesses)}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    const prompt = ANALYSIS_PROMPTS.WEAKNESS_PATTERN_ANALYSIS({
      weaknesses: params.weaknesses,
      history: params.studyHistory,
      level: params.userLevel
    });

    const response = await this.client.generateContent(prompt, 'system');
    const analysis = this.parseWeaknessAnalysis(response);

    await cacheService.set(cacheKey, analysis, 3600); // 1時間キャッシュ
    return analysis;
  }

  /**
   * 効率パターンの分析
   */
  async analyzeEfficiencyPatterns(params: {
    efficiency: EfficiencyAnalysisData;
    preferredTimes: WeeklyPattern[];
    lifestyle: UserLifestyle;
  }): Promise<AIInsight> {
    const prompt = ANALYSIS_PROMPTS.EFFICIENCY_OPTIMIZATION({
      currentPatterns: params.efficiency,
      preferences: params.preferredTimes,
      constraints: params.lifestyle
    });

    const response = await this.client.generateContent(prompt, 'system');
    return this.parseEfficiencyAnalysis(response);
  }

  /**
   * 戦略的学習計画の生成
   */
  async generateStrategicPlan(params: {
    insights: AIInsight[];
    targetDate: Date;
    currentLevel: number;
    targetLevel: number;
    availableTime: number;
  }): Promise<StrategicPlan> {
    const daysRemaining = this.calculateDaysRemaining(params.targetDate);
    
    const prompt = ANALYSIS_PROMPTS.STRATEGIC_PLANNING({
      insights: params.insights,
      timeframe: daysRemaining,
      gap: params.targetLevel - params.currentLevel,
      dailyHours: params.availableTime
    });

    const response = await this.client.generateContent(prompt, 'system');
    return this.parseStrategicPlan(response);
  }

  /**
   * パフォーマンス予測
   */
  async predictPerformance(params: {
    currentTrend: TrendData;
    insights: AIInsight[];
    externalFactors: ExternalFactors;
    similarUsersData: SimilarUsersData;
  }): Promise<AIPrediction> {
    const prompt = ANALYSIS_PROMPTS.PERFORMANCE_PREDICTION({
      trend: params.currentTrend,
      insights: params.insights,
      factors: params.externalFactors,
      benchmark: params.similarUsersData
    });

    const response = await this.client.generateContent(prompt, 'system');
    return this.parsePrediction(response);
  }

  /**
   * リアルタイムフィードバック生成
   */
  async generateFeedback(params: {
    problemId: string;
    userAnswer: string;
    correctAnswer: string;
    context: ProblemContext;
  }): Promise<DetailedFeedback> {
    const prompt = ANALYSIS_PROMPTS.FEEDBACK_GENERATION({
      problem: params.context,
      userAnswer: params.userAnswer,
      correctAnswer: params.correctAnswer,
      learningHistory: params.context.previousAttempts
    });

    const response = await this.client.generateContent(prompt, 'system');
    return this.parseFeedback(response);
  }

  // ユーティリティメソッド
  private hashData(data: any): string {
    return require('crypto')
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  private calculateDaysRemaining(targetDate: Date): number {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // パーサーメソッド
  private parseWeaknessAnalysis(response: string): AIInsight {
    const parsed = JSON.parse(response);
    return {
      type: 'weakness',
      priority: parsed.priority || 'high',
      title: parsed.title,
      description: parsed.description,
      actionItems: parsed.actionItems || [],
      impact: parsed.estimatedImpact || 'medium',
      confidence: parsed.confidence || 0.8
    };
  }

  private parseEfficiencyAnalysis(response: string): AIInsight {
    const parsed = JSON.parse(response);
    return {
      type: 'efficiency',
      priority: 'medium',
      title: parsed.title,
      description: parsed.description,
      actionItems: parsed.recommendations || [],
      impact: 'high',
      confidence: parsed.confidence || 0.75
    };
  }

  private parseStrategicPlan(response: string): StrategicPlan {
    const parsed = JSON.parse(response);
    return {
      phases: parsed.phases || [],
      milestones: parsed.milestones || [],
      recommendations: parsed.recommendations || [],
      riskFactors: parsed.risks || [],
      adjustmentTriggers: parsed.triggers || []
    };
  }

  private parsePrediction(response: string): AIPrediction {
    const parsed = JSON.parse(response);
    return {
      score: parsed.predictedScore,
      confidence: parsed.confidence,
      factors: parsed.contributingFactors || [],
      risks: parsed.riskFactors || [],
      opportunities: parsed.opportunities || []
    };
  }

  private parseFeedback(response: string): DetailedFeedback {
    const parsed = JSON.parse(response);
    return {
      isCorrect: parsed.isCorrect,
      score: parsed.score,
      feedback: parsed.feedback,
      hints: parsed.hints || [],
      relatedConcepts: parsed.relatedConcepts || [],
      nextSteps: parsed.nextSteps || []
    };
  }
}

export const geminiService = new GeminiService();