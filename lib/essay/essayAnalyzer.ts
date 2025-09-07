import { GoogleGenerativeAI } from '@google/generative-ai';

interface EssayTheme {
  id?: string;
  title: string;
  description: string;
  minLength?: number;
  maxLength: number;
}

interface EssaySubmission {
  id?: string;
  themeId: string;
  content: string;
  wordCount: number;
}

interface EssayEvaluation {
  id: string;
  submissionId: string;
  scores: {
    [key: string]: {
      score: number;
      feedback: string;
    };
  };
  overallScore: number;
  feedback: {
    strengths: string[];
    improvements: string[];
    suggestions: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export class EssayAnalyzer {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async analyzeEssay(
    submission: EssaySubmission,
    theme: EssayTheme
  ): Promise<EssayEvaluation> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      以下の小論文を詳細に分析してください。

      【テーマ】${theme.title}
      【要求文字数】${theme.minLength || 0}〜${theme.maxLength}文字
      【本文】${submission.content}

      以下の観点で評価し、JSON形式で返答してください：
      {
        "scores": {
          "structure": { "score": 0-10, "feedback": "具体的なフィードバック" },
          "logic": { "score": 0-10, "feedback": "具体的なフィードバック" },
          "specificity": { "score": 0-10, "feedback": "具体的なフィードバック" },
          "expression": { "score": 0-10, "feedback": "具体的なフィードバック" },
          "relevance": { "score": 0-10, "feedback": "具体的なフィードバック" }
        },
        "overallScore": 0-100,
        "strengths": ["良い点のリスト"],
        "improvements": ["改善点のリスト"],
        "suggestions": ["具体的な改善提案"]
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      const evaluation = JSON.parse(text);
      
      return {
        id: crypto.randomUUID(),
        submissionId: submission.id!,
        scores: evaluation.scores,
        overallScore: evaluation.overallScore,
        feedback: {
          strengths: evaluation.strengths,
          improvements: evaluation.improvements,
          suggestions: evaluation.suggestions
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to analyze essay:', error);
      throw new Error('小論文の分析に失敗しました');
    }
  }

  async generateModelAnswer(theme: EssayTheme): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      以下のテーマで模範的な小論文を作成してください：

      【テーマ】${theme.title}
      【説明】${theme.description}
      【文字数】${theme.maxLength}文字以内

      大学入試で高評価を得られる構成と内容で作成してください。
    `;

    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Failed to generate model answer:', error);
      throw new Error('模範解答の生成に失敗しました');
    }
  }
}

export const essayAnalyzer = new EssayAnalyzer(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
