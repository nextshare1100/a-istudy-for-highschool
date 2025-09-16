'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, AlertCircle, Shield } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onVolumeChange?: (volume: number) => void;
  isRecording: boolean;
  onRecordingChange: (recording: boolean) => void;
}

export function VoiceInput({ 
  onTranscript, 
  onVolumeChange,
  isRecording,
  onRecordingChange 
}: VoiceInputProps) {
  const [volume, setVolume] = useState(0);
  const [isSupported, setIsSupported] = useState(false);
  const [isSecureContext, setIsSecureContext] = useState(false);
  const [error, setError] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // セキュアコンテキストチェック
    const secure = window.isSecureContext;
    setIsSecureContext(secure);
    
    if (!secure) {
      setError('安全な接続（HTTPS）が必要です。HTTPSでアクセスしてください。');
      return;
    }

    // MediaDevices APIチェック
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('このブラウザはマイク機能に対応していません');
      return;
    }

    // 音声認識APIチェック
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('音声認識APIがサポートされていません');
      return;
    }

    setIsSupported(true);

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('音声認識開始');
      setIsListening(true);
      setError('');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        }
      }
      
      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error('音声認識エラー:', event.error);
      setIsListening(false);
      
      switch(event.error) {
        case 'network':
          setError('ネットワークエラーが発生しました');
          break;
        case 'not-allowed':
          setError('マイクの使用が許可されていません');
          break;
        case 'no-speech':
          // 音声が検出されない場合は無視
          return;
        default:
          setError(`エラーが発生しました: ${event.error}`);
      }
      
      onRecordingChange(false);
    };

    recognition.onend = () => {
      console.log('音声認識終了');
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [onTranscript, onRecordingChange]);

  const startVolumeMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        const normalizedVolume = Math.min(100, (average / 128) * 100);
        
        setVolume(normalizedVolume);
        onVolumeChange?.(normalizedVolume);
        
        animationRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (error: any) {
      console.error('マイクアクセスエラー:', error);
      if (error.name === 'NotAllowedError') {
        setError('マイクへのアクセスが拒否されました');
      } else if (error.name === 'NotFoundError') {
        setError('マイクが見つかりません');
      } else {
        setError(`マイクエラー: ${error.message}`);
      }
      throw error;
    }
  };

  const toggleRecording = async () => {
    if (!isSupported || !isSecureContext) {
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        console.error('音声認識停止エラー:', e);
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      onRecordingChange(false);
      setVolume(0);
    } else {
      setError('');
      
      try {
        await startVolumeMonitoring();
        recognitionRef.current?.start();
        onRecordingChange(true);
      } catch (e) {
        console.error('録音開始エラー:', e);
        onRecordingChange(false);
      }
    }
  };

  const getVolumeLevel = () => {
    if (volume < 20) return { level: '小さい', color: '#ef4444', message: 'もう少し大きな声で' };
    if (volume < 40) return { level: '適切', color: '#10b981', message: '良い音量です' };
    if (volume < 70) return { level: '理想的', color: '#10b981', message: '完璧な音量です！' };
    return { level: '大きい', color: '#f59e0b', message: '少し声を抑えめに' };
  };

  const volumeInfo = getVolumeLevel();

  // HTTPSでない場合の警告表示
  if (!isSecureContext) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold text-yellow-800 mb-1">
                安全な接続が必要です
              </p>
              <p className="text-sm text-yellow-700 mb-2">
                音声入力機能を使用するには、HTTPSでアクセスする必要があります。
              </p>
              <div className="bg-yellow-100 rounded p-2 text-xs font-mono">
                https://localhost:3443 でアクセスしてください
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={toggleRecording}
          disabled={!isSupported}
          className={`relative p-6 rounded-full transition-all ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600'
          } ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isRecording ? (
            <>
              <MicOff className="text-white" size={32} />
              {isListening && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              )}
            </>
          ) : (
            <Mic className="text-white" size={32} />
          )}
        </button>
      </div>

      {isRecording && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Volume2 size={20} className="text-gray-600" />
              <span className="text-sm font-medium">音量レベル</span>
            </div>
            <span 
              className="text-sm font-bold"
              style={{ color: volumeInfo.color }}
            >
              {volumeInfo.level}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${volume}%`,
                backgroundColor: volumeInfo.color 
              }}
            />
          </div>
          
          <p className="text-xs text-center" style={{ color: volumeInfo.color }}>
            {volumeInfo.message}
          </p>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-4">
        <p>※ マイクボタンをクリックして音声入力を開始</p>
        <p>※ 話し終わったら、もう一度クリックして停止</p>
      </div>
    </div>
  );
}
