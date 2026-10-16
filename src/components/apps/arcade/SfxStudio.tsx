import React, { useState, useRef, useEffect } from 'react';
import { SfxPreset } from './types';
import { DEFAULT_SFX_PRESETS } from './defaults';
import {
  Volume2,
  Play,
  RotateCcw,
  Sparkles,
  Download,
  Plus,
  Check,
  Music,
  Sliders,
  Copy,
} from 'lucide-react';
import { soundEngine } from '../../../utils/audio';

interface SfxStudioProps {
  sfxList: SfxPreset[];
  onUpdateSfxList: (list: SfxPreset[]) => void;
  onInjectSfxToGame: (sfx: SfxPreset) => void;
}

export const SfxStudio: React.FC<SfxStudioProps> = ({
  sfxList,
  onUpdateSfxList,
  onInjectSfxToGame,
}) => {
  const [selectedSfxId, setSelectedSfxId] = useState<string>(sfxList[0]?.id || '');
  const [injectedSuccess, setInjectedSuccess] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const activeSfx = sfxList.find((s) => s.id === selectedSfxId) || sfxList[0] || DEFAULT_SFX_PRESETS[0];

  // Play custom synth sound with Web Audio API
  const playSynthesizerSound = (preset: SfxPreset) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const duration = Math.max(0.05, preset.duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(preset.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      gain.connect(ctx.destination);

      if (preset.waveform === 'noise') {
        // Noise buffer generator
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Bandpass filter to sculpt noise tone
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(preset.startFreq, now);
        filter.frequency.exponentialRampToValueAtTime(Math.max(20, preset.endFreq), now + duration);

        noise.connect(filter);
        filter.connect(gain);
        noise.start(now);
        noise.stop(now + duration);
      } else {
        const osc = ctx.createOscillator();
        osc.type = preset.waveform as OscillatorType;

        // Frequency sweep
        osc.frequency.setValueAtTime(Math.max(20, preset.startFreq), now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, preset.endFreq), now + duration);

        // Vibrato LFO if enabled
        if (preset.vibratoDepth > 0 && preset.vibratoFreq > 0) {
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.setValueAtTime(preset.vibratoFreq, now);
          lfoGain.gain.setValueAtTime(preset.vibratoDepth, now);
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start(now);
          lfo.stop(now + duration);
        }

        osc.connect(gain);
        osc.start(now);
        osc.stop(now + duration);
      }

      // Draw oscilloscope pulse animation
      renderWaveformVisual(preset);
    } catch (err) {
      console.error('Audio synthesizer error:', err);
    }
  };

  const renderWaveformVisual = (preset: SfxPreset) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const w = canvas.width;
    const h = canvas.height;
    const points = 100;

    for (let i = 0; i < points; i++) {
      const t = i / points;
      const freq = preset.startFreq + (preset.endFreq - preset.startFreq) * t;
      const amp = Math.sin((t * freq * 0.1) % (Math.PI * 2)) * (1 - t) * (h / 2.5);
      const y = h / 2 + amp;
      const x = t * w;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const updateActiveParam = <K extends keyof SfxPreset>(key: K, val: SfxPreset[K]) => {
    const updated = sfxList.map((s) => (s.id === activeSfx.id ? { ...s, [key]: val } : s));
    onUpdateSfxList(updated);
  };

  const handleCreateNewSfx = () => {
    const id = `sfx-${Date.now().toString(36)}`;
    const newPreset: SfxPreset = {
      id,
      name: `Custom SFX ${sfxList.length + 1}`,
      type: 'laser',
      waveform: 'square',
      startFreq: 600,
      endFreq: 200,
      duration: 0.15,
      decay: 0.12,
      vibratoFreq: 0,
      vibratoDepth: 0,
      volume: 0.2,
    };
    onUpdateSfxList([...sfxList, newPreset]);
    setSelectedSfxId(id);
    soundEngine.playSfx('open');
  };

  const handleInject = () => {
    onInjectSfxToGame(activeSfx);
    setInjectedSuccess(true);
    soundEngine.playSfx('success');
    setTimeout(() => setInjectedSuccess(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(`engine.playCustomSfx('${activeSfx.id}');`);
    setCopiedCode(true);
    soundEngine.playSfx('click');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-950 select-none">
      {/* Left Sidebar: SFX Presets List */}
      <div className="w-full md:w-64 border-r border-white/10 bg-slate-900/80 flex flex-col shrink-0">
        <div className="p-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-xs text-white uppercase tracking-wider">Audio Bank</span>
          </div>
          <button
            onClick={handleCreateNewSfx}
            className="p-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {sfxList.map((s) => {
            const isSelected = s.id === selectedSfxId;
            return (
              <div
                key={s.id}
                onClick={() => {
                  setSelectedSfxId(s.id);
                  playSynthesizerSound(s);
                }}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-sm'
                    : 'bg-slate-900 border-white/5 text-slate-300 hover:border-white/20 hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">{s.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {s.waveform.toUpperCase()} • {Math.round(s.startFreq)}Hz → {Math.round(s.endFreq)}Hz
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playSynthesizerSound(s);
                  }}
                  className="p-1.5 rounded-md bg-slate-800 hover:bg-cyan-600 text-cyan-300 hover:text-white"
                  title="Play"
                >
                  <Play className="w-3 h-3 fill-current" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center: Synthesizer Knobs & Waveform Controls */}
      <div className="flex-1 flex flex-col p-5 overflow-y-auto bg-slate-950/90 gap-4">
        {/* Top Waveform Oscilloscope Visualizer */}
        <div className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center relative shadow-lg">
          <canvas
            ref={canvasRef}
            width={600}
            height={90}
            className="w-full h-24 bg-black/60 rounded-xl border border-white/10"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => playSynthesizerSound(activeSfx)}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Test Synthesizer SFX
            </button>
            <span className="text-[11px] font-mono text-slate-400">
              Duration: {(activeSfx.duration * 1000).toFixed(0)}ms
            </span>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Waveform Selector */}
          <div className="p-4 bg-slate-900/80 rounded-xl border border-white/10">
            <div className="text-xs font-semibold text-slate-200 mb-2">Oscillator Waveform</div>
            <div className="grid grid-cols-3 gap-1.5">
              {(['square', 'sawtooth', 'triangle', 'sine', 'noise'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => {
                    updateActiveParam('waveform', w);
                    playSynthesizerSound({ ...activeSfx, waveform: w });
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono capitalize border transition ${
                    activeSfx.waveform === w
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60'
                      : 'bg-slate-800 text-slate-400 border-white/5 hover:text-white'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Volume */}
          <div className="p-4 bg-slate-900/80 rounded-xl border border-white/10">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Master Gain Volume</span>
              <span className="font-mono text-cyan-400">{Math.round(activeSfx.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.01"
              value={activeSfx.volume}
              onChange={(e) => updateActiveParam('volume', parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Start Frequency */}
          <div className="p-4 bg-slate-900/80 rounded-xl border border-white/10">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Start Frequency</span>
              <span className="font-mono text-cyan-400">{Math.round(activeSfx.startFreq)} Hz</span>
            </div>
            <input
              type="range"
              min="40"
              max="2400"
              step="10"
              value={activeSfx.startFreq}
              onChange={(e) => updateActiveParam('startFreq', parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* End Frequency */}
          <div className="p-4 bg-slate-900/80 rounded-xl border border-white/10">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>End Frequency (Slide)</span>
              <span className="font-mono text-cyan-400">{Math.round(activeSfx.endFreq)} Hz</span>
            </div>
            <input
              type="range"
              min="20"
              max="2400"
              step="10"
              value={activeSfx.endFreq}
              onChange={(e) => updateActiveParam('endFreq', parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Duration */}
          <div className="p-4 bg-slate-900/80 rounded-xl border border-white/10">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Sound Duration</span>
              <span className="font-mono text-cyan-400">{(activeSfx.duration * 1000).toFixed(0)} ms</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.01"
              value={activeSfx.duration}
              onChange={(e) => updateActiveParam('duration', parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Vibrato Depth */}
          <div className="p-4 bg-slate-900/80 rounded-xl border border-white/10">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Vibrato Frequency Modulation</span>
              <span className="font-mono text-cyan-400">{activeSfx.vibratoDepth} Depth</span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="5"
              value={activeSfx.vibratoDepth}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                const updated = sfxList.map((s) =>
                  s.id === activeSfx.id ? { ...s, vibratoDepth: val, vibratoFreq: val > 0 ? 16 : 0 } : s
                );
                onUpdateSfxList(updated);
              }}
              className="w-full accent-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Right Sidebar: Engine Actions */}
      <div className="w-full md:w-72 border-l border-white/10 bg-slate-900/80 p-4 flex flex-col justify-between shrink-0">
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            Engine Sound Bank
          </h4>

          <div className="p-3 bg-slate-950 rounded-xl border border-white/5 font-mono text-[11px] space-y-2 text-slate-400">
            <div className="text-cyan-300 font-bold">// Trigger in Game Loop:</div>
            <div className="bg-slate-900 p-2 rounded text-cyan-200 break-all select-all">
              engine.playCustomSfx('{activeSfx.id}');
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
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-cyan-500/20'
            }`}
          >
            {injectedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                SFX Injected into Game Engine!
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
