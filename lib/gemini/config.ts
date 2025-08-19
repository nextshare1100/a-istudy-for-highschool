// lib/gemini/config.ts

import { GoogleGenerativeAI } from '@google/generative-ai';

// APIキーの取得（クライアントサイドでは null を返す）
const getApiKey = (): string | null => {
  // クライアントサイドでは使用しない
  if (typeof window !== 'undefined') {
    console.warn('Gemini API should not be used on client side');
    return null;
  }
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set in environment variables');
    console.error('Please add GEMINI_API_KEY to your .env.local file');
    return null;
  }
  
  return apiKey;
};

// Gemini APIクライアントの初期化（条件付き）
const apiKey = getApiKey();
export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// APIが利用可能かチェック
export const isGeminiAvailable = (): boolean => {
  return !!genAI;
};

// モデル設定
export const MODELS = {
  FLASH: 'gemini-1.5-flash',
  PRO: 'gemini-1.5-pro',
  PRO_VISION: 'gemini-pro-vision',
  PRO_1_5: 'gemini-1.5-pro'
} as const;

// デフォルトのモデル設定
export const DEFAULT_MODEL_CONFIG = {
  temperature: 0.7,
  maxOutputTokens: 2048,
  topP: 0.95,
  topK: 40,
};

// 安全性設定
export const SAFETY_SETTINGS = [
  {
    category: 'HARM_CATEGORY_HARASSMENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    threshold: 'BLOCK_MEDIUM_AND_ABOVE',
  },
];

// エラーメッセージ
export const GEMINI_ERROR_MESSAGES = {
  API_KEY_MISSING: 'Gemini APIキーが設定されていません。',
  CLIENT_SIDE_ERROR: 'Gemini APIはサーバーサイドでのみ使用可能です。',
  API_ERROR: 'Gemini APIでエラーが発生しました。',
  RATE_LIMIT: 'APIレート制限に達しました。',
};