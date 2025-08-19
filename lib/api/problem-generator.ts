// lib/api/problem-generator.ts - Canvas自動生成対応版

interface StreamData {
  status: string;
  [key: string]: any;
}

export class ProblemGeneratorAPI {
  static async generateProblem(
    request: {
      subject: string;
      topic: string;
      difficulty: string;
      problemType: string;
      includeCanvas?: boolean;
      additionalRequirements?: string;
      subjectName?: string;
    },
    onUpdate: (data: StreamData) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const response = await fetch('/api/ai/generate-problem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // 最後の不完全な行を次のバッファに持ち越す
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.status === 'error') {
                onError(data.error || '問題の生成中にエラーが発生しました');
                return;
              }
              
              // Canvas自動生成のステータス
              if (data.needsCanvas !== undefined) {
                console.log('[API Client] Canvas auto-detected:', data.needsCanvas, data.canvasType);
              }
              
              onUpdate(data);
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('API Error:', error);
      onError(error instanceof Error ? error.message : '問題の生成中にエラーが発生しました');
    }
  }
}

// 問題データを整形する関数
export function formatProblemFromStream(streamData: Record<string, any>): {
  id: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: string;
  type: string;
  content: {
    question: string;
    options?: string[];
    answer: string | string[];
    explanation: string;
    hints?: string[];
    canvasData?: any;
    estimatedTime?: number;
    keywords?: string[];
    sequences?: string[];
    autoCanvas?: boolean; // Canvas自動生成フラグ
  };
  tags: string[];
  model?: string;
  modelReason?: string;
} {
  return {
    id: 'temp_' + Date.now(),
    title: streamData.title || `${streamData.topic}の問題`,
    subject: streamData.subject,
    topic: streamData.topic,
    difficulty: streamData.difficulty,
    type: streamData.type,
    content: {
      question: streamData.question || '',
      options: streamData.options,
      answer: streamData.answer || '',
      explanation: streamData.explanation || '',
      hints: streamData.hints || [],
      canvasData: streamData.canvasData,
      estimatedTime: streamData.estimatedTime || 15,
      keywords: streamData.keywords || [],
      sequences: streamData.sequences,
      autoCanvas: streamData.needsCanvas && streamData.canvasData ? true : false,
    },
    tags: [streamData.subject, streamData.topic, streamData.difficulty].filter(Boolean),
    model: streamData.model,
    modelReason: streamData.modelReason,
  };
}

// Canvas必要性を事前チェックする関数
export function checkNeedsCanvas(
  subject: string,
  topic: string,
  problemType: string
): { likely: boolean; confidence: number } {
  const visualSubjects = ['math', 'physics', 'chemistry'];
  const visualTopics = [
    'グラフ', '関数', '図形', 'ベクトル', '座標',
    '力学', '波動', '電磁気', '分子構造'
  ];
  const visualTypes = [
    'graph_drawing', 'function_analysis', 'geometry_proof',
    'vector_calculation', 'coordinate_geometry'
  ];

  let score = 0;
  
  if (visualSubjects.some(s => subject.toLowerCase().includes(s))) {
    score += 0.3;
  }
  
  if (visualTopics.some(t => topic.includes(t))) {
    score += 0.4;
  }
  
  if (visualTypes.includes(problemType)) {
    score += 0.3;
  }

  return {
    likely: score >= 0.5,
    confidence: Math.min(score, 1)
  };
}