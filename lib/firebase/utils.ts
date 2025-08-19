// lib/firebase/utils.ts - 拡張版
import { Timestamp } from 'firebase/firestore';

// 既存のコード
export const cleanData = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => cleanData(item));
  } else if (obj && typeof obj === 'object' && !(obj instanceof Date) && !(obj instanceof Timestamp)) {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) {
        continue; // undefinedは除外
      }
      if (value === null) {
        result[key] = null;
      } else if (Array.isArray(value)) {
        const hasNestedArray = value.some(item => 
          Array.isArray(item) || 
          (typeof item === 'object' && item !== null && Object.values(item).some(v => Array.isArray(v)))
        );
        
        if (hasNestedArray) {
          result[key] = value.map(item => {
            if (Array.isArray(item)) {
              return item.join(', ');
            } else if (typeof item === 'object' && item !== null) {
              return JSON.stringify(cleanData(item));
            }
            return item;
          });
        } else {
          result[key] = value;
        }
      } else {
        result[key] = cleanData(value);
      }
    }
    return result;
  }
  return obj;
};

// Timestampを日付に変換
export const timestampToDate = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return new Date();
};

// オフラインIDかチェック
export const isOfflineId = (id: string): boolean => {
  return id.startsWith('offline_');
};

// 日付を相対的な時間表現に変換
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  if (days < 30) return `${days}日前`;
  return date.toLocaleDateString('ja-JP');
};

// ===== 追加のユーティリティ関数 =====

/**
 * FirestoreエラーかどうかをチェックしてエラーメッセージをHanding
 */
export const handleFirestoreError = (error: any): string => {
  if (error?.code) {
    switch (error.code) {
      case 'permission-denied':
        return 'アクセス権限がありません';
      case 'not-found':
        return 'データが見つかりません';
      case 'already-exists':
        return '既に存在するデータです';
      case 'resource-exhausted':
        return 'リクエストの制限に達しました';
      case 'failed-precondition':
        return '前提条件を満たしていません';
      case 'aborted':
        return '処理が中断されました';
      case 'out-of-range':
        return '範囲外の値です';
      case 'unimplemented':
        return 'この機能は実装されていません';
      case 'internal':
        return 'サーバーエラーが発生しました';
      case 'unavailable':
        return 'サービスが一時的に利用できません';
      case 'data-loss':
        return 'データが失われました';
      case 'unauthenticated':
        return '認証が必要です';
      default:
        return error.message || 'エラーが発生しました';
    }
  }
  
  if (error?.message?.includes('INTERNAL ASSERTION FAILED')) {
    return 'Firebase接続エラーが発生しました。ページを再読み込みしてください';
  }
  
  return error?.message || 'エラーが発生しました';
};

/**
 * 日本語の文字数をカウント（改行・空白を除く）
 */
export const countJapaneseCharacters = (text: string): number => {
  // 改行と空白を除去してカウント
  return text.replace(/[\s\n\r]/g, '').length;
};

/**
 * 小論文の読了時間を推定（分）
 */
export const estimateReadingTime = (text: string): number => {
  const charCount = countJapaneseCharacters(text);
  // 日本語の平均読書速度: 400-600文字/分
  const readingSpeed = 500; // 文字/分
  return Math.ceil(charCount / readingSpeed);
};

/**
 * テキストの要約を生成（最初のN文字 + ...）
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * 評価スコアをグレードに変換
 */
export const scoreToGrade = (score: number): { grade: string; color: string } => {
  if (score >= 90) return { grade: 'S', color: '#FFD700' }; // Gold
  if (score >= 80) return { grade: 'A', color: '#4CAF50' }; // Green
  if (score >= 70) return { grade: 'B', color: '#2196F3' }; // Blue
  if (score >= 60) return { grade: 'C', color: '#FF9800' }; // Orange
  return { grade: 'D', color: '#F44336' }; // Red
};

/**
 * ファイルサイズを人間が読める形式に変換
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * カテゴリーの日本語表示名を取得
 */
export const getCategoryDisplayName = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'general': '一般',
    'faculty_specific': '学部別',
    'current_affairs': '時事問題',
    'graph_analysis': 'グラフ分析',
    'motivation': '志望動機',
    'self_pr': '自己PR',
    'student_life': '学生生活',
    'future_goals': '将来の目標',
    'academic': '学業',
  };
  
  return categoryMap[category] || category;
};

/**
 * 難易度の日本語表示名を取得
 */
export const getDifficultyDisplayName = (difficulty: string): { name: string; color: string } => {
  const difficultyMap: Record<string, { name: string; color: string }> = {
    'easy': { name: '初級', color: '#4CAF50' },
    'medium': { name: '中級', color: '#FF9800' },
    'hard': { name: '上級', color: '#F44336' },
  };
  
  return difficultyMap[difficulty] || { name: difficulty, color: '#9E9E9E' };
};

/**
 * 日付をYYYY年MM月DD日形式でフォーマット
 */
export const formatDateJapanese = (date: Date | Timestamp): string => {
  const d = date instanceof Timestamp ? date.toDate() : date;
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  
  return `${year}年${month}月${day}日`;
};

/**
 * 秒数を時間表示に変換（例: 125秒 → 2分5秒）
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}秒`;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}時間${minutes}分${secs}秒`;
  }
  return `${minutes}分${secs}秒`;
};

/**
 * デバウンス関数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};