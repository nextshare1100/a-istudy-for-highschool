// app/api/essay/evaluate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyIdToken } from '@/lib/firebase/admin';

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || 
  process.env.GOOGLE_AI_API_KEY|| 
  ''
);

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const { success, decodedToken } = await verifyIdToken(token);
    
    if (!success || !decodedToken) {
      return NextResponse.json({ error: '無効なトークンです' }, { status: 401 });
    }

    // リクエストボディの取得
    const body = await request.json();
    const { theme, content, submissionId } = body;

    if (!theme || !content) {
      return NextResponse.json(
        { error: 'テーマと内容が必要です' },
        { status: 400 }
      );
    }

    // モデルの初期化
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.3, // 評価の一貫性のため低めに設定
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    // 評価プロンプトの構築
    const prompt = buildEvaluationPrompt(theme, content);

    // 評価の実行
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const evaluationText = response.text();

    // 評価結果のパース
    const evaluation = parseEvaluation(evaluationText, content.length, theme.wordLimit);

    // ログ記録
    console.log(`[Essay Evaluation] User: ${decodedToken.uid}, Theme: ${theme.id}, Score: ${evaluation.totalScore}`);

    return NextResponse.json({
      success: true,
      evaluation,
      submissionId,
    });

  } catch (error) {
    console.error('[Error] Essay evaluation failed:', error);
    return NextResponse.json(
      { error: '評価に失敗しました' },
      { status: 500 }
    );
  }
}

function buildEvaluationPrompt(theme: any, content: string): string {
  const prompt = `
あなたは大学入試の小論文採点者です。以下の小論文を厳密に評価してください。

【問題文】
${theme.title}
${theme.description}

【解答文字数】
${content.length}字（制限: ${theme.wordLimit}字）

【受験生の解答】
${content}

【評価基準】
${theme.evaluationCriteria ? theme.evaluationCriteria.join('、') : '論理性、具体性、独創性、文章構成'}

以下の形式で評価を出力してください：

## 総合評価
[0-100点の数値のみ]

## 評価詳細
### 論理性（25点満点）
[点数]/25
[評価コメント]

### 具体性（25点満点）
[点数]/25
[評価コメント]

### 独創性（25点満点）
[点数]/25
[評価コメント]

### 文章構成（25点満点）
[点数]/25
[評価コメント]

## 良い点
- [良い点1]
- [良い点2]
- [良い点3]

## 改善点
- [改善点1]
- [改善点2]
- [改善点3]

## 総評
[全体的なフィードバック（2-3文）]
`;

  return prompt;
}

function parseEvaluation(text: string, actualWords: number, wordLimit: number): any {
  const evaluation = {
    totalScore: 0,
    criteria: {
      logic: { score: 0, maxScore: 25, comment: '' },
      concreteness: { score: 0, maxScore: 25, comment: '' },
      originality: { score: 0, maxScore: 25, comment: '' },
      structure: { score: 0, maxScore: 25, comment: '' },
    },
    strengths: [] as string[],
    improvements: [] as string[],
    overallComment: '',
    wordCount: {
      actual: actualWords,
      limit: wordLimit,
      withinLimit: actualWords <= wordLimit,
    },
    evaluatedAt: new Date().toISOString(),
  };

  try {
    // 総合評価の抽出
    const totalScoreMatch = text.match(/## 総合評価\s*\n\s*(\d+)/);
    if (totalScoreMatch) {
      evaluation.totalScore = parseInt(totalScoreMatch[1], 10);
    }

    // 各項目の評価を抽出
    const criteriaPatterns = [
      { key: 'logic', pattern: /### 論理性.*?\n(\d+)\/25\n([\s\S]*?)(?=###|##|$)/m },
      { key: 'concreteness', pattern: /### 具体性.*?\n(\d+)\/25\n([\s\S]*?)(?=###|##|$)/m },
      { key: 'originality', pattern: /### 独創性.*?\n(\d+)\/25\n([\s\S]*?)(?=###|##|$)/m },
      { key: 'structure', pattern: /### 文章構成.*?\n(\d+)\/25\n([\s\S]*?)(?=###|##|$)/m },
    ];

    criteriaPatterns.forEach(({ key, pattern }) => {
      const match = text.match(pattern);
      if (match) {
        evaluation.criteria[key as keyof typeof evaluation.criteria] = {
          score: parseInt(match[1], 10),
          maxScore: 25,
          comment: match[2].trim(),
        };
      }
    });

    // 良い点の抽出
    const strengthsMatch = text.match(/## 良い点\s*\n([\s\S]*?)(?=##|$)/m);
    if (strengthsMatch) {
      evaluation.strengths = strengthsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    // 改善点の抽出
    const improvementsMatch = text.match(/## 改善点\s*\n([\s\S]*?)(?=##|$)/m);
    if (improvementsMatch) {
      evaluation.improvements = improvementsMatch[1]
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(line => line.length > 0);
    }

    // 総評の抽出
    const overallMatch = text.match(/## 総評\s*\n([\s\S]*?)$/m);
    if (overallMatch) {
      evaluation.overallComment = overallMatch[1].trim();
    }

    // 総合点が0の場合、各項目の合計を使用
    if (evaluation.totalScore === 0) {
      evaluation.totalScore = Object.values(evaluation.criteria)
        .reduce((sum, criterion) => sum + criterion.score, 0);
    }

  } catch (error) {
    console.error('Error parsing evaluation:', error);
    // デフォルト値を設定
    evaluation.totalScore = 60;
    evaluation.overallComment = '評価の解析中にエラーが発生しました。';
  }

  return evaluation;
}