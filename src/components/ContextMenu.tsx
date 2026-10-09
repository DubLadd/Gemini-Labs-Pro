import React from 'react';
import { Terminal, Palette, Image, RefreshCw, Plus, Maximize2, Minimize2 } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface ContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  onClose: () => void;
  onOpenTerminal: () => void;
  onOpenSettings: () => void;
  onCycleTheme: () => void;
  onRefresh: () => void;
  onOpenNotebook: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  x,
  y,
  onClose,
  onOpenTerminal,
  onOpenSettings,
  onCycleTheme,
  onRefresh,
  onOpenNotebook,
  isFullscreen,
  onToggleFullscreen,
}) => {
  if (!isOpen) return null;

  // Viewport bounds safeguard
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 260);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      className="absolute w-52 mica-acrylic bg-slate-900/95 border border-white/10 rounded-xl p-1.5 text-xs text-slate-200 window-shadow z-[999] pointer-events-auto select-none"
    >
      <div
        onClick={() => {
          soundEngine.playSfx('click');
          onOpenTerminal();
          onClose();
        }}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
      >
        <Terminal className="w-4 h-4 text-emerald-400" />
        <span>Open Shell Terminal</span>
      </div>

      <div
        onClick={() => {
          soundEngine.playSfx('click');
          onOpenSettings();
          onClose();
        }}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
      >
        <Palette className="w-4 h-4 text-cyan-400" />
        <span>Personalize Wallpaper</span>
      </div>

      <div
        onClick={() => {
          soundEngine.playSfx('click');
          onToggleFullscreen();
          onClose();
        }}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-amber-400" />}
        <span>{isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen'}</span>
      </div>

      <div className="h-px bg-white/10 my-1" />

      <div
        onClick={() => {
          soundEngine.playSfx('click');
          onCycleTheme();
          onClose();
        }}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
      >
        <Image className="w-4 h-4 text-indigo-400" />
        <span>Next Desktop Theme</span>
      </div>

      <div
        onClick={() => {
          soundEngine.playSfx('click');
          onRefresh();
          onClose();
        }}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
      >
        <RefreshCw className="w-4 h-4 text-slate-400" />
        <span>Refresh System</span>
      </div>

      <div className="h-px bg-white/10 my-1" />

      <div
        onClick={() => {
          soundEngine.playSfx('click');
          onOpenNotebook();
          onClose();
        }}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
      >
        <Plus className="w-4 h-4 text-blue-400" />
        <span>New Labs Workspace</span>
      </div>
    </div>
  );
};
