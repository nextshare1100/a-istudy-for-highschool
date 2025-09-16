// components/subscription-error-boundary.tsx
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Wifi } from 'lucide-react';
import { iapManager } from '@/lib/native-iap';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorType: 'network' | 'iap' | 'auth' | 'unknown';
  retryCount: number;
}

export class SubscriptionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorType: 'unknown',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // エラータイプを判定
    let errorType: State['errorType'] = 'unknown';
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      errorType = 'network';
    } else if (error.message.includes('IAP') || error.message.includes('purchase')) {
      errorType = 'iap';
    } else if (error.message.includes('auth') || error.message.includes('token')) {
      errorType = 'auth';
    }

    return {
      hasError: true,
      error,
      errorType
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Subscription Error Boundary caught:', error, errorInfo);
    
    // エラーレポートをサーバーに送信（必要に応じて）
    this.reportError(error, errorInfo);
  }

  private reportError = async (error: Error, errorInfo: ErrorInfo) => {
    try {
      await fetch('/api/error-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            type: this.state.errorType
          },
          errorInfo,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        })
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  };

  private handleRetry = async () => {
    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
      hasError: false,
      error: null
    }));

    // IAPの再初期化を試みる
    if (this.state.errorType === 'iap') {
      try {
        await iapManager.initialize();
      } catch (error) {
        console.error('Failed to reinitialize IAP:', error);
      }
    }
  };

  private getErrorMessage = (): string => {
    const { errorType, error } = this.state;
    
    switch (errorType) {
      case 'network':
        return 'ネットワーク接続に問題があります。インターネット接続を確認してください。';
      case 'iap':
        return 'アプリ内購入サービスに接続できません。しばらく待ってから再度お試しください。';
      case 'auth':
        return '認証エラーが発生しました。再度ログインしてください。';
      default:
        return error?.message || '予期しないエラーが発生しました。';
    }
  };

  private getErrorIcon = () => {
    switch (this.state.errorType) {
      case 'network':
        return <Wifi className="w-12 h-12 text-red-500" />;
      case 'iap':
      case 'auth':
      default:
        return <AlertCircle className="w-12 h-12 text-red-500" />;
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col items-center text-center">
              {this.getErrorIcon()}
              
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                エラーが発生しました
              </h2>
              
              <p className="mt-2 text-sm text-gray-600">
                {this.getErrorMessage()}
              </p>

              {this.state.error && process.env.NODE_ENV === 'development' && (
                <details className="mt-4 w-full">
                  <summary className="cursor-pointer text-sm text-gray-500">
                    詳細情報（開発用）
                  </summary>
                  <pre className="mt-2 text-xs text-left bg-gray-100 p-2 rounded overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={this.handleRetry}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  再試行
                  {this.state.retryCount > 0 && ` (${this.state.retryCount})`}
                </button>

                <button
                  onClick={() => window.location.href = '/home'}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  ホームに戻る
                </button>
              </div>

              {this.state.retryCount >= 3 && (
                <p className="mt-4 text-sm text-orange-600">
                  問題が続く場合は、アプリを再起動するか、サポートにお問い合わせください。
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}