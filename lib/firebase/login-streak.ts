import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

export interface LoginStreakData {
  currentStreak: number;
  longestStreak: number;
  lastLoginDate: Date | null;
  totalLoginDays: number;
}

/**
 * 連続ログイン日数を更新する
 */
export async function updateLoginStreak(userId: string): Promise<LoginStreakData> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 最後のログイン日を取得
    const lastLogin = userData.lastLoginDate?.toDate();
    
    if (!lastLogin) {
      // 初回ログイン
      const streakData: LoginStreakData = {
        currentStreak: 1,
        longestStreak: 1,
        lastLoginDate: today,
        totalLoginDays: 1
      };
      
      await updateDoc(userRef, {
        ...streakData,
        lastLoginDate: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return streakData;
    }
    
    // 最後のログイン日を日付のみに変換
    const lastLoginDate = new Date(
      lastLogin.getFullYear(), 
      lastLogin.getMonth(), 
      lastLogin.getDate()
    );
    
    // 日数差を計算
    const diffTime = today.getTime() - lastLoginDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    let streakData: LoginStreakData = {
      currentStreak: userData.currentStreak || 1,
      longestStreak: userData.longestStreak || 1,
      lastLoginDate: today,
      totalLoginDays: userData.totalLoginDays || 1
    };
    
    if (diffDays === 0) {
      // 同日の再ログイン - 何もしない
      return streakData;
    } else if (diffDays === 1) {
      // 連続ログイン継続
      streakData.currentStreak = (userData.currentStreak || 0) + 1;
      streakData.longestStreak = Math.max(
        streakData.currentStreak, 
        userData.longestStreak || 0
      );
      streakData.totalLoginDays = (userData.totalLoginDays || 0) + 1;
    } else {
      // 連続ログイン途切れ
      streakData.currentStreak = 1;
      streakData.totalLoginDays = (userData.totalLoginDays || 0) + 1;
    }
    
    // Firestoreを更新
    await updateDoc(userRef, {
      ...streakData,
      lastLoginDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('Login streak updated:', streakData);
    return streakData;
    
  } catch (error) {
    console.error('Failed to update login streak:', error);
    throw error;
  }
}

/**
 * ユーザーの連続ログイン情報を取得
 */
export async function getLoginStreak(userId: string): Promise<LoginStreakData | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    return {
      currentStreak: userData.currentStreak || 0,
      longestStreak: userData.longestStreak || 0,
      lastLoginDate: userData.lastLoginDate?.toDate() || null,
      totalLoginDays: userData.totalLoginDays || 0
    };
  } catch (error) {
    console.error('Failed to get login streak:', error);
    return null;
  }
}
