import { useState, useCallback } from 'react';
import { InterviewPractice } from '@/lib/firebase/types';
import { interviewService } from '@/lib/firebase/interview-service';
import { useAuth } from './use-auth';
import { useApiRequest } from './use-api-request';

export function useInterviewPractice(questionId: string) {
  const { user } = useAuth();
  const { makeRequest } = useApiRequest();
  const [session, setSession] = useState<InterviewPractice | null>(null);
  const [loading, setLoading] = useState(false);

  const startPractice = useCallback(async (mode: 'normal' | 'karaoke') => {
    if (!user) return;

    setLoading(true);
    try {
      const practiceId = await interviewService.savePractice({
        userId: user.uid,
        questionId,
        questionText: '', // 後で更新
        mode,
      });

      setSession({
        id: practiceId,
        userId: user.uid,
        questionId,
        questionText: '',
        mode,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to start practice:', error);
    } finally {
      setLoading(false);
    }
  }, [user, questionId]);

  const saveRecording = useCallback(async (audioBlob: Blob) => {
    if (!user || !session) return;

    try {
      const audioUrl = await interviewService.uploadAudio(user.uid, audioBlob);
      
      if (session.id) {
        await interviewService.updatePractice(session.id, {
          answerAudioUrl: audioUrl,
        });
      }
      
      return audioUrl;
    } catch (error) {
      console.error('Failed to save recording:', error);
      throw error;
    }
  }, [user, session]);

  const evaluateAnswer = useCallback(async (
    audioBlob: Blob,
    questionText: string,
    transcription: string
  ) => {
    if (!user || !session) return;

    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('questionId', questionId);
    formData.append('questionText', questionText);
    formData.append('transcription', transcription);

    const result = await makeRequest('/api/interview/evaluate', {
      method: 'POST',
      body: formData,
      headers: {
        // Content-Typeは設定しない（FormDataの場合、自動設定される）
      },
    });

    if (session.id) {
      await interviewService.updateEvaluation(session.id, result.evaluation);
    }

    return result;
  }, [user, session, questionId, makeRequest]);

  const saveSession = useCallback(async () => {
    // セッション情報を保存する処理
    if (!session || !session.id) return;
    
    try {
      await interviewService.updatePractice(session.id, {
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }, [session]);

  return {
    session,
    loading,
    startPractice,
    saveRecording,
    evaluateAnswer,
    saveSession,
  };
}