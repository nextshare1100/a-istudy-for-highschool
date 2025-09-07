// components/charts/weakness-chart.tsx

'use client'

import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS } from './index';
import type { WeaknessPattern } from '@/types/analytics';

interface WeaknessChartProps {
  data: WeaknessPattern[];
  height?: number;
}

export default function WeaknessChart({ data, height = 300 }: WeaknessChartProps) {
  // レーダーチャート用にデータを変換
  const radarData = data.map((weakness) => ({
    topic: weakness.topicName,
    score: 100 - weakness.weaknessScore, // 弱点スコアを強みスコアに変換
    fullMark: 100,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>分野別習熟度</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e0e0e0" />
            <PolarAngleAxis dataKey="topic" stroke="#666" style={{ fontSize: 12 }} />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              stroke="#666"
              style={{ fontSize: 10 }}
            />
            <Radar
              name="習熟度"
              dataKey="score"
              stroke={CHART_COLORS.primary}
              fill={CHART_COLORS.primary}
              fillOpacity={0.6}
            />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}