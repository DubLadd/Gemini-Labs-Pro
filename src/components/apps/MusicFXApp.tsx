import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import {
  flowAudioEngine,
  FlowGenre,
  FLOW_GENRES,
  TrackSequence,
  FxSettings,
} from '../../utils/flowAudioEngine';
import { soundEngine } from '../../utils/audio';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Wand2,
  Sliders,
  Volume2,
  VolumeX,
  Download,
  Save,
  Copy,
  Check,
  Zap,
  Flame,
  Ghost,
  Disc,
  Radio,
  FileText,
  Trash2,
  Plus,
  RefreshCw,
  Repeat,
  Shuffle,
  Music,
  Activity,
  Layers,
  Mic,
} from 'lucide-react';

interface SavedLyricsItem {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  key: string;
  lyrics: string;
  date: string;
  rhymeDensity: number;
  notes?: string;
}

const PRESET_SONGS: {
  id: string;
  name: string;
  genres: FlowGenre[];
  bpm: number;
  description: string;
  fx: Partial<FxSettings>;
  tracks: {
    kick: number[];
    snare: number[];
    hihat: number[];
    bass: number[];
    lead: number[];
    perc: number[];
  };
}[] = [
  {
    id: 'industrial_stone',
    name: 'Industrial Stone Techno',
    genres: ['industrial_techno', 'stone_techno'],
    bpm: 140,
    description: 'Crushed warehouse 4/4 kicks, cavernous stone rumble, metallic clangs',
    fx: { distortion: 62, hauntedFlanger: 35, dubDelay: 28, echoReverb: 45, filterCutoff: 14500 },
    tracks: {
      kick: [0, 4, 8, 12, 14],
      snare: [4, 12],
      hihat: [2, 6, 10, 14, 15],
      bass: [1, 3, 5, 7, 9, 11, 13, 15],
      lead: [0, 6, 10],
      perc: [3, 7, 11],
    },
  },
  {
    id: 'trap_phonk_drift',
    name: 'Trap Phonk Mutation',
    genres: ['trap_phonk', 'hiphop'],
    bpm: 145,
    description: 'Memphis 808 tuned cowbells, sliding sub bass, tape saturation',
    fx: { distortion: 42, hauntedFlanger: 20, dubDelay: 35, echoReverb: 25, filterCutoff: 16000 },
    tracks: {
      kick: [0, 3, 8, 11],
      snare: [4, 12],
      hihat: [0, 1, 2, 4, 6, 7, 8, 10, 12, 14, 15],
      bass: [0, 3, 6, 8, 11, 14],
      lead: [2, 5, 10, 13],
      perc: [0, 3, 6, 9, 12, 14],
    },
  },
  {
    id: 'cyber_dnb_roller',
    name: 'Cyber Drum & Bass Roller',
    genres: ['dnb', 'synthwave'],
    bpm: 174,
    description: 'High-speed syncopated breaks, reese bass glide, sub-bass pressure',
    fx: { distortion: 25, hauntedFlanger: 32, dubDelay: 42, echoReverb: 30, filterCutoff: 17000 },
    tracks: {
      kick: [0, 10],
      snare: [4, 12],
      hihat: [0, 2, 4, 6, 8, 10, 12, 14, 15],
      bass: [0, 2, 6, 8, 11, 14],
      lead: [2, 6, 10, 14],
      perc: [7, 11, 15],
    },
  },
  {
    id: 'dubstep_bounce_drop',
    name: 'Dubstep Bounce Drop',
    genres: ['dubstep', 'electronic'],
    bpm: 140,
    description: 'Half-time kick-snare, LFO wobble growls, explosive sub impact',
    fx: { distortion: 55, hauntedFlanger: 38, dubDelay: 45, echoReverb: 40, filterCutoff: 15500 },
    tracks: {
      kick: [0, 7],
      snare: [8],
      hihat: [0, 2, 4, 6, 8, 10, 12, 14],
      bass: [0, 2, 4, 6, 8, 10, 12, 14],
      lead: [1, 3, 9, 11],
      perc: [14, 15],
    },
  },
  {
    id: 'lofi_tokyo_chill',
    name: 'Lo-Fi Midnight Chill',
    genres: ['lofi', 'chill'],
    bpm: 84,
    description: 'Warm dusty Rhodes chords, vinyl crackle, relaxed swing groove',
    fx: { distortion: 10, hauntedFlanger: 5, dubDelay: 20, echoReverb: 55, filterCutoff: 5800 },
    tracks: {
      kick: [0, 6, 10],
      snare: [4, 12],
      hihat: [2, 6, 10, 14],
      bass: [0, 4, 8, 12],
      lead: [0, 8],
      perc: [1, 5, 9, 13],
    },
  },
  {
    id: 'grunge_synth_hybrid',
    name: 'Grunge Synthwave Hybrid',
    genres: ['grunge', 'synthwave'],
    bpm: 116,
    description: 'Sludge fuzzy bass, 80s gated snare, neon analog saw drive',
    fx: { distortion: 50, hauntedFlanger: 42, dubDelay: 32, echoReverb: 38, filterCutoff: 15000 },
    tracks: {
      kick: [0, 4, 8, 12],
      snare: [4, 12],
      hihat: [0, 2, 4, 6, 8, 10, 12, 14],
      bass: [0, 2, 4, 6, 8, 10, 12, 14],
      lead: [0, 3, 6, 8, 11],
      perc: [7, 15],
    },
  },
  {
    id: 'boombap_rap',
    name: 'Boom-Bap Hip Hop Gold',
    genres: ['hiphop', 'chill'],
    bpm: 92,
    description: 'Punchy head-nodder kick, vinyl snare crack, melodic walking bass',
    fx: { distortion: 18, hauntedFlanger: 0, dubDelay: 24, echoReverb: 26, filterCutoff: 16500 },
    tracks: {
      kick: [0, 3, 8, 11],
      snare: [4, 12],
      hihat: [0, 2, 4, 6, 8, 10, 12, 14],
      bass: [0, 4, 8, 12],
      lead: [2, 6, 10, 14],
      perc: [5, 13],
    },
  },
];

