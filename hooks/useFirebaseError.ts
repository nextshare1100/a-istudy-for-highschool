// hooks/useFirebaseError.ts
import { useState, useCallback } from 'react';
import { FirestoreError } from 'firebase/firestore';

export function useFirebaseError() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFirebaseOperation = useCallback(async <T,>(
    operation: () => Promise<T>,
    options: {
      loadingMessage?: string;
      errorMessage?: string;
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
    } = {}
  ): Promise<T | null> => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await operation();
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      return result;
    } catch (err) {
      const errorMessage = options.errorMessage || 'エラーが発生しました';
      
      if (err instanceof FirestoreError) {
        if (err.code === 'unavailable') {
          setError('ネットワーク接続を確認してください');
        } else if (err.message.includes('INTERNAL ASSERTION FAILED')) {
          setError('接続エラーが発生しました。ページを再読み込みしてください');
        } else {
          setError(`${errorMessage}: ${err.message}`);
        }
      } else if (err instanceof Error) {
        setError(`${errorMessage}: ${err.message}`);
      } else {
        setError(errorMessage);
      }
      
      if (options.onError) {
        options.onError(err as Error);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    error,
    isLoading,
    handleFirebaseOperation,
    clearError: () => setError(null)
  };
}