import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function GET(request: NextRequest) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
2024年から2025年の日本と世界の重要な時事問題を、大学入試小論文のテーマとして適切なものを生成してください。

以下のJSON形式で10個の時事問題テーマを生成してください：

{
  "trends": [
    {
      "id": "trend-001",
      "title": "時事問題のタイトル",
      "category": "政治/経済/社会/環境/科学技術/国際",
      "description": "問題の概要説明（100-150文字）",
      "keywords": ["キーワード1", "キーワード2", "キーワード3"],
      "relevantFaculties": ["関連する学部1", "関連する学部2"],
      "importance": 5, // 1-5の重要度
      "essayPrompts": [
        "この問題に関する小論文の問い1",
        "この問題に関する小論文の問い2"
      ],
      "backgroundInfo": "背景情報（200-300文字）",
      "discussionPoints": [
        "議論すべきポイント1",
        "議論すべきポイント2",
        "議論すべきポイント3"
      ],
      "relatedData": {
        "hasStatistics": true/false,
        "statisticsDescription": "関連する統計データの説明"
      }
    }
  ]
}

注意事項:
1. 実際に2024-2025年に話題になっている/なりそうな問題を選ぶ
2. 大学入試で出題される可能性が高いテーマ
3. 様々な分野からバランスよく選択
4. 議論の余地があり、多角的な視点で論じられるテーマ
5. 若者にとって身近で関心の高いテーマも含める
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSONを抽出してパース
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse response');
    }

    const trends = JSON.parse(jsonMatch[0]);

    // キャッシュ設定（1日間）
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=86400');

    return NextResponse.json(trends, { headers });
  } catch (error) {
    console.error('Trends generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate trends' },
      { status: 500 }
    );
  }
}