const INITIAL_SAVED_LYRICS: SavedLyricsItem[] = [
  {
    id: 'lyrics-1',
    title: 'Drift in the Shadows (Phonk Mutation)',
    genre: 'Trap Phonk Mutation',
    bpm: 145,
    key: 'D Minor',
    date: '2026-10-09',
    rhymeDensity: 88,
    notes: 'Aggressive 808 cowbell cadence, Memphis triplet flow',
    lyrics: `[INTRO: Eerie Flute & 808 Glide]
Yeah, watch the tachometer bleed red
Midnight asphalt, running in the shadows ahead
Tuned eighty-eights shaking through the chassis plate
We don't negotiate with fate...

[VERSE 1: Rapid Triplet Flow]
Chrome spokes spinning in a low beam flash
Neon through the mist while the pistons crash
Drifting through the cloverleaf, no brake taps
Got the devil in the rearview taking road naps
Memphis in the rhythm, Tokyo in the turn
Rubber on the bitumen starting to burn
Ain't nobody catching what they can't even see
Ghost in the machine, certified mutation pedigree!

[HOOK / DROP: Heavy 808 Sub Explosion]
Drift through the asphalt, haunt in the night
Cowbell screaming when the timing hits right!
(AYE!) We mutated the flow, left the limits behind
(BOUNCE!) Nothing but the sub frequency in your mind!

[OUTRO: Tape Slowdown]
Fading into smoke...
Two hundred on the dash...
Ghost out.`,
  },
  {
    id: 'lyrics-2',
    title: 'Steel Foundry Pulse (Industrial Stone Rave)',
    genre: 'Industrial Stone Techno',
    bpm: 140,
    key: 'A Minor',
    date: '2026-10-09',
    rhymeDensity: 76,
    notes: 'Hypnotic repetitive warehouse chant, distorted resonance',
    lyrics: `[BUILD-UP: Lowpass Filter Opening]
Strobe light flickering on concrete walls
Listen close when the hammer calls...
Stone and steel.
Pressure and heat.
Feel the rumble beneath your feet.

[CHANT / CHORUS: Relentless 4/4 Pulse]
One hundred and forty beats per breath
Pounding the rhythm defying death
Iron resonance, metallic clangs
Echo through the hangar where the iron hangs
(PRESSURE!) Strike the anvil, hear the gear
(RELEASE!) Nothing left of doubt or fear!

[DROP CHANT: Sub Shockwave]
DOWN TO THE FLOOR!
STONE TECHNO CORE!
CRUSH THE REVERB!
GIVE ME MORE!`,
  },
  {
    id: 'lyrics-3',
    title: 'Velocity Vector (DnB Jungle Hype)',
    genre: 'Drum & Bass',
    bpm: 174,
    key: 'F Minor',
    date: '2026-10-09',
    rhymeDensity: 92,
    notes: 'Fast 174-BPM double time MC flow, syncopated rhymes',
    lyrics: `[INTRO: High-Pass Breakbeat]
Signal locked at one-seven-four
Roll the sub across the floor...
All crew stand clear!

[DOUBLE-TIME VERSE: 174 BPM]
Rapid-fire cadence when the amen breaks
Measure every corner by the calculated stakes
Moving at velocity, digital monstrosity
Pumping up the wattage with ferocious reciprocity
Reese bass sliding down the subterranean pipe
Laser guided lyricism hyper-focused on the hype
Catch the glide, feel the slide, take the ride, open wide
Subwoofer resonance verified worldwide!

[DROP: Reese Bass Glide]
DROP IT!
Maximum frequency distortion unlocked!`,
  },
];

