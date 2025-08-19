'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GraduationCap, Info, Loader2, BookOpen, Target, Trophy } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

type Grade = '高校1年' | '高校2年' | '高校3年';

interface GradeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const gradeInfo = {
  '高校1年': {
    title: '高校1年生',
    description: '基礎固め・定期テスト対策',
    icon: BookOpen,
    features: [
      '基礎からしっかり学習',
      '定期テスト対策に特化',
      '苦手科目の早期発見'
    ]
  },
  '高校2年': {
    title: '高校2年生',
    description: '応用力養成・進路準備',
    icon: Target,
    features: [
      '応用問題にチャレンジ',
      '志望校の検討開始',
      '得意科目の強化'
    ]
  },
  '高校3年': {
    title: '高校3年生（受験生）',
    description: '大学受験対策特化',
    icon: Trophy,
    features: [
      '入試レベルの問題演習',
      '志望校別の対策',
      '時間配分の訓練'
    ]
  }
};

export function GradeSelectionModal({ isOpen, onClose, onComplete }: GradeSelectionModalProps) {
  const { user } = useAuth();
  const [selectedGrade, setSelectedGrade] = useState<Grade>('高校3年');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Firestoreのユーザードキュメントを更新
      await updateDoc(doc(db, 'users', user.uid), {
        grade: selectedGrade,
        gradeUpdatedAt: new Date(),
        updatedAt: new Date()
      });

      console.log('Grade set successfully:', selectedGrade);
      onComplete();
      onClose();
    } catch (err) {
      console.error('Error updating grade:', err);
      setError('学年の設定に失敗しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedInfo = gradeInfo[selectedGrade];
  const SelectedIcon = selectedInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <GraduationCap className="w-6 h-6" />
            学年を設定してください
          </DialogTitle>
          <DialogDescription className="text-base">
            あなたの学年に応じて、最適な学習プランを提供します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Label htmlFor="grade" className="text-base">学年を選択</Label>
            <Select
              value={selectedGrade}
              onValueChange={(value: Grade) => setSelectedGrade(value)}
              disabled={isLoading}
            >
              <SelectTrigger id="grade" className="h-12">
                <SelectValue placeholder="学年を選択" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(gradeInfo).map(([grade, info]) => (
                  <SelectItem key={grade} value={grade} className="py-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{info.title}</span>
                      <span className="text-xs text-muted-foreground">{info.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 選択した学年の詳細情報 */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <SelectedIcon className="w-5 h-5 text-primary" />
              <h4 className="font-semibold">{selectedInfo.title}の学習内容</h4>
            </div>
            <ul className="space-y-1.5 text-sm">
              {selectedInfo.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p>学年は後から設定画面で変更できます。</p>
                <p>4月になると自動的に進級処理が行われます。</p>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            後で設定
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                設定中...
              </>
            ) : (
              '設定する'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}