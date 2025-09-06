// lib/firebase/firestore.ts - 拡張版（問題関連の関数のみ）

// 注意: このファイルは既存のファイルからの抜粋です。
// 実際の実装では、以下の関数を既存のfirestore.tsファイルに追加してください。

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  addDoc,
  serverTimestamp,
  onSnapshot,
  increment,
  arrayUnion,
  deleteDoc,
  writeBatch,
  FieldValue
} from 'firebase/firestore'
import { db, auth } from './config'

// ========== 拡張された問題型定義 ==========
export interface ExtendedProblem extends Problem {
  // 既存のフィールドに加えて
  generationParameters?: any; // ExtendedParameters from gemini.ts
  validationResults?: any; // ValidationChecks from gemini.ts
  educationalMetadata?: {
    bloomsTaxonomyLevel: string[];
    prerequisiteTopics: string[];
    estimatedSolvingTime: number;
    cognitiveLoad: 'low' | 'medium' | 'high';
  };
  generationHistory?: Array<{
    timestamp: Timestamp;
    parameters: any;
    version: number;
  }>;
}

// ========== 問題関連（拡張版） ==========

// 問題を保存（拡張版）
export async function saveProblem(
  problemData: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>, 
  userId: string,
  extendedData?: {
    generationParameters?: any;
    validationResults?: any;
    educationalMetadata?: any;
  }
): Promise<string> {
  try {
    const saveData: any = {
      ...problemData,
      userId,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: problemData.status || 'draft',
      isPublic: problemData.isPublic || false
    };
    
    // 拡張データを含める
    if (extendedData) {
      if (extendedData.generationParameters) {
        saveData.generationParameters = extendedData.generationParameters;
      }
      if (extendedData.validationResults) {
        saveData.validationResults = extendedData.validationResults;
      }
      if (extendedData.educationalMetadata) {
        saveData.educationalMetadata = extendedData.educationalMetadata;
      }
      
      // 生成履歴の初期化
      saveData.generationHistory = [{
        timestamp: serverTimestamp(),
        parameters: extendedData.generationParameters,
        version: 1
      }];
    }
    
    const docRef = await addDoc(collection(db, 'problems'), saveData);
    
    // ユーザーの問題作成履歴を更新
    await updateUserProblemStats(userId);
    
    return docRef.id;
  } catch (error) {
    console.error('Error saving problem:', error);
    throw error;
  }
}

// 問題を再生成して更新
export async function regenerateProblem(
  problemId: string,
  regenerationOptions: {
    keepStructure: boolean;
    adjustDifficulty?: 'easier' | 'harder';
    emphasizeConcepts?: string[];
    refinementPrompt?: string;
    newParameters?: any;
  }
): Promise<void> {
  try {
    const problemDoc = await getDoc(doc(db, 'problems', problemId));
    if (!problemDoc.exists()) {
      throw new Error('Problem not found');
    }
    
    const currentData = problemDoc.data();
    const currentHistory = currentData.generationHistory || [];
    const newVersion = currentHistory.length + 1;
    
    // 新しい生成パラメータをマージ
    const newGenerationParameters = {
      ...(currentData.generationParameters || {}),
      ...(regenerationOptions.newParameters || {}),
      regenerationOptions: {
        keepStructure: regenerationOptions.keepStructure,
        adjustDifficulty: regenerationOptions.adjustDifficulty,
        emphasizeConcepts: regenerationOptions.emphasizeConcepts,
        refinementPrompt: regenerationOptions.refinementPrompt
      }
    };
    
    // 履歴に追加
    const updatedHistory = [
      ...currentHistory,
      {
        timestamp: serverTimestamp(),
        parameters: newGenerationParameters,
        version: newVersion
      }
    ];
    
    await updateDoc(doc(db, 'problems', problemId), {
      generationParameters: newGenerationParameters,
      generationHistory: updatedHistory,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error regenerating problem:', error);
    throw error;
  }
}

// 問題テンプレートを保存
export async function saveProblemTemplate(
  template: {
    name: string;
    description: string;
    category: 'commonTest' | 'university' | 'custom';
    parameters: any; // ExtendedParameters
    tags: string[];
    isPublic: boolean;
  },
  userId: string
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'problemTemplates'), {
      ...template,
      createdBy: userId,
      usageCount: 0,
      averageRating: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error saving problem template:', error);
    throw error;
  }
}

// 問題テンプレートを取得
export async function getProblemTemplates(options?: {
  category?: 'commonTest' | 'university' | 'custom';
  isPublic?: boolean;
  userId?: string;
  limitCount?: number;
}): Promise<any[]> {
  try {
    const constraints = [];
    
    if (options?.category) {
      constraints.push(where('category', '==', options.category));
    }
    
    if (options?.isPublic !== undefined) {
      constraints.push(where('isPublic', '==', options.isPublic));
    }
    
    if (options?.userId) {
      constraints.push(where('createdBy', '==', options.userId));
    }
    
    constraints.push(orderBy('usageCount', 'desc'));
    
    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }
    
    const q = query(collection(db, 'problemTemplates'), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting problem templates:', error);
    return [];
  }
}

// テンプレート使用回数を更新
export async function incrementTemplateUsage(templateId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'problemTemplates', templateId), {
      usageCount: increment(1),
      lastUsedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error incrementing template usage:', error);
  }
}

