// __tests__/analytics/store.test.ts

import { renderHook, act } from '@testing-library/react';
import { useAnalyticsStore } from '@/store/analyticsStore';
import type { StudySession } from '@/types/analytics';

// モックデータ
const mockSession: StudySession = {
  id: 'test-1',
  userId: 'user-1',
  subjectId: 'math',
  startTime: new Date('2024-01-01T10:00:00'),
  endTime: new Date('2024-01-01T11:00:00'),
  duration: 3600,
  pausedDuration: 0,
  questionsAnswered: 20,
  correctAnswers: 15,
  accuracy: 75,
  focusScore: 85,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Analytics Store', () => {
  beforeEach(() => {
    // ストアをリセット
    const { result } = renderHook(() => useAnalyticsStore());
    act(() => {
      result.current.resetStore();
    });
  });

  describe('Session Management', () => {
    it('should add a session', () => {
      const { result } = renderHook(() => useAnalyticsStore());

      act(() => {
        result.current.addSession(mockSession);
      });

      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.sessions[0]).toEqual(mockSession);
    });

    it('should update a session', () => {
      const { result } = renderHook(() => useAnalyticsStore());

      act(() => {
        result.current.addSession(mockSession);
        result.current.updateSession('test-1', { accuracy: 80 });
      });

      expect(result.current.sessions[0].accuracy).toBe(80);
    });

    it('should delete a session', () => {
      const { result } = renderHook(() => useAnalyticsStore());

      act(() => {
        result.current.addSession(mockSession);
        result.current.deleteSession('test-1');
      });

      expect(result.current.sessions).toHaveLength(0);
    });
  });

  describe('Filter Management', () => {
    it('should set filter correctly', () => {
      const { result } = renderHook(() => useAnalyticsStore());

      act(() => {
        result.current.setFilter({
          subjects: ['math', 'english'],
        });
      });

      expect(result.current.currentFilter.subjects).toEqual(['math', 'english']);
    });

    it('should set date range', () => {
      const { result } = renderHook(() => useAnalyticsStore());
      const dateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
        preset: 'month' as const,
      };

      act(() => {
        result.current.setDateRange(dateRange);
      });

      expect(result.current.currentFilter.dateRange).toEqual(dateRange);
    });
  });

  describe('Cache Management', () => {
    it('should cache and retrieve data', () => {
      const { result } = renderHook(() => useAnalyticsStore());
      const testData = { test: 'data' };

      act(() => {
        result.current.setCachedData('test-key', testData);
      });

      const cached = result.current.getCachedData('test-key');
      expect(cached).toEqual(testData);
    });

    it('should return null for expired cache', async () => {
      const { result } = renderHook(() => useAnalyticsStore());

      // キャッシュタイムアウトを短く設定
      act(() => {
        result.current.cacheTimeout = 100; // 100ms
        result.current.setCachedData('test-key', { test: 'data' });
      });

      // タイムアウト後
      await new Promise((resolve) => setTimeout(resolve, 150));

      const cached = result.current.getCachedData('test-key');
      expect(cached).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should set and clear errors', () => {
      const { result } = renderHook(() => useAnalyticsStore());
      const error = {
        name: 'TestError',
        message: 'Test error message',
        code: 'TEST_ERROR',
        timestamp: new Date(),
      };

      act(() => {
        result.current.setError(error);
      });

      expect(result.current.error).toEqual(error);

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});