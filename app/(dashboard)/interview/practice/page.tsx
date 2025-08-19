'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Sparkles, BookOpen, Target, Users, Briefcase, Clock, TrendingUp, X } from 'lucide-react';
import { saveInterviewQuestions, getInterviewQuestions } from '@/lib/firebase/interview';

// インターフェース定義
interface InterviewQuestion {
  id: string;
  question: string;
  category: 'motivation' | 'self_pr' | 'student_life' | 'future_goals' | 'current_affairs';
  difficulty: 'easy' | 'medium' | 'hard';
  keyPoints: string[];
  tags: string[];
}

// サンプルデータ
const SAMPLE_QUESTIONS: InterviewQuestion[] = [
  {
    id: '1',
    question: 'なぜ弊社を志望されたのですか？',
    category: 'motivation',
    difficulty: 'easy',
    keyPoints: ['企業理念への共感', '自身のキャリアビジョンとの一致', '具体的な事業内容への興味'],
    tags: ['志望動機', '企業研究', '基本質問']
  },
  {
    id: '2',
    question: 'あなたの強みを教えてください',
    category: 'self_pr',
    difficulty: 'easy',
    keyPoints: ['具体的なエピソード', '成果や実績', '仕事での活かし方'],
    tags: ['自己PR', '強み', '基本質問']
  },
  {
    id: '3',
    question: '学生時代に最も力を入れたことは何ですか？',
    category: 'student_life',
    difficulty: 'medium',
    keyPoints: ['取り組みの動機', '直面した課題', '得られた成果と学び'],
    tags: ['ガクチカ', '経験', '成長']
  },
  {
    id: '4',
    question: '10年後のキャリアビジョンを教えてください',
    category: 'future_goals',
    difficulty: 'hard',
    keyPoints: ['具体的な目標設定', '実現への道筋', '企業での成長イメージ'],
    tags: ['キャリア', '将来像', '長期目標']
  },
  {
    id: '5',
    question: 'チームで成果を出した経験を教えてください',
    category: 'student_life',
    difficulty: 'medium',
    keyPoints: ['自身の役割', 'チームへの貢献', '協調性の発揮'],
    tags: ['チームワーク', '協調性', 'リーダーシップ']
  }
];

