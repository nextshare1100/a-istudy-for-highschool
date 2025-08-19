'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '@/lib/firebase/config'
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  doc,
  getDoc,
  Timestamp,
  limit
} from 'firebase/firestore'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { 
  Search, 
  Filter, 
  BookOpen, 
  Brain,
  Target,
  ChevronRight,
  Loader2,
  AlertCircle,
  Calendar,
  User,
  Trophy,
  Clock,
  Plus,
  CheckCircle,
  Grid3X3,
  Type,
  MessageSquare,
  Calculator,
  Circle
} from 'lucide-react'

// CircleDot アイコンコンポーネント
const CircleDotIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="14" height="14">
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);

// タブの定義（weekly, monthly を削除）
const TABS = [
  { id: 'all', label: 'すべて', icon: BookOpen, color: 'blue' },
  { id: 'daily', label: 'デイリー', icon: Calendar, color: 'green' },
  { id: 'custom', label: 'カスタム', icon: User, color: 'pink' }
]

// 教科カテゴリ定義
const SUBJECT_CATEGORIES = {
  mathematics: {
    name: '数学',
    icon: <Calculator className="h-4 w-4" />,
    color: 'blue',
    subjects: ['数学Ⅰ・A', '数学Ⅱ・B', '数学Ⅲ']
  },
  japanese: {
    name: '国語',
    icon: <Type className="h-4 w-4" />,
    color: 'purple',
    subjects: ['現代文', '古文', '漢文']
  },
  english: {
    name: '英語',
    icon: <MessageSquare className="h-4 w-4" />,
    color: 'indigo',
    subjects: ['英語']
  },
  science: {
    name: '理科',
    icon: <Brain className="h-4 w-4" />,
    color: 'green',
    subjects: ['物理', '化学', '生物', '地学']
  },
  socialStudies: {
    name: '社会',
    icon: <BookOpen className="h-4 w-4" />,
    color: 'orange',
    subjects: ['日本史', '世界史', '地理', '現代社会', '倫理', '政治・経済']
  }
}

// 科目名のマッピング（生成ページで使用されている形式に対応）
const SUBJECT_NAME_MAPPING: { [key: string]: string } = {
  // 数学系
  'math1': '数学Ⅰ',
  'mathA': '数学A',
  'math2': '数学Ⅱ',
  'mathB': '数学B',
  'mathC': '数学C',
  'math3': '数学Ⅲ',
  
  // 国語系
  'japanese': '国語',
  
  // 英語系
  'englishReading': '英語リーディング',
  
  // 理科系
  'physicsBase': '物理基礎',
  'physics': '物理',
  'chemistryBase': '化学基礎',
  'chemistry': '化学',
  'biologyBase': '生物基礎',
  'biology': '生物',
  'earthScienceBase': '地学基礎',
  'earthScience': '地学',
  
  // 社会系
  'geographyComprehensive': '地理総合',
  'geography': '地理探究',
  'historyComprehensive': '歴史総合',
  'japaneseHistory': '日本史探究',
  'worldHistory': '世界史探究',
  'civicsBase': '公共',
  'ethics': '倫理',
  'politicsEconomics': '政治・経済',
  
  // 情報系
  'information1': '情報Ⅰ'
};

