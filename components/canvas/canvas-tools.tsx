'use client';

import React from 'react';
import { DrawingTool, SubjectType } from './canvas-types';
import {
  Pencil,
  Minus,
  Circle,
  Square,
  ArrowRight,
  Type,
  Eraser,
  MousePointer,
  TrendingUp,
  Zap,
  Beaker,
} from 'lucide-react';

interface CanvasToolsProps {
  currentTool: DrawingTool;
  currentColor: string;
  strokeWidth: number;
  onToolChange: (tool: DrawingTool) => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  subjectType?: SubjectType;
}

const CanvasTools: React.FC<CanvasToolsProps> = ({
  currentTool,
  currentColor,
  strokeWidth,
  onToolChange,
  onColorChange,
  onStrokeWidthChange,
  subjectType = 'general',
}) => {
  const tools: { id: DrawingTool; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <MousePointer size={20} />, label: '選択' },
    { id: 'pen', icon: <Pencil size={20} />, label: 'ペン' },
    { id: 'line', icon: <Minus size={20} />, label: '直線' },
    { id: 'circle', icon: <Circle size={20} />, label: '円' },
    { id: 'rectangle', icon: <Square size={20} />, label: '四角形' },
    { id: 'arrow', icon: <ArrowRight size={20} />, label: '矢印' },
    { id: 'text', icon: <Type size={20} />, label: 'テキスト' },
    { id: 'eraser', icon: <Eraser size={20} />, label: '消しゴム' },
  ];

  // 教科別の特殊ツール
  const specialTools = {
    mathematics: [
      { id: 'function', icon: <TrendingUp size={20} />, label: '関数' },
    ],
    physics: [
      { id: 'vector', icon: <Zap size={20} />, label: 'ベクトル' },
    ],
    chemistry: [
      { id: 'molecule', icon: <Beaker size={20} />, label: '分子' },
    ],
  };

  const colors = [
    '#000000', // 黒
    '#FF0000', // 赤
    '#0000FF', // 青
    '#00FF00', // 緑
    '#FFA500', // オレンジ
    '#800080', // 紫
    '#FF1493', // ピンク
    '#00CED1', // ターコイズ
  ];

  const strokeWidths = [1, 2, 3, 5, 8];

  return (
    <div className="mb-4 p-4 bg-white rounded-lg shadow-sm">
      {/* ツール選択 */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2">ツール</h3>
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`p-2 rounded-lg transition-colors ${
                currentTool === tool.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}
          
          {/* 教科別ツール */}
          {subjectType !== 'general' && specialTools[subjectType]?.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id as DrawingTool)}
              className={`p-2 rounded-lg transition-colors ${
                currentTool === tool.id
                  ? 'bg-purple-500 text-white'
                  : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
              }`}
              title={tool.label}
            >
              {tool.icon}
            </button>
          ))}
        </div>
      </div>

      {/* 色選択 */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-2">色</h3>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                currentColor === color
                  ? 'border-gray-800 scale-110'
                  : 'border-gray-300 hover:border-gray-500'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          <input
            type="color"
            value={currentColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
            title="カスタム色"
          />
        </div>
      </div>

      {/* 線の太さ */}
      <div>
        <h3 className="text-sm font-semibold mb-2">線の太さ</h3>
        <div className="flex items-center gap-4">
          {strokeWidths.map((width) => (
            <button
              key={width}
              onClick={() => onStrokeWidthChange(width)}
              className={`relative transition-colors ${
                strokeWidth === width
                  ? 'text-blue-500'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div
                className="bg-current rounded-full"
                style={{ width: `${width * 3}px`, height: `${width * 3}px` }}
              />
              <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs">
                {width}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CanvasTools;