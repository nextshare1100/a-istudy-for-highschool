// 小論文評価用プロンプト
export const ESSAY_EVALUATION_PROMPT = `
あなたは日本の大学入試小論文の評価専門家です。以下の小論文を詳細に評価してください。

【評価対象】
テーマ: {theme_title}
問題文: {theme_description}
文字数要件: {min_words}〜{max_words}字
実際の文字数: {actual_words}字
制限時間: {time_limit}分

【提出された小論文】
{essay_content}

【評価基準】
以下の基準で評価し、JSON形式で返してください：

1. 構成（100点満点）
   - 序論・本論・結論の明確さ
   - 論理展開の一貫性
   - パラグラフ構成の適切さ
   - 読者を意識した構成

2. 内容（100点満点）
   - テーマの理解度
   - 論証の説得力
   - 具体例の適切さと効果
   - 独創性と深い洞察

3. 表現（100点満点）
   - 文章の明確さと読みやすさ
   - 語彙の豊かさと適切さ
   - 文法的正確さ
   - 学術的文体の使用

【出力形式】
{
  "score": 総合点（100点満点）,
  "structure": {
    "score": 点数,
    "feedback": "具体的なフィードバック",
    "strengths": ["良い点1", "良い点2"],
    "weaknesses": ["改善点1", "改善点2"]
  },
  "content": {
    "score": 点数,
    "feedback": "具体的なフィードバック",
    "strengths": ["良い点1", "良い点2"],
    "weaknesses": ["改善点1", "改善点2"]
  },
  "expression": {
    "score": 点数,
    "feedback": "具体的なフィードバック",
    "strengths": ["良い点1", "良い点2"],
    "weaknesses": ["改善点1", "改善点2"]
  },
  "overall": "総評（100-150文字）",
  "suggestions": [
    "具体的な改善提案1",
    "具体的な改善提案2",
    "具体的な改善提案3"
  ],
  "exemplary_sentences": ["特に優れた文章例"],
  "problematic_sentences": ["改善が必要な文章例"]
}

【評価の注意点】
- 大学入試レベルを基準とした厳密な評価
- 建設的で具体的なフィードバック
- 改善可能な点を明確に指摘
- 良い点も積極的に評価
`;

// グラフ分析型小論文用プロンプト
export const GRAPH_ESSAY_EVALUATION_PROMPT = `
あなたは日本の大学入試小論文の評価専門家です。グラフ分析を含む小論文を評価してください。

【評価対象】
テーマ: {theme_title}
問題文: {theme_description}
グラフタイトル: {graph_title}
グラフデータ: {graph_data}
文字数要件: {min_words}〜{max_words}字
実際の文字数: {actual_words}字

【提出された小論文】
{essay_content}

【グラフ分析特有の評価基準】
1. データ読み取りの正確性（25点）
   - 数値の正確な読み取り
   - 傾向の適切な把握
   - 重要なポイントの発見

2. データ解釈の妥当性（25点）
   - 因果関係の分析
   - 背景要因の考察
   - 将来予測の論理性

3. 論述への活用（25点）
   - データと主張の関連性
   - 根拠としての効果的使用
   - グラフ以外の知識との統合

4. 基本的な評価（25点）
   - 構成、内容、表現

【出力形式】
{
  "score": 総合点（100点満点）,
  "graph_analysis": {
    "accuracy_score": 25点満点,
    "interpretation_score": 25点満点,
    "application_score": 25点満点,
    "feedback": "グラフ分析に関する詳細フィードバック"
  },
  "structure": {
    "score": 点数,
    "feedback": "フィードバック"
  },
  "content": {
    "score": 点数,
    "feedback": "フィードバック"
  },
  "expression": {
    "score": 点数,
    "feedback": "フィードバック"
  },
  "overall": "総評",
  "suggestions": ["改善提案1", "改善提案2", "改善提案3"]
}
`;

