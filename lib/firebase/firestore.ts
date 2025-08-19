// lib/firebase/firestore.ts

import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  addDoc,
  serverTimestamp,
  onSnapshot,
  increment,
  arrayUnion,
  deleteDoc,
  writeBatch
} from 'firebase/firestore'
import { format, startOfMonth, endOfMonth, isValid, parseISO } from 'date-fns'
import { db } from './config'
import { auth } from './config'
import { EssayTheme, EssaySubmission, EssayEvaluation } from './types'

// ========== 型定義 ==========
export type Grade = '高校1年' | '高校2年' | '高校3年'
export type TimerMode = 'countup' | 'countdown' | 'pomodoro'
export type PomodoroState = 'work' | 'break' | 'longBreak'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  grade: Grade
  gradeUpdatedAt: Date
  subscriptionStatus: 'free' | 'premium' | 'corporate'
  corporateId?: string
  corporateCompanyName?: string
  corporateActivatedAt?: string
  createdAt: Date
  updatedAt: Date
  // 学習統計（統合版）
  studyStats: {
    totalStudyTime: number // 秒単位
    currentStreak: number
    longestStreak: number
    lastStudyDate: Date | Timestamp
  }
  // 問題演習統計
  stats?: {
    totalQuestions: number
    correctAnswers: number
    lastQuizAt: Timestamp
    totalProblemsCreated?: number
    lastProblemCreatedAt?: Timestamp
  }
  // 学習設定
  studySettings?: {
    subjects: string[]
    timeBlocks: Array<{
      id: string
      type: 'school' | 'club' | 'cram_school' | 'other'
      name: string
      startTime: string
      endTime: string
      days: string[]
    }>
    studyGoals: {
      hoursPerDay: number
      daysPerWeek: number
      examDate: string
      targetScore: number
    }
    lastUpdated: Date
  }
  // 科目情報
  curriculumSubjects?: string[]  // 履修科目（1,2年生）
  examSubjects?: string[]        // 受験科目（3年生）
  subjects?: {
    [key: string]: {
      level: number
      lastStudied: Date
    }
  }
  role?: 'student' | 'teacher' | 'parent'
  school?: string
  needsExamSubjectSelection?: boolean
  // Stripe関連
  stripeCustomerId?: string
  subscriptionId?: string
  subscription?: {
    id: string
    status: string
    currentPeriodEnd: Date | null
    cancelAtPeriodEnd?: boolean
    updatedAt: Date
  }
}

interface AdditionalUserData {
  grade?: Grade
  gradeUpdatedAt?: Date
  curriculumSubjects?: string[]
  examSubjects?: string[]
  role?: 'student' | 'teacher' | 'parent'
  school?: string
}

// ========== ユーザープロファイル関連 ==========

// ユーザープロファイル作成（統合版）
export async function createUserProfile(
  uid: string, 
  email: string, 
  displayName: string,
  additionalData?: AdditionalUserData
): Promise<UserProfile> {
  try {
    const userRef = doc(db, 'users', uid)
    
    const userData: UserProfile = {
      uid,
      email,
      displayName,
      subscriptionStatus: 'free',
      createdAt: new Date(),
      updatedAt: new Date(),
      studyStats: {
        totalStudyTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDate: serverTimestamp() as Timestamp
      },
      stats: {
        totalQuestions: 0,
        correctAnswers: 0,
        lastQuizAt: serverTimestamp() as Timestamp
      },
      // 学年情報を追加
      grade: additionalData?.grade || '高校3年',
      gradeUpdatedAt: additionalData?.gradeUpdatedAt || new Date(),
      // オプション情報
      ...(additionalData?.role && { role: additionalData.role }),
      ...(additionalData?.school && { school: additionalData.school }),
      ...(additionalData?.curriculumSubjects && { curriculumSubjects: additionalData.curriculumSubjects }),
      ...(additionalData?.examSubjects && { examSubjects: additionalData.examSubjects })
    }
    
    await setDoc(userRef, userData)
    console.log('User profile created:', uid, 'Grade:', userData.grade)
    
    return userData
  } catch (error) {
    console.error('Error creating user profile:', error)
    throw error
  }
}

// ユーザープロファイル取得（統合版）
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', uid)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      const data = userSnap.data()
      
      // 既存ユーザーで学年が未設定の場合のデフォルト値
      if (!data.grade) {
        console.log('Grade not set for user, defaulting to 高校3年')
        await updateDoc(userRef, {
          grade: '高校3年',
          gradeUpdatedAt: new Date(),
          updatedAt: new Date()
        })
        data.grade = '高校3年'
        data.gradeUpdatedAt = new Date()
      }
      
      // タイムスタンプをDateに変換
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        gradeUpdatedAt: data.gradeUpdatedAt?.toDate() || new Date(),
        studyStats: {
          ...data.studyStats,
          lastStudyDate: data.studyStats?.lastStudyDate?.toDate() || new Date()
        }
      } as UserProfile
    }
    
    return null
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

// ユーザープロファイル更新（統合版）
export async function updateUserProfile(
  uid: string, 
  updates: Partial<UserProfile>
): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', uid)
    
    // undefined を除外
    const cleanedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value
      }
      return acc
    }, {} as any)
    
    // 学年が更新される場合は、更新日時も記録
    if (cleanedUpdates.grade) {
      cleanedUpdates.gradeUpdatedAt = new Date()
      // 3年生に進級した場合は受験科目の設定を促す
      if (cleanedUpdates.grade === '高校3年') {
        cleanedUpdates.needsExamSubjectSelection = true
      }
    }
    
    await updateDoc(userRef, {
      ...cleanedUpdates,
      updatedAt: serverTimestamp()
    })
    
    console.log('User profile updated:', uid)
    return true
  } catch (error) {
    console.error('Error updating user profile:', error)
    return false
  }
}

// 学年別ユーザー数の取得（統計用）
export async function getUserCountByGrade(): Promise<Record<Grade, number>> {
  try {
    const grades: Grade[] = ['高校1年', '高校2年', '高校3年']
    const counts: Record<Grade, number> = {
      '高校1年': 0,
      '高校2年': 0,
      '高校3年': 0
    }
    
    for (const grade of grades) {
      const q = query(
        collection(db, 'users'),
        where('grade', '==', grade)
      )
      const snapshot = await getDocs(q)
      counts[grade] = snapshot.size
    }
    
    return counts
  } catch (error) {
    console.error('Error getting user count by grade:', error)
    return {
      '高校1年': 0,
      '高校2年': 0,
      '高校3年': 0
    }
  }
}

// 進級処理（年度更新時に使用）
export async function updateUserGrade(uid: string, newGrade: Grade): Promise<boolean> {
  try {
    return await updateUserProfile(uid, {
      grade: newGrade,
      gradeUpdatedAt: new Date(),
      needsExamSubjectSelection: newGrade === '高校3年'
    })
  } catch (error) {
    console.error('Error updating user grade:', error)
    return false
  }
}

// ========== スケジュール関連 ==========

