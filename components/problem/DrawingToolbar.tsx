// components/problem/DrawingToolbar.tsx

import React, { useEffect } from 'react';
import { 
  MousePointer2, 
  Minus, 
  Circle, 
  Square,
  Undo2, 
  Redo2, 
  Trash2,
  Grid3x3,
  Eye,
  Ruler,
  RotateCw
} from 'lucide-react';
import type { DrawingTool, DrawingSettings } from '@/types/canvas';

interface DrawingToolbarProps {
  selectedTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  settings: DrawingSettings;
  onSettingsChange: (settings: DrawingSettings) => void;
  onClearAll?: () => void;
}

interface ToolButton {
  tool: DrawingTool;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  selectedTool,
  onToolChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  settings,
  onSettingsChange,
  onClearAll
}) => {
  const tools: ToolButton[] = [
    { tool: 'select', icon: <MousePointer2 size={20} />, label: '選択', shortcut: 'V' },
    { tool: 'line', icon: <Minus size={20} />, label: '直線', shortcut: 'L' },
    { tool: 'point', icon: <Circle size={6} className="fill-current" />, label: '点', shortcut: 'P' },
    { tool: 'circle', icon: <Circle size={20} />, label: '円', shortcut: 'C' },
    { tool: 'perpendicular', icon: <Square size={20} />, label: '垂線', shortcut: 'T' },
    { tool: 'parallel', icon: <Minus size={20} className="rotate-12" />, label: '平行線', shortcut: 'R' }
  ];

  // キーボードショートカット
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const key = e.key.toUpperCase();
      const tool = tools.find(t => t.shortcut === key);
      if (tool) {
        onToolChange(tool.tool);
      } else if (e.ctrlKey || e.metaKey) {
        if (key === 'Z' && !e.shiftKey && canUndo) {
          e.preventDefault();
          onUndo();
        } else if ((key === 'Z' && e.shiftKey) || key === 'Y') {
          if (canRedo) {
            e.preventDefault();
            onRedo();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [canUndo, canRedo, onUndo, onRedo, onToolChange]);

  const toggleSetting = (key: keyof DrawingSettings) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key]
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:static md:bottom-auto md:border md:rounded-lg md:shadow-sm">
      <div className="flex flex-wrap items-center gap-2 p-3">
        {/* ツールボタン */}
        <div className="flex items-center gap-1 border-r pr-2">
          {tools.map(({ tool, icon, label, shortcut }) => (
            <button
              key={tool}
              onClick={() => onToolChange(tool)}
              className={`
                relative p-2 rounded-lg transition-all duration-200
                ${selectedTool === tool 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
              title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
            >
              {icon}
              {shortcut && (
                <span className="absolute -bottom-1 -right-1 text-xs bg-gray-600 text-white rounded px-1">
                  {shortcut}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-1 border-r pr-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`
              p-2 rounded-lg transition-all duration-200
              ${canUndo 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }
            `}
            title="元に戻す (Ctrl+Z)"
          >
            <Undo2 size={20} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`
              p-2 rounded-lg transition-all duration-200
              ${canRedo 
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }
            `}
            title="やり直す (Ctrl+Y)"
          >
            <Redo2 size={20} />
          </button>
          {onClearAll && (
            <button
              onClick={onClearAll}
              className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-all duration-200"
              title="全削除"
            >
              <Trash2 size={20} />
            </button>
          )}
        </div>

        {/* 表示オプション */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleSetting('snapToGrid')}
            className={`
              p-2 rounded-lg transition-all duration-200
              ${settings.snapToGrid 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
            title="グリッドスナップ"
          >
            <Grid3x3 size={20} />
          </button>
          <button
            onClick={() => toggleSetting('showCoordinates')}
            className={`
              p-2 rounded-lg transition-all duration-200
              ${settings.showCoordinates 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
            title="座標表示"
          >
            <Eye size={20} />
          </button>
          <button
            onClick={() => toggleSetting('showLengths')}
            className={`
              p-2 rounded-lg transition-all duration-200
              ${settings.showLengths 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
            title="長さ表示"
          >
            <Ruler size={20} />
          </button>
          <button
            onClick={() => toggleSetting('showAngles')}
            className={`
              p-2 rounded-lg transition-all duration-200
              ${settings.showAngles 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
            title="角度表示"
          >
            <RotateCw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrawingToolbar;