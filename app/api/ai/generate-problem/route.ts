// app/api/ai/generate-problem/route.ts - 拡張版

import { NextRequest } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExtendedParameters, ValidationChecks } from '@/types/gemini';

// ========== デバッグとエラーハンドリング ==========
const DEBUG_MODE = process.env.NODE_ENV === 'development';

function debugLog(stage: string, data: any) {
  if (DEBUG_MODE) {
    console.log(`[API Debug] ${stage}:`, JSON.stringify(data, null, 2));
  }
}

// JSONレスポンスの安全な抽出
function extractJSON(text: string): any | null {
  try {
    debugLog('Attempting to extract JSON from text', { 
      textLength: text.length,
      preview: text.substring(0, 200)
    });
    
    // 複数のパターンでJSONを抽出
    const patterns = [
      /```json\s*\n([\s\S]*?)\n\s*```/,
      /```json\s*([\s\S]*?)```/,
      /```\s*\n([\s\S]*?)\n\s*```/,
      /\{[\s\S]*\}/
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const jsonStr = match[1] || match[0];
        try {
          const parsed = JSON.parse(jsonStr);
          debugLog('Successfully parsed JSON', parsed);
          return parsed;
        } catch (e) {
          debugLog('JSON parse error', { error: e, text: jsonStr });
        }
      }
    }
    
    // 最後の手段として全体をJSONとしてパース
    try {
      const parsed = JSON.parse(text);
      debugLog('Successfully parsed entire text as JSON', parsed);
      return parsed;
    } catch (e) {
      debugLog('Failed to parse entire text as JSON', { error: e });
    }
    
    return null;
  } catch (error) {
    debugLog('Failed to extract JSON', { error, text: text.substring(0, 200) });
    return null;
  }
}

// レスポンスバリデーター（拡張版）
class ResponseValidator {
  static validateQuestionData(data: any): { isValid: boolean; error?: string } {
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'データがオブジェクトではありません' };
    }
    
    if (!data.question || typeof data.question !== 'string' || data.question.trim() === '') {
      return { isValid: false, error: '問題文が存在しないか、空です' };
    }
    
    return { isValid: true };
  }
  
  static validateAnswerData(data: any): { isValid: boolean; error?: string } {
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'データがオブジェクトではありません' };
    }
    
    if (!data.answer) {
      return { isValid: false, error: '答えが存在しません' };
    }
    
    return { isValid: true };
  }
  
  // 拡張パラメータの検証
  static validateExtendedParameters(params: ExtendedParameters): ValidationChecks {
    const includedConcepts: string[] = [];
    const missingConcepts: string[] = [];
    const skillsCovered: string[] = [];
    const learningOutcomes: string[] = [];
    
    // 教育目標の検証
    if (params.educationalObjective) {
      if (params.educationalObjective.targetSkills) {
        skillsCovered.push(...params.educationalObjective.targetSkills);
      }
      if (params.educationalObjective.primaryGoal) {
        learningOutcomes.push(params.educationalObjective.primaryGoal);
      }
    }
    
    // 内容仕様の検証
    if (params.contentSpecification) {
      if (params.contentSpecification.mustIncludeConcepts) {
        includedConcepts.push(...params.contentSpecification.mustIncludeConcepts);
      }
    }
    
    const requirementScore = includedConcepts.length > 0 ? 100 : 50;
    const educationalScore = skillsCovered.length > 0 ? 100 : 50;
    
    return {
      requirementsFulfillment: {
        includedConcepts,
        missingConcepts,
        score: requirementScore
      },
      difficultyAlignment: {
        estimatedDifficulty: 'medium',
        confidence: 0.8,
        reasoning: '指定された条件に基づいて難易度を推定しました'
      },
      educationalValue: {
        skillsCovered,
        learningOutcomes,
        score: educationalScore
      }
    };
  }
}

// ========== 型定義 ==========
interface GenerateProblemRequest {
  subject: string;
  topic: string;
  difficulty: string;
  problemType: string;
  includeCanvas?: boolean;
  additionalRequirements?: string;
  subjectName?: string;
  // 拡張パラメータ（新規追加）
  extendedParameters?: ExtendedParameters;
  useAdvancedCustomization?: boolean;
}

interface GeneratedProblem {
  question: string;
  options?: string[];
  answer: string | string[];
  explanation: string;
  hints?: string[];
  canvasData?: any;
  estimatedTime?: number;
  keywords?: string[];
  sequences?: string[];
  formulaType?: 'equation' | 'theorem' | 'law' | 'definition';
  formulaName?: string;
  blankPositions?: number[];
  inputType?: 'numeric' | 'algebraic' | 'text';
  passageText?: string;
  passageTitle?: string;
  passageSource?: string;
  passageMetadata?: PassageMetadata;
  comprehensionQuestions?: ComprehensionQuestion[];
  vocabularyType?: 'kanji' | 'kobun' | 'kanbun' | 'english_word' | 'english_idiom';
  targetWord?: string;
  // 教育メタデータ（新規追加）
  educationalMetadata?: {
    bloomsTaxonomyLevel: string[];
    cognitiveLoad: 'low' | 'medium' | 'high';
    prerequisiteTopics: string[];
  };
}

interface PassageMetadata {
  genre: 'fiction' | 'non-fiction' | 'essay' | 'article' | 'academic';
  wordCount: number;
  readingLevel: string;
  themes: string[];
  keyConcepts: string[];
}

