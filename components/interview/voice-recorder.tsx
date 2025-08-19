import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MicOff, RotateCcw, Play, Pause } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onRecordingComplete?: (audioBlob: Blob) => void;
  showVolumeIndicator?: boolean;
}

export function VoiceRecorder({ onRecordingComplete, showVolumeIndicator = true }: VoiceRecorderProps) {
  const {
    isRecording,
    audioBlob,
    audioUrl,
    volume,
    startRecording,
    stopRecording,
    resetRecording,
  } = useVoiceRecorder();

  const [isPlaying, setIsPlaying] = useState(false);

  const handleStop = async () => {
    stopRecording();
    if (audioBlob) {
      onRecordingComplete?.(audioBlob);
    }
  };

  const getVolumeAdvice = () => {
    if (volume < 20) return { text: '声が小さいです', color: 'text-orange-600' };
    if (volume > 80) return { text: '声が大きすぎます', color: 'text-red-600' };
    return { text: '良い音量です', color: 'text-green-600' };
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* 録音コントロール */}
          <div className="flex justify-center gap-4">
            {!isRecording && !audioUrl && (
              <Button
                size="lg"
                onClick={startRecording}
                className="bg-red-600 hover:bg-red-700"
              >
                <Mic className="mr-2" />
                録音開始
              </Button>
            )}

            {isRecording && (
              <Button
                size="lg"
                onClick={handleStop}
                variant="outline"
              >
                <MicOff className="mr-2" />
                録音停止
              </Button>
            )}

            {audioUrl && !isRecording && (
              <>
                <Button
                  size="lg"
                  onClick={() => setIsPlaying(!isPlaying)}
                  variant="outline"
                >
                  {isPlaying ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                  {isPlaying ? '一時停止' : '再生'}
                </Button>
                <Button
                  size="lg"
                  onClick={resetRecording}
                  variant="outline"
                >
                  <RotateCcw className="mr-2" />
                  録り直す
                </Button>
              </>
            )}
          </div>

          {/* 音量インジケーター */}
          {showVolumeIndicator && isRecording && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">音量レベル</span>
                <span className={cn("text-sm font-medium", getVolumeAdvice().color)}>
                  {getVolumeAdvice().text}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-100",
                    volume < 20 && "bg-orange-400",
                    volume >= 20 && volume <= 80 && "bg-green-500",
                    volume > 80 && "bg-red-500"
                  )}
                  style={{ width: `${volume}%` }}
                />
              </div>
            </div>
          )}

          {/* 音声プレーヤー */}
          {audioUrl && (
            <audio
              src={audioUrl}
              controls
              className="w-full"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}