// types/schedule.ts

export interface ScheduleEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  type: 'study' | 'break' | 'review' | 'exam'
  subject?: string
  isRecurring?: boolean
  recurringPattern?: RecurringPattern
  reminder?: ReminderSettings
  color?: string
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly'
  interval: number
  daysOfWeek?: number[]
  endDate?: Date
}

export interface ReminderSettings {
  enabled: boolean
  minutesBefore: number
  type: 'push' | 'email' | 'both'
}

export interface SchedulePreferences {
  defaultStudyDuration: number
  defaultBreakDuration: number
  preferredStudyTimes: TimePreference[]
  notificationSettings: NotificationSettings
}

export interface TimePreference {
  dayOfWeek: number
  startTime: string
  endTime: string
  efficiency: 'high' | 'medium' | 'low'
}

export interface NotificationSettings {
  enablePushNotifications: boolean
  enableEmailNotifications: boolean
  quietHoursStart?: string
  quietHoursEnd?: string
}

// 学習内容の詳細定義
export interface DetailedStudyContent {
  subject: string
  unit: string
  date: Date
  duration: number // 分
  segments: StudySegment[]
  focusAreas: string[]
  studyMethod: StudyMethod
  expectedOutcome: string
}

export interface StudySegment {
  order: number
  duration: number // 分
  topic: string
  activityType: 'review' | 'learn' | 'practice' | 'test'
  description: string
  difficulty: 'basic' | 'standard' | 'advanced'
}

export interface StudyMethod {
  approach: 'concept-first' | 'practice-heavy' | 'mixed'
  techniques: string[]
  paceRecommendation: 'slow' | 'normal' | 'fast'
}

// 単元別の学習パターン
export interface UnitStudyPattern {
  subject: string
  unit: string
  recommendedSegments: {
    [key: string]: {
      percentage: number
      activityType: string
      description: string
    }
  }
  commonMistakes: string[]
  keyPoints: string[]
}
