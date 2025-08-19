// lib/firebase/quickLearning.ts

import { 
 collection, 
 addDoc, 
 query, 
 where, 
 getDocs,
 updateDoc,
 doc,
 serverTimestamp,
 Timestamp,
 orderBy,
 limit,
 arrayUnion,
 increment,
 setDoc,
 getDoc
} from 'firebase/firestore'
import { db } from './config'
import { auth } from './config'
import { GoogleGenerativeAI } from '@google/generative-ai'

// subjects.tsからインポート
import { 
 getUserExamSubjects,
 getUserSelectedSubjectsFlat,
 getSubjectStudyStatus,
 type UserExamSubjects,
 type SelectedSubject,
 type Subject,
 type Unit
} from './subjects'

// schedule.tsからインポート
import { 
 getActiveSchedule, 
 getTodaysFocusPoint,
 getNextAchievementTasks,
 type DetailedAnalysis,
 type DailyFocusPoint,
 type AchievementTask,
 type WeaknessDetail
} from './schedule'

// ========== 型定義（拡張） ==========

export interface QuickLearningQuestion {
 id?: string
 content: string
 subjectId: string      // 科目ID
 subjectName: string    // 科目名
 unitId: string         // 単元ID
 unitName: string       // 単元名
 options: string[]
 correctAnswer: number
 difficulty: 1 | 2 | 3
 estimatedTime: number
 generatedBy: 'gemini-1.5-flash'
 createdAt: Timestamp
 tags: string[]
 explanation?: string
 // スケジュール連携
 relatedWeakness?: string[]      
 achievementTaskId?: string       
 conceptDependencies?: string[]   
 targetMastery?: number          
 forgettingCurveData?: {
   interval: number
   easeFactor: number
   repetitions: number
 }
}

export interface QuickLearningSession {
 id?: string
 userId: string
 scheduledTime: Timestamp
 startTime?: Timestamp
 endTime?: Timestamp
 questions: string[]
 responses: UserQuestionResponse[]
 sessionType: 'morning' | 'evening' | 'random'
 completed: boolean
 notificationSent: boolean
 totalTime?: number
 metadata?: {
   basedOnSchedule?: boolean
   focusPoints?: string
   relatedTasks?: string[]
   targetedWeaknesses?: string[]
   totalSubjects: number
   subjectDistribution?: Record<string, number>
   difficultyDistribution?: {
     basic: number
     standard: number
     advanced: number
   }
 }
}

export interface UserQuestionResponse {
 questionId: string
 selectedAnswer: number
 isCorrect: boolean
 responseTime: number
 timestamp: Timestamp
}

export interface UserQuickLearningSettings {
 userId: string
 enabled: boolean
 sessions: Array<{
   time: string
   enabled: boolean
   days: string[]
   sessionType: 'morning' | 'evening' | 'random'
 }>
 randomMode: {
   enabled: boolean
   timeRanges: Array<{
     start: string
     end: string
   }>
   minInterval: number
 }
 questionsPerSession: number  // 1セッションの問題数
 notificationSettings: {
   enabled: boolean
   minutesBefore: number
 }
}

// ========== Gemini設定 ==========

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

// ========== メインのセッション生成 ==========

export async function createQuickLearningSession(
 userId: string,
 sessionType: 'morning' | 'evening' | 'random'
): Promise<QuickLearningSession> {
 try {
   // 必要なデータを並列で取得
   const [settings, examSubjects, flatSubjects, activeSchedule] = await Promise.all([
     getUserQuickLearningSettings(userId),
     getUserExamSubjects(userId),
     getUserSelectedSubjectsFlat(userId),
     getActiveSchedule(userId)
   ])
   
   if (!settings?.enabled) {
     throw new Error('Quick learning is not enabled')
   }
   
   if (!examSubjects || flatSubjects.length === 0) {
     throw new Error('No exam subjects selected')
   }
   
   let questions: string[]
   let metadata: any = {
     totalSubjects: flatSubjects.length
   }
   
   // スケジュールの有無で処理を分岐
   if (activeSchedule?.detailedAnalysis) {
     // スケジュールベースの高度な問題選択
     const result = await createScheduleBasedQuestions(
       userId,
       sessionType,
       flatSubjects,
       activeSchedule.detailedAnalysis,
       settings.questionsPerSession || 10
     )
     questions = result.questions
     metadata = { ...metadata, ...result.metadata }
   } else {
     // 全科目からバランスよく問題生成
     const result = await createBalancedQuestions(
       userId,
       sessionType,
       flatSubjects,
       examSubjects,
       settings.questionsPerSession || 10
     )
     questions = result.questions
     metadata = { ...metadata, ...result.metadata }
   }
   
   // セッション作成
   const sessionData: Omit<QuickLearningSession, 'id'> = {
     userId,
     scheduledTime: serverTimestamp() as Timestamp,
     questions,
     responses: [],
     sessionType,
     completed: false,
     notificationSent: false,
     metadata
   }
   
   const docRef = await addDoc(collection(db, 'quickLearningSessions'), sessionData)
   
   return { id: docRef.id, ...sessionData }
 } catch (error) {
   console.error('セッション作成エラー:', error)
   throw error
 }
}

