// lib/errorLogging.ts

interface ErrorLog {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  timestamp: string;
}

export async function logError(
  error: Error | unknown,
  context?: Record<string, any>
): Promise<void> {
  const errorLog: ErrorLog = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context,
    timestamp: new Date().toISOString()
  };

  // 開発環境ではコンソールに出力
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Log:', errorLog);
    return;
  }

  // 本番環境では外部サービスに送信（例：Sentry, LogRocket等）
  // ここに実装を追加
  
  // Firestoreにもログを保存（オプション）
  try {
    const { getAdminFirestore } = await import('./firebase-admin');
    const db = getAdminFirestore();
    await db.collection('error_logs').add(errorLog);
  } catch (logError) {
    console.error('Failed to log error to Firestore:', logError);
  }
}