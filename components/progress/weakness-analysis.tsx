'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  AlertCircle, 
  TrendingUp, 
  Clock, 
  Target,
  BookOpen,
  Video,
  FileText,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface WeaknessAnalysisProps {
  weakPoints: WeakPoint[];
  recommendations: Recommendation[];
  onActionClick?: (action: string, weakPoint: WeakPoint) => void;
  isLoading?: boolean;
}

interface WeakPoint {
  id: string;
  topic: string;
  subtopic?: string;
  errorType: string;
  frequency: number;
  lastOccurred: Date;
  severity: 'high' | 'medium' | 'low';
  examples?: string[];
  improvementRate?: number;
}

interface Recommendation {
  id: string;
  weakPointId: string;
  type: 'video' | 'practice' | 'material';
  title: string;
  description: string;
  estimatedTime: number;
  priority: number;
  url?: string;
}

export function WeaknessAnalysis({ 
  weakPoints, 
  recommendations, 
  onActionClick,
  isLoading = false 
}: WeaknessAnalysisProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedErrorType, setSelectedErrorType] = useState<string>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // フィルタリング
  const filteredWeakPoints = useMemo(() => {
    return weakPoints.filter(wp => {
      if (selectedSeverity !== 'all' && wp.severity !== selectedSeverity) return false;
      if (selectedErrorType !== 'all' && wp.errorType !== selectedErrorType) return false;
      return true;
    });
  }, [weakPoints, selectedSeverity, selectedErrorType]);

  // エラータイプのユニークリスト
  const errorTypes = useMemo(() => {
    const types = new Set(weakPoints.map(wp => wp.errorType));
    return Array.from(types);
  }, [weakPoints]);

  // カードの展開/折りたたみ
  const toggleCard = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  // 重要度に応じた色の取得
  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'text-red-500 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-500 bg-blue-50 border-blue-200';
    }
  };

  const getSeverityBadgeVariant = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
    }
  };

  // 推奨アクションのアイコン取得
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'practice': return <BookOpen className="w-4 h-4" />;
      case 'material': return <FileText className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">弱点を分析中...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* フィルター */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              フィルター
            </CardTitle>
            {(selectedSeverity !== 'all' || selectedErrorType !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedSeverity('all');
                  setSelectedErrorType('all');
                }}
              >
                <X className="w-4 h-4 mr-1" />
                クリア
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="重要度" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての重要度</SelectItem>
              <SelectItem value="high">高</SelectItem>
              <SelectItem value="medium">中</SelectItem>
              <SelectItem value="low">低</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedErrorType} onValueChange={setSelectedErrorType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="エラータイプ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべてのタイプ</SelectItem>
              {errorTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* 弱点カード */}
      <div className="grid gap-4">
        {filteredWeakPoints.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                {selectedSeverity !== 'all' || selectedErrorType !== 'all' 
                  ? '該当する弱点が見つかりませんでした。'
                  : '素晴らしい！現在、特定の弱点は見つかっていません。'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredWeakPoints.map((weakPoint) => {
            const isExpanded = expandedCards.has(weakPoint.id);
            const relatedRecommendations = recommendations.filter(
              r => r.weakPointId === weakPoint.id
            );

            return (
              <Card 
                key={weakPoint.id} 
                className={`border-2 transition-all ${getSeverityColor(weakPoint.severity)}`}
              >
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => toggleCard(weakPoint.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5" />
                        <h3 className="font-semibold text-lg">{weakPoint.topic}</h3>
                        <Badge variant={getSeverityBadgeVariant(weakPoint.severity)}>
                          {weakPoint.severity === 'high' ? '重要' : 
                           weakPoint.severity === 'medium' ? '要注意' : '軽微'}
                        </Badge>
                      </div>
                      {weakPoint.subtopic && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {weakPoint.subtopic}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          最終発生: {formatDistanceToNow(new Date(weakPoint.lastOccurred), { 
                            addSuffix: true, 
                            locale: ja 
                          })}
                        </span>
                        <span>発生頻度: {weakPoint.frequency}回</span>
                      </div>
                    </div>
                    <ChevronRight 
                      className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    <div className="space-y-4">
                      {/* 改善率 */}
                      {weakPoint.improvementRate !== undefined && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">改善率</span>
                            <span className="text-sm">{weakPoint.improvementRate}%</span>
                          </div>
                          <Progress value={weakPoint.improvementRate} className="h-2" />
                        </div>
                      )}

                      {/* エラー例 */}
                      {weakPoint.examples && weakPoint.examples.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">よくある間違い例:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {weakPoint.examples.map((example, index) => (
                              <li key={index} className="text-sm text-muted-foreground">
                                {example}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 推奨アクション */}
                      {relatedRecommendations.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">📝 推奨アクション:</h4>
                          <div className="space-y-2">
                            {relatedRecommendations
                              .sort((a, b) => b.priority - a.priority)
                              .map((rec) => (
                                <Button
                                  key={rec.id}
                                  variant="outline"
                                  className="w-full justify-start"
                                  onClick={() => onActionClick?.(rec.type, weakPoint)}
                                >
                                  <div className="flex items-center gap-3 w-full">
                                    {getActionIcon(rec.type)}
                                    <div className="flex-1 text-left">
                                      <p className="font-medium">{rec.title}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {rec.description} • 所要時間: 約{rec.estimatedTime}分
                                      </p>
                                    </div>
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                  </div>
                                </Button>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* サマリー */}
      {filteredWeakPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">分析サマリー</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-red-500">
                  {filteredWeakPoints.filter(wp => wp.severity === 'high').length}
                </p>
                <p className="text-sm text-muted-foreground">重要な弱点</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredWeakPoints.filter(wp => wp.severity === 'medium').length}
                </p>
                <p className="text-sm text-muted-foreground">要注意の弱点</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">
                  {filteredWeakPoints.filter(wp => wp.severity === 'low').length}
                </p>
                <p className="text-sm text-muted-foreground">軽微な弱点</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}