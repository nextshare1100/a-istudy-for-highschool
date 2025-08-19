// hooks/useFirebaseCleanup.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { networkManager } from '@/lib/firebase/network-manager';
import { waitForPendingWrites } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export function useFirebaseCleanup() {
  const pathname = usePathname();

  useEffect(() => {
    // ページ遷移時のクリーンアップ
    const cleanup = async () => {
      try {
        // 保留中の書き込みを待つ
        await waitForPendingWrites(db).catch((error) => {
          // オフライン時などのエラーは無視
          console.log('Pending writes check:', error.message);
        });
      } catch (error) {
        console.warn('Cleanup error:', error);
      }
    };

    // ページが変更されたときにクリーンアップを実行
    cleanup();

    // ページ可視性の変更を監視
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // ページが非表示になった時の処理
        console.log('Page hidden, ensuring writes are complete');
        cleanup();
      }
    };

    // ブラウザが閉じられる前の処理
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // 保留中の書き込みがある場合は警告
      waitForPendingWrites(db).catch(() => {
        e.preventDefault();
        e.returnValue = '';
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pathname]);

  // コンポーネントのアンマウント時にネットワークマネージャーをクリーンアップ
  useEffect(() => {
    return () => {
      // このフックを使用するコンポーネントがアンマウントされた時
      // ネットワークマネージャーのクリーンアップは行わない（シングルトンのため）
    };
  }, []);
}

// プロバイダーコンポーネント（オプション）
export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  useFirebaseCleanup();
  
  // アプリケーション全体でのクリーンアップ
  useEffect(() => {
    return () => {
      // アプリケーションが完全にアンマウントされた時のみ
      networkManager.cleanup();
    };
  }, []);
  
  return <>{children}</>;
}