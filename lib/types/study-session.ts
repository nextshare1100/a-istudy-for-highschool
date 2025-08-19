// lib/types/study-session.ts

export interface EnhancedStudySession {
  id: string
  date: Date
  startTime: string
  endTime: string
  subject: string
  unit: string
  studyType: 'concept' | 'practice' | 'review' | 'test'
  
  // 学習の目的と課題
  objectives: {
    mainGoal: string              // 主な目標（例：「二次関数の最大最小問題を解けるようになる」）
    subGoals: string[]            // サブ目標（例：「判別式の使い方を理解する」）
    problemsToSolve: string[]     // 解決すべき課題（例：「グラフと式の関係が理解できていない」）
    expectedOutcomes: string[]    // 期待される成果（例：「8割以上の正答率」）
  }
  
  // 具体的な内容
  content: {
    topics: string[]              // 扱うトピック
    keyPoints: string[]           // 重要ポイント
    commonMistakes: string[]      // よくある間違い
    prerequisiteKnowledge: string[] // 前提知識
  }
  
  // 学習方法
  methodology: {
    approach: string              // アプローチ方法
    materials: Material[]         // 使用教材
    exercises: Exercise[]         // 演習問題
    checkpoints: Checkpoint[]     // 理解度チェックポイント
  }
  
  // 進捗と結果
  progress?: {
    status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
    completedAt?: Date
    actualDuration?: number
    achievement: {
      goalsAchieved: string[]
      goalsNotAchieved: string[]
      score?: number
      notes?: string
    }
    nextSteps?: string[]          // 次回への申し送り
  }
}

export interface Material {
  type: 'textbook' | 'video' | 'problem_set' | 'reference'
  name: string
  pages?: string                  // 例：「p.120-135」
  url?: string
  estimatedTime: number           // 分
}

export interface Exercise {
  id: string
  type: 'basic' | 'standard' | 'advanced'
  description: string
  targetCount: number             // 目標問題数
  actualCount?: number            // 実際に解いた問題数
  correctRate?: number            // 正答率
}

export interface Checkpoint {
  timing: string                  // 例：「30分後」
  question: string                // 確認質問
  criteria: string                // 達成基準
  passed?: boolean
}

// 学習セッション生成用の関数
export function generateStudySession(
  weaknessData: any,
  targetDate: Date,
  availableTime: number
): EnhancedStudySession {
  // 弱点データから最適な学習セッションを生成
  const session: EnhancedStudySession = {
    id: `session-${Date.now()}`,
    date: targetDate,
    startTime: '14:00',
    endTime: '15:30',
    subject: weaknessData.subject,
    unit: weaknessData.unit,
    studyType: weaknessData.accuracy < 50 ? 'concept' : 'practice',
    
    objectives: {
      mainGoal: `${weaknessData.unit}の正答率を${weaknessData.accuracy}%から${weaknessData.accuracy + 20}%に向上させる`,
      subGoals: [
        `${weaknessData.rootCauses[0]}を克服する`,
        `基本パターンを3つ以上マスターする`,
        `応用問題に対応できる思考プロセスを身につける`
      ],
      problemsToSolve: weaknessData.rootCauses,
      expectedOutcomes: [
        `基本問題の正答率90%以上`,
        `標準問題の正答率70%以上`,
        `解答時間を20%短縮`
      ]
    },
    
    content: {
      topics: weaknessData.subTopics || [],
      keyPoints: [
        '公式の意味と導出過程を理解する',
        'グラフと式の関係を視覚的に把握する',
        '問題文から必要な情報を抽出する技術'
      ],
      commonMistakes: weaknessData.commonMistakes || [
        '符号のミス',
        '条件の見落とし',
        '計算順序の誤り'
      ],
      prerequisiteKnowledge: weaknessData.prerequisites || []
    },
    
    methodology: {
      approach: weaknessData.accuracy < 50 
        ? '基礎から丁寧に概念を理解し、簡単な例題から始める'
        : '標準問題を中心に、パターン認識と応用力を強化する',
      materials: [
        {
          type: 'textbook',
          name: '青チャート数学IA',
          pages: 'p.120-135',
          estimatedTime: 30
        },
        {
          type: 'video',
          name: '二次関数の最大最小（基礎編）',
          url: 'https://example.com/video',
          estimatedTime: 15
        }
      ],
      exercises: [
        {
          id: 'ex1',
          type: 'basic',
          description: '基本公式の確認問題',
          targetCount: 10
        },
        {
          id: 'ex2',
          type: 'standard',
          description: '定型パターンの演習',
          targetCount: 15
        },
        {
          id: 'ex3',
          type: 'advanced',
          description: '応用・融合問題',
          targetCount: 5
        }
      ],
      checkpoints: [
        {
          timing: '20分後',
          question: '二次関数の頂点の求め方を説明できるか？',
          criteria: '平方完成または公式を使って正確に求められる'
        },
        {
          timing: '45分後',
          question: '最大最小問題の解法手順を説明できるか？',
          criteria: '定義域の場合分けを含めて説明できる'
        }
      ]
    }
  }
  
  return session
}