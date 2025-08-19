'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { startTimerSessionWithContent, updateStudyContent } from '@/lib/firebase/firestore'

interface StudyContentFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (content: StudyContent) => void
  sessionId: string | null
  isUpdate?: boolean
}

interface StudyContent {
  mainTheme: string
  subTopics: string[]
  materials: string[]
  goals: string[]
}

export function StudyContentForm({ 
  open, 
  onClose, 
  onSubmit, 
  sessionId,
  isUpdate = false 
}: StudyContentFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [mainTheme, setMainTheme] = useState('')
  const [currentSubTopic, setCurrentSubTopic] = useState('')
  const [subTopics, setSubTopics] = useState<string[]>([])
  const [currentMaterial, setCurrentMaterial] = useState('')
  const [materials, setMaterials] = useState<string[]>([])
  const [currentGoal, setCurrentGoal] = useState('')
  const [goals, setGoals] = useState<string[]>([])

  // サブトピック追加
  const addSubTopic = () => {
    if (currentSubTopic.trim()) {
      setSubTopics([...subTopics, currentSubTopic.trim()])
      setCurrentSubTopic('')
    }
  }

  // サブトピック削除
  const removeSubTopic = (index: number) => {
    setSubTopics(subTopics.filter((_, i) => i !== index))
  }

  // 教材追加
  const addMaterial = () => {
    if (currentMaterial.trim()) {
      setMaterials([...materials, currentMaterial.trim()])
      setCurrentMaterial('')
    }
  }

  // 教材削除
  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index))
  }

  // 目標追加
  const addGoal = () => {
    if (currentGoal.trim()) {
      setGoals([...goals, currentGoal.trim()])
      setCurrentGoal('')
    }
  }

  // 目標削除
  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index))
  }

  // フォーム送信
  const handleSubmit = async () => {
    if (!mainTheme.trim()) {
      toast({
        title: 'エラー',
        description: 'メインテーマを入力してください',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    
    const content: StudyContent = {
      mainTheme: mainTheme.trim(),
      subTopics,
      materials,
      goals
    }

    try {
      if (isUpdate && sessionId) {
        // 学習中の内容更新
        const result = await updateStudyContent(sessionId, content)
        if (result.success) {
          toast({
            title: '更新完了',
            description: '学習内容を更新しました',
          })
          onSubmit(content)
          handleClose()
        }
      } else {
        // 新規開始時
        onSubmit(content)
        handleClose()
      }
    } catch (error) {
      toast({
        title: 'エラー',
        description: '操作に失敗しました',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // フォームリセット
  const handleClose = () => {
    setMainTheme('')
    setCurrentSubTopic('')
    setSubTopics([])
    setCurrentMaterial('')
    setMaterials([])
    setCurrentGoal('')
    setGoals([])
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isUpdate ? '学習内容の更新' : '学習内容の設定'}
          </DialogTitle>
          <DialogDescription>
            今回の学習内容を記録しましょう
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* メインテーマ */}
          <div className="space-y-2">
            <Label htmlFor="mainTheme">メインテーマ *</Label>
            <Input
              id="mainTheme"
              value={mainTheme}
              onChange={(e) => setMainTheme(e.target.value)}
              placeholder="例：微分積分の基礎"
              className="w-full"
            />
          </div>

          {/* サブトピック */}
          <div className="space-y-2">
            <Label>サブトピック</Label>
            <div className="flex gap-2">
              <Input
                value={currentSubTopic}
                onChange={(e) => setCurrentSubTopic(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubTopic())}
                placeholder="例：極限の概念"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addSubTopic}
                size="icon"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {subTopics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {subTopics.map((topic, index) => (
                  <Badge key={index} variant="secondary" className="pr-1">
                    {topic}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1"
                      onClick={() => removeSubTopic(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 使用教材 */}
          <div className="space-y-2">
            <Label>使用教材</Label>
            <div className="flex gap-2">
              <Input
                value={currentMaterial}
                onChange={(e) => setCurrentMaterial(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                placeholder="例：チャート式数学ⅡB"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addMaterial}
                size="icon"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {materials.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {materials.map((material, index) => (
                  <Badge key={index} variant="secondary" className="pr-1">
                    {material}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1"
                      onClick={() => removeMaterial(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 学習目標 */}
          <div className="space-y-2">
            <Label>学習目標</Label>
            <div className="flex gap-2">
              <Input
                value={currentGoal}
                onChange={(e) => setCurrentGoal(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                placeholder="例：極限の基本的な計算ができるようになる"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addGoal}
                size="icon"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {goals.length > 0 && (
              <div className="space-y-2 mt-2">
                {goals.map((goal, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span className="flex-1">• {goal}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeGoal(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !mainTheme.trim()}
          >
            {loading ? '保存中...' : (isUpdate ? '更新' : '開始')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}