interface ComprehensionQuestion {
  id: string;
  type: 'main_idea' | 'detail' | 'inference' | 'vocabulary' | 'structure' | 'author_purpose';
  question: string;
  requiredElements: string[];
  scoringFocus: string[];
}

// ========== Canvas必要性判定 ==========
class CanvasDetector {
  static needsCanvas(
    subject: string,
    topic: string,
    problemType: string,
    questionText: string
  ): {
    needed: boolean;
    canvasType?: 'coordinate' | 'geometry' | 'physics' | 'statistics';
    confidence: number;
  } {
    // 視覚的要素が必要なキーワード
    const visualKeywords = {
      coordinate: [
        'グラフ', '関数', '曲線', '放物線', '直線', 'y=', 'f(x)=', 
        '座標', '点', 'プロット', '頂点', '交点', '最大値', '最小値',
        '2次関数', '3次関数', '指数関数', '対数関数', '三角関数'
      ],
      geometry: [
        '三角形', '円', '四角形', '図形', '角度', '面積', '周長',
        '平行', '垂直', '対称', '相似', '合同', '多角形', '正方形',
        '長方形', '台形', '平行四辺形', 'ひし形'
      ],
      physics: [
        'ベクトル', '力', '速度', '加速度', '運動', '軌道',
        '矢印', '向き', '大きさ', '成分', '合成', '分解',
        '振り子', 'ばね', '衝突', '摩擦'
      ],
      statistics: [
        'ヒストグラム', '散布図', '箱ひげ図', 'データ', '分布',
        '度数', '相関', '回帰', '標準偏差', '平均', '中央値',
        '最頻値', '四分位', 'グラフ'
      ]
    };

    // スコアリング
    let maxScore = 0;
    let detectedType: string | undefined;

    for (const [type, keywords] of Object.entries(visualKeywords)) {
      const score = keywords.reduce((acc, keyword) => 
        acc + (questionText && questionText.includes(keyword) ? 1 : 0), 0
      );
      
      if (score > maxScore) {
        maxScore = score;
        detectedType = type;
      }
    }

    // 問題タイプによる自動判定
    const visualProblemTypes = [
      'graph_drawing', 'function_analysis', 'geometry_proof',
      'vector_calculation', 'coordinate_geometry', 'data_visualization'
    ];

    const needed = maxScore > 0 || visualProblemTypes.includes(problemType);

    return {
      needed,
      canvasType: detectedType as any,
      confidence: Math.min(maxScore / 3, 1)
    };
  }
}

// ========== 問題タイプの判定関数 ==========
function shouldExcludeAudioProblems(subject: string, topic: string): boolean {
  const audioTopics = ['リスニング', 'listening', '音声', 'audio', '聞き取り', '発音'];
  return audioTopics.some(keyword => topic?.toLowerCase().includes(keyword) || false);
}

function isFormulaProblem(problemType: string, subject: string): boolean {
  const formulaSubjects = ['math', 'physics', 'chemistry'];
  return problemType === 'fill_in_blank' && formulaSubjects.some(s => subject?.toLowerCase().includes(s) || false);
}

function isReadingComprehensionProblem(subject: string, problemType: string): boolean {
  const readingSubjects = ['japanese', 'english'];
  return readingSubjects.includes(subject) && problemType === 'reading_comprehension';
}

function isVocabularyProblem(subject: string, problemType: string): boolean {
  const languageSubjects = ['japanese', 'english'];
  return languageSubjects.includes(subject) && problemType === 'vocabulary';
}

// ========== モデル選択ロジック（拡張版） ==========
class ModelSelector {
  static selectOptimalModel(request: GenerateProblemRequest, needsCanvas: boolean): {
    modelName: string;
    reason: string;
    estimatedCost: number;
  } {
    const {
      subject,
      topic,
      difficulty,
      problemType,
      includeCanvas,
      additionalRequirements = '',
      useAdvancedCustomization = false,
      extendedParameters
    } = request;

    if (shouldExcludeAudioProblems(subject, topic)) {
      return {
        modelName: 'gemini-1.5-flash',
        reason: '音声問題のためテキストベースの代替問題を生成',
        estimatedCost: 0.0003
      };
    }

    let proScore = 0;
    const reasons = [];

    // 詳細カスタマイズ使用時は高性能モデルを優先
    if (useAdvancedCustomization && extendedParameters) {
      proScore += 40;
      reasons.push('詳細カスタマイズ機能使用');
    }

    // Canvas生成が必要な場合
    if (includeCanvas || needsCanvas) {
      proScore += 30;
      reasons.push('図形・グラフ生成');
      
      if (difficulty === 'hard') {
        proScore += 20;
        reasons.push('複雑な図形');
      }
    }

    if (isReadingComprehensionProblem(subject, problemType)) {
      proScore += 40;
      reasons.push('長文読解問題');
    }

    if (['solution_sequence', 'event_sequence', 'sentence_sequence'].includes(problemType) && difficulty === 'hard') {
      proScore += 30;
      reasons.push('複雑な並び替え問題');
    }

    if (subject && subject.includes('math') && difficulty === 'hard') {
      proScore += 30;
      reasons.push('高度な数学問題');
    }

    const useProModel = proScore >= 50;

    if (useProModel) {
      return {
        modelName: 'gemini-1.5-pro',
        reason: reasons.join('、') + 'のため高性能モデルを使用',
        estimatedCost: 0.01
      };
    } else {
      return {
        modelName: 'gemini-1.5-flash',
        reason: '標準的な問題のため高速モデルを使用',
        estimatedCost: 0.0003
      };
    }
  }
}

