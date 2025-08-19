import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db, ensureOnline } from '../config';
import { EssayTheme, EssaySubmission } from '../schema';

export const essayService = {
  // テーマを保存
  async saveTheme(theme: Omit<EssayTheme, 'id' | 'createdAt' | 'updatedAt'>) {
    await ensureOnline();
    const docRef = await addDoc(collection(db, 'essayThemes'), {
      ...theme,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  // テーマ一覧を取得
  async getThemes(category?: string, faculty?: string) {
    await ensureOnline();
    let q = query(collection(db, 'essayThemes'));
    
    const conditions = [];
    if (category) {
      conditions.push(where('category', '==', category));
    }
    if (faculty) {
      conditions.push(where('faculties', 'array-contains', faculty));
    }
    
    if (conditions.length > 0) {
      q = query(collection(db, 'essayThemes'), ...conditions, orderBy('createdAt', 'desc'));
    } else {
      q = query(collection(db, 'essayThemes'), orderBy('createdAt', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    } as EssayTheme));
  },

  // テーマを取得
  async getTheme(themeId: string): Promise<EssayTheme | null> {
    await ensureOnline();
    const docRef = doc(db, 'essayThemes', themeId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate(),
      updatedAt: docSnap.data().updatedAt?.toDate(),
    } as EssayTheme;
  },

  // 下書きを保存（上書き）
  async saveDraft(submission: Omit<EssaySubmission, 'id' | 'createdAt' | 'updatedAt'>) {
    await ensureOnline();
    // ユーザーごと、テーマごとに1つの下書きのみ保持
    const draftId = `${submission.userId}_${submission.themeId}_draft`;
    const draftRef = doc(db, 'essaySubmissions', draftId);
    
    await setDoc(draftRef, {
      ...submission,
      isDraft: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    return draftId;
  },

  // 小論文を提出
  async submitEssay(submission: Omit<EssaySubmission, 'id' | 'createdAt' | 'updatedAt'>) {
    await ensureOnline();
    const docRef = await addDoc(collection(db, 'essaySubmissions'), {
      ...submission,
      isDraft: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // 下書きを削除
    const draftId = `${submission.userId}_${submission.themeId}_draft`;
    try {
      await deleteDoc(doc(db, 'essaySubmissions', draftId));
    } catch (error) {
      console.log('Draft deletion failed:', error);
    }
    
    return docRef.id;
  },

  // 提出履歴を取得
  async getSubmissions(userId: string, isDraft: boolean = false) {
    await ensureOnline();
    const q = query(
      collection(db, 'essaySubmissions'),
      where('userId', '==', userId),
      where('isDraft', '==', isDraft),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    } as EssaySubmission));
  },

  // 評価を更新
  async updateEvaluation(submissionId: string, evaluation: any) {
    await ensureOnline();
    const submissionRef = doc(db, 'essaySubmissions', submissionId);
    await updateDoc(submissionRef, {
      evaluationScore: evaluation.score,
      evaluationDetails: evaluation,
      updatedAt: serverTimestamp(),
    });
  }
};