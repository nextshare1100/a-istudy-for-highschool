// 既存のpage.tsxに追加するインポート
import { EnhancedScheduleView } from '@/components/schedule/enhanced-schedule-view'

// コンポーネント内で使用例
const userLevel = {
  '数学': 65,
  '英語': 58,
  '物理': 70,
  // 他の科目...
}

const weaknessAreas = ['二次関数の最大最小', '英文法の関係詞', '力学的エネルギー']

// 既存のビューと切り替えられるように
{showEnhancedView ? (
  <EnhancedScheduleView 
    events={events}
    userLevel={userLevel}
    weaknessAreas={weaknessAreas}
  />
) : (
  <ScheduleView /> // 既存のビュー
)}
