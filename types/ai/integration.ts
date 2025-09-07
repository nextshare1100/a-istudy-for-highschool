// types/ai/integration.ts

export interface IntegratedAnalysis {
  userId: string;
  analysisId: string;
  timestamp: string;
  period: AnalysisPeriod;
  
  statistics: {
    weakness: ProcessedWeaknessData;
    efficiency: ProcessedEfficiencyData;
    studyTime: EnhancedStudyStats;
    performance: ProcessedPrediction;
  };
  
  aiInsights: AIInsight[];
  recommendations: PersonalizedRecommendation[];
  prediction: EnhancedPrediction;
  
  confidence: number;
  nextAnalysisDate: string;
}

export interface AIInsight {
  id: string;
  type: 'weakness' | 'efficiency' | 'bottleneck' | 'opportunity';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  relatedData?: any;
}

export interface PersonalizedRecommendation {
  id: string;
  type: 'immediate' | 'short-term' | 'long-term';
  category: 'study-time' | 'subject-focus' | 'method' | 'resource';
  title: string;
  description: string;
  specificActions: Action[];
  expectedOutcome: string;
  timeCommitment: number; // minutes per day
  priority: number; // 1-10
  dependencies?: string[];
}

export interface Action {
  id: string;
  description: string;
  deadline?: string;
  completed: boolean;
  resources?: Resource[];
}

export interface EnhancedPrediction {
  statisticalPrediction: number;
  aiPrediction: number;
  combinedPrediction: number;
  confidence: number;
  confidenceInterval: [number, number];
  factors: PredictionFactor[];
  scenarios: PredictionScenario[];
}

// 分析リクエストとレスポンスの型
export interface AnalysisRequest {
  userId: string;
  period: AnalysisPeriod;
  analysisType: 'comprehensive' | 'focused' | 'quick';
  options?: AnalysisOptions;
  userProfile?: UserProfile;
  historicalData?: HistoricalData;
}

export interface AnalysisOptions {
  includeAI?: boolean;
  includePrediction?: boolean;
  includeRecommendations?: boolean;
  focusAreas?: string[];
}

export type AnalysisPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';