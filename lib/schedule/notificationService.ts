// lib/schedule/notificationService.ts

import { messaging } from '@/lib/firebase/config'
import { db } from '@/lib/firebase/config'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { CalendarEvent } from '@/types/study-plan'

export class NotificationService {
  // 通知の権限をリクエスト
  async requestPermission(userId: string): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('通知権限エラー:', error)
      return false
    }
  }
  
  // リマインダーのスケジュール
  async scheduleReminder(event: CalendarEvent, beforeMinutes: number) {
    const reminderTime = new Date(event.date)
    reminderTime.setMinutes(reminderTime.getMinutes() - beforeMinutes)
    
    // Firestoreに保存
    await setDoc(doc(db, 'reminders', event.id!), {
      eventId: event.id,
      scheduledTime: reminderTime,
      message: `${event.title}が${beforeMinutes}分後に始まります`,
      status: 'pending'
    })
  }
  
  // 通知設定の保存
  async saveNotificationPreferences(userId: string, preferences: any) {
    await setDoc(doc(db, 'users', userId, 'preferences', 'notifications'), preferences)
  }
}

export default new NotificationService()
