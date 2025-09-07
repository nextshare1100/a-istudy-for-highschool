// components/charts/prediction-chart.tsx

'use client'

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot,
  ReferenceArea,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS } from './index';

interface PredictionData {
  date: string;
  actual?: number;
  predicted: number;
  upperBound?: number;
  lowerBound?: number;
}

interface PredictionChartProps {
  data: PredictionData[];
  targetValue?: number;
  targetDate?: string;
  height?: number;
}

export default function PredictionChart({
  data,
  targetValue,
  targetDate,
  height = 300,
}: PredictionChartProps) {
  const todayIndex = data.findIndex(d => d.actual === undefined) - 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>成績予測</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#666" style={{ fontSize: 12 }} />
            <YAxis stroke="#666" style={{ fontSize: 12 }} domain={[0, 100]} />
            <Tooltip />
            <Legend />
            
            {/* 信頼区間 */}
            {todayIndex >= 0 && (
              <ReferenceArea
                x1={data[todayIndex]?.date}
                x2={data[data.length - 1]?.date}
                fill="url(#confidenceGradient)"
                fillOpacity={0.5}
                label="予測範囲"
              />
            )}
            
            {/* 実績値 */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              name="実績"
              connectNulls={false}
            />
            
            {/* 予測値 */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke={CHART_COLORS.secondary}
              strokeWidth={2}
              strokeDasharray="5 5"
              name="予測"
            />
            
            {/* 信頼区間上限 */}
            <Line
              type="monotone"
              dataKey="upperBound"
              stroke={CHART_COLORS.secondary}
              strokeWidth={1}
              strokeOpacity={0.5}
              dot={false}
              name="上限"
            />
            
            {/* 信頼区間下限 */}
            <Line
              type="monotone"
              dataKey="lowerBound"
              stroke={CHART_COLORS.secondary}
              strokeWidth={1}
              strokeOpacity={0.5}
              dot={false}
              name="下限"
            />
            
            {/* 目標値 */}
            {targetValue && targetDate && (
              <ReferenceDot
                x={targetDate}
                y={targetValue}
                r={6}
                fill={CHART_COLORS.warning}
                stroke="white"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}