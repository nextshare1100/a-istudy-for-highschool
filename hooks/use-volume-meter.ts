import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVolumeMeterOptions {
  updateInterval?: number;
  smoothingFactor?: number;
}

export function useVolumeMeter(options: UseVolumeMeterOptions = {}) {
  const { updateInterval = 100, smoothingFactor = 0.8 } = options;
  const [volume, setVolume] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const startMonitoring = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = smoothingFactor;
      
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);
      
      setIsMonitoring(true);
      
      const updateVolume = () => {
        if (!analyserRef.current || !isMonitoring) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // RMS計算でより正確な音量を取得
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const normalizedVolume = Math.min(100, (rms / 128) * 100);
        
        setVolume(Math.round(normalizedVolume));
        
        rafIdRef.current = requestAnimationFrame(updateVolume);
      };
      
      updateVolume();
    } catch (error) {
      console.error('Failed to start volume monitoring:', error);
      throw error;
    }
  }, [smoothingFactor, isMonitoring]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
      microphoneRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setVolume(0);
  }, []);

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  const getVolumeLevel = useCallback((): 'silent' | 'quiet' | 'normal' | 'loud' => {
    if (volume < 10) return 'silent';
    if (volume < 30) return 'quiet';
    if (volume < 70) return 'normal';
    return 'loud';
  }, [volume]);

  return {
    volume,
    isMonitoring,
    volumeLevel: getVolumeLevel(),
    startMonitoring,
    stopMonitoring,
  };
}