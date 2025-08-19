import { useState, useCallback } from 'react';
import { useApiRequest } from './use-api-request';

interface GenerateQuestionsParams {
  category: string;
  difficulty: string;
  university?: string;
  faculty?: string;
}

// 新しいインターフェース：複数カテゴリ対応
interface GenerateMultipleQuestionsParams {
  categories: string[];  // 複数カテゴリ
  difficulty: string;
  faculty: string;
  questionCount: number;
}

interface GenerateThemesParams {
  category: string;
  faculty?: string;
  difficulty: string;
  includeGraph?: boolean;
  currentAffairs?: boolean;
}

export function useAIGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { makeRequest } = useApiRequest();

  // 既存の関数（変更なし）
  const generateInterviewQuestions = useCallback(async (params: GenerateQuestionsParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeRequest('/api/interview/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      });

      return response.questions;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  // 新しい関数：複数カテゴリ対応（追加）
  const generateMultipleInterviewQuestions = useCallback(async (params: GenerateMultipleQuestionsParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeRequest('/api/interview/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      });

      return response.questions;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  // 既存の関数（変更なし）
  const generateEssayThemes = useCallback(async (params: GenerateThemesParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeRequest('/api/essay/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      });

      return response.themes;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  // 既存の関数（変更なし）
  const getCurrentTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeRequest('/api/essay/trends');
      
      return response.trends;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  return {
    loading,
    error,
    generateInterviewQuestions,
    generateMultipleInterviewQuestions, // 新しい関数を追加
    generateEssayThemes,
    getCurrentTrends,
  };
}