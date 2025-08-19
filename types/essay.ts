export interface EssayTheme {
  id: string;
  title: string;
  category: 'general' | 'faculty_specific' | 'current_affairs' | 'graph_analysis';
  faculty?: string[]; // 関連学部
  description: string;
  requirements: {
    minWords: number;
    maxWords: number;
    timeLimit: number; // 分
  };
  graphData?: GraphData;
  universityTags?: string[];
  year?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  sampleOutline?: string[];
  evaluationCriteria: string[];
}

export interface GraphData {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'mixed';
  title: string;
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string;
    }[];
  };
  questions: string[];
  source?: string;
}

export interface EssaySubmission {
  id: string;
  userId: string;
  themeId: string;
  content: string;
  wordCount: number;
  timeSpent: number; // 秒
  isDraft: boolean;
  evaluation?: EssayEvaluation;
  createdAt: Date;
  updatedAt: Date;
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