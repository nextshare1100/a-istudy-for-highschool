'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  MoreVertical,
  Download,
  Eye,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Timer
} from 'lucide-react';
import { format, formatDuration } from 'date-fns';
import { ja } from 'date-fns/locale';

interface StudyHistoryProps {
  sessions: StudySession[];
  onSessionClick?: (session: StudySession) => void;
  onDeleteSession?: (sessionId: string) => void;
  onExport?: (format: 'csv' | 'pdf', sessionIds?: string[]) => void;
}

interface StudySession {
  id: string;
  date: Date;
  subject: string;
  topic: string;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // 秒
  timerType?: 'pomodoro' | 'stopwatch' | 'none';
  mastery?: number;
  questions?: Question[];
}

interface Question {
  id: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
}

type SortKey = 'date' | 'subject' | 'correctRate' | 'timeSpent';
type SortOrder = 'asc' | 'desc';

export function StudyHistory({ 
  sessions, 
  onSessionClick, 
  onDeleteSession,
  onExport 
}: StudyHistoryProps) {
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const itemsPerPage = 10;

  // ソート処理
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      let compareValue = 0;
      
      switch (sortKey) {
        case 'date':
          compareValue = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'subject':
          compareValue = a.subject.localeCompare(b.subject);
          break;
        case 'correctRate':
          const rateA = a.totalQuestions > 0 ? a.correctAnswers / a.totalQuestions : 0;
          const rateB = b.totalQuestions > 0 ? b.correctAnswers / b.totalQuestions : 0;
          compareValue = rateA - rateB;
          break;
        case 'timeSpent':
          compareValue = a.timeSpent - b.timeSpent;
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
  }, [sessions, sortKey, sortOrder]);

  // ページネーション処理
  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedSessions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedSessions, currentPage]);

  const totalPages = Math.ceil(sortedSessions.length / itemsPerPage);

  // ソート切り替え
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  // 全選択/解除
  const handleSelectAll = () => {
    if (selectedSessions.size === paginatedSessions.length) {
      setSelectedSessions(new Set());
    } else {
      setSelectedSessions(new Set(paginatedSessions.map(s => s.id)));
    }
  };

  // 個別選択
  const handleSelectSession = (sessionId: string) => {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  // 詳細表示
  const showDetail = (session: StudySession) => {
    setSelectedSession(session);
    setIsDetailOpen(true);
  };

  // 正答率の計算
  const getCorrectRate = (session: StudySession) => {
    if (session.totalQuestions === 0) return 0;
    return (session.correctAnswers / session.totalQuestions) * 100;
  };

  // 時間のフォーマット
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}時間${minutes}分`;
    } else if (minutes > 0) {
      return `${minutes}分${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  };

  // タイマータイプのバッジ
  const getTimerBadge = (type?: string) => {
    switch (type) {
      case 'pomodoro':
        return <Badge variant="secondary" className="text-xs">ポモドーロ</Badge>;
      case 'stopwatch':
        return <Badge variant="outline" className="text-xs">ストップウォッチ</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            学習履歴
          </CardTitle>
          <div className="flex gap-2">
            {selectedSessions.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport?.('csv', Array.from(selectedSessions))}
                >
                  <Download className="w-4 h-4 mr-1" />
                  CSV出力 ({selectedSessions.size}件)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`${selectedSessions.size}件のセッションを削除しますか？`)) {
                      selectedSessions.forEach(id => onDeleteSession?.(id));
                      setSelectedSessions(new Set());
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  削除
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedSessions.size === paginatedSessions.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      日時
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('subject')}
                  >
                    <div className="flex items-center gap-1">
                      科目
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </TableHead>
                  <TableHead>トピック</TableHead>
                  <TableHead>問題数</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('correctRate')}
                  >
                    <div className="flex items-center gap-1">
                      正答率
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('timeSpent')}
                  >
                    <div className="flex items-center gap-1">
                      学習時間
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSessions.map((session) => {
                  const correctRate = getCorrectRate(session);
                  return (
                    <TableRow 
                      key={session.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => showDetail(session)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedSessions.has(session.id)}
                          onCheckedChange={() => handleSelectSession(session.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {format(new Date(session.date), 'yyyy/MM/dd', { locale: ja })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(session.date), 'HH:mm', { locale: ja })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{session.subject}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {session.topic}
                          {getTimerBadge(session.timerType)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{session.totalQuestions}</span>
                          <span className="text-xs text-muted-foreground">問</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {correctRate >= 80 ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : correctRate >= 60 ? (
                            <CheckCircle className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={
                            correctRate >= 80 ? 'text-green-600' :
                            correctRate >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }>
                            {correctRate.toFixed(0)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {formatTime(session.timeSpent)}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => showDetail(session)}>
                              <Eye className="w-4 h-4 mr-2" />
                              詳細を見る
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onExport?.('pdf', [session.id])}>
                              <Download className="w-4 h-4 mr-2" />
                              PDFレポート
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                if (window.confirm('このセッションを削除しますか？')) {
                                  onDeleteSession?.(session.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              削除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* ページネーション */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              全{sortedSessions.length}件中 {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, sortedSessions.length)}件を表示
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                前へ
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                次へ
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 詳細モーダル */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>セッション詳細</DialogTitle>
            <DialogDescription>
              {selectedSession && format(new Date(selectedSession.date), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
            </DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-6">
              {/* 概要 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">{selectedSession.totalQuestions}</div>
                    <p className="text-xs text-muted-foreground">総問題数</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedSession.correctAnswers}
                    </div>
                    <p className="text-xs text-muted-foreground">正解数</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {getCorrectRate(selectedSession).toFixed(0)}%
                    </div>
                    <p className="text-xs text-muted-foreground">正答率</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold">
                      {formatTime(selectedSession.timeSpent)}
                    </div>
                    <p className="text-xs text-muted-foreground">学習時間</p>
                  </CardContent>
                </Card>
              </div>

              {/* 問題ごとの詳細 */}
              {selectedSession.questions && selectedSession.questions.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">問題ごとの結果</h3>
                  <div className="space-y-3">
                    {selectedSession.questions.map((question, index) => (
                      <Card key={question.id} className={question.isCorrect ? 'border-green-200' : 'border-red-200'}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <span className="font-medium">問題 {index + 1}</span>
                            {question.isCorrect ? (
                              <Badge variant="outline" className="text-green-600">正解</Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600">不正解</Badge>
                            )}
                          </div>
                          <p className="text-sm mb-2">{question.question}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">あなたの解答:</p>
                              <p className={question.isCorrect ? 'text-green-600' : 'text-red-600'}>
                                {question.userAnswer}
                              </p>
                            </div>
                            {!question.isCorrect && (
                              <div>
                                <p className="text-muted-foreground">正解:</p>
                                <p className="text-green-600">{question.correctAnswer}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Timer className="w-3 h-3" />
                            {formatTime(question.timeSpent)}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}