// app/(dashboard)/essay/history/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Clock, 
  Calendar, 
  Trophy, 
  Eye, 
  Edit,
  ChevronRight,
  Filter
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';

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
  };
  theme?: {
    title: string;
    category: string;
    wordLimit: number;
  };
}

export default function EssayHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<EssaySubmission[]>([]);
  const [drafts, setDrafts] = useState<EssaySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('submitted');
  const [filter, setFilter] = useState<'all' | 'evaluated' | 'not-evaluated'>('all');
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
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#212529',
    },
    primaryButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1.5rem',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500',
      transition: 'all 0.2s ease',
    },
    tabs: {
      display: 'flex',
      gap: '1rem',
      marginBottom: '2rem',
      borderBottom: '2px solid #e9ecef',
    },
    tab: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 1rem',
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.875rem',
      fontWeight: '500',
      color: '#6c757d',
      borderBottom: '2px solid transparent',
      marginBottom: '-2px',
      transition: 'all 0.2s ease',
    },
    activeTab: {
      color: '#007bff',
      borderBottomColor: '#007bff',
    },
    filterSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '1.5rem',
    },
    filterButton: {
      padding: '0.375rem 0.75rem',
      border: '1px solid #e9ecef',
      borderRadius: '0.375rem',
      backgroundColor: 'white',
      cursor: 'pointer',
      fontSize: '0.875rem',
      transition: 'all 0.2s ease',
    },
    activeFilter: {
      backgroundColor: '#007bff',
      color: 'white',
      borderColor: '#007bff',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '1rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      marginBottom: '1rem',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s ease',
      cursor: 'pointer',
    },
    cardHeader: {
      padding: '1.5rem',
      borderBottom: '1px solid #e9ecef',
    },
    cardTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      marginBottom: '0.25rem',
      color: '#212529',
    },
    cardDescription: {
      fontSize: '0.875rem',
      color: '#6c757d',
    },
    cardContent: {
      padding: '1.5rem',
    },
    contentPreview: {
      fontSize: '0.875rem',
      color: '#6c757d',
      marginBottom: '1rem',
      overflow: 'hidden',
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical' as const,
      lineHeight: '1.5',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      padding: '0.25rem 0.75rem',
      backgroundColor: '#f1f3f5',
      borderRadius: '0.375rem',
      fontSize: '0.75rem',
      fontWeight: '500',
      color: '#495057',
    },
    scoreBadge: {
      backgroundColor: '#e7f5ff',
      color: '#1c7ed6',
    },
    draftBadge: {
      backgroundColor: '#fff5f5',
      color: '#f03e3e',
    },
    metaInfo: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '0.875rem',
      color: '#6c757d',
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
    },
    actionButtons: {
      display: 'flex',
      gap: '0.5rem',
    },
    actionButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      padding: '0.375rem 0.75rem',
      border: '1px solid #e9ecef',
      borderRadius: '0.375rem',
      backgroundColor: 'white',
      cursor: 'pointer',
      fontSize: '0.875rem',
      transition: 'all 0.2s ease',
    },
    emptyState: {
      backgroundColor: 'white',
      borderRadius: '1rem',
      padding: '4rem 2rem',
      textAlign: 'center' as const,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    emptyIcon: {
      color: '#dee2e6',
      marginBottom: '1rem',
    },
    emptyText: {
      color: '#6c757d',
      fontSize: '1rem',
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

  // 提出履歴の取得
  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // 提出済みの小論文を取得
        const submittedQuery = query(
          collection(db, 'essaySubmissions'),
          where('userId', '==', user.uid),
          where('isDraft', '==', false)
        );
        
        const submittedSnapshot = await getDocs(submittedQuery);
        const submittedData: EssaySubmission[] = [];
        
        for (const docSnapshot of submittedSnapshot.docs) {
          const data = docSnapshot.data() as EssaySubmission;
          const submission: EssaySubmission = {
            id: docSnapshot.id,
            ...data
          };
          
          try {
            const themeDoc = await getDoc(doc(db, 'essay_themes', data.themeId));
            if (themeDoc.exists()) {
              submission.theme = themeDoc.data() as any;
            }
          } catch (error) {
            console.error('Error fetching theme:', error);
          }
          
          submittedData.push(submission);
        }
        
        submittedData.sort((a, b) => {
          const aTime = a.submittedAt?.toMillis() || 0;
          const bTime = b.submittedAt?.toMillis() || 0;
          return bTime - aTime;
        });
        
        setSubmissions(submittedData);
        
        // 下書きを取得
        const draftsQuery = query(
          collection(db, 'essaySubmissions'),
          where('userId', '==', user.uid),
          where('isDraft', '==', true)
        );
        
        const draftsSnapshot = await getDocs(draftsQuery);
        const draftsData: EssaySubmission[] = [];
        
        for (const docSnapshot of draftsSnapshot.docs) {
          const data = docSnapshot.data() as EssaySubmission;
          const draft: EssaySubmission = {
            id: docSnapshot.id,
            ...data
          };
          
          try {
            const themeDoc = await getDoc(doc(db, 'essay_themes', data.themeId));
            if (themeDoc.exists()) {
              draft.theme = themeDoc.data() as any;
            }
          } catch (error) {
            console.error('Error fetching theme:', error);
          }
          
          draftsData.push(draft);
        }
        
        draftsData.sort((a, b) => {
          const aTime = a.updatedAt?.toMillis() || 0;
          const bTime = b.updatedAt?.toMillis() || 0;
          return bTime - aTime;
        });
        
        setDrafts(draftsData);
        
      } catch (error) {
        console.error('Error fetching submissions:', error);
        showToast('error', '履歴の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  // フィルタリング
  const filteredSubmissions = submissions.filter(submission => {
    if (filter === 'evaluated') return submission.evaluation;
    if (filter === 'not-evaluated') return !submission.evaluation;
    return true;
  });

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

  // 提出物カード
  const SubmissionCard = ({ submission }: { submission: EssaySubmission }) => (
    <div
      style={styles.card}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
      }}
    >
      <div style={styles.cardHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={styles.cardTitle}>
              {submission.theme?.title || 'タイトル不明'}
            </h3>
            <p style={styles.cardDescription}>
              {submission.theme?.category || 'カテゴリー不明'} | {submission.wordCount}字
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
            {submission.evaluation && (
              <span style={{ ...styles.badge, ...styles.scoreBadge }}>
                <Trophy size={12} />
                {submission.evaluation.totalScore}点
              </span>
            )}
            {submission.isDraft && (
              <span style={{ ...styles.badge, ...styles.draftBadge }}>
                下書き
              </span>
            )}
          </div>
        </div>
      </div>
      <div style={styles.cardContent}>
        <p style={styles.contentPreview}>
          {submission.content}
        </p>
        
        <div style={styles.metaInfo}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span style={styles.metaItem}>
              <Clock size={14} />
              {formatTime(submission.timeSpent)}
            </span>
            <span style={styles.metaItem}>
              <Calendar size={14} />
              {formatDate(submission.submittedAt || submission.updatedAt)}
            </span>
          </div>
          
          <div style={styles.actionButtons}>
            <button
              style={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/essay/view/${submission.id}`);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <Eye size={14} />
              詳細
            </button>
            {submission.isDraft && (
              <button
                style={styles.actionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/essay/write/${submission.themeId}?draft=${submission.id}`);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <Edit size={14} />
                続きを書く
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

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

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>小論文履歴</h1>
          <button
            style={styles.primaryButton}
            onClick={() => router.push('/essay')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#0056b3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#007bff';
            }}
          >
            新しいテーマに挑戦
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={styles.tabs}>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'submitted' ? styles.activeTab : {}),
            }}
            onClick={() => setActiveTab('submitted')}
          >
            <FileText size={16} />
            提出済み ({submissions.length})
          </button>
          <button
            style={{
              ...styles.tab,
              ...(activeTab === 'drafts' ? styles.activeTab : {}),
            }}
            onClick={() => setActiveTab('drafts')}
          >
            <Edit size={16} />
            下書き ({drafts.length})
          </button>
        </div>

        {activeTab === 'submitted' && (
          <>
            {submissions.length > 0 && (
              <div style={styles.filterSection}>
                <Filter size={16} color="#6c757d" />
                <button
                  style={{
                    ...styles.filterButton,
                    ...(filter === 'all' ? styles.activeFilter : {}),
                  }}
                  onClick={() => setFilter('all')}
                >
                  すべて
                </button>
                <button
                  style={{
                    ...styles.filterButton,
                    ...(filter === 'evaluated' ? styles.activeFilter : {}),
                  }}
                  onClick={() => setFilter('evaluated')}
                >
                  評価済み
                </button>
                <button
                  style={{
                    ...styles.filterButton,
                    ...(filter === 'not-evaluated' ? styles.activeFilter : {}),
                  }}
                  onClick={() => setFilter('not-evaluated')}
                >
                  未評価
                </button>
              </div>
            )}

            <div>
              {filteredSubmissions.length > 0 ? (
                filteredSubmissions.map((submission) => (
                  <SubmissionCard key={submission.id} submission={submission} />
                ))
              ) : (
                <div style={styles.emptyState}>
                  <FileText size={48} style={styles.emptyIcon} />
                  <p style={styles.emptyText}>
                    {filter === 'all' 
                      ? 'まだ小論文を提出していません' 
                      : filter === 'evaluated'
                      ? '評価済みの小論文はありません'
                      : '未評価の小論文はありません'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'drafts' && (
          <div>
            {drafts.length > 0 ? (
              drafts.map((draft) => (
                <SubmissionCard key={draft.id} submission={draft} />
              ))
            ) : (
              <div style={styles.emptyState}>
                <Edit size={48} style={styles.emptyIcon} />
                <p style={styles.emptyText}>下書きはありません</p>
              </div>
            )}
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
      `}</style>
    </div>
  );
}