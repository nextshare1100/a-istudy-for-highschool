import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini/client';
import { db } from '@/lib/firebase/index';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  console.log('=== evaluate-advanced API called ===');
  
  try {
    const { essay, theme, submissionId } = await request.json();
    console.log('Request data:', { 
      essayLength: essay?.length, 
      hasTheme: !!theme, 
      submissionId 
    });
    
    if (!essay || !theme) {
      return NextResponse.json(
        { error: '評価に必要なデータが不足しています' },
        { status: 400 }
      );
    }
    
    // APIキーの確認
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey?.length);
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not set');
      throw new Error('APIキーが設定されていません');
    }
    
    // Gemini APIを使用
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
小論文を評価してください。

テーマ: ${theme.title}
問題文: ${theme.description}

小論文（${essay.length}字）:
${essay}

以下のJSON形式で評価してください。各スコアは数値で記載してください：
{
  "scores": {
    "structure": 数値のみ（0-25の整数）,
    "argument": 数値のみ（0-25の整数）,
    "expression": 数値のみ（0-25の整数）,
    "originality": 数値のみ（0-25の整数）
  },
  "totalScore": 合計点数（数値）,
  "strengths": ["良い点1", "良い点2", "良い点3"],
  "improvements": ["改善点1", "改善点2", "改善点3"],
  "detailedFeedback": {
    "structure": "構成についての詳細",
    "argument": "論証についての詳細",
    "expression": "表現についての詳細",
    "originality": "独創性についての詳細"
  },
  "summary": "総評（200字程度）",
  "nextSteps": ["次回へのアドバイス1", "次回へのアドバイス2"]
}`;

    console.log('Calling Gemini API...');
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log('API Response received, length:', text.length);
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('No JSON found in response');
      throw new Error('評価の生成に失敗しました');
    }
    
    const evaluation = JSON.parse(jsonMatch[0]);
    
    // スコアを確実に数値に変換
    const scores = evaluation.scores;
    const numericScores = {
      structure: Number(scores.structure) || 0,
      argument: Number(scores.argument) || 0,
      expression: Number(scores.expression) || 0,
      originality: Number(scores.originality) || 0
    };
    
    // 正しく合計を計算
    const totalScore = numericScores.structure + numericScores.argument + 
                      numericScores.expression + numericScores.originality;
    
    // 評価オブジェクトを再構築
    evaluation.scores = numericScores;
    evaluation.totalScore = totalScore;
    
    console.log('Scores:', numericScores);
    console.log('Total Score:', totalScore);
    
    if (submissionId) {
      await updateDoc(doc(db, 'essaySubmissions', submissionId), {
        evaluation,
        evaluationScore: totalScore,
        evaluatedAt: serverTimestamp()
      });
    }
    
    return NextResponse.json({
      success: true,
      evaluation
    });
    
  } catch (error: any) {
    console.error('=== 評価エラー ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    
    // エラー時も最低限の評価を返す
    return NextResponse.json({
      success: true,
      evaluation: {
        scores: {
          structure: 15,
          argument: 15,
          expression: 15,
          originality: 15
        },
        totalScore: 60,
        strengths: ['エラーが発生しました: ' + error.message],
        improvements: ['もう一度お試しください'],
        detailedFeedback: {
          structure: 'エラー',
          argument: 'エラー',
          expression: 'エラー',
          originality: 'エラー'
        },
        summary: 'エラーが発生したため、正確な評価ができませんでした。',
        nextSteps: ['もう一度評価を実行してください']
      }
    });
  }
}