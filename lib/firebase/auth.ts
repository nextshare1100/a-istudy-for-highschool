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
   
   // 最終アクティブ時刻を更新
   await updateLastActive(credential.user.uid);
   
   return credential;
 } catch (error: any) {
   throw new Error(getAuthErrorMessage(error.code));
 }
}

export async function signInWithGoogle(): Promise<{ user: User; profile: UserProfile }> {
 try {
   const credential = await signInWithPopup(auth, googleProvider);
   const user = credential.user;

   // 既存ユーザーかチェック
   const userDoc = await getDoc(doc(db, 'users', user.uid));
   
   if (userDoc.exists()) {
     // 既存ユーザー
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
     return { user, profile: userProfile };
   }
 } catch (error: any) {
   throw new Error(getAuthErrorMessage(error.code));
 }
}

export async function signInWithApple(): Promise<{ user: User; profile: UserProfile }> {
 try {
   appleProvider.addScope('email');
   appleProvider.addScope('name');
   
   const credential = await signInWithPopup(auth, appleProvider);
   const user = credential.user;

   // 既存ユーザーかチェック
   const userDoc = await getDoc(doc(db, 'users', user.uid));
   
   if (userDoc.exists()) {
     // 既存ユーザー
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
async function updateLastActive(userId: string): Promise<void> {
 try {
   await updateDoc(
     doc(db, 'users', userId),
     { lastActiveAt: serverTimestamp() }
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