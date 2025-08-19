// components/schedule/StudySettingsDialog.tsx

'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BookOpen,
  Calendar,
  Target,
  Save,
  X,
  Plus,
  Clock,
  School,
  Users,
  AlertCircle
} from 'lucide-react'
import { getUserProfile, updateUserProfile } from '@/lib/firebase/firestore'
import { useAuth } from '@/hooks/use-auth'

interface StudySettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSettingsUpdate?: () => void
}

// 科目定義（前のコードと同じ）
const SUBJECTS = {
  common: {
    name: '共通テスト科目',
    subjects: [
      { id: 'japanese', name: '国語', category: '国語' },
      { id: 'math1a', name: '数学IA', category: '数学' },
      { id: 'math2b', name: '数学IIB', category: '数学' },
      { id: 'english', name: '英語', category: '外国語' },
      { id: 'physics', name: '物理', category: '理科' },
      { id: 'chemistry', name: '化学', category: '理科' },
      { id: 'biology', name: '生物', category: '理科' },
      { id: 'earth_science', name: '地学', category: '理科' },
      { id: 'world_history', name: '世界史B', category: '社会' },
      { id: 'japanese_history', name: '日本史B', category: '社会' },
      { id: 'geography', name: '地理B', category: '社会' },
      { id: 'civics', name: '公民', category: '社会' }
    ]
  },
  secondary: {
    name: '二次試験科目',
    subjects: [
      { id: 'math3', name: '数学III', category: '数学' },
      { id: 'physics_advanced', name: '物理（発展）', category: '理科' },
      { id: 'chemistry_advanced', name: '化学（発展）', category: '理科' }
    ]
  }
}

