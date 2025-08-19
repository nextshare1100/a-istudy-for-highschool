// lib/firebase/manual-events.ts
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  addDoc,
  onSnapshot
} from 'firebase/firestore'
import { db } from './config'

// 手動イベントの型定義
export interface ManualEvent {
  id?: string
  userId: string
  date: Date
  title: string
  type: 'study' | 'exam' | 'school' | 'personal' | 'break'
  startTime: string
  endTime: string
  subject?: string
  description?: string
  isFlexible: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

// 手動イベントを作成
export async function createManualEvent(
  userId: string,
  eventData: Omit<ManualEvent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const newEvent = {
      ...eventData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
    
    const docRef = await addDoc(collection(db, 'manualEvents'), newEvent)
    console.log('手動イベント作成成功:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('手動イベント作成エラー:', error)
    throw error
  }
}

// 特定期間の手動イベントを取得
export async function getManualEvents(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<ManualEvent[]> {
  try {
    const q = query(
      collection(db, 'manualEvents'),
      where('userId', '==', userId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ManualEvent))
  } catch (error) {
    console.error('手動イベント取得エラー:', error)
    throw error
  }
}

// 手動イベントのリアルタイムリスナー
export function subscribeToManualEvents(
  userId: string,
  startDate: Date,
  endDate: Date,
  callback: (events: ManualEvent[]) => void
): () => void {
  const q = query(
    collection(db, 'manualEvents'),
    where('userId', '==', userId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc'),
    orderBy('startTime', 'asc')
  )
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ManualEvent))
    callback(events)
  }, (error) => {
    console.error('手動イベントリスナーエラー:', error)
  })
  
  return unsubscribe
}

// 手動イベントを更新
export async function updateManualEvent(
  eventId: string,
  updates: Partial<Omit<ManualEvent, 'id' | 'userId' | 'createdAt'>>
): Promise<void> {
  try {
    const eventRef = doc(db, 'manualEvents', eventId)
    await updateDoc(eventRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
    console.log('手動イベント更新成功:', eventId)
  } catch (error) {
    console.error('手動イベント更新エラー:', error)
    throw error
  }
}

// 手動イベントを削除
export async function deleteManualEvent(eventId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'manualEvents', eventId))
    console.log('手動イベント削除成功:', eventId)
  } catch (error) {
    console.error('手動イベント削除エラー:', error)
    throw error
  }
}

// 学習時間の統計を取得
export async function getStudyStatistics(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalHours: number
  bySubject: { [subject: string]: number }
  byDay: { date: string; hours: number }[]
}> {
  try {
    // 手動イベントを取得
    const manualEvents = await getManualEvents(userId, startDate, endDate)
    
    // AI計画のイベントも取得（別途実装）
    // const aiEvents = await getCalendarEvents(...)
    
    // 学習イベントのみフィルタ
    const studyEvents = manualEvents.filter(e => e.type === 'study')
    
    // 統計を計算
    let totalHours = 0
    const bySubject: { [subject: string]: number } = {}
    const byDay: { [date: string]: number } = {}
    
    studyEvents.forEach(event => {
      const [startHour, startMin] = event.startTime.split(':').map(Number)
      const [endHour, endMin] = event.endTime.split(':').map(Number)
      const hours = (endHour + endMin / 60) - (startHour + startMin / 60)
      
      totalHours += hours
      
      if (event.subject) {
        bySubject[event.subject] = (bySubject[event.subject] || 0) + hours
      }
      
      const dateStr = event.date instanceof Date 
        ? event.date.toISOString().split('T')[0]
        : (event.date as any).toDate().toISOString().split('T')[0]
      
      byDay[dateStr] = (byDay[dateStr] || 0) + hours
    })
    
    // 日付順に並べ替え
    const byDayArray = Object.entries(byDay)
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => a.date.localeCompare(b.date))
    
    return {
      totalHours,
      bySubject,
      byDay: byDayArray
    }
  } catch (error) {
    console.error('統計取得エラー:', error)
    throw error
  }
}