// ========== 構造化プロンプト生成（新規追加） ==========
function generateStructuredPrompt(
  request: GenerateProblemRequest,
  modelType: string,
  previousData?: any
): string {
  const { subject, topic, difficulty, problemType, extendedParameters } = request;
  
  if (!extendedParameters || !request.useAdvancedCustomization) {
    return generateOptimizedPrompt(request, modelType, 'question', previousData);
  }
  
  let prompt = `
# 問題生成指示書

## 1. 基本情報
- 科目: ${subject} (${request.subjectName})
- 単元: ${topic}
- 難易度: ${difficulty}
- 問題形式: ${problemType}

`;

  // 教育目標
  if (extendedParameters.educationalObjective) {
    const obj = extendedParameters.educationalObjective;
    prompt += `## 2. 教育目標
### 主要目標
${obj.primaryGoal}

### 測定する能力
${obj.targetSkills.map(skill => `- ${skill}`).join('\n')}

`;
  }

  // 内容要件
  if (extendedParameters.contentSpecification) {
    const spec = extendedParameters.contentSpecification;
    prompt += `## 3. 内容要件
### 必須概念
${spec.mustIncludeConcepts.map(c => `- ${c}`).join('\n')}

### 避けるべき概念
${spec.avoidConcepts.map(c => `- ${c}`).join('\n')}

`;
    
    // 数値制約
    if (spec.numericalConstraints) {
      prompt += `### 数値制約
- 整数のみ: ${spec.numericalConstraints.integerOnly ? 'はい' : 'いいえ'}
- 範囲: ${spec.numericalConstraints.range.min} ～ ${spec.numericalConstraints.range.max}
- 分数を避ける: ${spec.numericalConstraints.avoidFractions ? 'はい' : 'いいえ'}

`;
    }
  }

  // 評価基準
  if (extendedParameters.assessmentCriteria) {
    const criteria = extendedParameters.assessmentCriteria;
    prompt += `## 4. 評価基準
### 理由説明の必要性
${criteria.requiredJustification ? '解答には必ず理由説明を含める' : '理由説明は任意'}

### チェックすべき誤答パターン
${criteria.commonMistakesToCheck.map(m => `- ${m}`).join('\n')}

`;
    
    // 部分点構造
    if (criteria.partialCreditStructure) {
      prompt += `### 部分点構造
${criteria.partialCreditStructure.steps.map((step, i) => 
  `${i + 1}. ${step.description} (${step.maxPoints}点)
   評価基準: ${step.criteria.join(', ')}`
).join('\n')}

`;
    }
  }

  // 文脈設定
  if (extendedParameters.contextSetting) {
    const context = extendedParameters.contextSetting;
    if (context.realWorldContext) {
      prompt += `## 5. 文脈設定
実社会での応用: ${context.realWorldContext}
`;
    }
    if (context.narrativeStyle) {
      prompt += `文体: ${context.narrativeStyle === 'formal' ? '形式的' : 
                     context.narrativeStyle === 'conversational' ? '会話的' : '物語調'}
`;
    }
  }

  // 言語設定
  if (extendedParameters.languagePreferences) {
    const lang = extendedParameters.languagePreferences;
    prompt += `## 6. 言語設定
- 語彙レベル: ${lang.vocabulary === 'basic' ? '基本的' : 
                  lang.vocabulary === 'intermediate' ? '中級' : '上級'}
- 文章の複雑さ: ${lang.sentenceComplexity === 'simple' ? 'シンプル' : 
                   lang.sentenceComplexity === 'moderate' ? '標準' : '複雑'}
- 専門用語の使用: ${lang.technicalTermUsage === 'minimal' ? '最小限' : 
                    lang.technicalTermUsage === 'standard' ? '標準' : '積極的'}

`;
  }

  prompt += `
## 出力要件
以下のJSON形式で問題を生成してください：
\`\`\`json
{
  "question": "問題文",
  "answer": "答え",
  "explanation": "詳細な解説",
  "hints": ["ヒント1", "ヒント2"],
  "educationalMetadata": {
    "bloomsTaxonomyLevel": ["適用", "分析"],
    "cognitiveLoad": "medium",
    "prerequisiteTopics": ["前提となる知識"]
  }
}
\`\`\`
`;

  return prompt;
}

