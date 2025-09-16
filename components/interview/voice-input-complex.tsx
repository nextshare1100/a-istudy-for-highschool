'use client';

import { useEffect } from 'react';
import { Mic, MicOff, Smartphone } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { Capacitor } from '@capacitor/core';

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
  const { isAvailable, isListening, transcript, startListening, stopListening, clearTranscript } = useSpeechRecognition();
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  const toggleRecording = async () => {
    if (isListening) {
      await stopListening();
      onRecordingChange(false);
    } else {
      clearTranscript();
      await startListening();
      onRecordingChange(true);
    }
  };

  if (!isAvailable) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          {isNative 
            ? '音声認識を使用するには、設定でマイクの権限を許可してください' 
            : 'このブラウザは音声入力に対応していません'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <button
          onClick={toggleRecording}
          className={`relative p-6 rounded-full transition-all ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isListening ? (
            <MicOff className="text-white" size={32} />
          ) : (
            <Mic className="text-white" size={32} />
          )}
        </button>
      </div>
      
      {isNative && (
        <div className="text-center">
          <Smartphone className="inline mr-2" size={16} />
          <span className="text-sm text-gray-600">
            ネイティブ音声認識を使用中
          </span>
        </div>
      )}
      
      <div className="text-center text-sm text-gray-500">
        {isListening ? '音声認識中... 話し終わったらボタンをタップ' : 'ボタンをタップして話す'}
      </div>
      
      {transcript && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{transcript}</p>
        </div>
      )}
    </div>
  );
}
