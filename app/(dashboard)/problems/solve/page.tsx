// app/(dashboard)/problems/solve/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { saveProblemResult, estimateUserDeviation } from '@/lib/firebase/problem-results';
import AnswerForm from '@/app/(dashboard)/problems/[id]/components/answer-form';
import { ArrowLeft, CheckCircle, XCircle, Eye, EyeOff, RefreshCw, BarChart } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';

export default function SolvePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const problemId = searchParams.get('id');
  
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userAnswer, setUserAnswer] = useState<any>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [estimatedDeviation, setEstimatedDeviation] = useState<number | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // 解答時間の記録
  const startTimeRef = useRef<number>(Date.now());
  const [timeSpent, setTimeSpent] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        // 未ログインの場合はログインページへ
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!problemId) {
      router.push('/problems');
      return;
    }

    const loadProblem = async () => {
      try {
        const docRef = doc(db, 'problems', problemId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProblem({ id: docSnap.id, ...docSnap.data() });
          startTimeRef.current = Date.now(); // 問題表示時刻を記録
        } else {
          router.push('/problems');
        }
      } catch (error) {
        console.error('Error loading problem:', error);
        router.push('/problems');
      }
      setLoading(false);
    };

    loadProblem();
  }, [problemId, router]);

  // 正誤判定
  const checkAnswer = (answer: any) => {
    if (!problem) return false;

    let correct = false;
    const correctAnswer = problem.correctAnswer || problem.answer;

    switch (problem.type) {
      case 'multiple_choice':
      case 'reading_comprehension':
      case 'vocabulary':
        // 選択肢のインデックスで比較
        if (typeof answer === 'number' && problem.options) {
          correct = problem.options[answer] === correctAnswer;
        }
        break;

      case 'fill_in_blank':
        // 配列の各要素を比較
        if (Array.isArray(answer) && Array.isArray(correctAnswer)) {
          correct = answer.every((ans, index) => 
            ans.trim().toLowerCase() === correctAnswer[index]?.toString().toLowerCase()
          );
        }
        break;

      case 'solution_sequence':
      case 'sentence_sequence':
      case 'event_sequence':
        // 順序の比較
        correct = answer === correctAnswer;
        break;

      case 'descriptive':
      case 'essay':
        // 記述式は自動採点なし（常に解説を表示）
        correct = false;
        break;

      default:
        // 文字列の完全一致
        correct = answer?.toString().toLowerCase() === correctAnswer?.toString().toLowerCase();
    }

    return correct;
  };

  const handleSubmit = async (answer: any) => {
    // 解答時間を計算
    const endTime = Date.now();
    const elapsedTime = Math.round((endTime - startTimeRef.current) / 1000); // 秒単位
    setTimeSpent(elapsedTime);
    
    setUserAnswer(answer);
    const correct = checkAnswer(answer);
    setIsCorrect(correct);
    setSubmitted(true);
    
    // 結果を保存（ログインユーザーのみ）
    if (userId && problemId) {
      setSaving(true);
      try {
        // 問題結果を保存
        await saveProblemResult({
          userId,
          problemId,
          subject: problem.subject || '未分類',
          unit: problem.unit || problem.topic,
          difficulty: problem.difficulty || 'medium',
          isCorrect: correct,
          timeSpent: elapsedTime,
          answer: answer,
          correctAnswer: problem.correctAnswer || problem.answer
        });
        
        // 偏差値を推定
        const deviation = await estimateUserDeviation(userId, problem.subject);
        if (deviation !== null) {
          setEstimatedDeviation(deviation);
        }
      } catch (error) {
        console.error('Error saving result:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleRetry = () => {
    setSubmitted(false);
    setIsCorrect(false);
    setUserAnswer(null);
    setShowExplanation(false);
    setEstimatedDeviation(null);
    startTimeRef.current = Date.now(); // 時間をリセット
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>問題が見つかりません</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.push('/problems')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={20} />
          問題一覧に戻る
        </button>
        
        <h1 className="text-2xl font-bold mb-2">{problem.title}</h1>
        
        <div className="flex gap-2">
          <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
            {problem.subject}
          </span>
          <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
            {problem.topic}
          </span>
          <span className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full">
            {problem.difficulty === 'easy' ? '基礎' : problem.difficulty === 'medium' ? '標準' : '発展'}
          </span>
        </div>
      </div>

      {/* 問題文 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold mb-4">問題</h2>
        <p className="text-gray-800 whitespace-pre-wrap">{problem.question}</p>
      </div>

      {/* 回答フォームまたは結果表示 */}
      {!submitted ? (
        <AnswerForm 
          problem={problem}
          onSubmit={handleSubmit}
        />
      ) : (
        <div className="space-y-6">
          {/* 採点結果 */}
          <div className={`p-6 rounded-lg ${
            isCorrect ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              {isCorrect ? (
                <>
                  <CheckCircle className="text-green-600" size={32} />
                  <div>
                    <h3 className="text-xl font-bold text-green-800">正解です！</h3>
                    <p className="text-green-700">素晴らしい！よくできました。</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="text-red-600" size={32} />
                  <div>
                    <h3 className="text-xl font-bold text-red-800">不正解です</h3>
                    <p className="text-red-700">
                      {problem.type === 'descriptive' || problem.type === 'essay' 
                        ? '解説を確認して理解を深めましょう' 
                        : 'もう一度挑戦してみましょう'}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* ユーザーの回答 */}
            <div className="mt-4 p-4 bg-white rounded-lg">
              <p className="text-sm text-gray-600 mb-2">あなたの回答:</p>
              <p className="font-medium">
                {(() => {
                  if (problem.type === 'multiple_choice' && typeof userAnswer === 'number') {
                    return problem.options?.[userAnswer];
                  } else if (Array.isArray(userAnswer)) {
                    return userAnswer.join(', ');
                  } else {
                    return userAnswer;
                  }
                })()}
              </p>
            </div>

            {/* 解答時間と推定偏差値 */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-lg">
                <p className="text-sm text-gray-600">解答時間</p>
                <p className="text-lg font-semibold">
                  {Math.floor(timeSpent / 60)}分{timeSpent % 60}秒
                </p>
              </div>
              
              {estimatedDeviation !== null && (
                <div className="p-3 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    <BarChart size={16} className="text-blue-600" />
                    <p className="text-sm text-gray-600">推定偏差値</p>
                  </div>
                  <p className="text-lg font-semibold text-blue-600">
                    {estimatedDeviation.toFixed(1)}
                  </p>
                </div>
              )}
            </div>

            {saving && (
              <div className="mt-3 text-sm text-gray-600 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                結果を保存中...
              </div>
            )}
          </div>

          {/* 解答・解説セクション */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">解答・解説</h3>
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                {showExplanation ? <EyeOff size={20} /> : <Eye size={20} />}
                {showExplanation ? '隠す' : '表示'}
              </button>
            </div>

            {showExplanation && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2 text-blue-900">正解</h4>
                  <p className="text-blue-800 font-medium">
                    {(() => {
                      const correctAnswer = problem.correctAnswer || problem.answer;
                      if (Array.isArray(correctAnswer)) {
                        return correctAnswer.join(', ');
                      }
                      return correctAnswer;
                    })()}
                  </p>
                </div>
                
                {problem.explanation && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">解説</h4>
                    <p className="text-gray-800 whitespace-pre-wrap">{problem.explanation}</p>
                  </div>
                )}
                
                {problem.hints && problem.hints.length > 0 && (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium mb-2 text-yellow-900">ヒント</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {problem.hints.map((hint: string, index: number) => (
                        <li key={index} className="text-yellow-800">{hint}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3">
            {!isCorrect && problem.type !== 'descriptive' && problem.type !== 'essay' && (
              <button
                onClick={handleRetry}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <RefreshCw size={20} />
                もう一度挑戦
              </button>
            )}
            <button
              onClick={() => router.push('/problems')}
              className="flex-1 py-3 px-6 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              問題一覧に戻る
            </button>
          </div>
        </div>
      )}
    </div>
  );
}