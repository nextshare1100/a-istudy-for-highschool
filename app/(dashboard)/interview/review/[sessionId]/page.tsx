'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { interviewService } from '@/lib/firebase/interview-service';
import { SpeechAnalyzer, SpeechAnalysis } from '@/lib/interview/speechAnalyzer';
import { 
  Play, Pause, RotateCcw, Mic, Volume2, 
  AlertCircle, CheckCircle, Clock, MessageSquare 
} from 'lucide-react';

interface InterviewSession {
  id: string;
  questionId: string;
  questionText: string;
  audioUrl: string;
  transcript: string;
  duration: number;
  createdAt: string;
  analysis?: SpeechAnalysis;
}

export default function InterviewReviewPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [analysis, setAnalysis] = useState<SpeechAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyzerRef = useRef<SpeechAnalyzer | null>(null);

  useEffect(() => {
    loadSessionData();
    
    // SpeechAnalyzerの初期化
    analyzerRef.current = new SpeechAnalyzer();
    
    return () => {
      if (analyzerRef.current) {
        analyzerRef.current.cleanup();
      }
    };
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      const data = await interviewService.getPractice(sessionId);
      if (data) {
        setSession(data as InterviewSession);
        if (data.analysis) {
          setAnalysis(data.analysis);
        }
      }
    } catch (error) {
      console.error('セッションデータの読み込みエラー:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!session || !analyzerRef.current) return;

    setIsAnalyzing(true);

    try {
      // 音声ファイルをBlobとして取得
      const response = await fetch(session.audioUrl);
      const audioBlob = await response.blob();
      
      // 音声分析を実行
      const analysisResult = await analyzerRef.current.analyzeRecording(
        audioBlob,
        session.transcript
      );
      
      setAnalysis(analysisResult);
      
      // 分析結果を保存
      await interviewService.updatePractice(session.id, {
        analysis: analysisResult
      });
    } catch (error) {
      console.error('分析エラー:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const resetPlayback = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">面接練習レビュー</h1>
        <p className="text-muted-foreground mt-1">
          {new Date(session.createdAt).toLocaleString('ja-JP')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 音声プレイヤーと質問 */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>質問</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">{session.questionText}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                回答音声
              </CardTitle>
            </CardHeader>
            <CardContent>
              <audio
                ref={audioRef}
                src={session.audioUrl}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onEnded={() => setIsPlaying(false)}
              />
              
              <div className="space-y-4">
                {/* プログレスバー */}
                <div>
                  <Progress 
                    value={(currentTime / session.duration) * 100} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(session.duration)}</span>
                  </div>
                </div>

                {/* コントロール */}
                <div className="flex justify-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={resetPlayback}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    onClick={togglePlayback}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 文字起こし */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                文字起こし
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{session.transcript}</p>
            </CardContent>
          </Card>
        </div>

        {/* 分析結果 */}
        <div className="space-y-4">
          {!analysis ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground mb-4">
                  まだ分析されていません
                </p>
                <Button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" />
                      音声分析を実行
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* ペース分析 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    話速
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {Math.round(analysis.pace.wordsPerMinute)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      文字/分
                    </div>
                  </div>
                  <div className={`mt-2 text-sm text-center ${
                    analysis.pace.rating === 'normal' 
                      ? 'text-green-600' 
                      : 'text-yellow-600'
                  }`}>
                    {analysis.pace.suggestion}
                  </div>
                </CardContent>
              </Card>

              {/* 音量分析 */}
              <Card>
                <CardHeader>
                  <CardTitle>音量</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">平均音量</span>
                      <span className={`text-sm font-medium ${
                        analysis.volume.rating === 'normal'
                          ? 'text-green-600'
                          : 'text-yellow-600'
                      }`}>
                        {analysis.volume.rating === 'normal' ? '適切' : '要調整'}
                      </span>
                    </div>
                    <Progress value={analysis.volume.consistency * 100} />
                    <p className="text-xs text-muted-foreground">
                      音量一貫性: {Math.round(analysis.volume.consistency * 100)}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* フィラーワード */}
              <Card>
                <CardHeader>
                  <CardTitle>フィラーワード</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">使用回数</span>
                      <span className="text-sm font-medium">{analysis.fillerWords.count}回</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">使用頻度</span>
                      <span className="text-sm font-medium">
                        {analysis.fillerWords.frequency.toFixed(1)}%
                      </span>
                    </div>
                    {analysis.fillerWords.types.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">検出された言葉:</p>
                        <div className="flex flex-wrap gap-1">
                          {analysis.fillerWords.types.map((word, i) => (
                            <span key={i} className="text-xs bg-secondary px-2 py-1 rounded">
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* 改善提案 */}
      {analysis && analysis.suggestions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              改善提案
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.suggestions.map((suggestion, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{suggestion}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
