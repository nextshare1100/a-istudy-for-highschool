import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  addDoc,
  updateDoc,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './config'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Gemini APIの初期化
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

// ========== 型定義 ==========

export interface DailyChallenge {
  id: string
  userId?: string // 追加：チャレンジの所有者
  date: string // YYYY-MM-DD format
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  problemIds: string[]
  expiresAt: Timestamp
  createdAt: Timestamp
  targetDeviation?: number
  gradeLevel?: number
  units?: string[] // 出題単元
  timeSlot?: 'morning' | 'evening' // 追加：朝/夜の区別
}

export interface DailyChallengeStatus {
  userId: string
  challengeId: string
  completed: boolean
  completedAt?: Timestamp
  score?: number
  totalQuestions?: number
  timeSpent?: number
  estimatedDeviation?: number
  correctAnswers?: number // 追加：正解数
  problemResults?: ProblemResult[] // 追加：各問題の詳細結果
}

// 各問題の結果を記録する型
export interface ProblemResult {
  problemId: string
  isCorrect: boolean
  timeSpent: number // 秒単位
  difficulty: 'easy' | 'medium' | 'hard'
  selectedAnswer: number
  correctAnswer: number
}

export interface UserAcademicProfile {
  estimatedDeviation: number // 推定偏差値（デフォルト50）
  gradeLevel: number // 学年（1, 2, 3）
  subjectDeviations?: { [subject: string]: number } // 科目別偏差値
  unitMastery?: { [unit: string]: number } // 単元別習熟度
  challengeHistory?: {
    date: string
    score: number
    totalQuestions: number
    estimatedDeviation: number
    subject?: string
    difficulty?: string
  }[]
  lastUpdated: Timestamp
}

export interface Problem {
  id?: string
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  gradeLevel: number
  unit: string // 単元名
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  targetDeviation?: number
  generatedBy?: string // 'gemini-1.5-flash' or 'backup'
  createdBy?: string // 問題の作成者（userId）
}

// 追加：ユーザーのスケジュール設定
export interface UserScheduleSettings {
  morningTime: string    // "07:00"
  eveningTime: string    // "20:00"
  enableMorning: boolean
  enableEvening: boolean
  notificationsEnabled: boolean
}

// Gemini生成問題の型
interface GeneratedProblem {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  unit?: string
}

// ========== カリキュラム定義 ==========

