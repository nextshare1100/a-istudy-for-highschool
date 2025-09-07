// store/scheduleStore.ts

import { create } from 'zustand'
import { CalendarEvent, StudyPlan } from '@/types/study-plan'
import { getCalendarEvents } from '@/lib/firebase/study-plan'

interface ScheduleStore {
  events: CalendarEvent[]
  currentPlan: StudyPlan | null
  isLoading: boolean
  
  // アクション
  loadEvents: (startDate: Date, endDate: Date) => Promise<void>
  addEvent: (event: CalendarEvent) => void
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (eventId: string) => void
}

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  events: [],
  currentPlan: null,
  isLoading: false,
  
  loadEvents: async (startDate: Date, endDate: Date) => {
    set({ isLoading: true })
    try {
      const { currentPlan } = get()
      if (currentPlan?.id) {
        const events = await getCalendarEvents(currentPlan.id, startDate, endDate)
        set({ events })
      }
    } catch (error) {
      console.error('イベント読み込みエラー:', error)
    } finally {
      set({ isLoading: false })
    }
  },
  
  addEvent: (event: CalendarEvent) => {
    set(state => ({ events: [...state.events, event] }))
  },
  
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => {
    set(state => ({
      events: state.events.map(e => 
        e.id === eventId ? { ...e, ...updates } : e
      )
    }))
  },
  
  deleteEvent: (eventId: string) => {
    set(state => ({
      events: state.events.filter(e => e.id !== eventId)
    }))
  }
}))
