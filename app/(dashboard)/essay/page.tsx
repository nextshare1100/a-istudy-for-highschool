'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PenTool, TrendingUp, BarChart3, BookOpen, Clock, Target, ArrowLeft, ChevronRight, Sparkles, Filter, X, Settings, ChevronDown, RotateCcw, Loader2, Calendar, FileText, Award } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { EssayTheme, EssaySubmission } from '@/lib/firebase/types';
import { essayService } from '@/lib/firebase/services/essay-service';
import { getEssaySubmissions } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useFirebaseError } from '@/hooks/useFirebaseError';
import { FirebaseErrorBoundary } from '@/components/FirebaseErrorBoundary';

// カスタムテーマ生成のオプション型
interface CustomThemeOptions {
  topic: string;
  category: string;
  faculty?: string;
  wordLimit: number;
  timeLimit: number;
  difficulty: number;
  includeGraph: boolean;
  specificRequirements?: string;
}

const DEFAULT_OPTIONS: CustomThemeOptions = {
  topic: '',
  category: 'society',
  wordLimit: 800,
  timeLimit: 60,
  difficulty: 3,
  includeGraph: false,
  specificRequirements: ''
};

function EssayPageContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<EssaySubmission[]>([]);
  const [generatedThemes, setGeneratedThemes] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEssays: 0,
    averageScore: '--',
    totalWords: 0,
    averageWords: 0
  });
  
  // UI状態
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  
  const { error, isLoading, handleFirebaseOperation, clearError } = useFirebaseError();
  
  // データ取得の重複を防ぐためのフラグとタイマー
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);

  // カスタムテーマオプション（ローカルストレージから復元）
  const [customOptions, setCustomOptions] = useState<CustomThemeOptions>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('essayCustomOptions');
      if (saved) {
        try {
          return { ...DEFAULT_OPTIONS, ...JSON.parse(saved) };
        } catch (e) {
          console.error('Failed to parse saved options:', e);
        }
      }
    }
    return DEFAULT_OPTIONS;
  });

  // カスタムオプションが変更されたら保存
  useEffect(() => {
    localStorage.setItem('essayCustomOptions', JSON.stringify(customOptions));
  }, [customOptions]);

  // カテゴリーとファカルティの選択肢
  const categories = [
    { value: 'society', label: '社会' },
    { value: 'culture', label: '文化' },
    { value: 'science', label: '科学技術' },
    { value: 'environment', label: '環境' },
    { value: 'education', label: '教育' },
    { value: 'economy', label: '経済' },
    { value: 'politics', label: '政治' },
    { value: 'ethics', label: '倫理' }
  ];

  const faculties = [
    { value: '', label: '指定なし' },
    { value: 'law', label: '法学部' },
    { value: 'economics', label: '経済学部' },
    { value: 'literature', label: '文学部' },
    { value: 'science', label: '理学部' },
    { value: 'engineering', label: '工学部' },
    { value: 'medicine', label: '医学部' },
    { value: 'education', label: '教育学部' },
    { value: 'sociology', label: '社会学部' }
  ];

  const wordLimitOptions = [
    { value: 400, label: '400字' },
    { value: 600, label: '600字' },
    { value: 800, label: '800字' },
    { value: 1000, label: '1000字' },
    { value: 1200, label: '1200字' },
    { value: 1600, label: '1600字' }
  ];

  const timeLimitOptions = [
    { value: 30, label: '30分' },
    { value: 45, label: '45分' },
    { value: 60, label: '60分' },
    { value: 90, label: '90分' },
    { value: 120, label: '120分' }
  ];

  // 提出履歴の取得
  const fetchSubmissions = useCallback(async () => {
    if (!user || !isMountedRef.current) return;

    setLoadingSubmissions(true);
    try {
      const data = await getEssaySubmissions({
        userId: user.uid,
        isDraft: false
      });
      
      if (isMountedRef.current) {
        setSubmissions(data);
        
        // 統計情報の計算
        const totalEssays = data.length;
        const scores = data.filter(s => s.evaluationScore).map(s => s.evaluationScore!);
        const averageScore = scores.length > 0 
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : 0;
        const totalWords = data.reduce((acc, s) => acc + (s.wordCount || 0), 0);
        const averageWords = totalEssays > 0 ? Math.round(totalWords / totalEssays) : 0;
        
        setStats({
          totalEssays,
          averageScore: averageScore ? averageScore.toString() : '--',
          totalWords,
          averageWords
        });
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      if (isMountedRef.current) {
        setLoadingSubmissions(false);
      }
    }
  }, [user]);

  // カスタムテーマ生成
  const generateCustomTheme = async () => {
    if (!user) {
      alert('ログインが必要です');
      return;
    }

    if (!customOptions.topic.trim()) {
      alert('テーマを入力してください');
      return;
    }

    setIsGenerating(true);
    setGeneratedThemes([]);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/essay/generate-custom-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          options: customOptions,
          count: 3,
          saveToFirebase: false
        })
      });

      if (!response.ok) {
        throw new Error('テーマの生成に失敗しました');
      }

      const data = await response.json();
      setGeneratedThemes(data.themes);
    } catch (error) {
      console.error('Error generating custom theme:', error);
      alert('テーマの生成中にエラーが発生しました');
    } finally {
      setIsGenerating(false);
    }
  };

  // テーマを保存して執筆開始
  const startWriting = async (theme: any) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/essay/save-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ theme })
      });

      if (!response.ok) {
        throw new Error('テーマの保存に失敗しました');
      }

      const data = await response.json();
      
      // 生成されたテーマをクリア
      setGeneratedThemes([]);
      
      // 執筆画面へ遷移
      router.push(`/essay/write/${data.themeId}`);
    } catch (error) {
      console.error('Error saving theme:', error);
      alert('テーマの保存中にエラーが発生しました');
    }
  };

  // 条件をリセット
  const resetCustomOptions = () => {
    setCustomOptions(DEFAULT_OPTIONS);
    localStorage.removeItem('essayCustomOptions');
  };

  // コンポーネントのアンマウント時のクリーンアップ
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      isFetchingRef.current = false;
    };
  }, []);

  // 認証状態の監視
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // データの取得
  useEffect(() => {
    if (user && !authLoading && isMountedRef.current) {
      clearError();
      
      // 重複実行を防ぐため、既に実行中でないことを確認
      if (!isFetchingRef.current) {
        isFetchingRef.current = true;
        fetchSubmissions().finally(() => {
          isFetchingRef.current = false;
        });
      }
    }
  }, [user, authLoading]); // clearError, fetchSubmissionsは意図的に除外

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <style jsx>{`
        .main-content {
          padding: 12px;
          max-width: 100%;
          margin: 0 auto;
        }
        
        .greeting-section {
          text-align: center;
          margin-bottom: 16px;
        }
        
        .greeting {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        
        .date {
          font-size: 11px;
          opacity: 0.7;
        }
        
        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: white;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          color: #636e72;
          cursor: pointer;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          margin-bottom: 16px;
          transition: all 0.2s ease;
        }
        
        .back-button:hover {
          transform: translateX(-2px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }
        
        /* 統計情報セクション */
        .stats-section {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .stat-card-content {
          flex: 1;
        }
        
        .stat-card-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
        
        .stat-card-icon.purple {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }
        
        .stat-card-icon.yellow {
          background: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
        }
        
        .stat-card-icon.green {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }
        
        .stat-card-icon.blue {
          background: rgba(79, 172, 254, 0.1);
          color: #4facfe;
        }
        
        .stat-label {
          font-size: 11px;
          color: #636e72;
          margin-bottom: 2px;
        }
        
        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: #2d3436;
        }
        
        /* カスタムフォーム */
        .custom-form-section {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          margin-bottom: 20px;
        }
        
        .custom-form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .custom-form-title {
          font-size: 16px;
          font-weight: 600;
          color: #2d3436;
        }
        
        .form-grid {
          display: grid;
          gap: 12px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-label {
          font-size: 12px;
          font-weight: 500;
          color: #2d3436;
          margin-bottom: 6px;
        }
        
        .form-input,
        .form-select {
          padding: 8px 10px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 13px;
          background: white;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        
        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .form-textarea {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 13px;
          background: white;
          resize: vertical;
          min-height: 60px;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        
        .form-textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        
        .difficulty-slider {
          width: 100%;
          margin-top: 6px;
        }
        
        .difficulty-labels {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #636e72;
          margin-top: 4px;
        }
        
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
        }
        
        .form-checkbox {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }
        
        .advanced-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #667eea;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 12px;
          margin-bottom: 12px;
        }
        
        .advanced-toggle:hover {
          color: #764ba2;
        }
        
        .form-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }
        
        .reset-button {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          background: white;
          color: #636e72;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .reset-button:hover {
          border-color: #636e72;
          color: #2d3436;
        }
        
        .generate-custom-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .generate-custom-button:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
        }
        
        .generate-custom-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* 生成結果 */
        .generated-themes {
          margin-top: 20px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .generated-themes-header {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        
        .generated-theme-list {
          display: grid;
          gap: 12px;
        }
        
        .generated-theme {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 12px;
          transition: all 0.2s ease;
        }
        
        .generated-theme:hover {
          border-color: #667eea;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .generated-theme-title {
          font-size: 14px;
          font-weight: 600;
          color: #2d3436;
          margin-bottom: 6px;
        }
        
        .generated-theme-description {
          color: #636e72;
          line-height: 1.5;
          margin-bottom: 8px;
          white-space: pre-wrap;
          font-size: 12px;
        }
        
        .generated-theme-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }
        
        .theme-tag {
          padding: 2px 8px;
          background: #f0f0f0;
          border-radius: 12px;
          font-size: 10px;
          color: #636e72;
        }
        
        .theme-tag.purple {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }
        
        .theme-tag.blue {
          background: rgba(79, 172, 254, 0.1);
          color: #4facfe;
        }
        
        .theme-tag.green {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }
        
        .theme-tag.orange {
          background: rgba(251, 146, 60, 0.1);
          color: #fb923c;
        }
        
        .start-writing-button {
          width: 100%;
          padding: 8px 16px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .start-writing-button:hover {
          background: #764ba2;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }
        
        /* 執筆履歴 */
        .history-section {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .history-header {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        
        .history-empty {
          text-align: center;
          padding: 24px;
          color: #636e72;
          font-size: 13px;
        }
        
        .submission-list {
          display: grid;
          gap: 12px;
        }
        
        .submission-item {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 12px;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .submission-item:hover {
          border-color: #667eea;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .submission-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        
        .submission-title {
          font-size: 14px;
          font-weight: 600;
          color: #2d3436;
          margin-bottom: 4px;
          line-height: 1.3;
        }
        
        .submission-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: #636e72;
          flex-wrap: wrap;
        }
        
        .submission-meta-item {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        
        .submission-score {
          text-align: right;
        }
        
        .submission-score-value {
          font-size: 18px;
          font-weight: 700;
          color: #667eea;
        }
        
        .submission-score-label {
          font-size: 10px;
          color: #636e72;
        }
        
        .submission-content {
          color: #636e72;
          line-height: 1.4;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-size: 11px;
        }
        
        .submission-actions {
          display: flex;
          gap: 6px;
        }
        
        .submission-action-button {
          padding: 6px 10px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          background: white;
          color: #636e72;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .submission-action-button:hover {
          border-color: #667eea;
          color: #667eea;
        }
        
        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px;
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <main className="main-content">
        <button className="back-button" onClick={() => router.push('/secondary-exam')}>
          <ArrowLeft size={14} />
          二次試験対策に戻る
        </button>

        <div className="greeting-section">
          <div className="greeting">小論文対策</div>
          <div className="date">論理的思考力と文章力を鍛えよう</div>
        </div>

        {/* 統計情報 */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-label">総執筆数</div>
              <div className="stat-value">{stats.totalEssays}</div>
            </div>
            <div className="stat-card-icon purple">
              <FileText size={16} />
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-label">平均スコア</div>
              <div className="stat-value">{stats.averageScore}</div>
            </div>
            <div className="stat-card-icon yellow">
              <Award size={16} />
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-label">総文字数</div>
              <div className="stat-value">{stats.totalWords > 9999 ? `${Math.floor(stats.totalWords / 1000)}k` : stats.totalWords.toLocaleString()}</div>
            </div>
            <div className="stat-card-icon green">
              <TrendingUp size={16} />
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-label">平均文字数</div>
              <div className="stat-value">{stats.averageWords}</div>
            </div>
            <div className="stat-card-icon blue">
              <Clock size={16} />
            </div>
          </div>
        </div>

        {/* カスタムテーマ生成フォーム */}
        <div className="custom-form-section">
          <div className="custom-form-header">
            <h3 className="custom-form-title">カスタムテーマ作成</h3>
            <button onClick={resetCustomOptions} className="reset-button">
              <RotateCcw size={12} />
              リセット
            </button>
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                テーマ・トピック <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={customOptions.topic}
                onChange={(e) => setCustomOptions({ ...customOptions, topic: e.target.value })}
                placeholder="例：AIと人間の共存"
                className="form-input"
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">カテゴリー</label>
                <select
                  value={customOptions.category}
                  onChange={(e) => setCustomOptions({ ...customOptions, category: e.target.value })}
                  className="form-select"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">対象学部</label>
                <select
                  value={customOptions.faculty || ''}
                  onChange={(e) => setCustomOptions({ ...customOptions, faculty: e.target.value || undefined })}
                  className="form-select"
                >
                  {faculties.map(fac => (
                    <option key={fac.value} value={fac.value}>{fac.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">文字数制限</label>
                <select
                  value={customOptions.wordLimit}
                  onChange={(e) => setCustomOptions({ ...customOptions, wordLimit: Number(e.target.value) })}
                  className="form-select"
                >
                  {wordLimitOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">制限時間</label>
                <select
                  value={customOptions.timeLimit}
                  onChange={(e) => setCustomOptions({ ...customOptions, timeLimit: Number(e.target.value) })}
                  className="form-select"
                >
                  {timeLimitOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">難易度: {customOptions.difficulty}</label>
              <input
                type="range"
                min="1"
                max="5"
                value={customOptions.difficulty}
                onChange={(e) => setCustomOptions({ ...customOptions, difficulty: Number(e.target.value) })}
                className="difficulty-slider"
              />
              <div className="difficulty-labels">
                <span>易しい</span>
                <span>普通</span>
                <span>難しい</span>
              </div>
            </div>
            
            <div className="form-group">
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="includeGraph"
                  checked={customOptions.includeGraph}
                  onChange={(e) => setCustomOptions({ ...customOptions, includeGraph: e.target.checked })}
                  className="form-checkbox"
                />
                <label htmlFor="includeGraph" className="form-label" style={{ marginBottom: 0, fontSize: '12px' }}>
                  グラフ・データ読み取り問題にする
                </label>
              </div>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="advanced-toggle"
          >
            <Settings size={12} />
            詳細設定
            <ChevronDown size={12} style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          
          {showAdvanced && (
            <div style={{ marginBottom: '12px' }}>
              <label className="form-label">その他の要望（任意）</label>
              <textarea
                value={customOptions.specificRequirements}
                onChange={(e) => setCustomOptions({ ...customOptions, specificRequirements: e.target.value })}
                placeholder="例：具体的な事例を含める"
                className="form-textarea"
              />
            </div>
          )}
          
          <div className="form-actions">
            <button
              onClick={generateCustomTheme}
              disabled={isGenerating || !customOptions.topic.trim()}
              className="generate-custom-button"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  テーマを生成
                </>
              )}
            </button>
          </div>
          
          {/* 生成結果 */}
          {generatedThemes.length > 0 && (
            <div className="generated-themes">
              <h4 className="generated-themes-header">
                生成されたテーマ（{generatedThemes.length}件）
              </h4>
              <div className="generated-theme-list">
                {generatedThemes.map((theme, index) => (
                  <div key={index} className="generated-theme">
                    <h5 className="generated-theme-title">{theme.title}</h5>
                    <p className="generated-theme-description">{theme.description}</p>
                    <div className="generated-theme-tags">
                      <span className="theme-tag purple">{theme.wordLimit}字</span>
                      <span className="theme-tag blue">{theme.timeLimit}分</span>
                      <span className="theme-tag green">難易度 {theme.difficulty}</span>
                      {theme.hasGraph && <span className="theme-tag orange">グラフ</span>}
                    </div>
                    <button onClick={() => startWriting(theme)} className="start-writing-button">
                      このテーマで執筆を開始
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 執筆履歴 */}
        <div className="history-section">
          <h2 className="history-header">執筆履歴</h2>
          
          {loadingSubmissions ? (
            <div className="loading-spinner">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="history-empty">
              <p>まだ執筆履歴がありません</p>
              <p style={{ fontSize: '11px', marginTop: '6px' }}>
                上のフォームからテーマを生成して執筆を始めましょう
              </p>
            </div>
          ) : (
            <div className="submission-list">
              {submissions.map(submission => {
                const createdAt = submission.createdAt instanceof Date 
                  ? submission.createdAt 
                  : submission.createdAt.toDate();
                
                return (
                  <div 
                    key={submission.id} 
                    className="submission-item"
                    onClick={() => router.push(`/essay/view/${submission.id}`)}
                  >
                    <div className="submission-header">
                      <div style={{ flex: 1 }}>
                        <h3 className="submission-title">
                          {submission.theme?.title || 'テーマなし'}
                        </h3>
                        <div className="submission-meta">
                          <span className="submission-meta-item">
                            <Calendar size={12} />
                            {format(createdAt, 'MM/dd', { locale: ja })}
                          </span>
                          <span className="submission-meta-item">
                            <FileText size={12} />
                            {submission.wordCount}文字
                          </span>
                          {submission.timeSpentSeconds && (
                            <span className="submission-meta-item">
                              <Clock size={12} />
                              {Math.round(submission.timeSpentSeconds / 60)}分
                            </span>
                          )}
                        </div>
                      </div>
                      {submission.evaluationScore && (
                        <div className="submission-score">
                          <div className="submission-score-value">
                            {submission.evaluationScore}
                          </div>
                          <div className="submission-score-label">/100</div>
                        </div>
                      )}
                    </div>
                    
                    {submission.content && (
                      <p className="submission-content">
                        {submission.content}
                      </p>
                    )}
                    
                    <div className="submission-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="submission-action-button"
                        onClick={() => router.push(`/essay/view/${submission.id}`)}
                      >
                        詳細を見る
                      </button>
                      {submission.theme?.id && (
                        <button
                          className="submission-action-button"
                          onClick={() => router.push(`/essay/write/${submission.theme!.id}`)}
                        >
                          再挑戦
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function EssayPage() {
  return (
    <FirebaseErrorBoundary>
      <EssayPageContent />
    </FirebaseErrorBoundary>
  );
}