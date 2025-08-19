// lib/firebase/subjects.ts - 既存のコードに追加

import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  query,
  orderBy,
  setDoc,
  serverTimestamp,
  Timestamp,
  where
} from 'firebase/firestore'
import { db } from './config'
import { auth } from './config'

// ========== 既存の型定義 ==========
export interface Subject {
  id: string
  name: string
  order: number
  units: Unit[]
}

export interface Unit {
  id: string
  name: string
  order: number
  // 追加フィールド
  difficulty?: 'basic' | 'intermediate' | 'advanced'
  examFrequency?: 'high' | 'medium' | 'low' // 出題頻度
  relatedUnits?: string[] // 関連する単元
}

// ========== 新規追加の型定義 ==========

// ユーザーの受験科目設定
export interface UserExamSubjects {
  userId: string
  examType: 'common_test' | 'private' | 'national' | 'combined' // 共通テスト/私立/国公立/併用
  targetUniversities: TargetUniversity[]
  selectedSubjects: SelectedSubject[]
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface TargetUniversity {
  name: string
  department: string
  requiredSubjects: string[] // 必須科目ID
  optionalSubjects?: string[] // 選択科目ID
  examDate?: Date
  priority: number // 志望順位
}

export interface SelectedSubject {
  subjectId: string
  subjectName: string
  units: string[] // 選択した単元ID
  targetScore: number // 目標点数
  currentScore?: number // 現在の点数
  importance: 'required' | 'optional' // 必須/選択
  studyPriority: number // 学習優先度
}

// ========== 既存の関数（維持） ==========

export async function getAllSubjects(): Promise<Subject[]> {
  // 既存のコード
}

export async function getSubject(subjectId: string): Promise<Subject | null> {
  // 既存のコード
}

// ========== 新規追加の関数 ==========

// ユーザーの受験科目を取得
export async function getUserExamSubjects(userId: string): Promise<UserExamSubjects | null> {
  try {
    const docRef = doc(db, 'users', userId, 'examSettings', 'subjects')
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      return null
    }
    
    return docSnap.data() as UserExamSubjects
  } catch (error) {
    console.error('受験科目取得エラー:', error)
    return null
  }
}

// ユーザーの受験科目を保存
export async function saveUserExamSubjects(
  userId: string,
  examSubjects: Omit<UserExamSubjects, 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'examSettings', 'subjects')
    
    await setDoc(docRef, {
      ...examSubjects,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true })
    
    console.log('受験科目を保存しました')
  } catch (error) {
    console.error('受験科目保存エラー:', error)
    throw error
  }
}

// ユーザーが選択した全科目・単元を取得（フラット化）
export async function getUserSelectedSubjectsFlat(userId: string): Promise<{
  subjectId: string
  subjectName: string
  unitId: string
  unitName: string
  importance: string
  priority: number
}[]> {
  const examSubjects = await getUserExamSubjects(userId)
  if (!examSubjects) return []
  
  const allSubjects = await getAllSubjects()
  const flatList: any[] = []
  
  for (const selected of examSubjects.selectedSubjects) {
    const subject = allSubjects.find(s => s.id === selected.subjectId)
    if (!subject) continue
    
    for (const unitId of selected.units) {
      const unit = subject.units.find(u => u.id === unitId)
      if (!unit) continue
      
      flatList.push({
        subjectId: subject.id,
        subjectName: subject.name,
        unitId: unit.id,
        unitName: unit.name,
        importance: selected.importance,
        priority: selected.studyPriority
      })
    }
  }
  
  return flatList.sort((a, b) => b.priority - a.priority)
}

// 科目の学習状況を取得
export async function getSubjectStudyStatus(
  userId: string,
  subjectId: string
): Promise<{
  totalUnits: number
  completedUnits: number
  averageScore: number
  weakUnits: string[]
  strongUnits: string[]
}> {
  try {
    // 学習履歴から統計を計算
    const studySessionsQuery = query(
      collection(db, 'studySessions'),
      where('userId', '==', userId),
      where('subjectId', '==', subjectId),
      orderBy('createdAt', 'desc'),
      limit(100)
    )
    
    const snapshot = await getDocs(studySessionsQuery)
    
    // 単元ごとの成績を集計
    const unitScores: Record<string, number[]> = {}
    
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      if (!unitScores[data.unitId]) {
        unitScores[data.unitId] = []
      }
      unitScores[data.unitId].push(data.score || 0)
    })
    
    // 統計を計算
    const subject = await getSubject(subjectId)
    const totalUnits = subject?.units.length || 0
    const completedUnits = Object.keys(unitScores).length
    
    let totalScore = 0
    let scoreCount = 0
    const weakUnits: string[] = []
    const strongUnits: string[] = []
    
    Object.entries(unitScores).forEach(([unitId, scores]) => {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
      totalScore += avgScore * scores.length
      scoreCount += scores.length
      
      if (avgScore < 60) {
        weakUnits.push(unitId)
      } else if (avgScore >= 80) {
        strongUnits.push(unitId)
      }
    })
    
    return {
      totalUnits,
      completedUnits,
      averageScore: scoreCount > 0 ? totalScore / scoreCount : 0,
      weakUnits,
      strongUnits
    }
  } catch (error) {
    console.error('学習状況取得エラー:', error)
    return {
      totalUnits: 0,
      completedUnits: 0,
      averageScore: 0,
      weakUnits: [],
      strongUnits: []
    }
  }
}

// 推奨される学習科目を取得
export async function getRecommendedSubjects(
  userId: string,
  targetUniversity?: string
): Promise<{
  required: Subject[]
  recommended: Subject[]
  optional: Subject[]
}> {
  try {
    const allSubjects = await getAllSubjects()
    
    if (targetUniversity) {
      // 大学別の推奨科目（ハードコーディングの例）
      const universityRequirements: Record<string, {
        required: string[]
        recommended: string[]
      }> = {
        '東京大学': {
          required: ['mathematics', 'english', 'japanese', 'science1', 'science2', 'social'],
          recommended: ['world_history', 'geography']
        },
        '京都大学': {
          required: ['mathematics', 'english', 'japanese', 'science1', 'science2'],
          recommended: ['social', 'geography']
        },
        // ... 他の大学
      }
      
      const req = universityRequirements[targetUniversity] || {
        required: [],
        recommended: []
      }
      
      return {
        required: allSubjects.filter(s => req.required.includes(s.id)),
        recommended: allSubjects.filter(s => req.recommended.includes(s.id)),
        optional: allSubjects.filter(s => 
          !req.required.includes(s.id) && !req.recommended.includes(s.id)
        )
      }
    }
    
    // デフォルトの推奨
    return {
      required: allSubjects.filter(s => 
        ['mathematics', 'english', 'japanese'].includes(s.id)
      ),
      recommended: allSubjects.filter(s => 
        ['science', 'social'].includes(s.id)
      ),
      optional: allSubjects.filter(s => 
        !['mathematics', 'english', 'japanese', 'science', 'social'].includes(s.id)
      )
    }
  } catch (error) {
    console.error('推奨科目取得エラー:', error)
    return { required: [], recommended: [], optional: [] }
  }
}