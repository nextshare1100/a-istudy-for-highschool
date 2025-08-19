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
import { WeeklyChallenge, WeeklyChallengeStatus } from '@/types/challenge';

// dailyChallenge.tsから必要な関数をインポート
import { getAvailableUnits } from './dailyChallenge';

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

// 週の開始日（月曜日）を取得
function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 月曜日に調整
  return new Date(d.setDate(diff));
}

// 週の終了日（日曜日）を取得
function getWeekEnd(date: Date = new Date()): Date {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return weekEnd;
}

// 週間チャレンジIDを生成
function generateWeeklyChallengeId(date: Date = new Date()): string {
  const weekStart = getWeekStart(date);
  const year = weekStart.getFullYear();
  const month = String(weekStart.getMonth() + 1).padStart(2, '0');
  const day = String(weekStart.getDate()).padStart(2, '0');
  return `weekly-${year}-${month}-${day}`;
}

// 週間チャレンジを取得または生成
export async function getWeeklyChallenge(gradeLevel: number, subjects: string[]): Promise<WeeklyChallenge | null> {
  try {
    const challengeId = generateWeeklyChallengeId();
    const challengeRef = doc(db, 'weeklyChallenges', challengeId);
    const challengeSnap = await getDoc(challengeRef);

    if (challengeSnap.exists()) {
      const data = challengeSnap.data();
      // startDateとendDateが存在することを確認
      if (!data.startDate || !data.endDate) {
        console.error('Weekly challenge missing dates, regenerating...');
        return await generateWeeklyChallenge(gradeLevel, subjects);
      }
      return { id: challengeSnap.id, ...data } as WeeklyChallenge;
    }

    // チャレンジが存在しない場合は生成
    return await generateWeeklyChallenge(gradeLevel, subjects);
  } catch (error) {
    console.error('Error getting weekly challenge:', error);
    return null;
  }
}

// 週間チャレンジを生成
async function generateWeeklyChallenge(gradeLevel: number, userSubjects: string[]): Promise<WeeklyChallenge | null> {
  try {
    // 科目が設定されていない場合は全教科を使用
    const effectiveSubjects = userSubjects.length > 0 ? userSubjects : getAllSubjectsForGrade(gradeLevel);
    
    // 週間チャレンジは3-5科目をランダムに選択（全教科の場合は最大7科目）
    const maxSubjects = effectiveSubjects.length > 10 ? 7 : Math.min(effectiveSubjects.length, 5);
    const minSubjects = Math.min(3, effectiveSubjects.length);
    const numSubjects = minSubjects + Math.floor(Math.random() * (maxSubjects - minSubjects + 1));
    
    const selectedSubjects = effectiveSubjects
      .sort(() => Math.random() - 0.5)
      .slice(0, numSubjects);

    console.log(`Generating weekly challenge with ${selectedSubjects.length} subjects from ${effectiveSubjects.length} available`);

    // デフォルトの難易度は標準
    const difficulty: 'easy' | 'medium' | 'hard' = 'medium';

    // 各科目から問題を取得
    const problemIds: string[] = [];
    const problemsPerSubject = Math.max(3, Math.floor(35 / selectedSubjects.length)); // 週35問を目標

    for (const subject of selectedSubjects) {
      // シンプルに科目と難易度で問題を検索
      const problemsQuery = query(
        collection(db, 'problems'),
        where('subject', '==', subject),
        where('difficulty', '==', difficulty),
        limit(problemsPerSubject)
      );

      const problemsSnap = await getDocs(problemsQuery);
      problemsSnap.forEach(doc => {
        problemIds.push(doc.id);
      });
    }

    // 問題が少ない場合は難易度を変えて追加取得
    if (problemIds.length < 20) { // 最低20問は欲しい
      const otherDifficulties = ['easy', 'medium', 'hard'].filter(d => d !== difficulty);
      
      for (const otherDifficulty of otherDifficulties) {
        for (const subject of selectedSubjects) {
          const additionalQuery = query(
            collection(db, 'problems'),
            where('subject', '==', subject),
            where('difficulty', '==', otherDifficulty),
            limit(5)
          );

          const additionalSnap = await getDocs(additionalQuery);
          additionalSnap.forEach(doc => {
            if (!problemIds.includes(doc.id)) {
              problemIds.push(doc.id);
            }
          });
        }
        
        if (problemIds.length >= 20) break;
      }
    }

    console.log(`Found ${problemIds.length} problems for weekly challenge`);

    // 週間チャレンジを作成
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();
    const challengeId = generateWeeklyChallengeId();

    const weeklyChallenge: Omit<WeeklyChallenge, 'id'> = {
      startDate: Timestamp.fromDate(weekStart),
      endDate: Timestamp.fromDate(weekEnd),
      subjects: selectedSubjects,
      totalProblems: problemIds.length,
      problemsPerDay: Math.ceil(problemIds.length / 7),
      difficulty,
      problemIds,
      createdAt: serverTimestamp() as Timestamp
    };

    await setDoc(doc(db, 'weeklyChallenges', challengeId), weeklyChallenge);

    return {
      id: challengeId,
      ...weeklyChallenge
    };
  } catch (error) {
    console.error('Error generating weekly challenge:', error);
    return null;
  }
}

