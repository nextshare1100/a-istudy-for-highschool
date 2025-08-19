'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { Send, AlertCircle } from 'lucide-react';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

// よく使うテンプレート
const templates = [
  {
    id: 'newFeature',
    label: '新機能リリース',
    type: 'update',
    title: '新機能のお知らせ：',
    message: ''
  },
  {
    id: 'maintenance',
    label: '緊急メンテナンス',
    type: 'system',
    title: '緊急メンテナンスのお知らせ',
    message: '本日○時より緊急メンテナンスを実施します。ご不便をおかけして申し訳ございません。'
  },
  {
    id: 'important',
    label: '重要なお知らせ',
    type: 'warning',
    title: '重要なお知らせ',
    message: ''
  }
];

export default function BroadcastPage() {
  const { user } = useAuthStore();
  const [selectedTemplate, setSelectedTemplate] = useState('newFeature');
  const [title, setTitle] = useState(templates[0].title);
  const [message, setMessage] = useState(templates[0].message);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string>('');

  // 管理者チェック（実際は厳密に実装）
  const isAdmin = user?.email?.includes('admin');
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>アクセス権限がありません</p>
      </div>
    );
  }

  const selectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setTitle(template.title);
      setMessage(template.message);
    }
  };

  const sendBroadcast = async () => {
    if (!title || !message) {
      setResult('タイトルとメッセージを入力してください');
      return;
    }

    if (!window.confirm('全ユーザーに通知を送信します。よろしいですか？')) {
      return;
    }

    setSending(true);
    setResult('');

    try {
      // 全ユーザーを取得
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let successCount = 0;
      
      // バッチで通知を作成
      const promises = [];
      usersSnapshot.forEach((userDoc) => {
        const promise = addDoc(
          collection(db, 'notifications', userDoc.id, 'userNotifications'),
          {
            type: templates.find(t => t.id === selectedTemplate)?.type || 'system',
            title,
            message,
            timestamp: serverTimestamp(),
            read: false,
            source: 'admin'
          }
        );
        promises.push(promise);
      });

      await Promise.all(promises);
      successCount = promises.length;

      setResult(`✅ ${successCount}人のユーザーに通知を送信しました`);
      
      // フォームをリセット
      setMessage('');
      
    } catch (error) {
      console.error('Error:', error);
      setResult('❌ 送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">全体通知配信</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          {/* テンプレート選択 */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">通知タイプ</label>
            <div className="flex gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => selectTemplate(template.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTemplate === template.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>

          {/* タイトル */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="通知のタイトル"
            />
          </div>

          {/* メッセージ */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">メッセージ</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={5}
              placeholder="通知の内容を入力してください"
            />
          </div>

          {/* 結果表示 */}
          {result && (
            <div className={`mb-4 p-3 rounded-lg ${
              result.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {result}
            </div>
          )}

          {/* 送信ボタン */}
          <button
            onClick={sendBroadcast}
            disabled={sending || !title || !message}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sending ? (
              <>送信中...</>
            ) : (
              <>
                <Send className="h-4 w-4" />
                全ユーザーに送信
              </>
            )}
          </button>

          {/* 注意事項 */}
          <div className="mt-6 p-4 bg-amber-50 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">送信前の確認事項</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>全ユーザーに一斉送信されます</li>
                  <li>送信後の取り消しはできません</li>
                  <li>重要度の低い通知は避けてください</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}