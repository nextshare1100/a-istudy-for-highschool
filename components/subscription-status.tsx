'use client';

import { useEffect, useState } from 'react';
import { iapManager } from '@/lib/native-iap';
import { Clock, Crown } from 'lucide-react';

export function SubscriptionStatus() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const result = await iapManager.checkSubscriptionStatus();
      setStatus(result);
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !status) return null;

  if (status.isInTrial && status.expirationDate) {
    const daysLeft = Math.ceil(
      (new Date(status.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <p className="text-blue-800 font-medium">
            無料トライアル期間: あと{daysLeft}日
          </p>
        </div>
        <p className="text-sm text-blue-600 mt-1">
          {status.willRenew 
            ? 'トライアル終了後、自動的に有料プランに移行します' 
            : 'トライアル終了後、自動更新はオフになっています'}
        </p>
      </div>
    );
  }

  if (status.isActive) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-green-600" />
          <p className="text-green-800 font-medium">
            プレミアムプラン利用中
          </p>
        </div>
      </div>
    );
  }

  return null;
}
