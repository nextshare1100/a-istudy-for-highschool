// __tests__/analytics/calculations.test.ts

import {
  calculateMovingAverage,
  calculateStandardDeviation,
  calculateDeviation,
  calculatePercentile,
  calculateGrowthRate,
  calculateEfficiencyScore,
  analyzeTrend,
  predictGoalAchievement,
} from '@/lib/analytics/calculations';

describe('Analytics Calculations', () => {
  describe('calculateMovingAverage', () => {
    it('should calculate moving average correctly', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = calculateMovingAverage(data, 3);
      expect(result).toEqual([2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('should handle window size larger than data', () => {
      const data = [1, 2, 3];
      const result = calculateMovingAverage(data, 5);
      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('calculateStandardDeviation', () => {
    it('should calculate standard deviation correctly', () => {
      const data = [2, 4, 4, 4, 5, 5, 7, 9];
      const result = calculateStandardDeviation(data);
      expect(result).toBeCloseTo(2.0, 1);
    });

    it('should return 0 for empty array', () => {
      expect(calculateStandardDeviation([])).toBe(0);
    });
  });

  describe('calculateDeviation', () => {
    it('should calculate deviation score correctly', () => {
      const score = 75;
      const mean = 60;
      const stdDev = 10;
      const result = calculateDeviation(score, mean, stdDev);
      expect(result).toBe(65); // 50 + (10 * (75 - 60) / 10)
    });

    it('should handle zero standard deviation', () => {
      const result = calculateDeviation(80, 80, 0);
      expect(result).toBe(50);
    });
  });

  describe('analyzeTrend', () => {
    it('should detect increasing trend', () => {
      const data = [10, 15, 20, 25, 30];
      expect(analyzeTrend(data)).toBe('increasing');
    });

    it('should detect decreasing trend', () => {
      const data = [30, 25, 20, 15, 10];
      expect(analyzeTrend(data)).toBe('decreasing');
    });

    it('should detect stable trend', () => {
      const data = [20, 21, 20, 19, 20];
      expect(analyzeTrend(data)).toBe('stable');
    });
  });

  describe('predictGoalAchievement', () => {
    it('should predict goal achievement with sufficient data', () => {
      const currentValue = 70;
      const targetValue = 90;
      const historicalData = [
        { date: new Date('2024-01-01'), value: 50 },
        { date: new Date('2024-02-01'), value: 60 },
        { date: new Date('2024-03-01'), value: 70 },
      ];
      const targetDate = new Date('2024-06-01');

      const result = predictGoalAchievement(
        currentValue,
        targetValue,
        historicalData,
        targetDate
      );

      expect(result).toHaveProperty('willAchieve');
      expect(result).toHaveProperty('predictedValue');
      expect(result).toHaveProperty('confidence');
      expect(result.daysRemaining).toBeGreaterThan(0);
    });

    it('should handle insufficient data', () => {
      const result = predictGoalAchievement(
        70,
        90,
        [],
        new Date('2024-12-31')
      );

      expect(result.willAchieve).toBe(false);
      expect(result.confidence).toBe(0);
    });
  });
});