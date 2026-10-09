// Web Audio DSP Engine for Google Flow Music
// Multi-Genre Synthesis: Techno, Stone Techno, Industrial Techno, DnB, Dubstep,
// Trap Phonk, Lo-Fi, Chill, Hip Hop, Grunge, Synthwave
// DSP Chain: Distortion, Haunted Flanger, Dub Delay, Echo/Reverb, Bounce Drop Riser

export type FlowGenre =
  | 'techno'
  | 'stone_techno'
  | 'industrial_techno'
  | 'dnb'
  | 'dubstep'
  | 'trap_phonk'
  | 'lofi'
  | 'chill'
  | 'hiphop'
  | 'grunge'
  | 'synthwave'
  | 'electronic';

export interface GenreInfo {
  id: FlowGenre;
  name: string;
  defaultBpm: number;
  description: string;
  color: string;
  tags: string[];
}

export const FLOW_GENRES: Record<FlowGenre, GenreInfo> = {
  techno: {
    id: 'techno',
    name: 'Techno',
    defaultBpm: 130,
    description: 'Relentless 4/4 kicks, hypnotic ride cymbals, dark resonance',
    color: 'from-blue-600 to-indigo-700',
    tags: ['4/4 Kick', 'Hypnotic', 'Berlin Club', 'Dark Rumble'],
  },
  stone_techno: {
    id: 'stone_techno',
    name: 'Stone Techno',
    defaultBpm: 136,
    description: 'Earthy raw polyrhythmic metallic textures, cavernous rumble',
    color: 'from-stone-500 to-zinc-700',
    tags: ['Metallic Clangs', 'Cavern Reverb', 'Polyrhythmic', 'Earthy Rumble'],
  },
  industrial_techno: {
    id: 'industrial_techno',
    name: 'Industrial Techno',
    defaultBpm: 142,
    description: 'Crushed warehouse kicks, steel percussion, aggressive overdrive',
    color: 'from-red-600 to-orange-700',
    tags: ['Distorted 909', 'Hardcore Overdrive', 'Steel Hits', 'Warehouse'],
  },
  dnb: {
    id: 'dnb',
    name: 'Drum & Bass',
    defaultBpm: 174,
    description: 'High-speed syncopated breaks, reese bass glide, sub-bass pressure',
    color: 'from-amber-500 to-red-600',
    tags: ['174 BPM', 'Amen Rollers', 'Reese Glide', 'Sub Pressure'],
  },
  dubstep: {
    id: 'dubstep',
    name: 'Dubstep',
    defaultBpm: 140,
    description: 'Half-time punchy kick-snare, LFO wobble growls, sub drops',
    color: 'from-purple-600 to-pink-600',
    tags: ['Half-Time', 'LFO Wobble', 'Sub Impact', 'Heavy Snare'],
  },
  trap_phonk: {
    id: 'trap_phonk',
    name: 'Trap Phonk Mutation',
    defaultBpm: 145,
    description: 'Memphis 808 tuned cowbells, sliding sub bass, pitch drift',
    color: 'from-emerald-600 to-cyan-700',
    tags: ['808 Cowbell', 'Drift Phonk', 'Sliding 808', 'Tape Saturation'],
  },
  lofi: {
    id: 'lofi',
    name: 'Lo-Fi',
    defaultBpm: 84,
    description: 'Dusty vinyl warmth, mellow Rhodes chords, relaxed swing drums',
    color: 'from-teal-600 to-emerald-800',
    tags: ['Vinyl Crackle', 'Mellow Rhodes', 'Swing Groove', 'Tape Flutter'],
  },
  chill: {
    id: 'chill',
    name: 'Chill / Downtempo',
    defaultBpm: 90,
    description: 'Atmospheric airy pads, gentle rimshots, spatial deep reverb',
    color: 'from-sky-500 to-blue-700',
    tags: ['Ambient Pads', 'Gentle Groove', 'Space Echo', 'Ethereal'],
  },
  hiphop: {
    id: 'hiphop',
    name: 'Rap / Hip Hop',
    defaultBpm: 94,
    description: 'Classic boom-bap / modern trap groove, snappy 808 claps & rolls',
    color: 'from-yellow-500 to-amber-700',
    tags: ['Boom Bap', 'Snappy Clap', 'Hi-Hat Rolls', '808 Stabs'],
  },
  grunge: {
    id: 'grunge',
    name: 'Grunge',
    defaultBpm: 116,
    description: 'Raw dirty overdrive, sludgy grunge bass, aggressive attitude',
    color: 'from-rose-600 to-stone-800',
    tags: ['Sludge Bass', 'Fuzz Distortion', 'Room Acoustics', 'Raw Attitude'],
  },
  synthwave: {
    id: 'synthwave',
    name: 'Synthwave',
    defaultBpm: 118,
    description: 'Analog saw arpeggios, gated 80s snare, neon cyber basslines',
    color: 'from-fuchsia-500 to-rose-600',
    tags: ['Neon Arp', 'Gated Snare', '80s Saw Bass', 'Analog Warmth'],
  },
  electronic: {
    id: 'electronic',
    name: 'Electronic',
    defaultBpm: 128,
    description: 'Modern punchy modular sequences, crisp transients, bright leads',
    color: 'from-violet-500 to-purple-700',
    tags: ['Modular Lead', 'Punchy Kick', 'Crisp Transient', 'Bright Pulse'],
  },
};

