// components/restore-purchase-button.tsx
'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, Info } from 'lucide-react';
import { useSubscriptionSync } from '@/hooks/useSubscriptionSync';
import { Capacitor } from '@capacitor/core';

interface RestorePurchaseButtonProps {
  className?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function RestorePurchaseButton({ 
  className = '', 
  onSuccess, 
  onError 
}: RestorePurchaseButtonProps) {
  const { restorePurchases, syncing } = useSubscriptionSync();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [showInfo, setShowInfo] = useState(false);

  const handleRestore = async () => {
    if (!Capacitor.isNativePlatform()) {
      setMessage('この機能はアプリでのみ利用可能です');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const result = await restorePurchases();
      
      if (result.success) {
        setStatus('success');
        setMessage('購入履歴が復元されました');
        onSuccess?.();
        
        // 3秒後にリセット
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.error || '復元する購入履歴がありません');
        onError?.(result.error || '');
        
        // 5秒後にリセット
        setTimeout(() => {
          setStatus('idle');
          setMessage('');
        }, 5000);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage('復元中にエラーが発生しました');
      onError?.(error.message);
      
      setTimeout(() => {
        setStatus('idle');
        setMessage('');
      }, 5000);
    }
  };

  const getButtonContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>復元中...</span>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>復元完了</span>
          </>
        );
      case 'error':
        return (
          <>
            <XCircle className="w-4 h-4" />
            <span>復元失敗</span>
          </>
        );
      default:
        return (
          <>
            <RefreshCw className="w-4 h-4" />
            <span>購入を復元</span>
          </>
        );
    }
  };

  const getButtonColor = () => {
    switch (status) {
      case 'loading':
        return 'bg-gray-400 cursor-not-allowed';
      case 'success':
        return 'bg-green-500 hover:bg-green-600';
      case 'error':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleRestore}
          disabled={status === 'loading' || syncing}
          className={`
            flex items-center gap-2 px-4 py-2 text-white rounded-lg
            transition-colors disabled:cursor-not-allowed
            ${getButtonColor()}
            ${className}
          `}
        >
          {getButtonContent()}
        </button>

        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="購入復元について"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {showInfo && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p className="text-blue-800">
            以前に購入したサブスクリプションを復元します。
            機種変更やアプリの再インストール後にご利用ください。
          </p>
        </div>
      )}

      {message && (
        <div className={`
          p-3 rounded-lg text-sm
          ${status === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : ''}
          ${status === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : ''}
        `}>
          {message}
        </div>
      )}
    </div>
  );
}