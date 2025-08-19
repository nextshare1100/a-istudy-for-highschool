'use client'

import { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Plus, X, Clock, BookOpen, Coffee, AlertCircle, Sparkles, Target } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isSameDay, startOfWeek, endOfWeek } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { getCalendarEvents, getActiveStudyPlan } from '@/lib/firebase/study-plan'
import { CalendarEvent, StudyPlan } from '@/types/study-plan'
import { createManualEvent, subscribeToManualEvents, deleteManualEvent, ManualEvent } from '@/lib/firebase/manual-events'
import { useAuth } from '@/hooks/use-auth'

interface Event {
  id: string
  date: Date
  title: string
  type: 'study' | 'exam' | 'school' | 'personal' | 'break' | 'milestone'
  startTime: string
  endTime: string
  subject?: string
  description?: string
  isFlexible: boolean
  phase?: string // AI計画のフェーズ
  planId?: string // AI計画のID
}

interface DaySchedule {
  date: Date
  studyHours: number
  events: Event[]
}

export default function ScheduleViewWithAIPlans() {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.uid || ''
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [manualEvents, setManualEvents] = useState<ManualEvent[]>([])
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false)
  const [adjustmentSuggestion, setAdjustmentSuggestion] = useState<any>(null)
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null)
  const [aiEvents, setAiEvents] = useState<CalendarEvent[]>([])
  const [isLoadingPlan, setIsLoadingPlan] = useState(true)
  
  // 新しいイベントのフォーム状態
  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    type: 'personal',
    isFlexible: false,
    startTime: '09:00',
    endTime: '10:00'
  })

  const eventTypeConfig = {
    study: { label: '学習', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: BookOpen },
    exam: { label: '試験', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
    school: { label: '学校', color: 'bg-green-100 text-green-700 border-green-200', icon: Calendar },
    personal: { label: '個人', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Clock },
    break: { label: '休憩', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Coffee },
    milestone: { label: 'マイルストーン', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Target }
  }

  // アクティブな計画とそのイベントを読み込む
  useEffect(() => {
    if (!user) return

    const loadActivePlan = async () => {
      try {
        setIsLoadingPlan(true)
        const plan = await getActiveStudyPlan(userId)
        if (plan) {
          setActivePlan(plan)
          
          // 現在の月のイベントを取得
          const monthStart = startOfWeek(startOfMonth(currentDate))
          const monthEnd = endOfWeek(endOfMonth(currentDate))
          const planEvents = await getCalendarEvents(plan.id!, monthStart, monthEnd)
          setAiEvents(planEvents)
        }
      } catch (error) {
        console.error('計画読み込みエラー:', error)
      } finally {
        setIsLoadingPlan(false)
      }
    }

    loadActivePlan()
  }, [currentDate, userId, user])

  // 手動イベントのリアルタイム同期
  useEffect(() => {
    if (!user) return

    const monthStart = startOfWeek(startOfMonth(currentDate))
    const monthEnd = endOfWeek(endOfMonth(currentDate))
    
    const unsubscribe = subscribeToManualEvents(
      userId,
      monthStart,
      monthEnd,
      (events) => {
        setManualEvents(events)
      }
    )

    return () => unsubscribe()
  }, [currentDate, userId, user])

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))

  const getDaysInMonth = () => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start, end })
    
    const startDayOfWeek = getDay(start)
    const previousMonthDays = Array.from({ length: startDayOfWeek }, (_, i) => {
      const date = new Date(start)
      date.setDate(date.getDate() - (startDayOfWeek - i))
      return date
    })
    
    return [...previousMonthDays, ...days]
  }

  const getEventsForDay = (date: Date) => {
    // 手動で追加したイベント（Firestoreから）
    const manualEventsForDay = manualEvents
      .filter(event => {
        const eventDate = event.date instanceof Date 
          ? event.date 
          : (event.date as any).toDate()
        return isSameDay(eventDate, date)
      })
      .map(event => ({
        id: event.id!,
        date: event.date instanceof Date ? event.date : (event.date as any).toDate(),
        title: event.title,
        type: event.type,
        startTime: event.startTime,
        endTime: event.endTime,
        subject: event.subject,
        description: event.description,
        isFlexible: event.isFlexible,
        isManual: true
      }))
    
    // AI計画のイベント
    const aiEventsForDay = aiEvents
      .filter(event => isSameDay(event.date, date))
      .map(event => ({
        id: event.id || `ai-${event.date.getTime()}-${event.startTime}`,
        date: event.date,
        title: event.title,
        type: event.type as Event['type'],
        startTime: event.startTime,
        endTime: event.endTime,
        subject: event.subject,
        description: event.description,
        isFlexible: event.isFlexible,
        phase: event.phase,
        planId: event.planId
      }))
    
    return [...manualEventsForDay, ...aiEventsForDay]
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setNewEvent({
      ...newEvent,
      date: date
    })
    setShowEventDialog(true)
  }

  const handleAddEvent = async () => {
    if (!newEvent.title || !selectedDate || !user) return

    try {
      // Firestoreに保存
      await createManualEvent(userId, {
        date: selectedDate,
        title: newEvent.title,
        type: newEvent.type as Event['type'],
        startTime: newEvent.startTime || '09:00',
        endTime: newEvent.endTime || '10:00',
        subject: newEvent.subject,
        description: newEvent.description,
        isFlexible: newEvent.isFlexible || false
      })
      
      // スケジュール調整が必要かチェック
      const event: Event = {
        id: Date.now().toString(),
        date: selectedDate,
        title: newEvent.title,
        type: newEvent.type as Event['type'],
        startTime: newEvent.startTime || '09:00',
        endTime: newEvent.endTime || '10:00',
        subject: newEvent.subject,
        description: newEvent.description,
        isFlexible: newEvent.isFlexible || false
      }
      checkScheduleAdjustment(event)
      
      // ダイアログを閉じてフォームをリセット
      setShowEventDialog(false)
      setNewEvent({
        type: 'personal',
        isFlexible: false,
        startTime: '09:00',
        endTime: '10:00'
      })
    } catch (error) {
      console.error('イベント追加エラー:', error)
      alert('予定の追加に失敗しました')
    }
  }

  const checkScheduleAdjustment = (newEvent: Event) => {
    // 学習時間に影響がある場合、調整案を生成
    if (newEvent.type !== 'study') {
      const suggestion = generateAdjustmentSuggestion(newEvent)
      if (suggestion) {
        setAdjustmentSuggestion(suggestion)
        setShowAdjustmentDialog(true)
      }
    }
  }

  const generateAdjustmentSuggestion = (event: Event) => {
    // イベントの時間を計算
    const [startHour, startMin] = event.startTime.split(':').map(Number)
    const [endHour, endMin] = event.endTime.split(':').map(Number)
    const duration = (endHour + endMin / 60) - (startHour + startMin / 60)
    
    // その日の既存の学習時間を計算
    const dayEvents = getEventsForDay(event.date)
    const studyHours = dayEvents
      .filter(e => e.type === 'study')
      .reduce((total, e) => {
        const [sh, sm] = e.startTime.split(':').map(Number)
        const [eh, em] = e.endTime.split(':').map(Number)
        return total + ((eh + em / 60) - (sh + sm / 60))
      }, 0)
    
    // 目標学習時間（AI計画から取得、なければデフォルト4時間）
    const targetStudyHours = activePlan?.summary.dailyStudyHours || 4
    const shortfall = targetStudyHours - studyHours
    
    if (shortfall > 0) {
      return {
        message: `${event.title}により、この日の学習時間が${shortfall.toFixed(1)}時間不足します。`,
        suggestions: [
          {
            type: 'redistribute',
            description: '前後の日に学習時間を振り分ける',
            details: `前日と翌日にそれぞれ${(shortfall / 2).toFixed(1)}時間追加`
          },
          {
            type: 'compress',
            description: '効率を上げて短時間で同じ内容をカバー',
            details: '演習中心の学習に切り替えて時間短縮'
          },
          {
            type: 'postpone',
            description: '優先度の低い内容を後日に延期',
            details: '復習や演習問題を翌週に移動'
          }
        ]
      }
    }
    
    return null
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteManualEvent(eventId)
    } catch (error) {
      console.error('イベント削除エラー:', error)
      alert('予定の削除に失敗しました')
    }
  }

  const weekDays = ['日', '月', '火', '水', '木', '金', '土']

  // 認証状態のチェック
  if (authLoading || isLoadingPlan) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">スケジュールを表示するにはログインが必要です。</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {format(currentDate, 'yyyy年M月', { locale: ja })}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {activePlan && (
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {activePlan.name}
                </Badge>
              )}
              <div className="text-sm text-gray-600">
                クリックして予定を追加
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth().map((day, index) => {
                const dayEvents = getEventsForDay(day)
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isCurrentDay = isToday(day)
                const hasAIPlan = dayEvents.some(e => e.planId)
                
                return (
                  <div
                    key={index}
                    onClick={() => handleDayClick(day)}
                    className={`
                      relative min-h-[100px] p-2 rounded-lg border cursor-pointer
                      ${!isCurrentMonth ? 'opacity-40' : ''}
                      ${isCurrentDay ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                      ${hasAIPlan ? 'bg-purple-50/30' : ''}
                      hover:bg-gray-50 transition-colors
                    `}
                  >
                    <div className="text-sm font-medium mb-1">
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => {
                        const config = eventTypeConfig[event.type]
                        return (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded flex items-center gap-1 border ${config.color} ${
                              event.planId ? 'opacity-90' : ''
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              // イベント詳細表示
                            }}
                          >
                            <config.icon className="h-3 w-3" />
                            <span className="truncate">{event.title}</span>
                            {event.planId && (
                              <Sparkles className="h-2 w-2 ml-auto" />
                            )}
                          </div>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{dayEvents.length - 3}件
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 凡例 */}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {Object.entries(eventTypeConfig).map(([type, config]) => (
              <div key={type} className={`flex items-center gap-1 px-2 py-1 rounded border ${config.color}`}>
                <config.icon className="h-3 w-3" />
                <span>{config.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1 px-2 py-1 rounded border bg-purple-100 text-purple-700 border-purple-200">
              <Sparkles className="h-3 w-3" />
              <span>AI計画</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* イベント追加ダイアログ */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, 'M月d日', { locale: ja })}の予定を追加
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">予定のタイトル</label>
              <input
                type="text"
                value={newEvent.title || ''}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="例：期末テスト、部活動"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">種類</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(eventTypeConfig).filter(([type]) => type !== 'milestone').map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => setNewEvent({ ...newEvent, type: type as Event['type'] })}
                    className={`p-2 rounded-lg border text-sm ${
                      newEvent.type === type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <config.icon className="h-4 w-4 mx-auto mb-1" />
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">開始時刻</label>
                <input
                  type="time"
                  value={newEvent.startTime || '09:00'}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">終了時刻</label>
                <input
                  type="time"
                  value={newEvent.endTime || '10:00'}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>

            {newEvent.type === 'study' && (
              <div>
                <label className="block text-sm font-medium mb-2">科目</label>
                <input
                  type="text"
                  value={newEvent.subject || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, subject: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="例：数学、英語"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">メモ</label>
              <textarea
                value={newEvent.description || ''}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="w-full p-2 border rounded-lg"
                rows={2}
                placeholder="詳細をメモ"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFlexible"
                checked={newEvent.isFlexible || false}
                onChange={(e) => setNewEvent({ ...newEvent, isFlexible: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isFlexible" className="text-sm">
                この予定は調整可能（学習時間確保のため移動してもOK）
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              キャンセル
            </Button>
            <Button onClick={handleAddEvent} disabled={!newEvent.title}>
              追加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* スケジュール調整提案ダイアログ */}
      <Dialog open={showAdjustmentDialog} onOpenChange={setShowAdjustmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>スケジュール調整の提案</DialogTitle>
          </DialogHeader>
          
          {adjustmentSuggestion && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  {adjustmentSuggestion.message}
                </p>
              </div>

              <div>
                <p className="font-medium mb-3">調整案：</p>
                <div className="space-y-3">
                  {adjustmentSuggestion.suggestions.map((suggestion: any, index: number) => (
                    <button
                      key={index}
                      className="w-full p-3 text-left border rounded-lg hover:bg-gray-50"
                      onClick={() => {
                        // 調整案を適用
                        console.log('調整案を適用:', suggestion)
                        setShowAdjustmentDialog(false)
                      }}
                    >
                      <p className="font-medium text-sm">{suggestion.description}</p>
                      <p className="text-xs text-gray-600 mt-1">{suggestion.details}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAdjustmentDialog(false)}
                >
                  調整しない
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}