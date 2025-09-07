'use client'

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS } from './index';

interface EfficiencyData {
  date: string;
  focusTime: number;
  totalTime: number;
  efficiencyScore: number;
}

interface EfficiencyChartProps {
  data: EfficiencyData[];
  height?: number;
}

export default function EfficiencyChart({ data, height = 300 }: EfficiencyChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    const focusTime = payload.find((p: any) => p.dataKey === 'focusTime')?.value || 0;
    const totalTime = payload.find((p: any) => p.dataKey === 'totalTime')?.value || 0;
    const efficiency = totalTime > 0 ? Math.round((focusTime / totalTime) * 100) : 0;

    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border">
        <p className="font-semibold mb-1">{label}</p>
        <p className="text-sm">集中時間: {focusTime}分</p>
        <p className="text-sm">総学習時間: {totalTime}分</p>
        <p className="text-sm font-semibold text-green-600">効率: {efficiency}%</p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>学習効率の推移</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.8} />
                <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.info} stopOpacity={0.8} />
                <stop offset="95%" stopColor={CHART_COLORS.info} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#666" style={{ fontSize: 12 }} />
            <YAxis stroke="#666" style={{ fontSize: 12 }} label={{ value: '時間（分）', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            <Area
              type="monotone"
              dataKey="totalTime"
              stackId="1"
              stroke={CHART_COLORS.info}
              fill="url(#colorTotal)"
              name="総学習時間"
            />
            <Area
              type="monotone"
              dataKey="focusTime"
              stackId="2"
              stroke={CHART_COLORS.success}
              fill="url(#colorFocus)"
              name="集中時間"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
