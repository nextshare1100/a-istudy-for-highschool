// types/gemini.ts - 拡張版

import { Problem, Answer, UserProfile, Aspiration, ProblemType, CanvasConfig } from './index';

// ========== 拡張パラメータ型定義 ==========

// 教育目標
export interface EducationalObjective {
  primaryGoal: string;
  subGoals: string[];
  targetSkills: string[];
}

// 文脈設定
export interface ContextSetting {
  realWorldContext?: string;
  narrativeStyle?: 'formal' | 'conversational' | 'story-based';
  culturalContext?: string;
}

// 内容詳細
export interface ContentSpecification {
  mustIncludeConcepts: string[];
  avoidConcepts: string[];
  formulaConstraints?: {
    required: string[];
    forbidden: string[];
  };
  numericalConstraints?: {
    integerOnly: boolean;
    range: { min: number; max: number };
    avoidFractions: boolean;
  };
}

// 評価基準
export interface AssessmentCriteria {
  partialCreditStructure?: {
    steps: Array<{
      description: string;
      maxPoints: number;
      criteria: string[];
    }>;
  };
  commonMistakesToCheck: string[];
  requiredJustification: boolean;
}

// 言語設定
export interface LanguagePreferences {
  vocabulary: 'basic' | 'intermediate' | 'advanced';
  sentenceComplexity: 'simple' | 'moderate' | 'complex';
  technicalTermUsage: 'minimal' | 'standard' | 'extensive';
}

// 拡張パラメータ
export interface ExtendedParameters {
  educationalObjective?: EducationalObjective;
  contextSetting?: ContextSetting;
  contentSpecification?: ContentSpecification;
  assessmentCriteria?: AssessmentCriteria;
  languagePreferences?: LanguagePreferences;
}

// 検証結果
export interface ValidationChecks {
  requirementsFulfillment: {
    includedConcepts: string[];
    missingConcepts: string[];
    score: number;
  };
  difficultyAlignment: {
    estimatedDifficulty: 'easy' | 'medium' | 'hard';
    confidence: number;
    reasoning: string;
  };
  educationalValue: {
    skillsCovered: string[];
    learningOutcomes: string[];
    score: number;
  };
}

// 再生成オプション
export interface RegenerationOptions {
  keepStructure: boolean;
  adjustDifficulty?: 'easier' | 'harder';
  emphasizeConcepts?: string[];
  refinementPrompt?: string;
}

// ========== 既存の型定義を拡張 ==========

export interface GeminiProblemRequest {
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  type: string;
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
  
  // 詳細カスタマイズ機能（新規追加）
  extendedParameters?: ExtendedParameters;
  useAdvancedCustomization?: boolean;
}

export interface GeminiProblemResponse {
  problems: GeneratedProblem[];
  metadata: {
    generatedAt: string;
    model: string;
    promptVersion: string;
    // 検証結果を追加
    validationResults?: ValidationChecks;
  };
}

export interface GeneratedProblem {
  question: string;
  type: string;
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
  
  // メタデータ（拡張）
  metadata?: {
    concepts?: string[];
    prerequisites?: string[];
    skills?: string[];
    realWorldApplication?: string;
    // 新規追加
    bloomsTaxonomyLevel?: string[];
    cognitiveLoad?: 'low' | 'medium' | 'high';
  };
  
  // Canvas設定
  canvasConfig?: CanvasConfig;
  
  // 追加フィールド
  selectedTopic?: string;
  isRandomlySelected?: boolean;
  
  // 生成パラメータ（新規追加）
  generationParameters?: ExtendedParameters;
  generationHistory?: Array<{
    timestamp: string;
    parameters: ExtendedParameters;
    version: number;
  }>;
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

// ========== テンプレート型定義（新規追加） ==========

export interface ProblemTemplate {
  id: string;
  name: string;
  description: string;
  category: 'commonTest' | 'university' | 'custom';
  parameters: ExtendedParameters;
  createdBy: string;
  isPublic: boolean;
  usageCount: number;
  averageRating: number;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}