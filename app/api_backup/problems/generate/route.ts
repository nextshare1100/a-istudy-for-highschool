import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PROMPTS } from '@/lib/gemini/prompts';
import { GeminiProblemRequest, GeneratedProblem } from '@/types/gemini';

// Gemini AI クライアントの初期化
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: Request) {
  try {
    // APIキーの存在確認
    console.log('=== API Key Check ===');
    console.log('GOOGLE_AI_API_KEY exists:', !!process.env.GOOGLE_AI_API_KEY);
    console.log('API Key length:', process.env.GOOGLE_AI_API_KEY?.length || 0);
    
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.error('GOOGLE_AI_API_KEY is not set in environment variables');
      return NextResponse.json({
        success: false,
        error: 'APIキーが設定されていません。環境変数を確認してください。'
      }, { status: 500 });
    }

    const body: GeminiProblemRequest = await request.json();
    console.log('=== Problem Generation Request ===', body);

    // リクエストの検証
    if (!body.subject || !body.topic || !body.difficulty || !body.type) {
      return NextResponse.json({
        success: false,
        error: '必須パラメータが不足しています'
      }, { status: 400 });
    }

    // Gemini モデルの取得
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });

    // プロンプトの生成
    const prompt = PROMPTS.GENERATE_PROBLEM(body);
    console.log('=== Generated Prompt Length ===', prompt.length);

    // AIによる問題生成（リトライロジック付き）
    let attempts = 0;
    const maxAttempts = 3;
    let lastError: any = null;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Attempt ${attempts}/${maxAttempts}`);

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('=== Gemini Response Length ===', text.length);

        // JSONの抽出と解析
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (!jsonMatch) {
          console.error('JSON format not found in response. Raw response:', text.substring(0, 500));
          throw new Error('JSON format not found in response');
        }

        let jsonText = jsonMatch[1];
        console.log('=== Extracted JSON Length ===', jsonText.length);
        
        // JSONの修復を試みる
        let problemData;
        try {
          // 不完全なJSONを修復
          jsonText = jsonText.trim();
          
          // デバッグ: JSON文字列の最初と最後を確認
          console.log('JSON starts with:', jsonText.substring(0, 100));
          console.log('JSON ends with:', jsonText.substring(jsonText.length - 100));
          
          // JSONが不完全な場合の処理
          // 最後が } または ] で終わっていない場合
          if (!jsonText.endsWith('}') && !jsonText.endsWith(']')) {
            console.warn('JSON seems incomplete, attempting to fix...');
            // 開いている括弧を数える
            const openBraces = (jsonText.match(/{/g) || []).length;
            const closeBraces = (jsonText.match(/}/g) || []).length;
            const openBrackets = (jsonText.match(/\[/g) || []).length;
            const closeBrackets = (jsonText.match(/\]/g) || []).length;
            
            // 不足している括弧を追加
            jsonText += ']'.repeat(openBrackets - closeBrackets);
            jsonText += '}'.repeat(openBraces - closeBraces);
          }
          
          problemData = JSON.parse(jsonText);
          console.log('=== Parsed Problem Data ===', JSON.stringify(problemData, null, 2).substring(0, 500));
        } catch (jsonError) {
          console.error('JSON Parse Error:', jsonError);
          console.error('Problematic JSON substring:', jsonText.substring(0, 600));
          
          // Geminiに再度リクエストを送る前に、より具体的な指示を追加
          if (attempts === 1 && body.type === 'multiple_choice') {
            console.log('Retrying with emphasis on options generation...');
            // プロンプトを修正して選択肢を必ず含めるよう指示
            // ここは実際のプロンプト生成関数の修正が必要
          }
          
          throw jsonError;
        }
          
        // 問題データの検証と変換
        const problems = problemData.problems || [problemData];
        
        // 選択問題で選択肢がない場合は、エラーにせず空の配列を設定
        problems.forEach((p: any) => {
          if (body.type === 'multiple_choice' && (!p.options || !Array.isArray(p.options))) {
            console.warn('Multiple choice problem missing options, generating default options');
            // デフォルトの選択肢を生成するか、エラーとする
            throw new Error('Multiple choice problem must have options');
          }
        });

        // 各問題を検証して変換
        const validatedProblems: GeneratedProblem[] = [];
        for (const problem of problems) {
          try {
            const validatedProblem = validateAndTransformProblem(problem, body);
            validatedProblems.push(validatedProblem);
          } catch (validationError) {
            console.error('Problem validation failed:', validationError);
            // 個別の問題の検証が失敗しても続行
          }
        }
        
        if (validatedProblems.length === 0) {
          throw new Error('No valid problems generated');
        }

        console.log('=== Successfully Generated Problems ===', validatedProblems.length);

        return NextResponse.json({
          success: true,
          problems: validatedProblems,
          sessionId: `session_${Date.now()}`,
          metadata: {
            generatedAt: new Date().toISOString(),
            model: 'gemini-1.5-flash',
            promptVersion: '1.0'
          }
        });

      } catch (error) {
        console.error(`Attempt ${attempts} failed:`, error);
        lastError = error;
        
        if (error instanceof Error) {
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 5).join('\n')
          });
        }
        
        if (attempts < maxAttempts) {
          // リトライ前に少し待機
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // すべての試行が失敗した場合
    console.error('All attempts failed. Last error:', lastError);
    
    return NextResponse.json({
      success: false,
      error: 'AIからの応答の生成に失敗しました。もう一度お試しください。',
      details: lastError?.message || 'Unknown error'
    }, { status: 500 });

  } catch (error) {
    console.error('Problem generation error:', error);
    
    if (error instanceof Error) {
      console.error('Outer error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      });
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '問題の生成中にエラーが発生しました'
    }, { status: 500 });
  }
}

// 問題データの検証と変換
function validateAndTransformProblem(problemData: any, request: GeminiProblemRequest): GeneratedProblem {
  console.log('=== Validating Problem ===', {
    hasQuestion: !!problemData.question,
    hasAnswer: !!problemData.answer,
    hasOptions: !!problemData.options,
    type: request.type
  });

  // 必須フィールドのチェック
  if (!problemData.question) {
    throw new Error('Missing required field: question');
  }

  // answerフィールドの処理
  let correctAnswer: string | string[];
  let detailedAnswer: any = {};

  if (problemData.answer) {
    if (typeof problemData.answer === 'object' && problemData.answer.correct) {
      correctAnswer = problemData.answer.correct;
      detailedAnswer = problemData.answer;
    } else if (typeof problemData.answer === 'string' || Array.isArray(problemData.answer)) {
      correctAnswer = problemData.answer;
      detailedAnswer = {
        correct: problemData.answer,
        detailed: problemData.answer
      };
    } else {
      throw new Error('Invalid answer format');
    }
  } else {
    throw new Error('Missing required field: answer');
  }

  // explanationフィールドの処理
  let explanation: any;
  if (typeof problemData.explanation === 'string') {
    explanation = problemData.explanation;
  } else if (problemData.explanation && typeof problemData.explanation === 'object') {
    explanation = problemData.explanation;
  } else {
    explanation = '解説が生成されませんでした。';
  }

  // hintsフィールドの処理
  let hints: any[] = [];
  if (Array.isArray(problemData.hints)) {
    hints = problemData.hints.map((hint: any) => {
      if (typeof hint === 'string') {
        return hint;
      } else if (hint.content) {
        return hint;
      }
      return '';
    }).filter(Boolean);
  }

  // 問題形式別の処理
  const processedProblem: GeneratedProblem = {
    question: problemData.question,
    type: request.type,
    difficulty: request.difficulty,
    correctAnswer: correctAnswer,
    answer: detailedAnswer,
    explanation: explanation,
    hints: hints,
    estimatedTime: problemData.estimatedTime || getDefaultEstimatedTime(request.difficulty),
    points: problemData.points || getDefaultPoints(request.difficulty),
    tags: [request.subject, request.topic, request.subtopic].filter(Boolean) as string[],
    selectedTopic: problemData.selectedTopic || request.subtopic || request.topic,
    isRandomlySelected: problemData.isRandomlySelected || false,
  };

  // 選択問題の場合
  if (request.type === 'multiple_choice') {
    if (!problemData.options || !Array.isArray(problemData.options)) {
      throw new Error('Multiple choice problem must have options array');
    }
    if (problemData.options.length < 4) {
      throw new Error('Multiple choice problem must have at least 4 options');
    }
    processedProblem.options = problemData.options;
  }

  // 穴埋め問題の場合
  if (request.type === 'fill_in_blank') {
    // answerが配列でない場合は配列に変換
    if (!Array.isArray(correctAnswer)) {
      // 問題文中の空欄の数を数える
      const blankCount = (problemData.question.match(/_____/g) || []).length;
      if (blankCount > 1) {
        throw new Error('Fill in blank problem with multiple blanks must have array answer');
      }
      processedProblem.correctAnswer = [correctAnswer as string];
    }
  }

  // evaluation フィールドの処理
  if (problemData.evaluation) {
    processedProblem.evaluation = {
      partialCredits: problemData.evaluation.partialCredits || [],
      requirements: problemData.evaluation.requirements || []
    };
  }

  // metadata フィールドの処理
  if (problemData.metadata) {
    processedProblem.metadata = {
      concepts: problemData.metadata.concepts || [],
      prerequisites: problemData.metadata.prerequisites || [],
      skills: problemData.metadata.skills || [],
      realWorldApplication: problemData.metadata.realWorldApplication || ''
    };
  }

  // canvas設定の処理
  if (request.includeCanvas && problemData.canvasConfig) {
    processedProblem.canvasConfig = problemData.canvasConfig;
  }

  console.log('=== Problem Validated Successfully ===');

  return processedProblem;
}

// デフォルトの推定時間
function getDefaultEstimatedTime(difficulty: string): number {
  const times: Record<string, number> = {
    easy: 5,
    medium: 10,
    hard: 15,
    expert: 20
  };
  return times[difficulty] || 10;
}

// デフォルトの配点
function getDefaultPoints(difficulty: string): number {
  const points: Record<string, number> = {
    easy: 20,
    medium: 30,
    hard: 40,
    expert: 50
  };
  return points[difficulty] || 30;
}

// ヘルスチェック用のGETメソッド
export async function GET() {
  const hasApiKey = !!process.env.GOOGLE_AI_API_KEY;
  
  return NextResponse.json({
    status: 'ok',
    hasApiKey: hasApiKey,
    apiKeyLength: process.env.GOOGLE_AI_API_KEY?.length || 0,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
}