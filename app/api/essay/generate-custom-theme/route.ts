import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/gemini/client';
import { db } from '@/lib/firebase/index';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Gemini AIの初期化
const client = getGeminiClient();

// カテゴリごとの専門用語（拡張版）
const categoryKeywords = {
  society: ['社会構造', '格差', '多様性', '共生', 'SDGs', 'グローバル化', '地域コミュニティ', 'デジタル社会', '高齢化', '少子化'],
  culture: ['文化的多様性', 'アイデンティティ', '伝統', '価値観', '文化継承', 'ポップカルチャー', '文化交流', 'サブカルチャー'],
  science: ['AI', 'バイオテクノロジー', 'イノベーション', '倫理', '持続可能性', '量子コンピュータ', '遺伝子工学', 'ロボティクス'],
  environment: ['気候変動', '生物多様性', 'カーボンニュートラル', '循環型社会', '再生可能エネルギー', '海洋汚染', '森林保全'],
  education: ['アクティブラーニング', 'STEAM教育', '生涯学習', 'EdTech', 'インクルーシブ教育', 'リスキリング', 'オンライン学習'],
  economy: ['グローバル経済', 'デジタル通貨', '格差', '持続可能な成長', 'シェアリングエコノミー', 'ベーシックインカム', 'ESG投資'],
  politics: ['民主主義', 'ガバナンス', '国際協調', '市民参加', 'デジタル民主主義', '地方創生', '国際紛争'],
  ethics: ['生命倫理', 'AI倫理', '環境倫理', '医療倫理', 'ビジネス倫理', '研究倫理', 'メディア倫理']
};

// ランダムな時事トピック
const currentTopics = [
  '2024年の社会動向',
  'ポストコロナ時代',
  'デジタルトランスフォーメーション',
  'Z世代の価値観',
  'グリーントランスフォーメーション',
  'Web3.0時代',
  'メタバース社会',
  '人生100年時代'
];

// ランダムな視点
const perspectives = [
  '個人と社会の観点から',
  '短期的・長期的な視点で',
  '国内外の事例を踏まえて',
  '歴史的経緯を考慮して',
  '未来志向の観点から',
  '多角的な視点で',
  '実現可能性を考慮して',
  '具体的な事例を挙げながら'
];

export async function POST(request: NextRequest) {
  console.log('AI theme generation API called');
  
  try {
    const body = await request.json();
    const { options } = body;
    
    // Gemini APIキーの確認
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      return fallbackResponse(options);
    }
    
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const keywords = categoryKeywords[options.category as keyof typeof categoryKeywords] || [];
    
    // ランダム要素を追加
    const randomKeywords = keywords.sort(() => 0.5 - Math.random()).slice(0, 3);
    const randomTopic = currentTopics[Math.floor(Math.random() * currentTopics.length)];
    const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)];
    const randomSeed = Math.random().toString(36).substring(7);
    
    const prompt = `
大学入試の小論文テーマを1つ生成してください。
必ず新しい独自のテーマを作成し、既存のテーマと重複しないようにしてください。

【条件】
- トピック: ${options.topic}
- カテゴリ: ${options.category}
- 文字数: ${options.wordLimit}字（${options.wordLimit * 0.8}字〜${options.wordLimit}字）
- 制限時間: ${options.timeLimit}分
- 難易度: ${options.difficulty}/5
- 参考キーワード: ${randomKeywords.join(', ')}
- 時事的な文脈: ${randomTopic}
- 論述の視点: ${randomPerspective}
- ユニークID: ${randomSeed}
${options.includeGraph ? '- グラフやデータの読み取りを含む' : ''}
${options.specificRequirements ? `- 追加要件: ${options.specificRequirements}` : ''}

【重要な指示】
1. 必ず他とは異なる独自性のあるテーマを生成すること
2. ${randomTopic}の文脈を含めること
3. 問題文に${randomPerspective}という指示を含めること
4. 現代的で具体的な問題設定にすること

【出力形式】
以下の形式でJSONを出力してください：
{
  "title": "テーマのタイトル（20字以内）",
  "description": "問題文（${options.wordLimit}字で論述することを明確に指示）",
  "background": "このテーマの社会的背景（100字程度）",
  "evaluationPoints": [
    "評価ポイント1",
    "評価ポイント2",
    "評価ポイント3",
    "評価ポイント4"
  ],
  "keywords": ["キーワード1", "キーワード2", "キーワード3"],
  "hints": [
    "論述のヒント1",
    "論述のヒント2"
  ]
}

難易度設定：
- ${options.difficulty === 5 ? '抽象的で哲学的な内容、複雑な概念の統合が必要' : 
    options.difficulty === 4 ? '高度な分析力と批判的思考が必要' :
    options.difficulty === 3 ? 'バランスの取れた論証と具体例の提示が必要' :
    options.difficulty === 2 ? '基本的な論理構成と一般的な知識で対応可能' :
    '具体的で身近な内容、明確な結論が導きやすい'}
`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      // JSONを抽出
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      let generatedTheme;
      
      if (jsonMatch) {
        generatedTheme = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }
      
      // 必須フィールドを追加
      const theme = {
        ...generatedTheme,
        category: options.category,
        wordLimit: options.wordLimit,
        timeLimit: options.timeLimit,
        difficulty: options.difficulty,
        type: 'custom',
        requirements: {
          minWords: Math.floor(options.wordLimit * 0.8),
          maxWords: options.wordLimit,
          timeLimit: options.timeLimit,
          mustInclude: generatedTheme.keywords || []
        },
        includeGraph: options.includeGraph || false,
        generationSeed: randomSeed,
        generatedAt: new Date().toISOString()
      };
      
      // Firestoreに保存
      const docRef = await addDoc(collection(db, 'essay_themes'), {
        ...theme,
        createdAt: serverTimestamp(),
        generatedBy: 'ai',
        uniqueId: randomSeed
      });
      
      return NextResponse.json({
        success: true,
        count: 1,
        themes: [{
          ...theme,
          id: docRef.id
        }]
      });
      
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      return fallbackResponse(options);
    }
    
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'テーマの生成に失敗しました', details: error.message },
      { status: 500 }
    );
  }
}

