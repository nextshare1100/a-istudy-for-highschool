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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ja-JP';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onresult = (event: any) => {
          const last = event.results.length - 1;
          const transcript = event.results[last][0].transcript;
          onTranscript(transcript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setError(`エラー: ${event.error}`);
          onRecordingChange(false);
        };

        recognitionRef.current = recognition;
      } else {
        setError('このブラウザは音声認識に対応していません');
      }
    }
  }, [onTranscript, onRecordingChange]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setError('音声認識が初期化されていません');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      onRecordingChange(false);
    } else {
      setError('');
      recognitionRef.current.start();
      onRecordingChange(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <button
          onClick={toggleRecording}
          className={`p-6 rounded-full transition-all ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
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
        {isRecording ? '話してください...' : 'マイクボタンをタップして開始'}
      </div>
    </div>
  );
}
