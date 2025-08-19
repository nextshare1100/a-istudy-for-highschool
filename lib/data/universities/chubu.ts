import { University } from './index'

export const chubuUniversities: University[] = [
  // 愛知県
  {
    id: 'nagoya',
    name: '名古屋大学',
    type: '国立',
    prefecture: '愛知県',
    faculties: [
      {
        id: 'nagoya-letters',
        name: '文学部',
        departments: [
          { id: 'nagoya-letters-hum', name: '人文学科', deviationValue: 65 }
        ]
      },
      {
        id: 'nagoya-edu',
        name: '教育学部',
        departments: [
          { id: 'nagoya-edu-human', name: '人間発達科学科', deviationValue: 64 }
        ]
      },
      {
        id: 'nagoya-law',
        name: '法学部',
        departments: [
          { id: 'nagoya-law-law', name: '法律・政治学科', deviationValue: 65 }
        ]
      },
      {
        id: 'nagoya-econ',
        name: '経済学部',
        departments: [
          { id: 'nagoya-econ-econ', name: '経済学科', deviationValue: 65 },
          { id: 'nagoya-econ-mgmt', name: '経営学科', deviationValue: 65 }
        ]
      },
      {
        id: 'nagoya-info',
        name: '情報学部',
        departments: [
          { id: 'nagoya-info-nat', name: '自然情報学科', deviationValue: 63 },
          { id: 'nagoya-info-human', name: '人間・社会情報学科', deviationValue: 64 },
          { id: 'nagoya-info-comp', name: 'コンピュータ科学科', deviationValue: 64 }
        ]
      },
      {
        id: 'nagoya-sci',
        name: '理学部',
        departments: [
          { id: 'nagoya-sci-math', name: '数理学科', deviationValue: 62 },
          { id: 'nagoya-sci-phys', name: '物理学科', deviationValue: 62 },
          { id: 'nagoya-sci-chem', name: '化学科', deviationValue: 62 },
          { id: 'nagoya-sci-bio', name: '生命理学科', deviationValue: 62 },
          { id: 'nagoya-sci-earth', name: '地球惑星科学科', deviationValue: 61 }
        ]
      },
      {
        id: 'nagoya-med',
        name: '医学部',
        departments: [
          { id: 'nagoya-med-med', name: '医学科', deviationValue: 72 },
          { id: 'nagoya-med-health', name: '保健学科', deviationValue: 58 }
        ]
      },
      {
        id: 'nagoya-eng',
        name: '工学部',
        departments: [
          { id: 'nagoya-eng-chem', name: '化学生命工学科', deviationValue: 63 },
          { id: 'nagoya-eng-phys', name: '物理工学科', deviationValue: 63 },
          { id: 'nagoya-eng-mat', name: 'マテリアル工学科', deviationValue: 62 },
          { id: 'nagoya-eng-elec', name: '電気電子情報工学科', deviationValue: 63 },
          { id: 'nagoya-eng-mech', name: '機械・航空宇宙工学科', deviationValue: 64 },
          { id: 'nagoya-eng-energy', name: 'エネルギー理工学科', deviationValue: 62 },
          { id: 'nagoya-eng-env', name: '環境土木・建築学科', deviationValue: 62 }
        ]
      },
      {
        id: 'nagoya-agr',
        name: '農学部',
        departments: [
          { id: 'nagoya-agr-bio', name: '生物環境科学科', deviationValue: 62 },
          { id: 'nagoya-agr-resource', name: '資源生物科学科', deviationValue: 62 },
          { id: 'nagoya-agr-app', name: '応用生命科学科', deviationValue: 63 }
        ]
      }
    ]
  },
  {
    id: 'nagoya-tech',
    name: '名古屋工業大学',
    type: '国立',
    prefecture: '愛知県',
    faculties: [
      {
        id: 'nitech-eng',
        name: '工学部',
        departments: [
          { id: 'nitech-eng-life', name: '生命・応用化学科', deviationValue: 58 },
          { id: 'nitech-eng-phys', name: '物理工学科', deviationValue: 58 },
          { id: 'nitech-eng-elec', name: '電気・機械工学科', deviationValue: 59 },
          { id: 'nitech-eng-info', name: '情報工学科', deviationValue: 60 },
          { id: 'nitech-eng-social', name: '社会工学科', deviationValue: 58 },
          { id: 'nitech-eng-create', name: '創造工学教育課程', deviationValue: 59 }
        ]
      }
    ]
  },
  {
    id: 'aichi-pref',
    name: '愛知県立大学',
    type: '公立',
    prefecture: '愛知県',
    faculties: [
      {
        id: 'aichi-pref-foreign',
        name: '外国語学部',
        departments: [
          { id: 'aichi-pref-foreign-eng', name: '英米学科', deviationValue: 55 },
          { id: 'aichi-pref-foreign-eur', name: 'ヨーロッパ学科', deviationValue: 54 },
          { id: 'aichi-pref-foreign-chin', name: '中国学科', deviationValue: 52 },
          { id: 'aichi-pref-foreign-int', name: '国際関係学科', deviationValue: 54 }
        ]
      },
      {
        id: 'aichi-pref-jpn',
        name: '日本文化学部',
        departments: [
          { id: 'aichi-pref-jpn-lit', name: '国語国文学科', deviationValue: 53 },
          { id: 'aichi-pref-jpn-hist', name: '歴史文化学科', deviationValue: 53 }
        ]
      },
      {
        id: 'aichi-pref-edu',
        name: '教育福祉学部',
        departments: [
          { id: 'aichi-pref-edu-edu', name: '教育発達学科', deviationValue: 53 },
          { id: 'aichi-pref-edu-wel', name: '社会福祉学科', deviationValue: 52 }
        ]
      },
      {
        id: 'aichi-pref-nurs',
        name: '看護学部',
        departments: [
          { id: 'aichi-pref-nurs-nurs', name: '看護学科', deviationValue: 53 }
        ]
      },
      {
        id: 'aichi-pref-info',
        name: '情報科学部',
        departments: [
          { id: 'aichi-pref-info-info', name: '情報科学科', deviationValue: 52 }
        ]
      }
    ]
  },
  {
    id: 'aichi-arts',
    name: '愛知県立芸術大学',
    type: '公立',
    prefecture: '愛知県',
    faculties: [
      {
        id: 'aichi-arts-fine',
        name: '美術学部',
        departments: [
          { id: 'aichi-arts-fine-jpn', name: '日本画専攻', deviationValue: 52 },
          { id: 'aichi-arts-fine-oil', name: '油画専攻', deviationValue: 52 },
          { id: 'aichi-arts-fine-sculp', name: '彫刻専攻', deviationValue: 50 },
          { id: 'aichi-arts-fine-craft', name: '芸術学専攻', deviationValue: 51 },
          { id: 'aichi-arts-fine-design', name: 'デザイン・工芸科', deviationValue: 53 }
        ]
      },
      {
        id: 'aichi-arts-music',
        name: '音楽学部',
        departments: [
          { id: 'aichi-arts-music-comp', name: '作曲専攻', deviationValue: 49 },
          { id: 'aichi-arts-music-voice', name: '声楽専攻', deviationValue: 49 },
          { id: 'aichi-arts-music-inst', name: '器楽専攻', deviationValue: 50 }
        ]
      }
    ]
  },
  {
    id: 'nagoya-city',
    name: '名古屋市立大学',
    type: '公立',
    prefecture: '愛知県',
    faculties: [
      {
        id: 'nagoya-city-med',
        name: '医学部',
        departments: [
          { id: 'nagoya-city-med-med', name: '医学科', deviationValue: 70 }
        ]
      },
      {
        id: 'nagoya-city-pharm',
        name: '薬学部',
        departments: [
          { id: 'nagoya-city-pharm-pharm', name: '薬学科', deviationValue: 62 },
          { id: 'nagoya-city-pharm-life', name: '生命薬科学科', deviationValue: 60 }
        ]
      },
      {
        id: 'nagoya-city-econ',
        name: '経済学部',
        departments: [
          { id: 'nagoya-city-econ-econ', name: '経済学科', deviationValue: 57 },
          { id: 'nagoya-city-econ-mgmt', name: '経営学科', deviationValue: 57 },
          { id: 'nagoya-city-econ-acc', name: '会計ファイナンス学科', deviationValue: 56 }
        ]
      },
      {
        id: 'nagoya-city-hum',
        name: '人文社会学部',
        departments: [
          { id: 'nagoya-city-hum-psy', name: '心理教育学科', deviationValue: 57 },
          { id: 'nagoya-city-hum-mod', name: '現代社会学科', deviationValue: 56 },
          { id: 'nagoya-city-hum-int', name: '国際文化学科', deviationValue: 56 }
        ]
      },
      {
        id: 'nagoya-city-art',
        name: '芸術工学部',
        departments: [
          { id: 'nagoya-city-art-info', name: '情報環境デザイン学科', deviationValue: 54 },
          { id: 'nagoya-city-art-prod', name: '産業イノベーションデザイン学科', deviationValue: 54 },
          { id: 'nagoya-city-art-arch', name: '建築都市デザイン学科', deviationValue: 55 }
        ]
      },
      {
        id: 'nagoya-city-nurs',
        name: '看護学部',
        departments: [
          { id: 'nagoya-city-nurs-nurs', name: '看護学科', deviationValue: 55 }
        ]
      },
      {
        id: 'nagoya-city-data',
        name: 'データサイエンス学部',
        departments: [
          { id: 'nagoya-city-data-data', name: 'データサイエンス学科', deviationValue: 56 }
        ]
      }
    ]
  },
  {
    id: 'aichi',
    name: '愛知大学',
    type: '私立',
    prefecture: '愛知県',
    faculties: [
      {
        id: 'aichi-law',
        name: '法学部',
        departments: [
          { id: 'aichi-law-law', name: '法学科', deviationValue: 51 }
        ]
      },
      {
        id: 'aichi-econ',
        name: '経済学部',
        departments: [
          { id: 'aichi-econ-econ', name: '経済学科', deviationValue: 51 }
        ]
      },
      {
        id: 'aichi-mgmt',
        name: '経営学部',
        departments: [
          { id: 'aichi-mgmt-mgmt', name: '経営学科', deviationValue: 51 },
          { id: 'aichi-mgmt-acc', name: '会計ファイナンス学科', deviationValue: 50 }
        ]
      },
      {
        id: 'aichi-mod',
        name: '現代中国学部',
        departments: [
          { id: 'aichi-mod-china', name: '現代中国学科', deviationValue: 49 }
        ]
      },
      {
        id: 'aichi-int',
        name: '国際コミュニケーション学部',
        departments: [
          { id: 'aichi-int-eng', name: '英語学科', deviationValue: 51 },
          { id: 'aichi-int-int', name: '国際教養学科', deviationValue: 51 }
        ]
      },
      {
        id: 'aichi-letters',
        name: '文学部',
        departments: [
          { id: 'aichi-letters-human', name: '人文社会学科', deviationValue: 52 }
        ]
      },
      {
        id: 'aichi-regional',
        name: '地域政策学部',
        departments: [
          { id: 'aichi-regional-policy', name: '地域政策学科', deviationValue: 50 }
        ]
      }
    ]
  },
  {
    id: 'nanzan',
    name: '南山大学',
    type: '私立',
    prefecture: '愛知県',
    faculties: [
      {
        id: 'nanzan-hum',
        name: '人文学部',
        departments: [
          { id: 'nanzan-hum-chr', name: 'キリスト教学科', deviationValue: 51 },
          { id: 'nanzan-hum-anth', name: '人類文化学科', deviationValue: 53 },
          { id: 'nanzan-hum-psy', name: '心理人間学科', deviationValue: 54 },
          { id: 'nanzan-hum-jpn', name: '日本文化学科', deviationValue: 53 }
        ]
      },
      {
        id: 'nanzan-foreign',
        name: '外国語学部',
        departments: [
          { id: 'nanzan-foreign-eng', name: '英米学科', deviationValue: 56 },
          { id: 'nanzan-foreign-spa', name: 'スペイン・ラテンアメリカ学科', deviationValue: 54 },
          { id: 'nanzan-foreign-fre', name: 'フランス学科', deviationValue: 53 },
          { id: 'nanzan-foreign-ger', name: 'ドイツ学科', deviationValue: 53 },
          { id: 'nanzan-foreign-asia', name: 'アジア学科', deviationValue: 53 }
        ]
      },
      {
        id: 'nanzan-econ',
        name: '経済学部',
        departments: [
          { id: 'nanzan-econ-econ', name: '経済学科', deviationValue: 53 }
        ]
      },
      {
        id: 'nanzan-mgmt',
        name: '経営学部',
        departments: [
          { id: 'nanzan-mgmt-mgmt', name: '経営学科', deviationValue: 53 }
        ]
      },
      {
        id: 'nanzan-law',
        name: '法学部',
        departments: [
          { id: 'nanzan-law-law', name: '法律学科', deviationValue: 53 }
        ]
      },
      {
        id: 'nanzan-policy',
        name: '総合政策学部',
        departments: [
          { id: 'nanzan-policy-policy', name: '総合政策学科', deviationValue: 53 }
        ]
      },
      {
        id: 'nanzan-sci',
        name: '理工学部',
        departments: [
          { id: 'nanzan-sci-sys', name: 'システム数理学科', deviationValue: 50 },
          { id: 'nanzan-sci-soft', name: 'ソフトウェア工学科', deviationValue: 51 },
          { id: 'nanzan-sci-mech', name: '機械電子制御工学科', deviationValue: 50 }
        ]
      },
      {
        id: 'nanzan-global',
        name: '国際教養学部',
        departments: [
          { id: 'nanzan-global-global', name: '国際教養学科', deviationValue: 56 }
        ]
      }
    ]
  },
  {
    id: 'chukyo',
    name: '中京大学',
    type: '私立',
    prefecture: '愛知県',
    faculties: [
      {
        id: 'chukyo-letters',
        name: '文学部',
        departments: [
          { id: 'chukyo-letters-hist', name: '歴史文化学科', deviationValue: 52 },
          { id: 'chukyo-letters-jpn', name: '日本文学科', deviationValue: 51 },
          { id: 'chukyo-letters-media', name: '言語表現学科', deviationValue: 51 }
        ]
      },
      {
        id: 'chukyo-int',
        name: '国際学部',
        departments: [
          { id: 'chukyo-int-int', name: '国際学科', deviationValue: 53 }
        ]
      },
      {
        id: 'chukyo-psy',
        name: '心理学部',
        departments: [
          { id: 'chukyo-psy-psy', name: '心理学科', deviationValue: 54 }
        ]
      },
      {
        id: 'chukyo-law',
        name: '法学部',
        departments: [
          { id: 'chukyo-law-law', name: '法律学科', deviationValue: 52 }
        ]
      },
      {
        id: 'chukyo-econ',
        name: '経済学部',
        departments: [
          { id: 'chukyo-econ-econ', name: '経済学科', deviationValue: 51 }
        ]
      },
      {
        id: 'chukyo-mgmt',
        name: '経営学部',
        departments: [
          { id: 'chukyo-mgmt-mgmt', name: '経営学科', deviationValue: 52 }
        ]
      },
      {
        id: 'chukyo-policy',
        name: '総合政策学部',
        departments: [
          { id: 'chukyo-policy-policy', name: '総合政策学科', deviationValue: 51 }
        ]
      },
      {
        id: 'chukyo-mod',
        name: '現代社会学部',
        departments: [
          { id: 'chukyo-mod-soc', name: '現代社会学科', deviationValue: 51 },
          { id: 'chukyo-mod-comm', name: 'コミュニティ学科', deviationValue: 50 }
        ]
      },
      {
        id: 'chukyo-eng',
        name: '工学部',
        departments: [
          { id: 'chukyo-eng-mech', name: '機械システム工学科', deviationValue: 49 },
          { id: 'chukyo-eng-elec', name: '電気電子工学科', deviationValue: 49 },
          { id: 'chukyo-eng-info', name: '情報工学科', deviationValue: 51 },
          { id: 'chukyo-eng-media', name: 'メディア工学科', deviationValue: 50 }
        ]
      },
      {
        id: 'chukyo-sport',
        name: 'スポーツ科学部',
        departments: [
          { id: 'chukyo-sport-sport', name: 'スポーツ健康科学科', deviationValue: 51 },
          { id: 'chukyo-sport-comp', name: '競技スポーツ科学科', deviationValue: 50 },
          { id: 'chukyo-sport-edu', name: 'スポーツ教育学科', deviationValue: 51 },
          { id: 'chukyo-sport-manage', name: 'トレーナー学科', deviationValue: 50 },
          { id: 'chukyo-sport-manage2', name: 'スポーツマネジメント学科', deviationValue: 50 }
        ]
      }
    ]
  },

  // 静岡県
  {
    id: 'shizuoka',
    name: '静岡大学',
    type: '国立',
    prefecture: '静岡県',
    faculties: [
      {
        id: 'shizuoka-hum',
        name: '人文社会科学部',
        departments: [
          { id: 'shizuoka-hum-soc', name: '社会学科', deviationValue: 54 },
          { id: 'shizuoka-hum-lang', name: '言語文化学科', deviationValue: 54 },
          { id: 'shizuoka-hum-law', name: '法学科', deviationValue: 53 },
          { id: 'shizuoka-hum-econ', name: '経済学科', deviationValue: 53 }
        ]
      },
      {
        id: 'shizuoka-edu',
        name: '教育学部',
        departments: [
          { id: 'shizuoka-edu-school', name: '学校教育教員養成課程', deviationValue: 52 }
        ]
      },
      {
        id: 'shizuoka-info',
        name: '情報学部',
        departments: [
          { id: 'shizuoka-info-comp', name: '情報科学科', deviationValue: 53 },
          { id: 'shizuoka-info-behav', name: '行動情報学科', deviationValue: 53 },
          { id: 'shizuoka-info-social', name: '情報社会学科', deviationValue: 53 }
        ]
      },
      {
        id: 'shizuoka-sci',
        name: '理学部',
        departments: [
          { id: 'shizuoka-sci-math', name: '数学科', deviationValue: 52 },
          { id: 'shizuoka-sci-phys', name: '物理学科', deviationValue: 52 },
          { id: 'shizuoka-sci-chem', name: '化学科', deviationValue: 52 },
          { id: 'shizuoka-sci-bio', name: '生物科学科', deviationValue: 52 },
          { id: 'shizuoka-sci-earth', name: '地球科学科', deviationValue: 51 }
        ]
      },
      {
        id: 'shizuoka-eng',
        name: '工学部',
        departments: [
          { id: 'shizuoka-eng-mech', name: '機械工学科', deviationValue: 52 },
          { id: 'shizuoka-eng-elec', name: '電気電子工学科', deviationValue: 52 },
          { id: 'shizuoka-eng-elec2', name: '電子物質科学科', deviationValue: 51 },
          { id: 'shizuoka-eng-chem', name: '化学バイオ工学科', deviationValue: 51 },
          { id: 'shizuoka-eng-math', name: '数理システム工学科', deviationValue: 51 }
        ]
      },
      {
        id: 'shizuoka-agr',
        name: '農学部',
        departments: [
          { id: 'shizuoka-agr-bio', name: '生物資源科学科', deviationValue: 52 },
          { id: 'shizuoka-agr-app', name: '応用生命科学科', deviationValue: 52 }
        ]
      },
      {
        id: 'shizuoka-global',
        name: 'グローバル共創科学部',
        departments: [
          { id: 'shizuoka-global-global', name: 'グローバル共創科学科', deviationValue: 53 }
        ]
      }
    ]
  },
  {
    id: 'shizuoka-pref',
    name: '静岡県立大学',
    type: '公立',
    prefecture: '静岡県',
    faculties: [
      {
        id: 'shizuoka-pref-pharm',
        name: '薬学部',
        departments: [
          { id: 'shizuoka-pref-pharm-pharm', name: '薬学科', deviationValue: 61 },
          { id: 'shizuoka-pref-pharm-sci', name: '薬科学科', deviationValue: 58 }
        ]
      },
      {
        id: 'shizuoka-pref-food',
        name: '食品栄養科学部',
        departments: [
          { id: 'shizuoka-pref-food-food', name: '食品生命科学科', deviationValue: 54 },
          { id: 'shizuoka-pref-food-nutr', name: '栄養生命科学科', deviationValue: 54 },
          { id: 'shizuoka-pref-food-env', name: '環境生命科学科', deviationValue: 53 }
        ]
      },
      {
        id: 'shizuoka-pref-int',
        name: '国際関係学部',
        departments: [
          { id: 'shizuoka-pref-int-int', name: '国際関係学科', deviationValue: 55 },
          { id: 'shizuoka-pref-int-lang', name: '国際言語文化学科', deviationValue: 55 }
        ]
      },
      {
        id: 'shizuoka-pref-mgmt',
        name: '経営情報学部',
        departments: [
          { id: 'shizuoka-pref-mgmt-mgmt', name: '経営情報学科', deviationValue: 54 }
        ]
      },
      {
        id: 'shizuoka-pref-nurs',
        name: '看護学部',
        departments: [
          { id: 'shizuoka-pref-nurs-nurs', name: '看護学科', deviationValue: 53 }
        ]
      }
    ]
  },
  {
    id: 'suac',
    name: '静岡文化芸術大学',
    type: '公立',
    prefecture: '静岡県',
    faculties: [
      {
        id: 'suac-culture',
        name: '文化政策学部',
        departments: [
          { id: 'suac-culture-int', name: '国際文化学科', deviationValue: 52 },
          { id: 'suac-culture-policy', name: '文化政策学科', deviationValue: 51 },
          { id: 'suac-culture-art', name: '芸術文化学科', deviationValue: 50 }
        ]
      },
      {
        id: 'suac-design',
        name: 'デザイン学部',
        departments: [
          { id: 'suac-design-design', name: 'デザイン学科', deviationValue: 52 }
        ]
      }
    ]
  },

  // 岐阜県
  {
    id: 'gifu',
    name: '岐阜大学',
    type: '国立',
    prefecture: '岐阜県',
    faculties: [
      {
        id: 'gifu-edu',
        name: '教育学部',
        departments: [
          { id: 'gifu-edu-school', name: '学校教育教員養成課程', deviationValue: 53 }
        ]
      },
      {
        id: 'gifu-regional',
        name: '地域科学部',
        departments: [
          { id: 'gifu-regional-regional', name: '地域科学科', deviationValue: 53 }
        ]
      },
      {
        id: 'gifu-med',
        name: '医学部',
        departments: [
          { id: 'gifu-med-med', name: '医学科', deviationValue: 68 },
          { id: 'gifu-med-nurs', name: '看護学科', deviationValue: 51 }
        ]
      },
      {
        id: 'gifu-eng',
        name: '工学部',
        departments: [
          { id: 'gifu-eng-social', name: '社会基盤工学科', deviationValue: 50 },
          { id: 'gifu-eng-mech', name: '機械工学科', deviationValue: 51 },
          { id: 'gifu-eng-chem', name: '化学・生命工学科', deviationValue: 50 },
          { id: 'gifu-eng-elec', name: '電気電子・情報工学科', deviationValue: 51 }
        ]
      },
      {
        id: 'gifu-app-bio',
        name: '応用生物科学部',
        departments: [
          { id: 'gifu-app-bio-food', name: '応用生命科学課程', deviationValue: 54 },
          { id: 'gifu-app-bio-prod', name: '生産環境科学課程', deviationValue: 53 },
          { id: 'gifu-app-bio-vet', name: '共同獣医学科', deviationValue: 64 }
        ]
      },
      {
        id: 'gifu-social',
        name: '社会システム経営学環',
        departments: [
          { id: 'gifu-social-social', name: '社会システム経営学環', deviationValue: 53 }
        ]
      }
    ]
  },
  {
    id: 'gifu-nurs',
    name: '岐阜県立看護大学',
    type: '公立',
    prefecture: '岐阜県',
    faculties: [
      {
        id: 'gifu-nurs-nurs',
        name: '看護学部',
        departments: [
          { id: 'gifu-nurs-nurs-nurs', name: '看護学科', deviationValue: 51 }
        ]
      }
    ]
  },
  {
    id: 'gifu-pharm',
    name: '岐阜薬科大学',
    type: '公立',
    prefecture: '岐阜県',
    faculties: [
      {
        id: 'gifu-pharm-pharm',
        name: '薬学部',
        departments: [
          { id: 'gifu-pharm-pharm-pharm', name: '薬学科', deviationValue: 60 },
          { id: 'gifu-pharm-pharm-bio', name: '薬科学科', deviationValue: 58 }
        ]
      }
    ]
  },

  // 三重県
  {
    id: 'mie',
    name: '三重大学',
    type: '国立',
    prefecture: '三重県',
    faculties: [
      {
        id: 'mie-hum',
        name: '人文学部',
        departments: [
          { id: 'mie-hum-culture', name: '文化学科', deviationValue: 54 },
          { id: 'mie-hum-law', name: '法律経済学科', deviationValue: 54 }
        ]
      },
      {
        id: 'mie-edu',
        name: '教育学部',
        departments: [
          { id: 'mie-edu-school', name: '学校教育教員養成課程', deviationValue: 52 }
        ]
      },
      {
        id: 'mie-med',
        name: '医学部',
        departments: [
          { id: 'mie-med-med', name: '医学科', deviationValue: 68 },
          { id: 'mie-med-nurs', name: '看護学科', deviationValue: 50 }
        ]
      },
      {
        id: 'mie-eng',
        name: '工学部',
        departments: [
          { id: 'mie-eng-mech', name: '機械工学科', deviationValue: 51 },
          { id: 'mie-eng-elec', name: '電気電子工学科', deviationValue: 51 },
          { id: 'mie-eng-mol', name: '分子素材工学科', deviationValue: 50 },
          { id: 'mie-eng-arch', name: '建築学科', deviationValue: 52 },
          { id: 'mie-eng-info', name: '情報工学科', deviationValue: 52 },
          { id: 'mie-eng-chem', name: '応用化学科', deviationValue: 50 }
        ]
      },
      {
        id: 'mie-bio',
        name: '生物資源学部',
        departments: [
          { id: 'mie-bio-bio', name: '生物資源学科', deviationValue: 53 }
        ]
      }
    ]
  },
  {
    id: 'mie-nurs',
    name: '三重県立看護大学',
    type: '公立',
    prefecture: '三重県',
    faculties: [
      {
        id: 'mie-nurs-nurs',
        name: '看護学部',
        departments: [
          { id: 'mie-nurs-nurs-nurs', name: '看護学科', deviationValue: 50 }
        ]
      }
    ]
  },

  // 新潟県
  {
    id: 'niigata',
    name: '新潟大学',
    type: '国立',
    prefecture: '新潟県',
    faculties: [
      {
        id: 'niigata-hum',
        name: '人文学部',
        departments: [
          { id: 'niigata-hum-hum', name: '人文学科', deviationValue: 54 }
        ]
      },
      {
        id: 'niigata-edu',
        name: '教育学部',
        departments: [
          { id: 'niigata-edu-school', name: '学校教員養成課程', deviationValue: 52 }
        ]
      },
      {
        id: 'niigata-law',
        name: '法学部',
        departments: [
          { id: 'niigata-law-law', name: '法学科', deviationValue: 54 }
        ]
      },
      {
        id: 'niigata-econ',
        name: '経済科学部',
        departments: [
          { id: 'niigata-econ-comp', name: '総合経済学科', deviationValue: 53 }
        ]
      },
      {
        id: 'niigata-sci',
        name: '理学部',
        departments: [
          { id: 'niigata-sci-sci', name: '理学科', deviationValue: 52 }
        ]
      },
      {
        id: 'niigata-med',
        name: '医学部',
        departments: [
          { id: 'niigata-med-med', name: '医学科', deviationValue: 68 },
          { id: 'niigata-med-health', name: '保健学科', deviationValue: 51 }
        ]
      },
      {
        id: 'niigata-dent',
        name: '歯学部',
        departments: [
          { id: 'niigata-dent-dent', name: '歯学科', deviationValue: 58 },
          { id: 'niigata-dent-oral', name: '口腔生命福祉学科', deviationValue: 50 }
        ]
      },
      {
        id: 'niigata-eng',
        name: '工学部',
        departments: [
          { id: 'niigata-eng-eng', name: '工学科', deviationValue: 51 }
        ]
      },
      {
        id: 'niigata-agr',
        name: '農学部',
        departments: [
          { id: 'niigata-agr-agr', name: '農学科', deviationValue: 52 }
        ]
      },
      {
        id: 'niigata-create',
        name: '創生学部',
        departments: [
          { id: 'niigata-create-create', name: '創生学修課程', deviationValue: 54 }
        ]
      }
    ]
  },
  {
    id: 'niigata-pref',
    name: '新潟県立大学',
    type: '公立',
    prefecture: '新潟県',
    faculties: [
      {
        id: 'niigata-pref-int',
        name: '国際地域学部',
        departments: [
          { id: 'niigata-pref-int-int', name: '国際地域学科', deviationValue: 52 }
        ]
      },
      {
        id: 'niigata-pref-int-econ',
        name: '国際経済学部',
        departments: [
          { id: 'niigata-pref-int-econ-econ', name: '国際経済学科', deviationValue: 51 }
        ]
      },
      {
        id: 'niigata-pref-human',
        name: '人間生活学部',
        departments: [
          { id: 'niigata-pref-human-child', name: '子ども学科', deviationValue: 49 },
          { id: 'niigata-pref-human-health', name: '健康栄養学科', deviationValue: 50 }
        ]
      }
    ]
  },
  {
    id: 'niigata-nurs',
    name: '新潟県立看護大学',
    type: '公立',
    prefecture: '新潟県',
    faculties: [
      {
        id: 'niigata-nurs-nurs',
        name: '看護学部',
        departments: [
          { id: 'niigata-nurs-nurs-nurs', name: '看護学科', deviationValue: 49 }
        ]
      }
    ]
  },
  {
    id: 'nagaoka-id',
    name: '長岡造形大学',
    type: '公立',
    prefecture: '新潟県',
    faculties: [
      {
        id: 'nagaoka-id-design',
        name: '造形学部',
        departments: [
          { id: 'nagaoka-id-design-prod', name: 'プロダクトデザイン学科', deviationValue: 49 },
          { id: 'nagaoka-id-design-visual', name: '視覚デザイン学科', deviationValue: 50 },
          { id: 'nagaoka-id-design-art', name: '美術・工芸学科', deviationValue: 48 },
          { id: 'nagaoka-id-design-arch', name: '建築・環境デザイン学科', deviationValue: 49 }
        ]
      }
    ]
  },

  // 富山県
  {
    id: 'toyama',
    name: '富山大学',
    type: '国立',
    prefecture: '富山県',
    faculties: [
      {
        id: 'toyama-hum',
        name: '人文学部',
        departments: [
          { id: 'toyama-hum-hum', name: '人文学科', deviationValue: 52 }
        ]
      },
      {
        id: 'toyama-human',
        name: '人間発達科学部',
        departments: [
          { id: 'toyama-human-dev', name: '発達教育学科', deviationValue: 50 },
          { id: 'toyama-human-env', name: '人間環境システム学科', deviationValue: 49 }
        ]
      },
      {
        id: 'toyama-econ',
        name: '経済学部',
        departments: [
          { id: 'toyama-econ-econ', name: '経済学科', deviationValue: 51 },
          { id: 'toyama-econ-mgmt', name: '経営学科', deviationValue: 51 },
          { id: 'toyama-econ-law', name: '経営法学科', deviationValue: 50 }
        ]
      },
      {
        id: 'toyama-sci',
        name: '理学部',
        departments: [
          { id: 'toyama-sci-math', name: '数学科', deviationValue: 50 },
          { id: 'toyama-sci-phys', name: '物理学科', deviationValue: 50 },
          { id: 'toyama-sci-chem', name: '化学科', deviationValue: 50 },
          { id: 'toyama-sci-bio', name: '生物学科', deviationValue: 50 },
          { id: 'toyama-sci-nat', name: '自然環境科学科', deviationValue: 49 }
        ]
      },
      {
        id: 'toyama-med',
        name: '医学部',
        departments: [
          { id: 'toyama-med-med', name: '医学科', deviationValue: 66 },
          { id: 'toyama-med-nurs', name: '看護学科', deviationValue: 49 }
        ]
      },
      {
        id: 'toyama-pharm',
        name: '薬学部',
        departments: [
          { id: 'toyama-pharm-pharm', name: '薬学科', deviationValue: 58 },
          { id: 'toyama-pharm-create', name: '創薬科学科', deviationValue: 56 }
        ]
      },
      {
        id: 'toyama-eng',
        name: '工学部',
        departments: [
          { id: 'toyama-eng-elec', name: '電気電子工学科', deviationValue: 49 },
          { id: 'toyama-eng-intel', name: '知能情報工学科', deviationValue: 50 },
          { id: 'toyama-eng-mech', name: '機械工学科', deviationValue: 49 },
          { id: 'toyama-eng-bio', name: '生命工学科', deviationValue: 49 },
          { id: 'toyama-eng-chem', name: '応用化学科', deviationValue: 49 }
        ]
      },
      {
        id: 'toyama-art',
        name: '芸術文化学部',
        departments: [
          { id: 'toyama-art-art', name: '芸術文化学科', deviationValue: 48 }
        ]
      },
      {
        id: 'toyama-urban',
        name: '都市デザイン学部',
        departments: [
          { id: 'toyama-urban-earth', name: '地球システム科学科', deviationValue: 48 },
          { id: 'toyama-urban-design', name: '都市・交通デザイン学科', deviationValue: 49 },
          { id: 'toyama-urban-mat', name: '材料デザイン工学科', deviationValue: 48 }
        ]
      }
    ]
  },
  {
    id: 'toyama-pref',
    name: '富山県立大学',
    type: '公立',
    prefecture: '富山県',
    faculties: [
      {
        id: 'toyama-pref-eng',
        name: '工学部',
        departments: [
          { id: 'toyama-pref-eng-mech', name: '機械システム工学科', deviationValue: 49 },
          { id: 'toyama-pref-eng-intel', name: '知能ロボット工学科', deviationValue: 49 },
          { id: 'toyama-pref-eng-elec', name: '電気電子工学科', deviationValue: 48 },
          { id: 'toyama-pref-eng-info', name: '情報システム工学科', deviationValue: 50 },
          { id: 'toyama-pref-eng-env', name: '環境・社会基盤工学科', deviationValue: 48 },
          { id: 'toyama-pref-eng-bio', name: '生物工学科', deviationValue: 49 },
          { id: 'toyama-pref-eng-med', name: '医薬品工学科', deviationValue: 50 }
        ]
      },
      {
        id: 'toyama-pref-nurs',
        name: '看護学部',
        departments: [
          { id: 'toyama-pref-nurs-nurs', name: '看護学科', deviationValue: 49 }
        ]
      }
    ]
  },

  // 石川県
  {
    id: 'kanazawa',
    name: '金沢大学',
    type: '国立',
    prefecture: '石川県',
    faculties: [
      {
        id: 'kanazawa-letters',
        name: '人間社会学域',
        departments: [
          { id: 'kanazawa-letters-hum', name: '人文学類', deviationValue: 58 },
          { id: 'kanazawa-letters-law', name: '法学類', deviationValue: 58 },
          { id: 'kanazawa-letters-econ', name: '経済学類', deviationValue: 57 },
          { id: 'kanazawa-letters-school', name: '学校教育学類', deviationValue: 55 },
          { id: 'kanazawa-letters-comm', name: '地域創造学類', deviationValue: 54 },
          { id: 'kanazawa-letters-int', name: '国際学類', deviationValue: 57 }
        ]
      },
      {
        id: 'kanazawa-sci',
        name: '理工学域',
        departments: [
          { id: 'kanazawa-sci-math', name: '数物科学類', deviationValue: 54 },
          { id: 'kanazawa-sci-mat', name: '物質化学類', deviationValue: 54 },
          { id: 'kanazawa-sci-mech', name: '機械工学類', deviationValue: 55 },
          { id: 'kanazawa-sci-front', name: 'フロンティア工学類', deviationValue: 54 },
          { id: 'kanazawa-sci-elec', name: '電子情報通信学類', deviationValue: 55 },
          { id: 'kanazawa-sci-earth', name: '地球社会基盤学類', deviationValue: 53 },
          { id: 'kanazawa-sci-life', name: '生命理工学類', deviationValue: 54 }
        ]
      },
      {
        id: 'kanazawa-med',
        name: '医薬保健学域',
        departments: [
          { id: 'kanazawa-med-med', name: '医学類', deviationValue: 68 },
          { id: 'kanazawa-med-pharm', name: '薬学類', deviationValue: 62 },
          { id: 'kanazawa-med-create', name: '創薬科学類', deviationValue: 58 },
          { id: 'kanazawa-med-health', name: '保健学類', deviationValue: 53 }
        ]
      },
      {
        id: 'kanazawa-integrated',
        name: '融合学域',
        departments: [
          { id: 'kanazawa-integrated-front', name: '先導学類', deviationValue: 57 },
          { id: 'kanazawa-integrated-tour', name: '観光デザイン学類', deviationValue: 56 },
          { id: 'kanazawa-integrated-smart', name: 'スマート創成科学類', deviationValue: 55 }
        ]
      }
    ]
  },
  {
    id: 'ishikawa-pref',
    name: '石川県立大学',
    type: '公立',
    prefecture: '石川県',
    faculties: [
      {
        id: 'ishikawa-pref-bio',
        name: '生物資源環境学部',
        departments: [
          { id: 'ishikawa-pref-bio-prod', name: '生産科学科', deviationValue: 49 },
          { id: 'ishikawa-pref-bio-env', name: '環境科学科', deviationValue: 49 },
          { id: 'ishikawa-pref-bio-food', name: '食品科学科', deviationValue: 50 }
        ]
      }
    ]
  },
  {
    id: 'ishikawa-nurs',
    name: '石川県立看護大学',
    type: '公立',
    prefecture: '石川県',
    faculties: [
      {
        id: 'ishikawa-nurs-nurs',
        name: '看護学部',
        departments: [
          { id: 'ishikawa-nurs-nurs-nurs', name: '看護学科', deviationValue: 50 }
        ]
      }
    ]
  },
  {
    id: 'kanazawa-art',
    name: '金沢美術工芸大学',
    type: '公立',
    prefecture: '石川県',
    faculties: [
      {
        id: 'kanazawa-art-art',
        name: '美術工芸学部',
        departments: [
          { id: 'kanazawa-art-art-jpn', name: '日本画専攻', deviationValue: 53 },
          { id: 'kanazawa-art-art-oil', name: '油画専攻', deviationValue: 53 },
          { id: 'kanazawa-art-art-sculp', name: '彫刻専攻', deviationValue: 52 },
          { id: 'kanazawa-art-art-craft', name: '工芸科', deviationValue: 54 },
          { id: 'kanazawa-art-art-design', name: 'デザイン科', deviationValue: 55 }
        ]
      }
    ]
  },

  // 福井県
  {
    id: 'fukui',
    name: '福井大学',
    type: '国立',
    prefecture: '福井県',
    faculties: [
      {
        id: 'fukui-edu',
        name: '教育学部',
        departments: [
          { id: 'fukui-edu-school', name: '学校教育課程', deviationValue: 49 }
        ]
      },
      {
        id: 'fukui-med',
        name: '医学部',
        departments: [
          { id: 'fukui-med-med', name: '医学科', deviationValue: 66 },
          { id: 'fukui-med-nurs', name: '看護学科', deviationValue: 48 }
        ]
      },
      {
        id: 'fukui-eng',
        name: '工学部',
        departments: [
          { id: 'fukui-eng-mech', name: '機械・システム工学科', deviationValue: 48 },
          { id: 'fukui-eng-elec', name: '電気電子情報工学科', deviationValue: 48 },
          { id: 'fukui-eng-arch', name: '建築・都市環境工学科', deviationValue: 48 },
          { id: 'fukui-eng-mat', name: '物質・生命化学科', deviationValue: 47 },
          { id: 'fukui-eng-bio', name: '応用物理学科', deviationValue: 47 }
        ]
      },
      {
        id: 'fukui-global',
        name: '国際地域学部',
        departments: [
          { id: 'fukui-global-global', name: '国際地域学科', deviationValue: 50 }
        ]
      }
    ]
  },
  {
    id: 'fukui-pref',
    name: '福井県立大学',
    type: '公立',
    prefecture: '福井県',
    faculties: [
      {
        id: 'fukui-pref-econ',
        name: '経済学部',
        departments: [
          { id: 'fukui-pref-econ-econ', name: '経済学科', deviationValue: 49 },
          { id: 'fukui-pref-econ-mgmt', name: '経営学科', deviationValue: 49 }
        ]
      },
      {
        id: 'fukui-pref-bio',
        name: '生物資源学部',
        departments: [
          { id: 'fukui-pref-bio-bio', name: '生物資源学科', deviationValue: 49 },
          { id: 'fukui-pref-bio-marine', name: '創造農学科', deviationValue: 48 }
        ]
      },
      {
        id: 'fukui-pref-marine',
        name: '海洋生物資源学部',
        departments: [
          { id: 'fukui-pref-marine-marine', name: '海洋生物資源学科', deviationValue: 49 }
        ]
      },
      {
        id: 'fukui-pref-nurs',
        name: '看護福祉学部',
        departments: [
          { id: 'fukui-pref-nurs-nurs', name: '看護学科', deviationValue: 49 },
          { id: 'fukui-pref-nurs-welfare', name: '社会福祉学科', deviationValue: 48 }
        ]
      }
    ]
  },
  {
    id: 'tsuruga-nurs',
    name: '敦賀市立看護大学',
    type: '公立',
    prefecture: '福井県',
    faculties: [
      {
        id: 'tsuruga-nurs-nurs',
        name: '看護学部',
        departments: [
          { id: 'tsuruga-nurs-nurs-nurs', name: '看護学科', deviationValue: 47 }
        ]
      }
    ]
  },

  // 山梨県
  {
    id: 'yamanashi',
    name: '山梨大学',
    type: '国立',
    prefecture: '山梨県',
    faculties: [
      {
        id: 'yamanashi-edu',
        name: '教育学部',
        departments: [
          { id: 'yamanashi-edu-school', name: '学校教育課程', deviationValue: 50 }
        ]
      },
      {
        id: 'yamanashi-med',
        name: '医学部',
        departments: [
          { id: 'yamanashi-med-med', name: '医学科', deviationValue: 69 },
          { id: 'yamanashi-med-nurs', name: '看護学科', deviationValue: 49 }
        ]
      },
      {
        id: 'yamanashi-eng',
        name: '工学部',
        departments: [
          { id: 'yamanashi-eng-civil', name: '土木環境工学科', deviationValue: 48 },
          { id: 'yamanashi-eng-comp', name: 'コンピュータ理工学科', deviationValue: 50 },
          { id: 'yamanashi-eng-mech', name: '機械工学科', deviationValue: 49 },
          { id: 'yamanashi-eng-elec', name: '電気電子工学科', deviationValue: 48 },
          { id: 'yamanashi-eng-mechatronics', name: 'メカトロニクス工学科', deviationValue: 48 },
          { id: 'yamanashi-eng-chem', name: '応用化学科', deviationValue: 48 },
          { id: 'yamanashi-eng-bio', name: '先端材料理工学科', deviationValue: 48 }
        ]
      },
      {
        id: 'yamanashi-life',
        name: '生命環境学部',
        departments: [
          { id: 'yamanashi-life-bio', name: '生命工学科', deviationValue: 50 },
          { id: 'yamanashi-life-env', name: '地域食物科学科', deviationValue: 50 },
          { id: 'yamanashi-life-social', name: '環境科学科', deviationValue: 49 },
          { id: 'yamanashi-life-local', name: '地域社会システム学科', deviationValue: 49 }
        ]
      }
    ]
  },
  {
    id: 'yamanashi-pref',
    name: '山梨県立大学',
    type: '公立',
    prefecture: '山梨県',
    faculties: [
      {
        id: 'yamanashi-pref-int',
        name: '国際政策学部',
        departments: [
          { id: 'yamanashi-pref-int-policy', name: '総合政策学科', deviationValue: 49 },
          { id: 'yamanashi-pref-int-comm', name: '国際コミュニケーション学科', deviationValue: 49 }
        ]
      },
      {
        id: 'yamanashi-pref-human',
        name: '人間福祉学部',
        departments: [
          { id: 'yamanashi-pref-human-welfare', name: '福祉コミュニティ学科', deviationValue: 48 },
          { id: 'yamanashi-pref-human-human', name: '人間形成学科', deviationValue: 48 }
        ]
      },
      {
        id: 'yamanashi-pref-nurs',
        name: '看護学部',
        departments: [
          { id: 'yamanashi-pref-nurs-nurs', name: '看護学科', deviationValue: 50 }
        ]
      }
    ]
  },
  {
    id: 'tsuru',
    name: '都留文科大学',
    type: '公立',
    prefecture: '山梨県',
    faculties: [
      {
        id: 'tsuru-letters',
        name: '文学部',
        departments: [
          { id: 'tsuru-letters-jpn', name: '国文学科', deviationValue: 55 },
          { id: 'tsuru-letters-eng', name: '英文学科', deviationValue: 53 },
          { id: 'tsuru-letters-hist', name: '比較文化学科', deviationValue: 53 },
          { id: 'tsuru-letters-inter', name: '国際教育学科', deviationValue: 52 }
        ]
      },
      {
        id: 'tsuru-edu',
        name: '教養学部',
        departments: [
          { id: 'tsuru-edu-school', name: '学校教育学科', deviationValue: 54 },
          { id: 'tsuru-edu-comm', name: '地域社会学科', deviationValue: 52 }
        ]
      }
    ]
  },

  // 長野県
  {
    id: 'shinshu',
    name: '信州大学',
    type: '国立',
    prefecture: '長野県',
    faculties: [
      {
        id: 'shinshu-letters',
        name: '人文学部',
        departments: [
          { id: 'shinshu-letters-hum', name: '人文学科', deviationValue: 54 }
        ]
      },
      {
        id: 'shinshu-edu',
        name: '教育学部',
        departments: [
          { id: 'shinshu-edu-school', name: '学校教育教員養成課程', deviationValue: 52 }
        ]
      },
      {
        id: 'shinshu-econ',
        name: '経法学部',
        departments: [
          { id: 'shinshu-econ-eco', name: '応用経済学科', deviationValue: 53 },
          { id: 'shinshu-econ-policy', name: '総合法律学科', deviationValue: 53 }
        ]
      },
      {
        id: 'shinshu-sci',
        name: '理学部',
        departments: [
          { id: 'shinshu-sci-math', name: '数学科', deviationValue: 51 },
          { id: 'shinshu-sci-sci', name: '理学科', deviationValue: 51 }
        ]
      },
      {
        id: 'shinshu-med',
        name: '医学部',
        departments: [
          { id: 'shinshu-med-med', name: '医学科', deviationValue: 67 },
          { id: 'shinshu-med-health', name: '保健学科', deviationValue: 51 }
        ]
      },
      {
        id: 'shinshu-eng',
        name: '工学部',
        departments: [
          { id: 'shinshu-eng-mat', name: '物質化学科', deviationValue: 50 },
          { id: 'shinshu-eng-elec', name: '電子情報システム工学科', deviationValue: 51 },
          { id: 'shinshu-eng-water', name: '水環境・土木工学科', deviationValue: 49 },
          { id: 'shinshu-eng-mech', name: '機械システム工学科', deviationValue: 50 },
          { id: 'shinshu-eng-arch', name: '建築学科', deviationValue: 52 }
        ]
      },
      {
        id: 'shinshu-agr',
        name: '農学部',
        departments: [
          { id: 'shinshu-agr-life', name: '農学生命科学科', deviationValue: 52 }
        ]
      },
      {
        id: 'shinshu-textile',
        name: '繊維学部',
        departments: [
          { id: 'shinshu-textile-adv', name: '先進繊維・感性工学科', deviationValue: 50 },
          { id: 'shinshu-textile-mech', name: '機械・ロボット学科', deviationValue: 50 },
          { id: 'shinshu-textile-chem', name: '化学・材料学科', deviationValue: 50 },
          { id: 'shinshu-textile-bio', name: '応用生物科学科', deviationValue: 51 }
        ]
      }
    ]
  },
  {
    id: 'nagano-pref',
    name: '長野県立大学',
    type: '公立',
    prefecture: '長野県',
    faculties: [
      {
        id: 'nagano-pref-global',
        name: 'グローバルマネジメント学部',
        departments: [
          { id: 'nagano-pref-global-global', name: 'グローバルマネジメント学科', deviationValue: 52 }
        ]
      },
      {
        id: 'nagano-pref-health',
        name: '健康発達学部',
        departments: [
          { id: 'nagano-pref-health-food', name: '食健康学科', deviationValue: 50 },
          { id: 'nagano-pref-health-child', name: 'こども学科', deviationValue: 49 }
        ]
      }
    ]
  },
  {
    id: 'nagano-nurs',
    name: '長野県看護大学',
    type: '公立',
    prefecture: '長野県',
    faculties: [
      {
        id: 'nagano-nurs-nurs',
        name: '看護学部',
        departments: [
          { id: 'nagano-nurs-nurs-nurs', name: '看護学科', deviationValue: 50 }
        ]
      }
    ]
  },
  {
    id: 'suwa-tokyo',
    name: '公立諏訪東京理科大学',
    type: '公立',
    prefecture: '長野県',
    faculties: [
      {
        id: 'suwa-tokyo-eng',
        name: '工学部',
        departments: [
          { id: 'suwa-tokyo-eng-info', name: '情報応用工学科', deviationValue: 48 },
          { id: 'suwa-tokyo-eng-mech', name: '機械電気工学科', deviationValue: 47 }
        ]
      }
    ]
  }
]