import { University } from './index'

export const kantouUniversities: University[] = [
  // 東京都 - 国立
  {
    id: 'tokyo',
    name: '東京大学',
    type: '国立',
    prefecture: '東京都',
    faculties: [
      {
        id: 'tokyo-law',
        name: '法学部',
        departments: [
          { id: 'tokyo-law-1', name: '第1類（法学）', deviationValue: 75 },
          { id: 'tokyo-law-2', name: '第2類（政治学）', deviationValue: 75 },
          { id: 'tokyo-law-3', name: '第3類（基礎法学）', deviationValue: 75 }
        ]
      },
      {
        id: 'tokyo-med',
        name: '医学部',
        departments: [
          { id: 'tokyo-med-med', name: '医学科', deviationValue: 77 },
          { id: 'tokyo-med-health', name: '健康総合科学科', deviationValue: 70 }
        ]
      },
      {
        id: 'tokyo-eng',
        name: '工学部',
        departments: [
          { id: 'tokyo-eng-mech', name: '機械工学科', deviationValue: 72 },
          { id: 'tokyo-eng-elec', name: '電気電子工学科', deviationValue: 72 },
          { id: 'tokyo-eng-info', name: '計数工学科', deviationValue: 73 },
          { id: 'tokyo-eng-mat', name: '物理工学科', deviationValue: 72 },
          { id: 'tokyo-eng-aero', name: '航空宇宙工学科', deviationValue: 72 },
          { id: 'tokyo-eng-chem', name: '応用化学科', deviationValue: 71 },
          { id: 'tokyo-eng-civil', name: '社会基盤学科', deviationValue: 71 },
          { id: 'tokyo-eng-arch', name: '建築学科', deviationValue: 71 }
        ]
      },
      {
        id: 'tokyo-sci',
        name: '理学部',
        departments: [
          { id: 'tokyo-sci-math', name: '数学科', deviationValue: 72 },
          { id: 'tokyo-sci-phys', name: '物理学科', deviationValue: 72 },
          { id: 'tokyo-sci-astro', name: '天文学科', deviationValue: 71 },
          { id: 'tokyo-sci-earth', name: '地球惑星物理学科', deviationValue: 71 },
          { id: 'tokyo-sci-chem', name: '化学科', deviationValue: 72 },
          { id: 'tokyo-sci-bio', name: '生物学科', deviationValue: 71 },
          { id: 'tokyo-sci-info', name: '情報科学科', deviationValue: 73 }
        ]
      },
      {
        id: 'tokyo-agr',
        name: '農学部',
        departments: [
          { id: 'tokyo-agr-bio', name: '応用生命科学課程', deviationValue: 70 },
          { id: 'tokyo-agr-env', name: '環境資源科学課程', deviationValue: 69 },
          { id: 'tokyo-agr-vet', name: '獣医学課程', deviationValue: 73 }
        ]
      },
      {
        id: 'tokyo-pharm',
        name: '薬学部',
        departments: [
          { id: 'tokyo-pharm-sci', name: '薬科学科', deviationValue: 72 },
          { id: 'tokyo-pharm-pharm', name: '薬学科', deviationValue: 73 }
        ]
      },
      {
        id: 'tokyo-edu',
        name: '教育学部',
        departments: [
          { id: 'tokyo-edu-edu', name: '総合教育科学科', deviationValue: 70 }
        ]
      },
      {
        id: 'tokyo-lit',
        name: '文学部',
        departments: [
          { id: 'tokyo-lit-phil', name: '思想文化学科', deviationValue: 71 },
          { id: 'tokyo-lit-hist', name: '歴史文化学科', deviationValue: 71 },
          { id: 'tokyo-lit-lang', name: '言語文化学科', deviationValue: 71 },
          { id: 'tokyo-lit-behav', name: '行動文化学科', deviationValue: 71 }
        ]
      },
      {
        id: 'tokyo-econ',
        name: '経済学部',
        departments: [
          { id: 'tokyo-econ-econ', name: '経済学科', deviationValue: 72 },
          { id: 'tokyo-econ-mgmt', name: '経営学科', deviationValue: 72 },
          { id: 'tokyo-econ-fin', name: '金融学科', deviationValue: 72 }
        ]
      },
      {
        id: 'tokyo-arts',
        name: '教養学部',
        departments: [
          { id: 'tokyo-arts-sci', name: '教養学科', deviationValue: 71 },
          { id: 'tokyo-arts-arts', name: '学際科学科', deviationValue: 71 },
          { id: 'tokyo-arts-integ', name: '統合自然科学科', deviationValue: 71 }
        ]
      }
    ]
  },
  {
    id: 'tokyo-tech',
    name: '東京工業大学',
    type: '国立',
    prefecture: '東京都',
    faculties: [
      {
        id: 'titech-sci',
        name: '理学院',
        departments: [
          { id: 'titech-sci-math', name: '数学系', deviationValue: 68 },
          { id: 'titech-sci-phys', name: '物理学系', deviationValue: 68 },
          { id: 'titech-sci-chem', name: '化学系', deviationValue: 67 },
          { id: 'titech-sci-earth', name: '地球惑星科学系', deviationValue: 66 }
        ]
      },
      {
        id: 'titech-eng',
        name: '工学院',
        departments: [
          { id: 'titech-eng-mech', name: '機械系', deviationValue: 68 },
          { id: 'titech-eng-elec', name: '電気電子系', deviationValue: 68 },
          { id: 'titech-eng-info', name: '情報通信系', deviationValue: 69 },
          { id: 'titech-eng-mgmt', name: '経営工学系', deviationValue: 67 }
        ]
      },
      {
        id: 'titech-mat',
        name: '物質理工学院',
        departments: [
          { id: 'titech-mat-mat', name: '材料系', deviationValue: 67 },
          { id: 'titech-mat-chem', name: '応用化学系', deviationValue: 67 }
        ]
      },
      {
        id: 'titech-info',
        name: '情報理工学院',
        departments: [
          { id: 'titech-info-math', name: '数理・計算科学系', deviationValue: 69 },
          { id: 'titech-info-comp', name: '情報工学系', deviationValue: 70 }
        ]
      },
      {
        id: 'titech-life',
        name: '生命理工学院',
        departments: [
          { id: 'titech-life-bio', name: '生命理工学系', deviationValue: 67 }
        ]
      },
      {
        id: 'titech-env',
        name: '環境・社会理工学院',
        departments: [
          { id: 'titech-env-arch', name: '建築学系', deviationValue: 67 },
          { id: 'titech-env-civil', name: '土木・環境工学系', deviationValue: 66 },
          { id: 'titech-env-trans', name: '融合理工学系', deviationValue: 66 }
        ]
      }
    ]
  },
  {
    id: 'hitotsubashi',
    name: '一橋大学',
    type: '国立',
    prefecture: '東京都',
    faculties: [
      {
        id: 'hit-com',
        name: '商学部',
        departments: [
          { id: 'hit-com-mgmt', name: '経営学科', deviationValue: 70 },
          { id: 'hit-com-com', name: '商学科', deviationValue: 70 }
        ]
      },
      {
        id: 'hit-econ',
        name: '経済学部',
        departments: [
          { id: 'hit-econ-econ', name: '経済学科', deviationValue: 70 }
        ]
      },
      {
        id: 'hit-law',
        name: '法学部',
        departments: [
          { id: 'hit-law-law', name: '法律学科', deviationValue: 70 }
        ]
      },
      {
        id: 'hit-soc',
        name: '社会学部',
        departments: [
          { id: 'hit-soc-soc', name: '社会学科', deviationValue: 69 }
        ]
      }
    ]
  },
  {
    id: 'tokyo-med-dental',
    name: '東京医科歯科大学',
    type: '国立',
    prefecture: '東京都',
    faculties: [
      {
        id: 'tmd-med',
        name: '医学部',
        departments: [
          { id: 'tmd-med-med', name: '医学科', deviationValue: 74 },
          { id: 'tmd-med-health', name: '保健衛生学科', deviationValue: 61 }
        ]
      },
      {
        id: 'tmd-dent',
        name: '歯学部',
        departments: [
          { id: 'tmd-dent-dent', name: '歯学科', deviationValue: 67 },
          { id: 'tmd-dent-oral', name: '口腔保健学科', deviationValue: 56 }
        ]
      }
    ]
  },
  {
    id: 'tokyo-univ-arts',
    name: '東京芸術大学',
    type: '国立',
    prefecture: '東京都',
    faculties: [
      {
        id: 'geidai-art',
        name: '美術学部',
        departments: [
          { id: 'geidai-art-paint', name: '絵画科', deviationValue: 65 },
          { id: 'geidai-art-sculp', name: '彫刻科', deviationValue: 60 },
          { id: 'geidai-art-craft', name: '工芸科', deviationValue: 60 },
          { id: 'geidai-art-design', name: 'デザイン科', deviationValue: 65 },
          { id: 'geidai-art-arch', name: '建築科', deviationValue: 63 },
          { id: 'geidai-art-theory', name: '芸術学科', deviationValue: 62 }
        ]
      },
      {
        id: 'geidai-music',
        name: '音楽学部',
        departments: [
          { id: 'geidai-music-comp', name: '作曲科', deviationValue: 62 },
          { id: 'geidai-music-vocal', name: '声楽科', deviationValue: 61 },
          { id: 'geidai-music-inst', name: '器楽科', deviationValue: 63 },
          { id: 'geidai-music-conduct', name: '指揮科', deviationValue: 64 },
          { id: 'geidai-music-theory', name: '楽理科', deviationValue: 61 }
        ]
      }
    ]
  },
  
  // 東京都 - 私立
  {
    id: 'waseda',
    name: '早稲田大学',
    type: '私立',
    prefecture: '東京都',
    faculties: [
      {
        id: 'waseda-pol',
        name: '政治経済学部',
        departments: [
          { id: 'waseda-pol-pol', name: '政治学科', deviationValue: 71 },
          { id: 'waseda-pol-econ', name: '経済学科', deviationValue: 71 },
          { id: 'waseda-pol-int', name: '国際政治経済学科', deviationValue: 72 }
        ]
      },
      {
        id: 'waseda-law',
        name: '法学部',
        departments: [
          { id: 'waseda-law-law', name: '法学科', deviationValue: 70 }
        ]
      },
      {
        id: 'waseda-lit',
        name: '文学部',
        departments: [
          { id: 'waseda-lit-lit', name: '文学科', deviationValue: 68 }
        ]
      },
      {
        id: 'waseda-edu',
        name: '教育学部',
        departments: [
          { id: 'waseda-edu-edu', name: '教育学科', deviationValue: 66 },
          { id: 'waseda-edu-jpn', name: '国語国文学科', deviationValue: 67 },
          { id: 'waseda-edu-eng', name: '英語英文学科', deviationValue: 68 },
          { id: 'waseda-edu-soc', name: '社会科', deviationValue: 67 },
          { id: 'waseda-edu-math', name: '数学科', deviationValue: 65 },
          { id: 'waseda-edu-sci', name: '理学科', deviationValue: 64 }
        ]
      },
      {
        id: 'waseda-com',
        name: '商学部',
        departments: [
          { id: 'waseda-com-com', name: '商学科', deviationValue: 69 }
        ]
      },
      {
        id: 'waseda-sci',
        name: '理工学部',
        departments: [
          { id: 'waseda-sci-math', name: '数学科', deviationValue: 66 },
          { id: 'waseda-sci-phys', name: '応用物理学科', deviationValue: 66 },
          { id: 'waseda-sci-chem', name: '化学・生命化学科', deviationValue: 66 },
          { id: 'waseda-sci-life', name: '生命医科学科', deviationValue: 67 },
          { id: 'waseda-sci-elec', name: '電気・情報生命工学科', deviationValue: 67 },
          { id: 'waseda-sci-info', name: '情報工学科', deviationValue: 68 },
          { id: 'waseda-sci-mech', name: '機械工学科', deviationValue: 67 },
          { id: 'waseda-sci-civil', name: '土木工学科', deviationValue: 65 },
          { id: 'waseda-sci-arch', name: '建築学科', deviationValue: 68 }
        ]
      },
      {
        id: 'waseda-soc',
        name: '社会科学部',
        departments: [
          { id: 'waseda-soc-soc', name: '社会科学科', deviationValue: 68 }
        ]
      },
      {
        id: 'waseda-hum',
        name: '人間科学部',
        departments: [
          { id: 'waseda-hum-hum', name: '人間環境科学科', deviationValue: 66 },
          { id: 'waseda-hum-health', name: '健康福祉科学科', deviationValue: 65 },
          { id: 'waseda-hum-info', name: '人間情報科学科', deviationValue: 66 }
        ]
      },
      {
        id: 'waseda-sport',
        name: 'スポーツ科学部',
        departments: [
          { id: 'waseda-sport-sport', name: 'スポーツ科学科', deviationValue: 64 }
        ]
      },
      {
        id: 'waseda-int',
        name: '国際教養学部',
        departments: [
          { id: 'waseda-int-int', name: '国際教養学科', deviationValue: 71 }
        ]
      }
    ]
  },
  {
    id: 'keio',
    name: '慶應義塾大学',
    type: '私立',
    prefecture: '東京都',
    faculties: [
      {
        id: 'keio-lit',
        name: '文学部',
        departments: [
          { id: 'keio-lit-hum', name: '人文社会学科', deviationValue: 68 }
        ]
      },
      {
        id: 'keio-econ',
        name: '経済学部',
        departments: [
          { id: 'keio-econ-econ', name: '経済学科', deviationValue: 70 }
        ]
      },
      {
        id: 'keio-law',
        name: '法学部',
        departments: [
          { id: 'keio-law-law', name: '法律学科', deviationValue: 71 },
          { id: 'keio-law-pol', name: '政治学科', deviationValue: 71 }
        ]
      },
      {
        id: 'keio-com',
        name: '商学部',
        departments: [
          { id: 'keio-com-com', name: '商学科', deviationValue: 69 }
        ]
      },
      {
        id: 'keio-med',
        name: '医学部',
        departments: [
          { id: 'keio-med-med', name: '医学科', deviationValue: 75 }
        ]
      },
      {
        id: 'keio-sci',
        name: '理工学部',
        departments: [
          { id: 'keio-sci-mech', name: '機械工学科', deviationValue: 66 },
          { id: 'keio-sci-elec', name: '電子工学科', deviationValue: 66 },
          { id: 'keio-sci-info', name: '情報工学科', deviationValue: 68 },
          { id: 'keio-sci-phys', name: '物理学科', deviationValue: 66 },
          { id: 'keio-sci-chem', name: '化学科', deviationValue: 66 },
          { id: 'keio-sci-math', name: '数理科学科', deviationValue: 66 },
          { id: 'keio-sci-life', name: '生命情報学科', deviationValue: 66 },
          { id: 'keio-sci-sys', name: 'システムデザイン工学科', deviationValue: 67 }
        ]
      },
      {
        id: 'keio-policy',
        name: '総合政策学部',
        departments: [
          { id: 'keio-policy-policy', name: '総合政策学科', deviationValue: 69 }
        ]
      },
      {
        id: 'keio-env',
        name: '環境情報学部',
        departments: [
          { id: 'keio-env-env', name: '環境情報学科', deviationValue: 69 }
        ]
      },
      {
        id: 'keio-nurs',
        name: '看護医療学部',
        departments: [
          { id: 'keio-nurs-nurs', name: '看護学科', deviationValue: 61 }
        ]
      },
      {
        id: 'keio-pharm',
        name: '薬学部',
        departments: [
          { id: 'keio-pharm-pharm', name: '薬学科', deviationValue: 65 },
          { id: 'keio-pharm-sci', name: '薬科学科', deviationValue: 64 }
        ]
      }
    ]
  },
  {
    id: 'sophia',
    name: '上智大学',
    type: '私立',
    prefecture: '東京都',
    faculties: [
      {
        id: 'sophia-theo',
        name: '神学部',
        departments: [
          { id: 'sophia-theo-theo', name: '神学科', deviationValue: 57 }
        ]
      },
      {
        id: 'sophia-lit',
        name: '文学部',
        departments: [
          { id: 'sophia-lit-phil', name: '哲学科', deviationValue: 62 },
          { id: 'sophia-lit-hist', name: '史学科', deviationValue: 65 },
          { id: 'sophia-lit-jpn', name: '国文学科', deviationValue: 64 },
          { id: 'sophia-lit-eng', name: '英文学科', deviationValue: 66 },
          { id: 'sophia-lit-ger', name: 'ドイツ文学科', deviationValue: 62 },
          { id: 'sophia-lit-fre', name: 'フランス文学科', deviationValue: 63 },
          { id: 'sophia-lit-jour', name: '新聞学科', deviationValue: 65 }
        ]
      },
      {
        id: 'sophia-hum',
        name: '総合人間科学部',
        departments: [
          { id: 'sophia-hum-edu', name: '教育学科', deviationValue: 64 },
          { id: 'sophia-hum-psy', name: '心理学科', deviationValue: 65 },
          { id: 'sophia-hum-soc', name: '社会学科', deviationValue: 64 },
          { id: 'sophia-hum-wel', name: '社会福祉学科', deviationValue: 61 },
          { id: 'sophia-hum-nurs', name: '看護学科', deviationValue: 59 }
        ]
      },
      {
        id: 'sophia-law',
        name: '法学部',
        departments: [
          { id: 'sophia-law-law', name: '法律学科', deviationValue: 66 },
          { id: 'sophia-law-int', name: '国際関係法学科', deviationValue: 65 },
          { id: 'sophia-law-earth', name: '地球環境法学科', deviationValue: 63 }
        ]
      },
      {
        id: 'sophia-econ',
        name: '経済学部',
        departments: [
          { id: 'sophia-econ-econ', name: '経済学科', deviationValue: 65 },
          { id: 'sophia-econ-mgmt', name: '経営学科', deviationValue: 66 }
        ]
      },
      {
        id: 'sophia-lang',
        name: '外国語学部',
        departments: [
          { id: 'sophia-lang-eng', name: '英語学科', deviationValue: 67 },
          { id: 'sophia-lang-ger', name: 'ドイツ語学科', deviationValue: 63 },
          { id: 'sophia-lang-fre', name: 'フランス語学科', deviationValue: 64 },
          { id: 'sophia-lang-spa', name: 'イスパニア語学科', deviationValue: 64 },
          { id: 'sophia-lang-rus', name: 'ロシア語学科', deviationValue: 62 },
          { id: 'sophia-lang-por', name: 'ポルトガル語学科', deviationValue: 62 }
        ]
      },
      {
        id: 'sophia-global',
        name: '総合グローバル学部',
        departments: [
          { id: 'sophia-global-global', name: '総合グローバル学科', deviationValue: 66 }
        ]
      },
      {
        id: 'sophia-sci',
        name: '理工学部',
        departments: [
          { id: 'sophia-sci-mat', name: '物質生命理工学科', deviationValue: 60 },
          { id: 'sophia-sci-func', name: '機能創造理工学科', deviationValue: 60 },
          { id: 'sophia-sci-info', name: '情報理工学科', deviationValue: 62 }
        ]
      },
      {
        id: 'sophia-intlib',
        name: '国際教養学部',
        departments: [
          { id: 'sophia-intlib-intlib', name: '国際教養学科', deviationValue: 69 }
        ]
      }
    ]
  },
  {
    id: 'icu',
    name: '国際基督教大学',
    type: '私立',
    prefecture: '東京都',
    faculties: [
      {
        id: 'icu-las',
        name: '教養学部',
        departments: [
          { id: 'icu-las-arts', name: 'アーツ・サイエンス学科', deviationValue: 68 }
        ]
      }
    ]
  },
  {
    id: 'meiji',
    name: '明治大学',
    type: '私立',
    prefecture: '東京都',
    faculties: [
      {
        id: 'meiji-law',
        name: '法学部',
        departments: [
          { id: 'meiji-law-law', name: '法律学科', deviationValue: 63 }
        ]
      },
      {
        id: 'meiji-com',
        name: '商学部',
        departments: [
          { id: 'meiji-com-com', name: '商学科', deviationValue: 64 }
        ]
      },
      {
        id: 'meiji-pol',
        name: '政治経済学部',
        departments: [
          { id: 'meiji-pol-pol', name: '政治学科', deviationValue: 63 },
          { id: 'meiji-pol-econ', name: '経済学科', deviationValue: 64 },
          { id: 'meiji-pol-local', name: '地域行政学科', deviationValue: 61 }
        ]
      },
      {
        id: 'meiji-lit',
        name: '文学部',
        departments: [
          { id: 'meiji-lit-lit', name: '文学科', deviationValue: 63 },
          { id: 'meiji-lit-hist', name: '史学地理学科', deviationValue: 63 },
          { id: 'meiji-lit-psy', name: '心理社会学科', deviationValue: 64 }
        ]
      },
      {
        id: 'meiji-sci',
        name: '理工学部',
        departments: [
          { id: 'meiji-sci-elec', name: '電気電子生命学科', deviationValue: 60 },
          { id: 'meiji-sci-mech', name: '機械工学科', deviationValue: 61 },
          { id: 'meiji-sci-info', name: '情報科学科', deviationValue: 62 },
          { id: 'meiji-sci-arch', name: '建築学科', deviationValue: 63 },
          { id: 'meiji-sci-chem', name: '応用化学科', deviationValue: 60 },
          { id: 'meiji-sci-math', name: '数学科', deviationValue: 60 },
          { id: 'meiji-sci-phys', name: '物理学科', deviationValue: 59 }
        ]
      },
      {
        id: 'meiji-agr',
        name: '農学部',
        departments: [
          { id: 'meiji-agr-agr', name: '農学科', deviationValue: 60 },
          { id: 'meiji-agr-agchem', name: '農芸化学科', deviationValue: 61 },
          { id: 'meiji-agr-life', name: '生命科学科', deviationValue: 61 },
          { id: 'meiji-agr-food', name: '食料環境政策学科', deviationValue: 61 }
        ]
      },
      {
        id: 'meiji-mgmt',
        name: '経営学部',
        departments: [
          { id: 'meiji-mgmt-mgmt', name: '経営学科', deviationValue: 64 },
          { id: 'meiji-mgmt-acc', name: '会計学科', deviationValue: 62 },
          { id: 'meiji-mgmt-pub', name: '公共経営学科', deviationValue: 61 }
        ]
      },
      {
        id: 'meiji-info',
        name: '情報コミュニケーション学部',
        departments: [
          { id: 'meiji-info-info', name: '情報コミュニケーション学科', deviationValue: 63 }
        ]
      },
      {
        id: 'meiji-int',
        name: '国際日本学部',
        departments: [
          { id: 'meiji-int-int', name: '国際日本学科', deviationValue: 64 }
        ]
      },
      {
        id: 'meiji-math',
        name: '総合数理学部',
        departments: [
          { id: 'meiji-math-phen', name: '現象数理学科', deviationValue: 60 },
          { id: 'meiji-math-fms', name: '先端メディアサイエンス学科', deviationValue: 61 },
          { id: 'meiji-math-net', name: 'ネットワークデザイン学科', deviationValue: 59 }
        ]
      }
    ]
  },
  {
    id: 'aoyama',
    name: '青山学院大学',
    type: '私立',
    prefecture: '東京都',
    faculties: [
      {
        id: 'aoyama-lit',
        name: '文学部',
        departments: [
          { id: 'aoyama-lit-eng', name: '英米文学科', deviationValue: 65 },
          { id: 'aoyama-lit-fre', name: 'フランス文学科', deviationValue: 62 },
          { id: 'aoyama-lit-jpn', name: '日本文学科', deviationValue: 63 },
          { id: 'aoyama-lit-hist', name: '史学科', deviationValue: 63 },
          { id: 'aoyama-lit-comp', name: '比較芸術学科', deviationValue: 62 }
        ]
      },
      {
        id: 'aoyama-edu',
        name: '教育人間科学部',
        departments: [
          { id: 'aoyama-edu-edu', name: '教育学科', deviationValue: 63 },
          { id: 'aoyama-edu-psy', name: '心理学科', deviationValue: 64 }
        ]
      },
      {
        id: 'aoyama-econ',
        name: '経済学部',
        departments: [
          { id: 'aoyama-econ-econ', name: '経済学科', deviationValue: 63 },
          { id: 'aoyama-econ-mod', name: '現代経済デザイン学科', deviationValue: 62 }
        ]
      },
      {
        id: 'aoyama-law',
        name: '法学部',
        departments: [
          { id: 'aoyama-law-law', name: '法学科', deviationValue: 63 },
          { id: 'aoyama-law-human', name: 'ヒューマンライツ学科', deviationValue: 61 }
        ]
      },
      {
        id: 'aoyama-mgmt',
        name: '経営学部',
        departments: [
          { id: 'aoyama-mgmt-mgmt', name: '経営学科', deviationValue: 64 },
          { id: 'aoyama-mgmt-mkt', name: 'マーケティング学科', deviationValue: 65 }
        ]
      },
      {
        id: 'aoyama-int',
        name: '国際政治経済学部',
        departments: [
          { id: 'aoyama-int-pol', name: '国際政治学科', deviationValue: 66 },
          { id: 'aoyama-int-econ', name: '国際経済学科', deviationValue: 64 },
          { id: 'aoyama-int-comm', name: '国際コミュニケーション学科', deviationValue: 66 }
        ]
      },
      {
        id: 'aoyama-soc',
        name: '総合文化政策学部',
        departments: [
          { id: 'aoyama-soc-cul', name: '総合文化政策学科', deviationValue: 65 }
        ]
      },
      {
        id: 'aoyama-sci',
        name: '理工学部',
        departments: [
          { id: 'aoyama-sci-phys', name: '物理科学科', deviationValue: 57 },
          { id: 'aoyama-sci-math', name: '数理サイエンス学科', deviationValue: 58 },
          { id: 'aoyama-sci-chem', name: '化学・生命科学科', deviationValue: 58 },
          { id: 'aoyama-sci-elec', name: '電気電子工学科', deviationValue: 58 },
          { id: 'aoyama-sci-mech', name: '機械創造工学科', deviationValue: 58 },
          { id: 'aoyama-sci-mgmt', name: '経営システム工学科', deviationValue: 58 },
          { id: 'aoyama-sci-info', name: '情報テクノロジー学科', deviationValue: 60 }
        ]
      },
      {
        id: 'aoyama-ssi',
        name: '社会情報学部',
        departments: [
          { id: 'aoyama-ssi-ssi', name: '社会情報学科', deviationValue: 61 }
        ]
      },
      {
        id: 'aoyama-glob',
        name: '地球社会共生学部',
        departments: [
          { id: 'aoyama-glob-glob', name: '地球社会共生学科', deviationValue: 62 }
        ]
      },
      {
        id: 'aoyama-comm',
        name: 'コミュニティ人間科学部',
        departments: [
          { id: 'aoyama-comm-comm', name: 'コミュニティ人間科学科', deviationValue: 60 }
        ]
      }
    ]
  },
  {
    id: 'rikkyo',
    name: '立教大学',
    type: '私立',
    prefecture: '東京都',
    faculties: [
      {
        id: 'rikkyo-lit',
        name: '文学部',
        departments: [
          { id: 'rikkyo-lit-chr', name: 'キリスト教学科', deviationValue: 58 },
          { id: 'rikkyo-lit-lit', name: '文学科', deviationValue: 63 },
          { id: 'rikkyo-lit-hist', name: '史学科', deviationValue: 63 },
          { id: 'rikkyo-lit-edu', name: '教育学科', deviationValue: 62 }
        ]
      },
      {
        id: 'rikkyo-int',
        name: '異文化コミュニケーション学部',
        departments: [
          { id: 'rikkyo-int-int', name: '異文化コミュニケーション学科', deviationValue: 66 }
        ]
      },
      {
        id: 'rikkyo-econ',
        name: '経済学部',
        departments: [
          { id: 'rikkyo-econ-econ', name: '経済学科', deviationValue: 62 },
          { id: 'rikkyo-econ-pol', name: '経済政策学科', deviationValue: 61 },
          { id: 'rikkyo-econ-acc', name: '会計ファイナンス学科', deviationValue: 61 }
        ]
      },
      {
        id: 'rikkyo-mgmt',
        name: '経営学部',
        departments: [
          { id: 'rikkyo-mgmt-mgmt', name: '経営学科', deviationValue: 64 },
          { id: 'rikkyo-mgmt-int', name: '国際経営学科', deviationValue: 65 }
        ]
      },
      {
        id: 'rikkyo-soc',
        name: '社会学部',
        departments: [
          { id: 'rikkyo-soc-soc', name: '社会学科', deviationValue: 64 },
          { id: 'rikkyo-soc-mod', name: '現代文化学科', deviationValue: 63 },
          { id: 'rikkyo-soc-media', name: 'メディア社会学科', deviationValue: 63 }
        ]
      },
      {
        id: 'rikkyo-law',
        name: '法学部',
        departments: [
          { id: 'rikkyo-law-law', name: '法学科', deviationValue: 62 },
          { id: 'rikkyo-law-int', name: '国際ビジネス法学科', deviationValue: 61 },
          { id: 'rikkyo-law-pol', name: '政治学科', deviationValue: 61 }
        ]
      },
      {
        id: 'rikkyo-tour',
        name: '観光学部',
        departments: [
          { id: 'rikkyo-tour-tour', name: '観光学科', deviationValue: 62 },
          { id: 'rikkyo-tour-comm', name: '交流文化学科', deviationValue: 62 }
        ]
      },
      {
        id: 'rikkyo-comm',
        name: 'コミュニティ福祉学部',
        departments: [
          { id: 'rikkyo-comm-comm', name: 'コミュニティ政策学科', deviationValue: 59 },
          { id: 'rikkyo-comm-wel', name: '福祉学科', deviationValue: 58 },
          { id: 'rikkyo-comm-sport', name: 'スポーツウエルネス学科', deviationValue: 59 }
        ]
      },
      {
        id: 'rikkyo-psyc',
        name: '現代心理学部',
        departments: [
          { id: 'rikkyo-psyc-psyc', name: '心理学科', deviationValue: 63 },
          { id: 'rikkyo-psyc-body', name: '映像身体学科', deviationValue: 61 }
        ]
      },
      {
        id: 'rikkyo-sci',
        name: '理学部',
        departments: [
          { id: 'rikkyo-sci-math', name: '数学科', deviationValue: 58 },
          { id: 'rikkyo-sci-phys', name: '物理学科', deviationValue: 58 },
          { id: 'rikkyo-sci-chem', name: '化学科', deviationValue: 58 },
          { id: 'rikkyo-sci-life', name: '生命理学科', deviationValue: 59 }
        ]
      },
      {
        id: 'rikkyo-spo',
        name: 'スポーツウエルネス学部',
        departments: [
          { id: 'rikkyo-spo-spo', name: 'スポーツウエルネス学科', deviationValue: 58 }
        ]
      },
      {
        id: 'rikkyo-gbl',
        name: 'グローバル・リベラルアーツ・プログラム',
        departments: [
          { id: 'rikkyo-gbl-gbl', name: 'グローバル・リベラルアーツ・プログラム', deviationValue: 64 }
        ]
      }
    ]
  },
  {
    id: 'chuo',
    name: '中央大学',
    type: '私立',
    prefecture: '東京都',
    faculties: [
      {
        id: 'chuo-law',
        name: '法学部',
        departments: [
          { id: 'chuo-law-law', name: '法律学科', deviationValue: 64 },
          { id: 'chuo-law-int', name: '国際企業関係法学科', deviationValue: 62 },
          { id: 'chuo-law-pol', name: '政治学科', deviationValue: 62 }
        ]
      },
      {
        id: 'chuo-econ',
        name: '経済学部',
        departments: [
          { id: 'chuo-econ-econ', name: '経済学科', deviationValue: 61 },
          { id: 'chuo-econ-info', name: '経済情報システム学科', deviationValue: 60 },
          { id: 'chuo-econ-int', name: '国際経済学科', deviationValue: 61 },
          { id: 'chuo-econ-pub', name: '公共・環境経済学科', deviationValue: 60 }
        ]
      },
      {
        id: 'chuo-com',
        name: '商学部',
        departments: [
          { id: 'chuo-com-mgmt', name: '経営学科', deviationValue: 61 },
          { id: 'chuo-com-acc', name: '会計学科', deviationValue: 60 },
          { id: 'chuo-com-mkt', name: '国際マーケティング学科', deviationValue: 61 },
          { id: 'chuo-com-fin', name: '金融学科', deviationValue: 60 }
        ]
      },
      {
        id: 'chuo-sci',
        name: '理工学部',
        departments: [
          { id: 'chuo-sci-math', name: '数学科', deviationValue: 57 },
          { id: 'chuo-sci-phys', name: '物理学科', deviationValue: 57 },
          { id: 'chuo-sci-civil', name: '都市環境学科', deviationValue: 57 },
          { id: 'chuo-sci-mech', name: '精密機械工学科', deviationValue: 58 },
          { id: 'chuo-sci-elec', name: '電気電子情報通信工学科', deviationValue: 58 },
          { id: 'chuo-sci-chem', name: '応用化学科', deviationValue: 57 },
          { id: 'chuo-sci-mgmt', name: 'ビジネスデータサイエンス学科', deviationValue: 59 },
          { id: 'chuo-sci-info', name: '情報工学科', deviationValue: 60 },
          { id: 'chuo-sci-bio', name: '生命科学科', deviationValue: 57 },
          { id: 'chuo-sci-human', name: '人間総合理工学科', deviationValue: 57 }
        ]
      },
      {
        id: 'chuo-lit',
        name: '文学部',
        departments: [
          { id: 'chuo-lit-jpn', name: '国文学専攻', deviationValue: 60 },
          { id: 'chuo-lit-eng', name: '英語文学文化専攻', deviationValue: 60 },
          { id: 'chuo-lit-ger', name: 'ドイツ語文学文化専攻', deviationValue: 58 },
          { id: 'chuo-lit-fre', name: 'フランス語文学文化専攻', deviationValue: 59 },
          { id: 'chuo-lit-chi', name: '中国言語文化専攻', deviationValue: 58 },
          { id: 'chuo-lit-hist', name: '日本史学専攻', deviationValue: 61 },
          { id: 'chuo-lit-world', name: '東洋史学専攻', deviationValue: 60 },
          { id: 'chuo-lit-west', name: '西洋史学専攻', deviationValue: 60 },
          { id: 'chuo-lit-phil', name: '哲学専攻', deviationValue: 59 },
          { id: 'chuo-lit-soc', name: '社会学専攻', deviationValue: 61 },
          { id: 'chuo-lit-info', name: '社会情報学専攻', deviationValue: 60 },
          { id: 'chuo-lit-edu', name: '教育学専攻', deviationValue: 60 },
          { id: 'chuo-lit-psy', name: '心理学専攻', deviationValue: 62 }
        ]
      },
      {
        id: 'chuo-policy',
        name: '総合政策学部',
        departments: [
          { id: 'chuo-policy-policy', name: '政策科学科', deviationValue: 60 },
          { id: 'chuo-policy-int', name: '国際政策文化学科', deviationValue: 60 }
        ]
      },
      {
        id: 'chuo-global',
        name: '国際経営学部',
        departments: [
          { id: 'chuo-global-global', name: '国際経営学科', deviationValue: 63 }
        ]
      },
      {
        id: 'chuo-info',
        name: '国際情報学部',
        departments: [
          { id: 'chuo-info-info', name: '国際情報学科', deviationValue: 62 }
        ]
      }
    ]
  },
  {
    id: 'hosei',
    name: '法政大学',
    type: '私立',
    prefecture: '東京都',
    faculties: [
      {
        id: 'hosei-law',
        name: '法学部',
        departments: [
          { id: 'hosei-law-law', name: '法律学科', deviationValue: 61 },
          { id: 'hosei-law-pol', name: '政治学科', deviationValue: 60 },
          { id: 'hosei-law-int', name: '国際政治学科', deviationValue: 61 }
        ]
      },
      {
        id: 'hosei-lit',
        name: '文学部',
        departments: [
          { id: 'hosei-lit-phil', name: '哲学科', deviationValue: 60 },
          { id: 'hosei-lit-jpn', name: '日本文学科', deviationValue: 61 },
          { id: 'hosei-lit-eng', name: '英文学科', deviationValue: 61 },
          { id: 'hosei-lit-hist', name: '史学科', deviationValue: 61 },
          { id: 'hosei-lit-geo', name: '地理学科', deviationValue: 59 },
          { id: 'hosei-lit-psy', name: '心理学科', deviationValue: 62 }
        ]
      },
      {
        id: 'hosei-econ',
        name: '経済学部',
        departments: [
          { id: 'hosei-econ-econ', name: '経済学科', deviationValue: 59 },
          { id: 'hosei-econ-int', name: '国際経済学科', deviationValue: 59 },
          { id: 'hosei-econ-mod', name: '現代ビジネス学科', deviationValue: 59 }
        ]
      },
      {
        id: 'hosei-soc',
        name: '社会学部',
        departments: [
          { id: 'hosei-soc-soc', name: '社会政策科学科', deviationValue: 59 },
          { id: 'hosei-soc-socio', name: '社会学科', deviationValue: 60 },
          { id: 'hosei-soc-media', name: 'メディア社会学科', deviationValue: 60 }
        ]
      },
      {
        id: 'hosei-mgmt',
        name: '経営学部',
        departments: [
          { id: 'hosei-mgmt-mgmt', name: '経営学科', deviationValue: 61 },
          { id: 'hosei-mgmt-strat', name: '経営戦略学科', deviationValue: 60 },
          { id: 'hosei-mgmt-mkt', name: '市場経営学科', deviationValue: 60 }
        ]
      },
      {
        id: 'hosei-int',
        name: '国際文化学部',
        departments: [
          { id: 'hosei-int-int', name: '国際文化学科', deviationValue: 63 }
        ]
      },
      {
        id: 'hosei-human',
        name: '人間環境学部',
        departments: [
          { id: 'hosei-human-human', name: '人間環境学科', deviationValue: 60 }
        ]
      },
      {
        id: 'hosei-career',
        name: 'キャリアデザイン学部',
        departments: [
          { id: 'hosei-career-career', name: 'キャリアデザイン学科', deviationValue: 60 }
        ]
      },
      {
        id: 'hosei-gis',
        name: 'グローバル教養学部',
        departments: [
          { id: 'hosei-gis-gis', name: 'グローバル教養学科', deviationValue: 64 }
        ]
      },
      {
        id: 'hosei-sport',
        name: 'スポーツ健康学部',
        departments: [
          { id: 'hosei-sport-sport', name: 'スポーツ健康学科', deviationValue: 58 }
        ]
      },
      {
        id: 'hosei-info',
        name: '情報科学部',
        departments: [
          { id: 'hosei-info-comp', name: 'コンピュータ科学科', deviationValue: 57 },
          { id: 'hosei-info-digi', name: 'ディジタルメディア学科', deviationValue: 57 }
        ]
      },
      {
        id: 'hosei-design',
        name: 'デザイン工学部',
        departments: [
          { id: 'hosei-design-arch', name: '建築学科', deviationValue: 59 },
          { id: 'hosei-design-civil', name: '都市環境デザイン工学科', deviationValue: 57 },
          { id: 'hosei-design-sys', name: 'システムデザイン学科', deviationValue: 58 }
        ]
      },
      {
       id: 'hosei-sci',
       name: '理工学部',
       departments: [
         { id: 'hosei-sci-mech', name: '機械工学科', deviationValue: 56 },
         { id: 'hosei-sci-elec', name: '電気電子工学科', deviationValue: 56 },
         { id: 'hosei-sci-chem', name: '応用化学科', deviationValue: 56 },
         { id: 'hosei-sci-info', name: '応用情報工学科', deviationValue: 57 },
         { id: 'hosei-sci-mgmt', name: '経営システム工学科', deviationValue: 56 },
         { id: 'hosei-sci-create', name: '創生科学科', deviationValue: 55 }
       ]
     },
     {
       id: 'hosei-life',
       name: '生命科学部',
       departments: [
         { id: 'hosei-life-bio', name: '生命機能学科', deviationValue: 57 },
         { id: 'hosei-life-env', name: '環境応用化学科', deviationValue: 56 },
         { id: 'hosei-life-plant', name: '応用植物科学科', deviationValue: 56 }
       ]
     }
   ]
 },
 {
   id: 'tokyo-univ-sci',
   name: '東京理科大学',
   type: '私立',
   prefecture: '東京都',
   faculties: [
     {
       id: 'tus-sci',
       name: '理学部第一部',
       departments: [
         { id: 'tus-sci-math', name: '数学科', deviationValue: 61 },
         { id: 'tus-sci-phys', name: '物理学科', deviationValue: 61 },
         { id: 'tus-sci-chem', name: '化学科', deviationValue: 61 },
         { id: 'tus-sci-app-math', name: '応用数学科', deviationValue: 60 },
         { id: 'tus-sci-app-phys', name: '応用物理学科', deviationValue: 61 },
         { id: 'tus-sci-app-chem', name: '応用化学科', deviationValue: 61 }
       ]
     },
     {
       id: 'tus-sci2',
       name: '理学部第二部',
       departments: [
         { id: 'tus-sci2-math', name: '数学科', deviationValue: 50 },
         { id: 'tus-sci2-phys', name: '物理学科', deviationValue: 50 },
         { id: 'tus-sci2-chem', name: '化学科', deviationValue: 50 }
       ]
     },
     {
       id: 'tus-eng',
       name: '工学部',
       departments: [
         { id: 'tus-eng-arch', name: '建築学科', deviationValue: 62 },
         { id: 'tus-eng-ind-chem', name: '工業化学科', deviationValue: 60 },
         { id: 'tus-eng-elec', name: '電気工学科', deviationValue: 60 },
         { id: 'tus-eng-info', name: '情報工学科', deviationValue: 62 },
         { id: 'tus-eng-mech', name: '機械工学科', deviationValue: 61 }
       ]
     },
     {
       id: 'tus-pharm',
       name: '薬学部',
       departments: [
         { id: 'tus-pharm-pharm', name: '薬学科', deviationValue: 63 },
         { id: 'tus-pharm-life', name: '生命創薬科学科', deviationValue: 61 }
       ]
     },
     {
       id: 'tus-adv-eng',
       name: '先進工学部',
       departments: [
         { id: 'tus-adv-elec', name: '電子システム工学科', deviationValue: 58 },
         { id: 'tus-adv-mat', name: 'マテリアル創成工学科', deviationValue: 57 },
         { id: 'tus-adv-bio', name: '生命システム工学科', deviationValue: 58 },
         { id: 'tus-adv-phys', name: '物理工学科', deviationValue: 57 },
         { id: 'tus-adv-func', name: '機能デザイン工学科', deviationValue: 57 }
       ]
     },
     {
       id: 'tus-mgmt',
       name: '経営学部',
       departments: [
         { id: 'tus-mgmt-mgmt', name: '経営学科', deviationValue: 59 },
         { id: 'tus-mgmt-bus', name: 'ビジネスエコノミクス学科', deviationValue: 58 },
         { id: 'tus-mgmt-int', name: '国際デザイン経営学科', deviationValue: 58 }
       ]
     }
   ]
 },
 {
   id: 'gakushuin',
   name: '学習院大学',
   type: '私立',
   prefecture: '東京都',
   faculties: [
     {
       id: 'gaku-law',
       name: '法学部',
       departments: [
         { id: 'gaku-law-law', name: '法学科', deviationValue: 60 },
         { id: 'gaku-law-pol', name: '政治学科', deviationValue: 59 }
       ]
     },
     {
       id: 'gaku-econ',
       name: '経済学部',
       departments: [
         { id: 'gaku-econ-econ', name: '経済学科', deviationValue: 60 },
         { id: 'gaku-econ-mgmt', name: '経営学科', deviationValue: 60 }
       ]
     },
     {
       id: 'gaku-lit',
       name: '文学部',
       departments: [
         { id: 'gaku-lit-phil', name: '哲学科', deviationValue: 58 },
         { id: 'gaku-lit-hist', name: '史学科', deviationValue: 59 },
         { id: 'gaku-lit-jpn', name: '日本語日本文学科', deviationValue: 59 },
         { id: 'gaku-lit-eng', name: '英語英米文化学科', deviationValue: 59 },
         { id: 'gaku-lit-ger', name: 'ドイツ語圏文化学科', deviationValue: 57 },
         { id: 'gaku-lit-fre', name: 'フランス語圏文化学科', deviationValue: 58 },
         { id: 'gaku-lit-psy', name: '心理学科', deviationValue: 60 },
         { id: 'gaku-lit-edu', name: '教育学科', deviationValue: 59 }
       ]
     },
     {
       id: 'gaku-sci',
       name: '理学部',
       departments: [
         { id: 'gaku-sci-phys', name: '物理学科', deviationValue: 56 },
         { id: 'gaku-sci-chem', name: '化学科', deviationValue: 56 },
         { id: 'gaku-sci-math', name: '数学科', deviationValue: 56 },
         { id: 'gaku-sci-life', name: '生命科学科', deviationValue: 57 }
       ]
     },
     {
       id: 'gaku-int',
       name: '国際社会科学部',
       departments: [
         { id: 'gaku-int-int', name: '国際社会科学科', deviationValue: 61 }
       ]
     }
   ]
 },
 {
   id: 'seikei',
   name: '成蹊大学',
   type: '私立',
   prefecture: '東京都',
   faculties: [
     {
       id: 'seikei-econ',
       name: '経済学部',
       departments: [
         { id: 'seikei-econ-mod', name: '現代経済学科', deviationValue: 58 },
         { id: 'seikei-econ-mgmt', name: '経営学科', deviationValue: 58 }
       ]
     },
     {
       id: 'seikei-law',
       name: '法学部',
       departments: [
         { id: 'seikei-law-law', name: '法律学科', deviationValue: 58 },
         { id: 'seikei-law-pol', name: '政治学科', deviationValue: 57 }
       ]
     },
     {
       id: 'seikei-lit',
       name: '文学部',
       departments: [
         { id: 'seikei-lit-eng', name: '英語英米文学科', deviationValue: 58 },
         { id: 'seikei-lit-jpn', name: '日本文学科', deviationValue: 57 },
         { id: 'seikei-lit-int', name: '国際文化学科', deviationValue: 58 },
         { id: 'seikei-lit-mod', name: '現代社会学科', deviationValue: 58 }
       ]
     },
     {
       id: 'seikei-sci',
       name: '理工学部',
       departments: [
         { id: 'seikei-sci-mat', name: '物質生命理工学科', deviationValue: 53 },
         { id: 'seikei-sci-info', name: '情報科学科', deviationValue: 55 },
         { id: 'seikei-sci-sys', name: 'システムデザイン学科', deviationValue: 54 }
       ]
     },
     {
       id: 'seikei-mgmt',
       name: '経営学部',
       departments: [
         { id: 'seikei-mgmt-strat', name: '総合経営学科', deviationValue: 58 }
       ]
     }
   ]
 },
 {
   id: 'seijo',
   name: '成城大学',
   type: '私立',
   prefecture: '東京都',
   faculties: [
     {
       id: 'seijo-econ',
       name: '経済学部',
       departments: [
         { id: 'seijo-econ-econ', name: '経済学科', deviationValue: 57 },
         { id: 'seijo-econ-mgmt', name: '経営学科', deviationValue: 57 }
       ]
     },
     {
       id: 'seijo-lit',
       name: '文芸学部',
       departments: [
         { id: 'seijo-lit-jpn', name: '国文学科', deviationValue: 57 },
         { id: 'seijo-lit-eng', name: '英文学科', deviationValue: 57 },
         { id: 'seijo-lit-art', name: '芸術学科', deviationValue: 56 },
         { id: 'seijo-lit-cul', name: '文化史学科', deviationValue: 57 },
         { id: 'seijo-lit-mass', name: 'マスコミュニケーション学科', deviationValue: 58 },
         { id: 'seijo-lit-eur', name: 'ヨーロッパ文化学科', deviationValue: 56 }
       ]
     },
     {
       id: 'seijo-law',
       name: '法学部',
       departments: [
         { id: 'seijo-law-law', name: '法律学科', deviationValue: 57 }
       ]
     },
     {
       id: 'seijo-soc',
       name: '社会イノベーション学部',
       departments: [
         { id: 'seijo-soc-pol', name: '政策イノベーション学科', deviationValue: 57 },
         { id: 'seijo-soc-psy', name: '心理社会学科', deviationValue: 58 }
       ]
     }
   ]
 },
 {
   id: 'musashi',
   name: '武蔵大学',
   type: '私立',
   prefecture: '東京都',
   faculties: [
     {
       id: 'musashi-econ',
       name: '経済学部',
       departments: [
         { id: 'musashi-econ-econ', name: '経済学科', deviationValue: 58 },
         { id: 'musashi-econ-mgmt', name: '経営学科', deviationValue: 58 },
         { id: 'musashi-econ-fin', name: '金融学科', deviationValue: 57 }
       ]
     },
     {
       id: 'musashi-hum',
       name: '人文学部',
       departments: [
         { id: 'musashi-hum-eng', name: '英語英米文化学科', deviationValue: 57 },
         { id: 'musashi-hum-eur', name: 'ヨーロッパ文化学科', deviationValue: 56 },
         { id: 'musashi-hum-jpn', name: '日本・東アジア文化学科', deviationValue: 57 }
       ]
     },
     {
       id: 'musashi-soc',
       name: '社会学部',
       departments: [
         { id: 'musashi-soc-soc', name: '社会学科', deviationValue: 58 },
         { id: 'musashi-soc-media', name: 'メディア社会学科', deviationValue: 58 }
       ]
     },
     {
       id: 'musashi-global',
       name: '国際教養学部',
       departments: [
         { id: 'musashi-global-econ', name: '国際教養学科', deviationValue: 59 }
       ]
     }
   ]
 },
 {
   id: 'nihon',
   name: '日本大学',
   type: '私立',
   prefecture: '東京都',
   faculties: [
     {
       id: 'nihon-law',
       name: '法学部',
       departments: [
         { id: 'nihon-law-law', name: '法律学科', deviationValue: 54 },
         { id: 'nihon-law-pol', name: '政治経済学科', deviationValue: 53 },
         { id: 'nihon-law-jour', name: '新聞学科', deviationValue: 53 },
         { id: 'nihon-law-mgmt', name: '経営法学科', deviationValue: 52 },
         { id: 'nihon-law-pub', name: '公共政策学科', deviationValue: 52 }
       ]
     },
     {
       id: 'nihon-lit',
       name: '文理学部',
       departments: [
         { id: 'nihon-lit-phil', name: '哲学科', deviationValue: 52 },
         { id: 'nihon-lit-hist', name: '史学科', deviationValue: 54 },
         { id: 'nihon-lit-jpn', name: '国文学科', deviationValue: 54 },
         { id: 'nihon-lit-chi', name: '中国語中国文化学科', deviationValue: 51 },
         { id: 'nihon-lit-eng', name: '英文学科', deviationValue: 53 },
         { id: 'nihon-lit-ger', name: 'ドイツ文学科', deviationValue: 51 },
         { id: 'nihon-lit-soc', name: '社会学科', deviationValue: 54 },
         { id: 'nihon-lit-wel', name: '社会福祉学科', deviationValue: 52 },
         { id: 'nihon-lit-edu', name: '教育学科', deviationValue: 53 },
         { id: 'nihon-lit-phy', name: '体育学科', deviationValue: 51 },
         { id: 'nihon-lit-psy', name: '心理学科', deviationValue: 55 },
         { id: 'nihon-lit-geo', name: '地理学科', deviationValue: 52 },
         { id: 'nihon-lit-earth', name: '地球科学科', deviationValue: 50 },
         { id: 'nihon-lit-math', name: '数学科', deviationValue: 50 },
         { id: 'nihon-lit-info', name: '情報科学科', deviationValue: 51 },
         { id: 'nihon-lit-phys', name: '物理学科', deviationValue: 50 },
         { id: 'nihon-lit-life', name: '生命科学科', deviationValue: 51 },
         { id: 'nihon-lit-chem', name: '化学科', deviationValue: 50 }
       ]
     },
     {
       id: 'nihon-econ',
       name: '経済学部',
       departments: [
         { id: 'nihon-econ-econ', name: '経済学科', deviationValue: 53 },
         { id: 'nihon-econ-ind', name: '産業経営学科', deviationValue: 52 },
         { id: 'nihon-econ-fin', name: '金融公共経済学科', deviationValue: 52 }
       ]
     },
     {
       id: 'nihon-com',
       name: '商学部',
       departments: [
         { id: 'nihon-com-com', name: '商業学科', deviationValue: 53 },
         { id: 'nihon-com-mgmt', name: '経営学科', deviationValue: 53 },
         { id: 'nihon-com-acc', name: '会計学科', deviationValue: 52 }
       ]
     },
     {
       id: 'nihon-art',
       name: '芸術学部',
       departments: [
         { id: 'nihon-art-photo', name: '写真学科', deviationValue: 50 },
         { id: 'nihon-art-film', name: '映画学科', deviationValue: 52 },
         { id: 'nihon-art-art', name: '美術学科', deviationValue: 50 },
         { id: 'nihon-art-music', name: '音楽学科', deviationValue: 49 },
         { id: 'nihon-art-lit', name: '文芸学科', deviationValue: 52 },
         { id: 'nihon-art-drama', name: '演劇学科', deviationValue: 51 },
         { id: 'nihon-art-broad', name: '放送学科', deviationValue: 52 },
         { id: 'nihon-art-design', name: 'デザイン学科', deviationValue: 51 }
       ]
     },
     {
       id: 'nihon-int',
       name: '国際関係学部',
       departments: [
         { id: 'nihon-int-int', name: '国際総合政策学科', deviationValue: 51 },
         { id: 'nihon-int-cul', name: '国際教養学科', deviationValue: 51 }
       ]
     },
     {
       id: 'nihon-risk',
       name: '危機管理学部',
       departments: [
         { id: 'nihon-risk-risk', name: '危機管理学科', deviationValue: 50 }
       ]
     },
     {
       id: 'nihon-sport',
       name: 'スポーツ科学部',
       departments: [
         { id: 'nihon-sport-sport', name: 'スポーツ科学科', deviationValue: 50 }
       ]
     },
     {
       id: 'nihon-sci',
       name: '理工学部',
       departments: [
         { id: 'nihon-sci-civil', name: '土木工学科', deviationValue: 48 },
         { id: 'nihon-sci-trans', name: '交通システム工学科', deviationValue: 47 },
         { id: 'nihon-sci-arch', name: '建築学科', deviationValue: 52 },
         { id: 'nihon-sci-ocean', name: '海洋建築工学科', deviationValue: 48 },
         { id: 'nihon-sci-town', name: 'まちづくり工学科', deviationValue: 48 },
         { id: 'nihon-sci-mech', name: '機械工学科', deviationValue: 49 },
         { id: 'nihon-sci-prec', name: '精密機械工学科', deviationValue: 48 },
         { id: 'nihon-sci-aero', name: '航空宇宙工学科', deviationValue: 50 },
         { id: 'nihon-sci-elec', name: '電気工学科', deviationValue: 48 },
         { id: 'nihon-sci-elec2', name: '電子工学科', deviationValue: 48 },
         { id: 'nihon-sci-info', name: '応用情報工学科', deviationValue: 51 },
         { id: 'nihon-sci-mat', name: '物質応用化学科', deviationValue: 48 },
         { id: 'nihon-sci-phys', name: '物理学科', deviationValue: 48 },
         { id: 'nihon-sci-math', name: '数学科', deviationValue: 49 }
       ]
     },
     {
       id: 'nihon-prod',
       name: '生産工学部',
       departments: [
         { id: 'nihon-prod-mech', name: '機械工学科', deviationValue: 45 },
         { id: 'nihon-prod-elec', name: '電気電子工学科', deviationValue: 45 },
         { id: 'nihon-prod-civil', name: '土木工学科', deviationValue: 44 },
         { id: 'nihon-prod-arch', name: '建築工学科', deviationValue: 47 },
         { id: 'nihon-prod-chem', name: '応用分子化学科', deviationValue: 44 },
         { id: 'nihon-prod-mgmt', name: 'マネジメント工学科', deviationValue: 45 },
         { id: 'nihon-prod-math', name: '数理情報工学科', deviationValue: 45 },
         { id: 'nihon-prod-env', name: '環境安全工学科', deviationValue: 44 },
         { id: 'nihon-prod-creat', name: '創生デザイン学科', deviationValue: 46 }
       ]
     },
     {
       id: 'nihon-eng',
       name: '工学部',
       departments: [
         { id: 'nihon-eng-civil', name: '土木工学科', deviationValue: 42 },
         { id: 'nihon-eng-arch', name: '建築学科', deviationValue: 45 },
         { id: 'nihon-eng-mech', name: '機械工学科', deviationValue: 43 },
         { id: 'nihon-eng-elec', name: '電気電子工学科', deviationValue: 42 },
         { id: 'nihon-eng-life', name: '生命応用化学科', deviationValue: 42 },
         { id: 'nihon-eng-info', name: '情報工学科', deviationValue: 44 }
       ]
     },
     {
       id: 'nihon-med',
       name: '医学部',
       departments: [
         { id: 'nihon-med-med', name: '医学科', deviationValue: 68 }
       ]
     },
     {
       id: 'nihon-dent',
       name: '歯学部',
       departments: [
         { id: 'nihon-dent-dent', name: '歯学科', deviationValue: 53 }
       ]
     },
     {
       id: 'nihon-pharm',
       name: '薬学部',
       departments: [
         { id: 'nihon-pharm-pharm', name: '薬学科', deviationValue: 52 }
       ]
     },
     {
       id: 'nihon-bio',
       name: '生物資源科学部',
       departments: [
         { id: 'nihon-bio-life', name: '生命農学科', deviationValue: 48 },
         { id: 'nihon-bio-chem', name: '生命化学科', deviationValue: 48 },
         { id: 'nihon-bio-vet', name: '獣医学科', deviationValue: 62 },
         { id: 'nihon-bio-ani', name: '動物資源科学科', deviationValue: 47 },
         { id: 'nihon-bio-food', name: '食品ビジネス学科', deviationValue: 48 },
         { id: 'nihon-bio-forest', name: '森林資源科学科', deviationValue: 46 },
         { id: 'nihon-bio-marine', name: '海洋生物資源科学科', deviationValue: 49 },
         { id: 'nihon-bio-env', name: '生物環境工学科', deviationValue: 46 },
         { id: 'nihon-bio-food-life', name: '食品生命学科', deviationValue: 48 },
         { id: 'nihon-bio-int', name: '国際地域開発学科', deviationValue: 47 },
         { id: 'nihon-bio-app', name: '応用生物科学科', deviationValue: 48 },
         { id: 'nihon-bio-agri', name: 'くらしの生物学科', deviationValue: 47 }
       ]
     }
   ]
 },
 {
   id: 'toyo',
   name: '東洋大学',
   type: '私立',
   prefecture: '東京都',
   faculties: [
     {
       id: 'toyo-lit',
       name: '文学部',
       departments: [
         { id: 'toyo-lit-phil', name: '哲学科', deviationValue: 53 },
         { id: 'toyo-lit-east-phil', name: '東洋思想文化学科', deviationValue: 52 },
         { id: 'toyo-lit-jpn', name: '日本文学文化学科', deviationValue: 54 },
         { id: 'toyo-lit-eng', name: '英米文学科', deviationValue: 53 },
         { id: 'toyo-lit-hist', name: '史学科', deviationValue: 54 },
         { id: 'toyo-lit-edu', name: '教育学科', deviationValue: 54 },
         { id: 'toyo-lit-int-comm', name: '国際文化コミュニケーション学科', deviationValue: 54 }
       ]
     },
     {
       id: 'toyo-econ',
       name: '経済学部',
       departments: [
         { id: 'toyo-econ-econ', name: '経済学科', deviationValue: 54 },
         { id: 'toyo-econ-int', name: '国際経済学科', deviationValue: 53 },
         { id: 'toyo-econ-policy', name: '総合政策学科', deviationValue: 53 }
       ]
     },
     {
       id: 'toyo-mgmt',
       name: '経営学部',
       departments: [
         { id: 'toyo-mgmt-mgmt', name: '経営学科', deviationValue: 54 },
         { id: 'toyo-mgmt-mkt', name: 'マーケティング学科', deviationValue: 54 },
         { id: 'toyo-mgmt-acc', name: '会計ファイナンス学科', deviationValue: 53 }
       ]
     },
     {
       id: 'toyo-law',
       name: '法学部',
       departments: [
         { id: 'toyo-law-law', name: '法律学科', deviationValue: 54 },
         { id: 'toyo-law-corp', name: '企業法学科', deviationValue: 52 }
       ]
     },
     {
       id: 'toyo-soc',
       name: '社会学部',
       departments: [
         { id: 'toyo-soc-soc', name: '社会学科', deviationValue: 55 },
         { id: 'toyo-soc-cult', name: '社会文化システム学科', deviationValue: 53 },
         { id: 'toyo-soc-media', name: 'メディアコミュニケーション学科', deviationValue: 55 },
         { id: 'toyo-soc-psy', name: '社会心理学科', deviationValue: 55 },
         { id: 'toyo-soc-wel', name: '社会福祉学科', deviationValue: 51 }
       ]
     },
     {
       id: 'toyo-global',
       name: '国際学部',
       departments: [
         { id: 'toyo-global-global', name: 'グローバル・イノベーション学科', deviationValue: 55 },
         { id: 'toyo-global-int', name: '国際地域学科', deviationValue: 54 }
       ]
     },
     {
       id: 'toyo-int-tour',
       name: '国際観光学部',
       departments: [
         { id: 'toyo-int-tour-tour', name: '国際観光学科', deviationValue: 55 }
       ]
     },
     {
       id: 'toyo-info',
       name: '情報連携学部',
       departments: [
         { id: 'toyo-info-info', name: '情報連携学科', deviationValue: 52 }
       ]
     },
     {
       id: 'toyo-life',
       name: 'ライフデザイン学部',
       departments: [
         { id: 'toyo-life-life', name: '生活支援学科', deviationValue: 50 },
         { id: 'toyo-life-health', name: '健康スポーツ学科', deviationValue: 51 },
         { id: 'toyo-life-human', name: '人間環境デザイン学科', deviationValue: 50 }
       ]
     },
     {
       id: 'toyo-sci',
       name: '理工学部',
       departments: [
         { id: 'toyo-sci-mech', name: '機械工学科', deviationValue: 49 },
         { id: 'toyo-sci-bio', name: '生体医工学科', deviationValue: 48 },
         { id: 'toyo-sci-elec', name: '電気電子情報工学科', deviationValue: 49 },
         { id: 'toyo-sci-chem', name: '応用化学科', deviationValue: 48 },
         { id: 'toyo-sci-civil', name: '都市環境デザイン学科', deviationValue: 48 },
         { id: 'toyo-sci-arch', name: '建築学科', deviationValue: 52 }
       ]
     },
     {
       id: 'toyo-soc-env',
       name: '総合情報学部',
       departments: [
         { id: 'toyo-soc-env-info', name: '総合情報学科', deviationValue: 51 }
       ]
     },
     {
       id: 'toyo-food',
       name: '食環境科学部',
       departments: [
         { id: 'toyo-food-food', name: '食環境科学科', deviationValue: 48 },
         { id: 'toyo-food-health', name: '健康栄養学科', deviationValue: 48 }
       ]
     }
   ]
 },
 {
   id: 'komazawa',
   name: '駒澤大学',
   type: '私立',
   prefecture: '東京都',
   faculties: [
     {
       id: 'koma-buddhist',
       name: '仏教学部',
       departments: [
         { id: 'koma-buddhist-zen', name: '禅学科', deviationValue: 48 },
         { id: 'koma-buddhist-buddhist', name: '仏教学科', deviationValue: 48 }
       ]
     },
     {
       id: 'koma-lit',
       name: '文学部',
       departments: [
         { id: 'koma-lit-jpn', name: '国文学科', deviationValue: 53 },
         { id: 'koma-lit-eng', name: '英米文学科', deviationValue: 52 },
         { id: 'koma-lit-geo', name: '地理学科', deviationValue: 51 },
         { id: 'koma-lit-hist', name: '歴史学科', deviationValue: 54 },
         { id: 'koma-lit-soc', name: '社会学科', deviationValue: 54 },
         { id: 'koma-lit-psy', name: '心理学科', deviationValue: 55 }
       ]
     },
     {
       id: 'koma-econ',
       name: '経済学部',
       departments: [
         { id: 'koma-econ-econ', name: '経済学科', deviationValue: 52 },
         { id: 'koma-econ-com', name: '商学科', deviationValue: 52 },
         { id: 'koma-econ-mod', name: '現代応用経済学科', deviationValue: 51 }
       ]
     },
     {
       id: 'koma-law',
       name: '法学部',
       departments: [
         { id: 'koma-law-law', name: '法律学科', deviationValue: 52 },
         { id: 'koma-law-pol', name: '政治学科', deviationValue: 51 }
       ]
     },
     {
       id: 'koma-mgmt',
       name: '経営学部',
       departments: [
         { id: 'koma-mgmt-mgmt', name: '経営学科', deviationValue: 53 },
         { id: 'koma-mgmt-mkt', name: '市場戦略学科', deviationValue: 52 }
       ]
     },
     {
       id: 'koma-med',
       name: '医療健康科学部',
       departments: [
         { id: 'koma-med-rad', name: '診療放射線技術科学科', deviationValue: 50 }
       ]
     },
     {
       id: 'koma-global',
       name: 'グローバル・メディア・スタディーズ学部',
       departments: [
         { id: 'koma-global-media', name: 'グローバル・メディア学科', deviationValue: 53 }
       ]
     }
   ]
 },
 {
   id: 'senshu',
   name: '専修大学',
   type: '私立',
   prefecture: '東京都',
   faculties: [
     {
       id: 'senshu-econ',
       name: '経済学部',
       departments: [
         { id: 'senshu-econ-mod', name: '現代経済学科', deviationValue: 52 },
         { id: 'senshu-econ-life', name: '生活環境経済学科', deviationValue: 51 },
         { id: 'senshu-econ-int', name: '国際経済学科', deviationValue: 52 }
       ]
     },
     {
       id: 'senshu-law',
       name: '法学部',
       departments: [
         { id: 'senshu-law-law', name: '法律学科', deviationValue: 52 },
         { id: 'senshu-law-pol', name: '政治学科', deviationValue: 51 }
       ]
     },
     {
       id: 'senshu-mgmt',
       name: '経営学部',
       departments: [
         { id: 'senshu-mgmt-mgmt', name: '経営学科', deviationValue: 52 },
         { id: 'senshu-mgmt-bus', name: 'ビジネスデザイン学科', deviationValue: 52 }
       ]
     },
     {
       id: 'senshu-com',
       name: '商学部',
       departments: [
         { id: 'senshu-com-mkt', name: 'マーケティング学科', deviationValue: 52 },
         { id: 'senshu-com-acc', name: '会計学科', deviationValue: 51 }
       ]
     },
     {
       id: 'senshu-lit',
       name: '文学部',
       departments: [
         { id: 'senshu-lit-jpn', name: '日本文学文化学科', deviationValue: 52 },
         { id: 'senshu-lit-eng', name: '英語英米文学科', deviationValue: 52 },
         { id: 'senshu-lit-phil', name: '哲学科', deviationValue: 50 },
         { id: 'senshu-lit-hist', name: '歴史学科', deviationValue: 52 },
         { id: 'senshu-lit-env', name: '環境地理学科', deviationValue: 50 },
         { id: 'senshu-lit-jour', name: 'ジャーナリズム学科', deviationValue: 52 }
       ]
     },
     {
       id: 'senshu-net',
       name: 'ネットワーク情報学部',
       departments: [
         { id: 'senshu-net-net', name: 'ネットワーク情報学科', deviationValue: 51 }
       ]
     },
     {
       id: 'senshu-human',
       name: '人間科学部',
       departments: [
         { id: 'senshu-human-psy', name: '心理学科', deviationValue: 53 },
         { id: 'senshu-human-soc', name: '社会学科', deviationValue: 52 }
       ]
     },
     {
       id: 'senshu-int',
       name: '国際コミュニケーション学部',
       departments: [
         { id: 'senshu-int-jpn', name: '日本語学科', deviationValue: 50 },
         { id: 'senshu-int-cross', name: '異文化コミュニケーション学科', deviationValue: 52 }
       ]
     }
   ]
 },

 // 神奈川県
 {
   id: 'yokohama-national',
   name: '横浜国立大学',
   type: '国立',
   prefecture: '神奈川県',
   faculties: [
     {
       id: 'ynu-edu',
       name: '教育学部',
       departments: [
         { id: 'ynu-edu-school', name: '学校教育課程', deviationValue: 61 }
       ]
     },
     {
       id: 'ynu-econ',
       name: '経済学部',
       departments: [
         { id: 'ynu-econ-econ', name: '経済学科', deviationValue: 63 }
       ]
     },
     {
       id: 'ynu-mgmt',
       name: '経営学部',
       departments: [
         { id: 'ynu-mgmt-mgmt', name: '経営学科', deviationValue: 64 }
       ]
     },
     {
       id: 'ynu-eng',
       name: '理工学部',
       departments: [
         { id: 'ynu-eng-mech', name: '機械・材料・海洋系学科', deviationValue: 59 },
         { id: 'ynu-eng-chem', name: '化学・生命系学科', deviationValue: 58 },
         { id: 'ynu-eng-math', name: '数物・電子情報系学科', deviationValue: 60 }
       ]
     },
     {
       id: 'ynu-urban',
       name: '都市科学部',
       departments: [
         { id: 'ynu-urban-urban', name: '都市社会共生学科', deviationValue: 62 },
         { id: 'ynu-urban-arch', name: '建築学科', deviationValue: 63 },
         { id: 'ynu-urban-civil', name: '都市基盤学科', deviationValue: 59 },
         { id: 'ynu-urban-env', name: '環境リスク共生学科', deviationValue: 59 }
       ]
     }
   ]
 },
 {
   id: 'kanagawa',
   name: '神奈川大学',
   type: '私立',
   prefecture: '神奈川県',
   faculties: [
     {
       id: 'kanagawa-law',
       name: '法学部',
       departments: [
         { id: 'kanagawa-law-law', name: '法律学科', deviationValue: 50 },
         { id: 'kanagawa-law-local', name: '自治行政学科', deviationValue: 49 }
       ]
     },
     {
       id: 'kanagawa-econ',
       name: '経済学部',
       departments: [
         { id: 'kanagawa-econ-econ', name: '経済学科', deviationValue: 50 },
         { id: 'kanagawa-econ-trade', name: '現代ビジネス学科', deviationValue: 50 }
       ]
     },
     {
       id: 'kanagawa-mgmt',
       name: '経営学部',
       departments: [
         { id: 'kanagawa-mgmt-int', name: '国際経営学科', deviationValue: 50 }
       ]
     },
     {
       id: 'kanagawa-lang',
       name: '外国語学部',
       departments: [
         { id: 'kanagawa-lang-eng', name: '英語英文学科', deviationValue: 50 },
         { id: 'kanagawa-lang-spa', name: 'スペイン語学科', deviationValue: 48 },
         { id: 'kanagawa-lang-chi', name: '中国語学科', deviationValue: 48 },
         { id: 'kanagawa-lang-int', name: '国際文化交流学科', deviationValue: 51 }
       ]
     },
     {
       id: 'kanagawa-cross',
       name: '国際日本学部',
       departments: [
         { id: 'kanagawa-cross-jpn', name: '国際文化交流学科', deviationValue: 50 },
         { id: 'kanagawa-cross-hist', name: '日本文化学科', deviationValue: 49 },
         { id: 'kanagawa-cross-tour', name: '歴史民俗学科', deviationValue: 49 }
       ]
     },
     {
       id: 'kanagawa-human',
       name: '人間科学部',
       departments: [
         { id: 'kanagawa-human-human', name: '人間科学科', deviationValue: 50 }
       ]
     },
     {
       id: 'kanagawa-sci',
       name: '理学部',
       departments: [
         { id: 'kanagawa-sci-math', name: '数理・物理学科', deviationValue: 47 },
         { id: 'kanagawa-sci-info', name: '情報科学科', deviationValue: 48 },
         { id: 'kanagawa-sci-chem', name: '化学科', deviationValue: 47 },
         { id: 'kanagawa-sci-bio', name: '生物科学科', deviationValue: 48 }
       ]
     },
     {
       id: 'kanagawa-eng',
       name: '工学部',
       departments: [
         { id: 'kanagawa-eng-mech', name: '機械工学科', deviationValue: 46 },
         { id: 'kanagawa-eng-elec', name: '電気電子情報工学科', deviationValue: 46 },
         { id: 'kanagawa-eng-mat', name: '物質生命化学科', deviationValue: 46 },
         { id: 'kanagawa-eng-info', name: '情報システム創成学科', deviationValue: 47 },
         { id: 'kanagawa-eng-mgmt', name: '経営工学科', deviationValue: 46 },
         { id: 'kanagawa-eng-arch', name: '建築学科', deviationValue: 49 }
       ]
     },
     {
       id: 'kanagawa-chem',
       name: '化学生命学部',
       departments: [
         { id: 'kanagawa-chem-chem', name: '応用化学科', deviationValue: 46 },
         { id: 'kanagawa-chem-bio', name: '生命機能学科', deviationValue: 47 }
       ]
     },
     {
       id: 'kanagawa-info',
       name: '情報学部',
       departments: [
         { id: 'kanagawa-info-comp', name: '計算機科学科', deviationValue: 47 },
         { id: 'kanagawa-info-sys', name: 'システム数理学科', deviationValue: 46 },
         { id: 'kanagawa-info-exp', name: '先端情報領域プログラム', deviationValue: 47 }
       ]
     }
   ]
 },
 
 // 千葉県
 {
   id: 'chiba',
   name: '千葉大学',
   type: '国立',
   prefecture: '千葉県',
   faculties: [
     {
       id: 'chiba-letters',
       name: '文学部',
       departments: [
         { id: 'chiba-letters-human', name: '人文学科', deviationValue: 61 }
       ]
     },
     {
       id: 'chiba-edu',
       name: '教育学部',
       departments: [
         { id: 'chiba-edu-elementary', name: '小学校教員養成課程', deviationValue: 59 },
         { id: 'chiba-edu-junior', name: '中学校教員養成課程', deviationValue: 58 },
         { id: 'chiba-edu-special', name: '特別支援教育教員養成課程', deviationValue: 57 },
         { id: 'chiba-edu-kinder', name: '幼稚園教員養成課程', deviationValue: 57 },
         { id: 'chiba-edu-nurse', name: '養護教諭養成課程', deviationValue: 56 }
       ]
     },
     {
       id: 'chiba-law',
       name: '法政経学部',
       departments: [
         { id: 'chiba-law-law', name: '法政経学科', deviationValue: 61 }
       ]
     },
     {
       id: 'chiba-sci',
       name: '理学部',
       departments: [
         { id: 'chiba-sci-math', name: '数学・情報数理学科', deviationValue: 59 },
         { id: 'chiba-sci-phys', name: '物理学科', deviationValue: 59 },
         { id: 'chiba-sci-chem', name: '化学科', deviationValue: 59 },
         { id: 'chiba-sci-bio', name: '生物学科', deviationValue: 59 },
         { id: 'chiba-sci-earth', name: '地球科学科', deviationValue: 57 }
       ]
     },
     {
       id: 'chiba-eng',
       name: '工学部',
       departments: [
         { id: 'chiba-eng-arch', name: '建築学コース', deviationValue: 61 },
         { id: 'chiba-eng-urban', name: '都市環境システムコース', deviationValue: 58 },
         { id: 'chiba-eng-design', name: 'デザインコース', deviationValue: 60 },
         { id: 'chiba-eng-mech', name: '機械工学コース', deviationValue: 59 },
         { id: 'chiba-eng-med', name: '医工学コース', deviationValue: 58 },
         { id: 'chiba-eng-elec', name: '電気電子工学コース', deviationValue: 59 },
         { id: 'chiba-eng-mat', name: '物質科学コース', deviationValue: 58 },
         { id: 'chiba-eng-chem', name: '共生応用化学コース', deviationValue: 58 },
         { id: 'chiba-eng-info', name: '情報工学コース', deviationValue: 60 }
       ]
     },
     {
       id: 'chiba-med',
       name: '医学部',
       departments: [
         { id: 'chiba-med-med', name: '医学科', deviationValue: 70 }
       ]
     },
     {
       id: 'chiba-pharm',
       name: '薬学部',
       departments: [
         { id: 'chiba-pharm-pharm', name: '薬学科', deviationValue: 63 },
         { id: 'chiba-pharm-sci', name: '薬科学科', deviationValue: 62 }
       ]
     },
     {
       id: 'chiba-nurs',
       name: '看護学部',
       departments: [
         { id: 'chiba-nurs-nurs', name: '看護学科', deviationValue: 57 }
       ]
     },
     {
       id: 'chiba-hort',
       name: '園芸学部',
       departments: [
         { id: 'chiba-hort-hort', name: '園芸学科', deviationValue: 56 },
         { id: 'chiba-hort-app', name: '応用生命化学科', deviationValue: 57 },
         { id: 'chiba-hort-env', name: '緑地環境学科', deviationValue: 57 },
         { id: 'chiba-hort-food', name: '食料資源経済学科', deviationValue: 56 }
       ]
     },
     {
       id: 'chiba-int',
       name: '国際教養学部',
       departments: [
         { id: 'chiba-int-int', name: '国際教養学科', deviationValue: 64 }
       ]
     }
   ]
 },
 
 // 埼玉県
 {
   id: 'saitama',
   name: '埼玉大学',
   type: '国立',
   prefecture: '埼玉県',
   faculties: [
     {
       id: 'saitama-liberal',
       name: '教養学部',
       departments: [
         { id: 'saitama-liberal-liberal', name: '教養学科', deviationValue: 58 }
       ]
     },
     {
       id: 'saitama-econ',
       name: '経済学部',
       departments: [
         { id: 'saitama-econ-econ', name: '経済学科', deviationValue: 58 }
       ]
     },
     {
       id: 'saitama-edu',
       name: '教育学部',
       departments: [
         { id: 'saitama-edu-school', name: '学校教育教員養成課程', deviationValue: 57 },
         { id: 'saitama-edu-nurse', name: '養護教諭養成課程', deviationValue: 55 }
       ]
     },
     {
       id: 'saitama-sci',
       name: '理学部',
       departments: [
         { id: 'saitama-sci-math', name: '数学科', deviationValue: 56 },
         { id: 'saitama-sci-phys', name: '物理学科', deviationValue: 56 },
         { id: 'saitama-sci-chem', name: '基礎化学科', deviationValue: 56 },
         { id: 'saitama-sci-bio', name: '分子生物学科', deviationValue: 56 },
         { id: 'saitama-sci-reg', name: '生体制御学科', deviationValue: 56 }
       ]
     },
     {
       id: 'saitama-eng',
       name: '工学部',
       departments: [
         { id: 'saitama-eng-mech', name: '機械工学・システムデザイン学科', deviationValue: 54 },
         { id: 'saitama-eng-elec', name: '電気電子物理工学科', deviationValue: 54 },
         { id: 'saitama-eng-info', name: '情報工学科', deviationValue: 56 },
         { id: 'saitama-eng-chem', name: '応用化学科', deviationValue: 54 },
         { id: 'saitama-eng-civil', name: '環境社会デザイン学科', deviationValue: 54 }
       ]
     }
   ]
 },

 // 東京都 - 公立
 {
   id: 'tokyo-metro',
   name: '東京都立大学',
   type: '公立',
   prefecture: '東京都',
   faculties: [
     {
       id: 'tmu-human',
       name: '人文社会学部',
       departments: [
         { id: 'tmu-human-social', name: '人間社会学科', deviationValue: 61 },
         { id: 'tmu-human-culture', name: '人文学科', deviationValue: 61 }
       ]
     },
     {
       id: 'tmu-law',
       name: '法学部',
       departments: [
         { id: 'tmu-law-law', name: '法学科', deviationValue: 61 }
       ]
     },
     {
       id: 'tmu-econ',
       name: '経済経営学部',
       departments: [
         { id: 'tmu-econ-econ', name: '経済経営学科', deviationValue: 61 }
       ]
     },
     {
       id: 'tmu-sci',
       name: '理学部',
       departments: [
         { id: 'tmu-sci-math', name: '数理科学科', deviationValue: 57 },
         { id: 'tmu-sci-phys', name: '物理学科', deviationValue: 57 },
         { id: 'tmu-sci-chem', name: '化学科', deviationValue: 57 },
         { id: 'tmu-sci-life', name: '生命科学科', deviationValue: 58 }
       ]
     },
     {
       id: 'tmu-urban',
       name: '都市環境学部',
       departments: [
         { id: 'tmu-urban-env', name: '地理環境学科', deviationValue: 57 },
         { id: 'tmu-urban-civil', name: '都市基盤環境学科', deviationValue: 56 },
         { id: 'tmu-urban-arch', name: '建築学科', deviationValue: 59 },
         { id: 'tmu-urban-chem', name: '環境応用化学科', deviationValue: 56 },
         { id: 'tmu-urban-tour', name: '観光科学科', deviationValue: 58 },
         { id: 'tmu-urban-policy', name: '都市政策科学科', deviationValue: 58 }
       ]
     },
     {
       id: 'tmu-sys',
       name: 'システムデザイン学部',
       departments: [
         { id: 'tmu-sys-info', name: '情報科学科', deviationValue: 58 },
         { id: 'tmu-sys-elec', name: '電子情報システム工学科', deviationValue: 57 },
         { id: 'tmu-sys-mech', name: '機械システム工学科', deviationValue: 57 },
         { id: 'tmu-sys-aero', name: '航空宇宙システム工学科', deviationValue: 57 },
         { id: 'tmu-sys-ind', name: 'インダストリアルアート学科', deviationValue: 57 }
       ]
     },
     {
       id: 'tmu-health',
       name: '健康福祉学部',
       departments: [
         { id: 'tmu-health-nurs', name: '看護学科', deviationValue: 57 },
         { id: 'tmu-health-phys', name: '理学療法学科', deviationValue: 57 },
         { id: 'tmu-health-occ', name: '作業療法学科', deviationValue: 55 },
         { id: 'tmu-health-rad', name: '放射線学科', deviationValue: 56 }
       ]
     }
   ]
 },

 // 神奈川県 - 公立
 {
   id: 'yokohama-city',
   name: '横浜市立大学',
   type: '公立',
   prefecture: '神奈川県',
   faculties: [
     {
       id: 'ycu-int',
       name: '国際教養学部',
       departments: [
         { id: 'ycu-int-liberal', name: '国際教養学科', deviationValue: 60 }
       ]
     },
     {
       id: 'ycu-int-com',
       name: '国際商学部',
       departments: [
         { id: 'ycu-int-com-com', name: '国際商学科', deviationValue: 60 }
       ]
     },
     {
       id: 'ycu-sci',
       name: '理学部',
       departments: [
         { id: 'ycu-sci-sci', name: '理学科', deviationValue: 57 }
       ]
     },
     {
       id: 'ycu-data',
       name: 'データサイエンス学部',
       departments: [
         { id: 'ycu-data-data', name: 'データサイエンス学科', deviationValue: 59 }
       ]
     },
     {
       id: 'ycu-med',
       name: '医学部',
       departments: [
         { id: 'ycu-med-med', name: '医学科', deviationValue: 69 },
         { id: 'ycu-med-nurs', name: '看護学科', deviationValue: 57 }
       ]
     }
   ]
 },

 // 埼玉県 - 公立
 {
   id: 'saitama-pref',
   name: '埼玉県立大学',
   type: '公立',
   prefecture: '埼玉県',
   faculties: [
     {
       id: 'spu-health',
       name: '保健医療福祉学部',
       departments: [
         { id: 'spu-health-nurs', name: '看護学科', deviationValue: 54 },
         { id: 'spu-health-phys', name: '理学療法学科', deviationValue: 55 },
         { id: 'spu-health-occ', name: '作業療法学科', deviationValue: 53 },
         { id: 'spu-health-social', name: '社会福祉子ども学科', deviationValue: 52 },
         { id: 'spu-health-health', name: '健康開発学科', deviationValue: 52 }
       ]
     }
   ]
 },

 // 千葉県 - 公立
 {
   id: 'chiba-pref-health',
   name: '千葉県立保健医療大学',
   type: '公立',
   prefecture: '千葉県',
   faculties: [
     {
       id: 'cpuhs-health',
       name: '健康科学部',
       departments: [
         { id: 'cpuhs-health-nurs', name: '看護学科', deviationValue: 54 },
         { id: 'cpuhs-health-nutri', name: '栄養学科', deviationValue: 53 },
         { id: 'cpuhs-health-dental', name: '歯科衛生学科', deviationValue: 50 },
         { id: 'cpuhs-health-rehab', name: 'リハビリテーション学科', deviationValue: 53 }
       ]
     }
   ]
 },

 // 群馬県 - 公立
 {
   id: 'gunma-women',
   name: '群馬県立女子大学',
   type: '公立',
   prefecture: '群馬県',
   faculties: [
     {
       id: 'gpwu-lit',
       name: '文学部',
       departments: [
         { id: 'gpwu-lit-jpn', name: '国文学科', deviationValue: 54 },
         { id: 'gpwu-lit-eng', name: '英米文化学科', deviationValue: 54 },
         { id: 'gpwu-lit-art', name: '美学美術史学科', deviationValue: 52 },
         { id: 'gpwu-lit-culture', name: '総合教養学科', deviationValue: 53 }
       ]
     },
     {
       id: 'gpwu-int',
       name: '国際コミュニケーション学部',
       departments: [
         { id: 'gpwu-int-eng', name: '英語コミュニケーション課程', deviationValue: 54 },
         { id: 'gpwu-int-int', name: '国際ビジネス課程', deviationValue: 53 }
       ]
     }
   ]
 },
 {
   id: 'gunma-health',
   name: '群馬県立県民健康科学大学',
   type: '公立',
   prefecture: '群馬県',
   faculties: [
     {
       id: 'gchs-nurs',
       name: '看護学部',
       departments: [
         { id: 'gchs-nurs-nurs', name: '看護学科', deviationValue: 53 }
       ]
     },
     {
       id: 'gchs-diag',
       name: '診療放射線学部',
       departments: [
         { id: 'gchs-diag-rad', name: '診療放射線学科', deviationValue: 53 }
       ]
     }
   ]
 },
 {
   id: 'takasaki-econ',
   name: '高崎経済大学',
   type: '公立',
   prefecture: '群馬県',
   faculties: [
     {
       id: 'tcue-econ',
       name: '経済学部',
       departments: [
         { id: 'tcue-econ-econ', name: '経済学科', deviationValue: 55 },
         { id: 'tcue-econ-mgmt', name: '経営学科', deviationValue: 55 },
         { id: 'tcue-econ-int', name: '国際学科', deviationValue: 54 }
       ]
     },
     {
       id: 'tcue-reg',
       name: '地域政策学部',
       departments: [
         { id: 'tcue-reg-reg', name: '地域政策学科', deviationValue: 54 },
         { id: 'tcue-reg-dev', name: '地域づくり学科', deviationValue: 53 },
         { id: 'tcue-reg-tour', name: '観光政策学科', deviationValue: 53 }
       ]
     }
   ]
 },
 {
   id: 'maebashi-tech',
   name: '前橋工科大学',
   type: '公立',
   prefecture: '群馬県',
   faculties: [
     {
       id: 'mit-eng',
       name: '工学部',
       departments: [
         { id: 'mit-eng-civil', name: '社会環境工学科', deviationValue: 48 },
         { id: 'mit-eng-arch', name: '建築学科', deviationValue: 50 },
         { id: 'mit-eng-life', name: '生命情報学科', deviationValue: 47 },
         { id: 'mit-eng-sys', name: 'システム生体工学科', deviationValue: 47 },
         { id: 'mit-eng-bio', name: '生物工学科', deviationValue: 47 },
         { id: 'mit-eng-info', name: '情報・生命工学科', deviationValue: 48 }
       ]
     }
   ]
 },

 // 茨城県 - 公立
 {
   id: 'ibaraki-health',
   name: '茨城県立医療大学',
   type: '公立',
   prefecture: '茨城県',
   faculties: [
     {
       id: 'ipu-health',
       name: '保健医療学部',
       departments: [
         { id: 'ipu-health-nurs', name: '看護学科', deviationValue: 53 },
         { id: 'ipu-health-phys', name: '理学療法学科', deviationValue: 54 },
         { id: 'ipu-health-occ', name: '作業療法学科', deviationValue: 52 },
         { id: 'ipu-health-rad', name: '放射線技術科学科', deviationValue: 53 }
       ]
     }
   ]
 },

 // 栃木県 - 公立
 {
   id: 'tochigi-pref',
   name: '栃木県立大学',
   type: '公立',
   prefecture: '栃木県',
   faculties: [
     {
       id: 'tpu-nurs',
       name: '看護学部',
       departments: [
         { id: 'tpu-nurs-nurs', name: '看護学科', deviationValue: 52 }
       ]
     },
     {
       id: 'tpu-health',
       name: '保健福祉学部',
       departments: [
         { id: 'tpu-health-welfare', name: '保健福祉学科', deviationValue: 51 }
       ]
     }
   ]
 }
]