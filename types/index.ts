// types/index.ts - 完全版

import { Timestamp } from 'firebase/firestore';

// ユーザー関連
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  grade: '高1' | '高2' | '高3';
  school?: string;
  subjects: Subject[];
  goals: StudyGoal[];
  aspirations: Aspiration[];
  subscriptionStatus: 'free' | 'active' | 'cancelled' | 'past_due';
  subscriptionId?: string;
  stripeCustomerId?: string;
  createdAt: Timestamp | any;
  updatedAt: Timestamp | any;
  lastActiveAt: Timestamp | any;
}

export interface Subject {
  id: string;
  name: string;
}

export interface StudyGoal {
  id: string;
  title: string;
  targetDate: Date;
  completed: boolean;
}

export interface Aspiration {
  id: string;
  universityName: string;
  faculty?: string;
  priority: number;
}

// 学習関連
export interface StudySession {
  id: string;
  userId: string;
  subject: string;
  topic: string;
  startedAt: Timestamp;
  endedAt?: Timestamp;
  duration?: number;
  problemCount: number;
  correctCount: number;
  accuracy: number;
  timerType: 'pomodoro' | 'normal' | 'none';
  timerSessions?: {
    workTime: number;
    breakTime: number;
    cycles: number;
  };
  createdAt: Timestamp;
}

// Canvas関連の型定義
export interface CanvasElement {
  id: string;
  type: 'line' | 'circle' | 'rectangle' | 'point' | 'text' | 'polygon' | 'function';
  properties: {
    // 共通プロパティ
    x?: number;
    y?: number;
    color?: string;
    strokeWidth?: number;
    
    // Line
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    
    // Circle
    radius?: number;
    fillColor?: string;
    
    // Rectangle
    width?: number;
    height?: number;
    fillColor?: string;
    
    // Point
    label?: string;
    
    // Text
    text?: string;
    fontSize?: number;
    
    // Polygon
    points?: { x: number; y: number }[];
    fillColor?: string;
    
    // Function
    expression?: string;
    domain?: { min: number; max: number };
  };
}

export interface CanvasConfig {
  width: number;
  height: number;
  gridSize: number;
  showGrid: boolean;
  showAxes: boolean;
  elements: CanvasElement[];
  answerConfig?: {
    type: 'coordinates' | 'length' | 'area' | 'angle' | 'expression';
    expectedAnswer?: any;
    tolerance?: number;
  };
}

export interface Problem {
  id: string;
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: 'basic' | 'standard' | 'advanced' | 'expert';
  type: ProblemType;
  question: string;
  questionImages?: string[];
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  explanationImages?: string[];
  hints: string[];
  relatedConcepts: string[];
  commonMistakes: string[];
  generatedBy: 'gemini' | 'manual';
  generatedFor?: string;
  metadata?: {
    universityId?: string;
    universityName?: string;
    examYear?: number;
    examType?: 'common_test' | 'individual';
    isCommonTest?: boolean;
  };
  usageCount: number;
  avgTimeSpent: number;
  avgCorrectRate: number;
  createdAt: Timestamp;
  
  // Canvas設定を追加
  canvasConfig?: CanvasConfig;
}

export type ProblemType = 
  | 'multiple_choice'
  | 'multiple_select'
  | 'short_answer'
  | 'essay'
  | 'calculation'
  | 'true_false';

export interface Answer {
  id: string;
  userId: string;
  sessionId: string;
  problemId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  timeSpent: number;
  hintsUsed: number;
  confidence: 1 | 2 | 3 | 4 | 5;
  errorType?: 'conceptual' | 'calculation' | 'reading' | 'careless' | 'knowledge_gap';
  errorDetails?: string;
  answeredAt: Timestamp;
}

// 進捗関連
export interface Progress {
  id: string;
  userId: string;
  subject: string;
  overallMastery: number;
  totalTime: number;
  totalProblems: number;
  correctProblems: number;
  topics: {
    [topicId: string]: TopicProgress;
  };
  weakPoints: WeakPoint[];
  strengths: string[];
  lastStudied: Timestamp;
  updatedAt: Timestamp;
  lastAnalyzedAt?: Timestamp;
}

export interface TopicProgress {
  mastery: number;
  lastStudied: Timestamp;
  problemsSolved: number;
  correctRate: number;
  avgTimePerProblem: number;
  subtopics?: {
    [subtopicId: string]: SubtopicProgress;
  };
}

export interface SubtopicProgress {
  mastery: number;
  problemsSolved: number;
  correctRate: number;
}

export interface WeakPoint {
  id: string;
  concept: string;
  errorType: string;
  frequency: number;
  lastOccurred: Date;
  suggestedActions: string[];
}

// スケジュール関連
export interface Schedule {
  id: string;
  userId: string;
  targetDate: Timestamp;
  targetScore: number;
  currentScore: number;
  aspirations: Aspiration[];
  monthlyGoals: {
    [yearMonth: string]: MonthlyGoal;
  };
  personalEvents: PersonalEvent[];
  adjustmentHistory: AdjustmentHistory[];
  createdAt: Timestamp;
  lastAdjusted: Timestamp;
  nextReviewDate: Timestamp;
}

export interface MonthlyGoal {
  subjects: {
    [subjectId: string]: SubjectGoal;
  };
  totalHours: number;
  keyMilestones: string[];
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
}

export interface SubjectGoal {
  topics: string[];
  targetMastery: number;
  currentMastery: number;
  estimatedHours: number;
  actualHours: number;
  problems: {
    target: number;
    solved: number;
  };
}

export interface PersonalEvent {
  id: string;
  title: string;
  date: Date;
  type: 'exam' | 'event' | 'holiday' | 'other';
  impact: 'high' | 'medium' | 'low';
}

export interface AdjustmentHistory {
  date: Timestamp;
  reason: string;
  changes: string[];
}

// Gemini API関連
export interface GeminiProblemRequest {
  subject: string;
  topic: string;
  difficulty: 'basic' | 'standard' | 'advanced' | 'expert';
  count: number;
  userProfile: {
    grade: string;
    targetUniversities?: string[];
    weakPoints?: string[];
    recentMistakes?: string[];
  };
  preferences?: {
    problemTypes?: ProblemType[];
    includeImages?: boolean;
    focusAreas?: string[];
  };
}

export interface GeminiAnalysisRequest {
  userId: string;
  subject: string;
  timeframe: 'week' | 'month' | 'all';
  includeRecommendations: boolean;
}

export interface GeminiScheduleRequest {
  userId: string;
  targetDate: Date;
  targetScore: number;
  subjects: string[];
  currentProgress: Progress[];
  personalEvents: PersonalEvent[];
  studyHoursPerDay: number;
}

// 通知関連
export interface Notification {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
}

// AnswerSubmission
export interface AnswerSubmission {
  problemId: string;
  sessionId: string;
  answer: string | string[];
  timeSpent: number;
  hintsUsed: number;
  confidence: number;
}