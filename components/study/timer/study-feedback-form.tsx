'use client'

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import { endTimerSessionWithFeedback, submitStudyFeedback } from '@/lib/firebase/firestore'
import { 
  Sparkles, CheckCircle, Target, Brain, Heart, Plus, X, 
  TrendingUp, AlertCircle, BookOpen, Clock, Trophy, Zap
} from 'lucide-react'

interface StudyFeedbackFormProps {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  sessionId: string | null
  elapsedTime: number
}

interface Feedback {
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

const predefinedTags = [
  { id: 'focused', label: '集中できた', icon: '🎯' },
  { id: 'time-short', label: '時間不足', icon: '⏰' },
  { id: 'difficult', label: '難しかった', icon: '😅' },
  { id: 'fun', label: '楽しかった', icon: '😊' },
  { id: 'tired', label: '疲れた', icon: '😴' },
  { id: 'understood', label: '理解深まった', icon: '💡' },
  { id: 'review-needed', label: '復習必要', icon: '📚' },
  { id: 'challenge', label: '応用挑戦', icon: '🚀' },
  { id: 'practice-more', label: '練習必要', icon: '✏️' },
  { id: 'basic-review', label: '基礎見直し', icon: '🔍' }
]

const predefinedGoals = [
  { id: 'basic', label: '基本概念の理解', icon: '📖' },
  { id: 'practice', label: '問題演習の完了', icon: '✅' },
  { id: 'advanced', label: '応用問題への挑戦', icon: '🎯' },
  { id: 'notes', label: 'ノートの整理', icon: '📝' },
  { id: 'memorize', label: '重要ポイントの暗記', icon: '🧠' },
  { id: 'past-exam', label: '過去問の確認', icon: '📋' }
]

export function StudyFeedbackForm({ 
  open, 
  onClose, 
  onSubmit,
  sessionId,
  elapsedTime 
}: StudyFeedbackFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentSection, setCurrentSection] = useState(0)
  
  const [achievement, setAchievement] = useState([5])
  const [understanding, setUnderstanding] = useState([5])
  const [difficulty, setDifficulty] = useState([5])
  const [satisfaction, setSatisfaction] = useState([5])
  
  const [achievedGoals, setAchievedGoals] = useState<string[]>([])
  const [customGoal, setCustomGoal] = useState('')
  
  const [struggles, setStruggles] = useState<string[]>([])
  const [currentStruggle, setCurrentStruggle] = useState('')
  
  const [nextTasks, setNextTasks] = useState<string[]>([])
  const [currentTask, setCurrentTask] = useState('')
  
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [comment, setComment] = useState('')

  // セクション管理
  const sections = [
    { id: 'rating', title: '学習の評価', icon: <TrendingUp size={20} /> },
    { id: 'goals', title: '達成した目標', icon: <CheckCircle size={20} /> },
    { id: 'struggles', title: '振り返り', icon: <Brain size={20} /> },
    { id: 'tags', title: 'タグ・メモ', icon: <Heart size={20} /> }
  ]

  // 達成目標の切り替え
  const toggleGoal = (goalId: string) => {
    setAchievedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    )
  }

  // カスタム目標の追加
  const addCustomGoal = () => {
    if (customGoal.trim() && !achievedGoals.includes(customGoal.trim())) {
      setAchievedGoals([...achievedGoals, customGoal.trim()])
      setCustomGoal('')
    }
  }

  // 苦戦ポイント追加
  const addStruggle = () => {
    if (currentStruggle.trim()) {
      setStruggles([...struggles, currentStruggle.trim()])
      setCurrentStruggle('')
    }
  }

  // 苦戦ポイント削除
  const removeStruggle = (index: number) => {
    setStruggles(struggles.filter((_, i) => i !== index))
  }

  // 次回課題追加
  const addNextTask = () => {
    if (currentTask.trim()) {
      setNextTasks([...nextTasks, currentTask.trim()])
      setCurrentTask('')
    }
  }

  // 次回課題削除
  const removeNextTask = (index: number) => {
    setNextTasks(nextTasks.filter((_, i) => i !== index))
  }

  // タグの切り替え
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    )
  }

  // 時間のフォーマット
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`
  }

  // セクション進む/戻る
  const nextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1)
    }
  }

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    }
  }

  // フォーム送信
  const handleSubmit = async () => {
    setLoading(true)

    const feedback: Feedback = {
      achievement: achievement[0],
      understanding: understanding[0],
      difficulty: difficulty[0],
      satisfaction: satisfaction[0],
      achievedGoals,
      struggles,
      nextTasks,
      tags: selectedTags,
      comment
    }

    try {
      if (sessionId) {
        const result = await endTimerSessionWithFeedback(
          sessionId, 
          elapsedTime,
          feedback
        )
        
        if (result.success) {
          toast({
            title: '学習記録完了',
            description: `${formatTime(elapsedTime)}の学習を記録しました`,
          })
          onSubmit()
          handleClose()
        }
      }
    } catch (error) {
      toast({
        title: 'エラー',
        description: '学習記録の保存に失敗しました',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // フォームリセット
  const handleClose = () => {
    setCurrentSection(0)
    setAchievement([5])
    setUnderstanding([5])
    setDifficulty([5])
    setSatisfaction([5])
    setAchievedGoals([])
    setCustomGoal('')
    setStruggles([])
    setCurrentStruggle('')
    setNextTasks([])
    setCurrentTask('')
    setSelectedTags([])
    setComment('')
    onClose()
  }

  // 評価の取得
  const getRatingEmoji = (value: number) => {
    if (value <= 3) return '😔'
    if (value <= 5) return '😐'
    if (value <= 7) return '😊'
    return '🎉'
  }

  const getRatingColor = (value: number) => {
    if (value <= 3) return '#ef4444'
    if (value <= 5) return '#f59e0b'
    if (value <= 7) return '#10b981'
    return '#8b5cf6'
  }

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 640)
    }
    
    checkMobile()
    window.addEventListener("resize", checkMobile)
    
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return (
    <>
      <style jsx global>{`
        .feedback-dialog-content {
          max-width: ${isMobile ? '90%' : '420px'};
          width: ${isMobile ? '90%' : 'auto'};
          height: ${isMobile ? 'auto' : 'auto'};
          max-height: ${isMobile ? '85vh' : '60vh'};
          margin: ${isMobile ? '2vh auto' : '6rem auto 2rem'};
          padding: 0;
          border-radius: ${isMobile ? '12px' : '16px'};
          overflow: hidden;
          z-index: 50;
          transform: ${isMobile ? 'none' : 'scale(1)'};
          box-shadow: ${isMobile ? '0 4px 20px rgba(0, 0, 0, 0.15)' : '0 10px 40px rgba(0, 0, 0, 0.15)'};
        }

        .feedback-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: ${isMobile ? '10px' : '18px'};
          text-align: center;
          position: relative;
        }

        .feedback-time {
          display: inline-flex;
          align-items: center;
          gap: ${isMobile ? '3px' : '4px'};
          background: rgba(255, 255, 255, 0.2);
          padding: ${isMobile ? '3px 8px' : '4px 10px'};
          border-radius: ${isMobile ? '12px' : '16px'};
          font-size: ${isMobile ? '11px' : '14px'};
          font-weight: 600;
          margin-bottom: ${isMobile ? '4px' : '6px'};
        }

        .feedback-title {
          font-size: ${isMobile ? '18px' : '22px'};
          font-weight: 700;
          margin-bottom: ${isMobile ? '2px' : '3px'};
        }

        .feedback-subtitle {
          font-size: ${isMobile ? '12px' : '14px'};
          opacity: 0.9;
        }

        .section-indicator {
          display: flex;
          justify-content: center;
          gap: ${isMobile ? '6px' : '8px'};
          margin-top: ${isMobile ? '12px' : '16px'};
        }

        .indicator-dot {
          width: ${isMobile ? '6px' : '8px'};
          height: ${isMobile ? '6px' : '8px'};
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
        }

        .indicator-dot.active {
          width: ${isMobile ? '20px' : '24px'};
          border-radius: ${isMobile ? '3px' : '4px'};
          background: white;
        }

        .feedback-body {
          padding: ${isMobile ? '12px 10px 20px' : '24px'};
          height: auto;
          max-height: ${isMobile ? 'calc(90vh - 160px)' : 'calc(85vh - 180px)'};
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: ${isMobile ? '6px' : '12px'};
          margin-bottom: ${isMobile ? '12px' : '24px'};
        }

        .section-icon {
          width: ${isMobile ? '28px' : '40px'};
          height: ${isMobile ? '28px' : '40px'};
          background: #f3f4f6;
          border-radius: ${isMobile ? '6px' : '12px'};
          display: flex;
          align-items: center;
          justify-content: center;
          color: #667eea;
        }

        .section-icon svg {
          width: ${isMobile ? '16px' : '20px'};
          height: ${isMobile ? '16px' : '20px'};
        }

        .section-title {
          font-size: ${isMobile ? '14px' : '20px'};
          font-weight: 600;
          color: #1f2937;
        }

        .rating-grid {
          display: grid;
          grid-template-columns: ${isMobile ? '1fr' : 'repeat(2, 1fr)'};
          gap: ${isMobile ? '10px' : '20px'};
          margin-bottom: ${isMobile ? '12px' : '0'};
        }

        .rating-item {
          background: #f9fafb;
          border-radius: ${isMobile ? '10px' : '16px'};
          padding: ${isMobile ? '10px' : '18px'};
          position: relative;
          overflow: hidden;
        }

        .rating-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: ${isMobile ? '6px' : '12px'};
        }

        .rating-label {
          font-size: ${isMobile ? '12px' : '16px'};
          font-weight: 600;
          color: #374151;
        }

        .rating-value {
          display: flex;
          align-items: center;
          gap: ${isMobile ? '3px' : '6px'};
          font-size: ${isMobile ? '14px' : '20px'};
          font-weight: 700;
        }

        .rating-emoji {
          font-size: ${isMobile ? '16px' : '24px'};
        }

        .slider-wrapper {
          position: relative;
          padding: ${isMobile ? '4px 0' : '8px 0'};
        }

        /* Sliderのカスタムスタイル */
        .slider-wrapper [data-orientation="horizontal"] {
          height: ${isMobile ? '3px' : '6px'};
          background: #e5e7eb;
          border-radius: ${isMobile ? '1.5px' : '3px'};
          position: relative;
        }

        .slider-wrapper [data-orientation="horizontal"] > span:first-child {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          height: 100%;
          border-radius: ${isMobile ? '1.5px' : '3px'};
        }

        .slider-wrapper [role="slider"] {
          width: ${isMobile ? '14px' : '20px'};
          height: ${isMobile ? '14px' : '20px'};
          background: white;
          border: ${isMobile ? '2px' : '3px'} solid #667eea;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          cursor: grab;
        }

        .slider-wrapper [role="slider"]:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .slider-wrapper [role="slider"]:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
        }

        .slider-wrapper [role="slider"]:active {
          cursor: grabbing;
          transform: scale(0.95);
        }

        .goal-grid {
          display: grid;
          gap: ${isMobile ? '8px' : '12px'};
        }

        .goal-item {
          display: flex;
          align-items: center;
          gap: ${isMobile ? '8px' : '12px'};
          padding: ${isMobile ? '10px' : '16px'};
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: ${isMobile ? '10px' : '12px'};
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .goal-item.selected {
          border-color: #667eea;
          background: #f3f4ff;
        }

        .goal-icon {
          font-size: ${isMobile ? '18px' : '24px'};
        }

        .goal-text {
          flex: 1;
          font-size: ${isMobile ? '13px' : '15px'};
          font-weight: 500;
          color: #374151;
        }

        .goal-checkbox {
          width: ${isMobile ? '18px' : '20px'};
          height: ${isMobile ? '18px' : '20px'};
        }

        .custom-input-wrapper {
          display: flex;
          gap: ${isMobile ? '6px' : '8px'};
          margin-top: ${isMobile ? '12px' : '16px'};
        }

        .custom-input {
          flex: 1;
          padding: ${isMobile ? '8px 12px' : '12px 16px'};
          border: 2px solid #e5e7eb;
          border-radius: ${isMobile ? '8px' : '10px'};
          font-size: ${isMobile ? '13px' : '15px'};
          outline: none;
          transition: border-color 0.2s ease;
        }

        .custom-input:focus {
          border-color: #667eea;
        }

        .add-button {
          padding: ${isMobile ? '8px 14px' : '12px 20px'};
          background: #667eea;
          color: white;
          border: none;
          border-radius: ${isMobile ? '8px' : '10px'};
          font-size: ${isMobile ? '13px' : '15px'};
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: ${isMobile ? '3px' : '4px'};
        }

        .add-button svg {
          width: ${isMobile ? '14px' : '16px'};
          height: ${isMobile ? '14px' : '16px'};
        }

        .add-button:hover {
          background: #5a67d8;
          transform: translateY(-1px);
        }

        .list-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
        }

        .list-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: ${isMobile ? '10px 12px' : '12px 16px'};
          background: #f3f4f6;
          border-radius: 10px;
          font-size: ${isMobile ? '13px' : '14px'};
          color: #374151;
        }

        .list-item-text {
          flex: 1;
        }

        .remove-button {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #e5e7eb;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .remove-button:hover {
          background: #dc2626;
          color: white;
        }

        .tag-grid {
          display: flex;
          flex-wrap: wrap;
          gap: ${isMobile ? '6px' : '10px'};
          max-height: ${isMobile ? '100px' : 'none'};
          overflow-y: ${isMobile ? 'auto' : 'visible'};
          -webkit-overflow-scrolling: touch;
          padding: ${isMobile ? '2px' : '0'};
        }

        .tag-button {
          display: flex;
          align-items: center;
          gap: ${isMobile ? '4px' : '6px'};
          padding: ${isMobile ? '6px 12px' : '10px 16px'};
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: ${isMobile ? '16px' : '20px'};
          font-size: ${isMobile ? '12px' : '14px'};
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tag-button.selected {
          border-color: #667eea;
          background: #f3f4ff;
          color: #667eea;
        }

        .tag-emoji {
          font-size: ${isMobile ? '14px' : '16px'};
        }

        .comment-textarea {
          width: 100%;
          min-height: ${isMobile ? '50px' : '120px'};
          max-height: ${isMobile ? '80px' : '200px'};
          padding: ${isMobile ? '8px' : '16px'};
          border: 2px solid #e5e7eb;
          border-radius: ${isMobile ? '10px' : '12px'};
          font-size: ${isMobile ? '12px' : '15px'};
          resize: vertical;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .mobile-submit-button {
          width: 100%;
          margin-top: 16px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 3px 10px rgba(102, 126, 234, 0.25);
        }

        .mobile-submit-button svg {
          width: 14px;
          height: 14px;
        }

        .mobile-submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.35);
        }

        .mobile-submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .comment-textarea:focus {
          border-color: #667eea;
        }

        .feedback-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: ${isMobile ? '12px' : '16px 24px'};
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }

        .navigation-buttons {
          display: flex;
          gap: ${isMobile ? '6px' : '8px'};
        }

        .nav-button {
          padding: ${isMobile ? '6px 12px' : '10px 20px'};
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: ${isMobile ? '8px' : '10px'};
          font-size: ${isMobile ? '13px' : '15px'};
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .nav-button:hover:not(:disabled) {
          border-color: #667eea;
          color: #667eea;
        }

        .nav-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .submit-button {
          padding: ${isMobile ? '10px 24px' : '12px 32px'};
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: ${isMobile ? '14px' : '16px'};
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .submit-button:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .mobile-next-button {
          width: 100%;
          margin-top: 16px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 3px 10px rgba(102, 126, 234, 0.25);
        }

        .mobile-next-button svg {
          width: 14px;
          height: 14px;
        }

        .mobile-next-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.35);
        }

        .mobile-next-button:active {
          transform: translateY(0);
        }

        @media (max-width: 640px) {
          .feedback-dialog-content {
            border-radius: 0;
          }
        }
      `}</style>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent 
          className="feedback-dialog-content"
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            maxWidth: isMobile ? "90%" : "420px",
            width: isMobile ? "90%" : "420px",
            maxHeight: isMobile ? "90vh" : "85vh",
            margin: 0,
            zIndex: 9999
          }}
        >          <VisuallyHidden>
            <DialogHeader>
              <DialogTitle>学習フィードバック</DialogTitle>
              <DialogDescription>
                今回の学習を振り返り、達成度や理解度を記録してください
              </DialogDescription>
            </DialogHeader>
          </VisuallyHidden>
          
          <div className="feedback-header">
            <div className="feedback-time">
              <Clock size={14} />
              {formatTime(elapsedTime)}
            </div>
            <h2 className="feedback-title">お疲れさまでした！</h2>
            <p className="feedback-subtitle">今回の学習を振り返りましょう</p>
            
            <div className="section-indicator">
              {sections.map((_, index) => (
                <div
                  key={index}
                  className={`indicator-dot ${index === currentSection ? 'active' : ''}`}
                />
              ))}
            </div>
          </div>

          <div className="feedback-body">
            {/* セクション1: 評価 */}
            {currentSection === 0 && (
              <div>
                <div className="section-header">
                  <div className="section-icon">
                    <TrendingUp size={isMobile ? 16 : 20} />
                  </div>
                  <h3 className="section-title">{sections[0].title}</h3>
                </div>

                <div className="rating-grid">
                  <div className="rating-item">
                    <div className="rating-header">
                      <span className="rating-label">達成度</span>
                      <div className="rating-value" style={{ color: getRatingColor(achievement[0]) }}>
                        <span>{achievement[0]}/10</span>
                        <span className="rating-emoji">{getRatingEmoji(achievement[0])}</span>
                      </div>
                    </div>
                    <div className="slider-wrapper">
                      <Slider
                        value={achievement}
                        onValueChange={setAchievement}
                        min={1}
                        max={10}
                        step={1}
                      />
                    </div>
                  </div>

                  <div className="rating-item">
                    <div className="rating-header">
                      <span className="rating-label">理解度</span>
                      <div className="rating-value" style={{ color: getRatingColor(understanding[0]) }}>
                        <span>{understanding[0]}/10</span>
                        <span className="rating-emoji">{getRatingEmoji(understanding[0])}</span>
                      </div>
                    </div>
                    <div className="slider-wrapper">
                      <Slider
                        value={understanding}
                        onValueChange={setUnderstanding}
                        min={1}
                        max={10}
                        step={1}
                      />
                    </div>
                  </div>

                  <div className="rating-item">
                    <div className="rating-header">
                      <span className="rating-label">難易度</span>
                      <div className="rating-value" style={{ color: getRatingColor(10 - difficulty[0]) }}>
                        <span>{difficulty[0]}/10</span>
                        <span className="rating-emoji">{difficulty[0] <= 3 ? '😊' : difficulty[0] <= 7 ? '😐' : '😅'}</span>
                      </div>
                    </div>
                    <div className="slider-wrapper">
                      <Slider
                        value={difficulty}
                        onValueChange={setDifficulty}
                        min={1}
                        max={10}
                        step={1}
                      />
                    </div>
                  </div>

                  <div className="rating-item">
                    <div className="rating-header">
                      <span className="rating-label">満足度</span>
                      <div className="rating-value" style={{ color: getRatingColor(satisfaction[0]) }}>
                        <span>{satisfaction[0]}/10</span>
                        <span className="rating-emoji">{getRatingEmoji(satisfaction[0])}</span>
                      </div>
                    </div>
                    <div className="slider-wrapper">
                      <Slider
                        value={satisfaction}
                        onValueChange={setSatisfaction}
                        min={1}
                        max={10}
                        step={1}
                      />
                    </div>
                  </div>
                </div>

                {/* モバイル版では評価セクション内に次へボタンを表示 */}
                {isMobile && (
                  <button
                    type="button"
                    className="mobile-next-button"
                    onClick={nextSection}
                  >
                    次へ進む
                    <Sparkles size={14} />
                  </button>
                )}
              </div>
            )}

            {/* セクション2: 達成した目標 */}
            {currentSection === 1 && (
              <div>
                <div className="section-header">
                  <div className="section-icon">
                    <CheckCircle size={isMobile ? 16 : 20} />
                  </div>
                  <h3 className="section-title">{sections[1].title}</h3>
                </div>

                <div className="goal-grid">
                  {predefinedGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className={`goal-item ${achievedGoals.includes(goal.id) ? 'selected' : ''}`}
                      onClick={() => toggleGoal(goal.id)}
                    >
                      <span className="goal-icon">{goal.icon}</span>
                      <span className="goal-text">{goal.label}</span>
                      <Checkbox
                        checked={achievedGoals.includes(goal.id)}
                        onCheckedChange={() => {}}
                        onClick={(e) => e.stopPropagation()}
                        className="goal-checkbox"
                      />
                    </div>
                  ))}
                </div>

                <div className="custom-input-wrapper">
                  <input
                    type="text"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomGoal())}
                    placeholder="その他の達成目標"
                    className="custom-input"
                  />
                  <button type="button" onClick={addCustomGoal} className="add-button">
                    <Plus size={14} />
                    {!isMobile && '追加'}
                  </button>
                </div>

                {achievedGoals.filter(g => !predefinedGoals.find(pg => pg.id === g)).length > 0 && (
                  <div className="list-items">
                    {achievedGoals
                      .filter(g => !predefinedGoals.find(pg => pg.id === g))
                      .map((goal, i) => (
                        <div key={i} className="list-item">
                          <span className="list-item-text">✓ {goal}</span>
                        </div>
                      ))}
                  </div>
                )}

                {/* モバイル版では目標セクション内に次へボタンを表示 */}
                {isMobile && (
                  <button
                    type="button"
                    className="mobile-next-button"
                    onClick={nextSection}
                  >
                    次へ進む
                    <Sparkles size={14} />
                  </button>
                )}
              </div>
            )}

            {/* セクション3: 振り返り */}
            {currentSection === 2 && (
              <div>
                <div className="section-header">
                  <div className="section-icon">
                    <Brain size={isMobile ? 16 : 20} />
                  </div>
                  <h3 className="section-title">{sections[2].title}</h3>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
                    😅 苦戦したポイント
                  </h4>
                  <div className="custom-input-wrapper">
                    <input
                      type="text"
                      value={currentStruggle}
                      onChange={(e) => setCurrentStruggle(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStruggle())}
                      placeholder="例：極限の収束条件の理解"
                      className="custom-input"
                    />
                    <button type="button" onClick={addStruggle} className="add-button">
                      <Plus size={14} />
                    </button>
                  </div>
                  {struggles.length > 0 && (
                    <div className="list-items">
                      {struggles.map((struggle, i) => (
                        <div key={i} className="list-item">
                          <span className="list-item-text">{struggle}</span>
                          <button
                            type="button"
                            onClick={() => removeStruggle(i)}
                            className="remove-button"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 style={{ fontSize: isMobile ? '15px' : '16px', fontWeight: 600, marginBottom: '12px', color: '#374151' }}>
                    📋 次回の課題
                  </h4>
                  <div className="custom-input-wrapper">
                    <input
                      type="text"
                      value={currentTask}
                      onChange={(e) => setCurrentTask(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNextTask())}
                      placeholder="例：練習問題10問を解く"
                      className="custom-input"
                    />
                    <button type="button" onClick={addNextTask} className="add-button">
                      <Plus size={14} />
                    </button>
                  </div>
                  {nextTasks.length > 0 && (
                    <div className="list-items">
                      {nextTasks.map((task, i) => (
                        <div key={i} className="list-item">
                          <span className="list-item-text">{task}</span>
                          <button
                            type="button"
                            onClick={() => removeNextTask(i)}
                            className="remove-button"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* モバイル版では振り返りセクション内に次へボタンを表示 */}
                {isMobile && (
                  <button
                    type="button"
                    className="mobile-next-button"
                    onClick={nextSection}
                  >
                    次へ進む
                    <Sparkles size={14} />
                  </button>
                )}
              </div>
            )}

            {/* セクション4: タグ・メモ */}
            {currentSection === 3 && (
              <div>
                <div className="section-header">
                  <div className="section-icon">
                    <Heart size={isMobile ? 16 : 20} />
                  </div>
                  <h3 className="section-title">{sections[3].title}</h3>
                </div>

                <div style={{ marginBottom: isMobile ? '12px' : '24px' }}>
                  <h4 style={{ fontSize: isMobile ? '13px' : '16px', fontWeight: 600, marginBottom: isMobile ? '8px' : '12px', color: '#374151' }}>
                    今回の学習タグ
                  </h4>
                  <div className="tag-grid">
                    {predefinedTags.map((tag) => (
                      <button
                        key={tag.id}
                        className={`tag-button ${selectedTags.includes(tag.id) ? 'selected' : ''}`}
                        onClick={() => toggleTag(tag.id)}
                      >
                        <span className="tag-emoji">{tag.icon}</span>
                        <span>{tag.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: isMobile ? '16px' : '0' }}>
                  <h4 style={{ fontSize: isMobile ? '13px' : '16px', fontWeight: 600, marginBottom: isMobile ? '8px' : '12px', color: '#374151' }}>
                    感想・メモ
                  </h4>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="今回の学習で感じたことや、次回に向けてのメモなど"
                    className="comment-textarea"
                  />
                </div>

                {/* モバイル版では最終セクション内に完了ボタンを表示 */}
                {isMobile && (
                  <button
                    type="button"
                    className="mobile-submit-button"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? '保存中...' : '学習を終了'}
                    <Trophy size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="feedback-footer">
            <div className="navigation-buttons">
              <button
                type="button"
                className="nav-button"
                onClick={prevSection}
                disabled={currentSection === 0}
              >
                戻る
              </button>
              <button
                type="button"
                className="nav-button"
                onClick={handleClose}
              >
                キャンセル
              </button>
            </div>

            {currentSection < sections.length - 1 ? (
              <button
                type="button"
                className="submit-button"
                onClick={nextSection}
              >
                次へ
                <Sparkles size={16} />
              </button>
            ) : (
              !isMobile && (
                <button
                  type="button"
                  className="submit-button"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? '保存中...' : '学習を終了'}
                  <Trophy size={16} />
                </button>
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}