// lib/firebase/interview.ts

import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from './config';

// インターフェース定義
export interface InterviewQuestion {
  id?: string;
  userId?: string;
  question: string;
  category: 'motivation' | 'self_pr' | 'student_life' | 'future_goals' | 'current_affairs';
  difficulty: 'easy' | 'medium' | 'hard';
  keyPoints: string[];
  tags: string[];
  faculty?: string;
  isAIGenerated?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface InterviewPractice {
  id?: string;
  userId: string;
  questionId: string;
  practiceType: 'normal' | 'karaoke';
  audioUrl?: string;
  transcript?: string;
  evaluation?: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
  duration: number; // 秒
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ========== 面接質問関連 ==========

// AI生成された質問を保存（IDを含む完全な質問オブジェクトを返す）
export async function saveInterviewQuestions(questions: InterviewQuestion[]): Promise<InterviewQuestion[]> {
  console.log('=== saveInterviewQuestions START ===');
  
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('User not authenticated');
      throw new Error('ユーザーが認証されていません');
    }

    console.log(`Saving ${questions.length} questions for user: ${user.uid}`);
    const savedQuestions: InterviewQuestion[] = [];

    for (const question of questions) {
      console.log('Saving question:', question.question);
      
      const docRef = await addDoc(collection(db, 'interviewQuestions'), {
        ...question,
        userId: user.uid,
        isAIGenerated: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // 保存された質問を完全な形で記録
      const savedQuestion: InterviewQuestion = {
        ...question,
        id: docRef.id,
        userId: user.uid,
        isAIGenerated: true
      };
      
      savedQuestions.push(savedQuestion);
      console.log('Saved with ID:', docRef.id);
    }

    console.log(`${savedQuestions.length}個の質問をFirestoreに保存しました`);
    console.log('All saved questions:', savedQuestions);
    
    return savedQuestions;
  } catch (error) {
    console.error('質問の保存エラー:', error);
    throw error;
  }
}

// 単一の質問を保存
export async function saveInterviewQuestion(question: Omit<InterviewQuestion, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('ユーザーが認証されていません');

    const docRef = await addDoc(collection(db, 'interviewQuestions'), {
      ...question,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('質問の保存エラー:', error);
    throw error;
  }
}

// 質問を取得（インデックスエラーを回避）
export async function getInterviewQuestions(options?: {
  category?: string;
  difficulty?: string;
  faculty?: string;
  isAIGenerated?: boolean;
  limitCount?: number;
  includePublic?: boolean;
}): Promise<InterviewQuestion[]> {
  console.log('=== getInterviewQuestions START ===');
  console.log('Options:', options);
  
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('No authenticated user');
      throw new Error('ユーザーが認証されていません');
    }

    let constraints = [];
    const questionsRef = collection(db, 'interviewQuestions');

    // 基本的なユーザーフィルタ
    constraints.push(where('userId', '==', user.uid));

    // シンプルなクエリ構築（複合インデックスを避ける）
    if (options?.category && !options?.difficulty) {
      constraints.push(where('category', '==', options.category));
    } else if (options?.difficulty && !options?.category) {
      constraints.push(where('difficulty', '==', options.difficulty));
    } else if (options?.isAIGenerated !== undefined) {
      constraints.push(where('isAIGenerated', '==', options.isAIGenerated));
    }

    // orderByは最後に追加（ただし、複合インデックスエラーを避けるため条件付き）
    // 単一のwhereクエリの場合のみorderByを追加
    if (constraints.length <= 2) { // userIdフィルタ + 1つの条件
      constraints.push(orderBy('createdAt', 'desc'));
    }

    const q = query(questionsRef, ...constraints);
    const snapshot = await getDocs(q);

    let questions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as InterviewQuestion));

    console.log(`Retrieved ${questions.length} questions from Firestore`);

    // クライアントサイドでの追加フィルタリング
    if (options?.category && options?.difficulty) {
      // 両方の条件がある場合はクライアントサイドでフィルタ
      questions = questions.filter(q => 
        q.category === options.category && 
        q.difficulty === options.difficulty
      );
    }

