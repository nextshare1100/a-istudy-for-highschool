import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transcription, questionId } = await request.json();

    if (!transcription || !questionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Gemini APIで文章訂正を生成
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `
以下の面接回答の文章を分析し、改善点を提案してください。

質問ID: ${questionId}
回答: ${transcription}

以下の観点で分析し、JSON形式で返してください：
1. 文法的な誤り
2. より適切な表現への変更提案
3. フィラー（えー、あのー等）の除去
4. 敬語の適切な使用

形式:
{
  "corrections": [
    {
      "original": "元の文章",
      "corrected": "訂正後の文章",
      "reason": "訂正理由",
      "type": "grammar|expression|pronunciation|filler"
    }
  ],
  "overallFeedback": "全体的なフィードバック"
}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // JSONをパース
    let corrections;
    try {
      corrections = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      corrections = {
        corrections: [],
        overallFeedback: '分析に失敗しました。'
      };
    }

    // 訂正提案を保存
    if (corrections.corrections.length > 0) {
      const insertData = corrections.corrections.map((correction: any) => ({
        user_id: user.id,
        question_id: questionId,
        original_text: correction.original,
        corrected_text: correction.corrected,
        correction_type: correction.type,
        explanation: correction.reason,
      }));

      await supabase
        .from('correction_suggestions')
        .insert(insertData);
    }

    return NextResponse.json(corrections);
  } catch (error) {
    console.error('Correction generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}