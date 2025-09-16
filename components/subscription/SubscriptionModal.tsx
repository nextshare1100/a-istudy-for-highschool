'use client';

import { useState, useEffect } from 'react';
import { RevenueCatService, getRevenueCatApiKey } from '@/lib/revenuecat';
import { CustomerInfo, PurchasesOfferings } from '@revenuecat/purchases-capacitor';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customerInfo: CustomerInfo) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  const revenueCat = RevenueCatService.getInstance();

  useEffect(() => {
    if (isOpen && !isConfigured) {
      initializeRevenueCat();
    }
  }, [isOpen, isConfigured]);

  const initializeRevenueCat = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiKey = getRevenueCatApiKey();
      if (!apiKey) {
        throw new Error('RevenueCat API key not found');
      }

      await revenueCat.configure(apiKey);
      const fetchedOfferings = await revenueCat.getOfferings();
      
      if (!fetchedOfferings || !fetchedOfferings.availablePackages.length) {
        throw new Error('No subscription packages available');
      }

      setOfferings(fetchedOfferings);
      setIsConfigured(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize subscription');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageToPurchase: any) => {
    try {
      setLoading(true);
      setError(null);

      const customerInfo = await revenueCat.purchasePackage(packageToPurchase);
      
      if (customerInfo) {
        onSuccess(customerInfo);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      setError(null);

      const customerInfo = await revenueCat.restorePurchases();
      
      if (customerInfo && typeof customerInfo.entitlements.active['premium'] !== 'undefined') {
        onSuccess(customerInfo);
        onClose();
      } else {
        setError('No active subscriptions found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore purchases');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              プレミアムプラン
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              disabled={loading}
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">読み込み中...</p>
            </div>
          )}

          {!loading && offerings && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mb-4">
                  <span className="text-4xl font-bold text-blue-600">¥980</span>
                  <span className="text-lg text-gray-600">/月</span>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-green-800 font-medium">30日間無料トライアル</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 mb-3">プレミアム機能</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    無制限の問題練習
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    詳細な学習分析
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    小論文添削機能
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    面接練習無制限
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    学習スケジュール自動生成
                  </li>
                </ul>
              </div>

              {offerings.availablePackages.map((pkg, index) => (
                <button
                  key={index}
                  onClick={() => handlePurchase(pkg)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
                  disabled={loading}
                >
                  30日間無料で試す
                </button>
              ))}

              <button
                onClick={handleRestore}
                className="w-full text-blue-600 hover:text-blue-700 py-2 text-sm"
                disabled={loading}
              >
                購入を復元する
              </button>

              <div className="text-xs text-gray-500 text-center">
                <p>自動更新されます。いつでもキャンセル可能です。</p>
                <p>利用規約とプライバシーポリシーに同意したものとみなされます。</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};