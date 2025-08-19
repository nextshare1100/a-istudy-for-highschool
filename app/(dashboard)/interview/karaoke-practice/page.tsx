'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Clock, Target, Sparkles, BookOpen, Mic, BarChart3, Plus, Edit2, Trash2, Pause, RotateCcw } from 'lucide-react';

// カスタム質問の型定義
interface CustomQuestion {
  id: string;
  question: string;
  answer: string;
  duration: number; // 回答時間（秒）
  createdAt: Date;
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
    placeholder: '例：私が貴学の工学部情報工学科を志望する理由は三つあります。第一に、貴学には人工知能分野で日本をリードする研究室があり、最先端の技術を学べる環境が整っているからです。特に山田教授の自然言語処理研究室では、実社会の課題解決に直結する研究が行われており、私もその一員として貢献したいと考えています。第二に、産学連携プロジェクトが充実しており、在学中から実践的な経験を積むことができる点に魅力を感じています。昨年のオープンキャンパスで拝見した学生主体のAIスタートアップ支援プログラムは、まさに私が求めていた学びの形でした。第三に、貴学の建学の精神である「技術で社会に貢献する」という理念に強く共感したからです。私は将来、AIエンジニアとして高齢化社会の課題解決に取り組みたいと考えており、貴学での学びを通じてその夢を実現させたいです。'
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

export default function KaraokePracticePage() {
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('motivation');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<CustomQuestion | null>(null);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [customAnswerText, setCustomAnswerText] = useState('');
  const [customDuration, setCustomDuration] = useState<number>(60);
  const [answerTexts, setAnswerTexts] = useState<{ [key: string]: string }>({});
  const [showPracticeScreen, setShowPracticeScreen] = useState(false);
  const [practiceData, setPracticeData] = useState<{ question: string; answer: string; duration?: number } | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [isPlaying, setIsPlaying] = useState(false);

  // カラオケプロンプターのためのstate
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 練習画面用のテキスト処理
  const fullText = practiceData?.answer || '';
  const actualDuration = practiceData?.duration || selectedDuration;

  // 文章を自然な話すリズムで分割する関数（表示用）
  const splitIntoLines = (text: string): string[] => {
    if (!text) return [];
    
    // 句読点で一旦分割
    const segments = text.split(/([、。！？])/);
    const lines: string[] = [];
    let currentLine = '';
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      // 句読点の場合は前の行に追加
      if (/[、。！？]/.test(segment)) {
        currentLine += segment;
        // 句点の場合は改行
        if (/[。！？]/.test(segment)) {
          lines.push(currentLine);
          currentLine = '';
        }
      } else if (segment.trim()) {
        // モバイル用に短めに設定（20文字）
        if (currentLine.length + segment.length > 20) {
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = segment;
        } else {
          currentLine += segment;
        }
      }
    }
    
    // 最後の行を追加
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.filter(line => line.trim());
  };

  // 練習画面用の行分割
  const lines = practiceData ? splitIntoLines(practiceData.answer) : [];

  // 初期データ読み込み
  useEffect(() => {
    loadCustomQuestions();
    loadAnswerTexts();
  }, []);

  const loadCustomQuestions = () => {
    const saved = localStorage.getItem('customQuestions');
    if (saved) {
      setCustomQuestions(JSON.parse(saved));
    }
  };

  const loadAnswerTexts = () => {
    const saved = localStorage.getItem('answerTexts');
    if (saved) {
      setAnswerTexts(JSON.parse(saved));
    }
  };

  const saveAnswerText = (questionId: string, text: string) => {
    const updated = { ...answerTexts, [questionId]: text };
    setAnswerTexts(updated);
    localStorage.setItem('answerTexts', JSON.stringify(updated));
  };

  const saveCustomQuestion = () => {
    const newQuestion: CustomQuestion = {
      id: editingQuestion?.id || Date.now().toString(),
      question: customQuestionText,
      answer: customAnswerText,
      duration: customDuration,
      createdAt: editingQuestion?.createdAt || new Date(),
    };

    let updatedQuestions;
    if (editingQuestion) {
      updatedQuestions = customQuestions.map(q => 
        q.id === editingQuestion.id ? newQuestion : q
      );
    } else {
      updatedQuestions = [...customQuestions, newQuestion];
    }

    setCustomQuestions(updatedQuestions);
    localStorage.setItem('customQuestions', JSON.stringify(updatedQuestions));
    
    setShowCustomModal(false);
    setEditingQuestion(null);
    setCustomQuestionText('');
    setCustomAnswerText('');
    setCustomDuration(60);
  };

