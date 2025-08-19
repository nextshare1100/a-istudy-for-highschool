// ===== lib/firebase/sharing-functions.ts =====
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, collectionGroup } from 'firebase/firestore'
import { db } from './config'
import bcrypt from 'bcryptjs'

// 共有設定を取得
export async function getSharingSettings(userId: string) {
  try {
    const settingsDoc = await getDoc(
      doc(db, 'users', userId, 'settings', 'sharing')
    )
    return settingsDoc.exists() ? settingsDoc.data() : null
  } catch (error) {
    console.error('Error getting sharing settings:', error)
    return null
  }
}

// 共有設定を保存
export async function saveSharingSettings(
  userId: string,
  studentId: string,
  pin: string,
  sharingEnabled: boolean
) {
  try {
    // 生徒IDの重複チェック
    if (studentId) {
      const idDoc = await getDoc(doc(db, 'studentIds', studentId))
      if (idDoc.exists() && idDoc.data().userId !== userId) {
        return { success: false, error: 'この生徒IDは既に使用されています' }
      }
    }

    // PINのハッシュ化
    const salt = await bcrypt.genSalt(10)
    const pinHash = await bcrypt.hash(pin, salt)

    // 共有設定を保存
    await setDoc(
      doc(db, 'users', userId, 'settings', 'sharing'),
      {
        studentId,
        pinHash,
        salt,
        sharingEnabled,
        allowedFeatures: {
          viewGrades: true,
          viewMockExamResults: true,
          viewSubjectScores: true,
          viewCategoryAnalysis: true,
          viewStudyTime: false,
          viewStudyPattern: false,
          viewLifeRhythm: false
        },
        updatedAt: serverTimestamp()
      },
      { merge: true }
    )

    // 生徒IDマッピングを保存
    if (studentId) {
      await setDoc(doc(db, 'studentIds', studentId), {
        userId,
        createdAt: serverTimestamp()
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error saving sharing settings:', error)
    return { success: false, error: 'エラーが発生しました' }
  }
}

// ===== lib/firebase/teacher-sync.ts =====
// 教師アプリとの同期機能

import { collection, query, where, getDocs, collectionGroup, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

// 生徒の統計情報を更新
export async function updateStudentStatsForTeachers(userId: string) {
  try {
    // クイズ結果から統計を計算
    const stats = await calculateStudentStats(userId)
    
    // 教師に共有されている場合、統計情報を更新
    const teachersQuery = query(
      collectionGroup(db, 'students'),
      where('studentUserId', '==', userId)
    )
    
    const teachersSnapshot = await getDocs(teachersQuery)
    
    const updatePromises = teachersSnapshot.docs.map(doc => {
      return setDoc(
        doc.ref,
        {
          averageScore: stats.averageScore,
          totalQuizCount: stats.totalCount,
          subjectScores: stats.subjectScores,
          lastUpdated: serverTimestamp()
        },
        { merge: true }
      )
    })
    
    await Promise.all(updatePromises)
  } catch (error) {
    console.error('Error updating student stats:', error)
  }
}

// 統計情報を計算
async function calculateStudentStats(userId: string) {
  const q = query(
    collection(db, 'quizResults'),
    where('userId', '==', userId)
  )
  
  const snapshot = await getDocs(q)
  const results = snapshot.docs.map(doc => doc.data())
  
  let totalScore = 0
  const subjectScores: { [key: string]: { total: number; count: number } } = {}
  
  results.forEach(result => {
    const accuracy = (result.score / result.totalQuestions) * 100
    totalScore += accuracy
    
    const subject = result.subject || 'その他'
    if (!subjectScores[subject]) {
      subjectScores[subject] = { total: 0, count: 0 }
    }
    subjectScores[subject].total += accuracy
    subjectScores[subject].count += 1
  })
  
  const averageScore = results.length > 0 ? totalScore / results.length : 0
  
  const subjectAverages: { [key: string]: number } = {}
  Object.entries(subjectScores).forEach(([subject, data]) => {
    subjectAverages[subject] = data.total / data.count
  })
  
  return {
    averageScore,
    totalCount: results.length,
    subjectScores: subjectAverages
  }
}

// プロフィール更新時の教師側データ更新
export async function updateTeacherStudentName(userId: string, displayName: string) {
  try {
    const teachersQuery = query(
      collectionGroup(db, 'students'),
      where('studentUserId', '==', userId)
    )
    
    const teachersSnapshot = await getDocs(teachersQuery)
    
    const updatePromises = teachersSnapshot.docs.map(doc => {
      return setDoc(
        doc.ref,
        {
          studentName: displayName,
          lastUpdated: serverTimestamp()
        },
        { merge: true }
      )
    })
    
    await Promise.all(updatePromises)
  } catch (error) {
    console.error('Error updating teacher student name:', error)
  }
}

// ===== 既存のクイズ・模試・タイマー関数への追加 =====
// これらは既存のファイルに追加する関数です

// クイズ結果保存後に呼び出す
export async function afterSaveQuizResult(userId: string) {
  // 教師への統計情報を更新
  await updateStudentStatsForTeachers(userId)
}

// 模試結果保存後に呼び出す
export async function afterSaveMockExamResult(userId: string) {
  // 最終更新日時のみ更新
  try {
    const teachersQuery = query(
      collectionGroup(db, 'students'),
      where('studentUserId', '==', userId)
    )
    
    const teachersSnapshot = await getDocs(teachersQuery)
    
    const updatePromises = teachersSnapshot.docs.map(doc => {
      return setDoc(
        doc.ref,
        {
          lastUpdated: serverTimestamp()
        },
        { merge: true }
      )
    })
    
    await Promise.all(updatePromises)
  } catch (error) {
    console.error('Error updating teacher info:', error)
  }
}