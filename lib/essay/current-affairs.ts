export interface CurrentAffair {
  id: string;
  title: string;
  category: 'politics' | 'economy' | 'society' | 'environment' | 'technology' | 'international';
  date: Date;
  summary: string;
  keywords: string[];
  essayPrompts: string[];
  relatedTopics: string[];
  sources: string[];
  importance: 1 | 2 | 3 | 4 | 5;
}

// 実際の実装では、これらはAPIから動的に取得される
export const CURRENT_AFFAIRS_2024: CurrentAffair[] = [
  {
    id: 'ca-2024-001',
    title: '生成AIの教育現場への導入',
    category: 'technology',
    date: new Date('2024-06-01'),
    summary: '文部科学省が生成AIの教育利用に関するガイドラインを発表。適切な活用方法と留意点が示された。',
    keywords: ['AI', '教育', 'ChatGPT', 'デジタル教育'],
    essayPrompts: [
      '生成AIは教育にどのような影響を与えるか、利点と課題を論じなさい。',
      '学習における「考える力」を育むために、生成AIをどう活用すべきか。',
    ],
    relatedTopics: ['デジタルリテラシー', '教育格差', '創造性教育'],
    sources: ['文部科学省', '日本経済新聞'],
    importance: 5,
  },
  
  {
    id: 'ca-2024-002',
    title: '異常気象と災害対策',
    category: 'environment',
    date: new Date('2024-07-15'),
    summary: '記録的な猛暑と豪雨が各地で発生。気候変動への適応策が急務となっている。',
    keywords: ['気候変動', '防災', '適応策', 'インフラ'],
    essayPrompts: [
      '気候変動に対する「緩和」と「適応」の両面から、日本が取るべき対策を論じなさい。',
      '個人レベルでできる気候変動対策と、その限界について考察しなさい。',
    ],
    relatedTopics: ['SDGs', 'カーボンニュートラル', '都市計画'],
    sources: ['気象庁', '環境省'],
    importance: 5,
  },
];

export async function fetchCurrentAffairs(
  category?: string,
  minImportance?: number
): Promise<CurrentAffair[]> {
  // 実際の実装では外部APIを呼び出す
  let affairs = [...CURRENT_AFFAIRS_2024];
  
  if (category) {
    affairs = affairs.filter(a => a.category === category);
  }
  
  if (minImportance) {
    affairs = affairs.filter(a => a.importance >= minImportance);
  }
  
  return affairs.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function getRelatedAffairs(affair: CurrentAffair): CurrentAffair[] {
  return CURRENT_AFFAIRS_2024.filter(a => 
    a.id !== affair.id &&
    (a.keywords.some(k => affair.keywords.includes(k)) ||
     a.relatedTopics.some(t => affair.relatedTopics.includes(t)))
  );
}