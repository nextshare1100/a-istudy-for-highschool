export interface FeedbackTemplate {
  scoreRange: [number, number];
  overall: string;
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
}

export const FEEDBACK_TEMPLATES: Record<string, FeedbackTemplate[]> = {
  excellent: {
    scoreRange: [85, 100],
    overall: '素晴らしい回答です！具体的で説得力があり、熱意も十分に伝わってきます。',
    strengths: [
      '具体的なエピソードと数値を用いた説明',
      '論理的で一貫性のある構成',
      '大学への理解と将来ビジョンの明確さ',
    ],
    improvements: [
      'さらに独自性を出すために、他の人にはない経験を加えてもよいでしょう',
      '専門用語を使う際は、簡潔な説明を添えるとより親切です',
    ],
    nextSteps: [
      'この調子で他の質問にも対応できるよう練習を続けましょう',
      '実際の面接では、アイコンタクトと適切な声量も意識してください',
    ],
  },
  
  good: {
    scoreRange: [70, 84],
    overall: '良い回答です。基本的な要素は押さえられていますが、さらに改善の余地があります。',
    strengths: [
      '質問に対して適切に答えている',
      '基本的な構成ができている',
      'ある程度の具体性がある',
    ],
    improvements: [
      'より具体的なエピソードや数値を加えましょう',
      '結論を最初に述べてから詳細を説明すると、より伝わりやすくなります',
      '大学の特徴をもっと調べて、具体的に言及しましょう',
    ],
    nextSteps: [
      '回答の構成（結論→理由→具体例→まとめ）を意識して練習しましょう',
      'キーワードを整理して、より説得力のある内容にブラッシュアップしましょう',
    ],
  },
  
  needsImprovement: {
    scoreRange: [50, 69],
    overall: '基本的な方向性は間違っていませんが、大幅な改善が必要です。',
    strengths: [
      '質問の意図は理解できている',
      '話そうとする意欲は感じられる',
    ],
    improvements: [
      '具体的なエピソードを必ず含めましょう',
      '論理的な構成を意識して、順序立てて話しましょう',
      '「なぜ」「どのように」を明確に説明しましょう',
      '専門用語や難しい言葉ではなく、分かりやすい言葉を使いましょう',
    ],
    nextSteps: [
      'まず、伝えたいポイントを3つに整理してから話す練習をしましょう',
      '時間を計って練習し、適切な長さで話せるようにしましょう',
      '模範解答を参考に、構成と内容を学びましょう',
    ],
  },
  
  poor: {
    scoreRange: [0, 49],
    overall: '残念ながら、回答として不十分です。基本から見直しましょう。',
    strengths: [
      '面接に臨む姿勢は評価できます',
    ],
    improvements: [
      '質問の意図を正確に理解しましょう',
      '最低限、結論を明確に述べましょう',
      '具体例を1つは必ず含めましょう',
      '時間内に要点をまとめる練習が必要です',
    ],
    nextSteps: [
      '基本的な質問への回答を準備し、暗記するのではなく理解しましょう',
      '短い文章で要点を伝える練習から始めましょう',
      'カラオケ練習モードで、適切なペースを身につけましょう',
      '先生や友人に聞いてもらい、フィードバックを受けましょう',
    ],
  },
};

export function getFeedbackTemplate(score: number): FeedbackTemplate {
  if (score >= 85) return FEEDBACK_TEMPLATES.excellent;
  if (score >= 70) return FEEDBACK_TEMPLATES.good;
  if (score >= 50) return FEEDBACK_TEMPLATES.needsImprovement;
  return FEEDBACK_TEMPLATES.poor;
}

export function generatePersonalizedFeedback(
  score: number,
  category: string,
  specificIssues: string[]
): string {
  const template = getFeedbackTemplate(score);
  let feedback = template.overall + '\n\n';
  
  // カテゴリ別の追加フィードバック
  const categoryFeedback: Record<string, string> = {
    motivation: '志望動機では、なぜ他の大学ではなくこの大学なのかを明確にすることが重要です。',
    self_pr: '自己PRでは、あなたの強みが大学でどう活きるかを具体的に説明しましょう。',
    student_life: '学生生活の経験では、何を学び、どう成長したかを明確に伝えましょう。',
    future_goals: '将来の目標では、大学での学びがどうつながるかを論理的に説明しましょう。',
  };
  
  if (categoryFeedback[category]) {
    feedback += categoryFeedback[category] + '\n\n';
  }
  
  // 具体的な問題点への対処
  if (specificIssues.length > 0) {
    feedback += '特に以下の点に注意してください：\n';
    specificIssues.forEach(issue => {
      feedback += `・${issue}\n`;
    });
  }
  
  return feedback;
}