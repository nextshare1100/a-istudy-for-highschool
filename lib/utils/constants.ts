// lib/utils/constants.ts
export const SUBJECTS = {
  JAPANESE: {
    id: 'japanese',
    name: '国語',
    category: 'japanese',
    topics: ['現代文', '古文', '漢文'],
  },
  MATH: {
    id: 'math',
    name: '数学',
    category: 'math',
    topics: ['数学I', '数学A', '数学II', '数学B', '数学III', '数学C'],
  },
  ENGLISH: {
    id: 'english',
    name: '英語',
    category: 'english',
    topics: ['リーディング', 'リスニング', '文法', '英作文'],
  },
  SCIENCE: {
    PHYSICS: {
      id: 'physics',
      name: '物理',
      category: 'science',
      topics: ['力学', '熱力学', '波動', '電磁気学', '原子物理'],
    },
    CHEMISTRY: {
      id: 'chemistry',
      name: '化学',
      category: 'science',
      topics: ['理論化学', '無機化学', '有機化学'],
    },
    BIOLOGY: {
      id: 'biology',
      name: '生物',
      category: 'science',
      topics: ['細胞', '遺伝', '生態系', '進化', '生理学'],
    },
  },
  SOCIAL: {
    HISTORY_JP: {
      id: 'history_jp',
      name: '日本史',
      category: 'social',
      topics: ['古代', '中世', '近世', '近代', '現代'],
    },
    HISTORY_WORLD: {
      id: 'history_world',
      name: '世界史',
      category: 'social',
      topics: ['古代文明', '中世', '近代', '現代', '地域史'],
    },
    GEOGRAPHY: {
      id: 'geography',
      name: '地理',
      category: 'social',
      topics: ['自然地理', '人文地理', '地誌'],
    },
    CIVICS: {
      id: 'civics',
      name: '公民',
      category: 'social',
      topics: ['現代社会', '倫理', '政治・経済'],
    },
  },
} as const;

export const DIFFICULTY_LEVELS = {
  BASIC: { id: 'basic', name: '基礎', description: '基本的な概念理解' },
  STANDARD: { id: 'standard', name: '標準', description: '教科書レベル' },
  ADVANCED: { id: 'advanced', name: '応用', description: '入試標準レベル' },
  EXPERT: { id: 'expert', name: '発展', description: '難関大レベル' },
} as const;

export const PROBLEM_TYPES = {
  MULTIPLE_CHOICE: { id: 'multiple_choice', name: '選択式' },
  FILL_BLANK: { id: 'fill_blank', name: '穴埋め' },
  SHORT_ANSWER: { id: 'short_answer', name: '短答式' },
  ESSAY: { id: 'essay', name: '論述式' },
  FORMULA_FILL: { id: 'formula_fill', name: '公式穴埋め' },
  SEQUENCE_SORT: { id: 'sequence_sort', name: '解法並び替え' },
} as const;

export const TIMER_PRESETS = {
  POMODORO: {
    work: 25 * 60, // 25分（秒）
    break: 5 * 60, // 5分（秒）
    longBreak: 15 * 60, // 15分（秒）
  },
  STUDY_SESSIONS: [
    { name: '15分', seconds: 15 * 60 },
    { name: '30分', seconds: 30 * 60 },
    { name: '45分', seconds: 45 * 60 },
    { name: '60分', seconds: 60 * 60 },
    { name: '90分', seconds: 90 * 60 },
  ],
} as const;