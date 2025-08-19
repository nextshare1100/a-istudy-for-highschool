// lib/problems/custom-problems.ts - 完全修正版

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc,
  getDoc,
  Timestamp,
  startAfter,
  DocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Problem } from '@/types'

// タイムスタンプを安全に変換するヘルパー関数
function convertToTimestamp(data: any): Timestamp | null {
  // すでにTimestampインスタンスの場合
  if (data instanceof Timestamp) {
    return data
  }
  
  // seconds/nanosecondsプロパティを持つオブジェクトの場合
  if (data && typeof data === 'object' && 'seconds' in data) {
    // secondsがundefinedでないことを確認
    if (data.seconds != null) {
      return new Timestamp(data.seconds, data.nanoseconds || 0)
    }
  }
  
  // Date型の場合
  if (data instanceof Date) {
    return Timestamp.fromDate(data)
  }
  
  // 数値（Unix timestamp）の場合
  if (typeof data === 'number') {
    return Timestamp.fromMillis(data)
  }
  
  // それ以外の場合はnullを返す
  return null
}

// ユーザーの問題を取得
export async function getUserProblems(userId: string, pageSize: number = 50): Promise<Problem[]> {
  try {
    // シンプルなクエリに変更（インデックス不要）
    const q = query(
      collection(db, 'problems'),
      where('generatedFor', '==', userId),
      limit(pageSize)
    )
    
    const snapshot = await getDocs(q)
    
    // クライアント側でソート
    const problems = snapshot.docs.map(doc => {
      const data = doc.data()
      
      // タイムスタンプの安全な変換
      const createdAt = convertToTimestamp(data.createdAt) || Timestamp.now()
      
      return {
        id: doc.id,
        ...data,
        createdAt,
      } as Problem
    })
    
    // 作成日時で降順ソート
    return problems.sort((a, b) => {
      try {
        const aTime = a.createdAt?.toDate?.()?.getTime() || 0
        const bTime = b.createdAt?.toDate?.()?.getTime() || 0
        return bTime - aTime
      } catch (error) {
        console.warn('ソート中のエラー:', error)
        return 0
      }
    })
  } catch (error) {
    console.error('Error fetching user problems:', error)
    return []
  }
}

// 公開問題を検索
export async function searchPublicProblems(filters: {
  subject?: string
  difficulty?: string
  searchQuery?: string
  hasCanvas?: boolean
  lastDoc?: DocumentSnapshot
  pageSize?: number
}): Promise<{ problems: Problem[]; lastDoc: DocumentSnapshot | null }> {
  try {
    // シンプルなクエリから始める
    const constraints: QueryConstraint[] = [
      limit(filters.pageSize || 50)
    ]
    
    // 基本的なフィルターのみ適用
    if (filters.subject && filters.subject !== 'all') {
      constraints.unshift(where('subject', '==', filters.subject))
    } else if (filters.difficulty && filters.difficulty !== 'all') {
      constraints.unshift(where('difficulty', '==', filters.difficulty))
    } else if (filters.hasCanvas) {
      constraints.unshift(where('canvasConfig', '!=', null))
    }
    
    const q = query(collection(db, 'problems'), ...constraints)
    const snapshot = await getDocs(q)
    
    let problems = snapshot.docs.map(doc => {
      const data = doc.data()
      
      // タイムスタンプの安全な変換
      let createdAt: Timestamp
      try {
        createdAt = convertToTimestamp(data.createdAt) || Timestamp.now()
      } catch (error) {
        console.warn('タイムスタンプ変換エラー:', error)
        createdAt = Timestamp.now()
      }
      
      return {
        id: doc.id,
        ...data,
        createdAt,
      } as Problem
    })
    
    // クライアント側で追加のフィルタリング
    if (filters.subject && filters.difficulty && filters.difficulty !== 'all') {
      problems = problems.filter(p => p.difficulty === filters.difficulty)
    }
    
    if (filters.hasCanvas && filters.subject) {
      problems = problems.filter(p => p.canvasConfig != null)
    }
    
    // クライアントサイドでの検索フィルタリング
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      problems = problems.filter(problem => 
        problem.question?.toLowerCase().includes(query) ||
        problem.topic?.toLowerCase().includes(query) ||
        problem.subject?.toLowerCase().includes(query) ||
        problem.explanation?.toLowerCase().includes(query) ||
        problem.relatedConcepts?.some(concept => concept.toLowerCase().includes(query))
      )
    }
    
    // 作成日時で降順ソート
    problems.sort((a, b) => {
      try {
        const aTime = a.createdAt?.toDate?.()?.getTime() || 0
        const bTime = b.createdAt?.toDate?.()?.getTime() || 0
        return bTime - aTime
      } catch (error) {
        console.warn('ソート中のエラー:', error)
        return 0
      }
    })
    
    const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null
    
    return { problems, lastDoc }
  } catch (error) {
    console.error('Error searching problems:', error)
    return { problems: [], lastDoc: null }
  }
}

