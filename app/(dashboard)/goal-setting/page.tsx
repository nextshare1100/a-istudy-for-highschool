'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { getUserProfile, updateUserProfile } from '@/lib/firebase/firestore'
import { universities, searchUniversities, prefectures, facultyCategories } from '@/lib/data/universities'

interface UniversityGoal {
  id: string
  universityName: string
  faculty: string
  department: string
  targetScore: number
}

export default function GoalSettingPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [universityGoals, setUniversityGoals] = useState<UniversityGoal[]>([
    { id: '1', universityName: '', faculty: '', department: '', targetScore: 50 }
  ])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [selectedUniversity, setSelectedUniversity] = useState<any>(null)
  const [selectedFaculty, setSelectedFaculty] = useState<any>(null)
  const [filterType, setFilterType] = useState<'all' | '国立' | '公立' | '私立'>('all')
  const [filterPrefecture, setFilterPrefecture] = useState<string>('')
  const [filterDeviationMin, setFilterDeviationMin] = useState<number>(30)
  const [filterDeviationMax, setFilterDeviationMax] = useState<number>(80)
  
  // 学部検索用の新しいstate
  const [searchMode, setSearchMode] = useState<'university' | 'faculty'>('university')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [facultySearchResults, setFacultySearchResults] = useState<any[]>([])
  const [facultySearchQuery, setFacultySearchQuery] = useState<string>('')
  // 学部検索用のフィルタ
  const [facultyFilterPrefecture, setFacultyFilterPrefecture] = useState<string>('')
  const [facultyFilterDeviationMin, setFacultyFilterDeviationMin] = useState<number>(30)
  const [facultyFilterDeviationMax, setFacultyFilterDeviationMax] = useState<number>(80)
  
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid)
        try {
          const profile = await getUserProfile(user.uid)
          if (profile?.universityGoals && profile.universityGoals.length > 0) {
            setUniversityGoals(profile.universityGoals)
          }
        } catch (error) {
          console.error('目標の取得エラー:', error)
        }
      } else {
        router.push('/login')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  // フィルタが変更されたら自動的に検索を実行
  useEffect(() => {
    if (showSearch && searchMode === 'university') {
      handleSearch()
    }
  }, [filterType, filterPrefecture, filterDeviationMin, filterDeviationMax, searchQuery, showSearch, searchMode])

  // 学部検索のフィルタが変更されたら再検索
  useEffect(() => {
    if (showSearch && searchMode === 'faculty') {
      if (facultySearchQuery || selectedCategory) {
        searchFacultiesAndDepartments(facultySearchQuery)
      }
    }
  }, [facultyFilterPrefecture, facultyFilterDeviationMin, facultyFilterDeviationMax, showSearch, searchMode])

  // 大学検索
  const handleSearch = () => {
    const results = searchUniversities({
      query: searchQuery,
      type: filterType,
      prefecture: filterPrefecture || undefined,
      minDeviation: filterDeviationMin,
      maxDeviation: filterDeviationMax
    })
    setSearchResults(results)
  }

  // 学部カテゴリー別の検索結果を取得
  const getFacultiesByCategory = (category: string) => {
    const facultyNames = facultyCategories[category as keyof typeof facultyCategories] || []
    const results: any[] = []
    
    universities.forEach(uni => {
      // 都道府県フィルタ
      if (facultyFilterPrefecture && uni.prefecture !== facultyFilterPrefecture) {
        return
      }
      
      uni.faculties.forEach(fac => {
        if (facultyNames.some(name => fac.name.includes(name))) {
          // 偏差値フィルタ
          const filteredDepartments = fac.departments.filter(dept => 
            dept.deviationValue >= facultyFilterDeviationMin && 
            dept.deviationValue <= facultyFilterDeviationMax
          )
          
          if (filteredDepartments.length > 0) {
            results.push({
              university: uni,
              faculty: {
                ...fac,
                departments: filteredDepartments
              },
              matchType: 'category'
            })
          }
        }
      })
    })
    
    return results
  }

  // 学部・学科を検索する関数
  const searchFacultiesAndDepartments = (query: string) => {
    if (!query && !selectedCategory) {
      setFacultySearchResults([])
      return
    }

    const lowerQuery = query.toLowerCase()
    const results: any[] = []
    
    universities.forEach(uni => {
      // 都道府県フィルタ
      if (facultyFilterPrefecture && uni.prefecture !== facultyFilterPrefecture) {
        return
      }
      
      uni.faculties.forEach(fac => {
        // 学部名で検索
        const facultyMatch = !query || fac.name.toLowerCase().includes(lowerQuery)
        
        // 偏差値でフィルタリングした学科
        const filteredDepartments = fac.departments.filter(dept => {
          const deviationMatch = dept.deviationValue >= facultyFilterDeviationMin && 
                                dept.deviationValue <= facultyFilterDeviationMax
          const nameMatch = !query || dept.name.toLowerCase().includes(lowerQuery)
          return deviationMatch && (facultyMatch || nameMatch)
        })
        
        if (filteredDepartments.length > 0) {
          if (facultyMatch && query) {
            results.push({
              university: uni,
              faculty: {
                ...fac,
                departments: filteredDepartments
              },
              matchType: 'faculty'
            })
          } else if (!facultyMatch && query) {
            // 学科名でのみマッチ
            results.push({
              university: uni,
              faculty: {
                ...fac,
                departments: filteredDepartments
              },
              matchType: 'department'
            })
          } else if (!query && selectedCategory) {
            // カテゴリー検索の場合
            const categoryFaculties = facultyCategories[selectedCategory as keyof typeof facultyCategories] || []
            if (categoryFaculties.some(name => fac.name.includes(name))) {
              results.push({
                university: uni,
                faculty: {
                  ...fac,
                  departments: filteredDepartments
                },
                matchType: 'category'
              })
            }
          }
        }
      })
    })
    
    setFacultySearchResults(results)
  }

  // 検索キーワードをハイライトする関数
  const highlightText = (text: string, query: string) => {
    if (!query) return text
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={index} style={{ background: '#fef3c7', padding: '0 2px', borderRadius: '2px' }}>
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    )
  }

  // 検索モーダルを開く
  const openSearchModal = (goalId: string) => {
    setSelectedGoalId(goalId)
    setShowSearch(true)
    setSearchQuery('')
    setFacultySearchQuery('')
    // フィルタをリセット
    setFilterType('all')
    setFilterPrefecture('')
    setFilterDeviationMin(30)
    setFilterDeviationMax(80)
    // 学部検索用のフィルタもリセット
    setFacultyFilterPrefecture('')
    setFacultyFilterDeviationMin(30)
    setFacultyFilterDeviationMax(80)
    // 選択状態もリセット
    setSelectedUniversity(null)
    setSelectedFaculty(null)
    setSearchMode('university')
    setSelectedCategory('')
    setFacultySearchResults([])
  }

  // 大学を選択
  const selectUniversity = (university: any) => {
    setSelectedUniversity(university)
    setSelectedFaculty(null)
  }

  // 学部を選択
  const selectFaculty = (faculty: any) => {
    setSelectedFaculty(faculty)
  }

  // 学科を選択して確定
  const selectDepartment = (department: any) => {
    if (selectedGoalId && selectedUniversity && selectedFaculty) {
      setUniversityGoals(universityGoals.map(goal => 
        goal.id === selectedGoalId 
          ? {
              ...goal,
              universityName: selectedUniversity.name,
              faculty: selectedFaculty.name,
              department: department.name,
              targetScore: department.deviationValue
            }
          : goal
      ))
      setShowSearch(false)
      setSelectedUniversity(null)
      setSelectedFaculty(null)
    }
  }

  // 学部検索から選択
  const selectFromFacultySearch = (result: any, department: any) => {
    if (selectedGoalId) {
      setUniversityGoals(universityGoals.map(goal => 
        goal.id === selectedGoalId 
          ? {
              ...goal,
              universityName: result.university.name,
              faculty: result.faculty.name,
              department: department.name,
              targetScore: department.deviationValue
            }
          : goal
      ))
      setShowSearch(false)
    }
  }

  const addUniversityGoal = () => {
    if (universityGoals.length >= 5) {
      alert('志望校は最大5つまで設定できます')
      return
    }
    const newId = Date.now().toString()
    setUniversityGoals([...universityGoals, {
      id: newId,
      universityName: '',
      faculty: '',
      department: '',
      targetScore: 50
    }])
  }

  const removeUniversityGoal = (id: string) => {
    if (universityGoals.length <= 1) {
      alert('最低1つの志望校を設定してください')
      return
    }
    setUniversityGoals(universityGoals.filter(goal => goal.id !== id))
  }

  const updateUniversityGoal = (id: string, field: keyof UniversityGoal, value: string | number) => {
    setUniversityGoals(universityGoals.map(goal => 
      goal.id === id ? { ...goal, [field]: value } : goal
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const hasEmptyFields = universityGoals.some(goal => 
      !goal.universityName || !goal.faculty || !goal.department
    )
    
    if (hasEmptyFields) {
      alert('すべての項目を入力してください')
      return
    }

    if (!userId) return

    setSaving(true)
    try {
      await updateUserProfile(userId, { universityGoals })
      alert('志望校を保存しました！')
      router.push('/home')
    } catch (error) {
      console.error('保存エラー:', error)
      alert('保存に失敗しました。もう一度お試しください。')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <style jsx>{`
        .container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          box-sizing: border-box;
        }

        .page-title {
          font-size: clamp(24px, 4vw, 32px);
          font-weight: 700;
          margin-bottom: 24px;
          color: #1a202c;
          text-align: center;
        }

        .form-container {
          width: 100%;
        }

        .goals-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .goal-card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          padding: clamp(16px, 3vw, 24px);
          transition: box-shadow 0.2s;
          width: 100%;
          box-sizing: border-box;
        }

        .goal-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        }

        .goal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 12px;
        }

        .goal-title {
          font-size: clamp(16px, 3vw, 20px);
          font-weight: 600;
          color: #2d3748;
        }

        .delete-button {
          background: none;
          border: none;
          color: #e53e3e;
          font-size: 14px;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 4px;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .delete-button:hover {
          background: #fee;
          color: #c53030;
        }

        .input-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          width: 100%;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .input-label {
          font-size: clamp(13px, 2vw, 15px);
          font-weight: 500;
          color: #4a5568;
          margin-bottom: 6px;
        }

        .input-field {
          width: 100%;
          padding: clamp(10px, 2vw, 12px);
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: clamp(14px, 2.5vw, 16px);
          transition: all 0.2s;
          background: #ffffff;
          box-sizing: border-box;
          -webkit-appearance: none;
        }

        .input-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .search-button {
          width: 100%;
          padding: clamp(10px, 2vw, 12px);
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: clamp(14px, 2.5vw, 16px);
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }

        .search-button:hover {
          background: #2563eb;
        }

        .add-button {
          margin-top: 20px;
          width: 100%;
          padding: clamp(12px, 2vw, 16px);
          background: #f7fafc;
          color: #4a5568;
          border: 2px dashed #cbd5e0;
          border-radius: 8px;
          font-size: clamp(14px, 2.5vw, 16px);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .add-button:hover {
          background: #edf2f7;
          border-color: #a0aec0;
        }

        .action-buttons {
          margin-top: 32px;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .button {
          flex: 1;
          min-width: 120px;
          padding: clamp(12px, 2vw, 16px);
          border: none;
          border-radius: 8px;
          font-size: clamp(14px, 2.5vw, 16px);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .button-secondary {
          background: #e2e8f0;
          color: #4a5568;
        }

        .button-secondary:hover {
          background: #cbd5e0;
        }

        .button-primary {
          background: #3b82f6;
          color: #ffffff;
        }

        .button-primary:hover {
          background: #2563eb;
        }

        .button-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* 検索モーダル */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 24px;
          box-sizing: border-box;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #718096;
          padding: 4px;
        }

        .search-section {
          margin-bottom: 20px;
        }

        .search-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 16px;
          margin-bottom: 12px;
          box-sizing: border-box;
        }

        .filter-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .filter-select {
          padding: 8px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
        }

        .search-results {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .university-item {
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .university-item:hover {
          background: #f7fafc;
          border-color: #3b82f6;
        }

        .university-item.selected {
          background: #ebf8ff;
          border-color: #3b82f6;
        }

        .university-name {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .university-type {
          font-size: 14px;
          color: #718096;
        }

        .faculty-list {
          margin-top: 12px;
          padding-left: 20px;
        }

        .faculty-item {
          padding: 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .faculty-item:hover {
          background: #edf2f7;
        }

        .faculty-item.selected {
          background: #e6fffa;
        }

        .department-list {
          margin-top: 8px;
          padding-left: 20px;
        }

        .department-item {
          padding: 6px 12px;
          margin: 4px 0;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .department-item:hover {
          background: #f0fff4;
        }

        .deviation-value {
          font-size: 14px;
          font-weight: 500;
          color: #48bb78;
        }

        /* 新しいスタイル：検索モード切り替え */
        .search-mode-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          border-bottom: 2px solid #e2e8f0;
        }

        .mode-tab {
          padding: 10px 20px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          color: #718096;
          transition: all 0.2s;
          margin-bottom: -2px;
        }

        .mode-tab:hover {
          color: #3b82f6;
        }

        .mode-tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        /* 学部カテゴリーグリッド */
        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .category-button {
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #4a5568;
          transition: all 0.2s;
          text-align: center;
        }

        .category-button:hover {
          background: #f7fafc;
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .category-button.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        /* 学部検索結果 */
        .faculty-search-results {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .faculty-result-item {
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          transition: all 0.2s;
        }

        .faculty-result-item:hover {
          background: #f7fafc;
          border-color: #3b82f6;
        }

        .faculty-result-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 8px;
        }

        .faculty-info {
          flex: 1;
        }

        .faculty-name {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 4px;
        }

        .university-info {
          font-size: 14px;
          color: #718096;
        }

        /* 検索結果のハイライト */
        .search-highlight {
          background: #fef3c7;
          padding: 0 2px;
          border-radius: 2px;
        }

        /* マッチタイプのバッジ */
        .match-badge {
          display: inline-block;
          font-size: 12px;
          margin-left: 8px;
          color: #48bb78;
          background: #f0fff4;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 500;
        }

        @media (max-width: 480px) {
          .container {
            padding: 12px;
          }

          .goal-card {
            padding: 16px;
          }

          .input-grid {
            grid-template-columns: 1fr;
          }

          .action-buttons {
            flex-direction: column;
          }

          .button {
            width: 100%;
          }

          .modal-content {
            padding: 16px;
          }

          .filter-section {
            grid-template-columns: 1fr;
          }

          .category-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .search-mode-tabs {
            font-size: 14px;
          }

          .mode-tab {
            padding: 8px 12px;
            font-size: 14px;
          }
        }
      `}</style>

      <div className="container">
        <h1 className="page-title">志望校設定</h1>
        
        <form className="form-container" onSubmit={handleSubmit}>
          <div className="goals-list">
            {universityGoals.map((goal, index) => (
              <div key={goal.id} className="goal-card">
                <div className="goal-header">
                  <h3 className="goal-title">第{index + 1}志望</h3>
                  {universityGoals.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeUniversityGoal(goal.id)}
                      className="delete-button"
                    >
                      削除
                    </button>
                  )}
                </div>
                
                <div className="input-grid">
                  <div className="input-group">
                    <label className="input-label">
                      大学名
                    </label>
                    <input
                      type="text"
                      value={goal.universityName}
                      onChange={(e) => updateUniversityGoal(goal.id, 'universityName', e.target.value)}
                      placeholder="例：東京大学"
                      className="input-field"
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => openSearchModal(goal.id)}
                      className="search-button"
                    >
                      大学を検索
                    </button>
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">
                      学部
                    </label>
                    <input
                      type="text"
                      value={goal.faculty}
                      onChange={(e) => updateUniversityGoal(goal.id, 'faculty', e.target.value)}
                      placeholder="例：工学部"
                      className="input-field"
                      readOnly
                    />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">
                      学科
                    </label>
                    <input
                      type="text"
                      value={goal.department}
                      onChange={(e) => updateUniversityGoal(goal.id, 'department', e.target.value)}
                      placeholder="例：情報工学科"
                      className="input-field"
                      readOnly
                    />
                  </div>
                  
                  <div className="input-group">
                    <label className="input-label">
                      目標偏差値
                    </label>
                    <input
                      type="number"
                      min="30"
                      max="80"
                      value={goal.targetScore}
                      onChange={(e) => updateUniversityGoal(goal.id, 'targetScore', parseInt(e.target.value))}
                      className="input-field"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {universityGoals.length < 5 && (
            <button
              type="button"
              onClick={addUniversityGoal}
              className="add-button"
            >
              ＋ 志望校を追加
            </button>
          )}
          
          <div className="action-buttons">
            <button
              type="button"
              onClick={() => router.back()}
              className="button button-secondary"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="button button-primary"
            >
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </div>

      {/* 検索モーダル */}
      {showSearch && (
        <div className="modal-overlay" onClick={() => setShowSearch(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">大学を検索</h2>
              <button
                className="close-button"
                onClick={() => setShowSearch(false)}
              >
                ×
              </button>
            </div>

            {/* 検索モード切り替えタブ */}
            <div className="search-mode-tabs">
              <button
                type="button"
                className={`mode-tab ${searchMode === 'university' ? 'active' : ''}`}
                onClick={() => setSearchMode('university')}
              >
                大学名から探す
              </button>
              <button
                type="button"
                className={`mode-tab ${searchMode === 'faculty' ? 'active' : ''}`}
                onClick={() => setSearchMode('faculty')}
              >
                学部から探す
              </button>
            </div>

            {searchMode === 'university' ? (
              <>
                <div className="search-section">
                  <input
                    type="text"
                    placeholder="大学名・学部名で検索..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />

                  <div className="filter-section">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="filter-select"
                    >
                      <option value="all">すべて</option>
                      <option value="国立">国立</option>
                      <option value="公立">公立</option>
                      <option value="私立">私立</option>
                    </select>

                    <select
                      value={filterPrefecture}
                      onChange={(e) => setFilterPrefecture(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">都道府県</option>
                      {prefectures.map(pref => (
                        <option key={pref} value={pref}>{pref}</option>
                      ))}
                    </select>

                    <select
                      value={`${filterDeviationMin}-${filterDeviationMax}`}
                      onChange={(e) => {
                        const [min, max] = e.target.value.split('-').map(Number)
                        setFilterDeviationMin(min)
                        setFilterDeviationMax(max)
                      }}
                      className="filter-select"
                    >
                      <option value="30-80">偏差値帯</option>
                      <option value="70-80">70以上</option>
                      <option value="60-70">60〜70</option>
                      <option value="50-60">50〜60</option>
                      <option value="40-50">40〜50</option>
                      <option value="30-40">30〜40</option>
                    </select>
                  </div>
                </div>

                <div className="search-results">
                  {searchResults.map(university => (
                    <div 
                      key={university.id}
                      className={`university-item ${selectedUniversity?.id === university.id ? 'selected' : ''}`}
                      onClick={() => selectUniversity(university)}
                    >
                      <div className="university-name">{university.name}</div>
                      <div className="university-type">{university.type} - {university.prefecture}</div>
                      
                      {selectedUniversity?.id === university.id && (
                        <div className="faculty-list">
                          {university.faculties.map((faculty: any) => (
                            <div 
                              key={faculty.id}
                              className={`faculty-item ${selectedFaculty?.id === faculty.id ? 'selected' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                selectFaculty(faculty)
                              }}
                            >
                              <div>{faculty.name}</div>
                              
                              {selectedFaculty?.id === faculty.id && (
                                <div className="department-list">
                                  {faculty.departments.map((dept: any) => (
                                    <div
                                      key={dept.id}
                                      className="department-item"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        selectDepartment(dept)
                                      }}
                                    >
                                      <span>{dept.name}</span>
                                      <span className="deviation-value">偏差値 {dept.deviationValue}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // 学部から探すモード
              <>
                <div className="search-section">
                  <input
                    type="text"
                    placeholder="学部名・学科名で検索（例：工学、情報、経済、看護）"
                    value={facultySearchQuery}
                    onChange={(e) => {
                      setFacultySearchQuery(e.target.value)
                      searchFacultiesAndDepartments(e.target.value)
                    }}
                    className="search-input"
                  />
                  
                  {/* 学部検索用のフィルタ */}
                  <div className="filter-section" style={{ marginBottom: '20px' }}>
                    <select
                      value={facultyFilterPrefecture}
                      onChange={(e) => setFacultyFilterPrefecture(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">都道府県</option>
                      {prefectures.map(pref => (
                        <option key={pref} value={pref}>{pref}</option>
                      ))}
                    </select>

                    <select
                      value={`${facultyFilterDeviationMin}-${facultyFilterDeviationMax}`}
                      onChange={(e) => {
                        const [min, max] = e.target.value.split('-').map(Number)
                        setFacultyFilterDeviationMin(min)
                        setFacultyFilterDeviationMax(max)
                      }}
                      className="filter-select"
                    >
                      <option value="30-80">偏差値帯</option>
                      <option value="70-80">70以上</option>
                      <option value="60-70">60〜70</option>
                      <option value="50-60">50〜60</option>
                      <option value="40-50">40〜50</option>
                      <option value="30-40">30〜40</option>
                    </select>
                  </div>
                  
                  <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#4a5568' }}>
                    または、学部系統から選択
                  </h3>
                  <div className="category-grid">
                    {Object.keys(facultyCategories).map(category => (
                      <button
                        key={category}
                        type="button"
                        className={`category-button ${selectedCategory === category ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedCategory(category)
                          setFacultySearchQuery('') // 検索をクリア
                          const results = getFacultiesByCategory(category)
                          setFacultySearchResults(results)
                        }}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {(facultySearchQuery || selectedCategory) && facultySearchResults.length > 0 && (
                  <div className="faculty-search-results">
                    <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#2d3748' }}>
                      {facultySearchQuery 
                        ? `「${facultySearchQuery}」の検索結果（${facultySearchResults.length}件）`
                        : `${selectedCategory}の学部一覧（${facultySearchResults.length}件）`
                      }
                      {facultyFilterPrefecture && ` - ${facultyFilterPrefecture}`}
                      {(facultyFilterDeviationMin !== 30 || facultyFilterDeviationMax !== 80) && 
                        ` - 偏差値${facultyFilterDeviationMin}〜${facultyFilterDeviationMax}`
                      }
                    </h3>
                    {facultySearchResults.map((result, index) => (
                      <div key={`${result.university.id}-${result.faculty.id}-${index}`} className="faculty-result-item">
                        <div className="faculty-result-header">
                          <div className="faculty-info">
                            <div className="faculty-name">
                              {facultySearchQuery 
                                ? highlightText(result.faculty.name, facultySearchQuery)
                                : result.faculty.name
                              }
                              {result.matchType === 'department' && (
                                <span className="match-badge">
                                  学科がマッチ
                                </span>
                              )}
                            </div>
                            <div className="university-info">
                              {result.university.name} ({result.university.type} - {result.university.prefecture})
                            </div>
                          </div>
                        </div>
                        <div className="department-list">
                          {result.faculty.departments.map((dept: any) => (
                            <div
                              key={dept.id}
                              className="department-item"
                              onClick={() => selectFromFacultySearch(result, dept)}
                              style={
                                facultySearchQuery && dept.name.toLowerCase().includes(facultySearchQuery.toLowerCase())
                                  ? { background: '#f0fff4', border: '1px solid #48bb78' }
                                  : {}
                              }
                            >
                              <span>
                                {facultySearchQuery 
                                  ? highlightText(dept.name, facultySearchQuery)
                                  : dept.name
                                }
                              </span>
                              <span className="deviation-value">偏差値 {dept.deviationValue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {facultySearchQuery && facultySearchResults.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px 20px', 
                    color: '#718096' 
                  }}>
                    <p>「{facultySearchQuery}」に一致する学部・学科が見つかりませんでした</p>
                    {(facultyFilterPrefecture || facultyFilterDeviationMin !== 30 || facultyFilterDeviationMax !== 80) && (
                      <p style={{ fontSize: '14px', marginTop: '8px' }}>
                        フィルタ条件を変更してみてください
                      </p>
                    )}
                    <p style={{ fontSize: '14px', marginTop: '8px' }}>
                      別のキーワードで検索してみてください
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}