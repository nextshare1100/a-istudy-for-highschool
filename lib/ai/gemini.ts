import { GoogleGenerativeAI } from '@google/generative-ai';

// デバッグ: 環境変数の確認
console.log('=== Gemini API Debug ===');
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY?.length);
console.log('GEMINI_API_KEY first 10 chars:', process.env.GEMINI_API_KEY?.substring(0, 10));
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('======================');

// Gemini APIクライアントの初期化
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set in environment variables');
  throw new Error('GEMINI_API_KEY is required');
}

const genAI = new GoogleGenerativeAI(apiKey);

// 使用するモデル
export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// 問題生成用のプロンプトテンプレート
export const PROBLEM_TEMPLATES = {
  math: {
    basic: `高校{grade}年生向けの{topic}に関する基礎問題を1問生成してください。
    以下の形式で出力してください：
    
    問題文：[問題内容]
    選択肢：
    A) [選択肢A]
    B) [選択肢B]
    C) [選択肢C]
    D) [選択肢D]
    
    正解：[正解の選択肢]
    解説：[詳しい解説]`,
    
    advanced: `高校{grade}年生向けの{topic}に関する応用問題を1問生成してください。
    計算過程も含めて出力してください。
    
    問題文：[問題内容]
    解答：[模範解答と計算過程]
    ポイント：[解法のポイント]`
  },
  
  english: {
    vocabulary: `高校{grade}年生向けの英単語問題を1問生成してください。
    
    問題文：次の英単語の意味として最も適切なものを選びなさい。
    単語：[英単語]
    
    選択肢：
    A) [選択肢A]
    B) [選択肢B]
    C) [選択肢C]
    D) [選択肢D]
    
    正解：[正解の選択肢]
    解説：[単語の詳しい説明、例文を含む]`,
    
    grammar: `高校{grade}年生向けの英文法問題を1問生成してください。
    
    問題文：[空所補充または誤り訂正問題]
    
    選択肢：
    A) [選択肢A]
    B) [選択肢B]
    C) [選択肢C]
    D) [選択肢D]
    
    正解：[正解の選択肢]
    解説：[文法ポイントの説明]`
  },
  
  japanese: {
    reading: `高校{grade}年生向けの現代文読解問題を生成してください。
    短い文章（200字程度）とそれに関する問題を1問作成してください。
    
    【文章】
    [文章内容]
    
    【問題】
    [問題文]
    
    選択肢：
    A) [選択肢A]
    B) [選択肢B]
    C) [選択肢C]
    D) [選択肢D]
    
    正解：[正解の選択肢]
    解説：[読解のポイント]`,
    
    kanji: `高校{grade}年生向けの漢字問題を1問生成してください。
    
    問題文：次の文の下線部の漢字の読みを答えなさい。
    [下線部を含む文章]
    
    正解：[読み方]
    解説：[漢字の意味や使い方]`
  },
  
  science: {
    physics: `高校{grade}年生向けの{topic}に関する物理問題を1問生成してください。
    公式や法則を使う問題にしてください。
    
    問題文：[問題内容]
    
    選択肢：
    A) [選択肢A]
    B) [選択肢B]
    C) [選択肢C]
    D) [選択肢D]
    
    正解：[正解の選択肢]
    解説：[使用する公式と解法の説明]`,
    
    chemistry: `高校{grade}年生向けの{topic}に関する化学問題を1問生成してください。
    
    問題文：[問題内容]
    
    選択肢：
    A) [選択肢A]
    B) [選択肢B]
    C) [選択肢C]
    D) [選択肢D]
    
    正解：[正解の選択肢]
    解説：[化学反応式や原理の説明]`,
    
    biology: `高校{grade}年生向けの{topic}に関する生物問題を1問生成してください。
    
    問題文：[問題内容]
    
    選択肢：
    A) [選択肢A]
    B) [選択肢B]
    C) [選択肢C]
    D) [選択肢D]
    
    正解：[正解の選択肢]
    解説：[生物学的な仕組みの説明]`
  },
  
  social: {
    history: `高校{grade}年生向けの{topic}に関する{subject}問題を1問生成してください。
    
    問題文：[歴史的出来事や人物に関する問題]
    
    選択肢：
    A) [選択肢A]
    B) [選択肢B]
    C) [選択肢C]
    D) [選択肢D]
    
    正解：[正解の選択肢]
    解説：[歴史的背景や意義の説明]`,
    
    geography: `高校{grade}年生向けの地理問題を1問生成してください。
    
    問題文：[地理に関する問題]
    
    選択肢：
    A) [選択肢A]
    B) [選択肢B]
    C) [選択肢C]
    D) [選択肢D]
    
    正解：[正解の選択肢]
    解説：[地理的特徴や要因の説明]`
  }
};

// 科目と問題タイプのマッピング
export const SUBJECT_MAPPING: { [key: string]: { category: string; types: string[] } } = {
  '数学': { category: 'math', types: ['basic', 'advanced'] },
  '英語': { category: 'english', types: ['vocabulary', 'grammar'] },
  '国語': { category: 'japanese', types: ['reading', 'kanji'] },
  '物理': { category: 'science', types: ['physics'] },
  '化学': { category: 'science', types: ['chemistry'] },
  '生物': { category: 'science', types: ['biology'] },
  '日本史': { category: 'social', types: ['history'] },
  '世界史': { category: 'social', types: ['history'] },
  '地理': { category: 'social', types: ['geography'] },
  '政治経済': { category: 'social', types: ['history'] }
};

// トピックリスト（科目ごと）
export const TOPICS: { [key: string]: string[] } = {
  '数学': ['二次関数', '三角関数', '微分積分', '確率', 'ベクトル', '数列', '複素数'],
  '英語': ['現在完了', '仮定法', '関係代名詞', '分詞構文', '比較級'],
  '物理': ['力学', '電磁気', '波動', '熱力学'],
  '化学': ['化学反応', '酸と塩基', '酸化還元', '有機化学'],
  '生物': ['細胞', '遺伝', '生態系', '進化'],
  '日本史': ['平安時代', '鎌倉時代', '戦国時代', '明治維新', '近代'],
  '世界史': ['古代文明', '中世ヨーロッパ', '大航海時代', '産業革命', '世界大戦'],
  '地理': ['地形', '気候', '産業', '人口', '都市'],
  '政治経済': ['日本国憲法', '民主主義', '経済システム', '国際関係']
};