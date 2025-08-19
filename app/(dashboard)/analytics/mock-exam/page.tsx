'use client'

import { useState, useEffect } from 'react'
import MockExamForm from '@/components/analytics/mock-exam/mock-exam-form'
import MockExamList from '@/components/analytics/mock-exam/mock-exam-list'
import MockExamComparison from '@/components/analytics/mock-exam/mock-exam-comparison'
import MockExamDashboard from '@/components/analytics/mock-exam/mock-exam-dashboard'
import MockExamImport from '@/components/analytics/mock-exam/mock-exam-import'
import { FileText, BarChart3, GitCompare, Home, Upload } from 'lucide-react'

// スタイル定義（モバイル最適化版）
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    width: '100%',
    margin: 0,
    padding: 0,
    boxSizing: 'border-box' as const,
    paddingBottom: '60px', // ナビゲーション分の余白
  },
  wrapper: {
    width: '100%',
    maxWidth: '370px',
    margin: '0 auto',
    padding: '16px 12px',
    transition: 'all 0.3s ease',
    boxSizing: 'border-box' as const
  },
  header: {
    marginBottom: '16px',
    textAlign: 'center' as const,
    width: '100%'
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#2d3436',
    marginBottom: '6px',
    margin: '0 0 6px 0',
    transition: 'font-size 0.3s ease'
  },
  subtitle: {
    fontSize: '12px',
    color: '#636e72',
    margin: 0,
    transition: 'font-size 0.3s ease'
  },
  tabContainer: {
    width: '100%',
    margin: 0,
    padding: 0
  },
  tabList: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '6px',
    marginBottom: '16px',
    backgroundColor: 'white',
    padding: '8px',
    borderRadius: '10px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
    width: '100%',
    boxSizing: 'border-box' as const
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '8px 10px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#636e72',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    whiteSpace: 'nowrap' as const,
    fontFamily: 'inherit',
    flex: '1 1 auto',
    minWidth: '65px',
  },
  tabActive: {
    backgroundColor: '#6c5ce7',
    color: 'white',
    boxShadow: '0 2px 6px rgba(108, 92, 231, 0.3)'
  },
  tabContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
    width: '100%',
    overflowX: 'auto',
    transition: 'padding 0.3s ease',
    padding: '12px',
    boxSizing: 'border-box' as const
  }
}

// タブ設定
const tabs = [
  { value: 'dashboard', label: 'ダッシュボード', icon: Home },
  { value: 'form', label: '入力', icon: FileText },
  { value: 'list', label: '一覧', icon: BarChart3 },
  { value: 'comparison', label: '比較', icon: GitCompare },
  { value: 'import', label: '取込', icon: Upload }
]

export default function MockExamPage() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        {/* ヘッダー */}
        <div style={styles.header}>
          <h1 style={styles.title}>模試成績管理</h1>
          <p style={styles.subtitle}>
            成績の推移を分析
          </p>
        </div>

        {/* タブコンテナ */}
        <div style={styles.tabContainer}>
          {/* タブリスト */}
          <div style={styles.tabList}>
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.value
              
              return (
                <button
                  key={tab.value}
                  style={{
                    ...styles.tab,
                    ...(isActive ? styles.tabActive : {}),
                    // ダッシュボードタブを少し広めに
                    ...(tab.value === 'dashboard' ? { flex: '1.5 1 auto', minWidth: '90px' } : {})
                  }}
                  onClick={() => setActiveTab(tab.value)}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa'
                      e.currentTarget.style.color = '#6c5ce7'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#636e72'
                    }
                  }}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* タブコンテンツ */}
          <div style={styles.tabContent}>
            {activeTab === 'dashboard' && <MockExamDashboard />}
            {activeTab === 'form' && <MockExamForm />}
            {activeTab === 'list' && <MockExamList />}
            {activeTab === 'comparison' && <MockExamComparison />}
            {activeTab === 'import' && <MockExamImport />}
          </div>
        </div>
      </div>
    </div>
  )
}