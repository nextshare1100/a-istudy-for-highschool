// lib/gemini/constants.ts

// 科目定義
export const SUBJECTS = {
  MATH: { id: 'math', name: '数学', icon: '📐' },
  ENGLISH: { id: 'english', name: '英語', icon: '🔤' },
  SCIENCE: { id: 'science', name: '理科', icon: '🔬' },
  SOCIAL: { id: 'social', name: '社会', icon: '🌏' },
  JAPANESE: { id: 'japanese', name: '国語', icon: '📖' },
} as const;

// 単元マッピング
export const UNITS: Record<string, string[]> = {
  math: [
    '三角関数',
    'ベクトル',
    '微分',
    '積分',
    '確率',
    '数列',
    '複素数平面',
    '二次関数',
    '指数対数',
    '図形と方程式'
  ],
  english: [
    '基本単語',
    '頻出熟語',
    '文法（時制）',
    '文法（仮定法）',
    '文法（関係詞）',
    '文法（分詞）',
    '構文',
    '会話表現'
  ],
  science: [
    '力学',
    '電磁気',
    '波動',
    '熱力学',
    '原子',
    '化学反応',
    '有機化学',
    '無機化学',
    '細胞',
    '遺伝'
  ],
  social: [
    '古代史',
    '中世史',
    '近世史',
    '近代史',
    '現代史',
    '地理（自然）',
    '地理（人文）',
    '政治',
    '経済',
    '国際関係'
  ],
  japanese: [
    '現代文（評論）',
    '現代文（小説）',
    '古文（単語）',
    '古文（文法）',
    '漢文（句法）',
    '漢字',
    '慣用句',
    'ことわざ'
  ]
};

// セッションタイプ
export const SESSION_TYPES = {
  MORNING: {
    id: 'morning',
    name: '朝の学習',
    icon: '🌅',
    description: '通学前の復習に最適'
  },
  EVENING: {
    id: 'evening',
    name: '夜の学習',
    icon: '🌙',
    description: '就寝前の暗記に最適'
  },
  RANDOM: {
    id: 'random',
    name: '隙間時間',
    icon: '⏰',
    description: 'いつでも手軽に学習'
  }
} as const;

// 難易度レベル
export const DIFFICULTY_LEVELS = {
  EASY: { value: 1, label: '基礎', color: '#10b981' },
  NORMAL: { value: 2, label: '標準', color: '#3b82f6' },
  HARD: { value: 3, label: 'やや難', color: '#f59e0b' }
} as const;