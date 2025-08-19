export class VoiceAnalyzer {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  
  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
  }

  async analyzeVolume(stream: MediaStream): Promise<number> {
    const source = this.audioContext.createMediaStreamSource(stream);
    source.connect(this.analyser);
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    return Math.round((average / 255) * 100);
  }

  calculateSpeechRate(text: string, duration: number): number {
    const charCount = text.length;
    const minutes = duration / 60;
    return Math.round(charCount / minutes);
  }

  detectPauses(audioData: Float32Array, sampleRate: number): number {
    const threshold = 0.01;
    const minPauseDuration = 0.3; // 300ms
    const samplesPerPause = sampleRate * minPauseDuration;
    
    let pauseCount = 0;
    let currentPauseLength = 0;
    
    for (let i = 0; i < audioData.length; i++) {
      if (Math.abs(audioData[i]) < threshold) {
        currentPauseLength++;
        if (currentPauseLength >= samplesPerPause) {
          pauseCount++;
          currentPauseLength = 0;
        }
      } else {
        currentPauseLength = 0;
      }
    }
    
    return pauseCount;
  }

  getVolumeAdvice(volumeLevel: number): 'too_quiet' | 'good' | 'too_loud' {
    if (volumeLevel < 30) return 'too_quiet';
    if (volumeLevel > 70) return 'too_loud';
    return 'good';
  }

  dispose() {
    this.audioContext.close();
  }
}

// 音声データをBase64に変換
export function audioBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Web Audio APIのサポートチェック
export function checkAudioSupport(): boolean {
  return !!(window.AudioContext || (window as any).webkitAudioContext);
}

// マイクのアクセス権限チェック
export async function checkMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch {
    return false;
  }
}