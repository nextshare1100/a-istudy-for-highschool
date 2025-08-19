// app/api/essay/generate-custom-theme/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyIdToken } from '@/lib/firebase/admin';

// 環境変数からAPIキーを取得
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || 
  process.env.GOOGLE_AI_API_KEY|| 
  ''
);

// レート制限の定義
const RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1時間
};

// 簡易的なレート制限用のメモリストア
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
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

    // レート制限チェック
    const userId = decodedToken.uid;
    const now = Date.now();
    const userRequests = requestCounts.get(userId);
    
    if (userRequests) {
      if (now < userRequests.resetTime) {
        if (userRequests.count >= RATE_LIMIT.maxRequests) {
          return NextResponse.json(
            { error: 'リクエスト制限に達しました。1時間後に再試行してください。' },
            { status: 429 }
          );
        }
        userRequests.count++;
      } else {
        requestCounts.set(userId, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
      }
    } else {
      requestCounts.set(userId, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    }

    // APIキーの確認
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error('[Error] Gemini API key is not set');
      return NextResponse.json(
        { error: 'システムエラーが発生しました' },
        { status: 500 }
      );
    }

    // リクエストボディの検証
    const body = await request.json();
    const validationError = validateRequest(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { options, count = 3 } = body;

    // モデルの選択（グラフ問題の場合はPro、それ以外はFlash）
    const modelName = options.includeGraph ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    });

    // プロンプトの構築
    const prompt = buildProductionPrompt(options, count);

    // テーマ生成（リトライ機能付き）
    let result;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        result = await model.generateContent(prompt);
        break;
      } catch (error) {
        console.error(`[Error] Generation attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        if (retryCount > maxRetries) {
          throw error;
        }
        // 指数バックオフ
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }

    if (!result) {
      throw new Error('テーマ生成に失敗しました');
    }

    const response = await result.response;
    const text = response.text();

    // パース処理
    const themes = parseProductionThemes(text, options);

    // 生成されたテーマの検証
    if (themes.length === 0) {
      console.error('[Error] No themes parsed from response:', text);
      throw new Error('有効なテーマが生成されませんでした');
    }

    // レスポンスタイムのログ
    const responseTime = Date.now() - startTime;
    console.log(`[Success] Generated ${themes.length} themes in ${responseTime}ms using ${modelName}`);

    return NextResponse.json({
      success: true,
      count: themes.length,
      themes,
      metadata: {
        model: modelName,
        responseTime,
        userId: userId.substring(0, 8) + '...', // プライバシー保護
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`[Error] Theme generation failed after ${responseTime}ms:`, error);
    
    // エラーレスポンス
    if (error instanceof Error) {
      // Gemini APIのエラーをユーザーフレンドリーに変換
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'API利用制限に達しました。しばらく待ってから再試行してください。' },
          { status: 503 }
        );
      }
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'タイムアウトしました。もう一度お試しください。' },
          { status: 504 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'テーマの生成に失敗しました。もう一度お試しください。' },
      { status: 500 }
    );
  }
}

// リクエストの検証
function validateRequest(body: any): string | null {
  if (!body.options) {
    return 'オプションが指定されていません';
  }

  const { options } = body;
  
  if (!options.topic || typeof options.topic !== 'string') {
    return 'トピックが無効です';
  }
  
  if (!options.category || typeof options.category !== 'string') {
    return 'カテゴリーが無効です';
  }
  
  if (!options.wordLimit || typeof options.wordLimit !== 'number' || options.wordLimit < 200 || options.wordLimit > 2000) {
    return '文字数制限は200〜2000字の範囲で指定してください';
  }
  
  if (!options.timeLimit || typeof options.timeLimit !== 'number' || options.timeLimit < 30 || options.timeLimit > 180) {
    return '制限時間は30〜180分の範囲で指定してください';
  }
  
  if (!options.difficulty || typeof options.difficulty !== 'number' || options.difficulty < 1 || options.difficulty > 5) {
    return '難易度は1〜5の範囲で指定してください';
  }

  return null;
}

// 本番環境用のプロンプト
function buildProductionPrompt(options: any, count: number): string {
  const { topic, category, faculty, wordLimit, timeLimit, difficulty, includeGraph, specificRequirements } = options;

  let prompt = `
あなたは日本の大学入試問題作成の専門家です。
以下の条件に基づいて、実際の大学入試で出題されるレベルの小論文問題を${count}個作成してください。

【必須条件】
- トピック: ${topic}
- カテゴリー: ${category}
- 文字数: ${wordLimit}字（${Math.floor(wordLimit * 0.8)}字以上${wordLimit}字以内）
- 制限時間: ${timeLimit}分
- 難易度: ${difficulty}/5（1:易しい、3:標準、5:難しい）
${faculty ? `- 対象学部: ${faculty}` : ''}
${includeGraph ? '- 必ずグラフ・図表・データを含める' : ''}
${specificRequirements ? `- 特別要件: ${specificRequirements}` : ''}

【出力形式】
各問題は必ず以下の形式で出力してください：

タイトル: [30字以内の簡潔なタイトル]
問題文: [実際の試験で使用する完全な問題文。具体的な指示を含み、${wordLimit}字で解答することを明記]
${includeGraph ? `提示資料: [グラフ・図表・データの詳細な説明。縦軸・横軸・単位・数値を具体的に記述]
読み取りポイント: [データから読み取るべき重要なポイント3-5個、カンマ区切り]` : ''}
出題意図: [この問題で測定したい能力や知識を簡潔に説明]
キーワード: [解答に含まれるべき重要な概念3-5個、カンマ区切り]
評価基準: [採点時の重要な観点4-5個、カンマ区切り]

---

【問題作成の指針】
1. 問題文は具体的で明確な指示を含むこと
2. 「〜について${wordLimit}字以内で論じなさい」のような明確な字数指定を含むこと
3. 難易度${difficulty}に相応しい内容にすること
4. 実際の大学入試で出題される水準の問題にすること
5. ${timeLimit}分で解答可能な範囲に収めること
${includeGraph ? '6. グラフや図表は具体的な数値を含み、分析・考察が必要な内容にすること' : ''}

それでは、上記の条件に従って問題を作成してください。
`;

  return prompt;
}

// 本番環境用のパース処理
function parseProductionThemes(text: string, options: any): any[] {
  const themes = [];
  const themeBlocks = text.split('---').filter(block => block.trim());

  for (const block of themeBlocks) {
    try {
      const theme = parseThemeBlock(block, options);
      if (theme && validateTheme(theme)) {
        themes.push(theme);
      }
    } catch (error) {
      console.error('[Warning] Failed to parse theme block:', error);
      // パースに失敗したブロックはスキップ
      continue;
    }
  }

  return themes;
}

// 個別のテーマブロックをパース
function parseThemeBlock(block: string, options: any): any {
  const lines = block.trim().split('\n').filter(line => line.trim());
  
  const theme: any = {
    id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    category: options.category,
    faculties: options.faculty ? [options.faculty] : ['all'],
    wordLimit: options.wordLimit,
    timeLimit: options.timeLimit,
    difficulty: options.difficulty,
    hasGraph: options.includeGraph,
    type: 'custom',
    createdByAI: true,
    createdAt: new Date().toISOString(),
    requirements: {
      minWords: Math.floor(options.wordLimit * 0.8),
      maxWords: options.wordLimit,
      timeLimit: options.timeLimit
    }
  };

  let currentKey = '';
  let currentValue = '';
  let resourceData = '';
  let readingPoints = [];
  let evaluationCriteria = [];
  let keywords = [];
  let intent = '';

  for (const line of lines) {
    if (line.includes(':')) {
      // 前のキーと値を処理
      if (currentKey && currentValue) {
        processKeyValue(currentKey, currentValue, theme, {
          resourceData,
          readingPoints,
          evaluationCriteria,
          keywords,
          intent
        });
      }
      
      // 新しいキーと値を取得
      const colonIndex = line.indexOf(':');
      currentKey = line.substring(0, colonIndex).trim();
      currentValue = line.substring(colonIndex + 1).trim();
    } else {
      // 複数行にわたる値の場合
      currentValue += '\n' + line;
    }
  }

  // 最後のキーと値を処理
  if (currentKey && currentValue) {
    processKeyValue(currentKey, currentValue, theme, {
      resourceData,
      readingPoints,
      evaluationCriteria,
      keywords,
      intent
    });
  }

  // 問題文の構築
  if (theme.questionText) {
    theme.description = theme.questionText;
    
    // グラフ情報を追加
    if (resourceData && options.includeGraph) {
      theme.description += `\n\n【提示資料】\n${resourceData}`;
      if (readingPoints.length > 0) {
        theme.description += `\n\n【分析の視点】\n${readingPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
      }
    }
    
    // 出題意図を追加（メタデータとして）
    if (intent) {
      theme.intent = intent;
    }
  }

  // キーワードと評価基準を設定
  if (keywords.length > 0) {
    theme.keywords = keywords;
  }
  
  if (evaluationCriteria.length > 0) {
    theme.evaluationCriteria = evaluationCriteria;
  }

  return theme;
}

