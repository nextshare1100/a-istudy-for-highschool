// lib/canvas/expression-evaluator.ts

// 利用可能な数学関数
const MATH_FUNCTIONS = {
  // 基本関数
  'sin': Math.sin,
  'cos': Math.cos,
  'tan': Math.tan,
  'asin': Math.asin,
  'acos': Math.acos,
  'atan': Math.atan,
  'sinh': Math.sinh,
  'cosh': Math.cosh,
  'tanh': Math.tanh,
  
  // 指数・対数
  'exp': Math.exp,
  'log': Math.log,
  'log10': Math.log10,
  'log2': Math.log2,
  'sqrt': Math.sqrt,
  'cbrt': Math.cbrt,
  'pow': Math.pow,
  
  // その他
  'abs': Math.abs,
  'ceil': Math.ceil,
  'floor': Math.floor,
  'round': Math.round,
  'sign': Math.sign,
  'max': Math.max,
  'min': Math.min,
}

// 数学定数
const MATH_CONSTANTS = {
  'PI': Math.PI,
  'E': Math.E,
  'pi': Math.PI,
  'e': Math.E,
}

// 数式を安全に評価する関数
export function evaluateExpression(expression: string, variables: { [key: string]: number } = {}): number {
  try {
    // 安全性チェック
    if (!isValidExpression(expression)) {
      throw new Error('Invalid expression')
    }
    
    // 数式を前処理
    let processedExpression = preprocessExpression(expression)
    
    // Function constructorを使って評価（evalより安全）
    const func = createSafeFunction(processedExpression, variables)
    const result = func()
    
    // 結果の検証
    if (!isFinite(result)) {
      throw new Error('Result is not finite')
    }
    
    return result
  } catch (error) {
    console.error('Expression evaluation error:', error)
    throw error
  }
}

// 数式の妥当性チェック
function isValidExpression(expression: string): boolean {
  // 危険な文字列のチェック
  const dangerousPatterns = [
    /\beval\b/i,
    /\bfunction\b/i,
    /\bnew\b/i,
    /\bthis\b/i,
    /\bwindow\b/i,
    /\bdocument\b/i,
    /\bglobal\b/i,
    /\bprocess\b/i,
    /\brequire\b/i,
    /\bimport\b/i,
    /\bexport\b/i,
    /\b__/,
    /\$/, // テンプレート構文
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(expression)) {
      return false
    }
  }
  
  return true
}

// 数式の前処理
function preprocessExpression(expression: string): string {
  let processed = expression
  
  // 数学関数を Math.func 形式に変換
  Object.keys(MATH_FUNCTIONS).forEach(func => {
    const regex = new RegExp(`\\b${func}\\b`, 'g')
    processed = processed.replace(regex, `Math.${func}`)
  })
  
  // 数学定数を値に変換
  Object.entries(MATH_CONSTANTS).forEach(([constant, value]) => {
    const regex = new RegExp(`\\b${constant}\\b`, 'g')
    processed = processed.replace(regex, value.toString())
  })
  
  // ** を Math.pow に変換
  processed = processed.replace(/\*\*/g, '^')
  
  // ^ を Math.pow に変換（簡易版）
  processed = processPowerOperator(processed)
  
  return processed
}

// べき乗演算子の処理
function processPowerOperator(expression: string): string {
  // x^2 のような単純なケース
  expression = expression.replace(/([a-zA-Z0-9\)]+)\s*\^\s*([0-9]+)/g, 'Math.pow($1, $2)')
  
  // より複雑なケース（括弧付き）
  expression = expression.replace(/([a-zA-Z0-9\)]+)\s*\^\s*\(([^)]+)\)/g, 'Math.pow($1, ($2))')
  
  return expression
}

// 安全な関数の作成
function createSafeFunction(expression: string, variables: { [key: string]: number }): () => number {
  const varNames = Object.keys(variables)
  const varValues = Object.values(variables)
  
  // Function constructorで関数を作成
  const funcBody = `
    'use strict';
    const Math = Object.freeze(Math);
    return ${expression};
  `
  
  try {
    const func = new Function(...varNames, funcBody)
    return () => func(...varValues)
  } catch (error) {
    throw new Error(`Failed to create function: ${error}`)
  }
}