// ========== スケジュールベースの問題生成 ==========

async function createScheduleBasedQuestions(
 userId: string,
 sessionType: string,
 flatSubjects: any[],
 analysis: DetailedAnalysis,
 totalQuestions: number
): Promise<{ questions: string[], metadata: any }> {
 console.log('📊 スケジュールベースの問題生成開始...')
 
 // 今日のフォーカスポイントと達成課題を取得
 const todaysFocus = getTodaysFocusPoint(analysis)
 const nextTasks = getNextAchievementTasks(analysis, await getCompletedTaskIds(userId))
 const weaknesses = analysis.weaknessBreakdown
 
 // 問題配分を計算
 const distribution = calculateQuestionDistribution(
   todaysFocus,
   nextTasks,
   weaknesses,
   flatSubjects,
   totalQuestions
 )
 
 const allQuestions: QuickLearningQuestion[] = []
 
 // カテゴリー別に問題を生成
 for (const category of distribution) {
   const categoryQuestions = await generateCategoryQuestions(
     userId,
     category,
     sessionType
   )
   allQuestions.push(...categoryQuestions)
 }
 
 // Firestoreに保存してIDを取得
 const questionIds: string[] = []
 for (const q of allQuestions) {
   const docRef = await addDoc(collection(db, 'quickLearningQuestions'), {
     ...q,
     createdAt: serverTimestamp()
   })
   questionIds.push(docRef.id)
 }
 
 const metadata = {
   basedOnSchedule: true,
   focusPoints: todaysFocus?.mainTheme,
   relatedTasks: nextTasks.map(t => t.id),
   targetedWeaknesses: weaknesses.map(w => `${w.subject}-${w.unit}`),
   subjectDistribution: calculateSubjectDistribution(allQuestions),
   difficultyDistribution: calculateDifficultyDistribution(allQuestions)
 }
 
 return { questions: questionIds, metadata }
}

// ========== バランス型の問題生成 ==========

async function createBalancedQuestions(
 userId: string,
 sessionType: string,
 flatSubjects: any[],
 examSubjects: UserExamSubjects,
 totalQuestions: number
): Promise<{ questions: string[], metadata: any }> {
 console.log('⚖️ バランス型の問題生成開始...')
 
 // 優先度でグループ化
 const priorityGroups = groupByPriority(flatSubjects)
 
 // 各グループの問題数を決定
 const distribution = {
   high: Math.ceil(totalQuestions * 0.5),    // 50%
   medium: Math.ceil(totalQuestions * 0.3),  // 30%
   low: Math.floor(totalQuestions * 0.2)     // 20%
 }
 
 const allQuestions: QuickLearningQuestion[] = []
 
 for (const [priority, subjects] of Object.entries(priorityGroups)) {
   const count = distribution[priority as keyof typeof distribution] || 0
   if (count === 0 || subjects.length === 0) continue
   
   // グループ内で均等に配分
   const questionsPerSubject = Math.max(1, Math.floor(count / subjects.length))
   const remainder = count % subjects.length
   
   for (let i = 0; i < subjects.length && allQuestions.length < totalQuestions; i++) {
     const subject = subjects[i]
     const subjectCount = questionsPerSubject + (i < remainder ? 1 : 0)
     
     // この科目・単元の問題を生成
     const questions = await generateSubjectUnitQuestions(
       userId,
       subject,
       subjectCount,
       sessionType
     )
     
     allQuestions.push(...questions)
   }
 }
 
 // 必要に応じて調整
 const finalQuestions = allQuestions.slice(0, totalQuestions)
 
 // Firestoreに保存
 const questionIds: string[] = []
 for (const q of finalQuestions) {
   const docRef = await addDoc(collection(db, 'quickLearningQuestions'), {
     ...q,
     createdAt: serverTimestamp()
   })
   questionIds.push(docRef.id)
 }
 
 const metadata = {
   basedOnSchedule: false,
   subjectDistribution: calculateSubjectDistribution(finalQuestions),
   difficultyDistribution: calculateDifficultyDistribution(finalQuestions),
   priorityDistribution: distribution
 }
 
 return { questions: questionIds, metadata }
}

