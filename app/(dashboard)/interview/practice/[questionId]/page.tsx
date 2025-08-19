'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mic, MicOff, Play, Pause, RotateCcw, Send, ChevronRight, Sparkles, Clock, AlertCircle, Target, Users, BookOpen, Briefcase, TrendingUp, X, CheckCircle } from 'lucide-react';
import { getInterviewQuestion } from '@/lib/firebase/interview';
import { submitAnswer, evaluateAnswer, highlightFillerWords } from '@/lib/utils/japanese-text';

// 音声認識の型定義
interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

declare const window: IWindow;

// 評価結果の型定義
interface EvaluationResult {
  score: number;
  feedback: string[];
  strengths: string[];
  improvements: string[];
  fillerWordCount: { word: string; count: number }[];
  cleanedAnswer: string;
  originalAnswer: string;
  normalizedAnswer: string;
  timestamp: string;
  questionId: string;
}

// 質問データの定義（既存の質問用）
const PREDEFINED_QUESTIONS: { [key: string]: any } = {
  '1': {
    id: '1',
    question: 'なぜ弊社を志望されたのですか？',
    category: 'motivation',
    difficulty: 'easy',
    keyPoints: ['企業理念への共感', '自身のキャリアビジョンとの一致', '具体的な事業内容への興味'],
    tags: ['志望動機', '企業研究', '基本質問'],
    sampleAnswer: '私が貴社を志望する理由は3つあります。第一に、貴社の「技術で社会課題を解決する」という理念に深く共感したからです。私自身、大学でのプロジェクトを通じて技術の社会実装の重要性を実感しました。第二に、貴社の○○事業における革新的なアプローチに魅力を感じています。特に△△の技術は業界をリードしており、そこで自分のスキルを活かしたいと考えています。第三に、貴社の人材育成制度が充実しており、エンジニアとして継続的に成長できる環境があることも大きな魅力です。',
    evaluationCriteria: {
      clarity: '志望理由が明確で論理的に説明されているか',
      research: '企業研究が十分に行われているか',
      passion: '熱意と具体性が感じられるか',
      fit: '自身の経験やスキルとの関連性が示されているか'
    }
  },
  '2': {
    id: '2',
    question: 'あなたの強みを教えてください',
    category: 'self_pr',
    difficulty: 'easy',
    keyPoints: ['具体的なエピソード', '成果や実績', '仕事での活かし方'],
    tags: ['自己PR', '強み', '基本質問'],
    sampleAnswer: '私の強みは「課題解決力」です。大学3年時、所属していたサークルで新入部員が定着しないという課題がありました。私は原因分析のためアンケートを実施し、「活動内容が不明確」「先輩との交流機会が少ない」という2つの主要因を特定しました。そこで、活動内容を可視化したパンフレットの作成と、メンター制度の導入を提案・実行しました。結果として、新入部員の定着率が前年比40%向上しました。この経験から、データに基づいた分析と実行力の重要性を学びました。貴社でもこの強みを活かし、顧客の課題解決に貢献したいと考えています。',
    evaluationCriteria: {
      specificity: '具体的なエピソードが語られているか',
      impact: '成果や影響が定量的に示されているか',
      relevance: '仕事での活用イメージが明確か',
      uniqueness: '自分ならではの強みとして差別化されているか'
    }
  },
  '3': {
    id: '3',
    question: '学生時代に最も力を入れたことは何ですか？',
    category: 'student_life',
    difficulty: 'medium',
    keyPoints: ['取り組みの動機', '直面した課題', '得られた成果と学び'],
    tags: ['ガクチカ', '経験', '成長'],
    sampleAnswer: '私が最も力を入れたのは、大学2年から始めた地域の子ども向けプログラミング教室でのボランティア活動です。きっかけは、教育格差の問題に関心を持ったことでした。当初は子どもたちの集中力を保つことに苦労しましたが、ゲーム要素を取り入れた教材を自作し、個々のレベルに合わせた指導方法を確立しました。また、保護者向けの説明会も企画し、家庭でのサポート体制も構築しました。2年間で延べ50名の子どもたちを指導し、そのうち3名が情報オリンピックジュニア部門に出場しました。この経験を通じて、相手の立場に立って考えることの重要性と、継続的な改善の大切さを学びました。',
    evaluationCriteria: {
      motivation: '取り組みの動機が明確か',
      challenge: '困難や課題への対処が具体的か',
      achievement: '成果が具体的に示されているか',
      learning: '経験から得た学びが説明されているか'
    }
  },
  '4': {
    id: '4',
    question: '10年後のキャリアビジョンを教えてください',
    category: 'future_goals',
    difficulty: 'hard',
    keyPoints: ['具体的な目標設定', '実現への道筋', '企業での成長イメージ'],
    tags: ['キャリア', '将来像', '長期目標'],
    sampleAnswer: '10年後は、技術と経営の両面を理解したプロダクトマネージャーとして、社会にインパクトを与えるサービスを生み出していたいと考えています。最初の3年間はエンジニアとして技術力を磨き、複数のプロジェクトで実装経験を積みます。4-6年目には、チームリーダーとしてプロジェクト管理やメンバーマネジメントを学びます。並行してMBAの取得も視野に入れ、経営視点も身につけたいと考えています。7-10年目には、これらの経験を活かしてプロダクトマネージャーとして新規事業の立ち上げに携わりたいです。貴社の多様な事業領域と、チャレンジを推奨する文化は、このビジョンの実現に最適な環境だと考えています。',
    evaluationCriteria: {
      specificity: '目標が具体的で実現可能か',
      planning: 'ステップが論理的に計画されているか',
      alignment: '企業での成長とリンクしているか',
      ambition: '適切な野心と現実性のバランスがあるか'
    }
  },
  '5': {
    id: '5',
    question: 'チームで成果を出した経験を教えてください',
    category: 'student_life',
    difficulty: 'medium',
    keyPoints: ['自身の役割', 'チームへの貢献', '協調性の発揮'],
    tags: ['チームワーク', '協調性', 'リーダーシップ'],
    sampleAnswer: '大学3年時のゼミでの研究プロジェクトでの経験をお話しします。私たち5人のチームは、地域商店街の活性化について研究していました。私はデータ分析担当として、商店街の人流データと売上データの相関を分析する役割を担いました。しかし、メンバー間で分析の方向性について意見が対立し、プロジェクトが停滞しました。そこで私は、各メンバーの意見を可視化するワークショップを提案・実施し、共通の目標を再確認しました。また、週次の進捗共有会を設けることで、情報の透明性を高めました。結果として、チームの結束力が高まり、最終的に学内コンペで優秀賞を受賞しました。この経験から、チームワークにおける対話と情報共有の重要性を学びました。',
    evaluationCriteria: {
      role: '自身の役割が明確に説明されているか',
      contribution: 'チームへの具体的な貢献が示されているか',
      collaboration: '他者との協調性が表現されているか',
      outcome: 'チームとしての成果が明確か'
    }
  }
};

