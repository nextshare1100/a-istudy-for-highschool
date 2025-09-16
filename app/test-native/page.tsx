'use client';

import { useState, useEffect } from 'react';

export default function TestNativePage() {
  const [mounted, setMounted] = useState(false);
  const [platform, setPlatform] = useState('unknown');

  useEffect(() => {
    setMounted(true);
    
    // Capacitorプラットフォーム検出
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const cap = (window as any).Capacitor;
      setPlatform(cap.getPlatform ? cap.getPlatform() : 'capacitor');
    } else {
      setPlatform('web');
    }
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4 text-center">
          ネイティブアプリテスト
        </h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-green-100 rounded-lg">
            <h2 className="font-semibold text-green-800">✅ 成功</h2>
            <p className="text-green-700">アプリが正常に読み込まれました！</p>
          </div>
          
          <div className="p-4 bg-blue-100 rounded-lg">
            <h2 className="font-semibold text-blue-800">プラットフォーム情報</h2>
            <p className="text-blue-700">現在のプラットフォーム: {platform}</p>
          </div>
          
          <div className="p-4 bg-yellow-100 rounded-lg">
            <h2 className="font-semibold text-yellow-800">環境情報</h2>
            <p className="text-yellow-700">Node環境: {process.env.NODE_ENV}</p>
            <p className="text-yellow-700">タイムスタンプ: {new Date().toLocaleString()}</p>
          </div>

          <button 
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg"
            onClick={() => alert('ボタンクリックが動作しています！')}
          >
            テストボタン
          </button>
        </div>
      </div>
    </div>
  );
}