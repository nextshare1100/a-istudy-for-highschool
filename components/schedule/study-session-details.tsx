// components/schedule/study-session-details.tsx

import React, { useState } from 'react'
import { 
  Target, 
  AlertTriangle, 
  CheckCircle2, 
  BookOpen,
  Brain,
  Lightbulb,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface StudySessionDetailsProps {
  session: StudySessionDetail
  onComplete?: (sessionId: string, achievements: Achievement[]) => void
  isCompleted?: boolean
}

interface StudySessionDetail {
  id: string
  subject: string
  unit: string
  startTime: string
  endTime: string
  
  // 課題と目標
  challenges: Challenge[]
  objectives: Objective[]
  
  // 学習内容
  materials: string[]
  targetProblems?: number
  studyType: 'concept' | 'practice' | 'review' | 'test'
  
  // 関連する弱点
  relatedWeaknesses?: Weakness[]
}

interface Challenge {
  id: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  rootCause?: string
  previousAttempts?: number
}

interface Objective {
  id: string
  title: string
  description: string
  criteria: string[]
  expectedOutcome: string
  keyPoints: string[]
}

interface Achievement {
  objectiveId: string
  achieved: boolean
  notes?: string
}

interface Weakness {
  topic: string
  accuracy: number
  lastOccurred: Date
}

export default function StudySessionDetails({
  session,
  onComplete,
  isCompleted = false
}: StudySessionDetailsProps) {
  const [expanded, setExpanded] = useState(false)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [showDetails, setShowDetails] = useState({
    challenges: true,
    objectives: true,
    materials: false
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const toggleAchievement = (objectiveId: string) => {
    setAchievements(prev => {
      const existing = prev.find(a => a.objectiveId === objectiveId)
      if (existing) {
        return prev.map(a => 
          a.objectiveId === objectiveId 
            ? { ...a, achieved: !a.achieved }
            : a
        )
      }
      return [...prev, { objectiveId, achieved: true }]
    })
  }

  const handleComplete = () => {
    if (onComplete) {
      onComplete(session.id, achievements)
    }
  }

  return (
    <div className={`
      border rounded-lg overflow-hidden transition-all
      ${isCompleted ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-200'}
      ${expanded ? 'shadow-lg' : 'shadow'}
    `}>
      {/* ヘッダー */}
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`
                p-2 rounded-lg
                ${isCompleted ? 'bg-green-100' : 'bg-blue-100'}
              `}>
                <BookOpen className={`
                  w-5 h-5
                  ${isCompleted ? 'text-green-600' : 'text-blue-600'}
                `} />
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  {session.subject} - {session.unit}
                </h3>
                <p className="text-sm text-gray-600">
                  {session.startTime} - {session.endTime}
                </p>
              </div>
            </div>
            
            {/* 簡易サマリー */}
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                課題: {session.challenges.length}個
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4 text-blue-500" />
                目標: {session.objectives.length}個
              </span>
              {session.targetProblems && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-gray-500" />
                  演習: {session.targetProblems}問
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isCompleted && (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            )}
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* 詳細内容 */}
      {expanded && (
        <div className="border-t border-gray-200">
          {/* 課題セクション */}
          <div className="p-4 border-b border-gray-100">
            <button
              className="flex items-center justify-between w-full mb-3"
              onClick={() => setShowDetails(prev => ({ ...prev, challenges: !prev.challenges }))}
            >
              <h4 className="font-semibold text-md flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                今回の課題・弱点
              </h4>
              {showDetails.challenges ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showDetails.challenges && (
              <div className="space-y-3">
                {session.challenges.map(challenge => (
                  <div 
                    key={challenge.id}
                    className={`p-3 rounded-lg border ${getSeverityColor(challenge.severity)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium">{challenge.title}</h5>
                      <span className="text-xs font-semibold uppercase">
                        {challenge.severity}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{challenge.description}</p>
                    {challenge.rootCause && (
                      <div className="text-xs bg-white bg-opacity-50 rounded p-2">
                        <span className="font-medium">根本原因: </span>
                        {challenge.rootCause}
                      </div>
                    )}
                    {challenge.previousAttempts && challenge.previousAttempts > 0 && (
                      <p className="text-xs mt-2 opacity-75">
                        過去の取り組み: {challenge.previousAttempts}回
                      </p>
                    )}
                  </div>
                ))}
                
                {/* 関連する弱点データ */}
                {session.relatedWeaknesses && session.relatedWeaknesses.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      関連する弱点傾向
                    </h5>
                    <div className="space-y-2">
                      {session.relatedWeaknesses.map((weakness, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span>{weakness.topic}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              正答率: {weakness.accuracy}%
                            </span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 transition-all"
                                style={{ width: `${weakness.accuracy}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 目標セクション */}
          <div className="p-4 border-b border-gray-100">
            <button
              className="flex items-center justify-between w-full mb-3"
              onClick={() => setShowDetails(prev => ({ ...prev, objectives: !prev.objectives }))}
            >
              <h4 className="font-semibold text-md flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                達成目標・習得内容
              </h4>
              {showDetails.objectives ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showDetails.objectives && (
              <div className="space-y-3">
                {session.objectives.map(objective => {
                  const achievement = achievements.find(a => a.objectiveId === objective.id)
                  const isAchieved = achievement?.achieved || false
                  
                  return (
                    <div 
                      key={objective.id}
                      className={`
                        p-3 rounded-lg border transition-all
                        ${isAchieved 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-blue-50 border-blue-200'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-yellow-500" />
                          {objective.title}
                        </h5>
                        {!isCompleted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleAchievement(objective.id)
                            }}
                            className="p-1"
                          >
                            {isAchieved ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-400" />
                            )}
                          </button>
                        )}
                      </div>
                      
                      <p className="text-sm mb-3">{objective.description}</p>
                      
                      {/* 達成基準 */}
                      <div className="mb-3">
                        <p className="text-xs font-medium mb-1">達成基準:</p>
                        <ul className="space-y-1">
                          {objective.criteria.map((criterion, idx) => (
                            <li key={idx} className="text-xs flex items-start gap-1">
                              <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
                              <span>{criterion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* 重要ポイント */}
                      {objective.keyPoints.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium mb-1">重要ポイント:</p>
                          <div className="flex flex-wrap gap-1">
                            {objective.keyPoints.map((point, idx) => (
                              <span 
                                key={idx}
                                className="text-xs px-2 py-1 bg-white bg-opacity-60 rounded-full"
                              >
                                {point}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* 期待される成果 */}
                      <div className="text-xs bg-white bg-opacity-50 rounded p-2">
                        <span className="font-medium flex items-center gap-1 mb-1">
                          <Brain className="w-3 h-3" />
                          期待される成果:
                        </span>
                        {objective.expectedOutcome}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 学習教材セクション */}
          <div className="p-4">
            <button
              className="flex items-center justify-between w-full mb-3"
              onClick={() => setShowDetails(prev => ({ ...prev, materials: !prev.materials }))}
            >
              <h4 className="font-semibold text-md flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gray-500" />
                使用教材・参考資料
              </h4>
              {showDetails.materials ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showDetails.materials && (
              <div className="space-y-2">
                {session.materials.map((material, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    <span>{material}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* アクションボタン */}
          {!isCompleted && (
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <button
                onClick={handleComplete}
                disabled={achievements.length === 0}
                className={`
                  w-full py-2 px-4 rounded-lg font-medium transition-all
                  ${achievements.length > 0
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                {achievements.length > 0
                  ? `学習完了（${achievements.filter(a => a.achieved).length}/${session.objectives.length} 目標達成）`
                  : '目標を選択してください'
                }
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}