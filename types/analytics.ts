// types/analytics.ts

// 基本的なデータ型
export interface StudySession {
  id: string;
  userId: string;
  subjectId: string;
  topicId?: string;
  startTime: Date;
  endTime: Date;
  duration: number; // 秒
  pausedDuration: number; // 一時停止時間（秒）
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number; // 0-100
  focusScore: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

// 科目情報
export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  targetAccuracy: number;
  targetStudyTime: number; // 月間目標時間（分）
}

// トピック情報
export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prerequisites: string[]; // 前提となるトピックID
  estimatedTime: number; // 推定学習時間（分）
}

// 弱点分析
export interface WeaknessPattern {
  topicId: string;
  topicName: string;
  subjectId: string;
  errorCount: number;
  totalQuestions: number;
  errorRate: number; // 0-100
  lastPracticed: Date;
  improvementTrend: number; // -100 to +100
  weaknessScore: number; // 0-100
  recommendedActions: RecommendedAction[];
  relatedTopics: string[];
}

// 推奨アクション
export interface RecommendedAction {
  id: string;
  type: 'practice' | 'review' | 'video' | 'tutor';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimatedTime: number; // 分
  resources?: Resource[];
}

// リソース
export interface Resource {
  id: string;
  type: 'video' | 'document' | 'quiz' | 'exercise';
  title: string;
  url: string;
  duration?: number; // 分
}

// 模擬試験結果
export interface MockExamResult {
  id: string;
  userId: string;
  examDate: Date;
  examType: string;
  totalScore: number;
  maxScore: number;
  percentile: number;
  deviation: number; // 偏差値
  timeSpent: number; // 分
  subjects: SubjectScore[];
  weakAreas: WeakArea[];
  strengths: string[];
  overallFeedback: string;
}

// 科目別スコア
export interface SubjectScore {
  subjectId: string;
  subjectName: string;
  score: number;
  maxScore: number;
  accuracy: number;
  deviation: number;
  topics: TopicScore[];
}

// トピック別スコア
export interface TopicScore {
  topicId: string;
  topicName: string;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  timeSpent: number; // 秒
  avgTimePerQuestion: number; // 秒
}

// 弱点エリア
export interface WeakArea {
  topicId: string;
  topicName: string;
  missedQuestions: number;
  commonErrors: string[];
  suggestedFocus: string;
}

// 進捗メトリクス
export interface ProgressMetrics {
  totalStudyTime: number; // 分
  totalQuestions: number;
  overallAccuracy: number;
  studyStreak: number; // 連続学習日数
  weeklyAverage: number; // 週平均学習時間（分）
  monthlyGrowth: number; // 月間成長率（%）
  targetAchievement: number; // 目標達成率（%）
}

// チャートデータ型
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface StudyTimeData extends ChartDataPoint {
  subjects: Record<string, number>; // 科目別学習時間
}

export interface AccuracyData extends ChartDataPoint {
  questionsAnswered: number;
}

// フィルター条件
export interface AnalyticsFilter {
  userId: string;
  dateRange: DateRange;
  subjects?: string[];
  topics?: string[];
  examTypes?: string[];
}

export interface DateRange {
  start: Date;
  end: Date;
  preset?: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

// レポート設定
export interface ReportConfig {
  title: string;
  userId: string;
  dateRange: DateRange;
  sections: ReportSection[];
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
  includeRecommendations: boolean;
  language: 'ja' | 'en';
}

export interface ReportSection {
  id: string;
  type: 'summary' | 'progress' | 'weakness' | 'mockexam' | 'recommendations';
  title: string;
  enabled: boolean;
  options?: Record<string, any>;
}

// 分析結果
export interface AnalysisResult {
  userId: string;
  analysisDate: Date;
  dateRange: DateRange;
  metrics: ProgressMetrics;
  weaknesses: WeaknessPattern[];
  strengths: Topic[];
  predictions: Prediction[];
  recommendations: Recommendation[];
}

// 予測
export interface Prediction {
  type: 'goal_achievement' | 'exam_score' | 'improvement_time';
  targetDate: Date;
  predictedValue: number;
  confidence: number; // 0-100
  factors: string[];
}

// 推奨事項
export interface Recommendation {
  id: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  type: 'study_plan' | 'focus_area' | 'method_change' | 'break_suggestion';
  title: string;
  description: string;
  expectedImpact: 'high' | 'medium' | 'low';
  implementationTime: number; // 分
  relatedTopics?: string[];
}

// API レスポンス型
export interface AnalyticsResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    processingTime: number;
    dataPoints: number;
  };
}

// ページネーション
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// エラー型
export interface AnalyticsError extends Error {
  code: string;
  details?: any;
  timestamp: Date;
}

// 定数
export const SUBJECT_COLORS: Record<string, string> = {
  math: '#3B82F6',      // 青
  english: '#10B981',   // 緑
  japanese: '#F59E0B',  // オレンジ
  science: '#8B5CF6',   // 紫
  social: '#EF4444',    // 赤
};

export const DIFFICULTY_LEVELS = {
  easy: { label: '基礎', value: 1 },
  medium: { label: '標準', value: 2 },
  hard: { label: '応用', value: 3 },
} as const;

// 型ガード
export function isStudySession(data: any): data is StudySession {
  return (
    typeof data === 'object' &&
    'id' in data &&
    'userId' in data &&
    'startTime' in data &&
    'endTime' in data
  );
}

export function isWeaknessPattern(data: any): data is WeaknessPattern {
  return (
    typeof data === 'object' &&
    'topicId' in data &&
    'errorRate' in data &&
    'weaknessScore' in data
  );
}

// ユーティリティ型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ValueOf<T> = T[keyof T];

export type ChartType = 'line' | 'area' | 'bar' | 'pie' | 'composed' | 'radar';

// 列挙型
export enum StudyStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REVIEWING = 'reviewing',
}

export enum TrendDirection {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable',
}

// イベント型（リアルタイム更新用）
export interface AnalyticsEvent {
  type: 'session_start' | 'session_end' | 'question_answered' | 'exam_completed';
  userId: string;
  timestamp: Date;
  data: any;
}