// types/study.ts
export interface StudySession {
  id: string;
  userId: string;
  subject: string;
  topic: string;
  startedAt: any; // Firestore Timestamp
  endedAt?: any; // Firestore Timestamp
  duration?: number; // 分
  problemCount: number;
  correctCount: number;
  timerType?: 'pomodoro' | 'normal' | 'none';
  createdAt: any; // Firestore Timestamp
}

export interface Problem {
  id: string;
  subject: string;
  topic: string;
  subtopic?: string;
  difficulty: 'basic' | 'standard' | 'advanced' | 'expert';
  type: 'multiple_choice' | 'fill_blank' | 'short_answer' | 'essay' | 'formula_fill' | 'sequence_sort';
  question: string;
  options?: string[]; // 選択式の場合
  correctAnswer: string | string[];
  explanation: string;
  hints?: string[];
  relatedConcepts?: string[];
  commonMistakes?: string[];
  generatedBy: 'gemini' | 'manual';
  metadata?: {
    universityId?: string;
    examYear?: number;
    isCommonTest?: boolean;
  };
  createdAt: any; // Firestore Timestamp
  
  // Canvas関連の追加フィールド
  canvasData?: {
    type: 'function' | 'geometry' | 'vector' | 'statistics' | 'coordinate'
    data: any
    width?: number
    height?: number
    interactive?: boolean
    // 回答設定
    answerType?: 'point' | 'line' | 'shape' | 'selection' | 'drawing'
    answerConfig?: CanvasAnswerConfig
  }
}

// Canvas回答の設定
export interface CanvasAnswerConfig {
  // 点をプロットする回答
  point?: {
    correctPoint: { x: number; y: number }
    tolerance: number // 許容誤差（座標単位）
    hint?: string
  }
  
  // 線を描く回答
  line?: {
    correctPoints?: Array<{ x: number; y: number }>
    lineType: 'straight' | 'curve' | 'vector'
    tolerance: number
    checkEndpoints?: boolean // 端点のみチェック
    checkDirection?: boolean // ベクトルの方向をチェック
  }
  
  // 図形を描く回答
  shape?: {
    shapeType: 'triangle' | 'circle' | 'rectangle' | 'polygon'
    correctVertices?: Array<{ x: number; y: number }>
    correctCenter?: { x: number; y: number }
    correctRadius?: number
    tolerance: number
    checkCongruence?: boolean // 合同性をチェック
    checkSimilarity?: boolean // 相似性をチェック
  }
  
  // 選択式回答（グラフ上の要素を選択）
  selection?: {
    selectableElements: Array<{
      id: string
      type: 'point' | 'line' | 'area'
      data: any
      isCorrect: boolean
    }>
    multiSelect?: boolean
  }
  
  // 自由描画
  drawing?: {
    expectedPattern?: string // パターン認識用
    checkSymmetry?: boolean
    checkIntersections?: boolean
  }
}

export interface Answer {
  id: string;
  userId: string;
  sessionId: string;
  problemId: string;
  userAnswer: string | string[] | CanvasAnswerData; // Canvas回答データを追加
  isCorrect: boolean;
  timeSpent: number; // 秒
  hintsUsed: number;
  answeredAt: any; // Firestore Timestamp
  confidence?: 1 | 2 | 3 | 4 | 5; // 自信度
  
  // Canvas回答の追加フィールド
  canvasAnswerData?: CanvasAnswerData;
  accuracy?: number; // 0-100 (Canvas回答の精度)
}

// Canvas回答データ
export interface CanvasAnswerData {
  type: 'point' | 'line' | 'shape' | 'selection' | 'drawing'
  drawnElements: Array<{
    id: string
    type: string
    timestamp: number
    // 点の場合
    x?: number
    y?: number
    // 線や図形の場合
    points?: Array<{ x: number; y: number }>
  }>
  selectedElements: string[]
  // 採点結果
  feedback?: string
  partialCredit?: boolean
}

export interface Progress {
  userId: string;
  subject: string;
  topic: string;
  subtopics?: {
    [key: string]: {
      mastery: number; // 0-100
      lastStudied: any; // Firestore Timestamp
      problemsSolved: number;
      correctRate: number;
    };
  };
  overallMastery: number; // 0-100
  totalTime: number; // 分
  lastStudied: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  weakPoints?: WeakPoint[];
}

export interface WeakPoint {
  id: string;
  concept: string;
  errorType: 'conceptual' | 'calculation' | 'reading' | 'careless' | 'knowledge_gap';
  frequency: number;
  lastOccurred: any; // Firestore Timestamp
  suggestedActions: string[];
}

export interface StudySchedule {
  id: string;
  userId: string;
  targetDate: Date;
  targetScore: number;
  currentScore: number;
  monthlyGoals: MonthlyGoal[];
  personalEvents: PersonalEvent[];
  lastAdjusted: any; // Firestore Timestamp
  createdAt: any; // Firestore Timestamp
}

export interface MonthlyGoal {
  month: string; // YYYY-MM
  subjects: {
    [subjectId: string]: {
      topics: string[];
      targetMastery: number;
      estimatedHours: number;
    };
  };
  totalHours: number;
}

export interface PersonalEvent {
  id: string;
  title: string;
  date: Date;
  type: 'club' | 'exam' | 'event' | 'other';
  impact: 'high' | 'medium' | 'low'; // 学習への影響度
}