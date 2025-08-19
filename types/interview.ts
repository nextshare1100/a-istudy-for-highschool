export interface InterviewQuestion {
  id: string;
  category: 'motivation' | 'self_pr' | 'student_life' | 'future_goals' | 'academic' | 'other';
  question: string;
  sampleAnswers: {
    short: string;  // 30秒
    medium: string; // 60秒
    long: string;   // 120秒
  };
  keyPoints: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export interface VoiceAnalysis {
  volume: number; // 0-100
  volumeAdvice: 'too_quiet' | 'good' | 'too_loud';
  transcription: string;
  corrections: CorrectionSuggestion[];
  duration: number;
  speechRate: number; // 文字/分
  pauses: number;
}

export interface CorrectionSuggestion {
  original: string;
  corrected: string;
  reason: string;
  type: 'grammar' | 'expression' | 'pronunciation' | 'filler';
}

export interface PracticeSession {
  id: string;
  userId: string;
  questionId: string;
  mode: 'normal' | 'karaoke';
  startedAt: Date;
  completedAt?: Date;
  recording?: {
    audioUrl: string;
    transcription: string;
    analysis: VoiceAnalysis;
  };
  evaluation?: {
    score: number;
    feedback: string[];
    strengths: string[];
    improvements: string[];
  };
}

export interface KaraokePracticeData {
  questionId: string;
  targetDuration: number;
  script: string;
  segments: string[];
  targetPace: number; // 文字/秒
  keyTimings: { segment: number; time: number }[];
}