// 週間チャレンジの進捗を取得
export async function getWeeklyChallengeStatus(
  userId: string,
  challengeId: string
): Promise<WeeklyChallengeStatus | null> {
  try {
    const statusRef = doc(db, 'users', userId, 'weeklyChallengeStatus', challengeId);
    const statusSnap = await getDoc(statusRef);

    if (statusSnap.exists()) {
      return statusSnap.data() as WeeklyChallengeStatus;
    }

    // 初期ステータスを作成
    const initialStatus: WeeklyChallengeStatus = {
      userId,
      challengeId,
      dailyCompletions: {},
      completedProblems: 0,
      totalProblems: 0,
      lastCompletedAt: null,
      completionRate: 0,
      achieved: false,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };

    await setDoc(statusRef, initialStatus);
    return initialStatus;
  } catch (error) {
    console.error('Error getting weekly challenge status:', error);
    return null;
  }
}

// デイリー進捗を更新
export async function updateWeeklyProgress(
  userId: string,
  challengeId: string,
  date: string,
  score: number,
  totalQuestions: number
): Promise<void> {
  try {
    const statusRef = doc(db, 'users', userId, 'weeklyChallengeStatus', challengeId);
    const status = await getWeeklyChallengeStatus(userId, challengeId);
    
    if (!status) return;

    // デイリー進捗を更新
    const dailyCompletions = {
      ...status.dailyCompletions,
      [date]: true
    };

    // 完了した日数を計算
    const daysCompleted = Object.values(dailyCompletions).filter(Boolean).length;
    const completionRate = daysCompleted / 7;

    // 週間チャレンジの達成判定（70%以上で達成）
    const achieved = completionRate >= 0.7 && !status.achieved;

    // ステータスを更新
    await updateDoc(statusRef, {
      dailyCompletions,
      completedProblems: (status.completedProblems || 0) + totalQuestions,
      lastCompletedAt: serverTimestamp(),
      completionRate,
      achieved: status.achieved || achieved,
      updatedAt: serverTimestamp()
    });

    // 達成時の処理
    if (achieved) {
      await handleWeeklyChallengeCompletion(userId, challengeId, score, totalQuestions);
    }
  } catch (error) {
    console.error('Error updating weekly progress:', error);
  }
}

// 週間チャレンジ完了時の処理
async function handleWeeklyChallengeCompletion(
  userId: string,
  challengeId: string,
  score: number,
  totalQuestions: number
): Promise<void> {
  try {
    // XP付与
    const earnedXp = calculateWeeklyXP(score, totalQuestions);
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const currentXp = userDoc.data()?.experience || 0;
    
    await updateDoc(userRef, {
      experience: currentXp + earnedXp,
      lastUpdated: serverTimestamp()
    });

    // 簡易的な偏差値更新
    const accuracy = score / totalQuestions;
    const currentDeviation = userDoc.data()?.estimatedDeviation || 50;
    let newDeviation = currentDeviation;
    
    if (accuracy >= 0.8) {
      newDeviation = Math.min(75, currentDeviation + 1);
    } else if (accuracy >= 0.6) {
      newDeviation = Math.min(75, currentDeviation + 0.5);
    } else if (accuracy < 0.4) {
      newDeviation = Math.max(35, currentDeviation - 0.5);
    }
    
    await updateDoc(userRef, {
      estimatedDeviation: newDeviation
    });
  } catch (error) {
    console.error('Error handling weekly challenge completion:', error);
  }
}