    if (options?.faculty) {
      questions = questions.filter(q => q.faculty === options.faculty);
    }

    // クライアントサイドでソート（orderByが適用されていない場合）
    if (constraints.length > 2) {
      questions.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });
    }

    // 取得数制限（クライアントサイド）
    if (options?.limitCount) {
      questions = questions.slice(0, options.limitCount);
    }

    console.log(`Returning ${questions.length} questions after filtering`);
    return questions;
  } catch (error) {
    console.error('質問の取得エラー:', error);
    
    // インデックスエラーの場合は特別な処理
    if (error instanceof Error && error.message.includes('index')) {
      console.warn('Firestore index required. Falling back to simple query.');
      
      // 最もシンプルなクエリで再試行
      try {
        const user = auth.currentUser;
        if (!user) return [];
        
        const simpleQuery = query(
          collection(db, 'interviewQuestions'),
          where('userId', '==', user.uid)
        );
        
        const snapshot = await getDocs(simpleQuery);
        let questions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as InterviewQuestion));
        
        // すべてのフィルタリングをクライアントサイドで実行
        if (options?.category) {
          questions = questions.filter(q => q.category === options.category);
        }
        if (options?.difficulty) {
          questions = questions.filter(q => q.difficulty === options.difficulty);
        }
        if (options?.faculty) {
          questions = questions.filter(q => q.faculty === options.faculty);
        }
        if (options?.isAIGenerated !== undefined) {
          questions = questions.filter(q => q.isAIGenerated === options.isAIGenerated);
        }
        
        // クライアントサイドでソート
        questions.sort((a, b) => {
          const aTime = a.createdAt?.toMillis() || 0;
          const bTime = b.createdAt?.toMillis() || 0;
          return bTime - aTime;
        });
        
        if (options?.limitCount) {
          questions = questions.slice(0, options.limitCount);
        }
        
        return questions;
      } catch (retryError) {
        console.error('Simple query also failed:', retryError);
        return [];
      }
    }
    
    return [];
  }
}

// 特定の質問を取得
export async function getInterviewQuestion(questionId: string): Promise<InterviewQuestion | null> {
  console.log('=== getInterviewQuestion START ===');
  console.log('Getting question with ID:', questionId);
  
  try {
    const docRef = doc(db, 'interviewQuestions', questionId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = {
        id: docSnap.id,
        ...docSnap.data()
      } as InterviewQuestion;
      console.log('Found question:', data);
      return data;
    }
    
    console.log('No question found with ID:', questionId);
    return null;
  } catch (error) {
    console.error('質問の取得エラー:', error);
    return null;
  }
}

// 質問を更新
export async function updateInterviewQuestion(
  questionId: string,
  updates: Partial<InterviewQuestion>
): Promise<void> {
  try {
    const { id, createdAt, ...updateData } = updates;
    await updateDoc(doc(db, 'interviewQuestions', questionId), {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('質問の更新エラー:', error);
    throw error;
  }
}

// 質問を削除
export async function deleteInterviewQuestion(questionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'interviewQuestions', questionId));
  } catch (error) {
    console.error('質問の削除エラー:', error);
    throw error;
  }
}

// ========== 面接練習記録関連 ==========

