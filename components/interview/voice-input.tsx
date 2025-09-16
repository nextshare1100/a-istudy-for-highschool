'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onVolumeChange?: (volume: number) => void;
  isRecording: boolean;
  onRecordingChange: (recording: boolean) => void;
}

export function VoiceInput({ 
  onTranscript, 
  isRecording,
  onRecordingChange 
}: VoiceInputProps) {
  const [error, setError] = useState('');
  const recognitionRef = useRef<any>(null);
  const isActiveRef = useRef(false);

  // クリーンアップ関数
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        } catch (e) {
          console.error('Cleanup error:', e);
        }
      }
    };
  }, []);

  const startRecording = () => {
    // 既に録音中の場合は何もしない
    if (isActiveRef.current) {
      console.log('既に録音中です');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('音声認識はサポートされていません');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = false;  // 重要: 一回だけ認識
    recognition.interimResults = false;  // 確定結果のみ
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log('音声認識開始');
      setError('');
      isActiveRef.current = true;
    };

    recognition.onresult = (event: any) => {
      if (!event.results || event.results.length === 0) return;
      
      const transcript = event.results[0][0].transcript;
      console.log('認識結果:', transcript);
      
      // "test"や空白のみの結果を無視
      if (transcript && 
          transcript.trim() !== '' && 
          transcript.toLowerCase() !== 'test' &&
          transcript !== 'テスト') {
        onTranscript(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('認識エラー:', event.error);
      isActiveRef.current = false;
      
      if (event.error === 'no-speech') {
        setError('音声が検出されませんでした');
      } else if (event.error === 'not-allowed') {
        setError('マイクへのアクセスが拒否されました');
      } else {
        setError(`エラー: ${event.error}`);
      }
      
      onRecordingChange(false);
    };

    recognition.onend = () => {
      console.log('音声認識終了');
      isActiveRef.current = false;
      onRecordingChange(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      onRecordingChange(true);
    } catch (e) {
      console.error('開始エラー:', e);
      setError('音声認識を開始できません');
      isActiveRef.current = false;
    }
  };

  const stopRecording = () => {
    isActiveRef.current = false;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('停止エラー:', e);
      }
      recognitionRef.current = null;
    }
    
    onRecordingChange(false);
  };

  const toggleRecording = () => {
    if (isRecording || isActiveRef.current) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <button
          onClick={toggleRecording}
          className={`p-6 rounded-full transition-all ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isRecording ? (
            <MicOff className="text-white" size={32} />
          ) : (
            <Mic className="text-white" size={32} />
          )}
        </button>
      </div>
      
      {error && (
        <div className="text-red-500 text-sm text-center">
          {error}
        </div>
      )}
      
      <div className="text-center text-sm text-gray-500">
        {isRecording ? '話してください（話し終わると自動的に停止します）' : 'マイクボタンをタップして開始'}
      </div>
    </div>
  );
}
