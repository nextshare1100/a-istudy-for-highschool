// app/(dashboard)/account/subscription/page.tsx
'use client';

import { useSubscriptionSync } from '@/hooks/useSubscriptionSync';
import { RestorePurchaseButton } from '@/components/restore-purchase-button';
import { SubscriptionErrorBoundary } from '@/components/subscription-error-boundary';
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

function SubscriptionContent() {
  const router = useRouter();
  const { 
    subscription, 
    loading, 
    syncing, 
    error,
    syncSubscription 
  } = useSubscriptionSync();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '---';
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const getStatusBadge = () => {
    switch (subscription.status) {
      case 'trial':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            無料トライアル
          </div>
        );
      case 'active':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            有効
          </div>
        );
      case 'cancelled':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            キャンセル済み
          </div>
        );
      case 'expired':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            期限切れ
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            未登録
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold mb-6">サブスクリプション管理</h1>

      {/* エラー表示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">エラーが発生しました</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 現在のプラン */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              現在のプラン
            </h2>
          </div>
          {getStatusBadge()}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">プラン名</p>
              <p className="font-medium">
                {subscription.productId === 'premium_monthly' ? 'プレミアム月額プラン' : 
                 subscription.productId === 'com.aistudy.premium.monthly' ? 'プレミアム月額プラン' :
                 subscription.isActive ? 'プレミアムプラン' : '無料プラン'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">プラットフォーム</p>
              <p className="font-medium">
                {subscription.platform === 'ios' ? 'iOS (App Store)' :
                 subscription.platform === 'android' ? 'Android (Google Play)' :
                 Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'Web'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">有効期限</p>
              <p className="font-medium">
                {formatDate(subscription.expirationDate)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">自動更新</p>
              <p className="font-medium">
                {subscription.autoRenewing ? 'オン' : 'オフ'}
              </p>
            </div>
          </div>

          {/* トライアル期間の表示 */}
          {subscription.isInTrial && subscription.trialDaysRemaining !== undefined && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">
                    無料トライアル期間中
                  </p>
                  <p className="text-sm text-blue-700">
                    残り{subscription.trialDaysRemaining}日
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 期限切れ警告 */}
          {subscription.status === 'expired' && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">
                    サブスクリプションの有効期限が切れています
                  </p>
                  <p className="text-sm text-red-700">
                    プレミアム機能を利用するには、サブスクリプションを更新してください。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* アクション */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">アクション</h2>

        <div className="space-y-4">
          {/* 同期ボタン */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">サブスクリプション情報を同期</p>
              <p className="text-sm text-gray-600">
                最新の購入情報を取得します
              </p>
            </div>
            <button
              onClick={syncSubscription}
              disabled={syncing}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  同期中...
                </>
              ) : (
                '同期'
              )}
            </button>
          </div>

          {/* 購入復元 */}
          {Capacitor.isNativePlatform() && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="mb-3">
                <p className="font-medium">購入を復元</p>
                <p className="text-sm text-gray-600">
                  以前の購入履歴を復元します
                </p>
              </div>
              <RestorePurchaseButton 
                onSuccess={() => {
                  // 成功時の処理
                }}
                onError={(error) => {
                  console.error('Restore error:', error);
                }}
              />
            </div>
          )}

          {/* サブスクリプション管理 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">サブスクリプションを管理</p>
              <p className="text-sm text-gray-600">
                {subscription.platform === 'ios' ? 'App Storeで管理' :
                 subscription.platform === 'android' ? 'Google Playで管理' :
                 'プラン変更やキャンセル'}
              </p>
            </div>
            <button
              onClick={() => {
                if (subscription.platform === 'ios') {
                  window.open('https://apps.apple.com/account/subscriptions');
                } else if (subscription.platform === 'android') {
                  window.open('https://play.google.com/store/account/subscriptions');
                } else {
                  router.push('/subscription');
                }
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
            >
              管理する
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* プランアップグレード */}
          {!subscription.isActive && (
            <div className="mt-6">
              <button
                onClick={() => router.push('/subscription/onboarding')}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 flex items-center justify-center gap-2 font-medium"
              >
                <Crown className="w-5 h-5" />
                プレミアムプランにアップグレード
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionManagementPage() {
  return (
    <SubscriptionErrorBoundary>
      <SubscriptionContent />
    </SubscriptionErrorBoundary>
  );
}