'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SimpleTimerTest() {
  const [seconds, setSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isActive])

  const handleStart = () => {
    setIsActive(true)
  }

  const handleStop = () => {
    setIsActive(false)
  }

  const handleReset = () => {
    setSeconds(0)
    setIsActive(false)
  }

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>シンプルタイマーテスト</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-mono font-bold">
            {formatTime(seconds)}
          </div>
        </div>
        
        <div className="flex justify-center gap-2">
          {!isActive ? (
            <Button onClick={handleStart}>開始</Button>
          ) : (
            <Button onClick={handleStop} variant="secondary">停止</Button>
          )}
          <Button onClick={handleReset} variant="outline">リセット</Button>
        </div>
        
        <div className="text-sm text-gray-500 text-center">
          状態: {isActive ? '動作中' : '停止中'}
        </div>
      </CardContent>
    </Card>
  )
}