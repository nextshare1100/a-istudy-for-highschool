// lib/ai/services/analyticsService.ts

import {
  getStudyTimeStats,
  getWeaknessAnalysis,
  getEfficiencyAnalysis,
  getPerformancePrediction,
  WeaknessAnalysisData,
  EfficiencyAnalysisData
} from '@/lib/firebase/improved-analytics';
import { getLearningAnalytics } from '@/lib/firebase/learninganalytics';
import { 
  calculateDeviation,
  analyzeTrend,
  calculateEfficiencyScore 
} from '@/lib/analytics/calculations';

export class AnalyticsService {
  /**
   * 統合された弱点データの取得
   */
  async getWeaknessData(
    userId: string,
    period: AnalysisPeriod
  ): Promise<ProcessedWeaknessData> {
    // Firebase分析データ
    const firebaseWeakness = await getWeaknessAnalysis(userId);
    
    // デイリーチャレンジ分析データ
    const challengeAnalytics = await getLearningAnalytics(userId, period);
    
    // データの統合と処理
    return this.mergeWeaknessData(firebaseWeakness, challengeAnalytics);
  }

  /**
   * 効率データの取得と処理
   */
  async getEfficiencyData(
    userId: string,
    period: string
  ): Promise<ProcessedEfficiencyData> {
    const efficiency = await getEfficiencyAnalysis(userId, period);
    
    // 追加の効率計算
    const enhancedData = {
      ...efficiency,
      overallScore: this.calculateOverallEfficiency(efficiency),
      recommendations: this.generateEfficiencyRecommendations(efficiency)
    };

    return enhancedData;
  }

  /**
   * 予測データの取得と強化
   */
  async getPredictionData(userId: string): Promise<ProcessedPrediction> {
    const prediction = await getPerformancePrediction(userId);
    
    // トレンド分析の追加
    const trend = analyzeTrend(
      prediction.historicalData.map(d => d.actualScore)
    );

    return {
      ...prediction,
      trend,
      confidenceScore: this.calculatePredictionConfidence(prediction)
    };
  }

  /**
   * 学習統計の取得
   */
  async getStudyStats(
    userId: string,
    period: string
  ): Promise<EnhancedStudyStats> {
    const stats = await getStudyTimeStats(userId, period as any);
    
    return {
      ...stats,
      efficiency: this.calculateStudyEfficiency(stats),
      consistency: this.calculateConsistency(stats.weeklyTrend)
    };
  }

  // プライベートメソッド
  private mergeWeaknessData(
    firebase: WeaknessAnalysisData[],
    challenge: any
  ): ProcessedWeaknessData {
    // 両方のデータソースから弱点を統合
    const mergedWeaknesses = new Map<string, WeaknessInfo>();

    firebase.forEach(w => {
      const key = `${w.subject}_${w.unit}`;
      mergedWeaknesses.set(key, {
        subject: w.subject,
        unit: w.unit,
        accuracy: w.accuracy,
        confidence: w.confidence,
        sources: ['firebase'],
        lastUpdated: w.lastStudied || new Date()
      });
    });

    // チャレンジデータを統合
    if (challenge?.subjects) {
      Object.entries(challenge.subjects).forEach(([subject, data]: [string, any]) => {
        data.weaknessUnits?.forEach((unit: string) => {
          const key = `${subject}_${unit}`;
          if (mergedWeaknesses.has(key)) {
            mergedWeaknesses.get(key)!.sources.push('challenge');
          } else {
            mergedWeaknesses.set(key, {
              subject,
              unit,
              accuracy: data.unitPerformance[unit]?.accuracy || 0,
              confidence: 'medium',
              sources: ['challenge'],
              lastUpdated: new Date()
            });
          }
        });
      });
    }

    return {
      weaknesses: Array.from(mergedWeaknesses.values()),
      summary: this.generateWeaknessSummary(mergedWeaknesses),
      priority: this.prioritizeWeaknesses(mergedWeaknesses)
    };
  }

