import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// 学習記録が更新されたときに達成通知をチェック
export const checkStudyAchievements = functions.firestore
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
    
    // 達成通知を作成する関数
    const createAchievementNotification = async (
      title: string, 
      message: string
    ) => {
      await admin.firestore()
        .collection('notifications')
        .doc(userId)
        .collection('userNotifications')
        .add({
          type: 'achievement',
          title,
          message,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          read: false,
          actionRequired: false
        });
      
      // プッシュ通知も送信
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      const fcmToken = userDoc.data()?.fcmToken;
      if (fcmToken) {
        await admin.messaging().send({
          token: fcmToken,
          notification: { title, body: message }
        });
      }
    };
    
    // 学習時間の達成をチェック
    if (totalHours === 1) {
      await createAchievementNotification(
        '1時間達成！🎯',
        '今日1時間の学習を達成しました！この調子で頑張りましょう！'
      );
    } else if (totalHours === 3) {
      await createAchievementNotification(
        '3時間達成！🔥',
        '今日3時間の学習を達成しました！素晴らしいペースです！'
      );
    } else if (totalHours === 5) {
      await createAchievementNotification(
        '5時間達成！⭐',
        '今日5時間の学習を達成しました！驚異的な集中力です！'
      );
    } else if (totalHours === 8) {
      await createAchievementNotification(
        '8時間達成！🏆',
        '今日8時間の学習を達成しました！限界を超えた努力です！'
      );
    }
  });

// 連続学習記録をチェック（毎日21時に実行）
export const checkConsecutiveDays = functions.pubsub
  .schedule('0 21 * * *')
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('isActive', '==', true)
      .get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      // 過去30日間の学習記録をチェック
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const studyDays = new Set<string>();
      const sessionsSnapshot = await admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('studySessions')
        .where('date', '>=', thirtyDaysAgo)
        .get();
      
      sessionsSnapshot.forEach(doc => {
        const date = doc.data().date.toDate();
        const dateString = date.toISOString().split('T')[0];
        studyDays.add(dateString);
      });
      
      // 連続日数を計算
      let consecutiveDays = 0;
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const dateString = checkDate.toISOString().split('T')[0];
        
        if (studyDays.has(dateString)) {
          consecutiveDays++;
        } else {
          break;
        }
      }
      
      // 連続記録の達成通知
      const milestones = [3, 7, 14, 30];
      const lastMilestone = userData.lastConsecutiveMilestone || 0;
      
      for (const milestone of milestones) {
        if (consecutiveDays >= milestone && lastMilestone < milestone) {
          await admin.firestore()
            .collection('notifications')
            .doc(userId)
            .collection('userNotifications')
            .add({
              type: 'achievement',
              title: `${milestone}日連続学習達成！🎊`,
              message: `${milestone}日間連続で学習を継続しています！素晴らしい習慣です！`,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              read: false
            });
          
          // ユーザーデータを更新
          await admin.firestore()
            .collection('users')
            .doc(userId)
            .update({
              lastConsecutiveMilestone: milestone,
              consecutiveDays
            });
          
          break;
        }
      }
    }
  });

// 週間学習目標の達成チェック（毎週日曜日の21時）
export const checkWeeklyGoals = functions.pubsub
  .schedule('0 21 * * 0')
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    const usersSnapshot = await admin.firestore()
      .collection('users')
      .where('weeklyGoalHours', '>', 0)
      .get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const weeklyGoal = userDoc.data().weeklyGoalHours || 0;
      
      // 今週の学習時間を集計
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);
      
      const sessionsSnapshot = await admin.firestore()
        .collection('users')
        .doc(userId)
        .collection('studySessions')
        .where('date', '>=', weekStart)
        .get();
      
      let totalMinutes = 0;
      sessionsSnapshot.forEach(doc => {
        totalMinutes += doc.data().duration || 0;
      });
      
      const totalHours = totalMinutes / 60;
      
      if (totalHours >= weeklyGoal) {
        await admin.firestore()
          .collection('notifications')
          .doc(userId)
          .collection('userNotifications')
          .add({
            type: 'achievement',
            title: '週間目標達成！🎯',
            message: `今週の学習目標${weeklyGoal}時間を達成しました！来週も頑張りましょう！`,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            read: false
          });
      }
    }
  });