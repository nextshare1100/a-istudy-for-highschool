export interface StructurePattern {
  id: string;
  name: string;
  description: string;
  sections: StructureSection[];
  bestFor: string[];
  wordDistribution: Record<string, number>;
}

export interface StructureSection {
  name: string;
  purpose: string;
  components: string[];
  examples: string[];
  percentage: number;
}

export const STRUCTURE_PATTERNS: StructurePattern[] = [
  {
    id: 'basic',
    name: '基本構成',
    description: '最もスタンダードな三段構成',
    sections: [
      {
        name: '序論',
        purpose: '問題提起と論文の方向性を示す',
        components: [
          '背景説明',
          '問題提起',
          '論文の構成予告',
        ],
        examples: [
          '近年、〜が社会問題となっている。',
          'この問題について、以下の観点から論じる。',
        ],
        percentage: 20,
      },
      {
        name: '本論',
        purpose: '具体的な論証を展開',
        components: [
          '主張の提示',
          '根拠の説明',
          '具体例',
          '反論への対処',
        ],
        examples: [
          '第一に、〜という点が挙げられる。',
          '例えば、〜という事例がある。',
          '確かに〜という意見もあるが、',
        ],
        percentage: 60,
      },
      {
        name: '結論',
        purpose: '主張をまとめ、展望を示す',
        components: [
          '論点の整理',
          '主張の再確認',
          '今後の展望',
        ],
        examples: [
          '以上から、〜ということが明らかになった。',
          '今後は〜が期待される。',
        ],
        percentage: 20,
      },
    ],
    bestFor: ['一般的な論述', '説明型の小論文'],
    wordDistribution: {
      序論: 20,
      本論: 60,
      結論: 20,
    },
  },
  
  {
    id: 'problem-solution',
    name: '問題解決型',
    description: '問題提起から解決策を提示する構成',
    sections: [
      {
        name: '問題提起',
        purpose: '解決すべき問題を明確化',
        components: [
          '現状説明',
          '問題点の指摘',
          '問題の重要性',
        ],
        examples: [
          '現在、〜という問題が深刻化している。',
          'このままでは〜という事態が予想される。',
        ],
        percentage: 25,
      },
      {
        name: '原因分析',
        purpose: '問題の原因を分析',
        components: [
          '主要因の特定',
          '背景要因の説明',
          '因果関係の説明',
        ],
        examples: [
          'この問題の主な原因は〜にある。',
          '背景には〜という事情がある。',
        ],
        percentage: 25,
      },
      {
        name: '解決策提示',
        purpose: '具体的な解決策を提案',
        components: [
          '解決策の提示',
          '実現可能性の検討',
          '期待される効果',
        ],
        examples: [
          '解決策として〜が考えられる。',
          '実施にあたっては〜が必要である。',
        ],
        percentage: 35,
      },
      {
        name: 'まとめ',
        purpose: '全体を総括し、行動を促す',
        components: [
          '要点の整理',
          '実行の重要性',
          '将来展望',
        ],
        examples: [
          '以上の対策により〜が期待できる。',
          '今こそ行動を起こすべきである。',
        ],
        percentage: 15,
      },
    ],
    bestFor: ['政策提言', '社会問題', '改善提案'],
    wordDistribution: {
      問題提起: 25,
      原因分析: 25,
      解決策提示: 35,
      まとめ: 15,
    },
  },
  
  {
    id: 'comparison',
    name: '比較対照型',
    description: '複数の視点を比較検討する構成',
    sections: [
      {
        name: '導入',
        purpose: '比較する対象と論点を提示',
        components: [
          '比較対象の提示',
          '比較の観点',
          '論文の目的',
        ],
        examples: [
          'AとBを〜の観点から比較する。',
          'それぞれの特徴を明らかにしたい。',
        ],
        percentage: 15,
      },
      {
        name: '対象A の分析',
        purpose: '一方の対象を詳細に分析',
        components: [
          '特徴の説明',
          '長所の分析',
          '短所の分析',
        ],
        examples: [
          'Aの特徴として〜が挙げられる。',
          '利点は〜である一方、〜という欠点もある。',
        ],
        percentage: 30,
      },
      {
        name: '対象B の分析',
        purpose: 'もう一方の対象を分析',
        components: [
          '特徴の説明',
          '長所の分析',
          '短所の分析',
        ],
        examples: [
          '一方、Bは〜という特徴を持つ。',
          'Aと比較すると〜という違いがある。',
        ],
        percentage: 30,
      },
      {
        name: '総合評価',
        purpose: '比較結果をまとめ、結論を導く',
        components: [
          '共通点と相違点',
          '総合的な評価',
          '状況に応じた選択',
        ],
        examples: [
          '両者を比較すると〜という結論が得られる。',
          '状況に応じて使い分けることが重要である。',
        ],
        percentage: 25,
      },
    ],
    bestFor: ['比較論述', '選択の根拠説明', '多角的分析'],
    wordDistribution: {
      導入: 15,
      対象A: 30,
      対象B: 30,
      総合評価: 25,
    },
  },
];

export function getStructurePattern(id: string): StructurePattern | undefined {
  return STRUCTURE_PATTERNS.find(pattern => pattern.id === id);
}

export function getRecommendedPattern(essayType: string): StructurePattern {
  // エッセイタイプに基づいて最適な構成を推奨
  const recommendations: Record<string, string> = {
    argumentative: 'problem-solution',
    comparative: 'comparison',
    explanatory: 'basic',
    analytical: 'problem-solution',
  };
  
  const patternId = recommendations[essayType] || 'basic';
  return getStructurePattern(patternId) || STRUCTURE_PATTERNS[0];
}