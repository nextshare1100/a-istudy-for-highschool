'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Calendar, 
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  BookOpen,
  Target,
  BarChart3,
  Settings,
  CalendarDays,
  CheckCircle2,
  Circle,
  Menu,
  X,
  RefreshCw,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { getActiveSchedule, calculateScheduleProgress, getDailyTasksForDateWithMonthlyCheck, monthlyScheduleManager, type MonthlyScheduleStatus } from '@/lib/firebase/schedule'
import { getRecentTimerSessions } from '@/lib/firebase/firestore'
import { format } from 'date-fns'

export default function SchedulePage() {
  const { user, loading } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [activeSchedule, setActiveSchedule] = useState<any>(null)
  const [scheduleProgress, setScheduleProgress] = useState<any>(null)
  const [todayStudyTime, setTodayStudyTime] = useState(0)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [showSidePanel, setShowSidePanel] = useState(false)
  
  // 日々のタスク表示用の状態を追加
  const [todayTasks, setTodayTasks] = useState<any>(null)
  const [isLoadingTasks, setIsLoadingTasks] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())
  
  // 月次スケジュール生成用の状態を追加
  const [monthlyStatus, setMonthlyStatus] = useState<MonthlyScheduleStatus | null>(null)
  const [isGeneratingMonthly, setIsGeneratingMonthly] = useState(false)

  // モバイル最適化されたスタイル定義
  const styles = {
    wrapper: {
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      height: '100%',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", sans-serif',
      display: 'flex',
      flexDirection: 'column' as const,
      overflowX: 'hidden',
    },
    container: {
      width: '100%',
      padding: '12px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column' as const,
      boxSizing: 'border-box' as const,
    },
    header: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '16px',
      marginBottom: '16px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      boxSizing: 'border-box' as const,
    },
    headerTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap' as const,
      gap: '12px',
    },
    title: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1f2937',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    headerActions: {
      display: 'flex',
      gap: '8px',
      width: '100%',
    },
    button: {
      padding: '8px 16px',
      borderRadius: '10px',
      border: 'none',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      flex: 1,
      justifyContent: 'center',
    },
    primaryButton: {
      backgroundColor: '#3b82f6',
      color: 'white',
    },
    secondaryButton: {
      backgroundColor: 'white',
      color: '#4b5563',
      border: '1px solid #e5e7eb',
    },
    iconButton: {
      width: '40px',
      height: '40px',
      padding: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '10px',
      border: '1px solid #e5e7eb',
      backgroundColor: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    statsRow: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '12px',
    },
    statCard: {
      padding: '12px',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    statIcon: {
      width: '36px',
      height: '36px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    statContent: {
      flex: 1,
    },
    statLabel: {
      fontSize: '12px',
      color: '#6b7280',
      marginBottom: '2px',
    },
    statValue: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#1f2937',
    },
    mainContent: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
      flex: 1,
      alignContent: 'start',
    },
    calendarCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
    },
    calendarHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
      gap: '12px',
    },
    calendarTitle: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#1f2937',
    },
    calendarNav: {
      display: 'flex',
      gap: '8px',
    },
    navButton: {
      width: '32px',
      height: '32px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      backgroundColor: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
    },
    viewToggle: {
      display: 'flex',
      gap: '4px',
      padding: '4px',
      backgroundColor: '#f3f4f6',
      borderRadius: '8px',
      marginBottom: '16px',
    },
    viewButton: {
      padding: '6px 10px',
      borderRadius: '6px',
      border: 'none',
      backgroundColor: 'transparent',
      color: '#6b7280',
      fontSize: '12px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      flex: 1,
      textAlign: 'center' as const,
    },
    viewButtonActive: {
      backgroundColor: 'white',
      color: '#1f2937',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    },
    calendarGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '2px',
      padding: '0 2px',
    },
    dayHeader: {
      padding: '4px 0',
      textAlign: 'center' as const,
      fontSize: '11px',
      fontWeight: '600',
      color: '#6b7280',
    },
    dayCell: {
      aspectRatio: '1',
      padding: '2px',
      border: '1px solid #f3f4f6',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      position: 'relative' as const,
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '36px',
      fontSize: '13px',
    },
    dayNumber: {
      fontSize: '13px',
      fontWeight: '500',
      color: '#374151',
    },
    dayContent: {
      fontSize: '11px',
      color: '#6b7280',
    },
    today: {
      backgroundColor: '#eff6ff',
      borderColor: '#3b82f6',
      borderWidth: '1.5px',
    },
    otherMonth: {
      opacity: 0.3,
    },
    sideCard: {
      backgroundColor: 'white',
      borderRadius: '16px',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
    },
    sideCardTitle: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#1f2937',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    taskItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '12px',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      marginBottom: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    taskCheckbox: {
      marginTop: '2px',
      cursor: 'pointer',
    },
    taskContent: {
      flex: 1,
    },
    taskTitle: {
      fontSize: '13px',
      fontWeight: '500',
      color: '#1f2937',
      marginBottom: '2px',
    },
    taskTime: {
      fontSize: '12px',
      color: '#6b7280',
    },
    taskDetail: {
      marginTop: '4px',
      fontSize: '12px',
      color: '#64748b',
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap' as const,
    },
    taskType: {
      backgroundColor: '#f1f5f9',
      padding: '2px 8px',
      borderRadius: '4px',
    },
    taskProblems: {
      color: '#94a3b8',
    },
    progressBar: {
      width: '100%',
      height: '8px',
      backgroundColor: '#e5e7eb',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '8px',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#3b82f6',
      borderRadius: '4px',
      transition: 'width 0.3s ease',
    },
    progressText: {
      fontSize: '12px',
      color: '#6b7280',
      display: 'flex',
      justifyContent: 'space-between',
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '40px 20px',
    },
    emptyIcon: {
      width: '48px',
      height: '48px',
      margin: '0 auto 16px',
      color: '#9ca3af',
    },
    emptyTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#4b5563',
      marginBottom: '8px',
    },
    emptyText: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '24px',
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '3px solid #e5e7eb',
      borderTopColor: '#3b82f6',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
    taskLoadingContainer: {
      padding: '20px',
      textAlign: 'center' as const,
      color: '#64748b',
    },
    noTasksContainer: {
      padding: '40px 20px',
      textAlign: 'center' as const,
      color: '#94a3b8',
    },
  }

  useEffect(() => {
    if (user) {
      loadScheduleData()
    }
  }, [user])

  // 日々のタスクを取得する処理（月次チェック付き）
  useEffect(() => {
    const loadTodayTasks = async () => {
      if (activeSchedule?.id) {
        setIsLoadingTasks(true)
        try {
          // 月次生成チェック付きでタスクを取得
          const tasks = await getDailyTasksForDateWithMonthlyCheck(
            activeSchedule.id, 
            selectedDate,
            user?.uid
          )
          setTodayTasks(tasks)
        } catch (error) {
          console.error('タスク取得エラー:', error)
        } finally {
          setIsLoadingTasks(false)
        }
      }
    }
    
    loadTodayTasks()
  }, [activeSchedule, selectedDate, user])

  // 月次スケジュール状態をチェック
  useEffect(() => {
    const checkMonthlyScheduleStatus = async () => {
      if (!activeSchedule?.id || !user) return
      
      try {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth() + 1
        const status = await monthlyScheduleManager.checkMonthlyScheduleStatus(
          activeSchedule.id,
          year,
          month
        )
        setMonthlyStatus(status)
        
        // 月初（1-3日）かつ未生成の場合は自動生成を実行
        const today = new Date()
        if (today.getDate() <= 3 && status.status === 'pending') {
          handleGenerateMonthlySchedule(true)
        }
      } catch (error) {
        console.error('月次状態チェックエラー:', error)
      }
    }
    
    if (activeSchedule && user) {
      checkMonthlyScheduleStatus()
    }
  }, [activeSchedule, currentDate, user])

  const loadScheduleData = async () => {
    if (!user) return
    
    try {
      setIsLoadingData(true)
      
      const schedule = await getActiveSchedule(user.uid)
      setActiveSchedule(schedule)
      
      if (schedule) {
        const progress = await calculateScheduleProgress(schedule.id!)
        setScheduleProgress(progress)
      }
      
      const todaySessions = await getRecentTimerSessions(user.uid, 50)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayTime = todaySessions
        .filter(session => {
          const sessionDate = new Date(session.startTime.toDate())
          sessionDate.setHours(0, 0, 0, 0)
          return sessionDate.getTime() === today.getTime()
        })
        .reduce((total, session) => total + session.elapsedSeconds, 0)
      
      setTodayStudyTime(todayTime / 3600)
      
    } catch (error) {
      console.error('スケジュールデータ読み込みエラー:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  // 月次スケジュール生成関数
  const handleGenerateMonthlySchedule = async (isAutomatic = false) => {
    if (!activeSchedule?.id || !user || isGeneratingMonthly) return
    
    setIsGeneratingMonthly(true)
    
    try {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      
      const result = await monthlyScheduleManager.generateMonthlySchedule(
        user.uid,
        activeSchedule.id,
        year,
        month,
        { isAutomatic }
      )
      
      if (result) {
        // 成功通知
        if (!isAutomatic) {
          // 手動生成の場合のみ通知を表示
          alert(`${year}年${month}月のスケジュールが生成されました！`)
        }
        
        // データを再読み込み
        await loadScheduleData()
        
        // 月次状態を再チェック
        const status = await monthlyScheduleManager.checkMonthlyScheduleStatus(
          activeSchedule.id,
          year,
          month
        )
        setMonthlyStatus(status)
      }
    } catch (error) {
      console.error('月次スケジュール生成エラー:', error)
      if (!isAutomatic) {
        alert('スケジュールの生成に失敗しました')
      }
    } finally {
      setIsGeneratingMonthly(false)
    }
  }

  // タスク完了処理の関数を追加
  const handleTaskComplete = async (sessionId: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        newSet.add(sessionId)
      }
      return newSet
    })
    
    // TODO: Firebaseでタスクの完了状態を更新
    console.log('タスク完了:', sessionId)
  }

  // カレンダー関連の関数
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // 前月の日付
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({ date, isCurrentMonth: false })
    }
    
    // 当月の日付
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      days.push({ date, isCurrentMonth: true })
    }
    
    // 次月の日付
    const remainingDays = 42 - days.length // 6週間分
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i)
      days.push({ date, isCurrentMonth: false })
    }
    
    return days
  }

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1))
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
  }

  // 日付クリック時の処理を追加
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
  }

  if (loading || isLoadingData) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={{ marginTop: '16px', color: '#6b7280' }}>読み込み中...</p>
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  const days = getDaysInMonth(currentDate)
  const weekDays = ['日', '月', '火', '水', '木', '金', '土']

  // 月次生成ステータスコンポーネント
  const MonthlyGenerationStatus = () => {
    if (!monthlyStatus || !activeSchedule) return null
    
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: monthlyStatus.status === 'completed' ? '#dcfce7' : '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {monthlyStatus.status === 'completed' ? (
                <CheckCircle2 size={20} color="#22c55e" />
              ) : monthlyStatus.status === 'generating' ? (
                <RefreshCw size={20} color="#f59e0b" className="animate-spin" />
              ) : (
                <AlertCircle size={20} color="#f59e0b" />
              )}
            </div>
            
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '2px'
              }}>
                {year}年{month}月の学習計画
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280'
              }}>
                {monthlyStatus.status === 'completed' 
                  ? '生成済み' 
                  : monthlyStatus.status === 'generating'
                  ? '生成中...'
                  : monthlyStatus.status === 'failed'
                  ? 'エラーが発生しました'
                  : '未生成'}
                {monthlyStatus.generatedAt && (
                  <span style={{ marginLeft: '8px' }}>
                    ({format(monthlyStatus.generatedAt.toDate(), 'MM/dd HH:mm')})
                  </span>
                )}
              </div>
              {monthlyStatus.error && (
                <div style={{
                  fontSize: '11px',
                  color: '#ef4444',
                  marginTop: '4px'
                }}>
                  {monthlyStatus.error}
                </div>
              )}
            </div>
          </div>
          
          {monthlyStatus.status !== 'completed' && (
            <button
              onClick={() => handleGenerateMonthlySchedule(false)}
              disabled={isGeneratingMonthly}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#9333ea',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                cursor: isGeneratingMonthly ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isGeneratingMonthly ? 0.6 : 1,
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isGeneratingMonthly) {
                  e.currentTarget.style.backgroundColor = '#7c3aed'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#9333ea'
              }}
            >
              {isGeneratingMonthly ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  月次プランを生成
                </>
              )}
            </button>
          )}
        </div>
        
        {/* AI生成の場合は追加情報を表示 */}
        {activeSchedule.aiGeneratedPlan && monthlyStatus.status === 'pending' && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#4b5563'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <Sparkles size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  AIが最適な月次プランを生成します
                </div>
                <div>
                  前月の学習実績と進捗状況を分析し、今月の目標と日々のタスクを自動調整します。
                  毎月1日に自動的に生成されますが、手動で生成することも可能です。
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // サイドパネルのコンテンツ（実際のデータを使用）
  const SidePanelContent = () => (
    <>
      {/* 週間進捗 - コンパクト版 */}
      <div style={{
        ...styles.sideCard,
        padding: '12px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}>
          <h3 style={{
            ...styles.sideCardTitle,
            marginBottom: '0',
            fontSize: '13px',
          }}>
            <BarChart3 size={16} />
            週間進捗
          </h3>
          <span style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#3b82f6',
          }}>
            {Math.round(scheduleProgress?.overallProgress || 0)}%
          </span>
        </div>
        
        <div style={styles.progressBar}>
          <div style={{ 
            ...styles.progressFill, 
            width: `${scheduleProgress?.overallProgress || 0}%` 
          }} />
        </div>
        
        {todayTasks && (
          <div style={{ 
            marginTop: '8px', 
            fontSize: '12px', 
            color: '#6b7280',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap' as const,
          }}>
            <span>
              <strong>重点:</strong> {todayTasks.focusSubjects?.join('・') || '-'}
            </span>
            <span>
              <strong>予定:</strong> {Math.round((todayTasks.totalStudyMinutes || 0) / 60)}時間
            </span>
          </div>
        )}
      </div>

      {/* 今日のタスク */}
      <div style={styles.sideCard}>
        <h3 style={styles.sideCardTitle}>
          <CalendarDays size={18} />
          {format(selectedDate, 'M月d日')}のタスク
        </h3>
        
        {activeSchedule ? (
          isLoadingTasks ? (
            <div style={styles.taskLoadingContainer}>
              <div>タスクを読み込み中...</div>
            </div>
          ) : todayTasks?.studySessions?.length > 0 ? (
            todayTasks.studySessions.map((session: any, index: number) => {
              const sessionId = `${format(selectedDate, 'yyyy-MM-dd')}-${index}`
              const isCompleted = completedTasks.has(sessionId)
              
              return (
                <div key={index} style={styles.taskItem}>
                  <div 
                    style={styles.taskCheckbox}
                    onClick={() => handleTaskComplete(sessionId)}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={18} color="#22c55e" />
                    ) : (
                      <Circle size={18} color="#64748b" />
                    )}
                  </div>
                  <div style={styles.taskContent}>
                    <div style={styles.taskTitle}>
                      {session.subject}：{session.unit}
                    </div>
                    <div style={styles.taskTime}>
                      {session.startTime} - {session.endTime}
                    </div>
                    <div style={styles.taskDetail}>
                      <span style={styles.taskType}>
                        {session.studyType === 'concept' ? '概念学習' : 
                         session.studyType === 'practice' ? '問題演習' :
                         session.studyType === 'review' ? '復習' : 'テスト'}
                      </span>
                      {session.targetProblems && (
                        <span style={styles.taskProblems}>
                          目標: {session.targetProblems}問
                        </span>
                      )}
                    </div>
                    {session.materials && session.materials.length > 0 && (
                      <div style={{ marginTop: '4px', fontSize: '11px', color: '#94a3b8' }}>
                        教材: {session.materials.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div style={styles.noTasksContainer}>
              <p>この日の学習予定はありません</p>
            </div>
          )
        ) : (
          <div style={{ padding: '20px', textAlign: 'center' as const }}>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              スケジュールがありません
            </p>
            <Link href="/schedule/create" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  marginTop: '12px',
                  fontSize: '13px',
                  padding: '8px 16px',
                }}
              >
                作成する
              </button>
            </Link>
          </div>
        )}
      </div>
    </>
  )

  // カレンダーコンポーネント
  const CalendarComponent = () => (
    <div style={styles.calendarCard}>
      <div style={styles.calendarHeader}>
        <h2 style={styles.calendarTitle}>{formatMonth(currentDate)}</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={styles.calendarNav}>
            <button
              style={styles.navButton}
              onClick={() => navigateMonth(-1)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              style={styles.navButton}
              onClick={() => navigateMonth(1)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div style={styles.viewToggle}>
        <button
          style={{
            ...styles.viewButton,
            ...(view === 'month' ? styles.viewButtonActive : {})
          }}
          onClick={() => setView('month')}
        >
          月表示
        </button>
        <button
          style={{
            ...styles.viewButton,
            ...(view === 'week' ? styles.viewButtonActive : {})
          }}
          onClick={() => setView('week')}
        >
          週表示
        </button>
        <button
          style={{
            ...styles.viewButton,
            ...(view === 'day' ? styles.viewButtonActive : {})
          }}
          onClick={() => setView('day')}
        >
          日表示
        </button>
      </div>

      <div style={styles.calendarGrid}>
        {weekDays.map(day => (
          <div key={day} style={styles.dayHeader}>{day}</div>
        ))}
        {days.map((day, index) => {
          const dateStr = format(day.date, 'yyyy-MM-dd')
          const isSelected = format(selectedDate, 'yyyy-MM-dd') === dateStr
          
          return (
            <div
              key={index}
              style={{
                ...styles.dayCell,
                ...(isToday(day.date) ? styles.today : {}),
                ...(!day.isCurrentMonth ? styles.otherMonth : {}),
                ...(isSelected && !isToday(day.date) ? { backgroundColor: '#f3f4f6' } : {}),
              }}
              onClick={() => handleDateClick(day.date)}
            >
              <div style={styles.dayNumber}>{day.date.getDate()}</div>
              {day.isCurrentMonth && activeSchedule && (
                <div style={{
                  width: '4px',
                  height: '4px',
                  backgroundColor: '#3b82f6',
                  borderRadius: '50%',
                  marginTop: '2px',
                }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* ヘッダー */}
        <div style={styles.header}>
          <div style={styles.headerTop}>
            <h1 style={styles.title}>
              <Calendar size={20} />
              学習スケジュール
            </h1>
            <div style={styles.headerActions}>
              <Link href="/schedule/create" style={{ textDecoration: 'none', flex: 1 }}>
                <button
                  style={{ ...styles.button, ...styles.primaryButton, width: '100%' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                >
                  <Plus size={16} />
                  新規作成
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* メインコンテンツ - モバイルレイアウト */}
        <div style={styles.mainContent}>
          {/* タスク表示を最初に */}
          <SidePanelContent />
          
          {/* カレンダー */}
          <CalendarComponent />
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}