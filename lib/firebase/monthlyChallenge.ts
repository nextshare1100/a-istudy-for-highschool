import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit,
  arrayUnion
} from 'firebase/firestore';
import { db } from './config';
import { MonthlyChallenge, MonthlyChallengeStatus } from '@/types/challenge';
import { getProblems } from './firestore';

// 学年に応じた全教科を取得（共通関数）
function getAllSubjectsForGrade(grade: number): string[] {
  const gradeSubjects = {
    1: [
      '数学I', '数学A',
      '英語（リーディング）',
      '物理基礎', '化学基礎',
      '現代文', '古文', '漢文',
      '世界史A', '世界史B', '日本史A', '日本史B', '地理A', '地理B',
      '現代社会', '倫理', '政治・経済'
    ],
    2: [
      '数学I', '数学A', '数学II', '数学B',
      '英語（リーディング）',
      '物理', '化学', '生物', '地学',
      '物理基礎', '化学基礎', '生物基礎', '地学基礎',
      '現代文', '古文', '漢文',
      '世界史B', '日本史B', '地理B',
      '倫理', '政治・経済'
    ],
    3: [
      '数学I', '数学A', '数学II', '数学B', '数学III', '数学C',
      '英語（リーディング）', '英語（リスニング）',
      '物理', '化学', '生物', '地学',
      '現代文', '古文', '漢文',
      '世界史B', '日本史B', '地理B',
      '倫理', '政治・経済', '倫理、政治・経済'
    ]
  }
  
  return gradeSubjects[grade as keyof typeof gradeSubjects] || gradeSubjects[2];
}

// 月間チャレンジIDを生成
function generateMonthlyChallengeId(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `monthly-${year}-${month}`;
}

// 月間チャレンジを取得または生成
export async function getMonthlyChallenge(gradeLevel: number, subjects: string[]): Promise<MonthlyChallenge | null> {
  try {
    const challengeId = generateMonthlyChallengeId();
    const challengeRef = doc(db, 'monthlyChallenges', challengeId);
    const challengeSnap = await getDoc(challengeRef);

    if (challengeSnap.exists()) {
      return { id: challengeSnap.id, ...challengeSnap.data() } as MonthlyChallenge;
    }

    // チャレンジが存在しない場合は生成
    return await generateMonthlyChallenge(gradeLevel, subjects);
  } catch (error) {
    console.error('Error getting monthly challenge:', error);
    return null;
  }
}

// 月間チャレンジを生成
async function generateMonthlyChallenge(gradeLevel: number, userSubjects: string[]): Promise<MonthlyChallenge | null> {
  try {
    // 科目が設定されていない場合は全教科を使用
    const effectiveSubjects = userSubjects.length > 0 ? userSubjects : getAllSubjectsForGrade(gradeLevel);
    
    console.log(`Generating monthly challenge with ${effectiveSubjects.length} subjects for grade ${gradeLevel}`);

    // 月間チャレンジのマイルストーン（新しい形式）
    const milestones = [
      { name: 'ブロンズ', problems: 90, xpBonus: 100 },
      { name: 'シルバー', problems: 180, xpBonus: 250 },
      { name: 'ゴールド', problems: 270, xpBonus: 500 },
      { name: 'プラチナ', problems: 300, xpBonus: 1000 }
    ];

    // 月の開始日と終了日
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const challengeId = generateMonthlyChallengeId();

    const monthlyChallenge: Omit<MonthlyChallenge, 'id'> = {
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      gradeLevel,
      subjects: effectiveSubjects,
      milestones,
      createdAt: serverTimestamp() as Timestamp
    };

    await setDoc(doc(db, 'monthlyChallenges', challengeId), monthlyChallenge);

    return {
      id: challengeId,
      ...monthlyChallenge
    };
  } catch (error) {
    console.error('Error generating monthly challenge:', error);
    return null;
  }
}

// 月間チャレンジのステータスを取得
export async function getMonthlyChallengeStatus(
  userId: string,
  challengeId: string
): Promise<MonthlyChallengeStatus | null> {
  try {
    const statusRef = doc(db, 'users', userId, 'monthlyChallengeStatus', challengeId);
    const statusSnap = await getDoc(statusRef);

    if (statusSnap.exists()) {
      return statusSnap.data() as MonthlyChallengeStatus;
    }

    // 初期ステータスを作成
    const initialStatus: MonthlyChallengeStatus = {
      userId,
      challengeId,
      totalQuestions: 0,
      dailyProgress: {},
      currentMilestone: 'none',
      achievedMilestones: [],
      lastCompletedAt: null,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };

    await setDoc(statusRef, initialStatus);
    return initialStatus;
  } catch (error) {
    console.error('Error getting monthly challenge status:', error);
    return null;
  }
}

