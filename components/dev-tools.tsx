// components/dev-tools.tsx
'use client'

import { useEffect } from 'react'
import { db, auth } from '@/lib/firebase/config'
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'

export function DevTools() {
  useEffect(() => {
    // 開発環境でのみFirebaseサービスをグローバルに公開
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      // @ts-ignore
      window.firebaseServices = {
        db,
        auth,
        collection,
        addDoc,
        getDocs,
        query,
        where,
        serverTimestamp,
        Timestamp
      }
      
      // 開発用ヘルパー関数も追加
      // @ts-ignore
      window.testQuickLearning = {
        // 問題生成テスト
        generateQuestions: async (params = {}) => {
          const defaultParams = {
            subject: '数学',
            unit: '三角関数',
            count: 2,
            sessionType: 'morning'
          }
          
          try {
            const token = await auth.currentUser?.getIdToken()
            const response = await fetch('/api/quick-learning/generate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
              },
              body: JSON.stringify({ ...defaultParams, ...params })
            })
            
            const data = await response.json()
            console.log('生成結果:', data)
            return data
          } catch (error) {
            console.error('エラー:', error)
            throw error
          }
        },
        
        // Firebaseに直接保存
        saveTestQuestion: async (questionData = {}) => {
          const defaultQuestion = {
            content: "sin 90°の値は？",
            subject: "math",
            unit: "三角関数",
            options: ["0", "1", "-1", "1/2"],
            correctAnswer: 1,
            difficulty: 1,
            estimatedTime: 20,
            generatedBy: "gemini-1.5-flash",
            createdAt: serverTimestamp(),
            tags: ["基礎", "三角関数"],
            explanation: "sin 90° = 1 です。"
          }
          
          try {
            const docRef = await addDoc(
              collection(db, 'quickLearningQuestions'), 
              { ...defaultQuestion, ...questionData }
            )
            console.log('保存成功:', docRef.id)
            return docRef.id
          } catch (error) {
            console.error('保存エラー:', error)
            throw error
          }
        },
        
        // 保存された問題を取得
        getQuestions: async (limit = 10) => {
          try {
            const q = query(
              collection(db, 'quickLearningQuestions'),
              where('subject', '==', 'math')
            )
            const snapshot = await getDocs(q)
            const questions = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }))
            console.log(`${questions.length}問取得:`, questions)
            return questions
          } catch (error) {
            console.error('取得エラー:', error)
            throw error
          }
        }
      }
      
      console.log('🛠️ 開発ツールが有効化されました')
      console.log('利用可能なコマンド:')
      console.log('- window.firebaseServices: Firebaseサービスへの直接アクセス')
      console.log('- window.testQuickLearning.generateQuestions(): 問題生成テスト')
      console.log('- window.testQuickLearning.saveTestQuestion(): テスト問題保存')
      console.log('- window.testQuickLearning.getQuestions(): 保存済み問題取得')
    }
  }, [])

  return null
}