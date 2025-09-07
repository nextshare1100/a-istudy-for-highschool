// components/schedule/enhanced-schedule-view.tsx

'use client'

import { useState, useEffect } from 'react'
import { CalendarEvent } from '@/types/study-plan'
import { DetailedStudyContent } from '@/types/schedule'
import studyContentGenerator from '@/lib/schedule/studyContentGenerator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, BookOpen, Target, TrendingUp } from 'lucide-react'

interface EnhancedScheduleViewProps {
  events: CalendarEvent[]
  userLevel: { [subject: string]: number }
  weaknessAreas: string[]
}

export function EnhancedScheduleView({ 
  events, 
  userLevel, 
  weaknessAreas 
}: EnhancedScheduleViewProps) {
  const [detailedContents, setDetailedContents] = useState<DetailedStudyContent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedContent, setSelectedContent] = useState<DetailedStudyContent | null>(null)
  
  useEffect(() => {
    generateDetailedContents()
  }, [events, userLevel, weaknessAreas])
  
  const generateDetailedContents = async () => {
    const contents = await Promise.all(
      events.map(event => 
        studyContentGenerator.generateDetailedContent(
          event,
          userLevel[event.subject || ''] || 50,
          weaknessAreas
        )
      )
    )
    setDetailedContents(contents)
  }
  
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    const content = detailedContents.find(c => 
      c.date === event.date && c.subject === event.subject
    )
    setSelectedContent(content || null)
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* イベントリスト */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-2xl font-bold mb-4">本日の学習予定</h2>
        {events.map((event, index) => (
          <Card 
            key={index}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleEventClick(event)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{event.subject}</span>
                <span className="text-sm text-gray-500">
                  {event.startTime} - {event.endTime}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 text-sm">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {calculateDuration(event.startTime, event.endTime)}分
                </span>
                <span className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-1" />
                  {event.type === 'study' ? '学習' : '復習'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* 詳細内容表示 */}
      <div className="space-y-4">
        {selectedContent && (
          <Card>
            <CardHeader>
              <CardTitle>学習内容の詳細</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">学習セグメント</h4>
                  {selectedContent.segments.map((segment, index) => (
                    <div key={index} className="mb-3 p-3 bg-gray-50 rounded">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">{segment.topic}</span>
                        <span className="text-sm text-gray-500">{segment.duration}分</span>
                      </div>
                      <p className="text-sm text-gray-600">{segment.description}</p>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                          {segment.activityType === 'review' ? '復習' :
                           segment.activityType === 'learn' ? '学習' :
                           segment.activityType === 'practice' ? '演習' : 'テスト'}
                        </span>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                          {segment.difficulty === 'basic' ? '基礎' :
                           segment.difficulty === 'standard' ? '標準' : '応用'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Target className="w-4 h-4 mr-1" />
                    重点領域
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedContent.focusAreas.map((area, index) => (
                      <span key={index} className="text-sm px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    期待される成果
                  </h4>
                  <p className="text-sm text-gray-600">{selectedContent.expectedOutcome}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">学習方法</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    アプローチ: {
                      selectedContent.studyMethod.approach === 'concept-first' ? '概念理解優先' :
                      selectedContent.studyMethod.approach === 'practice-heavy' ? '演習重視' : 'バランス型'
                    }
                  </p>
                  <p className="text-sm text-gray-600">
                    推奨ペース: {
                      selectedContent.studyMethod.paceRecommendation === 'slow' ? 'じっくり' :
                      selectedContent.studyMethod.paceRecommendation === 'normal' ? '標準' : '速め'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function calculateDuration(start: string, end: string): number {
  const [startHour, startMin] = start.split(':').map(Number)
  const [endHour, endMin] = end.split(':').map(Number)
  return (endHour * 60 + endMin) - (startHour * 60 + startMin)
}
