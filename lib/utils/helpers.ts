// lib/utils/helpers.ts
import { format, formatDistance, formatRelative, isAfter, isBefore, differenceInDays } from 'date-fns';
import { ja } from 'date-fns/locale';

// 日付フォーマット
export function formatDate(date: Date | string, pattern: string = 'yyyy年MM月dd日'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, pattern, { locale: ja });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistance(d, new Date(), { addSuffix: true, locale: ja });
}

// 時間フォーマット（秒を分:秒に変換）
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 学習時間フォーマット（分を時間と分に変換）
export function formatStudyTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}時間${remainingMinutes}分` : `${hours}時間`;
}

// パーセンテージ計算
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// 正答率計算
export function calculateAccuracy(correct: number, total: number): number {
  return calculatePercentage(correct, total);
}

// 習熟度のレベル判定
export function getMasteryLevel(mastery: number): {
  level: string;
  color: string;
  description: string;
} {
  if (mastery >= 90) {
    return { level: '完璧', color: 'text-green-600', description: '十分に理解しています' };
  } else if (mastery >= 70) {
    return { level: '良好', color: 'text-blue-600', description: 'よく理解しています' };
  } else if (mastery >= 50) {
    return { level: '普通', color: 'text-yellow-600', description: 'もう少し練習が必要です' };
  } else if (mastery >= 30) {
    return { level: '要復習', color: 'text-orange-600', description: '復習が必要です' };
  } else {
    return { level: '要学習', color: 'text-red-600', description: '基礎から学習が必要です' };
  }
}

// エラーメッセージの取得
export function getErrorMessage(error: any): string {
  if (error?.message) {
    // Firebase Auth エラーメッセージの日本語化
    const errorMap: { [key: string]: string } = {
      'auth/user-not-found': 'ユーザーが見つかりません',
      'auth/wrong-password': 'パスワードが正しくありません',
      'auth/email-already-in-use': 'このメールアドレスは既に使用されています',
      'auth/weak-password': 'パスワードは6文字以上で設定してください',
      'auth/invalid-email': '有効なメールアドレスを入力してください',
      'auth/operation-not-allowed': 'この操作は許可されていません',
      'auth/popup-closed-by-user': '認証がキャンセルされました',
      'auth/requires-recent-login': '再度ログインしてください',
      'auth/too-many-requests': 'リクエストが多すぎます。しばらくしてから再試行してください',
    };
    
    return errorMap[error.code] || error.message;
  }
  return 'エラーが発生しました';
}

// 学年の取得
export function getGradeNumber(grade: string): number {
  const gradeMap: { [key: string]: number } = {
    '高1': 1,
    '高2': 2,
    '高3': 3,
  };
  return gradeMap[grade] || 1;
}

// 目標達成までの残り日数
export function getDaysUntilTarget(targetDate: Date | string): number {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  return differenceInDays(target, new Date());
}

// スケジュール調整が必要かチェック
export function needsScheduleAdjustment(
  lastAdjusted: Date,
  currentProgress: number,
  expectedProgress: number
): boolean {
  const daysSinceAdjustment = differenceInDays(new Date(), lastAdjusted);
  const progressGap = Math.abs(currentProgress - expectedProgress);
  
  // 30日以上経過、または進捗が10%以上ずれている場合
  return daysSinceAdjustment >= 30 || progressGap >= 10;
}