// lib/ai/core/analyzer.ts

import { 
  getWeaknessAnalysis, 
  getEfficiencyAnalysis,
  getPerformancePrediction,
  StudyTimeStats
} from '@/lib/firebase/improved-analytics';
import { geminiService } from '../services/geminiService';
import { analyticsService } from '../services/analyticsService';
import { 
  IntegratedAnalysis,
  AnalysisRequest,
  AIInsight,
  PersonalizedRecommendation
} from '@/types/ai/analytics';

export class IntegratedAnalyzer {
  /**
   * 統合分析のメインエントリーポイント
   */
  async analyze(request: AnalysisRequest): Promise<IntegratedAnalysis> {
    // 1. 既存の統計分析データを収集
    const [weakness, efficiency, prediction, studyStats] = await Promise.all([
      analyticsService.getWeaknessData(request.userId, request.period),
      analyticsService.getEfficiencyData(request.userId, request.period),
      analyticsService.getPredictionData(request.userId),
      analyticsService.getStudyStats(request.userId, request.period)
    ]);

    // 2. データの前処理と検証
    const processedData = this.preprocessAnalyticsData({
      weakness,
      efficiency,
      prediction,
      studyStats
    });

    // 3. AIによる深層分析
    const aiInsights = await this.generateAIInsights(processedData, request);

    // 4. 個別最適化された推奨事項の生成
    const recommendations = await this.generatePersonalizedRecommendations(
      processedData,
      aiInsights,
      request.userProfile
    );

    // 5. 予測モデルの強化
    const enhancedPrediction = await this.enhancePrediction(
      prediction,
      aiInsights,
      request.historicalData
    );

    // 6. 統合結果の構築
    return {
      userId: request.userId,
      analysisId: this.generateAnalysisId(),
      timestamp: new Date().toISOString(),
      period: request.period,
      
      statistics: {
        weakness: processedData.weakness,
        efficiency: processedData.efficiency,
        studyTime: processedData.studyStats,
        performance: processedData.prediction
      },
      
      aiInsights,
      recommendations,
      prediction: enhancedPrediction,
      
      confidence: this.calculateConfidence(processedData),
      nextAnalysisDate: this.calculateNextAnalysisDate(request.period)
    };
  }

  /**
   * AIによる洞察生成
   */
  private async generateAIInsights(
    data: ProcessedAnalyticsData,
    request: AnalysisRequest
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    // 弱点パターンの分析
    if (data.weakness.length > 0) {
      const weaknessInsight = await geminiService.analyzeWeaknessPatterns({
        weaknesses: data.weakness,
        studyHistory: request.historicalData,
        userLevel: request.userProfile.academicLevel
      });
      insights.push(weaknessInsight);
    }

    // 学習効率の最適化提案
    const efficiencyInsight = await geminiService.analyzeEfficiencyPatterns({
      efficiency: data.efficiency,
      preferredTimes: data.efficiency.weeklyPatterns,
      lifestyle: request.userProfile.lifestyle
    });
    insights.push(efficiencyInsight);

    // 成績向上のボトルネック特定
    const bottleneckInsight = await geminiService.identifyBottlenecks({
      currentPerformance: data.prediction.currentScore,
      targetScore: request.userProfile.targetScore,
      studyPatterns: data.studyStats,
      weaknesses: data.weakness
    });
    insights.push(bottleneckInsight);

    return insights;
  }

  /**
   * 個別最適化された推奨事項の生成
   */
  private async generatePersonalizedRecommendations(
    data: ProcessedAnalyticsData,
    insights: AIInsight[],
    userProfile: UserProfile
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    // 即時対応が必要な推奨事項
    const urgentActions = this.identifyUrgentActions(data, insights);
    
    // 中期的な学習戦略
    const strategicPlan = await geminiService.generateStrategicPlan({
      insights,
      targetDate: userProfile.examDate,
      currentLevel: data.prediction.currentScore,
      targetLevel: userProfile.targetScore,
      availableTime: userProfile.dailyStudyHours
    });

    // 日々の学習タスク
    const dailyTasks = this.generateDailyTasks(
      urgentActions,
      strategicPlan,
      data.efficiency
    );

    return [
      ...urgentActions,
      ...strategicPlan.recommendations,
      ...dailyTasks
    ];
  }

  /**
   * 予測モデルの強化
   */
  private async enhancePrediction(
    basePrediction: PerformancePrediction,
    insights: AIInsight[],
    historicalData: HistoricalData
  ): Promise<EnhancedPrediction> {
    // 統計的予測とAI予測の組み合わせ
    const aiPrediction = await geminiService.predictPerformance({
      currentTrend: basePrediction.trend,
      insights,
      externalFactors: this.getExternalFactors(),
      similarUsersData: await this.getSimilarUsersData(historicalData)
    });

    // 予測の信頼区間を調整
    const adjustedInterval = this.adjustConfidenceInterval(
      basePrediction.confidenceInterval,
      aiPrediction.confidence
    );

    return {
      ...basePrediction,
      aiPrediction: aiPrediction.score,
      combinedPrediction: this.combinePrediction(basePrediction.score, aiPrediction.score),
      confidenceInterval: adjustedInterval
    };
  }

  private combinePrediction(baseScore: number, aiScore: number): number {
    // 基本予測とAI予測を組み合わせる（重み付け平均）
    return baseScore * 0.3 + aiScore * 0.7;
  }

  private adjustConfidenceInterval(
    baseInterval: { lower: number; upper: number },
    aiConfidence: number
  ): { lower: number; upper: number } {
    // AI予測の信頼度に基づいて信頼区間を調整
    const adjustmentFactor = aiConfidence / 100;
    const intervalWidth = baseInterval.upper - baseInterval.lower;
    const adjustedWidth = intervalWidth * (1 - adjustmentFactor * 0.3); // 最大30%狭める
    
    const center = (baseInterval.upper + baseInterval.lower) / 2;
    return {
      lower: center - adjustedWidth / 2,
      upper: center + adjustedWidth / 2
    };
  }

  private getExternalFactors(): any {
    // 外部要因を取得（季節、試験時期など）
    return {
      season: this.getCurrentSeason(),
      examPeriod: this.isExamPeriod(),
      dayOfWeek: new Date().getDay()
    };
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private isExamPeriod(): boolean {
    const month = new Date().getMonth();
    // 一般的な試験時期
    return month === 6 || month === 11 || month === 1;
  }

  private async getSimilarUsersData(historicalData: any): Promise<any> {
    // 類似ユーザーのデータを取得（実際の実装では別サービスを呼び出す）
    return {
      averageProgress: 0.75,
      successRate: 0.82
    };
  }
}