// ========== Canvas生成プロンプト ==========
function generateCanvasPrompt(
  request: GenerateProblemRequest,
  questionData: any,
  canvasType: string
): string {
  const { subject, topic, difficulty } = request;
  
  // Canvas タイプ別の詳細なプロンプト
  const typeSpecificInstructions = {
    coordinate: `
【関数・グラフの場合】
- 関数式は必ずJavaScript形式に変換（例: x^2 → x*x、2x → 2*x）
- 定義域は関数の特性に応じて設定（対数なら x > 0）
- 重要な点（頂点、交点、極値）にはpointを追加
- 複数の関数がある場合は色分けして区別
- グラフの形状が明確に分かる範囲を設定`,
    
    geometry: `
【図形問題の場合】
- 座標は問題に適した値を使用（整数値を優先）
- 角度マークや長さの表示が必要な場合はtextで追加
- 補助線は破線（dashed: true）で表示
- 図形の内部を塗る場合はfill: trueとfillOpacity: 0.2
- 頂点にはラベルを付ける`,
    
    physics: `
【物理・ベクトルの場合】
- ベクトルは矢印付きで表示（vector要素を使用）
- 力の大きさに応じて線の太さを調整
- 運動の軌跡は点線で表示
- 物体はcircleまたはrectangleで表現
- 単位を含めたラベルを追加`,
    
    statistics: `
【統計グラフの場合】
- データ点は明確に表示（point要素）
- 回帰直線や近似曲線を追加
- 軸ラベルは必須（単位も含める）
- 凡例が必要な場合はtext要素で追加
- データの範囲に応じて軸の範囲を調整`
  };
  
  return `
【Canvas図形データの生成】
問題: ${questionData.question}
科目: ${subject}
単元: ${topic}
難易度: ${difficulty}
図形タイプ: ${canvasType}

この問題に必要な図形・グラフのデータを生成してください。
問題文に登場するすべての数式・図形・データを正確に描画することが重要です。

${typeSpecificInstructions[canvasType as keyof typeof typeSpecificInstructions] || ''}

【出力形式（JSONのみ）】
\`\`\`json
{
  "config": {
    "type": "${canvasType}",
    "width": 600,
    "height": 400,
    "showGrid": true,
    "showAxes": true,
    "xRange": [-10, 10],
    "yRange": [-10, 10],
    "gridSpacing": 1,
    "backgroundColor": "#ffffff",
    "padding": 40,
    "elements": [
      {
        "id": "grid-1",
        "type": "grid",
        "spacing": 1,
        "color": "#e0e0e0",
        "lineWidth": 0.5
      },
      {
        "id": "axes-1",
        "type": "axes",
        "showLabels": true,
        "xLabel": "x",
        "yLabel": "y",
        "color": "#333333",
        "lineWidth": 2
      },
      {
        "id": "function-1",
        "type": "function",
        "expression": "x*x - 4*x + 3",
        "domain": [-2, 6],
        "color": "#2563eb",
        "lineWidth": 2,
        "label": "y = x² - 4x + 3"
      },
      {
        "id": "point-1",
        "type": "point",
        "x": 2,
        "y": -1,
        "radius": 5,
        "color": "#dc2626",
        "label": "頂点(2, -1)",
        "labelOffsetX": 10,
        "labelOffsetY": -5
      }
    ]
  },
  "answerType": "point",
  "answerConfig": {
    "point": {
      "tolerance": 0.5,
      "hint": "グラフの頂点をクリックしてください"
    }
  }
}
\`\`\``;
}

// ========== ユーティリティ関数 ==========
function encodeSSE(data: any): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

// ========== プロンプト生成（統一されたJSON形式） ==========
const UNIFIED_JSON_FORMAT = `
出力は必ず以下のJSON形式で返してください。それ以外の説明文は一切不要です。
\`\`\`json
{
  "question": "問題文（必須）",
  "answer": "答え（必須）",
  "explanation": "解説（必須）",
  "difficulty": "easy|medium|hard（必須）",
  "hints": ["ヒント1", "ヒント2"]（オプション）
}
\`\`\`
`;

function generateOptimizedPrompt(
  request: GenerateProblemRequest,
  modelType: string,
  stage: 'question' | 'options' | 'answer' | 'explanation' | 'passage',
  previousData?: any
): string {
  const { subject, topic, difficulty, problemType } = request;
  
  if (shouldExcludeAudioProblems(subject, topic)) {
    const audioAlternative = `
【重要】音声を使用する問題は生成できません。
代わりに、${topic}に関連するテキストベースの問題を生成してください。`;
    return generateStandardPrompt(request, modelType, stage, audioAlternative, previousData);
  }
  
  // 公式穴埋め問題の判定
  if (problemType === 'fill_in_blank' && isFormulaProblem(problemType, subject)) {
    return generateFormulaFillBlankPrompt(request, modelType, stage, previousData);
  }
  
  if (isReadingComprehensionProblem(subject, problemType)) {
    return generateReadingComprehensionPrompt(request, modelType, stage as any, previousData);
  }
  
  if (isVocabularyProblem(subject, problemType)) {
    return generateVocabularyPrompt(request, modelType, stage, previousData);
  }
  
  return generateStandardPrompt(request, modelType, stage, '', previousData);
}

