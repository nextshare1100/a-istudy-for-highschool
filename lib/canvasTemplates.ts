// Canvas図形テンプレート集

export interface CanvasTemplate {
  type: 'function' | 'geometry' | 'vector' | 'statistics' | 'coordinate'
  name: string
  description: string
  data: any
  defaultWidth?: number
  defaultHeight?: number
  interactive?: boolean
}

// 科目・トピックに基づいて適切なキャンバステンプレートを判定
export function getRecommendedCanvas(subject: string, unit: string, topic: string): CanvasTemplate | null {
  // 数学系
  if (subject.includes('数学')) {
    if (unit.includes('二次関数') || topic.includes('グラフ')) {
      return FUNCTION_TEMPLATES.quadratic
    }
    if (unit.includes('三角関数')) {
      return FUNCTION_TEMPLATES.trigonometric
    }
    if (unit.includes('図形') || unit.includes('幾何')) {
      return GEOMETRY_TEMPLATES.triangle
    }
    if (unit.includes('ベクトル')) {
      return VECTOR_TEMPLATES.basic2D
    }
    if (unit.includes('データ') || unit.includes('統計')) {
      return STATISTICS_TEMPLATES.histogram
    }
  }
  
  // 物理系
  if (subject.includes('物理')) {
    if (unit.includes('力学') || topic.includes('ベクトル')) {
      return VECTOR_TEMPLATES.force
    }
    if (unit.includes('波') || topic.includes('波')) {
      return FUNCTION_TEMPLATES.wave
    }
  }
  
  // デフォルトは座標系
  if (['数学', '物理'].some(s => subject.includes(s))) {
    return COORDINATE_TEMPLATES.standard
  }
  
  return null
}

// 関数グラフテンプレート
export const FUNCTION_TEMPLATES: { [key: string]: CanvasTemplate } = {
  quadratic: {
    type: 'function',
    name: '二次関数',
    description: '放物線のグラフ',
    data: {
      expression: 'x * x - 2 * x - 3',
      domain: [-5, 5],
      color: '#2563eb',
      showGrid: true
    },
    interactive: true
  },
  
  cubic: {
    type: 'function',
    name: '三次関数',
    description: '三次曲線のグラフ',
    data: {
      expression: 'x * x * x - 3 * x',
      domain: [-3, 3],
      color: '#7c3aed',
      showGrid: true
    },
    interactive: true
  },
  
  trigonometric: {
    type: 'function',
    name: '三角関数',
    description: '正弦波・余弦波',
    data: {
      expression: 'Math.sin(x)',
      domain: [-2 * Math.PI, 2 * Math.PI],
      color: '#dc2626',
      showGrid: true
    },
    interactive: true
  },
  
  exponential: {
    type: 'function',
    name: '指数関数',
    description: '指数的増加・減少',
    data: {
      expression: 'Math.exp(x)',
      domain: [-3, 3],
      color: '#059669',
      showGrid: true
    },
    interactive: true
  },
  
  logarithmic: {
    type: 'function',
    name: '対数関数',
    description: '対数曲線',
    data: {
      expression: 'Math.log(x)',
      domain: [0.1, 10],
      color: '#ea580c',
      showGrid: true
    },
    interactive: true
  },
  
  wave: {
    type: 'function',
    name: '波動',
    description: '物理の波動',
    data: {
      expression: '2 * Math.sin(2 * x) * Math.cos(0.5 * x)',
      domain: [-4 * Math.PI, 4 * Math.PI],
      color: '#0891b2',
      showGrid: true
    },
    defaultWidth: 800,
    interactive: true
  }
}

// 幾何図形テンプレート
export const GEOMETRY_TEMPLATES: { [key: string]: CanvasTemplate } = {
  triangle: {
    type: 'geometry',
    name: '三角形',
    description: '基本的な三角形',
    data: {
      shape: 'triangle',
      vertices: [[0, 0], [4, 0], [2, 3]]
    },
    interactive: true
  },
  
  rightTriangle: {
    type: 'geometry',
    name: '直角三角形',
    description: '直角を含む三角形',
    data: {
      shape: 'triangle',
      vertices: [[0, 0], [3, 0], [0, 4]],
      showAngles: true
    },
    interactive: true
  },
  
  circle: {
    type: 'geometry',
    name: '円',
    description: '中心と半径を持つ円',
    data: {
      shape: 'circle',
      center: [0, 0],
      radius: 3
    },
    interactive: true
  },
  
  polygon: {
    type: 'geometry',
    name: '多角形',
    description: '正多角形',
    data: {
      shape: 'polygon',
      vertices: [[2, 0], [1, 1.73], [-1, 1.73], [-2, 0], [-1, -1.73], [1, -1.73]]
    },
    interactive: true
  },
  
  composite: {
    type: 'geometry',
    name: '複合図形',
    description: '複数の図形の組み合わせ',
    data: {
      shapes: [
        { shape: 'circle', center: [0, 0], radius: 2 },
        { shape: 'triangle', vertices: [[0, 2], [-1.73, -1], [1.73, -1]] }
      ]
    },
    interactive: true
  }
}

// ベクトル図テンプレート
export const VECTOR_TEMPLATES: { [key: string]: CanvasTemplate } = {
  basic2D: {
    type: 'vector',
    name: '2Dベクトル',
    description: '基本的な平面ベクトル',
    data: {
      vectors: [
        { end: [3, 2], color: '#2563eb', label: 'a' },
        { end: [1, 3], color: '#dc2626', label: 'b' }
      ],
      showGrid: true
    },
    interactive: true
  },
  
  vectorAddition: {
    type: 'vector',
    name: 'ベクトルの和',
    description: 'ベクトルの加法',
    data: {
      vectors: [
        { end: [3, 1], color: '#2563eb', label: 'a' },
        { start: [3, 1], end: [4, 4], color: '#dc2626', label: 'b' },
        { end: [4, 4], color: '#059669', label: 'a+b', style: 'dashed' }
      ],
      showGrid: true
    },
    interactive: true
  },
  
  force: {
    type: 'vector',
    name: '力のベクトル',
    description: '物理の力の図示',
    data: {
      vectors: [
        { start: [0, 0], end: [3, 0], color: '#dc2626', label: 'F1' },
        { start: [0, 0], end: [0, 2], color: '#2563eb', label: 'F2' },
        { start: [0, 0], end: [3, 2], color: '#059669', label: 'F', style: 'thick' }
      ],
      showGrid: false,
      showAxes: true
    },
    interactive: true
  },
  
  velocity: {
    type: 'vector',
    name: '速度ベクトル',
    description: '運動の速度表示',
    data: {
      vectors: [
        { start: [-2, 0], end: [0, 0], color: '#64748b', label: 'v0' },
        { start: [0, 0], end: [3, 1], color: '#2563eb', label: 'v' },
        { start: [0, 0], end: [3, -1], color: '#dc2626', label: 'a', style: 'dashed' }
      ],
      showGrid: true,
      trajectory: true
    },
    interactive: true
  }
}

// 統計グラフテンプレート
export const STATISTICS_TEMPLATES: { [key: string]: CanvasTemplate } = {
  histogram: {
    type: 'statistics',
    name: 'ヒストグラム',
    description: '度数分布',
    data: {
      type: 'histogram',
      values: [5, 8, 12, 15, 10, 6, 3],
      labels: ['0-10', '10-20', '20-30', '30-40', '40-50', '50-60', '60-70'],
      color: '#3b82f6'
    },
    defaultWidth: 600,
    defaultHeight: 400
  },
  
  scatter: {
    type: 'statistics',
    name: '散布図',
    description: '相関関係の可視化',
    data: {
      type: 'scatter',
      values: [
        [1, 2], [2, 3], [3, 3.5], [4, 4.2], [5, 5.1],
        [1.5, 2.8], [2.5, 3.2], [3.5, 4], [4.5, 4.8]
      ],
      showTrendLine: true
    },
    interactive: true
  },
  
  boxplot: {
    type: 'statistics',
    name: '箱ひげ図',
    description: 'データの分布',
    data: {
      type: 'boxplot',
      datasets: [
        { name: 'A組', values: [50, 55, 60, 65, 70, 75, 80, 85, 90] },
        { name: 'B組', values: [45, 52, 58, 62, 68, 72, 78, 82, 88] }
      ]
    },
    defaultWidth: 600,
    defaultHeight: 400
  }
}

// 座標系テンプレート
export const COORDINATE_TEMPLATES: { [key: string]: CanvasTemplate } = {
  standard: {
    type: 'coordinate',
    name: '標準座標系',
    description: '基本的なxy座標',
    data: {
      showGrid: true,
      showLabels: true,
      range: [-10, 10]
    },
    interactive: true
  },
  
  polar: {
    type: 'coordinate',
    name: '極座標系',
    description: '極座標表示',
    data: {
      type: 'polar',
      showGrid: true,
      showLabels: true,
      maxRadius: 5
    },
    interactive: true
  },
  
  logarithmic: {
    type: 'coordinate',
    name: '対数座標',
    description: '対数スケール',
    data: {
      type: 'log',
      showGrid: true,
      showLabels: true,
      base: 10
    },
    interactive: true
  }
}

// すべてのテンプレートを取得
export function getAllTemplates(): CanvasTemplate[] {
  return [
    ...Object.values(FUNCTION_TEMPLATES),
    ...Object.values(GEOMETRY_TEMPLATES),
    ...Object.values(VECTOR_TEMPLATES),
    ...Object.values(STATISTICS_TEMPLATES),
    ...Object.values(COORDINATE_TEMPLATES)
  ]
}

// カテゴリ別にテンプレートを取得
export function getTemplatesByCategory(): { [category: string]: CanvasTemplate[] } {
  return {
    '関数グラフ': Object.values(FUNCTION_TEMPLATES),
    '幾何図形': Object.values(GEOMETRY_TEMPLATES),
    'ベクトル': Object.values(VECTOR_TEMPLATES),
    '統計': Object.values(STATISTICS_TEMPLATES),
    '座標系': Object.values(COORDINATE_TEMPLATES)
  }
}