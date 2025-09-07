import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini/client';

const client = getGeminiClient();

export async function POST(request: NextRequest) {
  try {
    const { essay, theme, rubric } = await request.json();
    const model = client.getGenerativeModel({ model: "gemini-pro" });
    
    const evaluationPrompt = `
以下の小論文を詳細に評価してください。

【テーマ】
${theme.title}
${theme.description}

【評価基準】
1. 論理構成（25点）
   - 序論・本論・結論の構成
   - 論理の一貫性
   - 段落構成
   
2. 論証力（25点）
   - 具体例の適切性
   - データ・根拠の説得力
   - 反論への配慮
   
3. 表現力（25点）
   - 文章の明確性
   - 語彙の豊富さ
   - 読みやすさ
   
4. 独創性（25点）
   - 視点の新しさ
   - 問題意識の深さ
   - 提案の実現可能性

【小論文】
${essay}

以下の形式で評価してください：
1. 各項目の点数（100点満点）
2. 良い点（具体的に3つ以上）
3. 改善点（具体的に3つ以上）
4. 総評（200字程度）
5. 次回への具体的アドバイス

JSON形式で出力してください。
`;

    const result = await model.generateContent(evaluationPrompt);
    const evaluation = JSON.parse(result.response.text());
    
    // 詳細なフィードバックを生成
    const feedbackPrompt = `
この小論文の以下の部分について、具体的な改善案を提示してください：

1. 序論の改善案（現在の序論を引用し、より良い書き方を提案）
2. 最も弱い論証部分の改善案
3. 結論の改善案
4. 使用すべき専門用語や表現

各改善案は「現状」「改善案」「改善理由」の3点セットで提示してください。
`;
    
    const feedbackResult = await model.generateContent(feedbackPrompt);
    const detailedFeedback = JSON.parse(feedbackResult.response.text());
    
    return NextResponse.json({
      success: true,
      evaluation: {
        ...evaluation,
        detailedFeedback,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      { error: '評価処理に失敗しました' },
      { status: 500 }
    );
  }
}