// ========== 問題生成関数 ==========

async function generateSubjectUnitQuestions(
 userId: string,
 subjectUnit: any,
 count: number,
 sessionType: string
): Promise<QuickLearningQuestion[]> {
 try {
   // 復習が必要な問題をチェック
   const reviewQuestions = await getReviewQuestions(
     userId,
     subjectUnit.subjectId,
     subjectUnit.unitId,
     Math.ceil(count * 0.7)
   )
   
   // 新規問題の必要数
   const newCount = count - reviewQuestions.length
   
   if (newCount > 0) {
     // Geminiで新規問題を生成
     const newQuestions = await generateNewQuestionsWithGemini(
       subjectUnit,
       newCount,
       sessionType
     )
     
     return [...reviewQuestions, ...newQuestions]
   }
   
   return reviewQuestions.slice(0, count)
 } catch (error) {
   console.error('問題生成エラー:', error)
   return []
 }
}

async function generateNewQuestionsWithGemini(
 subjectUnit: any,
 count: number,
 sessionType: string
): Promise<QuickLearningQuestion[]> {
 const prompt = createQuestionPrompt(subjectUnit, count, sessionType)
 
 try {
   const result = await model.generateContent(prompt)
   const response = await result.response
   const text = response.text()
   
   // JSONを抽出してパース
   const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/)
   if (!jsonMatch) throw new Error('Invalid response format')
   
   const questions = JSON.parse(jsonMatch[1])
   
   // QuickLearningQuestion形式に変換
   return questions.map((q: any) => ({
     content: q.content,
     subjectId: subjectUnit.subjectId,
     subjectName: subjectUnit.subjectName,
     unitId: subjectUnit.unitId,
     unitName: subjectUnit.unitName,
     options: q.options,
     correctAnswer: q.correctAnswer,
     difficulty: q.difficulty || 2,
     estimatedTime: q.estimatedTime || 30,
     generatedBy: 'gemini-1.5-flash' as const,
     createdAt: serverTimestamp() as Timestamp,
     tags: q.tags || [subjectUnit.unitName],
     explanation: q.explanation
   }))
 } catch (error) {
   console.error('Gemini生成エラー:', error)
   return []
 }
}

function createQuestionPrompt(subjectUnit: any, count: number, sessionType: string): string {
 const timeContext = {
   morning: '朝の通学時間に適した、頭を活性化させる',
   evening: '夜の就寝前に適した、記憶に定着しやすい',
   random: '隙間時間に手軽に解ける'
 }
 
 return `
あなたは日本の大学受験指導のエキスパートです。
${timeContext[sessionType as keyof typeof timeContext]}問題を${count}問生成してください。

【科目情報】
- 科目: ${subjectUnit.subjectName}
- 単元: ${subjectUnit.unitName}
- 重要度: ${subjectUnit.importance === 'required' ? '必須' : '選択'}

【問題の要件】
1. 形式: 4択問題
2. 難易度: 基礎〜標準（共通テストレベル）
3. 解答時間: 30秒以内
4. 内容: 知識確認型（定理・公式・用語・基本概念）

【出力形式】
以下のJSON配列形式で出力してください：
\`\`\`json
[
 {
   "content": "問題文（50文字以内）",
   "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
   "correctAnswer": 0,
   "explanation": "解説（1-2文）",
   "difficulty": 2,
   "estimatedTime": 30,
   "tags": ["${subjectUnit.unitName}"]
 }
]
\`\`\`
`
}

// ========== 忘却曲線に基づく復習問題取得 ==========

