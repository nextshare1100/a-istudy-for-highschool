// components/FirebaseErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FirestoreError } from 'firebase/firestore';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class FirebaseErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Firebase Error Boundary caught:', error, errorInfo);
    
    // Firestoreエラーの特別な処理
    if (error instanceof FirestoreError) {
      console.error('Firestore Error Details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
    }
    
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                エラーが発生しました
              </h2>
              <p className="text-gray-600 mb-4">
                申し訳ございません。予期しないエラーが発生しました。
              </p>
              {this.state.error?.message?.includes('INTERNAL ASSERTION FAILED') && (
                <p className="text-sm text-gray-500 mb-4">
                  Firebase接続に問題が発生しています。ページを再読み込みしてください。
                </p>
              )}
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ページを再読み込み
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}