// lib/firebase/types.ts
import { Timestamp } from 'firebase/firestore';

// ユーザープロファイル
export interface UserProfile {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// 面接質問関連
export interface InterviewQuestion {
  id?: string;
  userId: string;
  category: 'motivation' | 'self_pr' | 'student_life' | 'future_goals' | 'academic';
  question: string;
  sampleAnswers: {
    short: string;
    medium: string;
    long: string;
  };
  keyPoints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  university?: string;
  faculty?: string;
  createdByAI: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface InterviewPractice {
  id?: string;
  userId: string;
  questionId: string;
  questionText: string;
  answerText?: string;
  answerAudioUrl?: string;
  mode: 'normal' | 'karaoke';
  evaluationScore?: number;
  evaluationFeedback?: any;
  durationSeconds?: number;
  createdAt: Date | Timestamp;
}

export interface VoiceAnalysis {
  volume: number;
  volumeAdvice: string;
  transcription: string;
  corrections: CorrectionSuggestion[];
  duration: number;
  speechRate: number;
  pauses: number;
}

export interface CorrectionSuggestion {
  original: string;
  corrected: string;
  reason: string;
  type: 'grammar' | 'expression' | 'pronunciation' | 'filler';
  context?: string;
  position?: {
    start: number;
    end: number;
  };
}

// 小論文関連
export interface EssayTheme {
  id?: string;
  title: string;
  description: string;
  category: 'society' | 'culture' | 'science' | 'environment' | 'education' | 'economy' | 'politics' | 'ethics' | 'general' | 'faculty_specific' | 'current_affairs' | 'graph_analysis';
  faculties: string[];  // 対象学部 ('all' | 'law' | 'economics' | 'literature' | 'science' | 'engineering' | 'medicine' | 'education' | 'sociology')[]
  keywords?: string[];
  difficulty: number;  // 1-5
  timeLimit: number;  // 分
  wordLimit: number;  // 文字数
  type?: string;  // 'common' | 'current-affairs' | 'faculty-specific' | 'graph-analysis'
  hasGraph?: boolean;  // グラフ問題かどうか
  graphData?: GraphData;  // グラフデータ
  requirements?: {
    minWords: number;
    maxWords: number;
    timeLimit: number;
  };
  evaluationCriteria?: string[];
  sampleOutline?: string[];
  sampleAnswer?: string;  // 解答例
  references?: string[];  // 参考文献
  createdByAI?: boolean;
  createdBy?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface EssaySubmission {
  id?: string;
  userId: string;
  themeId: string;
  theme?: EssayTheme;
  content: string;
  wordCount: number;
  timeSpentSeconds?: number;
  evaluationScore?: number;
  evaluationDetails?: EssayEvaluation;
  isDraft: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface EssayEvaluation {
  score: number;
  structure: {
    score: number;
    feedback: string;
  };
  content: {
    score: number;
    feedback: string;
  };
  expression: {
    score: number;
    feedback: string;
  };
  overall: string;
  suggestions: string[];
}

export interface GraphData {
  type: 'line' | 'bar' | 'pie' | 'scatter';
  title: string;
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor?: string;
      backgroundColor?: string;
      pointRadius?: number;
    }>;
  };
  questions: string[];
  source?: string;
}

// グローバル型定義（必要な場合）
declare global {
  var __EMULATOR_CONNECTED__: boolean | undefined;
}