  const deleteCustomQuestion = (id: string) => {
    const updatedQuestions = customQuestions.filter(q => q.id !== id);
    setCustomQuestions(updatedQuestions);
    localStorage.setItem('customQuestions', JSON.stringify(updatedQuestions));
  };

  const startPractice = (question: string, answer: string, duration?: number) => {
    setPracticeData({ question, answer, duration });
    setSelectedDuration(duration || 60);
    setShowPracticeScreen(true);
    setIsPlaying(false);
    setCurrentCharIndex(0);
    setProgress(0);
  };

  // カラオケ練習のハンドラー
  const handleStart = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentCharIndex(0);
    setProgress(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleComplete = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    // 完了時の処理
    setTimeout(() => {
      alert('練習が完了しました！');
    }, 100);
  };

  // カラオケのタイミング制御（一文字ずつ、句読点でポーズ）
  useEffect(() => {
    if (!showPracticeScreen || !practiceData || !isPlaying || fullText.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    // 句読点でのポーズ時間（ミリ秒）
    const COMMA_PAUSE = 200; // 読点（、）で0.2秒
    const PERIOD_PAUSE = 400; // 句点（。）で0.4秒
    
    // 各文字の累積時間を計算
    const charTimings: number[] = [];
    let cumulativeTime = 0;
    const baseDuration = (actualDuration * 1000) / fullText.length;
    
    for (let i = 0; i < fullText.length; i++) {
      charTimings.push(cumulativeTime);
      cumulativeTime += baseDuration;
      
      // 句読点の後にポーズを追加
      const char = fullText[i];
      if (char === '、') {
        cumulativeTime += COMMA_PAUSE;
      } else if (char === '。' || char === '！' || char === '？') {
        cumulativeTime += PERIOD_PAUSE;
      }
    }
    
    // 最後の文字のタイミングを追加
    charTimings.push(cumulativeTime);
    
    // 実際の総時間に合わせて調整
    const actualTotalTime = actualDuration * 1000;
    const scaleFactor = actualTotalTime / cumulativeTime;
    const adjustedTimings = charTimings.map(time => time * scaleFactor);

    const startTime = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      // 現在の文字位置を計算
      let currentChar = 0;
      for (let i = 0; i < adjustedTimings.length - 1; i++) {
        if (elapsed >= adjustedTimings[i] && elapsed < adjustedTimings[i + 1]) {
          currentChar = i;
          break;
        }
      }
      
      if (elapsed >= actualTotalTime) {
        setCurrentCharIndex(fullText.length);
        setProgress(100);
        handleComplete();
      } else {
        setCurrentCharIndex(currentChar);
        setProgress((elapsed / actualTotalTime) * 100);
      }
    }, 16); // 約60fps for smooth animation

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [showPracticeScreen, practiceData, isPlaying, fullText, actualDuration]);

  const categories = [
    { id: 'motivation', label: '志望理由', icon: Target },
    { id: 'self_pr', label: '自己PR', icon: Mic },
    { id: 'student_life', label: '高校生活', icon: Clock },
    { id: 'future_goals', label: '将来の目標', icon: BarChart3 },
    { id: 'academic', label: '学業・時事', icon: BookOpen },
    { id: 'custom', label: 'その他', icon: Plus },
  ];

  const currentFixedQuestion = fixedQuestions.find(q => q.category === selectedCategory);

  // 練習画面の表示
  if (showPracticeScreen && practiceData) {
    return (
      <div className="practice-screen" style={{ padding: '12px', maxWidth: '100%', margin: '0 auto' }}>
        <button 
          onClick={() => {
            setShowPracticeScreen(false);
            handleReset();
          }}
          style={{ 
            marginBottom: '12px', 
            padding: '8px 12px', 
            borderRadius: '6px', 
            border: 'none', 
            background: '#f8f9fa', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px'
          }}
        >
          <ArrowLeft size={14} />
          戻る
        </button>
        
        <div style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '16px', marginBottom: '12px', textAlign: 'center' }}>カラオケ練習</h2>
          
