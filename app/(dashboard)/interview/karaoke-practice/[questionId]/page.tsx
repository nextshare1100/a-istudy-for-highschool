// app/(dashboard)/interview/karaoke-custom/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Clock, Target, BookOpen, Mic, BarChart3, Plus, Edit2, Trash2 } from 'lucide-react';

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
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #f093fb',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // メインコンテンツ
  return (
    <div style={{
      padding: '12px',
      maxWidth: '100%',
      margin: '0 auto'
    }}>
      <button 
        onClick={() => window.history.back()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#636e72',
          cursor: 'pointer',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          marginBottom: '16px',
          transition: 'all 0.2s ease'
        }}
      >
        <ArrowLeft size={14} />
        面接対策に戻る
      </button>

      <div style={{
        textAlign: 'center',
        marginBottom: '16px'
      }}>
        <h1 style={{
          fontSize: '18px',
          fontWeight: '700',
          marginBottom: '4px'
        }}>
          大学入試面接 カラオケ式練習
        </h1>
        <p style={{
          fontSize: '12px',
          color: '#636e72',
          lineHeight: '1.4'
        }}>
          理想的なペースで話す練習ができます。志望理由や自己PRを時間内に話せるようになりましょう。
        </p>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px'
        }}>
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  background: selectedCategory === category.id ? 'white' : '#f8f9fa',
                  border: `2px solid ${selectedCategory === category.id ? '#f093fb' : 'transparent'}`,
                  padding: '8px 6px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '500',
                  color: selectedCategory === category.id ? '#f093fb' : '#636e72',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={14} />
                {category.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {selectedCategory === 'custom' ? (
          <>
            {customQuestions.map((question) => (
              <div key={question.id} style={{
                background: 'white',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px',
                  gap: '8px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#2d3436',
                      marginBottom: '6px',
                      lineHeight: '1.3'
                    }}>
                      {question.question}
                    </h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#636e72',
                      fontSize: '11px',
                      marginBottom: '8px'
                    }}>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <Clock size={12} />
                        {question.answer.length}文字
                      </span>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <Target size={12} />
                        {question.duration}秒
                      </span>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '4px'
                  }}>
                    <button
                      onClick={() => {
                        setEditingQuestion(question);
                        setCustomQuestionText(question.question);
                        setCustomAnswerText(question.answer);
                        setCustomDuration(question.duration || 60);
                        setShowCustomModal(true);
                      }}
                      style={{
                        background: '#f8f9fa',
                        border: 'none',
                        padding: '6px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => deleteCustomQuestion(question.id)}
                      style={{
                        background: '#f8f9fa',
                        border: 'none',
                        padding: '6px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f8d7da';
                        e.currentTarget.style.color = '#721c24';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8f9fa';
                        e.currentTarget.style.color = 'inherit';
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                    <button
                      onClick={() => startPractice(question.question, question.answer, question.duration)}
                      style={{
                        background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Play size={12} />
                      練習開始
                    </button>
                  </div>
                </div>
                <div style={{
                  background: '#f8f9fa',
                  padding: '8px',
                  borderRadius: '6px',
                  color: '#636e72',
                  lineHeight: '1.4',
                  maxHeight: '60px',
                  overflow: 'hidden',
                  position: 'relative',
                  fontSize: '11px'
                }}>
                  {question.answer}
                  <div style={{
                    content: '""',
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    height: '16px',
                    background: 'linear-gradient(to bottom, transparent, #f8f9fa)'
                  }} />
                </div>
              </div>
            ))}
            
            <button
              onClick={() => {
                setEditingQuestion(null);
                setCustomQuestionText('');
                setCustomAnswerText('');
                setCustomDuration(60);
                setShowCustomModal(true);
              }}
              style={{
                width: '100%',
                background: 'white',
                border: '2px dashed #dee2e6',
                padding: '20px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                color: '#636e72',
                fontSize: '13px',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#f093fb';
                e.currentTarget.style.background = '#fdf9ff';
                e.currentTarget.style.color = '#f093fb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#dee2e6';
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.color = '#636e72';
              }}
            >
              <Plus size={20} />
              <span>カスタム質問を追加</span>
            </button>
          </>
        ) : (
          currentFixedQuestion && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <h2 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#2d3436',
                marginBottom: '12px'
              }}>
                {currentFixedQuestion.question}
              </h2>
              <textarea
                value={answerTexts[currentFixedQuestion.id] || ''}
                onChange={(e) => saveAnswerText(currentFixedQuestion.id, e.target.value)}
                placeholder={currentFixedQuestion.placeholder}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  minHeight: '150px',
                  resize: 'vertical',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#f093fb';
                  e.currentTarget.style.background = '#fafbfc';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e9ecef';
                  e.currentTarget.style.background = 'white';
                }}
              />
              <div style={{
                textAlign: 'right',
                fontSize: '11px',
                color: '#636e72',
                marginTop: '6px'
              }}>
                {(answerTexts[currentFixedQuestion.id] || '').length}文字
              </div>
              <button
                onClick={() => startPractice(
                  currentFixedQuestion.question,
                  answerTexts[currentFixedQuestion.id] || ''
                )}
                disabled={!(answerTexts[currentFixedQuestion.id] || '').trim()}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: !(answerTexts[currentFixedQuestion.id] || '').trim() ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '16px',
                  opacity: !(answerTexts[currentFixedQuestion.id] || '').trim() ? '0.5' : '1'
                }}
              >
                <Play size={16} />
                カラオケ練習を開始する
              </button>
            </div>
          )
        )}
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #ffedf0 0%, #fff5f6 100%)',
        borderRadius: '12px',
        padding: '16px',
        marginTop: '20px'
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: '#2d3436'
        }}>
          <Play size={16} style={{ color: '#f093fb' }} />
          カラオケ式練習とは？
        </h3>
        <ul style={{
          listStyle: 'none',
          padding: '0',
          margin: '0'
        }}>
          {[
            '理想的な話すペースを視覚的に確認しながら練習できます',
            '30秒、60秒、90秒、120秒の回答時間に合わせた練習が可能です',
            'リアルタイムでペースをチェックし、適切な速度で話せるようになります',
            '「その他」タブでは、自分で設定した質問と回答で練習できます（例：医学部の志望理由、看護学科を選んだ理由など）'
          ].map((item, index) => (
            <li key={index} style={{
              color: '#636e72',
              paddingLeft: '16px',
              position: 'relative',
              lineHeight: '1.5',
              marginBottom: '8px',
              fontSize: '11px'
            }}>
              <span style={{
                content: '""',
                position: 'absolute',
                left: '6px',
                color: '#f093fb',
                fontWeight: 'bold'
              }}>•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {showCustomModal && (
        <div
          onClick={() => setShowCustomModal(false)}
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '1000',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              maxWidth: '100%',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto'
            }}
          >
            <h2 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '16px'
            }}>
              {editingQuestion ? '質問を編集' : 'カスタム質問を追加'}
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                marginBottom: '6px',
                color: '#2d3436'
              }}>
                質問内容
              </label>
              <input
                type="text"
                value={customQuestionText}
                onChange={(e) => setCustomQuestionText(e.target.value)}
                placeholder="例：なぜ本学を志望したのですか？"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '2px solid #e9ecef',
                  borderRadius: '6px',
                  fontSize: '13px',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#f093fb';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e9ecef';
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                marginBottom: '6px',
                color: '#2d3436'
              }}>
                回答文
              </label>
              <textarea
                value={customAnswerText}
                onChange={(e) => setCustomAnswerText(e.target.value)}
                placeholder="練習したい回答文を入力してください"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '2px solid #e9ecef',
                  borderRadius: '6px',
                  fontSize: '13px',
                  minHeight: '120px',
                  resize: 'vertical',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#f093fb';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e9ecef';
                }}
              />
              <div style={{
                textAlign: 'right',
                fontSize: '11px',
                color: '#636e72',
                marginTop: '6px'
              }}>
                {customAnswerText.length}文字
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                marginBottom: '6px',
                color: '#2d3436'
              }}>
                回答時間
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px'
              }}>
                {[30, 60, 90, 120].map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setCustomDuration(duration)}
                    style={{
                      padding: '8px',
                      border: `2px solid ${customDuration === duration ? '#f093fb' : '#e9ecef'}`,
                      borderRadius: '6px',
                      background: customDuration === duration ? '#fdf9ff' : 'white',
                      color: customDuration === duration ? '#f093fb' : '#636e72',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontSize: '12px'
                    }}
                  >
                    {duration}秒
                  </button>
                ))}
              </div>
              <div style={{
                marginTop: '6px',
                fontSize: '11px',
                color: '#636e72'
              }}>
                推奨ペース: 約{Math.round((customAnswerText.length / customDuration) * 60)}文字/分
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '8px',
              marginTop: '20px'
            }}>
              <button
                onClick={() => setShowCustomModal(false)}
                style={{
                  flex: '1',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  background: '#f8f9fa',
                  color: '#636e72'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e9ecef';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8f9fa';
                }}
              >
                キャンセル
              </button>
              <button
                onClick={saveCustomQuestion}
                disabled={!customQuestionText || !customAnswerText || loading}
                style={{
                  flex: '1',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: (!customQuestionText || !customAnswerText || loading) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  opacity: (!customQuestionText || !customAnswerText || loading) ? '0.5' : '1'
                }}
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