// components/canvas/canvas-types.ts

export interface Point {
  x: number;
  y: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export type DrawingTool = 
  | 'pen' 
  | 'line' 
  | 'circle' 
  | 'rectangle' 
  | 'arrow' 
  | 'text' 
  | 'eraser' 
  | 'select';

export type SubjectType = 
  | 'mathematics' 
  | 'physics' 
  | 'chemistry' 
  | 'general';

export interface DrawingElement {
  id: string;
  type: DrawingTool;
  points: Point[];
  color: string;
  strokeWidth: number;
  text?: string;
  fontSize?: number;
  selected?: boolean;
}

export interface GridSettings {
  enabled: boolean;
  size: number;
  snap: boolean;
  type: 'cartesian' | 'polar' | 'none';
}

export interface CanvasState {
  elements: DrawingElement[];
  currentTool: DrawingTool;
  currentColor: string;
  strokeWidth: number;
  gridSettings: GridSettings;
  zoom: number;
  pan: Point;
  history: DrawingElement[][];
  historyIndex: number;
}

export interface CanvasProps {
  width?: number;
  height?: number;
  initialData?: DrawingElement[];
  subjectType?: SubjectType;
  onSave?: (data: DrawingElement[]) => void;
  readOnly?: boolean;
  showGrid?: boolean;
  enableTouch?: boolean;
}

// 教科別の特殊要素
export interface MathElement extends DrawingElement {
  type: 'function' | 'coordinate' | 'angle' | 'vector';
  equation?: string;
  domain?: { min: number; max: number };
}

export interface PhysicsElement extends DrawingElement {
  type: 'force' | 'vector' | 'circuit' | 'wave';
  magnitude?: number;
  direction?: number;
  unit?: string;
}

export interface ChemistryElement extends DrawingElement {
  type: 'molecule' | 'bond' | 'reaction' | 'electron';
  atomicSymbol?: string;
  bondType?: 'single' | 'double' | 'triple';
}

export type SpecializedElement = MathElement | PhysicsElement | ChemistryElement;