async function getReviewQuestions(
 userId: string,
 subjectId: string,
 unitId: string,
 count: number
): Promise<QuickLearningQuestion[]> {
 try {
   // 復習が必要な問題を検索
   const statsQuery = query(
     collection(db, 'userQuickLearningStats'),
     where('userId', '==', userId),
     where('subjectId', '==', subjectId),
     where('unitId', '==', unitId),
     where('nextReviewDate', '<=', Timestamp.now()),
     orderBy('nextReviewDate', 'asc'),
     limit(count)
   )
   
   const snapshot = await getDocs(statsQuery)
   const questions: QuickLearningQuestion[] = []
   
   for (const doc of snapshot.docs) {
     const stat = doc.data()
     const questionDoc = await getDoc(doc(db, 'quickLearningQuestions', stat.questionId))
     
     if (questionDoc.exists()) {
       questions.push({
         id: questionDoc.id,
         ...questionDoc.data()
       } as QuickLearningQuestion)
     }
   }
   
   return questions
 } catch (error) {
   console.error('復習問題取得エラー:', error)
   return []
 }
}

// ========== 解答処理 ==========

export async function submitQuickLearningResponse(
 sessionId: string,
 questionId: string,
 selectedAnswer: number,
 responseTime: number
): Promise<{ isCorrect: boolean; explanation?: string }> {
 try {
   const questionDoc = await getDoc(doc(db, 'quickLearningQuestions', questionId))
   if (!questionDoc.exists()) {
     throw new Error('Question not found')
   }
   
   const question = questionDoc.data() as QuickLearningQuestion
   const isCorrect = selectedAnswer === question.correctAnswer
   
   // セッションに解答を追加
   const sessionRef = doc(db, 'quickLearningSessions', sessionId)
   const response: UserQuestionResponse = {
     questionId,
     selectedAnswer,
     isCorrect,
     responseTime,
     timestamp: serverTimestamp() as Timestamp
   }
   
   await updateDoc(sessionRef, {
     responses: arrayUnion(response)
   })
   
   // ユーザーの統計を更新
   const user = auth.currentUser
   if (user) {
     await updateUserQuestionStats(
       user.uid,
       questionId,
       question.subjectId,
       question.unitId,
       isCorrect,
       responseTime
     )
   }
   
   return { isCorrect, explanation: question.explanation }
 } catch (error) {
   console.error('解答送信エラー:', error)
   throw error
 }
}

// ========== 統計更新（SM-2アルゴリズム） ==========

async function updateUserQuestionStats(
 userId: string,
 questionId: string,
 subjectId: string,
 unitId: string,
 isCorrect: boolean,
 responseTime: number
) {
 try {
   const statsId = `${userId}_${questionId}`
   const statsRef = doc(db, 'userQuickLearningStats', statsId)
   const statsDoc = await getDoc(statsRef)
   
   let easeFactor = 2.5
   let interval = 1
   let repetitions = 0
   
   if (statsDoc.exists()) {
     const data = statsDoc.data()
     easeFactor = data.easeFactor || 2.5
     interval = data.interval || 1
     repetitions = data.repetitions || 0
   }
   
   // SM-2アルゴリズムの実装
   if (isCorrect) {
     repetitions += 1
     if (repetitions === 1) {
       interval = 1
     } else if (repetitions === 2) {
       interval = 6
     } else {
       interval = Math.round(interval * easeFactor)
     }
     
     if (responseTime < 10) {
       easeFactor += 0.1
     } else if (responseTime > 25) {
       easeFactor -= 0.1
     }
   } else {
     repetitions = 0
     interval = 1
     easeFactor = Math.max(1.3, easeFactor - 0.2)
   }
   
   easeFactor = Math.min(2.5, Math.max(1.3, easeFactor))
   
   const nextReviewDate = new Date()
   nextReviewDate.setDate(nextReviewDate.getDate() + interval)
   
   await setDoc(statsRef, {
     userId,
     questionId,
     subjectId,
     unitId,
     lastStudied: serverTimestamp(),
     lastCorrect: isCorrect,
     totalAttempts: increment(1),
     correctAttempts: isCorrect ? increment(1) : increment(0),
     easeFactor,
     interval,
     repetitions,
     nextReviewDate: Timestamp.fromDate(nextReviewDate),
     avgResponseTime: responseTime
   }, { merge: true })
 } catch (error) {
   console.error('統計更新エラー:', error)
 }
}

