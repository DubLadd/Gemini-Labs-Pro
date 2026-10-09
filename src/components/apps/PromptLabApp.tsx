import React, { useState } from 'react';
import { soundEngine } from '../../utils/audio';
import { Play, Copy, Check, Sparkles, Sliders } from 'lucide-react';

export const PromptLabApp: React.FC<{ onShowToast?: (title: string, msg: string) => void }> = ({ onShowToast }) => {
  const [model, setModel] = useState('gemini-3-exp');
  const [temperature, setTemperature] = useState(0.7);
  const [prompt, setPrompt] = useState(
    'Design a speculative user interface for an autonomous robotic probe operating in Jovian orbit, factoring in high radiation telemetry.'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [tokenCount, setTokenCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleExecute = () => {
    soundEngine.playSfx('click');
    setIsGenerating(true);
    setOutput(null);

    const generatedResponse = `### [Orbital Probe Telemetry & Sensor Architecture]

**Target Orbit:** Jupiter Equatorial L2 Lagrange Point  
**Radiation Hardening:** 300 kRad Si-shielded optical HUD  
**Inference Engine:** Edge-Optimized Neural Navigation Layer  

#### 1. Sensor Fusion Pipeline
* **Jovian Flux Magnetometer:** Tri-axial magnetic field gradient vector monitor sampling at 240 Hz with auto-null calibration.
* **Radiation Hardened Micro-OLED:** High-contrast 1200 cd/m² monochrome amber display configured to prevent cosmic ray burn-in.
* **Sub-Millisecond Star Tracker:** Relativistic aberration compensation dynamically mapped to onboard inertial ring gyros.

#### 2. Speculative Interface Specification
\`\`\`typescript
interface JovianProbeTelemetry {
  readonly epochSeconds: number;
  readonly magnetopauseProximityKm: number;
  readonly trappedProtonFlux_MeV: number;
  readonly reactionWheelSpeeds: [number, number, number, number];
  readonly autonomousSafeModeEngaged: boolean;
}
\`\`\`

#### 3. Real-Time Telemetry Matrix
* Core System Status: **NOMINAL (Sub-system B active)**
* Reaction Wheel RPM: **3,420 ± 4 RPM**
* Optical Uplink to Earth: **8.4 GHz Ka-Band (Latency 42m 18s)**
* Neural Guidance Drift: **<0.002 milliradians/hr**`;

    setTimeout(() => {
      setIsGenerating(false);
      setOutput(generatedResponse);
      setTokenCount(286);
      soundEngine.playSfx('success');
      if (onShowToast) onShowToast('Inference Complete', 'Synthesized 286 tokens via Gemini 3 Experimental.');
    }, 850);
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).catch(() => {});
    setCopied(true);
    soundEngine.playSfx('click');
    setTimeout(() => setCopied(false), 2000);
    if (onShowToast) onShowToast('Copied', 'Prompt output copied to clipboard.');
  };

  return (
    <div className="flex-1 flex flex-col h-full p-4 overflow-hidden bg-slate-950/70 select-text">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-white/10 gap-2 shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-300">Model:</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-white/10 border border-white/15 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
          >
            <option value="gemini-3-exp" className="bg-slate-900 text-slate-100">
              Gemini 3 Experimental (Labs Pro)
            </option>
            <option value="gemini-3-flash" className="bg-slate-900 text-slate-100">
              Gemini 3 Flash (Fast Inference)
            </option>
            <option value="imagen-3" className="bg-slate-900 text-slate-100">
              Imagen 3 Vision Lab
            </option>
          </select>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>Temp: {temperature}</span>
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-20 accent-cyan-400 h-1 bg-slate-700 cursor-pointer"
          />
        </div>
      </div>

      {/* Main Split: Input vs Output */}
      <div className="flex-1 grid grid-rows-2 gap-3 overflow-hidden">
        {/* Input Box */}
        <div className="flex flex-col bg-white/5 border border-white/10 rounded-xl p-3 overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>System & User Prompt</span>
            </label>
            <span className="text-[10px] text-cyan-400 font-mono">Google Labs Inference</span>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter an experimental prompt..."
            className="flex-1 w-full bg-transparent text-xs text-white placeholder-slate-500 resize-none focus:outline-none font-mono leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() =>
                  setPrompt(
                    'Speculative architecture for a microgravity quantum computing array operating in vacuum.'
                  )
                }
                className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors"
              >
                + Microgravity spec
              </button>
              <button
                type="button"
                onClick={() =>
                  setPrompt(
                    'Create an ergonomic design system for cybernetic heads-up automotive displays.'
                  )
                }
                className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors"
              >
                + HUD Design
              </button>
            </div>

            <button
              onClick={handleExecute}
              disabled={isGenerating}
              className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-xs font-semibold text-white rounded-lg shadow flex items-center space-x-1.5 transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isGenerating ? 'Synthesizing...' : 'Execute Inference'}</span>
            </button>
          </div>
        </div>

        {/* Output Box */}
        <div className="flex flex-col bg-slate-900/90 border border-white/10 rounded-xl p-3 overflow-hidden">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-white/5 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span>Synthesized Response</span>
              {tokenCount > 0 && <span className="text-emerald-400">({tokenCount} tokens)</span>}
            </span>
            <div className="flex items-center space-x-2">
              {output && (
                <button
                  onClick={handleCopy}
                  className="hover:text-white flex items-center gap-1 transition-colors text-[10px]"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
              <span className={isGenerating ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}>
                {isGenerating ? 'Synthesizing token stream...' : 'Ready'}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto text-xs text-slate-200 font-mono leading-relaxed select-text space-y-2 pr-1">
            {isGenerating ? (
              <div className="flex items-center space-x-2 text-cyan-400 pt-4">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                <span>Generating tokens across neural weights...</span>
              </div>
            ) : output ? (
              <div className="whitespace-pre-wrap">{output}</div>
            ) : (
              <p className="text-slate-500 italic pt-2">
                Click &quot;Execute Inference&quot; above to stream the synthesized output from Google Labs models...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
