// lib/schedule/unitPatterns.ts

export const UNIT_PATTERNS = {
  '英語-文法': {
    segments: {
      review: { percentage: 20, description: '前回の文法事項確認' },
      concept: { percentage: 30, description: '新規文法の理解' },
      practice: { percentage: 35, description: '演習問題' },
      application: { percentage: 15, description: '長文での応用' }
    },
    keyPoints: ['時制の一致', '仮定法', '関係詞'],
    techniques: ['例文暗記', 'パターン練習', '英作文']
  },
  
  '物理-力学': {
    segments: {
      review: { percentage: 15, description: '公式と法則の確認' },
      concept: { percentage: 35, description: '現象の理解' },
      calculation: { percentage: 40, description: '計算問題演習' },
      check: { percentage: 10, description: '理解度確認' }
    },
    keyPoints: ['運動方程式', 'エネルギー保存', '運動量保存'],
    techniques: ['図解', '次元解析', '極限思考']
  }
  // 他の単元も追加...
}
