// 日本語テキスト処理のユーティリティ関数

// 感嘆詞のリスト
export const FILLER_WORDS = [
  'えーと', 'えー', 'あの', 'あのー', 'その', 'そのー',
  'まあ', 'まぁ', 'ええと', 'ええ', 'うーん', 'うん',
  'あー', 'えっと', 'えっとー', 'んー', 'んーと',
  'なんか', 'なんていうか', 'こう', 'ほら', 'それで',
  'で', 'でー', 'だから', 'つまり', 'ていうか',
  'エート', 'エー', 'アノ', 'アノー', 'ソノ', 'ソノー',
  'マア', 'マァ', 'エエト', 'エエ', 'ウーン', 'ウン',
  'アー', 'エット', 'エットー', 'ンー', 'ンート'
];

// 感嘆詞をハイライトする関数
export function highlightFillerWords(text: string): string {
  let highlightedText = text;
  
  // 各感嘆詞を赤文字でマークアップ
  FILLER_WORDS.forEach(filler => {
    const regex = new RegExp(`(${filler})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<span class="filler-word">$1</span>');
  });
  
  return highlightedText;
}

// 感嘆詞をカウントする関数
export function countFillerWords(text: string): { word: string; count: number }[] {
  const fillerCounts: { [key: string]: number } = {};
  
  FILLER_WORDS.forEach(filler => {
    const regex = new RegExp(filler, 'gi');
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      fillerCounts[filler] = matches.length;
    }
  });
  
  return Object.entries(fillerCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
}

// 感嘆詞を除去した文章を返す関数
export function removeFillerWords(text: string): string {
  let cleanText = text;
  
  FILLER_WORDS.forEach(filler => {
    const regex = new RegExp(`\\s*${filler}\\s*`, 'gi');
    cleanText = cleanText.replace(regex, ' ');
  });
  
  // 余分なスペースを除去
  return cleanText.replace(/\s+/g, ' ').trim();
}

// ひらがな・カタカナ変換のマッピング
const kanaMap: { [key: string]: string } = {
  'ア': 'あ', 'イ': 'い', 'ウ': 'う', 'エ': 'え', 'オ': 'お',
  'カ': 'か', 'キ': 'き', 'ク': 'く', 'ケ': 'け', 'コ': 'こ',
  'ガ': 'が', 'ギ': 'ぎ', 'グ': 'ぐ', 'ゲ': 'げ', 'ゴ': 'ご',
  'サ': 'さ', 'シ': 'し', 'ス': 'す', 'セ': 'せ', 'ソ': 'そ',
  'ザ': 'ざ', 'ジ': 'じ', 'ズ': 'ず', 'ゼ': 'ぜ', 'ゾ': 'ぞ',
  'タ': 'た', 'チ': 'ち', 'ツ': 'つ', 'テ': 'て', 'ト': 'と',
  'ダ': 'だ', 'ヂ': 'ぢ', 'ヅ': 'づ', 'デ': 'で', 'ド': 'ど',
  'ナ': 'な', 'ニ': 'に', 'ヌ': 'ぬ', 'ネ': 'ね', 'ノ': 'の',
  'ハ': 'は', 'ヒ': 'ひ', 'フ': 'ふ', 'ヘ': 'へ', 'ホ': 'ほ',
  'バ': 'ば', 'ビ': 'び', 'ブ': 'ぶ', 'ベ': 'べ', 'ボ': 'ぼ',
  'パ': 'ぱ', 'ピ': 'ぴ', 'プ': 'ぷ', 'ペ': 'ぺ', 'ポ': 'ぽ',
  'マ': 'ま', 'ミ': 'み', 'ム': 'む', 'メ': 'め', 'モ': 'も',
  'ヤ': 'や', 'ユ': 'ゆ', 'ヨ': 'よ',
  'ラ': 'ら', 'リ': 'り', 'ル': 'る', 'レ': 'れ', 'ロ': 'ろ',
  'ワ': 'わ', 'ヲ': 'を', 'ン': 'ん',
  'ァ': 'ぁ', 'ィ': 'ぃ', 'ゥ': 'ぅ', 'ェ': 'ぇ', 'ォ': 'ぉ',
  'ッ': 'っ', 'ャ': 'ゃ', 'ュ': 'ゅ', 'ョ': 'ょ', 'ヮ': 'ゎ',
  'ヴ': 'ゔ', 'ー': 'ー'
};

// カタカナをひらがなに変換
export function katakanaToHiragana(str: string): string {
  return str.split('').map(char => kanaMap[char] || char).join('');
}

// テキストを正規化（漢字変換の違いを吸収）
export function normalizeJapaneseText(text: string): string {
  // 1. 全角英数字を半角に変換
  let normalized = text.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });

  // 2. カタカナをひらがなに変換
  normalized = katakanaToHiragana(normalized);

  // 3. 句読点の統一
  normalized = normalized
    .replace(/[。．]/g, '。')
    .replace(/[、，]/g, '、')
    .replace(/[！!]/g, '!')
    .replace(/[？?]/g, '?');

  // 4. スペースの正規化
  normalized = normalized.replace(/[\s　]+/g, ' ').trim();

  return normalized;
}

// よくある漢字の読み違いパターン
const commonMisreadings: { [key: string]: string[] } = {
  '志望': ['しぼう', 'しもう'],
  '志向': ['しこう'],
  '嗜好': ['しこう'],
  '施行': ['しこう', 'せこう'],
  '思考': ['しこう'],
  '至高': ['しこう'],
  '私': ['わたし', 'わたくし'],
  '今日': ['きょう', 'こんにち'],
  '明日': ['あした', 'あす', 'みょうにち'],
  '一日': ['いちにち', 'ついたち'],
  '人': ['ひと', 'じん', 'にん'],
  '日本': ['にほん', 'にっぽん'],
};

// 文章の類似度を計算（レーベンシュタイン距離）
export function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const dp: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // 削除
          dp[i][j - 1] + 1,    // 挿入
          dp[i - 1][j - 1] + 1 // 置換
        );
      }
    }
  }

  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : 1 - (dp[len1][len2] / maxLen);
}

// キーワードマッチング（漢字の違いを考慮）
export function keywordMatching(answer: string, keywords: string[]): {
  matched: string[];
  score: number;
} {
  const normalizedAnswer = normalizeJapaneseText(answer);
  const matched: string[] = [];
  
  for (const keyword of keywords) {
    const normalizedKeyword = normalizeJapaneseText(keyword);
    
    // 完全一致
    if (normalizedAnswer.includes(normalizedKeyword)) {
      matched.push(keyword);
      continue;
    }
    
    // 部分一致（80%以上の類似度）
    const words = normalizedAnswer.split(/[、。！？\s]+/);
    for (const word of words) {
      if (word.length >= normalizedKeyword.length * 0.8) {
        const similarity = calculateSimilarity(word, normalizedKeyword);
        if (similarity >= 0.8) {
          matched.push(keyword);
          break;
        }
      }
    }
  }
  
  const score = keywords.length > 0 ? matched.length / keywords.length : 0;
  return { matched, score };
}

// 評価関数（漢字変換の違いを考慮）
export function evaluateAnswer(
  answer: string,
  criteria: {
    keyPoints: string[];
    sampleAnswer?: string;
    minLength?: number;
  }
): {
  score: number;
  feedback: string[];
  strengths: string[];
  improvements: string[];
  fillerWordCount: { word: string; count: number }[];
  cleanedAnswer: string;
} {
  const feedback: string[] = [];
  const strengths: string[] = [];
  const improvements: string[] = [];
  let totalScore = 0;
  let scoreCount = 0;

  // 感嘆詞の分析
  const fillerWordCount = countFillerWords(answer);
  const cleanedAnswer = removeFillerWords(answer);
  const totalFillers = fillerWordCount.reduce((sum, item) => sum + item.count, 0);
  
  // 感嘆詞の使用に関する評価
  if (totalFillers > 10) {
    improvements.push(`感嘆詞（「えー」「あの」など）が${totalFillers}回使用されています。緊張は理解できますが、練習により減らすことができます。`);
    totalScore += 0.7;
  } else if (totalFillers > 5) {
    feedback.push(`感嘆詞が${totalFillers}回使用されています。もう少し減らせるとより良い印象になります。`);
    totalScore += 0.85;
  } else if (totalFillers <= 2) {
    strengths.push('感嘆詞の使用が少なく、スムーズに話せています。');
    totalScore += 1;
  } else {
    totalScore += 0.9;
  }
  scoreCount++;

  // 1. 文字数チェック（感嘆詞を除いた文字数で評価）
  const minLength = criteria.minLength || 200;
  if (cleanedAnswer.length < minLength) {
    improvements.push(`回答が短すぎます。${minLength}文字以上を目安に、より詳しく説明してください。`);
    totalScore += 0.5;
  } else {
    strengths.push('適切な長さで回答できています。');
    totalScore += 1;
  }
  scoreCount++;

  // 2. キーポイントの含有率（漢字変換の違いを考慮）
  const keywordResult = keywordMatching(cleanedAnswer, criteria.keyPoints);
  totalScore += keywordResult.score;
  scoreCount++;

  if (keywordResult.score >= 0.8) {
    strengths.push('評価ポイントを十分にカバーできています。');
  } else if (keywordResult.score >= 0.5) {
    feedback.push('いくつかの重要なポイントが含まれていますが、さらに充実させることができます。');
    improvements.push(`以下のポイントも含めるとより良い回答になります: ${
      criteria.keyPoints.filter(kp => !keywordResult.matched.includes(kp)).join('、')
    }`);
  } else {
    improvements.push('評価ポイントの多くが含まれていません。質問の要点を再確認してください。');
  }

  // 3. 構成の評価
  const hasParagraphs = cleanedAnswer.includes('。') && cleanedAnswer.split('。').length > 3;
  const hasConclusion = cleanedAnswer.lastIndexOf('。') > cleanedAnswer.length * 0.8;
  
  if (hasParagraphs && hasConclusion) {
    strengths.push('論理的な構成で回答されています。');
    totalScore += 1;
  } else {
    improvements.push('段落を分けて、論理的な構成を心がけましょう。');
    totalScore += 0.5;
  }
  scoreCount++;

  // 4. 具体性の評価
  const concreteWords = ['例えば', 'たとえば', '具体的に', 'ように', '経験', '実際'];
  const hasConcreteExamples = concreteWords.some(word => 
    normalizeJapaneseText(cleanedAnswer).includes(normalizeJapaneseText(word))
  );
  
  if (hasConcreteExamples) {
    strengths.push('具体的な例を用いて説明できています。');
    totalScore += 1;
  } else {
    improvements.push('具体的なエピソードや例を加えると、より説得力のある回答になります。');
    totalScore += 0.3;
  }
  scoreCount++;

  // 最終スコア計算（100点満点）
  const finalScore = Math.round((totalScore / scoreCount) * 100);

  return {
    score: finalScore,
    feedback,
    strengths,
    improvements,
    fillerWordCount,
    cleanedAnswer
  };
}

// 回答提出時の処理を更新
export function submitAnswer(answer: string, question: any) {
  // 評価基準の設定
  const criteria = {
    keyPoints: question.keyPoints,
    sampleAnswer: question.sampleAnswer,
    minLength: question.category === 'self_pr' ? 300 : 200
  };

  // 評価実行
  const evaluation = evaluateAnswer(answer, criteria);
  
  // 結果の整形
  return {
    ...evaluation,
    originalAnswer: answer,
    normalizedAnswer: normalizeJapaneseText(answer),
    timestamp: new Date().toISOString(),
    questionId: question.id
  };
}