import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 学部別の時事問題トピック
const currentAffairsByDepartment: { [key: string]: string[] } = {
  '法学部': ['司法制度改革', '憲法改正議論', 'AI時代の法整備'],
  '経済学部': ['インフレ対策', '円安問題', 'デジタル通貨'],
  '経営学部': ['DX推進', 'ESG経営', 'スタートアップ支援'],
  '文学部': ['AI翻訳の進化', '電子書籍市場', '言語の多様性'],
  '理学部': ['量子コンピュータ', '気候変動', 'エネルギー問題'],
  '工学部': ['半導体不足', '自動運転技術', '再生可能エネルギー'],
  '医学部': ['新型感染症対策', '遠隔医療', '再生医療'],
  '薬学部': ['ジェネリック医薬品', '創薬AI', 'ドラッグリポジショニング'],
  '農学部': ['食糧安全保障', 'スマート農業', '代替タンパク質'],
  '教育学部': ['教育DX', 'アクティブラーニング', '不登校問題'],
  '国際関係学部': ['地政学的リスク', 'グローバルサウス', '多国間協調'],
  '情報学部': ['生成AI', 'サイバーセキュリティ', 'メタバース'],
  '芸術学部': ['NFTアート', '文化財保護', 'AIクリエイティブ'],
  '社会学部': ['少子高齢化', 'ジェンダー平等', 'デジタル格差'],
  '心理学部': ['メンタルヘルス', 'SNS依存', '認知バイアス'],
};

export async function POST(request: NextRequest) {
  try {
    const { 
      categories, // 複数カテゴリ対応
      difficulty, 
      faculty,
      questionCount = 3 
    } = await request.json();

    // Gemini 1.5 Flash モデルを使用
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 時事問題を含むかどうかチェック
    const includesCurrentAffairs = categories.includes('current_affairs');
    const currentTopics = currentAffairsByDepartment[faculty] || [];
    
    // カテゴリラベルのマッピング
    const categoryLabels: { [key: string]: string } = {
      'motivation': '志望動機',
      'self_pr': '自己PR',
      'student_life': '学生生活',
      'future_goals': '将来の目標',
      'current_affairs': '時事問題'
    };

    const prompt = `
あなたは日本の大学入試面接の専門家です。以下の条件で面接質問を生成してください。

条件:
- 学部: ${faculty}
- カテゴリ: ${categories.map((c: string) => categoryLabels[c] || c).join(', ')}
- 難易度: ${difficulty === 'easy' ? '初級' : difficulty === 'medium' ? '中級' : '上級'}
- 質問数: ${questionCount}

${includesCurrentAffairs ? `
時事問題トピック（${faculty}関連）:
${currentTopics.join(', ')}
` : ''}

以下のJSON形式で${questionCount}個の質問を生成してください。
カテゴリは指定されたものから均等に選んでください。

{
  "questions": [
    {
      "category": "カテゴリID（英語）",
      "question": "質問文",
      "keyPoints": ["ポイント1", "ポイント2", "ポイント3"],
      "difficulty": "${difficulty}",
      "tags": ["タグ1", "タグ2"],
      "currentAffairsTopic": "関連する時事トピック（時事問題カテゴリの場合のみ）"
    }
  ]
}

注意事項:
1. ${faculty}の特性を考慮した具体的な質問を生成
2. 実際の大学入試で出題される可能性が高い質問
3. キーポイントは面接官が評価する重要な要素
4. 時事問題カテゴリの場合は、提供されたトピックから選んで質問を作成
5. カテゴリIDは必ず英語（motivation, self_pr, student_life, future_goals, current_affairs）で記載
6. 各質問は学生が答えやすく、かつ評価しやすい内容にする
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // JSONを抽出してパース
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse response');
    }

    const generatedData = JSON.parse(jsonMatch[0]);

    // 生成された質問を整形
    const questions = generatedData.questions.map((q: any, index: number) => ({
      id: `ai-${Date.now()}-${index}`,
      category: q.category,
      question: q.question,
      keyPoints: q.keyPoints || [],
      difficulty: q.difficulty || difficulty,
      tags: ['AI生成', faculty, ...(q.tags || [])],
      currentAffairsTopic: q.currentAffairsTopic
    }));

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Question generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}