// ========== ユーティリティ関数 ==========

function calculateQuestionDistribution(
 todaysFocus: DailyFocusPoint | null,
 nextTasks: AchievementTask[],
 weaknesses: WeaknessDetail[],
 flatSubjects: any[],
 totalQuestions: number
): any[] {
 const distribution: any[] = []
 
 // 優先度計算のロジック
 // 1. 今日のフォーカス (40%)
 // 2. 達成課題 (30%)
 // 3. 弱点克服 (20%)
 // 4. その他 (10%)
 
 const counts = {
   focus: Math.ceil(totalQuestions * 0.4),
   tasks: Math.ceil(totalQuestions * 0.3),
   weakness: Math.ceil(totalQuestions * 0.2),
   other: Math.floor(totalQuestions * 0.1)
 }
 
 // 実装省略（詳細な配分ロジック）
 
 return distribution
}

function groupByPriority(flatSubjects: any[]): Record<string, any[]> {
 const groups: Record<string, any[]> = {
   high: [],
   medium: [],
   low: []
 }
 
 flatSubjects.forEach(subject => {
   if (subject.priority >= 8) {
     groups.high.push(subject)
   } else if (subject.priority >= 5) {
     groups.medium.push(subject)
   } else {
     groups.low.push(subject)
   }
 })
 
 return groups
}

function calculateSubjectDistribution(questions: QuickLearningQuestion[]): Record<string, number> {
 const distribution: Record<string, number> = {}
 
 questions.forEach(q => {
   if (!distribution[q.subjectId]) {
     distribution[q.subjectId] = 0
   }
   distribution[q.subjectId]++
 })
 
 return distribution
}

function calculateDifficultyDistribution(questions: QuickLearningQuestion[]) {
 const distribution = { basic: 0, standard: 0, advanced: 0 }
 
 questions.forEach(q => {
   if (q.difficulty === 1) distribution.basic++
   else if (q.difficulty === 2) distribution.standard++
   else distribution.advanced++
 })
 
 return distribution
}

async function getCompletedTaskIds(userId: string): Promise<string[]> {
 const q = query(
   collection(db, 'userAchievements'),
   where('userId', '==', userId),
   where('completed', '==', true)
 )
 
 const snapshot = await getDocs(q)
 return snapshot.docs.map(doc => doc.data().taskId)
}

function shuffleArray<T>(array: T[]): T[] {
 const shuffled = [...array]
 for (let i = shuffled.length - 1; i > 0; i--) {
   const j = Math.floor(Math.random() * (i + 1));
   [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
 }
 return shuffled
}

// ========== 設定管理 ==========

export async function getUserQuickLearningSettings(userId: string): Promise<UserQuickLearningSettings | null> {
 try {
   const docRef = doc(db, 'users', userId, 'settings', 'quickLearning')
   const docSnap = await getDoc(docRef)
   
   if (docSnap.exists()) {
     return docSnap.data() as UserQuickLearningSettings
   }
   
   // デフォルト設定
   return {
     userId,
     enabled: false,
     sessions: [
       {
         time: "07:30",
         enabled: true,
         days: ["月", "火", "水", "木", "金", "土", "日"],
         sessionType: 'morning'
       },
       {
         time: "22:00",
         enabled: true,
         days: ["月", "火", "水", "木", "金", "土", "日"],
         sessionType: 'evening'
       }
     ],
     randomMode: {
       enabled: false,
       timeRanges: [
         { start: "12:00", end: "13:00" },
         { start: "18:00", end: "20:00" }
       ],
       minInterval: 180
     },
     questionsPerSession: 10,
     notificationSettings: {
       enabled: true,
       minutesBefore: 5
     }
   }
 } catch (error) {
   console.error('設定取得エラー:', error)
   return null
 }
}

export async function updateUserQuickLearningSettings(
 userId: string,
 settings: Partial<UserQuickLearningSettings>
): Promise<void> {
 try {
   const docRef = doc(db, 'users', userId, 'settings', 'quickLearning')
   await setDoc(docRef, {
     ...settings,
     userId,
     updatedAt: serverTimestamp()
   }, { merge: true })
 } catch (error) {
   console.error('設定更新エラー:', error)
   throw error
 }
}