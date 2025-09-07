// components/charts/index.ts

export { default as ProgressChart } from './progress-chart';
export { default as AccuracyChart } from './accuracy-chart';
export { default as WeaknessChart } from './weakness-chart';
export { default as EfficiencyChart } from './efficiency-chart';
export { default as PredictionChart } from './prediction-chart';
export { default as SubjectDistributionChart } from './subject-distribution-chart';

// 共通設定
export const CHART_COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  math: '#3B82F6',
  english: '#10B981',
  japanese: '#F59E0B',
  science: '#8B5CF6',
  social: '#EF4444',
} as const;

export const CHART_CONFIG = {
  responsive: true,
  animation: {
    duration: 750,
    easing: 'easeInOutQuart',
  },
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 15,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#333',
      borderWidth: 1,
      titleFont: { size: 14 },
      bodyFont: { size: 12 },
      padding: 10,
      cornerRadius: 8,
    },
  },
};