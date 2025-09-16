import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export function useSpeechRecognition() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    // Capacitorプラットフォームチェック
    if (Capacitor.isNativePlatform()) {
      // iOS/Androidネイティブの場合
      checkNativeAvailability();
    } else {
      // Webの場合
      checkWebAvailability();
    }
  }, []);

  const checkNativeAvailability = async () => {
    try {
      const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
      const { available } = await SpeechRecognition.available();
      setIsAvailable(available);
      
      if (available) {
        await SpeechRecognition.requestPermissions();
      }
    } catch (error) {
      console.error('Native speech recognition check failed:', error);
      setIsAvailable(false);
    }
  };

  const checkWebAvailability = () => {
    const available = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setIsAvailable(available);
  };

  const startListening = async () => {
    if (!isAvailable) return;

    if (Capacitor.isNativePlatform()) {
      try {
        const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
        
        await SpeechRecognition.start({
          language: 'ja-JP',
          maxResults: 1,
          prompt: '話してください',
          partialResults: true,
          popup: false,
        });

        SpeechRecognition.addListener('partialResults', (data: any) => {
          if (data.matches && data.matches.length > 0) {
            setTranscript(prev => prev + ' ' + data.matches[0]);
          }
        });

        setIsListening(true);
      } catch (error) {
        console.error('ネイティブ音声認識エラー:', error);
      }
    } else {
      // Web実装
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + ' ' + finalTranscript);
        }
      };
      
      recognition.start();
      setIsListening(true);
    }
  };

  const stopListening = async () => {
    if (!isAvailable) return;

    if (Capacitor.isNativePlatform()) {
      try {
        const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
        await SpeechRecognition.stop();
        setIsListening(false);
      } catch (error) {
        console.error('音声認識停止エラー:', error);
      }
    } else {
      // Web実装の停止処理
      setIsListening(false);
    }
  };

  return {
    isAvailable,
    isListening,
    transcript,
    startListening,
    stopListening,
    clearTranscript: () => setTranscript(''),
  };
}
