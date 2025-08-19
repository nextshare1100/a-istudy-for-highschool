import { useState, useCallback, useEffect } from 'react';
import { essayService } from '@/lib/firebase/services/essay';
import { useAuth } from './use-auth';
import { useDebounce } from './use-debounce';

interface UseEssayEditorProps {
  themeId: string;
  initialContent?: string;
}

export function useEssayEditor({ themeId, initialContent = '' }: UseEssayEditorProps) {
  const { user } = useAuth();
  const [content, setContent] = useState(initialContent);
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const debouncedContent = useDebounce(content, 2000);

  // 文字数カウント
  useEffect(() => {
    setWordCount(content.length);
  }, [content]);

  // 作業時間の追跡
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // 自動保存
  useEffect(() => {
    if (debouncedContent && debouncedContent !== initialContent && user) {
      saveDraft();
    }
  }, [debouncedContent, user]);

  const saveDraft = useCallback(async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      await essayService.saveDraft({
        userId: user.uid,
        themeId: themeId,
        content: content,
        wordCount: wordCount,
        timeSpentSeconds: timeSpent,
        isDraft: true,
      });
      
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsSaving(false);
    }
  }, [content, wordCount, timeSpent, themeId, user]);

  const submitEssay = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const submissionId = await essayService.submitEssay({
        userId: user.uid,
        themeId: themeId,
        content: content,
        wordCount: wordCount,
        timeSpentSeconds: timeSpent,
        isDraft: false,
      });
      
      return submissionId;
    } catch (error) {
      console.error('Failed to submit essay:', error);
      throw error;
    }
  }, [content, wordCount, timeSpent, themeId, user]);

  const loadDraft = useCallback(async () => {
    if (!user) return;
    
    try {
      const drafts = await essayService.getSubmissions(user.uid, true);
      const draft = drafts.find(d => d.themeId === themeId);
      
      if (draft) {
        setContent(draft.content);
        setTimeSpent(draft.timeSpentSeconds || 0);
        setLastSaved(draft.updatedAt || null);
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }, [themeId, user]);

  return {
    content,
    setContent,
    wordCount,
    timeSpent,
    isSaving,
    lastSaved,
    saveDraft,
    submitEssay,
    loadDraft,
  };
}