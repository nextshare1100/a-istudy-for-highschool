// 安全な数式評価のためのパーサー

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
  'LN2': Math.LN2,
  'LN10': Math.LN10,
  'LOG2E': Math.LOG2E,
  'LOG10E': Math.LOG10E,
  'SQRT1_2': Math.SQRT1_2,
  'SQRT2': Math.SQRT2,
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
    /\[.*\]/,  // 配列アクセス
    /\{.*\}/,  // オブジェクトリテラル
    /`/,       // テンプレートリテラル
    /\$/,      // テンプレート構文
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(expression)) {
      return false
    }
  }
  
  // 許可された文字のみ使用されているかチェック
  const allowedChars = /^[0-9a-zA-Z\s\+\-\*\/\^\(\)\.\,]+$/
  return allowedChars.test(expression)
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
  
  // ^ を Math.pow に変換
  processed = processPowerOperator(processed)
  
  return processed
}

// べき乗演算子の処理
function processPowerOperator(expression: string): string {
  // 簡単な実装（より複雑な場合は適切なパーサーが必要）
  return expression.replace(/([0-9a-zA-Z\)]+)\s*\^\s*([0-9a-zA-Z\(]+)/g, 'Math.pow($1, $2)')
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

// 複数の変数で関数を評価
export function evaluateWithMultipleVariables(
  expression: string,
  variableRanges: { [key: string]: { min: number; max: number; step: number } }
): { [key: string]: number[] } {
  const results: { [key: string]: number[] } = {}
  
  // 各変数の値を生成
  const variableValues: { [key: string]: number[] } = {}
  for (const [varName, range] of Object.entries(variableRanges)) {
    variableValues[varName] = []
    for (let value = range.min; value <= range.max; value += range.step) {
      variableValues[varName].push(value)
    }
  }
  
  // すべての組み合わせで評価
  const varNames = Object.keys(variableRanges)
  if (varNames.length === 1) {
    // 単一変数の場合
    const varName = varNames[0]
    results[varName] = variableValues[varName]
    results['y'] = variableValues[varName].map(value => 
      evaluateExpression(expression, { [varName]: value })
    )
  } else {
    // 複数変数の場合（2変数まで対応）
    // TODO: より複雑な多変数関数の実装
  }
  
  return results
}

// LaTeX形式の数式を通常の数式に変換
export function convertLatexToExpression(latex: string): string {
  let expression = latex
  
  // 基本的な変換
  const conversions = [
    { from: /\\frac\{([^}]+)\}\{([^}]+)\}/g, to: '($1)/($2)' },
    { from: /\\sqrt\{([^}]+)\}/g, to: 'sqrt($1)' },
    { from: /\\sin/g, to: 'sin' },
    { from: /\\cos/g, to: 'cos' },
    { from: /\\tan/g, to: 'tan' },
    { from: /\\log/g, to: 'log' },
    { from: /\\ln/g, to: 'log' },
    { from: /\\pi/g, to: 'PI' },
    { from: /\\theta/g, to: 'theta' },
    { from: /\\alpha/g, to: 'alpha' },
    { from: /\\beta/g, to: 'beta' },
    { from: /\\gamma/g, to: 'gamma' },
    { from: /\\times/g, to: '*' },
    { from: /\\cdot/g, to: '*' },
    { from: /\\div/g, to: '/' },
  ]
  
  conversions.forEach(({ from, to }) => {
    expression = expression.replace(from, to)
  })
  
  return expression
}

// 数式の簡略化
export function simplifyExpression(expression: string): string {
  // 基本的な簡略化ルール
  let simplified = expression
  
  // 余分な括弧の削除
  simplified = simplified.replace(/\(\(([^)]+)\)\)/g, '($1)')
  
  // 1 * x -> x
  simplified = simplified.replace(/1\s*\*\s*([a-zA-Z])/g, '$1')
  
  // x * 1 -> x
  simplified = simplified.replace(/([a-zA-Z])\s*\*\s*1/g, '$1')
  
  // 0 + x -> x
  simplified = simplified.replace(/0\s*\+\s*/g, '')
  
  // x + 0 -> x
  simplified = simplified.replace(/\s*\+\s*0/g, '')
  
  return simplified
}

// デバッグ用：数式の解析結果を表示
export function debugExpression(expression: string): {
  original: string
  preprocessed: string
  variables: string[]
  functions: string[]
  constants: string[]
} {
  const preprocessed = preprocessExpression(expression)
  
  // 変数の抽出
  const variables = Array.from(new Set(
    expression.match(/\b[a-z]\b/g) || []
  ))
  
  // 関数の抽出
  const functions = Object.keys(MATH_FUNCTIONS).filter(func => 
    expression.includes(func)
  )
  
  // 定数の抽出
  const constants = Object.keys(MATH_CONSTANTS).filter(constant => 
    expression.includes(constant)
  )
  
  return {
    original: expression,
    preprocessed,
    variables,
    functions,
    constants
  }
}