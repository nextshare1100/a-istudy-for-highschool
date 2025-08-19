export interface ExpressionCategory {
  name: string;
  description: string;
  expressions: Expression[];
}

export interface Expression {
  japanese: string;
  reading?: string;
  meaning: string;
  usage: string;
  examples: string[];
  level: 'basic' | 'intermediate' | 'advanced';
}

export const COMMON_EXPRESSIONS: ExpressionCategory[] = [
  {
    name: '序論で使える表現',
    description: '小論文の導入部分で効果的な表現',
    expressions: [
      {
        japanese: '近年',
        reading: 'きんねん',
        meaning: '最近の数年間',
        usage: '時事的な話題を導入する際に使用',
        examples: [
          '近年、AIの発展により社会は大きく変化している。',
          '近年の日本では、少子高齢化が深刻な問題となっている。',
        ],
        level: 'basic',
      },
      {
        japanese: '〜という観点から',
        meaning: '特定の視点で考える',
        usage: '論じる視点を明確にする',
        examples: [
          '環境保護という観点から、この問題を考察する。',
          '経済効率という観点から見ると、異なる結論が導かれる。',
        ],
        level: 'intermediate',
      },
      {
        japanese: '問題提起する',
        reading: 'もんだいていきする',
        meaning: '議論すべき問題を提示する',
        usage: '序論で論文の主題を示す',
        examples: [
          'ここで一つの問題提起をしたい。',
          '本稿では、以下の問題提起から議論を始める。',
        ],
        level: 'intermediate',
      },
    ],
  },
  
  {
    name: '論証で使える表現',
    description: '主張を支える際に有効な表現',
    expressions: [
      {
        japanese: '第一に〜第二に〜',
        meaning: '順序立てて説明する',
        usage: '複数の論点を整理して示す',
        examples: [
          '第一に、経済的な利点がある。第二に、社会的な意義も大きい。',
        ],
        level: 'basic',
      },
      {
        japanese: '換言すれば',
        reading: 'かんげんすれば',
        meaning: '別の言い方をすると',
        usage: '同じ内容を分かりやすく言い直す',
        examples: [
          '換言すれば、量より質を重視すべきということだ。',
        ],
        level: 'advanced',
      },
      {
        japanese: '〜に他ならない',
        meaning: 'まさに〜である',
        usage: '強い断定を表す',
        examples: [
          'これは社会全体の責任に他ならない。',
        ],
        level: 'advanced',
      },
    ],
  },
  
  {
    name: '反論・譲歩で使える表現',
    description: '対立意見に言及する際の表現',
    expressions: [
      {
        japanese: '確かに〜しかし',
        meaning: '一部認めつつ反論する',
        usage: '譲歩しながら自説を展開',
        examples: [
          '確かにコストはかかる。しかし、長期的には利益となる。',
        ],
        level: 'basic',
      },
      {
        japanese: '一見〜ように思われる',
        meaning: '表面的にはそう見える',
        usage: '見かけと実際の違いを指摘',
        examples: [
          '一見非効率のように思われるが、実際は異なる。',
        ],
        level: 'intermediate',
      },
      {
        japanese: '〜という批判もあろう',
        meaning: '批判の存在を認める',
        usage: '想定される批判に先回りして言及',
        examples: [
          '理想論だという批判もあろう。',
        ],
        level: 'advanced',
      },
    ],
  },
  
  {
    name: '結論で使える表現',
    description: '小論文をまとめる際の表現',
    expressions: [
      {
        japanese: '以上から',
        meaning: 'これまでの議論から',
        usage: '結論を導入する',
        examples: [
          '以上から、次のような結論が得られる。',
        ],
        level: 'basic',
      },
      {
        japanese: '総じて',
        reading: 'そうじて',
        meaning: '全体的に見て',
        usage: '全体的な評価を述べる',
        examples: [
          '総じて、この政策は成功したと言えよう。',
        ],
        level: 'intermediate',
      },
      {
        japanese: '〜が肝要である',
        reading: 'かんようである',
        meaning: '〜が最も重要である',
        usage: '最重要点を強調',
        examples: [
          '継続的な取り組みが肝要である。',
        ],
        level: 'advanced',
      },
    ],
  },
];

export function getExpressionsByLevel(level: string): Expression[] {
  const expressions: Expression[] = [];
  COMMON_EXPRESSIONS.forEach(category => {
    category.expressions.forEach(exp => {
      if (exp.level === level) {
        expressions.push(exp);
      }
    });
  });
  return expressions;
}

export function searchExpressions(keyword: string): Expression[] {
  const results: Expression[] = [];
  const lowerKeyword = keyword.toLowerCase();
  
  COMMON_EXPRESSIONS.forEach(category => {
    category.expressions.forEach(exp => {
      if (
        exp.japanese.includes(keyword) ||
        exp.meaning.toLowerCase().includes(lowerKeyword) ||
        exp.usage.toLowerCase().includes(lowerKeyword) ||
        exp.examples.some(ex => ex.includes(keyword))
      ) {
        results.push(exp);
      }
    });
  });
  
  return results;
}