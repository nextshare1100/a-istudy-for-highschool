// preview/page.tsx に追加する内容

// インポートに追加
import ProblemCanvas from '@/components/problem/ProblemCanvas'
import { Palette, Edit3 } from 'lucide-react'

// PreviewData インターフェースを更新
interface PreviewData {
  subject: string
  grade: number
  difficulty: 'easy' | 'normal' | 'hard'
  topic: string
  problemType: 'multiple-choice' | 'descriptive'
  question: string
  explanation: string
  answer?: string
  choices?: string[]
  correctAnswer?: string
  canvasData?: {
    type: 'function' | 'geometry' | 'vector' | 'statistics' | 'coordinate'
    data: any
    width?: number
    height?: number
    interactive?: boolean
  }
  metadata?: {
    subjectCategory: string
    targetDeviationValue?: number
    difficultyLevel?: string
    difficultyMode?: string
    isAIGenerated?: boolean
  }
}

// state に追加
const [isEditingCanvas, setIsEditingCanvas] = useState(false)
const [editedCanvasData, setEditedCanvasData] = useState<any>(null)

// 問題文の後、回答エリアの前に Canvas 表示を追加
{/* Canvas表示 */}
{problemData.canvasData && (
  <div className="card-custom mb-6 fade-in" style={{animationDelay: '0.15s'}}>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Palette className="text-purple-500" size={20} />
        図形・グラフ
      </h3>
      {!submitted && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditingCanvas(!isEditingCanvas)}
          className="flex items-center gap-2"
        >
          <Edit3 size={14} />
          {isEditingCanvas ? '完了' : '編集'}
        </Button>
      )}
    </div>
    
    <div className="bg-gray-50 p-4 rounded-lg">
      <ProblemCanvas
        canvasData={{
          ...problemData.canvasData,
          data: editedCanvasData || problemData.canvasData.data
        }}
        editable={isEditingCanvas}
        onUpdate={(data) => setEditedCanvasData(data.data)}
      />
    </div>
    
    {isEditingCanvas && (
      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-800 mb-2">
          <strong>編集モード:</strong> 図形をドラッグして移動、ボタンでズームや保存ができます。
        </p>
        <details>
          <summary className="cursor-pointer text-sm text-yellow-700 hover:text-yellow-900">
            上級編集（JSON）
          </summary>
          <div className="mt-2">
            <textarea
              value={JSON.stringify(editedCanvasData || problemData.canvasData.data, null, 2)}
              onChange={(e) => {
                try {
                  const data = JSON.parse(e.target.value)
                  setEditedCanvasData(data)
                } catch (error) {
                  // JSON パースエラーは無視
                }
              }}
              className="w-full p-2 text-xs font-mono bg-white border rounded"
              rows={8}
            />
          </div>
        </details>
      </div>
    )}
  </div>
)}

// handleSave 関数内の problemToSave に追加
const problemToSave = {
  creatorId: currentUser.uid,
  creatorName: currentUser.displayName || currentUser.email || 'ユーザー',
  subject: problemData.subject,
  grade: problemData.grade,
  difficulty: problemData.difficulty,
  topic: problemData.topic,
  problemType: problemData.problemType,
  question: problemData.question,
  choices: problemData.choices || [],
  correctAnswer: problemData.correctAnswer || '',
  explanation: problemData.explanation,
  isPublic: false,
  tags: [problemData.subject, problemData.topic],
  metadata: problemData.metadata,
  // Canvas データを追加
  canvasData: problemData.canvasData ? {
    ...problemData.canvasData,
    data: editedCanvasData || problemData.canvasData.data
  } : undefined
}