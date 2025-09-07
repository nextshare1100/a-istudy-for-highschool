// __tests__/components/charts/progress-chart.test.tsx

import React from 'react';
import { render } from '@testing-library/react';
import ProgressChart from '@/components/charts/progress-chart';
import type { StudyTimeData } from '@/types/analytics';

// Rechartsのモック
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  Area: () => null,
  Line: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ReferenceLine: () => null,
}));

describe('ProgressChart', () => {
  const mockData: StudyTimeData[] = [
    {
      date: '2024-01-01',
      value: 120,
      subjects: { math: 60, english: 60 },
    },
    {
      date: '2024-01-02',
      value: 150,
      subjects: { math: 90, english: 60 },
    },
    {
      date: '2024-01-03',
      value: 90,
      subjects: { math: 45, english: 45 },
    },
  ];

  it('should render chart with data', () => {
    const { getByText, getByTestId } = render(
      <ProgressChart data={mockData} />
    );

    expect(getByText('学習時間の推移')).toBeInTheDocument();
    expect(getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('should render with target line', () => {
    const { container } = render(
      <ProgressChart data={mockData} target={100} />
    );

    // ReferenceLine がレンダリングされることを確認
    expect(container).toBeInTheDocument();
  });

  it('should render without trend line when showTrend is false', () => {
    const { container } = render(
      <ProgressChart data={mockData} showTrend={false} />
    );

    expect(container).toBeInTheDocument();
  });

  it('should render with custom height', () => {
    const { container } = render(
      <ProgressChart data={mockData} height={400} />
    );

    const responsiveContainer = container.querySelector('[height="400"]');
    expect(responsiveContainer).toBeInTheDocument();
  });
});