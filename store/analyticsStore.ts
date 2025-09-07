// store/analyticsStore.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  StudySession,
  WeaknessPattern,
  MockExamResult,
  ProgressMetrics,
  AnalyticsFilter,
  DateRange,
  AnalyticsError,
  AnalyticsEvent,
} from '@/types/analytics';

interface AnalyticsState {
  // データ
  sessions: StudySession[];
  weaknesses: WeaknessPattern[];
  mockExams: MockExamResult[];
  metrics: ProgressMetrics | null;
  
  // フィルター
  currentFilter: AnalyticsFilter;
  
  // 状態
  isLoading: boolean;
  isAnalyzing: boolean;
  error: AnalyticsError | null;
  lastUpdated: Date | null;
  
  // リアルタイム
  isRealtimeEnabled: boolean;
  realtimeConnection: WebSocket | null;
  
  // キャッシュ
  cachedAnalytics: Map<string, { data: any; timestamp: Date }>;
  cacheTimeout: number; // ミリ秒
}

interface AnalyticsActions {
  // データ取得
  fetchSessions: (filter?: Partial<AnalyticsFilter>) => Promise<void>;
  fetchWeaknesses: () => Promise<void>;
  fetchMockExams: () => Promise<void>;
  fetchMetrics: () => Promise<void>;
  
  // データ更新
  addSession: (session: StudySession) => void;
  updateSession: (sessionId: string, updates: Partial<StudySession>) => void;
  deleteSession: (sessionId: string) => void;
  
  // 分析
  analyzeProgress: () => Promise<void>;
  analyzeWeaknesses: () => Promise<void>;
  predictPerformance: (targetDate: Date) => Promise<number>;
  
  // フィルター
  setFilter: (filter: Partial<AnalyticsFilter>) => void;
  setDateRange: (dateRange: DateRange) => void;
  clearFilters: () => void;
  
  // リアルタイム
  connectRealtime: (userId: string) => void;
  disconnectRealtime: () => void;
  handleRealtimeEvent: (event: AnalyticsEvent) => void;
  
  // キャッシュ
  getCachedData: <T>(key: string) => T | null;
  setCachedData: (key: string, data: any) => void;
  clearCache: () => void;
  
  // エラー処理
  setError: (error: AnalyticsError | null) => void;
  clearError: () => void;
  
  // リセット
  resetStore: () => void;
}

const initialState: AnalyticsState = {
  sessions: [],
  weaknesses: [],
  mockExams: [],
  metrics: null,
  currentFilter: {
    userId: '',
    dateRange: {
      start: new Date(new Date().setDate(new Date().getDate() - 30)),
      end: new Date(),
      preset: 'month',
    },
  },
  isLoading: false,
  isAnalyzing: false,
  error: null,
  lastUpdated: null,
  isRealtimeEnabled: false,
  realtimeConnection: null,
  cachedAnalytics: new Map(),
  cacheTimeout: 5 * 60 * 1000, // 5分
};

