'use client'

import { useState } from 'react'
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  AlertCircle, 
  Plus, 
  X,
  School,
  Trophy,
  BookOpen,
  Brain,
  Star,
  ChevronRight,
  GraduationCap,
  Users,
  Building2,
  Globe,
  CheckCircle
} from 'lucide-react'

interface SubjectGoal {
  id: string
  name: string
  currentScore: number
  targetScore: number
  priority: number
  minScore: number
}

export default function GoalSetting() {
  const [currentScore, setCurrentScore] = useState(65)
  const [targetDeviation, setTargetDeviation] = useState(70)
  const [selectedUniversity, setSelectedUniversity] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [subjects, setSubjects] = useState({
    japanese: false,
    math: false,
    english: false,
    science: false,
    social: false
  })

  // スタイル定義
  const styles = {
    wrapper: {
      width: '100%',
      backgroundColor: '#f0f4f8',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Hiragino Sans", sans-serif',
    },
    container: {
      maxWidth: '900px',
      margin: '0 auto',
      padding: '40px 20px',
    },
    header: {
      textAlign: 'center' as const,
      marginBottom: '40px',
    },
    title: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#1a202c',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
    },
    subtitle: {
      fontSize: '16px',
      color: '#718096',
      marginBottom: '8px',
    },
    progressText: {
      fontSize: '14px',
      color: '#4299e1',
      fontWeight: '500',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '28px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    },
    sectionTitle: {
      fontSize: '20px',
      fontWeight: '600',
      color: '#2d3748',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    sectionIcon: {
      width: '24px',
      height: '24px',
      color: '#4299e1',
    },
    formGroup: {
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#4a5568',
      marginBottom: '8px',
    },
    requiredMark: {
      color: '#e53e3e',
      marginLeft: '4px',
    },
    input: {
      width: '100%',
      padding: '10px 14px',
      fontSize: '15px',
      border: '1px solid #cbd5e0',
      borderRadius: '8px',
      backgroundColor: 'white',
      transition: 'all 0.2s',
      outline: 'none',
      boxSizing: 'border-box' as const,
    },
    inputFocus: {
      borderColor: '#4299e1',
      boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.1)',
    },
    select: {
      width: '100%',
      padding: '10px 14px',
      fontSize: '15px',
      border: '1px solid #cbd5e0',
      borderRadius: '8px',
      backgroundColor: 'white',
      cursor: 'pointer',
      outline: 'none',
      boxSizing: 'border-box' as const,
    },
    deviationSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      padding: '20px',
      backgroundColor: '#f7fafc',
      borderRadius: '8px',
      marginBottom: '20px',
    },
    deviationBox: {
      flex: 1,
      textAlign: 'center' as const,
    },
    deviationLabel: {
      fontSize: '13px',
      color: '#718096',
      marginBottom: '4px',
    },
    deviationValue: {
      fontSize: '36px',
      fontWeight: '700',
      color: '#2d3748',
    },
    arrow: {
      color: '#cbd5e0',
    },
    improvementBadge: {
      display: 'inline-block',
      padding: '6px 12px',
      backgroundColor: '#c6f6d5',
      color: '#22543d',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '600',
    },
    slider: {
      width: '100%',
      height: '8px',
      borderRadius: '4px',
      background: '#e2e8f0',
      outline: 'none',
      WebkitAppearance: 'none' as any,
      marginTop: '12px',
      cursor: 'pointer',
    },
    sliderLabels: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '8px',
      fontSize: '12px',
      color: '#718096',
    },
    checkboxGroup: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '12px',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 16px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      backgroundColor: 'white',
    },
    checkboxLabelChecked: {
      backgroundColor: '#ebf8ff',
      borderColor: '#4299e1',
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer',
    },
    universityList: {
      marginTop: '20px',
    },
    universityItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      marginBottom: '12px',
      backgroundColor: 'white',
      transition: 'all 0.2s',
    },
    universityItemActive: {
      backgroundColor: '#ebf8ff',
      borderColor: '#4299e1',
    },
    universityInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    universityIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '8px',
      backgroundColor: '#edf2f7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    universityName: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#2d3748',
    },
    universityDept: {
      fontSize: '14px',
      color: '#718096',
    },
    addButton: {
      width: '100%',
      padding: '12px',
      border: '2px dashed #cbd5e0',
      borderRadius: '8px',
      backgroundColor: 'transparent',
      color: '#718096',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s',
    },
    helpText: {
      fontSize: '13px',
      color: '#718096',
      marginTop: '8px',
    },
    actionButtons: {
      display: 'flex',
      justifyContent: 'center',
      gap: '16px',
      marginTop: '40px',
    },
    button: {
      padding: '12px 32px',
      borderRadius: '8px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    primaryButton: {
      backgroundColor: '#4299e1',
      color: 'white',
    },
    secondaryButton: {
      backgroundColor: 'white',
      color: '#4a5568',
      border: '1px solid #cbd5e0',
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginTop: '20px',
    },
    statCard: {
      padding: '20px',
      backgroundColor: '#f7fafc',
      borderRadius: '8px',
      textAlign: 'center' as const,
    },
    statValue: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#2d3748',
      marginBottom: '4px',
    },
    statLabel: {
      fontSize: '13px',
      color: '#718096',
    },
    tipBox: {
      padding: '16px',
      backgroundColor: '#fef5e7',
      borderRadius: '8px',
      border: '1px solid #fad97f',
      marginTop: '20px',
    },
    tipTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#744210',
      marginBottom: '4px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    tipText: {
      fontSize: '13px',
      color: '#744210',
      lineHeight: '1.5',
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.container}>
        {/* ヘッダー */}
        <div style={styles.header}>
          <h1 style={styles.title}>
            <Target size={36} />
            目標設定
          </h1>
          <p style={styles.subtitle}>
            目標を10%高めに設定すると、余裕のある学習計画を作成します
          </p>
          <p style={styles.progressText}>
            現在の設定完了度: 65%
          </p>
        </div>

        {/* 偏差値目標 */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>
            <Target style={styles.sectionIcon} />
            偏差値目標
          </h2>
          
          <div style={styles.deviationSection}>
            <div style={styles.deviationBox}>
              <p style={styles.deviationLabel}>現在の偏差値</p>
              <p style={styles.deviationValue}>{currentScore}</p>
            </div>
            <ChevronRight size={24} style={styles.arrow} />
            <div style={styles.deviationBox}>
              <p style={styles.deviationLabel}>目標偏差値</p>
              <p style={styles.deviationValue}>{targetDeviation}</p>
            </div>
            <div style={styles.improvementBadge}>
              +{targetDeviation - currentScore}
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              目標偏差値を設定
              <span style={styles.requiredMark}>*</span>
            </label>
            <input
              type="range"
              min="40"
              max="80"
              value={targetDeviation}
              onChange={(e) => setTargetDeviation(Number(e.target.value))}
              style={styles.slider}
            />
            <div style={styles.sliderLabels}>
              <span>40</span>
              <span>50</span>
              <span>60</span>
              <span>70</span>
              <span>80</span>
            </div>
          </div>
        </div>

        {/* 受験科目選択 */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>
            <BookOpen style={styles.sectionIcon} />
            受験科目選択
          </h2>
          
          <p style={styles.label}>
            共通テストで受験する科目を選択してください
            <span style={styles.requiredMark}>*</span>
          </p>
          
          <div style={styles.checkboxGroup}>
            {Object.entries({
              japanese: '国語',
              math: '数学（ⅠA・ⅡB・Ⅲ）',
              english: '英語',
              science: '理科（基礎2科目 or 専門1科目）',
              social: '社会（1-2科目選択）'
            }).map(([key, label]) => (
              <label 
                key={key}
                style={{
                  ...styles.checkboxLabel,
                  ...(subjects[key as keyof typeof subjects] ? styles.checkboxLabelChecked : {})
                }}
              >
                <input
                  type="checkbox"
                  checked={subjects[key as keyof typeof subjects]}
                  onChange={(e) => setSubjects({ ...subjects, [key]: e.target.checked })}
                  style={styles.checkbox}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 志望大学 */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>
            <School style={styles.sectionIcon} />
            志望大学
          </h2>
          
          <div style={styles.universityList}>
            {[
              { name: '東京大学', dept: '理科一類', deviation: 72 },
              { name: '京都大学', dept: '理学部', deviation: 70 },
              { name: '慶應義塾大学', dept: '理工学部', deviation: 68 }
            ].map((univ, index) => (
              <div 
                key={index}
                style={{
                  ...styles.universityItem,
                  ...(index === 0 ? styles.universityItemActive : {})
                }}
              >
                <div style={styles.universityInfo}>
                  <div style={styles.universityIcon}>
                    <GraduationCap size={24} color="#718096" />
                  </div>
                  <div>
                    <p style={styles.universityName}>{univ.name}</p>
                    <p style={styles.universityDept}>{univ.dept}（偏差値 {univ.deviation}）</p>
                  </div>
                </div>
                {index === 0 && <CheckCircle size={20} color="#4299e1" />}
              </div>
            ))}
            
            <button style={styles.addButton}>
              <Plus size={20} />
              志望大学を追加
            </button>
          </div>
          
          <p style={styles.helpText}>
            ※ 第一志望の大学に合わせて、最適な学習計画を作成します
          </p>
        </div>

        {/* AI分析 */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>
            <Brain style={styles.sectionIcon} />
            AI分析結果
          </h2>
          
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <p style={styles.statValue}>78%</p>
              <p style={styles.statLabel}>目標達成可能性</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statValue}>8ヶ月</p>
              <p style={styles.statLabel}>推奨学習期間</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statValue}>5.5時間</p>
              <p style={styles.statLabel}>1日の推奨学習時間</p>
            </div>
          </div>
          
          <div style={styles.tipBox}>
            <p style={styles.tipTitle}>
              <AlertCircle size={16} />
              AIからのアドバイス
            </p>
            <p style={styles.tipText}>
              現在の偏差値から目標達成は十分可能です。数学と英語を重点的に学習し、
              基礎から着実に固めていくことをおすすめします。
            </p>
          </div>
        </div>

        {/* アクションボタン */}
        <div style={styles.actionButtons}>
          <button 
            style={{ ...styles.button, ...styles.secondaryButton }}
          >
            下書き保存
          </button>
          <button 
            style={{ ...styles.button, ...styles.primaryButton }}
          >
            <Trophy size={20} />
            この内容で学習を開始
          </button>
        </div>
      </div>
    </div>
  )
}