export default function PracticeQuestionPage({ 
  params 
}: { 
  params: Promise<{ questionId: string }> 
}) {
  // paramsをunwrap
  const resolvedParams = use(params);
  const questionId = resolvedParams.questionId;
  
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [answer, setAnswer] = useState('');
  const [showSampleAnswer, setShowSampleAnswer] = useState(false);
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 音声認識の状態
  const [recognition, setRecognition] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');

  // 評価モーダルの状態
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  console.log('PracticeQuestionPage mounted with questionId:', questionId);

  // 音声認識の初期化
  useEffect(() => {
    // 音声認識APIの互換性チェック
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      
      // 音声認識の設定
      recognitionInstance.lang = 'ja-JP'; // 日本語に設定
      recognitionInstance.continuous = true; // 継続的な認識
      recognitionInstance.interimResults = true; // 途中結果も取得
      recognitionInstance.maxAlternatives = 1; // 最大候補数
      
      // 認識結果のハンドリング
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        // 結果を処理
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // デバッグ用ログ
        console.log('音声認識結果:', { finalTranscript, interimTranscript });
        
        // 確定した文章を既存の回答に追加
        if (finalTranscript) {
          setAnswer(prev => prev + finalTranscript);
        }
        
        // 途中結果を表示
        setInterimTranscript(interimTranscript);
      };
      
      // エラーハンドリング
      recognitionInstance.onerror = (event: any) => {
        console.error('音声認識エラー:', event.error);
        
        if (event.error === 'no-speech') {
          console.log('音声が検出されませんでした');
        } else if (event.error === 'audio-capture') {
          alert('マイクが検出されませんでした');
        } else if (event.error === 'not-allowed') {
          alert('マイクへのアクセスが拒否されました');
        }
        
        setIsListening(false);
        setIsRecording(false);
      };
      
      // 認識終了時の処理
      recognitionInstance.onend = () => {
        console.log('音声認識が終了しました');
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
    } else {
      console.warn('お使いのブラウザは音声認識をサポートしていません');
    }
    
    // クリーンアップ
    return () => {
      if (recognition && isListening) {
        recognition.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!questionId) return;

    const loadQuestion = async () => {
      // まず既定の質問から探す
      const predefinedQuestion = PREDEFINED_QUESTIONS[questionId];
      console.log('Predefined question found:', predefinedQuestion);
      
      if (predefinedQuestion) {
        setQuestion(predefinedQuestion);
        setLoading(false);
        return;
      }

      // LocalStorageから探す（一時的なAI生成質問用）
      console.log('Looking for AI-generated question in localStorage...');
      const storedQuestions = localStorage.getItem('ai_generated_questions');
      console.log('AI question found:', storedQuestions);
      
      if (storedQuestions) {
        try {
          const questions = JSON.parse(storedQuestions);
          const foundQuestion = questions.find((q: any) => q.id === questionId);
          if (foundQuestion) {
            setQuestion(foundQuestion);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Failed to parse stored questions:', error);
        }
      }

      // Firestoreから取得を試みる
      try {
        console.log('Fetching question from Firestore...');
        const firestoreQuestion = await getInterviewQuestion(questionId);
        
        if (firestoreQuestion) {
          // Firestoreのデータにサンプル回答などのデフォルト値を追加
          const enrichedQuestion = {
            ...firestoreQuestion,
            sampleAnswer: firestoreQuestion.sampleAnswer || generateSampleAnswer(firestoreQuestion),
            evaluationCriteria: firestoreQuestion.evaluationCriteria || generateEvaluationCriteria(firestoreQuestion.category)
          };
          
          setQuestion(enrichedQuestion);
        } else {
          console.error('Question not found in Firestore');
          // 質問が見つからない場合は一覧に戻る
          alert('質問が見つかりませんでした');
          router.push('/interview/practice');
        }
      } catch (error) {
        console.error('Failed to load question from Firestore:', error);
        alert('質問の読み込みに失敗しました');
        router.push('/interview/practice');
      } finally {
        setLoading(false);
      }
    };

    loadQuestion();
  }, [questionId, router]);

  // サンプル回答を生成する関数
  const generateSampleAnswer = (question: any) => {
    const categoryAnswers: { [key: string]: string } = {
      motivation: '私が志望する理由は、自身の経験と将来のビジョンが合致しているからです。具体的には...',
      self_pr: '私の強みは、課題に対して粘り強く取り組む姿勢です。例えば...',
      student_life: '学生時代は、特に○○に力を入れて取り組みました。その中で...',
      future_goals: '将来的には、専門性を活かしてチームをリードする立場になりたいと考えています...',
      current_affairs: 'この問題については、複数の観点から考える必要があると思います。まず...'
    };
    
    return categoryAnswers[question.category] || '質問に対して、具体的なエピソードを交えながら回答することが重要です。';
  };

  // 評価基準を生成する関数
  const generateEvaluationCriteria = (category: string) => {
    const criteriaByCategory: { [key: string]: any } = {
      motivation: {
        clarity: '志望理由が明確で論理的に説明されているか',
        research: '十分な研究・準備がされているか',
        passion: '熱意と具体性が感じられるか',
        fit: '自身の経験やスキルとの関連性が示されているか'
      },
      self_pr: {
        specificity: '具体的なエピソードが語られているか',
        impact: '成果や影響が明確に示されているか',
        relevance: '応募先での活用イメージが明確か',
        uniqueness: '自分ならではの強みとして差別化されているか'
      },
      student_life: {
        motivation: '取り組みの動機が明確か',
        challenge: '困難や課題への対処が具体的か',
        achievement: '成果が具体的に示されているか',
        learning: '経験から得た学びが説明されているか'
      },
      future_goals: {
        specificity: '目標が具体的で実現可能か',
        planning: 'ステップが論理的に計画されているか',
        alignment: '志望先での成長とリンクしているか',
        ambition: '適切な野心と現実性のバランスがあるか'
      },
      current_affairs: {
        understanding: '問題の本質を理解しているか',
        analysis: '多角的な分析ができているか',
        opinion: '自分の意見が明確か',
        relevance: '専門分野との関連付けができているか'
      }
    };
    
    return criteriaByCategory[category] || {
      content: '回答内容の適切性',
      structure: '論理的な構成',
      delivery: '伝え方の明確さ',
      impression: '全体的な印象'
    };
  };

  // 録音タイマー
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused]);

  // 録音時間のフォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 録音開始
  const startRecording = async () => {
    if (!recognition) {
      alert('お使いのブラウザは音声認識をサポートしていません。Chrome、Edge、Safariなどの最新ブラウザをお使いください。');
      return;
    }
    
    try {
      // マイクのアクセス許可を取得
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 音声認識を開始
      recognition.start();
      setIsListening(true);
      setIsRecording(true);
      setRecordingTime(0);
      setInterimTranscript('');
      
      console.log('音声認識を開始しました');
    } catch (error) {
      console.error('録音の開始に失敗しました:', error);
      alert('マイクへのアクセスを許可してください');
    }
  };

  // 録音停止
  const stopRecording = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
      setIsRecording(false);
      setIsPaused(false);
      setInterimTranscript('');
      
      console.log('音声認識を停止しました');
    }
  };

  // 録音の一時停止/再開
  const togglePause = () => {
    if (!recognition || !isListening) return;
    
    if (isPaused) {
      // 再開
      recognition.start();
      setIsListening(true);
    } else {
      // 一時停止
      recognition.stop();
      setIsListening(false);
    }
    
    setIsPaused(!isPaused);
  };

  // リセット
  const resetRecording = () => {
    if (recognition && isListening) {
      recognition.stop();
    }
    
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    setAnswer('');
    setInterimTranscript('');
    setIsListening(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>質問を読み込んでいます...</p>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="error-container">
        <AlertCircle size={48} />
        <h2>質問が見つかりません</h2>
        <button onClick={() => router.push('/interview/practice')}>
          質問一覧に戻る
        </button>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .filler-word {
          color: #ef4444 !important;
          font-weight: 600;
          background: #fee2e2;
          padding: 2px 4px;
          border-radius: 4px;
          margin: 0 1px;
        }
      `}</style>
      
      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #f8f9fa;
        }
        
        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #f3f4f6;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #f8f9fa;
          gap: 16px;
          color: #6b7280;
        }
        
        .error-container h2 {
          color: #374151;
          margin: 0;
        }
        
        .error-container button {
          padding: 12px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .error-container button:hover {
          background: #5a67d8;
        }
        
        .practice-question-container {
          min-height: 100vh;
          background: #f8f9fa;
        }
        
        /* ヘッダー */
        .header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 20px;
        }
        
        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .back-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: transparent;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          color: #6b7280;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .back-button:hover {
          background: #f3f4f6;
          color: #374151;
        }
        
        .header-title {
          flex: 1;
          font-size: 20px;
          font-weight: 600;
          color: #111827;
        }
        
        /* メインコンテンツ */
        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 20px;
        }
        
        /* 質問カード */
        .question-card {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          margin-bottom: 24px;
        }
        
        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        
        .question-meta {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
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
        
        .timer {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6b7280;
          font-size: 16px;
          font-weight: 500;
        }
        
        .question-text {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          line-height: 1.5;
          margin-bottom: 16px;
        }
        
        .key-points {
          margin-bottom: 24px;
        }
        
        .key-points-title {
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 8px;
        }
        
        .key-point-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .key-point {
          padding: 6px 12px;
          background: #f3f4f6;
          color: #374151;
          border-radius: 20px;
          font-size: 13px;
        }
        
        .hint-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: transparent;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          color: #6b7280;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .hint-button:hover {
          background: #f3f4f6;
          color: #374151;
        }
        
        /* ヒントボックス */
        .hint-box {
          margin-top: 16px;
          padding: 16px;
          background: #fef3c7;
          border-radius: 12px;
          border: 1px solid #fde68a;
        }
        
        .hint-title {
          font-size: 14px;
          font-weight: 600;
          color: #92400e;
          margin-bottom: 8px;
        }
        
        .hint-text {
          font-size: 14px;
          color: #78350f;
          line-height: 1.6;
        }
        
        /* 録音コントロール */
        .recording-section {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          margin-bottom: 24px;
        }
        
        .recording-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }
        
        .recording-status {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          background: #fee2e2;
          border-radius: 30px;
          color: #dc2626;
          font-weight: 500;
        }
        
        .recording-status.active {
          background: #fef3c7;
          color: #92400e;
        }
        
        .recording-time {
          font-size: 36px;
          font-weight: 700;
          color: #111827;
          font-variant-numeric: tabular-nums;
        }
        
        .control-buttons {
          display: flex;
          gap: 16px;
        }
        
        .control-button {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        
        .record-button {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }
        
        .record-button.recording {
          background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        }
        
        .pause-button {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }
        
        .pause-button.paused {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }
        
        .reset-button {
          background: #f3f4f6;
          color: #6b7280;
        }
        
        .reset-button:hover {
          background: #e5e7eb;
          color: #374151;
        }
        
        /* 回答セクション */
        .answer-section {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          margin-bottom: 24px;
        }
        
        .answer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .answer-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }
        
        .answer-actions {
          display: flex;
          gap: 12px;
        }
        
        .answer-textarea-container {
          position: relative;
        }
        
        .answer-textarea {
          width: 100%;
          min-height: 200px;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 15px;
          line-height: 1.6;
          resize: vertical;
          transition: border-color 0.2s ease;
          -webkit-appearance: none;
          appearance: none;
        }
        
        .answer-textarea:focus {
          outline: none;
          border-color: #667eea;
        }
        
        .answer-preview {
          width: 100%;
          min-height: 200px;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 15px;
          line-height: 1.6;
          cursor: text;
          background: white;
          overflow-y: auto;
          max-height: 400px;
        }
        
        .answer-preview:hover {
          border-color: #d1d5db;
        }
        
        .answer-preview .placeholder {
          color: #9ca3af;
        }
        
        .answer-preview .filler-word {
          color: #ef4444;
          font-weight: 600;
          background: #fee2e2;
          padding: 2px 4px;
          border-radius: 4px;
        }
        
        .transcription-indicator {
          position: absolute;
          bottom: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 20px;
          font-size: 13px;
          color: #667eea;
          font-weight: 500;
        }
        
        .pulse-dot {
          width: 8px;
          height: 8px;
          background: #667eea;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }
        
        .character-count {
          margin-top: 8px;
          text-align: right;
          font-size: 13px;
          color: #6b7280;
        }
        
        /* サンプル回答 */
        .sample-answer-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: transparent;
          border: 1px solid #667eea;
          border-radius: 8px;
          color: #667eea;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .sample-answer-button:hover {
          background: #667eea;
          color: white;
        }
        
        .sample-answer-box {
          margin-top: 16px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea08 0%, #764ba208 100%);
          border-radius: 12px;
          border: 1px solid #667eea33;
        }
        
        .sample-answer-title {
          font-size: 14px;
          font-weight: 600;
          color: #667eea;
          margin-bottom: 12px;
        }
        
        .sample-answer-text {
          font-size: 15px;
          color: #374151;
          line-height: 1.8;
        }
        
        /* 提出ボタンコンテナ */
        .submit-button-container {
          margin-top: 24px;
          display: flex;
          justify-content: center;
        }
        
        .submit-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }
        
        .submit-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }
        
        .submit-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        /* 評価基準 */
        .evaluation-section {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          margin-bottom: 24px;
        }
        
        .evaluation-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .evaluation-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        
        .evaluation-item {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 12px;
          transition: all 0.2s ease;
        }
        
        .evaluation-item:hover {
          background: #f3f4f6;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        .evaluation-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        
        .evaluation-content {
          flex: 1;
          min-width: 0;
        }
        
        .evaluation-label {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 2px;
        }
        
        .evaluation-description {
          font-size: 12px;
          color: #6b7280;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* アクションボタン */
        .action-buttons {
          display: flex;
          justify-content: center;
          margin-top: 32px;
        }
        
        .next-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: transparent;
          color: #667eea;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .next-button:hover {
          background: #f9fafb;
          border-color: #667eea;
        }
        
        /* 評価モーダル */
        .evaluation-modal-overlay {
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
          padding: 20px;
        }
        
        .evaluation-modal {
          background: white;
          border-radius: 20px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        
        .evaluation-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 32px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .evaluation-modal-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0;
        }
        
        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        
        .close-button:hover {
          background: #f3f4f6;
          color: #374151;
        }
        
        .evaluation-modal-content {
          flex: 1;
          overflow-y: auto;
          padding: 32px;
        }
        
        /* スコア表示 */
        .score-section {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .score-circle {
          position: relative;
          width: 150px;
          height: 150px;
          margin: 0 auto 20px;
        }
        
        .score-svg {
          width: 100%;
          height: 100%;
        }
        
        .score-background {
          stroke: #e5e7eb;
        }
        
        .score-progress {
          stroke: #667eea;
          transition: stroke-dasharray 1s ease;
        }
        
        .score-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        
        .score-number {
          font-size: 48px;
          font-weight: 700;
          color: #111827;
        }
        
        .score-label {
          font-size: 20px;
          color: #6b7280;
        }
        
        .score-message p {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
        }
        
        .score-message .excellent {
          color: #10b981;
        }
        
        .score-message .good {
          color: #f59e0b;
        }
        
        .score-message .needs-improvement {
          color: #667eea;
        }
        
        /* 評価セクション */
        .evaluation-section-item {
          margin-bottom: 24px;
          padding: 20px;
          border-radius: 12px;
        }
        
        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .section-header h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }
        
        .evaluation-section-item ul {
          margin: 0;
          padding-left: 28px;
          list-style: disc;
        }
        
        .evaluation-section-item li {
          margin-bottom: 8px;
          line-height: 1.6;
          font-size: 14px;
        }
        
        .strengths {
          background: #d1fae5;
          border: 1px solid #a7f3d0;
        }
        
        .strengths .section-header {
          color: #065f46;
        }
        
        .strengths li {
          color: #064e3b;
        }
        
        .improvements {
          background: #fef3c7;
          border: 1px solid #fde68a;
        }
        
        .improvements .section-header {
          color: #92400e;
        }
        
        .improvements li {
          color: #78350f;
        }
        
        .feedback {
          background: #e0e7ff;
          border: 1px solid #c7d2fe;
        }
        
        .feedback .section-header {
          color: #3730a3;
        }
        
        .feedback li {
          color: #312e81;
        }
        
        /* 感嘆詞分析 */
        .filler-analysis {
          background: #fef3c7;
          border: 1px solid #fde68a;
        }
        
        .filler-analysis .section-header {
          color: #92400e;
        }
        
        .filler-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .filler-stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: white;
          border-radius: 20px;
          border: 1px solid #fbbf24;
        }
        
        .filler-word-display {
          color: #ef4444;
          font-weight: 600;
        }
        
        .filler-count {
          color: #92400e;
          font-size: 14px;
        }
        
        .filler-advice {
          font-size: 13px;
          color: #78350f;
          line-height: 1.5;
          margin: 0;
        }
        
        /* 正規化情報 */
        .normalization-info {
          margin-top: 24px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        }
        
        .info-text {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }
        
        /* フッター */
        .evaluation-modal-footer {
          display: flex;
          gap: 12px;
          padding: 24px 32px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        
        .retry-button,
        .next-question-button {
          flex: 1;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }
        
        .retry-button {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
        }
        
        .retry-button:hover {
          background: #667eea;
          color: white;
        }
        
        .next-question-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .next-question-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
        }
        
        /* モバイル版デザイン */
        @media (max-width: 768px) {
          .practice-question-container {
            background: #f8f9fa;
          }
          
          /* ヘッダー */
          .header {
            padding: 12px;
            background: white;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .header-content {
            gap: 12px;
          }
          
          .back-button {
            padding: 6px 10px;
            font-size: 11px;
            gap: 6px;
            border-radius: 6px;
          }
          
          .back-button svg {
            width: 14px;
            height: 14px;
          }
          
          .header-title {
            font-size: 16px;
            font-weight: 600;
          }
          
          /* メインコンテンツ */
          .main-content {
            padding: 16px 12px;
          }
          
          /* 質問カード */
          .question-card {
            background: white;
            border-radius: 10px;
            padding: 16px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
            margin-bottom: 16px;
          }
          
          .question-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .question-meta {
            display: flex;
            gap: 6px;
            align-items: center;
          }
          
          .category-badge {
            padding: 4px 8px;
            font-size: 10px;
            font-weight: 600;
            gap: 4px;
            border-radius: 12px;
          }
          
          .category-badge svg {
            width: 10px;
            height: 10px;
          }
          
          .difficulty-badge {
            padding: 4px 8px;
            font-size: 10px;
            font-weight: 600;
            border-radius: 12px;
          }
          
          .timer {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            font-weight: 500;
            color: #6b7280;
          }
          
          .timer svg {
            width: 14px;
            height: 14px;
          }
          
          .question-text {
            font-size: 16px;
            font-weight: 700;
            line-height: 1.4;
            margin-bottom: 12px;
          }
          
          .key-points {
            margin-bottom: 12px;
          }
          
          .key-points-title {
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            margin-bottom: 6px;
          }
          
          .key-point-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }
          
          .key-point {
            padding: 4px 8px;
            background: #f3f4f6;
            color: #374151;
            border-radius: 12px;
            font-size: 10px;
          }
          
          .hint-button {
            padding: 6px 10px;
            font-size: 11px;
            gap: 4px;
            border-radius: 6px;
          }
          
          .hint-button svg {
            width: 12px;
            height: 12px;
          }
          
          /* ヒントボックス */
          .hint-box {
            margin-top: 10px;
            padding: 12px;
            border-radius: 8px;
          }
          
          .hint-title {
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 6px;
          }
          
          .hint-text {
            font-size: 11px;
            line-height: 1.5;
          }
          
          /* 録音セクション */
          .recording-section {
            background: white;
            border-radius: 10px;
            padding: 16px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
            margin-bottom: 16px;
          }
          
          .recording-controls {
            gap: 16px;
          }
          
          .recording-status {
            padding: 8px 16px;
            font-size: 11px;
            font-weight: 500;
            gap: 8px;
            border-radius: 20px;
          }
          
          .recording-time {
            font-size: 24px;
            font-weight: 700;
          }
          
          .control-buttons {
            display: flex;
            gap: 12px;
          }
          
          .control-button {
            width: 44px;
            height: 44px;
            border-radius: 50%;
          }
          
          .control-button svg {
            width: 20px;
            height: 20px;
          }
          
          /* 回答セクション */
          .answer-section {
            background: white;
            border-radius: 10px;
            padding: 16px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
            margin-bottom: 16px;
          }
          
          .answer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .answer-title {
            font-size: 14px;
            font-weight: 600;
          }
          
          .answer-textarea,
          .answer-preview {
            min-height: 120px;
            max-height: 200px;
            padding: 12px;
            border: 1.5px solid #e5e7eb;
            border-radius: 8px;
            font-size: 13px;
            line-height: 1.5;
          }
          
          .transcription-indicator {
            bottom: 12px;
            right: 12px;
            padding: 6px 10px;
            font-size: 10px;
            gap: 6px;
            border-radius: 12px;
          }
          
          .pulse-dot {
            width: 6px;
            height: 6px;
          }
          
          .character-count {
            margin-top: 6px;
            font-size: 10px;
          }
          
          .sample-answer-button {
            padding: 6px 10px;
            font-size: 11px;
            gap: 4px;
            border-radius: 6px;
          }
          
          .sample-answer-button svg {
            width: 12px;
            height: 12px;
          }
          
          .sample-answer-box {
            margin-top: 10px;
            padding: 12px;
            border-radius: 8px;
          }
          
          .sample-answer-title {
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 8px;
          }
          
          .sample-answer-text {
            font-size: 12px;
            line-height: 1.6;
          }
          
          /* 提出ボタン */
          .submit-button-container {
            margin-top: 16px;
          }
          
          .submit-button {
            width: 100%;
            justify-content: center;
            padding: 12px 16px;
            font-size: 13px;
            font-weight: 600;
            gap: 6px;
            border-radius: 8px;
          }
          
          .submit-button svg {
            width: 16px;
            height: 16px;
          }
          
          /* 評価基準 */
          .evaluation-section {
            background: white;
            border-radius: 10px;
            padding: 16px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
            margin-bottom: 16px;
          }
          
          .evaluation-title {
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 12px;
            gap: 6px;
          }
          
          .evaluation-title svg {
            width: 14px;
            height: 14px;
          }
          
          .evaluation-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          
          .evaluation-item {
            padding: 10px;
            gap: 8px;
            border-radius: 8px;
          }
          
          .evaluation-icon {
            width: 24px;
            height: 24px;
            border-radius: 6px;
          }
          
          .evaluation-icon svg {
            width: 12px;
            height: 12px;
          }
          
          .evaluation-label {
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 2px;
          }
          
          .evaluation-description {
            font-size: 10px;
            line-height: 1.3;
            -webkit-line-clamp: 2;
          }
          
          /* アクションボタン */
          .action-buttons {
            width: 100%;
            margin-top: 16px;
          }
          
          .next-button {
            width: 100%;
            justify-content: center;
            padding: 10px 16px;
            font-size: 12px;
            font-weight: 600;
            gap: 6px;
            border-radius: 8px;
          }
          
          .next-button svg {
            width: 14px;
            height: 14px;
          }
          
          /* 評価モーダル */
          .evaluation-modal {
            height: 100vh;
            max-height: 100vh;
            border-radius: 0;
          }
          
          .evaluation-modal-header {
            padding: 16px;
            position: sticky;
            top: 0;
            background: white;
            z-index: 10;
          }
          
          .evaluation-modal-title {
            font-size: 18px;
            font-weight: 700;
          }
          
          .close-button {
            padding: 6px;
            border-radius: 6px;
          }
          
          .close-button svg {
            width: 18px;
            height: 18px;
          }
          
          .evaluation-modal-content {
            padding: 16px;
          }
          
          /* スコア表示 */
          .score-section {
            margin-bottom: 20px;
          }
          
          .score-circle {
            width: 100px;
            height: 100px;
            margin: 0 auto 16px;
          }
          
          .score-number {
            font-size: 32px;
            font-weight: 700;
          }
          
          .score-label {
            font-size: 14px;
          }
          
          .score-message p {
            font-size: 16px;
            font-weight: 600;
          }
          
          /* 評価セクション */
          .evaluation-section-item {
            margin-bottom: 16px;
            padding: 12px;
            border-radius: 8px;
          }
          
          .section-header {
            gap: 6px;
            margin-bottom: 8px;
          }
          
          .section-header h3 {
            font-size: 13px;
            font-weight: 600;
          }
          
          .section-header svg {
            width: 16px;
            height: 16px;
          }
          
          .evaluation-section-item ul {
            padding-left: 20px;
          }
          
          .evaluation-section-item li {
            margin-bottom: 6px;
            font-size: 11px;
            line-height: 1.5;
          }
          
          /* 感嘆詞分析 */
          .filler-stats {
            gap: 8px;
            margin-bottom: 10px;
          }
          
          .filler-stat-item {
            padding: 6px 10px;
            gap: 6px;
            border-radius: 14px;
          }
          
          .filler-word-display {
            font-size: 11px;
            font-weight: 600;
          }
          
          .filler-count {
            font-size: 11px;
          }
          
          .filler-advice {
            font-size: 10px;
            line-height: 1.4;
          }
          
          /* 正規化情報 */
          .normalization-info {
            margin-top: 16px;
            padding: 10px;
            border-radius: 6px;
          }
          
          .info-text {
            font-size: 10px;
            line-height: 1.4;
          }
          
          /* フッター */
          .evaluation-modal-footer {
            flex-direction: column;
            gap: 8px;
            padding: 16px;
            position: sticky;
            bottom: 0;
            background: #f9fafb;
          }
          
          .retry-button,
          .next-question-button {
            width: 100%;
            padding: 10px 16px;
            font-size: 13px;
            font-weight: 600;
            border-radius: 6px;
          }
        }
        
        /* 小さいスマホ対応 (iPhone SE等) */
        @media (max-width: 375px) {
          .main-content {
            padding: 12px 10px;
          }
          
          .question-text {
            font-size: 14px;
          }
          
          .recording-time {
            font-size: 20px;
          }
          
          .control-button {
            width: 40px;
            height: 40px;
          }
          
          .control-button svg {
            width: 18px;
            height: 18px;
          }
          
          .answer-textarea,
          .answer-preview {
            min-height: 100px;
            font-size: 12px;
            padding: 10px;
          }
          
          .submit-button {
            padding: 10px 14px;
            font-size: 12px;
          }
        }
        
        /* 横向き対応 */
        @media (max-width: 768px) and (orientation: landscape) {
          .recording-section {
            padding: 12px;
          }
          
          .recording-time {
            font-size: 20px;
          }
          
          .answer-textarea,
          .answer-preview {
            min-height: 80px;
            max-height: 120px;
          }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.7;
          }
        }
      `}</style>

      <div className="practice-question-container">
        {/* ヘッダー */}
        <header className="header">
          <div className="header-content">
            <button className="back-button" onClick={() => router.push('/interview/practice')}>
              <ArrowLeft size={20} />
              <span>質問一覧に戻る</span>
            </button>
            <h1 className="header-title">面接練習</h1>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="main-content">
          {/* 質問カード */}
          <div className="question-card">
            <div className="question-header">
              <div className="question-meta">
                <div 
                  className="category-badge"
                  style={{ 
                    '--category-color': getCategoryColor(question.category),
                    '--category-color-light': getCategoryColor(question.category) + 'cc'
                  } as React.CSSProperties}
                >
                  {getCategoryIcon(question.category)}
                  {getCategoryLabel(question.category)}
                </div>
                <div 
                  className="difficulty-badge"
                  style={{ 
                    '--difficulty-bg': getDifficultyColor(question.difficulty) + '20',
                    '--difficulty-color': getDifficultyColor(question.difficulty),
                    '--difficulty-border': getDifficultyColor(question.difficulty) + '40'
                  } as React.CSSProperties}
                >
                  {getDifficultyLabel(question.difficulty)}
                </div>
              </div>
              <div className="timer">
                <Clock size={20} />
                <span>{formatTime(recordingTime)}</span>
              </div>
            </div>
            
            <h2 className="question-text">{question.question}</h2>
            
            <div className="key-points">
              <p className="key-points-title">評価のポイント</p>
              <div className="key-point-list">
                {question.keyPoints.map((point: string, index: number) => (
                  <span key={index} className="key-point">{point}</span>
                ))}
              </div>
            </div>
            
            <button 
              className="hint-button"
              onClick={() => setShowHint(!showHint)}
            >
              <AlertCircle size={16} />
              {showHint ? 'ヒントを隠す' : 'ヒントを見る'}
            </button>
            
            {showHint && (
              <div className="hint-box">
                <p className="hint-title">💡 回答のヒント</p>
                <p className="hint-text">
                  この質問では、{question.keyPoints.join('、')}について具体的に説明することが重要です。
                  自分の経験や考えを交えながら、論理的に構成された回答を心がけましょう。
                </p>
              </div>
            )}
          </div>

          {/* 録音セクション */}
          <div className="recording-section">
            <div className="recording-controls">
              {isRecording && (
                <div className={`recording-status ${!isPaused ? 'active' : ''}`}>
                  <div style={{ 
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: 'currentColor',
                    animation: !isPaused ? 'pulse 1.5s infinite' : 'none'
                  }} />
                  {isPaused ? '一時停止中' : '録音中'}
                </div>
              )}
              
              <div className="recording-time">{formatTime(recordingTime)}</div>
              
              <div className="control-buttons">
                {!isRecording ? (
                  <button 
                    className="control-button record-button"
                    onClick={startRecording}
                  >
                    <Mic size={28} />
                  </button>
                ) : (
                  <>
                    <button 
                      className="control-button record-button recording"
                      onClick={stopRecording}
                    >
                      <MicOff size={28} />
                    </button>
                    <button 
                      className={`control-button pause-button ${isPaused ? 'paused' : ''}`}
                      onClick={togglePause}
                    >
                      {isPaused ? <Play size={28} /> : <Pause size={28} />}
                    </button>
                    <button 
                      className="control-button reset-button"
                      onClick={resetRecording}
                    >
                      <RotateCcw size={24} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 回答セクション */}
          <div className="answer-section">
            <div className="answer-header">
              <h3 className="answer-title">あなたの回答</h3>
              <div className="answer-actions">
                <button
                  className="sample-answer-button"
                  onClick={() => setShowSampleAnswer(!showSampleAnswer)}
                >
                  <Sparkles size={16} />
                  {showSampleAnswer ? 'サンプル回答を隠す' : 'サンプル回答を見る'}
                </button>
              </div>
            </div>
            
            <div className="answer-textarea-container">
              <textarea
                className="answer-textarea"
                placeholder="録音を開始すると、リアルタイムで文字起こしされます。直接編集することも可能です。"
                value={answer + (isListening ? interimTranscript : '')}
                onChange={(e) => {
                  // 音声認識中の場合は、途中結果を除いた部分のみを更新
                  const newValue = e.target.value;
                  if (isListening && newValue.endsWith(interimTranscript)) {
                    setAnswer(newValue.slice(0, -interimTranscript.length));
                  } else {
                    setAnswer(newValue);
                  }
                }}
                onBlur={() => {
                  const textarea = document.querySelector('.answer-textarea') as HTMLTextAreaElement;
                  const preview = document.querySelector('.answer-preview') as HTMLDivElement;
                  if (textarea && preview) {
                    textarea.style.display = 'none';
                    preview.style.display = 'block';
                  }
                }}
                style={{ display: 'none' }}
              />
              
              {/* 感嘆詞をハイライト表示するプレビュー */}
              <div 
                className="answer-preview"
                onClick={() => {
                  const textarea = document.querySelector('.answer-textarea') as HTMLTextAreaElement;
                  if (textarea) {
                    textarea.style.display = 'block';
                    textarea.focus();
                    document.querySelector('.answer-preview')?.setAttribute('style', 'display: none');
                  }
                }}
              >
                {answer + (isListening ? interimTranscript : '') ? (
                  <div dangerouslySetInnerHTML={{ 
                    __html: highlightFillerWords(answer + (isListening ? interimTranscript : ''))
                  }} />
                ) : (
                  <span className="placeholder">
                    録音を開始すると、リアルタイムで文字起こしされます。直接編集することも可能です。
                  </span>
                )}
              </div>
              
              {/* リアルタイム文字起こし中のインジケーター */}
              {isListening && (
                <div className="transcription-indicator">
                  <div className="pulse-dot"></div>
                  <span>音声認識中...</span>
                </div>
              )}
            </div>
            
            <p className="character-count">{(answer + interimTranscript).length} 文字</p>
            
            {showSampleAnswer && (
              <div className="sample-answer-box">
                <p className="sample-answer-title">✨ サンプル回答</p>
                <p className="sample-answer-text">{question.sampleAnswer}</p>
              </div>
            )}
            
            {/* 評価ボタンをここに追加 */}
            <div className="submit-button-container">
              <button 
                className="submit-button"
                disabled={!answer}
                onClick={() => {
                  const result = submitAnswer(answer, question);
                  setEvaluationResult(result);
                  setShowEvaluation(true);
                  
                  const savedResults = localStorage.getItem('interview_results') || '[]';
                  const results = JSON.parse(savedResults);
                  results.push(result);
                  localStorage.setItem('interview_results', JSON.stringify(results));
                }}
              >
                <Send size={20} />
                回答を提出して評価を受ける
              </button>
            </div>
          </div>

          {/* 評価基準 */}
          <div className="evaluation-section">
            <h3 className="evaluation-title">
              <Sparkles size={20} />
              評価基準
            </h3>
            <div className="evaluation-grid">
              {Object.entries(question.evaluationCriteria).map(([key, value]: [string, any]) => (
                <div key={key} className="evaluation-item">
                  <div className="evaluation-icon">
                    {getEvaluationIcon(key)}
                  </div>
                  <div className="evaluation-content">
                    <p className="evaluation-label">{getEvaluationLabel(key)}</p>
                    <p className="evaluation-description">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="action-buttons">
            <button 
              className="next-button"
              onClick={() => router.push('/interview/practice')}
            >
              質問一覧に戻る
              <ChevronRight size={20} />
            </button>
          </div>
        </main>
      </div>

      {/* 評価モーダル */}
      {showEvaluation && evaluationResult && (
        <div className="evaluation-modal-overlay" onClick={() => setShowEvaluation(false)}>
          <div className="evaluation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="evaluation-modal-header">
              <h2 className="evaluation-modal-title">
                回答の評価結果
              </h2>
              <button 
                className="close-button"
                onClick={() => setShowEvaluation(false)}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="evaluation-modal-content">
              {/* スコア表示 */}
              <div className="score-section">
                <div className="score-circle">
                  <svg className="score-svg" viewBox="0 0 100 100">
                    <circle
                      className="score-background"
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      strokeWidth="10"
                    />
                    <circle
                      className="score-progress"
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${evaluationResult.score * 2.83} 283`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="score-text">
                    <span className="score-number">{evaluationResult.score}</span>
                    <span className="score-label">点</span>
                  </div>
                </div>
                
                <div className="score-message">
                  {evaluationResult.score >= 80 ? (
                    <p className="excellent">素晴らしい回答です！</p>
                  ) : evaluationResult.score >= 60 ? (
                    <p className="good">良い回答です！</p>
                  ) : (
                    <p className="needs-improvement">もう少し改善できます</p>
                  )}
                </div>
              </div>
              
              {/* 強み */}
              {evaluationResult.strengths.length > 0 && (
                <div className="evaluation-section-item strengths">
                  <div className="section-header">
                    <CheckCircle size={20} />
                    <h3>良かった点</h3>
                  </div>
                  <ul>
                    {evaluationResult.strengths.map((strength, index) => (
                      <li key={index}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* 改善点 */}
              {evaluationResult.improvements.length > 0 && (
                <div className="evaluation-section-item improvements">
                  <div className="section-header">
                    <TrendingUp size={20} />
                    <h3>改善できる点</h3>
                  </div>
                  <ul>
                    {evaluationResult.improvements.map((improvement, index) => (
                      <li key={index}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* 感嘆詞の分析 */}
              {evaluationResult.fillerWordCount && evaluationResult.fillerWordCount.length > 0 && (
                <div className="evaluation-section-item filler-analysis">
                  <div className="section-header">
                    <AlertCircle size={20} />
                    <h3>感嘆詞の使用状況</h3>
                  </div>
                  <div className="filler-stats">
                    {evaluationResult.fillerWordCount.map((item, index) => (
                      <div key={index} className="filler-stat-item">
                        <span className="filler-word-display">{item.word}</span>
                        <span className="filler-count">{item.count}回</span>
                      </div>
                    ))}
                  </div>
                  <p className="filler-advice">
                    感嘆詞は自然な会話の一部ですが、多すぎると自信がないように聞こえることがあります。
                    練習により徐々に減らすことができます。
                  </p>
                </div>
              )}
              
              {/* フィードバック */}
              {evaluationResult.feedback.length > 0 && (
                <div className="evaluation-section-item feedback">
                  <div className="section-header">
                    <AlertCircle size={20} />
                    <h3>アドバイス</h3>
                  </div>
                  <ul>
                    {evaluationResult.feedback.map((fb, index) => (
                      <li key={index}>{fb}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* 漢字変換の確認 */}
              <div className="normalization-info">
                <p className="info-text">
                  ※ 評価は漢字の変換ミスを考慮して行われています。
                  内容の正確性を重視した採点です。
                </p>
              </div>
            </div>
            
            <div className="evaluation-modal-footer">
              <button 
                className="retry-button"
                onClick={() => {
                  setShowEvaluation(false);
                  resetRecording();
                }}
              >
                もう一度練習する
              </button>
              <button 
                className="next-question-button"
                onClick={() => {
                  setShowEvaluation(false);
                  router.push('/interview/practice');
                }}
              >
                次の質問へ進む
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ヘルパー関数
function getCategoryColor(category: string): string {
  const colors: { [key: string]: string } = {
    motivation: '#667eea',
    self_pr: '#f093fb',
    student_life: '#4facfe',
    future_goals: '#fa709a',
    current_affairs: '#f59e0b'
  };
  return colors[category] || '#667eea';
}

function getCategoryLabel(category: string): string {
  const labels: { [key: string]: string } = {
    motivation: '志望動機',
    self_pr: '自己PR',
    student_life: '学生生活',
    future_goals: '将来の目標',
    current_affairs: '時事問題'
  };
  return labels[category] || category;
}

function getCategoryIcon(category: string): JSX.Element {
  const icons: { [key: string]: JSX.Element } = {
    motivation: <Target size={14} />,
    self_pr: <Users size={14} />,
    student_life: <BookOpen size={14} />,
    future_goals: <Briefcase size={14} />,
    current_affairs: <TrendingUp size={14} />
  };
  return icons[category] || <BookOpen size={14} />;
}

function getDifficultyColor(difficulty: string): string {
  const colors: { [key: string]: string } = {
    easy: '#10b981',
    medium: '#f59e0b',
    hard: '#ef4444'
  };
  return colors[difficulty] || '#f59e0b';
}

function getDifficultyLabel(difficulty: string): string {
  const labels: { [key: string]: string } = {
    easy: '初級',
    medium: '中級',
    hard: '上級'
  };
  return labels[difficulty] || difficulty;
}

function getEvaluationIcon(key: string): JSX.Element {
  const size = 16;
  switch (key) {
    case 'clarity':
    case 'specificity':
      return <Target size={size} />;
    case 'research':
    case 'understanding':
      return <BookOpen size={size} />;
    case 'passion':
    case 'motivation':
      return <Sparkles size={size} />;
    case 'fit':
    case 'relevance':
      return <Users size={size} />;
    default:
      return <AlertCircle size={size} />;
  }
}

function getEvaluationLabel(key: string): string {
  const labels: { [key: string]: string } = {
    clarity: '明確性',
    research: '研究・準備',
    passion: '熱意',
    fit: '適合性',
    specificity: '具体性',
    impact: 'インパクト',
    relevance: '関連性',
    uniqueness: '独自性',
    motivation: '動機',
    challenge: '課題対処',
    achievement: '成果',
    learning: '学び',
    planning: '計画性',
    alignment: '整合性',
    ambition: '野心',
    role: '役割',
    contribution: '貢献',
    collaboration: '協調性',
    outcome: '結果',
    understanding: '理解度',
    analysis: '分析力',
    opinion: '意見',
    content: '内容',
    structure: '構成',
    delivery: '伝達力',
    impression: '印象'
  };
  return labels[key] || key;
}