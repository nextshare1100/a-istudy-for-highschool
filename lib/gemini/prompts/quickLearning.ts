// lib/gemini/prompts/quickLearning.ts

export const QUICK_LEARNING_PROMPTS = {
  // 基本問題生成プロンプト
  GENERATE_QUICK_QUESTIONS: (params: {
    subject: string;
    unit: string;
    count: number;
    sessionType: 'morning' | 'evening' | 'random';
  }) => {
    const timeContext = {
      morning: '朝の通学時間に適した、頭を活性化させる',
      evening: '夜の就寝前に適した、記憶に定着しやすい',
      random: '隙間時間に手軽に解ける',
    };

    return `
あなたは日本の大学受験指導のエキスパートです。
${timeContext[params.sessionType]}問題を${params.count}問作成してください。

【科目】${params.subject}
【単元】${params.unit}

【重要な制約】
1. 問題形式: 4択問題のみ
2. 解答時間: 30秒以内で解ける
3. 難易度: 基礎〜標準（共通テストレベル）
4. 内容: 知識確認型（定理・公式・用語・基本概念）
5. 計算: 暗算可能な簡単なもののみ
6. 問題文: 50文字以内で簡潔に

【出力形式】
以下のJSON配列形式で出力してください：

\`\`\`json
[
  {
    "id": "q1",
    "content": "問題文（簡潔で明確に）",
    "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
    "correctAnswer": 0,
    "explanation": "正解の理由を1-2文で説明",
    "hint": "ヒント（10-20文字）",
    "relatedConcepts": ["関連概念1", "関連概念2"],
    "difficulty": 1,
    "estimatedTime": 20
  }
]
\`\`\`

【注意事項】
- correctAnswerは0-3の数値（配列のインデックス）
- difficultyは1（易）、2（標準）、3（やや難）
- estimatedTimeは秒単位（10-30）
- 数式は「x²」「√2」のようにUnicode文字を使用
- 朝の問題は基本的な復習内容を中心に
- 夜の問題は暗記系の内容を中心に
`;
  },

  // 科目別詳細プロンプト
  SUBJECT_SPECIFIC: {
    math: (unit: string) => `
【数学 - ${unit}】
以下のような問題を作成してください：

1. 公式の穴埋め問題
   例: 「sin²θ + cos²θ = □」

2. 定理の名称を問う問題
   例: 「a² + b² = c²を満たす直角三角形の定理は？」

3. 基本的な値を問う問題
   例: 「sin 90°の値は？」

4. 性質を問う問題
   例: 「ベクトルの内積が0のとき、2つのベクトルの関係は？」

重要: 複雑な計算は避け、概念理解を確認する問題にしてください。
`,

    english: (unit: string) => `
【英語 - ${unit}】
以下のような問題を作成してください：

1. 単語の意味を問う問題
   例: 「"accomplish"の意味は？」

2. 熟語・イディオムの穴埋め
   例: 「look ( ) to ～ing = ～を楽しみにする」

3. 文法ルールの確認
   例: 「仮定法過去の動詞の形は？」

4. 基本的な語法
   例: 「"neither A nor B"の意味は？」

重要: 長文読解は避け、瞬時に判断できる問題にしてください。
`,

    science: (unit: string) => `
【理科 - ${unit}】
以下のような問題を作成してください：

1. 化学式・元素記号
   例: 「水の化学式は？」

2. 法則・原理の名称
   例: 「F = maを表す法則は？」

3. 基本的な事実
   例: 「光合成で生成される気体は？」

4. 実験器具・用語
   例: 「pHを測定する試験紙の名称は？」

重要: 計算問題は避け、知識の確認に特化してください。
`,
  },

  // エラー時の再生成プロンプト
  REGENERATE_WITH_CONSTRAINTS: (originalPrompt: string, error: string) => `
前回の生成でエラーが発生しました。
エラー内容: ${error}

以下の点に特に注意して、再度問題を生成してください：
1. 必ずJSON形式で出力すること
2. 日本語の文字化けに注意すること
3. 数式はUnicode文字を使用すること
4. 問題文は必ず50文字以内にすること

元のリクエスト:
${originalPrompt}
`,
};

// 復習用プロンプト
export const REVIEW_PROMPTS = {
  GENERATE_REVIEW_QUESTIONS: (params: {
    previousQuestions: Array<{
      content: string;
      userAnswer: number;
      isCorrect: boolean;
    }>;
    subject: string;
  }) => `
以下の問題の解答履歴を基に、復習に適した類似問題を3問生成してください。

【解答履歴】
${params.previousQuestions.map((q, i) => `
${i + 1}. ${q.content}
   ユーザーの解答: ${q.userAnswer}
   正誤: ${q.isCorrect ? '正解' : '不正解'}
`).join('\n')}

【要求事項】
- 間違えた問題の類似問題を優先的に生成
- 少し角度を変えた問い方で理解を深める
- 前回より少しだけ難易度を調整

出力形式は通常の問題生成と同じJSON形式でお願いします。
`,
};