const CURRICULUM_BY_GRADE = {
  // 高校1年生の履修単元
  1: {
    '数学I': {
      units: [
        '数と式（展開・因数分解）',
        '数と式（実数・絶対値）',
        '2次関数（グラフ・最大最小）',
        '2次関数（2次方程式・2次不等式）',
        '図形と計量（三角比）',
        '図形と計量（正弦定理・余弦定理）',
        'データの分析'
      ],
      schedule: {
        4: ['数と式（展開・因数分解）'],
        5: ['数と式（実数・絶対値）'],
        6: ['2次関数（グラフ・最大最小）'],
        7: ['2次関数（グラフ・最大最小）'],
        9: ['2次関数（2次方程式・2次不等式）'],
        10: ['図形と計量（三角比）'],
        11: ['図形と計量（正弦定理・余弦定理）'],
        12: ['データの分析'],
        1: ['データの分析'],
        2: ['復習'],
        3: ['復習']
      }
    },
    '数学A': {
      units: [
        '場合の数（順列・組合せ）',
        '確率（基本）',
        '図形の性質（三角形）',
        '図形の性質（円）',
        '整数の性質（約数・倍数）',
        '整数の性質（ユークリッドの互除法）'
      ],
      schedule: {
        4: ['場合の数（順列・組合せ）'],
        5: ['場合の数（順列・組合せ）'],
        6: ['確率（基本）'],
        7: ['確率（基本）'],
        9: ['図形の性質（三角形）'],
        10: ['図形の性質（円）'],
        11: ['整数の性質（約数・倍数）'],
        12: ['整数の性質（ユークリッドの互除法）'],
        1: ['復習'],
        2: ['復習'],
        3: ['復習']
      }
    },
    '英語（リーディング）': {
      units: [
        '基本5文型',
        '時制（現在・過去・未来）',
        '時制（完了形）',
        '助動詞',
        '受動態',
        '不定詞',
        '動名詞',
        '分詞',
        '関係詞（基礎）',
        '仮定法（基礎）'
      ],
      schedule: {
        4: ['基本5文型', '時制（現在・過去・未来）'],
        5: ['時制（完了形）'],
        6: ['助動詞'],
        7: ['受動態'],
        9: ['不定詞'],
        10: ['動名詞'],
        11: ['分詞'],
        12: ['関係詞（基礎）'],
        1: ['仮定法（基礎）'],
        2: ['総合演習'],
        3: ['総合演習']
      }
    },
    '物理基礎': {
      units: [
        '運動の表し方',
        '力と運動の法則',
        '仕事とエネルギー',
        '熱',
        '波動',
        '電気'
      ],
      schedule: {
        4: ['運動の表し方'],
        5: ['運動の表し方'],
        6: ['力と運動の法則'],
        7: ['力と運動の法則'],
        9: ['仕事とエネルギー'],
        10: ['仕事とエネルギー'],
        11: ['熱'],
        12: ['波動'],
        1: ['電気'],
        2: ['電気'],
        3: ['復習']
      }
    },
    '化学基礎': {
      units: [
        '物質の構成',
        '物質の変化（化学反応式）',
        '物質の変化（酸・塩基）',
        '物質の変化（酸化還元）'
      ],
      schedule: {
        4: ['物質の構成'],
        5: ['物質の構成'],
        6: ['物質の構成'],
        7: ['物質の変化（化学反応式）'],
        9: ['物質の変化（化学反応式）'],
        10: ['物質の変化（酸・塩基）'],
        11: ['物質の変化（酸・塩基）'],
        12: ['物質の変化（酸化還元）'],
        1: ['物質の変化（酸化還元）'],
        2: ['復習'],
        3: ['復習']
      }
    }
  },
  
  // 高校2年生の履修単元
  2: {
    '数学II': {
      units: [
        '式と証明',
        '複素数と方程式',
        '図形と方程式（点と直線）',
        '図形と方程式（円）',
        '三角関数',
        '指数関数・対数関数',
        '微分法',
        '積分法'
      ],
      schedule: {
        4: ['式と証明'],
        5: ['複素数と方程式'],
        6: ['図形と方程式（点と直線）'],
        7: ['図形と方程式（円）'],
        9: ['三角関数'],
        10: ['三角関数'],
        11: ['指数関数・対数関数'],
        12: ['微分法'],
        1: ['微分法', '積分法'],
        2: ['積分法'],
        3: ['復習']
      }
    },
    '数学B': {
      units: [
        '数列（等差・等比）',
        '数列（漸化式）',
        '統計的な推測'
      ],
      schedule: {
        4: ['数列（等差・等比）'],
        5: ['数列（等差・等比）'],
        6: ['数列（漸化式）'],
        7: ['数列（漸化式）'],
        9: ['統計的な推測'],
        10: ['統計的な推測'],
        11: ['統計的な推測'],
        12: ['総合演習'],
        1: ['総合演習'],
        2: ['総合演習'],
        3: ['復習']
      }
    },
    '英語（リーディング）': {
      units: [
        '関係詞（応用）',
        '仮定法（応用）',
        '話法',
        '時制の一致',
        '比較',
        '否定',
        '強調・倒置・省略',
        '分詞構文',
        '複雑な構文'
      ],
      schedule: {
        4: ['関係詞（応用）'],
        5: ['仮定法（応用）'],
        6: ['話法'],
        7: ['時制の一致'],
        9: ['比較'],
        10: ['否定'],
        11: ['強調・倒置・省略'],
        12: ['分詞構文'],
        1: ['複雑な構文'],
        2: ['総合演習'],
        3: ['総合演習']
      }
    },
    '物理': {
      units: [
        '力学（運動方程式）',
        '力学（エネルギー保存）',
        '力学（運動量保存）',
        '熱力学',
        '波動（音波・光波）',
        '電磁気（電場・電流）'
      ],
      schedule: {
        4: ['力学（運動方程式）'],
        5: ['力学（運動方程式）'],
        6: ['力学（エネルギー保存）'],
        7: ['力学（運動量保存）'],
        9: ['熱力学'],
        10: ['熱力学'],
        11: ['波動（音波・光波）'],
        12: ['波動（音波・光波）'],
        1: ['電磁気（電場・電流）'],
        2: ['電磁気（電場・電流）'],
        3: ['復習']
      }
    },
    '化学': {
      units: [
        '理論化学（物質の状態）',
        '理論化学（化学反応）',
        '理論化学（化学平衡）',
        '無機化学',
        '有機化学（基礎）'
      ],
      schedule: {
        4: ['理論化学（物質の状態）'],
        5: ['理論化学（物質の状態）'],
        6: ['理論化学（化学反応）'],
        7: ['理論化学（化学反応）'],
        9: ['理論化学（化学平衡）'],
        10: ['理論化学（化学平衡）'],
        11: ['無機化学'],
        12: ['無機化学'],
        1: ['有機化学（基礎）'],
        2: ['有機化学（基礎）'],
        3: ['復習']
      }
    },
    // 1年生の内容も含む（復習として）
    '数学I': {
      units: [
        '数と式（展開・因数分解）',
        '数と式（実数・絶対値）',
        '2次関数（グラフ・最大最小）',
        '2次関数（2次方程式・2次不等式）',
        '図形と計量（三角比）',
        '図形と計量（正弦定理・余弦定理）',
        'データの分析'
      ],
      schedule: {} // 2年生では復習扱いなのでスケジュールは不要
    },
    '数学A': {
      units: [
        '場合の数（順列・組合せ）',
        '確率（基本）',
        '図形の性質（三角形）',
        '図形の性質（円）',
        '整数の性質（約数・倍数）',
        '整数の性質（ユークリッドの互除法）'
      ],
      schedule: {} // 2年生では復習扱いなのでスケジュールは不要
    }
  },
  
  // 高校3年生の履修単元
  3: {
    '数学C': {
      units: [
        'ベクトル（平面）',
        'ベクトル（空間）',
        '複素数平面',
        '式と曲線（2次曲線）',
        '式と曲線（媒介変数表示）',
        '式と曲線（極座標）'
      ],
      schedule: {
        4: ['ベクトル（平面）'],
        5: ['ベクトル（空間）'],
        6: ['複素数平面'],
        7: ['複素数平面'],
        9: ['式と曲線（2次曲線）'],
        10: ['式と曲線（媒介変数表示）'],
        11: ['式と曲線（極座標）'],
        12: ['総合演習'],
        1: ['総合演習'],
        2: ['総合演習'],
        3: ['総合演習']
      }
    },
    // 1・2年生の内容も含む（受験対策）
    '数学I': {
      units: [
        '数と式（展開・因数分解）',
        '数と式（実数・絶対値）',
        '2次関数（グラフ・最大最小）',
        '2次関数（2次方程式・2次不等式）',
        '図形と計量（三角比）',
        '図形と計量（正弦定理・余弦定理）',
        'データの分析'
      ],
      schedule: {} // 3年生では復習扱い
    },
    '数学A': {
      units: [
        '場合の数（順列・組合せ）',
        '確率（基本）',
        '図形の性質（三角形）',
        '図形の性質（円）',
        '整数の性質（約数・倍数）',
        '整数の性質（ユークリッドの互除法）'
      ],
      schedule: {} // 3年生では復習扱い
    },
    '数学II': {
      units: [
        '式と証明',
        '複素数と方程式',
        '図形と方程式（点と直線）',
        '図形と方程式（円）',
        '三角関数',
        '指数関数・対数関数',
        '微分法',
        '積分法'
      ],
      schedule: {} // 3年生では復習扱い
    },
    '数学B': {
      units: [
        '数列（等差・等比）',
        '数列（漸化式）',
        '統計的な推測'
      ],
      schedule: {} // 3年生では復習扱い
    },
    '英語（リーディング）': {
      units: [
        '基本5文型',
        '時制（現在・過去・未来）',
        '時制（完了形）',
        '助動詞',
        '受動態',
        '不定詞',
        '動名詞',
        '分詞',
        '関係詞（基礎）',
        '仮定法（基礎）',
        '関係詞（応用）',
        '仮定法（応用）',
        '話法',
        '時制の一致',
        '比較',
        '否定',
        '強調・倒置・省略',
        '分詞構文',
        '複雑な構文',
        '長文読解（評論）',
        '長文読解（小説）',
        '長文読解（論説）',
        '語彙（6000語レベル）',
        '語彙（8000語レベル）'
      ],
      schedule: {
        4: ['長文読解（評論）'],
        5: ['長文読解（小説）'],
        6: ['長文読解（論説）'],
        7: ['総合演習'],
        9: ['総合演習'],
        10: ['総合演習'],
        11: ['総合演習'],
        12: ['総合演習'],
        1: ['総合演習'],
        2: ['総合演習'],
        3: ['総合演習']
      }
    }
  }
}