// 月間進捗を更新
export async function updateMonthlyProgress(
  userId: string,
  challengeId: string,
  questionsCompleted: number
): Promise<{ currentMilestone: string; newlyAchieved: string[] }> {
  try {
    const statusRef = doc(db, 'users', userId, 'monthlyChallengeStatus', challengeId);
    const challengeRef = doc(db, 'monthlyChallenges', challengeId);
    
    const [statusDoc, challengeDoc] = await Promise.all([
      getDoc(statusRef),
      getDoc(challengeRef)
    ]);
    
    if (!statusDoc.exists() || !challengeDoc.exists()) {
      throw new Error('Status or challenge not found');
    }
    
    const status = statusDoc.data() as MonthlyChallengeStatus;
    const challenge = challengeDoc.data() as MonthlyChallenge;
    
    // 今日の日付
    const today = new Date().toISOString().split('T')[0];
    
    // 今日の進捗を更新
    const dailyProgress = {
      ...status.dailyProgress,
      [today]: (status.dailyProgress[today] || 0) + questionsCompleted
    };
    
    // 合計問題数を計算
    const totalQuestions = Object.values(dailyProgress).reduce((sum, count) => sum + count, 0);
    
    // 現在のマイルストーンを判定
    let currentMilestone = 'none';
    const newlyAchievedMilestones: string[] = [];
    
    // milestonesが配列かオブジェクトかをチェック
    if (Array.isArray(challenge.milestones)) {
      // 新しい形式（配列）
      for (const milestone of challenge.milestones) {
        if (totalQuestions >= milestone.problems) {
          currentMilestone = milestone.name;
          if (!status.achievedMilestones.includes(milestone.name)) {
            newlyAchievedMilestones.push(milestone.name);
          }
        }
      }
    } else if (challenge.milestones) {
      // 古い形式（オブジェクト）
      const oldMilestones = [
        { name: 'bronze', problems: challenge.milestones.bronze },
        { name: 'silver', problems: challenge.milestones.silver },
        { name: 'gold', problems: challenge.milestones.gold },
        { name: 'platinum', problems: challenge.milestones.platinum }
      ];
      
      for (const milestone of oldMilestones) {
        if (totalQuestions >= milestone.problems) {
          currentMilestone = milestone.name;
          if (!status.achievedMilestones.includes(milestone.name)) {
            newlyAchievedMilestones.push(milestone.name);
          }
        }
      }
    }
    
    // ステータスを更新
    await updateDoc(statusRef, {
      totalQuestions,
      dailyProgress,
      currentMilestone,
      achievedMilestones: arrayUnion(...newlyAchievedMilestones),
      lastCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // 新しくマイルストーンを達成した場合はXPを付与
    if (newlyAchievedMilestones.length > 0) {
      await handleMilestoneAchievement(userId, challengeId, newlyAchievedMilestones);
    }
    
    return { currentMilestone, newlyAchieved: newlyAchievedMilestones };
  } catch (error) {
    console.error('Error updating monthly progress:', error);
    throw error;
  }
}

// マイルストーン達成時の処理
async function handleMilestoneAchievement(
  userId: string,
  challengeId: string,
  achievedMilestones: string[]
): Promise<void> {
  try {
    const challengeDoc = await getDoc(doc(db, 'monthlyChallenges', challengeId));
    if (!challengeDoc.exists()) return;
    
    const challenge = challengeDoc.data() as MonthlyChallenge;
    
    // XPを計算
    let totalXp = 0;
    
    if (Array.isArray(challenge.milestones)) {
      // 新しい形式（配列）
      for (const milestoneName of achievedMilestones) {
        const milestone = challenge.milestones.find(m => m.name === milestoneName);
        if (milestone) {
          totalXp += milestone.xpBonus;
        }
      }
    } else if (challenge.milestones) {
      // 古い形式（オブジェクト）
      const xpMap = {
        bronze: 100,
        silver: 250,
        gold: 500,
        platinum: 1000
      };
      
      for (const milestoneName of achievedMilestones) {
        totalXp += xpMap[milestoneName as keyof typeof xpMap] || 0;
      }
    }
    
    // XPを付与
    if (totalXp > 0) {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const currentXp = userDoc.data()?.experience || 0;
      
      await updateDoc(userRef, {
        experience: currentXp + totalXp,
        lastUpdated: serverTimestamp()
      });
      
      console.log(`Milestone XP granted: ${totalXp} for achieving ${achievedMilestones.join(', ')}`);
    }
  } catch (error) {
    console.error('Error handling milestone achievement:', error);
  }
}

// 月間進捗サマリーを取得
export async function getMonthlyProgressSummary(userId: string): Promise<{
  challenge: MonthlyChallenge;
  status: MonthlyChallengeStatus;
  currentMilestone: string;
  nextMilestone: { name: string; questionsNeeded: number; xpBonus: number } | null;
  questionsToday: number;
} | null> {
  try {
    // ユーザープロファイルを取得
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      console.error('User not found');
      return null;
    }
    
    const userData = userDoc.data();
    const gradeLevel = userData?.grade === 'high1' ? 1 : userData?.grade === 'high2' ? 2 : 3;
    
    // 科目の判定
    let subjects = userData?.subjects || [];
    
    // 科目が設定されていない場合は全教科を使用
    if (!subjects || subjects.length === 0) {
      subjects = getAllSubjectsForGrade(gradeLevel);
      console.log(`No subjects set, using all ${subjects.length} subjects for grade ${gradeLevel}`);
    }

    const challenge = await getMonthlyChallenge(gradeLevel, subjects);
    if (!challenge) return null;

    const status = await getMonthlyChallengeStatus(userId, challenge.id);
    if (!status) return null;

    // 今日の問題数
    const today = new Date().toISOString().split('T')[0];
    const questionsToday = status.dailyProgress?.[today] || 0;

    // 現在のマイルストーン
    let currentMilestone = 'none';
    const currentQuestions = status.totalQuestions;
    
    // milestonesが配列かオブジェクトかをチェック
    if (Array.isArray(challenge.milestones)) {
      // 新しい形式（配列）
      for (const milestone of challenge.milestones) {
        if (currentQuestions >= milestone.problems) {
          currentMilestone = milestone.name;
        }
      }
    } else if (challenge.milestones) {
      // 古い形式（オブジェクト）
      if (currentQuestions >= challenge.milestones.platinum) currentMilestone = 'platinum';
      else if (currentQuestions >= challenge.milestones.gold) currentMilestone = 'gold';
      else if (currentQuestions >= challenge.milestones.silver) currentMilestone = 'silver';
      else if (currentQuestions >= challenge.milestones.bronze) currentMilestone = 'bronze';
    }

    // 次のマイルストーン
    let nextMilestone = null;
    
    if (Array.isArray(challenge.milestones)) {
      // 新しい形式（配列）
      for (const milestone of challenge.milestones) {
        if (currentQuestions < milestone.problems) {
          nextMilestone = {
            name: milestone.name,
            questionsNeeded: milestone.problems - currentQuestions,
            xpBonus: milestone.xpBonus
          };
          break;
        }
      }
    } else if (challenge.milestones) {
      // 古い形式（オブジェクト）
      const oldMilestones = [
        { name: 'ブロンズ', problems: challenge.milestones.bronze, xpBonus: 100 },
        { name: 'シルバー', problems: challenge.milestones.silver, xpBonus: 250 },
        { name: 'ゴールド', problems: challenge.milestones.gold, xpBonus: 500 },
        { name: 'プラチナ', problems: challenge.milestones.platinum, xpBonus: 1000 }
      ];
      
      for (const milestone of oldMilestones) {
        if (currentQuestions < milestone.problems) {
          nextMilestone = {
            name: milestone.name,
            questionsNeeded: milestone.problems - currentQuestions,
            xpBonus: milestone.xpBonus
          };
          break;
        }
      }
    }

    return {
      challenge,
      status,
      currentMilestone,
      nextMilestone,
      questionsToday
    };
  } catch (error) {
    console.error('Error getting monthly progress summary:', error);
    return null;
  }
}

// 月間セッションを開始（シンプル版）
export async function startMonthlySession(
  userId: string,
  challengeId: string
): Promise<void> {
  // 月間チャレンジではセッション管理を省略
  console.log('Monthly session started for challenge:', challengeId);
}

// 月間セッションを完了
export async function completeMonthlySession(
  userId: string,
  challengeId: string,
  problemIds: string[],
  score: number,
  timeSpent: number
): Promise<{ currentMilestone: string; xpEarned: number; newAchievement?: string }> {
  try {
    const challengeDoc = await getDoc(doc(db, 'monthlyChallenges', challengeId));
    if (!challengeDoc.exists()) {
      throw new Error('Challenge not found');
    }
    
    const challenge = challengeDoc.data() as MonthlyChallenge;
    
    // 進捗を更新
    const { currentMilestone, newlyAchieved } = await updateMonthlyProgress(
      userId,
      challengeId,
      problemIds.length
    );
    
    // XP計算
    let xpEarned = score * 5; // 正解数 × 5
    let newAchievement: string | undefined;
    
    // 新しいマイルストーン達成時のボーナス
    if (newlyAchieved.length > 0) {
      newAchievement = newlyAchieved[newlyAchieved.length - 1];
      
      if (Array.isArray(challenge.milestones)) {
        // 新しい形式（配列）
        const milestone = challenge.milestones.find(m => m.name === newAchievement);
        if (milestone) {
          xpEarned += milestone.xpBonus;
        }
      } else {
        // 古い形式（オブジェクト）
        const xpMap = {
          bronze: 100,
          silver: 250,
          gold: 500,
          platinum: 1000
        };
        xpEarned += xpMap[newAchievement as keyof typeof xpMap] || 0;
      }
    }
    
    // XPを付与（マイルストーン達成分は既に付与済みなので、問題解答分のみ）
    if (score > 0) {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const currentXp = userDoc.data()?.experience || 0;
      
      await updateDoc(userRef, {
        experience: currentXp + (score * 5),
        lastUpdated: serverTimestamp()
      });
    }
    
    return { currentMilestone, xpEarned, newAchievement };
  } catch (error) {
    console.error('Error completing monthly session:', error);
    throw error;
  }
}