export default function StudySettingsDialog({
  open,
  onOpenChange,
  onSettingsUpdate
}: StudySettingsDialogProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('subjects')
  
  // 設定の状態
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [timeBlocks, setTimeBlocks] = useState<any[]>([])
  const [studyGoals, setStudyGoals] = useState({
    hoursPerDay: 4,
    daysPerWeek: 6,
    examDate: '',
    targetScore: 65
  })
  
  // 新しい時間ブロック用
  const [newTimeBlock, setNewTimeBlock] = useState({
    type: 'school',
    name: '',
    startTime: '09:00',
    endTime: '16:00',
    days: [] as string[]
  })
  const [showTimeBlockForm, setShowTimeBlockForm] = useState(false)

  useEffect(() => {
    if (open && user) {
      loadSettings()
    }
  }, [open, user])

  const loadSettings = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const profile = await getUserProfile(user.uid)
      if (profile?.studySettings) {
        setSelectedSubjects(profile.studySettings.subjects || [])
        setTimeBlocks(profile.studySettings.timeBlocks || [])
        setStudyGoals(profile.studySettings.studyGoals || {
          hoursPerDay: 4,
          daysPerWeek: 6,
          examDate: '',
          targetScore: 65
        })
      }
    } catch (error) {
      console.error('設定読み込みエラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    
    setIsSaving(true)
    try {
      await updateUserProfile(user.uid, {
        studySettings: {
          subjects: selectedSubjects,
          timeBlocks,
          studyGoals,
          lastUpdated: new Date()
        }
      })
      
      onSettingsUpdate?.()
      onOpenChange(false)
    } catch (error) {
      console.error('設定保存エラー:', error)
      alert('設定の保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    )
  }

  const addTimeBlock = () => {
    if (!newTimeBlock.name || newTimeBlock.days.length === 0) return
    
    const block = {
      id: Date.now().toString(),
      ...newTimeBlock
    }
    
    setTimeBlocks([...timeBlocks, block])
    setNewTimeBlock({
      type: 'school',
      name: '',
      startTime: '09:00',
      endTime: '16:00',
      days: []
    })
    setShowTimeBlockForm(false)
  }

  const removeTimeBlock = (id: string) => {
    setTimeBlocks(timeBlocks.filter(block => block.id !== id))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>学習設定</DialogTitle>
          <DialogDescription>
            受験科目や固定スケジュールを変更できます
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="subjects">受験科目</TabsTrigger>
              <TabsTrigger value="schedule">スケジュール</TabsTrigger>
              <TabsTrigger value="goals">学習目標</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] mt-4">
              <TabsContent value="subjects" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">{SUBJECTS.common.name}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {SUBJECTS.common.subjects.map(subject => (
                        <label
                          key={subject.id}
                          className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                            selectedSubjects.includes(subject.id)
                              ? 'bg-blue-50 border-blue-500'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <Checkbox
                            checked={selectedSubjects.includes(subject.id)}
                            onCheckedChange={() => handleSubjectToggle(subject.id)}
                          />
                          <span className="text-sm">{subject.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">{SUBJECTS.secondary.name}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {SUBJECTS.secondary.subjects.map(subject => (
                        <label
                          key={subject.id}
                          className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                            selectedSubjects.includes(subject.id)
                              ? 'bg-blue-50 border-blue-500'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <Checkbox
                            checked={selectedSubjects.includes(subject.id)}
                            onCheckedChange={() => handleSubjectToggle(subject.id)}
                          />
                          <span className="text-sm">{subject.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm text-gray-600">
                      選択中: <span className="font-bold">{selectedSubjects.length}科目</span>
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <div className="space-y-3">
                  {timeBlocks.map(block => (
                    <div key={block.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            {block.type === 'school' && <School className="h-4 w-4" />}
                            {block.type === 'club' && <Users className="h-4 w-4" />}
                            {block.type === 'cram_school' && <BookOpen className="h-4 w-4" />}
                            {block.type === 'other' && <Clock className="h-4 w-4" />}
                            <span className="font-medium text-sm">{block.name}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {block.startTime} - {block.endTime}
                          </p>
                          <div className="flex gap-1 mt-1">
                            {block.days.map((day: string) => (
                              <Badge key={day} variant="secondary" className="text-xs">
                                {day === 'monday' && '月'}
                                {day === 'tuesday' && '火'}
                                {day === 'wednesday' && '水'}
                                {day === 'thursday' && '木'}
                                {day === 'friday' && '金'}
                                {day === 'saturday' && '土'}
                                {day === 'sunday' && '日'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeBlock(block.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {showTimeBlockForm ? (
                    <div className="p-3 border-2 border-dashed rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm">種類</Label>
                          <Select
                            value={newTimeBlock.type}
                            onValueChange={(value) => setNewTimeBlock({ ...newTimeBlock, type: value })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="school">学校</SelectItem>
                              <SelectItem value="club">部活</SelectItem>
                              <SelectItem value="cram_school">塾・予備校</SelectItem>
                              <SelectItem value="other">その他</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">名称</Label>
                          <Input
                            value={newTimeBlock.name}
                            onChange={(e) => setNewTimeBlock({ ...newTimeBlock, name: e.target.value })}
                            placeholder="例: 高校授業"
                            className="h-9"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm">開始時刻</Label>
                          <Input
                            type="time"
                            value={newTimeBlock.startTime}
                            onChange={(e) => setNewTimeBlock({ ...newTimeBlock, startTime: e.target.value })}
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">終了時刻</Label>
                          <Input
                            type="time"
                            value={newTimeBlock.endTime}
                            onChange={(e) => setNewTimeBlock({ ...newTimeBlock, endTime: e.target.value })}
                            className="h-9"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm">曜日</Label>
                        <div className="flex gap-1 mt-1">
                          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                            <label key={day} className="flex items-center gap-1">
                              <Checkbox
                                checked={newTimeBlock.days.includes(day)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setNewTimeBlock({
                                      ...newTimeBlock,
                                      days: [...newTimeBlock.days, day]
                                    })
                                  } else {
                                    setNewTimeBlock({
                                      ...newTimeBlock,
                                      days: newTimeBlock.days.filter(d => d !== day)
                                    })
                                  }
                                }}
                              />
                              <span className="text-xs">
                                {day === 'monday' && '月'}
                                {day === 'tuesday' && '火'}
                                {day === 'wednesday' && '水'}
                                {day === 'thursday' && '木'}
                                {day === 'friday' && '金'}
                                {day === 'saturday' && '土'}
                                {day === 'sunday' && '日'}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={addTimeBlock} size="sm">
                          追加
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowTimeBlockForm(false)
                            setNewTimeBlock({
                              type: 'school',
                              name: '',
                              startTime: '09:00',
                              endTime: '16:00',
                              days: []
                            })
                          }}
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowTimeBlockForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      固定予定を追加
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="goals" className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>1日の目標学習時間</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          value={studyGoals.hoursPerDay}
                          onChange={(e) => setStudyGoals({
                            ...studyGoals,
                            hoursPerDay: parseInt(e.target.value) || 0
                          })}
                          min="1"
                          max="12"
                          className="w-20 h-9"
                        />
                        <span className="text-sm">時間</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label>週の学習日数</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          type="number"
                          value={studyGoals.daysPerWeek}
                          onChange={(e) => setStudyGoals({
                            ...studyGoals,
                            daysPerWeek: parseInt(e.target.value) || 0
                          })}
                          min="1"
                          max="7"
                          className="w-20 h-9"
                        />
                        <span className="text-sm">日</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>目標試験日</Label>
                      <Input
                        type="date"
                        value={studyGoals.examDate}
                        onChange={(e) => setStudyGoals({
                          ...studyGoals,
                          examDate: e.target.value
                        })}
                        className="h-9"
                      />
                    </div>
                    
                    <div>
                      <Label>目標偏差値</Label>
                      <Input
                        type="number"
                        value={studyGoals.targetScore}
                        onChange={(e) => setStudyGoals({
                          ...studyGoals,
                          targetScore: parseInt(e.target.value) || 0
                        })}
                        min="40"
                        max="80"
                        className="w-20 h-9"
                      />
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-blue-800">
                        目標を変更すると、AIが学習計画を自動で最適化します
                      </span>
                    </p>
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}