export interface RubricCriterion {
  name: string;
  weight: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  score: number;
  description: string;
  indicators: string[];
}

export const ESSAY_RUBRIC: RubricCriterion[] = [
  {
    name: '構成',
    weight: 25,
    levels: [
      {
        score: 100,
        description: '完璧な構成',
        indicators: [
          '序論・本論・結論が明確に区別されている',
          '各段落が有機的に結びついている',
          '論理の流れが一貫している',
          '読者を意識した構成になっている',
        ],
      },
      {
        score: 80,
        description: '良好な構成',
        indicators: [
          '基本的な三段構成ができている',
          '段落間のつながりがある',
          '論理の流れがおおむね明確',
        ],
      },
      {
        score: 60,
        description: '標準的な構成',
        indicators: [
          '構成の意識はあるが不完全',
          '段落分けはされているが関連性が弱い',
          '論理の流れに一部乱れがある',
        ],
      },
      {
        score: 40,
        description: '不十分な構成',
        indicators: [
          '構成が不明確',
          '段落分けが適切でない',
          '論理の流れが追いにくい',
        ],
      },
      {
        score: 20,
        description: '構成の欠如',
        indicators: [
          '構成への意識が見られない',
          '段落分けがない、または意味をなさない',
          '論理的なつながりがない',
        ],
      },
    ],
  },
  
  {
    name: '内容',
    weight: 35,
    levels: [
      {
        score: 100,
        description: '優れた内容',
        indicators: [
          'テーマを深く理解し、独自の視点がある',
          '具体例が豊富で説得力がある',
          '批判的思考が示されている',
          '知識の正確性と深さがある',
        ],
      },
      {
        score: 80,
        description: '良好な内容',
        indicators: [
          'テーマを適切に理解している',
          '具体例が含まれている',
          'ある程度の分析がなされている',
          '基本的な知識は正確',
        ],
      },
      {
        score: 60,
        description: '標準的な内容',
        indicators: [
          'テーマの基本的理解はある',
          '具体例が少ない',
          '表面的な分析にとどまる',
          '知識に一部不正確さがある',
        ],
      },
      {
        score: 40,
        description: '不十分な内容',
        indicators: [
          'テーマの理解が浅い',
          '具体例がほとんどない',
          '分析が不十分',
          '知識の誤りが目立つ',
        ],
      },
      {
        score: 20,
        description: '内容の欠如',
        indicators: [
          'テーマから逸脱している',
          '具体性がない',
          '分析がない',
          '知識が著しく不足',
        ],
      },
    ],
  },
  
  {
    name: '表現',
    weight: 25,
    levels: [
      {
        score: 100,
        description: '優れた表現',
        indicators: [
          '語彙が豊富で適切',
          '文章が明確で読みやすい',
          '文法的に正確',
          '効果的な修辞技法を使用',
        ],
      },
      {
        score: 80,
        description: '良好な表現',
        indicators: [
          '適切な語彙を使用',
          '文章は概ね明確',
          '文法的な誤りが少ない',
          '基本的な文章技術がある',
        ],
      },
      {
        score: 60,
        description: '標準的な表現',
        indicators: [
          '基本的な語彙は使える',
          '文章の意味は理解できる',
          '文法的な誤りがいくつかある',
          '表現が単調',
        ],
      },
      {
        score: 40,
        description: '不十分な表現',
        indicators: [
          '語彙が限定的',
          '文章が分かりにくい',
          '文法的な誤りが多い',
          '稚拙な表現が目立つ',
        ],
      },
      {
        score: 20,
        description: '表現力の欠如',
        indicators: [
          '語彙が著しく不足',
          '文章の意味が不明瞭',
          '文法的に破綻している',
          '読解が困難',
        ],
      },
    ],
  },
  
  {
    name: '独創性',
    weight: 15,
    levels: [
      {
        score: 100,
        description: '高い独創性',
        indicators: [
          '独自の視点や発想がある',
          '創造的な問題解決を提示',
          '新しい観点からの分析',
          '印象に残る主張',
        ],
      },
      {
        score: 80,
        description: 'ある程度の独創性',
        indicators: [
          '一部に独自の視点がある',
          '標準的でない発想も含む',
          'やや新しい観点がある',
        ],
      },
      {
        score: 60,
        description: '標準的',
        indicators: [
          '一般的な視点が中心',
          '予想される範囲内の発想',
          '特に新しさはない',
        ],
      },
      {
        score: 40,
        description: '平凡',
        indicators: [
          'ありきたりな内容',
          '発想に工夫がない',
          '機械的な論述',
        ],
      },
      {
        score: 20,
        description: '独創性の欠如',
        indicators: [
          '完全に型通り',
          '思考の跡が見られない',
          '暗記した内容の再現',
        ],
      },
    ],
  },
];

export function evaluateEssay(
  content: string,
  criteria: RubricCriterion[] = ESSAY_RUBRIC
): {
  totalScore: number;
  breakdown: Record<string, number>;
  feedback: Record<string, string>;
} {
  const breakdown: Record<string, number> = {};
  const feedback: Record<string, string> = {};
  let totalScore = 0;
  
  criteria.forEach(criterion => {
    // 実際の評価ロジックはAI APIで行う
    // ここではプレースホルダー
    const score = 80; // 実際はAIが評価
    breakdown[criterion.name] = score;
    
    const level = criterion.levels.find(l => l.score <= score) || criterion.levels[criterion.levels.length - 1];
    feedback[criterion.name] = level.description;
    
    totalScore += (score * criterion.weight) / 100;
  });
  
  return {
    totalScore: Math.round(totalScore),
    breakdown,
    feedback,
  };
}