export const useAnalyticsStore = create<AnalyticsState & AnalyticsActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // データ取得
        fetchSessions: async (filter) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const response = await fetch('/api/analytics/sessions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(filter || get().currentFilter),
            });

            if (!response.ok) throw new Error('Failed to fetch sessions');

            const data = await response.json();
            set((state) => {
              state.sessions = data.sessions;
              state.lastUpdated = new Date();
            });
          } catch (error: any) {
            set((state) => {
              state.error = {
                name: 'FetchError',
                message: error.message,
                code: 'FETCH_SESSIONS_ERROR',
                timestamp: new Date(),
              };
            });
          } finally {
            set((state) => {
              state.isLoading = false;
            });
          }
        },

        fetchWeaknesses: async () => {
          const cacheKey = `weaknesses_${get().currentFilter.userId}`;
          const cached = get().getCachedData<any[]>(cacheKey);
          
          if (cached) {
            set((state) => {
              state.weaknesses = cached;
            });
            return;
          }

          set((state) => {
            state.isLoading = true;
          });

          try {
            const response = await fetch(`/api/analytics/weakness?userId=${get().currentFilter.userId}`);
            if (!response.ok) throw new Error("Failed to fetch weaknesses");

            const data = await response.json();
            set((state) => {
              state.weaknesses = data.weaknesses;
            });
            get().setCachedData(cacheKey, data.weaknesses);
          } catch (error: any) {
            set((state) => {
              state.error = {
                name: "FetchError",
                message: error.message,
                code: "FETCH_WEAKNESSES_ERROR",
                timestamp: new Date(),
              };
            });
          } finally {
            set((state) => {
              state.isLoading = false;
            });
          }
        },

        fetchMockExams: async () => {
          const cacheKey = `mockExams_${get().currentFilter.userId}`;
          const cached = get().getCachedData<MockExamResult[]>(cacheKey);
          
          if (cached) {
            set((state) => {
              state.mockExams = cached;
            });
            return;
          }

          set((state) => {
            state.isLoading = true;
          });

          try {
            const response = await fetch('/api/analytics/mock-exams');
            if (!response.ok) throw new Error('Failed to fetch mock exams');

            const data = await response.json();
            set((state) => {
              state.mockExams = data.exams;
            });
            get().setCachedData(cacheKey, data.exams);
          } catch (error: any) {
            set((state) => {
              state.error = {
                name: 'FetchError',
                message: error.message,
                code: 'FETCH_EXAMS_ERROR',
                timestamp: new Date(),
              };
            });
          } finally {
            set((state) => {
              state.isLoading = false;
            });
          }
        },

        fetchMetrics: async () => {
          set((state) => {
            state.isLoading = true;
          });

          try {
            const response = await fetch('/api/analytics/metrics', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(get().currentFilter),
            });

            if (!response.ok) throw new Error('Failed to fetch metrics');

            const data = await response.json();
            set((state) => {
              state.metrics = data.metrics;
            });
          } catch (error: any) {
            set((state) => {
              state.error = {
                name: 'FetchError',
                message: error.message,
                code: 'FETCH_METRICS_ERROR',
                timestamp: new Date(),
              };
            });
          } finally {
            set((state) => {
              state.isLoading = false;
            });
          }
        },

        // データ更新
        addSession: (session) => {
          set((state) => {
            state.sessions.push(session);
            state.lastUpdated = new Date();
          });
        },

        updateSession: (sessionId, updates) => {
          set((state) => {
            const index = state.sessions.findIndex((s) => s.id === sessionId);
            if (index !== -1) {
              state.sessions[index] = { ...state.sessions[index], ...updates };
              state.lastUpdated = new Date();
            }
          });
        },

        deleteSession: (sessionId) => {
          set((state) => {
            state.sessions = state.sessions.filter((s) => s.id !== sessionId);
            state.lastUpdated = new Date();
          });
        },

        // 分析
        analyzeProgress: async () => {
          set((state) => {
            state.isAnalyzing = true;
          });

          try {
            const response = await fetch('/api/analytics/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: get().currentFilter.userId,
                sessions: get().sessions,
              }),
            });

            if (!response.ok) throw new Error('Analysis failed');

            const result = await response.json();
            // 分析結果の処理
            console.log('Analysis complete:', result);
          } catch (error: any) {
            set((state) => {
              state.error = {
                name: 'AnalysisError',
                message: error.message,
                code: 'ANALYZE_PROGRESS_ERROR',
                timestamp: new Date(),
              };
            });
          } finally {
            set((state) => {
              state.isAnalyzing = false;
            });
          }
        },

        analyzeWeaknesses: async () => {
          set((state) => {
            state.isAnalyzing = true;
          });

          try {
            // Web Workerを使用した分析
            const worker = new Worker('/workers/weakness-analyzer.js');
            
            worker.postMessage({
              sessions: get().sessions,
              mockExams: get().mockExams,
            });

            worker.onmessage = (e) => {
              set((state) => {
                state.weaknesses = e.data.weaknesses;
                state.isAnalyzing = false;
              });
            };

            worker.onerror = (error) => {
              throw error;
            };
          } catch (error: any) {
            set((state) => {
              state.error = {
                name: 'AnalysisError',
                message: error.message,
                code: 'ANALYZE_WEAKNESSES_ERROR',
                timestamp: new Date(),
              };
              state.isAnalyzing = false;
            });
          }
        },

        predictPerformance: async (targetDate) => {
          // 予測ロジックの実装
          const sessions = get().sessions;
          const metrics = get().metrics;
          
          if (!metrics || sessions.length === 0) {
            return 0;
          }

          // 簡易的な予測計算
          const daysUntilTarget = Math.ceil(
            (targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          
          const dailyGrowthRate = metrics.monthlyGrowth / 30;
          const predictedScore = metrics.overallAccuracy * Math.pow(
            1 + dailyGrowthRate / 100,
            daysUntilTarget
          );

          return Math.min(100, predictedScore);
        },

        // フィルター
        setFilter: (filter) => {
          set((state) => {
            state.currentFilter = { ...state.currentFilter, ...filter };
          });
        },

        setDateRange: (dateRange) => {
          set((state) => {
            state.currentFilter.dateRange = dateRange;
          });
        },

        clearFilters: () => {
          set((state) => {
            state.currentFilter = initialState.currentFilter;
          });
        },

        // リアルタイム
        connectRealtime: (userId) => {
          if (get().realtimeConnection) return;

          try {
            const ws = new WebSocket(`wss://api.aistudy.com/analytics/ws/${userId}`);
            
            ws.onopen = () => {
              set((state) => {
                state.isRealtimeEnabled = true;
                state.realtimeConnection = ws;
              });
              console.log('Realtime analytics connected');
            };

            ws.onmessage = (event) => {
              const analyticsEvent: AnalyticsEvent = JSON.parse(event.data);
              get().handleRealtimeEvent(analyticsEvent);
            };

            ws.onclose = () => {
              set((state) => {
                state.isRealtimeEnabled = false;
                state.realtimeConnection = null;
              });
              console.log('Realtime analytics disconnected');
            };

            ws.onerror = (error) => {
              console.error('WebSocket error:', error);
              get().disconnectRealtime();
            };
          } catch (error) {
            console.error('Failed to connect realtime:', error);
          }
        },

        disconnectRealtime: () => {
          const ws = get().realtimeConnection;
          if (ws) {
            ws.close();
            set((state) => {
              state.isRealtimeEnabled = false;
              state.realtimeConnection = null;
            });
          }
        },

        handleRealtimeEvent: (event) => {
          switch (event.type) {
            case 'session_start':
              // 新しいセッション開始
              break;
            case 'session_end':
              // セッション終了、データ更新
              get().fetchSessions();
              get().fetchMetrics();
              break;
            case 'question_answered':
              // リアルタイムで正答率更新
              break;
            case 'exam_completed':
              // 模擬試験完了
              get().fetchMockExams();
              break;
          }
        },

        // キャッシュ
        getCachedData: (key) => {
          const cached = get().cachedAnalytics.get(key);
          if (!cached) return null;

          const isExpired = Date.now() - cached.timestamp.getTime() > get().cacheTimeout;
          if (isExpired) {
            get().cachedAnalytics.delete(key);
            return null;
          }

          return cached.data;
        },

        setCachedData: (key, data) => {
          set((state) => {
            state.cachedAnalytics.set(key, {
              data,
              timestamp: new Date(),
            });
          });
        },

        clearCache: () => {
          set((state) => {
            state.cachedAnalytics.clear();
          });
        },

        // エラー処理
        setError: (error) => {
          set((state) => {
            state.error = error;
          });
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        // リセット
        resetStore: () => {
          get().disconnectRealtime();
          set(initialState);
        },
      })),
      {
        name: 'analytics-storage',
        partialize: (state) => ({
          currentFilter: state.currentFilter,
          cacheTimeout: state.cacheTimeout,
        }),
      }
    )
  )
);

// セレクター
export const selectSessionsBySubject = (subjectId: string) => (state: AnalyticsState) =>
  state.sessions.filter((session) => session.subjectId === subjectId);

export const selectWeaknessesByPriority = (state: AnalyticsState) =>
  [...state.weaknesses].sort((a, b) => b.weaknessScore - a.weaknessScore);

export const selectRecentMockExams = (limit: number = 5) => (state: AnalyticsState) =>
  [...state.mockExams]
    .sort((a, b) => b.examDate.getTime() - a.examDate.getTime())
    .slice(0, limit);