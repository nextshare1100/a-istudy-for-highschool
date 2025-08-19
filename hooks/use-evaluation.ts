import { useState, useCallback } from 'react';
import { VoiceAnalysis } from '@/lib/firebase/types';
import { EssayEvaluation } from '@/lib/firebase/types';
import { useApiRequest } from './use-api-request';

export function useEvaluation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { makeRequest } = useApiRequest();

  const evaluateInterviewAnswer = useCallback(async (
    audioBlob: Blob,
    questionId: string,
    questionText: string,
    transcription: string
  ): Promise<{ evaluation: any; practiceId: string }> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('questionId', questionId);
      formData.append('questionText', questionText);
      formData.append('transcription', transcription);

      const response = await fetch('/api/interview/evaluate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate answer');
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const evaluateEssay = useCallback(async (
    content: string,
    themeId: string,
    requirements: any
  ): Promise<EssayEvaluation> => {
    setLoading(true);
    setError(null);

    try {
      const response = await makeRequest('/api/essay/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          content,
          themeId,
          requirements,
        }),
      });

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  const getCorrections = useCallback(async (
    transcription: string,
    questionId: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await makeRequest('/api/interview/correction', {
        method: 'POST',
        body: JSON.stringify({
          transcription,
          questionId,
        }),
      });

      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [makeRequest]);

  return {
    loading,
    error,
    evaluateInterviewAnswer,
    evaluateEssay,
    getCorrections,
  };
}