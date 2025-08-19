import { University } from './index'

export const chugokuShikokuUniversities: University[] = [
  // 広島県
  {
    id: 'hiroshima',
    name: '広島大学',
    type: '国立',
    prefecture: '広島県',
    faculties: [
      {
        id: 'hiroshima-integrated',
        name: '総合科学部',
        departments: [
          { id: 'hiroshima-integrated-comp', name: '総合科学科', deviationValue: 57 },
          { id: 'hiroshima-integrated-int', name: '国際共創学科', deviationValue: 58 }
        ]
      },
      {
        id: 'hiroshima-letters',
        name: '文学部',
        departments: [
          { id: 'hiroshima-letters-hum', name: '人文学科', deviationValue: 59 }
        ]
      },
      {
        id: 'hiroshima-edu',
        name: '教育学部',
        departments: [
          { id: 'hiroshima-edu-1', name: '第一類（学校教育系）', deviationValue: 57 },
          { id: 'hiroshima-edu-2', name: '第二類（科学文化教育系）', deviationValue: 56 },
          { id: 'hiroshima-edu-3', name: '第三類（言語文化教育系）', deviationValue: 57 },
          { id: 'hiroshima-edu-4', name: '第四類（生涯活動教育系）', deviationValue: 56 },
          { id: 'hiroshima-edu-5', name: '第五類（人間形成基礎系）', deviationValue: 57 }
        ]
      },
      {
        id: 'hiroshima-law',
        name: '法学部',
        departments: [
          { id: 'hiroshima-law-law', name: '法学科', deviationValue: 58 }
        ]
      },
      {
        id: 'hiroshima-econ',
        name: '経済学部',
        departments: [
          { id: 'hiroshima-econ-econ', name: '経済学科', deviationValue: 58 }
        ]
      },
      {
        id: 'hiroshima-sci',
        name: '理学部',
        departments: [
          { id: 'hiroshima-sci-math', name: '数学科', deviationValue: 56 },
          { id: 'hiroshima-sci-phys', name: '物理学科', deviationValue: 56 },
          { id: 'hiroshima-sci-chem', name: '化学科', deviationValue: 56 },
          { id: 'hiroshima-sci-bio', name: '生物科学科', deviationValue: 56 },
          { id: 'hiroshima-sci-earth', name: '地球惑星システム学科', deviationValue: 55 }
        ]
      },
      {
        id: 'hiroshima-med',
        name: '医学部',
        departments: [
          { id: 'hiroshima-med-med', name: '医学科', deviationValue: 68 },
          { id: 'hiroshima-med-health', name: '保健学科', deviationValue: 54 }
        ]
      },
      {
        id: 'hiroshima-dent',
        name: '歯学部',
        departments: [
          { id: 'hiroshima-dent-dent', name: '歯学科', deviationValue: 60 },
          { id: 'hiroshima-dent-oral', name: '口腔健康科学科', deviationValue: 52 }
        ]
      },
      {
        id: 'hiroshima-pharm',
        name: '薬学部',
        departments: [
          { id: 'hiroshima-pharm-pharm', name: '薬学科', deviationValue: 61 },
          { id: 'hiroshima-pharm-sci', name: '薬科学科', deviationValue: 59 }
        ]
      },
      {
        id: 'hiroshima-eng',
        name: '工学部',
        departments: [
          { id: 'hiroshima-eng-1', name: '第一類（機械・輸送・材料・エネルギー系）', deviationValue: 55 },
          { id: 'hiroshima-eng-2', name: '第二類（電気電子・システム情報系）', deviationValue: 56 },
          { id: 'hiroshima-eng-3', name: '第三類（応用化学・生物工学・化学工学系）', deviationValue: 55 },
          { id: 'hiroshima-eng-4', name: '第四類（建設・環境系）', deviationValue: 54 }
        ]
      },
      {
        id: 'hiroshima-bio',
        name: '生物生産学部',
        departments: [
          { id: 'hiroshima-bio-bio', name: '生物生産学科', deviationValue: 55 }
        ]
      },
      {
        id: 'hiroshima-info',
        name: '情報科学部',
        departments: [
          { id: 'hiroshima-info-info', name: '情報科学科', deviationValue: 56 }
        ]
      }
    ]
  },
  {
    id: 'prefectural-hiroshima',
    name: '県立広島大学',
    type: '公立',
    prefecture: '広島県',
    faculties: [
      {
        id: 'pref-hiroshima-regional',
        name: '地域創生学部',
        departments: [
          { id: 'pref-hiroshima-regional-create', name: '地域創生学科', deviationValue: 51 }
        ]
      },
      {
        id: 'pref-hiroshima-bio',
        name: '生物資源科学部',
        departments: [
          { id: 'pref-hiroshima-bio-regional', name: '地域資源開発学科', deviationValue: 49 },
          { id: 'pref-hiroshima-bio-life', name: '生命環境学科', deviationValue: 50 }
        ]
      },
      {
        id: 'pref-hiroshima-health',
        name: '保健福祉学部',
        departments: [
          { id: 'pref-hiroshima-health-nurs', name: '看護学科', deviationValue: 51 },
          { id: 'pref-hiroshima-health-pt', name: '理学療法学科', deviationValue: 52 },
          { id: 'pref-hiroshima-health-ot', name: '作業療法学科', deviationValue: 50 },
          { id: 'pref-hiroshima-health-comm', name: 'コミュニケーション障害学科', deviationValue: 49 },
          { id: 'pref-hiroshima-health-welfare', name: '人間福祉学科', deviationValue: 48 }
        ]
      }
    ]
  },
  {
    id: 'hiroshima-city',
    name: '広島市立大学',
    type: '公立',
    prefecture: '広島県',
    faculties: [
      {
        id: 'hcu-int',
        name: '国際学部',
        departments: [
          { id: 'hcu-int-int', name: '国際学科', deviationValue: 53 }
        ]
      },
      {
        id: 'hcu-info',
        name: '情報科学部',
        departments: [
          { id: 'hcu-info-info', name: '情報工学科', deviationValue: 51 },
          { id: 'hcu-info-intel', name: '知能工学科', deviationValue: 51 },
          { id: 'hcu-info-sys', name: 'システム工学科', deviationValue: 50 },
          { id: 'hcu-info-med', name: '医用情報科学科', deviationValue: 52 }
        ]
      },
      {
        id: 'hcu-arts',
        name: '芸術学部',
        departments: [
          { id: 'hcu-arts-art', name: '美術学科', deviationValue: 51 },
          { id: 'hcu-arts-design', name: 'デザイン工芸学科', deviationValue: 52 }
        ]
      }
    ]
  },
  {
    id: 'onomichi-city',
    name: '尾道市立大学',
    type: '公立',
    prefecture: '広島県',
    faculties: [
      {
        id: 'onomichi-econ',
        name: '経済情報学部',
        departments: [
          { id: 'onomichi-econ-econ', name: '経済情報学科', deviationValue: 48 }
        ]
      },
      {
        id: 'onomichi-arts',
        name: '芸術文化学部',
        departments: [
          { id: 'onomichi-arts-jpn', name: '日本文学科', deviationValue: 47 },
          { id: 'onomichi-arts-art', name: '美術学科', deviationValue: 48 }
        ]
      }
    ]
  },
  {
    id: 'fukuyama-city',
    name: '福山市立大学',
    type: '公立',
    prefecture: '広島県',
    faculties: [
      {
        id: 'fukuyama-edu',
        name: '教育学部',
        departments: [
          { id: 'fukuyama-edu-child', name: '児童教育学科', deviationValue: 49 }
        ]
      },
      {
        id: 'fukuyama-urban',
        name: '都市経営学部',
        departments: [
          { id: 'fukuyama-urban-mgmt', name: '都市経営学科', deviationValue: 48 }
        ]
      }
    ]
  },
  {
    id: 'hiroshima-shudo',
    name: '広島修道大学',
    type: '私立',
    prefecture: '広島県',
    faculties: [
      {
        id: 'shudo-com',
        name: '商学部',
        departments: [
          { id: 'shudo-com-com', name: '商学科', deviationValue: 47 },
          { id: 'shudo-com-mgmt', name: '経営学科', deviationValue: 47 }
        ]
      },
      {
        id: 'shudo-letters',
        name: '人文学部',
        departments: [
          { id: 'shudo-letters-edu', name: '教育学科', deviationValue: 47 },
          { id: 'shudo-letters-eng', name: '英語英文学科', deviationValue: 46 },
          { id: 'shudo-letters-human', name: '人間関係学科', deviationValue: 46 }
        ]
      },
      {
        id: 'shudo-law',
        name: '法学部',
        departments: [
          { id: 'shudo-law-law', name: '法律学科', deviationValue: 47 }
        ]
      },
      {
        id: 'shudo-econ',
        name: '経済科学部',
        departments: [
          { id: 'shudo-econ-mod', name: '現代経済学科', deviationValue: 46 },
          { id: 'shudo-econ-sys', name: '経済情報学科', deviationValue: 45 }
        ]
      },
      {
        id: 'shudo-human',
        name: '人間環境学部',
        departments: [
          { id: 'shudo-human-human', name: '人間環境学科', deviationValue: 45 }
        ]
      },
      {
        id: 'shudo-health',
        name: '健康科学部',
        departments: [
          { id: 'shudo-health-psy', name: '心理学科', deviationValue: 47 },
          { id: 'shudo-health-health', name: '健康栄養学科', deviationValue: 45 }
        ]
      },
      {
        id: 'shudo-global',
        name: '国際コミュニティ学部',
        departments: [
          { id: 'shudo-global-int', name: '国際政治学科', deviationValue: 46 },
          { id: 'shudo-global-comm', name: '地域行政学科', deviationValue: 45 }
        ]
      }
    ]
  },

  // 岡山県
  {
    id: 'okayama',
    name: '岡山大学',
    type: '国立',
    prefecture: '岡山県',
    faculties: [
      {
        id: 'okayama-letters',
        name: '文学部',
        departments: [
          { id: 'okayama-letters-hum', name: '人文学科', deviationValue: 58 }
        ]
      },
      {
        id: 'okayama-edu',
        name: '教育学部',
        departments: [
          { id: 'okayama-edu-school', name: '学校教育教員養成課程', deviationValue: 55 },
          { id: 'okayama-edu-nurse', name: '養護教諭養成課程', deviationValue: 53 }
        ]
      },
      {
        id: 'okayama-law',
        name: '法学部',
        departments: [
          { id: 'okayama-law-law', name: '法学科', deviationValue: 57 }
        ]
      },
      {
        id: 'okayama-econ',
        name: '経済学部',
        departments: [
          { id: 'okayama-econ-econ', name: '経済学科', deviationValue: 57 }
        ]
      },
      {
        id: 'okayama-sci',
        name: '理学部',
        departments: [
          { id: 'okayama-sci-math', name: '数学科', deviationValue: 54 },
          { id: 'okayama-sci-phys', name: '物理学科', deviationValue: 54 },
          { id: 'okayama-sci-chem', name: '化学科', deviationValue: 54 },
          { id: 'okayama-sci-bio', name: '生物学科', deviationValue: 54 },
          { id: 'okayama-sci-earth', name: '地球科学科', deviationValue: 53 }
        ]
      },
      {
        id: 'okayama-med',
        name: '医学部',
        departments: [
          { id: 'okayama-med-med', name: '医学科', deviationValue: 68 },
          { id: 'okayama-med-health', name: '保健学科', deviationValue: 53 }
        ]
      },
      {
        id: 'okayama-dent',
        name: '歯学部',
        departments: [
          { id: 'okayama-dent-dent', name: '歯学科', deviationValue: 60 }
        ]
      },
      {
        id: 'okayama-pharm',
        name: '薬学部',
        departments: [
          { id: 'okayama-pharm-pharm', name: '薬学科', deviationValue: 61 },
          { id: 'okayama-pharm-create', name: '創薬科学科', deviationValue: 58 }
        ]
      },
      {
        id: 'okayama-eng',
        name: '工学部',
        departments: [
          { id: 'okayama-eng-mech', name: '機械システム系学科', deviationValue: 54 },
          { id: 'okayama-eng-elec', name: '電気通信系学科', deviationValue: 54 },
          { id: 'okayama-eng-info', name: '情報系学科', deviationValue: 55 },
          { id: 'okayama-eng-chem', name: '化学生命系学科', deviationValue: 53 }
        ]
      },
      {
        id: 'okayama-env',
        name: '環境理工学部',
        departments: [
          { id: 'okayama-env-math', name: '環境数理学科', deviationValue: 52 },
          { id: 'okayama-env-design', name: '環境デザイン工学科', deviationValue: 52 },
          { id: 'okayama-env-manage', name: '環境管理工学科', deviationValue: 52 },
          { id: 'okayama-env-mat', name: '環境物質工学科', deviationValue: 52 }
        ]
      },
      {
        id: 'okayama-agr',
        name: '農学部',
        departments: [
          { id: 'okayama-agr-agr', name: '総合農業科学科', deviationValue: 54 }
        ]
      }
    ]
  },
  {
    id: 'okayama-pref',
    name: '岡山県立大学',
    type: '公立',
    prefecture: '岡山県',
    faculties: [
      {
        id: 'opu-health',
        name: '保健福祉学部',
        departments: [
          { id: 'opu-health-nurs', name: '看護学科', deviationValue: 50 },
          { id: 'opu-health-nutrition', name: '栄養学科', deviationValue: 49 },
          { id: 'opu-health-welfare', name: '保健福祉学科', deviationValue: 48 }
        ]
      },
      {
        id: 'opu-info',
        name: '情報工学部',
        departments: [
          { id: 'opu-info-info', name: '情報通信工学科', deviationValue: 48 },
          { id: 'opu-info-sys', name: '情報システム工学科', deviationValue: 48 },
          { id: 'opu-info-human', name: '人間情報工学科', deviationValue: 47 }
        ]
      },
      {
        id: 'opu-design',
        name: 'デザイン学部',
        departments: [
          { id: 'opu-design-design', name: 'デザイン工学科', deviationValue: 49 },
          { id: 'opu-design-form', name: '造形デザイン学科', deviationValue: 49 }
        ]
      }
    ]
  },
  {
    id: 'niimi',
    name: '新見公立大学',
    type: '公立',
    prefecture: '岡山県',
    faculties: [
      {
        id: 'niimi-health',
        name: '健康科学部',
        departments: [
          { id: 'niimi-health-nurs', name: '看護学科', deviationValue: 46 },
          { id: 'niimi-health-child', name: '健康保育学科', deviationValue: 45 },
          { id: 'niimi-health-local', name: '地域福祉学科', deviationValue: 44 }
        ]
      }
    ]
  },
  {
    id: 'notre-dame',
    name: 'ノートルダム清心女子大学',
    type: '私立',
    prefecture: '岡山県',
    faculties: [
      {
        id: 'ndsu-letters',
        name: '文学部',
        departments: [
          { id: 'ndsu-letters-eng', name: '英語英文学科', deviationValue: 48 },
          { id: 'ndsu-letters-jpn', name: '日本語日本文学科', deviationValue: 48 },
          { id: 'ndsu-letters-mod', name: '現代社会学科', deviationValue: 48 }
        ]
      },
      {
        id: 'ndsu-human',
        name: '人間生活学部',
        departments: [
          { id: 'ndsu-human-life', name: '人間生活学科', deviationValue: 47 },
          { id: 'ndsu-human-child', name: '児童学科', deviationValue: 47 },
          { id: 'ndsu-human-food', name: '食品栄養学科', deviationValue: 48 }
        ]
      }
    ]
  },

  // 山口県
  {
    id: 'yamaguchi',
    name: '山口大学',
    type: '国立',
    prefecture: '山口県',
    faculties: [
      {
        id: 'yamaguchi-hum',
        name: '人文学部',
        departments: [
          { id: 'yamaguchi-hum-hum', name: '人文学科', deviationValue: 53 }
        ]
      },
      {
        id: 'yamaguchi-edu',
        name: '教育学部',
        departments: [
          { id: 'yamaguchi-edu-school', name: '学校教育教員養成課程', deviationValue: 51 }
        ]
      },
      {
        id: 'yamaguchi-econ',
        name: '経済学部',
        departments: [
          { id: 'yamaguchi-econ-econ', name: '経済学科', deviationValue: 52 },
          { id: 'yamaguchi-econ-mgmt', name: '経営学科', deviationValue: 52 },
          { id: 'yamaguchi-econ-int', name: '国際経済学科', deviationValue: 51 },
          { id: 'yamaguchi-econ-law', name: '経済法学科', deviationValue: 51 },
          { id: 'yamaguchi-econ-tour', name: '観光政策学科', deviationValue: 51 }
        ]
      },
      {
        id: 'yamaguchi-sci',
        name: '理学部',
        departments: [
          { id: 'yamaguchi-sci-math', name: '数理科学科', deviationValue: 50 },
          { id: 'yamaguchi-sci-phys', name: '物理・情報科学科', deviationValue: 50 },
          { id: 'yamaguchi-sci-bio', name: '生物・化学科', deviationValue: 50 },
          { id: 'yamaguchi-sci-earth', name: '地球圏システム科学科', deviationValue: 49 }
        ]
      },
      {
        id: 'yamaguchi-med',
        name: '医学部',
        departments: [
          { id: 'yamaguchi-med-med', name: '医学科', deviationValue: 66 },
          { id: 'yamaguchi-med-health', name: '保健学科', deviationValue: 50 }
        ]
      },
      {
        id: 'yamaguchi-eng',
        name: '工学部',
        departments: [
          { id: 'yamaguchi-eng-mech', name: '機械工学科', deviationValue: 49 },
          { id: 'yamaguchi-eng-social', name: '社会建設工学科', deviationValue: 48 },
          { id: 'yamaguchi-eng-chem', name: '応用化学科', deviationValue: 49 },
          { id: 'yamaguchi-eng-elec', name: '電気電子工学科', deviationValue: 49 },
          { id: 'yamaguchi-eng-info', name: '知能情報工学科', deviationValue: 50 },
          { id: 'yamaguchi-eng-sense', name: '感性デザイン工学科', deviationValue: 49 },
          { id: 'yamaguchi-eng-circular', name: '循環環境工学科', deviationValue: 48 }
        ]
      },
      {
        id: 'yamaguchi-agr',
        name: '農学部',
        departments: [
          { id: 'yamaguchi-agr-bio', name: '生物資源環境科学科', deviationValue: 50 },
          { id: 'yamaguchi-agr-func', name: '生物機能科学科', deviationValue: 50 }
        ]
      },
      {
        id: 'yamaguchi-vet',
        name: '共同獣医学部',
        departments: [
          { id: 'yamaguchi-vet-vet', name: '獣医学科', deviationValue: 64 }
        ]
      },
      {
        id: 'yamaguchi-int',
        name: '国際総合科学部',
        departments: [
          { id: 'yamaguchi-int-int', name: '国際総合科学科', deviationValue: 52 }
        ]
      }
    ]
  },
  {
    id: 'yamaguchi-pref',
    name: '山口県立大学',
    type: '公立',
    prefecture: '山口県',
    faculties: [
      {
        id: 'ypu-int',
        name: '国際文化学部',
        departments: [
          { id: 'ypu-int-int', name: '国際文化学科', deviationValue: 50 },
          { id: 'ypu-int-culture', name: '文化創造学科', deviationValue: 48 }
        ]
      },
      {
        id: 'ypu-social',
        name: '社会福祉学部',
        departments: [
          { id: 'ypu-social-welfare', name: '社会福祉学科', deviationValue: 48 }
        ]
      },
      {
        id: 'ypu-nurs',
        name: '看護栄養学部',
        departments: [
          { id: 'ypu-nurs-nurs', name: '看護学科', deviationValue: 50 },
          { id: 'ypu-nurs-nutrition', name: '栄養学科', deviationValue: 49 }
        ]
      }
    ]
  },
  {
    id: 'shimonoseki-city',
    name: '下関市立大学',
    type: '公立',
    prefecture: '山口県',
    faculties: [
      {
        id: 'scu-econ',
        name: '経済学部',
        departments: [
          { id: 'scu-econ-econ', name: '経済学科', deviationValue: 48 },
          { id: 'scu-econ-int', name: '国際商学科', deviationValue: 48 },
          { id: 'scu-econ-public', name: '公共マネジメント学科', deviationValue: 47 }
        ]
      }
    ]
  },
  {
    id: 'sanyo-onoda',
    name: '山陽小野田市立山口東京理科大学',
    type: '公立',
    prefecture: '山口県',
    faculties: [
      {
        id: 'socu-eng',
        name: '工学部',
        departments: [
          { id: 'socu-eng-mech', name: '機械工学科', deviationValue: 46 },
          { id: 'socu-eng-elec', name: '電気工学科', deviationValue: 46 },
          { id: 'socu-eng-chem', name: '応用化学科', deviationValue: 46 }
        ]
      },
      {
        id: 'socu-pharm',
        name: '薬学部',
        departments: [
          { id: 'socu-pharm-pharm', name: '薬学科', deviationValue: 52 }
        ]
      }
    ]
  },

  // 鳥取県
  {
    id: 'tottori',
    name: '鳥取大学',
    type: '国立',
    prefecture: '鳥取県',
    faculties: [
      {
        id: 'tottori-regional',
        name: '地域学部',
        departments: [
          { id: 'tottori-regional-regional', name: '地域学科', deviationValue: 50 }
        ]
      },
      {
        id: 'tottori-med',
        name: '医学部',
        departments: [
          { id: 'tottori-med-med', name: '医学科', deviationValue: 66 },
          { id: 'tottori-med-health', name: '保健学科', deviationValue: 49 },
          { id: 'tottori-med-life', name: '生命科学科', deviationValue: 48 }
        ]
      },
      {
        id: 'tottori-eng',
        name: '工学部',
        departments: [
          { id: 'tottori-eng-mech', name: '機械物理系学科', deviationValue: 47 },
          { id: 'tottori-eng-elec', name: '電気情報系学科', deviationValue: 48 },
          { id: 'tottori-eng-chem', name: '化学バイオ系学科', deviationValue: 47 },
          { id: 'tottori-eng-social', name: '社会システム土木系学科', deviationValue: 47 }
        ]
      },
      {
        id: 'tottori-agr',
        name: '農学部',
        departments: [
          { id: 'tottori-agr-life', name: '生命環境農学科', deviationValue: 49 },
          { id: 'tottori-agr-vet', name: '共同獣医学科', deviationValue: 63 }
        ]
      }
    ]
  },
  {
    id: 'tottori-env',
    name: '公立鳥取環境大学',
    type: '公立',
    prefecture: '鳥取県',
    faculties: [
      {
        id: 'kues-env',
        name: '環境学部',
        departments: [
          { id: 'kues-env-env', name: '環境学科', deviationValue: 47 }
        ]
      },
      {
        id: 'kues-mgmt',
        name: '経営学部',
        departments: [
          { id: 'kues-mgmt-mgmt', name: '経営学科', deviationValue: 48 }
        ]
      }
    ]
  },

  // 島根県
  {
    id: 'shimane',
    name: '島根大学',
    type: '国立',
    prefecture: '島根県',
    faculties: [
      {
        id: 'shimane-law',
        name: '法文学部',
        departments: [
          { id: 'shimane-law-law', name: '法経学科', deviationValue: 50 },
          { id: 'shimane-law-social', name: '社会文化学科', deviationValue: 50 },
          { id: 'shimane-law-lang', name: '言語文化学科', deviationValue: 50 }
        ]
      },
      {
        id: 'shimane-edu',
        name: '教育学部',
        departments: [
          { id: 'shimane-edu-school', name: '学校教育課程', deviationValue: 49 }
        ]
      },
      {
        id: 'shimane-med',
        name: '医学部',
        departments: [
          { id: 'shimane-med-med', name: '医学科', deviationValue: 66 },
          { id: 'shimane-med-nurs', name: '看護学科', deviationValue: 48 }
        ]
      },
      {
        id: 'shimane-sci',
        name: '総合理工学部',
        departments: [
          { id: 'shimane-sci-mat', name: '物質科学科', deviationValue: 47 },
          { id: 'shimane-sci-earth', name: '地球科学科', deviationValue: 47 },
          { id: 'shimane-sci-math', name: '数理科学科', deviationValue: 47 },
          { id: 'shimane-sci-intel', name: '知能情報デザイン学科', deviationValue: 48 },
          { id: 'shimane-sci-mech', name: '機械・電気電子工学科', deviationValue: 47 },
          { id: 'shimane-sci-arch', name: '建築デザイン学科', deviationValue: 48 }
        ]
      },
      {
        id: 'shimane-bio',
        name: '生物資源科学部',
        departments: [
          { id: 'shimane-bio-life', name: '生命科学科', deviationValue: 48 },
          { id: 'shimane-bio-agr', name: '農林生産学科', deviationValue: 48 },
          { id: 'shimane-bio-env', name: '環境共生科学科', deviationValue: 48 }
        ]
      },
      {
        id: 'shimane-human',
        name: '人間科学部',
        departments: [
          { id: 'shimane-human-human', name: '人間科学科', deviationValue: 49 }
        ]
      }
    ]
  },
  {
    id: 'shimane-pref',
    name: '島根県立大学',
    type: '公立',
    prefecture: '島根県',
    faculties: [
      {
        id: 'u-shimane-policy',
        name: '総合政策学部',
        departments: [
          { id: 'u-shimane-policy-policy', name: '総合政策学科', deviationValue: 48 }
        ]
      },
      {
        id: 'u-shimane-nurs',
        name: '看護栄養学部',
        departments: [
          { id: 'u-shimane-nurs-nurs', name: '看護学科', deviationValue: 47 },
          { id: 'u-shimane-nurs-nutrition', name: '健康栄養学科', deviationValue: 46 }
        ]
      },
      {
        id: 'u-shimane-human',
        name: '人間文化学部',
        departments: [
          { id: 'u-shimane-human-child', name: '保育教育学科', deviationValue: 45 },
          { id: 'u-shimane-human-culture', name: '地域文化学科', deviationValue: 45 }
        ]
      }
    ]
  },

  // 徳島県
  {
    id: 'tokushima',
    name: '徳島大学',
    type: '国立',
    prefecture: '徳島県',
    faculties: [
      {
        id: 'tokushima-integrated',
        name: '総合科学部',
        departments: [
          { id: 'tokushima-integrated-social', name: '社会総合科学科', deviationValue: 51 }
        ]
      },
      {
        id: 'tokushima-med',
        name: '医学部',
        departments: [
          { id: 'tokushima-med-med', name: '医学科', deviationValue: 66 },
          { id: 'tokushima-med-nutrition', name: '医科栄養学科', deviationValue: 51 },
          { id: 'tokushima-med-health', name: '保健学科', deviationValue: 50 }
        ]
      },
      {
        id: 'tokushima-dent',
        name: '歯学部',
        departments: [
          { id: 'tokushima-dent-dent', name: '歯学科', deviationValue: 57 },
          { id: 'tokushima-dent-oral', name: '口腔保健学科', deviationValue: 48 }
        ]
      },
      {
        id: 'tokushima-pharm',
        name: '薬学部',
        departments: [
          { id: 'tokushima-pharm-pharm', name: '薬学科', deviationValue: 58 },
          { id: 'tokushima-pharm-create', name: '創製薬科学科', deviationValue: 56 }
        ]
      },
      {
        id: 'tokushima-sci',
        name: '理工学部',
        departments: [
          { id: 'tokushima-sci-sci', name: '理工学科', deviationValue: 48 }
        ]
      },
      {
        id: 'tokushima-bio',
        name: '生物資源産業学部',
        departments: [
          { id: 'tokushima-bio-bio', name: '生物資源産業学科', deviationValue: 48 }
        ]
      }
    ]
  },

  // 香川県
  {
    id: 'kagawa',
    name: '香川大学',
    type: '国立',
    prefecture: '香川県',
    faculties: [
      {
        id: 'kagawa-edu',
        name: '教育学部',
        departments: [
          { id: 'kagawa-edu-school', name: '学校教育教員養成課程', deviationValue: 51 }
        ]
      },
      {
        id: 'kagawa-law',
        name: '法学部',
        departments: [
          { id: 'kagawa-law-law', name: '法学科', deviationValue: 52 }
        ]
      },
      {
        id: 'kagawa-econ',
        name: '経済学部',
        departments: [
          { id: 'kagawa-econ-econ', name: '経済学科', deviationValue: 52 }
        ]
      },
      {
        id: 'kagawa-med',
        name: '医学部',
        departments: [
          { id: 'kagawa-med-med', name: '医学科', deviationValue: 66 },
          { id: 'kagawa-med-nurs', name: '看護学科', deviationValue: 49 },
          { id: 'kagawa-med-clinical', name: '臨床心理学科', deviationValue: 52 }
        ]
      },
      {
        id: 'kagawa-create',
        name: '創造工学部',
        departments: [
          { id: 'kagawa-create-create', name: '創造工学科', deviationValue: 49 }
        ]
      },
      {
        id: 'kagawa-agr',
        name: '農学部',
        departments: [
          { id: 'kagawa-agr-app', name: '応用生物科学科', deviationValue: 50 }
        ]
      }
    ]
  },
  {
    id: 'kagawa-pref-health',
    name: '香川県立保健医療大学',
    type: '公立',
    prefecture: '香川県',
    faculties: [
      {
        id: 'kpu-health',
        name: '保健医療学部',
        departments: [
          { id: 'kpu-health-nurs', name: '看護学科', deviationValue: 49 },
          { id: 'kpu-health-clinical', name: '臨床検査学科', deviationValue: 48 }
        ]
      }
    ]
  },

  // 愛媛県
  {
    id: 'ehime',
    name: '愛媛大学',
    type: '国立',
    prefecture: '愛媛県',
    faculties: [
      {
        id: 'ehime-law',
        name: '法文学部',
        departments: [
          { id: 'ehime-law-human', name: '人文社会学科', deviationValue: 52 }
        ]
      },
      {
        id: 'ehime-edu',
        name: '教育学部',
        departments: [
          { id: 'ehime-edu-school', name: '学校教育教員養成課程', deviationValue: 50 }
        ]
      },
      {
        id: 'ehime-social',
        name: '社会共創学部',
        departments: [
          { id: 'ehime-social-prod', name: '産業マネジメント学科', deviationValue: 49 },
          { id: 'ehime-social-innovation', name: '産業イノベーション学科', deviationValue: 48 },
          { id: 'ehime-social-env', name: '環境デザイン学科', deviationValue: 48 },
          { id: 'ehime-social-region', name: '地域資源マネジメント学科', deviationValue: 48 }
        ]
      },
      {
        id: 'ehime-sci',
        name: '理学部',
        departments: [
          { id: 'ehime-sci-math', name: '数学科', deviationValue: 49 },
          { id: 'ehime-sci-phys', name: '物理学科', deviationValue: 49 },
          { id: 'ehime-sci-chem', name: '化学科', deviationValue: 49 },
          { id: 'ehime-sci-bio', name: '生物学科', deviationValue: 49 },
          { id: 'ehime-sci-earth', name: '地球科学科', deviationValue: 48 }
        ]
      },
      {
        id: 'ehime-med',
        name: '医学部',
        departments: [
          { id: 'ehime-med-med', name: '医学科', deviationValue: 66 },
          { id: 'ehime-med-nurs', name: '看護学科', deviationValue: 49 }
        ]
      },
      {
        id: 'ehime-eng',
        name: '工学部',
        departments: [
          { id: 'ehime-eng-mech', name: '機械工学科', deviationValue: 49 },
          { id: 'ehime-eng-elec', name: '電気電子工学科', deviationValue: 49 },
          { id: 'ehime-eng-func', name: '応用化学科', deviationValue: 49 },
          { id: 'ehime-eng-mat', name: '材料デザイン工学科', deviationValue: 48 },
          { id: 'ehime-eng-civil', name: '土木工学科', deviationValue: 48 },
          { id: 'ehime-eng-info', name: 'コンピュータ科学科', deviationValue: 50 }
        ]
      },
      {
        id: 'ehime-agr',
        name: '農学部',
        departments: [
          { id: 'ehime-agr-food', name: '食料生産学科', deviationValue: 49 },
          { id: 'ehime-agr-life', name: '生命機能学科', deviationValue: 49 },
          { id: 'ehime-agr-env', name: '生物環境学科', deviationValue: 49 }
        ]
      }
    ]
  },
  {
    id: 'ehime-pref-health',
    name: '愛媛県立医療技術大学',
    type: '公立',
    prefecture: '愛媛県',
    faculties: [
      {
        id: 'epu-health',
        name: '保健科学部',
        departments: [
          { id: 'epu-health-nurs', name: '看護学科', deviationValue: 49 },
          { id: 'epu-health-clinical', name: '臨床検査学科', deviationValue: 48 }
        ]
      }
    ]
  },
  {
    id: 'matsuyama',
    name: '松山大学',
    type: '私立',
    prefecture: '愛媛県',
    faculties: [
      {
        id: 'matsuyama-econ',
        name: '経済学部',
        departments: [
          { id: 'matsuyama-econ-econ', name: '経済学科', deviationValue: 45 }
        ]
      },
      {
        id: 'matsuyama-mgmt',
        name: '経営学部',
        departments: [
          { id: 'matsuyama-mgmt-mgmt', name: '経営学科', deviationValue: 45 }
        ]
      },
      {
        id: 'matsuyama-human',
        name: '人文学部',
        departments: [
          { id: 'matsuyama-human-eng', name: '英語英米文学科', deviationValue: 44 },
          { id: 'matsuyama-human-soc', name: '社会学科', deviationValue: 44 }
        ]
      },
      {
        id: 'matsuyama-law',
        name: '法学部',
        departments: [
          { id: 'matsuyama-law-law', name: '法学科', deviationValue: 44 }
        ]
      },
      {
        id: 'matsuyama-pharm',
        name: '薬学部',
        departments: [
          { id: 'matsuyama-pharm-pharm', name: '医療薬学科', deviationValue: 48 }
        ]
      }
    ]
  },

  // 高知県
  {
    id: 'kochi',
    name: '高知大学',
    type: '国立',
    prefecture: '高知県',
    faculties: [
      {
        id: 'kochi-hum',
        name: '人文社会科学部',
        departments: [
          { id: 'kochi-hum-human', name: '人文社会科学科', deviationValue: 50 }
        ]
      },
      {
        id: 'kochi-edu',
        name: '教育学部',
        departments: [
          { id: 'kochi-edu-school', name: '学校教育教員養成課程', deviationValue: 49 }
        ]
      },
      {
        id: 'kochi-sci',
        name: '理工学部',
        departments: [
          { id: 'kochi-sci-math', name: '数学物理学科', deviationValue: 48 },
          { id: 'kochi-sci-info', name: '情報科学科', deviationValue: 49 },
          { id: 'kochi-sci-bio', name: '生物科学科', deviationValue: 48 },
          { id: 'kochi-sci-chem', name: '化学生命理工学科', deviationValue: 48 },
          { id: 'kochi-sci-earth', name: '地球環境防災学科', deviationValue: 47 }
        ]
      },
      {
        id: 'kochi-med',
        name: '医学部',
        departments: [
          { id: 'kochi-med-med', name: '医学科', deviationValue: 66 },
          { id: 'kochi-med-nurs', name: '看護学科', deviationValue: 48 }
        ]
      },
      {
        id: 'kochi-agr',
        name: '農林海洋科学部',
        departments: [
          { id: 'kochi-agr-agr', name: '農林資源環境科学科', deviationValue: 48 },
          { id: 'kochi-agr-agri', name: '農芸化学科', deviationValue: 48 },
          { id: 'kochi-agr-marine', name: '海洋資源科学科', deviationValue: 49 }
        ]
      },
      {
        id: 'kochi-regional',
        name: '地域協働学部',
        departments: [
          { id: 'kochi-regional-regional', name: '地域協働学科', deviationValue: 48 }
        ]
      }
    ]
  },
  {
    id: 'kochi-pref',
    name: '高知県立大学',
    type: '公立',
    prefecture: '高知県',
    faculties: [
      {
        id: 'uok-culture',
        name: '文化学部',
        departments: [
          { id: 'uok-culture-culture', name: '文化学科', deviationValue: 48 }
        ]
      },
      {
        id: 'uok-nurs',
        name: '看護学部',
        departments: [
          { id: 'uok-nurs-nurs', name: '看護学科', deviationValue: 50 }
        ]
      },
      {
        id: 'uok-social',
        name: '社会福祉学部',
        departments: [
          { id: 'uok-social-welfare', name: '社会福祉学科', deviationValue: 47 }
        ]
      },
      {
        id: 'uok-health',
        name: '健康栄養学部',
        departments: [
          { id: 'uok-health-nutrition', name: '健康栄養学科', deviationValue: 48 }
        ]
      }
    ]
  },
  {
    id: 'kochi-tech',
    name: '高知工科大学',
    type: '公立',
    prefecture: '高知県',
    faculties: [
      {
        id: 'kut-sys',
        name: 'システム工学群',
        departments: [
          { id: 'kut-sys-sys', name: 'システム工学群', deviationValue: 49 }
        ]
      },
      {
        id: 'kut-env',
        name: '環境理工学群',
        departments: [
          { id: 'kut-env-env', name: '環境理工学群', deviationValue: 48 }
        ]
      },
      {
        id: 'kut-info',
        name: '情報学群',
        departments: [
          { id: 'kut-info-info', name: '情報学群', deviationValue: 50 }
        ]
      },
      {
        id: 'kut-econ',
        name: '経済・マネジメント学群',
        departments: [
          { id: 'kut-econ-econ', name: '経済・マネジメント学群', deviationValue: 49 }
        ]
      },
      {
        id: 'kut-data',
        name: 'データ＆イノベーション学群',
        departments: [
          { id: 'kut-data-data', name: 'データ＆イノベーション学群', deviationValue: 50 }
        ]
      }
    ]
  }
]