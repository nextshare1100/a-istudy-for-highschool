'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PenTool, TrendingUp, BarChart3, BookOpen, Clock, Target, ArrowLeft, ChevronRight, Sparkles, Filter, X, Settings, ChevronDown, RotateCcw, Loader2 } from 'lucide-react';
import { ThemeTabs } from '@/components/essay/theme-tabs';
import { EssayTheme } from '@/lib/firebase/types';
import { essayService } from '@/lib/firebase/services/essay-service';
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
  const [themes, setThemes] = useState<EssayTheme[]>([]);
  const [filteredThemes, setFilteredThemes] = useState<EssayTheme[]>([]);
  const [stats, setStats] = useState({
    totalEssays: 0,
    averageScore: '--',
    streakDays: 0,
    weeklyEssays: 0
  });
  
  // UI状態
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedThemes, setGeneratedThemes] = useState<any[]>([]);
  
  // フィルター状態
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFaculty, setSelectedFaculty] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  const { error, isLoading, handleFirebaseOperation, clearError } = useFirebaseError();
  
  // データ取得の重複を防ぐためのフラグとタイマー
  const isFetchingRef = useRef(false);
  const isMountedRef = useRef(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    { value: 'all', label: 'すべて' },
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
    { value: 'all', label: 'すべて' },
    { value: 'law', label: '法学部' },
    { value: 'economics', label: '経済学部' },
    { value: 'literature', label: '文学部' },
    { value: 'science', label: '理学部' },
    { value: 'engineering', label: '工学部' },
    { value: 'medicine', label: '医学部' },
    { value: 'education', label: '教育学部' },
    { value: 'sociology', label: '社会学部' }
  ];

  const themeTypes = [
    { value: 'all', label: 'すべて' },
    { value: 'common', label: '共通問題' },
    { value: 'current-affairs', label: '時事問題' },
    { value: 'faculty-specific', label: '学部別' },
    { value: 'graph-analysis', label: 'グラフ分析' },
    { value: 'custom', label: 'カスタム' }
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

  // テーマ取得関数
  const fetchThemes = useCallback(async () => {
    if (!user || isFetchingRef.current || !isMountedRef.current) return;

    isFetchingRef.current = true;
    
    await handleFirebaseOperation(
      async () => {
        const data = await essayService.getThemes();
        if (isMountedRef.current) {
          setThemes(data || []);
          setFilteredThemes(data || []);
        }
        return data;
      },
      {
        errorMessage: 'テーマの読み込みに失敗しました',
        onError: (error) => {
          console.error('Failed to fetch themes:', error);
          if (isMountedRef.current) {
            setThemes([]);
            setFilteredThemes([]);
          }
        }
      }
    );
    
    isFetchingRef.current = false;
  }, [user, handleFirebaseOperation]);

  // 統計情報の取得
  const fetchStats = useCallback(async () => {
    if (!user || !isMountedRef.current) return;

    await handleFirebaseOperation(
      async () => {
        const submissions = await essayService.getSubmissions(user.uid, false);
        
        if (isMountedRef.current && submissions && submissions.length > 0) {
          const totalEssays = submissions.length;
          
          const scores = submissions
            .filter(s => s.evaluationScore)
            .map(s => s.evaluationScore);
          const averageScore = scores.length > 0 
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : '--';
          
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          const weeklyEssays = submissions.filter(s => {
            const createdAt = s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt);
            return createdAt > oneWeekAgo;
          }).length;
          
          setStats({
            totalEssays,
            averageScore: averageScore.toString(),
            streakDays: 0,
            weeklyEssays
          });
        }
        
        return submissions;
      },
      {
        errorMessage: '統計情報の読み込みに失敗しました'
      }
    );
  }, [user, handleFirebaseOperation]);

  // フィルタリング処理
  useEffect(() => {
    let filtered = themes;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(theme => theme.category === selectedCategory);
    }

    if (selectedFaculty !== 'all') {
      filtered = filtered.filter(theme => 
        theme.faculties && theme.faculties.includes(selectedFaculty)
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(theme => theme.type === selectedType);
    }

    setFilteredThemes(filtered);
  }, [themes, selectedCategory, selectedFaculty, selectedType]);

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

  // テーマを保存
  const saveTheme = async (theme: any) => {
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
      alert('テーマを保存しました');
      
      // リストを更新
      await fetchThemes();
      
      // 生成されたテーマリストから削除
      setGeneratedThemes(prev => prev.filter(t => t !== theme));
      
      // カスタムフォームを閉じる
      if (generatedThemes.length === 1) {
        setShowCustomForm(false);
      }
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
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
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
      
      const loadInitialData = async () => {
        await fetchThemes();
        
        if (isMountedRef.current) {
          retryTimeoutRef.current = setTimeout(async () => {
            if (isMountedRef.current) {
              await fetchStats();
            }
          }, 500);
        }
      };
      
      loadInitialData();
    }
  }, [user, authLoading]);

  const handleSelectTheme = (theme: EssayTheme) => {
    if (theme.id) {
      router.push(`/essay/write/${theme.id}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <style jsx>{`
        /* 既存のスタイル */
        .main-content {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .greeting-section {
          text-align: center;
          margin-bottom: 24px;
        }
        
        .greeting {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        
        .date {
          font-size: 14px;
          opacity: 0.7;
        }
        
        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          color: #636e72;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          margin-bottom: 24px;
          transition: all 0.2s ease;
        }
        
        .back-button:hover {
          transform: translateX(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
        
        /* アクションカード */
        .action-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }
        
        .themes-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .themes-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
        }
        
        .trends-card {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 8px 24px rgba(240, 147, 251, 0.3);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .trends-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(240, 147, 251, 0.4);
        }
        
        .history-card {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 8px 24px rgba(79, 172, 254, 0.3);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .history-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(79, 172, 254, 0.4);
        }
        
        .action-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 200px;
          height: 200px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }
        
        .action-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }
        
        .action-card-title-section {
          color: white;
        }
        
        .action-card-label {
          font-size: 12px;
          font-weight: 500;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        
        .action-card-title {
          font-size: 24px;
          font-weight: 700;
        }
        
        .action-card-icon {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 12px;
          border-radius: 50%;
          color: white;
        }
        
        .action-card-content {
          position: relative;
          z-index: 1;
        }
        
        .action-card-description {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        
        .action-button {
          background: white;
          color: #667eea;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .action-button:hover {
          transform: scale(1.02);
        }
        
        .action-button.trends {
          color: #f093fb;
        }
        
        .action-button.history {
          color: #4facfe;
        }
        
        /* 統計情報セクション */
        .stats-section {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          margin-bottom: 32px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        
        .stat-card {
          text-align: center;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
        }
        
        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: #2d3436;
        }
        
        .stat-label {
          font-size: 14px;
          color: #636e72;
          margin-top: 4px;
        }
        
        /* テーマ選択セクション */
        .theme-selection-section {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          margin-bottom: 24px;
        }
        
        .theme-selection-header {
          margin-bottom: 20px;
        }
        
        .theme-selection-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .theme-selection-description {
          font-size: 14px;
          color: #636e72;
        }
        
        .theme-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
        }
        
        .theme-empty {
          text-align: center;
          padding: 40px;
        }
        
        .theme-empty-text {
          color: #636e72;
          margin-bottom: 20px;
        }
        
        .generate-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .generate-button:hover {
          transform: scale(1.02);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        }
        
        /* フィルターセクション */
        .filter-section {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        
        .filter-select {
          padding: 8px 16px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .filter-select:hover {
          border-color: #667eea;
        }
        
        .filter-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        /* カスタムフォーム */
        .custom-form-section {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          border: 2px dashed #667eea;
        }
        
        .custom-form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .custom-form-title {
          font-size: 18px;
          font-weight: 600;
          color: #2d3436;
        }
        
        .close-button {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: #636e72;
          transition: all 0.2s ease;
        }
        
        .close-button:hover {
          color: #2d3436;
          transform: scale(1.1);
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-label {
          font-size: 14px;
          font-weight: 500;
          color: #2d3436;
          margin-bottom: 8px;
        }
        
        .form-input,
        .form-select {
          padding: 10px 14px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          transition: all 0.2s ease;
        }
        
        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .form-textarea {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          resize: vertical;
          min-height: 80px;
          transition: all 0.2s ease;
        }
        
        .form-textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .difficulty-slider {
          width: 100%;
          margin-top: 8px;
        }
        
        .difficulty-labels {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #636e72;
          margin-top: 4px;
        }
        
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;
        }
        
        .form-checkbox {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }
        
        .advanced-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #667eea;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 16px;
          margin-bottom: 16px;
        }
        
        .advanced-toggle:hover {
          color: #764ba2;
        }
        
        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }
        
        .reset-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          color: #636e72;
          font-size: 14px;
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
          gap: 8px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .generate-custom-button:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        }
        
        .generate-custom-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* 生成結果 */
        .generated-themes {
          margin-top: 20px;
          display: grid;
          gap: 16px;
        }
        
        .generated-theme {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.2s ease;
        }
        
        .generated-theme:hover {
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .generated-theme-title {
          font-size: 18px;
          font-weight: 600;
          color: #2d3436;
          margin-bottom: 8px;
        }
        
        .generated-theme-description {
          color: #636e72;
          line-height: 1.6;
          margin-bottom: 12px;
          white-space: pre-wrap;
        }
        
        .generated-theme-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .theme-tag {
          padding: 4px 12px;
          background: #f0f0f0;
          border-radius: 16px;
          font-size: 12px;
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
        
        .save-theme-button {
          width: 100%;
          padding: 10px 20px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .save-theme-button:hover {
          background: #764ba2;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        /* テーマリスト */
        .theme-list {
          display: grid;
          gap: 16px;
        }
        
        .theme-item {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .theme-item:hover {
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
        
        .theme-item-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        
        .theme-item-title {
          font-size: 18px;
          font-weight: 600;
          color: #2d3436;
          flex: 1;
        }
        
        .theme-item-meta {
          display: flex;
          gap: 8px;
        }
        
        .theme-item-description {
          color: #636e72;
          line-height: 1.6;
          margin-bottom: 12px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .theme-item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .theme-item-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .theme-item-action {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #667eea;
          font-size: 14px;
          font-weight: 500;
        }
        
        /* クイックスタート */
        .quick-start-section {
          text-align: center;
          margin-top: 32px;
        }
        
        .quick-start-button {
          display: inline-block;
          background: #6c5ce7;
          color: white;
          border: none;
          border-radius: 16px;
          padding: 16px 32px;
          font-size: 16px;
          font-weight: 600;
          box-shadow: 0 8px 24px rgba(108, 92, 231, 0.3);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .quick-start-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(108, 92, 231, 0.4);
        }
      `}</style>

      <main className="main-content">
        <button className="back-button" onClick={() => router.push('/secondary-exam')}>
          <ArrowLeft size={18} />
          二次試験対策に戻る
        </button>

        <div className="greeting-section">
          <div className="greeting">小論文対策</div>
          <div className="date">論理的思考力と文章力を鍛えよう</div>
        </div>

        {/* アクションカード */}
        <div className="action-cards">
          <div className="themes-card action-card" onClick={() => router.push('/essay/themes')}>
            <div className="action-card-header">
              <div className="action-card-title-section">
                <div className="action-card-label">豊富なテーマ</div>
                <div className="action-card-title">テーマ一覧</div>
              </div>
              <div className="action-card-icon">
                <BookOpen size={24} />
              </div>
            </div>
            <div className="action-card-content">
              <p className="action-card-description">
                学部別・カテゴリ別に整理された豊富なテーマから選択できます
              </p>
              <button className="action-button">
                テーマを見る
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="trends-card action-card" onClick={() => router.push('/essay/generate')}>
            <div className="action-card-header">
              <div className="action-card-title-section">
                <div className="action-card-label">AI生成</div>
                <div className="action-card-title">テーマ生成</div>
              </div>
              <div className="action-card-icon">
                <Sparkles size={24} />
              </div>
            </div>
            <div className="action-card-content">
              <p className="action-card-description">
                AIが最新トレンドを踏まえた小論文テーマを自動生成します
              </p>
              <button className="action-button trends">
                テーマを生成
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="history-card action-card" onClick={() => router.push('/essay/history')}>
            <div className="action-card-header">
              <div className="action-card-title-section">
                <div className="action-card-label">成長の記録</div>
                <div className="action-card-title">執筆履歴</div>
              </div>
              <div className="action-card-icon">
                <BarChart3 size={24} />
              </div>
            </div>
            <div className="action-card-content">
              <p className="action-card-description">
                過去の小論文と評価を確認して、着実な成長を実感しましょう
              </p>
              <button className="action-button history">
                履歴を見る
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="stats-section">
          <h2 className="section-title">執筆実績</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalEssays}</div>
              <div className="stat-label">総執筆数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.averageScore}</div>
              <div className="stat-label">平均スコア</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.streakDays}</div>
              <div className="stat-label">連続日数</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.weeklyEssays}</div>
              <div className="stat-label">今週の執筆</div>
            </div>
          </div>
        </div>

        {/* テーマ選択セクション */}
        <div className="theme-selection-section">
          <div className="theme-selection-header">
            <h2 className="theme-selection-title">小論文テーマを選ぶ</h2>
            <p className="theme-selection-description">
              練習したいテーマを選択、または新しいテーマを生成してください
            </p>
          </div>
          
          {/* カスタムテーマ作成ボタン */}
          {!showCustomForm && (
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <button
                onClick={() => setShowCustomForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <Sparkles size={20} />
                カスタムテーマを作成
              </button>
            </div>
          )}
          
          {/* カスタムテーマ生成フォーム */}
          {showCustomForm && (
            <div className="custom-form-section">
              <div className="custom-form-header">
                <h3 className="custom-form-title">カスタムテーマ作成</h3>
                <button onClick={() => setShowCustomForm(false)} className="close-button">
                  <X size={20} />
                </button>
              </div>
              
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">
                    テーマ・トピック <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={customOptions.topic}
                    onChange={(e) => setCustomOptions({ ...customOptions, topic: e.target.value })}
                    placeholder="例：AIと人間の共存、地球温暖化対策、教育格差..."
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">カテゴリー</label>
                  <select
                    value={customOptions.category}
                    onChange={(e) => setCustomOptions({ ...customOptions, category: e.target.value })}
                    className="form-select"
                  >
                    {categories.slice(1).map(cat => (
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
                    <option value="">指定なし</option>
                    {faculties.slice(1).map(fac => (
                      <option key={fac.value} value={fac.value}>{fac.label}</option>
                    ))}
                  </select>
                </div>
                
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
                
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
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
                
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="includeGraph"
                      checked={customOptions.includeGraph}
                      onChange={(e) => setCustomOptions({ ...customOptions, includeGraph: e.target.checked })}
                      className="form-checkbox"
                    />
                    <label htmlFor="includeGraph" className="form-label" style={{ marginBottom: 0 }}>
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
                <Settings size={16} />
                詳細設定
                <ChevronDown size={16} style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              
              {showAdvanced && (
                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label">その他の要望（任意）</label>
                  <textarea
                    value={customOptions.specificRequirements}
                    onChange={(e) => setCustomOptions({ ...customOptions, specificRequirements: e.target.value })}
                    placeholder="例：具体的な事例を含める、比較の観点を入れる、最新のデータを使用..."
                    className="form-textarea"
                  />
                </div>
              )}
              
              <div className="form-actions">
                <button onClick={resetCustomOptions} className="reset-button">
                  <RotateCcw size={16} />
                  リセット
                </button>
                <button
                  onClick={generateCustomTheme}
                  disabled={isGenerating || !customOptions.topic.trim()}
                  className="generate-custom-button"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      テーマを生成
                    </>
                  )}
                </button>
              </div>
              
              {/* 生成結果 */}
              {generatedThemes.length > 0 && (
                <div className="generated-themes">
                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    生成されたテーマ（{generatedThemes.length}件）
                  </h4>
                  {generatedThemes.map((theme, index) => (
                    <div key={index} className="generated-theme">
                      <h5 className="generated-theme-title">{theme.title}</h5>
                      <p className="generated-theme-description">{theme.description}</p>
                      <div className="generated-theme-tags">
                        <span className="theme-tag purple">{theme.wordLimit}字</span>
                        <span className="theme-tag blue">{theme.timeLimit}分</span>
                        <span className="theme-tag green">難易度 {theme.difficulty}</span>
                        {theme.hasGraph && <span className="theme-tag orange">グラフ問題</span>}
                      </div>
                      <button onClick={() => saveTheme(theme)} className="save-theme-button">
                        このテーマを保存して練習する
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* フィルター */}
          {themes.length > 0 && (
            <div className="filter-section">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="filter-select"
              >
                {faculties.map(fac => (
                  <option key={fac.value} value={fac.value}>{fac.label}</option>
                ))}
              </select>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="filter-select"
              >
                {themeTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              
              <div style={{ marginLeft: 'auto', color: '#636e72', fontSize: '14px' }}>
                {filteredThemes.length}件のテーマ
              </div>
            </div>
          )}
          
          {/* テーマ一覧 */}
          {isLoading ? (
            <div className="theme-loading">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : filteredThemes.length > 0 ? (
            <div className="theme-list">
              {filteredThemes.map((theme) => (
                <div key={theme.id} className="theme-item" onClick={() => handleSelectTheme(theme)}>
                  <div className="theme-item-header">
                    <h3 className="theme-item-title">{theme.title}</h3>
                    <div className="theme-item-meta">
                      {theme.hasGraph && <span className="theme-tag orange">グラフ</span>}
                    </div>
                  </div>
                  <p className="theme-item-description">{theme.description}</p>
                  <div className="theme-item-footer">
                    <div className="theme-item-tags">
                      <span className="theme-tag">{theme.wordLimit}字</span>
                      <span className="theme-tag">{theme.timeLimit}分</span>
                      <span className="theme-tag">難易度 {theme.difficulty}</span>
                      <span className="theme-tag purple">{categories.find(c => c.value === theme.category)?.label}</span>
                    </div>
                    <div className="theme-item-action">
                      執筆する
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : themes.length === 0 ? (
            <div className="theme-empty">
              <p className="theme-empty-text">まだテーマがありません</p>
              <button 
                onClick={() => router.push('/essay/generate')}
                className="generate-button"
              >
                AIでテーマを生成
              </button>
            </div>
          ) : (
            <div className="theme-empty">
              <p className="theme-empty-text">条件に一致するテーマがありません</p>
            </div>
          )}
        </div>

        {/* クイックスタート */}
        <div className="quick-start-section">
          <button className="quick-start-button" onClick={() => router.push('/secondary-exam')}>
            二次試験対策トップに戻る →
          </button>
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