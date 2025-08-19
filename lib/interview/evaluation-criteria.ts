export interface EvaluationCriteria {
  category: string;
  weight: number;
  checkPoints: CheckPoint[];
}

export interface CheckPoint {
  id: string;
  description: string;
  scoreRange: [number, number];
  keywords?: string[];
}

export const EVALUATION_CRITERIA: Record<string, EvaluationCriteria[]> = {
  motivation: [
    {
      category: '具体性',
      weight: 30,
      checkPoints: [
        {
          id: 'specific_reason',
          description: '志望理由が具体的に述べられているか',
          scoreRange: [0, 30],
          keywords: ['研究', '教授', 'カリキュラム', '施設', '環境'],
        },
        {
          id: 'university_knowledge',
          description: '大学の特徴を理解しているか',
          scoreRange: [0, 30],
        },
      ],
    },
    {
      category: '論理性',
      weight: 25,
      checkPoints: [
        {
          id: 'logical_flow',
          description: '論理的な構成で話されているか',
          scoreRange: [0, 25],
        },
        {
          id: 'consistency',
          description: '一貫性のある主張か',
          scoreRange: [0, 25],
        },
      ],
    },
    {
      category: '熱意',
      weight: 25,
      checkPoints: [
        {
          id: 'passion',
          description: '学びへの意欲が感じられるか',
          scoreRange: [0, 25],
          keywords: ['学びたい', '研究したい', '貢献したい'],
        },
      ],
    },
    {
      category: '将来性',
      weight: 20,
      checkPoints: [
        {
          id: 'future_vision',
          description: '将来のビジョンが明確か',
          scoreRange: [0, 20],
          keywords: ['将来', '目標', 'キャリア', '夢'],
        },
      ],
    },
  ],
  
  self_pr: [
    {
      category: '具体的エピソード',
      weight: 35,
      checkPoints: [
        {
          id: 'concrete_episode',
          description: '具体的なエピソードが含まれているか',
          scoreRange: [0, 35],
        },
        {
          id: 'quantitative_results',
          description: '数値や成果が明示されているか',
          scoreRange: [0, 35],
        },
      ],
    },
    {
      category: '成長・学び',
      weight: 30,
      checkPoints: [
        {
          id: 'learning_experience',
          description: '経験から何を学んだか明確か',
          scoreRange: [0, 30],
        },
        {
          id: 'growth_process',
          description: '成長過程が説明されているか',
          scoreRange: [0, 30],
        },
      ],
    },
    {
      category: '大学での活用',
      weight: 20,
      checkPoints: [
        {
          id: 'university_application',
          description: '大学でどう活かすか述べられているか',
          scoreRange: [0, 20],
        },
      ],
    },
    {
      category: '独自性',
      weight: 15,
      checkPoints: [
        {
          id: 'uniqueness',
          description: '他の受験生との差別化ができているか',
          scoreRange: [0, 15],
        },
      ],
    },
  ],
};

export function calculateScore(
  category: string,
  checkResults: Record<string, number>
): number {
  const criteria = EVALUATION_CRITERIA[category];
  if (!criteria) return 0;
  
  let totalScore = 0;
  
  criteria.forEach(criterion => {
    let categoryScore = 0;
    let maxCategoryScore = 0;
    
    criterion.checkPoints.forEach(checkPoint => {
      const score = checkResults[checkPoint.id] || 0;
      categoryScore += score;
      maxCategoryScore += checkPoint.scoreRange[1];
    });
    
    const normalizedScore = (categoryScore / maxCategoryScore) * criterion.weight;
    totalScore += normalizedScore;
  });
  
  return Math.round(totalScore);
}