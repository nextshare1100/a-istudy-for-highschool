// types/gemini.ts - 修正版

import { Problem, Answer, UserProfile, Aspiration, ProblemType, CanvasConfig } from './index';

// Gemini API リクエスト/レスポンス型定義

export interface GeminiProblemRequest {
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';  // Problem['difficulty']から具体的な型に変更
  type: string;  // page.tsxのformData.typeに合わせて文字列型に
  count: number;
  userId: string;
  userProfile?: {
    grade: string;
    targetLevel: string;
    favoriteSubjects: string[];
    weakSubjects: string[];
  };
  previousAnswers?: Answer[];
  targetUniversity?: Aspiration | null;
  
  // Canvas関連のオプション
  includeCanvas?: boolean;
  canvasType?: string;
  canvasDescription?: string;
}

export interface GeminiProblemResponse {
  problems: GeneratedProblem[];
  metadata: {
    generatedAt: string;
    model: string;
    promptVersion: string;
  };
}

export interface GeneratedProblem {
  question: string;
  type: string;  // page.tsxの期待する型に合わせる
  options?: string[];
  correctAnswer: string | string[];
  answer?: {
    correct: string;
    detailed?: string;
    alternatives?: string[];
  };
  explanation: string | {
    overview?: string;
    solution?: string;
    keyPoints?: string[];
    commonMistakes?: Array<{
      type: string;
      reason: string;
      correction: string;
    }>;
    extensions?: string;
  };
  hints: string[] | Array<{
    level: number;
    content: string;
  }>;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  estimatedTime: number;
  points: number;
  tags: string[];
  imageUrl?: string;
  formula?: string;
  
  // 評価基準
  evaluation?: {
    partialCredits?: Array<{
      criteria: string;
      points: number;
    }>;
    requirements?: string[];
  };
  
  // メタデータ
  metadata?: {
    concepts?: string[];
    prerequisites?: string[];
    skills?: string[];
    realWorldApplication?: string;
  };
  
  // Canvas設定
  canvasConfig?: CanvasConfig;
  
  // 追加フィールド
  selectedTopic?: string;
  isRandomlySelected?: boolean;
}

export interface GeminiAnalysisRequest {
  userId: string;
  subject: string;
  period: 'week' | 'month' | 'all';
  includeRecommendations?: boolean;
}

export interface GeminiAnalysisResponse {
  weaknesses: WeaknessAnalysis[];
  strengths: string[];
  recommendations: StudyRecommendation[];
  overallProgress: number;
}

export interface WeaknessAnalysis {
  topic: string;
  subtopic?: string;
  weaknessType: 'conceptual' | 'calculation' | 'comprehension' | 'application';
  severity: 'high' | 'medium' | 'low';
  description: string;
  exampleProblemIds: string[];
  improvementSuggestions: string[];
}

export interface StudyRecommendation {
  priority: 'high' | 'medium' | 'low';
  subject: string;
  topic: string;
  estimatedTime: number;
  reason: string;
  suggestedProblems: number;
}

export interface GeminiScheduleRequest {
  userId: string;
  targetDate: string;
  targetUniversities: Aspiration[];
  availableHoursPerDay: number;
  preferredSubjects?: string[];
  currentLevel: Record<string, number>;
}

export interface GeminiScheduleResponse {
  schedule: MonthlySchedule[];
  milestones: StudyMilestone[];
  totalEstimatedHours: number;
}

export interface MonthlySchedule {
  month: string;
  subjects: SubjectSchedule[];
  goals: string[];
  focusAreas: string[];
}

export interface SubjectSchedule {
  subject: string;
  allocatedHours: number;
  topics: TopicSchedule[];
  priority: 'high' | 'medium' | 'low';
}

export interface TopicSchedule {
  topic: string;
  subtopics: string[];
  estimatedProblems: number;
  targetCompletion: string;
}

export interface StudyMilestone {
  date: string;
  title: string;
  description: string;
  metrics: {
    targetAccuracy?: number;
    targetProblems?: number;
    targetTopics?: string[];
  };
}

// Gemini API エラー型
export interface GeminiError {
  code: string;
  message: string;
  details?: any;
}

// API設定
export interface GeminiConfig {
  apiKey: string;
  model: string;
  maxRetries: number;
  timeout: number;
  rateLimit: {
    maxRequests: number;
    windowMs: number;
  };
}

// プロンプトテンプレート型
export interface PromptTemplate {
  system: string;
  user: string;
  examples?: Array<{
    input: string;
    output: string;
  }>;
}

// セーフティ設定
export interface SafetySettings {
  blockHarmfulContent: boolean;
  blockPersonalInfo: boolean;
  contentFilters: string[];
}