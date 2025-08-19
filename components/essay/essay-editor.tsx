import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { WordCounter } from './word-counter';
import { TimeLimitTimer } from './time-limit-timer';
import { StructureGuide } from './structure-guide';
import { Save, Send } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

interface EssayEditorProps {
  themeId: string;
  initialContent?: string;
  minWords: number;
  maxWords: number;
  timeLimit: number;
  onSave: (content: string, isDraft: boolean) => Promise<void>;
  onSubmit: (content: string) => Promise<void>;
}

export function EssayEditor({
  themeId,
  initialContent = '',
  minWords,
  maxWords,
  timeLimit,
  onSave,
  onSubmit,
}: EssayEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const debouncedContent = useDebounce(content, 1000);

  // 自動保存
  useEffect(() => {
    if (debouncedContent && debouncedContent !== initialContent) {
      handleAutoSave();
    }
  }, [debouncedContent]);

  const handleAutoSave = async () => {
    setIsSaving(true);
    try {
      await onSave(content, true);
      setLastSaved(new Date());
    } catch (error) {
      console.error('自動保存に失敗しました:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (content.length < minWords || content.length > maxWords) {
      alert(`文字数は${minWords}〜${maxWords}文字の範囲で入力してください。`);
      return;
    }

    if (confirm('提出してもよろしいですか？提出後は編集できません。')) {
      await onSubmit(content);
    }
  };

  const handleTimeUp = () => {
    handleSubmit();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* メインエディター */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>小論文作成</CardTitle>
            <div className="flex items-center gap-4">
              <TimeLimitTimer
                timeLimit={timeLimit}
                onTimeUp={handleTimeUp}
              />
              {isSaving && (
                <span className="text-sm text-gray-500">保存中...</span>
              )}
              {lastSaved && (
                <span className="text-sm text-gray-500">
                  最終保存: {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="ここに小論文を入力してください..."
              className="min-h-[500px] text-base leading-relaxed resize-none"
            />
            
            <div className="flex items-center justify-between">
              <WordCounter
                current={content.length}
                min={minWords}
                max={maxWords}
              />
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onSave(content, true)}
                  disabled={isSaving}
                >
                  <Save className="mr-2 h-4 w-4" />
                  下書き保存
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={content.length < minWords || content.length > maxWords}
                >
                  <Send className="mr-2 h-4 w-4" />
                  提出
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* サイドバー */}
      <div className="space-y-4">
        <StructureGuide />
      </div>
    </div>
  );
}