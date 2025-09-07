'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  BarChart3,
  Radar as RadarIcon
} from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ProgressChartProps {
  data: {
    timeSeries: TimeSeriesData[];
    topicData: TopicData[];
    radarData: RadarData[];
  };
  subject?: string;
  onExport?: () => void;
}

interface TimeSeriesData {
  date: string;
  mastery: number;
  correctRate: number;
  subject?: string;
}

interface TopicData {
  topic: string;
  mastery: number;
  questions: number;
  lastStudied: string;
}

interface RadarData {
  subject: string;
  current: number;
  target: number;
  average: number;
}

export function ProgressChart({ data, subject, onExport }: ProgressChartProps) {
  const [activeTab, setActiveTab] = useState('timeSeries');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('week');

  // データのフィルタリング
  const filteredTimeSeriesData = useMemo(() => {
    if (!data.timeSeries) return [];

    let filtered = data.timeSeries;
    
    // 日付範囲でフィルター
    if (dateRange !== 'all') {
      const daysToSubtract = dateRange === 'week' ? 7 : 30;
      const startDate = subDays(new Date(), daysToSubtract);
      filtered = filtered.filter(d => new Date(d.date) >= startDate);
    }

    // データポイントの最適化（100点以上は間引く）
    if (filtered.length > 100) {
      const step = Math.ceil(filtered.length / 100);
      filtered = filtered.filter((_, index) => index % step === 0);
    }

    return filtered;
  }, [data.timeSeries, dateRange]);

  // トレンドの計算
  const trend = useMemo(() => {
    if (filteredTimeSeriesData.length < 2) return 'stable';
    
    const recent = filteredTimeSeriesData.slice(-Math.ceil(filteredTimeSeriesData.length / 3));
    const older = filteredTimeSeriesData.slice(0, Math.ceil(filteredTimeSeriesData.length / 3));
    
    const recentAvg = recent.reduce((sum, d) => sum + d.mastery, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.mastery, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    if (diff > 5) return 'up';
    if (diff < -5) return 'down';
    return 'stable';
  }, [filteredTimeSeriesData]);

  // CSVエクスポート
  const handleExport = () => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `progress_${subject || 'all'}_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
    onExport?.();
  };

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(1)}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            📊 学習進捗グラフ
            {trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
            {trend === 'down' && <TrendingDown className="w-5 h-5 text-red-500" />}
            {trend === 'stable' && <Minus className="w-5 h-5 text-gray-500" />}
          </CardTitle>
          {subject && <p className="text-sm text-muted-foreground mt-1">{subject}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-1" />
          CSV出力
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="timeSeries" className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                時系列
              </TabsTrigger>
              <TabsTrigger value="topic" className="flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                トピック別
              </TabsTrigger>
              <TabsTrigger value="radar" className="flex items-center gap-1">
                <RadarIcon className="w-4 h-4" />
                総合分析
              </TabsTrigger>
            </TabsList>

            {activeTab === 'timeSeries' && (
              <div className="flex gap-2">
                <Button
                  variant={dateRange === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('week')}
                >
                  週間
                </Button>
                <Button
                  variant={dateRange === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('month')}
                >
                  月間
                </Button>
                <Button
                  variant={dateRange === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('all')}
                >
                  全期間
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="timeSeries" className="mt-0">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={filteredTimeSeriesData}>
                <defs>
                  <linearGradient id="colorMastery" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCorrect" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'M/d', { locale: ja })}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="mastery" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorMastery)"
                  name="習熟度"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="correctRate" 
                  stroke="#82ca9d" 
                  fillOpacity={1} 
                  fill="url(#colorCorrect)"
                  name="正答率"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="topic" className="mt-0">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.topicData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="category" dataKey="topic" />
                <YAxis type="number" domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="mastery" 
                  name="習熟度"
                  fill={(entry) => {
                    const mastery = entry.mastery;
                    if (mastery >= 80) return '#22c55e';
                    if (mastery >= 60) return '#f59e0b';
                    return '#ef4444';
                  }}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="radar" className="mt-0">
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={data.radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar 
                  name="現在" 
                  dataKey="current" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6} 
                />
                <Radar 
                  name="目標" 
                  dataKey="target" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.3} 
                />
                <Radar 
                  name="平均" 
                  dataKey="average" 
                  stroke="#ffc658" 
                  fill="#ffc658" 
                  fillOpacity={0.3} 
                />
                <Legend />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// CSV変換関数
function convertToCSV(data: any): string {
  const headers = ['日付', '科目', '習熟度', '正答率'];
  const rows = data.timeSeries.map((item: TimeSeriesData) => [
    item.date,
    item.subject || '全科目',
    item.mastery,
    item.correctRate
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}