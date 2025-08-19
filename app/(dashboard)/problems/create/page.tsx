'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { GeminiProblemRequest } from '@/types/gemini';
import { 
  Sparkles, Loader2, Calculator, Type, MessageSquare, Brain, Globe, Code,
  CheckCircle, Circle, Target, Grid3X3, FileText, List, Shuffle,
  BarChart, AlertTriangle, ArrowLeft, BookOpen, Hash, Scroll, Languages
} from 'lucide-react';

// デバッグモード
const DEBUG_MODE = process.env.NODE_ENV === 'development';

// エラーメッセージの定義
const ERROR_MESSAGES = {
  GENERATION_FAILED: '問題の生成に失敗しました。もう一度お試しください。',
  API_LIMIT: 'API利用制限に達しました。しばらくお待ちください。',
  INVALID_RESPONSE: '正しい形式の問題を生成できませんでした。',
  NO_QUESTION: '問題文が生成されませんでした。',
  NO_ANSWER: '答えが生成されませんでした。',
  NETWORK_ERROR: 'ネットワークエラーが発生しました。接続を確認してください。',
  TIMEOUT: 'タイムアウトしました。もう一度お試しください。'
};

// CircleDot アイコンコンポーネント
const CircleDot: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);

// 科目カテゴリー定義（国語のトピックを整理）
const SUBJECT_CATEGORIES = {
  mathematics: {
    name: '数学',
    icon: <Calculator className="h-5 w-5" />,
    subjects: {
      math1: { name: '数学Ⅰ', topics: ['数と式', '図形と計量', '2次関数', 'データの分析'] },
      mathA: { name: '数学A', topics: ['場合の数と確率', '整数の性質', '図形の性質'] },
      math2: { name: '数学Ⅱ', topics: ['式と証明', '複素数と方程式', '図形と方程式', '三角関数', '指数関数・対数関数', '微分法と積分法'] },
      mathB: { name: '数学B', topics: ['数列', '統計的な推測'] },
      mathC: { name: '数学C', topics: ['ベクトル', '平面上の曲線と複素数平面'] },
      math3: { name: '数学Ⅲ', topics: ['極限', '微分法', '積分法'] }
    }
  },
  japanese: {
    name: '国語',
    icon: <Type className="h-5 w-5" />,
    subjects: {
      japanese: { 
        name: '国語', 
        topics: ['現代文（評論）', '現代文（物語）', '古文', '漢文'] 
      }
    }
  },
  english: {
    name: '英語',
    icon: <MessageSquare className="h-5 w-5" />,
    subjects: {
      englishReading: { 
        name: '英語リーディング', 
        topics: null // 英語はトピック選択なし
      }
    }
  },
  science: {
    name: '理科',
    icon: <Brain className="h-5 w-5" />,
    subjects: {
      physicsBase: { name: '物理基礎', topics: ['運動の表し方', '様々な力とその働き', '力学的エネルギー', '熱', '波', '電気', 'エネルギーの利用'] },
      physics: { name: '物理', topics: ['様々な運動', '波', '電気と磁気', '原子'] },
      chemistryBase: { name: '化学基礎', topics: ['物質の構成', '物質の変化', '化学反応', '化学が拓く世界'] },
      chemistry: { name: '化学', topics: ['物質の状態と平衡', '物質の変化と平衡', '無機物質', '有機化合物', '高分子化合物'] },
      biologyBase: { name: '生物基礎', topics: ['生物の特徴', '遺伝子とその働き', '生物の体内環境の維持', '生物の多様性と生態系'] },
      biology: { name: '生物', topics: ['生命現象と物質', '生殖と発生', '生物の環境応答', '生態と環境', '生物の進化と系統'] },
      earthScienceBase: { name: '地学基礎', topics: ['宇宙における地球', '変動する地球', '大気と海洋', '地球の環境'] },
      earthScience: { name: '地学', topics: ['地球の概観', '地球の活動と歴史', '地球の大気と海洋', '宇宙の構造'] }
    }
  },
  socialStudies: {
    name: '地理歴史・公民',
    icon: <Globe className="h-5 w-5" />,
    subjects: {
      geographyComprehensive: { name: '地理総合', topics: ['地図と地理情報システム', '国際理解と国際協力', '持続可能な地域づくり', '防災'] },
      geography: { name: '地理探究', topics: ['現代世界の系統地理的考察', '現代世界の地誌的考察', '現代日本に求められる国土像'] },
      historyComprehensive: { name: '歴史総合', topics: ['近代化と私たち', '国際秩序の変化や大衆化と私たち', 'グローバル化と私たち'] },
      japaneseHistory: { name: '日本史探究', topics: ['原始・古代の日本と東アジア', '中世の日本と世界', '近世の日本と世界', '近現代の地域・日本と世界'] },
      worldHistory: { name: '世界史探究', topics: ['世界史への扉', '諸地域の歴史的特質の形成', '諸地域の交流・再編', '諸地域の結合・変容', '地球世界の到来'] },
      civicsBase: { name: '公共', topics: ['公共の扉', '自立した主体としてよりよい社会の形成に参画する私たち', '持続可能な社会づくりの主体となる私たち'] },
      ethics: { name: '倫理', topics: ['現代に生きる自己の課題と人間としての在り方生き方', '国際社会に生きる日本人としての自覚'] },
      politicsEconomics: { name: '政治・経済', topics: ['現代日本における政治・経済の諸課題', 'グローバル化する国際社会の諸課題'] }
    }
  },
  information: {
    name: '情報',
    icon: <Code className="h-5 w-5" />,
    subjects: {
      information1: { name: '情報Ⅰ', topics: ['情報社会の問題解決', 'コミュニケーションと情報デザイン', 'コンピュータとプログラミング', '情報通信ネットワークとデータの活用'] }
    }
  }
};

