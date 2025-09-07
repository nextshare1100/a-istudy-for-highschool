export interface SpeechAnalysis {
  duration: number;
  pace: PaceAnalysis;
  volume: VolumeAnalysis;
  clarity: ClarityAnalysis;
  fillerWords: FillerWordAnalysis;
  pronunciation: PronunciationScore;
  suggestions: string[];
}

interface PaceAnalysis {
  wordsPerMinute: number;
  rating: 'too-slow' | 'slow' | 'normal' | 'fast' | 'too-fast';
  suggestion: string;
}

interface VolumeAnalysis {
  averageDecibel: number;
  consistency: number;
  rating: 'too-quiet' | 'quiet' | 'normal' | 'loud' | 'too-loud';
}

interface ClarityAnalysis {
  score: number;
  issues: string[];
}

interface FillerWordAnalysis {
  count: number;
  types: string[];
  frequency: number;
  locations: number[];
}

interface PronunciationScore {
  overall: number;
  problemWords: string[];
}

export class SpeechAnalyzer {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
  }

  async analyzeRecording(audioBlob: Blob, transcript: string): Promise<SpeechAnalysis> {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    
    const pace = this.analyzePace(audioBuffer, transcript);
    const volume = this.analyzeVolume(audioBuffer);
    const clarity = await this.analyzeClarity(audioBlob, transcript);
    const fillerWords = this.detectFillerWords(transcript);
    const pronunciation = await this.analyzePronunciation(audioBlob, transcript);
    
    return {
      duration: audioBuffer.duration,
      pace,
      volume,
      clarity,
      fillerWords,
      pronunciation,
      suggestions: this.generateSuggestions(pace, volume, clarity, fillerWords, pronunciation)
    };
  }

  private analyzePace(audioBuffer: AudioBuffer, transcript: string): PaceAnalysis {
    const duration = audioBuffer.duration;
    const words = transcript.split(/\s+/).filter(word => word.length > 0);
    const wordsPerMinute = (words.length / duration) * 60;
    
    let rating: PaceAnalysis['rating'];
    let suggestion: string;
    
    if (wordsPerMinute < 100) {
      rating = 'too-slow';
      suggestion = '話すペースが遅すぎます。もう少し速く話してみましょう。';
    } else if (wordsPerMinute < 130) {
      rating = 'slow';
      suggestion = '話すペースがやや遅いです。もう少しテンポよく話してみましょう。';
    } else if (wordsPerMinute <= 160) {
      rating = 'normal';
      suggestion = '適切な話すペースです。';
    } else if (wordsPerMinute <= 180) {
      rating = 'fast';
      suggestion = '話すペースがやや速いです。もう少しゆっくり話してみましょう。';
    } else {
      rating = 'too-fast';
      suggestion = '話すペースが速すぎます。聞き手が理解しやすいようにゆっくり話しましょう。';
    }
    
    return { wordsPerMinute, rating, suggestion };
  }

  private analyzeVolume(audioBuffer: AudioBuffer): VolumeAnalysis {
    const data = audioBuffer.getChannelData(0);
    
    // Float32Arrayを通常の配列に変換
    const dataArray = Array.from(data);
    
    const rms = Math.sqrt(dataArray.reduce((sum, sample) => sum + sample * sample, 0) / dataArray.length);
    const averageDecibel = 20 * Math.log10(rms);
    
    const chunks = this.chunkArray(dataArray, 100);
    const chunkRms = chunks.map(chunk => 
      Math.sqrt(chunk.reduce((sum, sample) => sum + sample * sample, 0) / chunk.length)
    );
    const consistency = 1 - this.standardDeviation(chunkRms) / this.average(chunkRms);
    
    let rating: VolumeAnalysis['rating'];
    if (averageDecibel < -40) rating = 'too-quiet';
    else if (averageDecibel < -30) rating = 'quiet';
    else if (averageDecibel <= -15) rating = 'normal';
    else if (averageDecibel <= -10) rating = 'loud';
    else rating = 'too-loud';
    
    return { averageDecibel, consistency, rating };
  }

  private async analyzeClarity(audioBlob: Blob, transcript: string): Promise<ClarityAnalysis> {
    const issues: string[] = [];
    let score = 100;
    
    const duration = await this.getAudioDuration(audioBlob);
    const expectedWords = duration * 2.5;
    const actualWords = transcript.split(/\s+/).length;
    
    if (actualWords < expectedWords * 0.7) {
      issues.push('話し声が不明瞭な箇所があります');
      score -= 20;
    }
    
    return { score, issues };
  }

  private detectFillerWords(transcript: string): FillerWordAnalysis {
    const fillerPatterns = [
      'えー', 'えーと', 'あの', 'その', 'まあ', 
      'ちょっと', 'なんか', 'えっと', 'んー'
    ];
    
    let count = 0;
    const types: string[] = [];
    const locations: number[] = [];
    
    fillerPatterns.forEach(filler => {
      const regex = new RegExp(filler, 'g');
      let match;
      while ((match = regex.exec(transcript)) !== null) {
        count++;
        if (!types.includes(filler)) types.push(filler);
        locations.push(match.index);
      }
    });
    
    const words = transcript.split(/\s+/).length;
    const frequency = (count / words) * 100;
    
    return { count, types, frequency, locations };
  }

  private async analyzePronunciation(audioBlob: Blob, transcript: string): Promise<PronunciationScore> {
    const problemWords: string[] = [];
    const overall = 85;
    
    return { overall, problemWords };
  }

  private generateSuggestions(
    pace: PaceAnalysis,
    volume: VolumeAnalysis,
    clarity: ClarityAnalysis,
    fillerWords: FillerWordAnalysis,
    pronunciation: PronunciationScore
  ): string[] {
    const suggestions: string[] = [];
    
    if (pace.rating !== 'normal') {
      suggestions.push(pace.suggestion);
    }
    
    if (volume.rating === 'too-quiet' || volume.rating === 'quiet') {
      suggestions.push('もう少し大きな声で話しましょう。');
    } else if (volume.rating === 'too-loud') {
      suggestions.push('声が大きすぎます。適度な音量で話しましょう。');
    }
    
    if (volume.consistency < 0.7) {
      suggestions.push('声の大きさを一定に保つよう心がけましょう。');
    }
    
    if (fillerWords.frequency > 5) {
      suggestions.push(`「${fillerWords.types.join('」「')}」などの言葉が多いです。減らすよう意識しましょう。`);
    }
    
    if (clarity.score < 80) {
      suggestions.push(...clarity.issues);
    }
    
    if (pronunciation.overall < 70) {
      suggestions.push('発音をより明確にするよう心がけましょう。');
    }
    
    return suggestions;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private average(numbers: number[]): number {
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private standardDeviation(numbers: number[]): number {
    const avg = this.average(numbers);
    const squareDiffs = numbers.map(num => Math.pow(num - avg, 2));
    return Math.sqrt(this.average(squareDiffs));
  }

  private async getAudioDuration(audioBlob: Blob): Promise<number> {
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve) => {
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(audioUrl);
        resolve(audio.duration);
      });
    });
  }

  cleanup() {
    this.audioContext.close();
  }
}