// 科目ごとの色設定
const SUBJECT_COLORS: { [key: string]: { bg: string; text: string; gradient: string } } = {
  // 数学系
  '数学Ⅰ': { bg: '#dbeafe', text: '#1e3a8a', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' },
  '数学A': { bg: '#dbeafe', text: '#1e3a8a', gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' },
  '数学Ⅱ': { bg: '#c7d2fe', text: '#312e81', gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' },
  '数学B': { bg: '#c7d2fe', text: '#312e81', gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' },
  '数学C': { bg: '#a5b4fc', text: '#312e81', gradient: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)' },
  '数学Ⅲ': { bg: '#a5b4fc', text: '#312e81', gradient: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)' },
  
  // 国語系
  '国語': { bg: '#fce7f3', text: '#831843', gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' },
  '現代文': { bg: '#fce7f3', text: '#831843', gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' },
  '古文': { bg: '#fbcfe8', text: '#9f1239', gradient: 'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)' },
  '漢文': { bg: '#fbb6ce', text: '#881337', gradient: 'linear-gradient(135deg, #f687b3 0%, #f472b6 100%)' },
  
  // 英語系
  '英語': { bg: '#e0e7ff', text: '#312e81', gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' },
  '英語リーディング': { bg: '#e0e7ff', text: '#312e81', gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' },
  
  // 理科系
  '物理基礎': { bg: '#d1fae5', text: '#064e3b', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  '物理': { bg: '#d1fae5', text: '#064e3b', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  '化学基礎': { bg: '#a7f3d0', text: '#065f46', gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' },
  '化学': { bg: '#a7f3d0', text: '#065f46', gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)' },
  '生物基礎': { bg: '#6ee7b7', text: '#047857', gradient: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)' },
  '生物': { bg: '#6ee7b7', text: '#047857', gradient: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)' },
  '地学基礎': { bg: '#86efac', text: '#166534', gradient: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)' },
  '地学': { bg: '#86efac', text: '#166534', gradient: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)' },
  
  // 社会系
  '地理総合': { bg: '#fcd34d', text: '#78350f', gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' },
  '地理探究': { bg: '#fcd34d', text: '#78350f', gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' },
  '歴史総合': { bg: '#fed7aa', text: '#7c2d12', gradient: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)' },
  '日本史探究': { bg: '#fed7aa', text: '#7c2d12', gradient: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)' },
  '世界史探究': { bg: '#fdba74', text: '#9a3412', gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' },
  '公共': { bg: '#fde047', text: '#713f12', gradient: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)' },
  '倫理': { bg: '#fef08a', text: '#854d0e', gradient: 'linear-gradient(135deg, #fde047 0%, #facc15 100%)' },
  '政治・経済': { bg: '#fef3c7', text: '#92400e', gradient: 'linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)' },
  
  // 情報系
  '情報Ⅰ': { bg: '#e9d5ff', text: '#581c87', gradient: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)' },
};

// デフォルトカラー（科目が定義されていない場合）
const DEFAULT_SUBJECT_COLOR = { 
  bg: '#e5e7eb', 
  text: '#374151', 
  gradient: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
};

// 難易度の表示設定
const DIFFICULTY_LEVELS = [
  { 
    id: 'easy', 
    name: '基礎', 
    difficulty: '偏差値 45~55', 
    value: 'easy', 
    color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    bgColor: '#d1fae5',
    textColor: '#064e3b',
    icon: <Circle className="h-3 w-3" />,
    description: '教科書の例題レベル'
  },
  { 
    id: 'medium', 
    name: '標準', 
    difficulty: '偏差値 55~65', 
    value: 'medium', 
    color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    bgColor: '#dbeafe',
    textColor: '#1e3a8a',
    icon: <CircleDotIcon className="h-3 w-3" />,
    description: 'センター試験レベル'
  },
  { 
    id: 'normal', 
    name: '標準', 
    difficulty: '偏差値 55~65', 
    value: 'medium', 
    color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    bgColor: '#dbeafe',
    textColor: '#1e3a8a',
    icon: <CircleDotIcon className="h-3 w-3" />,
    description: 'センター試験レベル'
  },
  { 
    id: 'hard', 
    name: '発展', 
    difficulty: '偏差値 65~70', 
    value: 'hard', 
    color: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    bgColor: '#e9d5ff',
    textColor: '#581c87',
    icon: <Target className="h-3 w-3" />,
    description: '難関大学レベル'
  }
];

// スタイルオブジェクト（モバイル最適化）
const styles = {
  pageContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #dbeafe 100%)',
    position: 'relative' as const,
  },
  mainCard: {
    background: 'linear-gradient(135deg, #ffffff 95%, #f9fafb 100%)',
    borderRadius: '16px',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(99, 102, 241, 0.1)',
    padding: '16px',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  tabButton: {
    base: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '6px 12px',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '11px',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      borderColor: 'transparent',
      borderWidth: '2px',
      borderStyle: 'solid',
      position: 'relative' as const,
      whiteSpace: 'nowrap' as const,
    },
    inactive: {
      background: 'white',
      color: '#6b7280',
      borderColor: '#e5e7eb',
      borderWidth: '2px',
      borderStyle: 'solid',
    },
    active: {
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      color: 'white',
      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
      transform: 'scale(1.05)',
    }
  },
  filterButton: {
    base: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '12px',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      borderColor: '#e5e7eb',
      borderWidth: '2px',
      borderStyle: 'solid',
      background: 'white',
      color: '#374151',
    },
    active: {
      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      borderColor: '#9ca3af',
    }
  },
  categoryButton: {
    base: {
      position: 'relative' as const,
      padding: '8px 12px',
      borderRadius: '8px',
      borderColor: '#e5e7eb',
      borderWidth: '2px',
      borderStyle: 'solid',
      background: 'white',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      fontSize: '11px',
      whiteSpace: 'nowrap' as const,
    },
    hover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      borderColor: '#c7d2fe',
    },
    selected: {
      background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
      borderColor: '#6366f1',
      borderWidth: '2px',
      borderStyle: 'solid',
      transform: 'scale(1.02)',
      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.15)',
    }
  },
  subjectTag: {
    base: {
      padding: '4px 10px',
      borderRadius: '9999px',
      fontSize: '10px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      borderColor: 'transparent',
      borderWidth: '2px',
      borderStyle: 'solid',
      whiteSpace: 'nowrap' as const,
    },
    inactive: {
      background: '#f3f4f6',
      color: '#6b7280',
      borderColor: '#e5e7eb',
      borderWidth: '2px',
      borderStyle: 'solid',
    },
    active: {
      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      color: '#1e3a8a',
      borderColor: '#60a5fa',
      borderWidth: '2px',
      borderStyle: 'solid',
      fontWeight: '600',
    }
  },
  problemCard: {
    base: {
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      borderColor: '#e5e7eb',
      borderWidth: '1px',
      borderStyle: 'solid',
      padding: '12px',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      position: 'relative' as const,
      overflow: 'hidden',
    },
    hover: {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
      borderColor: '#c7d2fe',
    }
  },
  checkmark: {
    position: 'absolute' as const,
    top: '-4px',
    right: '-4px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    borderRadius: '50%',
    padding: '2px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
};

interface Challenge {
  id: string
  problemIds: string[]
  subject: string
  difficulty: string
  targetDeviation: number
  date?: string
  expiresAt?: Timestamp
  createdAt?: Timestamp
  userId?: string
}

// 科目の表示名を取得する関数
const getSubjectDisplayName = (subject: string): string => {
  // すでに日本語名の場合はそのまま返す
  if (SUBJECT_COLORS[subject]) {
    return subject;
  }
  
  // IDから日本語名に変換
  return SUBJECT_NAME_MAPPING[subject] || subject;
};

function ProblemsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  
  // 問題データ
  const [allProblems, setAllProblems] = useState<any[]>([])
  const [dailyProblems, setDailyProblems] = useState<any[]>([])
  const [customProblems, setCustomProblems] = useState<any[]>([])
  const [filteredProblems, setFilteredProblems] = useState<any[]>([])
  
  // チャレンジ情報
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null)
  
  // フィルター状態
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('すべて')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('すべて')
  const [showFilters, setShowFilters] = useState(false)
  
  const router = useRouter()

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login')
        return
      }
      setCurrentUser(user)
    })

    return () => unsubscribe()
  }, [router])

  // currentUser が設定されたらデータを読み込む
  useEffect(() => {
    if (currentUser) {
      loadAllData()
    }
  }, [currentUser])

  // すべてのデータを読み込む
  const loadAllData = async () => {
    if (!currentUser) return;
    
    setLoading(true)
    try {
      // 自分が作成した問題のみを取得するようにクエリを修正
      const problemsQuery = query(
        collection(db, 'problems'),
        where('createdBy', '==', currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(200)
      );
      
      const problemsSnapshot = await getDocs(problemsQuery);
      const problems = problemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // 問題文が存在し、生成に失敗していない問題のみをフィルタリング
      const validProblems = problems.filter(p => 
        p.question && 
        p.question.trim() !== '' &&
        !p.question.includes('問題文の生成に失敗しました')
      );
      
      setAllProblems(validProblems);
      
      // デイリーチャレンジのみ処理
      await loadChallengeProblems('daily', setDailyProblems);
      
      const custom = validProblems.filter(p => p.creatorId || p.createdBy);
      setCustomProblems(custom);
      
      setFilteredProblems(validProblems);
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  // チャレンジ問題を読み込む（デイリーのみ）
  const loadChallengeProblems = async (
    type: 'daily',
    setSetter: (problems: any[]) => void
  ) => {
    if (!currentUser) return;
    
    try {
      const collectionName = `${type}Challenges`;
      
      // チャレンジコレクションに userId フィールドがある場合のクエリ
      let challengesQuery;
      try {
        // userId フィールドでフィルタリングを試みる
        challengesQuery = query(
          collection(db, collectionName),
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
      } catch (error) {
        // userId フィールドがない場合は、すべてのチャレンジを取得
        console.log(`${type}チャレンジにuserIdフィールドがありません。すべてのチャレンジを取得します。`);
        challengesQuery = query(
          collection(db, collectionName),
          orderBy('createdAt', 'desc'),
          limit(1)
        );
      }
      
      const challengesSnapshot = await getDocs(challengesQuery);
      
      if (!challengesSnapshot.empty) {
        const latestChallenge = {
          id: challengesSnapshot.docs[0].id,
          ...challengesSnapshot.docs[0].data()
        } as Challenge;
        
        if (latestChallenge && latestChallenge.problemIds) {
          // 自分が作成した問題のみを取得
          const problems = await Promise.all(
            latestChallenge.problemIds.map(async (id) => {
              try {
                const docRef = doc(db, 'problems', id);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                  const data = docSnap.data();
                  
                  // 自分が作成した問題かチェック
                  if (data.createdBy === currentUser.uid) {
                    // 問題文が存在し、生成に失敗していない場合のみ返す
                    if (data.question && 
                        data.question.trim() !== '' &&
                        !data.question.includes('問題文の生成に失敗しました')) {
                      return { id: docSnap.id, ...data };
                    }
                  }
                }
              } catch (error) {
                console.error(`問題 ${id} の取得に失敗:`, error);
              }
              return null;
            })
          );
          
          const validProblems = problems.filter(p => p !== null);
          setSetter(validProblems);
          
          if (type === 'daily' && activeTab === 'daily') {
            setCurrentChallenge(latestChallenge);
          }
        }
      }
    } catch (error) {
      console.error(`${type}チャレンジ読み込みエラー:`, error);
      setSetter([]);
    }
  };

  // タブ切り替え時の処理
  useEffect(() => {
    let problems: any[] = []
    
    switch (activeTab) {
      case 'all':
        problems = allProblems
        break
      case 'daily':
        problems = dailyProblems
        break
      case 'custom':
        problems = customProblems
        break
    }
    
    setFilteredProblems(problems)
    setSearchQuery('')
    setSelectedCategory('すべて')
    setSelectedSubjects([])
    setSelectedDifficulty('すべて')
  }, [activeTab, allProblems, dailyProblems, customProblems])

  // フィルタリング処理
  useEffect(() => {
    let baseProblems: any[] = []
    
    switch (activeTab) {
      case 'all':
        baseProblems = allProblems
        break
      case 'daily':
        baseProblems = dailyProblems
        break
      case 'custom':
        baseProblems = customProblems
        break
    }
    
    let filtered = [...baseProblems]

    if (searchQuery) {
      filtered = filtered.filter(problem => 
        problem.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        problem.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        problem.unit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        problem.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        problem.explanation?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedSubjects.length > 0) {
      filtered = filtered.filter(problem => {
        const subjectName = getSubjectDisplayName(problem.subject);
        return selectedSubjects.includes(subjectName);
      })
    }

    if (selectedDifficulty !== 'すべて') {
      filtered = filtered.filter(problem => 
        problem.difficulty === selectedDifficulty
      )
    }

    setFilteredProblems(filtered)
  }, [searchQuery, selectedCategory, selectedSubjects, selectedDifficulty, activeTab, allProblems, dailyProblems, customProblems])

  // カテゴリ選択時の処理
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category)
    if (category === 'すべて') {
      setSelectedSubjects([])
    } else {
      const categoryData = Object.entries(SUBJECT_CATEGORIES).find(([key, data]) => data.name === category)?.[1]
      setSelectedSubjects(categoryData?.subjects || [])
    }
  }

  // 科目選択の切り替え
  const toggleSubjectSelect = (subject: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    )
  }

  // 問題数を取得
  const getProblemCount = (tabId: string) => {
    switch (tabId) {
      case 'all':
        return allProblems.length
      case 'daily':
        return dailyProblems.length
      case 'custom':
        return customProblems.length
      default:
        return 0
    }
  }

  // 難易度設定を取得
  const getDifficultyConfig = (difficulty: string) => {
    return DIFFICULTY_LEVELS.find(level => 
      level.value === difficulty || level.id === difficulty
    ) || DIFFICULTY_LEVELS[1]; // デフォルトは標準
  }

  if (loading) {
    return (
      <div style={styles.pageContainer}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
        </div>
      </div>
    )
  }

  return (
    <div style={styles.pageContainer}>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      {/* ヘッダー */}
      <div style={{
        background: 'white',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        borderBottom: '1px solid #e5e7eb',
        position: 'sticky' as const,
        top: 0,
        zIndex: 40,
      }}>
        <div style={{ padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                padding: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                borderRadius: '8px',
                color: 'white',
                boxShadow: '0 4px 8px rgba(99, 102, 241, 0.3)',
              }}>
                <BookOpen size={20} />
              </div>
              <h1 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                問題バンク
              </h1>
            </div>
            <Link href="/problems/create">
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '8px 12px',
                  background: 'linear-gradient(135deg, #9333ea 0%, #6366f1 100%)',
                  color: 'white',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 8px rgba(147, 51, 234, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(147, 51, 234, 0.3)';
                }}
              >
                <Plus size={14} />
                作成
              </button>
            </Link>
          </div>
          
          {/* タブ */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px' }}>
            {TABS.map(tab => {
              const Icon = tab.icon
              const count = getProblemCount(tab.id)
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    ...styles.tabButton.base,
                    ...(isActive ? styles.tabButton.active : styles.tabButton.inactive),
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {count > 0 && (
                    <span style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      background: isActive ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb',
                      fontWeight: '600',
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          
          {/* 検索バー */}
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
              }} size={16} />
              <input
                type="text"
                placeholder="検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  background: '#f9fafb',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.borderWidth = '2px';
                  e.currentTarget.style.borderStyle = 'solid';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.borderWidth = '2px';
                  e.currentTarget.style.borderStyle = 'solid';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                ...styles.filterButton.base,
                ...(showFilters ? styles.filterButton.active : {}),
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Filter size={14} />
              <span style={{ display: 'none' }}>フィルター</span>
            </button>
          </div>
        </div>
      </div>

      {/* フィルターパネル */}
      {showFilters && (
        <div style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{ padding: '12px' }}>
            {/* カテゴリタブ */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
              <button
                onClick={() => handleCategorySelect('すべて')}
                style={{
                  ...styles.categoryButton.base,
                  ...(selectedCategory === 'すべて' ? styles.categoryButton.selected : {}),
                }}
                onMouseEnter={(e) => {
                  if (selectedCategory !== 'すべて') {
                    Object.assign(e.currentTarget.style, styles.categoryButton.hover);
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== 'すべて') {
                    Object.assign(e.currentTarget.style, styles.categoryButton.base);
                  }
                }}
              >
                すべて
                {selectedCategory === 'すべて' && (
                  <div style={styles.checkmark}>
                    <CheckCircle size={12} />
                  </div>
                )}
              </button>
              {Object.values(SUBJECT_CATEGORIES).map(category => (
                <button
                  key={category.name}
                  onClick={() => handleCategorySelect(category.name)}
                  style={{
                    ...styles.categoryButton.base,
                    ...(selectedCategory === category.name ? styles.categoryButton.selected : {}),
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== category.name) {
                      Object.assign(e.currentTarget.style, styles.categoryButton.hover);
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== category.name) {
                      Object.assign(e.currentTarget.style, styles.categoryButton.base);
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {category.icon}
                    {category.name}
                  </div>
                  {selectedCategory === category.name && (
                    <div style={styles.checkmark}>
                      <CheckCircle size={12} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* 科目選択 */}
            {selectedCategory !== 'すべて' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                {Object.values(SUBJECT_CATEGORIES)
                  .find(cat => cat.name === selectedCategory)
                  ?.subjects.map(subject => {
                    const subjectColor = SUBJECT_COLORS[subject] || DEFAULT_SUBJECT_COLOR;
                    const isSelected = selectedSubjects.includes(subject);
                    
                    return (
                      <button
                        key={subject}
                        onClick={() => toggleSubjectSelect(subject)}
                        style={{
                          ...styles.subjectTag.base,
                          background: isSelected ? subjectColor.bg : '#f3f4f6',
                          color: isSelected ? subjectColor.text : '#6b7280',
                          border: isSelected ? `2px solid ${subjectColor.text}40` : '2px solid #e5e7eb',
                          fontWeight: isSelected ? '600' : '500',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          if (!isSelected) {
                            e.currentTarget.style.background = subjectColor.bg + '80';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          if (!isSelected) {
                            e.currentTarget.style.background = '#f3f4f6';
                          }
                        }}
                      >
                        {subject}
                      </button>
                    );
                  })}
              </div>
            )}

            {/* 難易度フィルター */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>難易度:</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '2px solid #e5e7eb',
                  background: 'white',
                  fontSize: '12px',
                  fontWeight: '500',
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.borderWidth = '2px';
                  e.currentTarget.style.borderStyle = 'solid';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.borderWidth = '2px';
                  e.currentTarget.style.borderStyle = 'solid';
                }}
              >
                <option value="すべて">すべて</option>
                <option value="easy">基礎</option>
                <option value="medium">標準</option>
                <option value="hard">発展</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <div style={{ padding: '16px 12px' }}>
        {/* チャレンジ情報 */}
        {activeTab === 'daily' && currentChallenge && (
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(251, 191, 36, 0.2)',
            border: '1px solid #fbbf24',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  padding: '8px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  borderRadius: '8px',
                  color: 'white',
                  boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)',
                }}>
                  <Trophy size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#92400e', marginBottom: '2px' }}>
                    デイリーチャレンジ
                  </h3>
                  <p style={{ fontSize: '11px', color: '#92400e' }}>
                    {getSubjectDisplayName(currentChallenge.subject)} | 偏差値 {currentChallenge.targetDeviation}
                  </p>
                </div>
              </div>
            </div>
            {currentChallenge.expiresAt && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#92400e', marginTop: '8px' }}>
                <Clock size={12} />
                <span style={{ fontSize: '11px' }}>
                  期限: {format(currentChallenge.expiresAt.toDate(), 'MM/dd HH:mm', { locale: ja })}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 検索結果の統計 */}
        {(searchQuery || selectedSubjects.length > 0 || selectedDifficulty !== 'すべて') && (
          <div style={{ marginBottom: '12px', fontSize: '12px', color: '#6b7280' }}>
            <p>{filteredProblems.length} 件の問題が見つかりました</p>
          </div>
        )}

        {/* 問題一覧 */}
        {filteredProblems.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '12px',
          }}>
            {filteredProblems.map((problem, index) => {
              const difficultyConfig = getDifficultyConfig(problem.difficulty);
              
              // 科目の表示名を取得
              const displaySubjectName = getSubjectDisplayName(problem.subject);
              
              // 科目の色設定を取得（IDまたは日本語名の両方に対応）
              const subjectColor = SUBJECT_COLORS[problem.subject] || 
                                  SUBJECT_COLORS[displaySubjectName] || 
                                  DEFAULT_SUBJECT_COLOR;
              
              return (
                <Link
                  key={problem.id}
                  href={`/problems/${problem.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div
                    style={styles.problemCard.base}
                    onMouseEnter={(e) => {
                      Object.assign(e.currentTarget.style, styles.problemCard.hover);
                    }}
                    onMouseLeave={(e) => {
                      Object.assign(e.currentTarget.style, styles.problemCard.base);
                    }}
                  >
                    {/* 科目の色をアクセントとして使用 */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: subjectColor.gradient,
                      borderRadius: '12px 12px 0 0',
                    }} />
                    
                    {/* チャレンジ問題の番号表示 */}
                    {activeTab === 'daily' && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        width: '24px',
                        height: '24px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '11px',
                        boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)',
                      }}>
                        {index + 1}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        <span style={{
                          padding: '4px 8px',
                          background: 'white',
                          color: '#374151',
                          borderRadius: '9999px',
                          fontSize: '10px',
                          fontWeight: '600',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                          border: '1px solid #e5e7eb',
                        }}>
                          {displaySubjectName}
                        </span>
                        <span style={{
                          padding: '4px 8px',
                          background: difficultyConfig.bgColor,
                          color: difficultyConfig.textColor,
                          borderRadius: '9999px',
                          fontSize: '10px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        }}>
                          {difficultyConfig.icon}
                          {difficultyConfig.name}
                        </span>
                      </div>
                      
                      <h3 style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#1f2937',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {problem.question}
                      </h3>
                      
                      {(problem.unit || problem.topic) && (
                        <p style={{
                          fontSize: '11px',
                          color: '#6b7280',
                        }}>
                          単元: {problem.unit || problem.topic}
                        </p>
                      )}
                      
                      {/* 選択肢のプレビュー */}
                      {problem.options && problem.options.length > 0 && (
                        <div style={{
                          fontSize: '11px',
                          color: '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}>
                          <Grid3X3 size={12} />
                          選択肢: {problem.options.length}個
                        </div>
                      )}
                      
                      {/* 作成日時 */}
                      <div style={{
                        fontSize: '10px',
                        color: '#9ca3af',
                        marginTop: '4px',
                        paddingTop: '8px',
                        borderTop: '1px solid #e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        {problem.createdAt && (
                          <span>
                            {format(problem.createdAt.toDate?.() || new Date(), 'MM/dd HH:mm', { locale: ja })}
                          </span>
                        )}
                        {problem.creatorName && activeTab === 'custom' && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <User size={10} />
                            {problem.creatorName}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#9ca3af',
                      transition: 'all 0.3s ease',
                    }}>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div style={styles.mainCard}>
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <AlertCircle style={{ color: '#9ca3af', margin: '0 auto 12px' }} size={32} />
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '6px' }}>
                {activeTab === 'all' ? '問題が見つかりません' : 
                 activeTab === 'custom' ? 'カスタム問題がありません' :
                 'デイリーチャレンジはありません'}
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '16px', fontSize: '12px' }}>
                {activeTab === 'custom' || activeTab === 'all' ? (
                  <>問題を作成してください</>
                ) : 
                 'しばらくお待ちください'}
              </p>
              {(activeTab === 'custom' || activeTab === 'all') && (
                <Link href="/problems/create">
                  <button
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      background: 'linear-gradient(135deg, #9333ea 0%, #6366f1 100%)',
                      color: 'white',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '13px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 8px rgba(147, 51, 234, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(147, 51, 234, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(147, 51, 234, 0.3)';
                    }}
                  >
                    <Plus size={16} />
                    問題を作成する
                  </button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProblemsPage