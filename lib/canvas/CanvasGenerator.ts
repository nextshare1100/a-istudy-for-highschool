// lib/canvas/CanvasGenerator.ts

import { CanvasConfig, CanvasElement } from '@/types/canvas';

interface GenerateOptions {
  subject: string;
  topic: string;
  questionText: string;
  answer?: string | string[];
}

export class CanvasGenerator {
  static async generate(options: GenerateOptions): Promise<{ config: CanvasConfig } | null> {
    const { subject, topic, questionText } = options;
    
    // 数学の2次関数
    if (subject.includes('math') && topic.includes('2次関数')) {
      return this.generateQuadraticFunction(questionText);
    }
    
    // 数学のベクトル
    if (subject.includes('math') && topic.includes('ベクトル')) {
      return this.generateVectorDiagram(questionText);
    }
    
    // 物理の運動
    if (subject === 'physics' && topic.includes('運動')) {
      return this.generateMotionDiagram(questionText);
    }
    
    // 数学の図形
    if (subject.includes('math') && topic.includes('図形')) {
      return this.generateGeometry(questionText);
    }
    
    // デフォルト: 座標平面
    return this.generateCoordinatePlane();
  }

  private static generateQuadraticFunction(questionText: string): { config: CanvasConfig } {
    // 問題文から係数を抽出
    const coefficients = this.extractCoefficients(questionText);
    
    return {
      config: {
        type: 'coordinate',
        width: 600,
        height: 400,
        showGrid: true,
        showAxes: true,
        xRange: [-5, 5],
        yRange: [-5, 10],
        gridSpacing: 1,
        elements: [
          {
            id: 'grid-1',
            type: 'grid',
            spacing: 1,
            color: '#e0e0e0'
          },
          {
            id: 'axes-1',
            type: 'axes',
            showLabels: true,
            color: '#333333'
          },
          {
            id: 'function-1',
            type: 'function',
            expression: coefficients.expression || 'x^2 - 4*x + 3',
            domain: [-2, 6],
            color: '#3b82f6',
            lineWidth: 2
          },
          // 頂点を表示
          {
            id: 'vertex',
            type: 'point',
            x: coefficients.vertex?.x || 2,
            y: coefficients.vertex?.y || -1,
            color: '#ef4444',
            radius: 5,
            label: `頂点(${coefficients.vertex?.x || 2}, ${coefficients.vertex?.y || -1})`
          }
        ]
      }
    };
  }

  private static generateVectorDiagram(questionText: string): { config: CanvasConfig } {
    return {
      config: {
        type: 'coordinate',
        width: 600,
        height: 400,
        showGrid: true,
        showAxes: true,
        xRange: [-5, 5],
        yRange: [-5, 5],
        gridSpacing: 1,
        elements: [
          {
            id: 'grid-1',
            type: 'grid',
            spacing: 1,
            color: '#e0e0e0'
          },
          {
            id: 'axes-1',
            type: 'axes',
            showLabels: true,
            color: '#333333'
          },
          // ベクトルA
          {
            id: 'vector-a',
            type: 'line',
            x1: 0,
            y1: 0,
            x2: 3,
            y2: 2,
            color: '#3b82f6',
            lineWidth: 2,
            label: 'a'
          },
          // ベクトルB
          {
            id: 'vector-b',
            type: 'line',
            x1: 0,
            y1: 0,
            x2: -2,
            y2: 3,
            color: '#10b981',
            lineWidth: 2,
            label: 'b'
          }
        ]
      }
    };
  }

  private static generateMotionDiagram(questionText: string): { config: CanvasConfig } {
    return {
      config: {
        type: 'geometry',
        width: 600,
        height: 300,
        showGrid: false,
        showAxes: false,
        xRange: [0, 10],
        yRange: [0, 5],
        elements: [
          // 地面
          {
            id: 'ground',
            type: 'line',
            x1: 0,
            y1: 1,
            x2: 10,
            y2: 1,
            color: '#6b7280',
            lineWidth: 2
          },
          // 物体
          {
            id: 'object',
            type: 'circle',
            center: [2, 2],
            radius: 0.3,
            fill: true,
            color: '#3b82f6',
            fillOpacity: 0.8
          },
          // 速度ベクトル
          {
            id: 'velocity',
            type: 'line',
            x1: 2,
            y1: 2,
            x2: 4,
            y2: 2,
            color: '#ef4444',
            lineWidth: 2,
            label: 'v₀'
          },
          // 移動方向
          {
            id: 'motion-path',
            type: 'line',
            x1: 2,
            y1: 2,
            x2: 8,
            y2: 2,
            color: '#3b82f6',
            lineWidth: 1,
            dashed: true
          }
        ]
      }
    };
  }

  private static generateGeometry(questionText: string): { config: CanvasConfig } {
    // 三角形の例
    return {
      config: {
        type: 'geometry',
        width: 600,
        height: 400,
        showGrid: true,
        showAxes: false,
        xRange: [-5, 5],
        yRange: [-5, 5],
        gridSpacing: 1,
        elements: [
          {
            id: 'grid-1',
            type: 'grid',
            spacing: 1,
            color: '#f0f0f0'
          },
          // 三角形ABC
          {
            id: 'triangle',
            type: 'polygon',
            points: [[0, 0], [4, 0], [2, 3]],
            fill: false,
            color: '#3b82f6',
            lineWidth: 2
          },
          // 頂点ラベル
          {
            id: 'label-a',
            type: 'text',
            x: 0,
            y: -0.5,
            text: 'A',
            fontSize: 16
          },
          {
            id: 'label-b',
            type: 'text',
            x: 4,
            y: -0.5,
            text: 'B',
            fontSize: 16
          },
          {
            id: 'label-c',
            type: 'text',
            x: 2,
            y: 3.5,
            text: 'C',
            fontSize: 16
          }
        ]
      }
    };
  }

  private static generateCoordinatePlane(): { config: CanvasConfig } {
    return {
      config: {
        type: 'coordinate',
        width: 600,
        height: 400,
        showGrid: true,
        showAxes: true,
        xRange: [-10, 10],
        yRange: [-10, 10],
        gridSpacing: 1,
        elements: [
          {
            id: 'grid-1',
            type: 'grid',
            spacing: 1,
            color: '#e0e0e0'
          },
          {
            id: 'axes-1',
            type: 'axes',
            showLabels: true,
            color: '#333333'
          }
        ]
      }
    };
  }

  // ヘルパー関数
  private static extractCoefficients(questionText: string): {
    expression?: string;
    vertex?: { x: number; y: number };
  } {
    // f(x) = x² - 4x + 3 のようなパターンを検出
    const functionMatch = questionText.match(/f\(x\)\s*=\s*([^、。\n]+)/);
    if (functionMatch) {
      let expression = functionMatch[1].trim();
      // 数式を正規化
      expression = expression
        .replace(/²/g, '^2')
        .replace(/×/g, '*')
        .replace(/\s/g, '');
      
      // 頂点を計算（簡易版）
      const aMatch = expression.match(/(-?\d*)\*?x\^2/);
      const bMatch = expression.match(/([+-]?\d*)\*?x(?!\^)/);
      
      if (aMatch && bMatch) {
        const a = parseInt(aMatch[1] || '1');
        const b = parseInt(bMatch[1] || '0');
        const vertexX = -b / (2 * a);
        
        // 実際の y 値は expression を評価して計算する必要があるが、
        // ここでは簡易的に実装
        const vertexY = 0; // 実際には計算が必要
        
        return {
          expression,
          vertex: { x: vertexX, y: vertexY }
        };
      }
      
      return { expression };
    }
    
    return {};
  }
}