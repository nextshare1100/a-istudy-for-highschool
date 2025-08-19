import { 
  collection, 
  doc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  LearningAnalytics, 
  SubjectAnalytics, 
  UnitPerformance, 
  OverallStats,
  LearningCurvePoint,
  Recommendation,
  UserAcademicProfile,
  ChallengeHistoryEntry
} from '@/types/challenge';

// 期間のタイプ
type PeriodType = 'daily' | 'weekly' | 'monthly' | 'all-time';

// 期間の開始日と終了日を計算
function getPeriodDates(period: PeriodType): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case 'daily':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case 'weekly':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'all-time':
      startDate.setFullYear(2020); // システム開始時
      break;
  }

  return { startDate, endDate };
}

// 学習分析データを取得
export async function getLearningAnalytics(
  userId: string,
  period: PeriodType = 'monthly'
): Promise<LearningAnalytics | null> {
  try {
    const { startDate, endDate } = getPeriodDates(period);
    
    // ユーザーの学術プロファイルを取得
    const profileDoc = await getDoc(doc(db, 'users', userId, 'academicProfile', 'current'));
    const profile = profileDoc.exists() ? profileDoc.data() as UserAcademicProfile : null;
    
    if (!profile) {
      console.error('Academic profile not found');
      return null;
    }

    // チャレンジ履歴を取得
    const challengeHistory = profile.challengeHistory || [];
    const periodHistory = challengeHistory.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate <= endDate;
    });

    // 科目別の分析
    const subjects: { [subject: string]: SubjectAnalytics } = {};
    const subjectStats: { [subject: string]: {
      totalProblems: number;
      correctAnswers: number;
      totalTime: number;
      unitStats: { [unit: string]: UnitPerformance };
    }} = {};

    // デイリーチャレンジのステータスを取得
    const dailyStatusQuery = query(
      collection(db, 'users', userId, 'dailyChallengeStatus'),
      where('completedAt', '>=', Timestamp.fromDate(startDate)),
      where('completedAt', '<=', Timestamp.fromDate(endDate))
    );
    
    const dailyStatusSnap = await getDocs(dailyStatusQuery);
    
    // 各チャレンジの詳細を分析
    for (const statusDoc of dailyStatusSnap.docs) {
      const status = statusDoc.data();
      const challengeDoc = await getDoc(doc(db, 'dailyChallenges', status.challengeId));
      
      if (!challengeDoc.exists()) continue;
      
      const challenge = challengeDoc.data();
      const subject = challenge.subject;
      
      if (!subjectStats[subject]) {
        subjectStats[subject] = {
          totalProblems: 0,
          correctAnswers: 0,
          totalTime: 0,
          unitStats: {}
        };
      }
      
      subjectStats[subject].totalProblems += status.totalQuestions || 0;
      subjectStats[subject].correctAnswers += status.score || 0;
      subjectStats[subject].totalTime += status.timeSpent || 0;
      
      // 単元別の統計
      if (challenge.units) {
        for (const unit of challenge.units) {
          if (!subjectStats[subject].unitStats[unit]) {
            subjectStats[subject].unitStats[unit] = {
              unit,
              totalProblems: 0,
              correctAnswers: 0,
              accuracy: 0,
              lastAttempted: status.completedAt,
              masteryLevel: 0,
              trend: 'stable'
            };
          }
          
          const unitStat = subjectStats[subject].unitStats[unit];
          unitStat.totalProblems += Math.floor((status.totalQuestions || 0) / challenge.units.length);
          unitStat.correctAnswers += Math.floor((status.score || 0) / challenge.units.length);
          unitStat.accuracy = unitStat.totalProblems > 0 
            ? unitStat.correctAnswers / unitStat.totalProblems 
            : 0;
          unitStat.masteryLevel = Math.floor(unitStat.accuracy * 100);
          
          if (status.completedAt > unitStat.lastAttempted) {
            unitStat.lastAttempted = status.completedAt;
          }
        }
      }
    }

    // 科目別分析データの構築
    for (const [subject, stats] of Object.entries(subjectStats)) {
      const accuracy = stats.totalProblems > 0 
        ? stats.correctAnswers / stats.totalProblems 
        : 0;
      
      const averageTime = stats.totalProblems > 0 
        ? stats.totalTime / stats.totalProblems 
        : 0;
      
      // 強み・弱みの単元を特定
      const unitPerformances = Object.values(stats.unitStats);
      const sortedUnits = unitPerformances.sort((a, b) => b.accuracy - a.accuracy);
      const strengthUnits = sortedUnits.filter(u => u.accuracy >= 0.8).map(u => u.unit);
      const weaknessUnits = sortedUnits.filter(u => u.accuracy < 0.6).map(u => u.unit);
      
      subjects[subject] = {
        subject,
        totalProblems: stats.totalProblems,
        correctAnswers: stats.correctAnswers,
        accuracy,
        averageTimePerProblem: averageTime,
        estimatedDeviation: profile.subjectDeviations?.[subject] || 50,
        deviationChange: calculateDeviationChange(subject, periodHistory),
        unitPerformance: stats.unitStats,
        strengthUnits,
        weaknessUnits
      };
    }

    // 全体統計
    const overallStats = calculateOverallStats(userId, periodHistory, subjectStats);
    
    // 学習曲線
    const learningCurve = calculateLearningCurve(periodHistory, startDate, endDate);
    
    // 推奨事項
    const recommendations = generateRecommendations(subjects, profile);

    return {
      userId,
      period,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      subjects,
      overallStats,
      learningCurve,
      recommendations
    };
  } catch (error) {
    console.error('Error getting learning analytics:', error);
    return null;
  }
}

