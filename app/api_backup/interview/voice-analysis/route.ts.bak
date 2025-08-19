import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { VoiceAnalyzer } from '@/lib/interview/voice-utils';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const questionId = formData.get('questionId') as string;

    if (!audioFile || !questionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 音声ファイルを処理
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioData = new Float32Array(arrayBuffer);

    // 音声分析
    const analyzer = new VoiceAnalyzer();
    const analysis = {
      volume: 65, // 実際の実装では音声データから計算
      volumeAdvice: analyzer.getVolumeAdvice(65),
      transcription: '', // 実際の実装では音声認識APIを使用
      corrections: [],
      duration: audioData.length / 44100, // サンプリングレート44.1kHz想定
      speechRate: 0,
      pauses: analyzer.detectPauses(audioData, 44100),
    };

    // 音声認識（実際の実装ではGoogle Speech-to-Text APIなどを使用）
    // const transcription = await speechToText(audioFile);
    // analysis.transcription = transcription;

    // 文章訂正の生成（実際の実装ではGemini APIを使用）
    // const corrections = await generateCorrections(transcription);
    // analysis.corrections = corrections;

    // 話速の計算
    if (analysis.transcription) {
      analysis.speechRate = analyzer.calculateSpeechRate(
        analysis.transcription,
        analysis.duration
      );
    }

    // 分析結果を保存
    const { error: dbError } = await supabase
      .from('voice_analyses')
      .insert({
        user_id: user.id,
        question_id: questionId,
        average_volume: analysis.volume,
        volume_advice: analysis.volumeAdvice,
        speech_rate: analysis.speechRate,
        pause_count: analysis.pauses,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save analysis' },
        { status: 500 }
      );
    }

    analyzer.dispose();

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Voice analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}