          <div style={{ marginBottom: '16px', textAlign: 'center' }}>
            <p style={{ color: '#2d3436', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
              {practiceData.question}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', color: '#636e72', fontSize: '11px' }}>
              <span>文字数: {practiceData.answer.length}文字</span>
              <span>目標時間: {actualDuration}秒</span>
            </div>
          </div>

          {/* 回答時間選択 */}
          {!isPlaying && currentCharIndex === 0 && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ textAlign: 'center', marginBottom: '8px', color: '#636e72', fontSize: '12px' }}>練習する時間を選択</p>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                {[30, 60, 90, 120].map((duration) => (
                  <button
                    key={duration}
                    onClick={() => setSelectedDuration(duration)}
                    style={{
                      padding: '6px 12px',
                      border: `2px solid ${selectedDuration === duration ? '#f093fb' : '#e9ecef'}`,
                      borderRadius: '6px',
                      background: selectedDuration === duration ? '#fdf9ff' : 'white',
                      color: selectedDuration === duration ? '#f093fb' : '#636e72',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontSize: '12px'
                    }}
                  >
                    {duration}秒
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* カラオケ表示部分 */}
          <div style={{ 
            background: '#f8f9fa', 
            padding: '16px', 
            borderRadius: '8px', 
            minHeight: '120px',
            marginBottom: '12px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: '16px', lineHeight: '1.8', textAlign: 'center' }}>
              {lines.length > 0 ? (
                lines.map((line, lineIndex) => {
                  // 各行の開始位置を計算
                  let lineStartIndex = 0;
                  for (let i = 0; i < lineIndex; i++) {
                    lineStartIndex += lines[i].length;
                  }
                  
                  return (
                    <div key={lineIndex} style={{ marginBottom: '4px' }}>
                      {line.split('').map((char, charIndex) => {
                        const globalCharIndex = lineStartIndex + charIndex;
                        const isActive = globalCharIndex < currentCharIndex;
                        const isCurrent = globalCharIndex === currentCharIndex;
                        
                        return (
                          <span
                            key={charIndex}
                            style={{
                              color: isActive ? '#f093fb' : '#2d3436',
                              fontWeight: isCurrent ? 700 : 400,
                              fontSize: '16px',
                              transition: 'all 0.1s ease',
                              display: 'inline-block',
                              textShadow: isCurrent ? '0 2px 8px rgba(240, 147, 251, 0.4)' : 'none',
                              opacity: isActive ? 1 : 0.7,
                            }}
                          >
                            {char}
                          </span>
                        );
                      })}
                    </div>
                  );
                })
              ) : (
                <div style={{ color: '#999' }}>
                  テキストを入力してください
                </div>
              )}
            </div>
          </div>

          {/* プログレスバー */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              background: '#e9ecef', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${progress}%`, 
                height: '100%', 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: '6px',
              fontSize: '11px',
              color: '#636e72'
            }}>
              <span>経過: {Math.floor((progress / 100) * selectedDuration)}秒</span>
              <span>残り: {Math.ceil(((100 - progress) / 100) * selectedDuration)}秒</span>
            </div>
          </div>

          {/* コントロールボタン */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {!isPlaying && currentCharIndex === 0 ? (
              <button
                onClick={handleStart}
                style={{
                  padding: '8px 20px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <Play size={14} />
                練習開始
              </button>
            ) : (
              <>
                <button
                  onClick={handlePause}
                  style={{
                    padding: '8px 16px',
                    background: isPlaying ? '#6c5ce7' : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  {isPlaying ? '一時停止' : '再開'}
                </button>
                <button
                  onClick={handleReset}
                  style={{
                    padding: '8px 16px',
                    background: 'white',
                    color: '#636e72',
                    border: '2px solid #e9ecef',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <RotateCcw size={14} />
                  リセット
                </button>
              </>
            )}
          </div>

          {/* ペース表示 */}
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: '#f0f4ff', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '12px', color: '#6c5ce7', marginBottom: '4px' }}>
              現在の文字: {currentCharIndex} / {fullText.length}
            </p>
            <p style={{ fontSize: '11px', color: '#636e72' }}>
              このペースで話すと、ちょうど{selectedDuration}秒で終わります
            </p>
          </div>
        </div>
      </div>
    );
  }

  // メイン画面の表示
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
          text-align: center;
          margin-bottom: 16px;
        }
        
        .page-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        
        .page-description {
          font-size: 12px;
          color: #636e72;
          line-height: 1.4;
        }
        
        .category-tabs {
          background: white;
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          margin-bottom: 16px;
        }
        
        .category-list {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }
        
        .category-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: #f8f9fa;
          border: 2px solid transparent;
          padding: 8px 6px;
          border-radius: 8px;
          font-size: 11px;
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
          border-color: #f093fb;
          color: #f093fb;
        }
        
        .questions-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .fixed-question-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .fixed-question-title {
          font-size: 16px;
          font-weight: 600;
          color: #2d3436;
          margin-bottom: 12px;
        }
        
        .answer-textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.5;
          min-height: 150px;
          resize: vertical;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        
        .answer-textarea:focus {
          outline: none;
          border-color: #f093fb;
          background: #fafbfc;
        }
        
        .char-count {
          text-align: right;
          font-size: 11px;
          color: #636e72;
          margin-top: 6px;
        }
        
        .start-practice-button {
          width: 100%;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 16px;
        }
        
        .start-practice-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(240, 147, 251, 0.3);
        }
        
        .start-practice-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        
        .custom-question-card {
          background: white;
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .custom-question-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        
        .question-text {
          font-size: 14px;
          font-weight: 600;
          color: #2d3436;
          margin-bottom: 6px;
          line-height: 1.3;
        }
        
        .question-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #636e72;
          font-size: 11px;
          margin-bottom: 8px;
        }
        
        .question-meta-item {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        
        .custom-question-actions {
          display: flex;
          gap: 4px;
        }
        
        .icon-button {
          background: #f8f9fa;
          border: none;
          padding: 6px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .icon-button:hover {
          background: #e9ecef;
        }
        
        .icon-button.delete:hover {
          background: #f8d7da;
          color: #721c24;
        }
        
        .practice-button {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          border: none;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .practice-button:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(240, 147, 251, 0.4);
        }
        
        .custom-answer-preview {
          background: #f8f9fa;
          padding: 8px;
          border-radius: 6px;
          color: #636e72;
          line-height: 1.4;
          max-height: 60px;
          overflow: hidden;
          position: relative;
          font-size: 11px;
        }
        
        .custom-answer-preview::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 16px;
          background: linear-gradient(to bottom, transparent, #f8f9fa);
        }
        
        .add-custom-button {
          width: 100%;
          background: white;
          border: 2px dashed #dee2e6;
          padding: 20px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: #636e72;
          font-size: 13px;
          font-weight: 600;
        }
        
        .add-custom-button:hover {
          border-color: #f093fb;
          background: #fdf9ff;
          color: #f093fb;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        
        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 20px;
          max-width: 100%;
          width: 100%;
          max-height: 85vh;
          overflow-y: auto;
        }
        
        .modal-header {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 6px;
          color: #2d3436;
        }
        
        .form-input {
          width: 100%;
          padding: 8px;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          font-size: 13px;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #f093fb;
        }
        
        .form-textarea {
          width: 100%;
          padding: 8px;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          font-size: 13px;
          min-height: 120px;
          resize: vertical;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        
        .form-textarea:focus {
          outline: none;
          border-color: #f093fb;
        }
        
        .modal-actions {
          display: flex;
          gap: 8px;
          margin-top: 20px;
        }
        
        .modal-button {
          flex: 1;
          padding: 10px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        
        .modal-button.cancel {
          background: #f8f9fa;
          color: #636e72;
        }
        
        .modal-button.cancel:hover {
          background: #e9ecef;
        }
        
        .modal-button.save {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }
        
        .modal-button.save:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(240, 147, 251, 0.3);
        }
        
        .modal-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .info-section {
          background: linear-gradient(135deg, #ffedf0 0%, #fff5f6 100%);
          border-radius: 12px;
          padding: 16px;
          margin-top: 20px;
        }
        
        .info-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #2d3436;
        }
        
        .info-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .info-item {
          color: #636e72;
          padding-left: 16px;
          position: relative;
          line-height: 1.5;
          margin-bottom: 8px;
          font-size: 11px;
        }
        
        .info-item::before {
          content: '•';
          position: absolute;
          left: 6px;
          color: #f093fb;
          font-weight: bold;
        }
      `}</style>

      <main className="main-content">
        <button className="back-button" onClick={() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/interview';
          }
        }}>
          <ArrowLeft size={14} />
          面接対策に戻る
        </button>

        <div className="page-header">
          <h1 className="page-title">大学入試面接 カラオケ式練習</h1>
          <p className="page-description">
            理想的なペースで話す練習ができます。志望理由や自己PRを時間内に話せるようになりましょう。
          </p>
        </div>

        <div className="category-tabs">
          <div className="category-list">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <Icon size={14} />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="questions-container">
          {selectedCategory === 'custom' ? (
            <>
              {customQuestions.map((question) => (
                <div key={question.id} className="custom-question-card">
                  <div className="custom-question-header">
                    <div style={{ flex: 1 }}>
                      <h3 className="question-text">{question.question}</h3>
                      <div className="question-meta">
                        <span className="question-meta-item">
                          <Clock size={12} />
                          {question.answer.length}文字
                        </span>
                        <span className="question-meta-item">
                          <Target size={12} />
                          {question.duration}秒
                        </span>
                      </div>
                    </div>
                    <div className="custom-question-actions">
                      <button
                        className="icon-button"
                        onClick={() => {
                          setEditingQuestion(question);
                          setCustomQuestionText(question.question);
                          setCustomAnswerText(question.answer);
                          setCustomDuration(question.duration || 60);
                          setShowCustomModal(true);
                        }}
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        className="icon-button delete"
                        onClick={() => deleteCustomQuestion(question.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                      <button
                        className="practice-button"
                        onClick={() => startPractice(question.question, question.answer, question.duration)}
                      >
                        <Play size={12} />
                        練習開始
                      </button>
                    </div>
                  </div>
                  <div className="custom-answer-preview">
                    {question.answer}
                  </div>
                </div>
              ))}
              
              <button className="add-custom-button" onClick={() => {
                setEditingQuestion(null);
                setCustomQuestionText('');
                setCustomAnswerText('');
                setCustomDuration(60);
                setShowCustomModal(true);
              }}>
                <Plus size={20} />
                <span>カスタム質問を追加</span>
              </button>
            </>
          ) : (
            currentFixedQuestion && (
              <div className="fixed-question-card">
                <h2 className="fixed-question-title">{currentFixedQuestion.question}</h2>
                <textarea
                  className="answer-textarea"
                  value={answerTexts[currentFixedQuestion.id] || ''}
                  onChange={(e) => saveAnswerText(currentFixedQuestion.id, e.target.value)}
                  placeholder={currentFixedQuestion.placeholder}
                />
                <div className="char-count">
                  {(answerTexts[currentFixedQuestion.id] || '').length}文字
                </div>
                <button
                  className="start-practice-button"
                  onClick={() => startPractice(
                    currentFixedQuestion.question,
                    answerTexts[currentFixedQuestion.id] || ''
                  )}
                  disabled={!(answerTexts[currentFixedQuestion.id] || '').trim()}
                >
                  <Play size={16} />
                  カラオケ練習を開始する
                </button>
              </div>
            )
          )}
        </div>

        <div className="info-section">
          <h3 className="info-title">
            <Play size={16} style={{ color: '#f093fb' }} />
            カラオケ式練習とは？
          </h3>
          <ul className="info-list">
            <li className="info-item">
              理想的な話すペースを視覚的に確認しながら練習できます
            </li>
            <li className="info-item">
              30秒、60秒、90秒、120秒の回答時間に合わせた練習が可能です
            </li>
            <li className="info-item">
              リアルタイムでペースをチェックし、適切な速度で話せるようになります
            </li>
            <li className="info-item">
              「その他」タブでは、自分で設定した質問と回答で練習できます（例：医学部の志望理由、看護学科を選んだ理由など）
            </li>
          </ul>
        </div>

        {showCustomModal && (
          <div className="modal-overlay" onClick={() => setShowCustomModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-header">
                {editingQuestion ? '質問を編集' : 'カスタム質問を追加'}
              </h2>
              
              <div className="form-group">
                <label className="form-label">質問内容</label>
                <input
                  type="text"
                  className="form-input"
                  value={customQuestionText}
                  onChange={(e) => setCustomQuestionText(e.target.value)}
                  placeholder="例：なぜ本学を志望したのですか？"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">回答文</label>
                <textarea
                  className="form-textarea"
                  value={customAnswerText}
                  onChange={(e) => setCustomAnswerText(e.target.value)}
                  placeholder="練習したい回答文を入力してください"
                />
                <div className="char-count">
                  {customAnswerText.length}文字
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">回答時間</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
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
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: '12px'
                      }}
                    >
                      {duration}秒
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#636e72' }}>
                  推奨ペース: 約{Math.round((customAnswerText.length / customDuration) * 60)}文字/分
                </div>
              </div>
              
              <div className="modal-actions">
                <button
                  className="modal-button cancel"
                  onClick={() => setShowCustomModal(false)}
                >
                  キャンセル
                </button>
                <button
                  className="modal-button save"
                  onClick={saveCustomQuestion}
                  disabled={!customQuestionText || !customAnswerText}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}