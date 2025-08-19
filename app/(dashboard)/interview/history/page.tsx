'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { interviewService } from '@/lib/firebase/interview-service';
import { BarChart3, TrendingUp, Clock, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { InterviewPractice } from '@/lib/firebase/types';

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<InterviewPractice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchHistory();
    }
  }, [user, authLoading, selectedPeriod, router]);

  const fetchHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await interviewService.getPracticeHistory(user.uid);
      
      // 期間でフィルタリング
      let filteredData = data;
      const now = new Date();
      
      if (selectedPeriod === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filteredData = data.filter(item => 
          new Date(item.createdAt).getTime() >= weekAgo.getTime()
        );
      } else if (selectedPeriod === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filteredData = data.filter(item => 
          new Date(item.createdAt).getTime() >= monthAgo.getTime()
        );
      }

      setHistory(filteredData);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalPractices: history.length,
    averageScore: history.length > 0
      ? Math.round(history.reduce((acc, h) => acc + (h.evaluationScore || 0), 0) / history.length)
      : 0,
    totalTime: history.reduce((acc, h) => acc + (h.durationSeconds || 0), 0),
    improvement: calculateImprovement(),
  };

  function calculateImprovement() {
    if (history.length < 2) return 0;
    const recent = history.slice(0, 5).reduce((acc, h) => acc + (h.evaluationScore || 0), 0) / 5;
    const older = history.slice(-5).reduce((acc, h) => acc + (h.evaluationScore || 0), 0) / 5;
    return Math.round(recent - older);
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}分${secs}秒`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .main-content {
          padding: 12px;
          max-width: 100%;
          margin: 0 auto;
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
        
        .page-header {
          margin-bottom: 20px;
        }
        
        .page-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        
        .page-description {
          font-size: 12px;
          color: #636e72;
        }
        
        /* 統計カード */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .stat-card {
          background: white;
          border-radius: 10px;
          padding: 12px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
          position: relative;
          overflow: hidden;
        }
        
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
        }
        
        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .stat-title {
          font-size: 11px;
          font-weight: 500;
          color: #636e72;
        }
        
        .stat-icon {
          color: #4facfe;
        }
        
        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: #2d3436;
          margin-bottom: 2px;
        }
        
        .stat-unit {
          font-size: 11px;
          color: #636e72;
        }
        
        .improvement-positive {
          color: #00b894;
        }
        
        .improvement-negative {
          color: #ff6b6b;
        }
        
        /* 履歴セクション */
        .history-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .history-header {
          margin-bottom: 16px;
        }
        
        .history-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .history-description {
          font-size: 11px;
          color: #636e72;
        }
        
        .period-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
          padding: 3px;
          background: #f8f9fa;
          border-radius: 6px;
        }
        
        .period-tab {
          flex: 1;
          background: transparent;
          border: none;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          color: #636e72;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .period-tab:hover {
          background: #e9ecef;
        }
        
        .period-tab.active {
          background: white;
          color: #2d3436;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .practice-item {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .practice-item:hover {
          background: #e9ecef;
          transform: translateX(2px);
        }
        
        .practice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .practice-content {
          flex: 1;
        }
        
        .practice-question {
          font-size: 13px;
          font-weight: 600;
          color: #2d3436;
          margin-bottom: 4px;
          line-height: 1.3;
        }
        
        .practice-date {
          font-size: 11px;
          color: #636e72;
        }
        
        .practice-score {
          text-align: right;
        }
        
        .score-value {
          font-size: 18px;
          font-weight: 700;
          color: #2d3436;
        }
        
        .score-unit {
          font-size: 11px;
          color: #636e72;
          font-weight: normal;
        }
        
        .practice-duration {
          font-size: 11px;
          color: #636e72;
        }
        
        .practice-mode {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 500;
          margin-top: 4px;
        }
        
        .mode-normal {
          background: #e3f2fd;
          color: #1976d2;
        }
        
        .mode-karaoke {
          background: #ffedf0;
          color: #f5576c;
        }
        
        .empty-state {
          text-align: center;
          padding: 32px;
          color: #636e72;
          font-size: 13px;
        }
        
        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #4facfe;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 32px auto;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <main className="main-content">
        <button className="back-button" onClick={() => router.push('/interview')}>
          <ArrowLeft size={14} />
          面接対策に戻る
        </button>

        <div className="page-header">
          <h1 className="page-title">練習履歴</h1>
          <p className="page-description">
            これまでの練習結果と成長を確認しましょう
          </p>
        </div>

        {/* 統計情報 */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">総練習回数</span>
              <BarChart3 size={14} className="stat-icon" />
            </div>
            <div className="stat-value">{stats.totalPractices}</div>
            <div className="stat-unit">回</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">平均スコア</span>
              <TrendingUp size={14} className="stat-icon" />
            </div>
            <div className="stat-value">{stats.averageScore}</div>
            <div className="stat-unit">点</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">総練習時間</span>
              <Clock size={14} className="stat-icon" />
            </div>
            <div className="stat-value">{Math.floor(stats.totalTime / 60)}</div>
            <div className="stat-unit">分</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">スコア改善</span>
              <TrendingUp size={14} className="stat-icon" />
            </div>
            <div className={`stat-value ${stats.improvement >= 0 ? 'improvement-positive' : 'improvement-negative'}`}>
              {stats.improvement > 0 ? '+' : ''}{stats.improvement}
            </div>
            <div className="stat-unit">点</div>
          </div>
        </div>

        {/* 履歴一覧 */}
        <div className="history-card">
          <div className="history-header">
            <h2 className="history-title">練習記録</h2>
            <p className="history-description">
              過去の練習内容と評価を確認できます
            </p>
          </div>

          <div className="period-tabs">
            <button
              className={`period-tab ${selectedPeriod === 'week' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('week')}
            >
              過去1週間
            </button>
            <button
              className={`period-tab ${selectedPeriod === 'month' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('month')}
            >
              過去1ヶ月
            </button>
            <button
              className={`period-tab ${selectedPeriod === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedPeriod('all')}
            >
              すべて
            </button>
          </div>

          <div className="history-list">
            {loading ? (
              <div className="loading-spinner"></div>
            ) : history.length === 0 ? (
              <div className="empty-state">
                練習履歴がありません
              </div>
            ) : (
              history.map((practice) => (
                <div key={practice.id} className="practice-item">
                  <div className="practice-header">
                    <div className="practice-content">
                      <div className="practice-question">
                        {practice.questionText}
                      </div>
                      <div className="practice-date">
                        {format(new Date(practice.createdAt), 'MM/dd HH:mm', { locale: ja })}
                      </div>
                      <span className={`practice-mode ${practice.mode === 'karaoke' ? 'mode-karaoke' : 'mode-normal'}`}>
                        {practice.mode === 'karaoke' ? 'カラオケ' : '通常'}
                      </span>
                    </div>
                    <div className="practice-score">
                      <div className="score-value">
                        {practice.evaluationScore || '-'}
                        <span className="score-unit">/100</span>
                      </div>
                      <div className="practice-duration">
                        {formatDuration(practice.durationSeconds || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}