// ========== 難易度配分 ==========

// 学年別・偏差値別の難易度配分
const GRADE_DIFFICULTY_DISTRIBUTION = {
  1: { // 1年生：基礎重視
    35: { easy: 0.9, medium: 0.1, hard: 0.0 },
    40: { easy: 0.8, medium: 0.2, hard: 0.0 },
    45: { easy: 0.7, medium: 0.3, hard: 0.0 },
    50: { easy: 0.5, medium: 0.4, hard: 0.1 },
    55: { easy: 0.4, medium: 0.45, hard: 0.15 },
    60: { easy: 0.3, medium: 0.5, hard: 0.2 },
    65: { easy: 0.2, medium: 0.5, hard: 0.3 },
    70: { easy: 0.1, medium: 0.5, hard: 0.4 },
    75: { easy: 0.05, medium: 0.45, hard: 0.5 }
  },
  2: { // 2年生：バランス型
    35: { easy: 0.8, medium: 0.2, hard: 0.0 },
    40: { easy: 0.7, medium: 0.3, hard: 0.0 },
    45: { easy: 0.6, medium: 0.35, hard: 0.05 },
    50: { easy: 0.4, medium: 0.4, hard: 0.2 },
    55: { easy: 0.3, medium: 0.45, hard: 0.25 },
    60: { easy: 0.2, medium: 0.5, hard: 0.3 },
    65: { easy: 0.1, medium: 0.5, hard: 0.4 },
    70: { easy: 0.05, medium: 0.45, hard: 0.5 },
    75: { easy: 0.0, medium: 0.4, hard: 0.6 }
  },
  3: { // 3年生：応用重視
    35: { easy: 0.7, medium: 0.3, hard: 0.0 },
    40: { easy: 0.6, medium: 0.35, hard: 0.05 },
    45: { easy: 0.5, medium: 0.4, hard: 0.1 },
    50: { easy: 0.3, medium: 0.45, hard: 0.25 },
    55: { easy: 0.2, medium: 0.5, hard: 0.3 },
    60: { easy: 0.1, medium: 0.5, hard: 0.4 },
    65: { easy: 0.05, medium: 0.45, hard: 0.5 },
    70: { easy: 0.0, medium: 0.4, hard: 0.6 },
    75: { easy: 0.0, medium: 0.3, hard: 0.7 }
  }
}

// 学年別の問題数設定
const GRADE_PROBLEM_COUNT = {
  1: { // 1年生：少なめ
    easy: 8,
    medium: 10,
    hard: 12
  },
  2: { // 2年生：標準
    easy: 10,
    medium: 12,
    hard: 14
  },
  3: { // 3年生：多め（受験対策）
    easy: 12,
    medium: 14,
    hard: 16
  }
}

// ========== Gemini問題生成 ==========

// 問題生成のプロンプトテンプレート
const getProblemPrompt = (
  subject: string,
  difficulty: 'easy' | 'medium' | 'hard',
  grade: number,
  count: number,
  units?: string[]
) => {
  const difficultyMap = {
    easy: '基礎レベル（教科書の例題レベル）',
    medium: '標準レベル（定期試験レベル）',
    hard: '応用レベル（共通テスト・難関大レベル）'
  }

  const gradeMap = {
    1: '高校1年生',
    2: '高校2年生',
    3: '高校3年生'
  }

  return `
あなたは日本の高校教師です。以下の条件で${subject}の4択問題を${count}問作成してください。

【条件】
- 対象: ${gradeMap[grade as keyof typeof gradeMap]}
- 科目: ${subject}
- 難易度: ${difficultyMap[difficulty]}
${units && units.length > 0 ? `- 単元: ${units.join(', ')}` : ''}
- 形式: 4択問題（選択肢は必ず4つ）
- 共通テストの出題形式に準拠

【出力形式】
以下のJSON形式で出力してください。他の文字は一切含めないでください。

[
  {
    "question": "問題文",
    "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
    "correctAnswer": 0,
    "explanation": "解説文（なぜその答えになるのか、他の選択肢がなぜ違うのかを説明）",
    "unit": "単元名"
  }
]

注意:
- correctAnswerは0から3の数字（配列のインデックス）
- 問題文は明確で理解しやすいものにする
- 選択肢は紛らわしいが、論理的に導ける内容にする
- 解説は丁寧で分かりやすく
- 必ず指定された数の問題を生成する
`
}

// 問題を生成する関数
async function generateProblems(
  subject: string,
  difficulty: 'easy' | 'medium' | 'hard',
  grade: number,
  count: number,
  units?: string[],
  userId?: string
): Promise<GeneratedProblem[]> {
  try {
    const prompt = getProblemPrompt(subject, difficulty, grade, count, units)
    
    console.log('Generating problems with Gemini...', { subject, difficulty, grade, count })
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // JSONを抽出（マークダウンのコードブロックを除去）
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    // JSONパース
    const problems = JSON.parse(jsonText) as GeneratedProblem[]
    
    // 難易度を設定
    problems.forEach(problem => {
      problem.difficulty = difficulty
    })
    
    console.log(`Generated ${problems.length} problems successfully`)
    
    return problems
  } catch (error) {
    console.error('Error generating problems:', error)
    throw new Error('問題の生成に失敗しました')
  }
}

