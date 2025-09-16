interface EvaluationResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  coherence: number;
  relevance: number;
  completeness: number;
}

export async function evaluateAnswer(
  question: string,
  answer: string,
  keyPoints: string[]
): Promise<EvaluationResult> {
  const evaluation: EvaluationResult = {
    score: 0,
    feedback: '',
    strengths: [],
    improvements: [],
    coherence: 0,
    relevance: 0,
    completeness: 0
  };

  // 文字数チェック
  const answerLength = answer.length;
  if (answerLength < 50) {
    evaluation.improvements.push('回答が短すぎます。もう少し詳しく説明しましょう。');
    evaluation.completeness = 20;
  } else if (answerLength < 150) {
    evaluation.completeness = 60;
  } else {
    evaluation.strengths.push('適切な長さで回答できています。');
    evaluation.completeness = 100;
  }

  // キーワードチェック
  const includedKeyPoints = keyPoints.filter(point => 
    answer.includes(point)
  );
  
  evaluation.relevance = (includedKeyPoints.length / keyPoints.length) * 100;
  
  if (includedKeyPoints.length > 0) {
    evaluation.strengths.push(`重要なポイント（${includedKeyPoints.join('、')}）に触れています。`);
  }
  
  const missingPoints = keyPoints.filter(point => 
    !answer.includes(point)
  );
  
  if (missingPoints.length > 0) {
    evaluation.improvements.push(`${missingPoints.join('、')}についても言及すると良いでしょう。`);
  }

  // 文章の論理性チェック
  const hasIntroduction = answer.includes('まず') || answer.includes('第一に') || answer.includes('はじめに');
  const hasConclusion = answer.includes('以上') || answer.includes('このように') || answer.includes('したがって');
  const hasStructure = answer.includes('次に') || answer.includes('また') || answer.includes('さらに');

  let coherenceScore = 50;
  if (hasIntroduction) coherenceScore += 20;
  if (hasStructure) coherenceScore += 20;
  if (hasConclusion) coherenceScore += 10;
  
  evaluation.coherence = coherenceScore;

  if (coherenceScore >= 80) {
    evaluation.strengths.push('論理的な構成で話せています。');
  } else {
    evaluation.improvements.push('序論・本論・結論の構成を意識しましょう。');
  }

  // 総合スコア計算
  evaluation.score = Math.round(
    (evaluation.completeness * 0.3 + 
     evaluation.relevance * 0.4 + 
     evaluation.coherence * 0.3)
  );

  // 総合フィードバック
  if (evaluation.score >= 80) {
    evaluation.feedback = '素晴らしい回答です！要点を押さえて論理的に説明できています。';
  } else if (evaluation.score >= 60) {
    evaluation.feedback = '良い回答ですが、もう少し改善の余地があります。';
  } else {
    evaluation.feedback = '基本的な内容は理解できていますが、より詳しく、構造的に話す練習をしましょう。';
  }

  return evaluation;
}