// 練習記録を保存
export async function saveInterviewPractice(
  practiceData: Omit<InterviewPractice, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('ユーザーが認証されていません');

    const docRef = await addDoc(collection(db, 'interviewPractices'), {
      ...practiceData,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id;
  } catch (error) {
    console.error('練習記録の保存エラー:', error);
    throw error;
  }
}

// 練習記録を取得（インデックスエラーを回避）
export async function getInterviewPractices(options?: {
  questionId?: string;
  practiceType?: 'normal' | 'karaoke';
  limitCount?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<InterviewPractice[]> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('ユーザーが認証されていません');

    let constraints = [];
    constraints.push(where('userId', '==', user.uid));

    // シンプルなクエリ構築
    if (options?.questionId) {
      constraints.push(where('questionId', '==', options.questionId));
    } else if (options?.practiceType) {
      constraints.push(where('practiceType', '==', options.practiceType));
    }

    // 日付フィルタは複雑なのでクライアントサイドで処理
    const q = query(collection(db, 'interviewPractices'), ...constraints);
    const snapshot = await getDocs(q);

    let practices = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as InterviewPractice));

    // クライアントサイドでの追加フィルタリング
    if (options?.startDate) {
      const startTimestamp = Timestamp.fromDate(options.startDate).toMillis();
      practices = practices.filter(p => 
        (p.createdAt?.toMillis() || 0) >= startTimestamp
      );
    }
    
    if (options?.endDate) {
      const endTimestamp = Timestamp.fromDate(options.endDate).toMillis();
      practices = practices.filter(p => 
        (p.createdAt?.toMillis() || 0) <= endTimestamp
      );
    }

    // クライアントサイドでソート
    practices.sort((a, b) => {
      const aTime = a.createdAt?.toMillis() || 0;
      const bTime = b.createdAt?.toMillis() || 0;
      return bTime - aTime;
    });

    // 取得数制限
    if (options?.limitCount) {
      practices = practices.slice(0, options.limitCount);
    }

    return practices;
  } catch (error) {
    console.error('練習記録の取得エラー:', error);
    return [];
  }
}

// 特定の練習記録を取得
export async function getInterviewPractice(practiceId: string): Promise<InterviewPractice | null> {
  try {
    const docRef = doc(db, 'interviewPractices', practiceId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as InterviewPractice;
    }
    return null;
  } catch (error) {
    console.error('練習記録の取得エラー:', error);
    return null;
  }
}

// 練習記録を更新（評価追加など）
export async function updateInterviewPractice(
  practiceId: string,
  updates: Partial<InterviewPractice>
): Promise<void> {
  try {
    const { id, userId, createdAt, ...updateData } = updates;
    await updateDoc(doc(db, 'interviewPractices', practiceId), {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('練習記録の更新エラー:', error);
    throw error;
  }
}

// ========== 統計関連 ==========

// 面接練習の統計を取得
export async function getInterviewStatistics(userId?: string): Promise<{
  totalQuestions: number;
  totalPractices: number;
  practicesByCategory: { [key: string]: number };
  averageScore: number;
  recentPractices: InterviewPractice[];
}> {
  try {
    const user = auth.currentUser;
    const targetUserId = userId || user?.uid;
    if (!targetUserId) throw new Error('ユーザーIDが必要です');

    // 質問数を取得
    const questions = await getInterviewQuestions();
    const totalQuestions = questions.length;

    // 練習記録を取得
    const practices = await getInterviewPractices();
    const totalPractices = practices.length;

    // カテゴリ別の練習回数を集計
    const practicesByCategory: { [key: string]: number } = {};
    
    // 各練習記録に対応する質問情報を取得して集計
    for (const practice of practices) {
      const question = await getInterviewQuestion(practice.questionId);
      if (question) {
        const category = question.category;
        practicesByCategory[category] = (practicesByCategory[category] || 0) + 1;
      }
    }

    // 平均スコアを計算
    const scores = practices
      .filter(p => p.evaluation?.score)
      .map(p => p.evaluation!.score);
    const averageScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    // 最近の練習（最大5件）
    const recentPractices = practices.slice(0, 5);

    return {
      totalQuestions,
      totalPractices,
      practicesByCategory,
      averageScore,
      recentPractices
    };
  } catch (error) {
    console.error('統計の取得エラー:', error);
    return {
      totalQuestions: 0,
      totalPractices: 0,
      practicesByCategory: {},
      averageScore: 0,
      recentPractices: []
    };
  }
}

// カテゴリ別の質問数を取得
export async function getQuestionCountByCategory(): Promise<{ [key: string]: number }> {
  try {
    const questions = await getInterviewQuestions();
    const counts: { [key: string]: number } = {};

    questions.forEach(question => {
      counts[question.category] = (counts[question.category] || 0) + 1;
    });

    return counts;
  } catch (error) {
    console.error('カテゴリ別質問数の取得エラー:', error);
    return {};
  }
}