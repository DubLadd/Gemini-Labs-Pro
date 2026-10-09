import React from 'react';
import { soundEngine } from '../utils/audio';
import { Wifi, Bluetooth, Sun, Volume2, Maximize2, Minimize2, Activity } from 'lucide-react';

interface QuickSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  wifiActive: boolean;
  onToggleWifi: () => void;
  bluetoothActive: boolean;
  onToggleBluetooth: () => void;
  onCycleWallpaper: () => void;
  wallpaperOpacity: number;
  onOpacityChange: (op: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  showPerfWidget: boolean;
  onTogglePerfWidget: () => void;
}

export const QuickSettings: React.FC<QuickSettingsProps> = ({
  isOpen,
  onClose,
  wifiActive,
  onToggleWifi,
  bluetoothActive,
  onToggleBluetooth,
  onCycleWallpaper,
  wallpaperOpacity,
  onOpacityChange,
  volume,
  onVolumeChange,
  isFullscreen,
  onToggleFullscreen,
  showPerfWidget,
  onTogglePerfWidget,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-14 right-3 w-80 mica-acrylic bg-slate-900/95 rounded-2xl border border-white/10 window-shadow z-50 p-4 select-none pointer-events-auto"
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Quick Controls
        </p>
        <button
          onClick={() => {
            soundEngine.playSfx('click');
            onToggleFullscreen();
          }}
          className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
        </button>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {/* Wi-Fi Tile */}
        <button
          onClick={() => {
            soundEngine.playSfx('click');
            onToggleWifi();
          }}
          className={`p-2.5 rounded-xl flex flex-col items-center justify-center space-y-1 transition-all ${
            wifiActive
              ? 'bg-cyan-600/30 border border-cyan-500/50 text-cyan-300'
              : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
          }`}
          title="Toggle Wi-Fi"
        >
          <Wifi className="w-4 h-4 text-cyan-400" />
          <span className="text-[9px] font-medium text-slate-200">
            {wifiActive ? 'LabsNet' : 'Wi-Fi Off'}
          </span>
        </button>

        {/* Bluetooth Tile */}
        <button
          onClick={() => {
            soundEngine.playSfx('click');
            onToggleBluetooth();
          }}
          className={`p-2.5 rounded-xl flex flex-col items-center justify-center space-y-1 transition-all ${
            bluetoothActive
              ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-300'
              : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
          }`}
          title="Toggle Bluetooth"
        >
          <Bluetooth className="w-4 h-4 text-slate-300" />
          <span className="text-[9px] font-medium text-slate-200">
            {bluetoothActive ? 'Bluetooth' : 'Off'}
          </span>
        </button>

        {/* Performance Monitor Widget Tile */}
        <button
          onClick={() => {
            soundEngine.playSfx('click');
            onTogglePerfWidget();
          }}
          className={`p-2.5 rounded-xl flex flex-col items-center justify-center space-y-1 transition-all ${
            showPerfWidget
              ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300'
              : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
          }`}
          title="Toggle Performance Monitor Widget"
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-[9px] font-medium text-slate-200">
            {showPerfWidget ? 'Perf Mon' : 'Perf Off'}
          </span>
        </button>

        {/* Theme Tile */}
        <button
          onClick={() => {
            soundEngine.playSfx('click');
            onCycleWallpaper();
          }}
          className="p-2.5 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center space-y-1 hover:bg-white/10 transition-colors"
          title="Cycle Theme"
        >
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="text-[9px] font-medium text-slate-200">Theme</span>
        </button>
      </div>

      {/* Sliders */}
      <div className="space-y-3 px-1">
        <div className="flex items-center space-x-3">
          <Sun className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.05"
            value={wallpaperOpacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
        </div>
        <div className="flex items-center space-x-3">
          <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
