// app/(dashboard)/essay/write/[themeId]/page.tsx
'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Send, Timer, FileText, Trophy, Star, BarChart, Play, Pause } from 'lucide-react';
import { EssayTheme } from '@/types/essay';
import { doc, getDoc, collection, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import Chart from 'chart.js/auto';
import { AutoGraphInjector } from '@/lib/services/auto-graph-injector';

interface PageProps {
  params: Promise<{
    themeId: string;
  }>;
}

export default function EssayWritePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<EssayTheme | null>(null);
  const [content, setContent] = useState('');
  const [isDraft, setIsDraft] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedDraftId, setSavedDraftId] = useState<string | null>(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // グラフ表示用のref
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // トースト表示
  const showToast = (type: 'success' | 'error', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // グラフレンダリング関数
  const renderGraph = (graphData: any) => {
    if (!chartRef.current || !graphData) return;

    // 既存のチャートがあれば破棄
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    let config: any = null;

    // グラフタイプに応じて設定を作成（モバイル用に最適化）
    switch (graphData.type) {
      case 'line_chart':
        const datasets = [];
        
        // 医療費データ
        if (graphData.data.medical_costs) {
          datasets.push({
            label: '医療費（兆円）',
            data: graphData.data.medical_costs,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            yAxisID: 'y1',
          });
        }
        
        // 高齢者人口データ
        if (graphData.data.elderly_population) {
          datasets.push({
            label: '65歳以上人口（万人）',
            data: graphData.data.elderly_population,
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            yAxisID: 'y2',
          });
        }

        // 汎用データ
        if (graphData.data.values && !graphData.data.medical_costs) {
          datasets.push({
            label: graphData.data.label || 'データ',
            data: graphData.data.values,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
          });
        }

        // 複数系列の汎用データ
        if (!datasets.length && graphData.data) {
          const colors = [
            { border: 'rgb(255, 99, 132)', bg: 'rgba(255, 99, 132, 0.1)' },
            { border: 'rgb(54, 162, 235)', bg: 'rgba(54, 162, 235, 0.1)' },
            { border: 'rgb(75, 192, 192)', bg: 'rgba(75, 192, 192, 0.1)' },
            { border: 'rgb(153, 102, 255)', bg: 'rgba(153, 102, 255, 0.1)' },
          ];
          
          let colorIndex = 0;
          for (const [key, values] of Object.entries(graphData.data)) {
            if (Array.isArray(values) && key !== 'years' && key !== 'labels') {
              datasets.push({
                label: key,
                data: values,
                borderColor: colors[colorIndex % colors.length].border,
                backgroundColor: colors[colorIndex % colors.length].bg,
              });
              colorIndex++;
            }
          }
        }

        config = {
          type: 'line',
          data: {
            labels: graphData.data.years || graphData.data.labels || [],
            datasets: datasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              title: {
                display: true,
                text: graphData.title || 'データの推移',
                font: { size: 12 }
              },
              legend: {
                display: true,
                position: 'bottom',
                labels: {
                  font: { size: 10 },
                  boxWidth: 12
                }
              }
            },
            scales: {
              x: {
                display: true,
                title: {
                  display: true,
                  text: graphData.xLabel || 'X軸',
                  font: { size: 10 }
                },
                ticks: {
                  font: { size: 9 }
                }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                  display: true,
                  text: datasets[0]?.label || graphData.yLabel || 'Y軸',
                  font: { size: 10 }
                },
                ticks: {
                  font: { size: 9 }
                }
              },
              y2: datasets.length > 1 ? {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                  display: true,
                  text: datasets[1]?.label || 'Y軸2',
                  font: { size: 10 }
                },
                grid: {
                  drawOnChartArea: false,
                },
                ticks: {
                  font: { size: 9 }
                }
              } : undefined
            }
          }
        };
        break;

      case 'bar_chart':
        config = {
          type: 'bar',
          data: {
            labels: graphData.data.labels || graphData.data.categories || [],
            datasets: [{
              label: graphData.data.label || graphData.yLabel || 'データ',
              data: graphData.data.values || [],
              backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
                'rgba(153, 102, 255, 0.5)',
              ],
              borderColor: [
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 206, 86)',
                'rgb(75, 192, 192)',
                'rgb(153, 102, 255)',
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: graphData.title || 'データ比較',
                font: { size: 12 }
              },
              legend: {
                display: false
              }
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: graphData.xLabel || 'カテゴリ',
                  font: { size: 10 }
                },
                ticks: {
                  font: { size: 9 }
                }
              },
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: graphData.yLabel || '値',
                  font: { size: 10 }
                },
                ticks: {
                  font: { size: 9 }
                }
              }
            }
          }
        };
        break;

      case 'pie_chart':
        config = {
          type: 'pie',
          data: {
            labels: graphData.data.labels || [],
            datasets: [{
              data: graphData.data.values || [],
              backgroundColor: [
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                'rgba(75, 192, 192, 0.5)',
                'rgba(153, 102, 255, 0.5)',
                'rgba(255, 159, 64, 0.5)'
              ],
              borderColor: [
                'rgb(255, 99, 132)',
                'rgb(54, 162, 235)',
                'rgb(255, 206, 86)',
                'rgb(75, 192, 192)',
                'rgb(153, 102, 255)',
                'rgb(255, 159, 64)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: graphData.title || '構成比',
                font: { size: 12 }
              },
              legend: {
                display: true,
                position: 'bottom',
                labels: {
                  font: { size: 10 },
                  boxWidth: 12
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context: any) {
                    const label = context.label || '';
                    const value = context.parsed;
                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            }
          }
        };
        break;

      case 'scatter_plot':
        const scatterData = graphData.data.points || 
          (graphData.data.x && graphData.data.y ? 
            graphData.data.x.map((x: number, i: number) => ({ x, y: graphData.data.y[i] })) : 
            []);
        
        config = {
          type: 'scatter',
          data: {
            datasets: [{
              label: graphData.data.label || 'データポイント',
              data: scatterData,
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              borderColor: 'rgb(75, 192, 192)',
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: graphData.title || '相関関係',
                font: { size: 12 }
              },
              legend: {
                display: false
              }
            },
            scales: {
              x: {
                type: 'linear',
                position: 'bottom',
                title: {
                  display: true,
                  text: graphData.xLabel || 'X軸',
                  font: { size: 10 }
                },
                ticks: {
                  font: { size: 9 }
                }
              },
              y: {
                title: {
                  display: true,
                  text: graphData.yLabel || 'Y軸',
                  font: { size: 10 }
                },
                ticks: {
                  font: { size: 9 }
                }
              }
            }
          }
        };
        break;
    }

    if (config) {
      chartInstance.current = new Chart(ctx, config);
    }
  };

  // スタイル定義（モバイル最適化）
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '12px',
    },
    content: {
      maxWidth: '100%',
      margin: '0 auto',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },
    backButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 12px',
      border: '1px solid #e9ecef',
      borderRadius: '6px',
      backgroundColor: 'white',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '12px',
      color: '#495057',
    },
    timerSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    timerDisplay: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      color: '#6c757d',
      fontSize: '12px',
    },
    timerButton: {
      padding: '6px 10px',
      border: '1px solid #e9ecef',
      borderRadius: '4px',
      backgroundColor: 'white',
      cursor: 'pointer',
      fontSize: '11px',
      transition: 'all 0.2s ease',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      marginBottom: '16px',
      overflow: 'hidden',
    },
    cardHeader: {
      padding: '12px',
      borderBottom: '1px solid #e9ecef',
    },
    cardTitle: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '4px',
      color: '#212529',
    },
    cardDescription: {
      fontSize: '11px',
      color: '#6c757d',
    },
    cardContent: {
      padding: '12px',
    },
    sectionTitle: {
      fontSize: '13px',
      fontWeight: '600',
      marginBottom: '6px',
      color: '#495057',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    problemText: {
      whiteSpace: 'pre-wrap' as const,
      lineHeight: '1.5',
      color: '#495057',
      fontSize: '12px',
    },
    graphContainer: {
      marginTop: '12px',
      marginBottom: '12px',
    },
    graphWrapper: {
      backgroundColor: '#f8f9fa',
      padding: '12px',
      borderRadius: '6px',
      marginTop: '6px',
      border: '1px solid #e9ecef',
    },
    canvasContainer: {
      position: 'relative' as const,
      width: '100%',
      height: '200px',
      marginBottom: '8px',
    },
    graphDataDisplay: {
      marginTop: '8px',
      fontSize: '11px',
      color: '#6c757d',
    },
    keywordContainer: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '6px',
      marginTop: '8px',
    },
    keyword: {
      padding: '4px 8px',
      backgroundColor: '#f1f3f5',
      borderRadius: '4px',
      fontSize: '11px',
      color: '#495057',
    },
    textareaContainer: {
      position: 'relative' as const,
    },
    textarea: {
      width: '100%',
      minHeight: '250px',
      padding: '10px',
      border: '1px solid #e9ecef',
      borderRadius: '6px',
      fontSize: '13px',
      lineHeight: '1.5',
      resize: 'none' as const,
      fontFamily: 'inherit',
      boxSizing: 'border-box' as const,
    },
    wordCount: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '11px',
      fontFamily: 'monospace',
    },
    headerMeta: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '4px',
      alignItems: 'flex-end',
    },
    actionButtons: {
      display: 'flex',
      gap: '8px',
      marginTop: '12px',
    },
    button: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      flex: 1,
      justifyContent: 'center',
    },
    primaryButton: {
      backgroundColor: '#007bff',
      color: 'white',
    },
    secondaryButton: {
      backgroundColor: 'white',
      color: '#495057',
      border: '1px solid #e9ecef',
    },
    evaluationCard: {
      marginTop: '16px',
    },
    scoreSection: {
      textAlign: 'center' as const,
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '6px',
      marginBottom: '16px',
    },
    scoreLabel: {
      fontSize: '11px',
      color: '#6c757d',
      marginBottom: '4px',
    },
    scoreValue: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#212529',
    },
    criteriaGrid: {
      display: 'grid',
      gap: '12px',
      marginBottom: '16px',
    },
    criteriaItem: {
      padding: '12px',
      backgroundColor: '#f8f9fa',
      borderRadius: '6px',
    },
    criteriaHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '6px',
    },
    criteriaName: {
      fontWeight: '500',
      color: '#495057',
      fontSize: '12px',
    },
    criteriaScore: {
      fontWeight: '600',
      color: '#212529',
      fontSize: '12px',
    },
    progressBar: {
      height: '6px',
      backgroundColor: '#e9ecef',
      borderRadius: '3px',
      overflow: 'hidden',
      marginBottom: '6px',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#007bff',
      transition: 'width 0.3s ease',
    },
    criteriaComment: {
      fontSize: '11px',
      color: '#6c757d',
      lineHeight: '1.4',
    },
    feedbackSection: {
      marginBottom: '16px',
    },
    feedbackTitle: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '13px',
      fontWeight: '600',
      marginBottom: '6px',
      color: '#495057',
    },
    feedbackList: {
      listStyle: 'none',
      padding: 0,
    },
    feedbackItem: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '6px',
      marginBottom: '4px',
      fontSize: '11px',
      color: '#6c757d',
      lineHeight: '1.4',
    },
    overallComment: {
      fontSize: '11px',
      color: '#6c757d',
      lineHeight: '1.5',
    },
    toast: {
      position: 'fixed' as const,
      bottom: '1rem',
      left: '1rem',
      right: '1rem',
      padding: '12px 16px',
      borderRadius: '6px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      animation: 'slideIn 0.3s ease',
      fontSize: '12px',
    },
    toastSuccess: {
      backgroundColor: '#28a745',
      color: 'white',
    },
    toastError: {
      backgroundColor: '#dc3545',
      color: 'white',
    },
    loader: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
    },
    spinner: {
      width: '2rem',
      height: '2rem',
      border: '0.2rem solid #f3f3f3',
      borderTop: '0.2rem solid #007bff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    },
    wordLimitWarning: {
      marginTop: '8px',
      fontSize: '11px',
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

  // テーマの取得
  useEffect(() => {
    const fetchTheme = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const themeDoc = await getDoc(doc(db, 'essay_themes', resolvedParams.themeId));
        
        if (themeDoc.exists()) {
          const rawData = themeDoc.data();
          
          // デバッグ用：生データをコンソールに出力
          console.log('=== Firebaseから取得した生データ ===');
          console.log('テーマID:', themeDoc.id);
          console.log('全データ:', rawData);
          console.log('graphDataの有無:', !!rawData.graphData);
          console.log('hasGraphフラグ:', rawData.hasGraph);
          if (rawData.graphData) {
            console.log('graphDataの内容:', rawData.graphData);
          }
          console.log('================================');
          
          const themeData = { id: themeDoc.id, ...rawData } as EssayTheme;
          
          // AutoGraphInjectorを使用してグラフデータを自動注入
          const injector = new AutoGraphInjector();
          const enhancedTheme = await injector.injectGraphData(themeData);
          
          console.log('=== 拡張後のテーマデータ ===');
          console.log('graphData注入:', !!enhancedTheme.graphData);
          if (enhancedTheme.graphData) {
            console.log('グラフタイプ:', enhancedTheme.graphData.type);
            console.log('グラフタイトル:', enhancedTheme.graphData.title);
          }
          console.log('================================');
          
          setTheme(enhancedTheme);
          
          // グラフデータがある場合は、少し遅れてレンダリング
          if (enhancedTheme.graphData) {
            setTimeout(() => {
              renderGraph(enhancedTheme.graphData);
            }, 100);
          }
        } else {
          showToast('error', 'テーマが見つかりません');
          router.push('/essay');
        }
      } catch (error) {
        console.error('Error fetching theme:', error);
        showToast('error', 'テーマの取得に失敗しました');
        router.push('/essay');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchTheme();
    }
  }, [resolvedParams.themeId, user, router]);

  // グラフの再レンダリング（テーマが変更された時）
  useEffect(() => {
    if (theme?.graphData) {
      renderGraph(theme.graphData);
    }
  }, [theme?.graphData]);

  // タイマー機能
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerActive) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isTimerActive]);

  // 自動保存（1分ごと）
  useEffect(() => {
    const autoSave = async () => {
      if (content.length > 0 && isDraft && user) {
        await saveDraft(true);
      }
    };

    const interval = setInterval(autoSave, 60000);
    return () => clearInterval(interval);
  }, [content, isDraft, user]);

  // 下書き保存
  const saveDraft = async (isAutoSave = false) => {
    if (!user || !theme || isSaving) return;

    try {
      setIsSaving(true);
      const submissionData = {
        themeId: resolvedParams.themeId,
        userId: user.uid,
        content,
        isDraft: true,
        wordCount: content.length,
        timeSpent: timeElapsed,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (savedDraftId) {
        await updateDoc(doc(db, 'essaySubmissions', savedDraftId), {
          content,
          wordCount: content.length,
          timeSpent: timeElapsed,
          updatedAt: serverTimestamp(),
        });
      } else {
        const docRef = await addDoc(collection(db, 'essaySubmissions'), submissionData);
        setSavedDraftId(docRef.id);
      }

      if (!isAutoSave) {
        showToast('success', '下書きを保存しました');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      showToast('error', '下書きの保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  // 本提出
  const submitEssay = async () => {
    if (!user || !theme || isSubmitting) return;

    if (content.length < theme.requirements.minWords) {
      showToast('error', `最低${theme.requirements.minWords}字以上必要です`);
      return;
    }
    if (content.length > theme.requirements.maxWords) {
      showToast('error', `${theme.requirements.maxWords}字以内で作成してください`);
      return;
    }

    try {
      setIsSubmitting(true);
      const submissionData = {
        themeId: resolvedParams.themeId,
        userId: user.uid,
        content,
        isDraft: false,
        wordCount: content.length,
        timeSpent: timeElapsed,
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      let submissionId = savedDraftId;

      if (savedDraftId) {
        await updateDoc(doc(db, 'essaySubmissions', savedDraftId), {
          content,
          isDraft: false,
          wordCount: content.length,
          timeSpent: timeElapsed,
          submittedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const docRef = await addDoc(collection(db, 'essaySubmissions'), submissionData);
        submissionId = docRef.id;
      }

      showToast('success', '小論文を提出しました！評価を開始します...');
      await evaluateEssay(submissionId);

    } catch (error) {
      console.error('Error submitting essay:', error);
      showToast('error', '提出に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 評価機能
  const evaluateEssay = async (submissionId: string | null) => {
    if (!user || !theme || !content) return;

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
          content,
          submissionId,
        }),
      });

      if (!response.ok) {
        throw new Error('評価に失敗しました');
      }

      const data = await response.json();
      setEvaluation(data.evaluation);
      setShowEvaluation(true);

      if (submissionId) {
        await updateDoc(doc(db, 'essaySubmissions', submissionId), {
          evaluation: data.evaluation,
          evaluatedAt: serverTimestamp(),
        });
      }

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
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div style={styles.loader}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '12px', color: '#6c757d', fontSize: '13px' }}>読み込み中...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!theme) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* ヘッダー */}
        <div style={styles.header}>
          <button
            style={styles.backButton}
            onClick={() => router.push('/essay')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            <ArrowLeft size={14} />
            戻る
          </button>
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
            
            {/* グラフ表示エリア */}
            {theme.graphData && (
              <div style={styles.graphContainer}>
                <h3 style={styles.sectionTitle}>
                  <BarChart size={14} />
                  提示資料
                </h3>
                <div style={styles.graphWrapper}>
                  <div style={styles.canvasContainer}>
                    <canvas ref={chartRef} />
                  </div>
                </div>
              </div>
            )}
            
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

        {/* 作成エリア */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h2 style={styles.cardTitle}>解答欄</h2>
              <div style={styles.headerMeta}>
                <div style={styles.timerSection}>
                  <button
                    style={styles.timerButton}
                    onClick={() => setIsTimerActive(!isTimerActive)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    {isTimerActive ? <Pause size={12} /> : <Play size={12} />}
                  </button>
                  <div style={styles.timerDisplay}>
                    <Timer size={12} />
                    <span style={{ fontFamily: 'monospace' }}>{formatTime(timeElapsed)}</span>
                  </div>
                </div>
                <div style={{
                  ...styles.wordCount,
                  color: content.length > theme.requirements.maxWords
                    ? '#dc3545'
                    : content.length < theme.requirements.minWords
                    ? '#ffc107'
                    : '#007bff'
                }}>
                  <FileText size={12} />
                  {content.length}/{theme.wordLimit}
                </div>
              </div>
            </div>
          </div>
          <div style={styles.cardContent}>
            <div style={styles.textareaContainer}>
              <textarea
                style={styles.textarea}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="ここに小論文を入力してください..."
              />
            </div>
            
            {content.length > 0 && (
              <div style={styles.wordLimitWarning}>
                {content.length < theme.requirements.minWords && (
                  <p style={{ color: '#ffc107' }}>
                    あと{theme.requirements.minWords - content.length}字必要です
                  </p>
                )}
                {content.length > theme.requirements.maxWords && (
                  <p style={{ color: '#dc3545' }}>
                    {content.length - theme.requirements.maxWords}字オーバーしています
                  </p>
                )}
              </div>
            )}
            
            <div style={styles.actionButtons}>
              <button
                style={{ ...styles.button, ...styles.secondaryButton }}
                onClick={() => saveDraft(false)}
                disabled={isSaving || content.length === 0}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                <Save size={14} />
                {isSaving ? '保存中...' : '下書き保存'}
              </button>
              
              <button
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: (isSubmitting || isEvaluating || content.length < theme.requirements.minWords || content.length > theme.requirements.maxWords) ? 0.6 : 1,
                  cursor: (isSubmitting || isEvaluating || content.length < theme.requirements.minWords || content.length > theme.requirements.maxWords) ? 'not-allowed' : 'pointer',
                }}
                onClick={submitEssay}
                disabled={
                  isSubmitting ||
                  isEvaluating ||
                  content.length < theme.requirements.minWords ||
                  content.length > theme.requirements.maxWords
                }
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#0056b3';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!e.currentTarget.disabled) {
                    e.currentTarget.style.backgroundColor = '#007bff';
                  }
                }}
              >
                <Send size={14} />
                {isSubmitting ? '提出中...' : isEvaluating ? '評価中...' : '提出する'}
              </button>
            </div>
          </div>
        </div>

        {/* 評価結果 */}
        {showEvaluation && evaluation && (
          <div style={{ ...styles.card, ...styles.evaluationCard }}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <Trophy size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                評価結果
              </h2>
            </div>
            <div style={styles.cardContent}>
              {/* 総合得点 */}
              <div style={styles.scoreSection}>
                <p style={styles.scoreLabel}>総合得点</p>
                <p style={styles.scoreValue}>{evaluation.totalScore}点</p>
                <p style={styles.scoreLabel}>/ 100点</p>
              </div>

              {/* 詳細評価 */}
              <div style={styles.criteriaGrid}>
                {Object.entries(evaluation.criteria).map(([key, criterion]: [string, any]) => (
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
              {evaluation.strengths.length > 0 && (
                <div style={styles.feedbackSection}>
                  <h4 style={styles.feedbackTitle}>
                    <Star size={12} style={{ color: '#ffc107' }} />
                    良い点
                  </h4>
                  <ul style={styles.feedbackList}>
                    {evaluation.strengths.map((strength: string, index: number) => (
                      <li key={index} style={styles.feedbackItem}>
                        <span>•</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 改善点 */}
              {evaluation.improvements.length > 0 && (
                <div style={styles.feedbackSection}>
                  <h4 style={styles.feedbackTitle}>改善点</h4>
                  <ul style={styles.feedbackList}>
                    {evaluation.improvements.map((improvement: string, index: number) => (
                      <li key={index} style={styles.feedbackItem}>
                        <span>•</span>
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 総評 */}
              {evaluation.overallComment && (
                <div style={styles.feedbackSection}>
                  <h4 style={styles.feedbackTitle}>総評</h4>
                  <p style={styles.overallComment}>{evaluation.overallComment}</p>
                </div>
              )}

              {/* アクションボタン */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                  style={{ ...styles.button, ...styles.primaryButton }}
                  onClick={() => router.push('/essay/history')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0056b3';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#007bff';
                  }}
                >
                  履歴を見る
                </button>
                <button
                  style={{ ...styles.button, ...styles.secondaryButton }}
                  onClick={() => router.push('/essay')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                >
                  新しいテーマ
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
      `}</style>
    </div>
  );
}