// 週間チャレンジのXP計算
function calculateWeeklyXP(score: number, totalQuestions: number): number {
  let xp = 200; // 基本XP
  
  // 正答率ボーナス
  const accuracy = score / totalQuestions;
  if (accuracy >= 0.9) xp += 100;
  else if (accuracy >= 0.8) xp += 50;
  else if (accuracy >= 0.7) xp += 25;
  
  // 完全制覇ボーナス
  if (score === totalQuestions) xp += 150;
  
  return xp;
}

// 現在の週の進捗サマリーを取得
export async function getWeeklyProgressSummary(userId: string): Promise<{
  challenge: WeeklyChallenge;
  status: WeeklyChallengeStatus;
  daysCompleted: number;
  remainingDays: number;
  todaySubjects: string[];
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

    const challenge = await getWeeklyChallenge(gradeLevel, subjects);
    if (!challenge) return null;

    const status = await getWeeklyChallengeStatus(userId, challenge.id);
    if (!status) return null;

    const today = new Date();
    const daysCompleted = Object.values(status.dailyCompletions || {}).filter(Boolean).length;
    
    // 日付の安全な処理
    let remainingDays = 7;
    if (challenge.endDate) {
      const endDate = challenge.endDate.toDate ? challenge.endDate.toDate() : new Date(challenge.endDate);
      remainingDays = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)));
    }

    // 今日の科目（ローテーション）
    const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1; // 月曜日を0とする
    const subjectsPerDay = Math.ceil(challenge.subjects.length / 7);
    const todaySubjects = challenge.subjects.slice(
      dayOfWeek * subjectsPerDay,
      (dayOfWeek + 1) * subjectsPerDay
    );

    return {
      challenge,
      status,
      daysCompleted,
      remainingDays,
      todaySubjects: todaySubjects.length > 0 ? todaySubjects : challenge.subjects.slice(0, 2)
    };
  } catch (error) {
    console.error('Error getting weekly progress summary:', error);
    return null;
  }
}

// 週間セッションを完了
export async function completeWeeklySession(
  userId: string,
  challengeId: string,
  problemIds: string[],
  score: number
): Promise<{ achieved: boolean; xpEarned: number }> {
  try {
    const statusRef = doc(db, 'users', userId, 'weeklyChallengeStatus', challengeId);
    const statusDoc = await getDoc(statusRef);
    
    if (!statusDoc.exists()) {
      throw new Error('Challenge status not found');
    }
    
    const status = statusDoc.data() as WeeklyChallengeStatus;
    const today = new Date().toISOString().split('T')[0];
    
    // 今日の完了を記録
    const updatedDailyCompletions = {
      ...status.dailyCompletions,
      [today]: true
    };
    
    // 完了した問題を追加
    const updatedCompletedProblemIds = [
      ...(status.completedProblemIds || []),
      ...problemIds
    ];
    
    // 完了率を計算
    const daysCompleted = Object.values(updatedDailyCompletions).filter(Boolean).length;
    const completionRate = daysCompleted / 7;
    
    // 達成判定（70%以上で達成）
    const achieved = completionRate >= 0.7 && !status.achieved;
    
    // XP計算
    let xpEarned = score * 5; // 正解数 × 5
    if (achieved) {
      xpEarned += 200; // 達成ボーナス
    }
    
    // ステータスを更新
    await updateDoc(statusRef, {
      dailyCompletions: updatedDailyCompletions,
      completedProblemIds: updatedCompletedProblemIds,
      completedProblems: updatedCompletedProblemIds.length,
      lastCompletedAt: serverTimestamp(),
      completionRate,
      achieved: status.achieved || achieved,
      updatedAt: serverTimestamp()
    });
    
    // XPを付与
    if (xpEarned > 0) {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const currentXp = userDoc.data()?.experience || 0;
      
      await updateDoc(userRef, {
        experience: currentXp + xpEarned,
        lastUpdated: serverTimestamp()
      });
    }
    
    return { achieved, xpEarned };
  } catch (error) {
    console.error('Error completing weekly session:', error);
    throw error;
  }
}