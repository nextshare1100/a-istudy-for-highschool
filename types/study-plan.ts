// types/study-plan.ts
import { Timestamp } from 'firebase/firestore'

// AI生成計画の全体構造
export interface StudyPlan {
  id?: string
  userId: string
  name: string
  version: number
  createdAt?: Timestamp
  updatedAt?: Timestamp
  targetDate: Date
  adjustedDeadline: Date // 90%地点の期限
  targetUniversities: University[]
  subjects: SubjectPlan[]
  summary: PlanSummary
  phases: Phase[]
  weeklyTemplate: WeeklyTemplate
  milestones: Milestone[]
  isActive: boolean
  status: 'draft' | 'active' | 'completed' | 'archived'
}

// 大学情報
export interface University {
  id: string
  name: string
  requiredScore: number
  faculties?: string[]
}

// 曜日の定義
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

// 科目別計画
export interface SubjectPlan {
  name: string
  category: string
  currentScore: number
  targetScore: number
  importance: 'high' | 'medium' | 'low'
  isSelected: boolean
  weeklyHours?: number
}

// 計画サマリー
export interface PlanSummary {
  totalWeeks: number
  targetAchievementWeek: number
  bufferWeeks: number
  totalStudyHours: number
  adjustedDeadline: string
  dailyStudyHours: number
}

// 学習フェーズ
export interface Phase {
  name: string
  weeks: number
  startWeek: number
  endWeek: number
  description: string
  goals: string[]
  subjects: PhaseSubject[]
}

// フェーズ内の科目詳細
export interface PhaseSubject {
  name: string
  weeklyHours: number
  focus: string
  materials: string[]
  priority?: 'high' | 'medium' | 'low'
}

// 週間テンプレート
export interface WeeklyTemplate {
  monday: DayTemplate
  tuesday: DayTemplate
  wednesday: DayTemplate
  thursday: DayTemplate
  friday: DayTemplate
  saturday: DayTemplate
  sunday: DayTemplate
}

export interface DayTemplate {
  hours: number
  subjects: string[]
  timeSlots?: TimeSlot[]
}

// 時間枠
export interface TimeSlot {
  startTime: string // "09:00"
  endTime: string   // "10:30"
  subject: string
  type: 'lecture' | 'practice' | 'review'
  isFlexible: boolean
}

// マイルストーン
export interface Milestone {
  week: number
  date?: Date
  target: string
  metric: string
  achieved?: boolean
  achievedDate?: Date
}

// カレンダーイベント（計画から生成される）
export interface CalendarEvent {
  id?: string
  planId: string
  date: Date
  title: string
  type: 'study' | 'exam' | 'milestone' | 'review'
  startTime: string
  endTime: string
  subject?: string
  description?: string
  phase?: string
  isFlexible: boolean
  isCompleted?: boolean
  actualDuration?: number // 実際の学習時間（分）
}

// 日々の学習記録
export interface StudyRecord {
  id?: string
  planId: string
  date: Date
  plannedHours: number
  actualHours: number
  subjects: {
    [subjectName: string]: {
      plannedMinutes: number
      actualMinutes: number
      topics: string[]
      notes?: string
    }
  }
  createdAt?: Timestamp
}

// 進捗状況
export interface PlanProgress {
  planId: string
  currentWeek: number
  completionRate: number
  subjectProgress: {
    [subjectName: string]: {
      plannedHours: number
      completedHours: number
      percentage: number
    }
  }
  deviations: Deviation[]
  lastUpdated: Date
}

// 計画からの逸脱
export interface Deviation {
  date: Date
  type: 'behind' | 'ahead'
  hours: number
  reason?: string
  adjusted: boolean
}