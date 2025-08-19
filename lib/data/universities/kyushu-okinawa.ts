import { University } from './index'

export const kyushuOkinawaUniversities: University[] = [
  // 福岡県
  {
    id: 'kyushu',
    name: '九州大学',
    type: '国立',
    prefecture: '福岡県',
    faculties: [
      {
        id: 'kyushu-letters',
        name: '文学部',
        departments: [
          { id: 'kyushu-letters-hum', name: '人文学科', deviationValue: 63 }
        ]
      },
      {
        id: 'kyushu-edu',
        name: '教育学部',
        departments: [
          { id: 'kyushu-edu-edu', name: '教育学科', deviationValue: 62 }
        ]
      },
      {
        id: 'kyushu-law',
        name: '法学部',
        departments: [
          { id: 'kyushu-law-law', name: '法学科', deviationValue: 63 }
        ]
      },
      {
        id: 'kyushu-econ',
        name: '経済学部',
        departments: [
          { id: 'kyushu-econ-econ', name: '経済・経営学科', deviationValue: 63 },
          { id: 'kyushu-econ-eng', name: '経済工学科', deviationValue: 62 }
        ]
      },
      {
        id: 'kyushu-sci',
        name: '理学部',
        departments: [
          { id: 'kyushu-sci-phys', name: '物理学科', deviationValue: 60 },
          { id: 'kyushu-sci-chem', name: '化学科', deviationValue: 60 },
          { id: 'kyushu-sci-earth', name: '地球惑星科学科', deviationValue: 59 },
          { id: 'kyushu-sci-math', name: '数学科', deviationValue: 60 },
          { id: 'kyushu-sci-bio', name: '生物学科', deviationValue: 60 }
        ]
      },
      {
        id: 'kyushu-med',
        name: '医学部',
        departments: [
          { id: 'kyushu-med-med', name: '医学科', deviationValue: 71 },
          { id: 'kyushu-med-life', name: '生命科学科', deviationValue: 59 },
          { id: 'kyushu-med-health', name: '保健学科', deviationValue: 57 }
        ]
      },
      {
        id: 'kyushu-dent',
        name: '歯学部',
        departments: [
          { id: 'kyushu-dent-dent', name: '歯学科', deviationValue: 62 }
        ]
      },
      {
        id: 'kyushu-pharm',
        name: '薬学部',
        departments: [
          { id: 'kyushu-pharm-create', name: '創薬科学科', deviationValue: 62 },
          { id: 'kyushu-pharm-clinical', name: '臨床薬学科', deviationValue: 64 }
        ]
      },
      {
        id: 'kyushu-eng',
        name: '工学部',
        departments: [
          { id: 'kyushu-eng-arch', name: '建築学科', deviationValue: 61 },
          { id: 'kyushu-eng-elec', name: '電気情報工学科', deviationValue: 61 },
          { id: 'kyushu-eng-mat', name: '物質科学工学科', deviationValue: 60 },
          { id: 'kyushu-eng-earth', name: '地球環境工学科', deviationValue: 59 },
          { id: 'kyushu-eng-energy', name: 'エネルギー科学科', deviationValue: 60 },
          { id: 'kyushu-eng-mech', name: '機械航空工学科', deviationValue: 61 }
        ]
      },
      {
        id: 'kyushu-design',
        name: '芸術工学部',
        departments: [
          { id: 'kyushu-design-env', name: '環境設計学科', deviationValue: 59 },
          { id: 'kyushu-design-ind', name: '工業設計学科', deviationValue: 59 },
          { id: 'kyushu-design-image', name: '画像設計学科', deviationValue: 59 },
          { id: 'kyushu-design-sound', name: '音響設計学科', deviationValue: 59 },
          { id: 'kyushu-design-art', name: '芸術情報設計学科', deviationValue: 59 }
        ]
      },
      {
        id: 'kyushu-agr',
        name: '農学部',
        departments: [
          { id: 'kyushu-agr-bio', name: '生物資源環境学科', deviationValue: 61 }
        ]
      },
      {
        id: 'kyushu-21',
        name: '共創学部',
        departments: [
          { id: 'kyushu-21-share', name: '共創学科', deviationValue: 63 }
        ]
      }
    ]
  },
  {
    id: 'kyushu-tech',
    name: '九州工業大学',
    type: '国立',
    prefecture: '福岡県',
    faculties: [
      {
        id: 'kyutech-eng',
        name: '工学部',
        departments: [
          { id: 'kyutech-eng-civil', name: '建設社会工学科', deviationValue: 51 },
          { id: 'kyutech-eng-mech', name: '機械知能工学科', deviationValue: 52 },
          { id: 'kyutech-eng-space', name: '宇宙システム工学科', deviationValue: 52 },
          { id: 'kyutech-eng-elec', name: '電気電子工学科', deviationValue: 52 },
          { id: 'kyutech-eng-chem', name: '応用化学科', deviationValue: 51 },
          { id: 'kyutech-eng-mat', name: 'マテリアル工学科', deviationValue: 51 }
        ]
      },
      {
        id: 'kyutech-info',
        name: '情報工学部',
        departments: [
          { id: 'kyutech-info-intel', name: '知能情報工学科', deviationValue: 53 },
          { id: 'kyutech-info-media', name: '情報・通信工学科', deviationValue: 52 },
          { id: 'kyutech-info-sys', name: '知的システム工学科', deviationValue: 52 },
          { id: 'kyutech-info-phys', name: '物理情報工学科', deviationValue: 51 },
          { id: 'kyutech-info-bio', name: '生命化学情報工学科', deviationValue: 51 }
        ]
      }
    ]
  },
  {
    id: 'kitakyushu',
    name: '北九州市立大学',
    type: '公立',
    prefecture: '福岡県',
    faculties: [
      {
        id: 'kitakyu-foreign',
        name: '外国語学部',
        departments: [
          { id: 'kitakyu-foreign-eng', name: '英米学科', deviationValue: 54 },
          { id: 'kitakyu-foreign-chi', name: '中国学科', deviationValue: 51 },
          { id: 'kitakyu-foreign-int', name: '国際関係学科', deviationValue: 54 }
        ]
      },
      {
        id: 'kitakyu-econ',
        name: '経済学部',
        departments: [
          { id: 'kitakyu-econ-econ', name: '経済学科', deviationValue: 51 },
          { id: 'kitakyu-econ-mgmt', name: '経営情報学科', deviationValue: 51 }
        ]
      },
      {
        id: 'kitakyu-letters',
        name: '文学部',
        departments: [
          { id: 'kitakyu-letters-comp', name: '比較文化学科', deviationValue: 51 },
          { id: 'kitakyu-letters-human', name: '人間関係学科', deviationValue: 50 }
        ]
      },
      {
        id: 'kitakyu-law',
        name: '法学部',
        departments: [
          { id: 'kitakyu-law-law', name: '法律学科', deviationValue: 51 },
          { id: 'kitakyu-law-pol', name: '政策科学科', deviationValue: 50 }
        ]
      },
      {
        id: 'kitakyu-region',
        name: '地域創生学群',
        departments: [
          { id: 'kitakyu-region-region', name: '地域創生学類', deviationValue: 49 }
        ]
      },
      {
        id: 'kitakyu-env',
        name: '国際環境工学部',
        departments: [
          { id: 'kitakyu-env-energy', name: 'エネルギー循環化学科', deviationValue: 47 },
          { id: 'kitakyu-env-mech', name: '機械システム工学科', deviationValue: 47 },
          { id: 'kitakyu-env-info', name: '情報システム工学科', deviationValue: 48 },
          { id: 'kitakyu-env-arch', name: '建築デザイン学科', deviationValue: 48 },
          { id: 'kitakyu-env-life', name: '環境生命工学科', deviationValue: 47 }
        ]
      }
    ]
  },
  {
    id: 'fukuoka-pref',
    name: '福岡県立大学',
    type: '公立',
    prefecture: '福岡県',
    faculties: [
      {
        id: 'fukupref-human',
        name: '人間社会学部',
        departments: [
          { id: 'fukupref-human-pub', name: '公共社会学科', deviationValue: 49 },
          { id: 'fukupref-human-welfare', name: '社会福祉学科', deviationValue: 48 },
          { id: 'fukupref-human-form', name: '人間形成学科', deviationValue: 48 }
        ]
      },
      {
        id: 'fukupref-nurs',
        name: '看護学部',
        departments: [
          { id: 'fukupref-nurs-nurs', name: '看護学科', deviationValue: 50 }
        ]
      }
    ]
  },
  {
    id: 'fukuoka-women',
    name: '福岡女子大学',
    type: '公立',
    prefecture: '福岡県',
    faculties: [
      {
        id: 'fukuwom-int',
        name: '国際文理学部',
        departments: [
          { id: 'fukuwom-int-culture', name: '国際教養学科', deviationValue: 53 },
          { id: 'fukuwom-int-env', name: '環境科学科', deviationValue: 51 },
          { id: 'fukuwom-int-food', name: '食・健康学科', deviationValue: 52 }
        ]
      }
    ]
  },
  {
    id: 'kyushu-dental',
    name: '九州歯科大学',
    type: '公立',
    prefecture: '福岡県',
    faculties: [
      {
        id: 'kyudent-dent',
        name: '歯学部',
        departments: [
          { id: 'kyudent-dent-dent', name: '歯学科', deviationValue: 58 },
          { id: 'kyudent-dent-oral', name: '口腔保健学科', deviationValue: 48 }
        ]
      }
    ]
  },
  {
    id: 'fukuoka',
    name: '福岡大学',
    type: '私立',
    prefecture: '福岡県',
    faculties: [
      {
        id: 'fukuoka-hum',
        name: '人文学部',
        departments: [
          { id: 'fukuoka-hum-cult', name: '文化学科', deviationValue: 50 },
          { id: 'fukuoka-hum-hist', name: '歴史学科', deviationValue: 51 },
          { id: 'fukuoka-hum-jpn', name: '日本語日本文学科', deviationValue: 50 },
          { id: 'fukuoka-hum-edu', name: '教育・臨床心理学科', deviationValue: 51 },
          { id: 'fukuoka-hum-eng', name: '英語学科', deviationValue: 50 },
          { id: 'fukuoka-hum-ger', name: 'ドイツ語学科', deviationValue: 48 },
          { id: 'fukuoka-hum-fre', name: 'フランス語学科', deviationValue: 48 },
          { id: 'fukuoka-hum-asia', name: '東アジア地域言語学科', deviationValue: 48 }
        ]
      },
      {
        id: 'fukuoka-law',
        name: '法学部',
        departments: [
          { id: 'fukuoka-law-law', name: '法律学科', deviationValue: 50 },
          { id: 'fukuoka-law-mgmt', name: '経営法学科', deviationValue: 49 }
        ]
      },
      {
        id: 'fukuoka-econ',
        name: '経済学部',
        departments: [
          { id: 'fukuoka-econ-econ', name: '経済学科', deviationValue: 50 },
          { id: 'fukuoka-econ-ind', name: '産業経済学科', deviationValue: 49 }
        ]
      },
      {
        id: 'fukuoka-com',
        name: '商学部',
        departments: [
          { id: 'fukuoka-com-com', name: '商学科', deviationValue: 50 },
          { id: 'fukuoka-com-mgmt', name: '経営学科', deviationValue: 50 },
          { id: 'fukuoka-com-trade', name: '貿易学科', deviationValue: 49 }
        ]
      },
      {
        id: 'fukuoka-com2',
        name: '商学部第二部',
        departments: [
          { id: 'fukuoka-com2-com', name: '商学科', deviationValue: 44 }
        ]
      },
      {
        id: 'fukuoka-sci',
        name: '理学部',
        departments: [
          { id: 'fukuoka-sci-app', name: '応用数学科', deviationValue: 48 },
          { id: 'fukuoka-sci-phys', name: '物理科学科', deviationValue: 48 },
          { id: 'fukuoka-sci-chem', name: '化学科', deviationValue: 48 },
          { id: 'fukuoka-sci-earth', name: '地球圏科学科', deviationValue: 47 },
          { id: 'fukuoka-sci-social', name: '社会数理・情報インスティテュート', deviationValue: 48 },
          { id: 'fukuoka-sci-nano', name: 'ナノサイエンス・インスティテュート', deviationValue: 48 }
        ]
      },
      {
        id: 'fukuoka-eng',
        name: '工学部',
        departments: [
          { id: 'fukuoka-eng-mech', name: '機械工学科', deviationValue: 47 },
          { id: 'fukuoka-eng-elec', name: '電気工学科', deviationValue: 47 },
          { id: 'fukuoka-eng-elec2', name: '電子情報工学科', deviationValue: 48 },
          { id: 'fukuoka-eng-chem', name: '化学システム工学科', deviationValue: 47 },
          { id: 'fukuoka-eng-civil', name: '社会デザイン工学科', deviationValue: 47 },
          { id: 'fukuoka-eng-arch', name: '建築学科', deviationValue: 49 }
        ]
      },
      {
        id: 'fukuoka-med',
        name: '医学部',
        departments: [
          { id: 'fukuoka-med-med', name: '医学科', deviationValue: 66 },
          { id: 'fukuoka-med-nurs', name: '看護学科', deviationValue: 49 }
        ]
      },
      {
        id: 'fukuoka-pharm',
        name: '薬学部',
        departments: [
          { id: 'fukuoka-pharm-pharm', name: '薬学科', deviationValue: 54 }
        ]
      },
      {
        id: 'fukuoka-sport',
        name: 'スポーツ科学部',
        departments: [
          { id: 'fukuoka-sport-sport', name: 'スポーツ科学科', deviationValue: 48 },
          { id: 'fukuoka-sport-health', name: '健康運動科学科', deviationValue: 47 }
        ]
      }
    ]
  },
  {
    id: 'seinan',
    name: '西南学院大学',
    type: '私立',
    prefecture: '福岡県',
    faculties: [
      {
        id: 'seinan-theo',
        name: '神学部',
        departments: [
          { id: 'seinan-theo-theo', name: '神学科', deviationValue: 48 }
        ]
      },
      {
        id: 'seinan-letters',
        name: '文学部',
        departments: [
          { id: 'seinan-letters-eng', name: '英文学科', deviationValue: 53 },
          { id: 'seinan-letters-foreign', name: '外国語学科', deviationValue: 52 }
        ]
      },
      {
        id: 'seinan-com',
        name: '商学部',
        departments: [
          { id: 'seinan-com-com', name: '商学科', deviationValue: 52 },
          { id: 'seinan-com-mgmt', name: '経営学科', deviationValue: 52 }
        ]
      },
      {
        id: 'seinan-econ',
        name: '経済学部',
        departments: [
          { id: 'seinan-econ-econ', name: '経済学科', deviationValue: 52 },
          { id: 'seinan-econ-int', name: '国際経済学科', deviationValue: 51 }
        ]
      },
      {
        id: 'seinan-law',
        name: '法学部',
        departments: [
          { id: 'seinan-law-law', name: '法律学科', deviationValue: 52 },
          { id: 'seinan-law-int', name: '国際関係法学科', deviationValue: 51 }
        ]
      },
      {
        id: 'seinan-human',
        name: '人間科学部',
        departments: [
          { id: 'seinan-human-child', name: '児童教育学科', deviationValue: 51 },
          { id: 'seinan-human-social', name: '社会福祉学科', deviationValue: 50 },
          { id: 'seinan-human-psy', name: '心理学科', deviationValue: 52 }
        ]
      },
      {
        id: 'seinan-int',
        name: '国際文化学部',
        departments: [
          { id: 'seinan-int-int', name: '国際文化学科', deviationValue: 52 }
        ]
      }
    ]
  },

  // 佐賀県
  {
    id: 'saga',
    name: '佐賀大学',
    type: '国立',
    prefecture: '佐賀県',
    faculties: [
      {
        id: 'saga-edu',
        name: '教育学部',
        departments: [
          { id: 'saga-edu-school', name: '学校教育課程', deviationValue: 49 }
        ]
      },
      {
       id: 'saga-art',
       name: '芸術地域デザイン学部',
       departments: [
         { id: 'saga-art-art', name: '芸術地域デザイン学科', deviationValue: 48 }
       ]
     },
     {
       id: 'saga-econ',
       name: '経済学部',
       departments: [
         { id: 'saga-econ-econ', name: '経済学科', deviationValue: 49 },
         { id: 'saga-econ-mgmt', name: '経営学科', deviationValue: 49 },
         { id: 'saga-econ-law', name: '経済法学科', deviationValue: 48 }
       ]
     },
     {
       id: 'saga-med',
       name: '医学部',
       departments: [
         { id: 'saga-med-med', name: '医学科', deviationValue: 66 },
         { id: 'saga-med-nurs', name: '看護学科', deviationValue: 48 }
       ]
     },
     {
       id: 'saga-sci',
       name: '理工学部',
       departments: [
         { id: 'saga-sci-math', name: '数理科学科', deviationValue: 47 },
         { id: 'saga-sci-phys', name: '物理学科', deviationValue: 47 },
         { id: 'saga-sci-intel', name: '知能情報システム学科', deviationValue: 48 },
         { id: 'saga-sci-func', name: '機能物質化学科', deviationValue: 47 },
         { id: 'saga-sci-mech', name: '機械システム工学科', deviationValue: 47 },
         { id: 'saga-sci-elec', name: '電気電子工学科', deviationValue: 47 },
         { id: 'saga-sci-civil', name: '都市工学科', deviationValue: 47 }
       ]
     },
     {
       id: 'saga-agr',
       name: '農学部',
       departments: [
         { id: 'saga-agr-app', name: '応用生物科学科', deviationValue: 48 },
         { id: 'saga-agr-bio', name: '生物資源科学科', deviationValue: 48 }
       ]
     }
   ]
 },

 // 長崎県
 {
   id: 'nagasaki',
   name: '長崎大学',
   type: '国立',
   prefecture: '長崎県',
   faculties: [
     {
       id: 'nagasaki-multi',
       name: '多文化社会学部',
       departments: [
         { id: 'nagasaki-multi-multi', name: '多文化社会学科', deviationValue: 53 }
       ]
     },
     {
       id: 'nagasaki-edu',
       name: '教育学部',
       departments: [
         { id: 'nagasaki-edu-school', name: '学校教育教員養成課程', deviationValue: 50 }
       ]
     },
     {
       id: 'nagasaki-econ',
       name: '経済学部',
       departments: [
         { id: 'nagasaki-econ-comp', name: '総合経済学科', deviationValue: 51 }
       ]
     },
     {
       id: 'nagasaki-med',
       name: '医学部',
       departments: [
         { id: 'nagasaki-med-med', name: '医学科', deviationValue: 68 },
         { id: 'nagasaki-med-health', name: '保健学科', deviationValue: 50 }
       ]
     },
     {
       id: 'nagasaki-dent',
       name: '歯学部',
       departments: [
         { id: 'nagasaki-dent-dent', name: '歯学科', deviationValue: 57 }
       ]
     },
     {
       id: 'nagasaki-pharm',
       name: '薬学部',
       departments: [
         { id: 'nagasaki-pharm-pharm', name: '薬学科', deviationValue: 58 },
         { id: 'nagasaki-pharm-sci', name: '薬科学科', deviationValue: 56 }
       ]
     },
     {
       id: 'nagasaki-info',
       name: '情報データ科学部',
       departments: [
         { id: 'nagasaki-info-info', name: '情報データ科学科', deviationValue: 50 }
       ]
     },
     {
       id: 'nagasaki-eng',
       name: '工学部',
       departments: [
         { id: 'nagasaki-eng-eng', name: '工学科', deviationValue: 48 }
       ]
     },
     {
       id: 'nagasaki-env',
       name: '環境科学部',
       departments: [
         { id: 'nagasaki-env-env', name: '環境科学科', deviationValue: 49 }
       ]
     },
     {
       id: 'nagasaki-fish',
       name: '水産学部',
       departments: [
         { id: 'nagasaki-fish-fish', name: '水産学科', deviationValue: 50 }
       ]
     }
   ]
 },
 {
   id: 'nagasaki-pref',
   name: '長崎県立大学',
   type: '公立',
   prefecture: '長崎県',
   faculties: [
     {
       id: 'nagapref-econ',
       name: '経営学部',
       departments: [
         { id: 'nagapref-econ-mgmt', name: '経営学科', deviationValue: 48 },
         { id: 'nagapref-econ-int', name: '国際経営学科', deviationValue: 47 }
       ]
     },
     {
       id: 'nagapref-region',
       name: '地域創造学部',
       departments: [
         { id: 'nagapref-region-pub', name: '公共政策学科', deviationValue: 47 },
         { id: 'nagapref-region-bus', name: '実践経済学科', deviationValue: 46 }
       ]
     },
     {
       id: 'nagapref-int',
       name: '国際社会学部',
       departments: [
         { id: 'nagapref-int-int', name: '国際社会学科', deviationValue: 48 }
       ]
     },
     {
       id: 'nagapref-info',
       name: '情報システム学部',
       departments: [
         { id: 'nagapref-info-info', name: '情報システム学科', deviationValue: 47 },
         { id: 'nagapref-info-security', name: '情報セキュリティ学科', deviationValue: 47 }
       ]
     },
     {
       id: 'nagapref-nurs',
       name: '看護栄養学部',
       departments: [
         { id: 'nagapref-nurs-nurs', name: '看護学科', deviationValue: 49 },
         { id: 'nagapref-nurs-nutri', name: '栄養健康学科', deviationValue: 48 }
       ]
     }
   ]
 },
 {
   id: 'nagasaki-junshin',
   name: '長崎純心大学',
   type: '私立',
   prefecture: '長崎県',
   faculties: [
     {
       id: 'junshin-human',
       name: '人文学部',
       departments: [
         { id: 'junshin-human-cul', name: '文化コミュニケーション学科', deviationValue: 42 },
         { id: 'junshin-human-comm', name: '地域包括支援学科', deviationValue: 41 }
       ]
     }
   ]
 },

 // 熊本県
 {
   id: 'kumamoto',
   name: '熊本大学',
   type: '国立',
   prefecture: '熊本県',
   faculties: [
     {
       id: 'kumamoto-letters',
       name: '文学部',
       departments: [
         { id: 'kumamoto-letters-comp', name: '総合人間学科', deviationValue: 56 },
         { id: 'kumamoto-letters-hist', name: '歴史学科', deviationValue: 55 },
         { id: 'kumamoto-letters-lit', name: '文学科', deviationValue: 55 },
         { id: 'kumamoto-letters-comm', name: 'コミュニケーション情報学科', deviationValue: 55 }
       ]
     },
     {
       id: 'kumamoto-edu',
       name: '教育学部',
       departments: [
         { id: 'kumamoto-edu-elem', name: '小学校教員養成課程', deviationValue: 52 },
         { id: 'kumamoto-edu-junior', name: '中学校教員養成課程', deviationValue: 52 },
         { id: 'kumamoto-edu-special', name: '特別支援教育教員養成課程', deviationValue: 51 },
         { id: 'kumamoto-edu-nurse', name: '養護教諭養成課程', deviationValue: 51 }
       ]
     },
     {
       id: 'kumamoto-law',
       name: '法学部',
       departments: [
         { id: 'kumamoto-law-law', name: '法学科', deviationValue: 55 }
       ]
     },
     {
       id: 'kumamoto-sci',
       name: '理学部',
       departments: [
         { id: 'kumamoto-sci-sci', name: '理学科', deviationValue: 52 }
       ]
     },
     {
       id: 'kumamoto-med',
       name: '医学部',
       departments: [
         { id: 'kumamoto-med-med', name: '医学科', deviationValue: 68 },
         { id: 'kumamoto-med-health', name: '保健学科', deviationValue: 52 }
       ]
     },
     {
       id: 'kumamoto-pharm',
       name: '薬学部',
       departments: [
         { id: 'kumamoto-pharm-pharm', name: '薬学科', deviationValue: 60 },
         { id: 'kumamoto-pharm-create', name: '創薬・生命薬科学科', deviationValue: 58 }
       ]
     },
     {
       id: 'kumamoto-eng',
       name: '工学部',
       departments: [
         { id: 'kumamoto-eng-civil', name: '土木建築学科', deviationValue: 51 },
         { id: 'kumamoto-eng-mech', name: '機械数理工学科', deviationValue: 52 },
         { id: 'kumamoto-eng-info', name: '情報電気工学科', deviationValue: 52 },
         { id: 'kumamoto-eng-mat', name: '材料・応用化学科', deviationValue: 51 }
       ]
     }
   ]
 },
 {
   id: 'kumamoto-pref',
   name: '熊本県立大学',
   type: '公立',
   prefecture: '熊本県',
   faculties: [
     {
       id: 'kumapref-letters',
       name: '文学部',
       departments: [
         { id: 'kumapref-letters-jpn', name: '日本語日本文学科', deviationValue: 51 },
         { id: 'kumapref-letters-eng', name: '英語英米文学科', deviationValue: 52 }
       ]
     },
     {
       id: 'kumapref-env',
       name: '環境共生学部',
       departments: [
         { id: 'kumapref-env-env', name: '環境共生学科', deviationValue: 49 }
       ]
     },
     {
       id: 'kumapref-admin',
       name: '総合管理学部',
       departments: [
         { id: 'kumapref-admin-admin', name: '総合管理学科', deviationValue: 50 }
       ]
     }
   ]
 },
 {
   id: 'kumamoto-gakuen',
   name: '熊本学園大学',
   type: '私立',
   prefecture: '熊本県',
   faculties: [
     {
       id: 'kumagaku-com',
       name: '商学部',
       departments: [
         { id: 'kumagaku-com-com', name: '商学科', deviationValue: 44 },
         { id: 'kumagaku-com-hosp', name: 'ホスピタリティ・マネジメント学科', deviationValue: 43 }
       ]
     },
     {
       id: 'kumagaku-econ',
       name: '経済学部',
       departments: [
         { id: 'kumagaku-econ-econ', name: '経済学科', deviationValue: 44 },
         { id: 'kumagaku-econ-regional', name: 'リーガルエコノミクス学科', deviationValue: 43 }
       ]
     },
     {
       id: 'kumagaku-foreign',
       name: '外国語学部',
       departments: [
         { id: 'kumagaku-foreign-eng', name: '英米学科', deviationValue: 44 },
         { id: 'kumagaku-foreign-asia', name: '東アジア学科', deviationValue: 43 }
       ]
     },
     {
       id: 'kumagaku-welfare',
       name: '社会福祉学部',
       departments: [
         { id: 'kumagaku-welfare-welfare1', name: '社会福祉学科', deviationValue: 43 },
         { id: 'kumagaku-welfare-welfare2', name: '福祉環境学科', deviationValue: 42 },
         { id: 'kumagaku-welfare-child', name: '子ども家庭福祉学科', deviationValue: 42 },
         { id: 'kumagaku-welfare-life', name: 'ライフ・ウェルネス学科', deviationValue: 42 }
       ]
     }
   ]
 },

 // 大分県
 {
   id: 'oita',
   name: '大分大学',
   type: '国立',
   prefecture: '大分県',
   faculties: [
     {
       id: 'oita-edu',
       name: '教育学部',
       departments: [
         { id: 'oita-edu-school', name: '学校教育教員養成課程', deviationValue: 49 }
       ]
     },
     {
       id: 'oita-econ',
       name: '経済学部',
       departments: [
         { id: 'oita-econ-econ', name: '経済学科', deviationValue: 49 },
         { id: 'oita-econ-mgmt', name: '経営システム学科', deviationValue: 49 },
         { id: 'oita-econ-region', name: '地域システム学科', deviationValue: 48 },
         { id: 'oita-econ-social', name: '社会イノベーション学科', deviationValue: 48 }
       ]
     },
     {
       id: 'oita-med',
       name: '医学部',
       departments: [
         { id: 'oita-med-med', name: '医学科', deviationValue: 66 },
         { id: 'oita-med-nurs', name: '看護学科', deviationValue: 48 }
       ]
     },
     {
       id: 'oita-sci',
       name: '理工学部',
       departments: [
         { id: 'oita-sci-create', name: '創生工学科', deviationValue: 47 },
         { id: 'oita-sci-eng', name: '共創理工学科', deviationValue: 47 }
       ]
     },
     {
       id: 'oita-welfare',
       name: '福祉健康科学部',
       departments: [
         { id: 'oita-welfare-welfare', name: '福祉健康科学科', deviationValue: 48 }
       ]
     }
   ]
 },
 {
   id: 'oita-nurs',
   name: '大分県立看護科学大学',
   type: '公立',
   prefecture: '大分県',
   faculties: [
     {
       id: 'oitanurs-nurs',
       name: '看護学部',
       departments: [
         { id: 'oitanurs-nurs-nurs', name: '看護学科', deviationValue: 49 }
       ]
     }
   ]
 },
 {
   id: 'apurit',
   name: '立命館アジア太平洋大学',
   type: '私立',
   prefecture: '大分県',
   faculties: [
     {
       id: 'apu-aps',
       name: 'アジア太平洋学部',
       departments: [
         { id: 'apu-aps-aps', name: 'アジア太平洋学科', deviationValue: 55 }
       ]
     },
     {
       id: 'apu-apm',
       name: '国際経営学部',
       departments: [
         { id: 'apu-apm-apm', name: '国際経営学科', deviationValue: 55 }
       ]
     },
     {
       id: 'apu-st',
       name: 'サステイナビリティ観光学部',
       departments: [
         { id: 'apu-st-st', name: 'サステイナビリティ観光学科', deviationValue: 54 }
       ]
     }
   ]
 },

 // 宮崎県
 {
   id: 'miyazaki',
   name: '宮崎大学',
   type: '国立',
   prefecture: '宮崎県',
   faculties: [
     {
       id: 'miyazaki-edu',
       name: '教育学部',
       departments: [
         { id: 'miyazaki-edu-school', name: '学校教育課程', deviationValue: 49 }
       ]
     },
     {
       id: 'miyazaki-med',
       name: '医学部',
       departments: [
         { id: 'miyazaki-med-med', name: '医学科', deviationValue: 66 },
         { id: 'miyazaki-med-nurs', name: '看護学科', deviationValue: 48 }
       ]
     },
     {
       id: 'miyazaki-eng',
       name: '工学部',
       departments: [
         { id: 'miyazaki-eng-env', name: '環境応用化学科', deviationValue: 46 },
         { id: 'miyazaki-eng-social', name: '社会環境システム工学科', deviationValue: 46 },
         { id: 'miyazaki-eng-robo', name: '環境ロボティクス学科', deviationValue: 46 },
         { id: 'miyazaki-eng-mech', name: '機械設計システム工学科', deviationValue: 46 },
         { id: 'miyazaki-eng-elec', name: '電子物理工学科', deviationValue: 46 },
         { id: 'miyazaki-eng-elec2', name: '電気システム工学科', deviationValue: 46 },
         { id: 'miyazaki-eng-info', name: '情報システム工学科', deviationValue: 47 }
       ]
     },
     {
       id: 'miyazaki-agr',
       name: '農学部',
       departments: [
         { id: 'miyazaki-agr-plant', name: '植物生産環境科学科', deviationValue: 48 },
         { id: 'miyazaki-agr-forest', name: '森林緑地環境科学科', deviationValue: 47 },
         { id: 'miyazaki-agr-bio', name: '応用生物科学科', deviationValue: 49 },
         { id: 'miyazaki-agr-marine', name: '海洋生物環境学科', deviationValue: 49 },
         { id: 'miyazaki-agr-animal', name: '畜産草地科学科', deviationValue: 48 },
         { id: 'miyazaki-agr-vet', name: '獣医学科', deviationValue: 63 }
       ]
     },
     {
       id: 'miyazaki-region',
       name: '地域資源創成学部',
       departments: [
         { id: 'miyazaki-region-region', name: '地域資源創成学科', deviationValue: 47 }
       ]
     }
   ]
 },
 {
   id: 'miyazaki-nurs',
   name: '宮崎県立看護大学',
   type: '公立',
   prefecture: '宮崎県',
   faculties: [
     {
       id: 'miyanurs-nurs',
       name: '看護学部',
       departments: [
         { id: 'miyanurs-nurs-nurs', name: '看護学科', deviationValue: 48 }
       ]
     }
   ]
 },
 {
   id: 'miyazaki-muni',
   name: '宮崎公立大学',
   type: '公立',
   prefecture: '宮崎県',
   faculties: [
     {
       id: 'miyamuni-human',
       name: '人文学部',
       departments: [
         { id: 'miyamuni-human-int', name: '国際文化学科', deviationValue: 47 }
       ]
     }
   ]
 },

 // 鹿児島県
 {
   id: 'kagoshima',
   name: '鹿児島大学',
   type: '国立',
   prefecture: '鹿児島県',
   faculties: [
     {
       id: 'kagoshima-law',
       name: '法文学部',
       departments: [
         { id: 'kagoshima-law-law', name: '法経社会学科', deviationValue: 50 },
         { id: 'kagoshima-law-human', name: '人文学科', deviationValue: 50 }
       ]
     },
     {
       id: 'kagoshima-edu',
       name: '教育学部',
       departments: [
         { id: 'kagoshima-edu-school', name: '学校教育教員養成課程', deviationValue: 49 }
       ]
     },
     {
       id: 'kagoshima-sci',
       name: '理学部',
       departments: [
         { id: 'kagoshima-sci-sci', name: '理学科', deviationValue: 49 }
       ]
     },
     {
       id: 'kagoshima-med',
       name: '医学部',
       departments: [
         { id: 'kagoshima-med-med', name: '医学科', deviationValue: 66 },
         { id: 'kagoshima-med-health', name: '保健学科', deviationValue: 49 }
       ]
     },
     {
       id: 'kagoshima-dent',
       name: '歯学部',
       departments: [
         { id: 'kagoshima-dent-dent', name: '歯学科', deviationValue: 56 }
       ]
     },
     {
       id: 'kagoshima-eng',
       name: '工学部',
       departments: [
         { id: 'kagoshima-eng-mech', name: '機械工学科', deviationValue: 47 },
         { id: 'kagoshima-eng-elec', name: '電気電子工学科', deviationValue: 47 },
         { id: 'kagoshima-eng-civil', name: '海洋土木工学科', deviationValue: 46 },
         { id: 'kagoshima-eng-chem', name: '化学工学科', deviationValue: 47 },
         { id: 'kagoshima-eng-bio', name: '化学生命工学科', deviationValue: 47 },
         { id: 'kagoshima-eng-info', name: '情報生体システム工学科', deviationValue: 48 },
         { id: 'kagoshima-eng-arch', name: '建築学科', deviationValue: 49 }
       ]
     },
     {
       id: 'kagoshima-agr',
       name: '農学部',
       departments: [
         { id: 'kagoshima-agr-agr', name: '農業生産科学科', deviationValue: 48 },
         { id: 'kagoshima-agr-food', name: '食料生命科学科', deviationValue: 49 },
         { id: 'kagoshima-agr-env', name: '農林環境科学科', deviationValue: 48 }
       ]
     },
     {
       id: 'kagoshima-fish',
       name: '水産学部',
       departments: [
         { id: 'kagoshima-fish-fish', name: '水産学科', deviationValue: 50 }
       ]
     },
     {
       id: 'kagoshima-vet',
       name: '共同獣医学部',
       departments: [
         { id: 'kagoshima-vet-vet', name: '獣医学科', deviationValue: 63 }
       ]
     }
   ]
 },

 // 沖縄県
 {
   id: 'ryukyus',
   name: '琉球大学',
   type: '国立',
   prefecture: '沖縄県',
   faculties: [
     {
       id: 'ryukyus-law',
       name: '人文社会学部',
       departments: [
         { id: 'ryukyus-law-law', name: '法学プログラム', deviationValue: 48 },
         { id: 'ryukyus-law-pol', name: '政治・国際関係学プログラム', deviationValue: 48 },
         { id: 'ryukyus-law-phil', name: '哲学・教育学プログラム', deviationValue: 47 },
         { id: 'ryukyus-law-psy', name: '心理学プログラム', deviationValue: 49 },
         { id: 'ryukyus-law-soc', name: '社会学プログラム', deviationValue: 48 },
         { id: 'ryukyus-law-ryukyu', name: '琉球・沖縄文化プログラム', deviationValue: 47 },
         { id: 'ryukyus-law-hist', name: '歴史・考古学プログラム', deviationValue: 48 },
         { id: 'ryukyus-law-lit', name: '言語学・文学プログラム', deviationValue: 48 }
       ]
     },
     {
       id: 'ryukyus-int',
       name: '国際地域創造学部',
       departments: [
         { id: 'ryukyus-int-int', name: '国際地域創造学科', deviationValue: 48 }
       ]
     },
     {
       id: 'ryukyus-edu',
       name: '教育学部',
       departments: [
         { id: 'ryukyus-edu-school', name: '学校教育教員養成課程', deviationValue: 47 }
       ]
     },
     {
       id: 'ryukyus-sci',
       name: '理学部',
       departments: [
         { id: 'ryukyus-sci-math', name: '数理科学科', deviationValue: 46 },
         { id: 'ryukyus-sci-phys', name: '物理学科', deviationValue: 46 },
         { id: 'ryukyus-sci-earth', name: '地球環境学科', deviationValue: 46 },
         { id: 'ryukyus-sci-chem', name: '化学科', deviationValue: 46 },
         { id: 'ryukyus-sci-bio', name: '生物学科', deviationValue: 47 }
       ]
     },
     {
       id: 'ryukyus-med',
       name: '医学部',
       departments: [
         { id: 'ryukyus-med-med', name: '医学科', deviationValue: 66 },
         { id: 'ryukyus-med-health', name: '保健学科', deviationValue: 46 }
       ]
     },
     {
       id: 'ryukyus-eng',
       name: '工学部',
       departments: [
         { id: 'ryukyus-eng-mech', name: '機械工学コース', deviationValue: 44 },
         { id: 'ryukyus-eng-energy', name: 'エネルギー環境工学コース', deviationValue: 44 },
         { id: 'ryukyus-eng-elec', name: '電気システム工学コース', deviationValue: 44 },
         { id: 'ryukyus-eng-elec2', name: '電子情報通信コース', deviationValue: 45 },
         { id: 'ryukyus-eng-civil', name: '社会基盤デザインコース', deviationValue: 44 },
         { id: 'ryukyus-eng-arch', name: '建築学コース', deviationValue: 46 },
         { id: 'ryukyus-eng-intel', name: '知能情報コース', deviationValue: 45 }
       ]
     },
     {
       id: 'ryukyus-agr',
       name: '農学部',
       departments: [
         { id: 'ryukyus-agr-sub', name: '亜熱帯地域農学科', deviationValue: 46 },
         { id: 'ryukyus-agr-agri', name: '亜熱帯農林環境科学科', deviationValue: 46 },
         { id: 'ryukyus-agr-region', name: '地域農業工学科', deviationValue: 45 },
         { id: 'ryukyus-agr-bio', name: '亜熱帯生物資源科学科', deviationValue: 47 }
       ]
     }
   ]
 },
 {
   id: 'okinawa-arts',
   name: '沖縄県立芸術大学',
   type: '公立',
   prefecture: '沖縄県',
   faculties: [
     {
       id: 'okiarts-arts',
       name: '美術工芸学部',
       departments: [
         { id: 'okiarts-arts-art', name: '美術学科', deviationValue: 46 },
         { id: 'okiarts-arts-design', name: 'デザイン工芸学科', deviationValue: 46 }
       ]
     },
     {
       id: 'okiarts-music',
       name: '音楽学部',
       departments: [
         { id: 'okiarts-music-music', name: '音楽学科', deviationValue: 45 }
       ]
     }
   ]
 },
 {
   id: 'okinawa-nurs',
   name: '沖縄県立看護大学',
   type: '公立',
   prefecture: '沖縄県',
   faculties: [
     {
       id: 'okinurs-nurs',
       name: '看護学部',
       departments: [
         { id: 'okinurs-nurs-nurs', name: '看護学科', deviationValue: 48 }
       ]
     }
   ]
 },
 {
   id: 'meio',
   name: '名桜大学',
   type: '公立',
   prefecture: '沖縄県',
   faculties: [
     {
       id: 'meio-int',
       name: '国際学群',
       departments: [
         { id: 'meio-int-int', name: '国際学類', deviationValue: 45 }
       ]
     },
     {
       id: 'meio-human',
       name: '人間健康学部',
       departments: [
         { id: 'meio-human-sport', name: 'スポーツ健康学科', deviationValue: 44 },
         { id: 'meio-human-nurs', name: '看護学科', deviationValue: 46 }
       ]
     }
   ]
 },
 {
   id: 'okinawa-int',
   name: '沖縄国際大学',
   type: '私立',
   prefecture: '沖縄県',
   faculties: [
     {
       id: 'okiu-law',
       name: '法学部',
       departments: [
         { id: 'okiu-law-law', name: '法律学科', deviationValue: 42 },
         { id: 'okiu-law-local', name: '地域行政学科', deviationValue: 41 }
       ]
     },
     {
       id: 'okiu-econ',
       name: '経済学部',
       departments: [
         { id: 'okiu-econ-econ', name: '経済学科', deviationValue: 42 },
         { id: 'okiu-econ-env', name: '地域環境政策学科', deviationValue: 41 }
       ]
     },
     {
       id: 'okiu-ind',
       name: '産業情報学部',
       departments: [
         { id: 'okiu-ind-corp', name: '企業システム学科', deviationValue: 41 },
         { id: 'okiu-ind-info', name: '産業情報学科', deviationValue: 41 }
       ]
     },
     {
       id: 'okiu-comp',
       name: '総合文化学部',
       departments: [
         { id: 'okiu-comp-jpn', name: '日本文化学科', deviationValue: 42 },
         { id: 'okiu-comp-eng', name: '英米言語文化学科', deviationValue: 42 },
         { id: 'okiu-comp-soc', name: '社会文化学科', deviationValue: 42 },
         { id: 'okiu-comp-human', name: '人間福祉学科', deviationValue: 41 }
       ]
     }
   ]
 }
]