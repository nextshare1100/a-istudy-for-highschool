// lib/firebase/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider,
  User,
  UserCredential,
  onAuthStateChanged,
  NextOrObserver,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth, db } from './index';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { UserProfile } from '@/types';

// 永続化設定
setPersistence(auth, browserLocalPersistence);

// プロバイダー
const googleProvider = new GoogleAuthProvider();
const appleProvider = new OAuthProvider('apple.com');

// Capacitor環境の検出ヘルパー
function isCapacitorApp(): boolean {
  return typeof window !== 'undefined' && 
         window.Capacitor !== undefined && 
         window.Capacitor.isNativePlatform();
}

// 認証関数
export async function signUp(
  email: string,
  password: string,
  displayName: string,
  grade: string,
  school?: string
): Promise<{ user: User; profile: UserProfile }> {
  try {
    // Firebase Authでユーザー作成
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // プロフィール更新
    await updateProfile(user, { displayName });

    // Firestoreにユーザードキュメント作成
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName,
      grade: grade as '高1' | '高2' | '高3',
      school,
      subjects: [],
      goals: [],
      aspirations: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    // 初回ログインとして連続日数を初期化
    await initializeLoginStreak(user.uid);

    // Capacitor環境でのログ
    if (isCapacitorApp()) {
      console.log('[Capacitor] 新規登録成功:', user.uid);
    }

    return { user, profile: userProfile };
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<UserCredential> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    
    // 連続ログイン日数を更新
    await updateLoginStreak(credential.user.uid);
    
    // 最終アクティブ時刻を更新
    await updateLastActive(credential.user.uid);
    
    return credential;
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
}

export async function signInWithGoogle(): Promise<{ user: User; profile: UserProfile }> {
  try {
    // Capacitor環境では一時的に無効化
    if (isCapacitorApp()) {
      throw new Error('ソーシャルログインは現在モバイルアプリでは利用できません。メールアドレスでログインしてください。');
    }

    const credential = await signInWithPopup(auth, googleProvider);
    const user = credential.user;

    // 既存ユーザーかチェック
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      // 既存ユーザー
      // 連続ログイン日数を更新
      await updateLoginStreak(user.uid);
      await updateLastActive(user.uid);
      return { user, profile: userDoc.data() as UserProfile };
    } else {
      // 新規ユーザー
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || '未設定',
        photoURL: user.photoURL || undefined,
        grade: '高1', // デフォルト値
        subjects: [],
        goals: [],
        aspirations: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      
      // 初回ログインとして連続日数を初期化
      await initializeLoginStreak(user.uid);
      
      return { user, profile: userProfile };
    }
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
}

export async function signInWithApple(): Promise<{ user: User; profile: UserProfile }> {
  try {
    // Capacitor環境では一時的に無効化
    if (isCapacitorApp()) {
      throw new Error('ソーシャルログインは現在モバイルアプリでは利用できません。メールアドレスでログインしてください。');
    }

    appleProvider.addScope('email');
    appleProvider.addScope('name');
    
    const credential = await signInWithPopup(auth, appleProvider);
    const user = credential.user;

    // 既存ユーザーかチェック
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      // 既存ユーザー
      // 連続ログイン日数を更新
      await updateLoginStreak(user.uid);
      await updateLastActive(user.uid);
      return { user, profile: userDoc.data() as UserProfile };
    } else {
      // 新規ユーザー
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || '未設定',
        photoURL: user.photoURL || undefined,
        grade: '高1', // デフォルト値
        subjects: [],
        goals: [],
        aspirations: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      
      // 初回ログインとして連続日数を初期化
      await initializeLoginStreak(user.uid);
      
      return { user, profile: userProfile };
    }
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
}

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
}

// ヘルパー関数

// 連続ログイン日数を初期化する関数（新規ユーザー用）
async function initializeLoginStreak(userId: string): Promise<void> {
  console.log(`[LOGIN STREAK] Initializing streak for new user: ${userId}`);
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'studyStats.currentStreak': 1,
      'studyStats.longestStreak': 1,
      'studyStats.lastActiveDate': serverTimestamp(),
      'studyStats.totalLoginDays': 1,
      lastActiveAt: serverTimestamp()
    });
    console.log('[LOGIN STREAK] Login streak initialized for new user');
  } catch (error) {
    console.error('[LOGIN STREAK] Failed to initialize login streak:', error);
  }
}

