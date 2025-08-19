import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import {
  GeminiProblemRequest,
  GeminiProblemResponse,
  GeminiAnalysisRequest,
  GeminiAnalysisResponse,
  GeminiScheduleRequest,
  GeminiScheduleResponse,
  GeminiError,
  GeneratedProblem,
} from '@/types/gemini';
import { PROMPTS } from './prompts';

// レート制限の実装
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  timeUntilNextRequest(): number {
    if (this.canMakeRequest()) return 0;
    const oldestRequest = Math.min(...this.requests);
    return this.windowMs - (Date.now() - oldestRequest);
  }
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private rateLimiter: RateLimiter;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!key) {
      throw new Error('Gemini API key is required');
    }

    this.genAI = new GoogleGenerativeAI(key);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    this.rateLimiter = new RateLimiter();
  }

  private async waitForRateLimit(): Promise<void> {
    if (!this.rateLimiter.canMakeRequest()) {
      const waitTime = this.rateLimiter.timeUntilNextRequest();
      console.log(`Rate limit reached. Waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.rateLimiter.recordRequest();
  }

  private async safeJsonParse<T>(text: string): Promise<T> {
    try {
      // JSONブロックを抽出
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      
      // 直接JSONとしてパース
      return JSON.parse(text);
    } catch (error) {
      console.error('JSON parse error:', error);
      console.error('Raw text:', text);
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, i);
          console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  async generateProblems(request: GeminiProblemRequest): Promise<GeminiProblemResponse> {
    await this.waitForRateLimit();

    const prompt = PROMPTS.GENERATE_PROBLEM(request);

    try {
      const response = await this.retryWithBackoff(async () => {
        const result = await this.model.generateContent(prompt);
        const text = result.response.text();
        return this.safeJsonParse<{ problems: GeneratedProblem[] }>(text);
      });

      return {
        problems: response.problems,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: 'gemini-1.5-flash',
          promptVersion: '1.0.0',
        },
      };
    } catch (error) {
      console.error('Error generating problems:', error);
      throw this.handleError(error);
    }
  }

  async analyzeWeakness(request: GeminiAnalysisRequest): Promise<GeminiAnalysisResponse> {
    await this.waitForRateLimit();

    const prompt = PROMPTS.ANALYZE_WEAKNESS(request);

    try {
      const response = await this.retryWithBackoff(async () => {
        const result = await this.model.generateContent(prompt);
        const text = result.response.text();
        return this.safeJsonParse<GeminiAnalysisResponse>(text);
      });

      return response;
    } catch (error) {
      console.error('Error analyzing weakness:', error);
      throw this.handleError(error);
    }
  }

  async createSchedule(request: GeminiScheduleRequest): Promise<GeminiScheduleResponse> {
    await this.waitForRateLimit();

    const prompt = PROMPTS.CREATE_SCHEDULE(request);

    try {
      const response = await this.retryWithBackoff(async () => {
        const result = await this.model.generateContent(prompt);
        const text = result.response.text();
        return this.safeJsonParse<GeminiScheduleResponse>(text);
      });

      return response;
    } catch (error) {
      console.error('Error creating schedule:', error);
      throw this.handleError(error);
    }
  }

  private handleError(error: any): GeminiError {
    if (error.message?.includes('API key')) {
      return {
        code: 'INVALID_API_KEY',
        message: 'Invalid or missing API key',
        details: error,
      };
    }

    if (error.message?.includes('rate limit')) {
      return {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'API rate limit exceeded. Please try again later.',
        details: error,
      };
    }

    if (error.message?.includes('JSON')) {
      return {
        code: 'PARSE_ERROR',
        message: 'Failed to parse AI response',
        details: error,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: error,
    };
  }
}

// シングルトンインスタンス
let clientInstance: GeminiClient | null = null;

export function getGeminiClient(): GeminiClient {
  if (!clientInstance) {
    clientInstance = new GeminiClient();
  }
  return clientInstance;
}

// geminiService として export（study-store.ts で使用されている）
export const geminiService = {
  generateProblem: async (params: {
    subject: string;
    topic: string;
    difficulty: string;
    grade?: string;
    unit?: string;
    includeCanvas?: boolean;
    canvasType?: string;
    canvasDescription?: string;
    additionalContext?: string;
  }) => {
    const client = getGeminiClient();
    
    // GeminiProblemRequest 形式に変換
    const request: GeminiProblemRequest = {
      subject: params.subject,
      topic: params.topic,
      difficulty: params.difficulty as 'basic' | 'standard' | 'advanced' | 'expert',
      count: 1,
      userProfile: {
        grade: params.grade || '高1',
        targetUniversities: [],
        weakPoints: [],
        recentMistakes: []
      },
      preferences: {
        includeImages: params.includeCanvas,
        problemTypes: ['multiple_choice', 'short_answer', 'essay']
      }
    };

    try {
      const response = await client.generateProblems(request);
      
      // 最初の問題を返す（Canvas データを含む形式で）
      if (response.problems.length > 0) {
        const problem = response.problems[0];
        
        // Canvas データを生成
        let canvasData = undefined;
        if (params.includeCanvas && params.canvasType) {
          canvasData = {
            type: params.canvasType as any,
            data: generateCanvasData(params.canvasType, params.canvasDescription),
            width: 600,
            height: 400,
            interactive: true
          };
        }

        return {
          ...problem,
          canvasData
        };
      }
      
      throw new Error('No problems generated');
    } catch (error) {
      console.error('Error in geminiService.generateProblem:', error);
      throw error;
    }
  }
};

// Canvas データ生成ヘルパー関数
function generateCanvasData(type: string, description?: string): any {
  switch (type) {
    case 'function':
      return {
        expression: "x^2 - 4*x + 3",
        domain: [-2, 6],
        color: "#2563eb"
      };
    
    case 'geometry':
      return {
        shape: "triangle",
        vertices: [[0, 0], [4, 0], [2, 3]],
        labels: ["A", "B", "C"]
      };
    
    case 'coordinate':
      return {
        showGrid: true,
        showLabels: true,
        range: [-10, 10]
      };
    
    case 'vector':
      return {
        vectors: [
          {
            start: [0, 0],
            end: [3, 4],
            color: "#2563eb",
            label: "a"
          }
        ],
        showGrid: true
      };
    
    case 'statistics':
      return {
        type: "histogram",
        values: [10, 15, 20, 25, 30],
        labels: ["A", "B", "C", "D", "E"]
      };
    
    default:
      return {};
  }
}