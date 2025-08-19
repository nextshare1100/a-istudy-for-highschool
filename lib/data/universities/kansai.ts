import { University } from './index'

export const kansaiUniversities: University[] = [
  // 京都府
  {
    id: 'kyoto',
    name: '京都大学',
    type: '国立',
    prefecture: '京都府',
    faculties: [
      {
        id: 'kyoto-letters',
        name: '文学部',
        departments: [
          { id: 'kyoto-letters-hum', name: '人文学科', deviationValue: 72 }
        ]
      },
      {
        id: 'kyoto-edu',
        name: '教育学部',
        departments: [
          { id: 'kyoto-edu-edu', name: '教育科学科', deviationValue: 70 }
        ]
      },
      {
        id: 'kyoto-law',
        name: '法学部',
        departments: [
          { id: 'kyoto-law-law', name: '法学科', deviationValue: 73 }
        ]
      },
      {
        id: 'kyoto-econ',
        name: '経済学部',
        departments: [
          { id: 'kyoto-econ-econ', name: '経済経営学科', deviationValue: 71 }
        ]
      },
      {
        id: 'kyoto-sci',
        name: '理学部',
        departments: [
          { id: 'kyoto-sci-sci', name: '理学科', deviationValue: 71 }
        ]
      },
      {
        id: 'kyoto-med',
        name: '医学部',
        departments: [
          { id: 'kyoto-med-med', name: '医学科', deviationValue: 76 },
          { id: 'kyoto-med-human', name: '人間健康科学科', deviationValue: 65 }
        ]
      },
      {
        id: 'kyoto-pharm',
        name: '薬学部',
        departments: [
          { id: 'kyoto-pharm-sci', name: '薬科学科', deviationValue: 69 },
          { id: 'kyoto-pharm-pharm', name: '薬学科', deviationValue: 70 }
        ]
      },
      {
        id: 'kyoto-eng',
        name: '工学部',
        departments: [
          { id: 'kyoto-eng-global', name: '地球工学科', deviationValue: 68 },
          { id: 'kyoto-eng-arch', name: '建築学科', deviationValue: 70 },
          { id: 'kyoto-eng-phys', name: '物理工学科', deviationValue: 69 },
          { id: 'kyoto-eng-elec', name: '電気電子工学科', deviationValue: 69 },
          { id: 'kyoto-eng-info', name: '情報学科', deviationValue: 70 },
          { id: 'kyoto-eng-chem', name: '工業化学科', deviationValue: 68 }
        ]
      },
      {
        id: 'kyoto-agr',
        name: '農学部',
        departments: [
          { id: 'kyoto-agr-bio', name: '資源生物科学科', deviationValue: 68 },
          { id: 'kyoto-agr-app', name: '応用生命科学科', deviationValue: 68 },
          { id: 'kyoto-agr-env', name: '地域環境工学科', deviationValue: 67 },
          { id: 'kyoto-agr-food', name: '食料・環境経済学科', deviationValue: 67 },
          { id: 'kyoto-agr-forest', name: '森林科学科', deviationValue: 67 },
          { id: 'kyoto-agr-food-bio', name: '食品生物科学科', deviationValue: 68 }
        ]
      },
      {
        id: 'kyoto-integrated',
        name: '総合人間学部',
        departments: [
          { id: 'kyoto-integrated-human', name: '総合人間学科', deviationValue: 70 }
       ]
     }
   ]
 },
 {
   id: 'kyoto-tech',
   name: '京都工芸繊維大学',
   type: '国立',
   prefecture: '京都府',
   faculties: [
     {
       id: 'kit-tech',
       name: '工芸科学部',
       departments: [
         { id: 'kit-tech-bio', name: '応用生物学域', deviationValue: 56 },
         { id: 'kit-tech-chem', name: '応用化学系', deviationValue: 56 },
         { id: 'kit-tech-elec', name: '電子システム工学域', deviationValue: 55 },
         { id: 'kit-tech-info', name: '情報工学域', deviationValue: 57 },
         { id: 'kit-tech-mech', name: '機械工学域', deviationValue: 56 },
         { id: 'kit-tech-design', name: 'デザイン・建築学域', deviationValue: 58 }
       ]
     }
   ]
 },
 {
   id: 'kyoto-pref',
   name: '京都府立大学',
   type: '公立',
   prefecture: '京都府',
   faculties: [
     {
       id: 'kpu-letters',
       name: '文学部',
       departments: [
         { id: 'kpu-letters-jpn', name: '日本・中国文学科', deviationValue: 59 },
         { id: 'kpu-letters-eur', name: '欧米言語文化学科', deviationValue: 58 },
         { id: 'kpu-letters-hist', name: '歴史学科', deviationValue: 58 }
       ]
     },
     {
       id: 'kpu-public',
       name: '公共政策学部',
       departments: [
         { id: 'kpu-public-policy', name: '公共政策学科', deviationValue: 58 },
         { id: 'kpu-public-welfare', name: '福祉社会学科', deviationValue: 57 }
       ]
     },
     {
       id: 'kpu-life',
       name: '生命環境学部',
       departments: [
         { id: 'kpu-life-life', name: '生命分子化学科', deviationValue: 56 },
         { id: 'kpu-life-agr', name: '農学生命科学科', deviationValue: 56 },
         { id: 'kpu-life-food', name: '食保健学科', deviationValue: 57 },
         { id: 'kpu-life-env', name: '環境・情報科学科', deviationValue: 56 },
         { id: 'kpu-life-design', name: '環境デザイン学科', deviationValue: 56 },
         { id: 'kpu-life-forest', name: '森林科学科', deviationValue: 55 }
       ]
     }
   ]
 },
 {
   id: 'kyoto-pref-med',
   name: '京都府立医科大学',
   type: '公立',
   prefecture: '京都府',
   faculties: [
     {
       id: 'kpum-med',
       name: '医学部',
       departments: [
         { id: 'kpum-med-med', name: '医学科', deviationValue: 69 },
         { id: 'kpum-med-nurs', name: '看護学科', deviationValue: 57 }
       ]
     }
   ]
 },
 {
   id: 'kyoto-city-arts',
   name: '京都市立芸術大学',
   type: '公立',
   prefecture: '京都府',
   faculties: [
     {
       id: 'kcua-art',
       name: '美術学部',
       departments: [
         { id: 'kcua-art-fine', name: '美術科', deviationValue: 56 },
         { id: 'kcua-art-design', name: 'デザイン科', deviationValue: 58 },
         { id: 'kcua-art-craft', name: '工芸科', deviationValue: 56 },
         { id: 'kcua-art-comp', name: '総合芸術学科', deviationValue: 57 }
       ]
     },
     {
       id: 'kcua-music',
       name: '音楽学部',
       departments: [
         { id: 'kcua-music-music', name: '音楽学科', deviationValue: 55 }
       ]
     }
   ]
 },
 {
   id: 'doshisha',
   name: '同志社大学',
   type: '私立',
   prefecture: '京都府',
   faculties: [
     {
       id: 'doshisha-theo',
       name: '神学部',
       departments: [
         { id: 'doshisha-theo-theo', name: '神学科', deviationValue: 58 }
       ]
     },
     {
       id: 'doshisha-lit',
       name: '文学部',
       departments: [
         { id: 'doshisha-lit-eng', name: '英文学科', deviationValue: 63 },
         { id: 'doshisha-lit-phil', name: '哲学科', deviationValue: 61 },
         { id: 'doshisha-lit-aes', name: '美学芸術学科', deviationValue: 61 },
         { id: 'doshisha-lit-cul', name: '文化史学科', deviationValue: 62 },
         { id: 'doshisha-lit-jpn', name: '国文学科', deviationValue: 62 }
       ]
     },
     {
       id: 'doshisha-soc',
       name: '社会学部',
       departments: [
         { id: 'doshisha-soc-soc', name: '社会学科', deviationValue: 62 },
         { id: 'doshisha-soc-wel', name: '社会福祉学科', deviationValue: 60 },
         { id: 'doshisha-soc-media', name: 'メディア学科', deviationValue: 62 },
         { id: 'doshisha-soc-ind', name: '産業関係学科', deviationValue: 61 },
         { id: 'doshisha-soc-edu', name: '教育文化学科', deviationValue: 61 }
       ]
     },
     {
       id: 'doshisha-law',
       name: '法学部',
       departments: [
         { id: 'doshisha-law-law', name: '法律学科', deviationValue: 63 },
         { id: 'doshisha-law-pol', name: '政治学科', deviationValue: 62 }
       ]
     },
     {
       id: 'doshisha-econ',
       name: '経済学部',
       departments: [
         { id: 'doshisha-econ-econ', name: '経済学科', deviationValue: 62 }
       ]
     },
     {
       id: 'doshisha-com',
       name: '商学部',
       departments: [
         { id: 'doshisha-com-com', name: '商学科', deviationValue: 62 }
       ]
     },
     {
       id: 'doshisha-policy',
       name: '政策学部',
       departments: [
         { id: 'doshisha-policy-policy', name: '政策学科', deviationValue: 61 }
       ]
     },
     {
       id: 'doshisha-cul',
       name: '文化情報学部',
       departments: [
         { id: 'doshisha-cul-cul', name: '文化情報学科', deviationValue: 59 }
       ]
     },
     {
       id: 'doshisha-sci',
       name: '理工学部',
       departments: [
         { id: 'doshisha-sci-info', name: 'インテリジェント情報工学科', deviationValue: 59 },
         { id: 'doshisha-sci-sys', name: '情報システムデザイン学科', deviationValue: 58 },
         { id: 'doshisha-sci-elec', name: '電気工学科', deviationValue: 57 },
         { id: 'doshisha-sci-elec2', name: '電子工学科', deviationValue: 57 },
         { id: 'doshisha-sci-mech', name: '機械システム工学科', deviationValue: 58 },
         { id: 'doshisha-sci-energy', name: 'エネルギー機械工学科', deviationValue: 57 },
         { id: 'doshisha-sci-func', name: '機能分子・生命化学科', deviationValue: 57 },
         { id: 'doshisha-sci-chem', name: '化学システム創成工学科', deviationValue: 56 },
         { id: 'doshisha-sci-env', name: '環境システム学科', deviationValue: 57 },
         { id: 'doshisha-sci-math', name: '数理システム学科', deviationValue: 58 }
       ]
     },
     {
       id: 'doshisha-life',
       name: '生命医科学部',
       departments: [
         { id: 'doshisha-life-med', name: '医工学科', deviationValue: 56 },
         { id: 'doshisha-life-info', name: '医情報学科', deviationValue: 55 },
         { id: 'doshisha-life-sys', name: '医生命システム学科', deviationValue: 56 }
       ]
     },
     {
       id: 'doshisha-sport',
       name: 'スポーツ健康科学部',
       departments: [
         { id: 'doshisha-sport-sport', name: 'スポーツ健康科学科', deviationValue: 58 }
       ]
     },
     {
       id: 'doshisha-psy',
       name: '心理学部',
       departments: [
         { id: 'doshisha-psy-psy', name: '心理学科', deviationValue: 63 }
       ]
     },
     {
       id: 'doshisha-global',
       name: 'グローバル・コミュニケーション学部',
       departments: [
         { id: 'doshisha-global-eng', name: 'グローバル・コミュニケーション学科', deviationValue: 64 }
       ]
     },
     {
       id: 'doshisha-grs',
       name: 'グローバル地域文化学部',
       departments: [
         { id: 'doshisha-grs-eur', name: 'グローバル地域文化学科', deviationValue: 62 }
       ]
     }
   ]
 },
 {
   id: 'ritsumeikan',
   name: '立命館大学',
   type: '私立',
   prefecture: '京都府',
   faculties: [
     {
       id: 'rits-law',
       name: '法学部',
       departments: [
         { id: 'rits-law-law', name: '法学科', deviationValue: 60 }
       ]
     },
     {
       id: 'rits-letters',
       name: '文学部',
       departments: [
         { id: 'rits-letters-hum', name: '人文学科', deviationValue: 60 }
       ]
     },
     {
       id: 'rits-int',
       name: '国際関係学部',
       departments: [
         { id: 'rits-int-int', name: '国際関係学科', deviationValue: 63 }
       ]
     },
     {
       id: 'rits-econ',
       name: '経済学部',
       departments: [
         { id: 'rits-econ-econ', name: '経済学科', deviationValue: 59 }
       ]
     },
     {
       id: 'rits-mgmt',
       name: '経営学部',
       departments: [
         { id: 'rits-mgmt-mgmt', name: '経営学科', deviationValue: 60 },
         { id: 'rits-mgmt-int', name: '国際経営学科', deviationValue: 61 }
       ]
     },
     {
       id: 'rits-policy',
       name: '政策科学部',
       departments: [
         { id: 'rits-policy-policy', name: '政策科学科', deviationValue: 58 }
       ]
     },
     {
       id: 'rits-psy',
       name: '総合心理学部',
       departments: [
         { id: 'rits-psy-psy', name: '総合心理学科', deviationValue: 61 }
       ]
     },
     {
       id: 'rits-global',
       name: 'グローバル教養学部',
       departments: [
         { id: 'rits-global-global', name: 'グローバル教養学科', deviationValue: 63 }
       ]
     },
     {
       id: 'rits-sci',
       name: '理工学部',
       departments: [
         { id: 'rits-sci-math', name: '数理科学科', deviationValue: 54 },
         { id: 'rits-sci-phys', name: '物理科学科', deviationValue: 54 },
         { id: 'rits-sci-elec', name: '電気電子工学科', deviationValue: 55 },
         { id: 'rits-sci-elec2', name: '電子情報工学科', deviationValue: 56 },
         { id: 'rits-sci-mech', name: '機械工学科', deviationValue: 56 },
         { id: 'rits-sci-robo', name: 'ロボティクス学科', deviationValue: 55 },
         { id: 'rits-sci-civil', name: '環境都市工学科', deviationValue: 54 },
         { id: 'rits-sci-arch', name: '建築都市デザイン学科', deviationValue: 57 }
       ]
     },
     {
       id: 'rits-info',
       name: '情報理工学部',
       departments: [
         { id: 'rits-info-info', name: '情報理工学科', deviationValue: 58 }
       ]
     },
     {
       id: 'rits-life',
       name: '生命科学部',
       departments: [
         { id: 'rits-life-app', name: '応用化学科', deviationValue: 55 },
         { id: 'rits-life-bio', name: '生物工学科', deviationValue: 55 },
         { id: 'rits-life-life', name: '生命情報学科', deviationValue: 54 },
         { id: 'rits-life-med', name: '生命医科学科', deviationValue: 55 }
       ]
     },
     {
       id: 'rits-pharm',
       name: '薬学部',
       departments: [
         { id: 'rits-pharm-pharm', name: '薬学科', deviationValue: 58 },
         { id: 'rits-pharm-create', name: '創薬科学科', deviationValue: 56 }
       ]
     },
     {
       id: 'rits-sport',
       name: 'スポーツ健康科学部',
       departments: [
         { id: 'rits-sport-sport', name: 'スポーツ健康科学科', deviationValue: 56 }
       ]
     },
     {
       id: 'rits-food',
       name: '食マネジメント学部',
       departments: [
         { id: 'rits-food-food', name: '食マネジメント学科', deviationValue: 56 }
       ]
     },
     {
       id: 'rits-image',
       name: '映像学部',
       departments: [
         { id: 'rits-image-image', name: '映像学科', deviationValue: 58 }
       ]
     }
   ]
 },
 {
   id: 'kyoto-women',
   name: '京都女子大学',
   type: '私立',
   prefecture: '京都府',
   faculties: [
     {
       id: 'kwu-lit',
       name: '文学部',
       departments: [
         { id: 'kwu-lit-jpn', name: '国文学科', deviationValue: 52 },
         { id: 'kwu-lit-eng', name: '英文学科', deviationValue: 51 },
         { id: 'kwu-lit-hist', name: '史学科', deviationValue: 53 }
       ]
     },
     {
       id: 'kwu-dev',
       name: '発達教育学部',
       departments: [
         { id: 'kwu-dev-edu', name: '教育学科', deviationValue: 52 },
         { id: 'kwu-dev-child', name: '児童学科', deviationValue: 51 },
         { id: 'kwu-dev-psy', name: '心理学科', deviationValue: 53 }
       ]
     },
     {
       id: 'kwu-home',
       name: '家政学部',
       departments: [
         { id: 'kwu-home-food', name: '食物栄養学科', deviationValue: 54 },
         { id: 'kwu-home-life', name: '生活造形学科', deviationValue: 51 }
       ]
     },
     {
       id: 'kwu-contemp',
       name: '現代社会学部',
       departments: [
         { id: 'kwu-contemp-soc', name: '現代社会学科', deviationValue: 52 }
       ]
     },
     {
       id: 'kwu-law',
       name: '法学部',
       departments: [
         { id: 'kwu-law-law', name: '法学科', deviationValue: 51 }
       ]
     }
   ]
 },
 {
   id: 'ryukoku',
   name: '龍谷大学',
   type: '私立',
   prefecture: '京都府',
   faculties: [
     {
       id: 'ryukoku-letters',
       name: '文学部',
       departments: [
         { id: 'ryukoku-letters-shin', name: '真宗学科', deviationValue: 46 },
         { id: 'ryukoku-letters-bud', name: '仏教学科', deviationValue: 46 },
         { id: 'ryukoku-letters-phil', name: '哲学科', deviationValue: 49 },
         { id: 'ryukoku-letters-hist', name: '歴史学科', deviationValue: 52 },
         { id: 'ryukoku-letters-jpn', name: '日本語日本文学科', deviationValue: 51 },
         { id: 'ryukoku-letters-eng', name: '英語英米文学科', deviationValue: 50 }
       ]
     },
     {
       id: 'ryukoku-psy',
       name: '心理学部',
       departments: [
         { id: 'ryukoku-psy-psy', name: '心理学科', deviationValue: 52 }
       ]
     },
     {
       id: 'ryukoku-econ',
       name: '経済学部',
       departments: [
         { id: 'ryukoku-econ-econ', name: '経済学科', deviationValue: 50 }
       ]
     },
     {
       id: 'ryukoku-mgmt',
       name: '経営学部',
       departments: [
         { id: 'ryukoku-mgmt-mgmt', name: '経営学科', deviationValue: 50 }
       ]
     },
     {
       id: 'ryukoku-law',
       name: '法学部',
       departments: [
         { id: 'ryukoku-law-law', name: '法律学科', deviationValue: 50 }
       ]
     },
     {
       id: 'ryukoku-policy',
       name: '政策学部',
       departments: [
         { id: 'ryukoku-policy-policy', name: '政策学科', deviationValue: 49 }
       ]
     },
     {
       id: 'ryukoku-int',
       name: '国際学部',
       departments: [
         { id: 'ryukoku-int-int', name: '国際文化学科', deviationValue: 51 },
         { id: 'ryukoku-int-global', name: 'グローバルスタディーズ学科', deviationValue: 51 }
       ]
     },
     {
       id: 'ryukoku-adv',
       name: '先端理工学部',
       departments: [
         { id: 'ryukoku-adv-math', name: '数理・情報科学課程', deviationValue: 48 },
         { id: 'ryukoku-adv-intel', name: '知能情報メディア課程', deviationValue: 49 },
         { id: 'ryukoku-adv-elec', name: '電子情報通信課程', deviationValue: 47 },
         { id: 'ryukoku-adv-mech', name: '機械工学・ロボティクス課程', deviationValue: 47 },
         { id: 'ryukoku-adv-chem', name: '応用化学課程', deviationValue: 47 },
         { id: 'ryukoku-adv-env', name: '環境生態工学課程', deviationValue: 47 }
       ]
     },
     {
       id: 'ryukoku-soc',
       name: '社会学部',
       departments: [
         { id: 'ryukoku-soc-soc', name: '社会学科', deviationValue: 50 },
         { id: 'ryukoku-soc-comm', name: 'コミュニティマネジメント学科', deviationValue: 48 },
         { id: 'ryukoku-soc-mod', name: '現代福祉学科', deviationValue: 48 }
       ]
     },
     {
       id: 'ryukoku-agr',
       name: '農学部',
       departments: [
         { id: 'ryukoku-agr-plant', name: '植物生命科学科', deviationValue: 48 },
         { id: 'ryukoku-agr-resource', name: '資源生物科学科', deviationValue: 48 },
         { id: 'ryukoku-agr-food', name: '食品栄養学科', deviationValue: 49 },
         { id: 'ryukoku-agr-agri', name: '食料農業システム学科', deviationValue: 47 }
       ]
     }
   ]
 },

 // 大阪府
 {
   id: 'osaka',
   name: '大阪大学',
   type: '国立',
   prefecture: '大阪府',
   faculties: [
     {
       id: 'osaka-letters',
       name: '文学部',
       departments: [
         { id: 'osaka-letters-hum', name: '人文学科', deviationValue: 68 }
       ]
     },
     {
       id: 'osaka-human',
       name: '人間科学部',
       departments: [
         { id: 'osaka-human-human', name: '人間科学科', deviationValue: 68 }
       ]
     },
     {
       id: 'osaka-lang',
       name: '外国語学部',
       departments: [
         { id: 'osaka-lang-chi', name: '中国語専攻', deviationValue: 65 },
         { id: 'osaka-lang-kor', name: '朝鮮語専攻', deviationValue: 64 },
         { id: 'osaka-lang-mon', name: 'モンゴル語専攻', deviationValue: 62 },
         { id: 'osaka-lang-indo', name: 'インドネシア語専攻', deviationValue: 63 },
         { id: 'osaka-lang-fil', name: 'フィリピン語専攻', deviationValue: 63 },
         { id: 'osaka-lang-thai', name: 'タイ語専攻', deviationValue: 63 },
         { id: 'osaka-lang-viet', name: 'ベトナム語専攻', deviationValue: 63 },
         { id: 'osaka-lang-bur', name: 'ビルマ語専攻', deviationValue: 62 },
         { id: 'osaka-lang-hin', name: 'ヒンディー語専攻', deviationValue: 62 },
         { id: 'osaka-lang-urd', name: 'ウルドゥー語専攻', deviationValue: 62 },
         { id: 'osaka-lang-ara', name: 'アラビア語専攻', deviationValue: 64 },
         { id: 'osaka-lang-per', name: 'ペルシア語専攻', deviationValue: 63 },
         { id: 'osaka-lang-tur', name: 'トルコ語専攻', deviationValue: 63 },
         { id: 'osaka-lang-rus', name: 'ロシア語専攻', deviationValue: 65 },
         { id: 'osaka-lang-hun', name: 'ハンガリー語専攻', deviationValue: 62 },
         { id: 'osaka-lang-den', name: 'デンマーク語専攻', deviationValue: 63 },
         { id: 'osaka-lang-swe', name: 'スウェーデン語専攻', deviationValue: 63 },
         { id: 'osaka-lang-ger', name: 'ドイツ語専攻', deviationValue: 65 },
         { id: 'osaka-lang-eng', name: '英語専攻', deviationValue: 67 },
         { id: 'osaka-lang-fre', name: 'フランス語専攻', deviationValue: 66 },
         { id: 'osaka-lang-ita', name: 'イタリア語専攻', deviationValue: 65 },
         { id: 'osaka-lang-spa', name: 'スペイン語専攻', deviationValue: 66 },
         { id: 'osaka-lang-por', name: 'ポルトガル語専攻', deviationValue: 65 },
         { id: 'osaka-lang-jpn', name: '日本語専攻', deviationValue: 65 }
       ]
     },
     {
       id: 'osaka-law',
       name: '法学部',
       departments: [
         { id: 'osaka-law-law', name: '法学科', deviationValue: 69 },
         { id: 'osaka-law-int', name: '国際公共政策学科', deviationValue: 68 }
       ]
     },
     {
       id: 'osaka-econ',
       name: '経済学部',
       departments: [
         { id: 'osaka-econ-econ', name: '経済・経営学科', deviationValue: 68 }
       ]
     },
     {
       id: 'osaka-sci',
       name: '理学部',
       departments: [
         { id: 'osaka-sci-math', name: '数学科', deviationValue: 65 },
         { id: 'osaka-sci-phys', name: '物理学科', deviationValue: 65 },
         { id: 'osaka-sci-chem', name: '化学科', deviationValue: 65 },
         { id: 'osaka-sci-bio', name: '生物科学科', deviationValue: 65 }
       ]
     },
     {
       id: 'osaka-med',
       name: '医学部',
       departments: [
         { id: 'osaka-med-med', name: '医学科', deviationValue: 74 },
         { id: 'osaka-med-health', name: '保健学科', deviationValue: 61 }
       ]
     },
     {
       id: 'osaka-dent',
       name: '歯学部',
       departments: [
         { id: 'osaka-dent-dent', name: '歯学科', deviationValue: 65 }
       ]
     },
     {
       id: 'osaka-pharm',
       name: '薬学部',
       departments: [
         { id: 'osaka-pharm-pharm', name: '薬学科', deviationValue: 67 }
       ]
     },
     {
       id: 'osaka-eng',
       name: '工学部',
       departments: [
         { id: 'osaka-eng-app-sci', name: '応用自然科学科', deviationValue: 64 },
         { id: 'osaka-eng-app-phys', name: '応用理工学科', deviationValue: 64 },
         { id: 'osaka-eng-elec', name: '電子情報工学科', deviationValue: 65 },
         { id: 'osaka-eng-env', name: '環境・エネルギー工学科', deviationValue: 63 },
         { id: 'osaka-eng-bio', name: '地球総合工学科', deviationValue: 63 }
       ]
     },
     {
       id: 'osaka-eng-sci',
       name: '基礎工学部',
       departments: [
         { id: 'osaka-eng-sci-elec', name: '電子物理科学科', deviationValue: 64 },
         { id: 'osaka-eng-sci-chem', name: '化学応用科学科', deviationValue: 64 },
         { id: 'osaka-eng-sci-sys', name: 'システム科学科', deviationValue: 64 },
         { id: 'osaka-eng-sci-info', name: '情報科学科', deviationValue: 65 }
       ]
     }
   ]
 },
 {
   id: 'osaka-city',
   name: '大阪公立大学',
   type: '公立',
   prefecture: '大阪府',
   faculties: [
     {
       id: 'omu-mod-sys',
       name: '現代システム科学域',
       departments: [
         { id: 'omu-mod-sys-know', name: '知識情報システム学類', deviationValue: 58 },
         { id: 'omu-mod-sys-env', name: '環境社会システム学類', deviationValue: 57 },
         { id: 'omu-mod-sys-edu', name: '教育福祉学類', deviationValue: 57 },
         { id: 'omu-mod-sys-psy', name: '心理学類', deviationValue: 60 }
       ]
     },
     {
       id: 'omu-letters',
       name: '文学部',
       departments: [
         { id: 'omu-letters-phil', name: '哲学歴史学科', deviationValue: 60 },
         { id: 'omu-letters-human', name: '人間行動学科', deviationValue: 60 },
         { id: 'omu-letters-lang', name: '言語文化学科', deviationValue: 60 },
         { id: 'omu-letters-cul', name: '文化構想学科', deviationValue: 60 }
       ]
     },
     {
       id: 'omu-law',
       name: '法学部',
       departments: [
         { id: 'omu-law-law', name: '法学科', deviationValue: 61 }
       ]
     },
     {
       id: 'omu-econ',
       name: '経済学部',
       departments: [
         { id: 'omu-econ-econ', name: '経済学科', deviationValue: 60 }
       ]
     },
     {
       id: 'omu-com',
       name: '商学部',
       departments: [
         { id: 'omu-com-com', name: '商学科', deviationValue: 60 },
         { id: 'omu-com-pub', name: '公共経営学科', deviationValue: 59 }
       ]
     },
     {
       id: 'omu-sci',
       name: '理学部',
       departments: [
         { id: 'omu-sci-math', name: '数学科', deviationValue: 57 },
         { id: 'omu-sci-phys', name: '物理学科', deviationValue: 58 },
         { id: 'omu-sci-chem', name: '化学科', deviationValue: 58 },
         { id: 'omu-sci-bio', name: '生物学科', deviationValue: 58 },
         { id: 'omu-sci-geo', name: '地球学科', deviationValue: 56 },
         { id: 'omu-sci-biotech', name: '生物化学科', deviationValue: 58 }
       ]
     },
     {
       id: 'omu-eng',
       name: '工学部',
       departments: [
         { id: 'omu-eng-aero', name: '航空宇宙工学科', deviationValue: 58 },
         { id: 'omu-eng-ocean', name: '海洋システム工学科', deviationValue: 56 },
         { id: 'omu-eng-mech', name: '機械工学科', deviationValue: 58 },
         { id: 'omu-eng-arch', name: '建築学科', deviationValue: 60 },
         { id: 'omu-eng-civil', name: '都市学科', deviationValue: 57 },
         { id: 'omu-eng-elec', name: '電気電子システム工学科', deviationValue: 57 },
         { id: 'omu-eng-info', name: '情報工学科', deviationValue: 59 },
         { id: 'omu-eng-elec2', name: '電子物理工学科', deviationValue: 57 },
         { id: 'omu-eng-mat', name: 'マテリアル工学科', deviationValue: 56 },
         { id: 'omu-eng-chem', name: '化学工学科', deviationValue: 57 },
         { id: 'omu-eng-bio', name: '化学バイオ工学科', deviationValue: 56 }
       ]
     },
     {
       id: 'omu-agr',
       name: '農学部',
       departments: [
         { id: 'omu-agr-app', name: '応用生物科学科', deviationValue: 58 },
         { id: 'omu-agr-life', name: '生命機能化学科', deviationValue: 58 },
         { id: 'omu-agr-env', name: '緑地環境科学科', deviationValue: 57 }
       ]
     },
     {
       id: 'omu-vet',
       name: '獣医学部',
       departments: [
         { id: 'omu-vet-vet', name: '獣医学科', deviationValue: 63 }
       ]
     },
     {
       id: 'omu-med',
       name: '医学部',
       departments: [
         { id: 'omu-med-med', name: '医学科', deviationValue: 68 },
         { id: 'omu-med-rehab', name: 'リハビリテーション学科', deviationValue: 57 }
       ]
     },
     {
       id: 'omu-nurs',
       name: '看護学部',
       departments: [
         { id: 'omu-nurs-nurs', name: '看護学科', deviationValue: 57 }
       ]
     },
     {
       id: 'omu-life',
       name: '生活科学部',
       departments: [
         { id: 'omu-life-food', name: '食栄養学科', deviationValue: 58 },
         { id: 'omu-life-env', name: '居住環境学科', deviationValue: 57 },
         { id: 'omu-life-human', name: '人間福祉学科', deviationValue: 57 }
       ]
     }
   ]
 },
 {
   id: 'kansai',
   name: '関西大学',
   type: '私立',
   prefecture: '大阪府',
   faculties: [
     {
       id: 'kansai-law',
       name: '法学部',
       departments: [
         { id: 'kansai-law-law', name: '法学政治学科', deviationValue: 58 }
       ]
     },
     {
       id: 'kansai-letters',
       name: '文学部',
       departments: [
         { id: 'kansai-letters-comp', name: '総合人文学科', deviationValue: 59 }
       ]
     },
     {
       id: 'kansai-econ',
       name: '経済学部',
       departments: [
         { id: 'kansai-econ-econ', name: '経済学科', deviationValue: 58 }
       ]
     },
     {
       id: 'kansai-com',
       name: '商学部',
       departments: [
         { id: 'kansai-com-com', name: '商学科', deviationValue: 58 }
       ]
     },
     {
       id: 'kansai-soc',
       name: '社会学部',
       departments: [
         { id: 'kansai-soc-soc', name: '社会学科', deviationValue: 58 },
         { id: 'kansai-soc-psy', name: '心理学科', deviationValue: 59 },
         { id: 'kansai-soc-media', name: 'メディア学科', deviationValue: 58 },
         { id: 'kansai-soc-info', name: '社会システムデザイン学科', deviationValue: 57 }
       ]
     },
     {
       id: 'kansai-policy',
       name: '政策創造学部',
       departments: [
         { id: 'kansai-policy-policy', name: '政策学科', deviationValue: 57 },
         { id: 'kansai-policy-int', name: '国際アジア学科', deviationValue: 57 }
       ]
     },
     {
       id: 'kansai-foreign',
       name: '外国語学部',
       departments: [
         { id: 'kansai-foreign-foreign', name: '外国語学科', deviationValue: 62 }
       ]
     },
     {
       id: 'kansai-safe',
       name: '人間健康学部',
       departments: [
         { id: 'kansai-safe-safe', name: '人間健康学科', deviationValue: 56 }
       ]
     },
     {
       id: 'kansai-info',
       name: '総合情報学部',
       departments: [
         { id: 'kansai-info-info', name: '総合情報学科', deviationValue: 57 }
       ]
     },
     {
       id: 'kansai-safety',
       name: '社会安全学部',
       departments: [
         { id: 'kansai-safety-safety', name: '安全マネジメント学科', deviationValue: 56 }
       ]
     },
     {
       id: 'kansai-sys',
       name: 'システム理工学部',
       departments: [
         { id: 'kansai-sys-math', name: '数学科', deviationValue: 54 },
         { id: 'kansai-sys-phys', name: '物理・応用物理学科', deviationValue: 54 },
         { id: 'kansai-sys-mech', name: '機械工学科', deviationValue: 55 },
         { id: 'kansai-sys-elec', name: '電気電子情報工学科', deviationValue: 55 }
       ]
     },
     {
       id: 'kansai-env',
       name: '環境都市工学部',
       departments: [
         { id: 'kansai-env-arch', name: '建築学科', deviationValue: 57 },
         { id: 'kansai-env-civil', name: '都市システム工学科', deviationValue: 54 },
         { id: 'kansai-env-energy', name: 'エネルギー環境・化学工学科', deviationValue: 54 }
       ]
     },
     {
       id: 'kansai-chem',
       name: '化学生命工学部',
       departments: [
         { id: 'kansai-chem-chem', name: '化学・物質工学科', deviationValue: 54 },
         { id: 'kansai-chem-life', name: '生命・生物工学科', deviationValue: 54 }
       ]
     }
   ]
 },
 {
   id: 'kwansei',
   name: '関西学院大学',
   type: '私立',
   prefecture: '兵庫県',
   faculties: [
     {
       id: 'kwansei-theo',
       name: '神学部',
       departments: [
         { id: 'kwansei-theo-theo', name: '神学科', deviationValue: 52 }
       ]
     },
     {
       id: 'kwansei-letters',
       name: '文学部',
       departments: [
         { id: 'kwansei-letters-cul', name: '文化歴史学科', deviationValue: 59 },
         { id: 'kwansei-letters-comp', name: '総合心理科学科', deviationValue: 60 },
         { id: 'kwansei-letters-lit', name: '文学言語学科', deviationValue: 59 }
       ]
     },
     {
       id: 'kwansei-soc',
       name: '社会学部',
       departments: [
         { id: 'kwansei-soc-soc', name: '社会学科', deviationValue: 59 }
       ]
     },
     {
       id: 'kwansei-law',
       name: '法学部',
       departments: [
         { id: 'kwansei-law-law', name: '法律学科', deviationValue: 58 },
         { id: 'kwansei-law-pol', name: '政治学科', deviationValue: 58 }
       ]
     },
     {
       id: 'kwansei-econ',
       name: '経済学部',
       departments: [
         { id: 'kwansei-econ-econ', name: '経済学科', deviationValue: 59 }
       ]
     },
     {
       id: 'kwansei-com',
       name: '商学部',
       departments: [
         { id: 'kwansei-com-com', name: '商学科', deviationValue: 59 }
       ]
     },
     {
       id: 'kwansei-human',
       name: '人間福祉学部',
       departments: [
         { id: 'kwansei-human-wel', name: '社会福祉学科', deviationValue: 56 },
         { id: 'kwansei-human-start', name: '社会起業学科', deviationValue: 55 },
         { id: 'kwansei-human-dev', name: '人間科学科', deviationValue: 57 }
       ]
     },
     {
       id: 'kwansei-int',
       name: '国際学部',
       departments: [
         { id: 'kwansei-int-int', name: '国際学科', deviationValue: 64 }
       ]
     },
     {
       id: 'kwansei-edu',
       name: '教育学部',
       departments: [
         { id: 'kwansei-edu-edu', name: '教育学科', deviationValue: 58 }
       ]
     },
     {
       id: 'kwansei-policy',
       name: '総合政策学部',
       departments: [
         { id: 'kwansei-policy-policy', name: '総合政策学科', deviationValue: 58 },
         { id: 'kwansei-policy-media', name: 'メディア情報学科', deviationValue: 57 },
         { id: 'kwansei-policy-city', name: '都市政策学科', deviationValue: 57 },
         { id: 'kwansei-policy-int', name: '国際政策学科', deviationValue: 58 }
       ]
     },
     {
       id: 'kwansei-sci',
       name: '理学部',
       departments: [
         { id: 'kwansei-sci-math', name: '数理科学科', deviationValue: 54 },
         { id: 'kwansei-sci-phys', name: '物理・宇宙学科', deviationValue: 54 },
         { id: 'kwansei-sci-chem', name: '化学科', deviationValue: 54 }
       ]
     },
     {
       id: 'kwansei-eng',
       name: '工学部',
       departments: [
         { id: 'kwansei-eng-mat', name: '物質工学課程', deviationValue: 53 },
         { id: 'kwansei-eng-elec', name: '電気電子応用工学課程', deviationValue: 53 },
         { id: 'kwansei-eng-info', name: '情報工学課程', deviationValue: 55 },
         { id: 'kwansei-eng-know', name: '知能・機械工学課程', deviationValue: 54 }
       ]
     },
     {
       id: 'kwansei-life',
       name: '生命環境学部',
       departments: [
         { id: 'kwansei-life-bio', name: '生物科学科', deviationValue: 54 },
         { id: 'kwansei-life-life', name: '生命医科学科', deviationValue: 54 },
         { id: 'kwansei-life-env', name: '環境応用化学科', deviationValue: 54 }
       ]
     },
     {
       id: 'kwansei-arch',
       name: '建築学部',
       departments: [
         { id: 'kwansei-arch-arch', name: '建築学科', deviationValue: 56 }
       ]
     }
   ]
 },
 {
   id: 'kinki',
   name: '近畿大学',
   type: '私立',
   prefecture: '大阪府',
   faculties: [
     {
       id: 'kinki-law',
       name: '法学部',
       departments: [
         { id: 'kinki-law-law', name: '法律学科', deviationValue: 53 }
       ]
     },
     {
       id: 'kinki-econ',
       name: '経済学部',
       departments: [
         { id: 'kinki-econ-econ', name: '経済学科', deviationValue: 53 },
         { id: 'kinki-econ-int', name: '国際経済学科', deviationValue: 52 },
         { id: 'kinki-econ-policy', name: '総合経済政策学科', deviationValue: 52 }
       ]
     },
     {
       id: 'kinki-mgmt',
       name: '経営学部',
       departments: [
         { id: 'kinki-mgmt-mgmt', name: '経営学科', deviationValue: 53 },
         { id: 'kinki-mgmt-com', name: '商学科', deviationValue: 52 },
         { id: 'kinki-mgmt-acc', name: '会計学科', deviationValue: 52 },
         { id: 'kinki-mgmt-career', name: 'キャリア・マネジメント学科', deviationValue: 51 }
       ]
     },
     {
       id: 'kinki-sci',
       name: '理工学部',
       departments: [
         { id: 'kinki-sci-math', name: '理学科', deviationValue: 49 },
         { id: 'kinki-sci-life', name: '生命科学科', deviationValue: 50 },
         { id: 'kinki-sci-chem', name: '応用化学科', deviationValue: 49 },
         { id: 'kinki-sci-mech', name: '機械工学科', deviationValue: 50 },
         { id: 'kinki-sci-elec', name: '電気電子通信工学科', deviationValue: 49 },
         { id: 'kinki-sci-info', name: '情報学科', deviationValue: 52 },
         { id: 'kinki-sci-civil', name: '社会環境工学科', deviationValue: 48 }
       ]
     },
     {
       id: 'kinki-arch',
       name: '建築学部',
       departments: [
         { id: 'kinki-arch-arch', name: '建築学科', deviationValue: 53 }
       ]
     },
     {
       id: 'kinki-pharm',
       name: '薬学部',
       departments: [
         { id: 'kinki-pharm-pharm', name: '医療薬学科', deviationValue: 56 },
         { id: 'kinki-pharm-create', name: '創薬科学科', deviationValue: 53 }
       ]
     },
     {
       id: 'kinki-letters',
       name: '文芸学部',
       departments: [
         { id: 'kinki-letters-lit', name: '文学科', deviationValue: 53 },
         { id: 'kinki-letters-art', name: '芸術学科', deviationValue: 51 },
         { id: 'kinki-letters-cul', name: '文化・歴史学科', deviationValue: 54 },
         { id: 'kinki-letters-design', name: '文化デザイン学科', deviationValue: 52 }
       ]
     },
     {
       id: 'kinki-soc',
       name: '総合社会学部',
       departments: [
         { id: 'kinki-soc-soc', name: '総合社会学科', deviationValue: 54 }
       ]
     },
     {
       id: 'kinki-int',
       name: '国際学部',
       departments: [
         { id: 'kinki-int-int', name: '国際学科', deviationValue: 55 }
       ]
     },
     {
       id: 'kinki-info',
       name: '情報学部',
       departments: [
         { id: 'kinki-info-info', name: '情報学科', deviationValue: 53 }
       ]
     },
     {
       id: 'kinki-agr',
       name: '農学部',
       departments: [
         { id: 'kinki-agr-agr', name: '農業生産科学科', deviationValue: 50 },
         { id: 'kinki-agr-fish', name: '水産学科', deviationValue: 50 },
         { id: 'kinki-agr-life', name: '応用生命化学科', deviationValue: 50 },
         { id: 'kinki-agr-food', name: '食品栄養学科', deviationValue: 51 },
         { id: 'kinki-agr-env', name: '環境管理学科', deviationValue: 49 },
         { id: 'kinki-agr-bio', name: '生物機能科学科', deviationValue: 50 }
       ]
     },
     {
       id: 'kinki-med',
       name: '医学部',
       departments: [
         { id: 'kinki-med-med', name: '医学科', deviationValue: 68 }
       ]
     },
     {
       id: 'kinki-bio',
       name: '生物理工学部',
       departments: [
         { id: 'kinki-bio-bio', name: '生物工学科', deviationValue: 48 },
         { id: 'kinki-bio-gene', name: '遺伝子工学科', deviationValue: 48 },
         { id: 'kinki-bio-food', name: '食品安全工学科', deviationValue: 47 },
         { id: 'kinki-bio-life', name: '生命情報工学科', deviationValue: 47 },
         { id: 'kinki-bio-human', name: '人間環境デザイン工学科', deviationValue: 47 },
         { id: 'kinki-bio-med', name: '医用工学科', deviationValue: 48 }
       ]
     },
     {
       id: 'kinki-eng',
       name: '工学部',
       departments: [
         { id: 'kinki-eng-chem', name: '化学生命工学科', deviationValue: 47 },
         { id: 'kinki-eng-mech', name: '機械工学科', deviationValue: 47 },
         { id: 'kinki-eng-robo', name: 'ロボティクス学科', deviationValue: 47 },
         { id: 'kinki-eng-elec', name: '電子情報工学科', deviationValue: 47 },
         { id: 'kinki-eng-info', name: '情報学科', deviationValue: 48 },
         { id: 'kinki-eng-arch', name: '建築学科', deviationValue: 49 }
       ]
     },
     {
       id: 'kinki-ind',
       name: '産業理工学部',
       departments: [
         { id: 'kinki-ind-bio', name: '生物環境化学科', deviationValue: 45 },
         { id: 'kinki-ind-elec', name: '電気電子工学科', deviationValue: 45 },
         { id: 'kinki-ind-arch', name: '建築・デザイン学科', deviationValue: 47 },
         { id: 'kinki-ind-info', name: '情報学科', deviationValue: 47 },
         { id: 'kinki-ind-mgmt', name: '経営ビジネス学科', deviationValue: 47 }
       ]
     }
   ]
 },

 // 兵庫県
 {
   id: 'kobe',
   name: '神戸大学',
   type: '国立',
   prefecture: '兵庫県',
   faculties: [
     {
       id: 'kobe-letters',
       name: '文学部',
       departments: [
         { id: 'kobe-letters-hum', name: '人文学科', deviationValue: 64 }
       ]
     },
     {
       id: 'kobe-intercultural',
       name: '国際人間科学部',
       departments: [
         { id: 'kobe-intercultural-global', name: 'グローバル文化学科', deviationValue: 65 },
         { id: 'kobe-intercultural-dev', name: '発達コミュニティ学科', deviationValue: 63 },
         { id: 'kobe-intercultural-env', name: '環境共生学科', deviationValue: 62 },
         { id: 'kobe-intercultural-child', name: '子ども教育学科', deviationValue: 62 }
       ]
     },
     {
       id: 'kobe-law',
       name: '法学部',
       departments: [
         { id: 'kobe-law-law', name: '法律学科', deviationValue: 65 }
       ]
     },
     {
       id: 'kobe-econ',
       name: '経済学部',
       departments: [
         { id: 'kobe-econ-econ', name: '経済学科', deviationValue: 65 }
       ]
     },
     {
       id: 'kobe-mgmt',
       name: '経営学部',
       departments: [
         { id: 'kobe-mgmt-mgmt', name: '経営学科', deviationValue: 66 }
       ]
     },
     {
       id: 'kobe-sci',
       name: '理学部',
       departments: [
         { id: 'kobe-sci-math', name: '数学科', deviationValue: 60 },
         { id: 'kobe-sci-phys', name: '物理学科', deviationValue: 60 },
         { id: 'kobe-sci-chem', name: '化学科', deviationValue: 60 },
         { id: 'kobe-sci-bio', name: '生物学科', deviationValue: 60 },
         { id: 'kobe-sci-planet', name: '惑星学科', deviationValue: 59 }
       ]
     },
     {
       id: 'kobe-med',
       name: '医学部',
       departments: [
         { id: 'kobe-med-med', name: '医学科', deviationValue: 72 },
         { id: 'kobe-med-health', name: '保健学科', deviationValue: 58 }
       ]
     },
     {
       id: 'kobe-eng',
       name: '工学部',
       departments: [
         { id: 'kobe-eng-arch', name: '建築学科', deviationValue: 63 },
         { id: 'kobe-eng-civil', name: '市民工学科', deviationValue: 60 },
         { id: 'kobe-eng-elec', name: '電気電子工学科', deviationValue: 61 },
         { id: 'kobe-eng-mech', name: '機械工学科', deviationValue: 61 },
         { id: 'kobe-eng-chem', name: '応用化学科', deviationValue: 60 },
         { id: 'kobe-eng-info', name: '情報知能工学科', deviationValue: 62 }
       ]
     },
     {
       id: 'kobe-agr',
       name: '農学部',
       departments: [
         { id: 'kobe-agr-food', name: '食料環境システム学科', deviationValue: 60 },
         { id: 'kobe-agr-resource', name: '資源生命科学科', deviationValue: 60 },
         { id: 'kobe-agr-life', name: '生命機能科学科', deviationValue: 61 }
       ]
     },
     {
       id: 'kobe-maritime',
       name: '海洋政策科学部',
       departments: [
         { id: 'kobe-maritime-ocean', name: '海洋政策科学科', deviationValue: 58 }
       ]
     }
   ]
 },
 {
   id: 'hyogo-pref',
   name: '兵庫県立大学',
   type: '公立',
   prefecture: '兵庫県',
   faculties: [
     {
       id: 'uoh-int',
       name: '国際商経学部',
       departments: [
         { id: 'uoh-int-global', name: '国際商経学科', deviationValue: 56 }
       ]
     },
     {
       id: 'uoh-soc',
       name: '社会情報科学部',
       departments: [
         { id: 'uoh-soc-info', name: '社会情報科学科', deviationValue: 55 }
       ]
     },
     {
       id: 'uoh-eng',
       name: '工学部',
       departments: [
         { id: 'uoh-eng-elec', name: '電気電子情報工学科', deviationValue: 54 },
         { id: 'uoh-eng-mech', name: '機械・材料工学科', deviationValue: 54 },
         { id: 'uoh-eng-chem', name: '応用化学工学科', deviationValue: 53 }
       ]
     },
     {
       id: 'uoh-sci',
       name: '理学部',
       departments: [
         { id: 'uoh-sci-mat', name: '物質科学科', deviationValue: 53 },
         { id: 'uoh-sci-life', name: '生命科学科', deviationValue: 53 }
       ]
     },
     {
       id: 'uoh-env',
       name: '環境人間学部',
       departments: [
         { id: 'uoh-env-env', name: '環境人間学科', deviationValue: 54 }
       ]
     },
     {
       id: 'uoh-nurs',
       name: '看護学部',
       departments: [
         { id: 'uoh-nurs-nurs', name: '看護学科', deviationValue: 55 }
       ]
     }
   ]
 },
 {
   id: 'kobe-city-foreign',
   name: '神戸市外国語大学',
   type: '公立',
   prefecture: '兵庫県',
   faculties: [
     {
       id: 'kcufs-foreign',
       name: '外国語学部',
       departments: [
         { id: 'kcufs-foreign-eng', name: '英米学科', deviationValue: 60 },
         { id: 'kcufs-foreign-rus', name: 'ロシア学科', deviationValue: 57 },
         { id: 'kcufs-foreign-chi', name: '中国学科', deviationValue: 58 },
         { id: 'kcufs-foreign-spa', name: 'イスパニア学科', deviationValue: 59 },
         { id: 'kcufs-foreign-int', name: '国際関係学科', deviationValue: 60 }
       ]
     },
     {
       id: 'kcufs-foreign2',
       name: '外国語学部第2部',
       departments: [
         { id: 'kcufs-foreign2-eng', name: '英米学科', deviationValue: 55 }
       ]
     }
   ]
 },
 {
   id: 'kobe-city-nurs',
   name: '神戸市看護大学',
   type: '公立',
   prefecture: '兵庫県',
   faculties: [
     {
       id: 'kcn-nurs',
       name: '看護学部',
       departments: [
         { id: 'kcn-nurs-nurs', name: '看護学科', deviationValue: 54 }
       ]
     }
   ]
 },
 {
   id: 'konan',
   name: '甲南大学',
   type: '私立',
   prefecture: '兵庫県',
   faculties: [
     {
       id: 'konan-letters',
       name: '文学部',
       departments: [
         { id: 'konan-letters-jpn', name: '日本語日本文学科', deviationValue: 52 },
         { id: 'konan-letters-eng', name: '英語英米文学科', deviationValue: 52 },
         { id: 'konan-letters-soc', name: '社会学科', deviationValue: 52 },
         { id: 'konan-letters-human', name: '人間科学科', deviationValue: 52 },
         { id: 'konan-letters-hist', name: '歴史文化学科', deviationValue: 52 }
       ]
     },
     {
       id: 'konan-econ',
       name: '経済学部',
       departments: [
         { id: 'konan-econ-econ', name: '経済学科', deviationValue: 51 }
       ]
     },
     {
       id: 'konan-law',
       name: '法学部',
       departments: [
         { id: 'konan-law-law', name: '法律学科', deviationValue: 51 }
       ]
     },
     {
       id: 'konan-mgmt',
       name: '経営学部',
       departments: [
         { id: 'konan-mgmt-mgmt', name: '経営学科', deviationValue: 52 }
       ]
     },
     {
       id: 'konan-manage',
       name: 'マネジメント創造学部',
       departments: [
         { id: 'konan-manage-manage', name: 'マネジメント創造学科', deviationValue: 52 }
       ]
     },
     {
       id: 'konan-sci',
       name: '理工学部',
       departments: [
         { id: 'konan-sci-phys', name: '物理学科', deviationValue: 48 },
         { id: 'konan-sci-bio', name: '生物学科', deviationValue: 49 },
         { id: 'konan-sci-func', name: '機能分子化学科', deviationValue: 48 }
       ]
     },
     {
       id: 'konan-intel',
       name: '知能情報学部',
       departments: [
         { id: 'konan-intel-intel', name: '知能情報学科', deviationValue: 50 }
       ]
     },
     {
       id: 'konan-front',
       name: 'フロンティアサイエンス学部',
       departments: [
         { id: 'konan-front-life', name: '生命化学科', deviationValue: 48 }
       ]
     }
   ]
 },

 // 奈良県
 {
   id: 'nara-pref',
   name: '奈良県立大学',
   type: '公立',
   prefecture: '奈良県',
   faculties: [
     {
       id: 'narapu-reg',
       name: '地域創造学部',
       departments: [
         { id: 'narapu-reg-reg', name: '地域創造学科', deviationValue: 55 }
       ]
     }
   ]
 },
 {
   id: 'nara-med',
   name: '奈良県立医科大学',
   type: '公立',
   prefecture: '奈良県',
   faculties: [
     {
       id: 'nmu-med',
       name: '医学部',
       departments: [
         { id: 'nmu-med-med', name: '医学科', deviationValue: 70 },
         { id: 'nmu-med-nurs', name: '看護学科', deviationValue: 56 }
       ]
     }
   ]
 },

 // 和歌山県
 {
   id: 'wakayama-med',
   name: '和歌山県立医科大学',
   type: '公立',
   prefecture: '和歌山県',
   faculties: [
     {
       id: 'wmu-med',
       name: '医学部',
       departments: [
         { id: 'wmu-med-med', name: '医学科', deviationValue: 68 }
       ]
     },
     {
       id: 'wmu-health',
       name: '保健看護学部',
       departments: [
         { id: 'wmu-health-nurs', name: '保健看護学科', deviationValue: 55 }
       ]
     },
     {
       id: 'wmu-pharm',
       name: '薬学部',
       departments: [
         { id: 'wmu-pharm-pharm', name: '薬学科', deviationValue: 58 }
       ]
     }
   ]
 },

 // 滋賀県
 {
   id: 'shiga-pref',
   name: '滋賀県立大学',
   type: '公立',
   prefecture: '滋賀県',
   faculties: [
     {
       id: 'usp-env',
       name: '環境科学部',
       departments: [
         { id: 'usp-env-eco', name: '環境生態学科', deviationValue: 51 },
         { id: 'usp-env-policy', name: '環境政策・計画学科', deviationValue: 51 },
         { id: 'usp-env-arch', name: '環境建築デザイン学科', deviationValue: 52 },
         { id: 'usp-env-bio', name: '生物資源管理学科', deviationValue: 51 }
       ]
     },
     {
       id: 'usp-eng',
       name: '工学部',
       departments: [
         { id: 'usp-eng-mat', name: '材料科学科', deviationValue: 50 },
         { id: 'usp-eng-mech', name: '機械システム工学科', deviationValue: 50 },
         { id: 'usp-eng-elec', name: '電子システム工学科', deviationValue: 50 }
       ]
     },
     {
       id: 'usp-human',
       name: '人間文化学部',
       departments: [
         { id: 'usp-human-reg', name: '地域文化学科', deviationValue: 52 },
         { id: 'usp-human-life', name: '生活デザイン学科', deviationValue: 51 },
         { id: 'usp-human-nutr', name: '生活栄養学科', deviationValue: 53 },
         { id: 'usp-human-rel', name: '人間関係学科', deviationValue: 52 },
         { id: 'usp-human-int', name: '国際コミュニケーション学科', deviationValue: 53 }
       ]
     },
     {
       id: 'usp-nurs',
       name: '人間看護学部',
       departments: [
         { id: 'usp-nurs-nurs', name: '人間看護学科', deviationValue: 52 }
       ]
     }
   ]
 }
]