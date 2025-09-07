// components/charts/subject-distribution-chart.tsx

'use client'

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS } from './index';

interface SubjectData {
  subject: string;
  value: number;
  percentage?: number;
}

interface SubjectDistributionChartProps {
  data: SubjectData[];
  height?: number;
}

export default function SubjectDistributionChart({
  data,
  height = 300,
}: SubjectDistributionChartProps) {
  const RADIAN = Math.PI / 180;
  
  // カスタムラベル
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percentage,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-semibold"
      >
        {`${(percentage * 100).toFixed(0)}%`}
      </text>
    );
  };

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) return null;

    const data = payload[0];
    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border">
        <p className="font-semibold">{data.name}</p>
        <p className="text-sm">学習時間: {data.value}分</p>
        <p className="text-sm">割合: {(data.percent * 100).toFixed(1)}%</p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>科目別学習時間分布</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CHART_COLORS[entry.subject as keyof typeof CHART_COLORS] || CHART_COLORS.primary}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => {
                const subjectLabels: Record<string, string> = {
                  math: '数学',
                  english: '英語',
                  japanese: '国語',
                  science: '理科',
                  social: '社会',
                };
                return subjectLabels[value] || value;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}