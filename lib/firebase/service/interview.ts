import { 
  collection, 
  doc, 
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  FirebaseError
} from 'firebase/firestore';
import { db } from './config';
import { InterviewQuestion } from './schema';
import { auth } from './config';

// 質問IDを生成する関数
function generateQuestionId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 面接質問を保存する関数（修正版）
export async function saveInterviewQuestions(questions: Partial<InterviewQuestion>[]): Promise<InterviewQuestion[]> {
  console.log('=== saveInterviewQuestions START ===');
  
  const user = auth.currentUser;
  if (!user) {
    throw new Error('ユーザーがログインしていません');
  }

  console.log(`Saving ${questions.length} questions for user:`, user.uid);
  
  const savedQuestions: InterviewQuestion[] = [];
  
  for (const question of questions) {
    console.log('Saving question:', question.question);
    
    try {
      let questionId: string;
      let docRef;
      
      if (question.id && !question.id.startsWith('demo-') && !question.id.startsWith('ai-')) {
        // 既存のIDがある場合（デモやAI生成ではない）
        questionId = question.id;
        docRef = doc(db, 'interviewQuestions', questionId);
        
        // merge: true オプションを使用して既存のドキュメントを更新
        await setDoc(docRef, {
          ...question,
          userId: user.uid,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        
      } else {
        // 新規作成の場合（addDocを使用）
        const docData = {
          ...question,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        
        // id フィールドを削除（Firestoreが自動生成するため）
        delete docData.id;
        
        docRef = await addDoc(collection(db, 'interviewQuestions'), docData);
        questionId = docRef.id;
      }
      
      const savedQuestion: InterviewQuestion = {
        ...question,
        id: questionId,
        userId: user.uid,
        createdAt: question.createdAt || new Date(),
        updatedAt: new Date(),
      } as InterviewQuestion;
      
      savedQuestions.push(savedQuestion);
      console.log('Question saved with ID:', questionId);
      
    } catch (error) {
      console.error('質問の保存エラー:', error);
      
      if (error instanceof FirebaseError) {
        // Firebase特有のエラーハンドリング
        if (error.code === 'already-exists') {
          console.log('Document already exists, trying with a new ID');
          // 新しいIDで再試行
          const newDocRef = await addDoc(collection(db, 'interviewQuestions'), {
            ...question,
            userId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          
          const savedQuestion: InterviewQuestion = {
            ...question,
            id: newDocRef.id,
            userId: user.uid,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as InterviewQuestion;
          
          savedQuestions.push(savedQuestion);
          console.log('Question saved with new ID:', newDocRef.id);
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  }
  
  console.log(`Successfully saved ${savedQuestions.length} questions`);
  console.log('=== saveInterviewQuestions END ===');
  
  return savedQuestions;
}

// 面接質問を取得する関数
export async function getInterviewQuestions(options?: {
  category?: string;
  difficulty?: string;
  limit?: number;
}): Promise<InterviewQuestion[]> {
  console.log('=== getInterviewQuestions START ===');
  console.log('Options:', options);
  
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('User not logged in, returning empty array');
      return [];
    }

    // クエリの構築
    const constraints = [
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    ];

    if (options?.category) {
      constraints.push(where('category', '==', options.category));
    }

    if (options?.difficulty) {
      constraints.push(where('difficulty', '==', options.difficulty));
    }

    // Firestoreクエリ実行
    const q = query(collection(db, 'interviewQuestions'), ...constraints);
    const querySnapshot = await getDocs(q);
    
    console.log(`Retrieved ${querySnapshot.size} questions from Firestore`);
    
    const questions: InterviewQuestion[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      questions.push({
        id: doc.id,
        question: data.question,
        category: data.category,
        difficulty: data.difficulty,
        keyPoints: data.keyPoints || [],
        tags: data.tags || [],
        userId: data.userId,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        currentAffairsTopic: data.currentAffairsTopic || null,
      } as InterviewQuestion);
    });
    
    // limit適用
    if (options?.limit && questions.length > options.limit) {
      questions.splice(options.limit);
    }
    
    console.log(`Returning ${questions.length} questions after filtering`);
    return questions;
    
  } catch (error) {
    console.error('Error getting interview questions:', error);
    throw error;
  }
}

// 単一の質問を取得する関数
export async function getInterviewQuestion(questionId: string): Promise<InterviewQuestion | null> {
  console.log('=== getInterviewQuestion START ===');
  console.log('Question ID:', questionId);
  
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('User not logged in');
      return null;
    }

    // 特定の質問を取得
    const q = query(
      collection(db, 'interviewQuestions'),
      where('__name__', '==', questionId),
      where('userId', '==', user.uid)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('Question not found');
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    const question: InterviewQuestion = {
      id: doc.id,
      question: data.question,
      category: data.category,
      difficulty: data.difficulty,
      keyPoints: data.keyPoints || [],
      tags: data.tags || [],
      userId: data.userId,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      currentAffairsTopic: data.currentAffairsTopic || null,
    };
    
    console.log('Question found:', question.question);
    return question;
    
  } catch (error) {
    console.error('Error getting interview question:', error);
    throw error;
  }
}

// 質問を削除する関数（オプション）
export async function deleteInterviewQuestion(questionId: string): Promise<void> {
  console.log('=== deleteInterviewQuestion START ===');
  
  const user = auth.currentUser;
  if (!user) {
    throw new Error('ユーザーがログインしていません');
  }
  
  try {
    // 質問の所有権を確認
    const question = await getInterviewQuestion(questionId);
    if (!question) {
      throw new Error('質問が見つかりません');
    }
    
    if (question.userId !== user.uid) {
      throw new Error('この質問を削除する権限がありません');
    }
    
    // 削除実行
    const docRef = doc(db, 'interviewQuestions', questionId);
    await deleteDoc(docRef);
    
    console.log('Question deleted successfully:', questionId);
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
}