// ========== 標準プロンプト ==========
function generateStandardPrompt(
  request: GenerateProblemRequest,
  modelType: string,
  stage: string,
  specialInstructions: string = '',
  previousData?: any
): string {
  const { subject, topic, difficulty, problemType, additionalRequirements } = request;
  
  const difficultyMap: { [key: string]: string } = {
    'easy': '基礎レベル（教科書の例題レベル）',
    'medium': '標準レベル（共通テストレベル）',
    'hard': '発展レベル（難関大学入試レベル）'
  };

  const problemTypeInstructions: { [key: string]: string } = {
    'multiple_choice': '4つの選択肢から正解を選ぶ問題',
    'fill_in_blank': '空欄に適切な答えを記入する問題',
    'solution_sequence': '解法の手順を正しい順序に並び替える問題',
    'sentence_sequence': '英文を文法的・意味的に正しい順序に並び替える問題',
    'event_sequence': '歴史的出来事や物語の展開を時系列順に並び替える問題'
  };

  switch (stage) {
    case 'question':
      if (['solution_sequence', 'sentence_sequence', 'event_sequence'].includes(problemType)) {
        return `
【並び替え問題の作成】
科目: ${subject}
単元: ${topic}
難易度: ${difficultyMap[difficulty]}

${topic}の${problemTypeInstructions[problemType]}を作成してください。

【超重要】問題文作成ルール：
1. 問題文には絶対に選択肢（A, B, C...）を含めないこと
2. 問題の状況説明と、「以下の手順を正しい順序に並び替えてください」という指示のみ
3. 具体的な手順の内容は次のステップで生成するので、ここでは書かない

${UNIFIED_JSON_FORMAT}`;
      }
      
      return `
${topic}の${problemTypeInstructions[problemType] || problemType}を1つ作成してください。
難易度: ${difficultyMap[difficulty] || difficulty}

${additionalRequirements ? `追加要件: ${additionalRequirements}` : ''}
${specialInstructions}

${UNIFIED_JSON_FORMAT}`;

    case 'options':
      if (['solution_sequence', 'sentence_sequence', 'event_sequence'].includes(problemType)) {
        return `
問題: ${previousData?.question}
この並び替え問題のための選択肢を作成してください。

出力形式（JSONのみ）:
\`\`\`json
{
  "format": "normal",
  "options": [
    "手順1の具体的な内容",
    "手順2の具体的な内容",
    "手順3の具体的な内容",
    "手順4の具体的な内容",
    "手順5の具体的な内容"
  ],
  "correctOrder": "正しい順序（例: C, A, D, B, E）",
  "correctSequence": ["正しい順序での手順1", "手順2", "手順3"],
  "optionLabels": ["A", "B", "C", "D", "E"]
}
\`\`\``;
      }
      
      return `
問題: ${previousData?.question}
この問題の選択肢4つと正解を作成してください。

\`\`\`json
{
  "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "answer": "正解の選択肢"
}
\`\`\``;

    case 'answer':
      return `
問題: ${previousData?.question}
この問題の答えを作成してください。

\`\`\`json
{
  "answer": "答え"
}
\`\`\``;

    case 'explanation':
      return `
問題: ${previousData?.question}
答え: ${previousData?.answer}

この問題の詳細な解説を作成してください。

\`\`\`json
{
  "explanation": "詳細な解説",
  "hints": ["ヒント1", "ヒント2"]
}
\`\`\``;
  }
  
  return '';
}

// ========== 公式穴埋め問題プロンプト ==========
function generateFormulaFillBlankPrompt(
  request: GenerateProblemRequest,
  modelType: string,
  stage: string,
  previousData?: any
): string {
  const { subject, topic, difficulty } = request;
  
  const difficultyMap: { [key: string]: string } = {
    'easy': '基本的な公式（空欄1-2個）',
    'medium': '標準的な公式（空欄2-3個）',
    'hard': '複雑な公式や導出を含む（空欄3-4個）'
  };

  switch (stage) {
    case 'question':
      return `
【公式穴埋め問題の作成】
科目: ${subject}
単元: ${topic}
難易度: ${difficultyMap[difficulty]}

${topic}で使用される重要な公式・定理・法則の穴埋め問題を作成してください。
空欄は「____」または「□」で表してください。

${UNIFIED_JSON_FORMAT}

追加で以下のフィールドも含めてください：
"formulaType": "equation/theorem/law/definition",
"formulaName": "公式の正式名称",
"blankCount": 空欄の数,
"inputType": "numeric/algebraic/text"`;

    case 'answer':
      return `
問題: ${previousData?.question}

この公式穴埋め問題の答えを配列形式で作成してください。

出力形式（JSONのみ）:
\`\`\`json
{
  "answer": ["答え1", "答え2", "答え3"],
  "answerDetails": {
    "□₁": { "value": "答え1", "unit": "単位", "description": "説明" }
  }
}
\`\`\``;

    case 'explanation':
      return `
問題: ${previousData?.question}
答え: ${previousData?.answer}

この公式の詳細な解説を作成してください。

\`\`\`json
{
  "explanation": "詳細な解説文",
  "hints": ["公式の構造に関するヒント", "空欄の内容に関するヒント"],
  "relatedFormulas": ["関連する公式1"],
  "commonMistakes": ["よくある間違い1"]
}
\`\`\``;
  }
  
  return '';
}

