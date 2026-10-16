import React, { useState } from 'react';
import { EngineDebugState } from './types';
import {
  Bug,
  Shield,
  Zap,
  StepForward,
  FastForward,
  Terminal,
  Crosshair,
  Grid,
  Check,
  ChevronRight,
} from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface DebugInspectorProps {
  debugState: EngineDebugState;
  onUpdateDebugState: (state: EngineDebugState) => void;
  onStepFrame: () => void;
  engineRef: React.MutableRefObject<any>;
  onShowToast?: (title: string, msg: string, type?: 'info' | 'success' | 'warn') => void;
}

export const DebugInspector: React.FC<DebugInspectorProps> = ({
  debugState,
  onUpdateDebugState,
  onStepFrame,
  engineRef,
  onShowToast,
}) => {
  const [replInput, setReplInput] = useState<string>('');
  const [replLogs, setReplLogs] = useState<string[]>([
    'Debug REPL initialized. Access `engine` instance directly.',
  ]);

  const handleExecuteRepl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replInput.trim() || !engineRef.current) return;

    try {
      const fn = new Function('engine', `return (${replInput});`);
      const result = fn(engineRef.current);
      setReplLogs((prev) => [
        ...prev.slice(-6),
        `> ${replInput}`,
        `= ${result !== undefined ? JSON.stringify(result) : 'OK'}`,
      ]);
      setReplInput('');
      soundEngine.playSfx('click');
    } catch (err) {
      setReplLogs((prev) => [...prev.slice(-6), `> ${replInput}`, `! Error: ${String(err)}`]);
      soundEngine.playSfx('click');
    }
  };

  const handleQuickCheat = (action: string) => {
    if (!engineRef.current) return;
    const eng = engineRef.current;

    if (action === 'score') {
      eng.addScore(1000);
      if (onShowToast) onShowToast('Cheat Applied', '+1000 Score Added', 'success');
    } else if (action === 'lives') {
      eng.lives = Math.min(9, (eng.lives || 3) + 3);
      if (onShowToast) onShowToast('Cheat Applied', '+3 Extra Lives', 'success');
    } else if (action === 'clearEnemies') {
      eng.enemies = [];
      eng.boss = null;
      if (onShowToast) onShowToast('Cheat Applied', 'All enemies obliterated', 'warn');
    } else if (action === 'maxWeapon') {
      if (eng.player) eng.player.weaponTier = 3;
      if (onShowToast) onShowToast('Cheat Applied', 'Max Weapon Tier Armed', 'success');
    }
    soundEngine.playSfx('open');
  };

  return (
    <div className="bg-slate-900/90 border border-white/10 rounded-xl p-3 shadow-lg space-y-3 font-sans">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5">
          <Bug className="w-3.5 h-3.5 text-rose-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Engine Inspector & Diagnostics</span>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
          LIVE ATTACHED
        </span>
      </div>

      {/* Toggles Row */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => {
            onUpdateDebugState({ ...debugState, showHitboxes: !debugState.showHitboxes });
            soundEngine.playSfx('click');
          }}
          className={`px-2 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-between transition ${
            debugState.showHitboxes
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-slate-800 text-slate-400 border-white/5'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5" />
            Hitboxes
          </span>
          <span className="text-[10px] font-mono">{debugState.showHitboxes ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={() => {
            onUpdateDebugState({ ...debugState, godMode: !debugState.godMode });
            soundEngine.playSfx('click');
          }}
          className={`px-2 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-between transition ${
            debugState.godMode
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-800 text-slate-400 border-white/5'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            God Mode
          </span>
          <span className="text-[10px] font-mono">{debugState.godMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Time Scale & Frame Stepper */}
      <div className="p-2.5 bg-slate-950 rounded-lg border border-white/5 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1">
            <FastForward className="w-3.5 h-3.5 text-cyan-400" />
            Time Scale: <strong className="font-mono text-cyan-300">{debugState.timeScale}x</strong>
          </span>
          <button
            onClick={onStepFrame}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-[11px] font-mono flex items-center gap-1"
          >
            <StepForward className="w-3 h-3 text-pink-400" />
            Step 1 Frame
          </button>
        </div>

        <div className="flex items-center gap-1">
          {[1.0, 0.5, 0.25, 0.1].map((scale) => (
            <button
              key={scale}
              onClick={() => {
                onUpdateDebugState({ ...debugState, timeScale: scale });
                soundEngine.playSfx('click');
              }}
              className={`flex-1 py-1 rounded text-[10px] font-mono border transition ${
                debugState.timeScale === scale
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                  : 'bg-slate-900 text-slate-400 border-white/5'
              }`}
            >
              {scale === 1 ? '1.0x (Normal)' : `${scale}x`}
            </button>
          ))}
        </div>
      </div>

      {/* Quick In-Game Action Cheats */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Quick State Manipulators:</div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleQuickCheat('score')}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 text-[11px] font-medium"
          >
            +1000 Score
          </button>
          <button
            onClick={() => handleQuickCheat('lives')}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 text-[11px] font-medium"
          >
            +3 Lives
          </button>
          <button
            onClick={() => handleQuickCheat('maxWeapon')}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/5 text-[11px] font-medium"
          >
            Max Weapon
          </button>
          <button
            onClick={() => handleQuickCheat('clearEnemies')}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-white/5 text-[11px] font-medium"
          >
            Clear Enemies
          </button>
        </div>
      </div>

      {/* Mini REPL Terminal */}
      <div className="p-2 bg-slate-950 rounded-lg border border-white/5 font-mono text-[10px]">
        <div className="text-slate-400 flex items-center gap-1 mb-1 font-bold">
          <Terminal className="w-3 h-3 text-emerald-400" />
          Engine Console REPL
        </div>
        <div className="h-16 overflow-y-auto space-y-0.5 text-slate-400 mb-1.5 select-text">
          {replLogs.map((log, i) => (
            <div key={i} className={log.startsWith('>') ? 'text-cyan-300' : log.startsWith('!') ? 'text-rose-400' : 'text-slate-300'}>
              {log}
            </div>
          ))}
        </div>
        <form onSubmit={handleExecuteRepl} className="flex items-center gap-1">
          <input
            type="text"
            value={replInput}
            onChange={(e) => setReplInput(e.target.value)}
            placeholder="engine.player.x = 200..."
            className="flex-1 bg-slate-900 border border-white/10 rounded px-1.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-[10px]"
          />
          <button
            type="submit"
            className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold text-[10px]"
          >
            Run
          </button>
        </form>
      </div>
    </div>
  );
};
