'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  RotateCcw, 
  Send, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  Target, 
  Users, 
  BookOpen, 
  Briefcase, 
  TrendingUp, 
  X, 
  CheckCircle,
  ArrowLeft,
  PlayCircle,
  BarChart3
} from 'lucide-react';

export default function InterviewPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Categories data
  const categories = [
    { id: 'all', label: '全て', icon: Sparkles },
    { id: 'personal', label: '自己紹介', icon: Users },
    { id: 'motivation', label: '志望動機', icon: Target },
    { id: 'experience', label: '経験・スキル', icon: Briefcase },
    { id: 'study', label: '学習・成長', icon: BookOpen },
    { id: 'future', label: '将来展望', icon: TrendingUp },
  ];

  // Sample questions data
  const questions = [
    {
      id: 1,
      category: 'personal',
      question: '自己紹介をお願いします',
      difficulty: 'easy',
      tags: ['基本', '必須'],
    },
    {
      id: 2,
      category: 'motivation',
      question: 'なぜ英検を受験しようと思ったのですか？',
      difficulty: 'easy',
      tags: ['動機', '基本'],
    },
    {
      id: 3,
      category: 'experience',
      question: '英語を使った経験について教えてください',
      difficulty: 'medium',
      tags: ['経験', '実践'],
    },
    {
      id: 4,
      category: 'study',
      question: '英語学習で工夫していることは何ですか？',
      difficulty: 'medium',
      tags: ['学習法', '工夫'],
    },
    {
      id: 5,
      category: 'future',
      question: '英語を使って将来何をしたいですか？',
      difficulty: 'hard',
      tags: ['将来', 'ビジョン'],
    },
  ];

  // Filter questions based on selected category
  const filteredQuestions = selectedCategory === 'all' 
    ? questions 
    : questions.filter(q => q.category === selectedCategory);

  return (
    <>
      <style jsx>{`
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
        
        /* 練習モードカード */
        .practice-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }
        
        .normal-practice-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .normal-practice-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
        }
        
        .karaoke-practice-card {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 8px 24px rgba(240, 147, 251, 0.3);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .karaoke-practice-card:hover {
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
        
        .practice-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 200px;
          height: 200px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }
        
        .practice-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }
        
        .practice-card-title-section {
          color: white;
        }
        
        .practice-card-label {
          font-size: 12px;
          font-weight: 500;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        
        .practice-card-title {
          font-size: 24px;
          font-weight: 700;
        }
        
        .practice-card-icon {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 12px;
          border-radius: 50%;
          color: white;
        }
        
        .practice-card-content {
          position: relative;
          z-index: 1;
        }
        
        .practice-card-description {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        
        .practice-button {
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
        
        .practice-button:hover {
          transform: scale(1.02);
        }
        
        .practice-button.karaoke {
          color: #f093fb;
        }
        
        .practice-button.history {
          color: #4facfe;
        }
        
        /* カテゴリータブ */
        .category-tabs {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          margin-bottom: 24px;
        }
        
        .category-header {
          margin-bottom: 20px;
        }
        
        .category-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .category-description {
          font-size: 14px;
          color: #636e72;
        }
        
        .category-list {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          overflow-x: auto;
          padding-bottom: 8px;
        }
        
        .category-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8f9fa;
          border: 2px solid transparent;
          padding: 10px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: #636e72;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        
        .category-button:hover {
          background: #e9ecef;
        }
        
        .category-button.active {
          background: white;
          border-color: #6c5ce7;
          color: #6c5ce7;
        }
        
        /* 質問リスト */
        .questions-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .question-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .question-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
        
        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        
        .question-text {
          font-size: 16px;
          font-weight: 600;
          color: #2d3436;
          margin-bottom: 12px;
        }
        
        .question-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .question-tag {
          background: #f0f4ff;
          color: #6c5ce7;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .difficulty-badge {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }
        
        .difficulty-easy {
          background: #d4edda;
          color: #155724;
        }
        
        .difficulty-medium {
          background: #fff3cd;
          color: #856404;
        }
        
        .difficulty-hard {
          background: #f8d7da;
          color: #721c24;
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
        
        /* モバイル版デザイン */
        @media (max-width: 768px) {
          .main-content {
            padding: 16px 12px;
            max-width: 100%;
          }
          
          /* 戻るボタン */
          .back-button {
            padding: 8px 12px;
            font-size: 12px;
            gap: 6px;
            border-radius: 6px;
            margin-bottom: 16px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          }
          
          .back-button svg {
            width: 14px;
            height: 14px;
          }
          
          /* グリーティングセクション */
          .greeting-section {
            text-align: center;
            margin-bottom: 16px;
          }
          
          .greeting {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 2px;
          }
          
          .date {
            font-size: 11px;
            opacity: 0.7;
          }
          
          /* 練習モードカード - 1列表示 */
          .practice-cards {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 20px;
          }
          
          .normal-practice-card,
          .karaoke-practice-card,
          .history-card {
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          
          .practice-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }
          
          .practice-card-label {
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          
          .practice-card-title {
            font-size: 18px;
            font-weight: 700;
          }
          
          .practice-card-icon {
            background: rgba(255, 255, 255, 0.2);
            padding: 8px;
            border-radius: 50%;
          }
          
          .practice-card-icon svg {
            width: 18px;
            height: 18px;
          }
          
          .practice-card-description {
            font-size: 11px;
            margin-bottom: 12px;
            line-height: 1.5;
            opacity: 0.95;
          }
          
          .practice-button {
            padding: 10px 16px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            gap: 6px;
          }
          
          .practice-button svg {
            width: 14px;
            height: 14px;
          }
          
          /* カテゴリータブ */
          .category-tabs {
            background: white;
            border-radius: 12px;
            padding: 16px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.06);
            margin-bottom: 16px;
          }
          
          .category-header {
            margin-bottom: 12px;
          }
          
          .category-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 4px;
          }
          
          .category-description {
            font-size: 11px;
            color: #636e72;
            line-height: 1.4;
          }
          
          /* カテゴリーリスト - 横スクロール */
          .category-list {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
            overflow-x: auto;
            padding-bottom: 4px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          
          .category-list::-webkit-scrollbar {
            display: none;
          }
          
          .category-button {
            display: flex;
            align-items: center;
            gap: 6px;
            background: #f8f9fa;
            border: 1.5px solid transparent;
            padding: 8px 14px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 500;
            white-space: nowrap;
            flex-shrink: 0;
          }
          
          .category-button svg {
            width: 14px;
            height: 14px;
          }
          
          .category-button.active {
            background: white;
            border-color: #6c5ce7;
            color: #6c5ce7;
          }
          
          /* 質問リスト */
          .questions-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          
          .question-card {
            background: white;
            border-radius: 10px;
            padding: 14px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          }
          
          .question-header {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          
          .question-text {
            font-size: 13px;
            font-weight: 600;
            color: #2d3436;
            margin-bottom: 8px;
            line-height: 1.4;
          }
          
          .question-tags {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
          }
          
          .question-tag {
            background: #f0f4ff;
            color: #6c5ce7;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 500;
          }
          
          .difficulty-badge {
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 600;
            align-self: flex-start;
          }
          
          /* クイックスタート */
          .quick-start-section {
            text-align: center;
            margin-top: 20px;
            padding-bottom: 20px;
          }
          
          .quick-start-button {
            display: inline-block;
            background: #6c5ce7;
            color: white;
            border: none;
            border-radius: 10px;
            padding: 12px 20px;
            font-size: 13px;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(108, 92, 231, 0.25);
          }
        }
        
        /* 小さいスマホ対応 (iPhone SE等) */
        @media (max-width: 375px) {
          .main-content {
            padding: 12px 10px;
          }
          
          .greeting {
            font-size: 18px;
          }
          
          .practice-cards {
            gap: 10px;
          }
          
          .normal-practice-card,
          .karaoke-practice-card,
          .history-card {
            padding: 14px;
          }
          
          .practice-card-title {
            font-size: 16px;
          }
          
          .practice-card-description {
            font-size: 10px;
          }
          
          .category-tabs {
            padding: 14px;
          }
          
          .question-card {
            padding: 12px;
          }
          
          .question-text {
            font-size: 12px;
          }
        }
      `}</style>

      <main className="main-content">
        <button className="back-button" onClick={() => router.push('/secondary-exam')}>
          <ArrowLeft size={18} />
          二次試験対策に戻る
        </button>

        <div className="greeting-section">
          <div className="greeting">面接対策</div>
          <div className="date">実践的な練習で自信をつけよう</div>
        </div>

        {/* 練習モードカード */}
        <div className="practice-cards">
          <div className="normal-practice-card practice-card" onClick={() => router.push('/interview/practice')}>
            <div className="practice-card-header">
              <div className="practice-card-title-section">
                <div className="practice-card-label">自分のペースで</div>
                <div className="practice-card-title">通常練習</div>
              </div>
              <div className="practice-card-icon">
                <Mic size={24} />
              </div>
            </div>
            <div className="practice-card-content">
              <p className="practice-card-description">
                自分のペースで面接の練習ができます。じっくり考えながら回答を準備しましょう
              </p>
              <button className="practice-button">
                練習を始める
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="karaoke-practice-card practice-card" onClick={() => router.push('/interview/karaoke-practice')}>
            <div className="practice-card-header">
              <div className="practice-card-title-section">
                <div className="practice-card-label">理想的なペースで</div>
                <div className="practice-card-title">カラオケ練習</div>
              </div>
              <div className="practice-card-icon">
                <PlayCircle size={24} />
              </div>
            </div>
            <div className="practice-card-content">
              <p className="practice-card-description">
                理想的なペースで話す練習ができます。本番を想定した実践的なトレーニング
              </p>
              <button className="practice-button karaoke">
                練習を始める
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="history-card practice-card" onClick={() => router.push('/interview/history')}>
            <div className="practice-card-header">
              <div className="practice-card-title-section">
                <div className="practice-card-label">成長を確認</div>
                <div className="practice-card-title">練習履歴</div>
              </div>
              <div className="practice-card-icon">
                <BarChart3 size={24} />
              </div>
            </div>
            <div className="practice-card-content">
              <p className="practice-card-description">
                これまでの練習結果を確認できます。成長の軌跡を振り返りましょう
              </p>
              <button className="practice-button history">
                履歴を見る
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* カテゴリータブと質問一覧 */}
        <div className="category-tabs">
          <div className="category-header">
            <h2 className="category-title">練習問題</h2>
            <p className="category-description">
              カテゴリーを選択して、練習したい質問を見つけましょう
            </p>
          </div>

          <div className="category-list">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  className={`category-button ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <Icon size={18} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="questions-list">
            {filteredQuestions.map((question) => (
              <div
                key={question.id}
                className="question-card"
                onClick={() => router.push(`/interview/practice/${question.id}`)}
              >
                <div className="question-header">
                  <div>
                    <div className="question-text">{question.question}</div>
                    <div className="question-tags">
                      {question.tags.map((tag) => (
                        <span key={tag} className="question-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span 
                    className={`difficulty-badge ${
                      question.difficulty === 'easy' ? 'difficulty-easy' :
                      question.difficulty === 'medium' ? 'difficulty-medium' :
                      'difficulty-hard'
                    }`}
                  >
                    {question.difficulty === 'easy' && '初級'}
                    {question.difficulty === 'medium' && '中級'}
                    {question.difficulty === 'hard' && '上級'}
                  </span>
                </div>
              </div>
            ))}
          </div>
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