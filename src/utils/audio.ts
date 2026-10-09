// Audio utility powered by standard Web Audio API

class SoundEngine {
  private ctx: AudioContext | null = null;
  private volume: number = 0.8;
  private enabled: boolean = true;
  private synthLoopOsc: OscillatorNode | null = null;
  private synthGain: GainNode | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.synthGain && this.ctx) {
      this.synthGain.gain.setValueAtTime(0.08 * this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setEnabled(flag: boolean) {
    this.enabled = flag;
    if (!flag) {
      this.stopMusicFX();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public playSfx(type: 'click' | 'open' | 'minimize' | 'success' | 'agent' | 'keystroke' = 'click') {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);
        gain.gain.setValueAtTime(0.07 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'open') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(580, now + 0.12);
        gain.gain.setValueAtTime(0.09 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'minimize') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.08);
        gain.gain.setValueAtTime(0.08 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'success' || type === 'agent') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.06); // C#
        osc.frequency.setValueAtTime(659.25, now + 0.12); // E
        gain.gain.setValueAtTime(0.08 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'keystroke') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(750 + Math.random() * 150, now);
        gain.gain.setValueAtTime(0.02 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
        osc.start(now);
        osc.stop(now + 0.02);
      }
    } catch {
      // Audio context may require user interaction
    }
  }

  // Real audio synthesis for the MusicFX app
  public startMusicFX(bpm = 85) {
    if (!this.enabled) return;
    this.stopMusicFX();
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130.81, ctx.currentTime); // C3

      // Gentle LFO modulation
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(bpm / 60, ctx.currentTime);
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(200, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0.06 * this.volume, ctx.currentTime);
      osc.start();

      this.synthLoopOsc = osc;
      this.synthGain = gain;
    } catch {
      // Ignore
    }
  }

  public stopMusicFX() {
    if (this.synthLoopOsc) {
      try {
        this.synthLoopOsc.stop();
        this.synthLoopOsc.disconnect();
      } catch {
        // Already stopped
      }
      this.synthLoopOsc = null;
      this.synthGain = null;
    }
  }
}

export const soundEngine = new SoundEngine();
