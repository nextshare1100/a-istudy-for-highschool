'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { AlertCircle, TrendingDown, BookOpen, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'
import * as d3 from 'd3'
import { getWeaknessAnalysis, WeaknessAnalysisData } from '@/lib/firebase/improved-analytics'

interface Props {
  userId: string
  dateRange: string
}

export default function WeaknessAnalysis({ userId, dateRange }: Props) {
  const [weaknesses, setWeaknesses] = useState<WeaknessAnalysisData[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'accuracy' | 'questions' | 'recent'>('accuracy')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWeaknessData()
  }, [userId, dateRange])

  const loadWeaknessData = async () => {
    setLoading(true)
    try {
      const data = await getWeaknessAnalysis(userId)
      setWeaknesses(data)
    } catch (error) {
      console.error('Failed to load weakness data:', error)
      setWeaknesses([])
    } finally {
      setLoading(false)
    }
  }

  const filteredWeaknesses = useMemo(() => {
    let filtered = [...weaknesses]
    
    if (selectedSubject !== 'all') {
      filtered = filtered.filter(w => w.subject === selectedSubject)
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'accuracy':
          return a.accuracy - b.accuracy
        case 'questions':
          return b.totalQuestions - a.totalQuestions
        case 'recent':
          return b.lastStudied.getTime() - a.lastStudied.getTime()
      }
    })

    return filtered
  }, [weaknesses, selectedSubject, sortBy])

  const subjects = useMemo(() => {
    return ['all', ...new Set(weaknesses.map(w => w.subject))]
  }, [weaknesses])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4">
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="科目を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全科目</SelectItem>
              {subjects.slice(1).map(subject => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="並び順" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="accuracy">正答率順</SelectItem>
              <SelectItem value="questions">問題数順</SelectItem>
              <SelectItem value="recent">最近学習順</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline">
          <BookOpen className="w-4 h-4 mr-2" />
          学習プランを生成
        </Button>
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>弱点ヒートマップ</CardTitle>
          <CardDescription>
            科目×単元の正答率を可視化
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WeaknessHeatmap data={weaknesses} />
        </CardContent>
      </Card>

      {/* Weakness List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredWeaknesses.length > 0 ? (
          filteredWeaknesses.map((weakness, index) => (
            <WeaknessCard key={index} weakness={weakness} />
          ))
        ) : (
          <div className="col-span-2 text-center py-8">
            <p className="text-muted-foreground">
              {selectedSubject === 'all' 
                ? '弱点データがありません' 
                : `${selectedSubject}の弱点データがありません`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function WeaknessCard({ weakness }: { weakness: WeaknessAnalysisData }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className={cn(
      "transition-all",
      weakness.accuracy < 50 && "border-red-200 dark:border-red-900"
    )}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {weakness.subject} - {weakness.unit}
              {weakness.accuracy < 50 && (
                <Badge variant="destructive" className="ml-2">
                  要対策
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              最終学習: {weakness.lastStudied.toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{Math.round(weakness.accuracy)}%</p>
            <p className="text-sm text-muted-foreground">
              集中度スコア
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Improvement Trend */}
          <div>
            <p className="text-sm font-medium mb-2">改善傾向</p>
            <div className="flex items-center gap-1">
              {weakness.improvementTrend.map((value, i) => (
                <div 
                  key={i}
                  className="flex-1 bg-secondary rounded"
                  style={{ 
                    height: '40px',
                    background: `linear-gradient(to top, 
                      ${value < 50 ? '#ef4444' : value < 70 ? '#f59e0b' : '#10b981'} ${value}%, 
                      transparent ${value}%)`
                  }}
                />
              ))}
            </div>
          </div>

          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '詳細を隠す' : '詳細を表示'}
          </Button>

          {expanded && (
            <>
              {/* Incorrect Patterns */}
              {weakness.incorrectPatterns.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    課題パターン
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {weakness.incorrectPatterns.map((pattern, i) => (
                      <Badge key={i} variant="secondary">
                        {pattern}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Prerequisite Gaps */}
              {weakness.prerequisiteGaps.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Brain className="w-4 h-4" />
                    前提知識の不足
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {weakness.prerequisiteGaps.map((gap, i) => (
                      <Badge key={i} variant="outline">
                        {gap}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button className="flex-1" variant="default">
                  関連問題を解く
                </Button>
                <Button className="flex-1" variant="outline">
                  解説を見る
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function WeaknessHeatmap({ data }: { data: WeaknessAnalysisData[] }) {
  useEffect(() => {
    if (data.length === 0) return

    // D3.js heatmap implementation
    const width = 800
    const height = 400
    const margin = { top: 50, right: 50, bottom: 100, left: 100 }

    // Clear previous chart
    d3.select('#weakness-heatmap').selectAll('*').remove()

    const svg = d3.select('#weakness-heatmap')
      .append('svg')
      .attr('width', '100%')
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)

    // Process data for heatmap
    const subjects = Array.from(new Set(data.map(d => d.subject)))
    const units = Array.from(new Set(data.map(d => d.unit)))

    // Create scales
    const x = d3.scaleBand()
      .domain(units)
      .range([margin.left, width - margin.right])
      .padding(0.05)

    const y = d3.scaleBand()
      .domain(subjects)
      .range([margin.top, height - margin.bottom])
      .padding(0.05)

    const colorScale = d3.scaleSequential()
      .domain([0, 100])
      .interpolator(d3.interpolateRdYlGn)

    // Add rectangles
    svg.selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => x(d.unit)!)
      .attr('y', d => y(d.subject)!)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('fill', d => colorScale(d.accuracy))
      .attr('rx', 4)
      .on('mouseover', function(event, d) {
        // Add tooltip
      })

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end')

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))

  }, [data])

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-muted-foreground">データがありません</p>
      </div>
    )
  }

  return <div id="weakness-heatmap" className="w-full" />
}