export interface Schedule {
  id?: string
  userId: string
  targetDate: Timestamp | Date
  targetScore: number
  currentScore: number
  totalTargetHours: number
  isActive: boolean
  studyHoursPerDay?: number
  aiEnabled?: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface MonthlySchedule {
  id?: string
  userId: string
  scheduleId: string
  yearMonth: string // 'YYYY-MM' format
  targetHours: number
  completedHours: number
  monthlyGoals?: string[]
  status: 'pending' | 'in_progress' | 'completed'
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface DailyTask {
  id?: string
  scheduleId: string
  date: string // 'YYYY-MM-DD' format
  tasks: Array<{
    id: string
    subject: string
    unit: string
    topic: string
    duration: number // minutes
    completed: boolean
    priority: 'high' | 'medium' | 'low'
  }>
  totalMinutes: number
  completedMinutes: number
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface MonthlyGoal {
  id?: string
  scheduleId: string
  year: number
  month: number
  yearMonth: string // 'YYYY-MM'
  targetHours: number
  plannedHours: number
  actualHours: number
  subjects: Array<{
    name: string
    targetHours: number
    actualHours: number
  }>
  isCompleted: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

// スケジュール作成
export async function createSchedule(
  scheduleData: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')
    
    // 既存のアクティブスケジュールを非アクティブにする
    if (scheduleData.isActive) {
      await deactivateAllSchedules(scheduleData.userId)
    }
    
    const docRef = await addDoc(collection(db, 'schedules'), {
      ...scheduleData,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    return docRef.id
  } catch (error) {
    console.error('Error creating schedule:', error)
    throw error
  }
}

// アクティブなスケジュールを取得
export async function getActiveSchedule(userId: string): Promise<Schedule | null> {
  try {
    const q = query(
      collection(db, 'schedules'),
      where('userId', '==', userId),
      where('isActive', '==', true),
      limit(1)
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }
    
    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data()
    } as Schedule
  } catch (error) {
    console.error('Error getting active schedule:', error)
    return null
  }
}

// すべてのスケジュールを非アクティブにする
async function deactivateAllSchedules(userId: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'schedules'),
      where('userId', '==', userId),
      where('isActive', '==', true)
    )
    
    const snapshot = await getDocs(q)
    const batch = writeBatch(db)
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        isActive: false,
        updatedAt: serverTimestamp()
      })
    })
    
    await batch.commit()
  } catch (error) {
    console.error('Error deactivating schedules:', error)
    throw error
  }
}

// 月次スケジュールの状態をチェック
export async function checkMonthlyScheduleStatus(
  scheduleId: string,
  yearMonth: string
): Promise<MonthlySchedule | null> {
  try {
    const q = query(
      collection(db, 'monthlySchedules'),
      where('scheduleId', '==', scheduleId),
      where('yearMonth', '==', yearMonth),
      limit(1)
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }
    
    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data()
    } as MonthlySchedule
  } catch (error) {
    console.error('Error checking monthly schedule status:', error)
    throw error
  }
}

// 月次スケジュールを作成または更新
export async function createOrUpdateMonthlySchedule(
  scheduleData: Omit<MonthlySchedule, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    // 既存の月次スケジュールを確認
    const existing = await checkMonthlyScheduleStatus(
      scheduleData.scheduleId,
      scheduleData.yearMonth
    )
    
    if (existing && existing.id) {
      // 更新
      await updateDoc(doc(db, 'monthlySchedules', existing.id), {
        ...scheduleData,
        updatedAt: serverTimestamp()
      })
      return existing.id
    } else {
      // 新規作成
      const docRef = await addDoc(collection(db, 'monthlySchedules'), {
        ...scheduleData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return docRef.id
    }
  } catch (error) {
    console.error('Error creating/updating monthly schedule:', error)
    throw error
  }
}

// 日次タスクを取得
export async function getDailyTasksForDate(
  scheduleId: string,
  date: Date | string
): Promise<DailyTask | null> {
  try {
    // 日付の検証とフォーマット
    let dateStr: string
    if (typeof date === 'string') {
      const parsedDate = parseISO(date)
      if (!isValid(parsedDate)) {
        console.error('Invalid date string provided:', date)
        return null
      }
      dateStr = date
    } else {
      if (!isValid(date)) {
        console.error('Invalid date provided:', date)
        return null
      }
      dateStr = format(date, 'yyyy-MM-dd')
    }
    
    const q = query(
      collection(db, 'dailyTasks'),
      where('scheduleId', '==', scheduleId),
      where('date', '==', dateStr),
      limit(1)
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }
    
    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data()
    } as DailyTask
  } catch (error) {
    console.error('Error getting daily tasks:', error)
    return null
  }
}

