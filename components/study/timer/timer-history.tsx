// components/study/timer/timer-history.tsx
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Download, Filter, Calendar, Clock, TrendingUp, RefreshCw, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useToast } from '@/components/ui/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { getRecentTimerSessions } from '@/lib/firebase/firestore'
import { auth } from '@/lib/firebase/config'
import { cn } from '@/lib/utils'

// デバッグモード設定
const DEBUG_MODE = process.env.NODE_ENV === 'development'

interface TimerSession {
  id: string
  subjectId: string
  subjectName: string
  unitId: string
  unitName: string
  startTime: Date
  endTime: Date
  duration: number
  breaks: number
  content?: {
    mainTheme: string
    subTopics: string[]
    materials: string[]
    goals: string[]
  }
  feedback?: {
    achievement: number
    understanding: number
    difficulty: number
    satisfaction: number
    achievedGoals: string[]
    struggles: string[]
    nextTasks: string[]
    tags: string[]
    comment: string
  }
  focusScore: number
}

interface TimerHistoryProps {
  subjects?: Array<{ id: string; name: string }>
}

const debugLog = (action: string, data?: any) => {
  if (DEBUG_MODE) {
    console.log(`[TimerHistory] ${action}`, data || '')
  }
}

export function TimerHistory({ subjects = [] }: TimerHistoryProps) {
  const { toast } = useToast()
  const [sessions, setSessions] = useState<TimerSession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  
  // フィルター状態
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'focus'>('date')
  const [tagFilter, setTagFilter] = useState<string>('all')

  // データ取得
  const fetchSessions = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    
    try {
      const user = auth.currentUser
      if (!user) {
        throw new Error('ログインが必要です')
      }
      
      debugLog('Fetching sessions for user', user.uid)
      
      // Firebaseから履歴データを取得
      const recentSessions = await getRecentTimerSessions(user.uid, 50)
      
      // データを変換
      const formattedSessions: TimerSession[] = recentSessions.map(session => ({
        id: session.id!,
        subjectId: session.subjectId,
        subjectName: subjects.find(s => s.id === session.subjectId)?.name || session.subjectId,
        unitId: session.unitId,
        unitName: '単元名', // 実際の実装では単元情報も取得
        startTime: session.startTime.toDate(),
        endTime: session.endTime?.toDate() || new Date(),
        duration: session.elapsedSeconds,
        breaks: session.breaks,
        content: session.content,
        feedback: session.feedback,
        focusScore: session.focusScore
      }))
      
      setSessions(formattedSessions)
      debugLog('Sessions loaded', { count: formattedSessions.length })
    } catch (error: any) {
      debugLog('Error fetching sessions', error)
      setError(error.message || 'データの取得に失敗しました')
      toast({
        title: 'エラー',
        description: 'データの取得に失敗しました',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // 初回データ取得
  useEffect(() => {
    fetchSessions()
  }, [])

  // データリフレッシュ
  const handleRefresh = () => {
    setRefreshing(true)
    fetchSessions(false)
  }

  // フィルター適用後のセッション
  const filteredSessions = useMemo(() => {
    let filtered = [...sessions]

    // 教科フィルター
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(s => s.subjectId === selectedSubject)
    }

    // 期間フィルター
    if (startDate) {
      filtered = filtered.filter(s => s.startTime >= startDate)
    }
    if (endDate) {
      const endOfDay = new Date(endDate)
      endOfDay.setHours(23, 59, 59, 999)
      filtered = filtered.filter(s => s.startTime <= endOfDay)
    }

    // タグフィルター
    if (tagFilter !== 'all') {
      filtered = filtered.filter(s => s.feedback?.tags?.includes(tagFilter))
    }

    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'duration':
          return b.duration - a.duration
        case 'focus':
          return b.focusScore - a.focusScore
        case 'date':
        default:
          return b.startTime.getTime() - a.startTime.getTime()
      }
    })

    return filtered
  }, [sessions, selectedSubject, startDate, endDate, sortBy, tagFilter])

  // 全タグを取得
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    sessions.forEach(session => {
      session.feedback?.tags?.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [sessions])

  // 時間のフォーマット
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`
  }

  // 日付のフォーマット
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // 統計情報の計算
  const stats = useMemo(() => {
    const totalTime = filteredSessions.reduce((acc, s) => acc + s.duration, 0)
    const avgTime = filteredSessions.length > 0 ? totalTime / filteredSessions.length : 0
    const avgFocus = filteredSessions.length > 0
      ? filteredSessions.reduce((acc, s) => acc + s.focusScore, 0) / filteredSessions.length
      : 0
    const avgSatisfaction = filteredSessions.length > 0
      ? filteredSessions.reduce((acc, s) => acc + (s.feedback?.satisfaction || 0), 0) / filteredSessions.length
      : 0

    // 教科別統計
    const subjectStats = filteredSessions.reduce((acc, session) => {
      if (!acc[session.subjectId]) {
        acc[session.subjectId] = {
          name: session.subjectName,
          totalTime: 0,
          count: 0
        }
      }
      acc[session.subjectId].totalTime += session.duration
      acc[session.subjectId].count += 1
      return acc
    }, {} as Record<string, { name: string; totalTime: number; count: number }>)

    return {
      totalSessions: filteredSessions.length,
      totalTime,
      avgTime,
      avgFocus,
      avgSatisfaction,
      subjectStats
    }
  }, [filteredSessions])

  // CSVエクスポート
  const exportToCSV = () => {
    debugLog('Exporting to CSV', { count: filteredSessions.length })
    
    const headers = [
      '日付',
      '教科',
      '単元',
      'テーマ',
      '学習時間',
      '休憩回数',
      '集中度',
      '達成度',
      '理解度',
      '難易度',
      '満足度',
      'タグ',
      'コメント'
    ]

    const rows = filteredSessions.map(session => [
      formatDate(session.startTime),
      session.subjectName,
      session.unitName,
      session.content?.mainTheme || '',
      formatDuration(session.duration),
      session.breaks.toString(),
      session.focusScore.toString(),
      session.feedback?.achievement?.toString() || '',
      session.feedback?.understanding?.toString() || '',
      session.feedback?.difficulty?.toString() || '',
      session.feedback?.satisfaction?.toString() || '',
      session.feedback?.tags?.join(', ') || '',
      session.feedback?.comment || ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // BOM付きUTF-8で出力（Excelでの文字化け対策）
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `study_history_${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    toast({
      title: 'エクスポート完了',
      description: 'CSVファイルをダウンロードしました',
    })
  }

  // 行の展開/縮小
  const toggleRowExpansion = (sessionId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId)
    } else {
      newExpanded.add(sessionId)
    }
    setExpandedRows(newExpanded)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </CardContent>
      </Card>
    )
  }

  if (error && !sessions.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>{error}</p>
            <Button onClick={() => fetchSessions()} className="mt-4">
              再試行
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">総学習回数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}回</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">総学習時間</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.totalTime)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">平均集中度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.avgFocus)}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">平均満足度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgSatisfaction.toFixed(1)}/10</div>
          </CardContent>
        </Card>
      </div>

      {/* メインコンテンツ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>学習履歴</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleRefresh} size="sm" variant="outline" disabled={refreshing}>
                <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
                更新
              </Button>
              <Button onClick={exportToCSV} size="sm">
                <Download className="mr-2 h-4 w-4" />
                CSVエクスポート
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* フィルター */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="教科で絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての教科</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DatePicker
              date={startDate}
              onDateChange={setStartDate}
              placeholder="開始日"
            />

            <DatePicker
              date={endDate}
              onDateChange={setEndDate}
              placeholder="終了日"
            />

            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="タグで絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのタグ</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">日付順</SelectItem>
                <SelectItem value="duration">学習時間順</SelectItem>
                <SelectItem value="focus">集中度順</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* タブ */}
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="list">リスト表示</TabsTrigger>
              <TabsTrigger value="stats">統計情報</TabsTrigger>
            </TabsList>
            
            {/* リスト表示 */}
            <TabsContent value="list">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>日時</TableHead>
                      <TableHead>教科/単元</TableHead>
                      <TableHead>テーマ</TableHead>
                      <TableHead>時間</TableHead>
                      <TableHead>評価</TableHead>
                      <TableHead>タグ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSessions.map(session => (
                      <React.Fragment key={session.id}>
                        <TableRow className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(session.id)}
                            >
                              <ChevronDown className={cn(
                                "h-4 w-4 transition-transform",
                                expandedRows.has(session.id) && "transform rotate-180"
                              )} />
                            </Button>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(session.startTime)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{session.subjectName}</div>
                              <div className="text-muted-foreground">{session.unitName}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {session.content?.mainTheme || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{formatDuration(session.duration)}</div>
                              <div className="text-muted-foreground">
                                集中度 {session.focusScore}%
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              <div>達成度: {session.feedback?.achievement || '-'}/10</div>
                              <div>満足度: {session.feedback?.satisfaction || '-'}/10</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {session.feedback?.tags?.slice(0, 2).map((tag, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {(session.feedback?.tags?.length || 0) > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{(session.feedback?.tags?.length || 0) - 2}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(session.id) && (
                          <TableRow>
                            <TableCell colSpan={7} className="p-0">
                              <div className="bg-muted/30 p-6 space-y-4">
                                {/* 学習内容詳細 */}
                                {session.content && (
                                  <div className="grid grid-cols-3 gap-4">
                                    {session.content.subTopics.length > 0 && (
                                      <div>
                                        <h4 className="font-semibold text-sm mb-2">サブトピック</h4>
                                        <div className="flex flex-wrap gap-1">
                                          {session.content.subTopics.map((topic, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">
                                              {topic}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {session.content.materials.length > 0 && (
                                      <div>
                                        <h4 className="font-semibold text-sm mb-2">使用教材</h4>
                                        <ul className="text-sm space-y-1">
                                          {session.content.materials.map((material, i) => (
                                            <li key={i}>• {material}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {session.content.goals.length > 0 && (
                                      <div>
                                        <h4 className="font-semibold text-sm mb-2">学習目標</h4>
                                        <ul className="text-sm space-y-1">
                                          {session.content.goals.map((goal, i) => (
                                            <li key={i}>• {goal}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* フィードバック詳細 */}
                                {session.feedback && (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-4 gap-4">
                                      <div>
                                        <span className="text-sm text-muted-foreground">理解度</span>
                                        <div className="font-medium">{session.feedback.understanding}/10</div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-muted-foreground">難易度</span>
                                        <div className="font-medium">{session.feedback.difficulty}/10</div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-muted-foreground">休憩回数</span>
                                        <div className="font-medium">{session.breaks}回</div>
                                      </div>
                                      <div>
                                        <span className="text-sm text-muted-foreground">集中度</span>
                                        <div className="font-medium">{session.focusScore}%</div>
                                      </div>
                                    </div>
                                    
                                    {session.feedback.comment && (
                                      <div>
                                        <h4 className="font-semibold text-sm mb-1">感想・メモ</h4>
                                        <p className="text-sm text-muted-foreground">
                                          {session.feedback.comment}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </TabsContent>
            
            {/* 統計表示 */}
            <TabsContent value="stats">
              <div className="space-y-6">
                {/* 教科別統計 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">教科別学習時間</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(stats.subjectStats).map(([subjectId, data]) => (
                      <Card key={subjectId}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">{data.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">総時間</span>
                              <span className="font-medium">{formatDuration(data.totalTime)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">学習回数</span>
                              <span className="font-medium">{data.count}回</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">平均時間</span>
                              <span className="font-medium">
                                {formatDuration(Math.floor(data.totalTime / data.count))}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* 日別統計グラフ（簡易版） */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">学習傾向</h3>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* 曜日別平均学習時間 */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">曜日別平均学習時間</h4>
                          <div className="grid grid-cols-7 gap-2">
                            {['月', '火', '水', '木', '金', '土', '日'].map((day, index) => {
                              const dayStats = filteredSessions.filter(s => 
                                s.startTime.getDay() === (index + 1) % 7
                              )
                              const avgTime = dayStats.length > 0
                                ? dayStats.reduce((acc, s) => acc + s.duration, 0) / dayStats.length
                                : 0
                              
                              return (
                                <div key={day} className="text-center">
                                  <div className="text-xs text-muted-foreground mb-1">{day}</div>
                                  <div className="text-sm font-medium">
                                    {formatDuration(Math.floor(avgTime))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* 時間帯別学習回数 */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">時間帯別学習回数</h4>
                          <div className="space-y-2">
                            {[
                              { label: '早朝 (5-8時)', range: [5, 8] },
                              { label: '午前 (8-12時)', range: [8, 12] },
                              { label: '午後 (12-17時)', range: [12, 17] },
                              { label: '夜 (17-22時)', range: [17, 22] },
                              { label: '深夜 (22-5時)', range: [22, 29] }
                            ].map(({ label, range }) => {
                              const count = filteredSessions.filter(s => {
                                const hour = s.startTime.getHours()
                                if (range[1] > 24) {
                                  return hour >= range[0] || hour < range[1] - 24
                                }
                                return hour >= range[0] && hour < range[1]
                              }).length
                              
                              return (
                                <div key={label} className="flex items-center justify-between">
                                  <span className="text-sm">{label}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-32 bg-muted rounded-full h-2">
                                      <div 
                                        className="bg-primary rounded-full h-2 transition-all"
                                        style={{ 
                                          width: `${Math.min(100, (count / filteredSessions.length) * 100)}%` 
                                        }}
                                      />
                                    </div>
                                    <span className="text-sm font-medium w-12 text-right">{count}回</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* タグ統計 */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">よく使われるタグ</h3>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => {
                      const count = sessions.filter(s => s.feedback?.tags?.includes(tag)).length
                      return (
                        <Badge key={tag} variant="secondary" className="px-3 py-1">
                          {tag} ({count})
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* デバッグ情報 */}
          {DEBUG_MODE && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold text-sm mb-2">デバッグ情報</h4>
              <div className="text-xs space-y-1 font-mono">
                <div>総セッション数: {sessions.length}</div>
                <div>フィルター後: {filteredSessions.length}</div>
                <div>展開された行: {expandedRows.size}</div>
                <div>エラー: {error || 'なし'}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}