// lib/firebase/notifications.ts

import { messaging } from './config'
import { getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

export async function setupPushNotifications(userId: string) {
  try {
    // 通知権限をリクエスト
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('通知権限が拒否されました')
      return null
    }
    
    // FCMトークンを取得
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    })
    
    if (token) {
      // トークンをFirestoreに保存
      await setDoc(doc(db, 'users', userId, 'devices', 'web'), {
        fcmToken: token,
        platform: 'web',
        lastUpdated: serverTimestamp()
      })
      
      console.log('FCMトークンを保存しました')
      return token
    }
  } catch (error) {
    console.error('プッシュ通知セットアップエラー:', error)
    return null
  }
}

// フォアグラウンドでの通知受信
export function onNotificationReceived(callback: (payload: any) => void) {
  return onMessage(messaging, (payload) => {
    console.log('通知を受信:', payload)
    callback(payload)
  })
}