// フォールバック用のレスポンス（改善版）
function fallbackResponse(options: any) {
  const themes = {
    society: [
      { title: 'AIと共生する社会', description: 'AI技術の発展が社会にもたらす影響と、人間とAIが共生するための課題について論じなさい。' },
      { title: '少子高齢化への対応', description: '日本の少子高齢化問題に対する効果的な解決策について論じなさい。' },
      { title: 'デジタル格差の解消', description: 'デジタル技術の普及に伴う格差問題とその解決策について論じなさい。' },
      { title: '地域コミュニティの再生', description: '現代社会における地域コミュニティの役割と活性化の方法について論じなさい。' }
    ],
    culture: [
      { title: '文化の継承と革新', description: '伝統文化を守りながら新しい価値を創造することの重要性について論じなさい。' },
      { title: 'グローバル化と文化', description: 'グローバル化が進む中で、文化的アイデンティティを保つことの意義について論じなさい。' },
      { title: '現代アートの社会的役割', description: '現代アートが社会に果たす役割と可能性について論じなさい。' },
      { title: 'デジタル時代の創造性', description: 'デジタル技術が文化創造に与える影響について論じなさい。' }
    ],
    science: [
      { title: '科学技術と倫理', description: '最先端技術の開発において倫理的配慮が必要な理由について論じなさい。' },
      { title: '持続可能な技術革新', description: '環境に配慮した技術イノベーションの重要性について論じなさい。' },
      { title: 'バイオテクノロジーの未来', description: '生命科学の進歩がもたらす可能性と課題について論じなさい。' },
      { title: '宇宙開発の意義', description: '人類にとっての宇宙開発の意義と今後の展望について論じなさい。' }
    ],
    environment: [
      { title: '気候変動対策', description: '個人レベルでできる気候変動対策とその効果について論じなさい。' },
      { title: '循環型社会の実現', description: '持続可能な循環型社会を実現するための課題と解決策について論じなさい。' },
      { title: '生物多様性の保全', description: '生物多様性を守ることの重要性と具体的な方策について論じなさい。' },
      { title: '都市と自然の共生', description: '都市開発と自然環境保護の両立について論じなさい。' }
    ]
  };
  
  const categoryThemes = themes[options.category as keyof typeof themes] || themes.society;
  
  // ランダム性を高めるために複数の要素を組み合わせる
  const randomIndex = Math.floor(Math.random() * categoryThemes.length);
  const selectedTheme = categoryThemes[randomIndex];
  const randomPerspective = perspectives[Math.floor(Math.random() * perspectives.length)];
  
  // 問題文にランダムな視点を追加
  const modifiedDescription = selectedTheme.description.replace('論じなさい。', `${randomPerspective}論じなさい。`);
  
  const theme = {
    ...selectedTheme,
    description: modifiedDescription,
    category: options.category,
    wordLimit: options.wordLimit,
    timeLimit: options.timeLimit,
    difficulty: options.difficulty,
    type: 'custom',
    background: `このテーマは${currentTopics[Math.floor(Math.random() * currentTopics.length)]}における重要な課題の一つです。`,
    requirements: {
      minWords: Math.floor(options.wordLimit * 0.8),
      maxWords: options.wordLimit,
      timeLimit: options.timeLimit
    },
    evaluationPoints: [
      '論理的構成力',
      '具体例の適切性',
      '独自の視点',
      '結論の明確性'
    ],
    keywords: ['課題', '解決策', '展望'],
    hints: [
      '序論で問題の背景を明確にする',
      '具体例を交えて論証する'
    ],
    generationSeed: Math.random().toString(36).substring(7)
  };
  
  // Firestoreに保存
  return addDoc(collection(db, 'essay_themes'), {
    ...theme,
    createdAt: serverTimestamp(),
    generatedBy: 'fallback',
    uniqueId: theme.generationSeed
  }).then(docRef => {
    return NextResponse.json({
      success: true,
      count: 1,
      themes: [{
        ...theme,
        id: docRef.id
      }]
    });
  });
}