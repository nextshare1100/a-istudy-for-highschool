// __tests__/analytics/integration.test.tsx

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AnalyticsPage from '@/app/(dashboard)/analytics/page';
import { useAnalyticsStore } from '@/store/analyticsStore';

// モックセットアップ
jest.mock('@/store/analyticsStore');
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Analytics Page Integration', () => {
  beforeEach(() => {
    (useAnalyticsStore as jest.Mock).mockReturnValue({
      sessions: [],
      weaknesses: [],
      metrics: {
        totalStudyTime: 1200,
        totalQuestions: 100,
        overallAccuracy: 75,
        studyStreak: 5,
        weeklyAverage: 180,
        monthlyGrowth: 15,
        targetAchievement: 80,
      },
      isLoading: false,
      fetchSessions: jest.fn(),
      fetchWeaknesses: jest.fn(),
      fetchMetrics: jest.fn(),
    });
  });

  it('should render analytics page with metrics', async () => {
    render(<AnalyticsPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText('学習分析')).toBeInTheDocument();
      expect(screen.getByText('1200')).toBeInTheDocument(); // 学習時間
      expect(screen.getByText('75%')).toBeInTheDocument(); // 正答率
    });
  });

  it('should handle date range changes', async () => {
    const user = userEvent.setup();
    const mockFetchSessions = jest.fn();
    
    (useAnalyticsStore as jest.Mock).mockReturnValue({
      ...useAnalyticsStore(),
      fetchSessions: mockFetchSessions,
    });

    render(<AnalyticsPage />, { wrapper: Wrapper });

    // 日付範囲セレクタをクリック
    const dateRangeButton = screen.getByRole('button', { name: /期間/i });
    await user.click(dateRangeButton);

    // 「今週」を選択
    const thisWeekOption = screen.getByText('今週');
    await user.click(thisWeekOption);

    expect(mockFetchSessions).toHaveBeenCalled();
  });

  it('should display loading state', () => {
    (useAnalyticsStore as jest.Mock).mockReturnValue({
      ...useAnalyticsStore(),
      isLoading: true,
    });

    render(<AnalyticsPage />, { wrapper: Wrapper });

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should handle errors gracefully', () => {
    (useAnalyticsStore as jest.Mock).mockReturnValue({
      ...useAnalyticsStore(),
      error: {
        name: 'FetchError',
        message: 'データの取得に失敗しました',
        code: 'FETCH_ERROR',
        timestamp: new Date(),
      },
    });

    render(<AnalyticsPage />, { wrapper: Wrapper });

    expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument();
  });
});