// AI質問生成コンポーネント（修正版）
const AIQuestionGenerator = ({ onQuestionsGenerated, onClose }: { 
  onQuestionsGenerated: (questions: InterviewQuestion[]) => void;
  onClose: () => void;
}) => {
  const [department, setDepartment] = useState('');
  const [isStudentMode, setIsStudentMode] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('medium');
  const [generating, setGenerating] = useState(false);

  // スタイル定義（修正版）
  const styles = {
    content: {
      position: 'relative' as const,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '32px 32px 24px',
      borderBottom: '1px solid #f3f4f6',
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    iconWrapper: {
      width: '48px',
      height: '48px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      boxShadow: '0 8px 16px rgba(102, 126, 234, 0.2)',
    },
    title: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#111827',
      margin: 0,
    },
    subtitle: {
      fontSize: '14px',
      color: '#6b7280',
      marginTop: '4px',
    },
    closeButton: {
      width: '36px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f3f4f6',
      border: 'none',
      borderRadius: '10px',
      color: '#6b7280',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    form: {
      padding: '32px',
    },
    section: {
      display: 'flex',
      gap: '24px',
      marginBottom: '32px',
      paddingBottom: '32px',
      borderBottom: '1px solid #f3f4f6',
    },
    sectionLast: {
      borderBottom: 'none',
      marginBottom: '24px',
    },
    sectionNumber: {
      width: '32px',
      height: '32px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
      fontSize: '14px',
      flexShrink: 0,
    },
    sectionContent: {
      flex: 1,
    },
    label: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#111827',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    required: {
      fontSize: '11px',
      fontWeight: '500',
      padding: '2px 8px',
      background: '#fee2e2',
      color: '#dc2626',
      borderRadius: '20px',
    },
    selectWrapper: {
      position: 'relative' as const,
    },
    select: {
      width: '100%',
      padding: '14px 40px 14px 16px',
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      fontSize: '15px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      outline: 'none',
      background: 'white',
      cursor: 'pointer',
      appearance: 'none' as const,
      color: '#111827',
    },
    selectEmpty: {
      color: '#9ca3af',
    },
    selectIcon: {
      position: 'absolute' as const,
      right: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#6b7280',
      pointerEvents: 'none' as const,
      fontSize: '12px',
    },
    categoryGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '12px',
    },
    categoryCard: {
      position: 'relative' as const,
      padding: '16px',
      border: '2px solid #e5e7eb',
      background: 'white',
      borderRadius: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    categoryCardSelected: {
      border: '2px solid #667eea',
      background: 'linear-gradient(135deg, #667eea08 0%, #764ba208 100%)',
    },
    categoryIcon: {
      width: '40px',
      height: '40px',
      background: '#f3f4f6',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#6b7280',
      transition: 'all 0.2s ease',
    },
    categoryIconSelected: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
    },
    categoryName: {
      flex: 1,
      fontWeight: '500',
      color: '#374151',
    },
    categoryCheck: {
      width: '24px',
      height: '24px',
      border: '2px solid #e5e7eb',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      color: 'white',
      transition: 'all 0.2s ease',
    },
    categoryCheckChecked: {
      background: '#667eea',
      borderColor: '#667eea',
    },
    settingsGrid: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '20px',
    },
    settingItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    settingItemColumn: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
    },
    currentAffairsCard: {
      padding: '20px',
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      borderRadius: '16px',
      marginBottom: '20px',
    },
    currentAffairsHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '12px',
    },
    currentAffairsTitle: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#92400e',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    toggleSwitch: {
      position: 'relative' as const,
      width: '48px',
      height: '24px',
      background: '#e5e7eb',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    toggleSwitchActive: {
      background: '#667eea',
    },
    toggleKnob: {
      position: 'absolute' as const,
      top: '2px',
      left: '2px',
      width: '20px',
      height: '20px',
      background: 'white',
      borderRadius: '50%',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
    toggleKnobActive: {
      transform: 'translateX(24px)',
    },
    currentAffairsList: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '8px',
      marginTop: '12px',
    },
    currentAffairTag: {
      padding: '6px 12px',
      background: 'rgba(146, 64, 14, 0.1)',
      color: '#92400e',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '500',
    },
    settingLabel: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#6b7280',
      minWidth: '60px',
    },
    pillSelector: {
      display: 'flex',
      gap: '8px',
      flex: 1,
    },
    pillOption: {
      flex: 1,
      padding: '8px 16px',
      border: '2px solid #e5e7eb',
      background: 'white',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      color: '#6b7280',
      textAlign: 'center' as const,
    },
    generateSection: {
      marginTop: '32px',
      paddingTop: '32px',
      borderTop: '1px solid #f3f4f6',
    },
    generatePreview: {
      fontSize: '14px',
      color: '#6b7280',
      textAlign: 'center' as const,
      lineHeight: '1.6',
      marginBottom: '16px',
    },
    generateButton: {
      width: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      border: 'none',
      padding: '16px 24px',
      borderRadius: '16px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s ease',
      boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
    },
    generateButtonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
      transform: 'none',
    },
    hint: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '8px',
    },
    spinner: {
      width: '20px',
      height: '20px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTopColor: 'white',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
  };

  // 学部の選択肢
  const departments = [
    { id: 'law', label: '法学部' },
    { id: 'economics', label: '経済学部' },
    { id: 'business', label: '経営学部' },
    { id: 'literature', label: '文学部' },
    { id: 'science', label: '理学部' },
    { id: 'engineering', label: '工学部' },
    { id: 'medicine', label: '医学部' },
    { id: 'pharmacy', label: '薬学部' },
    { id: 'agriculture', label: '農学部' },
    { id: 'education', label: '教育学部' },
    { id: 'international', label: '国際関係学部' },
    { id: 'information', label: '情報学部' },
    { id: 'arts', label: '芸術学部' },
    { id: 'social', label: '社会学部' },
    { id: 'psychology', label: '心理学部' },
    { id: 'other', label: 'その他' }
  ];
  
  // 学部別の時事問題例
  const currentAffairsByDepartment: { [key: string]: string[] } = {
    law: ['司法制度改革', '憲法改正議論', 'AI時代の法整備'],
    economics: ['インフレ対策', '円安問題', 'デジタル通貨'],
    business: ['DX推進', 'ESG経営', 'スタートアップ支援'],
    literature: ['AI翻訳の進化', '電子書籍市場', '言語の多様性'],
    science: ['量子コンピュータ', '気候変動', 'エネルギー問題'],
    engineering: ['半導体不足', '自動運転技術', '再生可能エネルギー'],
    medicine: ['新型感染症対策', '遠隔医療', '再生医療'],
    pharmacy: ['ジェネリック医薬品', '創薬AI', 'ドラッグリポジショニング'],
    agriculture: ['食糧安全保障', 'スマート農業', '代替タンパク質'],
    education: ['教育DX', 'アクティブラーニング', '不登校問題'],
    international: ['地政学的リスク', 'グローバルサウス', '多国間協調'],
    information: ['生成AI', 'サイバーセキュリティ', 'メタバース'],
    arts: ['NFTアート', '文化財保護', 'AIクリエイティブ'],
    social: ['少子高齢化', 'ジェンダー平等', 'デジタル格差'],
    psychology: ['メンタルヘルス', 'SNS依存', '認知バイアス'],
    other: ['SDGs', 'カーボンニュートラル', 'ダイバーシティ']
  };

  const categories = [
    { id: 'motivation', label: '志望動機' },
    { id: 'self_pr', label: '自己PR' },
    { id: 'student_life', label: '学生生活' },
    { id: 'future_goals', label: '将来の目標' },
    { id: 'current_affairs', label: '時事問題' }
  ];

  const difficulties = [
    { id: 'easy', label: '初級' },
    { id: 'medium', label: '中級' },
    { id: 'hard', label: '上級' }
  ];

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleGenerate = async () => {
    if (!department || selectedCategories.length === 0) {
      alert('必須項目を選択してください');
      return;
    }

    // ランダムに1つのカテゴリを選択
    const randomCategory = selectedCategories[Math.floor(Math.random() * selectedCategories.length)];

    console.log('Starting question generation...', {
      department,
      selectedCategory: randomCategory,
      selectedDifficulty,
      questionCount: 1
    });

    setGenerating(true);
    
    try {
      const deptLabel = departments.find(d => d.id === department)?.label || '';
      
      // APIエンドポイントが利用できない場合のフォールバック処理
      const USE_DEMO_MODE = true; // APIが準備できたらfalseに変更
      
      if (USE_DEMO_MODE) {
        console.log('Using demo mode for question generation...');
        await generateDemoQuestion();
        return;
      }
      
      console.log('Sending request to API...');
      
      const response = await fetch('/api/interview/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categories: [randomCategory], // 1つのカテゴリのみ送信
          difficulty: selectedDifficulty,
          faculty: deptLabel,
          questionCount: 1 // 常に1問
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        
        // APIエラー時はデモモードにフォールバック
        console.log('API failed, falling back to demo mode...');
        await generateDemoQuestion();
        return;
      }

      const data = await response.json();
      console.log('Generated question:', data);
      
      if (data.error) {
        // エラー時もデモモードにフォールバック
        console.log('API returned error, falling back to demo mode...');
        await generateDemoQuestion();
        return;
      }

      if (data.warning) {
        console.warn('Warning:', data.warning);
      }

      // 生成された質問を親コンポーネントに渡す
      if (data.questions && data.questions.length > 0) {
        console.log('Adding question to the list...');
        onQuestionsGenerated(data.questions);
        
        // 成功メッセージ
        const message = data.warning 
          ? 'デモ質問を生成しました（AI生成は利用できませんでした）' 
          : '新しい質問をAIが生成しました！';
        alert(message);
        
        // フォームをリセット
        setDepartment('');
        setSelectedCategories([]);
        setSelectedDifficulty('medium');
      } else {
        console.error('No questions in response');
        // 質問が返されなかった場合もデモモードにフォールバック
        await generateDemoQuestion();
      }
      
    } catch (error) {
      console.error('Failed to generate questions:', error);
      // エラー時はデモモードを使用
      console.log('Exception occurred, falling back to demo mode...');
      await generateDemoQuestion();
    } finally {
      setGenerating(false);
    }
  };

  // デモ版の質問生成（APIが使えない場合のフォールバック）
  const generateDemoQuestion = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const deptLabel = departments.find(d => d.id === department)?.label || department;
    const randomCategory = selectedCategories[Math.floor(Math.random() * selectedCategories.length)] as InterviewQuestion['category'];
    const categoryLabel = categories.find(c => c.id === randomCategory)?.label || '';
    
    let question = '';
    let keyPoints: string[] = [];
    
    switch (randomCategory) {
      case 'motivation':
        question = `${deptLabel}を志望した理由と、入学後に学びたいことを教えてください`;
        keyPoints = ['志望理由の明確さ', '学習計画の具体性', '将来展望との関連'];
        break;
      case 'self_pr':
        question = `${deptLabel}での学習に活かせるあなたの強みを教えてください`;
        keyPoints = ['強みの具体性', '学部との関連性', 'エピソードの説得力'];
        break;
      case 'student_life':
        question = `高校時代に最も力を入れた活動について教えてください`;
        keyPoints = ['活動内容の具体性', '得られた成果', '大学での活用'];
        break;
      case 'future_goals':
        question = `${deptLabel}卒業後のキャリアプランを教えてください`;
        keyPoints = ['目標の明確さ', '実現可能性', '社会貢献への意識'];
        break;
      case 'current_affairs':
        if (currentAffairsByDepartment[department]) {
          const topics = currentAffairsByDepartment[department];
          const randomTopic = topics[Math.floor(Math.random() * topics.length)];
          question = `「${randomTopic}」について、${deptLabel}の視点からあなたの意見を述べてください`;
          keyPoints = ['問題理解の深さ', '論理的思考', '独自の視点'];
        }
        break;
    }
    
    if (question) {
      const newQuestion: InterviewQuestion = {
        id: `demo-${Date.now()}`,
        question,
        category: randomCategory,
        difficulty: selectedDifficulty as InterviewQuestion['difficulty'],
        keyPoints,
        tags: ['AI生成', deptLabel, categoryLabel]
      };
      
      onQuestionsGenerated([newQuestion]);
      alert('新しい質問を生成しました！');
      
      // フォームをリセット
      setDepartment('');
      setSelectedCategories([]);
      setSelectedDifficulty('medium');
    }
  };

  return (
    <div style={styles.content}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.iconWrapper}>
            <Sparkles size={24} />
          </div>
          <div>
            <h2 style={styles.title}>AI質問生成</h2>
            <p style={styles.subtitle}>あなたの学部に最適化された面接質問を作成します</p>
          </div>
        </div>
        <button 
          style={styles.closeButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e5e7eb';
            e.currentTarget.style.color = '#374151';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.color = '#6b7280';
          }}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      
      <div style={styles.form}>
        {/* Step 1: 学部選択 */}
        <div style={styles.section}>
          <div style={styles.sectionNumber}>1</div>
          <div style={styles.sectionContent}>
            <label style={styles.label}>
              志望学部を選択
              <span style={styles.required}>必須</span>
            </label>
            <div style={styles.selectWrapper}>
              <select
                style={{
                  ...styles.select,
                  ...(department === '' ? styles.selectEmpty : {})
                }}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">学部を選択してください</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.label}
                  </option>
                ))}
              </select>
              <div style={styles.selectIcon}>▼</div>
            </div>
          </div>
        </div>
        
        {/* Step 2: カテゴリ選択 */}
        <div style={styles.section}>
          <div style={styles.sectionNumber}>2</div>
          <div style={styles.sectionContent}>
            <label style={styles.label}>
              質問カテゴリ
              <span style={styles.required}>必須</span>
            </label>
            <div style={styles.categoryGrid}>
              {categories.map(category => {
                const isSelected = selectedCategories.includes(category.id);
                const Icon = category.id === 'motivation' ? Target :
                           category.id === 'self_pr' ? Users :
                           category.id === 'student_life' ? BookOpen :
                           category.id === 'current_affairs' ? TrendingUp : Briefcase;
                return (
                  <button
                    key={category.id}
                    style={{
                      ...styles.categoryCard,
                      ...(isSelected ? styles.categoryCardSelected : {})
                    }}
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div style={{
                      ...styles.categoryIcon,
                      ...(isSelected ? styles.categoryIconSelected : {})
                    }}>
                      <Icon size={20} />
                    </div>
                    <span style={styles.categoryName}>{category.label}</span>
                    <div style={{
                      ...styles.categoryCheck,
                      ...(isSelected ? styles.categoryCheckChecked : {})
                    }}>
                      {isSelected && '✓'}
                    </div>
                  </button>
                );
              })}
            </div>
            <p style={styles.hint}>複数選択可能です（選択したカテゴリからランダムに1問生成されます）</p>
          </div>
        </div>
        
        {/* Step 3: 詳細設定（質問数の選択を削除） */}
        <div style={{...styles.section, ...styles.sectionLast}}>
          <div style={styles.sectionNumber}>3</div>
          <div style={styles.sectionContent}>
            <label style={styles.label}>詳細設定</label>
            
            <div style={styles.settingsGrid}>
              <div style={styles.settingItem}>
                <span style={styles.settingLabel}>難易度</span>
                <div style={styles.pillSelector}>
                  {difficulties.map(difficulty => (
                    <button
                      key={difficulty.id}
                      style={{
                        ...styles.pillOption,
                        ...(selectedDifficulty === difficulty.id ? {
                          background: difficulty.id === 'easy' ? '#10b981' :
                                     difficulty.id === 'medium' ? '#f59e0b' : '#ef4444',
                          border: `2px solid ${difficulty.id === 'easy' ? '#10b981' :
                                      difficulty.id === 'medium' ? '#f59e0b' : '#ef4444'}`,
                          color: 'white'
                        } : {})
                      }}
                      onClick={() => setSelectedDifficulty(difficulty.id)}
                    >
                      {difficulty.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 生成ボタン */}
        <div style={styles.generateSection}>
          <div>
            {department && selectedCategories.length > 0 && (
              <p style={styles.generatePreview}>
                {departments.find(d => d.id === department)?.label}の
                {selectedCategories.map(id => categories.find(c => c.id === id)?.label).join('・')}に関する
                {difficulties.find(d => d.id === selectedDifficulty)?.label}レベルの質問を生成します
              </p>
            )}
          </div>
          
          <button
            style={{
              ...styles.generateButton,
              ...((!department || selectedCategories.length === 0 || generating) ? 
                styles.generateButtonDisabled : {})
            }}
            onClick={handleGenerate}
            disabled={!department || selectedCategories.length === 0 || generating}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
              }
            }}
          >
            {generating ? (
              <>
                <div style={styles.spinner} />
                <span>質問を生成中...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>質問を生成する</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PracticePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [loading, setLoading] = useState(true);

  // Firestoreから質問を読み込む
  useEffect(() => {
    loadQuestions();
  }, [selectedCategory, selectedDifficulty]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      // Firestoreから質問を取得
      const firestoreQuestions = await getInterviewQuestions({
        category: selectedCategory || undefined,
        difficulty: selectedDifficulty || undefined
      });

      // サンプル質問と合わせる
      const allQuestions = [...SAMPLE_QUESTIONS, ...firestoreQuestions];
      setQuestions(allQuestions);
    } catch (error) {
      console.error('質問の読み込みエラー:', error);
      // エラー時はサンプル質問のみ表示
      setQuestions(SAMPLE_QUESTIONS);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         q.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || q.category === selectedCategory;
    const matchesDifficulty = !selectedDifficulty || q.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const handleAIQuestionsGenerated = async (newQuestions: InterviewQuestion[]) => {
    console.log('=== handleAIQuestionsGenerated START ===');
    console.log('Received questions:', newQuestions);
    console.log('Questions count:', newQuestions.length);
    
    try {
      // Firestoreに保存し、保存された質問（IDを含む）を取得
      console.log('--- Saving to Firestore ---');
      const savedQuestions = await saveInterviewQuestions(newQuestions);
      console.log('Saved questions with IDs:', savedQuestions);
      
      // 質問リストを再読み込み
      await loadQuestions();
      
      // 成功メッセージ
      alert('新しい質問をAIが生成し、保存しました！');
      
      // AI生成パネルを閉じる
      setShowAIGenerator(false);
      
      // フィルターをクリア
      setSelectedCategory(null);
      setSelectedDifficulty(null);
      setSearchQuery('');
      
      // 生成された質問に自動的に遷移
      if (savedQuestions.length > 0 && savedQuestions[0].id) {
        const firstQuestionId = savedQuestions[0].id;
        console.log('Navigating to generated question:', firstQuestionId);
        
        // 少し遅延を入れて、UIが更新されるのを待つ
        setTimeout(() => {
          router.push(`/interview/practice/${firstQuestionId}`);
        }, 500);
      }
      
    } catch (error) {
      console.error('=== SAVE ERROR ===');
      console.error('Failed to save questions:', error);
      alert('質問の保存に失敗しました。もう一度お試しください。');
    }
    
    console.log('=== handleAIQuestionsGenerated END ===');
  };

  const handleQuestionClick = (questionId: string) => {
    console.log('handleQuestionClick called with questionId:', questionId);
    console.log('Navigating to:', `/interview/practice/${questionId}`);
    
    // 実際のページ遷移を行う
    router.push(`/interview/practice/${questionId}`);
  };

  // カテゴリ別のアイコンと色を定義
  const categoryConfig = {
    motivation: { icon: Target, color: '#667eea', label: '志望動機' },
    self_pr: { icon: Users, color: '#f093fb', label: '自己PR' },
    student_life: { icon: BookOpen, color: '#4facfe', label: '学生生活' },
    future_goals: { icon: Briefcase, color: '#fa709a', label: '将来の目標' },
    current_affairs: { icon: TrendingUp, color: '#f59e0b', label: '時事問題' }
  };

  // 難易度別の色を定義
  const difficultyConfig = {
    easy: { color: '#10b981', label: '初級' },
    medium: { color: '#f59e0b', label: '中級' },
    hard: { color: '#ef4444', label: '上級' }
  };

  return (
    <>
      <style jsx>{`
        .practice-container {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          min-height: 100vh;
          background: #f8f9fa;
        }
        
        /* ヘッダーセクション */
        .practice-header {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .practice-title {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .practice-subtitle {
          font-size: 16px;
          color: #6b7280;
        }
        
        /* AI生成ボタン（カード内上部） */
        .ai-generate-button-top {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 14px 24px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          margin-bottom: 20px;
        }
        
        .ai-generate-button-top:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
        }
        
        .divider {
          width: 100%;
          height: 1px;
          background: #e5e7eb;
          margin-bottom: 20px;
        }
        
        /* フローティングAI生成ボタンを非表示 */
        .ai-generate-button {
          display: none;
        }
        
        /* AI生成パネル - リデザイン */
        .ai-generator-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(10px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .ai-generator-panel {
          background: white;
          border-radius: 24px;
          padding: 0;
          max-width: 720px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .ai-generator-content {
          position: relative;
        }
        
        .ai-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 32px 32px 24px;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .ai-header-content {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .ai-icon-wrapper {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.2);
        }
        
        .ai-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        
        .ai-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin-top: 4px;
        }
        
        .close-button {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border: none;
          border-radius: 10px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .close-button:hover {
          background: #e5e7eb;
          color: #374151;
        }
        
        .ai-form {
          padding: 32px;
        }
        
        /* フォームセクション */
        .form-section {
          display: flex;
          gap: 24px;
          margin-bottom: 32px;
          padding-bottom: 32px;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .form-section:last-of-type {
          border-bottom: none;
          margin-bottom: 24px;
        }
        
        .section-number {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          flex-shrink: 0;
        }
        
        .section-content {
          flex: 1;
        }
        
        .form-label {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .required {
          font-size: 11px;
          font-weight: 500;
          padding: 2px 8px;
          background: #fee2e2;
          color: #dc2626;
          border-radius: 20px;
        }
        
        /* セレクトボックス */
        .select-wrapper {
          position: relative;
        }
        
        .form-select {
          width: 100%;
          padding: 14px 40px 14px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.2s ease;
          outline: none;
          background: white;
          cursor: pointer;
          appearance: none;
          color: #111827;
        }
        
        .form-select.empty {
          color: #9ca3af;
        }
        
        .form-select:hover {
          border-color: #d1d5db;
        }
        
        .form-select:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .select-icon {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          pointer-events: none;
          font-size: 12px;
        }
        
        /* カテゴリグリッド */
        .category-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        
        .category-card {
          position: relative;
          padding: 16px;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .category-card:hover {
          border-color: #d1d5db;
          background: #f9fafb;
        }
        
        .category-card.selected {
          border-color: #667eea;
          background: linear-gradient(135deg, #667eea08 0%, #764ba208 100%);
        }
        
        .category-icon {
          width: 40px;
          height: 40px;
          background: #f3f4f6;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          transition: all 0.2s ease;
        }
        
        .category-card.selected .category-icon {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .category-name {
          flex: 1;
          font-weight: 500;
          color: #374151;
        }
        
        .category-check {
          width: 24px;
          height: 24px;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: white;
          transition: all 0.2s ease;
        }
        
        .category-check.checked {
          background: #667eea;
          border-color: #667eea;
        }
        
        /* 詳細設定 */
        .settings-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .setting-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .setting-label {
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          min-width: 60px;
        }
        
        .pill-selector {
          display: flex;
          gap: 8px;
          flex: 1;
        }
        
        .pill-option {
          flex: 1;
          padding: 8px 16px;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #6b7280;
          text-align: center;
        }
        
        .pill-option:hover {
          border-color: #d1d5db;
        }
        
        .pill-option.active {
          background: var(--pill-color);
          border-color: var(--pill-color);
          color: white;
        }
        
        /* 生成セクション */
        .generate-section {
          margin-top: 32px;
          padding-top: 32px;
          border-top: 1px solid #f3f4f6;
        }
        
        .generate-info {
          margin-bottom: 16px;
        }
        
        .generate-preview {
          font-size: 14px;
          color: #6b7280;
          text-align: center;
          line-height: 1.6;
        }
        
        .generate-button-new {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 16px 24px;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        }
        
        .generate-button-new:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
        }
        
        .generate-button-new:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        
        .form-hint {
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
        }
        
        /* レスポンシブ対応 */
        @media (max-width: 640px) {
          .ai-generator-panel {
            margin: 20px;
            max-height: calc(100vh - 40px);
          }
          
          .ai-header {
            padding: 24px 24px 20px;
          }
          
          .ai-form {
            padding: 24px;
          }
          
          .form-section {
            flex-direction: column;
            gap: 16px;
          }
          
          .section-number {
            width: 28px;
            height: 28px;
            font-size: 12px;
          }
          
          .category-grid {
            grid-template-columns: 1fr;
          }
          
          .settings-grid {
            gap: 16px;
          }
          
          .setting-item {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .pill-selector {
            width: 100%;
          }
        }
        
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* 統計カード */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }
        
        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          position: relative;
          overflow: hidden;
        }
        
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--stat-color) 0%, var(--stat-color-light) 100%);
        }
        
        .stat-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, var(--stat-color) 0%, var(--stat-color-light) 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          color: white;
        }
        
        .stat-value {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #6b7280;
        }
        
        /* 検索とフィルターセクション */
        .search-filter-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .search-container {
          position: relative;
          margin-bottom: 20px;
        }
        
        .search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          width: 20px;
          height: 20px;
        }
        
        .search-input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.2s ease;
          outline: none;
          -webkit-appearance: none;
          appearance: none;
        }
        
        .search-input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        /* モバイル用の検索入力調整 */
        @media (max-width: 640px) {
          .search-input {
            font-size: 16px; /* iOSのズーム防止 */
            padding: 16px 16px 16px 48px;
          }
        }
        
        /* フィルターセクション */
        .filter-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .filter-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          min-width: 80px;
        }
        
        .filter-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .filter-button {
          padding: 8px 16px;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #6b7280;
        }
        
        .filter-button:hover {
          border-color: #d1d5db;
        }
        
        .filter-button.active {
          background: linear-gradient(135deg, var(--filter-color) 0%, var(--filter-color-light) 100%);
          border: 2px solid transparent;
          color: white;
        }
        
        /* 質問カード */
        .questions-grid {
          display: grid;
          gap: 20px;
        }
        
        .question-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          position: relative;
          overflow: hidden;
        }
        
        .question-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
        }
        
        .question-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: linear-gradient(180deg, var(--category-color) 0%, var(--category-color-light) 100%);
        }
        
        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        
        .question-content {
          flex: 1;
        }
        
        .question-title {
          font-size: 18px;
          font-weight: 600;
          line-height: 1.4;
          margin-bottom: 8px;
          color: #111827;
        }
        
        .question-description {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
          margin-bottom: 16px;
        }
        
        .question-meta {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        /* バッジスタイル */
        .category-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: linear-gradient(135deg, var(--category-color) 0%, var(--category-color-light) 100%);
          color: white;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .difficulty-badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          background: var(--difficulty-bg);
          color: var(--difficulty-color);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid var(--difficulty-border);
        }
        
        .tag-list {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        
        .tag {
          padding: 4px 10px;
          background: #f3f4f6;
          color: #6b7280;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }
        
        /* 空状態 */
        .empty-state {
          background: white;
          border-radius: 20px;
          padding: 60px 24px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        .empty-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          border-radius: 50%;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
        }
        
        .empty-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #374151;
        }
        
        .empty-text {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 24px;
        }
        
        .empty-button {
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
        
        .empty-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        /* モバイル版デザイン */
        @media (max-width: 768px) {
          .practice-container {
            padding: 12px;
            background: #f8f9fa;
          }
          
          /* ヘッダーセクション */
          .practice-header {
            text-align: center;
            margin-bottom: 16px;
          }
          
          .practice-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 4px;
          }
          
          .practice-subtitle {
            font-size: 11px;
            color: #6b7280;
            line-height: 1.4;
          }
          
          /* 統計カード - 横スクロール */
          .stats-grid {
            display: flex;
            gap: 10px;
            margin-bottom: 16px;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          
          .stats-grid::-webkit-scrollbar {
            display: none;
          }
          
          .stat-card {
            background: white;
            border-radius: 12px;
            padding: 14px;
            min-width: 120px;
            flex-shrink: 0;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
          }
          
          .stat-card::before {
            height: 3px;
          }
          
          .stat-icon {
            width: 32px;
            height: 32px;
            border-radius: 10px;
            margin-bottom: 10px;
          }
          
          .stat-icon svg {
            width: 16px;
            height: 16px;
          }
          
          .stat-value {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 2px;
          }
          
          .stat-label {
            font-size: 10px;
            color: #6b7280;
          }
          
          /* 検索とフィルターセクション */
          .search-filter-card {
            background: white;
            border-radius: 12px;
            padding: 14px;
            margin-bottom: 16px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
          }
          
          /* AI生成ボタン */
          .ai-generate-button-top {
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px 16px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }
          
          .ai-generate-button-top svg {
            width: 16px;
            height: 16px;
          }
          
          .divider {
            height: 1px;
            background: #e5e7eb;
            margin-bottom: 12px;
          }
          
          /* 検索入力 */
          .search-container {
            position: relative;
            margin-bottom: 12px;
          }
          
          .search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 16px;
            height: 16px;
            color: #9ca3af;
          }
          
          .search-input {
            width: 100%;
            padding: 10px 12px 10px 36px;
            border: 1.5px solid #e5e7eb;
            border-radius: 8px;
            font-size: 13px;
          }
          
          /* フィルターセクション */
          .filter-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          
          .filter-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .filter-label {
            font-size: 11px;
            font-weight: 600;
            color: #374151;
          }
          
          .filter-buttons {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
          }
          
          .filter-button {
            padding: 6px 10px;
            border: 1.5px solid #e5e7eb;
            background: white;
            border-radius: 14px;
            font-size: 10px;
            font-weight: 500;
            color: #6b7280;
            transition: all 0.2s ease;
          }
          
          .filter-button.active {
            border: 1.5px solid transparent;
          }
          
          /* 質問カード */
          .questions-grid {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          
          .question-card {
            background: white;
            border-radius: 12px;
            padding: 14px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
          }
          
          .question-card::before {
            width: 3px;
          }
          
          .question-header {
            margin-bottom: 10px;
          }
          
          .question-title {
            font-size: 13px;
            font-weight: 600;
            line-height: 1.4;
            margin-bottom: 6px;
            color: #111827;
          }
          
          .question-description {
            font-size: 11px;
            color: #6b7280;
            line-height: 1.4;
            margin-bottom: 10px;
          }
          
          .question-meta {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
          }
          
          /* バッジスタイル */
          .category-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
          }
          
          .category-badge svg {
            width: 10px;
            height: 10px;
          }
          
          .difficulty-badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
          }
          
          .tag-list {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
          }
          
          .tag {
            padding: 2px 6px;
            background: #f3f4f6;
            color: #6b7280;
            border-radius: 8px;
            font-size: 9px;
            font-weight: 500;
          }
          
          /* 空状態 */
          .empty-state {
            background: white;
            border-radius: 12px;
            padding: 32px 16px;
            text-align: center;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
          }
          
          .empty-icon {
            width: 56px;
            height: 56px;
            margin: 0 auto 16px;
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          }
          
          .empty-icon svg {
            width: 28px;
            height: 28px;
          }
          
          .empty-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 6px;
          }
          
          .empty-text {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 16px;
            line-height: 1.4;
          }
          
          .empty-button {
            padding: 10px 16px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
          }
          
          .empty-button svg {
            width: 14px;
            height: 14px;
            margin-right: 4px;
          }
          
          /* AI生成モーダル */
          .ai-generator-overlay {
            padding: 0;
          }
          
          .ai-generator-panel {
            max-width: 100%;
            width: 100%;
            height: 100vh;
            max-height: 100vh;
            border-radius: 0;
            overflow-y: auto;
          }
          
          .ai-header {
            padding: 16px;
            position: sticky;
            top: 0;
            background: white;
            z-index: 10;
          }
          
          .ai-icon-wrapper {
            width: 36px;
            height: 36px;
            border-radius: 10px;
          }
          
          .ai-icon-wrapper svg {
            width: 18px;
            height: 18px;
          }
          
          .ai-title {
            font-size: 18px;
            font-weight: 700;
          }
          
          .ai-subtitle {
            font-size: 11px;
            color: #6b7280;
            margin-top: 2px;
          }
          
          .close-button {
            width: 32px;
            height: 32px;
            border-radius: 8px;
          }
          
          .close-button svg {
            width: 18px;
            height: 18px;
          }
          
          .ai-form {
            padding: 16px;
          }
          
          /* フォームセクション */
          .form-section {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 20px;
            padding-bottom: 20px;
          }
          
          .section-number {
            width: 24px;
            height: 24px;
            font-size: 11px;
            border-radius: 50%;
          }
          
          .form-label {
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 8px;
            gap: 6px;
          }
          
          .required {
            font-size: 9px;
            padding: 2px 6px;
            border-radius: 10px;
          }
          
          .form-select {
            padding: 10px 32px 10px 12px;
            border: 1.5px solid #e5e7eb;
            border-radius: 8px;
            font-size: 13px;
          }
          
          .select-icon {
            right: 12px;
            font-size: 10px;
          }
          
          /* カテゴリグリッド */
          .category-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          
          .category-card {
            padding: 12px;
            border: 1.5px solid #e5e7eb;
            border-radius: 10px;
            gap: 10px;
          }
          
          .category-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
          }
          
          .category-icon svg {
            width: 16px;
            height: 16px;
          }
          
          .category-name {
            font-size: 12px;
            font-weight: 500;
          }
          
          .category-check {
            width: 20px;
            height: 20px;
            border-radius: 4px;
            font-size: 10px;
          }
          
          /* 詳細設定 */
          .setting-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          
          .setting-label {
            font-size: 11px;
            font-weight: 500;
          }
          
          .pill-selector {
            width: 100%;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
          }
          
          .pill-option {
            padding: 6px 8px;
            border: 1.5px solid #e5e7eb;
            border-radius: 14px;
            font-size: 10px;
            font-weight: 500;
          }
          
          /* 生成セクション */
          .generate-section {
            margin-top: 20px;
            padding-top: 20px;
          }
          
          .generate-preview {
            font-size: 11px;
            line-height: 1.5;
            margin-bottom: 12px;
          }
          
          .generate-button-new {
            width: 100%;
            padding: 12px 16px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 600;
            gap: 6px;
          }
          
          .form-hint {
            font-size: 10px;
            color: #6b7280;
            margin-top: 6px;
          }
          
          .spinner {
            width: 16px;
            height: 16px;
          }
        }
        
        /* 小さいスマホ対応 (iPhone SE等) */
        @media (max-width: 375px) {
          .practice-container {
            padding: 10px;
          }
          
          .practice-title {
            font-size: 18px;
          }
          
          .stat-card {
            min-width: 100px;
            padding: 12px;
          }
          
          .stat-value {
            font-size: 18px;
          }
          
          .question-title {
            font-size: 12px;
          }
          
          .filter-button {
            font-size: 9px;
            padding: 5px 8px;
          }
        }
      `}</style>

      <div className="practice-container">
        {/* ヘッダー */}
        <div className="practice-header">
          <h1 className="practice-title">面接練習</h1>
          <p className="practice-subtitle">実践的な面接対策で、自信を持って本番に臨みましょう</p>
        </div>

        {/* 統計カード */}
        <div className="stats-grid">
          <div className="stat-card" style={{ '--stat-color': '#667eea', '--stat-color-light': '#764ba2' } as React.CSSProperties}>
            <div className="stat-icon">
              <BookOpen size={24} />
            </div>
            <div className="stat-value">{questions.length}</div>
            <div className="stat-label">登録済み質問</div>
          </div>
          
          <div className="stat-card" style={{ '--stat-color': '#f093fb', '--stat-color-light': '#f5576c' } as React.CSSProperties}>
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-value">15</div>
            <div className="stat-label">平均練習時間（分）</div>
          </div>
          
          <div className="stat-card" style={{ '--stat-color': '#4facfe', '--stat-color-light': '#00f2fe' } as React.CSSProperties}>
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-value">85%</div>
            <div className="stat-label">上達率</div>
          </div>
        </div>

        {/* 検索とフィルター */}
        <div className="search-filter-card">
          {/* AI生成ボタン（カード内上部） */}
          <button
            className="ai-generate-button-top"
            onClick={() => setShowAIGenerator(!showAIGenerator)}
          >
            <Sparkles size={20} />
            <span>AIで新しい質問を生成</span>
          </button>
          
          <div className="divider"></div>
          
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="質問を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-section">
            <div className="filter-group">
              <span className="filter-label">カテゴリ:</span>
              <div className="filter-buttons">
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <button
                    key={key}
                    className={`filter-button ${selectedCategory === key ? 'active' : ''}`}
                    style={{ 
                      '--filter-color': config.color, 
                      '--filter-color-light': config.color + 'cc' 
                    } as React.CSSProperties}
                    onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="filter-group">
              <span className="filter-label">難易度:</span>
              <div className="filter-buttons">
                {Object.entries(difficultyConfig).map(([key, config]) => (
                  <button
                    key={key}
                    className={`filter-button ${selectedDifficulty === key ? 'active' : ''}`}
                    style={{ 
                      '--filter-color': config.color, 
                      '--filter-color-light': config.color + 'cc' 
                    } as React.CSSProperties}
                    onClick={() => setSelectedDifficulty(selectedDifficulty === key ? null : key)}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 質問一覧 */}
        <div className="questions-grid">
          {filteredQuestions.map((question) => {
            const categoryInfo = categoryConfig[question.category as keyof typeof categoryConfig];
            const difficultyInfo = difficultyConfig[question.difficulty as keyof typeof difficultyConfig];
            const Icon = categoryInfo.icon;
            
            return (
              <div
                key={question.id}
                className="question-card"
                style={{ 
                  '--category-color': categoryInfo.color,
                  '--category-color-light': categoryInfo.color + 'cc'
                } as React.CSSProperties}
                onClick={() => handleQuestionClick(question.id)}
              >
                <div className="question-header">
                  <div className="question-content">
                    <h3 className="question-title">{question.question}</h3>
                    <p className="question-description">
                      {question.keyPoints.slice(0, 2).join(' / ')}
                      {question.keyPoints.length > 2 && '...'}
                    </p>
                    <div className="tag-list">
                      {question.tags.map((tag) => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="question-meta">
                  <div 
                    className="category-badge"
                    style={{ 
                      '--category-color': categoryInfo.color,
                      '--category-color-light': categoryInfo.color + 'cc'
                    } as React.CSSProperties}
                  >
                    <Icon size={14} />
                    {categoryInfo.label}
                  </div>
                  <div 
                    className="difficulty-badge"
                    style={{ 
                      '--difficulty-bg': difficultyInfo.color + '20',
                      '--difficulty-color': difficultyInfo.color,
                      '--difficulty-border': difficultyInfo.color + '40'
                    } as React.CSSProperties}
                  >
                    {difficultyInfo.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 空状態 */}
        {filteredQuestions.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <Search size={40} />
            </div>
            <h3 className="empty-title">該当する質問が見つかりませんでした</h3>
            <p className="empty-text">
              検索条件を変更するか、AIで新しい質問を生成してください
            </p>
            <button className="empty-button" onClick={() => setShowAIGenerator(true)}>
              <Sparkles size={16} style={{ display: 'inline', marginRight: '6px' }} />
              AI質問を生成
            </button>
          </div>
        )}

        {/* AI生成パネル */}
        {showAIGenerator && (
          <div className="ai-generator-overlay" onClick={() => setShowAIGenerator(false)}>
            <div className="ai-generator-panel" onClick={(e) => e.stopPropagation()}>
              <AIQuestionGenerator 
                onQuestionsGenerated={handleAIQuestionsGenerated}
                onClose={() => setShowAIGenerator(false)}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}