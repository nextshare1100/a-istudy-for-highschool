// lib/firebase/problem-results.ts
import { db } from './config'
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc, 
  updateDoc, 
  increment,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore'

interface ProblemResult {
  userId: string
  problemId: string
  subject: string
  unit?: string
  difficulty: 'easy' | 'medium' | 'hard'
  isCorrect: boolean
  timeSpent: number
  answer: any
  correctAnswer: any
  createdAt: any
}

// 単体問題の解答結果を保存
export async function saveProblemResult(data: Omit<ProblemResult, 'createdAt'>) {
  try {
    const result = await addDoc(collection(db, 'problemResults'), {
      ...data,
      createdAt: serverTimestamp()
    })
    
    // ユーザーの統計情報を更新
    await updateUserStats(data.userId, data.isCorrect, data.subject)
    
    return { success: true, id: result.id }
  } catch (error) {
    console.error('Error saving problem result:', error)
    return { success: false, error }
  }
}

// ユーザーの統計情報を更新
async function updateUserStats(userId: string, isCorrect: boolean, subject: string) {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      const userData = userDoc.data()
      const stats = userData.stats || { totalQuestions: 0, correctAnswers: 0 }
      const subjectStats = userData.subjectStats || {}
      
      // サブジェクトの統計が存在しない場合は初期化
      if (!subjectStats[subject]) {
        subjectStats[subject] = { totalQuestions: 0, correctAnswers: 0 }
      }
      
      await updateDoc(userRef, {
        'stats.totalQuestions': increment(1),
        'stats.correctAnswers': increment(isCorrect ? 1 : 0),
        [`subjectStats.${subject}.totalQuestions`]: increment(1),
        [`subjectStats.${subject}.correctAnswers`]: increment(isCorrect ? 1 : 0),
        updatedAt: serverTimestamp()
      })
    } else {
      // ユーザードキュメントが存在しない場合は作成
      await updateDoc(userRef, {
        stats: {
          totalQuestions: 1,
          correctAnswers: isCorrect ? 1 : 0
        },
        subjectStats: {
          [subject]: {
            totalQuestions: 1,
            correctAnswers: isCorrect ? 1 : 0
          }
        },
        updatedAt: serverTimestamp()
      })
    }
  } catch (error) {
    console.error('Error updating user stats:', error)
  }
}

// 最近の正答率から偏差値を推定
export async function estimateUserDeviation(userId: string, subject?: string): Promise<number | null> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    // クエリ条件を構築
    const constraints: any[] = [
      where('userId', '==', userId),
      where('createdAt', '>=', thirtyDaysAgo),
      orderBy('createdAt', 'desc'),
      limit(100)
    ]
    
    // 科目が指定されている場合は条件に追加
    if (subject) {
      constraints.splice(2, 0, where('subject', '==', subject))
    }
    
    const q = query(collection(db, 'problemResults'), ...constraints)
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) return null
    
    const results = snapshot.docs.map(doc => doc.data() as ProblemResult)
    const correctCount = results.filter(r => r.isCorrect).length
    const accuracy = correctCount / results.length
    
    // 難易度別の重み付け
    const difficultyWeights: Record<string, number> = { 
      easy: 0.8, 
      medium: 1.0, 
      hard: 1.3 
    }
    
    let weightedScore = 0
    let totalWeight = 0
    
    results.forEach(result => {
      const weight = difficultyWeights[result.difficulty] || 1.0
      weightedScore += (result.isCorrect ? 1 : 0) * weight
      totalWeight += weight
    })
    
    const weightedAccuracy = totalWeight > 0 ? weightedScore / totalWeight : accuracy
    
    // 偏差値を推定（35-75の範囲）
    const baseDeviation = 50
    const deviationRange = 25
    const estimatedDeviation = baseDeviation + (weightedAccuracy - 0.5) * deviationRange * 2
    
    return Math.max(35, Math.min(75, estimatedDeviation))
  } catch (error) {
    console.error('Error estimating deviation:', error)
    return null
  }
}

// 科目別の統計情報を取得
export async function getSubjectStats(userId: string, subject: string) {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      const userData = userDoc.data()
      return userData.subjectStats?.[subject] || null
    }
    
    return null
  } catch (error) {
    console.error('Error getting subject stats:', error)
    return null
  }
}

// 直近の問題解答履歴を取得
export async function getRecentProblemResults(userId: string, limit: number = 10) {
  try {
    const q = query(
      collection(db, 'problemResults'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limit)
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error getting recent results:', error)
    return []
  }
}