// 問題の教育的分析を取得
export async function analyzeProblemEducationalValue(
  problemId: string
): Promise<{
  bloomsLevels: string[];
  skillsCovered: string[];
  estimatedDifficulty: 'easy' | 'medium' | 'hard';
  cognitiveLoad: 'low' | 'medium' | 'high';
  prerequisites: string[];
}> {
  try {
    const problemDoc = await getDoc(doc(db, 'problems', problemId));
    if (!problemDoc.exists()) {
      throw new Error('Problem not found');
    }
    
    const data = problemDoc.data();
    const metadata = data.educationalMetadata;
    
    if (metadata) {
      return {
        bloomsLevels: metadata.bloomsTaxonomyLevel || [],
        skillsCovered: data.generationParameters?.educationalObjective?.targetSkills || [],
        estimatedDifficulty: data.difficulty,
        cognitiveLoad: metadata.cognitiveLoad || 'medium',
        prerequisites: metadata.prerequisiteTopics || []
      };
    }
    
    // デフォルト値を返す
    return {
      bloomsLevels: ['記憶', '理解'],
      skillsCovered: [],
      estimatedDifficulty: data.difficulty || 'medium',
      cognitiveLoad: 'medium',
      prerequisites: []
    };
  } catch (error) {
    console.error('Error analyzing problem educational value:', error);
    throw error;
  }
}

// 問題の使用統計を更新
export async function updateProblemUsageStats(
  problemId: string,
  usageData: {
    timeSpent: number;
    isCorrect: boolean;
    hintsUsed: number;
  }
): Promise<void> {
  try {
    const problemRef = doc(db, 'problems', problemId);
    const problemDoc = await getDoc(problemRef);
    
    if (!problemDoc.exists()) {
      throw new Error('Problem not found');
    }
    
    const currentData = problemDoc.data();
    const currentCount = currentData.usageCount || 0;
    const currentTotalTime = (currentData.avgTimeSpent || 0) * currentCount;
    const currentCorrectCount = (currentData.avgCorrectRate || 0) * currentCount / 100;
    
    const newCount = currentCount + 1;
    const newAvgTime = (currentTotalTime + usageData.timeSpent) / newCount;
    const newCorrectRate = ((currentCorrectCount + (usageData.isCorrect ? 1 : 0)) / newCount) * 100;
    
    await updateDoc(problemRef, {
      usageCount: newCount,
      avgTimeSpent: newAvgTime,
      avgCorrectRate: newCorrectRate,
      lastUsedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating problem usage stats:', error);
  }
}

// 類似問題を検索
export async function findSimilarProblems(
  problemId: string,
  options?: {
    limitCount?: number;
    sameSubject?: boolean;
    sameDifficulty?: boolean;
  }
): Promise<Problem[]> {
  try {
    const problemDoc = await getDoc(doc(db, 'problems', problemId));
    if (!problemDoc.exists()) {
      throw new Error('Problem not found');
    }
    
    const problemData = problemDoc.data();
    const constraints = [];
    
    // 同じ科目
    if (options?.sameSubject !== false) {
      constraints.push(where('subject', '==', problemData.subject));
    }
    
    // 同じ難易度
    if (options?.sameDifficulty) {
      constraints.push(where('difficulty', '==', problemData.difficulty));
    }
    
    // 同じトピック
    constraints.push(where('topic', '==', problemData.topic));
    
    // 自分自身を除外
    constraints.push(where('__name__', '!=', problemId));
    
    constraints.push(orderBy('__name__'));
    constraints.push(orderBy('avgCorrectRate', 'desc'));
    
    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }
    
    const q = query(collection(db, 'problems'), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Problem));
  } catch (error) {
    console.error('Error finding similar problems:', error);
    return [];
  }
}

// ユーザーの問題作成統計を更新
async function updateUserProblemStats(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      'stats.totalProblemsCreated': increment(1),
      'stats.lastProblemCreatedAt': serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating user problem stats:', error)
  }
}