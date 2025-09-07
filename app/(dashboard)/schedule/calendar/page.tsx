'use client'

import { Calendar } from '@/components/ui/calendar'
import { CalendarView } from '@/components/schedule/calendar-view'

export default function ScheduleCalendarPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">学習カレンダー</h1>
      <CalendarView />
    </div>
  )
}