export interface TrackSequence {
  id: string;
  name: string;
  type: 'kick' | 'snare' | 'hihat' | 'bass' | 'lead' | 'perc';
  color: string;
  steps: boolean[];
  volume: number;
  isMuted: boolean;
  isSolo: boolean;
}

export interface FxSettings {
  distortion: number; // 0 to 100
  hauntedFlanger: number; // 0 to 100
  dubDelay: number; // 0 to 100
  echoReverb: number; // 0 to 100
  filterCutoff: number; // 200 to 18000
  subBassPunch: number; // 0 to 100
}

class FlowAudioEngine {
  private ctx: AudioContext | null = null;
  private isRunning = false;
  private masterGain: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private distortionNode: WaveShaperNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private delayFilterNode: BiquadFilterNode | null = null;
  private delayDryGain: GainNode | null = null;
  private delayWetGain: GainNode | null = null;

  // Haunted Flanger nodes
  private flangerDelayNode: DelayNode | null = null;
  private flangerFeedbackGain: GainNode | null = null;
  private flangerLfo: OscillatorNode | null = null;
  private flangerLfoGain: GainNode | null = null;
  private flangerWetGain: GainNode | null = null;

  // Frequency Analyser & Audio Reactivity
  private analyserNode: AnalyserNode | null = null;
  private fftDataArray: Uint8Array | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micGain: GainNode | null = null;

  // Recording
  private mediaDest: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;

  // Sequencer scheduler state
  private bpm = 128;
  private currentStep = 0;
  private lookaheadMs = 25.0;
  private scheduleAheadSec = 0.1;
  private nextStepTime = 0.0;
  private timerId: number | null = null;
  private onStepCallback: ((step: number) => void) | null = null;
  private tracksRef: TrackSequence[] = [];
  private activeGenres: FlowGenre[] = ['techno'];

  // Current FX values
  private currentFx: FxSettings = {
    distortion: 15,
    hauntedFlanger: 0,
    dubDelay: 25,
    echoReverb: 30,
    filterCutoff: 16000,
    subBassPunch: 50,
  };

  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.buildAudioGraph();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private buildAudioGraph() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    // Master Gain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.85, ctx.currentTime);

    // Master Lowpass Filter
    this.filterNode = ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.setValueAtTime(this.currentFx.filterCutoff, ctx.currentTime);
    this.filterNode.Q.setValueAtTime(2.0, ctx.currentTime);

    // Distortion WaveShaper
    this.distortionNode = ctx.createWaveShaper();
    this.updateDistortionCurve(this.currentFx.distortion);

    // Dub Delay Section
    this.delayNode = ctx.createDelay(2.0);
    this.delayNode.delayTime.setValueAtTime((60 / this.bpm) * 0.5, ctx.currentTime); // 8th note delay
    this.delayFeedbackGain = ctx.createGain();
    this.delayFeedbackGain.gain.setValueAtTime(0.45, ctx.currentTime);
    this.delayFilterNode = ctx.createBiquadFilter();
    this.delayFilterNode.type = 'lowpass';
    this.delayFilterNode.frequency.setValueAtTime(2800, ctx.currentTime); // warm tape filter

    this.delayDryGain = ctx.createGain();
    this.delayWetGain = ctx.createGain();
    this.delayWetGain.gain.setValueAtTime(0.25, ctx.currentTime);

