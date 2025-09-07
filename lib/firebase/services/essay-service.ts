// lib/firebase/services/essay-service.ts
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  FirestoreError
} from 'firebase/firestore';
import { db } from '../config';
import { ensureOnline } from '../network-manager';
import { EssayTheme, EssaySubmission } from '../types';
import { cleanData } from '../utils';

// リトライ設定
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffFactor: 2
};

// エラーハンドリングのヘルパー関数
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: { skipNetworkCheck?: boolean } = {}
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      // ネットワーク接続を確保（初回は必ず実行）
      if (!options.skipNetworkCheck || attempt === 1) {
        await ensureOnline();
      }
      
      // 操作を実行
      const result = await operation();
      
      // 成功したらリトライカウンターをリセット
      if (attempt > 1) {
        console.log(`${operationName} succeeded after ${attempt} attempts`);
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Firestoreエラーの詳細ログ
      if (error instanceof FirestoreError) {
        console.error(`Firestore error in ${operationName}:`, {
          code: error.code,
          message: error.message,
          attempt: attempt
        });
      }
      
      // インデックスエラーの場合は即座に空の結果を返す（リトライしない）
      if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
        console.warn(`Index not ready for ${operationName}, returning empty result`);
        if (operationName.includes('Themes') || operationName.includes('Submissions')) {
          return [] as T;
        }
        return null as T;
      }
      
      // Target ID already exists エラーは成功として扱う
      if (error?.message?.includes('Target ID already exists')) {
        console.log(`${operationName}: Target already exists, treating as success`);
        // 読み取り操作の場合は空の結果を返す
        if (operationName.includes('get') || operationName.includes('Get')) {
          return (operationName.includes('Themes') || operationName.includes('Submissions')) ? [] as T : null as T;
        }
        return undefined as T;
      }
      
      // INTERNAL ASSERTION FAILEDエラーの場合
      if (error?.message?.includes('INTERNAL ASSERTION FAILED')) {
        console.warn(`Firestore internal error in ${operationName}, attempt ${attempt}/${RETRY_CONFIG.maxAttempts}`);
        
        // 最後の試行でない場合はリトライ
        if (attempt < RETRY_CONFIG.maxAttempts) {
          const delay = Math.min(
            RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
            RETRY_CONFIG.maxDelay
          );
          
          console.log(`Retrying ${operationName} after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // オフラインエラーの場合
      if (error?.code === 'unavailable' || !navigator.onLine) {
        // 読み取り操作の場合は空配列を返す
        if (operationName.includes('get') || operationName.includes('Get')) {
          console.warn(`${operationName}: Offline, returning empty result`);
          return (operationName.includes('Themes') || operationName.includes('Submissions')) ? [] as T : null as T;
        }
        // 書き込み操作の場合はオフラインIDを返す
        if (operationName.includes('save') || operationName.includes('Save')) {
          console.warn(`${operationName}: Offline, returning offline ID`);
          return `offline_${Date.now()}` as T;
        }
      }
      
      // その他のエラーまたは最後の試行の場合
      if (attempt === RETRY_CONFIG.maxAttempts) {
        throw error;
      }
      
      // リトライ前に短い遅延を追加
      const delay = Math.min(
        RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt - 1),
        RETRY_CONFIG.maxDelay
      );
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error(`${operationName} failed after ${RETRY_CONFIG.maxAttempts} attempts`);
}

export const essayService = {
  // テーマを保存
  async saveTheme(theme: Omit<EssayTheme, 'id' | 'createdAt' | 'updatedAt'>) {
    return withRetry(async () => {
      const cleanedData = cleanData(theme);
      
      const docRef = await addDoc(collection(db, 'essayThemes'), {
        ...cleanedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      return docRef.id;
    }, 'saveTheme');
  },

  // テーマ一覧を取得
  async getThemes(category?: string, faculty?: string, limitCount: number = 50): Promise<EssayTheme[]> {
    return withRetry(async () => {
      try {
        const constraints = [orderBy('createdAt', 'desc'), limit(limitCount)];
        
        if (category) {
          constraints.unshift(where('category', '==', category));
        }
        if (faculty) {
          constraints.unshift(where('faculties', 'array-contains', faculty));
        }
        
        const q = query(collection(db, 'essayThemes'), ...constraints);
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as EssayTheme));
      } catch (error: any) {
        // クエリのインデックスエラーの場合（withRetryで処理されるが念のため）
        if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
          console.warn('Index not ready, returning empty array');
          return [];
        }
        throw error;
      }
    }, 'getThemes');
  },

  // テーマを取得
  async getTheme(themeId: string): Promise<EssayTheme | null> {
    return withRetry(async () => {
      const docRef = doc(db, 'essayThemes', themeId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as EssayTheme;
      }
      return null;
    }, 'getTheme');
  },

  // 下書きを保存（上書き）
  async saveDraft(submission: Omit<EssaySubmission, 'id' | 'createdAt' | 'updatedAt'>) {
    return withRetry(async () => {
      const cleanedData = cleanData(submission);
      
      // ユーザーごと、テーマごとに1つの下書きのみ保持
      const draftId = `${submission.userId}_${submission.themeId}_draft`;
      const draftRef = doc(db, 'essaySubmissions', draftId);
      
      await setDoc(draftRef, {
        ...cleanedData,
        isDraft: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      return draftId;
    }, 'saveDraft');
  },

  // 小論文を提出
  async submitEssay(submission: Omit<EssaySubmission, 'id' | 'createdAt' | 'updatedAt'>) {
    return withRetry(async () => {
      const cleanedData = cleanData(submission);
      
      // オンラインであることを確認
      if (!navigator.onLine) {
        throw new Error('オフライン中は提出できません。オンラインになってから再度お試しください。');
      }
      
      const docRef = await addDoc(collection(db, 'essaySubmissions'), {
        ...cleanedData,
        isDraft: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      // 下書きを削除（エラーは無視）
      const draftId = `${submission.userId}_${submission.themeId}_draft`;
      try {
        await deleteDoc(doc(db, 'essaySubmissions', draftId));
      } catch (error) {
        console.log('Draft deletion failed:', error);
      }
      
      return docRef.id;
    }, 'submitEssay', { skipNetworkCheck: false });
  },

  // 提出履歴を取得（インデックス不要な簡略版）
  async getSubmissions(userId: string, isDraft: boolean = false, limitCount: number = 50): Promise<EssaySubmission[]> {
    return withRetry(async () => {
      try {
        // 複合インデックスが必要なクエリを避けて、シンプルなクエリにする
        const q = query(
          collection(db, 'essaySubmissions'),
          where('userId', '==', userId),
          where('isDraft', '==', isDraft),
          limit(limitCount)
        );
        
        const snapshot = await getDocs(q);
        const submissions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as EssaySubmission));
        
        // クライアント側でソート
        return submissions.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
      } catch (error: any) {
        // クエリのインデックスエラーの場合（withRetryで処理されるが念のため）
        if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
          console.warn('Index not ready for submissions query, returning empty array');
          return [];
        }
        throw error;
      }
    }, 'getSubmissions');
  },

  // 評価を更新
  async updateEvaluation(submissionId: string, evaluation: any): Promise<boolean> {
    return withRetry(async () => {
      const submissionRef = doc(db, 'essaySubmissions', submissionId);
      await updateDoc(submissionRef, {
        evaluationScore: evaluation.score,
        evaluationDetails: cleanData(evaluation),
        updatedAt: serverTimestamp(),
      });
      return true;
    }, 'updateEvaluation');
  },

  async getSubmission(submissionId: string): Promise<any | null> {
    try {
      const docRef = doc(db, 'essaySubmissions', submissionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting submission:', error);
      throw error;
    }
  }
};

// Additional helper functions
async function getEvaluation(evaluationId: string): Promise<any | null> {
    try {
      const docRef = doc(db, 'essayEvaluations', evaluationId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting evaluation:', error);
      throw error;
    }
  }

async function saveEvaluation(evaluation: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'essayEvaluations'), {
        ...evaluation,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving evaluation:', error);
      throw error;
    }
  }

async function updateSubmission(submissionId: string, data: any): Promise<void> {
    try {
      const docRef = doc(db, 'essaySubmissions', submissionId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating submission:', error);
      throw error;
    }
};
