import { University } from './index'

export const tohokuHokkaidoUniversities: University[] = [
  // 北海道
  {
    id: 'hokkaido',
    name: '北海道大学',
    type: '国立',
    prefecture: '北海道',
    faculties: [
      {
        id: 'hokkaido-letters',
        name: '文学部',
        departments: [
          { id: 'hokkaido-letters-hum', name: '人文科学科', deviationValue: 64 }
        ]
      },
      {
        id: 'hokkaido-edu',
        name: '教育学部',
        departments: [
          { id: 'hokkaido-edu-edu', name: '教育学科', deviationValue: 63 }
        ]
      },
      {
        id: 'hokkaido-law',
        name: '法学部',
        departments: [
          { id: 'hokkaido-law-law', name: '法学課程', deviationValue: 63 }
        ]
      },
      {
        id: 'hokkaido-econ',
        name: '経済学部',
        departments: [
          { id: 'hokkaido-econ-econ', name: '経済学科', deviationValue: 63 },
          { id: 'hokkaido-econ-mgmt', name: '経営学科', deviationValue: 63 }
        ]
      },
      {
        id: 'hokkaido-sci',
        name: '理学部',
        departments: [
          { id: 'hokkaido-sci-math', name: '数学科', deviationValue: 61 },
          { id: 'hokkaido-sci-phys', name: '物理学科', deviationValue: 61 },
          { id: 'hokkaido-sci-chem', name: '化学科', deviationValue: 61 },
          { id: 'hokkaido-sci-bio', name: '生物科学科', deviationValue: 61 },
          { id: 'hokkaido-sci-earth', name: '地球惑星科学科', deviationValue: 60 }
        ]
      },
      {
        id: 'hokkaido-med',
        name: '医学部',
        departments: [
          { id: 'hokkaido-med-med', name: '医学科', deviationValue: 70 },
          { id: 'hokkaido-med-health', name: '保健学科', deviationValue: 58 }
        ]
      },
      {
        id: 'hokkaido-dent',
        name: '歯学部',
        departments: [
          { id: 'hokkaido-dent-dent', name: '歯学科', deviationValue: 62 }
        ]
      },
      {
        id: 'hokkaido-pharm',
        name: '薬学部',
        departments: [
          { id: 'hokkaido-pharm-pharm', name: '薬学科', deviationValue: 64 },
          { id: 'hokkaido-pharm-sci', name: '薬科学科', deviationValue: 63 }
        ]
      },
      {
        id: 'hokkaido-eng',
        name: '工学部',
        departments: [
          { id: 'hokkaido-eng-app', name: '応用理工系学科', deviationValue: 62 },
          { id: 'hokkaido-eng-info', name: '情報エレクトロニクス学科', deviationValue: 62 },
          { id: 'hokkaido-eng-mech', name: '機械知能工学科', deviationValue: 62 },
          { id: 'hokkaido-eng-env', name: '環境社会工学科', deviationValue: 61 }
        ]
      },
      {
        id: 'hokkaido-agr',
        name: '農学部',
        departments: [
          { id: 'hokkaido-agr-bio', name: '生物資源科学科', deviationValue: 61 },
          { id: 'hokkaido-agr-app', name: '応用生命科学科', deviationValue: 61 },
          { id: 'hokkaido-agr-func', name: '生物機能化学科', deviationValue: 61 },
          { id: 'hokkaido-agr-forest', name: '森林科学科', deviationValue: 60 },
          { id: 'hokkaido-agr-animal', name: '畜産科学科', deviationValue: 60 },
          { id: 'hokkaido-agr-env2', name: '生物環境工学科', deviationValue: 60 },
          { id: 'hokkaido-agr-econ', name: '農業経済学科', deviationValue: 60 }
        ]
      },
      {
        id: 'hokkaido-vet',
        name: '獣医学部',
        departments: [
          { id: 'hokkaido-vet-vet', name: '獣医学科', deviationValue: 68 }
        ]
      },
      {
        id: 'hokkaido-fish',
        name: '水産学部',
        departments: [
          { id: 'hokkaido-fish-marine', name: '海洋生物科学科', deviationValue: 60 },
          { id: 'hokkaido-fish-ocean', name: '海洋資源科学科', deviationValue: 59 },
          { id: 'hokkaido-fish-bio', name: '増殖生命科学科', deviationValue: 60 },
          { id: 'hokkaido-fish-prod', name: '資源機能化学科', deviationValue: 59 }
        ]
      }
    ]
  },
  
  // 北海道 - 公立大学
  {
    id: 'sapporo-med',
    name: '札幌医科大学',
    type: '公立',
    prefecture: '北海道',
    faculties: [
      {
        id: 'sapporo-med-med',
        name: '医学部',
        departments: [
          { id: 'sapporo-med-med-med', name: '医学科', deviationValue: 65 }
        ]
      },
      {
        id: 'sapporo-med-health',
        name: '保健医療学部',
        departments: [
          { id: 'sapporo-med-health-nurs', name: '看護学科', deviationValue: 52 },
          { id: 'sapporo-med-health-pt', name: '理学療法学科', deviationValue: 53 },
          { id: 'sapporo-med-health-ot', name: '作業療法学科', deviationValue: 52 }
        ]
      }
    ]
  },
  {
    id: 'kushiro-pub',
    name: '釧路公立大学',
    type: '公立',
    prefecture: '北海道',
    faculties: [
      {
        id: 'kushiro-pub-econ',
        name: '経済学部',
        departments: [
          { id: 'kushiro-pub-econ-econ', name: '経済学科', deviationValue: 45 },
          { id: 'kushiro-pub-econ-mgmt', name: '経営学科', deviationValue: 45 }
        ]
      }
    ]
  },
  {
    id: 'chitose-tech',
    name: '公立千歳科学技術大学',
    type: '公立',
    prefecture: '北海道',
    faculties: [
      {
        id: 'chitose-tech-sci',
        name: '理工学部',
        departments: [
          { id: 'chitose-tech-sci-app', name: '応用化学生物学科', deviationValue: 46 },
          { id: 'chitose-tech-sci-elec', name: '電子光工学科', deviationValue: 46 },
          { id: 'chitose-tech-sci-info', name: '情報システム工学科', deviationValue: 47 }
        ]
      }
    ]
  },
  {
    id: 'fun',
    name: '公立はこだて未来大学',
    type: '公立',
    prefecture: '北海道',
    faculties: [
      {
        id: 'fun-sys',
        name: 'システム情報科学部',
        departments: [
          { id: 'fun-sys-info', name: '情報アーキテクチャ学科', deviationValue: 49 },
          { id: 'fun-sys-comp', name: '複雑系知能学科', deviationValue: 49 }
        ]
      }
    ]
  },

  // 青森県
  {
    id: 'hirosaki',
    name: '弘前大学',
    type: '国立',
    prefecture: '青森県',
    faculties: [
      {
        id: 'hirosaki-hum',
        name: '人文社会科学部',
        departments: [
          { id: 'hirosaki-hum-cul', name: '文化創生課程', deviationValue: 53 },
          { id: 'hirosaki-hum-soc', name: '社会経営課程', deviationValue: 52 }
        ]
      },
      {
        id: 'hirosaki-edu',
        name: '教育学部',
        departments: [
          { id: 'hirosaki-edu-school', name: '学校教育教員養成課程', deviationValue: 51 },
          { id: 'hirosaki-edu-health', name: '養護教諭養成課程', deviationValue: 50 }
        ]
      },
      {
        id: 'hirosaki-med',
        name: '医学部',
        departments: [
          { id: 'hirosaki-med-med', name: '医学科', deviationValue: 66 },
          { id: 'hirosaki-med-health', name: '保健学科', deviationValue: 51 },
          { id: 'hirosaki-med-psy', name: '心理支援科学科', deviationValue: 52 }
        ]
      },
      {
        id: 'hirosaki-sci',
        name: '理工学部',
        departments: [
          { id: 'hirosaki-sci-math', name: '数物科学科', deviationValue: 48 },
          { id: 'hirosaki-sci-mat', name: '物質創成化学科', deviationValue: 48 },
          { id: 'hirosaki-sci-earth', name: '地球環境防災学科', deviationValue: 47 },
          { id: 'hirosaki-sci-elec', name: '電子情報工学科', deviationValue: 48 },
          { id: 'hirosaki-sci-mech', name: '機械科学科', deviationValue: 48 },
          { id: 'hirosaki-sci-nature', name: '自然エネルギー学科', deviationValue: 47 }
        ]
      },
      {
        id: 'hirosaki-agr',
        name: '農学生命科学部',
        departments: [
          { id: 'hirosaki-agr-bio', name: '生物学科', deviationValue: 50 },
          { id: 'hirosaki-agr-mol', name: '分子生命科学科', deviationValue: 49 },
          { id: 'hirosaki-agr-food', name: '食料資源学科', deviationValue: 48 },
          { id: 'hirosaki-agr-int', name: '国際園芸農学科', deviationValue: 48 },
          { id: 'hirosaki-agr-env', name: '地域環境工学科', deviationValue: 47 }
        ]
      }
    ]
  },

  // 青森県 - 公立大学
  {
    id: 'aomori-health',
    name: '青森県立保健大学',
    type: '公立',
    prefecture: '青森県',
    faculties: [
      {
        id: 'aomori-health-health',
        name: '健康科学部',
        departments: [
          { id: 'aomori-health-health-nurs', name: '看護学科', deviationValue: 50 },
          { id: 'aomori-health-health-pt', name: '理学療法学科', deviationValue: 51 },
          { id: 'aomori-health-health-welfare', name: '社会福祉学科', deviationValue: 48 },
          { id: 'aomori-health-health-nutr', name: '栄養学科', deviationValue: 49 }
        ]
      }
    ]
  },
  {
    id: 'aomori-pub',
    name: '青森公立大学',
    type: '公立',
    prefecture: '青森県',
    faculties: [
      {
        id: 'aomori-pub-mgmt',
        name: '経営経済学部',
        departments: [
          { id: 'aomori-pub-mgmt-mgmt', name: '経営学科', deviationValue: 47 },
          { id: 'aomori-pub-mgmt-econ', name: '経済学科', deviationValue: 47 },
          { id: 'aomori-pub-mgmt-reg', name: '地域みらい学科', deviationValue: 46 }
        ]
      }
    ]
  },

  // 岩手県
  {
    id: 'iwate',
    name: '岩手大学',
    type: '国立',
    prefecture: '岩手県',
    faculties: [
      {
        id: 'iwate-hum',
        name: '人文社会科学部',
        departments: [
          { id: 'iwate-hum-human', name: '人間文化課程', deviationValue: 52 },
          { id: 'iwate-hum-reg', name: '地域政策課程', deviationValue: 51 }
        ]
      },
      {
        id: 'iwate-edu',
        name: '教育学部',
        departments: [
          { id: 'iwate-edu-school', name: '学校教育教員養成課程', deviationValue: 50 }
        ]
      },
      {
        id: 'iwate-sci',
        name: '理工学部',
        departments: [
          { id: 'iwate-sci-chem', name: '化学・生命理工学科', deviationValue: 48 },
          { id: 'iwate-sci-phys', name: '物理・材料理工学科', deviationValue: 48 },
          { id: 'iwate-sci-sys', name: 'システム創成工学科', deviationValue: 48 }
        ]
      },
      {
        id: 'iwate-agr',
        name: '農学部',
        departments: [
          { id: 'iwate-agr-plant', name: '植物生命科学科', deviationValue: 49 },
          { id: 'iwate-agr-app', name: '応用生物化学科', deviationValue: 49 },
          { id: 'iwate-agr-forest', name: '森林科学科', deviationValue: 48 },
          { id: 'iwate-agr-food', name: '食料生産環境学科', deviationValue: 48 },
          { id: 'iwate-agr-animal', name: '動物科学科', deviationValue: 50 },
          { id: 'iwate-agr-vet', name: '共同獣医学科', deviationValue: 63 }
        ]
      }
    ]
  },

  // 岩手県 - 公立大学
  {
    id: 'iwate-pu',
    name: '岩手県立大学',
    type: '公立',
    prefecture: '岩手県',
    faculties: [
      {
        id: 'iwate-pu-nurs',
        name: '看護学部',
        departments: [
          { id: 'iwate-pu-nurs-nurs', name: '看護学科', deviationValue: 49 }
        ]
      },
      {
        id: 'iwate-pu-welfare',
        name: '社会福祉学部',
        departments: [
          { id: 'iwate-pu-welfare-welfare', name: '社会福祉学科', deviationValue: 47 },
          { id: 'iwate-pu-welfare-human', name: '人間福祉学科', deviationValue: 46 }
        ]
      },
      {
        id: 'iwate-pu-soft',
        name: 'ソフトウェア情報学部',
        departments: [
          { id: 'iwate-pu-soft-soft', name: 'ソフトウェア情報学科', deviationValue: 47 }
        ]
      },
      {
        id: 'iwate-pu-policy',
        name: '総合政策学部',
        departments: [
          { id: 'iwate-pu-policy-policy', name: '総合政策学科', deviationValue: 47 }
        ]
      }
    ]
  },

  // 宮城県
  {
    id: 'tohoku',
    name: '東北大学',
    type: '国立',
    prefecture: '宮城県',
    faculties: [
      {
        id: 'tohoku-letters',
        name: '文学部',
        departments: [
          { id: 'tohoku-letters-hum', name: '人文社会学科', deviationValue: 65 }
        ]
      },
      {
        id: 'tohoku-edu',
        name: '教育学部',
        departments: [
          { id: 'tohoku-edu-edu', name: '教育科学科', deviationValue: 64 }
        ]
      },
      {
        id: 'tohoku-law',
        name: '法学部',
        departments: [
          { id: 'tohoku-law-law', name: '法学科', deviationValue: 65 }
        ]
      },
      {
        id: 'tohoku-econ',
        name: '経済学部',
        departments: [
          { id: 'tohoku-econ-econ', name: '経済学科', deviationValue: 65 },
          { id: 'tohoku-econ-mgmt', name: '経営学科', deviationValue: 65 }
        ]
      },
      {
        id: 'tohoku-sci',
        name: '理学部',
        departments: [
          { id: 'tohoku-sci-math', name: '数学系', deviationValue: 63 },
          { id: 'tohoku-sci-phys', name: '物理系', deviationValue: 63 },
          { id: 'tohoku-sci-chem', name: '化学系', deviationValue: 63 },
          { id: 'tohoku-sci-earth', name: '地球科学系', deviationValue: 62 },
          { id: 'tohoku-sci-bio', name: '生物系', deviationValue: 63 }
        ]
      },
      {
        id: 'tohoku-med',
        name: '医学部',
        departments: [
          { id: 'tohoku-med-med', name: '医学科', deviationValue: 71 },
          { id: 'tohoku-med-health', name: '保健学科', deviationValue: 58 }
        ]
      },
      {
        id: 'tohoku-dent',
        name: '歯学部',
        departments: [
          { id: 'tohoku-dent-dent', name: '歯学科', deviationValue: 63 }
        ]
      },
      {
        id: 'tohoku-pharm',
        name: '薬学部',
        departments: [
          { id: 'tohoku-pharm-pharm', name: '薬学科', deviationValue: 65 },
          { id: 'tohoku-pharm-create', name: '創薬科学科', deviationValue: 64 }
        ]
      },
      {
        id: 'tohoku-eng',
        name: '工学部',
        departments: [
          { id: 'tohoku-eng-mech', name: '機械知能・航空工学科', deviationValue: 64 },
          { id: 'tohoku-eng-info', name: '電気情報物理工学科', deviationValue: 64 },
          { id: 'tohoku-eng-chem', name: '化学・バイオ工学科', deviationValue: 63 },
          { id: 'tohoku-eng-mat', name: '材料科学総合学科', deviationValue: 63 },
          { id: 'tohoku-eng-civil', name: '建築・社会環境工学科', deviationValue: 63 }
        ]
      },
      {
        id: 'tohoku-agr',
        name: '農学部',
        departments: [
          { id: 'tohoku-agr-bio', name: '生物生産科学科', deviationValue: 62 },
          { id: 'tohoku-agr-app', name: '応用生物化学科', deviationValue: 62 }
        ]
      }
    ]
  },

  // 宮城県 - 公立大学
  {
    id: 'miyagi',
    name: '宮城大学',
    type: '公立',
    prefecture: '宮城県',
    faculties: [
      {
        id: 'miyagi-nurs',
        name: '看護学群',
        departments: [
          { id: 'miyagi-nurs-nurs', name: '看護学類', deviationValue: 50 }
        ]
      },
      {
        id: 'miyagi-bus',
        name: '事業構想学群',
        departments: [
          { id: 'miyagi-bus-bus', name: '事業プランニング学類', deviationValue: 48 },
          { id: 'miyagi-bus-design', name: '地域創生学類', deviationValue: 47 },
          { id: 'miyagi-bus-value', name: '価値創造デザイン学類', deviationValue: 48 }
        ]
      },
      {
        id: 'miyagi-food',
        name: '食産業学群',
        departments: [
          { id: 'miyagi-food-food', name: '食資源開発学類', deviationValue: 47 },
          { id: 'miyagi-food-farm', name: 'フードマネジメント学類', deviationValue: 47 }
        ]
      }
    ]
  },

  // 宮城県 - 私立大学
  {
    id: 'tohoku-gakuin',
    name: '東北学院大学',
    type: '私立',
    prefecture: '宮城県',
    faculties: [
      {
        id: 'tgu-letters',
        name: '文学部',
        departments: [
          { id: 'tgu-letters-eng', name: '英文学科', deviationValue: 47 },
          { id: 'tgu-letters-comp', name: '総合人文学科', deviationValue: 47 },
          { id: 'tgu-letters-hist', name: '歴史学科', deviationValue: 48 },
          { id: 'tgu-letters-edu', name: '教育学科', deviationValue: 48 }
        ]
      },
      {
        id: 'tgu-econ',
        name: '経済学部',
        departments: [
          { id: 'tgu-econ-econ', name: '経済学科', deviationValue: 47 },
          { id: 'tgu-econ-comm', name: '共生社会経済学科', deviationValue: 46 }
        ]
      },
      {
        id: 'tgu-mgmt',
        name: '経営学部',
        departments: [
          { id: 'tgu-mgmt-mgmt', name: '経営学科', deviationValue: 47 }
        ]
      },
      {
        id: 'tgu-law',
        name: '法学部',
        departments: [
          { id: 'tgu-law-law', name: '法律学科', deviationValue: 47 }
        ]
      },
      {
        id: 'tgu-eng',
        name: '工学部',
        departments: [
          { id: 'tgu-eng-mech', name: '機械知能工学科', deviationValue: 44 },
          { id: 'tgu-eng-elec', name: '電気電子工学科', deviationValue: 44 },
          { id: 'tgu-eng-env', name: '環境建設工学科', deviationValue: 43 },
          { id: 'tgu-eng-info', name: '情報基盤工学科', deviationValue: 45 }
        ]
      },
      {
        id: 'tgu-liberal',
        name: '教養学部',
        departments: [
          { id: 'tgu-liberal-human', name: '人間科学科', deviationValue: 47 },
          { id: 'tgu-liberal-lang', name: '言語文化学科', deviationValue: 47 },
          { id: 'tgu-liberal-info', name: '情報科学科', deviationValue: 46 },
          { id: 'tgu-liberal-comm', name: '地域構想学科', deviationValue: 46 }
        ]
      }
    ]
  },

  // 秋田県
  {
    id: 'akita',
    name: '秋田大学',
    type: '国立',
    prefecture: '秋田県',
    faculties: [
      {
        id: 'akita-int',
        name: '国際資源学部',
        departments: [
          { id: 'akita-int-policy', name: '国際資源学科', deviationValue: 49 }
        ]
      },
      {
        id: 'akita-edu',
        name: '教育文化学部',
        departments: [
          { id: 'akita-edu-school', name: '学校教育課程', deviationValue: 50 },
          { id: 'akita-edu-comm', name: '地域文化学科', deviationValue: 49 }
        ]
      },
      {
        id: 'akita-med',
        name: '医学部',
        departments: [
          { id: 'akita-med-med', name: '医学科', deviationValue: 66 },
          { id: 'akita-med-health', name: '保健学科', deviationValue: 50 }
        ]
      },
      {
        id: 'akita-eng',
        name: '理工学部',
        departments: [
          { id: 'akita-eng-life', name: '生命科学科', deviationValue: 47 },
          { id: 'akita-eng-mat', name: '物質科学科', deviationValue: 47 },
          { id: 'akita-eng-math', name: '数理・電気電子情報学科', deviationValue: 47 },
          { id: 'akita-eng-sys', name: 'システムデザイン工学科', deviationValue: 47 }
        ]
      }
    ]
  },

  // 秋田県 - 公立大学
  {
    id: 'akita-pu',
    name: '秋田県立大学',
    type: '公立',
    prefecture: '秋田県',
    faculties: [
      {
        id: 'akita-pu-sys',
        name: 'システム科学技術学部',
        departments: [
          { id: 'akita-pu-sys-mech', name: '機械工学科', deviationValue: 46 },
          { id: 'akita-pu-sys-intel', name: '知能メカトロニクス学科', deviationValue: 46 },
          { id: 'akita-pu-sys-info', name: '情報工学科', deviationValue: 47 },
          { id: 'akita-pu-sys-arch', name: '建築環境システム学科', deviationValue: 46 },
          { id: 'akita-pu-sys-mgmt', name: '経営システム工学科', deviationValue: 45 }
        ]
      },
      {
        id: 'akita-pu-bio',
        name: '生物資源科学部',
        departments: [
          { id: 'akita-pu-bio-bio', name: '応用生物科学科', deviationValue: 47 },
          { id: 'akita-pu-bio-biotech', name: '生物生産科学科', deviationValue: 47 },
          { id: 'akita-pu-bio-env', name: '生物環境科学科', deviationValue: 46 },
          { id: 'akita-pu-bio-agri', name: 'アグリビジネス学科', deviationValue: 45 }
        ]
      }
    ]
  },
  {
    id: 'akita-art',
    name: '秋田公立美術大学',
    type: '公立',
    prefecture: '秋田県',
    faculties: [
      {
        id: 'akita-art-art',
        name: '美術学部',
        departments: [
          { id: 'akita-art-art-art', name: '美術学科', deviationValue: 48 }
        ]
      }
    ]
  },
  {
    id: 'aiu',
    name: '国際教養大学',
    type: '公立',
    prefecture: '秋田県',
    faculties: [
      {
        id: 'aiu-ila',
        name: '国際教養学部',
        departments: [
          { id: 'aiu-ila-gb', name: 'グローバル・ビジネス課程', deviationValue: 68 },
          { id: 'aiu-ila-gs', name: 'グローバル・スタディズ課程', deviationValue: 68 }
        ]
      }
    ]
  },

  // 山形県
  {
    id: 'yamagata',
    name: '山形大学',
    type: '国立',
    prefecture: '山形県',
    faculties: [
      {
        id: 'yamagata-hum',
        name: '人文社会科学部',
        departments: [
          { id: 'yamagata-hum-human', name: '人文社会科学科', deviationValue: 52 }
        ]
      },
      {
        id: 'yamagata-edu',
        name: '地域教育文化学部',
        departments: [
          { id: 'yamagata-edu-edu', name: '地域教育文化学科', deviationValue: 50 }
        ]
      },
      {
        id: 'yamagata-sci',
        name: '理学部',
        departments: [
          { id: 'yamagata-sci-sci', name: '理学科', deviationValue: 50 }
        ]
      },
      {
        id: 'yamagata-med',
        name: '医学部',
        departments: [
          { id: 'yamagata-med-med', name: '医学科', deviationValue: 66 },
          { id: 'yamagata-med-nurs', name: '看護学科', deviationValue: 50 }
        ]
      },
      {
        id: 'yamagata-eng',
        name: '工学部',
        departments: [
          { id: 'yamagata-eng-polymer', name: '高分子・有機材料工学科', deviationValue: 48 },
          { id: 'yamagata-eng-chem', name: '化学・バイオ工学科', deviationValue: 48 },
          { id: 'yamagata-eng-info', name: '情報・エレクトロニクス学科', deviationValue: 49 },
          { id: 'yamagata-eng-mech', name: '機械システム工学科', deviationValue: 48 },
          { id: 'yamagata-eng-arch', name: '建築・デザイン学科', deviationValue: 49 }
        ]
      },
      {
        id: 'yamagata-agr',
        name: '農学部',
        departments: [
          { id: 'yamagata-agr-food', name: '食料生命環境学科', deviationValue: 49 }
        ]
      }
    ]
  },

  // 山形県 - 公立大学
  {
    id: 'yamagata-health',
    name: '山形県立保健医療大学',
    type: '公立',
    prefecture: '山形県',
    faculties: [
      {
        id: 'yamagata-health-health',
        name: '保健医療学部',
        departments: [
          { id: 'yamagata-health-health-nurs', name: '看護学科', deviationValue: 49 },
          { id: 'yamagata-health-health-pt', name: '理学療法学科', deviationValue: 50 },
          { id: 'yamagata-health-health-ot', name: '作業療法学科', deviationValue: 49 }
        ]
      }
    ]
  },
  {
    id: 'yamagata-nutr',
    name: '山形県立米沢栄養大学',
    type: '公立',
    prefecture: '山形県',
    faculties: [
      {
        id: 'yamagata-nutr-health',
        name: '健康栄養学部',
        departments: [
          { id: 'yamagata-nutr-health-nutr', name: '健康栄養学科', deviationValue: 48 }
        ]
      }
    ]
  },

  // 福島県
  {
    id: 'fukushima',
    name: '福島大学',
    type: '国立',
    prefecture: '福島県',
    faculties: [
      {
        id: 'fukushima-hum',
        name: '人文社会学群',
        departments: [
          { id: 'fukushima-hum-human', name: '人間発達文化学類', deviationValue: 51 },
          { id: 'fukushima-hum-admin', name: '行政政策学類', deviationValue: 51 },
          { id: 'fukushima-hum-econ', name: '経済経営学類', deviationValue: 51 }
        ]
      },
      {
        id: 'fukushima-sci',
        name: '理工学群',
        departments: [
          { id: 'fukushima-sci-symb', name: '共生システム理工学類', deviationValue: 48 }
        ]
      },
      {
        id: 'fukushima-agr',
        name: '農学群',
        departments: [
          { id: 'fukushima-agr-food', name: '食農学類', deviationValue: 49 }
        ]
      }
    ]
  },

  // 福島県 - 公立大学
  {
    id: 'fukushima-med',
    name: '福島県立医科大学',
    type: '公立',
    prefecture: '福島県',
    faculties: [
      {
        id: 'fukushima-med-med',
        name: '医学部',
        departments: [
          { id: 'fukushima-med-med-med', name: '医学科', deviationValue: 65 }
        ]
      },
      {
        id: 'fukushima-med-nurs',
        name: '看護学部',
        departments: [
          { id: 'fukushima-med-nurs-nurs', name: '看護学科', deviationValue: 49 }
        ]
      },
      {
        id: 'fukushima-med-health',
        name: '保健科学部',
        departments: [
          { id: 'fukushima-med-health-pt', name: '理学療法学科', deviationValue: 50 },
          { id: 'fukushima-med-health-ot', name: '作業療法学科', deviationValue: 49 },
          { id: 'fukushima-med-health-diag', name: '診療放射線科学科', deviationValue: 50 },
          { id: 'fukushima-med-health-lab', name: '臨床検査学科', deviationValue: 50 }
        ]
      }
    ]
  },
  {
    id: 'aizu',
    name: '会津大学',
    type: '公立',
    prefecture: '福島県',
    faculties: [
      {
        id: 'aizu-comp',
        name: 'コンピュータ理工学部',
        departments: [
          { id: 'aizu-comp-comp', name: 'コンピュータ理工学科', deviationValue: 49 }
        ]
      }
    ]
  }
]