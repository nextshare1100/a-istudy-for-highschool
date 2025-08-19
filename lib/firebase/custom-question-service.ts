// lib/firebase/custom-question-service.ts
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';

export interface CustomQuestion {
  id: string;
  userId: string;
  question: string;
  answer: string;
  duration: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateCustomQuestionData {
  question: string;
  answer: string;
  duration: number;
}

class CustomQuestionService {
  private collectionName = 'customQuestions';

  // カスタム質問を作成
  async createQuestion(userId: string, data: CreateCustomQuestionData): Promise<string> {
    try {
      const docRef = doc(collection(db, this.collectionName));
      const questionData = {
        ...data,
        id: docRef.id,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(docRef, questionData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating custom question:', error);
      throw error;
    }
  }

  // カスタム質問を更新
  async updateQuestion(questionId: string, data: Partial<CreateCustomQuestionData>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, questionId);
      await setDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (error) {
      console.error('Error updating custom question:', error);
      throw error;
    }
  }

  // ユーザーのカスタム質問一覧を取得
  async getUserQuestions(userId: string): Promise<CustomQuestion[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      } as CustomQuestion));
    } catch (error) {
      console.error('Error fetching user questions:', error);
      throw error;
    }
  }

  // 特定のカスタム質問を取得
  async getQuestion(questionId: string): Promise<CustomQuestion | null> {
    try {
      const docRef = doc(db, this.collectionName, questionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          ...docSnap.data(),
          id: docSnap.id,
        } as CustomQuestion;
      }
      return null;
    } catch (error) {
      console.error('Error fetching question:', error);
      throw error;
    }
  }

  // カスタム質問を削除
  async deleteQuestion(questionId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, questionId));
    } catch (error) {
      console.error('Error deleting custom question:', error);
      throw error;
    }
  }

  // 固定質問の回答を保存/更新
  async saveFixedQuestionAnswer(userId: string, questionId: string, answer: string): Promise<void> {
    try {
      const docRef = doc(db, 'fixedQuestionAnswers', `${userId}_${questionId}`);
      await setDoc(docRef, {
        userId,
        questionId,
        answer,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error saving fixed question answer:', error);
      throw error;
    }
  }

  // 固定質問の回答を取得
  async getFixedQuestionAnswers(userId: string): Promise<{ [key: string]: string }> {
    try {
      const q = query(
        collection(db, 'fixedQuestionAnswers'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const answers: { [key: string]: string } = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        answers[data.questionId] = data.answer;
      });
      
      return answers;
    } catch (error) {
      console.error('Error fetching fixed question answers:', error);
      throw error;
    }
  }
}

export const customQuestionService = new CustomQuestionService();