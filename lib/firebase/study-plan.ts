// lib/firebase/study-plan.ts
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
  limit,
  addDoc,
  writeBatch
} from 'firebase/firestore'
import { db } from './config'
import { 
  StudyPlan, 
  CalendarEvent, 
  Phase, 
  DayTemplate,
  TimeSlot,
  StudyRecord,
  PlanProgress
} from '@/types/study-plan'
import { 
  addDays, 
  addWeeks, 
  startOfWeek, 
  format, 
  getDay,
  isSameDay,
  setHours,
  setMinutes
} from 'date-fns'

// AI生成計画を保存
export async function saveStudyPlan(
  userId: string,
  planData: Omit<StudyPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'version'>
): Promise<string> {
  try {
    // 既存のアクティブな計画を非アクティブに
    const activePlans = await getDocs(
      query(
        collection(db, 'studyPlans'),
        where('userId', '==', userId),
        where('isActive', '==', true)
      )
    )
    
    const batch = writeBatch(db)
    activePlans.forEach((doc) => {
      batch.update(doc.ref, { isActive: false, status: 'archived' })
    })
    await batch.commit()

    // 新しい計画を作成
    const newPlan: Omit<StudyPlan, 'id'> = {
      ...planData,
      userId,
      version: 1,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    }
    
    const docRef = await addDoc(collection(db, 'studyPlans'), newPlan)
    console.log('学習計画作成成功:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('学習計画作成エラー:', error)
    throw error
  }
}

// 計画をカレンダーイベントに展開
export async function applyPlanToCalendar(
  planId: string,
  startDate: Date = new Date()
): Promise<void> {
  try {
    // 計画を取得
    const planDoc = await getDoc(doc(db, 'studyPlans', planId))
    if (!planDoc.exists()) {
      throw new Error('計画が見つかりません')
    }
    
    const plan = { id: planDoc.id, ...planDoc.data() } as StudyPlan
    
    // バッチ処理の準備
    const batch = writeBatch(db)
    const events: CalendarEvent[] = []
    
    // 各フェーズごとにイベントを生成
    let currentWeek = 0
    for (const phase of plan.phases) {
      const phaseStartDate = addWeeks(startDate, currentWeek)
      const phaseEndDate = addWeeks(phaseStartDate, phase.weeks)
      
      // フェーズ内の各週を処理
      for (let week = 0; week < phase.weeks; week++) {
        const weekStartDate = addWeeks(phaseStartDate, week)
        
        // 週間テンプレートに基づいてイベントを生成
        Object.entries(plan.weeklyTemplate).forEach(([dayName, dayTemplate]) => {
          const dayEvents = generateDayEvents(
            weekStartDate,
            dayName,
            dayTemplate,
            phase,
            plan,
            week + currentWeek
          )
          events.push(...dayEvents)
        })
      }
      
      currentWeek += phase.weeks
    }
    
    // マイルストーンイベントを追加
    plan.milestones.forEach((milestone) => {
      const milestoneDate = addWeeks(startDate, milestone.week)
      events.push({
        planId,
        date: milestoneDate,
        title: `マイルストーン: ${milestone.target}`,
        type: 'milestone',
        startTime: '20:00',
        endTime: '21:00',
        description: milestone.metric,
        isFlexible: false
      })
    })
    
    // イベントをFirestoreに保存
    for (const event of events) {
      const eventRef = doc(collection(db, 'calendarEvents'))
      batch.set(eventRef, {
        ...event,
        createdAt: serverTimestamp()
      })
    }
    
    await batch.commit()
    console.log(`${events.length}件のイベントをカレンダーに追加しました`)
  } catch (error) {
    console.error('カレンダー適用エラー:', error)
    throw error
  }
}

// 1日のイベントを生成
function generateDayEvents(
  weekStartDate: Date,
  dayName: string,
  dayTemplate: DayTemplate,
  phase: Phase,
  plan: StudyPlan,
  weekNumber: number
): CalendarEvent[] {
  const events: CalendarEvent[] = []
  const dayMap: { [key: string]: number } = {
    'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
    'thursday': 4, 'friday': 5, 'saturday': 6
  }
  
  const dayIndex = dayMap[dayName.toLowerCase()]
  const targetDate = addDays(weekStartDate, dayIndex - getDay(weekStartDate))
  
  // タイムスロットが定義されている場合はそれを使用
  if (dayTemplate.timeSlots && dayTemplate.timeSlots.length > 0) {
    dayTemplate.timeSlots.forEach((slot) => {
      events.push({
        planId: plan.id!,
        date: targetDate,
        title: `${slot.subject}学習`,
        type: 'study',
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: slot.subject,
        description: `${phase.name} - 週${weekNumber + 1}`,
        phase: phase.name,
        isFlexible: slot.isFlexible
      })
    })
  } else {
    // タイムスロットがない場合は、科目と時間から自動生成
    const hoursPerSubject = dayTemplate.hours / dayTemplate.subjects.length
    let currentTime = 9 // 9時開始
    
    dayTemplate.subjects.forEach((subject) => {
      const startHour = Math.floor(currentTime)
      const startMinute = Math.round((currentTime - startHour) * 60)
      const endTime = currentTime + hoursPerSubject
      const endHour = Math.floor(endTime)
      const endMinute = Math.round((endTime - endHour) * 60)
      
      events.push({
        planId: plan.id!,
        date: targetDate,
        title: `${subject}学習`,
        type: 'study',
        startTime: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
        endTime: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`,
        subject,
        description: `${phase.name} - 週${weekNumber + 1}`,
        phase: phase.name,
        isFlexible: true
      })
      
      currentTime = endTime + 0.5 // 30分休憩
    })
  }
  
  return events
}

// 特定の日付のカレンダーイベントを取得
export async function getCalendarEvents(
  planId: string,
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  try {
    const q = query(
      collection(db, 'calendarEvents'),
      where('planId', '==', planId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc'),
      orderBy('startTime', 'asc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CalendarEvent))
  } catch (error) {
    console.error('カレンダーイベント取得エラー:', error)
    throw error
  }
}

// 学習記録を保存
export async function saveStudyRecord(
  record: Omit<StudyRecord, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const newRecord = {
      ...record,
      createdAt: serverTimestamp()
    }
    
    const docRef = await addDoc(collection(db, 'studyRecords'), newRecord)
    console.log('学習記録保存成功:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('学習記録保存エラー:', error)
    throw error
  }
}

// 進捗状況を計算
export async function calculatePlanProgress(
  planId: string
): Promise<PlanProgress> {
  try {
    // 計画を取得
    const planDoc = await getDoc(doc(db, 'studyPlans', planId))
    if (!planDoc.exists()) {
      throw new Error('計画が見つかりません')
    }
    const plan = { id: planDoc.id, ...planDoc.data() } as StudyPlan
    
    // 学習記録を取得
    const recordsQuery = query(
      collection(db, 'studyRecords'),
      where('planId', '==', planId)
    )
    const recordsSnapshot = await getDocs(recordsQuery)
    const records = recordsSnapshot.docs.map(doc => doc.data() as StudyRecord)
    
    // 進捗を計算
    const now = new Date()
    const startDate = plan.createdAt ? (plan.createdAt as any).toDate() : new Date()
    const weeksSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
    
    // 科目別の進捗を集計
    const subjectProgress: { [key: string]: any } = {}
    plan.subjects.filter(s => s.isSelected).forEach(subject => {
      subjectProgress[subject.name] = {
        plannedHours: 0,
        completedHours: 0,
        percentage: 0
      }
    })
    
    // 記録から実績を集計
    records.forEach(record => {
      Object.entries(record.subjects).forEach(([subjectName, data]) => {
        if (subjectProgress[subjectName]) {
          subjectProgress[subjectName].completedHours += data.actualMinutes / 60
        }
      })
    })
    
    // 計画時間を計算
    const totalPlannedWeeks = Math.min(weeksSinceStart, plan.summary.totalWeeks)
    Object.keys(subjectProgress).forEach(subjectName => {
      const subject = plan.subjects.find(s => s.name === subjectName)
      if (subject && subject.weeklyHours) {
        subjectProgress[subjectName].plannedHours = subject.weeklyHours * totalPlannedWeeks
        subjectProgress[subjectName].percentage = 
          (subjectProgress[subjectName].completedHours / subjectProgress[subjectName].plannedHours) * 100
      }
    })
    
    // 全体の完了率
    const totalPlanned = Object.values(subjectProgress).reduce((sum: number, p: any) => sum + p.plannedHours, 0)
    const totalCompleted = Object.values(subjectProgress).reduce((sum: number, p: any) => sum + p.completedHours, 0)
    const completionRate = totalPlanned > 0 ? (totalCompleted / totalPlanned) * 100 : 0
    
    return {
      planId,
      currentWeek: weeksSinceStart,
      completionRate,
      subjectProgress,
      deviations: [], // TODO: 逸脱の検出ロジックを実装
      lastUpdated: now
    }
  } catch (error) {
    console.error('進捗計算エラー:', error)
    throw error
  }
}

// アクティブな計画を取得
export async function getActiveStudyPlan(userId: string): Promise<StudyPlan | null> {
  try {
    const q = query(
      collection(db, 'studyPlans'),
      where('userId', '==', userId),
      where('isActive', '==', true),
      limit(1)
    )
    
    const snapshot = await getDocs(q)
    if (snapshot.empty) {
      return null
    }
    
    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data()
    } as StudyPlan
  } catch (error) {
    console.error('アクティブ計画取得エラー:', error)
    throw error
  }
}