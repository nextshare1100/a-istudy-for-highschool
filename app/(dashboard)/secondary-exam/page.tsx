'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Mic, PenTool, ChevronRight, Target, Clock, BarChart3 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { startOfToday } from 'date-fns'

interface SecondaryExamStats {
  interviewCount: number
  essayCount: number
  averageScore: number
  consecutiveDays: number
}

export default function SecondaryExamPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const [stats, setStats] = useState<SecondaryExamStats>({
    interviewCount: 0,
    essayCount: 0,
    averageScore: 0,
    consecutiveDays: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Firebaseから統計データを取得
  useEffect(() => {
    const loadStats = async () => {
      if (!user) return
      
      setStatsLoading(true)
      try {
        // 面接練習回数を取得
        const interviewQuery = query(
          collection(db, 'interviewPractices'),
          where('userId', '==', user.uid)
        )
        const interviewSnapshot = await getDocs(interviewQuery)
        const interviewCount = interviewSnapshot.size

        // 小論文作成数を取得
        const essayQuery = query(
          collection(db, 'essaySubmissions'),
          where('userId', '==', user.uid)
        )
        const essaySnapshot = await getDocs(essayQuery)
        const essayCount = essaySnapshot.size

        // 平均評価スコアを計算
        let totalScore = 0
        let scoreCount = 0

        // 面接の評価スコア
        interviewSnapshot.forEach(doc => {
          const data = doc.data()
          if (data.evaluation?.totalScore) {
            totalScore += data.evaluation.totalScore
            scoreCount++
          }
        })

        // 小論文の評価スコア
        const evaluationQuery = query(
          collection(db, 'essayEvaluations'),
          where('userId', '==', user.uid)
        )
        const evaluationSnapshot = await getDocs(evaluationQuery)
        evaluationSnapshot.forEach(doc => {
          const data = doc.data()
          if (data.totalScore) {
            totalScore += data.totalScore
            scoreCount++
          }
        })

        const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0

        // 連続練習日数を計算
        const consecutiveDays = await calculateConsecutiveDays(user.uid)

        setStats({
          interviewCount,
          essayCount,
          averageScore,
          consecutiveDays
        })
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setStatsLoading(false)
      }
    }

    if (user) {
      loadStats()
    }
  }, [user])

  // 連続練習日数を計算する関数
  const calculateConsecutiveDays = async (userId: string): Promise<number> => {
    try {
      // 過去30日分の練習データを取得
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // 面接練習の日付を取得
      const interviewQuery = query(
        collection(db, 'interviewPractices'),
        where('userId', '==', userId),
        where('createdAt', '>=', thirtyDaysAgo),
        orderBy('createdAt', 'desc')
      )
      const interviewSnapshot = await getDocs(interviewQuery)
      
      // 小論文の日付を取得
      const essayQuery = query(
        collection(db, 'essaySubmissions'),
        where('userId', '==', userId),
        where('createdAt', '>=', thirtyDaysAgo),
        orderBy('createdAt', 'desc')
      )
      const essaySnapshot = await getDocs(essayQuery)

      // 日付を集約
      const practiceDates = new Set<string>()
      
      interviewSnapshot.forEach(doc => {
        const data = doc.data()
        if (data.createdAt) {
          const date = data.createdAt.toDate()
          practiceDates.add(date.toISOString().split('T')[0])
        }
      })

      essaySnapshot.forEach(doc => {
        const data = doc.data()
        if (data.createdAt) {
          const date = data.createdAt.toDate()
          practiceDates.add(date.toISOString().split('T')[0])
        }
      })

      // 連続日数を計算
      const sortedDates = Array.from(practiceDates).sort().reverse()
      let consecutiveDays = 0
      const today = new Date().toISOString().split('T')[0]

      for (let i = 0; i < sortedDates.length; i++) {
        const expectedDate = new Date()
        expectedDate.setDate(expectedDate.getDate() - i)
        const expected = expectedDate.toISOString().split('T')[0]
        
        if (sortedDates[i] === expected || (i === 0 && sortedDates[i] === today)) {
          consecutiveDays++
        } else {
          break
        }
      }

      return consecutiveDays
    } catch (error) {
      console.error('Error calculating consecutive days:', error)
      return 0
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <>
      <style jsx>{`
        .main-content {
          padding: ${isMobile ? '16px' : '20px'};
          max-width: 1200px;
          margin: 0 auto;
          padding-bottom: ${isMobile ? '80px' : '40px'};
        }
        
        .greeting-section {
          text-align: center;
          margin-bottom: ${isMobile ? '16px' : '24px'};
        }
        
        .greeting {
          font-size: ${isMobile ? '22px' : '28px'};
          font-weight: 700;
          margin-bottom: ${isMobile ? '2px' : '4px'};
        }
        
        .date {
          font-size: ${isMobile ? '12px' : '14px'};
          opacity: 0.7;
        }
        
        .welcome-message {
          background: white;
          border-radius: ${isMobile ? '12px' : '16px'};
          padding: ${isMobile ? '16px' : '24px'};
          margin-bottom: ${isMobile ? '16px' : '24px'};
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          text-align: center;
        }
        
        .welcome-title {
          font-size: ${isMobile ? '16px' : '20px'};
          font-weight: 600;
          margin-bottom: ${isMobile ? '6px' : '8px'};
          color: #3b82f6;
        }
        
        .welcome-text {
          font-size: ${isMobile ? '13px' : '14px'};
          color: #636e72;
          line-height: 1.6;
        }
        
        .practice-cards {
          display: grid;
          grid-template-columns: ${isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))'};
          gap: ${isMobile ? '12px' : '20px'};
          margin-bottom: ${isMobile ? '20px' : '32px'};
        }
        
        /* 面接対策カード */
        .interview-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: ${isMobile ? '16px' : '20px'};
          padding: ${isMobile ? '16px' : '24px'};
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .interview-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .interview-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: ${isMobile ? '150px' : '200px'};
          height: ${isMobile ? '150px' : '200px'};
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }
        
        /* 小論文対策カード */
        .essay-card {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          border-radius: ${isMobile ? '16px' : '20px'};
          padding: ${isMobile ? '16px' : '24px'};
          box-shadow: 0 4px 16px rgba(240, 147, 251, 0.3);
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .essay-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(240, 147, 251, 0.4);
        }
        
        .essay-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: ${isMobile ? '150px' : '200px'};
          height: ${isMobile ? '150px' : '200px'};
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: ${isMobile ? '12px' : '16px'};
          position: relative;
          z-index: 1;
        }
        
        .card-title-section {
          color: white;
        }
        
        .card-label {
          font-size: ${isMobile ? '10px' : '12px'};
          font-weight: 500;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: ${isMobile ? '0.5px' : '1px'};
          margin-bottom: ${isMobile ? '2px' : '4px'};
        }
        
        .card-title {
          font-size: ${isMobile ? '18px' : '24px'};
          font-weight: 700;
        }
        
        .card-icon {
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: ${isMobile ? '8px' : '12px'};
          border-radius: 50%;
          color: white;
        }
        
        .card-content {
          position: relative;
          z-index: 1;
        }
        
        .card-description {
          color: rgba(255, 255, 255, 0.9);
          font-size: ${isMobile ? '12px' : '14px'};
          margin-bottom: ${isMobile ? '12px' : '20px'};
          line-height: 1.6;
        }
        
        .feature-list {
          display: flex;
          flex-direction: column;
          gap: ${isMobile ? '8px' : '12px'};
          margin-bottom: ${isMobile ? '12px' : '20px'};
        }
        
        .feature-item {
          display: flex;
          align-items: center;
          gap: ${isMobile ? '8px' : '12px'};
          color: white;
          font-size: ${isMobile ? '12px' : '14px'};
        }
        
        .feature-icon {
          color: rgba(255, 255, 255, 0.8);
          flex-shrink: 0;
        }
        
        .practice-button {
          background: white;
          color: #667eea;
          border: none;
          padding: ${isMobile ? '10px 16px' : '12px 24px'};
          border-radius: ${isMobile ? '10px' : '12px'};
          font-size: ${isMobile ? '13px' : '14px'};
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: ${isMobile ? '6px' : '8px'};
        }
        
        .practice-button:hover {
          transform: scale(1.02);
        }
        
        .practice-button.essay {
          color: #f093fb;
        }
        
        /* 統計情報セクション */
        .stats-section {
          background: white;
          border-radius: ${isMobile ? '12px' : '16px'};
          padding: ${isMobile ? '16px' : '24px'};
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          margin-bottom: ${isMobile ? '16px' : '24px'};
        }
        
        .section-title {
          font-size: ${isMobile ? '16px' : '18px'};
          font-weight: 600;
          margin-bottom: ${isMobile ? '12px' : '16px'};
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: ${isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))'};
          gap: ${isMobile ? '12px' : '20px'};
        }
        
        .stat-card {
          text-align: center;
          padding: ${isMobile ? '12px' : '20px'};
          background: #f8f9fa;
          border-radius: ${isMobile ? '10px' : '12px'};
        }
        
        .stat-value {
          font-size: ${isMobile ? '24px' : '32px'};
          font-weight: 700;
          color: #2d3436;
        }
        
        .stat-label {
          font-size: ${isMobile ? '12px' : '14px'};
          color: #636e72;
          margin-top: ${isMobile ? '2px' : '4px'};
        }
        
        .loading-skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 4px;
          height: 32px;
          width: 60px;
          margin: 0 auto;
        }
        
        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        
        /* アドバイスセクション */
        .advice-section {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          border-radius: ${isMobile ? '12px' : '16px'};
          padding: ${isMobile ? '16px' : '24px'};
          color: white;
          text-align: center;
          margin-bottom: ${isMobile ? '16px' : '24px'};
        }
        
        .advice-title {
          font-size: ${isMobile ? '16px' : '20px'};
          font-weight: 600;
          margin-bottom: ${isMobile ? '8px' : '12px'};
        }
        
        .advice-text {
          font-size: ${isMobile ? '12px' : '14px'};
          line-height: 1.6;
          opacity: 0.9;
        }
        
        /* クイックスタートボタン */
        .quick-start-section {
          text-align: center;
          margin-top: ${isMobile ? '20px' : '32px'};
        }
        
        .quick-start-button {
          display: inline-block;
          background: #6c5ce7;
          color: white;
          border: none;
          border-radius: ${isMobile ? '12px' : '16px'};
          padding: ${isMobile ? '12px 20px' : '16px 32px'};
          font-size: ${isMobile ? '14px' : '16px'};
          font-weight: 600;
          box-shadow: 0 4px 16px rgba(108, 92, 231, 0.3);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .quick-start-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(108, 92, 231, 0.4);
        }
      `}</style>

      <main className="main-content">
        <div className="greeting-section">
          <div className="greeting">二次試験対策</div>
          <div className="date">面接と小論文で差をつけよう</div>
        </div>
        
        <div className="welcome-message">
          <div className="welcome-title">二次試験対策を始めましょう</div>
          <div className="welcome-text">
            面接対策と小論文対策で、合格への準備を万全にしましょう。
            {!isMobile && <br />}
            AIによる評価とフィードバックで、効率的に実力を向上させることができます。
          </div>
        </div>
        
        <div className="practice-cards">
          {/* 面接対策カード */}
          <div className="interview-card" onClick={() => router.push('/interview')}>
            <div className="card-header">
              <div className="card-title-section">
                <div className="card-label">インタラクティブ練習</div>
                <div className="card-title">面接対策</div>
              </div>
              <div className="card-icon">
                <Mic size={isMobile ? 20 : 24} />
              </div>
            </div>
            <div className="card-content">
              <p className="card-description">
                本番さながらの面接練習で、自信を持って臨めるようになります
              </p>
              <div className="feature-list">
                <div className="feature-item">
                  <Target className="feature-icon" size={isMobile ? 14 : 18} />
                  <span>カラオケ式ペース練習</span>
                </div>
                <div className="feature-item">
                  <Clock className="feature-icon" size={isMobile ? 14 : 18} />
                  <span>音声録音・文字起こし</span>
                </div>
                <div className="feature-item">
                  <BarChart3 className="feature-icon" size={isMobile ? 14 : 18} />
                  <span>AI評価・フィードバック</span>
                </div>
              </div>
              <button className="practice-button">
                練習を始める
                <ChevronRight size={isMobile ? 16 : 18} />
              </button>
            </div>
          </div>

          {/* 小論文対策カード */}
          <div className="essay-card" onClick={() => router.push('/essay')}>
            <div className="card-header">
              <div className="card-title-section">
                <div className="card-label">論理的思考力強化</div>
                <div className="card-title">小論文対策</div>
              </div>
              <div className="card-icon">
                <PenTool size={isMobile ? 20 : 24} />
              </div>
            </div>
            <div className="card-content">
              <p className="card-description">
                論理的思考力と文章力を鍛えて、説得力のある小論文を書けるようになります
              </p>
              <div className="feature-list">
                <div className="feature-item">
                  <Target className="feature-icon" size={isMobile ? 14 : 18} />
                  <span>学部別テーマ練習</span>
                </div>
                <div className="feature-item">
                  <Clock className="feature-icon" size={isMobile ? 14 : 18} />
                  <span>リアルタイム文字数カウント</span>
                </div>
                <div className="feature-item">
                  <BarChart3 className="feature-icon" size={isMobile ? 14 : 18} />
                  <span>構成・内容・表現の評価</span>
                </div>
              </div>
              <button className="practice-button essay">
                練習を始める
                <ChevronRight size={isMobile ? 16 : 18} />
              </button>
            </div>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="stats-section">
          <h2 className="section-title">練習実績</h2>
          <div className="stats-grid">
            <div className="stat-card">
              {statsLoading ? (
                <div className="loading-skeleton"></div>
              ) : (
                <div className="stat-value">{stats.interviewCount}</div>
              )}
              <div className="stat-label">面接練習回数</div>
            </div>
            <div className="stat-card">
              {statsLoading ? (
                <div className="loading-skeleton"></div>
              ) : (
                <div className="stat-value">{stats.essayCount}</div>
              )}
              <div className="stat-label">小論文作成数</div>
            </div>
            <div className="stat-card">
              {statsLoading ? (
                <div className="loading-skeleton"></div>
              ) : (
                <div className="stat-value">
                  {stats.averageScore > 0 ? `${stats.averageScore}点` : '--'}
                </div>
              )}
              <div className="stat-label">平均評価スコア</div>
            </div>
            <div className="stat-card">
              {statsLoading ? (
                <div className="loading-skeleton"></div>
              ) : (
                <div className="stat-value">{stats.consecutiveDays}</div>
              )}
              <div className="stat-label">連続練習日数</div>
            </div>
          </div>
        </div>

        {/* アドバイスセクション */}
        <div className="advice-section">
          <h3 className="advice-title">💡 二次試験対策のポイント</h3>
          <p className="advice-text">
            面接と小論文は、練習量が結果に直結します。
            {!isMobile && <br />}
            毎日少しずつでも練習を重ねることで、確実に実力が向上します。
            {!isMobile && <br />}
            AIのフィードバックを参考に、弱点を克服していきましょう。
          </p>
        </div>

        {/* クイックスタート */}
        <div className="quick-start-section">
          <button className="quick-start-button" onClick={() => router.push('/problems')}>
            共通テスト対策に戻る →
          </button>
        </div>
      </main>
    </>
  )
}