// バックアップ用のサンプル問題
function getBackupProblems(
  subject: string,
  difficulty: 'easy' | 'medium' | 'hard',
  count: number
): GeneratedProblem[] {
  // Gemini APIが失敗した場合のバックアップ問題
  const backupProblems: Record<string, GeneratedProblem[]> = {
    '数学I': [
      {
        question: '次の式を展開せよ: (x + 2)(x - 3)',
        options: ['x² - x - 6', 'x² + x - 6', 'x² - x + 6', 'x² + x + 6'],
        correctAnswer: 0,
        explanation: '(x + 2)(x - 3) = x² - 3x + 2x - 6 = x² - x - 6',
        difficulty: 'easy',
        unit: '数と式（展開・因数分解）'
      },
      {
        question: '2次関数 y = x² - 4x + 3 の頂点の座標は？',
        options: ['(2, -1)', '(2, 1)', '(-2, -1)', '(-2, 1)'],
        correctAnswer: 0,
        explanation: '平方完成すると y = (x - 2)² - 1 となり、頂点は (2, -1)',
        difficulty: 'medium',
        unit: '2次関数（グラフ・最大最小）'
      }
    ],
    '英語（リーディング）': [
      {
        question: 'Choose the correct form: "I ___ to the library yesterday."',
        options: ['go', 'went', 'have gone', 'had gone'],
        correctAnswer: 1,
        explanation: '過去の一時点の動作を表すので過去形 "went" が正解',
        difficulty: 'easy',
        unit: '時制（現在・過去・未来）'
      }
    ],
    '物理基礎': [
      {
        question: '物体に働く力が0のとき、物体の運動はどうなるか？',
        options: [
          '必ず静止する',
          '等速直線運動を続ける',
          '加速し続ける',
          '静止または等速直線運動を続ける'
        ],
        correctAnswer: 3,
        explanation: '慣性の法則により、力が働かない物体は静止または等速直線運動を続ける',
        difficulty: 'easy',
        unit: '力と運動の法則'
      }
    ]
  }

  const subjectProblems = backupProblems[subject] || []
  return subjectProblems.slice(0, count)
}

// ========== ヘルパー関数 ==========

// 学年に応じた全教科を取得
function getAllSubjectsForGrade(grade: number): string[] {
  const gradeSubjects = {
    1: [
      '数学I', '数学A',
      '英語（リーディング）',
      '物理基礎', '化学基礎',
      '現代文', '古文', '漢文',
      '世界史A', '世界史B', '日本史A', '日本史B', '地理A', '地理B',
      '現代社会', '倫理', '政治・経済'
    ],
    2: [
      '数学I', '数学A', '数学II', '数学B',
      '英語（リーディング）',
      '物理', '化学', '生物', '地学',
      '物理基礎', '化学基礎', '生物基礎', '地学基礎',
      '現代文', '古文', '漢文',
      '世界史B', '日本史B', '地理B',
      '倫理', '政治・経済'
    ],
    3: [
      '数学I', '数学A', '数学II', '数学B', '数学III', '数学C',
      '英語（リーディング）', '英語（リスニング）',
      '物理', '化学', '生物', '地学',
      '現代文', '古文', '漢文',
      '世界史B', '日本史B', '地理B',
      '倫理', '政治・経済', '倫理、政治・経済'
    ]
  }
  
  return gradeSubjects[grade as keyof typeof gradeSubjects] || gradeSubjects[2]
}

// 現在の月から履修済み単元を取得
export function getAvailableUnits(grade: number, subject: string, currentMonth?: number): string[] {
  const curriculum = CURRICULUM_BY_GRADE[grade as keyof typeof CURRICULUM_BY_GRADE]
  if (!curriculum || !curriculum[subject]) {
    return []
  }
  
  const subjectData = curriculum[subject]
  const availableUnits: string[] = []
  
  // currentMonthが指定されていない場合は現在の月を使用
  const month = currentMonth || (new Date().getMonth() + 1)
  
  // 4月から現在の月までの単元を収集
  const monthsToCheck = []
  if (month >= 4) {
    // 4月〜現在月
    for (let m = 4; m <= month; m++) {
      monthsToCheck.push(m)
    }
  } else {
    // 前年度4月〜12月 + 今年度1月〜現在月
    for (let m = 4; m <= 12; m++) {
      monthsToCheck.push(m)
    }
    for (let m = 1; m <= month; m++) {
      monthsToCheck.push(m)
    }
  }
  
  // 復習期間（2-3月）の場合は全単元を対象
  if (month === 2 || month === 3) {
    return subjectData.units
  }
  
  // 各月の単元を追加
  monthsToCheck.forEach(month => {
    const monthUnits = subjectData.schedule[month as keyof typeof subjectData.schedule] || []
    monthUnits.forEach(unit => {
      if (!availableUnits.includes(unit) && unit !== '復習' && unit !== '総合演習') {
        availableUnits.push(unit)
      }
    })
  })
  
  return availableUnits
}

// 学年と偏差値に基づいて適切な難易度を選択
function selectDifficultyByGradeAndDeviation(grade: number, deviation: number): 'easy' | 'medium' | 'hard' {
  const gradeDistribution = GRADE_DIFFICULTY_DISTRIBUTION[grade as keyof typeof GRADE_DIFFICULTY_DISTRIBUTION] || GRADE_DIFFICULTY_DISTRIBUTION[2]
  
  const levels = Object.keys(gradeDistribution).map(Number).sort((a, b) => a - b)
  let targetLevel = 50
  
  for (const level of levels) {
    if (deviation <= level) {
      targetLevel = level
      break
    }
  }
  
  if (deviation > levels[levels.length - 1]) {
    targetLevel = levels[levels.length - 1]
  }
  
  const distribution = gradeDistribution[targetLevel as keyof typeof gradeDistribution]
  return weightedRandom(distribution) as 'easy' | 'medium' | 'hard'
}

