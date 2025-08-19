// app/(dashboard)/essay/view/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  Calendar, 
  Trophy, 
  Star,
  Share2,
  Printer,
  RefreshCw
} from 'lucide-react';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

interface EssaySubmission {
  id: string;
  themeId: string;
  userId: string;
  content: string;
  isDraft: boolean;
  wordCount: number;
  timeSpent: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  submittedAt?: Timestamp;
  evaluatedAt?: Timestamp;
  evaluation?: {
    totalScore: number;
    criteria: {
      logic: { score: number; maxScore: number; comment: string };
      concreteness: { score: number; maxScore: number; comment: string };
      originality: { score: number; maxScore: number; comment: string };
      structure: { score: number; maxScore: number; comment: string };
    };
    strengths: string[];
    improvements: string[];
    overallComment: string;
    wordCount: {
      actual: number;
      limit: number;
      withinLimit: boolean;
    };
  };
}

interface EssayTheme {
  id: string;
  title: string;
  description: string;
  category: string;
  wordLimit: number;
  timeLimit: number;
  keywords?: string[];
  evaluationCriteria?: string[];
}

export default function EssayViewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [submission, setSubmission] = useState<EssaySubmission | null>(null);
  const [theme, setTheme] = useState<EssayTheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // トースト表示
  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // スタイル定義
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '2rem 1rem',
    },
    content: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
    },
    backButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      border: '1px solid #e9ecef',
      borderRadius: '0.5rem',
      backgroundColor: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '0.875rem',
      color: '#495057',
    },
    headerActions: {
      display: 'flex',
      gap: '0.5rem',
    },
    iconButton: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '2.5rem',
      height: '2.5rem',
      border: '1px solid #e9ecef',
      borderRadius: '0.5rem',
      backgroundColor: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '1rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      marginBottom: '1.5rem',
      overflow: 'hidden',
    },
    cardHeader: {
      padding: '1.5rem',
      borderBottom: '1px solid #e9ecef',
    },
    cardTitle: {
      fontSize: '1.25rem',
      fontWeight: '600',
      marginBottom: '0.5rem',
      color: '#212529',
    },
    cardDescription: {
      fontSize: '0.875rem',
      color: '#6c757d',
    },
    cardContent: {
      padding: '1.5rem',
    },
    sectionTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      marginBottom: '0.5rem',
      color: '#495057',
    },
    problemText: {
      whiteSpace: 'pre-wrap' as const,
      lineHeight: '1.6',
      color: '#495057',
      fontSize: '0.875rem',
    },
    keywordContainer: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '0.5rem',
      marginTop: '1rem',
    },
    keyword: {
      padding: '0.375rem 0.75rem',
      backgroundColor: '#f1f3f5',
      borderRadius: '0.375rem',
      fontSize: '0.875rem',
      color: '#495057',
    },
    infoGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
    },
    infoItem: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.25rem',
    },
    infoLabel: {
      fontSize: '0.875rem',
      color: '#6c757d',
    },
    infoValue: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '1rem',
      fontWeight: '600',
      color: '#212529',
    },
    contentText: {
      whiteSpace: 'pre-wrap' as const,
      lineHeight: '1.8',
      color: '#495057',
      fontSize: '0.875rem',
    },
    evaluationSection: {
      textAlign: 'center' as const,
      padding: '2rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '0.5rem',
      marginBottom: '1.5rem',
    },
    scoreLabel: {
      fontSize: '0.875rem',
      color: '#6c757d',
      marginBottom: '0.5rem',
    },
    scoreValue: {
      fontSize: '3rem',
      fontWeight: '700',
      color: '#212529',
    },
    criteriaItem: {
      marginBottom: '1.5rem',
    },
    criteriaHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '0.5rem',
    },
    criteriaName: {
      fontWeight: '500',
      color: '#495057',
    },
    criteriaScore: {
      fontWeight: '600',
      color: '#212529',
    },
    progressBar: {
      height: '0.5rem',
      backgroundColor: '#e9ecef',
      borderRadius: '0.25rem',
      overflow: 'hidden',
      marginBottom: '0.5rem',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#007bff',
      transition: 'width 0.3s ease',
    },
    criteriaComment: {
      fontSize: '0.875rem',
      color: '#6c757d',
      lineHeight: '1.4',
    },
    feedbackSection: {
      marginBottom: '1.5rem',
    },
    feedbackTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '1rem',
      fontWeight: '600',
      marginBottom: '0.5rem',
      color: '#495057',
    },
    feedbackList: {
      listStyle: 'none',
      padding: 0,
    },
    feedbackItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.5rem',
      marginBottom: '0.5rem',
      fontSize: '0.875rem',
      color: '#6c757d',
    },
    overallComment: {
      fontSize: '0.875rem',
      color: '#6c757d',
      lineHeight: '1.6',
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      border: '1px solid #e9ecef',
      backgroundColor: 'white',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500',
      transition: 'all 0.2s ease',
    },
    primaryButton: {
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
    },
    emptyState: {
      textAlign: 'center' as const,
      padding: '4rem 2rem',
    },
    emptyIcon: {
      color: '#dee2e6',
      marginBottom: '1rem',
    },
    emptyText: {
      color: '#6c757d',
      marginBottom: '1rem',
    },
    loader: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
    },
    spinner: {
      width: '3rem',
      height: '3rem',
      border: '0.25rem solid #f3f3f3',
      borderTop: '0.25rem solid #007bff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    toast: {
      position: 'fixed' as const,
      bottom: '2rem',
      right: '2rem',
      padding: '1rem 1.5rem',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      animation: 'slideIn 0.3s ease',
    },
    toastSuccess: {
      backgroundColor: '#28a745',
      color: 'white',
    },
    toastError: {
      backgroundColor: '#dc3545',
      color: 'white',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.25rem 0.75rem',
      backgroundColor: '#fff5f5',
      color: '#f03e3e',
      borderRadius: '0.375rem',
      fontSize: '0.75rem',
      fontWeight: '500',
    },
  };

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // 提出物の取得
  useEffect(() => {
    const fetchSubmission = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        const submissionDoc = await getDoc(doc(db, 'essaySubmissions', resolvedParams.id));
        
        if (!submissionDoc.exists()) {
          showToast('error', '小論文が見つかりません');
          router.push('/essay/history');
          return;
        }
        
        const submissionData = {
          id: submissionDoc.id,
          ...submissionDoc.data()
        } as EssaySubmission;
        
        if (submissionData.userId !== user.uid) {
          showToast('error', 'この小論文を表示する権限がありません');
          router.push('/essay/history');
          return;
        }
        
        setSubmission(submissionData);
        
        const themeDoc = await getDoc(doc(db, 'essay_themes', submissionData.themeId));
        if (themeDoc.exists()) {
          setTheme({
            id: themeDoc.id,
            ...themeDoc.data()
          } as EssayTheme);
        }
        
      } catch (error) {
        console.error('Error fetching submission:', error);
        showToast('error', 'データの取得に失敗しました');
        router.push('/essay/history');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchSubmission();
    }
  }, [resolvedParams.id, user, router]);

  // 再評価
  const reevaluate = async () => {
    if (!user || !submission || !theme || isEvaluating) return;

    try {
      setIsEvaluating(true);
      
      const idToken = await user.getIdToken();

      const response = await fetch('/api/essay/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          theme,
          content: submission.content,
          submissionId: submission.id,
        }),
      });

      if (!response.ok) {
        throw new Error('評価に失敗しました');
      }

      const data = await response.json();
      
      await updateDoc(doc(db, 'essaySubmissions', submission.id), {
        evaluation: data.evaluation,
        evaluatedAt: new Date(),
      });

      setSubmission({
        ...submission,
        evaluation: data.evaluation,
        evaluatedAt: Timestamp.now(),
      });

      showToast('success', `総合得点: ${data.evaluation.totalScore}点`);

    } catch (error) {
      console.error('Error evaluating essay:', error);
      showToast('error', '評価に失敗しました');
    } finally {
      setIsEvaluating(false);
    }
  };

  // 時間のフォーマット
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}時間${minutes}分`;
    }
    return `${minutes}分`;
  };

  // 日付のフォーマット
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // 印刷
  const handlePrint = () => {
    window.print();
  };

  // 共有
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('success', 'URLをクリップボードにコピーしました');
    } catch (error) {
      showToast('error', 'コピーに失敗しました');
    }
  };

  if (isLoading) {
    return (
      <div style={styles.loader}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '1rem', color: '#6c757d' }}>読み込み中...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!submission || !theme) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* ヘッダー */}
        <div style={styles.header}>
          <button
            style={styles.backButton}
            onClick={() => router.push('/essay/history')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            <ArrowLeft size={16} />
            履歴に戻る
          </button>
          
          <div style={styles.headerActions}>
            <button
              style={styles.iconButton}
              onClick={handleShare}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <Share2 size={16} />
            </button>
            <button
              style={styles.iconButton}
              onClick={handlePrint}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <Printer size={16} />
            </button>
          </div>
        </div>

        {/* テーマ情報 */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>{theme.title}</h2>
            <p style={styles.cardDescription}>
              {theme.category} | {theme.wordLimit}字 | 制限時間: {theme.timeLimit}分
            </p>
          </div>
          <div style={styles.cardContent}>
            <div>
              <h3 style={styles.sectionTitle}>問題文</h3>
              <p style={styles.problemText}>{theme.description}</p>
            </div>
            {theme.keywords && theme.keywords.length > 0 && (
              <div style={styles.keywordContainer}>
                {theme.keywords.map((keyword, index) => (
                  <span key={index} style={styles.keyword}>
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 提出情報 */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={styles.cardTitle}>提出情報</h2>
              {submission.isDraft && (
                <span style={styles.badge}>下書き</span>
              )}
            </div>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>文字数</p>
                <p style={styles.infoValue}>
                  <FileText size={16} />
                  {submission.wordCount}字
                </p>
              </div>
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>作成時間</p>
                <p style={styles.infoValue}>
                  <Clock size={16} />
                  {formatTime(submission.timeSpent)}
                </p>
              </div>
              <div style={styles.infoItem}>
                <p style={styles.infoLabel}>提出日時</p>
                <p style={styles.infoValue}>
                  <Calendar size={16} />
                  {formatDate(submission.submittedAt || submission.updatedAt)}
                </p>
              </div>
              {submission.evaluation && (
                <div style={styles.infoItem}>
                  <p style={styles.infoLabel}>総合得点</p>
                  <p style={styles.infoValue}>
                    <Trophy size={16} />
                    {submission.evaluation.totalScore}点
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 解答内容 */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>解答内容</h2>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.contentText}>
              {submission.content}
            </div>
          </div>
        </div>

        {/* 評価結果 */}
        {submission.evaluation ? (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={styles.cardTitle}>
                  <Trophy size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
                  評価結果
                </h2>
                <button
                  style={styles.button}
                  onClick={reevaluate}
                  disabled={isEvaluating}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  <RefreshCw size={16} className={isEvaluating ? 'animate-spin' : ''} />
                  再評価
                </button>
              </div>
            </div>
            <div style={styles.cardContent}>
              {/* 総合得点 */}
              <div style={styles.evaluationSection}>
                <p style={styles.scoreLabel}>総合得点</p>
                <p style={styles.scoreValue}>{submission.evaluation.totalScore}点</p>
                <p style={styles.scoreLabel}>/ 100点</p>
              </div>

              {/* 詳細評価 */}
              <div>
                {Object.entries(submission.evaluation.criteria).map(([key, criterion]: [string, any]) => (
                  <div key={key} style={styles.criteriaItem}>
                    <div style={styles.criteriaHeader}>
                      <span style={styles.criteriaName}>
                        {key === 'logic' ? '論理性' :
                         key === 'concreteness' ? '具体性' :
                         key === 'originality' ? '独創性' : '文章構成'}
                      </span>
                      <span style={styles.criteriaScore}>
                        {criterion.score}/{criterion.maxScore}点
                      </span>
                    </div>
                    <div style={styles.progressBar}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${(criterion.score / criterion.maxScore) * 100}%`,
                        }}
                      />
                    </div>
                    <p style={styles.criteriaComment}>{criterion.comment}</p>
                  </div>
                ))}
              </div>

              {/* 良い点 */}
              {submission.evaluation.strengths.length > 0 && (
                <div style={styles.feedbackSection}>
                  <h4 style={styles.feedbackTitle}>
                    <Star size={16} style={{ color: '#ffc107' }} />
                    良い点
                  </h4>
                  <ul style={styles.feedbackList}>
                    {submission.evaluation.strengths.map((strength: string, index: number) => (
                      <li key={index} style={styles.feedbackItem}>
                        <span>•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 改善点 */}
              {submission.evaluation.improvements.length > 0 && (
                <div style={styles.feedbackSection}>
                  <h4 style={styles.feedbackTitle}>改善点</h4>
                  <ul style={styles.feedbackList}>
                    {submission.evaluation.improvements.map((improvement: string, index: number) => (
                      <li key={index} style={styles.feedbackItem}>
                        <span>•</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 総評 */}
              {submission.evaluation.overallComment && (
                <div style={styles.feedbackSection}>
                  <h4 style={styles.feedbackTitle}>総評</h4>
                  <p style={styles.overallComment}>{submission.evaluation.overallComment}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={styles.card}>
            <div style={styles.cardContent}>
              <div style={styles.emptyState}>
                <Trophy size={48} style={styles.emptyIcon} />
                <p style={styles.emptyText}>まだ評価されていません</p>
                <button
                  style={{ ...styles.button, ...styles.primaryButton }}
                  onClick={reevaluate}
                  disabled={isEvaluating}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0056b3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#007bff';
                  }}
                >
                  <RefreshCw size={16} className={isEvaluating ? 'animate-spin' : ''} />
                  評価を実行
                </button>
              </div>
            </div>
          </div>
        )}

        {/* トースト */}
        {toastMessage && (
          <div
            style={{
              ...styles.toast,
              ...(toastMessage.type === 'success' ? styles.toastSuccess : styles.toastError),
            }}
          >
            {toastMessage.message}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}