// キーと値のペアを処理
function processKeyValue(key: string, value: string, theme: any, extras: any) {
  const normalizedKey = key.toLowerCase().replace(/\s/g, '');
  value = value.trim();

  switch (normalizedKey) {
    case 'タイトル':
    case 'title':
      theme.title = value.substring(0, 30); // 30字制限
      break;
    case '問題文':
    case 'question':
    case 'questiontext':
      theme.questionText = value;
      break;
    case '提示資料':
    case '提示データ':
    case 'resource':
    case 'data':
      extras.resourceData = value;
      break;
    case '読み取りポイント':
    case '読み取りぽいんと':
    case 'readingpoints':
      extras.readingPoints = value.split(/[、,]/).map(p => p.trim()).filter(p => p);
      break;
    case '出題意図':
    case 'intent':
      extras.intent = value;
      break;
    case 'キーワード':
    case 'きーわーど':
    case 'keywords':
      extras.keywords = value.split(/[、,]/).map(k => k.trim()).filter(k => k);
      break;
    case '評価基準':
    case 'ひょうかきじゅん':
    case 'evaluationcriteria':
    case 'criteria':
      extras.evaluationCriteria = value.split(/[、,]/).map(c => c.trim()).filter(c => c);
      break;
  }
}

// テーマの検証
function validateTheme(theme: any): boolean {
  // 必須フィールドの確認
  if (!theme.title || !theme.description) {
    return false;
  }
  
  // タイトルの長さ確認
  if (theme.title.length > 30) {
    theme.title = theme.title.substring(0, 30);
  }
  
  // 問題文の最低限の長さ確認
  if (theme.description.length < 50) {
    return false;
  }
  
  // キーワードの数を制限
  if (theme.keywords && theme.keywords.length > 10) {
    theme.keywords = theme.keywords.slice(0, 10);
  }
  
  // 評価基準の数を制限
  if (theme.evaluationCriteria && theme.evaluationCriteria.length > 10) {
    theme.evaluationCriteria = theme.evaluationCriteria.slice(0, 10);
  }
  
  return true;
}