// hooks/use-grade-check.ts
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

export type Grade = '高校1年' | '高校2年' | '高校3年';

interface GradeCheckResult {
  needsGradeSelection: boolean;
  isChecking: boolean;
  currentGrade: Grade | null;
  isExamYear: boolean;
}

export function useGradeCheck(): GradeCheckResult {
  const { user } = useAuth();
  const [needsGradeSelection, setNeedsGradeSelection] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [currentGrade, setCurrentGrade] = useState<Grade | null>(null);

  useEffect(() => {
    const checkUserGrade = async () => {
      if (!user) {
        setIsChecking(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        if (!userData?.grade) {
          // 学年が未設定の既存ユーザー
          setNeedsGradeSelection(true);
          console.log('User needs grade selection:', user.uid);
        } else {
          setCurrentGrade(userData.grade as Grade);
          setNeedsGradeSelection(false);
        }
      } catch (error) {
        console.error('Error checking user grade:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkUserGrade();
  }, [user]);

  // 受験生かどうかの判定
  const isExamYear = currentGrade === '高校3年';

  return { 
    needsGradeSelection, 
    isChecking, 
    currentGrade,
    isExamYear 
  };
}

// 学年を更新する関数
export async function updateUserGrade(uid: string, grade: Grade) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      grade,
      gradeUpdatedAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Grade updated successfully:', grade);
    return true;
  } catch (error) {
    console.error('Error updating grade:', error);
    return false;
  }
}