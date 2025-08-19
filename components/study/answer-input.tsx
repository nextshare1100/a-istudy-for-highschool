import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Send, AlertCircle } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Problem } from '@/types';
import { useStudySession } from '@/hooks/use-study-session';
import { CanvasAnswerInput } from './canvas-answer-input';

interface AnswerInputProps {
  problem: Problem;
  onSubmit: (answer: string | string[], confidence: number) => Promise<boolean>;
  disabled?: boolean;
  className?: string;
}

// ドラッグ可能なアイテムコンポーネント
function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'bg-white dark:bg-gray-700 p-3 rounded-lg border cursor-move',
        isDragging && 'opacity-50'
      )}
    >
      {children}
    </div>
  );
}

export function AnswerInput({ problem, onSubmit, disabled = false, className }: AnswerInputProps) {
  const { isSubmitting } = useStudySession();
  const [confidence, setConfidence] = useState(3);
  const [sortableItems, setSortableItems] = useState<string[]>([]);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Canvas問題の場合は専用コンポーネントを使用
  if (problem.canvasData?.answerType) {
    return (
      <CanvasAnswerInput
        problem={problem}
        onSubmit={onSubmit}
        disabled={disabled}
        className={className}
      />
    );
  }

  // フォームスキーマの動的生成
  const getFormSchema = () => {
    switch (problem.type) {
      case 'multiple_choice':
        return z.object({
          answer: z.string().min(1, '選択してください'),
        });
      case 'fill_blank':
      case 'formula_fill':
        const fillCount = (problem.question.match(/_+/g) || []).length;
        const fillSchema: any = {};
        for (let i = 0; i < fillCount; i++) {
          fillSchema[`blank_${i}`] = z.string().min(1, '入力してください');
        }
        return z.object(fillSchema);
      case 'short_answer':
        return z.object({
          answer: z.string().min(1, '解答を入力してください').max(200, '200文字以内で入力してください'),
        });
      case 'essay':
        return z.object({
          answer: z.string().min(10, '10文字以上入力してください').max(1000, '1000文字以内で入力してください'),
        });
      case 'sequence_sort':
        return z.object({
          answer: z.array(z.string()),
        });
      default:
        return z.object({
          answer: z.string().min(1, '解答を入力してください'),
        });
    }
  };

  const form = useForm({
    resolver: zodResolver(getFormSchema()),
    defaultValues: problem.type === 'sequence_sort' 
      ? { answer: [] }
      : problem.type === 'fill_blank' || problem.type === 'formula_fill'
      ? {}
      : { answer: '' },
  });

  // 経過時間の更新
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // 並び替え問題の初期化
  useEffect(() => {
    if (problem.type === 'sequence_sort' && problem.options) {
      const shuffled = [...problem.options].sort(() => Math.random() - 0.5);
      setSortableItems(shuffled);
    }
  }, [problem]);

  // ドラッグ終了時の処理
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setSortableItems((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // フォーム送信処理
  const handleSubmit = async (data: any) => {
    let answer: string | string[];

    switch (problem.type) {
      case 'fill_blank':
      case 'formula_fill':
        const blanks = Object.keys(data)
          .filter(key => key.startsWith('blank_'))
          .sort()
          .map(key => data[key]);
        answer = blanks;
        break;
      case 'sequence_sort':
        answer = sortableItems;
        break;
      default:
        answer = data.answer;
    }

    const success = await onSubmit(answer, confidence);
    if (success) {
      form.reset();
    }
  };

  // 問題タイプ別の入力UI
  const renderInput = () => {
    switch (problem.type) {
      case 'multiple_choice':
        return (
          <Controller
            name="answer"
            control={form.control}
            render={({ field }) => (
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                disabled={disabled || isSubmitting}
              >
                {problem.options?.map((option, index) => {
                  const optionId = String.fromCharCode(65 + index);
                  return (
                    <div key={index} className="flex items-start space-x-2 mb-3">
                      <RadioGroupItem value={optionId} id={`option-${index}`} />
                      <Label
                        htmlFor={`option-${index}`}
                        className="flex-1 cursor-pointer font-normal"
                      >
                        <span className="font-medium mr-2">{optionId}.</span>
                        {option}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            )}
          />
        );

      case 'fill_blank':
      case 'formula_fill':
        const blanks = (problem.question.match(/_+/g) || []);
        return (
          <div className="space-y-3">
            {blanks.map((_, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm font-medium">空欄{index + 1}:</span>
                <Controller
                  name={`blank_${index}`}
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      placeholder={problem.type === 'formula_fill' ? '数式を入力' : '語句を入力'}
                      disabled={disabled || isSubmitting}
                      className="flex-1"
                    />
                  )}
                />
              </div>
            ))}
          </div>
        );

      case 'short_answer':
        return (
          <Controller
            name="answer"
            control={form.control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="解答を入力してください"
                disabled={disabled || isSubmitting}
                rows={3}
                className="resize-none"
              />
            )}
          />
        );

      case 'essay':
        return (
          <Controller
            name="answer"
            control={form.control}
            render={({ field }) => (
              <div className="space-y-2">
                <Textarea
                  {...field}
                  placeholder="論述を入力してください"
                  disabled={disabled || isSubmitting}
                  rows={8}
                  className="resize-none"
                />
                <div className="text-sm text-muted-foreground text-right">
                  {field.value?.length || 0} / 1000文字
                </div>
              </div>
            )}
          />
        );

      case 'sequence_sort':
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-3">
              ドラッグして正しい順序に並び替えてください
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortableItems}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {sortableItems.map((item, index) => (
                    <SortableItem key={item} id={item}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-muted-foreground">
                          {index + 1}.
                        </span>
                        <span>{item}</span>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        );

      default:
        return null;
    }
  };

  // 経過時間のフォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>解答入力</span>
          <span className="text-sm font-normal text-muted-foreground">
            経過時間: {formatTime(elapsedTime)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* エラーメッセージ */}
          {form.formState.errors && Object.keys(form.formState.errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {Object.values(form.formState.errors)[0]?.message}
              </AlertDescription>
            </Alert>
          )}

          {/* 問題タイプ別の入力UI */}
          {renderInput()}

          {/* 自信度選択 */}
          <div className="space-y-2">
            <Label>自信度</Label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">低</span>
              <Slider
                value={[confidence]}
                onValueChange={(value) => setConfidence(value[0])}
                min={1}
                max={5}
                step={1}
                disabled={disabled || isSubmitting}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">高</span>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {['全く自信なし', '自信なし', '普通', '自信あり', '完全に自信あり'][confidence - 1]}
            </div>
          </div>

          {/* 送信ボタン */}
          <Button
            type="submit"
            disabled={disabled || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                送信中...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                解答を送信
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}