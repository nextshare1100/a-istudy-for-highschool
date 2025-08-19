// app/(dashboard)/interview/karaoke-custom/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Clock, Target, BookOpen, Mic, BarChart3, Plus, Edit2, Trash2 } from 'lucide-react';
import styles from './styles.module.css';

// カスタム質問の型定義
interface CustomQuestion {
  id: string;
  question: string;
  answer: string;
  duration: number;
  createdAt: any;
  userId?: string;
}

// 固定質問の型定義
interface FixedQuestion {
  id: string;
  category: string;
  question: string;
  placeholder: string;
}

// 固定質問データ
const fixedQuestions: FixedQuestion[] = [
  {
    id: 'motivation-1',
    category: 'motivation',
    question: 'なぜ本学を志望したのですか？',
    placeholder: '例：貴学の○○学部では、実践的な学びを通じて専門知識を身につけることができると考えたからです。特に、○○研究室での研究内容に魅力を感じ...'
  },
  {
    id: 'self_pr-1',
    category: 'self_pr',
    question: '自己PRをしてください',
    placeholder: '例：私の強みは粘り強さです。高校時代、数学の難問に3か月間取り組み続け、独自の解法を発見しました。この経験から...'
  },
  {
    id: 'student_life-1',
    category: 'student_life',
    question: '高校生活で最も力を入れたことは何ですか？',
    placeholder: '例：生徒会活動に最も力を入れました。副会長として文化祭の企画運営を担当し、全校生徒が参加しやすい新しい企画を導入しました...'
  },
  {
    id: 'future_goals-1',
    category: 'future_goals',
    question: '将来はどのような職業に就きたいですか？',
    placeholder: '例：将来は医師として地域医療に貢献したいです。祖父の闘病経験から、患者さんに寄り添える医師を目指しています...'
  },
  {
    id: 'academic-1',
    category: 'academic',
    question: '最近気になるニュースは何ですか？',
    placeholder: '例：生成AIの教育現場での活用に関するニュースに注目しています。AIツールが学習支援に使われ始めていますが...'
  }
];

