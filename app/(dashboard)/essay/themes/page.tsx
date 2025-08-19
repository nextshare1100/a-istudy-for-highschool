'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function GenerateThemesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<{
    type: string;
    status: 'pending' | 'generating' | 'success' | 'error';
    message?: string;
  }[]>([]);

  const themeTypes = [
    { id: 'common', name: '共通問題', description: '全学部共通の基本的なテーマ', count: 5 },
    { id: 'current-affairs', name: '時事問題', description: '最新の社会問題や時事トピック', count: 5 },
    { id: 'faculty-law', name: '法学部', description: '法学部向けの専門的なテーマ', count: 3 },
    { id: 'faculty-economics', name: '経済学部', description: '経済学部向けの専門的なテーマ', count: 3 },
    { id: 'faculty-literature', name: '文学部', description: '文学部向けの専門的なテーマ', count: 3 },
    { id: 'faculty-science', name: '理学部', description: '理学部向けの専門的なテーマ', count: 3 },
    { id: 'faculty-engineering', name: '工学部', description: '工学部向けの専門的なテーマ', count: 3 },
    { id: 'faculty-medicine', name: '医学部', description: '医学部向けの専門的なテーマ', count: 3 },
    { id: 'faculty-education', name: '教育学部', description: '教育学部向けの専門的なテーマ', count: 3 },
    { id: 'faculty-sociology', name: '社会学部', description: '社会学部向けの専門的なテーマ', count: 3 },
    { id: 'graph-analysis', name: 'グラフ読み取り', description: 'データ分析を含むテーマ（Gemini Pro使用）', count: 3 }
  ];

  const generateThemes = async (type: string) => {
    if (!user) {
      alert('ログインが必要です');
      return;
    }

    // ステータスを更新
    setGenerationStatus(prev => [...prev.filter(s => s.type !== type), {
      type,
      status: 'generating',
      message: '生成中...'
    }]);

    try {
      const token = await user.getIdToken();
      let apiType = type;
      let faculty = undefined;

      // 学部別の場合はfacultyを抽出
      if (type.startsWith('faculty-')) {
        apiType = 'faculty-specific';
        faculty = type.replace('faculty-', '');
      }

      const response = await fetch('/api/essay/generate-themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: apiType,
          faculty,
          count: themeTypes.find(t => t.id === type)?.count || 5,
          saveToFirebase: true
        })
      });

      if (!response.ok) {
        throw new Error('テーマの生成に失敗しました');
      }

      const data = await response.json();
      
      setGenerationStatus(prev => [...prev.filter(s => s.type !== type), {
        type,
        status: 'success',
        message: `${data.count}個のテーマを生成しました`
      }]);
    } catch (error) {
      console.error('Error generating themes:', error);
      setGenerationStatus(prev => [...prev.filter(s => s.type !== type), {
        type,
        status: 'error',
        message: 'エラーが発生しました'
      }]);
    }
  };

  const generateAllThemes = async () => {
    if (!user) {
      alert('ログインが必要です');
      return;
    }

    setIsGenerating(true);
    setGenerationStatus([]);

    try {
      const token = await user.getIdToken();
      
      // すべてのタイプをpendingに設定
      setGenerationStatus(themeTypes.map(t => ({
        type: t.id,
        status: 'pending',
        message: '待機中...'
      })));

      // 各タイプを順番に生成
      for (const themeType of themeTypes) {
        await generateThemes(themeType.id);
        // API制限を考慮して少し待つ
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error('Error generating all themes:', error);
      alert('テーマの生成中にエラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="animate-spin text-gray-400" size={20} />;
      case 'generating':
        return <Loader2 className="animate-spin text-blue-500" size={20} />;
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/essay')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            小論文対策に戻る
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AIテーマ生成
          </h1>
          <p className="text-gray-600">
            Gemini APIを使用して小論文テーマを自動生成します
          </p>
        </div>

        {/* 一括生成ボタン */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">すべてのテーマを一括生成</h2>
              <p className="text-purple-100">
                共通問題、時事問題、学部別問題、グラフ読み取り問題をまとめて生成します
              </p>
            </div>
            <button
              onClick={generateAllThemes}
              disabled={isGenerating}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  一括生成
                </>
              )}
            </button>
          </div>
        </div>

        {/* 個別生成セクション */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">個別生成</h3>
          
          {themeTypes.map(themeType => {
            const status = generationStatus.find(s => s.type === themeType.id);
            
            return (
              <div key={themeType.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{themeType.name}</h4>
                    <p className="text-sm text-gray-600">{themeType.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{themeType.count}個のテーマを生成</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {status && (
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status.status)}
                        <span className="text-sm text-gray-600">{status.message}</span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => generateThemes(themeType.id)}
                      disabled={isGenerating || status?.status === 'generating'}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {status?.status === 'generating' ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          生成中
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          生成
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 注意事項 */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">注意事項</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• API制限があるため、生成には時間がかかる場合があります</li>
            <li>• 生成されたテーマは自動的にFirebaseに保存されます</li>
            <li>• グラフ読み取り問題はGemini Proを使用するため、より詳細な内容になります</li>
          </ul>
        </div>
      </div>
    </div>
  );
}