'use client'

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { getCalendarEvents } from '@/lib/firebase/study-plan'
import { CalendarEvent } from '@/types/study-plan'

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  
  useEffect(() => {
    loadEvents()
  }, [selectedDate])
  
  const loadEvents = async () => {
    // イベントの読み込み処理
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Calendar
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border"
        />
      </div>
      <div>
        <h3 className="font-semibold mb-4">予定一覧</h3>
        {/* イベントリスト */}
      </div>
    </div>
  )
}
