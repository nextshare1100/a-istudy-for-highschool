// types/canvas.ts

// 基本的な型定義
export interface Point {
  x: number;
  y: number;
}

// 基本図形要素
export interface BaseElement {
  id: string;
  type: string;
  color?: string;
  lineWidth?: number;
  dashed?: boolean;
  label?: string;
}

// 各図形の型定義
export interface LineElement extends BaseElement {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface CircleElement extends BaseElement {
  type: 'circle';
  center: [number, number];
  radius: number;
  fill?: boolean;
  fillOpacity?: number;
}

export interface PointElement extends BaseElement {
  type: 'point';
  x: number;
  y: number;
  radius?: number;
}

export interface GridElement extends BaseElement {
  type: 'grid';
  spacing: number;
}

export interface AxesElement extends BaseElement {
  type: 'axes';
  showLabels?: boolean;
}

export interface FunctionElement extends BaseElement {
  type: 'function';
  expression: string;
  domain?: [number, number];
}

export interface PolygonElement extends BaseElement {
  type: 'polygon';
  points: [number, number][];
  fill?: boolean;
  fillOpacity?: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  align?: 'left' | 'center' | 'right';
  baseline?: 'top' | 'middle' | 'bottom';
}

// Canvas設定
export interface CanvasConfig {
  type: 'coordinate' | 'geometry';
  width: number;
  height: number;
  elements: CanvasElement[];
  showGrid: boolean;
  showAxes: boolean;
  xRange: [number, number];
  yRange: [number, number];
  gridSpacing?: number;
  interactive?: InteractiveConfig;
}

// インタラクティブ機能の設定
export interface InteractiveConfig {
  enabled: boolean;
  tools: DrawingTool[];
  snapToGrid: boolean;
  gridSnapping: number;
  showCoordinates: boolean;
  showAngles: boolean;
  showLengths: boolean;
  allowDelete: boolean;
  history: boolean;
}

// 作図ツール
export type DrawingTool = 'select' | 'line' | 'point' | 'circle' | 'perpendicular' | 'parallel';

// 作図状態
export interface DrawingState {
  isDrawing: boolean;
  tool: DrawingTool;
  startPoint: Point | null;
  currentPoint: Point | null;
  preview: CanvasElement | null;
  selectedElements: string[];
}

// 作図設定
export interface DrawingSettings {
  snapToGrid: boolean;
  showCoordinates: boolean;
  showAngles: boolean;
  showLengths: boolean;
}

// ユニオン型
export type CanvasElement = 
  | LineElement 
  | CircleElement 
  | PointElement 
  | GridElement 
  | AxesElement 
  | FunctionElement 
  | PolygonElement 
  | TextElement;

// 作図履歴
export interface HistoryEntry {
  action: 'add' | 'delete' | 'modify';
  elements: CanvasElement[];
  timestamp: number;
}

export interface CanvasHistory {
  past: HistoryEntry[];
  present: CanvasElement[];
  future: HistoryEntry[];
}

// 座標変換用の型
export interface CoordinateTransform {
  canvasToMath: (point: Point) => Point;
  mathToCanvas: (point: Point) => Point;
  scale: number;
  offset: Point;
}

// イベントハンドラーの型
export type CanvasEventHandler = (event: PointerEvent) => void;

export interface CanvasEventHandlers {
  onPointerDown: CanvasEventHandler;
  onPointerMove: CanvasEventHandler;
  onPointerUp: CanvasEventHandler;
  onPointerCancel: CanvasEventHandler;
  onWheel: (event: WheelEvent) => void;
}

// 作図結果の型
export interface DrawnShape {
  element: CanvasElement;
  timestamp: number;
  tool: DrawingTool;
}

// ユーティリティ関数の型
export interface CanvasUtils {
  generateId: () => string;
  snapToGrid: (value: number, gridSize: number) => number;
  distance: (p1: Point, p2: Point) => number;
  angle: (p1: Point, p2: Point) => number;
  midpoint: (p1: Point, p2: Point) => Point;
}