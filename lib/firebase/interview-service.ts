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
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, ensureOnline } from './config';
import { InterviewQuestion, InterviewPractice } from './types';
import { cleanData } from './utils';

export const interviewService = {
  // 質問を保存
  async saveQuestion(question: Omit<InterviewQuestion, 'id' | 'createdAt' | 'updatedAt'>) {
    await ensureOnline();
    const cleanedData = cleanData(question);
    
    try {
      const docRef = await addDoc(collection(db, 'interviewQuestions'), {
        ...cleanedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error: any) {
      if (error.code === 'unavailable') {
        console.warn('Saving question offline, will sync when online');
        return `offline_${Date.now()}`;
      }
      throw error;
    }
  },

  // 質問を取得
  async getQuestions(userId?: string, category?: string, limitCount: number = 50) {
    await ensureOnline();
    
    try {
      const constraints = [orderBy('createdAt', 'desc'), limit(limitCount)];
      
      if (userId) {
        constraints.unshift(where('userId', '==', userId));
      }
      if (category) {
        constraints.unshift(where('category', '==', category));
      }
      
      const q = query(collection(db, 'interviewQuestions'), ...constraints);
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as InterviewQuestion));
    } catch (error) {
      console.error('Get questions error:', error);
      return [];
    }
  },

  // 単一の質問を取得
  async getQuestion(questionId: string): Promise<InterviewQuestion | null> {
    await ensureOnline();
    
    try {
      const docRef = doc(db, 'interviewQuestions', questionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as InterviewQuestion;
      }
      return null;
    } catch (error) {
      console.error('Get question error:', error);
      return null;
    }
  },

  // 練習セッションを保存
  async savePractice(practice: Omit<InterviewPractice, 'id' | 'createdAt'>) {
    await ensureOnline();
    const cleanedData = cleanData(practice);
    
    try {
      const docRef = await addDoc(collection(db, 'interviewPractices'), {
        ...cleanedData,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error: any) {
      if (error.code === 'unavailable') {
        console.warn('Saving practice offline, will sync when online');
        return `offline_${Date.now()}`;
      }
      throw error;
    }
  },

  // 音声ファイルをアップロード
  async uploadAudio(userId: string, audioBlob: Blob): Promise<string> {
    await ensureOnline();
    
    try {
      const timestamp = Date.now();
      const filename = `interviews/${userId}/${timestamp}.webm`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, audioBlob);
      const downloadUrl = await getDownloadURL(storageRef);
      return downloadUrl;
    } catch (error: any) {
      if (error.code === 'unavailable') {
        console.warn('Cannot upload audio while offline');
        throw new Error('オフライン中は音声をアップロードできません');
      }
      throw error;
    }
  },

  // 練習履歴を取得（インデックスエラー対応版）
  async getPracticeHistory(userId: string, limitCount: number = 50) {
    await ensureOnline();
    
    try {
      // インデックスが必要なクエリを避けるため、一時的に簡略化
      // TODO: Firebaseコンソールでインデックスを作成後、以下のコメントアウトされたクエリに戻す
      /*
      const q = query(
        collection(db, 'interviewPractices'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      */
      
      // 一時的な解決策：全データを取得してクライアント側でフィルタリング
      const q = query(
        collection(db, 'interviewPractices'),
        limit(limitCount * 2) // より多くのデータを取得してフィルタリング後も十分な数を確保
      );
      
      const snapshot = await getDocs(q);
      
      // クライアント側でフィルタリングとソート
      const practices = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as InterviewPractice))
        .filter(practice => practice.userId === userId)
        .sort((a, b) => {
          // createdAtがserverTimestampの場合とDateオブジェクトの場合の両方に対応
          const getTime = (date: any) => {
            if (!date) return 0;
            if (date.toDate) return date.toDate().getTime();
            if (date instanceof Date) return date.getTime();
            return new Date(date).getTime();
          };
          
          return getTime(b.createdAt) - getTime(a.createdAt);
        })
        .slice(0, limitCount);
      
      return practices;
    } catch (error) {
      console.error('Get practice history error:', error);
      return [];
    }
  },

  // 評価を更新
  async updateEvaluation(practiceId: string, evaluation: any) {
    await ensureOnline();
    
    try {
      const practiceRef = doc(db, 'interviewPractices', practiceId);
      await updateDoc(practiceRef, {
        evaluationScore: evaluation.score,
        evaluationFeedback: cleanData(evaluation),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error('Update evaluation error:', error);
      return false;
    }
  },

  // 練習情報を更新
  async updatePractice(practiceId: string, updates: Partial<InterviewPractice>) {
    await ensureOnline();
    
    try {
      const practiceRef = doc(db, 'interviewPractices', practiceId);
      await updateDoc(practiceRef, {
        ...cleanData(updates),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error('Update practice error:', error);
      return false;
    }
  }
};