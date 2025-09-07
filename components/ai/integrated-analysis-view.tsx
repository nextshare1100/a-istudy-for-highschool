// components/ai/integrated-analysis-view.tsx

'use client'

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeaknessAnalysis } from '@/components/analytics/weakness-analysis';
import { EfficiencyAnalysis } from '@/components/analytics/efficiency-analysis';
import { AIInsightsPanel } from './ai-insights-panel';
import { PersonalizedPlan } from './personalized-plan';
import { useIntegratedAnalysis } from '@/hooks/use-integrated-analysis';

export function IntegratedAnalysisView({ userId }: { userId: string }) {
  const {
    analysis,
    loading,
    error,
    refresh,
    streamingProgress
  } = useIntegratedAnalysis(userId);

  if (loading) {
    return <AnalysisLoadingState progress={streamingProgress} />;
  }

  if (error) {
    return <AnalysisErrorState error={error} onRetry={refresh} />;
  }

  return (
    <div className="space-y-6">
      {/* サマリーカード */}
      <AnalysisSummaryCard analysis={analysis} />

      {/* メインタブ */}
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">AIインサイト</TabsTrigger>
          <TabsTrigger value="weakness">弱点分析</TabsTrigger>
          <TabsTrigger value="efficiency">効率分析</TabsTrigger>
          <TabsTrigger value="plan">学習計画</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-6">
          <AIInsightsPanel 
            insights={analysis.aiInsights}
            confidence={analysis.confidence}
          />
        </TabsContent>

        <TabsContent value="weakness" className="mt-6">
          <WeaknessAnalysis 
            data={analysis.statistics.weakness}
            recommendations={analysis.recommendations.filter(r => r.type === 'weakness')}
          />
        </TabsContent>

        <TabsContent value="efficiency" className="mt-6">
          <EfficiencyAnalysis 
            data={analysis.statistics.efficiency}
            insights={analysis.aiInsights.filter(i => i.type === 'efficiency')}
          />
        </TabsContent>

        <TabsContent value="plan" className="mt-6">
          <PersonalizedPlan 
            recommendations={analysis.recommendations}
            prediction={analysis.prediction}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}