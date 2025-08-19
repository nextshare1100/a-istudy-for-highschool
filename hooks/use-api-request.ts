import { useAuth } from './use-auth';
import { useCallback } from 'react';

export function useApiRequest() {
  const { user } = useAuth();

  const makeRequest = useCallback(async (
    url: string,
    options: RequestInit = {}
  ) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Firebase認証トークンを取得
    const token = await user.getIdToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }, [user]);

  return { makeRequest };
}