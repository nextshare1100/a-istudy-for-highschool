'use client';

import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo,
  Redo,
  Trash2,
  Grid,
  Magnet,
  Download,
  Save,
} from 'lucide-react';

interface CanvasControlsProps {
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onExport?: () => void;
  onSave?: () => void;
}

const CanvasControls: React.FC<CanvasControlsProps> = ({
  zoom,
  canUndo,
  canRedo,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onUndo,
  onRedo,
  onClear,
  onToggleGrid,
  onToggleSnap,
  onExport,
  onSave,
}) => {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
      {/* 左側: 履歴管理 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-2 rounded-lg transition-colors ${
            canUndo
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'bg-gray-50 text-gray-300 cursor-not-allowed'
          }`}
          title="元に戻す (Ctrl+Z)"
        >
          <Undo size={20} />
        </button>
        
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-2 rounded-lg transition-colors ${
            canRedo
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'bg-gray-50 text-gray-300 cursor-not-allowed'
          }`}
          title="やり直す (Ctrl+Y)"
        >
          <Redo size={20} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-2" />

        <button
          onClick={onClear}
          className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
          title="全て消去"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* 中央: ズーム管理 */}
      <div className="flex items-center gap-2">
        <button
          onClick={onZoomOut}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          title="縮小"
        >
          <ZoomOut size={20} />
        </button>
        
        <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 min-w-[60px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        
        <button
          onClick={onZoomIn}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          title="拡大"
        >
          <ZoomIn size={20} />
        </button>
        
        <button
          onClick={onZoomReset}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          title="リセット"
        >
          <Maximize2 size={20} />
        </button>
      </div>

      {/* 右側: その他のコントロール */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleGrid}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          title="グリッド切り替え"
        >
          <Grid size={20} />
        </button>
        
        <button
          onClick={onToggleSnap}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          title="スナップ切り替え"
        >
          <Magnet size={20} />
        </button>

        {onExport && (
          <>
            <div className="w-px h-6 bg-gray-300 mx-2" />
            <button
              onClick={onExport}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              title="画像として保存"
            >
              <Download size={20} />
            </button>
          </>
        )}

        {onSave && (
          <button
            onClick={onSave}
            className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            title="保存"
          >
            <Save size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default CanvasControls;