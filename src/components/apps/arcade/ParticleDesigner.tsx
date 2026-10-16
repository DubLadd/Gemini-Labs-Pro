import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ParticleEmitterConfig } from './types';
import { DEFAULT_EMITTERS } from './defaults';
import {
  Sparkles,
  Play,
  RotateCcw,
  Sliders,
  Copy,
  Check,
  Plus,
  Flame,
} from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface ParticleDesignerProps {
  emitters: ParticleEmitterConfig[];
  onUpdateEmitters: (emitters: ParticleEmitterConfig[]) => void;
  onInjectEmitterToGame: (emitter: ParticleEmitterConfig) => void;
}

interface SimParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  startColor: string;
  endColor: string;
  startSize: number;
  endSize: number;
}

export const ParticleDesigner: React.FC<ParticleDesignerProps> = ({
  emitters,
  onUpdateEmitters,
  onInjectEmitterToGame,
}) => {
  const [selectedEmitterId, setSelectedEmitterId] = useState<string>(emitters[0]?.id || '');
  const [injectedSuccess, setInjectedSuccess] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<SimParticle[]>([]);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 300, y: 180 });
  const isMouseDownRef = useRef<boolean>(false);

  const activeEmitter = emitters.find((e) => e.id === selectedEmitterId) || emitters[0] || DEFAULT_EMITTERS[0];

  // Particle emission helper
  const spawnSimParticles = useCallback((x: number, y: number, count: number) => {
    const config = activeEmitter;
    for (let i = 0; i < count; i++) {
      const baseAngle = (config.angle * Math.PI) / 180;
      const spreadAngle = ((Math.random() - 0.5) * config.spread * Math.PI) / 180;
      const finalAngle = baseAngle + spreadAngle;
      const speed = config.speedMin + Math.random() * (config.speedMax - config.speedMin);

      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(finalAngle) * speed,
        vy: Math.sin(finalAngle) * speed,
        life: config.lifetime,
        maxLife: config.lifetime,
        startColor: config.startColor,
        endColor: config.endColor,
        startSize: config.startSize,
        endSize: config.endSize,
      });
    }
  }, [activeEmitter]);

  // Main animation canvas loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let spawnAccum = 0;

    const loop = (timestamp: number) => {
      const dt = Math.min(0.1, (timestamp - lastTime) / 1000);
      lastTime = timestamp;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Continuous emission if mouse down or auto pulsing
          spawnAccum += dt * activeEmitter.rate;
          if (spawnAccum >= 1) {
            const count = Math.floor(spawnAccum);
            spawnAccum -= count;
            spawnSimParticles(mousePosRef.current.x, mousePosRef.current.y, count);
          }

          // Clear
          ctx.fillStyle = '#05070f';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw grid lines
          ctx.strokeStyle = 'rgba(255,255,255,0.04)';
          ctx.lineWidth = 1;
          for (let x = 0; x < canvas.width; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }
          for (let y = 0; y < canvas.height; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }

          // Update & render particles
          const parts = particlesRef.current;
          for (let i = parts.length - 1; i >= 0; i--) {
            const p = parts[i];
            p.life -= dt;
            if (p.life <= 0) {
              parts.splice(i, 1);
              continue;
            }

            p.vx += activeEmitter.gravityX * dt;
            p.vy += activeEmitter.gravityY * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            const progress = 1 - p.life / p.maxLife;
            const currentSize = p.startSize + (p.endSize - p.startSize) * progress;

            ctx.save();
            if (activeEmitter.glow) {
              ctx.shadowBlur = 8;
              ctx.shadowColor = p.startColor;
            }
            ctx.fillStyle = progress < 0.5 ? p.startColor : p.endColor;
            ctx.globalAlpha = Math.max(0, 1 - progress);
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(0.5, currentSize), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Render emitter origin anchor marker
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(mousePosRef.current.x, mousePosRef.current.y, 6, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [activeEmitter, spawnSimParticles]);

  const updateParam = <K extends keyof ParticleEmitterConfig>(key: K, val: ParticleEmitterConfig[K]) => {
    const updated = emitters.map((e) => (e.id === activeEmitter.id ? { ...e, [key]: val } : e));
    onUpdateEmitters(updated);
  };

  const handleCreateNew = () => {
    const id = `emitter-${Date.now().toString(36)}`;
    const newConfig: ParticleEmitterConfig = {
      id,
      name: `Custom FX ${emitters.length + 1}`,
      rate: 30,
      speedMin: 60,
      speedMax: 200,
      angle: 270,
      spread: 60,
      lifetime: 0.6,
      gravityX: 0,
      gravityY: 100,
      startColor: '#f43f5e',
      endColor: '#fbbf24',
      startSize: 3,
      endSize: 1,
      glow: true,
    };
    onUpdateEmitters([...emitters, newConfig]);
    setSelectedEmitterId(id);
    soundEngine.playSfx('open');
  };

  const handleInject = () => {
    onInjectEmitterToGame(activeEmitter);
    setInjectedSuccess(true);
    soundEngine.playSfx('success');
    setTimeout(() => setInjectedSuccess(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`engine.spawnCustomEmitter('${activeEmitter.id}', x, y);`);
    setCopiedCode(true);
    soundEngine.playSfx('click');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-950 select-none">
      {/* Left Sidebar: Emitter Presets List */}
      <div className="w-full md:w-64 border-r border-white/10 bg-slate-900/80 flex flex-col shrink-0">
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs text-white uppercase tracking-wider">Emitter FX Library</span>
          </div>
          <button
            onClick={handleCreateNew}
            className="p-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {emitters.map((e) => {
            const isSelected = e.id === selectedEmitterId;
            return (
              <div
                key={e.id}
                onClick={() => {
                  setSelectedEmitterId(e.id);
                  soundEngine.playSfx('click');
                }}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-500 text-white shadow-sm'
                    : 'bg-slate-900 border-white/5 text-slate-300 hover:border-white/20 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">{e.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Rate: {e.rate}/s • Spread: {e.spread}°
                  </div>
                </div>
                <div
                  className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                  style={{ backgroundColor: e.startColor }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Center: Live Simulation Canvas & Parameters */}
      <div className="flex-1 flex flex-col p-4 overflow-y-auto bg-slate-950/90 gap-4">
        {/* Interactive Emitter Viewport */}
        <div className="relative w-full aspect-[21/9] min-h-[220px] bg-black border-2 border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/10 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={640}
            height={260}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              mousePosRef.current = {
                x: ((e.clientX - rect.left) / rect.width) * 640,
                y: ((e.clientY - rect.top) / rect.height) * 260,
              };
            }}
            onClick={() => {
              spawnSimParticles(mousePosRef.current.x, mousePosRef.current.y, 40);
              soundEngine.playSfx('click');
            }}
            className="w-full h-full block cursor-crosshair"
          />
          <div className="absolute top-2 left-3 text-[10px] font-mono text-slate-400 pointer-events-none bg-black/60 px-2 py-0.5 rounded border border-white/10">
            Click canvas to trigger particle burst! Drag to position emitter anchor.
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Rate */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Emission Rate</span>
              <span className="font-mono text-amber-400">{activeEmitter.rate} / sec</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={activeEmitter.rate}
              onChange={(e) => updateParam('rate', parseInt(e.target.value, 10))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Spread Angle */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Spread Cone Angle</span>
              <span className="font-mono text-amber-400">{activeEmitter.spread}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="5"
              value={activeEmitter.spread}
              onChange={(e) => updateParam('spread', parseInt(e.target.value, 10))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Direction Angle */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Direction Angle</span>
              <span className="font-mono text-amber-400">{activeEmitter.angle}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="5"
              value={activeEmitter.angle}
              onChange={(e) => updateParam('angle', parseInt(e.target.value, 10))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Speed Max */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Max Velocity</span>
              <span className="font-mono text-amber-400">{activeEmitter.speedMax} px/s</span>
            </div>
            <input
              type="range"
              min="20"
              max="500"
              step="10"
              value={activeEmitter.speedMax}
              onChange={(e) => updateParam('speedMax', parseInt(e.target.value, 10))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Gravity Y */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Gravity Force</span>
              <span className="font-mono text-amber-400">{activeEmitter.gravityY}</span>
            </div>
            <input
              type="range"
              min="-300"
              max="400"
              step="10"
              value={activeEmitter.gravityY}
              onChange={(e) => updateParam('gravityY', parseInt(e.target.value, 10))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Lifetime */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-white/10">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Particle Lifetime</span>
              <span className="font-mono text-amber-400">{activeEmitter.lifetime.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.05"
              value={activeEmitter.lifetime}
              onChange={(e) => updateParam('lifetime', parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
        </div>

        {/* Color Palette Knobs */}
        <div className="flex items-center gap-4 bg-slate-900/80 p-3 rounded-xl border border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">Start Color:</span>
            <input
              type="color"
              value={activeEmitter.startColor}
              onChange={(e) => updateParam('startColor', e.target.value)}
              className="w-6 h-6 rounded cursor-pointer bg-transparent border border-white/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">End Color:</span>
            <input
              type="color"
              value={activeEmitter.endColor}
              onChange={(e) => updateParam('endColor', e.target.value)}
              className="w-6 h-6 rounded cursor-pointer bg-transparent border border-white/20"
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={activeEmitter.glow}
              onChange={(e) => updateParam('glow', e.target.checked)}
              className="accent-amber-500"
            />
            Neon Glow Bloom Effect
          </label>
        </div>
      </div>

      {/* Right Sidebar: Actions */}
      <div className="w-full md:w-72 border-l border-white/10 bg-slate-900/80 p-4 flex flex-col justify-between shrink-0">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Particle Engine Hook
          </h4>

          <div className="p-3 bg-slate-950 rounded-xl border border-white/5 font-mono text-[11px] space-y-2 text-slate-400">
            <div className="text-amber-300 font-bold">// Trigger in Game Loop:</div>
            <div className="bg-slate-900 p-2 rounded text-amber-200 break-all select-all">
              engine.spawnCustomEmitter('{activeEmitter.id}', x, y);
            </div>
            <button
              onClick={handleCopyCode}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs flex items-center justify-center gap-1.5"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Copied to Clipboard!' : 'Copy Invocation Code'}
            </button>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <button
            onClick={handleInject}
            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
              injectedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/20'
            }`}
          >
            {injectedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                Emitter Injected into Engine!
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Register in Active Game Engine
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
