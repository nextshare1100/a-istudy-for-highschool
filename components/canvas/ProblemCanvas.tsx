'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { evaluateExpression as evaluateExpressionSafe } from '@/lib/canvas/expression-evaluator';

interface CanvasElement {
  type: string;
  [key: string]: any;
}

interface CanvasConfig {
  type: string;
  elements: CanvasElement[];
  width?: number;
  height?: number;
  showGrid?: boolean;
  showAxes?: boolean;
  xRange?: [number, number];
  yRange?: [number, number];
  backgroundColor?: string;
  padding?: number;
  gridSpacing?: number;
}

interface ProblemCanvasProps {
  canvasData: {
    config: CanvasConfig;
  };
  width?: number;
  height?: number;
}

// CircleDot アイコンコンポーネント
const CircleDot: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);

export default function ProblemCanvas({ canvasData, width = 600, height = 400 }: ProblemCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Canvas configuration
  const config = useMemo(() => {
    if (!canvasData?.config) {
      console.warn('No canvas config provided');
      return null;
    }
    
    console.log('Canvas config received:', canvasData.config);
    
    return {
      ...canvasData.config,
      width: canvasData.config.width || width,
      height: canvasData.config.height || height,
      padding: canvasData.config.padding || 40,
      xRange: canvasData.config.xRange || [-10, 10],
      yRange: canvasData.config.yRange || [-10, 10],
    };
  }, [canvasData, width, height]);

  // Coordinate transformation functions
  const coordinateSystem = useMemo(() => {
    if (!config) return null;

    const { width, height, padding, xRange, yRange } = config;
    const drawWidth = width - 2 * padding;
    const drawHeight = height - 2 * padding;
    
    const scaleX = drawWidth / (xRange[1] - xRange[0]);
    const scaleY = drawHeight / (yRange[1] - yRange[0]);
    
    return {
      toCanvasX: (x: number) => padding + (x - xRange[0]) * scaleX,
      toCanvasY: (y: number) => height - padding - (y - yRange[0]) * scaleY,
      toMathX: (canvasX: number) => xRange[0] + (canvasX - padding) / scaleX,
      toMathY: (canvasY: number) => yRange[0] + (height - padding - canvasY) / scaleY,
      scaleX,
      scaleY,
      drawWidth,
      drawHeight,
      padding
    };
  }, [config]);

  // Draw grid
  const drawGrid = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    if (!config || !coordinateSystem) return;
    
    const { xRange, yRange } = config;
    const { toCanvasX, toCanvasY, drawWidth, drawHeight, padding } = coordinateSystem;
    
    ctx.save();
    ctx.strokeStyle = element.color || '#e0e0e0';
    ctx.lineWidth = element.lineWidth || 0.5;
    
    const spacing = element.spacing || config.gridSpacing || 1;
    
    // Calculate nice step sizes
    const xStep = getNiceStep(xRange[1] - xRange[0], spacing);
    const yStep = getNiceStep(yRange[1] - yRange[0], spacing);
    
    // Vertical grid lines
    for (let x = Math.ceil(xRange[0] / xStep) * xStep; x <= xRange[1]; x += xStep) {
      if (Math.abs(x) < 0.0001) continue; // Skip axis
      const canvasX = toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(canvasX, padding);
      ctx.lineTo(canvasX, padding + drawHeight);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let y = Math.ceil(yRange[0] / yStep) * yStep; y <= yRange[1]; y += yStep) {
      if (Math.abs(y) < 0.0001) continue; // Skip axis
      const canvasY = toCanvasY(y);
      ctx.beginPath();
      ctx.moveTo(padding, canvasY);
      ctx.lineTo(padding + drawWidth, canvasY);
      ctx.stroke();
    }
    
    ctx.restore();
  };

  // Draw axes
  const drawAxes = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    if (!config || !coordinateSystem) return;
    
    const { xRange, yRange, width, height } = config;
    const { toCanvasX, toCanvasY, padding, drawWidth, drawHeight } = coordinateSystem;
    
    ctx.save();
    ctx.strokeStyle = element.color || '#333333';
    ctx.lineWidth = element.lineWidth || 2;
    
    // X-axis
    const y0 = toCanvasY(0);
    if (y0 >= padding && y0 <= height - padding) {
      ctx.beginPath();
      ctx.moveTo(padding, y0);
      ctx.lineTo(width - padding, y0);
      ctx.stroke();
      
      // Arrow
      drawArrow(ctx, width - padding - 10, y0, width - padding, y0);
    }
    
    // Y-axis
    const x0 = toCanvasX(0);
    if (x0 >= padding && x0 <= width - padding) {
      ctx.beginPath();
      ctx.moveTo(x0, padding);
      ctx.lineTo(x0, height - padding);
      ctx.stroke();
      
      // Arrow
      drawArrow(ctx, x0, padding + 10, x0, padding);
    }
    
    // Labels and ticks
    if (element.showLabels !== false) {
      ctx.fillStyle = element.color || '#333333';
      ctx.font = '12px Arial';
      
      // X-axis labels
      const xStep = getNiceStep(xRange[1] - xRange[0], 1);
      for (let x = Math.ceil(xRange[0] / xStep) * xStep; x <= xRange[1]; x += xStep) {
        if (Math.abs(x) < 0.0001) continue;
        const canvasX = toCanvasX(x);
        
        // Tick
        ctx.beginPath();
        ctx.moveTo(canvasX, y0 - 3);
        ctx.lineTo(canvasX, y0 + 3);
        ctx.stroke();
        
        // Label
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(formatNumber(x), canvasX, y0 + 5);
      }
      
      // Y-axis labels
      const yStep = getNiceStep(yRange[1] - yRange[0], 1);
      for (let y = Math.ceil(yRange[0] / yStep) * yStep; y <= yRange[1]; y += yStep) {
        if (Math.abs(y) < 0.0001) continue;
        const canvasY = toCanvasY(y);
        
        // Tick
        ctx.beginPath();
        ctx.moveTo(x0 - 3, canvasY);
        ctx.lineTo(x0 + 3, canvasY);
        ctx.stroke();
        
        // Label
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(formatNumber(y), x0 - 8, canvasY);
      }
      
      // Axis labels
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      if (element.xLabel) {
        ctx.fillText(element.xLabel, width / 2, height - 20);
      }
      
      if (element.yLabel) {
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(element.yLabel, 0, 0);
        ctx.restore();
      }
    }
    
    ctx.restore();
  };

  // Draw function
  const drawFunction = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    if (!config || !coordinateSystem || !element.expression) return;
    
    const { xRange } = config;
    const { toCanvasX, toCanvasY, padding, drawWidth } = coordinateSystem;
    
    ctx.save();
    ctx.strokeStyle = element.color || '#2563eb';
    ctx.lineWidth = element.lineWidth || 2;
    
    const domain = element.domain || xRange;
    const steps = Math.max(500, drawWidth);
    const dx = (domain[1] - domain[0]) / steps;
    
    ctx.beginPath();
    let started = false;
    let lastValid = false;
    
    for (let i = 0; i <= steps; i++) {
      const x = domain[0] + i * dx;
      
      try {
        // 本番環境対応の数式評価
        const y = evaluateExpressionSafe(element.expression, { x });
        
        if (!isNaN(y) && isFinite(y)) {
          const canvasX = toCanvasX(x);
          const canvasY = toCanvasY(y);
          
          // Check if point is within drawable area
          if (canvasX >= padding && canvasX <= config.width - padding &&
              canvasY >= padding && canvasY <= config.height - padding) {
            
            if (!started || !lastValid) {
              ctx.moveTo(canvasX, canvasY);
              started = true;
            } else {
              ctx.lineTo(canvasX, canvasY);
            }
            lastValid = true;
          } else {
            lastValid = false;
          }
        } else {
          lastValid = false;
        }
      } catch (e) {
        console.error('Function evaluation error:', e);
        lastValid = false;
      }
    }
    
    ctx.stroke();
    
    // Draw label
    if (element.label) {
      drawLabel(ctx, element.label, element.color || '#2563eb', config.width - 150, 30 + (element.labelOffset || 0));
    }
    
    ctx.restore();
  };

  // Draw circle
  const drawCircle = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    if (!coordinateSystem || !element.center || element.radius === undefined) return;
    
    const { toCanvasX, toCanvasY, scaleX, scaleY } = coordinateSystem;
    
    ctx.save();
    ctx.strokeStyle = element.color || '#dc2626';
    ctx.lineWidth = element.lineWidth || 2;
    
    const centerX = toCanvasX(element.center[0]);
    const centerY = toCanvasY(element.center[1]);
    const radiusX = Math.abs(element.radius * scaleX);
    const radiusY = Math.abs(element.radius * scaleY);
    
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    
    if (element.fill) {
      ctx.fillStyle = element.color || '#dc2626';
      ctx.globalAlpha = element.fillOpacity || element.opacity || 0.3;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    
    ctx.stroke();
    
    // Draw center point if specified
    if (element.showCenter) {
      drawPoint(ctx, {
        x: element.center[0],
        y: element.center[1],
        color: element.color,
        radius: 3
      });
    }
    
    ctx.restore();
  };

  // Draw point
  const drawPoint = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    if (!coordinateSystem || element.x === undefined || element.y === undefined) return;
    
    const { toCanvasX, toCanvasY } = coordinateSystem;
    
    ctx.save();
    ctx.fillStyle = element.color || '#dc2626';
    
    const canvasX = toCanvasX(element.x);
    const canvasY = toCanvasY(element.y);
    const radius = element.radius || 4;
    
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw label
    if (element.label) {
      ctx.font = element.fontSize ? `${element.fontSize}px Arial` : '12px Arial';
      ctx.textAlign = element.labelAlign || 'left';
      ctx.textBaseline = element.labelBaseline || 'bottom';
      
      const labelX = canvasX + (element.labelOffsetX || radius + 5);
      const labelY = canvasY + (element.labelOffsetY || -radius);
      
      ctx.fillText(element.label, labelX, labelY);
    }
    
    ctx.restore();
  };

  // Draw line
  const drawLine = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    if (!coordinateSystem) return;
    
    // 旧形式と新形式の両方に対応
    const start = element.start || (element.x1 !== undefined && element.y1 !== undefined ? [element.x1, element.y1] : null);
    const end = element.end || (element.x2 !== undefined && element.y2 !== undefined ? [element.x2, element.y2] : null);
    
    if (!start || !end) return;
    
    const { toCanvasX, toCanvasY } = coordinateSystem;
    
    ctx.save();
    ctx.strokeStyle = element.color || '#333333';
    ctx.lineWidth = element.lineWidth || 1;
    
    if (element.dashed) {
      ctx.setLineDash(element.dashPattern || [5, 5]);
    }
    
    ctx.beginPath();
    ctx.moveTo(toCanvasX(start[0]), toCanvasY(start[1]));
    ctx.lineTo(toCanvasX(end[0]), toCanvasY(end[1]));
    ctx.stroke();
    
    // Draw arrow if specified
    if (element.arrow) {
      const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
      drawArrow(
        ctx,
        toCanvasX(end[0]) - 10 * Math.cos(angle),
        toCanvasY(end[1]) + 10 * Math.sin(angle),
        toCanvasX(end[0]),
        toCanvasY(end[1])
      );
    }
    
    ctx.restore();
  };

  // Draw vector
  const drawVector = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    if (!coordinateSystem || !element.from || !element.to) return;
    
    const { toCanvasX, toCanvasY } = coordinateSystem;
    
    ctx.save();
    ctx.strokeStyle = element.color || '#8b5cf6';
    ctx.lineWidth = element.lineWidth || 2;
    
    const fromX = toCanvasX(element.from[0]);
    const fromY = toCanvasY(element.from[1]);
    const toX = toCanvasX(element.to[0]);
    const toY = toCanvasY(element.to[1]);
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    // Draw arrow
    drawArrow(ctx, fromX + (toX - fromX) * 0.9, fromY + (toY - fromY) * 0.9, toX, toY);
    
    // Draw label
    if (element.label) {
      ctx.fillStyle = element.color || '#8b5cf6';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      
      const midX = (fromX + toX) / 2;
      const midY = (fromY + toY) / 2;
      const offset = 15;
      const angle = Math.atan2(toY - fromY, toX - fromX);
      
      ctx.fillText(
        element.label,
        midX - offset * Math.sin(angle),
        midY + offset * Math.cos(angle)
      );
    }
    
    ctx.restore();
  };

  // Draw polygon
  const drawPolygon = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    if (!coordinateSystem || !element.points || element.points.length < 3) return;
    
    const { toCanvasX, toCanvasY } = coordinateSystem;
    
    ctx.save();
    ctx.strokeStyle = element.color || '#10b981';
    ctx.lineWidth = element.lineWidth || 2;
    
    ctx.beginPath();
    element.points.forEach((point: [number, number], index: number) => {
      const x = toCanvasX(point[0]);
      const y = toCanvasY(point[1]);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    
    if (element.fill) {
      ctx.fillStyle = element.color || '#10b981';
      ctx.globalAlpha = element.fillOpacity || element.opacity || 0.3;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    
    ctx.stroke();
    ctx.restore();
  };

  // Draw text
  const drawText = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    if (!coordinateSystem || element.x === undefined || element.y === undefined || !element.text) return;
    
    const { toCanvasX, toCanvasY } = coordinateSystem;
    
    ctx.save();
    ctx.fillStyle = element.color || '#000000';
    ctx.font = `${element.fontSize || 14}px ${element.fontFamily || 'Arial'}`;
    ctx.textAlign = element.align || 'center';
    ctx.textBaseline = element.baseline || 'middle';
    
    const x = toCanvasX(element.x);
    const y = toCanvasY(element.y);
    
    ctx.fillText(element.text, x, y);
    ctx.restore();
  };

  // Draw ellipse
  const drawEllipse = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    if (!coordinateSystem || !element.center || !element.a || !element.b) return;
    
    const { toCanvasX, toCanvasY, scaleX, scaleY } = coordinateSystem;
    
    ctx.save();
    ctx.strokeStyle = element.color || '#2563eb';
    ctx.lineWidth = element.lineWidth || 2;
    
    const centerX = toCanvasX(element.center[0]);
    const centerY = toCanvasY(element.center[1]);
    const a = Math.abs(element.a * scaleX);
    const b = Math.abs(element.b * scaleY);
    const rotation = element.rotation || 0;
    
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, a, b, rotation, 0, 2 * Math.PI);
    
    if (element.fill) {
      ctx.fillStyle = element.color || '#2563eb';
      ctx.globalAlpha = element.opacity || 0.3;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    
    ctx.stroke();
    ctx.restore();
  };

  // Draw parabola
  const drawParabola = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    if (!coordinateSystem || !element.vertex) return;
    
    const orientation = element.orientation || 'vertical';
    const p = element.p || 1;
    const vertex = element.vertex;
    
    let expression;
    if (orientation === 'vertical') {
      expression = `(1/(4*${p}))*(x-${vertex[0]})**2+${vertex[1]}`;
    } else {
      expression = `(1/(4*${p}))*(y-${vertex[1]})**2+${vertex[0]}`;
    }
    
    drawFunction(ctx, {
      ...element,
      expression,
      type: 'function'
    });
  };

  // Draw hyperbola
  const drawHyperbola = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    if (!coordinateSystem || !element.center || !element.a || !element.b) return;
    
    const { xRange } = config!;
    const center = element.center;
    const a = element.a;
    const b = element.b;
    
    // Draw both branches
    const expressions = [
      `${center[1]}+${b}*Math.sqrt(((x-${center[0]})/${a})**2-1)`,
      `${center[1]}-${b}*Math.sqrt(((x-${center[0]})/${a})**2-1)`
    ];
    
    expressions.forEach((expr, i) => {
      drawFunction(ctx, {
        ...element,
        expression: expr,
        domain: [center[0] + a, xRange[1]],
        type: 'function',
        label: i === 0 ? element.label : undefined
      });
      
      drawFunction(ctx, {
        ...element,
        expression: expr,
        domain: [xRange[0], center[0] - a],
        type: 'function',
        label: undefined
      });
    });
  };

  // Draw parametric curve
  const drawParametric = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    if (!coordinateSystem || !element.xExpression || !element.yExpression) return;
    
    const { toCanvasX, toCanvasY } = coordinateSystem;
    
    ctx.save();
    ctx.strokeStyle = element.color || '#2563eb';
    ctx.lineWidth = element.lineWidth || 2;
    
    const tRange = element.tRange || [0, 2 * Math.PI];
    const steps = 500;
    const dt = (tRange[1] - tRange[0]) / steps;
    
    ctx.beginPath();
    let started = false;
    
    for (let i = 0; i <= steps; i++) {
      const t = tRange[0] + i * dt;
      
      try {
        const x = evaluateExpressionSafe(element.xExpression, { t });
        const y = evaluateExpressionSafe(element.yExpression, { t });
        
        if (!isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
          const canvasX = toCanvasX(x);
          const canvasY = toCanvasY(y);
          
          if (!started) {
            ctx.moveTo(canvasX, canvasY);
            started = true;
          } else {
            ctx.lineTo(canvasX, canvasY);
          }
        }
      } catch (e) {
        // Skip invalid points
      }
    }
    
    ctx.stroke();
    ctx.restore();
  };

  // Draw polar function
  const drawPolarFunction = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    if (!coordinateSystem || !element.expression) return;
    
    const { toCanvasX, toCanvasY } = coordinateSystem;
    
    ctx.save();
    ctx.strokeStyle = element.color || '#2563eb';
    ctx.lineWidth = element.lineWidth || 2;
    
    const thetaRange = element.thetaRange || [0, 2 * Math.PI];
    const steps = 500;
    const dtheta = (thetaRange[1] - thetaRange[0]) / steps;
    
    ctx.beginPath();
    let started = false;
    
    for (let i = 0; i <= steps; i++) {
      const theta = thetaRange[0] + i * dtheta;
      
      try {
        const r = evaluateExpressionSafe(element.expression, { theta });
        
        if (!isNaN(r) && isFinite(r)) {
          const x = r * Math.cos(theta);
          const y = r * Math.sin(theta);
          const canvasX = toCanvasX(x);
          const canvasY = toCanvasY(y);
          
          if (!started) {
            ctx.moveTo(canvasX, canvasY);
            started = true;
          } else {
            ctx.lineTo(canvasX, canvasY);
          }
        }
      } catch (e) {
        // Skip invalid points
      }
    }
    
    ctx.stroke();
    ctx.restore();
  };

  // Helper functions
  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const arrowLength = 10;
    const arrowAngle = Math.PI / 6;
    
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - arrowLength * Math.cos(angle - arrowAngle),
      toY - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - arrowLength * Math.cos(angle + arrowAngle),
      toY - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.stroke();
  };

  const drawLabel = (ctx: CanvasRenderingContext2D, text: string, color: string, x: number, y: number) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Background
    const metrics = ctx.measureText(text);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillRect(x - 5, y - 5, metrics.width + 10, 20);
    
    // Text
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  const getNiceStep = (range: number, baseStep: number): number => {
    const magnitude = Math.pow(10, Math.floor(Math.log10(range)));
    const normalized = range / magnitude;
    
    let step;
    if (normalized <= 1) step = 0.1;
    else if (normalized <= 2) step = 0.2;
    else if (normalized <= 5) step = 0.5;
    else step = 1;
    
    return step * magnitude * baseStep;
  };

  const formatNumber = (num: number): string => {
    if (Math.abs(num) < 0.0001) return '0';
    if (Math.abs(num) >= 1000) return num.toExponential(1);
    if (Math.abs(num) < 0.01) return num.toExponential(1);
    return num.toPrecision(3).replace(/\.?0+$/, '');
  };

  // Main drawing function
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !config || !coordinateSystem) {
      console.log('Canvas setup check:', { 
        canvas: !!canvas, 
        config: !!config, 
        coordinateSystem: !!coordinateSystem 
      });
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context');
      return;
    }

    console.log('Starting to draw canvas with config:', config);

    // Set canvas size
    canvas.width = config.width;
    canvas.height = config.height;

    // Clear canvas
    ctx.fillStyle = config.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, config.width, config.height);

    // Set default styles
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Always draw grid and axes first if not explicitly disabled
    let hasGrid = false;
    let hasAxes = false;

    // Check if grid and axes are in elements
    if (config.elements && Array.isArray(config.elements)) {
      hasGrid = config.elements.some(el => el.type === 'grid');
      hasAxes = config.elements.some(el => el.type === 'axes');
    }

    // Draw default grid and axes if not present in elements
    if (!hasGrid && config.showGrid !== false) {
      console.log('Drawing default grid');
      drawGrid(ctx, { type: 'grid' });
    }
    
    if (!hasAxes && config.showAxes !== false) {
      console.log('Drawing default axes');
      drawAxes(ctx, { type: 'axes', showLabels: true });
    }

    // Draw elements in order
    if (config.elements && Array.isArray(config.elements)) {
      console.log(`Drawing ${config.elements.length} elements`);
      
      config.elements.forEach((element, index) => {
        console.log(`Drawing element ${index}:`, element.type, element);
        
        try {
          switch (element.type) {
            case 'grid':
              if (config.showGrid !== false) drawGrid(ctx, element);
              break;
            case 'axes':
              if (config.showAxes !== false) drawAxes(ctx, element);
              break;
            case 'function':
              drawFunction(ctx, element);
              break;
            case 'circle':
              drawCircle(ctx, element);
              break;
            case 'ellipse':
              drawEllipse(ctx, element);
              break;
            case 'hyperbola':
              drawHyperbola(ctx, element);
              break;
            case 'parabola':
              drawParabola(ctx, element);
              break;
            case 'point':
              drawPoint(ctx, element);
              break;
            case 'line':
              drawLine(ctx, element);
              break;
            case 'vector':
              drawVector(ctx, element);
              break;
            case 'polygon':
              drawPolygon(ctx, element);
              break;
            case 'text':
              drawText(ctx, element);
              break;
            case 'parametric':
              drawParametric(ctx, element);
              break;
            case 'polarFunction':
              drawPolarFunction(ctx, element);
              break;
            default:
              console.warn(`Unknown element type: ${element.type}`);
          }
        } catch (error) {
          console.error(`Error drawing element ${index}:`, error);
        }
      });
    } else {
      console.warn('No elements to draw or elements is not an array');
    }

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [config, coordinateSystem]);

  if (!canvasData?.config) {
    return (
      <div style={{
        width,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <p style={{ color: '#6b7280' }}>Canvas データがありません</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        maxWidth: '100%',
        height: 'auto',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}
    />
  );
}