  private calculateOverallEfficiency(
    efficiency: EfficiencyAnalysisData
  ): number {
    const factors = [
      efficiency.pomodoroComparison.userAvgFocus / 100,
      efficiency.subjectEfficiency.reduce((sum, s) => sum + s.efficiency, 0) / 
        (efficiency.subjectEfficiency.length * 100),
      efficiency.breakPatterns.currentPattern === '理想的' ? 1 : 0.7
    ];

    return factors.reduce((sum, f) => sum + f, 0) / factors.length * 100;
  }

  private generateEfficiencyRecommendations(
    efficiency: EfficiencyAnalysisData
  ): string[] {
    const recommendations: string[] = [];

    // 時間帯の推奨
    const bestHour = efficiency.hourlyFocus
      .sort((a, b) => b.focusScore - a.focusScore)[0];
    if (bestHour) {
      recommendations.push(
        `${bestHour.hour}時台が最も集中できる時間帯です。重要な学習はこの時間に。`
      );
    }

    // 休憩パターンの改善
    if (efficiency.breakPatterns.currentPattern !== '理想的') {
      recommendations.push(
        `休憩間隔を${efficiency.breakPatterns.optimalBreakDuration}分に調整しましょう。`
      );
    }

    return recommendations;
  }

  private calculatePredictionConfidence(
    prediction: PerformancePredictionData
  ): number {
    const factors = {
      dataReliability: prediction.reliability === 'high' ? 1 : 
                      prediction.reliability === 'medium' ? 0.7 : 0.4,
      historicalDataCount: Math.min(prediction.historicalData.length / 10, 1),
      intervalRange: 1 - (prediction.confidenceInterval[1] - 
                         prediction.confidenceInterval[0]) / 20
    };

    return Object.values(factors).reduce((sum, f) => sum + f, 0) / 3 * 100;
  }

  private calculateStudyEfficiency(stats: StudyTimeStats): number {
    if (!stats.hasData) return 0;
    
    // 学習時間の一貫性と分布から効率を計算
    const consistency = this.calculateConsistency(stats.weeklyTrend);
    const balance = this.calculateSubjectBalance(stats.subjectDistribution);
    
    return (consistency * 0.6 + balance * 0.4);
  }

  private calculateConsistency(trend: Array<{date: string; hours: number}>): number {
    if (trend.length === 0) return 0;
    
    const values = trend.map(t => t.hours);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // 変動係数の逆数を正規化
    const cv = mean > 0 ? stdDev / mean : 1;
    return Math.max(0, Math.min(100, (1 - cv) * 100));
  }

  private calculateSubjectBalance(
    distribution: Array<{subject: string; percentage: number}>
  ): number {
    if (distribution.length === 0) return 0;
    
    // 理想的な分布からの偏差を計算
    const idealPercentage = 100 / distribution.length;
    const totalDeviation = distribution.reduce(
      (sum, s) => sum + Math.abs(s.percentage - idealPercentage),
      0
    );
    
    return Math.max(0, 100 - totalDeviation);
  }

  private generateWeaknessSummary(
    weaknesses: Map<string, WeaknessInfo>
  ): WeaknessSummary {
    const bySubject = new Map<string, number>();
    
    weaknesses.forEach(w => {
      const current = bySubject.get(w.subject) || 0;
      bySubject.set(w.subject, current + 1);
    });

    return {
      totalWeaknesses: weaknesses.size,
      bySubject: Object.fromEntries(bySubject),
      criticalCount: Array.from(weaknesses.values())
        .filter(w => w.accuracy < 40).length
    };
  }

  private prioritizeWeaknesses(
    weaknesses: Map<string, WeaknessInfo>
  ): WeaknessInfo[] {
    return Array.from(weaknesses.values())
      .sort((a, b) => {
        // 信頼度で優先度付け
        const confidenceScore = { high: 3, medium: 2, low: 1 };
        const aScore = confidenceScore[a.confidence] * (100 - a.accuracy);
        const bScore = confidenceScore[b.confidence] * (100 - b.accuracy);
        return bScore - aScore;
      })
      .slice(0, 5);
  }
}

export const analyticsService = new AnalyticsService();