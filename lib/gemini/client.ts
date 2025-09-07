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

// ========== モデルフォールバック機能の追加 ==========

interface ModelUsageTracker {
  modelName: string;
  dailyCount: number;
  minuteCount: number;
  lastMinuteReset: number;
  lastDailyReset: string;
}

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private rateLimiter: RateLimiter;
  
  // 新規追加: モデル使用状況トラッカー
  private modelUsage: Map<string, ModelUsageTracker> = new Map();
  private modelHierarchy = [
    {
      name: 'gemini-1.5-pro',
      limits: { perMinute: 360, perDay: 10000 },
      quality: 10
    },
    {
      name: 'gemini-1.5-flash', 
      limits: { perMinute: 1000, perDay: 1500000 },
      quality: 8
    },
    {
      name: 'gemini-1.0-pro',
      limits: { perMinute: 60, perDay: 1500 },
      quality: 7
    }
  ];

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
    
    // モデル使用状況の初期化
    this.initializeModelUsage();
  }

  private initializeModelUsage() {
    this.modelHierarchy.forEach(model => {
      this.modelUsage.set(model.name, {
        modelName: model.name,
        dailyCount: 0,
        minuteCount: 0,
        lastMinuteReset: Date.now(),
        lastDailyReset: new Date().toDateString()
      });
    });
    
    // ローカルストレージから使用状況を復元（ブラウザ環境の場合）
    if (typeof window !== 'undefined') {
      const savedUsage = localStorage.getItem('gemini_model_usage');
      if (savedUsage) {
        try {
          const parsed = JSON.parse(savedUsage);
          Object.entries(parsed).forEach(([modelName, usage]: [string, any]) => {
            this.modelUsage.set(modelName, usage);
          });
        } catch (e) {
          console.error('Failed to restore model usage:', e);
        }
      }
    }
  }

  // 新規追加: 利用可能なモデルを取得
  private getAvailableModel(preferredModel?: string): string {
    const now = Date.now();
    const today = new Date().toDateString();

    // 優先モデルが指定されていて利用可能な場合
    if (preferredModel) {
      const usage = this.modelUsage.get(preferredModel);
      const modelConfig = this.modelHierarchy.find(m => m.name === preferredModel);
      
      if (usage && modelConfig && this.isModelAvailable(usage, modelConfig, now, today)) {
        return preferredModel;
      }
    }

    // 階層順に利用可能なモデルを探す
    for (const modelConfig of this.modelHierarchy) {
      const usage = this.modelUsage.get(modelConfig.name)!;
      
      if (this.isModelAvailable(usage, modelConfig, now, today)) {
        return modelConfig.name;
      }
    }

    throw new Error('すべてのモデルが利用制限に達しています。しばらく待ってから再試行してください。');
  }

  private isModelAvailable(
    usage: ModelUsageTracker,
    config: any,
    now: number,
    today: string
  ): boolean {
    // 日付が変わった場合はリセット
    if (usage.lastDailyReset !== today) {
      usage.dailyCount = 0;
      usage.lastDailyReset = today;
    }

    // 1分経過した場合はリセット
    if (now - usage.lastMinuteReset > 60000) {
      usage.minuteCount = 0;
      usage.lastMinuteReset = now;
    }

    return usage.dailyCount < config.limits.perDay && 
           usage.minuteCount < config.limits.perMinute;
  }

  private recordModelUsage(modelName: string) {
    const usage = this.modelUsage.get(modelName);
    if (!usage) return;

    usage.dailyCount++;
    usage.minuteCount++;
    
    // ローカルストレージに保存
    if (typeof window !== 'undefined') {
      const usageData: Record<string, ModelUsageTracker> = {};
      this.modelUsage.forEach((value, key) => {
        usageData[key] = value;
      });
      localStorage.setItem('gemini_model_usage', JSON.stringify(usageData));
    }
  }

  // 新規追加: フォールバック実行メソッド
  private async executeWithFallback<T>(
    operation: (modelName: string) => Promise<T>,
    options?: {
      preferredModel?: string;
      maxRetries?: number;
    }
  ): Promise<T> {
    const maxRetries = options?.maxRetries || 3;
    let lastError: Error | null = null;
    let attemptCount = 0;

    while (attemptCount < maxRetries) {
      attemptCount++;
      
      try {
        // 利用可能なモデルを取得
        const modelName = this.getAvailableModel(options?.preferredModel);
        console.log(`Attempting with model: ${modelName} (attempt ${attemptCount}/${maxRetries})`);

        // 操作を実行
        const result = await operation(modelName);
        
        // 成功したら使用を記録
        this.recordModelUsage(modelName);
        
        return result;

      } catch (error) {
        lastError = error as Error;
        console.error(`Model operation failed:`, error);

        // レート制限エラーの場合
        if (error.message?.includes('429') || error.message?.includes('quota')) {
          console.log('Rate limit hit, trying fallback model...');
          
          // 現在のモデルを一時的に無効化
          if (options?.preferredModel) {
            const usage = this.modelUsage.get(options.preferredModel);
            if (usage) {
              usage.dailyCount = Infinity; // 一時的に無効化
            }
          }
          
          continue;
        }

        // その他のエラーは即座に投げる
        throw error;
      }
    }

    throw lastError || new Error('All retry attempts failed');
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

  // generateProblemsメソッドを修正
  async generateProblems(request: GeminiProblemRequest): Promise<GeminiProblemResponse> {
    await this.waitForRateLimit();

    // フォールバック付き実行
    return await this.executeWithFallback(async (modelName: string) => {
      const prompt = PROMPTS.GENERATE_PROBLEM(request);
      
      // 動的にモデルを切り替え
      const model = this.genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
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

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = this.safeJsonParse<{ problems: GeneratedProblem[] }>(text);

      return {
        problems: parsed.problems,
        metadata: {
          generatedAt: new Date().toISOString(),
          model: modelName, // 実際に使用されたモデルを記録
          promptVersion: '1.0.0',
        },
      };
    });
  }

  async analyzeWeakness(request: GeminiAnalysisRequest): Promise<GeminiAnalysisResponse> {
    await this.waitForRateLimit();

    return await this.executeWithFallback(async (modelName: string) => {
      const prompt = PROMPTS.ANALYZE_WEAKNESS(request);
      const model = this.genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return this.safeJsonParse<GeminiAnalysisResponse>(text);
    });
  }

  async createSchedule(request: GeminiScheduleRequest): Promise<GeminiScheduleResponse> {
    await this.waitForRateLimit();

    return await this.executeWithFallback(async (modelName: string) => {
      const prompt = PROMPTS.CREATE_SCHEDULE(request);
      const model = this.genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return this.safeJsonParse<GeminiScheduleResponse>(text);
    });
  }

  // 新規追加: モデル使用状況を取得
  getModelUsageStats(): Array<{
    model: string;
    usage: ModelUsageTracker;
    limits: any;
    available: boolean;
  }> {
    const now = Date.now();
    const today = new Date().toDateString();

    return this.modelHierarchy.map(modelConfig => {
      const usage = this.modelUsage.get(modelConfig.name)!;
      return {
        model: modelConfig.name,
        usage: { ...usage }, // コピーを返す
        limits: modelConfig.limits,
        available: this.isModelAvailable(usage, modelConfig, now, today)
      };
    });
  }

  // 新規追加: 使用状況のリセット（テスト用）
  resetUsageStats(modelName?: string) {
    if (modelName) {
      const usage = this.modelUsage.get(modelName);
      if (usage) {
        usage.dailyCount = 0;
        usage.minuteCount = 0;
        usage.lastMinuteReset = Date.now();
        usage.lastDailyReset = new Date().toDateString();
      }
    } else {
      this.initializeModelUsage();
    }
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gemini_model_usage');
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

// 新規追加: モデル使用状況を取得するヘルパー関数
export function getModelUsageStats() {
  const client = getGeminiClient();
  return client.getModelUsageStats();
}

// generateScheduleWithAI エクスポート（互換性のため）
export const generateScheduleWithAI = async (request: GeminiScheduleRequest) => {
  const client = getGeminiClient();
  return client.createSchedule(request);
};

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

// createSchedule エクスポート（直接）
export const createSchedule = async (request: GeminiScheduleRequest) => {
  const client = getGeminiClient();
  return client.createSchedule(request);
};