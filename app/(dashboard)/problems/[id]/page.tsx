'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ArrowLeft, Play } from 'lucide-react';

export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;
  
  const [problem, setProblem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProblem();
  }, [problemId]);

  const loadProblem = async () => {
    try {
      setLoading(true);
      const problemDoc = await getDoc(doc(db, 'problems', problemId));
      
      if (!problemDoc.exists()) {
        setError('問題が見つかりません');
        return;
      }
      
      const problemData = problemDoc.data();
      setProblem({ ...problemData, id: problemDoc.id });
    } catch (error) {
      console.error('Error loading problem:', error);
      setError('問題の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSolving = () => {
    router.push(`/problems/solve?id=${problemId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || '問題が見つかりません'}
          </h2>
          <button
            onClick={() => router.push('/problems')}
            className="text-blue-600 hover:text-blue-800"
          >
            問題一覧に戻る
          </button>
        </div>
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
        
        <div className="flex items-center gap-4 mb-4">
          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            {problem.subject}
          </span>
          <span className="bg-gray-100 text-gray-800 text-sm font-medium px-3 py-1 rounded-full">
            {problem.topic}
          </span>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
            problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
            problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {problem.difficulty === 'easy' ? '基礎' :
             problem.difficulty === 'medium' ? '標準' : '発展'}
          </span>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {problem.title}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">問題プレビュー</h2>
        <div className="text-gray-800 leading-relaxed mb-6">
          {problem.question}
        </div>
        
        <div className="text-center">
          <button
            onClick={handleStartSolving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center gap-2 mx-auto"
          >
            <Play size={20} />
            問題を解く
          </button>
        </div>
      </div>
    </div>
  );
}
