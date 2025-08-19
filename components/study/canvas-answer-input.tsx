'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Send, Eraser, Undo, Redo, MousePointer, PenTool, Circle, Square } from 'lucide-react'
import { Problem } from '@/types/study'
import ProblemCanvas from '@/components/problem/ProblemCanvas'

interface CanvasAnswerInputProps {
  problem: Problem
  onSubmit: (answer: any, confidence: number) => Promise<boolean>
  disabled?: boolean
  className?: string
}

type DrawingMode = 'select' | 'point' | 'line' | 'circle' | 'polygon' | 'freehand'

export function CanvasAnswerInput({ problem, onSubmit, disabled = false, className }: CanvasAnswerInputProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('select')
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([])
  const [drawnElements, setDrawnElements] = useState<any[]>([])
  const [selectedElements, setSelectedElements] = useState<string[]>([])
  const [confidence, setConfidence] = useState(3)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // 履歴管理
  const [history, setHistory] = useState<any[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Canvas設定（ProblemCanvasと同じサイズ）
  const defaultWidth = 600
  const defaultHeight = 400
  const [canvasSize, setCanvasSize] = useState({ width: defaultWidth, height: defaultHeight })
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const answerConfig = problem.canvasData?.answerConfig

  // 回答タイプに応じた初期モード設定
  useEffect(() => {
    if (problem.canvasData?.answerType) {
      switch (problem.canvasData.answerType) {
        case 'point':
          setDrawingMode('point')
          break
        case 'line':
          setDrawingMode('line')
          break
        case 'shape':
          setDrawingMode('polygon')
          break
        case 'selection':
          setDrawingMode('select')
          break
        case 'drawing':
          setDrawingMode('freehand')
          break
      }
    }
  }, [problem.canvasData?.answerType])

  // Canvasのサイズを調整
  useEffect(() => {
    const updateCanvasSize = () => {
      if (!containerRef.current) return
      
      const containerWidth = containerRef.current.clientWidth
      const maxWidth = Math.min(containerWidth - 32, 800)
      const dataWidth = problem.canvasData?.width || defaultWidth
      const dataHeight = problem.canvasData?.height || defaultHeight
      const aspectRatio = dataHeight / dataWidth
      
      let width = maxWidth
      let height = width * aspectRatio
      
      const maxHeight = window.innerHeight * 0.5
      if (height > maxHeight) {
        height = maxHeight
        width = height / aspectRatio
      }
      
      setCanvasSize({ width, height })
      const baseScale = width / defaultWidth
      setScale(baseScale)
    }
    
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [problem.canvasData])

  // オーバーレイCanvasの描画
  useEffect(() => {
    const canvas = overlayCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 高解像度対応
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasSize.width * dpr
    canvas.height = canvasSize.height * dpr
    canvas.style.width = `${canvasSize.width}px`
    canvas.style.height = `${canvasSize.height}px`
    ctx.scale(dpr, dpr)

    // クリア
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height)

    // 座標変換
    ctx.save()
    ctx.translate(canvasSize.width / 2 + offset.x, canvasSize.height / 2 + offset.y)
    ctx.scale(scale, -scale)

    const coordScale = 30 * (canvasSize.width / defaultWidth)

    // 描画済み要素
    drawnElements.forEach(element => {
      ctx.strokeStyle = '#ef4444'
      ctx.fillStyle = '#ef444440'
      ctx.lineWidth = 3 / scale

      switch (element.type) {
        case 'point':
          ctx.beginPath()
          ctx.arc(element.x * coordScale, element.y * coordScale, 5 / scale, 0, 2 * Math.PI)
          ctx.fill()
          ctx.stroke()
          break
        
        case 'line':
        case 'freehand':
          ctx.beginPath()
          element.points.forEach((point: any, i: number) => {
            if (i === 0) {
              ctx.moveTo(point.x * coordScale, point.y * coordScale)
            } else {
              ctx.lineTo(point.x * coordScale, point.y * coordScale)
            }
          })
          ctx.stroke()
          break
        
        case 'polygon':
          ctx.beginPath()
          element.points.forEach((point: any, i: number) => {
            if (i === 0) {
              ctx.moveTo(point.x * coordScale, point.y * coordScale)
            } else {
              ctx.lineTo(point.x * coordScale, point.y * coordScale)
            }
          })
          ctx.closePath()
          ctx.fill()
          ctx.stroke()
          break
        
        case 'circle':
          if (element.center && element.radius) {
            ctx.beginPath()
            ctx.arc(element.center.x * coordScale, element.center.y * coordScale, 
                   element.radius * coordScale, 0, 2 * Math.PI)
            ctx.fill()
            ctx.stroke()
          }
          break
      }
    })

    // 現在描画中のパス
    if (isDrawing && currentPath.length > 0) {
      ctx.strokeStyle = '#ef444480'
      ctx.lineWidth = 3 / scale
      ctx.beginPath()
      currentPath.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x * coordScale, point.y * coordScale)
        } else {
          ctx.lineTo(point.x * coordScale, point.y * coordScale)
        }
      })
      ctx.stroke()
    }

    // 選択された要素のハイライト
    if (selectedElements.length > 0 && answerConfig?.selection) {
      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 4 / scale
      ctx.setLineDash([5 / scale, 5 / scale])
      
      selectedElements.forEach(id => {
        const element = answerConfig.selection?.selectableElements.find(e => e.id === id)
        if (element) {
          switch (element.type) {
            case 'point':
              ctx.beginPath()
              ctx.arc(element.data.x * coordScale, element.data.y * coordScale, 
                     8 / scale, 0, 2 * Math.PI)
              ctx.stroke()
              break
            case 'line':
              ctx.beginPath()
              ctx.moveTo(element.data.start.x * coordScale, element.data.start.y * coordScale)
              ctx.lineTo(element.data.end.x * coordScale, element.data.end.y * coordScale)
              ctx.stroke()
              break
          }
        }
      })
    }

    ctx.restore()
  }, [drawnElements, currentPath, isDrawing, selectedElements, canvasSize, scale, offset, answerConfig])

  // Canvas座標変換
  const getCanvasCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = overlayCanvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    let clientX, clientY

    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    const x = (clientX - rect.left - canvasSize.width / 2 - offset.x) / scale
    const y = -(clientY - rect.top - canvasSize.height / 2 - offset.y) / scale
    
    const coordScale = 30 * (canvasSize.width / defaultWidth)
    return {
      x: x / coordScale,
      y: y / coordScale
    }
  }, [canvasSize, offset, scale])

  // 描画開始
  const handleDrawStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return
    
    const coords = getCanvasCoordinates(e)
    
    switch (drawingMode) {
      case 'point':
        addPoint(coords)
        break
      case 'line':
      case 'polygon':
      case 'freehand':
        setIsDrawing(true)
        setCurrentPath([coords])
        break
      case 'circle':
        setIsDrawing(true)
        setCurrentPath([coords])
        break
      case 'select':
        handleSelection(coords)
        break
    }
  }

  // 描画中
  const handleDrawMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return
    
    const coords = getCanvasCoordinates(e)
    
    if (drawingMode === 'circle' && currentPath.length > 0) {
      // 円の場合は中心と現在位置から半径を計算
      setCurrentPath([currentPath[0], coords])
    } else {
      setCurrentPath(prev => [...prev, coords])
    }
  }

  // 描画終了
  const handleDrawEnd = () => {
    if (!isDrawing) return
    
    setIsDrawing(false)
    
    if (currentPath.length > 1) {
      let newElement: any = {
        id: `element-${Date.now()}`,
        type: drawingMode,
        timestamp: Date.now()
      }
      
      if (drawingMode === 'circle') {
        const center = currentPath[0]
        const edge = currentPath[currentPath.length - 1]
        const radius = Math.sqrt(
          Math.pow(edge.x - center.x, 2) + 
          Math.pow(edge.y - center.y, 2)
        )
        newElement.center = center
        newElement.radius = radius
      } else {
        newElement.points = currentPath
      }
      
      addToHistory([...drawnElements, newElement])
    }
    
    setCurrentPath([])
  }

  // 点を追加
  const addPoint = (coords: { x: number; y: number }) => {
    const newPoint = {
      id: `point-${Date.now()}`,
      type: 'point',
      x: coords.x,
      y: coords.y,
      timestamp: Date.now()
    }
    
    addToHistory([...drawnElements, newPoint])
  }

  // 選択処理
  const handleSelection = (coords: { x: number; y: number }) => {
    if (!answerConfig?.selection) return
    
    const selectableElements = answerConfig.selection.selectableElements
    let closestElement = null
    let minDistance = Infinity
    
    selectableElements.forEach(element => {
      const distance = calculateDistanceToElement(coords, element)
      if (distance < minDistance && distance < 0.5) {
        minDistance = distance
        closestElement = element
      }
    })
    
    if (closestElement) {
      if (answerConfig.selection.multiSelect) {
        setSelectedElements(prev => 
          prev.includes(closestElement.id)
            ? prev.filter(id => id !== closestElement.id)
            : [...prev, closestElement.id]
        )
      } else {
        setSelectedElements([closestElement.id])
      }
    }
  }

  // 要素との距離計算
  const calculateDistanceToElement = (coords: { x: number; y: number }, element: any): number => {
    switch (element.type) {
      case 'point':
        return Math.sqrt(
          Math.pow(coords.x - element.data.x, 2) +
          Math.pow(coords.y - element.data.y, 2)
        )
      case 'line':
        return calculateDistanceToLine(coords, element.data.start, element.data.end)
      default:
        return Infinity
    }
  }

  // 線分との距離計算
  const calculateDistanceToLine = (
    point: { x: number; y: number },
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): number => {
    const A = point.x - start.x
    const B = point.y - start.y
    const C = end.x - start.x
    const D = end.y - start.y
    
    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1
    
    if (lenSq !== 0) param = dot / lenSq
    
    let xx, yy
    
    if (param < 0) {
      xx = start.x
      yy = start.y
    } else if (param > 1) {
      xx = end.x
      yy = end.y
    } else {
      xx = start.x + param * C
      yy = start.y + param * D
    }
    
    const dx = point.x - xx
    const dy = point.y - yy
    return Math.sqrt(dx * dx + dy * dy)
  }

  // 履歴に追加
  const addToHistory = (newElements: any[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newElements)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setDrawnElements(newElements)
  }

  // 元に戻す
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setDrawnElements(history[historyIndex - 1])
    }
  }

  // やり直し
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setDrawnElements(history[historyIndex + 1])
    }
  }

  // クリア
  const clear = () => {
    setDrawnElements([])
    setSelectedElements([])
    setCurrentPath([])
    addToHistory([])
  }

  // 回答を送信
  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    const answerData = {
      type: problem.canvasData?.answerType,
      drawnElements,
      selectedElements,
      timestamp: Date.now()
    }
    
    const result = await onSubmit(answerData, confidence)
    setIsSubmitting(false)
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>図形で解答</span>
          <div className="flex gap-2">
            {problem.canvasData?.answerType && (
              <Badge variant="outline">
                {
                  {
                    point: '点をプロット',
                    line: '線を描く',
                    shape: '図形を描く',
                    selection: '選択',
                    drawing: '自由描画'
                  }[problem.canvasData.answerType]
                }
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ツールバー */}
        <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg">
          <Button
            size="sm"
            variant={drawingMode === 'select' ? 'default' : 'outline'}
            onClick={() => setDrawingMode('select')}
            disabled={disabled}
          >
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={drawingMode === 'point' ? 'default' : 'outline'}
            onClick={() => setDrawingMode('point')}
            disabled={disabled}
          >
            <Circle className="h-3 w-3 fill-current" />
          </Button>
          <Button
            size="sm"
            variant={drawingMode === 'line' ? 'default' : 'outline'}
            onClick={() => setDrawingMode('line')}
            disabled={disabled}
          >
            <PenTool className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={drawingMode === 'circle' ? 'default' : 'outline'}
            onClick={() => setDrawingMode('circle')}
            disabled={disabled}
          >
            <Circle className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={drawingMode === 'polygon' ? 'default' : 'outline'}
            onClick={() => setDrawingMode('polygon')}
            disabled={disabled}
          >
            <Square className="h-4 w-4" />
          </Button>
          
          <div className="flex-1" />
          
          <Button
            size="sm"
            variant="outline"
            onClick={undo}
            disabled={disabled || historyIndex <= 0}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={redo}
            disabled={disabled || historyIndex >= history.length - 1}
          >
            <Redo className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={clear}
            disabled={disabled || drawnElements.length === 0}
          >
            <Eraser className="h-4 w-4" />
          </Button>
        </div>

        {/* Canvas表示 */}
        <div ref={containerRef} className="relative">
          {/* 背景のProblemCanvas */}
          <ProblemCanvas
            canvasData={problem.canvasData!}
            interactive={false}
          />
          
          {/* 回答用オーバーレイCanvas */}
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 w-full h-full cursor-crosshair"
            style={{ 
              pointerEvents: 'auto',
              touchAction: 'none'
            }}
            onMouseDown={handleDrawStart}
            onMouseMove={handleDrawMove}
            onMouseUp={handleDrawEnd}
            onMouseLeave={handleDrawEnd}
            onTouchStart={handleDrawStart}
            onTouchMove={handleDrawMove}
            onTouchEnd={handleDrawEnd}
          />
        </div>

        {/* ヒント表示 */}
        {answerConfig && (
          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
            {answerConfig.point?.hint ||
             (answerConfig.line?.checkDirection && '矢印の向きに注意してください') ||
             (answerConfig.shape?.checkCongruence && '図形の大きさと形が一致するように描いてください') ||
             '図形上で解答を入力してください'}
          </div>
        )}

        {/* 自信度選択 */}
        <div className="space-y-2">
          <Label>自信度</Label>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">低</span>
            <Slider
              value={[confidence]}
              onValueChange={(value) => setConfidence(value[0])}
              min={1}
              max={5}
              step={1}
              disabled={disabled || isSubmitting}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground">高</span>
          </div>
          <div className="text-center text-sm text-muted-foreground">
            {['全く自信なし', '自信なし', '普通', '自信あり', '完全に自信あり'][confidence - 1]}
          </div>
        </div>

        {/* 送信ボタン */}
        <Button
          onClick={handleSubmit}
          disabled={disabled || isSubmitting || (drawnElements.length === 0 && selectedElements.length === 0)}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              送信中...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              解答を送信
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}