// 偏差値の変化を計算
function calculateDeviationChange(
  subject: string,
  history: ChallengeHistoryEntry[]
): number {
  const subjectHistory = history.filter(h => h.subjects.includes(subject));
  if (subjectHistory.length < 2) return 0;
  
  const latest = subjectHistory[subjectHistory.length - 1];
  const earliest = subjectHistory[0];
  
  return latest.estimatedDeviation - earliest.estimatedDeviation;
}

// 全体統計を計算
async function calculateOverallStats(
  userId: string,
  history: ChallengeHistoryEntry[],
  subjectStats: any
): Promise<OverallStats> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  const userData = userDoc.data();
  
  let totalProblems = 0;
  let correctAnswers = 0;
  let totalTime = 0;
  
  for (const stats of Object.values(subjectStats) as any[]) {
    totalProblems += stats.totalProblems;
    correctAnswers += stats.correctAnswers;
    totalTime += stats.totalTime;
  }
  
  const overallAccuracy = totalProblems > 0 ? correctAnswers / totalProblems : 0;
  
  // 学習日数を計算
  const uniqueDates = new Set(history.map(h => h.date));
  const studyDays = uniqueDates.size;
  
  // ストリークを計算
  const { currentStreak, longestStreak } = calculateStreaks(Array.from(uniqueDates).sort());
  
  return {
    totalProblems,
    correctAnswers,
    overallAccuracy,
    studyDays,
    currentStreak,
    longestStreak,
    totalXpEarned: userData?.xp || 0,
    averageStudyTime: totalTime / Math.max(studyDays, 1),
    estimatedOverallDeviation: userData?.academicProfile?.current?.estimatedDeviation || 50
  };
}

// ストリークを計算
function calculateStreaks(dates: string[]): { currentStreak: number; longestStreak: number } {
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };
  
  let currentStreak = 1;
  let longestStreak = 1;
  let tempStreak = 1;
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // 現在のストリークを確認
  if (dates[dates.length - 1] !== today && dates[dates.length - 1] !== yesterdayStr) {
    currentStreak = 0;
  }
  
  // 最長ストリークを計算
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1]);
    const currDate = new Date(dates[i]);
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
    
    if (diffDays === 1) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 1;
    }
  }
  
  // 現在のストリークを逆算
  if (currentStreak > 0) {
    tempStreak = 1;
    for (let i = dates.length - 1; i > 0; i--) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        break;
      }
    }
    currentStreak = tempStreak;
  }
  
  return { currentStreak, longestStreak };
}

// 学習曲線を計算
function calculateLearningCurve(
  history: ChallengeHistoryEntry[],
  startDate: Date,
  endDate: Date
): LearningCurvePoint[] {
  const curve: LearningCurvePoint[] = [];
  const dailyData: { [date: string]: {
    totalProblems: number;
    correctAnswers: number;
    subjects: { [subject: string]: { total: number; correct: number } };
    estimatedDeviation: number;
  }} = {};
  
  // 日付ごとにデータを集計
  for (const entry of history) {
    if (!dailyData[entry.date]) {
      dailyData[entry.date] = {
        totalProblems: 0,
        correctAnswers: 0,
        subjects: {},
        estimatedDeviation: entry.estimatedDeviation
      };
    }
    
    const data = dailyData[entry.date];
    data.totalProblems += entry.totalQuestions;
    data.correctAnswers += entry.score;
    
    // 科目ごとの集計
    for (const subject of entry.subjects) {
      if (!data.subjects[subject]) {
        data.subjects[subject] = { total: 0, correct: 0 };
      }
      data.subjects[subject].total += Math.floor(entry.totalQuestions / entry.subjects.length);
      data.subjects[subject].correct += Math.floor(entry.score / entry.subjects.length);
    }
  }
  
  // 学習曲線データを構築
  for (const [date, data] of Object.entries(dailyData)) {
    const accuracy = data.totalProblems > 0 ? data.correctAnswers / data.totalProblems : 0;
    const subjectDeviations: { [subject: string]: number } = {};
    
    for (const [subject, subjectData] of Object.entries(data.subjects)) {
      const subjectAccuracy = subjectData.total > 0 ? subjectData.correct / subjectData.total : 0;
      // 簡易的な偏差値推定（実際の偏差値計算はより複雑）
      subjectDeviations[subject] = 50 + (subjectAccuracy - 0.5) * 40;
    }
    
    curve.push({
      date,
      estimatedDeviation: data.estimatedDeviation,
      problemsSolved: data.totalProblems,
      accuracy,
      subjects: subjectDeviations
    });
  }
  
  return curve.sort((a, b) => a.date.localeCompare(b.date));
}

