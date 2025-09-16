import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        const data = doc.data();
        const sub = data?.subscription;
        
        if (sub?.status === 'trial' && sub?.trialEndDate) {
          // トライアル残り日数を計算
          const endDate = sub.trialEndDate.toDate();
          const now = new Date();
          const days = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          setDaysRemaining(Math.max(0, days));
        }
        
        setSubscription(sub);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { subscription, loading, daysRemaining };
};