// 正答率から偏差値を推定（学年・難易度・単元考慮）
function estimateDeviationFromScore(
  score: number, 
  totalQuestions: number, 
  currentDeviation: number,
  grade: number,
  difficulty: string
): number {
  const accuracy = score / totalQuestions
  
  // 難易度による基準値の調整
  const difficultyMultiplier = {
    easy: 0.85,   // 簡単な問題は85%以上で偏差値上昇
    medium: 0.7,  // 標準問題は70%以上で偏差値上昇
    hard: 0.55    // 難問は55%以上で偏差値上昇
  }[difficulty] || 0.7
  
  // 学年による調整（高学年ほど厳しい基準）
  const gradeMultiplier = 1 + (grade - 2) * 0.05 // 1年:0.95, 2年:1.0, 3年:1.05
  
  const adjustedThreshold = difficultyMultiplier * gradeMultiplier
  
  let adjustment = 0
  
  if (accuracy >= adjustedThreshold + 0.15) {
    adjustment = 3  // 基準を大幅に上回る
  } else if (accuracy >= adjustedThreshold + 0.05) {
    adjustment = 2  // 基準を上回る
  } else if (accuracy >= adjustedThreshold - 0.05) {
    adjustment = 1  // 基準付近
  } else if (accuracy >= adjustedThreshold - 0.15) {
    adjustment = 0  // やや下回る
  } else if (accuracy >= adjustedThreshold - 0.25) {
    adjustment = -1 // 下回る
  } else if (accuracy >= adjustedThreshold - 0.35) {
    adjustment = -2 // 大幅に下回る
  } else {
    adjustment = -3 // 著しく下回る
  }
  
  // 偏差値を調整（35〜75の範囲内）
  const newDeviation = Math.max(35, Math.min(75, currentDeviation + adjustment))
  
  console.log(`Score: ${score}/${totalQuestions} (${Math.round(accuracy*100)}%), Grade: ${grade}, Difficulty: ${difficulty}`)
  console.log(`Threshold: ${Math.round(adjustedThreshold*100)}%, Adjustment: ${adjustment}, Deviation: ${currentDeviation} → ${newDeviation}`)
  
  return newDeviation
}

// ========== 改善された偏差値推定関数 ==========

/**
 * 正答率と回答時間から偏差値を推定する（改善版）
 */
function estimateDeviationFromScoreAndTime(
  score: number,
  totalQuestions: number,
  currentDeviation: number,
  grade: number,
  problemResults: ProblemResult[]
): number {
  const accuracy = score / totalQuestions
  
  // 問題難易度別の基準時間（秒）
  const baseTimeByDifficulty = {
    easy: { optimal: 60, standard: 90, slow: 150 },
    medium: { optimal: 90, standard: 120, slow: 180 },
    hard: { optimal: 120, standard: 180, slow: 240 }
  }
  
  // 難易度による正答率の基準値
  const accuracyThreshold = {
    easy: 0.85,   // 簡単な問題は85%以上で偏差値上昇
    medium: 0.7,  // 標準問題は70%以上で偏差値上昇
    hard: 0.55    // 難問は55%以上で偏差値上昇
  }
  
  // 学年による調整（高学年ほど厳しい基準）
  const gradeMultiplier = 1 + (grade - 2) * 0.05 // 1年:0.95, 2年:1.0, 3年:1.05
  
  // 各問題の結果を分析
  let totalAdjustment = 0
  let weightSum = 0
  
  problemResults.forEach(result => {
    const baseTime = baseTimeByDifficulty[result.difficulty]
    const threshold = accuracyThreshold[result.difficulty] * gradeMultiplier
    
    // 正答・誤答による基本スコア
    let problemScore = 0
    if (result.isCorrect) {
      problemScore = 1
      
      // 時間ボーナス/ペナルティ
      if (result.timeSpent <= baseTime.optimal) {
        // 最適時間内：ボーナス
        problemScore += 0.3
      } else if (result.timeSpent <= baseTime.standard) {
        // 標準時間内：ボーナスなし
        problemScore += 0
      } else if (result.timeSpent <= baseTime.slow) {
        // 遅い：小ペナルティ
        problemScore -= 0.1
      } else {
        // 非常に遅い：大ペナルティ
        problemScore -= 0.2
      }
    } else {
      // 不正解
      if (result.timeSpent < baseTime.optimal * 0.5) {
        // 早すぎる不正解（適当に答えた可能性）
        problemScore = -0.5
      } else {
        // 通常の不正解
        problemScore = -0.3
      }
    }
    
    // 難易度による重み付け
    const difficultyWeight = {
      easy: 1.0,
      medium: 1.5,
      hard: 2.0
    }[result.difficulty]
    
    totalAdjustment += problemScore * difficultyWeight
    weightSum += difficultyWeight
  })
  
  // 平均調整値を計算
  const averageAdjustment = totalAdjustment / weightSum
  
  // 偏差値の調整幅を決定（-3 〜 +5の範囲）
  let deviationChange = 0
  if (averageAdjustment >= 0.8) {
    deviationChange = 5  // 非常に優秀
  } else if (averageAdjustment >= 0.6) {
    deviationChange = 3  // 優秀
  } else if (averageAdjustment >= 0.4) {
    deviationChange = 2  // 良好
  } else if (averageAdjustment >= 0.2) {
    deviationChange = 1  // やや良好
  } else if (averageAdjustment >= 0) {
    deviationChange = 0  // 標準
  } else if (averageAdjustment >= -0.2) {
    deviationChange = -1 // やや劣る
  } else if (averageAdjustment >= -0.4) {
    deviationChange = -2 // 劣る
  } else {
    deviationChange = -3 // 大幅に劣る
  }
  
  // 連続正解ボーナス
  let consecutiveCorrect = 0
  let maxConsecutive = 0
  problemResults.forEach(result => {
    if (result.isCorrect) {
      consecutiveCorrect++
      maxConsecutive = Math.max(maxConsecutive, consecutiveCorrect)
    } else {
      consecutiveCorrect = 0
    }
  })
  
  if (maxConsecutive >= 5) {
    deviationChange += 1 // 5問以上連続正解でボーナス
  }
  
  // 偏差値を調整（35〜75の範囲内）
  const newDeviation = Math.max(35, Math.min(75, currentDeviation + deviationChange))
  
  console.log(`Performance Analysis:`)
  console.log(`- Accuracy: ${Math.round(accuracy * 100)}%`)
  console.log(`- Average Adjustment: ${averageAdjustment.toFixed(2)}`)
  console.log(`- Deviation Change: ${deviationChange > 0 ? '+' : ''}${deviationChange}`)
  console.log(`- New Deviation: ${currentDeviation} → ${newDeviation}`)
  
  return newDeviation
}

