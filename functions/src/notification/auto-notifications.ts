import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// ========== 学習時間の自動通知 ==========
export const onStudySessionComplete = functions.firestore
  .document('users/{userId}/studySessions/{sessionId}')
  .onCreate(async (snap, context) => {
    const { userId } = context.params;
    const session = snap.data();
    
    // 今日の総学習時間を計算
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sessionsSnapshot = await admin.firestore()
      .collection('users')
      .doc(userId)
      .collection('studySessions')
      .where('date', '>=', today)
      .get();
    
    let totalMinutes = 0;
    sessionsSnapshot.forEach(doc => {
      totalMinutes += doc.data().duration || 0;
    });
    
    const totalHours = Math.floor(totalMinutes / 60);
    
    // マイルストーン通知
    const milestones = [
      { hours: 1, title: '今日1時間達成！🎯', message: '素晴らしいスタートです！この調子で頑張りましょう！' },
      { hours: 3, title: '今日3時間達成！🔥', message: '集中力が素晴らしいです！適度な休憩も忘れずに！' },
      { hours: 5, title: '今日5時間達成！⭐', message: '目標達成まであと少し！無理せず頑張りましょう！' },
      { hours: 8, title: '今日8時間達成！🏆', message: '驚異的な学習量です！しっかり休息も取ってくださいね！' },
      { hours: 10, title: '今日10時間達成！🚀', message: 'すごい集中力です！体調に気をつけて、明日も頑張りましょう！' }
    ];
    
    const milestone = milestones.find(m => m.hours === totalHours);
    if (milestone) {
      await createNotification(userId, {
        type: 'achievement',
        title: milestone.title,
        message: milestone.message
      });
    }
  });

// ========== 連続学習記録（毎日21時チェック）==========
export const checkDailyStreak = functions.pubsub
  .schedule('0 21 * * *')
  .timeZone('Asia/Tokyo')
  .onRun(async () => {
    const users = await admin.firestore()
      .collection('users')
      .where('isActive', '==', true)
      .get();
    
    for (const userDoc of users.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const previousStreak = userData.currentStreak || 0;
      
      // 今日学習したかチェック
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaySession = await admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('studySessions')
        .where('date', '>=', today)
        .limit(1)
        .get();
      
      if (!todaySession.empty) {
        const newStreak = previousStreak + 1;
        
        // 連続記録更新
        await userDoc.ref.update({
          currentStreak: newStreak,
          lastStudyDate: today
        });
        
        // マイルストーン通知
        const streakMilestones = [
          { days: 3, emoji: '🌱', message: '3日連続達成！習慣化の第一歩です！' },
          { days: 7, emoji: '🌟', message: '1週間連続達成！素晴らしい習慣が身についています！' },
          { days: 14, emoji: '🔥', message: '2週間連続達成！もう学習が日課になっていますね！' },
          { days: 30, emoji: '👑', message: '1ヶ月連続達成！あなたは学習の達人です！' },
          { days: 50, emoji: '💎', message: '50日連続達成！驚異的な継続力です！' },
          { days: 100, emoji: '🏆', message: '100日連続達成！伝説的な記録です！' }
        ];
        
        const milestone = streakMilestones.find(m => m.days === newStreak);
        if (milestone) {
          await createNotification(userId, {
            type: 'achievement',
            title: `${milestone.emoji} ${milestone.days}日連続学習達成！`,
            message: milestone.message
          });
        }
      } else {
        // 連続記録が途切れた場合
        if (previousStreak >= 3) {
          await createNotification(userId, {
            type: 'reminder',
            title: '連続記録が途切れそうです😢',
            message: `${previousStreak}日間の連続記録が途切れてしまいます。今からでも少しだけ学習しませんか？`
          });
        }
      }
    }
  });

// ========== 週間レポート（毎週日曜21時）==========
export const weeklyReport = functions.pubsub
  .schedule('0 21 * * 0')
  .timeZone('Asia/Tokyo')
  .onRun(async () => {
    const users = await admin.firestore()
      .collection('users')
      .where('isActive', '==', true)
      .get();
    
    for (const userDoc of users.docs) {
      const userId = userDoc.id;
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      
      // 週間統計を集計
      const sessions = await admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('studySessions')
        .where('date', '>=', weekStart)
        .get();
      
      let totalMinutes = 0;
      let studyDays = new Set();
      
      sessions.forEach(doc => {
        const data = doc.data();
        totalMinutes += data.duration || 0;
        const dateStr = data.date.toDate().toDateString();
        studyDays.add(dateStr);
      });
      
      const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
      const daysStudied = studyDays.size;
      
      // 週間レポート通知
      await createNotification(userId, {
        type: 'achievement',
        title: '📊 今週の学習レポート',
        message: `今週は${daysStudied}日間で合計${totalHours}時間学習しました！${
          daysStudied >= 6 ? '素晴らしい1週間でした！' : '来週も頑張りましょう！'
        }`
      });
    }
  });

// ========== 模試リマインダー ==========
export const examReminders = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('Asia/Tokyo')
  .onRun(async () => {
    const exams = await admin.firestore()
      .collection('exams')
      .where('deadline', '>=', new Date())
      .get();
    
    for (const examDoc of exams.docs) {
      const exam = examDoc.data();
      const deadline = exam.deadline.toDate();
      const now = new Date();
      const daysUntil = Math.floor((deadline - now) / (1000 * 60 * 60 * 24));
      
      // 締切3日前と1日前に通知
      if (daysUntil === 3 || daysUntil === 1) {
        // この模試に登録していないユーザーに通知
        const registeredUsers = exam.registeredUsers || [];
        const targetUsers = await admin.firestore()
          .collection('users')
          .where('isActive', '==', true)
          .get();
        
        for (const userDoc of targetUsers.docs) {
          if (!registeredUsers.includes(userDoc.id)) {
            await createNotification(userDoc.id, {
              type: 'reminder',
              title: `${exam.name}の申込締切まであと${daysUntil}日`,
              message: `締切は${deadline.toLocaleDateString('ja-JP')}です。忘れずに申し込みましょう！`
            });
          }
        }
      }
    }
  });

// ========== サブスクリプション期限通知 ==========
export const subscriptionReminders = functions.pubsub
  .schedule('0 10 * * *')
  .timeZone('Asia/Tokyo')
  .onRun(async () => {
    const users = await admin.firestore()
      .collection('users')
      .where('subscriptionStatus', '==', 'active')
      .get();
    
    for (const userDoc of users.docs) {
      const userData = userDoc.data();
      const expiryDate = userData.subscriptionExpiry?.toDate();
      
      if (expiryDate) {
        const now = new Date();
        const daysUntil = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        // 7日前、3日前、1日前に通知
        if ([7, 3, 1].includes(daysUntil)) {
          await createNotification(userDoc.id, {
            type: 'warning',
            title: 'サブスクリプション有効期限のお知らせ',
            message: `プレミアムプランの有効期限まであと${daysUntil}日です。設定画面から更新できます。`
          });
        }
      }
    }
  });

// ========== 通知作成のヘルパー関数 ==========
async function createNotification(
  userId: string, 
  notification: {
    type: string;
    title: string;
    message: string;
  }
) {
  await admin.firestore()
    .collection('notifications')
    .doc(userId)
    .collection('userNotifications')
    .add({
      ...notification,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      source: 'system'
    });
}