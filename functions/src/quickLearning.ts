// functions/src/quickLearning.ts

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { format } from 'date-fns'

// 毎分実行してユーザーの設定時間をチェック
export const scheduleQuickLearning = functions.pubsub
  .schedule('every 1 minutes')
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    const now = new Date()
    const currentTime = format(now, 'HH:mm')
    const currentDay = ['日', '月', '火', '水', '木', '金', '土'][now.getDay()]
    
    // 現在時刻に配信予定のユーザーを検索
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .get()
    
    const promises: Promise<any>[] = []
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id
      const settingsDoc = await admin.firestore()
        .doc(`users/${userId}/settings/quickLearning`)
        .get()
      
      if (!settingsDoc.exists) continue
      
      const settings = settingsDoc.data()
      if (!settings?.enabled) continue
      
      // 固定時間のセッションをチェック
      for (const session of settings.sessions) {
        if (session.enabled && 
            session.time === currentTime && 
            session.days.includes(currentDay)) {
          promises.push(createAndNotifySession(userId, session.sessionType))
        }
      }
      
      // ランダムモードのチェック
      if (settings.randomMode?.enabled) {
        promises.push(checkRandomModeSession(userId, settings.randomMode))
      }
    }
    
    await Promise.all(promises)
  })

async function createAndNotifySession(userId: string, sessionType: string) {
  try {
    // セッション作成
    const sessionData = {
      userId,
      scheduledTime: admin.firestore.FieldValue.serverTimestamp(),
      sessionType,
      questions: await generateQuestionsForUser(userId),
      responses: [],
      completed: false,
      notificationSent: false
    }
    
    const sessionRef = await admin.firestore()
      .collection('quickLearningSessions')
      .add(sessionData)
    
    // プッシュ通知送信
    await sendQuickLearningNotification(userId, sessionRef.id, sessionType)
    
    // 通知フラグを更新
    await sessionRef.update({ notificationSent: true })
  } catch (error) {
    console.error('セッション作成エラー:', error)
  }
}

async function sendQuickLearningNotification(
  userId: string, 
  sessionId: string,
  sessionType: string
) {
  // ユーザーのFCMトークンを取得
  const deviceDoc = await admin.firestore()
    .doc(`users/${userId}/devices/web`)
    .get()
  
  if (!deviceDoc.exists) return
  
  const { fcmToken } = deviceDoc.data()!
  if (!fcmToken) return
  
  const messages = {
    morning: {
      title: '📚 おはようございます！朝の10分学習',
      body: '通学前に3教科サクッと復習しましょう！'
    },
    evening: {
      title: '🌙 今日の復習タイム',
      body: '寝る前の10分で記憶を定着させましょう！'
    },
    random: {
      title: '📖 隙間時間の学習チャンス',
      body: '10分だけ、3教科の問題を解いてみませんか？'
    }
  }
  
  const messageConfig = messages[sessionType as keyof typeof messages] || messages.random
  
  const message = {
    notification: {
      ...messageConfig,
      icon: '/icon-192x192.png'
    },
    data: {
      sessionId,
      type: 'quick_learning',
      click_action: `/quick-learning/${sessionId}`
    },
    token: fcmToken
  }
  
  try {
    await admin.messaging().send(message)
    console.log('通知送信成功:', userId)
  } catch (error) {
    console.error('通知送信エラー:', error)
  }
}

async function generateQuestionsForUser(userId: string): Promise<string[]> {
  // エビングハウスの忘却曲線に基づいて問題を選択
  const questions: string[] = []
  
  // 復習が必要な問題を取得
  const reviewSnapshot = await admin.firestore()
    .collection('userQuickLearningStats')
    .where('userId', '==', userId)
    .where('nextReviewDate', '<=', admin.firestore.Timestamp.now())
    .orderBy('nextReviewDate', 'asc')
    .limit(12)
    .get()
  
  reviewSnapshot.docs.forEach(doc => {
    questions.push(doc.data().questionId)
  })
  
  // 不足分は新規問題で補充
  if (questions.length < 15) {
    // 実装省略
  }
  
  return questions
}

// 分析データの定期集計
export const aggregateQuickLearningStats = functions.pubsub
  .schedule('0 2 * * *') // 毎日午前2時
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    // 全ユーザーの昨日の学習データを集計
    const sessionsSnapshot = await admin.firestore()
      .collection('quickLearningSessions')
      .where('startTime', '>=', admin.firestore.Timestamp.fromDate(yesterday))
      .where('completed', '==', true)
      .get()
    
    const stats = {
      totalSessions: sessionsSnapshot.size,
      totalQuestions: 0,
      correctRate: 0,
      avgResponseTime: 0,
      subjectStats: {} as any
    }
    
    // 集計処理
    let totalCorrect = 0
    let totalResponseTime = 0
    let totalResponses = 0
    
    sessionsSnapshot.docs.forEach(doc => {
      const session = doc.data()
      session.responses.forEach((response: any) => {
        totalResponses++
        if (response.isCorrect) totalCorrect++
        totalResponseTime += response.responseTime
      })
    })
    
    stats.totalQuestions = totalResponses
    stats.correctRate = totalResponses > 0 ? totalCorrect / totalResponses : 0
    stats.avgResponseTime = totalResponses > 0 ? totalResponseTime / totalResponses : 0
    
    // 日次統計として保存
    await admin.firestore()
      .collection('analytics')
      .doc('quickLearning')
      .collection('daily')
      .doc(format(yesterday, 'yyyy-MM-dd'))
      .set(stats)
  })