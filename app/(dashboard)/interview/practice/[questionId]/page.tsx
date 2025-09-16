'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getInterviewQuestion } from '@/lib/firebase/interview';
import { evaluateAnswer } from '@/lib/interview/evaluator';
import { ArrowLeft, Brain, CheckCircle, AlertCircle, FileText, BarChart, Send } from 'lucide-react';

export default function InterviewPracticePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const questionId = params.questionId as string;

  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [transcript, setTranscript] = useState('');
  const [evaluation, setEvaluation] = useState<any>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log('User not authenticated, redirecting to login');
        router.push('/login');
        return;
      }
      loadQuestion();
    }
  }, [user, authLoading, questionId, router]);

  const loadQuestion = async () => {
    try {
      setLoading(true);
      console.log('Loading question:', questionId);
      
      const data = await getInterviewQuestion(questionId);
      if (data) {
        setQuestion(data);
      } else {
        console.error('Question not found');
        router.push('/interview/practice');
      }
    } catch (error) {
      console.error('Error loading question:', error);
      router.push('/interview/practice');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (inputText.trim()) {
      setTranscript(transcript + ' ' + inputText.trim());
      setInputText('');
    }
  };

  const handleEvaluate = async () => {
    if (!question || !transcript.trim()) return;

    const result = await evaluateAnswer(
      question.question,
      transcript,
      question.keyPoints || []
    );

    setEvaluation(result);
    setShowEvaluation(true);
  };

  const getCategoryLabel = (category: string): string => {
    const labels: { [key: string]: string } = {
      motivation: '志望動機',
      self_pr: '自己PR',
      student_life: '高校生活',
      future_goals: '将来の目標',
      current_affairs: '時事問題'
    };
    return labels[category] || category;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || !question) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.push('/interview/practice')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft size={20} />
          質問一覧に戻る
        </button>

        <div className="flex items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {getCategoryLabel(question.category)}
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
            {question.difficulty === 'easy' ? '基礎' : 
             question.difficulty === 'medium' ? '標準' : '発展'}
          </span>
        </div>
      </div>

      {/* 質問カード */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          {question.question}
        </h1>

        {/* テキスト入力セクション */}
        <div className="space-y-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="ここに回答を入力してください..."
            className="w-full p-4 border-2 border-gray-300 rounded-lg resize-none h-32 focus:border-blue-500 focus:outline-none"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          
          <button
            onClick={handleSubmit}
            disabled={!inputText.trim()}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send size={20} />
            回答を追加
          </button>
        </div>

        {/* 文字起こし表示 */}
        {transcript && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FileText size={18} />
              回答内容
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap">{transcript}</p>
            <div className="mt-2 text-sm text-gray-500">
              文字数: {transcript.length}文字
            </div>
            <button
              onClick={() => setTranscript('')}
              className="mt-2 text-sm text-red-600 hover:text-red-700"
            >
              クリア
            </button>
          </div>
        )}

        {/* 評価ボタン */}
        {transcript && (
          <button
            onClick={handleEvaluate}
            className="mt-6 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <Brain size={20} />
            回答を評価する
          </button>
        )}
      </div>

      {/* 評価結果 */}
      {showEvaluation && evaluation && (
        <div className="bg-white rounded-lg shadow-lg p-8 animate-fade-in">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BarChart size={24} />
            評価結果
          </h2>

          {/* スコア表示 */}
          <div className="text-center mb-8">
            <div className="text-5xl font-bold mb-2" style={{
              color: evaluation.score >= 80 ? '#10b981' : 
                     evaluation.score >= 60 ? '#f59e0b' : '#ef4444'
            }}>
              {evaluation.score}点
            </div>
            <p className="text-gray-600">{evaluation.feedback}</p>
          </div>

          {/* 詳細スコア */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">
                {evaluation.completeness}%
              </div>
              <div className="text-sm text-gray-600">完成度</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">
                {evaluation.relevance}%
              </div>
              <div className="text-sm text-gray-600">関連性</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-700">
                {evaluation.coherence}%
              </div>
              <div className="text-sm text-gray-600">論理性</div>
            </div>
          </div>

          {/* 良い点 */}
          {evaluation.strengths.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-green-700 flex items-center gap-2">
                <CheckCircle size={20} />
                良い点
              </h3>
              <ul className="space-y-2">
                {evaluation.strengths.map((strength: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 改善点 */}
          {evaluation.improvements.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-orange-700 flex items-center gap-2">
                <AlertCircle size={20} />
                改善点
              </h3>
              <ul className="space-y-2">
                {evaluation.improvements.map((improvement: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">!</span>
                    <span className="text-gray-700">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* もう一度練習ボタン */}
          <button
            onClick={() => {
              setTranscript('');
              setShowEvaluation(false);
              setEvaluation(null);
            }}
            className="mt-8 w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium"
          >
            もう一度練習する
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