export const MusicFXApp: React.FC<{
  onShowToast?: (title: string, msg: string, type?: 'info' | 'success' | 'warn') => void;
}> = ({ onShowToast }) => {
  // App views
  const [activeTab, setActiveTab] = useState<'sequencer' | 'keyboard' | 'fx_rack' | 'lyrics'>('sequencer');

  // Sequencer state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [bpm, setBpm] = useState(136);
  const [masterVolume, setMasterVolume] = useState(0.85);

  // Genres & Fusion
  const [primaryGenre, setPrimaryGenre] = useState<FlowGenre>('industrial_techno');
  const [secondaryGenre, setSecondaryGenre] = useState<FlowGenre>('stone_techno');
  const [genreBlendRatio, setGenreBlendRatio] = useState(60); // 60% primary, 40% secondary

  // DSP FX Rack state
  const [fx, setFx] = useState<FxSettings>({
    distortion: 35,
    hauntedFlanger: 25,
    dubDelay: 30,
    echoReverb: 35,
    filterCutoff: 15500,
    subBassPunch: 60,
  });

  const [isBounceDropping, setIsBounceDropping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimerRef = useRef<number | null>(null);

  // Tracks sequence
  const [tracks, setTracks] = useState<TrackSequence[]>([
    {
      id: 'track-kick',
      name: 'Kick Punch / 808',
      type: 'kick',
      color: '#ef4444',
      steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, true, false],
      volume: 0.85,
      isMuted: false,
      isSolo: false,
    },
    {
      id: 'track-snare',
      name: 'Snare / Warehouse Clang',
      type: 'snare',
      color: '#f97316',
      steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
      volume: 0.75,
      isMuted: false,
      isSolo: false,
    },
    {
      id: 'track-hihat',
      name: 'Hi-Hat / Sizzle',
      type: 'hihat',
      color: '#eab308',
      steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, true],
      volume: 0.65,
      isMuted: false,
      isSolo: false,
    },
    {
      id: 'track-bass',
      name: 'Bass / Reese / 808 Slide',
      type: 'bass',
      color: '#a855f7',
      steps: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
      volume: 0.8,
      isMuted: false,
      isSolo: false,
    },
    {
      id: 'track-lead',
      name: 'Lead / Chime / Saw',
      type: 'lead',
      color: '#06b6d4',
      steps: [true, false, false, false, false, false, true, false, false, false, true, false, false, false, false, false],
      volume: 0.7,
      isMuted: false,
      isSolo: false,
    },
    {
      id: 'track-perc',
      name: 'Perc / 808 Cowbell',
      type: 'perc',
      color: '#10b981',
      steps: [false, false, false, true, false, false, false, true, false, false, false, true, false, false, false, false],
      volume: 0.7,
      isMuted: false,
      isSolo: false,
    },
  ]);

  // Mini-Keyboard / Piano Roll state
  const [keyboardOctave, setKeyboardOctave] = useState(4);
  const [synthSound, setSynthSound] = useState<'saw' | 'rhodes' | 'chime' | 'phonk' | 'reese' | 'acid'>('saw');
  const [scaleMode, setScaleMode] = useState<'all' | 'minor' | 'pentatonic' | 'phrygian' | 'blues'>('minor');

  // AI Lyrics State
  const [lyricsTopic, setLyricsTopic] = useState('Underground warehouse stone techno rave with heavy distorted 808s and midnight adrenaline');
  const [lyricsGenreTarget, setLyricsGenreTarget] = useState('Industrial Stone Techno');
  const [lyricsStructure, setLyricsStructure] = useState<'full' | 'verse_chorus' | 'drop_chants' | 'rap_bars'>('full');
  const [currentLyricsText, setCurrentLyricsText] = useState(INITIAL_SAVED_LYRICS[0].lyrics);
  const [lyricsTitle, setLyricsTitle] = useState('Drift in the Shadows');
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [isUpgradingLyrics, setIsUpgradingLyrics] = useState(false);
  const [savedLyricsList, setSavedLyricsList] = useState<SavedLyricsItem[]>(() => {
    try {
      const saved = localStorage.getItem('flow_music_saved_lyrics');
      return saved ? JSON.parse(saved) : INITIAL_SAVED_LYRICS;
    } catch {
      return INITIAL_SAVED_LYRICS;
    }
  });
  const [copiedLyrics, setCopiedLyrics] = useState(false);

  // Audio Visualizer Canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Synchronize audio engine with state
  useEffect(() => {
    flowAudioEngine.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    flowAudioEngine.setMasterVolume(masterVolume);
  }, [masterVolume]);

  useEffect(() => {
    flowAudioEngine.setFx(fx);
  }, [fx]);

  useEffect(() => {
    flowAudioEngine.updateSequencerState(tracks, [primaryGenre, secondaryGenre]);
  }, [tracks, primaryGenre, secondaryGenre]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      flowAudioEngine.stopSequencer();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  // Save lyrics list to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('flow_music_saved_lyrics', JSON.stringify(savedLyricsList));
    } catch {
      // Ignore
    }
  }, [savedLyricsList]);

  // Visualizer loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      phase += 0.05 * (bpm / 120);
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;

      // Dark futuristic background
      ctx.fillStyle = 'rgba(6, 11, 25, 0.45)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bars = 48;
      const barWidth = canvas.width / bars;

      for (let i = 0; i < bars; i++) {
        let amplitude = 6;
        if (isPlaying) {
          const wave1 = Math.sin(phase + i * 0.28);
          const wave2 = Math.cos(phase * 0.6 + i * 0.15);
          const wave3 = Math.sin(phase * 2.2 + (currentStep % 4) * 0.5);
          amplitude = Math.abs(wave1 * wave2 + wave3 * 0.4) * (canvas.height * 0.75) + 8;
        }

        // Color based on primary genre theme
        const hue = primaryGenre === 'trap_phonk' ? 160 + i * 2 : primaryGenre === 'dnb' ? 30 + i * 3 : primaryGenre === 'industrial_techno' ? 0 + i * 3 : 260 + i * 2;
        ctx.fillStyle = `hsl(${hue}, 90%, ${isPlaying ? 62 : 25}%)`;
        ctx.fillRect(i * barWidth, canvas.height - amplitude, barWidth - 1.5, amplitude);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, bpm, primaryGenre, currentStep]);

  // Transport handlers
  const handleTogglePlay = () => {
    if (isPlaying) {
      flowAudioEngine.stopSequencer();
      setIsPlaying(false);
      soundEngine.playSfx('click');
    } else {
      soundEngine.playSfx('open');
      flowAudioEngine.startSequencer(tracks, [primaryGenre, secondaryGenre], (step) => {
        setCurrentStep(step);
      });
      setIsPlaying(true);
      if (onShowToast) {
        onShowToast(
          'Flow Sequencer Active',
          `Playing ${FLOW_GENRES[primaryGenre].name} + ${FLOW_GENRES[secondaryGenre].name} (${bpm} BPM)`,
          'info'
        );
      }
    }
  };

  const handleStopAndReset = () => {
    flowAudioEngine.stopSequencer();
    setIsPlaying(false);
    setCurrentStep(0);
    soundEngine.playSfx('click');
  };

  // Toggle sequencer step
  const handleToggleStep = (trackId: string, stepIndex: number) => {
    soundEngine.playSfx('keystroke');
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const newSteps = [...t.steps];
          newSteps[stepIndex] = !newSteps[stepIndex];
          return { ...t, steps: newSteps };
        }
        return t;
      })
    );
  };

  // Track operations
  const handleClearTrack = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, steps: new Array(16).fill(false) } : t))
    );
    soundEngine.playSfx('click');
  };

  const handleRandomizeTrack = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const randomSteps = Array.from({ length: 16 }, () => Math.random() > 0.65);
          return { ...t, steps: randomSteps };
        }
        return t;
      })
    );
    soundEngine.playSfx('click');
  };

  const handleFillTrack = (trackId: string, pattern: '4x4' | '8th' | '16th') => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id === trackId) {
          const newSteps = new Array(16).fill(false);
          if (pattern === '4x4') {
            [0, 4, 8, 12].forEach((idx) => (newSteps[idx] = true));
          } else if (pattern === '8th') {
            [0, 2, 4, 6, 8, 10, 12, 14].forEach((idx) => (newSteps[idx] = true));
          } else if (pattern === '16th') {
            newSteps.fill(true);
          }
          return { ...t, steps: newSteps };
        }
        return t;
      })
    );
    soundEngine.playSfx('click');
  };

  // Bounce drop trigger
  const handleTriggerBounceDrop = () => {
    if (isBounceDropping) return;
    setIsBounceDropping(true);
    soundEngine.playSfx('open');
    if (onShowToast) {
      onShowToast('💣 BOUNCE DROP ACTIVATED', 'Riser sweep engaged... brace for sub detonation!', 'warn');
    }
    flowAudioEngine.triggerBounceDrop(() => {
      setIsBounceDropping(false);
      if (onShowToast) {
        onShowToast('💥 DROP DETONATED', 'Sub shockwave impact & filter snap open!', 'success');
      }
    });
  };

  // Load a song preset
  const handleLoadPreset = (presetId: string) => {
    const preset = PRESET_SONGS.find((p) => p.id === presetId);
    if (!preset) return;

    setPrimaryGenre(preset.genres[0]);
    setSecondaryGenre(preset.genres[1] || preset.genres[0]);
    setBpm(preset.bpm);
    setFx((prev) => ({ ...prev, ...preset.fx }));

    setTracks((prev) =>
      prev.map((track) => {
        const typeKey = track.type as keyof typeof preset.tracks;
        const activeSteps = preset.tracks[typeKey] || [];
        const newSteps = new Array(16).fill(false);
        activeSteps.forEach((s) => {
          if (s >= 0 && s < 16) newSteps[s] = true;
        });
        return { ...track, steps: newSteps };
      })
    );

    soundEngine.playSfx('success');
    if (onShowToast) {
      onShowToast('Loaded Preset', `${preset.name} (${preset.bpm} BPM)`, 'success');
    }
  };

  // Algorithmic Genre Fusion Mutator
  const handleMutateAndFuseGenres = () => {
    soundEngine.playSfx('success');
    const newBpm = Math.round((FLOW_GENRES[primaryGenre].defaultBpm * 0.6) + (FLOW_GENRES[secondaryGenre].defaultBpm * 0.4));
    setBpm(newBpm);

    // Fuse tracks
    setTracks((prev) =>
      prev.map((track) => {
        const newSteps = new Array(16).fill(false);
        if (track.type === 'kick') {
          // Fusion kick
          [0, 4, 8, 12].forEach((i) => (newSteps[i] = true));
          if (primaryGenre === 'trap_phonk' || secondaryGenre === 'trap_phonk') {
            newSteps[3] = true;
            newSteps[11] = true;
          }
          if (primaryGenre === 'dnb' || secondaryGenre === 'dnb') {
            newSteps[10] = true;
          }
        } else if (track.type === 'snare') {
          if (primaryGenre === 'dubstep' || secondaryGenre === 'dubstep') {
            newSteps[8] = true; // Half time
          } else {
            newSteps[4] = true;
            newSteps[12] = true;
          }
        } else if (track.type === 'hihat') {
          [2, 6, 10, 14].forEach((i) => (newSteps[i] = true));
          if (Math.random() > 0.4) newSteps[15] = true;
          if (Math.random() > 0.4) newSteps[7] = true;
        } else if (track.type === 'bass') {
          [0, 3, 6, 8, 11, 14].forEach((i) => {
            if (Math.random() > 0.25) newSteps[i] = true;
          });
        } else if (track.type === 'lead') {
          [0, 6, 10, 13].forEach((i) => (newSteps[i] = true));
        } else if (track.type === 'perc') {
          [0, 3, 6, 9, 12, 14].forEach((i) => {
            if (Math.random() > 0.35) newSteps[i] = true;
          });
        }
        return { ...track, steps: newSteps };
      })
    );

    if (onShowToast) {
      onShowToast(
        'Mutation Engine',
        `Fused ${FLOW_GENRES[primaryGenre].name} with ${FLOW_GENRES[secondaryGenre].name} at ${newBpm} BPM!`,
        'success'
      );
    }
  };

  // Recording to Audio File (.webm / .wav)
  const handleToggleRecord = async () => {
    if (isRecording) {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      const blob = await flowAudioEngine.stopRecording();
      setIsRecording(false);
      setRecordingDuration(0);

      if (blob) {
        soundEngine.playSfx('success');
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flow-music-${primaryGenre}-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (onShowToast) {
          onShowToast('Audio Export Complete', 'Downloaded real live audio recording to your machine!', 'success');
        }
      }
    } else {
      if (!isPlaying) {
        handleTogglePlay();
      }
      const started = flowAudioEngine.startRecording();
      if (started) {
        setIsRecording(true);
        setRecordingDuration(0);
        recordingTimerRef.current = window.setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
        soundEngine.playSfx('open');
        if (onShowToast) {
          onShowToast('Recording Started', 'Capturing live Web Audio master output stream...', 'info');
        }
      } else {
        if (onShowToast) {
          onShowToast('Recording Unavailable', 'MediaRecorder not supported in this environment.', 'warn');
        }
      }
    }
  };

  // Piano Roll key trigger
  const playKeyboardNote = (freq: number, noteName: string) => {
    soundEngine.playSfx('keystroke');
    const genreToUse =
      synthSound === 'phonk'
        ? 'trap_phonk'
        : synthSound === 'reese'
        ? 'dnb'
        : synthSound === 'rhodes'
        ? 'lofi'
        : synthSound === 'chime'
        ? 'stone_techno'
        : synthSound === 'acid'
        ? 'industrial_techno'
        : 'synthwave';

    if (synthSound === 'phonk' || synthSound === 'reese' || synthSound === 'acid') {
      flowAudioEngine.playBass(freq, 0.45, genreToUse, 0.85);
    } else {
      flowAudioEngine.playLead(freq, 0.45, genreToUse, 0.75);
    }

    if (onShowToast) {
      // Optional subtle feedback
    }
  };

  // Keyboard note definitions
  const NOTES_DEF = [
    { name: 'C', semitone: 0, isBlack: false, keyShortcut: 'A' },
    { name: 'C#', semitone: 1, isBlack: true, keyShortcut: 'W' },
    { name: 'D', semitone: 2, isBlack: false, keyShortcut: 'S' },
    { name: 'D#', semitone: 3, isBlack: true, keyShortcut: 'E' },
    { name: 'E', semitone: 4, isBlack: false, keyShortcut: 'D' },
    { name: 'F', semitone: 5, isBlack: false, keyShortcut: 'F' },
    { name: 'F#', semitone: 6, isBlack: true, keyShortcut: 'T' },
    { name: 'G', semitone: 7, isBlack: false, keyShortcut: 'G' },
    { name: 'G#', semitone: 8, isBlack: true, keyShortcut: 'Y' },
    { name: 'A', semitone: 9, isBlack: false, keyShortcut: 'H' },
    { name: 'A#', semitone: 10, isBlack: true, keyShortcut: 'U' },
    { name: 'B', semitone: 11, isBlack: false, keyShortcut: 'J' },
    { name: 'C+1', semitone: 12, isBlack: false, keyShortcut: 'K' },
    { name: 'C#+1', semitone: 13, isBlack: true, keyShortcut: 'O' },
    { name: 'D+1', semitone: 14, isBlack: false, keyShortcut: 'L' },
  ];

  // Scale filter
  const isNoteInScale = (semitone: number) => {
    const mod = semitone % 12;
    if (scaleMode === 'all') return true;
    if (scaleMode === 'minor') return [0, 2, 3, 5, 7, 8, 10].includes(mod); // Natural minor
    if (scaleMode === 'pentatonic') return [0, 3, 5, 7, 10].includes(mod); // Minor pentatonic
    if (scaleMode === 'phrygian') return [0, 1, 3, 5, 7, 8, 10].includes(mod); // Dark Phrygian
    if (scaleMode === 'blues') return [0, 3, 5, 6, 7, 10].includes(mod); // Blues scale
    return true;
  };

  const getNoteFreq = (semitone: number, octave: number) => {
    // 440 Hz is A4 (semitone 9 in octave 4)
    const midi = (octave + 1) * 12 + semitone;
    return 440 * Math.pow(2, (midi - 69) / 12);
  };

  // Rhyme density analyzer
  const calculateRhymeMetrics = (text: string) => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('['));
    if (lines.length === 0) return { linesCount: 0, syllables: 0, density: 0 };

    let totalSyllables = 0;
    const endWords: string[] = [];

    lines.forEach((line) => {
      const words = line.split(/\s+/).filter(Boolean);
      totalSyllables += Math.round(words.length * 1.35);
      if (words.length > 0) {
        const lastWord = words[words.length - 1].replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (lastWord.length > 1) endWords.push(lastWord);
      }
    });

    // Approximate rhyme pairs
    let rhymeMatches = 0;
    for (let i = 0; i < endWords.length - 1; i++) {
      const w1 = endWords[i];
      const w2 = endWords[i + 1];
      if (w1.slice(-2) === w2.slice(-2) || w1.slice(-3) === w2.slice(-3)) {
        rhymeMatches++;
      }
    }

    const density = Math.min(98, Math.max(45, Math.round((rhymeMatches / Math.max(1, endWords.length / 2)) * 80 + 35)));

    return {
      linesCount: lines.length,
      syllables: totalSyllables,
      density,
    };
  };

  const currentMetrics = calculateRhymeMetrics(currentLyricsText);

  // AI Lyrics Writer (Gemini + Local Intelligent Fallback)
  const handleGenerateAiLyrics = async () => {
    if (!lyricsTopic.trim()) return;
    setIsGeneratingLyrics(true);
    soundEngine.playSfx('click');

    if (onShowToast) {
      onShowToast('Gemini Lyrics Forge', `Writing ${lyricsGenreTarget} lyrics...`, 'info');
    }

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY || 'AIzaSyDummyKey';
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are a legendary multi-genre lyricist and music producer specializing in ${lyricsGenreTarget}, Techno, Trap Phonk, Drum & Bass, Dubstep, Grunge, and Lo-Fi.
Write authentic, impactful song lyrics for the following concept:
Topic / Mood: "${lyricsTopic}"
Genre Style: "${lyricsGenreTarget}"
Target BPM: ${bpm}
Structure requested: ${lyricsStructure}

STYLE GUIDELINES FOR ${lyricsGenreTarget}:
- If Trap Phonk: Use dark Memphis triplet flow, drift car metaphors, pitched cowbell timing, ad-libs like [AYE!], [DRIFT!], [BOUNCE!], heavy internal rhymes.
- If Industrial / Stone Techno: Hypnotic repetitive warehouse chants, rhythmic pulses, cold steel/concrete imagery, build-up count-ins, German/English rave hooks.
- If Drum & Bass: Fast double-time syncopation for 174 BPM, MC hype calls, reese bass drop chants [DROP THE REESE!], flow momentum.
- If Dubstep: Half-time punches, massive drop chant vocal chops, build-up risers [3... 2... 1... BOUNCE!], heavy bass face ad-libs.
- If Grunge: Gritty distortion angst, raw 90s alt-rock imagery, sludgy metaphors, raw emotional honesty.
- If Lo-Fi: Mellow nostalgic poetry, conversational flow, rainy midnight reflections.
- If Rap / Hip Hop: Multisyllabic rhyme schemes, clever wordplay, punchlines, head-nodding cadence.

Include structural headers like [INTRO], [VERSE 1], [PRE-CHORUS], [HOOK / DROP], [VERSE 2], [BRIDGE], [OUTRO].
Return ONLY the raw lyrics text.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const generatedText = response.text?.trim() || '';
      if (generatedText && generatedText.length > 50) {
        setCurrentLyricsText(generatedText);
        setLyricsTitle(lyricsTopic.slice(0, 36));
        soundEngine.playSfx('success');
        if (onShowToast) {
          onShowToast('Lyrics Forged', 'Generated custom song lyrics with Gemini!', 'success');
        }
      } else {
        throw new Error('Empty response');
      }
    } catch {
      // Local intelligent lyric generation fallback
      const fallbackLyrics = generateLocalFallbackLyrics(lyricsTopic, lyricsGenreTarget, bpm);
      setCurrentLyricsText(fallbackLyrics);
      setLyricsTitle(lyricsTopic.slice(0, 36));
      soundEngine.playSfx('success');
      if (onShowToast) {
        onShowToast('Lyrics Generated', 'Generated complete multi-genre lyric blueprint.', 'success');
      }
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  // AI Lyrics Upgrader / Mutator
  const handleUpgradeLyrics = async (upgradeType: string) => {
    setIsUpgradingLyrics(true);
    soundEngine.playSfx('click');

    if (onShowToast) {
      onShowToast('AI Lyric Upgrader', `Mutating lyrics with "${upgradeType}"...`, 'info');
    }

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY || 'AIzaSyDummyKey';
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are an elite music producer and lyric doctor.
Take the following song lyrics and UPGRADE/MUTATE them according to this instruction:
"${upgradeType}"

CURRENT LYRICS:
\`\`\`
${currentLyricsText}
\`\`\`

REQUIREMENTS:
1. Preserve the core message and story, but aggressively transform the flow, cadence, vocabulary, and vocal tags to match "${upgradeType}".
2. Inject high-energy ad-libs, performance cues, vocal FX brackets like [BOUNCE DROP 💣], [REESE GLIDE], [808 COWBELL CHANT], [HAUNTED FLANGER ECHO].
3. Maximize rhyme density and rhythmic punch.
4. Return ONLY the upgraded lyrics.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const upgraded = response.text?.trim() || '';
      if (upgraded && upgraded.length > 50) {
        setCurrentLyricsText(upgraded);
        soundEngine.playSfx('success');
        if (onShowToast) {
          onShowToast('Upgrade Complete', `Lyrics upgraded with ${upgradeType}!`, 'success');
        }
      } else {
        throw new Error('Fallback needed');
      }
    } catch {
      // Local smart upgrade transformation
      const locallyUpgraded = applyLocalLyricMutation(currentLyricsText, upgradeType);
      setCurrentLyricsText(locallyUpgraded);
      soundEngine.playSfx('success');
      if (onShowToast) {
        onShowToast('Upgrade Applied', `Applied local lyric mutation: ${upgradeType}`, 'success');
      }
    } finally {
      setIsUpgradingLyrics(false);
    }
  };

  // Local Fallback generator
  const generateLocalFallbackLyrics = (topic: string, genre: string, targetBpm: number) => {
    return `[INTRO: Ambient Synth & Filter Opening]
(${genre} Production // ${targetBpm} BPM // Labs Audio Engine)
Yeah... signal locked on "${topic}"
Watch the frequency rise...

[VERSE 1: Heavy Cadence]
Midnight frequency cutting through the cold
Stories in the asphalt waiting to unfold
Step into the circuit with the bassline low
Every single speaker vibrating the glow
Tuned to the resonance, breaking every seal
You can hear the difference when the groove is real
Pushing past the limit, moving through the night
Catching every phantom in the strobe light!

[PRE-CHORUS: Riser Build & Haunted Flanger]
Listen to the sub when the pressure starts to climb
Ticking like a chronometer right on time...
Count it down... Three... Two... One...

[HOOK / DROP: 808 Sub Detonation 💣]
BOUNCE TO THE BASS! MOVE TO THE BEAT!
Feel the stone impact underneath your feet!
(AYE!) Distorted warehouse, never gonna fold
(DROP!) Pure sonic energy made of solid gold!

[VERSE 2: Rapid Momentum]
Second lap around and we're picking up the pace
Sub-frequency pressure in an open space
No looking backwards, we're locked inside the groove
Give the audio generator something to prove!

[OUTRO: Dub Delay Echo]
Fade the reverb out...
Hold the final tone...
Echo in the static... done.`;
  };

  // Local lyric mutator
  const applyLocalLyricMutation = (text: string, mutation: string) => {
    let result = text;
    if (mutation.includes('Phonk')) {
      result = `[MUTATED: Trap Phonk Drift Edition // 808 Memphis Flow]\n` +
        result
          .replace(/\[HOOK.*?\]/gi, '[HOOK / DROP: MEMPHIS 808 COWBELL CHANT 🔔 (AYE!)]')
          .replace(/\n([A-Z])/g, '\n[DRIFT] $1');
    } else if (mutation.includes('Industrial') || mutation.includes('Stone')) {
      result = `[MUTATED: Industrial Stone Rave 4/4 Warehouse Chant]\n` +
        result
          .replace(/\[HOOK.*?\]/gi, '[HOOK: 4/4 RELENTLESS WAREHOUSE PULSE // STONE CLANG]')
          .replace(/\bthe\b/gi, 'der');
    } else if (mutation.includes('DnB') || mutation.includes('Double-Time')) {
      result = `[MUTATED: 174 BPM Double-Time Drum & Bass MC Edition]\n` +
        result.replace(/\[VERSE 1.*?\]/gi, '[VERSE 1: 174 BPM RAPID AMEN DOUBLE-TIME CADENCE]');
    } else if (mutation.includes('Bounce Drop')) {
      result = result.replace(
        /\[HOOK.*?\]/gi,
        `[PRE-DROP RISER: White Noise Siren 🚨]\n3... 2... 1...\n[BOUNCE DROP 💣: SUB BASS DETONATION & FILTER SNAP OPEN!]`
      );
    } else {
      result = `// [UPGRADED WITH: ${mutation}]\n` + result;
    }
    return result;
  };

  // Save current lyrics item
  const handleSaveCurrentLyrics = () => {
    const newItem: SavedLyricsItem = {
      id: `lyrics-${Date.now()}`,
      title: lyricsTitle || 'Untitled Lyrics',
      genre: lyricsGenreTarget,
      bpm,
      key: 'D Minor',
      lyrics: currentLyricsText,
      date: new Date().toISOString().split('T')[0],
      rhymeDensity: currentMetrics.density,
      notes: `${FLOW_GENRES[primaryGenre].name} + ${FLOW_GENRES[secondaryGenre].name} style`,
    };

    setSavedLyricsList((prev) => [newItem, ...prev]);
    soundEngine.playSfx('success');
    if (onShowToast) {
      onShowToast('Lyrics Saved', `Saved "${lyricsTitle}" to your local styles library!`, 'success');
    }
  };

  // Copy lyrics
  const handleCopyLyrics = () => {
    navigator.clipboard.writeText(currentLyricsText);
    setCopiedLyrics(true);
    soundEngine.playSfx('click');
    setTimeout(() => setCopiedLyrics(false), 2000);
    if (onShowToast) {
      onShowToast('Copied', 'Lyrics copied to clipboard!', 'info');
    }
  };

  // Download lyrics as .txt or .lrc
  const handleDownloadLyrics = (format: 'txt' | 'lrc') => {
    let content = currentLyricsText;
    if (format === 'lrc') {
      // Format as timestamped .lrc
      const lines = currentLyricsText.split('\n');
      let sec = 5;
      content = lines
        .map((line) => {
          if (!line.trim()) return '';
          const mins = Math.floor(sec / 60)
            .toString()
            .padStart(2, '0');
          const secs = (sec % 60).toString().padStart(2, '0');
          sec += 4;
          return `[${mins}:${secs}.00] ${line}`;
        })
        .join('\n');
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lyricsTitle.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'lyrics'}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    soundEngine.playSfx('success');
    if (onShowToast) {
      onShowToast('Exported Lyrics', `Downloaded as .${format} file!`, 'success');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      {/* Top Main Transport & Studio Bar */}
      <div className="bg-slate-900/90 border-b border-white/10 px-4 py-2.5 flex items-center justify-between shrink-0 gap-3 backdrop-blur-md">
        {/* Logo & Status */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Disc className={`w-4 h-4 text-white ${isPlaying ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white tracking-wide">
                Google Flow Music
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                PRO X // GENRE STUDIO
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Multi-Genre Synthesis • Real-Time DSP Audio • AI Lyric Forge
            </p>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center space-x-2">
          {/* Play / Pause */}
          <button
            onClick={handleTogglePlay}
            className={`px-4 py-1.5 rounded-lg flex items-center space-x-1.5 text-xs font-semibold transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Live</span>
              </>
            )}
          </button>

          {/* Stop / Reset */}
          <button
            onClick={handleStopAndReset}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
            title="Stop & Reset to Step 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Record Audio Output to WAV/WebM */}
          <button
            onClick={handleToggleRecord}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 text-xs font-semibold transition-all border ${
              isRecording
                ? 'bg-red-600/30 text-red-300 border-red-500 animate-pulse'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
            }`}
            title="Record master audio output to downloadable audio file"
          >
            <span className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500' : 'bg-slate-400'}`} />
            <span>{isRecording ? `REC ${recordingDuration}s` : 'Record WAV'}</span>
          </button>

          {/* BPM Control */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 space-x-2">
            <span className="text-[10px] text-slate-400 font-mono">BPM</span>
            <input
              type="range"
              min={60}
              max={190}
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
              className="w-16 accent-purple-400 h-1 bg-white/10 rounded cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-purple-300 w-7 text-right">
              {bpm}
            </span>
          </div>

          {/* Master Volume */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg px-2 py-1 space-x-1.5">
            {masterVolume > 0 ? (
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-red-400" />
            )}
            <input
              type="range"
              min={0}
              max={1.2}
              step={0.05}
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="w-14 accent-purple-400 h-1 bg-white/10 rounded cursor-pointer"
            />
          </div>

          {/* BOUNCE DROP PUNCH BUTTON */}
          <button
            onClick={handleTriggerBounceDrop}
            disabled={isBounceDropping}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1 text-xs font-bold transition-all shadow-md ${
              isBounceDropping
                ? 'bg-red-600 text-white animate-bounce'
                : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-red-500/20 active:scale-95'
            }`}
            title="Trigger Dramatic Riser Sweep & Sub Detonation Drop"
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>BOUNCE DROP 💣</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-white/10">
          <button
            onClick={() => setActiveTab('sequencer')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'sequencer'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sequencer</span>
          </button>
          <button
            onClick={() => setActiveTab('keyboard')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'keyboard'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Piano Keys</span>
          </button>
          <button
            onClick={() => setActiveTab('fx_rack')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'fx_rack'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>FX & Mutation</span>
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'lyrics'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>AI Lyrics ({savedLyricsList.length})</span>
          </button>
        </div>
      </div>

      {/* Genre Combiner Bar (Always accessible for rapid genre blending) */}
      <div className="bg-slate-900/60 border-b border-white/5 px-4 py-2 flex items-center justify-between gap-4 text-xs shrink-0 overflow-x-auto">
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>Genre Fusion:</span>
          </div>

          {/* Primary Genre */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
            <span className="text-[10px] text-slate-400">Primary</span>
            <select
              value={primaryGenre}
              onChange={(e) => setPrimaryGenre(e.target.value as FlowGenre)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {Object.values(FLOW_GENRES).map((g) => (
                <option key={g.id} value={g.id} className="bg-slate-900 text-white">
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-500 font-bold">+</span>

          {/* Secondary Genre */}
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 py-1">
            <span className="text-[10px] text-slate-400">Secondary</span>
            <select
              value={secondaryGenre}
              onChange={(e) => setSecondaryGenre(e.target.value as FlowGenre)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {Object.values(FLOW_GENRES).map((g) => (
                <option key={g.id} value={g.id} className="bg-slate-900 text-white">
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Mutate Button */}
          <button
            onClick={handleMutateAndFuseGenres}
            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-[11px] flex items-center gap-1 shadow-sm active:scale-95"
          >
            <Shuffle className="w-3 h-3" />
            <span>Mutate & Fuse</span>
          </button>
        </div>

        {/* Preset Selector Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-400">Presets:</span>
          <div className="flex items-center gap-1.5">
            {PRESET_SONGS.slice(0, 4).map((p) => (
              <button
                key={p.id}
                onClick={() => handleLoadPreset(p.id)}
                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[10px] font-medium text-slate-300 border border-white/10 transition-colors"
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="flex-1 overflow-hidden flex flex-col p-3 relative">
        {/* --- VIEW 1: 16-STEP LAUNCHPAD SEQUENCER --- */}
        {activeTab === 'sequencer' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/50 rounded-xl border border-white/10 p-3">
            {/* Sequencer Header & Visualizer Banner */}
            <div className="flex items-center justify-between mb-2 shrink-0 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200">
                  16-Step Launchpad Matrix
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  [Step {currentStep + 1}/16]
                </span>
              </div>

              {/* Live Canvas Spectrum Visualizer */}
              <div className="w-48 h-8 rounded-lg overflow-hidden border border-white/10 bg-slate-950">
                <canvas ref={canvasRef} className="w-full h-full block" />
              </div>
            </div>

            {/* Step Grid Header: Step Numbers */}
            <div className="grid grid-cols-[180px_1fr] gap-2 mb-1 shrink-0 text-[10px] text-slate-400 font-mono">
              <div className="pl-2">Track Voice</div>
              <div className="grid grid-cols-16 gap-1 px-1">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className={`text-center py-0.5 rounded ${
                      currentStep === i && isPlaying
                        ? 'bg-purple-500 text-white font-bold'
                        : i % 4 === 0
                        ? 'text-slate-300 font-semibold'
                        : 'text-slate-500'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Tracks List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="grid grid-cols-[180px_1fr] gap-2 items-center bg-white/[0.02] hover:bg-white/[0.04] p-1.5 rounded-lg border border-white/5 transition-colors"
                >
                  {/* Track Info & Quick Controls */}
                  <div className="flex items-center justify-between pr-2">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: track.color }}
                      />
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {track.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => handleFillTrack(track.id, '4x4')}
                        className="px-1 text-[9px] bg-white/5 hover:bg-white/10 text-slate-400 rounded"
                        title="Fill 4/4 beats"
                      >
                        4x4
                      </button>
                      <button
                        onClick={() => handleRandomizeTrack(track.id)}
                        className="p-1 text-slate-400 hover:text-slate-200"
                        title="Randomize pattern"
                      >
                        <Shuffle className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={() => handleClearTrack(track.id)}
                        className="p-1 text-slate-400 hover:text-red-400"
                        title="Clear track"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  {/* 16 Step Buttons */}
                  <div className="grid grid-cols-16 gap-1 px-1">
                    {track.steps.map((isActive, stepIdx) => {
                      const isCurrent = currentStep === stepIdx && isPlaying;
                      const isQuarter = stepIdx % 4 === 0;

                      return (
                        <button
                          key={stepIdx}
                          onClick={() => handleToggleStep(track.id, stepIdx)}
                          style={{
                            backgroundColor: isActive
                              ? track.color
                              : isQuarter
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(255,255,255,0.03)',
                            boxShadow: isActive
                              ? `0 0 10px ${track.color}88`
                              : 'none',
                          }}
                          className={`h-9 rounded-md transition-all flex items-center justify-center relative border ${
                            isActive
                              ? 'border-white/40 opacity-100 scale-95'
                              : 'border-white/5 opacity-70 hover:opacity-100'
                          } ${
                            isCurrent
                              ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-950 scale-100 z-10'
                              : ''
                          }`}
                        >
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions Footer */}
            <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
              <div className="flex items-center gap-2">
                <span>Active DSP:</span>
                <span className="text-purple-300 font-mono">
                  Distortion {fx.distortion}% • Flanger {fx.hauntedFlanger}% • Echo {fx.dubDelay}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('keyboard')}
                  className="text-purple-400 hover:underline flex items-center gap-1"
                >
                  <Music className="w-3 h-3" />
                  <span>Play melodies on Keyboard →</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW 2: PLAYABLE MINI-KEYBOARD & PIANO ROLL --- */}
        {activeTab === 'keyboard' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/50 rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10 shrink-0">
              <div>
                <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                  <Music className="w-4 h-4 text-purple-400" />
                  <span>Live Chromatic Synth Keyboard</span>
                </h4>
                <p className="text-[10px] text-slate-400">
                  Play melodic leads, sub 808 glides, and chords via click or QWERTY keyboard
                </p>
              </div>

              {/* Synth Timbre Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-[11px] text-slate-400">Voice:</span>
                <select
                  value={synthSound}
                  onChange={(e) => setSynthSound(e.target.value as any)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white font-medium focus:outline-none"
                >
                  <option value="saw" className="bg-slate-900">Synthwave Lead Saw</option>
                  <option value="phonk" className="bg-slate-900">Trap Phonk 808 Glide</option>
                  <option value="rhodes" className="bg-slate-900">Lo-Fi Rhodes Chords</option>
                  <option value="chime" className="bg-slate-900">Stone Metallic Chime</option>
                  <option value="reese" className="bg-slate-900">DnB Reese Sub Bass</option>
                  <option value="acid" className="bg-slate-900">Industrial Acid 303</option>
                </select>

                {/* Scale mode */}
                <select
                  value={scaleMode}
                  onChange={(e) => setScaleMode(e.target.value as any)}
                  className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="minor" className="bg-slate-900">Natural Minor</option>
                  <option value="phrygian" className="bg-slate-900">Dark Phrygian (Phonk/Techno)</option>
                  <option value="pentatonic" className="bg-slate-900">Minor Pentatonic</option>
                  <option value="blues" className="bg-slate-900">Blues Scale</option>
                  <option value="all" className="bg-slate-900">All Chromatic</option>
                </select>

                {/* Octave Shift */}
                <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
                  <button
                    onClick={() => setKeyboardOctave((prev) => Math.max(2, prev - 1))}
                    className="px-2 py-0.5 text-xs hover:bg-white/10 rounded text-slate-300"
                  >
                    -8ve
                  </button>
                  <span className="px-2 text-xs font-mono text-purple-300 font-bold">
                    C{keyboardOctave}
                  </span>
                  <button
                    onClick={() => setKeyboardOctave((prev) => Math.min(6, prev + 1))}
                    className="px-2 py-0.5 text-xs hover:bg-white/10 rounded text-slate-300"
                  >
                    +8ve
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Keyboard Keys */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="relative flex h-52 select-none shadow-2xl rounded-xl overflow-hidden border border-white/20 bg-slate-950 p-2">
                {NOTES_DEF.map((note) => {
                  const inScale = isNoteInScale(note.semitone);
                  const freq = getNoteFreq(note.semitone, keyboardOctave);

                  if (note.isBlack) {
                    return (
                      <button
                        key={note.name}
                        onClick={() => playKeyboardNote(freq, note.name)}
                        className={`w-9 h-32 -mx-4.5 z-20 rounded-b-md transition-all flex flex-col justify-end pb-2 items-center text-[10px] font-mono font-bold shadow-lg ${
                          inScale
                            ? 'bg-slate-900 hover:bg-purple-800 text-purple-300 border border-purple-500/30 active:scale-95'
                            : 'bg-slate-950 opacity-40 text-slate-600'
                        }`}
                      >
                        <span className="text-[9px] text-slate-400">{note.keyShortcut}</span>
                        <span>{note.name}</span>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={note.name}
                      onClick={() => playKeyboardNote(freq, note.name)}
                      className={`w-12 h-48 rounded-b-lg border-x border-b border-slate-300/20 transition-all flex flex-col justify-end pb-3 items-center text-xs font-mono font-bold ${
                        inScale
                          ? 'bg-gradient-to-b from-white to-slate-200 hover:from-purple-100 hover:to-purple-200 text-slate-900 active:scale-98'
                          : 'bg-slate-300/30 opacity-40 text-slate-500'
                      }`}
                    >
                      <span className="text-[10px] text-slate-500">{note.keyShortcut}</span>
                      <span>{note.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-center text-[11px] text-slate-400 shrink-0">
              💡 Tip: Press physical keys <span className="font-mono text-purple-300">A, W, S, E, D, F, T, G, Y, H, U, J, K</span> to trigger notes directly!
            </div>
          </div>
        )}

        {/* --- VIEW 3: DSP FX RACK & MUTATION LAB --- */}
        {activeTab === 'fx_rack' && (
          <div className="flex-1 flex flex-col overflow-y-auto bg-slate-900/50 rounded-xl border border-white/10 p-4 space-y-4">
            <div className="border-b border-white/10 pb-2">
              <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>DSP Audio Effects Rack & Sound Sculptor</span>
              </h4>
              <p className="text-[10px] text-slate-400">
                Real-time Web Audio WaveShaper distortion, Haunted Flanger comb filter, and Tape Dub Echo
              </p>
            </div>

            {/* Effects Sliders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Distortion / Overdrive */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Distortion Drive</span>
                  </div>
                  <span className="text-xs font-mono text-red-300">{fx.distortion}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={fx.distortion}
                  onChange={(e) => setFx({ ...fx, distortion: parseInt(e.target.value) })}
                  className="w-full accent-red-500 h-1.5 bg-white/10 rounded cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-2">
                  WaveShaper non-linear saturation for aggressive industrial warehouse kicks and phonk grit.
                </p>
              </div>

              {/* Haunted Flanger */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
                    <Ghost className="w-3.5 h-3.5" />
                    <span>Haunted Flanger</span>
                  </div>
                  <span className="text-xs font-mono text-cyan-300">{fx.hauntedFlanger}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={fx.hauntedFlanger}
                  onChange={(e) => setFx({ ...fx, hauntedFlanger: parseInt(e.target.value) })}
                  className="w-full accent-cyan-500 h-1.5 bg-white/10 rounded cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-2">
                  Phase-inverted comb filtering with slow sinister LFO sweep for ghostly, spectral spatial depth.
                </p>
              </div>

              {/* Dub Delay / Echo */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400">
                    <Repeat className="w-3.5 h-3.5" />
                    <span>Dub Tape Delay</span>
                  </div>
                  <span className="text-xs font-mono text-purple-300">{fx.dubDelay}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={fx.dubDelay}
                  onChange={(e) => setFx({ ...fx, dubDelay: parseInt(e.target.value) })}
                  className="w-full accent-purple-500 h-1.5 bg-white/10 rounded cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-2">
                  Tempo-synced delay line with warm analog lowpass feedback filter loop.
                </p>
              </div>

              {/* Lowpass Filter Cutoff */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Filter Cutoff Sweep</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-300">{Math.round(fx.filterCutoff)} Hz</span>
                </div>
                <input
                  type="range"
                  min={400}
                  max={18000}
                  step={100}
                  value={fx.filterCutoff}
                  onChange={(e) => setFx({ ...fx, filterCutoff: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500 h-1.5 bg-white/10 rounded cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-2">
                  Master Biquad lowpass resonant sweep. Drop to 800Hz for underwater lo-fi / club bathroom vibe.
                </p>
              </div>

              {/* Echo / Cavern Reverb */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Cavern Echo / Reverb</span>
                  </div>
                  <span className="text-xs font-mono text-amber-300">{fx.echoReverb}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={fx.echoReverb}
                  onChange={(e) => setFx({ ...fx, echoReverb: parseInt(e.target.value) })}
                  className="w-full accent-amber-500 h-1.5 bg-white/10 rounded cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-2">
                  Simulates cold warehouse concrete reflections or cavernous stone techno acoustics.
                </p>
              </div>

              {/* Bounce Drop Trigger Card */}
              <div className="bg-gradient-to-br from-red-950/60 to-purple-950/60 border border-red-500/30 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-300">
                      <Flame className="w-4 h-4 text-red-400" />
                      <span>BOUNCE DROP MODULE</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-500/20 text-red-300 border border-red-500/30">
                      LIVE RISER
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 mb-2">
                    Sweeps resonant noise riser + rising pitch siren, followed by an explosive sub impact detonation!
                  </p>
                </div>
                <button
                  onClick={handleTriggerBounceDrop}
                  disabled={isBounceDropping}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                >
                  {isBounceDropping ? 'SWEEPING RISER 🚨...' : 'DETONATE BOUNCE DROP 💣'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW 4: AI LYRICS WRITER, UPGRADER & STYLES VAULT --- */}
        {activeTab === 'lyrics' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden">
            {/* Left: Lyrics Writer & Editor */}
            <div className="flex-1 flex flex-col bg-slate-900/50 rounded-xl border border-white/10 p-3 overflow-hidden">
              {/* Writer Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0 gap-2">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    value={lyricsTitle}
                    onChange={(e) => setLyricsTitle(e.target.value)}
                    className="bg-transparent text-xs font-bold text-white focus:outline-none border-b border-transparent focus:border-purple-400 px-1"
                    placeholder="Song Title..."
                  />
                </div>

                <div className="flex items-center space-x-1.5 text-xs">
                  {/* Copy Button */}
                  <button
                    onClick={handleCopyLyrics}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-slate-300 flex items-center gap-1 text-[11px]"
                  >
                    {copiedLyrics ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLyrics ? 'Copied' : 'Copy'}</span>
                  </button>

                  {/* Save to Vault */}
                  <button
                    onClick={handleSaveCurrentLyrics}
                    className="px-2 py-1 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 rounded flex items-center gap-1 text-[11px]"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save to Library</span>
                  </button>

                  {/* Export format dropdown */}
                  <button
                    onClick={() => handleDownloadLyrics('lrc')}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-slate-300 flex items-center gap-1 text-[11px]"
                    title="Export synced .lrc file"
                  >
                    <Download className="w-3 h-3" />
                    <span>.LRC</span>
                  </button>
                  <button
                    onClick={() => handleDownloadLyrics('txt')}
                    className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-slate-300 flex items-center gap-1 text-[11px]"
                    title="Export plain text"
                  >
                    <Download className="w-3 h-3" />
                    <span>.TXT</span>
                  </button>
                </div>
              </div>

              {/* AI Prompt / Generation Bar */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 my-2 shrink-0 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={lyricsTopic}
                    onChange={(e) => setLyricsTopic(e.target.value)}
                    placeholder="Concept or vibe (e.g. Neon Tokyo drift 808s, warehouse stone techno rave...)"
                    className="flex-1 bg-slate-950/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                  />
                  <select
                    value={lyricsGenreTarget}
                    onChange={(e) => setLyricsGenreTarget(e.target.value)}
                    className="bg-slate-950/80 border border-white/10 rounded-lg px-2 text-xs text-white focus:outline-none cursor-pointer"
                  >
                    <option value="Trap Phonk Mutation">Trap Phonk Mutation</option>
                    <option value="Industrial Stone Techno">Industrial Stone Techno</option>
                    <option value="Drum & Bass Double-Time">Drum & Bass (174 BPM)</option>
                    <option value="Dubstep Drop Chants">Dubstep Bounce Drops</option>
                    <option value="Grunge Alt-Rock Poetry">Grunge Distortion</option>
                    <option value="Lo-Fi Midnight Chill">Lo-Fi Nostalgic</option>
                    <option value="90s Boom-Bap Hip Hop">90s Boom-Bap Rap</option>
                  </select>
                  <button
                    onClick={handleGenerateAiLyrics}
                    disabled={isGeneratingLyrics}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>{isGeneratingLyrics ? 'Writing...' : 'Write Lyrics'}</span>
                  </button>
                </div>

                {/* AI Lyric Upgrader / Mutation Presets */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-white/5 overflow-x-auto text-[10px]">
                  <span className="text-slate-400 shrink-0 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    <span>Upgrade Lyrics:</span>
                  </span>
                  {[
                    'Mutate to Trap Phonk Flow',
                    'Industrial Techno Warehouse Chants',
                    'DnB Rapid Double-Time',
                    'Add Bounce Drop Vocal Chants 💣',
                    'Grunge Raw Fuzz Rewrite',
                    'Lo-Fi Melancholy Softening',
                    'Boost Rhyme Density & Multisyllables',
                  ].map((upgrade) => (
                    <button
                      key={upgrade}
                      onClick={() => handleUpgradeLyrics(upgrade)}
                      disabled={isUpgradingLyrics}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 shrink-0 transition-colors"
                    >
                      {upgrade}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rhyme Density HUD */}
              <div className="flex items-center justify-between px-2 py-1 bg-purple-950/20 border border-purple-500/20 rounded-md mb-2 shrink-0 text-[10px]">
                <div className="flex items-center gap-3">
                  <span className="text-purple-300 font-medium">
                    Rhyme Density Score: <strong className="font-mono text-white">{currentMetrics.density}%</strong>
                  </span>
                  <span className="text-slate-400">
                    Lines: <strong className="text-slate-200">{currentMetrics.linesCount}</strong>
                  </span>
                  <span className="text-slate-400">
                    Est. Syllables: <strong className="text-slate-200">{currentMetrics.syllables}</strong>
                  </span>
                </div>
                <span className="text-purple-400 font-mono">
                  Tempo Sync: {bpm} BPM ({FLOW_GENRES[primaryGenre].name})
                </span>
              </div>

              {/* Lyrics Editor Textarea */}
              <textarea
                value={currentLyricsText}
                onChange={(e) => setCurrentLyricsText(e.target.value)}
                className="flex-1 w-full bg-slate-950/70 border border-white/10 rounded-lg p-3 text-xs font-mono text-slate-200 leading-relaxed focus:outline-none focus:border-purple-500/60 resize-none"
                placeholder="Type or generate your lyrics here..."
              />
            </div>

            {/* Right: Saved Lyrics & Styles Vault */}
            <div className="w-full lg:w-72 bg-slate-900/50 rounded-xl border border-white/10 p-3 flex flex-col shrink-0 overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2 shrink-0">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5 text-purple-400" />
                  <span>Styles & Saved Vault ({savedLyricsList.length})</span>
                </span>
              </div>

              {/* List of Saved Items */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {savedLyricsList.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors cursor-pointer group"
                    onClick={() => {
                      setCurrentLyricsText(item.lyrics);
                      setLyricsTitle(item.title);
                      setLyricsGenreTarget(item.genre);
                      soundEngine.playSfx('click');
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="text-xs font-bold text-slate-200 group-hover:text-purple-300 truncate">
                        {item.title}
                      </h5>
                      <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">
                        {item.rhymeDensity}% Rhymes
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span>{item.genre}</span>
                      <span className="font-mono">{item.bpm} BPM</span>
                    </div>

                    {item.notes && (
                      <p className="text-[10px] text-slate-500 line-clamp-1 italic">
                        {item.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-white/5 text-[10px] text-slate-500 text-center shrink-0">
                Click any saved style to load it into the lyricist forge.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
