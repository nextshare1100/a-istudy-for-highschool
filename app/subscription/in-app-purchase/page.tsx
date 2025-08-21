// app/subscription/in-app-purchase/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function InAppPurchasePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    // アプリから商品情報を取得
    if ((window as any).ReactNativeWebView) {
      (window as any).ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'getProducts' })
      );
    }

    // アプリからのメッセージを受信
    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === 'products') {
        setProducts(data.products);
        setLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handlePurchase = (productId: string) => {
    setPurchasing(true);
    if ((window as any).ReactNativeWebView) {
      (window as any).ReactNativeWebView.postMessage(
        JSON.stringify({ 
          type: 'purchase',
          productId: productId 
        })
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">プレミアムプランに登録</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">アプリ内購入について</p>
            <p>購入はApp Store/Google Playを通じて処理されます。</p>
            <p>Web版とは価格が異なる場合があります。</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{product.title}</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{product.price}</p>
                <button
                  onClick={() => handlePurchase(product.id)}
                  disabled={purchasing}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg 
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:bg-blue-700 transition-colors"
                >
                  {purchasing ? '処理中...' : '購入'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center text-sm text-gray-600">
        <p>購入の管理やキャンセルは、各ストアの設定から行ってください。</p>
        <p className="mt-2">
          <a href="/terms" className="text-blue-600 hover:underline">利用規約</a>
          {' | '}
          <a href="/privacy" className="text-blue-600 hover:underline">プライバシーポリシー</a>
        </p>
      </div>
    </div>
  );
}