// 難易度レベル
const DIFFICULTY_LEVELS = [
  { 
    id: 'easy', 
    name: '基礎', 
    description: '教科書の例題レベル',
    icon: <Circle className="h-4 w-4" />,
    color: '#10b981'
  },
  { 
    id: 'medium', 
    name: '標準', 
    description: '共通テストレベル',
    icon: <CircleDot className="h-4 w-4" />,
    color: '#3b82f6'
  },
  { 
    id: 'hard', 
    name: '発展', 
    description: '難関大学レベル',
    icon: <Target className="h-4 w-4" />,
    color: '#8b5cf6'
  }
];

// 問題形式の取得（国語のトピックに応じて変更）
const getProblemTypes = (subject: string, topic?: string) => {
  const baseTypes = [
    { 
      id: 'multiple_choice', 
      name: '選択問題', 
      description: '4つの選択肢から正解を選ぶ', 
      icon: <Grid3X3 className="h-5 w-5" />
    }
  ];

  // 国語の場合（トピックによって異なる）
  if (subject === 'japanese') {
    if (topic === '現代文（評論）' || topic === '現代文（物語）') {
      return [
        ...baseTypes,
        {
          id: 'reading_comprehension',
          name: '長文読解問題',
          description: '長文を読んで内容を理解する',
          icon: <BookOpen className="h-5 w-5" />
        },
        {
          id: 'vocabulary',
          name: '漢字問題',
          description: '同じ漢字を使う熟語など',
          icon: <Hash className="h-5 w-5" />
        }
      ];
    } else if (topic === '古文') {
      return [
        ...baseTypes,
        {
          id: 'reading_comprehension',
          name: '古文読解問題',
          description: '古文を読んで内容を理解する',
          icon: <Scroll className="h-5 w-5" />
        },
        {
          id: 'vocabulary',
          name: '古文単語・文法問題',
          description: '助詞・助動詞の識別など',
          icon: <Type className="h-5 w-5" />
        }
      ];
    } else if (topic === '漢文') {
      return [
        ...baseTypes,
        {
          id: 'reading_comprehension',
          name: '漢文読解問題',
          description: '漢文を読んで内容を理解する',
          icon: <Scroll className="h-5 w-5" />
        },
        {
          id: 'vocabulary',
          name: '句法問題',
          description: '返り点・句法の理解',
          icon: <Type className="h-5 w-5" />
        }
      ];
    }
  }

  // 英語の場合
  if (subject === 'englishReading') {
    return [
      ...baseTypes,
      {
        id: 'reading_comprehension',
        name: '長文読解問題',
        description: '英文を読んで内容を理解する',
        icon: <BookOpen className="h-5 w-5" />
      },
      {
        id: 'vocabulary',
        name: '語彙・熟語問題',
        description: '単語の意味や熟語の用法',
        icon: <Languages className="h-5 w-5" />
      },
      {
        id: 'sentence_sequence',
        name: '文章並び替え問題',
        description: '英文を正しい順序に並び替える',
        icon: <Shuffle className="h-5 w-5" />
      }
    ];
  }

  // STEM科目（数学・理科・情報）
  const isSTEMSubject = ['math1', 'mathA', 'math2', 'mathB', 'mathC', 'math3', 
    'physicsBase', 'physics', 'chemistryBase', 'chemistry', 'biologyBase', 'biology', 
    'earthScienceBase', 'earthScience', 'information1'].includes(subject);

  if (isSTEMSubject) {
    return [
      ...baseTypes,
      {
        id: 'fill_in_blank',
        name: '公式穴埋め問題',
        description: '公式の空欄を埋める',
        icon: <Type className="h-5 w-5" />
      },
      {
        id: 'solution_sequence',
        name: '解法並び替え問題',
        description: '解法の手順を正しい順序に並び替える',
        icon: <List className="h-5 w-5" />
      }
    ];
  }

  // 社会科目
  const isSocialSubject = ['geographyComprehensive', 'geography', 'historyComprehensive', 
    'japaneseHistory', 'worldHistory', 'civicsBase', 'ethics', 'politicsEconomics'].includes(subject);

  if (isSocialSubject) {
    return [
      ...baseTypes,
      {
        id: 'fill_in_blank',
        name: '穴埋め問題',
        description: '空欄に適切な答えを記入',
        icon: <Type className="h-5 w-5" />
      },
      {
        id: 'event_sequence',
        name: '出来事並び替え問題',
        description: '出来事を時系列順に並び替える',
        icon: <List className="h-5 w-5" />
      }
    ];
  }

  // デフォルト
  return baseTypes;
};