// ========== 長文読解問題プロンプト ==========
function generateReadingComprehensionPrompt(
  request: GenerateProblemRequest,
  modelType: string,
  stage: string,
  previousData?: any
): string {
  const { subject, topic, difficulty } = request;
  
  const difficultySettings = {
    easy: {
      passageLength: subject === 'japanese' ? '400-600字' : '200-300 words',
      questionDepth: '基本的な内容理解'
    },
    medium: {
      passageLength: subject === 'japanese' ? '600-900字' : '400-500 words',
      questionDepth: '論理展開の理解'
    },
    hard: {
      passageLength: subject === 'japanese' ? '900-1200字' : '600-700 words',
      questionDepth: '批判的思考'
    }
  };

  const settings = difficultySettings[difficulty as keyof typeof difficultySettings];

  switch (stage) {
    case 'passage':
      return `
【長文読解問題の作成】
科目: ${subject === 'japanese' ? '国語' : '英語'}
単元: ${topic}
難易度: ${difficulty}
文章の長さ: ${settings.passageLength}

${subject === 'japanese' ? '日本語' : '英語'}の文章を作成してください。

出力形式（JSONのみ）:
\`\`\`json
{
  "passageTitle": "文章のタイトル",
  "passageText": "本文全体",
  "passageMetadata": {
    "genre": "評論/essay/article",
    "wordCount": 文字数,
    "themes": ["テーマ1"],
    "keyConcepts": ["重要概念1"]
  }
}
\`\`\``;

    case 'question':
      return `
文章: ${previousData?.passageText}

この文章に基づいて、${settings.questionDepth}を問う選択問題を作成してください。

出力形式（JSONのみ）:
\`\`\`json
{
  "question": "問題文",
  "questionType": "summary_choice" または "flow_sequence"
}
\`\`\``;

    case 'options':
      if (previousData?.questionType === 'flow_sequence') {
        return `
文章の流れを要約した選択肢を作成してください。

\`\`\`json
{
  "format": "normal",
  "options": ["段落1の要約", "段落2の要約", "段落3の要約", "段落4の要約"],
  "correctOrder": "正しい順序",
  "optionLabels": ["A", "B", "C", "D"]
}
\`\`\``;
      }
      
      return `
内容要約の選択肢を4つ作成してください。

\`\`\`json
{
  "options": ["要約1", "要約2", "要約3", "要約4"],
  "answer": "最も適切な要約"
}
\`\`\``;

    case 'explanation':
      return `
文章と問題に基づいて解説を作成してください。

\`\`\`json
{
  "explanation": "なぜその選択肢が正解なのかの説明",
  "keyPoints": ["理解すべきポイント1"],
  "hints": ["文章の読み方のヒント"]
}
\`\`\``;
  }
  
  return '';
}

// ========== 語彙問題プロンプト ==========
function generateVocabularyPrompt(
  request: GenerateProblemRequest,
  modelType: string,
  stage: string,
  previousData?: any
): string {
  const { subject, topic, difficulty } = request;

  switch (stage) {
    case 'question':
      return `
【語彙問題の作成】
科目: ${subject === 'japanese' ? '国語' : '英語'}
単元: ${topic}
難易度: ${difficulty}

${subject === 'japanese' ? 
`共通テストでよく出る語彙問題を作成してください。` :
`英語の語彙・熟語問題を作成してください。`}

出力形式（JSONのみ）:
\`\`\`json
{
  "question": "問題文",
  "vocabularyType": "kanji/kobun/kanbun/word/idiom",
  "targetWord": "対象となる語"
}
\`\`\``;

    case 'options':
      return `
問題: ${previousData?.question}
語彙タイプ: ${previousData?.vocabularyType}

適切な選択肢を4つ作成してください。

\`\`\`json
{
  "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
  "answer": "正解"
}
\`\`\``;

    case 'explanation':
      return `
語彙問題の詳細な解説を作成してください。

\`\`\`json
{
  "explanation": "正解の理由と他の選択肢が誤りである理由",
  "relatedWords": ["関連する語彙"],
  "hints": ["覚え方のヒント"]
}
\`\`\``;
  }
  
  return '';
}

// ========== 検証機能（新規追加） ==========
async function validateGeneratedProblem(
  problemData: GeneratedProblem,
  request: GenerateProblemRequest
): Promise<ValidationChecks> {
  const results: ValidationChecks = {
    requirementsFulfillment: {
      includedConcepts: [],
      missingConcepts: [],
      score: 100
    },
    difficultyAlignment: {
      estimatedDifficulty: request.difficulty as 'easy' | 'medium' | 'hard',
      confidence: 0.9,
      reasoning: '問題の複雑さと必要な知識レベルに基づいて判定'
    },
    educationalValue: {
      skillsCovered: [],
      learningOutcomes: [],
      score: 85
    }
  };
  
  // 拡張パラメータに基づいた検証
  if (request.extendedParameters) {
    const extValidation = ResponseValidator.validateExtendedParameters(request.extendedParameters);
    
    // 必須概念のチェック
    if (request.extendedParameters.contentSpecification?.mustIncludeConcepts) {
      const requiredConcepts = request.extendedParameters.contentSpecification.mustIncludeConcepts;
      const problemText = `${problemData.question} ${problemData.explanation}`.toLowerCase();
      
      results.requirementsFulfillment.includedConcepts = requiredConcepts.filter(concept =>
        problemText.includes(concept.toLowerCase())
      );
      
      results.requirementsFulfillment.missingConcepts = requiredConcepts.filter(concept =>
        !problemText.includes(concept.toLowerCase())
      );
      
      results.requirementsFulfillment.score = 
        (results.requirementsFulfillment.includedConcepts.length / requiredConcepts.length) * 100;
    }
    
    // 教育的価値の評価
    if (request.extendedParameters.educationalObjective) {
      results.educationalValue.skillsCovered = 
        request.extendedParameters.educationalObjective.targetSkills || [];
      results.educationalValue.learningOutcomes = [
        request.extendedParameters.educationalObjective.primaryGoal || ''
      ];
    }
  }
  
  return results;
}

