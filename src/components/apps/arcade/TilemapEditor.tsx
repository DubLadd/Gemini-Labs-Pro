import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TilemapData, TileDef } from './types';
import { DEFAULT_TILE_DEFS } from './defaults';
import {
  Grid,
  Paintbrush,
  Eraser,
  RotateCcw,
  Download,
  Upload,
  Check,
  Sparkles,
  Map,
  Layers,
  Box,
} from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface TilemapEditorProps {
  tilemap: TilemapData;
  onUpdateTilemap: (tilemap: TilemapData) => void;
  onApplyTilemapToGame: (tilemap: TilemapData) => void;
}

export const TilemapEditor: React.FC<TilemapEditorProps> = ({
  tilemap,
  onUpdateTilemap,
  onApplyTilemapToGame,
}) => {
  const [selectedTileId, setSelectedTileId] = useState<number>(1);
  const [tool, setTool] = useState<'paint' | 'eraser' | 'fill'>('paint');
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [appliedSuccess, setAppliedSuccess] = useState<boolean>(false);
  const [hoveredCell, setHoveredCell] = useState<{ col: number; row: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tileDefs = DEFAULT_TILE_DEFS;

  const handleCellInteract = useCallback((col: number, row: number) => {
    if (col < 0 || col >= tilemap.cols || row < 0 || row >= tilemap.rows) return;
    const targetId = tool === 'eraser' ? 0 : selectedTileId;
    if (tilemap.grid[row][col] === targetId) return;

    const newGrid = tilemap.grid.map((r, rIdx) => {
      if (rIdx !== row) return r;
      const newRow = [...r];
      newRow[col] = targetId;
      return newRow;
    });

    onUpdateTilemap({
      ...tilemap,
      grid: newGrid,
    });
  }, [tilemap, tool, selectedTileId, onUpdateTilemap]);

  const handleFillAll = (targetTileId: number) => {
    const newGrid = Array.from({ length: tilemap.rows }, () =>
      Array(tilemap.cols).fill(targetTileId)
    );
    onUpdateTilemap({ ...tilemap, grid: newGrid });
    soundEngine.playSfx('click');
  };

  const handleClearMap = () => {
    handleFillAll(0);
  };

  const handleGenerateBorderWalls = () => {
    const newGrid = tilemap.grid.map((row, rIdx) =>
      row.map((val, cIdx) => {
        if (rIdx === 0 || rIdx === tilemap.rows - 1 || cIdx === 0 || cIdx === tilemap.cols - 1) {
          return 1;
        }
        return val;
      })
    );
    onUpdateTilemap({ ...tilemap, grid: newGrid });
    soundEngine.playSfx('click');
  };

  const handleApply = () => {
    onApplyTilemapToGame(tilemap);
    setAppliedSuccess(true);
    soundEngine.playSfx('success');
    setTimeout(() => setAppliedSuccess(false), 2500);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(tilemap, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tilemap.id}.level.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundEngine.playSfx('click');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.grid && Array.isArray(parsed.grid)) {
          onUpdateTilemap(parsed);
          soundEngine.playSfx('open');
        }
      } catch (err) {
        console.error('Invalid tilemap JSON', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-950 select-none">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportJson}
        className="hidden"
      />

      {/* Left Sidebar: Tile Palette */}
      <div className="w-full md:w-72 border-r border-white/10 bg-slate-900/80 flex flex-col shrink-0">
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs text-white uppercase tracking-wider">Tile Palette</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {tilemap.cols}x{tilemap.rows} ({tilemap.tileSize}px)
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {tileDefs.map((tile) => {
            const isSelected = selectedTileId === tile.id && tool === 'paint';
            return (
              <div
                key={tile.id}
                onClick={() => {
                  setSelectedTileId(tile.id);
                  setTool('paint');
                  soundEngine.playSfx('click');
                }}
                className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-900 border-white/5 text-slate-300 hover:border-white/20 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    style={{
                      backgroundColor: tile.color !== 'transparent' ? tile.color : '#0f172a',
                    }}
                    className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white shadow border border-white/10"
                  >
                    {tile.icon || (tile.id === 0 ? '·' : '■')}
                  </div>
                  <div>
                    <div className="text-xs font-semibold leading-tight">{tile.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      ID: {tile.id} {tile.solid ? '• Solid Wall' : tile.hazard ? '• Hazard' : tile.collectible ? '• Pickup' : ''}
                    </div>
                  </div>
                </div>
                {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
              </div>
            );
          })}
        </div>

        {/* Quick Generators */}
        <div className="p-3 border-t border-white/10 bg-slate-900/90 space-y-2">
          <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Quick Build:</div>
          <button
            onClick={handleGenerateBorderWalls}
            className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs border border-white/5 flex items-center justify-center gap-1.5"
          >
            <Grid className="w-3.5 h-3.5 text-cyan-400" />
            Build Perimeter Boundary Walls
          </button>
          <button
            onClick={handleClearMap}
            className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded text-xs border border-white/5 flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            Clear All Map Tiles
          </button>
        </div>
      </div>

      {/* Center: Grid Level Editor Viewport */}
      <div className="flex-1 flex flex-col items-center justify-between p-4 overflow-y-auto bg-slate-950/90">
        {/* Editor Toolbar */}
        <div className="w-full max-w-4xl bg-slate-900 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-3 shadow-md mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setTool('paint'); soundEngine.playSfx('click'); }}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition ${
                tool === 'paint'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              Tile Brush
            </button>
            <button
              onClick={() => { setTool('eraser'); soundEngine.playSfx('click'); }}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition ${
                tool === 'eraser'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800 text-slate-400 border-white/5 hover:text-white'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              Eraser
            </button>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
            {hoveredCell ? (
              <span>
                Col: <strong className="text-emerald-300">{hoveredCell.col}</strong>, Row: <strong className="text-emerald-300">{hoveredCell.row}</strong>
              </span>
            ) : (
              <span>Hover canvas to inspect coords</span>
            )}
            <span className="text-slate-600">|</span>
            <span>Canvas: 700×525px</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs flex items-center gap-1"
              title="Import JSON Level"
            >
              <Upload className="w-3.5 h-3.5" />
              Import
            </button>
            <button
              onClick={handleExportJson}
              className="p-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs flex items-center gap-1"
              title="Export JSON Level"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* 28x21 Level Grid Canvas */}
        <div
          onMouseDown={() => setIsMouseDown(true)}
          onMouseUp={() => setIsMouseDown(false)}
          onMouseLeave={() => {
            setIsMouseDown(false);
            setHoveredCell(null);
          }}
          className="relative p-2 bg-black border-2 border-emerald-500/30 rounded-xl shadow-2xl shadow-emerald-500/10 flex items-center justify-center select-none overflow-auto max-w-full"
        >
          <div
            className="grid gap-[1px] bg-slate-800/80 p-0.5 rounded border border-white/10"
            style={{
              gridTemplateColumns: `repeat(${tilemap.cols}, 22px)`,
              gridTemplateRows: `repeat(${tilemap.rows}, 22px)`,
            }}
          >
            {tilemap.grid.map((row, rIdx) =>
              row.map((cellId, cIdx) => {
                const def = tileDefs.find((t) => t.id === cellId) || tileDefs[0];
                return (
                  <div
                    key={`${cIdx}-${rIdx}`}
                    onMouseDown={() => handleCellInteract(cIdx, rIdx)}
                    onMouseEnter={() => {
                      setHoveredCell({ col: cIdx, row: rIdx });
                      if (isMouseDown) handleCellInteract(cIdx, rIdx);
                    }}
                    style={{
                      backgroundColor: def.color !== 'transparent' ? def.color : '#030712',
                      backgroundImage: cellId === 0
                        ? 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)'
                        : undefined,
                      backgroundSize: '8px 8px',
                    }}
                    className="w-[22px] h-[22px] rounded-[1px] cursor-pointer border border-white/5 hover:border-emerald-400/80 transition-colors flex items-center justify-center text-[9px] text-white/80 font-bold select-none"
                  >
                    {def.icon || (cellId > 0 ? def.name[0] : '')}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Level Controls & Code Info */}
        <div className="w-full max-w-4xl mt-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Tilemap ID: <strong className="text-white">{tilemap.id}</strong> ({tilemap.name})</span>
          </div>
          <div>Grid matches runtime 700x525 pixel aspect ratio (25px per tile)</div>
        </div>
      </div>

      {/* Right Sidebar: Engine Integration & Level Presets */}
      <div className="w-full md:w-72 border-l border-white/10 bg-slate-900/80 p-4 flex flex-col justify-between shrink-0">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Map className="w-3.5 h-3.5 text-emerald-400" />
            Engine Level Forge
          </h4>

          {/* Level Info & Summary */}
          <div className="p-3 bg-slate-950 rounded-xl border border-white/10 space-y-2 mb-4">
            <div className="text-xs font-semibold text-slate-200">Level Blueprint Metrics:</div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
              <div className="bg-slate-900 p-1.5 rounded border border-white/5">
                Cols: <strong className="text-white">{tilemap.cols}</strong>
              </div>
              <div className="bg-slate-900 p-1.5 rounded border border-white/5">
                Rows: <strong className="text-white">{tilemap.rows}</strong>
              </div>
              <div className="bg-slate-900 p-1.5 rounded border border-white/5">
                Solids: <strong className="text-cyan-300">
                  {tilemap.grid.flat().filter((id) => id === 1 || id === 5).length}
                </strong>
              </div>
              <div className="bg-slate-900 p-1.5 rounded border border-white/5">
                Hazards: <strong className="text-rose-400">
                  {tilemap.grid.flat().filter((id) => id === 3).length}
                </strong>
              </div>
              <div className="bg-slate-900 p-1.5 rounded border border-white/5">
                Collectibles: <strong className="text-amber-300">
                  {tilemap.grid.flat().filter((id) => id === 4 || id === 6).length}
                </strong>
              </div>
              <div className="bg-slate-900 p-1.5 rounded border border-white/5">
                Enemies: <strong className="text-pink-400">
                  {tilemap.grid.flat().filter((id) => id === 9).length}
                </strong>
              </div>
            </div>
          </div>

          {/* Engine Code Helper */}
          <div className="p-3 bg-slate-950 rounded-xl border border-white/5 font-mono text-[11px] space-y-1 text-slate-400">
            <div className="text-emerald-400 font-bold mb-1">// Engine Usage:</div>
            <div>engine.drawTilemap();</div>
            <div>engine.checkTileCollision(x, y, w, h);</div>
            <div className="text-slate-500 text-[10px]">Auto-resolves wall collisions & platform triggers!</div>
          </div>
        </div>

        {/* Action Button: Apply to Current Game */}
        <div className="space-y-2 mt-4">
          <button
            onClick={handleApply}
            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
              appliedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20'
            }`}
          >
            {appliedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                Level Applied to Game Engine!
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Apply Level to Active Game
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
