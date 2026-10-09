import React from 'react';
import { soundEngine } from '../../utils/audio';
import { WALLPAPERS } from '../../data/apps';
import { WallpaperPreset } from '../../types/os';
import { Palette, Volume2, ShieldCheck, Info } from 'lucide-react';

interface SettingsAppProps {
  currentWallpaper: WallpaperPreset;
  onSelectWallpaper: (wp: WallpaperPreset) => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  wallpaperOpacity: number;
  onOpacityChange: (op: number) => void;
}

export const SettingsApp: React.FC<SettingsAppProps> = ({
  currentWallpaper,
  onSelectWallpaper,
  soundEnabled,
  onToggleSound,
  volume,
  onVolumeChange,
  wallpaperOpacity,
  onOpacityChange,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full p-5 overflow-y-auto space-y-5 bg-slate-950/70 select-none">
      {/* Wallpapers Section */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Palette className="w-4 h-4 text-cyan-400" />
          <span>Desktop Wallpapers</span>
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          Choose from curated Google Labs aesthetic wallpapers
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {WALLPAPERS.map((wp) => {
            const isSelected = wp.id === currentWallpaper.id;
            return (
              <div
                key={wp.id}
                onClick={() => {
                  soundEngine.playSfx('click');
                  onSelectWallpaper(wp);
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center space-x-3 bg-white/5 ${
                  isSelected
                    ? 'border-cyan-400 ring-1 ring-cyan-400/50 bg-cyan-950/20'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <div className="w-9 h-9 rounded-lg shadow shrink-0" style={{ background: wp.style }} />
                <span className="text-xs font-medium text-slate-200 line-clamp-1">{wp.name}</span>
              </div>
            );
          })}
        </div>

        {/* Wallpaper Opacity */}
        <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-200 font-medium block">Wallpaper Saturation / Opacity</span>
            <span className="text-[11px] text-slate-400">Controls contrast against desktop icons</span>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="0.3"
              max="1"
              step="0.05"
              value={wallpaperOpacity}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              className="w-28 accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-cyan-400 w-10 text-right">
              {Math.round(wallpaperOpacity * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Audio Section */}
      <div className="pt-4 border-t border-white/10">
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-purple-400" />
          <span>Audio Effects & Synthesizer Feedback</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <span className="text-xs font-medium text-slate-200 block">Synthesizer UI Sound Effects</span>
              <span className="text-[11px] text-slate-400">
                Audible Web Audio API tones on clicks, window launch, and tasks
              </span>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => onToggleSound(e.target.checked)}
              className="accent-cyan-400 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <div>
              <span className="text-xs font-medium text-slate-200 block">Master Shell Volume</span>
              <span className="text-[11px] text-slate-400">Audio gain scaling for synthesizers and SFX</span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-28 accent-purple-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono text-purple-300 w-10 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="pt-4 border-t border-white/10 text-xs text-slate-400">
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-400" />
          <span>About Google Labs Shell</span>
        </h3>
        <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1.5 font-mono text-[11px]">
          <div className="flex items-center justify-between">
            <span>Shell Version</span>
            <span className="text-slate-200">2026.10-labs</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Runtime Environment</span>
            <span className="text-slate-200">Web Component Sandbox (React 19)</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Security Isolation</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Hermetic
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
