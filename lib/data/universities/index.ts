export interface University {
  id: string
  name: string
  type: '国立' | '公立' | '私立'
  prefecture: string
  faculties: Faculty[]
}

export interface Faculty {
  id: string
  name: string
  departments: Department[]
}

export interface Department {
  id: string
  name: string
  deviationValue: number
}

// 各地域の大学データをインポート
import { kantouUniversities } from './kantou'
import { kansaiUniversities } from './kansai'
import { tohokuHokkaidoUniversities } from './tohoku-hokkaido'
import { chubuUniversities } from './chubu'
import { chugokuShikokuUniversities } from './chugoku-shikoku'
import { kyushuOkinawaUniversities } from './kyushu-okinawa'

// 全大学データを統合
export const universities: University[] = [
  ...kantouUniversities,
  ...kansaiUniversities,
  ...tohokuHokkaidoUniversities,
  ...chubuUniversities,
  ...chugokuShikokuUniversities,
  ...kyushuOkinawaUniversities
]

// 都道府県リスト
export const prefectures = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
]

// 検索・フィルタ機能
export interface SearchOptions {
  query?: string
  type?: '国立' | '公立' | '私立' | 'all'
  prefecture?: string
  minDeviation?: number
  maxDeviation?: number
  faculty?: string
}

export function searchUniversities(options: SearchOptions): University[] {
  let results = [...universities]

  // キーワード検索
  if (options.query) {
    const query = options.query.toLowerCase()
    results = results.filter(uni => 
      uni.name.toLowerCase().includes(query) ||
      uni.faculties.some(fac => 
        fac.name.toLowerCase().includes(query) ||
        fac.departments.some(dep => dep.name.toLowerCase().includes(query))
      )
    )
  }

  // 大学種別フィルタ
  if (options.type && options.type !== 'all') {
    results = results.filter(uni => uni.type === options.type)
  }

  // 都道府県フィルタ
  if (options.prefecture) {
    results = results.filter(uni => uni.prefecture === options.prefecture)
  }

  // 偏差値フィルタ
  if (options.minDeviation || options.maxDeviation) {
    const min = options.minDeviation || 0
    const max = options.maxDeviation || 100
    results = results.map(uni => ({
      ...uni,
      faculties: uni.faculties.map(fac => ({
        ...fac,
        departments: fac.departments.filter(dep => 
          dep.deviationValue >= min && dep.deviationValue <= max
        )
      })).filter(fac => fac.departments.length > 0)
    })).filter(uni => uni.faculties.length > 0)
  }

  // 学部フィルタ
  if (options.faculty) {
    const faculty = options.faculty.toLowerCase()
    results = results.map(uni => ({
      ...uni,
      faculties: uni.faculties.filter(fac => 
        fac.name.toLowerCase().includes(faculty)
      )
    })).filter(uni => uni.faculties.length > 0)
  }

  return results
}

// 人気大学ランキング（偏差値順）
export function getTopUniversities(limit: number = 10): University[] {
  const allDepartments: { university: University; faculty: Faculty; department: Department }[] = []
  
  universities.forEach(uni => {
    uni.faculties.forEach(fac => {
      fac.departments.forEach(dep => {
        allDepartments.push({ university: uni, faculty: fac, department: dep })
      })
    })
  })

  return allDepartments
    .sort((a, b) => b.department.deviationValue - a.department.deviationValue)
    .slice(0, limit)
    .map(item => item.university)
    .filter((uni, index, self) => 
      index === self.findIndex(u => u.id === uni.id)
    )
}

// 学部系統別の分類
export const facultyCategories = {
  '文系': ['文学部', '法学部', '経済学部', '商学部', '社会学部', '国際関係学部', '外国語学部'],
  '理系': ['理学部', '工学部', '理工学部', '情報学部', '農学部'],
  '医療系': ['医学部', '歯学部', '薬学部', '看護学部', '保健学部'],
  '教育系': ['教育学部', '人間科学部', '心理学部'],
  '芸術系': ['芸術学部', '美術学部', '音楽学部', 'デザイン学部'],
  'スポーツ系': ['体育学部', 'スポーツ科学部', '健康科学部']
}