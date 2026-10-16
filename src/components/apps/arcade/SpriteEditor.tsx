import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SpriteData } from './types';
import {
  Paintbrush,
  Eraser,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Play,
  Pause,
  Download,
  Sparkles,
  Layers,
  ChevronRight,
  Eye,
  Check,
} from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface SpriteEditorProps {
  sprites: SpriteData[];
  onUpdateSprites: (sprites: SpriteData[]) => void;
  onInjectSpriteToGame: (sprite: SpriteData) => void;
}

const PALETTE_SWATCHES = [
  '#000000', '#ffffff', '#1e293b', '#64748b',
  '#ef4444', '#f97316', '#f59e0b', '#10b981',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f43f5e', '#a855f7', '#14b8a6', '#84cc16',
];

export const SpriteEditor: React.FC<SpriteEditorProps> = ({
  sprites,
  onUpdateSprites,
  onInjectSpriteToGame,
}) => {
  const [selectedSpriteId, setSelectedSpriteId] = useState<string>(sprites[0]?.id || '');
  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [activeColor, setActiveColor] = useState<string>('#06b6d4');
  const [tool, setTool] = useState<'paint' | 'eraser' | 'picker'>('paint');
  const [isPlayingAnim, setIsPlayingAnim] = useState<boolean>(true);
  const [animFrame, setAnimFrame] = useState<number>(0);
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false);
  const [injectedSuccess, setInjectedSuccess] = useState<boolean>(false);

  const activeSprite = sprites.find((s) => s.id === selectedSpriteId) || sprites[0];
  const grid = activeSprite?.frames[activeFrameIndex] || activeSprite?.frames[0] || [];

  // Frame animation timer for preview
  useEffect(() => {
    if (!isPlayingAnim || !activeSprite || activeSprite.frames.length <= 1) return;
    const interval = setInterval(() => {
      setAnimFrame((prev) => (prev + 1) % activeSprite.frames.length);
    }, 1000 / (activeSprite.fps || 4));
    return () => clearInterval(interval);
  }, [isPlayingAnim, activeSprite]);

  // Pixel click handler
  const handlePixelInteract = useCallback((x: number, y: number) => {
    if (!activeSprite) return;
    const currentFrame = activeSprite.frames[activeFrameIndex];
    if (!currentFrame) return;

    if (tool === 'picker') {
      const picked = currentFrame[y][x];
      if (picked) setActiveColor(picked);
      setTool('paint');
      soundEngine.playSfx('click');
      return;
    }

    const targetColor = tool === 'eraser' ? '' : activeColor;
    if (currentFrame[y][x] === targetColor) return;

    const newFrames = activeSprite.frames.map((frame, fIdx) => {
      if (fIdx !== activeFrameIndex) return frame;
      return frame.map((row, rIdx) => {
        if (rIdx !== y) return row;
        const newRow = [...row];
        newRow[x] = targetColor;
        return newRow;
      });
    });

    const updatedSprites = sprites.map((s) =>
      s.id === activeSprite.id ? { ...s, frames: newFrames } : s
    );
    onUpdateSprites(updatedSprites);
  }, [activeSprite, activeFrameIndex, tool, activeColor, sprites, onUpdateSprites]);

  // Flood fill tool
  const handleFloodFill = (startX: number, startY: number) => {
    if (!activeSprite) return;
    const currentFrame = activeSprite.frames[activeFrameIndex];
    if (!currentFrame) return;
    const target = currentFrame[startY][startX];
    const fillWith = tool === 'eraser' ? '' : activeColor;
    if (target === fillWith) return;

    const newGrid = currentFrame.map((r) => [...r]);
    const queue: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const [cx, cy] = queue.pop()!;
      const key = `${cx},${cy}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (cx < 0 || cx >= activeSprite.width || cy < 0 || cy >= activeSprite.height) continue;
      if (newGrid[cy][cx] !== target) continue;

      newGrid[cy][cx] = fillWith;
      queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }

    const newFrames = activeSprite.frames.map((frame, fIdx) =>
      fIdx === activeFrameIndex ? newGrid : frame
    );
    const updatedSprites = sprites.map((s) =>
      s.id === activeSprite.id ? { ...s, frames: newFrames } : s
    );
    onUpdateSprites(updatedSprites);
    soundEngine.playSfx('click');
  };

  const handleAddFrame = () => {
    if (!activeSprite) return;
    const blank = Array.from({ length: activeSprite.height }, () => Array(activeSprite.width).fill(''));
    const newFrames = [...activeSprite.frames, blank];
    const updated = sprites.map((s) =>
      s.id === activeSprite.id ? { ...s, frames: newFrames } : s
    );
    onUpdateSprites(updated);
    setActiveFrameIndex(newFrames.length - 1);
    soundEngine.playSfx('click');
  };

  const handleDuplicateFrame = () => {
    if (!activeSprite) return;
    const current = activeSprite.frames[activeFrameIndex];
    const dup = current.map((r) => [...r]);
    const newFrames = [...activeSprite.frames, dup];
    const updated = sprites.map((s) =>
      s.id === activeSprite.id ? { ...s, frames: newFrames } : s
    );
    onUpdateSprites(updated);
    setActiveFrameIndex(newFrames.length - 1);
    soundEngine.playSfx('click');
  };

  const handleDeleteFrame = () => {
    if (!activeSprite || activeSprite.frames.length <= 1) return;
    const newFrames = activeSprite.frames.filter((_, i) => i !== activeFrameIndex);
    const updated = sprites.map((s) =>
      s.id === activeSprite.id ? { ...s, frames: newFrames } : s
    );
    onUpdateSprites(updated);
    setActiveFrameIndex(Math.max(0, activeFrameIndex - 1));
    soundEngine.playSfx('click');
  };

  const handleClearFrame = () => {
    if (!activeSprite) return;
    const blank = Array.from({ length: activeSprite.height }, () => Array(activeSprite.width).fill(''));
    const newFrames = activeSprite.frames.map((f, i) => (i === activeFrameIndex ? blank : f));
    const updated = sprites.map((s) =>
      s.id === activeSprite.id ? { ...s, frames: newFrames } : s
    );
    onUpdateSprites(updated);
    soundEngine.playSfx('click');
  };

  const handleCreateNewSprite = () => {
    const id = `sprite-${Date.now().toString(36)}`;
    const newSprite: SpriteData = {
      id,
      name: `Custom Sprite ${sprites.length + 1}`,
      width: 16,
      height: 16,
      fps: 4,
      frames: [Array.from({ length: 16 }, () => Array(16).fill(''))],
    };
    onUpdateSprites([...sprites, newSprite]);
    setSelectedSpriteId(id);
    setActiveFrameIndex(0);
    soundEngine.playSfx('open');
  };

  const handleInject = () => {
    if (!activeSprite) return;
    onInjectSpriteToGame(activeSprite);
    setInjectedSuccess(true);
    soundEngine.playSfx('success');
    setTimeout(() => setInjectedSuccess(false), 2500);
  };

  const handleDownloadJson = () => {
    if (!activeSprite) return;
    const blob = new Blob([JSON.stringify(activeSprite, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSprite.id}.sprite.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundEngine.playSfx('click');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-950 select-none">
      {/* Left Sidebar: Sprites List & Library */}
      <div className="w-full md:w-64 border-r border-white/10 bg-slate-900/80 flex flex-col shrink-0">
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-pink-400" />
            <span className="font-bold text-xs text-white uppercase tracking-wider">Sprite Library</span>
          </div>
          <button
            onClick={handleCreateNewSprite}
            className="p-1 rounded bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/30 text-xs flex items-center gap-1"
            title="Create New Sprite"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {sprites.map((s) => {
            const isSelected = s.id === selectedSpriteId;
            return (
              <div
                key={s.id}
                onClick={() => {
                  setSelectedSpriteId(s.id);
                  setActiveFrameIndex(0);
                  soundEngine.playSfx('click');
                }}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-pink-950/40 border-pink-500/50 text-white shadow-sm'
                    : 'bg-slate-900 border-white/5 text-slate-300 hover:border-white/20 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {/* Miniature canvas preview */}
                  <div className="w-7 h-7 bg-black/60 rounded border border-white/10 overflow-hidden flex items-center justify-center">
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: `repeat(${s.width}, 1.5px)`,
                        gridTemplateRows: `repeat(${s.height}, 1.5px)`,
                      }}
                    >
                      {s.frames[0]?.map((row, y) =>
                        row.map((col, x) => (
                          <div
                            key={`${x}-${y}`}
                            style={{ backgroundColor: col || 'transparent' }}
                            className="w-[1.5px] h-[1.5px]"
                          />
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold leading-tight">{s.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {s.width}x{s.height} • {s.frames.length} frame{s.frames.length > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                {isSelected && <ChevronRight className="w-3.5 h-3.5 text-pink-400 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Center: Interactive Pixel Canvas */}
      <div className="flex-1 flex flex-col items-center justify-between p-4 overflow-y-auto bg-slate-950/90">
        {/* Canvas Toolbar */}
        <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-3 shadow-md mb-3">
          {/* Tools */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setTool('paint'); soundEngine.playSfx('click'); }}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition ${
                tool === 'paint'
                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/50'
                  : 'bg-slate-800 text-slate-400 border-white/5 hover:text-white'
              }`}
              title="Paint Brush"
            >
              <Paintbrush className="w-3.5 h-3.5" />
              Draw
            </button>
            <button
              onClick={() => { setTool('eraser'); soundEngine.playSfx('click'); }}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition ${
                tool === 'eraser'
                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/50'
                  : 'bg-slate-800 text-slate-400 border-white/5 hover:text-white'
              }`}
              title="Eraser"
            >
              <Eraser className="w-3.5 h-3.5" />
              Erase
            </button>
            <button
              onClick={() => { setTool('picker'); soundEngine.playSfx('click'); }}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition ${
                tool === 'picker'
                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/50'
                  : 'bg-slate-800 text-slate-400 border-white/5 hover:text-white'
              }`}
              title="Color Eyedropper"
            >
              <Eye className="w-3.5 h-3.5" />
              Pick
            </button>
            <button
              onClick={handleClearFrame}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-rose-400 border border-white/5 text-xs flex items-center gap-1"
              title="Clear Active Frame"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>

          {/* Color preview & picker */}
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={activeColor}
              onChange={(e) => setActiveColor(e.target.value)}
              className="w-7 h-7 rounded border border-white/20 cursor-pointer bg-transparent"
              title="Custom Hex Color"
            />
            <div className="text-[11px] font-mono text-slate-300 uppercase">{activeColor}</div>
          </div>
        </div>

        {/* 16x16 Pixel Grid Drawing Area */}
        <div
          onMouseDown={() => setIsMouseDown(true)}
          onMouseUp={() => setIsMouseDown(false)}
          onMouseLeave={() => setIsMouseDown(false)}
          className="relative p-3 bg-black/90 border-2 border-pink-500/30 rounded-2xl shadow-2xl shadow-pink-500/10 flex items-center justify-center select-none"
        >
          <div
            className="grid gap-[1px] bg-slate-800/80 p-1 rounded-lg border border-white/10"
            style={{
              gridTemplateColumns: `repeat(${activeSprite.width}, 20px)`,
              gridTemplateRows: `repeat(${activeSprite.height}, 20px)`,
            }}
          >
            {grid.map((row, y) =>
              row.map((color, x) => (
                <div
                  key={`${x}-${y}`}
                  onMouseDown={(e) => {
                    if (e.shiftKey) {
                      handleFloodFill(x, y);
                    } else {
                      handlePixelInteract(x, y);
                    }
                  }}
                  onMouseEnter={() => {
                    if (isMouseDown) handlePixelInteract(x, y);
                  }}
                  style={{
                    backgroundColor: color || 'transparent',
                    backgroundImage: !color
                      ? 'linear-gradient(45deg, #111827 25%, transparent 25%, transparent 75%, #111827 75%), linear-gradient(45deg, #111827 25%, #030712 25%, #030712 75%, #111827 75%)'
                      : undefined,
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 4px 4px',
                  }}
                  className="w-5 h-5 rounded-[2px] cursor-crosshair border border-white/5 hover:border-white/40 transition-colors"
                />
              ))
            )}
          </div>
        </div>

        {/* Bottom Palette Swatches */}
        <div className="w-full max-w-xl mt-3 flex items-center justify-center gap-1.5 flex-wrap">
          {PALETTE_SWATCHES.map((swatch, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActiveColor(swatch);
                setTool('paint');
                soundEngine.playSfx('click');
              }}
              style={{ backgroundColor: swatch }}
              className={`w-6 h-6 rounded-md border transition-transform ${
                activeColor.toLowerCase() === swatch.toLowerCase() && tool === 'paint'
                  ? 'border-white scale-110 shadow-lg'
                  : 'border-white/20 hover:scale-105'
              }`}
            />
          ))}
        </div>

        {/* Frame Timeline / Animation Strip */}
        <div className="w-full max-w-xl mt-4 bg-slate-900 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-[11px] font-mono text-slate-400">FRAMES:</span>
            {activeSprite.frames.map((f, idx) => {
              const isActive = idx === activeFrameIndex;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveFrameIndex(idx);
                    soundEngine.playSfx('click');
                  }}
                  className={`w-9 h-9 rounded-lg border relative flex items-center justify-center transition-all ${
                    isActive
                      ? 'border-pink-500 bg-pink-950/40 shadow-sm shadow-pink-500/20'
                      : 'border-white/10 bg-slate-950 hover:border-white/30'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-slate-300">{idx + 1}</span>
                </button>
              );
            })}
            <button
              onClick={handleAddFrame}
              className="w-9 h-9 rounded-lg border border-dashed border-white/20 hover:border-pink-500/50 flex items-center justify-center text-slate-400 hover:text-white"
              title="Add New Blank Frame"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleDuplicateFrame}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10"
              title="Duplicate Frame"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDeleteFrame}
              disabled={activeSprite.frames.length <= 1}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-rose-400 border border-white/10"
              title="Delete Frame"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Real-time Live Animation Preview & Code Injector */}
      <div className="w-full md:w-72 border-l border-white/10 bg-slate-900/80 p-4 flex flex-col justify-between shrink-0">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            Live Reel Preview
          </h4>

          {/* Animated Sprite Box */}
          <div className="w-full aspect-square bg-black border-2 border-pink-500/30 rounded-xl overflow-hidden flex flex-col items-center justify-center relative shadow-lg">
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${activeSprite.width}, 9px)`,
                gridTemplateRows: `repeat(${activeSprite.height}, 9px)`,
              }}
            >
              {(activeSprite.frames[animFrame] || activeSprite.frames[0])?.map((row, y) =>
                row.map((col, x) => (
                  <div
                    key={`${x}-${y}`}
                    style={{ backgroundColor: col || 'transparent' }}
                    className="w-[9px] h-[9px]"
                  />
                ))
              )}
            </div>

            {/* Play/Pause overlay */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-slate-900/80 backdrop-blur px-2 py-1 rounded border border-white/10 text-[10px] font-mono">
              <button
                onClick={() => setIsPlayingAnim(!isPlayingAnim)}
                className="flex items-center gap-1 text-slate-300 hover:text-white"
              >
                {isPlayingAnim ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                {isPlayingAnim ? 'PAUSE' : 'PLAY'}
              </button>
              <span className="text-pink-300">
                Frame {animFrame + 1} / {activeSprite.frames.length}
              </span>
            </div>
          </div>

          {/* FPS Slider */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Playback Speed</span>
              <span className="font-mono text-pink-400">{activeSprite.fps} FPS</span>
            </div>
            <input
              type="range"
              min="1"
              max="16"
              step="1"
              value={activeSprite.fps}
              onChange={(e) => {
                const fps = parseInt(e.target.value, 10);
                const updated = sprites.map((s) => (s.id === activeSprite.id ? { ...s, fps } : s));
                onUpdateSprites(updated);
              }}
              className="w-full accent-pink-500"
            />
          </div>

          {/* Sprite Code Helper info */}
          <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-white/5 font-mono text-[11px] space-y-1 text-slate-400">
            <div className="text-pink-300 font-bold mb-1">// Engine Usage:</div>
            <div>engine.drawSprite('{activeSprite.id}', x, y);</div>
            <div className="text-slate-500 text-[10px]">Supports scaling, flip facing & animations!</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 mt-4">
          <button
            onClick={handleInject}
            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
              injectedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-pink-500/20'
            }`}
          >
            {injectedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                Sprite Injected Into Engine!
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Inject Sprite into Active Game
              </>
            )}
          </button>

          <button
            onClick={handleDownloadJson}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10"
          >
            <Download className="w-3.5 h-3.5" />
            Export Sprite (.json)
          </button>
        </div>
      </div>
    </div>
  );
};