export default function KaraokeCustomPage() {
  // States - すべてのフックを条件なしで宣言
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('motivation');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<CustomQuestion | null>(null);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [customAnswerText, setCustomAnswerText] = useState('');
  const [customDuration, setCustomDuration] = useState<number>(60);
  const [answerTexts, setAnswerTexts] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);

  // 認証チェック
  useEffect(() => {
    const timer = setTimeout(() => {
      setUser({ uid: 'demo-user-id' });
      setAuthLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // データ読み込み
  useEffect(() => {
    if (!authLoading && user) {
      loadCustomQuestions();
      loadAnswerTexts();
    }
  }, [user, authLoading]);

  const loadCustomQuestions = () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const saved = localStorage.getItem(`customQuestions_${user.uid}`);
      if (saved) {
        setCustomQuestions(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load custom questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnswerTexts = () => {
    if (!user) return;
    
    try {
      const saved = localStorage.getItem(`answerTexts_${user.uid}`);
      if (saved) {
        setAnswerTexts(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load answer texts:', error);
    }
  };

  const saveAnswerText = (questionId: string, text: string) => {
    if (!user) return;
    
    const updated = { ...answerTexts, [questionId]: text };
    setAnswerTexts(updated);
    localStorage.setItem(`answerTexts_${user.uid}`, JSON.stringify(updated));
  };

  const saveCustomQuestion = () => {
    if (!user) {
      alert('ログインが必要です');
      return;
    }

    try {
      setLoading(true);
      
      const newQuestion: CustomQuestion = {
        id: editingQuestion?.id || Date.now().toString(),
        question: customQuestionText,
        answer: customAnswerText,
        duration: customDuration,
        createdAt: editingQuestion?.createdAt || new Date(),
        userId: user.uid,
      };

      let updatedQuestions;
      if (editingQuestion) {
        updatedQuestions = customQuestions.map(q => 
          q.id === editingQuestion.id ? newQuestion : q
        );
      } else {
        updatedQuestions = [newQuestion, ...customQuestions];
      }

      setCustomQuestions(updatedQuestions);
      localStorage.setItem(`customQuestions_${user.uid}`, JSON.stringify(updatedQuestions));
      
      // モーダルを閉じる
      setShowCustomModal(false);
      setEditingQuestion(null);
      setCustomQuestionText('');
      setCustomAnswerText('');
      setCustomDuration(60);
    } catch (error) {
      console.error('Failed to save custom question:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomQuestion = (id: string) => {
    if (!user) return;
    
    if (!confirm('この質問を削除してもよろしいですか？')) {
      return;
    }

    try {
      setLoading(true);
      
      const updatedQuestions = customQuestions.filter(q => q.id !== id);
      setCustomQuestions(updatedQuestions);
      localStorage.setItem(`customQuestions_${user.uid}`, JSON.stringify(updatedQuestions));
    } catch (error) {
      console.error('Failed to delete custom question:', error);
      alert('削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const startPractice = (question: string, answer: string, duration?: number) => {
    const params = new URLSearchParams({
      question: question,
      answer: answer,
      duration: duration?.toString() || '60'
    });
    
    if (typeof window !== 'undefined') {
      window.location.href = `/interview/karaoke-practice/session?${params.toString()}`;
    }
  };

  const categories = [
    { id: 'motivation', label: '志望理由', icon: Target },
    { id: 'self_pr', label: '自己PR', icon: Mic },
    { id: 'student_life', label: '高校生活', icon: Clock },
    { id: 'future_goals', label: '将来の目標', icon: BarChart3 },
    { id: 'academic', label: '学業・時事', icon: BookOpen },
    { id: 'custom', label: 'その他', icon: Plus },
  ];

  const currentFixedQuestion = fixedQuestions.find(q => q.category === selectedCategory);

  // ローディング表示
  if (authLoading || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
      </div>
    );
  }

  // メインコンテンツ
  return (
    <div className={styles.mainContent}>
      <button className={styles.backButton} onClick={() => window.history.back()}>
        <ArrowLeft size={18} />
        面接対策に戻る
      </button>

      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>大学入試面接 カラオケ式練習</h1>
        <p className={styles.pageDescription}>
          理想的なペースで話す練習ができます。志望理由や自己PRを時間内に話せるようになりましょう。
        </p>
      </div>

      <div className={styles.categoryTabs}>
        <div className={styles.categoryList}>
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                className={`${styles.categoryButton} ${selectedCategory === category.id ? styles.active : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <Icon size={18} />
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.questionsContainer}>
        {selectedCategory === 'custom' ? (
          <>
            {customQuestions.map((question) => (
              <div key={question.id} className={styles.customQuestionCard}>
                <div className={styles.customQuestionHeader}>
                  <div>
                    <h3 className={styles.questionText}>{question.question}</h3>
                    <div className={styles.questionMeta}>
                      <span className={styles.questionMetaItem}>
                        <Clock size={16} />
                        {question.answer.length}文字
                      </span>
                      <span className={styles.questionMetaItem}>
                        <Target size={16} />
                        {question.duration}秒
                      </span>
                    </div>
                  </div>
                  <div className={styles.customQuestionActions}>
                    <button
                      className={styles.iconButton}
                      onClick={() => {
                        setEditingQuestion(question);
                        setCustomQuestionText(question.question);
                        setCustomAnswerText(question.answer);
                        setCustomDuration(question.duration || 60);
                        setShowCustomModal(true);
                      }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className={`${styles.iconButton} ${styles.delete}`}
                      onClick={() => deleteCustomQuestion(question.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      className={styles.practiceButton}
                      onClick={() => startPractice(question.question, question.answer, question.duration)}
                    >
                      <Play size={16} />
                      練習開始
                    </button>
                  </div>
                </div>
                <div className={styles.customAnswerPreview}>
                  {question.answer}
                </div>
              </div>
            ))}
            
            <button 
              className={styles.addCustomButton}
              onClick={() => {
                setEditingQuestion(null);
                setCustomQuestionText('');
                setCustomAnswerText('');
                setCustomDuration(60);
                setShowCustomModal(true);
              }}
            >
              <Plus size={24} />
              <span>カスタム質問を追加</span>
            </button>
          </>
        ) : (
          currentFixedQuestion && (
            <div className={styles.fixedQuestionCard}>
              <h2 className={styles.fixedQuestionTitle}>{currentFixedQuestion.question}</h2>
              <textarea
                className={styles.answerTextarea}
                value={answerTexts[currentFixedQuestion.id] || ''}
                onChange={(e) => saveAnswerText(currentFixedQuestion.id, e.target.value)}
                placeholder={currentFixedQuestion.placeholder}
              />
              <div className={styles.charCount}>
                {(answerTexts[currentFixedQuestion.id] || '').length}文字
              </div>
              <button
                className={styles.startPracticeButton}
                onClick={() => startPractice(
                  currentFixedQuestion.question,
                  answerTexts[currentFixedQuestion.id] || ''
                )}
                disabled={!(answerTexts[currentFixedQuestion.id] || '').trim()}
              >
                <Play size={20} />
                カラオケ練習を開始する
              </button>
            </div>
          )
        )}
      </div>

      <div className={styles.infoSection}>
        <h3 className={styles.infoTitle}>
          <Play size={20} />
          カラオケ式練習とは？
        </h3>
        <ul className={styles.infoList}>
          <li className={styles.infoItem}>
            理想的な話すペースを視覚的に確認しながら練習できます
          </li>
          <li className={styles.infoItem}>
            30秒、60秒、90秒、120秒の回答時間に合わせた練習が可能です
          </li>
          <li className={styles.infoItem}>
            リアルタイムでペースをチェックし、適切な速度で話せるようになります
          </li>
          <li className={styles.infoItem}>
            「その他」タブでは、自分で設定した質問と回答で練習できます（例：医学部の志望理由、看護学科を選んだ理由など）
          </li>
        </ul>
      </div>

      {showCustomModal && (
        <div 
          className={styles.modalOverlay}
          onClick={() => setShowCustomModal(false)}
        >
          <div 
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.modalHeader}>
              {editingQuestion ? '質問を編集' : 'カスタム質問を追加'}
            </h2>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>質問内容</label>
              <input
                type="text"
                className={styles.formInput}
                value={customQuestionText}
                onChange={(e) => setCustomQuestionText(e.target.value)}
                placeholder="例：なぜ本学を志望したのですか？"
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>回答文</label>
              <textarea
                className={styles.formTextarea}
                value={customAnswerText}
                onChange={(e) => setCustomAnswerText(e.target.value)}
                placeholder="練習したい回答文を入力してください"
              />
              <div className={styles.charCount}>
                {customAnswerText.length}文字
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>回答時間</label>
              <div className={styles.durationButtons}>
                {[30, 60, 90, 120].map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setCustomDuration(duration)}
                    className={`${styles.durationButton} ${customDuration === duration ? styles.active : ''}`}
                  >
                    {duration}秒
                  </button>
                ))}
              </div>
              <div className={styles.paceInfo}>
                推奨ペース: 約{Math.round((customAnswerText.length / customDuration) * 60)}文字/分
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button
                className={`${styles.modalButton} ${styles.cancel}`}
                onClick={() => setShowCustomModal(false)}
              >
                キャンセル
              </button>
              <button
                className={`${styles.modalButton} ${styles.save}`}
                onClick={saveCustomQuestion}
                disabled={!customQuestionText || !customAnswerText || loading}
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}