    // Haunted Flanger Section
    this.flangerDelayNode = ctx.createDelay(0.05);
    this.flangerDelayNode.delayTime.setValueAtTime(0.007, ctx.currentTime);
    this.flangerFeedbackGain = ctx.createGain();
    this.flangerFeedbackGain.gain.setValueAtTime(-0.65, ctx.currentTime); // Phase inverted for eerie comb filter
    this.flangerWetGain = ctx.createGain();
    this.flangerWetGain.gain.setValueAtTime(0.0, ctx.currentTime);

    // Flanger LFO
    this.flangerLfo = ctx.createOscillator();
    this.flangerLfo.type = 'sine';
    this.flangerLfo.frequency.setValueAtTime(0.6, ctx.currentTime); // 0.6 Hz spooky slow cycle
    this.flangerLfoGain = ctx.createGain();
    this.flangerLfoGain.gain.setValueAtTime(0.004, ctx.currentTime);

    this.flangerLfo.connect(this.flangerLfoGain);
    this.flangerLfoGain.connect(this.flangerDelayNode.delayTime);
    this.flangerLfo.start();

    // Feedback loops
    // Delay feedback
    this.delayNode.connect(this.delayFilterNode);
    this.delayFilterNode.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);
    this.delayFilterNode.connect(this.delayWetGain);

    // Flanger feedback
    this.flangerDelayNode.connect(this.flangerFeedbackGain);
    this.flangerFeedbackGain.connect(this.flangerDelayNode);
    this.flangerDelayNode.connect(this.flangerWetGain);

    // Signal routing:
    // Sources -> Filter -> Distortion -> [Dry + Delay + Flanger] -> MasterGain -> Destination
    this.filterNode.connect(this.distortionNode);

    // Dry path
    this.distortionNode.connect(this.delayDryGain);
    this.delayDryGain.connect(this.masterGain);

    // Delay send
    this.distortionNode.connect(this.delayNode);
    this.delayWetGain.connect(this.masterGain);

    // Flanger send
    this.distortionNode.connect(this.flangerDelayNode);
    this.flangerWetGain.connect(this.masterGain);

    // Frequency Analyser Node for Audio Frequency Visualization & Reactive ASCII Pulsing
    try {
      this.analyserNode = ctx.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.8;
      this.fftDataArray = new Uint8Array(this.analyserNode.frequencyBinCount);

      // Signal routing: MasterGain -> Analyser -> Speakers
      this.masterGain.connect(this.analyserNode);
      this.analyserNode.connect(ctx.destination);
    } catch {
      // Fallback
      this.masterGain.connect(ctx.destination);
    }

    // Media stream destination for recording
    try {
      this.mediaDest = ctx.createMediaStreamDestination();
      this.masterGain.connect(this.mediaDest);
    } catch {
      // Ignore if not supported in test environment
    }
  }

  private updateDistortionCurve(amount: number) {
    if (!this.distortionNode || !this.ctx) return;
    if (amount <= 2) {
      this.distortionNode.curve = null;
      return;
    }
    const k = amount * 1.5;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    this.distortionNode.curve = curve;
    this.distortionNode.oversample = '4x';
  }

  public setFx(newFx: Partial<FxSettings>) {
    this.currentFx = { ...this.currentFx, ...newFx };
    const ctx = this.ctx;
    if (!ctx) return;

    if (newFx.distortion !== undefined) {
      this.updateDistortionCurve(this.currentFx.distortion);
    }

    if (newFx.filterCutoff !== undefined && this.filterNode) {
      this.filterNode.frequency.setTargetAtTime(Math.max(200, Math.min(20000, newFx.filterCutoff)), ctx.currentTime, 0.05);
    }

    if (newFx.dubDelay !== undefined && this.delayWetGain && this.delayFeedbackGain) {
      const wet = (newFx.dubDelay / 100) * 0.7;
      this.delayWetGain.gain.setTargetAtTime(wet, ctx.currentTime, 0.05);
      this.delayFeedbackGain.gain.setTargetAtTime(0.2 + (newFx.dubDelay / 100) * 0.5, ctx.currentTime, 0.05);
    }

    if (newFx.hauntedFlanger !== undefined && this.flangerWetGain && this.flangerLfoGain) {
      const flangeWet = (newFx.hauntedFlanger / 100) * 0.85;
      this.flangerWetGain.gain.setTargetAtTime(flangeWet, ctx.currentTime, 0.05);
      this.flangerLfoGain.gain.setTargetAtTime(0.002 + (newFx.hauntedFlanger / 100) * 0.005, ctx.currentTime, 0.05);
    }
  }

  public setBpm(newBpm: number) {
    this.bpm = Math.max(50, Math.min(220, newBpm));
    if (this.delayNode && this.ctx) {
      const delayTime = (60 / this.bpm) * 0.5;
      this.delayNode.delayTime.setTargetAtTime(delayTime, this.ctx.currentTime, 0.1);
    }
  }

  public getBpm(): number {
    return this.bpm;
  }

  public setMasterVolume(val: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1.5, val)), this.ctx.currentTime, 0.05);
    }
  }

  // BOUNCE DROP TRIGGER: dramatic pitch riser, sub plunge, and filter sweep explosion
  public triggerBounceDrop(onComplete?: () => void) {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const riserDuration = 2.4;

    // 1. White Noise Riser Sweep
    const bufferSize = ctx.sampleRate * riserDuration;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.Q.setValueAtTime(4.0, now);
    noiseFilter.frequency.setValueAtTime(250, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(8000, now + riserDuration);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.01, now);
    noiseGain.gain.linearRampToValueAtTime(0.4, now + riserDuration);
    noiseGain.gain.setValueAtTime(0.0, now + riserDuration + 0.05);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.filterNode || ctx.destination);
    noise.start(now);

    // 2. Rising Pitch Oscillator Siren
    const siren = ctx.createOscillator();
    siren.type = 'sawtooth';
    siren.frequency.setValueAtTime(110, now);
    siren.frequency.exponentialRampToValueAtTime(960, now + riserDuration);

    const sirenGain = ctx.createGain();
    sirenGain.gain.setValueAtTime(0.02, now);
    sirenGain.gain.linearRampToValueAtTime(0.25, now + riserDuration);
    sirenGain.gain.setValueAtTime(0.0, now + riserDuration + 0.02);

    siren.connect(sirenGain);
    sirenGain.connect(this.filterNode || ctx.destination);
    siren.start(now);
    siren.stop(now + riserDuration + 0.05);

    // 3. THE DROP (Sub explosion + Filter Snap at now + riserDuration)
    const dropTime = now + riserDuration;
    setTimeout(() => {
      // Sub impact kick
      this.playKick('dubstep', 0.95);
      this.playBass(45, 1.2, 'dubstep');
      
      // Filter snap
      if (this.filterNode && this.ctx) {
        this.filterNode.frequency.setValueAtTime(300, dropTime);
        this.filterNode.frequency.exponentialRampToValueAtTime(this.currentFx.filterCutoff, dropTime + 0.5);
      }
      if (onComplete) onComplete();
    }, riserDuration * 1000);
  }

  // --- Real DSP Drum Voices ---

  public playKick(genre: FlowGenre = 'techno', velocity = 0.8) {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(this.filterNode || ctx.destination);

    if (genre === 'industrial_techno' || genre === 'stone_techno') {
      // Hard distorted warehouse kick with high transient punch
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

      gain.gain.setValueAtTime(velocity * 0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);

      // Add click attack
      this.playTransientClick(now, 1200, 0.015, velocity * 0.6);
    } else if (genre === 'trap_phonk') {
      // Booming 808 sub kick
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(36, now + 0.14);

      gain.gain.setValueAtTime(velocity * 0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65); // long 808 decay
      osc.start(now);
      osc.stop(now + 0.65);
    } else if (genre === 'dnb') {
      // Punchy, tight 174 BPM kick
      osc.type = 'sine';
      osc.frequency.setValueAtTime(190, now);
      osc.frequency.exponentialRampToValueAtTime(58, now + 0.08);

      gain.gain.setValueAtTime(velocity * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    } else if (genre === 'lofi') {
      // Muffled warm vintage kick
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.12);

      gain.gain.setValueAtTime(velocity * 0.65, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else {
      // Standard punchy 4/4 electronic kick
      osc.type = 'sine';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

      gain.gain.setValueAtTime(velocity * 0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);

      this.playTransientClick(now, 800, 0.01, velocity * 0.4);
    }
  }

  private playTransientClick(time: number, freq: number, duration: number, vol: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(gain);
    gain.connect(this.filterNode || this.ctx.destination);
    osc.start(time);
    osc.stop(time + duration);
  }

  public playSnare(genre: FlowGenre = 'techno', velocity = 0.75) {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    // 1. Noise component
    const noiseDuration = genre === 'dubstep' ? 0.35 : genre === 'lofi' ? 0.18 : 0.22;
    const bufferSize = Math.floor(ctx.sampleRate * noiseDuration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = genre === 'industrial_techno' ? 'bandpass' : 'highpass';
    noiseFilter.frequency.setValueAtTime(genre === 'industrial_techno' ? 1800 : 900, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(velocity * (genre === 'dubstep' ? 0.85 : 0.6), now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDuration);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.filterNode || ctx.destination);
    noiseSource.start(now);

    // 2. Body Tone
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = genre === 'grunge' ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(genre === 'dubstep' ? 220 : 185, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);

    oscGain.gain.setValueAtTime(velocity * 0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(oscGain);
    oscGain.connect(this.filterNode || ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playHiHat(open = false, velocity = 0.6) {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const duration = open ? 0.28 : 0.045;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(velocity * (open ? 0.55 : 0.45), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.filterNode || ctx.destination);
    noise.start(now);
  }

  // Iconic Trap Phonk 808 Cowbell or Stone Metal Percussion
  public playPerc(type: 'cowbell' | 'stone_clang' | 'vinyl_dust', velocity = 0.7) {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    if (type === 'cowbell') {
      // Dual square oscillators for the genuine Memphis Trap Phonk 808 Cowbell!
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'square';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc2.frequency.setValueAtTime(845.0, now); // Inharmonic high tone

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(980, now);
      filter.Q.setValueAtTime(3.5, now);

      gain.gain.setValueAtTime(velocity * 0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.filterNode || ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.25);
      osc2.stop(now + 0.25);
    } else if (type === 'stone_clang') {
      // Inharmonic metallic stone chime
      [740, 1120, 1680].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(velocity * (0.35 / (idx + 1)), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
        osc.connect(gain);
        gain.connect(this.filterNode || ctx.destination);
        osc.start(now);
        osc.stop(now + 0.38);
      });
    } else {
      // Vinyl Dust / Glitch
      this.playTransientClick(now, 2400 + Math.random() * 1000, 0.02, velocity * 0.25);
    }
  }

  // Bass Synthesizer with Reese, Wobble, Acid, or Phonk 808 Glide
  public playBass(freq: number, duration: number = 0.35, genre: FlowGenre = 'techno', velocity = 0.75) {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    if (genre === 'dnb') {
      // Reese Bass: 2 detuned saw oscillators
      [-6, 6].forEach((detune) => {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(detune, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, now);
        filter.Q.setValueAtTime(3.0, now);

        gain.gain.setValueAtTime(velocity * 0.3, now);
        gain.gain.linearRampToValueAtTime(velocity * 0.25, now + duration * 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.filterNode || ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
      });
    } else if (genre === 'dubstep') {
      // Dubstep Wobble: LFO modulated filter
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.Q.setValueAtTime(6.0, now);

      // Fast wobble LFO
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime((this.bpm / 60) * 4, now); // 16th wobble
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(800, now);

      filter.frequency.setValueAtTime(1000, now);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start(now);
      lfo.stop(now + duration);

      gain.gain.setValueAtTime(velocity * 0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.filterNode || ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } else if (genre === 'trap_phonk') {
      // 808 Sliding Sub Bass
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq * 1.05, now);
      osc.frequency.exponentialRampToValueAtTime(freq, now + 0.08); // pitch slide

      gain.gain.setValueAtTime(velocity * 0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 1.2);

      osc.connect(gain);
      gain.connect(this.filterNode || ctx.destination);
      osc.start(now);
      osc.stop(now + duration * 1.2);
    } else if (genre === 'grunge') {
      // Sludgy dirty fuzz bass
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(velocity * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.filterNode || ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } else {
      // Acid / Techno saw bass
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(350, now + duration * 0.6);
      filter.Q.setValueAtTime(4.5, now);

      gain.gain.setValueAtTime(velocity * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.filterNode || ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    }
  }

  // Lead / Melody Synthesizer (Keys / Chords / Arp)
  public playLead(freq: number, duration: number = 0.3, genre: FlowGenre = 'synthwave', velocity = 0.65) {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    if (genre === 'lofi') {
      // Warm Rhodes / Electric Piano
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now);

      gain.gain.setValueAtTime(velocity * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 1.4);
    } else if (genre === 'stone_techno') {
      // Resonant bell chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freq * 1.5, now);
      filter.Q.setValueAtTime(5.0, now);

      gain.gain.setValueAtTime(velocity * 0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    } else {
      // Synthwave / Electronic Saw
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.frequency.exponentialRampToValueAtTime(1100, now + duration);
      filter.Q.setValueAtTime(3.0, now);

      gain.gain.setValueAtTime(velocity * 0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.filterNode || ctx.destination);
    osc.start(now);
    osc.stop(now + duration * 1.5);
  }

  // --- Step Sequencer Scheduler ---

  public startSequencer(
    tracks: TrackSequence[],
    genres: FlowGenre[],
    onStep: (step: number) => void
  ) {
    this.getContext(); // Ensure audio context is running
    this.tracksRef = tracks;
    this.activeGenres = genres;
    this.onStepCallback = onStep;
    this.isRunning = true;
    this.currentStep = 0;
    this.nextStepTime = this.ctx!.currentTime + 0.05;

    this.scheduler();
  }

  public updateSequencerState(tracks: TrackSequence[], genres: FlowGenre[]) {
    this.tracksRef = tracks;
    this.activeGenres = genres;
  }

  private scheduler = () => {
    if (!this.isRunning || !this.ctx) return;

    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadSec) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.advanceStep();
    }

    this.timerId = window.setTimeout(this.scheduler, this.lookaheadMs);
  };

  private advanceStep() {
    const secondsPerBeat = 60.0 / this.bpm;
    const stepDuration = 0.25 * secondsPerBeat; // 16th notes
    this.nextStepTime += stepDuration;
    this.currentStep = (this.currentStep + 1) % 16;
  }

  private scheduleStep(step: number, _time: number) {
    // Notify UI for playhead animation
    if (this.onStepCallback) {
      window.requestAnimationFrame(() => {
        if (this.onStepCallback && this.isRunning) {
          this.onStepCallback(step);
        }
      });
    }

    const primaryGenre = this.activeGenres[0] || 'techno';
    const secondaryGenre = this.activeGenres[1] || primaryGenre;

    // Trigger active tracks
    this.tracksRef.forEach((track) => {
      if (track.isMuted) return;
      if (!track.steps[step]) return;

      const trackGenre = (track.type === 'kick' || track.type === 'snare') ? primaryGenre : secondaryGenre;

      if (track.type === 'kick') {
        this.playKick(trackGenre, track.volume);
      } else if (track.type === 'snare') {
        this.playSnare(trackGenre, track.volume);
      } else if (track.type === 'hihat') {
        this.playHiHat(step % 4 === 2, track.volume);
      } else if (track.type === 'bass') {
        // Pentatonic bass sequence mapping
        const bassNotes = [55, 65.41, 73.42, 82.41, 98, 110]; // A1, C2, D2, E2, G2, A2
        const note = bassNotes[(step * 2) % bassNotes.length];
        this.playBass(note, 0.24, trackGenre, track.volume);
      } else if (track.type === 'lead') {
        const leadNotes = [220, 261.63, 293.66, 329.63, 392, 440]; // A3, C4, D4, E4, G4, A4
        const note = leadNotes[(step * 3) % leadNotes.length];
        this.playLead(note, 0.22, trackGenre, track.volume);
      } else if (track.type === 'perc') {
        if (trackGenre === 'trap_phonk') {
          this.playPerc('cowbell', track.volume);
        } else if (trackGenre === 'stone_techno') {
          this.playPerc('stone_clang', track.volume);
        } else {
          this.playPerc('vinyl_dust', track.volume);
        }
      }
    });
  }

  public stopSequencer() {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public isSequencerRunning(): boolean {
    return this.isRunning;
  }

  // --- Real Audio Recording to WAV / WebM ---

  public startRecording(): boolean {
    const ctx = this.getContext();
    if (!this.mediaDest) {
      try {
        this.mediaDest = ctx.createMediaStreamDestination();
        if (this.masterGain) this.masterGain.connect(this.mediaDest);
      } catch {
        return false;
      }
    }

    try {
      this.recordedChunks = [];
      const stream = this.mediaDest.stream;
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.start(100);
      this.isRecording = true;
      return true;
    } catch {
      return false;
    }
  }

  public stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.recordedChunks = [];
        resolve(blob);
      };

      try {
        this.mediaRecorder.stop();
      } catch {
        this.isRecording = false;
        resolve(null);
      }
    });
  }

  public isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  // --- Real-time Audio Frequency Analyzer & Reactive Amplitude ---

  public getAnalyserNode(): AnalyserNode | null {
    if (!this.analyserNode) {
      this.getContext();
    }
    return this.analyserNode;
  }

  public getActiveGenres(): FlowGenre[] {
    return this.activeGenres;
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public async enableMicInput(): Promise<boolean> {
    const ctx = this.getContext();
    try {
      if (this.micStream) {
        this.micStream.getTracks().forEach((t) => t.stop());
      }
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micSource = ctx.createMediaStreamSource(this.micStream);
      this.micGain = ctx.createGain();
      this.micGain.gain.setValueAtTime(1.5, ctx.currentTime);

      this.micSource.connect(this.micGain);
      if (this.analyserNode) {
        this.micGain.connect(this.analyserNode);
      }
      return true;
    } catch (e) {
      console.warn('Microphone audio stream permission denied or unavailable', e);
      return false;
    }
  }

  public disableMicInput(): void {
    if (this.micSource) {
      try {
        this.micSource.disconnect();
      } catch {}
      this.micSource = null;
    }
    if (this.micGain) {
      try {
        this.micGain.disconnect();
      } catch {}
      this.micGain = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
  }

  public isMicActive(): boolean {
    return !!this.micStream;
  }

  public getAudioAnalysis(): {
    bass: number;
    mid: number;
    treble: number;
    overall: number;
    frequencyData: Uint8Array;
    rawMax: number;
    isPlaying: boolean;
    activeGenres: FlowGenre[];
    bpm: number;
  } {
    if (!this.analyserNode) {
      this.getContext();
    }

    const emptyArray = new Uint8Array(128);
    if (!this.analyserNode) {
      return {
        bass: 0,
        mid: 0,
        treble: 0,
        overall: 0,
        frequencyData: emptyArray,
        rawMax: 0,
        isPlaying: this.isRunning,
        activeGenres: this.activeGenres,
        bpm: this.bpm,
      };
    }

    if (!this.fftDataArray || this.fftDataArray.length !== this.analyserNode.frequencyBinCount) {
      this.fftDataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
    }

    this.analyserNode.getByteFrequencyData(this.fftDataArray as any);

    // FFT Size is 256 -> 128 bins.
    // Bass: bins 1..6 (approx 40Hz - 250Hz)
    // Mid: bins 7..28 (approx 250Hz - 2400Hz)
    // Treble: bins 29..75 (approx 2400Hz - 9000Hz)
    let bassSum = 0;
    const bassBins = Math.min(6, this.fftDataArray.length);
    for (let i = 1; i <= bassBins; i++) {
      bassSum += this.fftDataArray[i];
    }
    const bass = bassBins > 0 ? (bassSum / bassBins) / 255 : 0;

    let midSum = 0;
    const midStart = 7;
    const midEnd = Math.min(28, this.fftDataArray.length);
    for (let i = midStart; i < midEnd; i++) {
      midSum += this.fftDataArray[i];
    }
    const mid = midEnd > midStart ? (midSum / (midEnd - midStart)) / 255 : 0;

    let trebleSum = 0;
    const trebleStart = 29;
    const trebleEnd = Math.min(75, this.fftDataArray.length);
    for (let i = trebleStart; i < trebleEnd; i++) {
      trebleSum += this.fftDataArray[i];
    }
    const treble = trebleEnd > trebleStart ? (trebleSum / (trebleEnd - trebleStart)) / 255 : 0;

    let totalSum = 0;
    let rawMax = 0;
    for (let i = 0; i < this.fftDataArray.length; i++) {
      totalSum += this.fftDataArray[i];
      if (this.fftDataArray[i] > rawMax) rawMax = this.fftDataArray[i];
    }
    const overall = (totalSum / this.fftDataArray.length) / 255;

    return {
      bass,
      mid,
      treble,
      overall,
      frequencyData: this.fftDataArray,
      rawMax,
      isPlaying: this.isRunning || overall > 0.02,
      activeGenres: this.activeGenres,
      bpm: this.bpm,
    };
  }
}

export const flowAudioEngine = new FlowAudioEngine();