// 英語用のデフォルトトピックを返す関数
const getEnglishDefaultTopic = (problemType: string): string => {
  switch (problemType) {
    case 'reading_comprehension':
      return '長文読解';
    case 'vocabulary':
      return '語彙・文法';
    case 'sentence_sequence':
      return '文章構成';
    default:
      return '総合問題';
  }
};

// SSEデータの型定義
interface SSEData {
  status: string;
  [key: string]: any;
}

// SSEデータのバリデーション
function validateSSEData(data: SSEData, requiredFields: string[]): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  for (const field of requiredFields) {
    if (!(field in data) || data[field] === undefined || data[field] === null) {
      if (DEBUG_MODE) {
        console.error(`Missing required field: ${field}`, data);
      }
      return false;
    }
  }
  
  return true;
}

export default function ProblemGeneratorPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // フォームの状態
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  
  // 生成中の状態
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<string>('');

  // 認証チェック
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // 問題を保存する関数
  const saveProblem = async (problemData: any, userId: string): Promise<string> => {
    try {
      // カテゴリー名と科目名を取得
      const categoryName = SUBJECT_CATEGORIES[selectedCategory]?.name || '';
      const subjectName = SUBJECT_CATEGORIES[selectedCategory]?.subjects[selectedSubject]?.name || '';
      
      const saveData = {
        // 基本情報
        subject: selectedSubject,
        topic: selectedSubject === 'englishReading' ? getEnglishDefaultTopic(selectedType) : selectedTopic,
        difficulty: selectedDifficulty,
        type: selectedType,
        
        // 問題内容
        question: problemData.question,
        correctAnswer: problemData.answer || '',
        explanation: problemData.explanation || '',
        
        // オプション項目
        ...(problemData.options && { options: problemData.options }),
        ...(problemData.hints && problemData.hints.length > 0 && { hints: problemData.hints }),
        ...(problemData.canvasData && { canvasData: problemData.canvasData }),
        
        // 長文読解用
        ...(problemData.passageText && { passageText: problemData.passageText }),
        ...(problemData.passageTitle && { passageTitle: problemData.passageTitle }),
        ...(problemData.passageMetadata && { passageMetadata: problemData.passageMetadata }),
        
        // 語彙問題用
        ...(problemData.vocabularyType && { vocabularyType: problemData.vocabularyType }),
        ...(problemData.targetWord && { targetWord: problemData.targetWord }),
        
        // メタデータ
        title: `${selectedSubject === 'englishReading' ? getEnglishDefaultTopic(selectedType) : selectedTopic}の問題`,
        tags: [selectedSubject, selectedTopic || getEnglishDefaultTopic(selectedType), selectedDifficulty],
        estimatedTime: problemData.estimatedTime || 15,
        keywords: problemData.keywords || [selectedTopic || getEnglishDefaultTopic(selectedType), selectedSubject],
        
        // モデル情報
        model: problemData.model || '',
        modelReason: problemData.modelReason || '',
        
        // 作成情報
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        // 追加のメタデータ
        metadata: {
          categoryName,
          subjectName,
          isAIGenerated: true,
          ...(additionalRequirements && { additionalRequirements })
        }
      };

      if (DEBUG_MODE) {
        console.log('Saving to Firestore:', saveData);
      }

      const docRef = await addDoc(collection(db, 'problems'), saveData);
      return docRef.id;
    } catch (error) {
      console.error('Error saving problem:', error);
      throw error;
    }
  };

  // SSEで問題生成
  const generateProblem = async () => {
    setIsGenerating(true);
    setError('');
    setGenerationProgress('接続中...');

    let retryCount = 0;
    const maxRetries = 3;

    const attemptGeneration = async (): Promise<void> => {
      try {
        const requestBody = {
          subject: selectedSubject,
          topic: selectedSubject === 'englishReading' ? getEnglishDefaultTopic(selectedType) : selectedTopic,
          difficulty: selectedDifficulty,
          problemType: selectedType,
          additionalRequirements: additionalRequirements,
          subjectName: SUBJECT_CATEGORIES[selectedCategory]?.subjects[selectedSubject]?.name || selectedSubject
        };

        if (DEBUG_MODE) {
          console.log('Generating problem with:', requestBody);
        }

        setGenerationProgress('問題を生成中...');

        // SSEでストリーミングレスポンスを受信
        const response = await fetch('/api/ai/generate-problem', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        let problemData: any = {
          question: '',
          options: null,
          answer: '',
          explanation: '',
          hints: [],
          canvasData: null,
          estimatedTime: 15,
          keywords: [],
          model: '',
          modelReason: ''
        };

        if (!reader) {
          throw new Error('Response body is not readable');
        }

        // SSEストリームを読み取る
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (DEBUG_MODE) {
                  console.log('SSE data received:', data);
                }

                switch (data.status) {
                  case 'generating':
                    problemData.model = data.model;
                    problemData.modelReason = data.modelReason;
                    setGenerationProgress('AIモデルを初期化中...');
                    break;
                    
                  case 'passage_ready':
                    if (validateSSEData(data, ['passageTitle', 'passageText'])) {
                      problemData.passageTitle = data.passageTitle;
                      problemData.passageText = data.passageText;
                      problemData.passageMetadata = data.passageMetadata;
                      setGenerationProgress('文章を生成しました...');
                    }
                    break;
                    
                  case 'question_ready':
                    if (!validateSSEData(data, ['question'])) {
                      console.error('question_ready received without question data:', data);
                      throw new Error(ERROR_MESSAGES.NO_QUESTION);
                    }
                    problemData.question = data.question;
                    if (data.sequences) {
                      problemData.sequences = data.sequences;
                    }
                    if (data.vocabularyType) {
                      problemData.vocabularyType = data.vocabularyType;
                    }
                    if (data.targetWord) {
                      problemData.targetWord = data.targetWord;
                    }
                    setGenerationProgress('問題文を生成しました...');
                    break;
                    
                  case 'options_ready':
                    problemData.options = data.options;
                    setGenerationProgress('選択肢を生成しました...');
                    break;
                    
                  case 'answer_ready':
                    if (!validateSSEData(data, ['answer'])) {
                      console.error('answer_ready received without answer data:', data);
                      throw new Error(ERROR_MESSAGES.NO_ANSWER);
                    }
                    problemData.answer = data.answer;
                    setGenerationProgress('答えを生成しました...');
                    break;
                    
                  case 'explanation_ready':
                    problemData.explanation = data.explanation || '';
                    problemData.hints = data.hints || [];
                    if (data.relatedWords) {
                      problemData.relatedWords = data.relatedWords;
                    }
                    if (data.keyPoints) {
                      problemData.keyPoints = data.keyPoints;
                    }
                    setGenerationProgress('解説を生成しました...');
                    break;
                    
                  case 'canvas_ready':
                    problemData.canvasData = data.canvasData;
                    setGenerationProgress('図形データを生成しました...');
                    break;
                    
                  case 'complete':
                    problemData.estimatedTime = data.estimatedTime || 15;
                    problemData.keywords = data.keywords || [];
                    setGenerationProgress('問題生成が完了しました！');
                    break;
                    
                  case 'error':
                    const errorMsg = data.detail ? `${data.error}\n詳細: ${data.detail}` : data.error;
                    throw new Error(errorMsg);
                }
              } catch (parseError) {
                if (parseError instanceof Error && parseError.message.includes('question') || parseError.message.includes('answer')) {
                  throw parseError;
                }
                console.error('Error parsing SSE data:', parseError);
              }
            }
          }
        }

        // 問題データの検証
        if (!problemData.question) {
          console.error('Generated problem data:', problemData);
          throw new Error(ERROR_MESSAGES.NO_QUESTION);
        }
        
        // 答えの検証（fill_in_blankの場合は答えが必須）
        if (selectedType === 'fill_in_blank' && !problemData.answer) {
          console.error('No answer generated for fill_in_blank problem');
          throw new Error(ERROR_MESSAGES.NO_ANSWER);
        }

        // 問題を保存
        setGenerationProgress('問題を保存中...');
        const problemId = await saveProblem(problemData, user!.uid);
        
        if (DEBUG_MODE) {
          console.log('Problem saved with ID:', problemId);
        }
        
        // 問題詳細ページへ遷移
        router.push(`/problems/${problemId}`);

      } catch (err) {
        console.error('Problem generation error:', err);
        
        // リトライ可能なエラーの場合
        if (err instanceof Error && 
            (err.message.includes('503') || 
             err.message.includes('overloaded') || 
             err.message.includes('timeout'))) {
          if (retryCount < maxRetries) {
            retryCount++;
            setGenerationProgress(`エラーが発生しました。再試行中... (${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
            return attemptGeneration();
          }
        }
        
        // エラーメッセージの設定
        let errorMessage = ERROR_MESSAGES.GENERATION_FAILED;
        if (err instanceof Error) {
          if (err.message.includes('503') || err.message.includes('overloaded')) {
            errorMessage = ERROR_MESSAGES.API_LIMIT;
          } else if (err.message.includes('timeout')) {
            errorMessage = ERROR_MESSAGES.TIMEOUT;
          } else if (err.message.includes('Network')) {
            errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
          } else if (err.message.includes('問題文') || err.message.includes('答え')) {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
        setIsGenerating(false);
        setGenerationProgress('');
      }
    };

    await attemptGeneration();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // 英語の場合、トピック選択後すぐに難易度選択を表示するかどうか
  const shouldShowDifficulty = selectedTopic || selectedSubject === 'englishReading';

  return (
    <>
      <style jsx global>{`
        .generator-content {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          min-height: 100vh;
          background: #f8f9fa;
        }
        
        @media (max-width: 640px) {
          .generator-content {
            padding: 16px;
          }
        }
        
        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 24px;
        }
        
        .back-button:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
        
        .generator-header {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .generator-title {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        @media (max-width: 640px) {
          .generator-title {
            font-size: 28px;
          }
        }
        
        .generator-subtitle {
          font-size: 16px;
          color: #6b7280;
        }
        
        @media (max-width: 640px) {
          .generator-subtitle {
            font-size: 14px;
          }
        }
        
        .generator-container {
          background: white;
          border-radius: 20px;
          padding: 32px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        @media (max-width: 640px) {
          .generator-container {
            padding: 20px;
            border-radius: 16px;
          }
        }
        
        .step-section {
          margin-bottom: 32px;
        }
        
        .step-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .step-number {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          flex-shrink: 0;
        }
        
        .step-title {
          font-size: 20px;
          font-weight: 600;
          color: #111827;
        }
        
        @media (max-width: 640px) {
          .step-title {
            font-size: 18px;
          }
        }
        
        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 16px;
        }
        
        @media (max-width: 640px) {
          .category-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
        }
        
        .category-card {
          padding: 24px 16px;
          border-radius: 16px;
          border: 2px solid #e5e7eb;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }
        
        @media (max-width: 640px) {
          .category-card {
            padding: 20px 12px;
          }
        }
        
        .category-card:hover {
          border-color: #d1d5db;
          transform: translateY(-2px);
        }
        
        .category-card.selected {
          border-color: #667eea;
          background: #f3f4ff;
        }
        
        .category-icon {
          width: 48px;
          height: 48px;
          background: #f3f4f6;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          transition: all 0.2s ease;
        }
        
        @media (max-width: 640px) {
          .category-icon {
            width: 40px;
            height: 40px;
          }
        }
        
        .category-card.selected .category-icon {
          background: #667eea;
          color: white;
        }
        
        .category-name {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }
        
        .subject-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }
        
        @media (max-width: 640px) {
          .subject-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .subject-card {
          padding: 20px;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .subject-card:hover {
          border-color: #d1d5db;
          transform: translateY(-2px);
        }
        
        .subject-card.selected {
          border-color: #667eea;
          background: #f3f4ff;
        }
        
        .subject-name {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }
        
        .subject-info {
          font-size: 12px;
          color: #6b7280;
        }
        
        .topic-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 10px;
        }
        
        @media (max-width: 640px) {
          .topic-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
        }
        
        .topic-button {
          padding: 12px 16px;
          border-radius: 10px;
          border: 2px solid #e5e7eb;
          background: white;
          font-size: 14px;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }
        
        @media (max-width: 640px) {
          .topic-button {
            padding: 10px 12px;
            font-size: 13px;
          }
        }
        
        .topic-button:hover {
          border-color: #d1d5db;
        }
        
        .topic-button.selected {
          border-color: #10b981;
          background: #d1fae5;
          color: #065f46;
          font-weight: 500;
        }
        
        .difficulty-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        
        @media (max-width: 640px) {
          .difficulty-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
        
        .difficulty-card {
          position: relative;
          padding: 24px;
          border-radius: 16px;
          border: 2px solid #e5e7eb;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          overflow: hidden;
        }
        
        @media (max-width: 640px) {
          .difficulty-card {
            padding: 20px;
          }
        }
        
        .difficulty-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .difficulty-card.selected {
          border-color: #374151;
          background: #f9fafb;
        }
        
        .difficulty-indicator {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          border-radius: 4px 4px 0 0;
        }
        
        .difficulty-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .difficulty-name {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }
        
        .difficulty-description {
          font-size: 14px;
          color: #6b7280;
        }
        
        .type-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }
        
        @media (max-width: 640px) {
          .type-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
        
        .type-card {
          padding: 20px;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .type-card:hover {
          border-color: #d1d5db;
          transform: translateY(-2px);
        }
        
        .type-card.selected {
          border-color: #8b5cf6;
          background: #f5f3ff;
        }
        
        .type-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        
        .type-icon {
          width: 40px;
          height: 40px;
          background: #f3f4f6;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        .type-card.selected .type-icon {
          background: #8b5cf6;
          color: white;
        }
        
        .type-name {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }
        
        .type-description {
          font-size: 14px;
          color: #6b7280;
          margin-left: 52px;
        }
        
        @media (max-width: 640px) {
          .type-description {
            margin-left: 0;
            margin-top: 8px;
          }
        }
        
        .options-section {
          margin-bottom: 32px;
        }
        
        .options-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        
        .additional-textarea {
          width: 100%;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 16px;
          resize: vertical;
          font-family: inherit;
          transition: border-color 0.2s ease;
        }
        
        @media (max-width: 640px) {
          .additional-textarea {
            font-size: 14px;
            padding: 12px;
          }
        }
        
        .additional-textarea:focus {
          outline: none;
          border-color: #667eea;
        }
        
        .generate-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
          padding: 16px 32px;
          background: linear-gradient(135deg, #8b5cf6 0%, #667eea 100%);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
        }
        
        @media (max-width: 640px) {
          .generate-button {
            font-size: 16px;
            padding: 14px 24px;
          }
        }
        
        .generate-button:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 12px 32px rgba(139, 92, 246, 0.4);
        }
        
        .generate-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .error-title {
          font-size: 16px;
          font-weight: 600;
          color: #991b1b;
          margin-bottom: 4px;
        }
        
        .error-text {
          font-size: 14px;
          color: #dc2626;
        }
        
        .type-note {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 16px;
          font-size: 14px;
          color: #92400e;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .type-note-icon {
          flex-shrink: 0;
        }
        
        .english-skip-note {
          background: #dbeafe;
          border: 1px solid #60a5fa;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 16px;
          font-size: 14px;
          color: #1e40af;
        }
        
        .progress-indicator {
          background: #e0f2fe;
          border: 1px solid #38bdf8;
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .progress-text {
          font-size: 15px;
          color: #0369a1;
          font-weight: 500;
        }
        
        .loader-spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div className="generator-content">
        <button className="back-button" onClick={() => router.push('/problems')}>
          <ArrowLeft size={16} />
          問題一覧に戻る
        </button>

        <div className="generator-header">
          <h1 className="generator-title">問題を生成</h1>
          <p className="generator-subtitle">科目、トピック、難易度を選択して、オリジナルの問題を生成しましょう</p>
        </div>

        {error && (
          <div className="error-message">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="error-title">エラーが発生しました</h3>
              <p className="error-text">{error}</p>
            </div>
          </div>
        )}

        {generationProgress && (
          <div className="progress-indicator">
            <Loader2 className="h-5 w-5 text-blue-500 loader-spin" />
            <p className="progress-text">{generationProgress}</p>
          </div>
        )}

        <div className="generator-container">
          {/* ステップ1: カテゴリー選択 */}
          <div className="step-section">
            <div className="step-header">
              <span className="step-number">1</span>
              <h2 className="step-title">教科カテゴリーを選択</h2>
            </div>
            <div className="category-grid">
              {Object.entries(SUBJECT_CATEGORIES).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedCategory(key);
                    setSelectedSubject('');
                    setSelectedTopic('');
                    setSelectedType('');
                  }}
                  className={`category-card ${selectedCategory === key ? 'selected' : ''}`}
                  disabled={isGenerating}
                >
                  <div className="category-icon">
                    {category.icon}
                  </div>
                  <span className="category-name">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ステップ2: 科目選択 */}
          {selectedCategory && (
            <div className="step-section">
              <div className="step-header">
                <span className="step-number">2</span>
                <h2 className="step-title">科目を選択</h2>
              </div>
              <div className="subject-grid">
                {Object.entries(SUBJECT_CATEGORIES[selectedCategory].subjects).map(([key, subject]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedSubject(key);
                      setSelectedTopic('');
                      setSelectedType('');
                    }}
                    className={`subject-card ${selectedSubject === key ? 'selected' : ''}`}
                    disabled={isGenerating}
                  >
                    <h3 className="subject-name">{subject.name}</h3>
                    {subject.topics && (
                      <p className="subject-info">{subject.topics.length}個のトピック</p>
                    )}
                    {!subject.topics && key === 'englishReading' && (
                      <p className="subject-info">総合的な英語力を測定</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ステップ3: トピック選択（英語以外） */}
          {selectedSubject && selectedSubject !== 'englishReading' && SUBJECT_CATEGORIES[selectedCategory].subjects[selectedSubject].topics && (
            <div className="step-section">
              <div className="step-header">
                <span className="step-number">3</span>
                <h2 className="step-title">トピックを選択</h2>
              </div>
              <div className="topic-grid">
                {SUBJECT_CATEGORIES[selectedCategory].subjects[selectedSubject].topics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => {
                      setSelectedTopic(topic);
                      setSelectedType('');
                    }}
                    className={`topic-button ${selectedTopic === topic ? 'selected' : ''}`}
                    disabled={isGenerating}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 英語の場合のスキップ通知 */}
          {selectedSubject === 'englishReading' && !selectedDifficulty && (
            <div className="english-skip-note">
              <p>英語はトピック選択をスキップして、直接難易度を選択します。</p>
            </div>
          )}

          {/* ステップ4: 難易度選択 */}
          {shouldShowDifficulty && (
            <div className="step-section">
              <div className="step-header">
                <span className="step-number">{selectedSubject === 'englishReading' ? '3' : '4'}</span>
                <h2 className="step-title">難易度を選択</h2>
              </div>
              <div className="difficulty-grid">
                {DIFFICULTY_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setSelectedDifficulty(level.id)}
                    className={`difficulty-card ${selectedDifficulty === level.id ? 'selected' : ''}`}
                    disabled={isGenerating}
                  >
                    <div className="difficulty-indicator" style={{ backgroundColor: level.color }} />
                    <div className="difficulty-header">
                      {level.icon}
                      <h3 className="difficulty-name">{level.name}</h3>
                    </div>
                    <p className="difficulty-description">{level.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ステップ5: 問題形式選択 */}
          {selectedDifficulty && selectedSubject && (
            <div className="step-section">
              <div className="step-header">
                <span className="step-number">{selectedSubject === 'englishReading' ? '4' : '5'}</span>
                <h2 className="step-title">問題形式を選択</h2>
              </div>
              
              {/* 言語科目の場合の注意事項 */}
              {(selectedSubject === 'japanese' || selectedSubject === 'englishReading') && (
                <div className="type-note">
                  <AlertTriangle size={16} className="type-note-icon" />
                  <span>長文読解問題では、長文が生成されてから内容に関する問題が出題されます</span>
                </div>
              )}
              
              <div className="type-grid">
                {/* 国語の場合はトピックも必要 */}
                {(selectedSubject !== 'japanese' || selectedTopic) && 
                  getProblemTypes(selectedSubject, selectedTopic).map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={`type-card ${selectedType === type.id ? 'selected' : ''}`}
                      disabled={isGenerating}
                    >
                      <div className="type-header">
                        <div className="type-icon">
                          {type.icon}
                        </div>
                        <h3 className="type-name">{type.name}</h3>
                      </div>
                      <p className="type-description">{type.description}</p>
                    </button>
                  ))
                }
              </div>
            </div>
          )}

          {/* 追加オプション */}
          {selectedType && (
            <div className="options-section">
              <h3 className="options-title">追加オプション</h3>
              
              <div>
                <label className="options-title" style={{ fontSize: '16px', fontWeight: '500' }}>
                  追加の要望（任意）
                </label>
                <textarea
                  value={additionalRequirements}
                  onChange={(e) => setAdditionalRequirements(e.target.value)}
                  placeholder="例：実生活での応用例を含めてください"
                  className="additional-textarea"
                  rows={3}
                  disabled={isGenerating}
                />
              </div>
            </div>
          )}

          {/* 生成ボタン */}
          {selectedType && (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={generateProblem}
                disabled={isGenerating}
                className="generate-button"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    問題を生成する
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
