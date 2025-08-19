'use client'

import { useState, useCallback } from 'react'
import { Search, MapPin, TrendingUp, BookOpen, Star, GripVertical, Info } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface University {
  id: string
  name: string
  faculty: string
  department: string
  deviation: number
  competitionRate: number
  location: string
  requiredSubjects: string[]
  examTopics: {
    subject: string
    topics: string[]
    weight: number
  }[]
  passingScore: {
    total: number
    subjects: Record<string, number>
  }
}

interface Aspiration {
  id: string
  university: University
  priority: number
  selected: boolean
}

// Sortable Item Component
function SortableAspirationCard({ aspiration, onSelect, onViewDetails }: {
  aspiration: Aspiration
  onSelect: (id: string) => void
  onViewDetails: (university: University) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: aspiration.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'z-50' : 'z-0'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className={`${aspiration.selected ? 'border-blue-500 bg-blue-50' : ''} hover:shadow-lg transition-all`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div
              {...attributes}
              {...listeners}
              className="mt-1 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    🏫 {aspiration.university.name}
                    {aspiration.priority === 1 && (
                      <Badge variant="default" className="bg-yellow-500">第1志望</Badge>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {aspiration.university.faculty} {aspiration.university.department}
                  </p>
                </div>
                <Badge variant="outline">
                  第{aspiration.priority}志望
                </Badge>
              </div>
              
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">偏差値</span>
                  <p className="font-medium">{aspiration.university.deviation}</p>
                </div>
                <div>
                  <span className="text-gray-500">倍率</span>
                  <p className="font-medium">{aspiration.university.competitionRate}</p>
                </div>
                <div>
                  <span className="text-gray-500">必要科目</span>
                  <p className="font-medium">{aspiration.university.requiredSubjects.length}科目</p>
                </div>
                <div>
                  <span className="text-gray-500">場所</span>
                  <p className="font-medium">{aspiration.university.location}</p>
                </div>
              </div>
              
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant={aspiration.priority === 1 ? 'default' : 'outline'}
                  onClick={() => onSelect(aspiration.id)}
                  disabled={aspiration.priority === 1}
                >
                  {aspiration.priority === 1 ? '第1志望に設定済み' : '第1志望に設定'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onViewDetails(aspiration.university)}
                >
                  詳細
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function AspirationSelector() {
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('all')
  const [deviationRange, setDeviationRange] = useState([50, 70])
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null)
  
  const [aspirations, setAspirations] = useState<Aspiration[]>([
    {
      id: '1',
      priority: 1,
      selected: true,
      university: {
        id: 'u1',
        name: '東京大学',
        faculty: '理学部',
        department: '物理学科',
        deviation: 70,
        competitionRate: 3.0,
        location: '東京都',
        requiredSubjects: ['数学', '英語', '物理', '化学'],
        examTopics: [
          { subject: '数学', topics: ['微分積分', 'ベクトル', '確率'], weight: 30 },
          { subject: '英語', topics: ['長文読解', '文法', 'リスニング'], weight: 25 },
          { subject: '物理', topics: ['力学', '電磁気', '波動'], weight: 25 },
          { subject: '化学', topics: ['有機化学', '無機化学', '理論化学'], weight: 20 }
        ],
        passingScore: {
          total: 350,
          subjects: { 数学: 90, 英語: 85, 物理: 90, 化学: 85 }
        }
      }
    },
    {
      id: '2',
      priority: 2,
      selected: true,
      university: {
        id: 'u2',
        name: '京都大学',
        faculty: '工学部',
        department: '情報学科',
        deviation: 68,
        competitionRate: 2.8,
        location: '京都府',
        requiredSubjects: ['数学', '英語', '物理', '化学'],
        examTopics: [
          { subject: '数学', topics: ['線形代数', '解析', '離散数学'], weight: 35 },
          { subject: '英語', topics: ['技術英語', '論文読解'], weight: 20 },
          { subject: '物理', topics: ['量子力学', '統計力学'], weight: 25 },
          { subject: '化学', topics: ['物理化学', '材料化学'], weight: 20 }
        ],
        passingScore: {
          total: 340,
          subjects: { 数学: 95, 英語: 80, 物理: 85, 化学: 80 }
        }
      }
    }
  ])

  const [availableUniversities] = useState<University[]>([
    {
      id: 'u3',
      name: '東京工業大学',
      faculty: '理学院',
      department: '数学系',
      deviation: 65,
      competitionRate: 2.5,
      location: '東京都',
      requiredSubjects: ['数学', '英語', '物理'],
      examTopics: [
        { subject: '数学', topics: ['解析学', '代数学', '幾何学'], weight: 40 },
        { subject: '英語', topics: ['学術英語', 'プレゼンテーション'], weight: 20 },
        { subject: '物理', topics: ['理論物理', '数理物理'], weight: 40 }
      ],
      passingScore: {
        total: 320,
        subjects: { 数学: 100, 英語: 70, 物理: 90 }
      }
    }
  ])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setAspirations((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over?.id)
        
        const newItems = arrayMove(items, oldIndex, newIndex)
        return newItems.map((item, index) => ({
          ...item,
          priority: index + 1
        }))
      })
    }
  }

  const handleSelectAsFirst = (id: string) => {
    setAspirations(prev => {
      const selected = prev.find(a => a.id === id)
      if (!selected) return prev
      
      const others = prev.filter(a => a.id !== id)
      return [
        { ...selected, priority: 1 },
        ...others.map((a, index) => ({ ...a, priority: index + 2 }))
      ]
    })
  }

  const filteredUniversities = availableUniversities.filter(uni => {
    const matchesSearch = uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         uni.faculty.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLocation = locationFilter === 'all' || uni.location === locationFilter
    const matchesDeviation = uni.deviation >= deviationRange[0] && uni.deviation <= deviationRange[1]
    
    return matchesSearch && matchesLocation && matchesDeviation
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>志望校選択</CardTitle>
          <CardDescription>
            志望校をドラッグ&ドロップで並び替えて優先順位を設定できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={aspirations.map(a => a.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                <AnimatePresence>
                  {aspirations.map((aspiration) => (
                    <SortableAspirationCard
                      key={aspiration.id}
                      aspiration={aspiration}
                      onSelect={handleSelectAsFirst}
                      onViewDetails={setSelectedUniversity}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>志望校を追加</CardTitle>
          <CardDescription>条件を指定して志望校を検索できます</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">大学名・学部名で検索</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="東京大学、工学部など"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-48">
              <Label htmlFor="location">地域</Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger id="location" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="東京都">東京都</SelectItem>
                  <SelectItem value="京都府">京都府</SelectItem>
                  <SelectItem value="大阪府">大阪府</SelectItem>
                  <SelectItem value="愛知県">愛知県</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>偏差値帯: {deviationRange[0]} - {deviationRange[1]}</Label>
            <Slider
              value={deviationRange}
              onValueChange={setDeviationRange}
              min={40}
              max={80}
              step={1}
              className="mt-2"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUniversities.map(uni => (
              <Card key={uni.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <h4 className="font-semibold">{uni.name}</h4>
                  <p className="text-sm text-gray-600">{uni.faculty} {uni.department}</p>
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span>偏差値: {uni.deviation}</span>
                    <span>倍率: {uni.competitionRate}</span>
                  </div>
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => {
                      const newAspiration: Aspiration = {
                        id: Date.now().toString(),
                        university: uni,
                        priority: aspirations.length + 1,
                        selected: false
                      }
                      setAspirations([...aspirations, newAspiration])
                    }}
                  >
                    志望校に追加
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedUniversity} onOpenChange={() => setSelectedUniversity(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedUniversity && `${selectedUniversity.name} ${selectedUniversity.faculty}`}
            </DialogTitle>
            <DialogDescription>
              出題傾向と対策情報
            </DialogDescription>
          </DialogHeader>
          
          {selectedUniversity && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    基本情報
                  </h4>
                  <div className="text-sm space-y-1">
                    <p>場所: {selectedUniversity.location}</p>
                    <p>偏差値: {selectedUniversity.deviation}</p>
                    <p>倍率: {selectedUniversity.competitionRate}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    合格目安スコア
                  </h4>
                  <div className="text-sm space-y-1">
                    <p>合計: {selectedUniversity.passingScore.total}点</p>
                    {Object.entries(selectedUniversity.passingScore.subjects).map(([subject, score]) => (
                      <p key={subject}>{subject}: {score}点</p>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4" />
                  出題傾向と重要トピック
                </h4>
                <Tabs defaultValue={selectedUniversity.examTopics[0]?.subject}>
                  <TabsList className="grid grid-cols-4 w-full">
                    {selectedUniversity.examTopics.map(topic => (
                      <TabsTrigger key={topic.subject} value={topic.subject}>
                        {topic.subject}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {selectedUniversity.examTopics.map(topic => (
                    <TabsContent key={topic.subject} value={topic.subject} className="mt-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">配点比重</span>
                          <Badge>{topic.weight}%</Badge>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">重要トピック:</p>
                          <div className="flex flex-wrap gap-2">
                            {topic.topics.map(t => (
                              <Badge key={t} variant="secondary">{t}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  この情報は過去の出題傾向に基づいています。最新の情報は大学の公式サイトで確認してください。
                </AlertDescription>
              </Alert>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}