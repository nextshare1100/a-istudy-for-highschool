import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const questionId = formData.get('questionId') as string;
    const questionText = formData.get('questionText') as string;
    const transcription = formData.get('transcription') as string;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 音声分析のプロンプト
    const prompt = `
面接の回答を評価してください。

質問: ${questionText}
回答（文字起こし）: ${transcription}

以下の観点で評価し、JSON形式で返してください：

{
  "evaluation": {
    "score": 100点満点の総合スコア,
    "content": {
      "score": 100点満点,
      "feedback": "内容に関するフィードバック",
      "strengths": ["良い点1", "良い点2"],
      "improvements": ["改善点1", "改善点2"]
    },
    "structure": {
      "score": 100点満点,
      "feedback": "構成に関するフィードバック",
      "hasIntroduction": true/false,
      "hasConclusion": true/false,
      "isLogical": true/false
    },
    "expression": {
      "score": 100点満点,
      "feedback": "表現に関するフィードバック",
      "vocabulary": "語彙の豊かさの評価",
      "clarity": "明確さの評価"
    },
    "corrections": [
      {
        "original": "元の表現",
        "corrected": "修正案",
        "reason": "修正理由",
        "type": "grammar/expression/filler"
      }
    ],
    "overallFeedback": "総合的なフィードバック",
    "suggestions": [
      "今後の改善提案1",
      "今後の改善提案2",
      "今後の改善提案3"
    ]
  }
}

評価基準:
1. 質問に対して適切に答えているか
2. 具体的なエピソードや例が含まれているか
3. 論理的な構成になっているか
4. 適切な敬語が使われているか
5. 時間配分が適切か（文字数から推定）
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSONを抽出してパース
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse response');
    }

    const evaluation = JSON.parse(jsonMatch[0]).evaluation;

    // 評価結果を保存
    const { data: practiceData, error: practiceError } = await supabase
      .from('interview_practices')
      .insert({
        user_id: user.id,
        question_id: questionId,
        question_text: questionText,
        answer_text: transcription,
        evaluation_score: evaluation.score,
        evaluation_feedback: evaluation,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (practiceError) {
      throw practiceError;
    }

    // 音声分析結果も保存
    if (practiceData) {
      await supabase
        .from('voice_analyses')
        .insert({
          practice_id: practiceData.id,
          transcription: transcription,
          corrections: evaluation.corrections,
        });
    }

    return NextResponse.json({ 
      evaluation,
      practiceId: practiceData?.id 
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate answer' },
      { status: 500 }
    );
  }
}