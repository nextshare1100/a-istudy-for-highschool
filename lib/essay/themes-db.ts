import { EssayTheme } from '@/types/essay';

export const ESSAY_THEMES: EssayTheme[] = [
  // 一般教養
  {
    id: 'general-001',
    title: 'AIと人間の共存について',
    category: 'general',
    description: 'AI技術の発展が人間社会に与える影響について、あなたの考えを述べなさい。',
    requirements: {
      minWords: 600,
      maxWords: 800,
      timeLimit: 60,
    },
    difficulty: 'medium',
    evaluationCriteria: [
      'AI技術への理解',
      '具体的な事例の提示',
      'バランスの取れた議論',
      '将来への展望',
    ],
  },
  
  // 医学部向け
  {
    id: 'medical-001',
    title: '医療における倫理的判断',
    category: 'faculty_specific',
    faculty: ['医学部', '看護学部'],
    description: '終末期医療における患者の自己決定権と医師の責任について論じなさい。',
    requirements: {
      minWords: 800,
      maxWords: 1000,
      timeLimit: 90,
    },
    difficulty: 'hard',
    evaluationCriteria: [
      '医療倫理への理解',
      '多角的な視点',
      '具体的な事例',
      '結論の明確さ',
    ],
  },
  
  // 法学部向け
  {
    id: 'law-001',
    title: '情報社会における個人情報保護',
    category: 'faculty_specific',
    faculty: ['法学部'],
    description: 'デジタル社会における個人情報保護と利便性のバランスについて、法的観点から論じなさい。',
    requirements: {
      minWords: 700,
      maxWords: 900,
      timeLimit: 75,
    },
    difficulty: 'hard',
    evaluationCriteria: [
      '法的知識の正確性',
      '論理的な構成',
      '現実的な解決策',
      '批判的思考',
    ],
  },
  
  // 経済学部向け
  {
    id: 'economics-001',
    title: '格差社会と経済成長',
    category: 'faculty_specific',
    faculty: ['経済学部', '商学部'],
    description: '経済格差の拡大が経済成長に与える影響について、具体的なデータを基に分析しなさい。',
    requirements: {
      minWords: 800,
      maxWords: 1000,
      timeLimit: 90,
    },
    difficulty: 'hard',
    evaluationCriteria: [
      '経済理論の理解',
      'データ分析能力',
      '政策提言の具体性',
      '論理的一貫性',
    ],
    graphData: {
      type: 'line',
      title: 'ジニ係数と経済成長率の推移',
      data: {
        labels: ['2010', '2012', '2014', '2016', '2018', '2020', '2022'],
        datasets: [
          {
            label: 'ジニ係数',
            data: [0.32, 0.33, 0.34, 0.35, 0.36, 0.38, 0.39],
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
          {
            label: 'GDP成長率（%）',
            data: [3.2, 2.8, 2.5, 2.1, 1.8, -1.2, 2.1],
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
          },
        ],
      },
      questions: [
        'グラフから読み取れる相関関係を説明してください。',
        'この傾向が続いた場合の社会的影響を予測してください。',
      ],
    },
  },
  
  // 時事問題
  {
    id: 'current-001',
    title: '気候変動と持続可能な社会',
    category: 'current_affairs',
    description: '気候変動対策と経済発展の両立について、具体的な方策を提案しなさい。',
    requirements: {
      minWords: 600,
      maxWords: 800,
      timeLimit: 60,
    },
    difficulty: 'medium',
    evaluationCriteria: [
      '環境問題への理解',
      '実現可能な提案',
      '国際的視点',
      '具体的な数値目標',
    ],
  },
];

// 学部別にテーマを取得
export function getThemesByFaculty(faculty: string): EssayTheme[] {
  return ESSAY_THEMES.filter(
    theme => theme.faculty && theme.faculty.includes(faculty)
  );
}

// カテゴリ別にテーマを取得
export function getThemesByCategory(category: string): EssayTheme[] {
  return ESSAY_THEMES.filter(theme => theme.category === category);
}

// 難易度別にテーマを取得
export function getThemesByDifficulty(difficulty: string): EssayTheme[] {
  return ESSAY_THEMES.filter(theme => theme.difficulty === difficulty);
}