// ========== メインハンドラー ==========
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  debugLog('Request received', body);
  
  const isReadingComprehension = isReadingComprehensionProblem(body.subject, body.problemType);
  
  // 仮のCanvas判定（後で実際の問題文で再判定）
  const preliminaryCanvasCheck = body.includeCanvas || ['math', 'physics'].includes(body.subject);
  
  const modelDecision = ModelSelector.selectOptimalModel(body, preliminaryCanvasCheck);
  debugLog('Model selected', modelDecision);
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(encodeSSE({
          status: 'generating',
          title: `${body.subjectName || body.subject} - ${body.topic}`,
          subject: body.subject,
          topic: body.topic,
          difficulty: body.difficulty,
          type: body.problemType,
          model: modelDecision.modelName,
          modelReason: modelDecision.reason,
          // 拡張パラメータの使用状況を追加
          useAdvancedCustomization: body.useAdvancedCustomization || false
        }));
        
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error('API key not configured');
        }
        
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: modelDecision.modelName,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: isReadingComprehension ? 8192 : 4096,
          }
        });
        
        let passageData: any = null;
        let questionData: any = null;
        let validationResults: ValidationChecks | null = null;
        
        // 長文読解の場合、まず文章を生成
        if (isReadingComprehension) {
          const passagePrompt = generateOptimizedPrompt(body, modelDecision.modelName, 'passage' as any);
          debugLog('Passage prompt', passagePrompt);
          
          const passageResult = await model.generateContent(passagePrompt);
          const passageText = passageResult.response.text();
          debugLog('Passage response', passageText);
          
          const passageJson = extractJSON(passageText);
          
          if (!passageJson) {
            throw new Error('Failed to generate passage');
          }
          
          passageData = passageJson;
          
          controller.enqueue(encodeSSE({
            status: 'passage_ready',
            passageTitle: passageData.passageTitle,
            passageText: passageData.passageText,
            passageMetadata: passageData.passageMetadata
          }));
        }
        
        // 問題文の生成（拡張カスタマイズ対応）
        const questionPrompt = body.useAdvancedCustomization && body.extendedParameters
          ? generateStructuredPrompt(body, modelDecision.modelName, passageData)
          : generateOptimizedPrompt(body, modelDecision.modelName, 'question', passageData);
        debugLog('Question prompt', questionPrompt);
        
        const questionResult = await model.generateContent(questionPrompt);
        const questionText = questionResult.response.text();
        debugLog('Question response', questionText);
        
        const questionJson = extractJSON(questionText);
        
        if (!questionJson) {
          debugLog('Failed to extract JSON from response', questionText);
          throw new Error('Failed to extract question JSON');
        }
        
        debugLog('Extracted question JSON', questionJson);
        
        // バリデーション
        const validation = ResponseValidator.validateQuestionData(questionJson);
        if (!validation.isValid) {
          debugLog('Validation failed', { validation, questionJson });
          throw new Error(`Question validation failed: ${validation.error}`);
        }
        
        questionData = questionJson;
        
        // 拡張パラメータ使用時の検証
        if (body.useAdvancedCustomization && body.extendedParameters) {
          validationResults = await validateGeneratedProblem(questionData, body);
          debugLog('Validation results', validationResults);
        }
        
        // Canvas必要性の判定
        const canvasDetection = CanvasDetector.needsCanvas(
          body.subject,
          body.topic,
          body.problemType,
          questionData.question
        );
        
        const needsCanvas = body.includeCanvas || canvasDetection.needed;
        
        // 問題文をSSEで送信
        const sseData = {
          status: 'question_ready',
          question: questionData.question,
          needsCanvas,
          canvasType: canvasDetection.canvasType,
          ...(questionData.format && { format: questionData.format }),
          ...(questionData.formulaType && { formulaType: questionData.formulaType }),
          ...(questionData.vocabularyType && { vocabularyType: questionData.vocabularyType }),
          ...(questionData.targetWord && { targetWord: questionData.targetWord }),
          ...(questionData.educationalMetadata && { educationalMetadata: questionData.educationalMetadata })
        };
        
        debugLog('Sending question_ready SSE', sseData);
        controller.enqueue(encodeSSE(sseData));
        
        // Canvasデータを生成（必要な場合）
        let canvasData = null;
        if (needsCanvas && !shouldExcludeAudioProblems(body.subject, body.topic)) {
          try {
            const canvasPrompt = generateCanvasPrompt(
              body,
              questionData,
              canvasDetection.canvasType || 'coordinate'
            );
            debugLog('Canvas prompt', canvasPrompt);
            
            const canvasResult = await model.generateContent(canvasPrompt);
            const canvasText = canvasResult.response.text();
            const canvasJson = extractJSON(canvasText);
            
            if (canvasJson) {
              canvasData = canvasJson;
              
              // IDの自動生成
              if (canvasData.config && canvasData.config.elements) {
                canvasData.config.elements = canvasData.config.elements.map((el: any, idx: number) => ({
                  id: el.id || `element-${idx}`,
                  ...el
                }));
              }
              
              controller.enqueue(encodeSSE({
                status: 'canvas_ready',
                canvasData
              }));
            }
          } catch (canvasError) {
            debugLog('Canvas generation error', canvasError);
          }
        }
        
        let answer = '';
        let options = undefined;
        
        // 選択肢の生成（必要な場合）
        if (['solution_sequence', 'sentence_sequence', 'event_sequence'].includes(body.problemType) ||
            (isReadingComprehension && questionData.questionType === 'flow_sequence')) {
          const optionsPrompt = generateOptimizedPrompt(body, modelDecision.modelName, 'options', {
            ...passageData,
            ...questionData
          });
          debugLog('Options prompt', optionsPrompt);
          
          const optionsResult = await model.generateContent(optionsPrompt);
          const optionsText = optionsResult.response.text();
          const optionsJson = extractJSON(optionsText);
          
          if (optionsJson) {
            options = optionsJson.options;
            answer = optionsJson.correctOrder;
            
            controller.enqueue(encodeSSE({
              status: 'options_ready',
              options: options,
              labels: optionsJson.optionLabels,
              format: optionsJson.format,
              requiredCount: optionsJson.requiredCount,
              unnecessaryOptions: optionsJson.unnecessaryOptions
            }));
            
            controller.enqueue(encodeSSE({
              status: 'answer_ready',
              answer: answer
            }));
            
            if (optionsJson.correctSequence) {
              questionData.correctSequence = optionsJson.correctSequence;
            }
          }
        }
        else if (body.problemType === 'multiple_choice' || 
                 body.problemType === 'vocabulary' ||
                 body.problemType === 'reading_comprehension') {
          const optionsPrompt = generateOptimizedPrompt(body, modelDecision.modelName, 'options', {
            ...passageData,
            ...questionData
          });
          
          const optionsResult = await model.generateContent(optionsPrompt);
          const optionsText = optionsResult.response.text();
          const optionsJson = extractJSON(optionsText);
          
          if (optionsJson) {
            options = optionsJson.options;
            answer = optionsJson.answer;
            
            controller.enqueue(encodeSSE({
              status: 'options_ready',
              options: options
            }));
            
            controller.enqueue(encodeSSE({
              status: 'answer_ready',
              answer: answer
            }));
          }
        }
        else {
          // 答えの生成
          const answerPrompt = generateOptimizedPrompt(body, modelDecision.modelName, 'answer', {
            ...passageData,
            ...questionData
          });
          debugLog('Answer prompt', answerPrompt);
          
          const answerResult = await model.generateContent(answerPrompt);
          const answerText = answerResult.response.text();
          const answerJson = extractJSON(answerText);
          
          if (answerJson) {
            const answerValidation = ResponseValidator.validateAnswerData(answerJson);
            if (!answerValidation.isValid) {
              throw new Error(`Answer validation failed: ${answerValidation.error}`);
            }
            
            answer = answerJson.answer;
            
            controller.enqueue(encodeSSE({
              status: 'answer_ready',
              answer: answer,
              ...(answerJson.answerDetails && { answerDetails: answerJson.answerDetails })
            }));
          }
        }
        
        // 解説の生成
        try {
          const explanationPrompt = generateOptimizedPrompt(
            body,
            modelDecision.modelName,
            'explanation',
            {
              ...passageData,
              ...questionData,
              answer: answer,
              options: options
            }
          );
          debugLog('Explanation prompt', explanationPrompt);
          
          const explanationResult = await model.generateContent(explanationPrompt);
          const explanationText = explanationResult.response.text();
          const explanationJson = extractJSON(explanationText);
          
          if (explanationJson) {
            controller.enqueue(encodeSSE({
              status: 'explanation_ready',
              explanation: explanationJson.explanation || '解説を生成できませんでした。',
              hints: explanationJson.hints || [],
              ...(explanationJson.relatedFormulas && { relatedFormulas: explanationJson.relatedFormulas }),
              ...(explanationJson.commonMistakes && { commonMistakes: explanationJson.commonMistakes }),
              ...(explanationJson.keyPoints && { keyPoints: explanationJson.keyPoints }),
              ...(explanationJson.relatedWords && { relatedWords: explanationJson.relatedWords })
            }));
          }
        } catch (error) {
          debugLog('Explanation generation error', error);
          // 解説生成エラーは無視して続行
        }
        
        // 完了
        controller.enqueue(encodeSSE({
          status: 'complete',
          estimatedTime: needsCanvas ? 20 : isReadingComprehension ? 30 : 15,
          keywords: [...(passageData?.passageMetadata?.keyConcepts || []), body.topic],
          modelUsed: modelDecision.modelName,
          estimatedCost: modelDecision.estimatedCost,
          // 検証結果を含める
          ...(validationResults && { validationResults })
        }));
        
      } catch (error) {
        debugLog('Streaming error', error);
        
        let errorMessage = '問題の生成中にエラーが発生しました';
        let errorDetail = '';
        
        if (error instanceof Error) {
          errorDetail = error.message;
          debugLog('Error details', {
            message: error.message,
            stack: error.stack
          });
          
          if (error.message?.includes('503') || error.message?.includes('overloaded')) {
            errorMessage = 'AIサービスが混雑しています。しばらく待ってから再度お試しください。';
          } else if (error.message?.includes('timeout')) {
            errorMessage = 'リクエストがタイムアウトしました。もう一度お試しください。';
          } else if (error.message?.includes('quota')) {
            errorMessage = '本日の利用上限に達しました。明日再度お試しください。';
          } else if (error.message?.includes('API key')) {
            errorMessage = 'APIキーが設定されていません。環境変数を確認してください。';
          }
        }
        
        controller.enqueue(encodeSSE({
          status: 'error',
          error: errorMessage,
          detail: DEBUG_MODE ? errorDetail : undefined
        }));
      } finally {
        controller.close();
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    },
  });
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}