// 小論文テーマ生成用プロンプト
export const ESSAY_THEME_GENERATION_PROMPT = `
あなたは日本の大学入試小論文の出題専門家です。以下の条件で小論文テーマを生成してください。

【生成条件】
- カテゴリ: {category}
- 学部: {faculty}
- 難易度: {difficulty}
- グラフ問題: {include_graph}
- 時事問題: {current_affairs}
- 追加要望: {custom_prompt}

【生成するテーマの要件】
1. 実際の大学入試で出題される可能性が高いもの
2. 受験生の思考力・論理力・表現力を測定できるもの
3. 明確な評価基準を設定できるもの
4. 時間内に書き切れる適切な分量

【出力形式】
{
  "themes": [
    {
      "title": "テーマタイトル（20-40文字）",
      "category": "{category}",
      "faculties": ["対象学部1", "対象学部2"],
      "description": "問題文（100-200文字）。具体的な指示を含む。",
      "requirements": {
        "minWords": 最小文字数,
        "maxWords": 最大文字数,
        "timeLimit": 制限時間（分）
      },
      "difficulty": "{difficulty}",
      "evaluationCriteria": [
        "評価基準1（具体的に）",
        "評価基準2（具体的に）",
        "評価基準3（具体的に）",
        "評価基準4（具体的に）"
      ],
      "sampleOutline": [
        "序論: 具体的なポイント",
        "本論1: 具体的なポイント",
        "本論2: 具体的なポイント",
        "結論: 具体的なポイント"
      ],
      "keywords": ["キーワード1", "キーワード2", "キーワード3"],
      "backgroundKnowledge": "必要な背景知識の説明",
      "commonMistakes": ["よくある間違い1", "よくある間違い2"],
      "scoringGuide": {
        "excellent": "90点以上の基準",
        "good": "70-89点の基準",
        "average": "50-69点の基準",
        "poor": "50点未満の基準"
      }
    }
  ]
}

【グラフ問題の場合の追加要素】
"graphData": {
  "type": "グラフの種類（line/bar/pie/scatter）",
  "title": "グラフタイトル",
  "data": {
    "labels": ["ラベル1", "ラベル2", ...],
    "datasets": [{
      "label": "データセット名",
      "data": [数値1, 数値2, ...]
    }]
  },
  "questions": [
    "グラフ読み取り問題1",
    "グラフ読み取り問題2"
  ],
  "source": "データの出典",
  "analysisHints": ["分析のヒント1", "分析のヒント2"]
}
`;

// 小論文添削用プロンプト
export const ESSAY_CORRECTION_PROMPT = `
あなたは日本の大学入試小論文の添削専門家です。提出された小論文を詳細に添削してください。

【添削対象】
{essay_content}

【添削の観点】
1. 構成の改善
2. 論理展開の強化
3. 表現の洗練
4. 説得力の向上

【出力形式】
{
  "corrections": [
    {
      "type": "structure/logic/expression/content",
      "original": "元の文章",
      "corrected": "改善案",
      "reason": "修正理由",
      "importance": "high/medium/low"
    }
  ],
  "paragraphAnalysis": [
    {
      "paragraph": 1,
      "role": "序論/本論/結論",
      "effectiveness": "効果的かどうかの評価",
      "suggestions": "段落レベルの改善提案"
    }
  ],
  "rhetoricalDevices": [
    {
      "device": "使用されている修辞技法",
      "example": "具体例",
      "effectiveness": "効果の評価"
    }
  ],
  "vocabularyEnhancement": [
    {
      "original": "一般的な表現",
      "enhanced": "より学術的・効果的な表現",
      "context": "使用文脈"
    }
  ],
  "overallImprovement": "全体的な改善方針（200文字程度）"
}
`;

// 模範解答生成用プロンプト
export const MODEL_ESSAY_GENERATION_PROMPT = `
あなたは日本の大学入試小論文の模範解答作成者です。以下のテーマで模範解答を作成してください。

【テーマ情報】
タイトル: {theme_title}
問題文: {theme_description}
文字数: {min_words}〜{max_words}字
評価基準: {evaluation_criteria}

【模範解答の要件】
1. 評価基準をすべて満たす
2. 論理的で説得力がある
3. 具体例を効果的に使用
4. 大学入試レベルの語彙・表現
5. 明確な構成

【出力形式】
{
  "modelEssay": {
    "content": "模範解答本文",
    "wordCount": 文字数,
    "structure": {
      "introduction": "序論の内容",
      "body1": "本論1の内容",
      "body2": "本論2の内容",
      "conclusion": "結論の内容"
    },
    "keyPoints": [
      "ポイント1",
      "ポイント2",
      "ポイント3"
    ],
    "technicalNotes": [
      "技術的な工夫1",
      "技術的な工夫2"
    ],
    "vocabularyHighlights": [
      {
        "word": "使用した高度な語彙",
        "context": "使用文脈",
        "effect": "効果"
      }
    ]
  }
}
`;

// プロンプトを適用する関数
export function applyPromptTemplate(template: string, variables: Record<string, any>): string {
  let prompt = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{${key}}`, 'g');
    prompt = prompt.replace(regex, String(value));
  });
  
  return prompt;
}

// 使用例
export function getEssayEvaluationPrompt(essay: any, theme: any): string {
  return applyPromptTemplate(ESSAY_EVALUATION_PROMPT, {
    theme_title: theme.title,
    theme_description: theme.description,
    min_words: theme.requirements.minWords,
    max_words: theme.requirements.maxWords,
    actual_words: essay.wordCount,
    time_limit: theme.requirements.timeLimit,
    essay_content: essay.content,
  });
}

export function getThemeGenerationPrompt(params: any): string {
  return applyPromptTemplate(ESSAY_THEME_GENERATION_PROMPT, {
    category: params.category,
    faculty: params.faculty || '指定なし',
    difficulty: params.difficulty,
    include_graph: params.includeGraph ? 'あり' : 'なし',
    current_affairs: params.currentAffairs ? '含める' : '含めない',
    custom_prompt: params.customPrompt || 'なし',
  });
}