// ========== プロファイル管理 ==========

// ユーザーの学力プロファイルを取得（なければ作成）
async function getUserAcademicProfileInternal(userId: string, grade: number): Promise<UserAcademicProfile> {
  try {
    const profileDoc = await getDoc(doc(db, 'users', userId, 'academicProfile', 'current'))
    
    if (profileDoc.exists()) {
      const profile = profileDoc.data() as UserAcademicProfile
      // 学年が更新されている場合は反映
      if (profile.gradeLevel !== grade) {
        profile.gradeLevel = grade
        await updateDoc(doc(db, 'users', userId, 'academicProfile', 'current'), {
          gradeLevel: grade,
          lastUpdated: Timestamp.now()
        })
      }
      return profile
    }
    
    // 新規ユーザーの場合、偏差値50から開始
    const defaultProfile: UserAcademicProfile = {
      estimatedDeviation: 50,
      gradeLevel: grade,
      subjectDeviations: {},
      unitMastery: {},
      challengeHistory: [],
      lastUpdated: Timestamp.now()
    }
    
    await setDoc(doc(db, 'users', userId, 'academicProfile', 'current'), defaultProfile)
    return defaultProfile
  } catch (error) {
    console.error('Error getting academic profile:', error)
    return {
      estimatedDeviation: 50,
      gradeLevel: grade,
      lastUpdated: Timestamp.now()
    }
  }
}

// 週間・月間チャレンジ用のエクスポート関数（学年を自動取得）
export async function getUserAcademicProfile(userId: string): Promise<UserAcademicProfile | null> {
  try {
    // ユーザープロファイルから学年を取得
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (!userDoc.exists()) {
      console.error('User profile not found')
      return null
    }

    const userData = userDoc.data()
    const userGrade = userData.grade === 'high1' ? 1 : 
                     userData.grade === 'high2' ? 2 : 
                     userData.grade === 'high3' ? 3 : 2

    return await getUserAcademicProfileInternal(userId, userGrade)
  } catch (error) {
    console.error('Error in getUserAcademicProfile:', error)
    return null
  }
}

// 偏差値更新関数（週間・月間チャレンジ用）
export async function updateEstimatedDeviation(
  userId: string,
  accuracy: number,
  difficulty: 'easy' | 'medium' | 'hard',
  isWeeklyOrMonthly: boolean = false
): Promise<void> {
  try {
    const profile = await getUserAcademicProfile(userId)
    if (!profile) return

    const currentDeviation = profile.estimatedDeviation
    const grade = profile.gradeLevel

    // 基本的な調整値を計算
    let adjustment = 0
    if (accuracy >= 0.8) {
      adjustment = difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1
    } else if (accuracy >= 0.6) {
      adjustment = difficulty === 'hard' ? 1 : 0
    } else if (accuracy < 0.4) {
      adjustment = difficulty === 'easy' ? -2 : -1
    }

    // 週間・月間チャレンジの場合は調整を緩やかに
    if (isWeeklyOrMonthly) {
      adjustment = Math.round(adjustment * 0.7)
    }

    const newDeviation = Math.max(35, Math.min(75, currentDeviation + adjustment))

    await updateDoc(doc(db, 'users', userId, 'academicProfile', 'current'), {
      estimatedDeviation: newDeviation,
      lastUpdated: Timestamp.now()
    })

    console.log(`Deviation updated: ${currentDeviation} → ${newDeviation} (accuracy: ${Math.round(accuracy*100)}%, ${difficulty})`)
  } catch (error) {
    console.error('Error updating estimated deviation:', error)
  }
}

// ========== スケジュール設定関数 ==========

// ユーザーのスケジュール設定を取得
export async function getUserScheduleSettings(userId: string): Promise<UserScheduleSettings | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (!userDoc.exists()) return null
    
    const data = userDoc.data()
    return data.scheduleSettings || {
      morningTime: '07:00',
      eveningTime: '20:00',
      enableMorning: true,
      enableEvening: true,
      notificationsEnabled: true
    }
  } catch (error) {
    console.error('Error getting user schedule settings:', error)
    return null
  }
}

// ユーザーのスケジュール設定を更新
export async function updateUserScheduleSettings(
  userId: string, 
  settings: UserScheduleSettings
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      scheduleSettings: settings,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating user schedule settings:', error)
    throw error
  }
}

// デイリーチャレンジの完了状態を取得
export async function getDailyChallengeStatus(
  userId: string, 
  challengeId: string
): Promise<DailyChallengeStatus | null> {
  try {
    const statusDoc = await getDoc(
      doc(db, 'users', userId, 'dailyChallengeStatus', challengeId)
    )
    
    if (statusDoc.exists()) {
      return statusDoc.data() as DailyChallengeStatus
    }
    
    return null
  } catch (error) {
    console.error('Error getting challenge status:', error)
    return null
  }
}

// ========== メイン関数 ==========