// 日次タスクを作成または更新
export async function createOrUpdateDailyTasks(
  taskData: Omit<DailyTask, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    // 既存のタスクを確認
    const existing = await getDailyTasksForDate(taskData.scheduleId, taskData.date)
    
    if (existing && existing.id) {
      // 更新
      await updateDoc(doc(db, 'dailyTasks', existing.id), {
        ...taskData,
        updatedAt: serverTimestamp()
      })
      return existing.id
    } else {
      // 新規作成
      const docRef = await addDoc(collection(db, 'dailyTasks'), {
        ...taskData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return docRef.id
    }
  } catch (error) {
    console.error('Error creating/updating daily tasks:', error)
    throw error
  }
}

// 月間目標を取得
export async function getMonthlyGoals(
  scheduleId: string,
  year: number,
  month: number
): Promise<MonthlyGoal | null> {
  try {
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`
    
    const q = query(
      collection(db, 'monthlyGoals'),
      where('scheduleId', '==', scheduleId),
      where('yearMonth', '==', yearMonth),
      limit(1)
    )
    
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return null
    }
    
    const doc = snapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data()
    } as MonthlyGoal
  } catch (error) {
    console.error('Error getting monthly goals:', error)
    return null
  }
}

// 月間目標を作成または更新
export async function createOrUpdateMonthlyGoal(
  goalData: Omit<MonthlyGoal, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    // 既存の目標を確認
    const existing = await getMonthlyGoals(
      goalData.scheduleId,
      goalData.year,
      goalData.month
    )
    
    if (existing && existing.id) {
      // 更新
      await updateDoc(doc(db, 'monthlyGoals', existing.id), {
        ...goalData,
        updatedAt: serverTimestamp()
      })
      return existing.id
    } else {
      // 新規作成
      const docRef = await addDoc(collection(db, 'monthlyGoals'), {
        ...goalData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      return docRef.id
    }
  } catch (error) {
    console.error('Error creating/updating monthly goal:', error)
    throw error
  }
}

// スケジュールの統計情報を取得
export async function getScheduleStatistics(scheduleId: string): Promise<{
  totalPlannedHours: number
  totalCompletedHours: number
  completionRate: number
  remainingDays: number
  averageHoursPerDay: number
}> {
  try {
    const schedule = await getDoc(doc(db, 'schedules', scheduleId))
    if (!schedule.exists()) {
      throw new Error('Schedule not found')
    }
    
    const scheduleData = schedule.data() as Schedule
    const now = new Date()
    const targetDate = scheduleData.targetDate instanceof Timestamp 
      ? scheduleData.targetDate.toDate() 
      : scheduleData.targetDate
    
    const remainingDays = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    
    // 月次スケジュールから完了時間を集計
    const monthlySchedulesQuery = query(
      collection(db, 'monthlySchedules'),
      where('scheduleId', '==', scheduleId)
    )
    
    const monthlySnapshot = await getDocs(monthlySchedulesQuery)
    let totalCompletedHours = 0
    
    monthlySnapshot.forEach(doc => {
      const data = doc.data() as MonthlySchedule
      totalCompletedHours += data.completedHours || 0
    })
    
    const completionRate = scheduleData.totalTargetHours > 0 
      ? (totalCompletedHours / scheduleData.totalTargetHours) * 100 
      : 0
    
    const averageHoursPerDay = remainingDays > 0 
      ? (scheduleData.totalTargetHours - totalCompletedHours) / remainingDays 
      : 0
    
    return {
      totalPlannedHours: scheduleData.totalTargetHours,
      totalCompletedHours,
      completionRate,
      remainingDays,
      averageHoursPerDay
    }
  } catch (error) {
    console.error('Error getting schedule statistics:', error)
    throw error
  }
}

// ========== 問題関連 ==========

export interface Problem {
  id?: string
  userId: string
  title: string
  subject: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  type: string
  question: string
  options?: string[]
  answer: string | string[]
  explanation: string
  hints?: string[]
  canvasConfig?: any
  estimatedTime?: number
  scoringCriteria?: string
  keywords?: string[]
  tags?: string[]
  isPublic?: boolean
  status?: 'draft' | 'published'
  gradeLevel?: number
  targetDeviation?: number
  createdAt?: Timestamp
  updatedAt?: Timestamp
  unit: string
  createdBy?: string
}

// 問題を保存
export async function saveProblem(
  problemData: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>, 
  userId: string
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'problems'), {
      ...problemData,
      userId,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: problemData.status || 'draft',
      isPublic: problemData.isPublic || false
    })
    
    // ユーザーの問題作成履歴を更新
    await updateUserProblemStats(userId)
    
    return docRef.id
  } catch (error) {
    console.error('Error saving problem:', error)
    throw error
  }
}

// ユーザーの問題一覧を取得
export async function getUserProblems(
  userId: string,
  options?: {
    limitCount?: number
    status?: 'draft' | 'published'
    subject?: string
    startAfter?: any
  }
): Promise<Problem[]> {
  try {
    const constraints = []
    
    constraints.push(where('userId', '==', userId))
    
    if (options?.status) {
      constraints.push(where('status', '==', options.status))
    }
    
    if (options?.subject) {
      constraints.push(where('subject', '==', options.subject))
    }
    
    constraints.push(orderBy('createdAt', 'desc'))
    
    if (options?.limitCount) {
      constraints.push(limit(options.limitCount))
    }
    
    const q = query(collection(db, 'problems'), ...constraints)
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Problem))
  } catch (error) {
    console.error('Error getting user problems:', error)
    return []
  }
}

// 特定の問題を取得
export async function getProblem(problemId: string): Promise<Problem | null> {
  try {
    const docRef = doc(db, 'problems', problemId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Problem
    }
    return null
  } catch (error) {
    console.error('Error getting problem:', error)
    return null
  }
}

// 問題を更新
export async function updateProblem(
  problemId: string,
  updates: Partial<Problem>
): Promise<void> {
  try {
    const { id, createdAt, ...updateData } = updates
    await updateDoc(doc(db, 'problems', problemId), {
      ...updateData,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating problem:', error)
    throw error
  }
}

// 問題を削除
export async function deleteProblem(problemId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'problems', problemId))
  } catch (error) {
    console.error('Error deleting problem:', error)
    throw error
  }
}

// 問題の検索
export async function searchProblems(options: {
  subjects?: string[]
  topics?: string[]
  difficulty?: string
  type?: string
  keywords?: string[]
  limitCount?: number
  isPublic?: boolean
}): Promise<Problem[]> {
  try {
    const constraints = []
    
    if (options.isPublic !== undefined) {
      constraints.push(where('isPublic', '==', options.isPublic))
    }
    
    if (options.subjects && options.subjects.length > 0) {
      constraints.push(where('subject', 'in', options.subjects))
    }
    
    if (options.difficulty) {
      constraints.push(where('difficulty', '==', options.difficulty))
    }
    
    if (options.type) {
      constraints.push(where('type', '==', options.type))
    }
    
    constraints.push(orderBy('createdAt', 'desc'))
    
    if (options.limitCount) {
      constraints.push(limit(options.limitCount))
    }
    
    const q = query(collection(db, 'problems'), ...constraints)
    const snapshot = await getDocs(q)
    
    let problems = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Problem))
    
    // クライアントサイドでのフィルタリング
    if (options.topics && options.topics.length > 0) {
      problems = problems.filter(p => options.topics!.includes(p.topic))
    }
    
    if (options.keywords && options.keywords.length > 0) {
      problems = problems.filter(p => {
        const problemText = `${p.question} ${p.explanation}`.toLowerCase()
        return options.keywords!.some(keyword => 
          problemText.includes(keyword.toLowerCase())
        )
      })
    }
    
    return problems
  } catch (error) {
    console.error('Error searching problems:', error)
    return []
  }
}

// 問題を取得する関数
export async function getProblems(options: {
  subjects?: string[]
  limit?: number
  difficulty?: string
  excludeIds?: string[]
  gradeLevel?: number
  units?: string[]
}): Promise<Problem[]> {
  try {
    const problemsRef = collection(db, 'problems')
    const constraints = []
    
    // 制限をかける（最初に設定）
    if (options.limit) {
      constraints.push(limit(options.limit))
    }
    
    // Firestoreのin演算子は最大10個までなので、分割して取得
    let allProblems: Problem[] = []
    
    if (options.subjects && options.subjects.length > 0) {
      // 科目を10個ずつのチャンクに分割
      const subjectChunks = []
      for (let i = 0; i < options.subjects.length; i += 10) {
        subjectChunks.push(options.subjects.slice(i, i + 10))
      }
      
      // 各チャンクごとにクエリを実行
      for (const chunk of subjectChunks) {
        const chunkConstraints = [...constraints]
        chunkConstraints.push(where('subject', 'in', chunk))
        
        if (options.difficulty) {
          chunkConstraints.push(where('difficulty', '==', options.difficulty))
        }
        
        if (options.gradeLevel) {
          chunkConstraints.push(where('gradeLevel', '==', options.gradeLevel))
        }
        
        const q = query(problemsRef, ...chunkConstraints)
        const snapshot = await getDocs(q)
        
        const problems = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Problem))
        
        allProblems = [...allProblems, ...problems]
      }
    } else {
      // 科目の指定がない場合
      if (options.difficulty) {
        constraints.push(where('difficulty', '==', options.difficulty))
      }
      
      if (options.gradeLevel) {
        constraints.push(where('gradeLevel', '==', options.gradeLevel))
      }
      
      const q = query(problemsRef, ...constraints)
      const snapshot = await getDocs(q)
      
      allProblems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Problem))
    }
    
    // 除外IDがある場合はフィルタリング
    if (options.excludeIds && options.excludeIds.length > 0) {
      allProblems = allProblems.filter(p => p.id && !options.excludeIds!.includes(p.id))
    }
    
    // 単元でフィルタリング（クライアントサイド）
    if (options.units && options.units.length > 0) {
      allProblems = allProblems.filter(p => options.units!.includes(p.unit))
    }
    
    // ランダムに並び替えて制限数まで返す
    const shuffled = allProblems.sort(() => 0.5 - Math.random())
    return options.limit ? shuffled.slice(0, options.limit) : shuffled
  } catch (error) {
    console.error('Error getting problems:', error)
    return []
  }
}

// ユーザーの問題作成統計を更新
async function updateUserProblemStats(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      'stats.totalProblemsCreated': increment(1),
      'stats.lastProblemCreatedAt': serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating user problem stats:', error)
  }
}

// 問題に対する評価を保存
export async function rateProblem(
  problemId: string,
  rating: {
    difficulty: number // 1-5
    quality: number // 1-5
    helpful: boolean
  }
): Promise<void> {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')
    
    await setDoc(
      doc(db, 'problems', problemId, 'ratings', user.uid),
      {
        ...rating,
        userId: user.uid,
        createdAt: serverTimestamp()
      }
    )
    
    // 問題の平均評価を更新
    await updateProblemAverageRating(problemId)
  } catch (error) {
    console.error('Error rating problem:', error)
    throw error
  }
}

// 問題の平均評価を更新
async function updateProblemAverageRating(problemId: string): Promise<void> {
  try {
    const ratingsSnapshot = await getDocs(
      collection(db, 'problems', problemId, 'ratings')
    )
    
    if (ratingsSnapshot.empty) return
    
    let totalDifficulty = 0
    let totalQuality = 0
    let helpfulCount = 0
    const count = ratingsSnapshot.size
    
    ratingsSnapshot.forEach(doc => {
      const data = doc.data()
      totalDifficulty += data.difficulty || 0
      totalQuality += data.quality || 0
      if (data.helpful) helpfulCount++
    })
    
    await updateDoc(doc(db, 'problems', problemId), {
      'ratings.averageDifficulty': totalDifficulty / count,
      'ratings.averageQuality': totalQuality / count,
      'ratings.helpfulPercentage': (helpfulCount / count) * 100,
      'ratings.count': count,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating problem average rating:', error)
  }
}

// ========== 問題演習結果関連 ==========

export interface QuizResult {
  id?: string
  userId: string
  problemId: string
  subject: string
  unit: string
  topic?: string
  difficulty: 'easy' | 'medium' | 'hard'
  isCorrect: boolean
  userAnswer: string | string[]
  correctAnswer?: string | string[]
  timeSpent: number // 秒単位
  attemptNumber?: number
  sessionId?: string // タイマーセッションとの関連付け（オプション）
  hint_used?: boolean
  createdAt?: Timestamp
}

// 単一の問題演習結果を保存
export async function saveQuizResult(
  result: Omit<QuizResult, 'id' | 'createdAt' | 'userId'>
): Promise<string> {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')
    
    const docRef = await addDoc(collection(db, 'quizResults'), {
      ...result,
      userId: user.uid,
      createdAt: serverTimestamp()
    })
    
    // ユーザーの統計を更新
    await updateUserQuizStats(user.uid, result.isCorrect)
    
    return docRef.id
  } catch (error) {
    console.error('Error saving quiz result:', error)
    throw error
  }
}

// 複数の問題演習結果を一括保存（セッション終了時など）
export async function saveQuizResultsBatch(
  results: Array<Omit<QuizResult, 'id' | 'createdAt' | 'userId'>>
): Promise<void> {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')
    
    const batch = writeBatch(db)
    
    results.forEach(result => {
      const docRef = doc(collection(db, 'quizResults'))
      batch.set(docRef, {
        ...result,
        userId: user.uid,
        createdAt: serverTimestamp()
      })
    })
    
    await batch.commit()
    
    // 統計を一括更新
    const correctCount = results.filter(r => r.isCorrect).length
    await updateUserQuizStats(user.uid, correctCount, results.length)
  } catch (error) {
    console.error('Error saving quiz results batch:', error)
    throw error
  }
}

// 問題演習結果を取得（分析用）
export async function getQuizResults(
  userId: string,
  options?: {
    subject?: string
    unit?: string
    startDate?: Date
    endDate?: Date
    limitCount?: number
    sessionId?: string
  }
): Promise<QuizResult[]> {
  try {
    const constraints = []
    
    constraints.push(where('userId', '==', userId))
    
    if (options?.subject) {
      constraints.push(where('subject', '==', options.subject))
    }
    
    if (options?.unit) {
      constraints.push(where('unit', '==', options.unit))
    }
    
    if (options?.sessionId) {
      constraints.push(where('sessionId', '==', options.sessionId))
    }
    
    if (options?.startDate) {
      constraints.push(where('createdAt', '>=', Timestamp.fromDate(options.startDate)))
    }
    
    if (options?.endDate) {
      constraints.push(where('createdAt', '<=', Timestamp.fromDate(options.endDate)))
    }
    
    constraints.push(orderBy('createdAt', 'desc'))
    
    if (options?.limitCount) {
      constraints.push(limit(options.limitCount))
    }
    
    const q = query(collection(db, 'quizResults'), ...constraints)
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    } as QuizResult))
  } catch (error) {
    console.error('Error getting quiz results:', error)
    return []
  }
}

// ユーザーの問題演習統計を更新（軽量版）
async function updateUserQuizStats(
  userId: string, 
  correctCount: number | boolean,
  totalCount?: number
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId)
    
    if (typeof correctCount === 'boolean') {
      // 単一の結果
      await updateDoc(userRef, {
        'stats.totalQuestions': increment(1),
        'stats.correctAnswers': correctCount ? increment(1) : increment(0),
        'stats.lastQuizAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    } else {
      // バッチ結果
      await updateDoc(userRef, {
        'stats.totalQuestions': increment(totalCount || 0),
        'stats.correctAnswers': increment(correctCount),
        'stats.lastQuizAt': serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    }
  } catch (error) {
    console.error('Error updating user quiz stats:', error)
    // エラーが発生しても続行（統計更新は必須ではない）
  }
}

// ========== 小論文テーマ関連 ==========

// テーマを保存
export async function saveEssayTheme(theme: Omit<EssayTheme, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'essayThemes'), {
      ...theme,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('Error saving essay theme:', error)
    throw error
  }
}

// テーマ一覧を取得
export async function getEssayThemes(options?: {
  category?: string
  faculty?: string
  limitCount?: number
  type?: string
  hasGraph?: boolean
}): Promise<EssayTheme[]> {
  try {
    const constraints = []
    
    // デフォルトのソート順（作成日時の降順）
    constraints.push(orderBy('createdAt', 'desc'))
    
    // カテゴリーでフィルタ
    if (options?.category) {
      constraints.push(where('category', '==', options.category))
    }
    
    // 学部でフィルタ
    if (options?.faculty) {
      constraints.push(where('faculties', 'array-contains', options.faculty))
    }
    
    // タイプでフィルタ
    if (options?.type) {
      constraints.push(where('type', '==', options.type))
    }
    
    // グラフ問題でフィルタ
    if (options?.hasGraph !== undefined) {
      constraints.push(where('hasGraph', '==', options.hasGraph))
    }
    
    // 取得数制限
    if (options?.limitCount) {
      constraints.push(limit(options.limitCount))
    }
    
    const q = query(collection(db, 'essayThemes'), ...constraints)
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as EssayTheme))
  } catch (error) {
    console.error('Error getting essay themes:', error)
    return []
  }
}

// 特定のテーマを取得
export async function getEssayTheme(themeId: string): Promise<EssayTheme | null> {
  try {
    const docRef = doc(db, 'essayThemes', themeId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as EssayTheme
    }
    return null
  } catch (error) {
    console.error('Error getting essay theme:', error)
    return null
  }
}

// テーマを更新
export async function updateEssayTheme(
  themeId: string,
  updates: Partial<EssayTheme>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'essayThemes', themeId), {
      ...updates,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating essay theme:', error)
    throw error
  }
}

// テーマを削除
export async function deleteEssayTheme(themeId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'essayThemes', themeId))
  } catch (error) {
    console.error('Error deleting essay theme:', error)
    throw error
  }
}

// ========== 小論文提出関連 ==========

// 下書きを保存（上書き）
export async function saveEssayDraft(submission: Omit<EssaySubmission, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')
    
    // ユーザーごと、テーマごとに1つの下書きのみ保持
    const draftId = `${user.uid}_${submission.themeId}_draft`
    const draftRef = doc(db, 'essaySubmissions', draftId)
    
    await setDoc(draftRef, {
      ...submission,
      userId: user.uid,
      isDraft: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true })
    
    return draftId
  } catch (error) {
    console.error('Error saving essay draft:', error)
    throw error
  }
}

// 小論文を提出
export async function submitEssay(submission: Omit<EssaySubmission, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('User not authenticated')
    
    const docRef = await addDoc(collection(db, 'essaySubmissions'), {
      ...submission,
      userId: user.uid,
      isDraft: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    
    // 下書きを削除（エラーは無視）
    const draftId = `${user.uid}_${submission.themeId}_draft`
    try {
      await deleteDoc(doc(db, 'essaySubmissions', draftId))
    } catch (error) {
      console.log('Draft deletion failed:', error)
    }
    
    return docRef.id
  } catch (error) {
    console.error('Error submitting essay:', error)
    throw error
  }
}

// 提出履歴を取得
export async function getEssaySubmissions(options?: {
  userId?: string
  themeId?: string
  isDraft?: boolean
  limitCount?: number
}): Promise<EssaySubmission[]> {
  try {
    const user = auth.currentUser
    const userId = options?.userId || user?.uid
    
    if (!userId) throw new Error('User ID required')
    
    const constraints = []
    
    constraints.push(where('userId', '==', userId))
    
    if (options?.themeId) {
      constraints.push(where('themeId', '==', options.themeId))
    }
    
    if (options?.isDraft !== undefined) {
      constraints.push(where('isDraft', '==', options.isDraft))
    }
    
    constraints.push(orderBy('createdAt', 'desc'))
    
    if (options?.limitCount) {
      constraints.push(limit(options.limitCount))
    }
    
    const q = query(collection(db, 'essaySubmissions'), ...constraints)
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as EssaySubmission))
  } catch (error) {
    console.error('Error getting essay submissions:', error)
    return []
  }
}

// 特定の提出を取得
export async function getEssaySubmission(submissionId: string): Promise<EssaySubmission | null> {
  try {
    const docRef = doc(db, 'essaySubmissions', submissionId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as EssaySubmission
    }
    return null
  } catch (error) {
    console.error('Error getting essay submission:', error)
    return null
  }
}

// 評価を更新
export async function updateEssayEvaluation(
  submissionId: string,
  evaluation: EssayEvaluation
): Promise<void> {
  try {
    await updateDoc(doc(db, 'essaySubmissions', submissionId), {
      evaluationScore: evaluation.score,
      evaluationDetails: evaluation,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating essay evaluation:', error)
    throw error
  }
}

// 小論文統計を取得
export async function getEssayStatistics(userId?: string): Promise<{
  totalSubmissions: number
  averageScore: number
  submissionsByCategory: { [key: string]: number }
  recentSubmissions: EssaySubmission[]
}> {
  try {
    const user = auth.currentUser
    const targetUserId = userId || user?.uid
    
    if (!targetUserId) throw new Error('User ID required')
    
    const submissions = await getEssaySubmissions({
      userId: targetUserId,
      isDraft: false
    })
    
    // 統計計算
    const totalSubmissions = submissions.length
    const scores = submissions
      .filter(s => s.evaluationScore)
      .map(s => s.evaluationScore!)
    const averageScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0
    
    // カテゴリー別集計
    const submissionsByCategory: { [key: string]: number } = {}
    for (const submission of submissions) {
      if (submission.theme?.category) {
        const category = submission.theme.category
        submissionsByCategory[category] = (submissionsByCategory[category] || 0) + 1
      }
    }
    
    // 最近の提出（最大5件）
    const recentSubmissions = submissions.slice(0, 5)
    
    return {
      totalSubmissions,
      averageScore,
      submissionsByCategory,
      recentSubmissions
    }
  } catch (error) {
    console.error('Error getting essay statistics:', error)
    return {
      totalSubmissions: 0,
      averageScore: 0,
      submissionsByCategory: {},
      recentSubmissions: []
    }
  }
}

// ========== タイマー関連（拡張版） ==========

export interface TimerSession {
  id?: string
  userId: string
  subjectId: string
  unitId: string
  startTime: Timestamp
  endTime?: Timestamp
  elapsedSeconds: number
  breaks: number
  isPaused: boolean
  pausedAt?: Timestamp
  pauseCount: number  // 新規追加: 一時停止回数
  content?: StudyContent
  feedback?: StudyFeedback
  focusScore: number
  
  // タイマーモード関連（新規追加）
  timerMode: TimerMode
  timerSettings?: {
    // カウントダウンモード用
    countdownMinutes?: number
    targetSeconds?: number
    
    // ポモドーロモード用
    pomodoroState?: PomodoroState
    pomodoroSessions?: number
    workDuration?: number      // デフォルト: 25分
    breakDuration?: number     // デフォルト: 5分
    longBreakDuration?: number // デフォルト: 15分
    sessionsUntilLongBreak?: number // デフォルト: 4
  }
  
  // 追加の統計情報
  statistics?: {
    totalPauseTime?: number  // 総一時停止時間
    averageFocusTime?: number // 平均集中時間
    longestFocusStreak?: number // 最長集中時間
  }
}

export interface StudyContent {
  mainTheme: string
  subTopics: string[]
  materials: string[]
  goals: string[]
}

export interface StudyFeedback {
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

// タイマー開始（基本）- 後方互換性のため維持
export async function startTimerSession(subjectId: string, unitId: string) {
  return startTimerSessionWithContent(subjectId, unitId, {
    mainTheme: '学習内容未設定',
    subTopics: [],
    materials: [],
    goals: []
  })
}

// タイマー開始（学習内容付き）- 拡張版
export async function startTimerSessionWithContent(
  subjectId: string, 
  unitId: string, 
  content: StudyContent,
  timerMode: TimerMode = 'countup',
  timerSettings?: TimerSession['timerSettings']
) {
  try {
    const user = auth.currentUser
    if (!user) throw new Error('認証が必要です')

    const sessionData: Omit<TimerSession, 'id'> = {
      userId: user.uid,
      subjectId,
      unitId,
      startTime: serverTimestamp() as Timestamp,
      elapsedSeconds: 0,
      breaks: 0,
      isPaused: false,
      focusScore: 100,
      pauseCount: 0,
      content,
      timerMode,
      timerSettings: timerSettings || {}
    }

    const docRef = await addDoc(collection(db, 'timerSessions'), sessionData)
    
    // ストリーク更新
    await updateUserStreak(user.uid)
    
    return { success: true, sessionId: docRef.id }
  } catch (error) {
    console.error('タイマー開始エラー:', error)
    return { success: false, error }
  }
}

// タイマー終了（基本）- 後方互換性のため維持
export async function endTimerSession(sessionId: string, elapsedSeconds: number) {
  try {
    await updateDoc(doc(db, 'timerSessions', sessionId), {
      endTime: serverTimestamp(),
      elapsedSeconds,
      updatedAt: serverTimestamp()
    })
    
    // セッション情報を取得
    const sessionDoc = await getDoc(doc(db, 'timerSessions', sessionId))
    if (sessionDoc.exists()) {
      const sessionData = sessionDoc.data()
      await updateUserStudyStats(sessionData.userId, elapsedSeconds)
    }
    
    return { success: true }
  } catch (error) {
    console.error('タイマー終了エラー:', error)
    return { success: false, error }
  }
}

// タイマー終了（フィードバック付き）
export async function endTimerSessionWithFeedback(
  sessionId: string, 
  elapsedSeconds: number,
  feedback: StudyFeedback
) {
  try {
    // セッション情報を取得
    const sessionDoc = await getDoc(doc(db, 'timerSessions', sessionId))
    if (!sessionDoc.exists()) {
      throw new Error('セッションが見つかりません')
    }
    
    const sessionData = sessionDoc.data() as TimerSession
    
    // フォーカススコアを計算
    const focusScore = calculateFocusScore(
      elapsedSeconds, 
      sessionData.breaks || 0,
      sessionData.pauseCount || 0,
      sessionData.timerMode
    )
    
    await updateDoc(doc(db, 'timerSessions', sessionId), {
      endTime: serverTimestamp(),
      elapsedSeconds,
      feedback,
      focusScore,
      updatedAt: serverTimestamp()
    })
    
    // ユーザーの学習統計を更新
    await updateUserStudyStats(sessionData.userId, elapsedSeconds)
    
    return { success: true }
  } catch (error) {
    console.error('タイマー終了エラー:', error)
    return { success: false, error }
  }
}

// 一時停止/再開（拡張版）
export async function toggleTimerPause(sessionId: string) {
  try {
    const sessionDoc = await getDoc(doc(db, 'timerSessions', sessionId))
    if (!sessionDoc.exists()) throw new Error('セッションが見つかりません')
    
    const currentData = sessionDoc.data() as TimerSession
    const isPaused = !currentData.isPaused
    const pauseCount = currentData.pauseCount || 0
    
    const updateData: any = {
      isPaused,
      updatedAt: serverTimestamp()
    }
    
    if (isPaused) {
      updateData.pausedAt = serverTimestamp()
      updateData.pauseCount = pauseCount + 1  // 一時停止回数をカウント
    } else {
      updateData.pausedAt = null
      
      // 一時停止時間を統計に追加
      if (currentData.pausedAt && currentData.statistics) {
        const pauseDuration = Date.now() - currentData.pausedAt.toDate().getTime()
        updateData['statistics.totalPauseTime'] = increment(pauseDuration / 1000)
      }
    }
    
    await updateDoc(doc(db, 'timerSessions', sessionId), updateData)
    
    return { success: true, isPaused, pauseCount: updateData.pauseCount }
  } catch (error) {
    console.error('一時停止切り替えエラー:', error)
    return { success: false, error }
  }
}

// 休憩記録
export async function recordBreak(sessionId: string) {
  try {
    const sessionDoc = await getDoc(doc(db, 'timerSessions', sessionId))
    if (!sessionDoc.exists()) throw new Error('セッションが見つかりません')
    
    const currentBreaks = sessionDoc.data().breaks || 0
    
    await updateDoc(doc(db, 'timerSessions', sessionId), {
      breaks: currentBreaks + 1,
      updatedAt: serverTimestamp()
    })
    
    return { success: true }
  } catch (error) {
    console.error('休憩記録エラー:', error)
    return { success: false, error }
  }
}

// 学習内容更新
export async function updateStudyContent(sessionId: string, content: StudyContent) {
  try {
    await updateDoc(doc(db, 'timerSessions', sessionId), {
      content,
      updatedAt: serverTimestamp()
    })
    
    return { success: true }
  } catch (error) {
    console.error('学習内容更新エラー:', error)
    return { success: false, error }
  }
}

// フィードバック送信
export async function submitStudyFeedback(sessionId: string, feedback: StudyFeedback) {
  try {
    await updateDoc(doc(db, 'timerSessions', sessionId), {
      feedback,
      updatedAt: serverTimestamp()
    })
    
    return { success: true }
  } catch (error) {
    console.error('フィードバック送信エラー:', error)
    return { success: false, error }
  }
}

// ポモドーロセッション完了時の更新
export async function updatePomodoroSession(
  sessionId: string, 
  newState: PomodoroState,
  sessionsCompleted: number
) {
  try {
    await updateDoc(doc(db, 'timerSessions', sessionId), {
      'timerSettings.pomodoroState': newState,
      'timerSettings.pomodoroSessions': sessionsCompleted,
      updatedAt: serverTimestamp()
    })
    
    return { success: true }
  } catch (error) {
    console.error('ポモドーロセッション更新エラー:', error)
    return { success: false, error }
  }
}

// アクティブタイマーの監視
export function subscribeToActiveTimer(callback: (timer: TimerSession | null) => void) {
  const user = auth.currentUser
  if (!user) {
    callback(null)
    return () => {}
  }

  const q = query(
    collection(db, 'timerSessions'),
    where('userId', '==', user.uid),
    where('endTime', '==', null),
    orderBy('startTime', 'desc'),
    limit(1)
  )

  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null)
    } else {
      const doc = snapshot.docs[0]
      callback({
        id: doc.id,
        ...doc.data()
      } as TimerSession)
    }
  })
}

// 最近のタイマーセッション取得
export async function getRecentTimerSessions(userId: string, limitCount: number = 10) {
  try {
    const q = query(
      collection(db, 'timerSessions'),
      where('userId', '==', userId),
      where('endTime', '!=', null),
      orderBy('endTime', 'desc'),
      limit(limitCount)
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TimerSession))
  } catch (error) {
    console.error('タイマーセッション取得エラー:', error)
    return []
  }
}

// タイマーモード別の統計取得
export async function getTimerStatisticsByMode(
  userId: string,
  mode?: TimerMode
): Promise<{
  countup: { sessions: number; totalTime: number; avgTime: number }
  countdown: { sessions: number; totalTime: number; avgTime: number; completionRate: number }
  pomodoro: { sessions: number; totalSessions: number; avgSessionsPerStudy: number }
}> {
  try {
    const constraints = [
      where('userId', '==', userId),
      where('endTime', '!=', null)
    ]
    
    if (mode) {
      constraints.push(where('timerMode', '==', mode))
    }
    
    const q = query(collection(db, 'timerSessions'), ...constraints)
    const snapshot = await getDocs(q)
    
    const stats = {
      countup: { sessions: 0, totalTime: 0, avgTime: 0 },
      countdown: { sessions: 0, totalTime: 0, avgTime: 0, completionRate: 0 },
      pomodoro: { sessions: 0, totalSessions: 0, avgSessionsPerStudy: 0 }
    }
    
    let countdownCompleted = 0
    
    snapshot.forEach(doc => {
      const data = doc.data() as TimerSession
      const mode = data.timerMode || 'countup'
      
      if (mode === 'countup') {
        stats.countup.sessions++
        stats.countup.totalTime += data.elapsedSeconds
      } else if (mode === 'countdown') {
        stats.countdown.sessions++
        stats.countdown.totalTime += data.elapsedSeconds
        
        // 目標時間に達したかチェック
        if (data.timerSettings?.targetSeconds && 
            data.elapsedSeconds >= data.timerSettings.targetSeconds * 0.95) {
          countdownCompleted++
        }
      } else if (mode === 'pomodoro') {
        stats.pomodoro.sessions++
        stats.pomodoro.totalSessions += data.timerSettings?.pomodoroSessions || 0
      }
    })
    
    // 平均値計算
    if (stats.countup.sessions > 0) {
      stats.countup.avgTime = Math.round(stats.countup.totalTime / stats.countup.sessions)
    }
    
    if (stats.countdown.sessions > 0) {
      stats.countdown.avgTime = Math.round(stats.countdown.totalTime / stats.countdown.sessions)
      stats.countdown.completionRate = Math.round((countdownCompleted / stats.countdown.sessions) * 100)
    }
    
    if (stats.pomodoro.sessions > 0) {
      stats.pomodoro.avgSessionsPerStudy = Math.round(stats.pomodoro.totalSessions / stats.pomodoro.sessions)
    }
    
    return stats
  } catch (error) {
    console.error('Error getting timer statistics by mode:', error)
    return {
      countup: { sessions: 0, totalTime: 0, avgTime: 0 },
      countdown: { sessions: 0, totalTime: 0, avgTime: 0, completionRate: 0 },
      pomodoro: { sessions: 0, totalSessions: 0, avgSessionsPerStudy: 0 }
    }
  }
}

// 最適なタイマーモードの提案
export async function suggestOptimalTimerMode(userId: string): Promise<{
  recommendedMode: TimerMode
  reason: string
  stats: any
}> {
  try {
    const stats = await getTimerStatisticsByMode(userId)
    
    // 各モードのスコアを計算
    const scores = {
      countup: 0,
      countdown: 0,
      pomodoro: 0
    }
    
    // カウントアップ: 長時間集中できる場合に適している
    if (stats.countup.avgTime > 3600) { // 平均1時間以上
      scores.countup += 3
    }
    
    // カウントダウン: 完了率が高い場合に適している
    if (stats.countdown.completionRate > 80) {
      scores.countdown += 3
    }
    
    // ポモドーロ: 複数セッションこなせる場合に適している
    if (stats.pomodoro.avgSessionsPerStudy >= 4) {
      scores.pomodoro += 3
    }
    
    // 最もスコアが高いモードを推奨
    const recommendedMode = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)[0][0] as TimerMode
    
    const reasons = {
      countup: '長時間集中して学習できるあなたには、カウントアップモードがおすすめです。',
      countdown: '目標達成率が高いあなたには、カウントダウンモードがおすすめです。',
      pomodoro: '効率的に休憩を取りながら学習できるあなたには、ポモドーロモードがおすすめです。'
    }
    
    return {
      recommendedMode,
      reason: reasons[recommendedMode],
      stats
    }
  } catch (error) {
    console.error('Error suggesting optimal timer mode:', error)
    return {
      recommendedMode: 'countup',
      reason: 'デフォルトのカウントアップモードから始めてみましょう。',
      stats: null
    }
  }
}

// ========== 模試結果関連 ==========

export interface MockExamResult {
  id?: string
  examDate: Timestamp
  examProvider: string
  examName: string
  examType: 'comprehensive' | 'subject_specific'
  totalScore: number
  totalMaxScore: number
  deviation: number
  nationalRank: number
  totalParticipants: number
  subjectResults: SubjectResult[]
  universityAssessments?: UniversityAssessment[]
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface SubjectResult {
  subject: string
  score: number
  maxScore: number
  deviation: number
  rank?: number
}

export interface UniversityAssessment {
  universityName: string
  department: string
  assessment: 'A' | 'B' | 'C' | 'D' | 'E'
  probability: number
}

// 模試結果を保存
export async function saveMockExamResult(data: Omit<MockExamResult, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated')
  
  try {
    const docRef = await addDoc(collection(db, 'users', user.uid, 'mockExamResults'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error('Error saving mock exam result:', error)
    throw error
  }
}

// 模試結果一覧を取得
export async function getMockExamResults(): Promise<MockExamResult[]> {
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated')
  
  try {
    const q = query(
      collection(db, 'users', user.uid, 'mockExamResults'),
      orderBy('examDate', 'desc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MockExamResult))
  } catch (error) {
    console.error('Error getting mock exam results:', error)
    throw error
  }
}

// 期間指定で模試結果を取得
export async function getMockExamResultsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<MockExamResult[]> {
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated')
  
  try {
    const q = query(
      collection(db, 'users', user.uid, 'mockExamResults'),
      where('examDate', '>=', Timestamp.fromDate(startDate)),
      where('examDate', '<=', Timestamp.fromDate(endDate)),
      orderBy('examDate', 'desc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MockExamResult))
  } catch (error) {
    console.error('Error getting mock exam results by date range:', error)
    throw error
  }
}

// 模試結果を削除
export async function deleteMockExamResult(resultId: string): Promise<void> {
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated')
  
  try {
    await deleteDoc(doc(db, 'users', user.uid, 'mockExamResults', resultId))
  } catch (error) {
    console.error('Error deleting mock exam result:', error)
    throw error
  }
}

// 模試結果を更新
export async function updateMockExamResult(
  resultId: string,
  data: Partial<MockExamResult>
): Promise<void> {
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated')
  
  try {
    await updateDoc(doc(db, 'users', user.uid, 'mockExamResults', resultId), {
      ...data,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating mock exam result:', error)
    throw error
  }
}

// 特定の模試結果を取得
export async function getMockExamResultById(resultId: string): Promise<MockExamResult | null> {
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated')
  
  try {
    const docRef = doc(db, 'users', user.uid, 'mockExamResults', resultId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as MockExamResult
    }
    return null
  } catch (error) {
    console.error('Error getting mock exam result:', error)
    throw error
  }
}

// 模試目標を保存
export async function saveMockExamGoals(goals: {
  deviation: number
  universityName: string
  department: string
}): Promise<void> {
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated')
  
  try {
    await setDoc(doc(db, 'users', user.uid, 'settings', 'mockExamGoals'), {
      ...goals,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error saving mock exam goals:', error)
    throw error
  }
}

// 模試目標を取得
export async function getMockExamGoals(): Promise<{
  deviation: number
  universityName: string
  department: string
} | null> {
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated')
  
  try {
    const docRef = doc(db, 'users', user.uid, 'settings', 'mockExamGoals')
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        deviation: data.deviation,
        universityName: data.universityName,
        department: data.department
      }
    }
    return null
  } catch (error) {
    console.error('Error getting mock exam goals:', error)
    throw error
  }
}

// 模試結果の統計情報を取得
export async function getMockExamStatistics(
  startDate?: Date,
  endDate?: Date
): Promise<{
  count: number
  averageDeviation: number
  maxDeviation: number
  minDeviation: number
  subjectStats: { [subject: string]: { average: number; count: number } }
}> {
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated')
  
  try {
    let q = query(
      collection(db, 'users', user.uid, 'mockExamResults'),
      orderBy('examDate', 'desc')
    )
    
    if (startDate && endDate) {
      q = query(
        collection(db, 'users', user.uid, 'mockExamResults'),
        where('examDate', '>=', Timestamp.fromDate(startDate)),
        where('examDate', '<=', Timestamp.fromDate(endDate)),
        orderBy('examDate', 'desc')
      )
    }
    
    const snapshot = await getDocs(q)
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MockExamResult))
    
    if (results.length === 0) {
      return {
        count: 0,
        averageDeviation: 0,
        maxDeviation: 0,
        minDeviation: 0,
        subjectStats: {}
      }
    }
    
    // 統計計算
    const deviations = results.map(r => r.deviation)
    const averageDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length
    const maxDeviation = Math.max(...deviations)
    const minDeviation = Math.min(...deviations)
    
    // 科目別統計
    const subjectStats: { [subject: string]: { total: number; count: number } } = {}
    
    results.forEach(result => {
      result.subjectResults.forEach(subject => {
        if (!subjectStats[subject.subject]) {
          subjectStats[subject.subject] = { total: 0, count: 0 }
        }
        subjectStats[subject.subject].total += subject.deviation
        subjectStats[subject.subject].count += 1
      })
    })
    
    const formattedSubjectStats = Object.entries(subjectStats).reduce(
      (acc, [subject, stats]) => ({
        ...acc,
        [subject]: {
          average: stats.total / stats.count,
          count: stats.count
        }
      }),
      {}
    )
    
    return {
      count: results.length,
      averageDeviation,
      maxDeviation,
      minDeviation,
      subjectStats: formattedSubjectStats
    }
  } catch (error) {
    console.error('Error getting mock exam statistics:', error)
    throw error
  }
}

// 成長率分析
export async function analyzeMockExamGrowth(
  months: number = 6
): Promise<{
  growthRate: number
  monthlyProgress: Array<{ month: string; average: number }>
}> {
  const user = auth.currentUser
  if (!user) throw new Error('User not authenticated')
  
  try {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)
    
    const results = await getMockExamResultsByDateRange(startDate, endDate)
    
    if (results.length < 2) {
      return { growthRate: 0, monthlyProgress: [] }
    }
    
    // 月別に集計
    const monthlyData: { [key: string]: number[] } = {}
    
    results.forEach(result => {
      const monthKey = format(result.examDate.toDate(), 'yyyy-MM')
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = []
      }
      monthlyData[monthKey].push(result.deviation)
    })
    
    // 月別平均を計算
    const monthlyProgress = Object.entries(monthlyData)
      .map(([month, deviations]) => ({
        month,
        average: deviations.reduce((a, b) => a + b, 0) / deviations.length
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
    
    // 成長率計算（最初と最後の月を比較）
    const firstMonthAvg = monthlyProgress[0]?.average || 0
    const lastMonthAvg = monthlyProgress[monthlyProgress.length - 1]?.average || 0
    const growthRate = firstMonthAvg > 0 
      ? ((lastMonthAvg - firstMonthAvg) / firstMonthAvg) * 100 
      : 0
    
    return { growthRate, monthlyProgress }
  } catch (error) {
    console.error('Error analyzing mock exam growth:', error)
    throw error
  }
}

// ========== サブスクリプション関連 ==========

// サブスクリプション状態を同期する関数
export async function syncSubscriptionStatus(
  userId: string,
  subscriptionData: {
    id: string;
    status: string;
    currentPeriodEnd?: number;
    cancelAtPeriodEnd?: boolean;
    stripePriceId?: string;
    stripeCustomerId?: string;
  }
) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      subscriptionStatus: subscriptionData.status === 'active' ? 'premium' : 'free',
      subscriptionId: subscriptionData.id,
      subscription: {
        ...subscriptionData,
        currentPeriodEnd: subscriptionData.currentPeriodEnd 
          ? new Date(subscriptionData.currentPeriodEnd * 1000) 
          : null,
        updatedAt: new Date()
      },
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error syncing subscription status:', error);
    throw error;
  }
}

// Stripeカスタマー情報を保存
export async function saveStripeCustomerId(
  userId: string, 
  customerId: string
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      stripeCustomerId: customerId,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving Stripe customer ID:', error);
    throw error;
  }
}

// ========== ヘルパー関数 ==========

// フォーカススコア計算（拡張版）
function calculateFocusScore(
  elapsedSeconds: number, 
  breaks: number,
  pauseCount: number = 0,
  timerMode: TimerMode = 'countup'
): number {
  const minutes = elapsedSeconds / 60
  let score = 100
  
  // タイマーモードによる調整
  if (timerMode === 'pomodoro') {
    // ポモドーロモードは休憩が前提なので減点なし
    return score
  }
  
  // 休憩回数による減点（適度な休憩は許容）
  const optimalBreaks = Math.floor(minutes / 60) // 1時間に1回が理想
  if (breaks > optimalBreaks) {
    score -= (breaks - optimalBreaks) * 5
  }
  
  // 一時停止回数による減点
  if (pauseCount > 2) {
    score -= (pauseCount - 2) * 3
  }
  
  // 短時間すぎる場合の減点（カウントダウンモードは除外）
  if (timerMode !== 'countdown' && minutes < 15) {
    score -= 20
  }
  
  return Math.max(0, Math.min(100, Math.round(score)))
}

// ユーザーの学習統計更新
async function updateUserStudyStats(userId: string, seconds: number) {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      'studyStats.totalStudyTime': increment(seconds),
      'studyStats.lastStudyDate': serverTimestamp(),
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('学習統計更新エラー:', error)
  }
}

// ストリーク更新
async function updateUserStreak(userId: string) {
  try {
    const userRef = doc(db, 'users', userId)
    const userDoc = await getDoc(userRef)
    
    if (!userDoc.exists()) return
    
    const userData = userDoc.data()
    const lastStudyDate = userData.studyStats?.lastStudyDate?.toDate()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let currentStreak = userData.studyStats?.currentStreak || 0
    
    if (lastStudyDate) {
      const lastStudy = new Date(lastStudyDate)
      lastStudy.setHours(0, 0, 0, 0)
      
      const daysDiff = Math.floor((today.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDiff === 0) {
        // 同じ日
        return
      } else if (daysDiff === 1) {
        // 連続
        currentStreak += 1
      } else {
        // 連続が途切れた
        currentStreak = 1
      }
    } else {
      currentStreak = 1
    }
    
    const longestStreak = Math.max(currentStreak, userData.studyStats?.longestStreak || 0)
    
    await updateDoc(userRef, {
      'studyStats.currentStreak': currentStreak,
      'studyStats.longestStreak': longestStreak
    })
  } catch (error) {
    console.error('ストリーク更新エラー:', error)
  }
}

// ========== 利用規約同意関連 ==========

export interface TermsAgreement {
  userId: string
  agreedAt: Timestamp | FieldValue
  termsVersion: string
  ip?: string | null
  userAgent?: string | null
  isMinor?: boolean
  parentalConsent?: boolean | null
}

/**
 * 利用規約への同意を記録
 * @param userId - ユーザーID
 * @param options - 追加オプション（バージョン、未成年フラグなど）
 */
export async function saveTermsAgreement(
  userId: string,
  options?: {
    termsVersion?: string
    isMinor?: boolean
    parentalConsent?: boolean | null
  }
): Promise<void> {
  try {
    const agreementRef = doc(db, 'termsAgreements', userId)
    
    const agreementData: TermsAgreement = {
      userId,
      agreedAt: serverTimestamp(),
      termsVersion: options?.termsVersion || '2024.12',
      ip: null, // 必要に応じてサーバーサイドで取得
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
      ...(options?.isMinor !== undefined && { isMinor: options.isMinor }),
      ...(options?.parentalConsent !== undefined && { parentalConsent: options.parentalConsent })
    }
    
    await setDoc(agreementRef, agreementData, { merge: true })
    
    console.log('Terms agreement saved successfully for user:', userId)
  } catch (error) {
    console.error('Error saving terms agreement:', error)
    throw error
  }
}

/**
 * 利用規約同意状況を取得
 * @param userId - ユーザーID
 */
export async function getTermsAgreement(userId: string): Promise<TermsAgreement | null> {
  try {
    const agreementRef = doc(db, 'termsAgreements', userId)
    const agreementSnap = await getDoc(agreementRef)
    
    if (agreementSnap.exists()) {
      return agreementSnap.data() as TermsAgreement
    }
    
    return null
  } catch (error) {
    console.error('Error getting terms agreement:', error)
    return null
  }
}

/**
 * 利用規約同意を更新（新しいバージョンへの同意など）
 * @param userId - ユーザーID
 * @param termsVersion - 新しい利用規約のバージョン
 */
export async function updateTermsAgreement(
  userId: string,
  termsVersion: string
): Promise<void> {
  try {
    const agreementRef = doc(db, 'termsAgreements', userId)
    
    await updateDoc(agreementRef, {
      agreedAt: serverTimestamp(),
      termsVersion,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
      updatedAt: serverTimestamp()
    })
    
    console.log('Terms agreement updated for user:', userId)
  } catch (error) {
    console.error('Error updating terms agreement:', error)
    throw error
  }
}