// 推奨事項を生成
function generateRecommendations(
  subjects: { [subject: string]: SubjectAnalytics },
  profile: UserAcademicProfile
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // 科目ごとの推奨事項
  for (const [subject, analytics] of Object.entries(subjects)) {
    // 弱点単元への集中学習
    if (analytics.weaknessUnits.length > 0) {
      recommendations.push({
        type: 'focus',
        subject,
        unit: analytics.weaknessUnits[0],
        reason: `${analytics.weaknessUnits[0]}の正答率が${Math.floor(analytics.unitPerformance[analytics.weaknessUnits[0]]?.accuracy * 100 || 0)}%と低めです`,
        suggestedAction: `${analytics.weaknessUnits[0]}の基礎問題から復習しましょう`,
        priority: 'high',
        estimatedImpact: 3
      });
    }
    
    // 偏差値が下降傾向の科目
    if (analytics.deviationChange < -2) {
      recommendations.push({
        type: 'review',
        subject,
        reason: `${subject}の偏差値が${Math.abs(analytics.deviationChange)}ポイント低下しています`,
        suggestedAction: `${subject}の復習時間を増やし、基礎を固めましょう`,
        priority: 'high',
        estimatedImpact: 5
      });
    }
    
    // 高偏差値の科目でチャレンジ
    if (analytics.estimatedDeviation > 65 && analytics.accuracy > 0.85) {
      recommendations.push({
        type: 'challenge',
        subject,
        reason: `${subject}の偏差値が${analytics.estimatedDeviation}と高く、正答率も良好です`,
        suggestedAction: `より難易度の高い問題に挑戦してさらなる向上を目指しましょう`,
        priority: 'medium',
        estimatedImpact: 2
      });
    }
    
    // 安定している科目の維持
    if (Math.abs(analytics.deviationChange) < 1 && analytics.accuracy > 0.7) {
      recommendations.push({
        type: 'maintain',
        subject,
        reason: `${subject}は安定した成績を維持しています`,
        suggestedAction: `現在のペースを維持しつつ、苦手分野の克服に時間を使いましょう`,
        priority: 'low',
        estimatedImpact: 1
      });
    }
  }
  
  // 優先度でソート
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// 科目別の詳細分析を取得
export async function getSubjectAnalysis(
  userId: string,
  subject: string,
  period: PeriodType = 'monthly'
): Promise<SubjectAnalytics | null> {
  try {
    const analytics = await getLearningAnalytics(userId, period);
    if (!analytics) return null;
    
    return analytics.subjects[subject] || null;
  } catch (error) {
    console.error('Error getting subject analysis:', error);
    return null;
  }
}

// 学習の推移データを取得（グラフ用）
export async function getLearningTrends(
  userId: string,
  days: number = 30
): Promise<{
  dates: string[];
  deviations: number[];
  accuracies: number[];
  problemCounts: number[];
} | null> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const profileDoc = await getDoc(doc(db, 'users', userId, 'academicProfile', 'current'));
    const profile = profileDoc.exists() ? profileDoc.data() as UserAcademicProfile : null;
    
    if (!profile || !profile.challengeHistory) {
      return null;
    }
    
    const history = profile.challengeHistory
      .filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
    
    const dates = history.map(h => h.date);
    const deviations = history.map(h => h.estimatedDeviation);
    const accuracies = history.map(h => h.totalQuestions > 0 ? h.score / h.totalQuestions : 0);
    const problemCounts = history.map(h => h.totalQuestions);
    
    return {
      dates,
      deviations,
      accuracies,
      problemCounts
    };
  } catch (error) {
    console.error('Error getting learning trends:', error);
    return null;
  }
}