// デイリーチャレンジを取得（なければ生成）
export async function getDailyChallenge(userId: string, timeSlot?: 'morning' | 'evening'): Promise<DailyChallenge | null> {
  try {
    // ユーザープロファイルを取得
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (!userDoc.exists()) {
      console.error('User profile not found')
      return null
    }

    const userData = userDoc.data()
    
    // 学年を取得
    const userGrade = userData.grade === 'high1' ? 1 : 
                     userData.grade === 'high2' ? 2 : 
                     userData.grade === 'high3' ? 3 : 2
    
    // ユーザーの学力プロファイルを取得
    const academicProfile = await getUserAcademicProfileInternal(userId, userGrade)
    console.log('User academic profile:', academicProfile)
    
    // 科目の判定
    let userSubjects: string[] = []
    
    if (userData.subjects) {
      if (Array.isArray(userData.subjects)) {
        userSubjects = userData.subjects
      } else if (typeof userData.subjects === 'object') {
        userSubjects = Object.keys(userData.subjects)
      }
    }
    
    // 科目が設定されていない場合は、全教科から選択
    if (userSubjects.length === 0) {
      console.log(`No subjects selected, using all available subjects for grade ${userGrade}`)
      // 学年に応じた全教科を使用
      const allSubjects = getAllSubjectsForGrade(userGrade)
      userSubjects = allSubjects
    }

    // 今日の日付を取得（日本時間）
    const today = new Date()
    const jstOffset = 9 * 60
    const jstDate = new Date(today.getTime() + (jstOffset - today.getTimezoneOffset()) * 60000)
    const dateStr = jstDate.toISOString().split('T')[0]
    const currentMonth = jstDate.getMonth() + 1 // 1-12

    // 今日のチャレンジが既に存在するか確認（ユーザー固有のチャレンジを検索）
    const challengesRef = collection(db, 'dailyChallenges')
    let q = query(
      challengesRef, 
      where('date', '==', dateStr),
      where('userId', '==', userId) // ユーザーIDでフィルタ
    )
    
    // 時間帯が指定されている場合は、その時間帯のチャレンジを探す
    if (timeSlot) {
      q = query(
        challengesRef, 
        where('date', '==', dateStr),
        where('userId', '==', userId), // ユーザーIDでフィルタ
        where('timeSlot', '==', timeSlot)
      )
    }
    
    const snapshot = await getDocs(q)

    if (!snapshot.empty) {
      const challenge = snapshot.docs[0]
      return {
        id: challenge.id,
        ...challenge.data()
      } as DailyChallenge
    }

    // 新しいチャレンジを生成（userIdを渡す）
    const newChallenge = await generateCurriculumBasedDailyChallenge(
      userId, // userIdを渡す
      userSubjects, 
      dateStr,
      currentMonth,
      academicProfile.estimatedDeviation,
      userGrade,
      timeSlot
    )
    return newChallenge
  } catch (error) {
    console.error('Error getting daily challenge:', error)
    return null
  }
}

// カリキュラムベースのデイリーチャレンジ生成（Gemini統合版）
async function generateCurriculumBasedDailyChallenge(
  userId: string, // userIdパラメータを追加
  userSubjects: string[], 
  dateStr: string,
  currentMonth: number,
  userDeviation: number,
  grade: number,
  timeSlot?: 'morning' | 'evening'
): Promise<DailyChallenge | null> {
  try {
    // 利用可能な科目から1つをランダムに選択
    const selectedSubject = userSubjects[Math.floor(Math.random() * userSubjects.length)]
    
    // 学年と偏差値に基づいて難易度を選択
    const difficulty = selectDifficultyByGradeAndDeviation(grade, userDeviation)
    
    console.log(`Generating challenge: Grade ${grade}, Month ${currentMonth}, Subject ${selectedSubject}, Difficulty ${difficulty}, TimeSlot ${timeSlot || 'default'}`)
    
    // 学年別の問題数を取得
    const problemCount = GRADE_PROBLEM_COUNT[grade as keyof typeof GRADE_PROBLEM_COUNT][difficulty]

    // 現在の月に応じた単元を取得
    const availableUnits = getAvailableUnits(grade, selectedSubject, currentMonth)
    
    let problemIds: string[] = []
    let generatedProblems = []

    try {
      // Gemini APIで問題を生成
      generatedProblems = await generateProblems(
        selectedSubject,
        difficulty,
        grade,
        problemCount,
        availableUnits.length > 0 ? availableUnits.slice(0, 3) : undefined, // 最大3単元まで
        userId // userIdを渡す
      )
      
      // 生成された問題をFirestoreに保存
      for (const problem of generatedProblems) {
        const problemData = {
          subject: selectedSubject,
          difficulty: problem.difficulty,
          gradeLevel: grade,
          unit: problem.unit || '',
          question: problem.question,
          options: problem.options,
          correctAnswer: problem.correctAnswer,
          explanation: problem.explanation,
          targetDeviation: userDeviation,
          createdAt: Timestamp.now(),
          generatedBy: 'gemini-1.5-flash',
          createdBy: userId // 作成者IDを追加
        }
        
        const docRef = await addDoc(collection(db, 'problems'), problemData)
        problemIds.push(docRef.id)
      }
      
      console.log(`Successfully generated and saved ${problemIds.length} problems using Gemini`)
      
    } catch (geminiError) {
      console.error('Gemini API error, trying existing problems:', geminiError)
      
      // Gemini APIが失敗した場合は既存の問題を検索（自分が作成した問題のみ）
      const problemsRef = collection(db, 'problems')
      const q = query(
        problemsRef,
        where('subject', '==', selectedSubject),
        where('difficulty', '==', difficulty),
        where('createdBy', '==', userId), // 自分が作成した問題のみ
        limit(problemCount)
      )
      
      const snapshot = await getDocs(q)
      snapshot.forEach(doc => {
        problemIds.push(doc.id)
      })
      
      // それでも問題が見つからない場合はバックアップ問題を使用
      if (problemIds.length === 0) {
        console.log('Using backup problems...')
        const backupProblems = getBackupProblems(selectedSubject, difficulty, problemCount)
        
        for (const problem of backupProblems) {
          const problemData = {
            subject: selectedSubject,
            difficulty: problem.difficulty,
            gradeLevel: grade,
            unit: problem.unit || '',
            question: problem.question,
            options: problem.options,
            correctAnswer: problem.correctAnswer,
            explanation: problem.explanation,
            targetDeviation: userDeviation,
            createdAt: Timestamp.now(),
            generatedBy: 'backup',
            createdBy: userId // 作成者IDを追加
          }
          
          const docRef = await addDoc(collection(db, 'problems'), problemData)
          problemIds.push(docRef.id)
        }
      }
    }
    
    // 問題が全く生成できなかった場合
    if (problemIds.length === 0) {
      console.error('Failed to generate any problems')
      return null
    }

    // 有効期限を設定（翌日の午前3時まで）
    const tomorrow = new Date(dateStr)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(3, 0, 0, 0)
    
    // チャレンジデータを作成（userIdを追加）
    const challengeData: any = {
      userId: userId, // チャレンジの所有者を記録
      date: dateStr,
      subject: selectedSubject,
      difficulty,
      problemIds: problemIds,
      expiresAt: Timestamp.fromDate(tomorrow),
      createdAt: Timestamp.now(),
      targetDeviation: userDeviation,
      gradeLevel: grade,
      units: availableUnits.slice(0, 3) // 使用した単元
    }
    
    // timeSlotが指定されている場合のみ追加
    if (timeSlot) {
      challengeData.timeSlot = timeSlot
    }

    // Firestoreに保存
    const docRef = await addDoc(collection(db, 'dailyChallenges'), challengeData)
    
    console.log(`Challenge created: ${selectedSubject} - ${difficulty} (${problemIds.length} problems) - ${timeSlot || 'default'}`)
    
    return {
      id: docRef.id,
      ...challengeData
    }
  } catch (error) {
    console.error('Error generating curriculum-based challenge:', error)
    return null
  }
}

