'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { UserProfile } from '@/types/user';
import { useAuth } from './use-auth';

export function useUser() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user || authLoading) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          setProfile(snapshot.data() as UserProfile);
        }
        setLoading(false);
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, authLoading]);

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error('ユーザーが認証されていません');
    
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...data,
        updatedAt: new Date(),
      });
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    user,
    profile,
    loading: authLoading || loading,
    error,
    updateProfile,
  };
}