// 連続ログイン日数を更新する関数
async function updateLoginStreak(userId: string): Promise<void> {
  console.log(`[LOGIN STREAK] Function called for user: ${userId}`);
  
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('[LOGIN STREAK] User document not found for streak update');
      return;
    }
    
    const userData = userDoc.data();
    console.log('[LOGIN STREAK] User data retrieved:', {
      currentStreak: userData.studyStats?.currentStreak,
      lastActiveDate: userData.studyStats?.lastActiveDate?.toDate?.()?.toISOString(),
      lastActiveAt: userData.lastActiveAt?.toDate?.()?.toISOString(),
      lastLoginAt: userData.lastLoginAt?.toDate?.()?.toISOString()
    });
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    console.log(`[LOGIN STREAK] Today's date: ${today.toISOString()}`);
    
    // 最後のアクティブ日を取得（複数のフィールドから確認）
    const lastActive = userData.studyStats?.lastActiveDate?.toDate() || 
                      userData.lastActiveAt?.toDate() ||
                      userData.lastLoginAt?.toDate();
    
    if (!lastActive) {
      // 初回ログイン扱い
      console.log('[LOGIN STREAK] No previous login date found - treating as first login');
      await initializeLoginStreak(userId);
      return;
    }
    
    const lastActiveDate = new Date(
      lastActive.getFullYear(), 
      lastActive.getMonth(), 
      lastActive.getDate()
    );
    console.log(`[LOGIN STREAK] Last active date: ${lastActiveDate.toISOString()}`);
    
    const diffDays = Math.floor((today.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`[LOGIN STREAK] Days difference: ${diffDays}`);
    
    if (diffDays === 0) {
      // 同日の再ログイン - 連続日数は更新しない
      console.log('[LOGIN STREAK] Same day login - streak unchanged');
      return;
    } else if (diffDays === 1) {
      // 連続ログイン継続
      const currentStreak = (userData.studyStats?.currentStreak || 0) + 1;
      const longestStreak = Math.max(currentStreak, userData.studyStats?.longestStreak || 0);
      const totalLoginDays = (userData.studyStats?.totalLoginDays || 0) + 1;
      
      console.log(`[LOGIN STREAK] Updating streak: current=${currentStreak}, longest=${longestStreak}, total=${totalLoginDays}`);
      
      await updateDoc(userRef, {
        'studyStats.currentStreak': currentStreak,
        'studyStats.longestStreak': longestStreak,
        'studyStats.lastActiveDate': serverTimestamp(),
        'studyStats.totalLoginDays': totalLoginDays,
        lastActiveAt: serverTimestamp()
      });
      console.log(`[LOGIN STREAK] Login streak continued: ${currentStreak} days`);
    } else {
      // 連続ログイン途切れ（2日以上空いた）
      const totalLoginDays = (userData.studyStats?.totalLoginDays || 0) + 1;
      
      console.log(`[LOGIN STREAK] Streak broken - resetting to 1 (was ${userData.studyStats?.currentStreak || 0})`);
      
      await updateDoc(userRef, {
        'studyStats.currentStreak': 1,
        'studyStats.lastActiveDate': serverTimestamp(),
        'studyStats.totalLoginDays': totalLoginDays,
        lastActiveAt: serverTimestamp()
      });
      console.log('[LOGIN STREAK] Login streak reset to 1 day');
    }
  } catch (error) {
    console.error('[LOGIN STREAK] Failed to update login streak:', error);
  }
}

async function updateLastActive(userId: string): Promise<void> {
  try {
    await updateDoc(
      doc(db, 'users', userId),
      { 
        lastActiveAt: serverTimestamp(),
        lastLoginAt: serverTimestamp() // 追加：より明確なログイン時刻の記録
      }
    );
  } catch (error) {
    console.error('Failed to update last active:', error);
  }
}

// updateLastLogin関数（updateLastActiveのエイリアス）
export const updateLastLogin = updateLastActive;

// 認証状態リスナー
export function onAuthStateChange(callback: NextOrObserver<User>) {
  return onAuthStateChanged(auth, callback);
}

// 現在のユーザーを取得
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// ユーザープロフィールを取得
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }
}

// エラーメッセージの日本語化
function getAuthErrorMessage(code: string): string {
  const errorMessages: Record<string, string> = {
    'auth/email-already-in-use': 'このメールアドレスは既に使用されています',
    'auth/invalid-email': 'メールアドレスの形式が正しくありません',
    'auth/operation-not-allowed': 'この操作は許可されていません',
    'auth/weak-password': 'パスワードは6文字以上で設定してください',
    'auth/user-disabled': 'このアカウントは無効化されています',
    'auth/user-not-found': 'アカウントが見つかりません',
    'auth/wrong-password': 'パスワードが正しくありません',
    'auth/popup-closed-by-user': 'ログインがキャンセルされました',
    'auth/cancelled-popup-request': 'ログインがキャンセルされました',
    'auth/popup-blocked': 'ポップアップがブロックされました',
    'auth/too-many-requests': 'しばらく時間をおいてから再度お試しください',
    'auth/invalid-credential': 'メールアドレスまたはパスワードが正しくありません',
    'auth/network-request-failed': 'ネットワークエラーが発生しました',
  };

  return errorMessages[code] || 'エラーが発生しました。もう一度お試しください。';
}

// Auth オブジェクトのエクスポート
export { auth };