// ========== completeDailyChallenge関数（改善版のみ） ==========

export async function completeDailyChallenge(
  userId: string,
  challengeId: string,
  score: number,
  totalQuestions: number,
  timeSpent: number,
  problemResults?: ProblemResult[] // 追加：各問題の詳細結果
): Promise<void> {
  try {
    // チャレンジ情報を取得
    const challengeDoc = await getDoc(doc(db, 'dailyChallenges', challengeId))
    if (!challengeDoc.exists()) {
      throw new Error('Challenge not found')
    }
    
    const challengeData = challengeDoc.data()
    const difficulty = challengeData.difficulty
    const grade = challengeData.gradeLevel || 2
    const subject = challengeData.subject
    
    // 現在の学力プロファイルを取得
    const academicProfile = await getUserAcademicProfileInternal(userId, grade)
    
    // 正答率と時間から新しい偏差値を推定
    let newDeviation: number
    
    if (problemResults && problemResults.length > 0) {
      // 詳細な結果がある場合は、より精密な推定
      newDeviation = estimateDeviationFromScoreAndTime(
        score,
        totalQuestions,
        academicProfile.estimatedDeviation,
        grade,
        problemResults
      )
    } else {
      // 詳細な結果がない場合は、従来の方法で推定
      newDeviation = estimateDeviationFromScore(
        score,
        totalQuestions,
        academicProfile.estimatedDeviation,
        grade,
        difficulty
      )
    }
    
    // チャレンジの完了状態を保存
    const statusData: DailyChallengeStatus = {
      userId,
      challengeId,
      completed: true,
      completedAt: Timestamp.now(),
      score: score,
      totalQuestions: totalQuestions,
      timeSpent: timeSpent,
      estimatedDeviation: newDeviation,
      correctAnswers: score,
      problemResults: problemResults // 詳細結果も保存
    }

    await setDoc(
      doc(db, 'users', userId, 'dailyChallengeStatus', challengeId),
      statusData
    )

    // 学力プロファイルを更新
    const today = new Date().toISOString().split('T')[0]
    const updatedHistory = [
      ...(academicProfile.challengeHistory || []),
      {
        date: today,
        score: score,
        totalQuestions: totalQuestions,
        estimatedDeviation: newDeviation,
        subject,
        difficulty
      }
    ].slice(-90) // 直近90日分を保持

    // 科目別偏差値も更新
    const subjectDeviations = academicProfile.subjectDeviations || {}
    const currentSubjectDeviation = subjectDeviations[subject] || academicProfile.estimatedDeviation
    const newSubjectDeviation = Math.round((currentSubjectDeviation * 0.7 + newDeviation * 0.3)) // 加重平均
    subjectDeviations[subject] = newSubjectDeviation

    // 単元別の習熟度も更新（problemResultsがある場合）
    const unitMastery = academicProfile.unitMastery || {}
    if (problemResults) {
      // 単元別の正答率を計算して習熟度を更新
      // （実装は省略）
    }

    await updateDoc(doc(db, 'users', userId, 'academicProfile', 'current'), {
      estimatedDeviation: newDeviation,
      subjectDeviations,
      challengeHistory: updatedHistory,
      unitMastery,
      lastUpdated: Timestamp.now()
    })

    // ユーザーの統計情報も更新（XP付与）
    await updateUserStats(userId, score, newDeviation, grade, difficulty, subject, challengeId)
    
    console.log(`User deviation updated: ${academicProfile.estimatedDeviation} → ${newDeviation} (Grade ${grade}, ${subject})`)
  } catch (error) {
    console.error('Error completing daily challenge:', error)
    throw error
  }
}

// ユーザーの統計情報を更新
async function updateUserStats(
  userId: string, 
  score: number, 
  deviation: number, 
  grade: number,
  difficulty: string,
  subject: string,
  challengeId: string
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      const currentXP = userDoc.data().xp || userDoc.data().experience || 0
      
      // XP計算
      const baseXP = 50
      const deviationBonus = Math.max(0, Math.floor((deviation - 50) * 2))
      const scoreBonus = Math.floor(score * 5)
      const gradeBonus = grade * 10
      const difficultyBonus = {
        easy: 0,
        medium: 15,
        hard: 30
      }[difficulty] || 0
      
      const totalXP = baseXP + deviationBonus + scoreBonus + gradeBonus + difficultyBonus
      
      await updateDoc(userRef, {
        xp: currentXP + totalXP,
        lastCompletedChallenge: challengeId,
        lastCompletedAt: serverTimestamp(),
        estimatedDeviation: deviation
      })
      
      console.log(`XP granted for ${subject}: Base ${baseXP} + Deviation ${deviationBonus} + Score ${scoreBonus} + Grade ${gradeBonus} + Difficulty ${difficultyBonus} = ${totalXP}`)
    }
  } catch (error) {
    console.error('Error updating user stats:', error)
  }
}

// ========== ユーティリティ関数 ==========

// 重み付きランダム選択
function weightedRandom(weights: { [key: string]: number }): string {
  const entries = Object.entries(weights)
  const totalWeight = entries.reduce((sum, [_, weight]) => sum + weight, 0)
  let random = Math.random() * totalWeight
  
  for (const [key, weight] of entries) {
    random -= weight
    if (random <= 0) {
      return key
    }
  }
  
  return entries[entries.length - 1][0]
}

// 配列をシャッフル
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// ファイルの終了 - JSXコードは含まない