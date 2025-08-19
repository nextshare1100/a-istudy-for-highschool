export interface UniversityTrend {
  universityId: string;
  universityName: string;
  faculty?: string;
  recentThemes: EssayThemeHistory[];
  commonTopics: string[];
  preferredStyle: string[];
  averageWordCount: number;
  graphProblems: boolean;
  trendAnalysis: string;
}

export interface EssayThemeHistory {
  year: number;
  theme: string;
  category: string;
  wordLimit: number;
  hasGraph: boolean;
}

export const UNIVERSITY_TRENDS: UniversityTrend[] = [
  {
    universityId: 'tokyo-u',
    universityName: '東京大学',
    faculty: '総合',
    recentThemes: [
      {
        year: 2023,
        theme: '科学技術の発展と倫理的課題について',
        category: 'technology',
        wordLimit: 800,
        hasGraph: false,
      },
      {
        year: 2022,
        theme: '国際協力の意義と課題',
        category: 'international',
        wordLimit: 800,
        hasGraph: true,
      },
    ],
    commonTopics: ['科学技術', '国際関係', '社会問題', '倫理'],
    preferredStyle: ['論理的思考', '多角的視点', '批判的分析'],
    averageWordCount: 800,
    graphProblems: true,
    trendAnalysis: '抽象的なテーマから具体的な解決策を導く能力を重視。データ分析力も問われる。',
  },
  
  {
    universityId: 'kyoto-u',
    universityName: '京都大学',
    faculty: '総合',
    recentThemes: [
      {
        year: 2023,
        theme: '伝統と革新の関係性について',
        category: 'society',
        wordLimit: 1000,
        hasGraph: false,
      },
    ],
    commonTopics: ['文化', '哲学', '社会変革', '学問'],
    preferredStyle: ['独創的視点', '深い洞察', '哲学的考察'],
    averageWordCount: 1000,
    graphProblems: false,
    trendAnalysis: '独自の視点と深い思考を求める。既存の枠にとらわれない発想が評価される。',
  },
];

export function getUniversityTrend(universityId: string): UniversityTrend | undefined {
  return UNIVERSITY_TRENDS.find(t => t.universityId === universityId);
}

export function analyzeUniversityPreferences(universityId: string): {
  recommendedTopics: string[];
  styleGuide: string[];
  preparationTips: string[];
} {
  const trend = getUniversityTrend(universityId);
  
  if (!trend) {
    return {
      recommendedTopics: ['一般的な社会問題', '時事問題'],
      styleGuide: ['論理的構成', '具体例の提示', '明確な結論'],
      preparationTips: ['幅広いテーマに対応できるよう準備する'],
    };
  }
  
  return {
    recommendedTopics: trend.commonTopics,
    styleGuide: trend.preferredStyle,
    preparationTips: [
      `平均${trend.averageWordCount}字程度で練習する`,
      trend.graphProblems ? 'グラフ読み取り問題も練習する' : 'テキストベースの論述に集中する',
      trend.trendAnalysis,
    ],
  };
}