'use client'

import { useState, useEffect } from 'react'

export default function TestPage() {
  console.log('TestPage component loaded')
  
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(s => s + 1)
      }, 1000)
    } else if (interval) {
      clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">テストページ</h1>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-xl mb-4">インラインタイマーテスト</h2>
        <p className="text-3xl font-mono mb-4">{seconds}秒</p>
        <div className="space-x-2">
          <button 
            onClick={() => setIsRunning(!isRunning)}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {isRunning ? '停止' : '開始'}
          </button>
          <button 
            onClick={() => {
              setSeconds(0)
              setIsRunning(false)
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            リセット
          </button>
        </div>
      </div>
    </div>
  )
}