// 特定の問題を取得
export async function getProblemById(problemId: string): Promise<Problem | null> {
  try {
    const docRef = doc(db, 'problems', problemId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      
      // タイムスタンプの安全な変換
      const createdAt = convertToTimestamp(data.createdAt) || Timestamp.now()
      
      return {
        id: docSnap.id,
        ...data,
        createdAt,
      } as Problem
    }
    
    return null
  } catch (error) {
    console.error('Error fetching problem:', error)
    return null
  }
}

// Canvas付き問題のみを取得
export async function getCanvasProblems(
  subject?: string,
  pageSize: number = 20
): Promise<Problem[]> {
  try {
    // シンプルなクエリに変更（インデックス不要）
    let q = query(
      collection(db, 'problems'),
      where('canvasConfig', '!=', null),
      limit(pageSize)
    )
    
    const snapshot = await getDocs(q)
    
    let problems = snapshot.docs.map(doc => {
      const data = doc.data()
      
      // タイムスタンプの安全な変換
      const createdAt = convertToTimestamp(data.createdAt) || Timestamp.now()
      
      return {
        id: doc.id,
        ...data,
        createdAt,
      } as Problem
    })
    
    // クライアント側でフィルタリングとソート
    if (subject && subject !== 'all') {
      problems = problems.filter(p => p.subject === subject)
    }
    
    // 作成日時で降順ソート
    return problems.sort((a, b) => {
      try {
        const aTime = a.createdAt?.toDate?.()?.getTime() || 0
        const bTime = b.createdAt?.toDate?.()?.getTime() || 0
        return bTime - aTime
      } catch (error) {
        console.warn('ソート中のエラー:', error)
        return 0
      }
    })
  } catch (error) {
    console.error('Error fetching canvas problems:', error)
    return []
  }
}

// 関連問題を取得（同じトピック、難易度）
export async function getRelatedProblems(
  problem: Problem,
  limit: number = 5
): Promise<Problem[]> {
  try {
    const q = query(
      collection(db, 'problems'),
      where('subject', '==', problem.subject),
      where('topic', '==', problem.topic),
      where('difficulty', '==', problem.difficulty),
      orderBy('createdAt', 'desc'),
      limit(limit + 1) // 現在の問題を含む可能性があるため+1
    )
    
    const snapshot = await getDocs(q)
    
    return snapshot.docs
      .filter(doc => doc.id !== problem.id) // 現在の問題を除外
      .slice(0, limit)
      .map(doc => {
        const data = doc.data()
        
        // タイムスタンプの安全な変換
        const createdAt = convertToTimestamp(data.createdAt) || Timestamp.now()
        
        return {
          id: doc.id,
          ...data,
          createdAt,
        } as Problem
      })
  } catch (error) {
    console.error('Error fetching related problems:', error)
    return []
  }
}