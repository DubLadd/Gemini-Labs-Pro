import React, { useState, useRef, useEffect, useCallback } from 'react';
import { soundEngine } from '../../utils/audio';
import {
  flowAudioEngine,
  FlowGenre,
  FLOW_GENRES,
  TrackSequence,
} from '../../utils/flowAudioEngine';
import {
  AsciiBroadcaster,
  AsciiViewer,
  AsciiBroadcastFrame,
  AsciiReaction,
  ConnectedPeer,
  BroadcastSessionInfo,
} from '../../utils/asciiWebRTC';
import {
  FileUp,
  Download,
  Upload,
  FileDown,
  Copy,
  Check,
  Sparkles,
  Sliders,
  Palette,
  Image as ImageIcon,
  RefreshCw,
  Terminal,
  Layers,
  Video,
  VideoOff,
  Camera,
  Play,
  Pause,
  FlipHorizontal,
  Bookmark,
  BookmarkPlus,
  Trash2,
  X,
  Eye,
  EyeOff,
  Monitor,
  Gauge,
  Circle,
  Radio,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Music,
  Activity,
  Share2,
  Users,
  Flame,
  Zap,
  Heart,
  Rocket,
  ThumbsUp,
  Tv,
  Disc,
  Mic,
  MicOff,
} from 'lucide-react';

export type CharSetType = 'standard' | 'blocks' | 'binary' | 'matrix' | 'minimal' | 'custom';
export type ColorModeType = 'mono' | 'matrix' | 'amber' | 'neon' | 'rgb';

export interface ArtPreset {
  id: string;
  name: string;
  isBuiltIn?: boolean;
  charSetKey: CharSetType;
  customChars: string;
  width: number;
  contrast: number;
  brightness: number;
  invert: boolean;
  colorMode: ColorModeType;
  createdAt?: number;
}

const CHAR_SETS: Record<CharSetType, string> = {
  standard: '@%#*+=-:. ',
  blocks: '█▓▒░ ',
  binary: '10 ',
  matrix: 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ ',
  minimal: '#+. ',
  custom: '',
};

const DEFAULT_ART_PRESETS: ArtPreset[] = [
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Neon Glow',
    isBuiltIn: true,
    charSetKey: 'blocks',
    customChars: '█▓▒░ ',
    width: 85,
    contrast: 1.6,
    brightness: 1.1,
    invert: false,
    colorMode: 'neon',
  },
  {
    id: 'matrix-stream',
    name: 'Matrix Quantum Stream',
    isBuiltIn: true,
    charSetKey: 'matrix',
    customChars: '',
    width: 80,
    contrast: 1.8,
    brightness: 0.9,
    invert: false,
    colorMode: 'matrix',
  },
  {
    id: 'amber-terminal',
    name: 'Retro Amber CRT Terminal',
    isBuiltIn: true,
    charSetKey: 'standard',
    customChars: '@%#*+=-:. ',
    width: 80,
    contrast: 1.5,
    brightness: 1.0,
    invert: false,
    colorMode: 'amber',
  },
  {
    id: 'high-contrast-mono',
    name: 'Monochrome High-Key',
    isBuiltIn: true,
    charSetKey: 'standard',
    customChars: '@%#*+=-:. ',
    width: 85,
    contrast: 2.2,
    brightness: 1.0,
    invert: true,
    colorMode: 'mono',
  },
  {
    id: 'binary-glitch',
    name: 'Binary Data Matrix',
    isBuiltIn: true,
    charSetKey: 'binary',
    customChars: '10 ',
    width: 75,
    contrast: 1.6,
    brightness: 1.2,
    invert: false,
    colorMode: 'matrix',
  },
  {
    id: 'truecolor-spectrum',
    name: 'Vibrant Truecolor RGB',
    isBuiltIn: true,
    charSetKey: 'blocks',
    customChars: '█▓▒░ ',
    width: 65,
    contrast: 1.3,
    brightness: 1.0,
    invert: false,
    colorMode: 'rgb',
  },
];

const SAMPLE_IMAGES = [
  {
    name: 'Cyberpunk Neon City',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'AI Neural Core',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Matrix Quantum Stream',
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Abstract Fractal',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  },
];

const LOCAL_STORAGE_PRESETS_KEY = 'ascii_art_saved_presets_v2';

// Quick default tracks for MusicFX synthesis inside ASCII studio
const createDefaultMusicTracks = (): TrackSequence[] => [
  {
    id: 't-kick',
    name: 'Kick',
    type: 'kick',
    color: '#ef4444',
    steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    volume: 0.9,
    isMuted: false,
    isSolo: false,
  },
  {
    id: 't-snare',
    name: 'Snare / Clap',
    type: 'snare',
    color: '#f97316',
    steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    volume: 0.8,
    isMuted: false,
    isSolo: false,
  },
  {
    id: 't-hihat',
    name: 'Hi-Hat',
    type: 'hihat',
    color: '#eab308',
    steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, true],
    volume: 0.7,
    isMuted: false,
    isSolo: false,
  },
  {
    id: 't-bass',
    name: 'Sub Bass',
    type: 'bass',
    color: '#8b5cf6',
    steps: [true, false, true, false, false, true, false, false, true, false, true, false, false, true, false, false],
    volume: 0.85,
    isMuted: false,
    isSolo: false,
  },
  {
    id: 't-perc',
    name: 'Perc / Cowbell',
    type: 'perc',
    color: '#10b981',
    steps: [false, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true],
    volume: 0.75,
    isMuted: false,
    isSolo: false,
  },
];

const drawSimulatedMotionFrame = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number
) => {
  const t = time * 0.0015;
  // Cyber dark gradient background
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#0a0219');
  grad.addColorStop(0.5, '#1e0538');
  grad.addColorStop(1, '#05010a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Moving perspective synthwave floor grid
  ctx.strokeStyle = 'rgba(236, 72, 153, 0.45)';
  ctx.lineWidth = 1.5;
  const horizon = height * 0.52;
  const numV = 12;
  for (let i = 0; i <= numV; i++) {
    const x = (i / numV) * width;
    ctx.beginPath();
    ctx.moveTo(width * 0.5, horizon);
    ctx.lineTo(x * 2.2 - width * 0.6, height);
    ctx.stroke();
  }

  // Horizontal moving lines
  for (let i = 1; i <= 7; i++) {
    const progress = (t * 0.7 + i / 7) % 1;
    const y = horizon + Math.pow(progress, 2.2) * (height - horizon);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Glowing cyber sun / sphere
  const cx = width * 0.5;
  const cy = height * 0.36 + Math.sin(t * 2) * 6;
  const radius = 34 + Math.sin(t * 3) * 4;

  const sunGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, radius);
  sunGrad.addColorStop(0, '#ffffff');
  sunGrad.addColorStop(0.3, '#f43f5e');
  sunGrad.addColorStop(0.8, '#e11d48');
  sunGrad.addColorStop(1, '#881337');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  // Orbiting digital rings
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#38bdf8';
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius * 1.5, radius * 0.45, t * 1.4, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#c084fc';
  ctx.beginPath();
  ctx.ellipse(cx, cy, radius * 1.3, radius * 0.35, -t * 1.1, 0, Math.PI * 2);
  ctx.stroke();

  // On-screen HUD readout
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('LIVE VIRTUAL CAM // 30 FPS', 12, 22);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '9px monospace';
  ctx.fillText(`FRAME: ${Math.floor(t * 30)}  AUDIO: SYNC`, 12, 35);
};

interface PresetThumbnailPreviewProps {
  preset: ArtPreset;
  sourceCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  fallbackImageSrc: string;
  version: number;
}

const PresetThumbnailPreview: React.FC<PresetThumbnailPreviewProps> = ({
  preset,
  sourceCanvasRef,
  fallbackImageSrc,
  version,
}) => {
  const thumbCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const thumbCanvas = thumbCanvasRef.current;
    if (!thumbCanvas) return;
    const ctx = thumbCanvas.getContext('2d');
    if (!ctx) return;

    const W = 40;
    const H = 26;
    const cols = 13;
    const rows = 8;

    const drawFallbackPattern = (context: CanvasRenderingContext2D) => {
      context.fillStyle = '#07040d';
      context.fillRect(0, 0, W, H);
      context.font = 'bold 3.5px monospace';
      context.textBaseline = 'top';
      let col = '#e879f9';
      if (preset.colorMode === 'matrix') col = '#10b981';
      else if (preset.colorMode === 'amber') col = '#f59e0b';
      else if (preset.colorMode === 'mono') col = '#f1f5f9';
      context.fillStyle = col;
      const chars =
        (preset.charSetKey === 'custom' ? preset.customChars : CHAR_SETS[preset.charSetKey]) || '█▓▒░ ';
      const cLen = chars.length;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const ch = chars[(x * 2 + y * 3) % cLen];
          context.fillText(ch, x * (W / cols), y * (H / rows));
        }
      }
    };

    const renderFromSource = (source: HTMLCanvasElement | HTMLImageElement) => {
      try {
        const off = document.createElement('canvas');
        off.width = cols;
        off.height = rows;
        const offCtx = off.getContext('2d', { willReadFrequently: true });
        if (!offCtx) {
          drawFallbackPattern(ctx);
          return;
        }

        offCtx.drawImage(source, 0, 0, cols, rows);
        const imgData = offCtx.getImageData(0, 0, cols, rows);
        const data = imgData.data;

        ctx.fillStyle = '#07040d';
        ctx.fillRect(0, 0, W, H);

        const charSet =
          preset.charSetKey === 'custom'
            ? preset.customChars || '@%#*+=-:. '
            : CHAR_SETS[preset.charSetKey] || '@%#*+=-:. ';
        const charLen = charSet.length;

        let defaultColor = '#f8fafc';
        if (preset.colorMode === 'matrix') defaultColor = '#10b981';
        else if (preset.colorMode === 'amber') defaultColor = '#f59e0b';
        else if (preset.colorMode === 'neon') defaultColor = '#e879f9';
        else if (preset.colorMode === 'mono') defaultColor = '#f1f5f9';

        ctx.font = 'bold 3.5px monospace';
        ctx.textBaseline = 'top';

        const cellW = W / cols;
        const cellH = H / rows;

        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const idx = (y * cols + x) * 4;
            let r = data[idx];
            let g = data[idx + 1];
            let b = data[idx + 2];
            const a = data[idx + 3];

            if (a < 50) continue;

            if (preset.contrast !== 1 || preset.brightness !== 1) {
              r = Math.min(255, Math.max(0, (r - 128) * preset.contrast + 128 * preset.brightness));
              g = Math.min(255, Math.max(0, (g - 128) * preset.contrast + 128 * preset.brightness));
              b = Math.min(255, Math.max(0, (b - 128) * preset.contrast + 128 * preset.brightness));
            }

            let gray = 0.299 * r + 0.587 * g + 0.114 * b;
            if (preset.invert) gray = 255 - gray;

            const charIndex = Math.floor((gray / 255) * (charLen - 1));
            const char = charSet[Math.max(0, Math.min(charLen - 1, charIndex))] || ' ';
            if (char === ' ') continue;

            if (preset.colorMode === 'rgb') {
              ctx.fillStyle = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
            } else {
              ctx.fillStyle = defaultColor;
            }

            ctx.fillText(char, x * cellW, y * cellH);
          }
        }
      } catch (err) {
        drawFallbackPattern(ctx);
      }
    };

    const canvasEl = sourceCanvasRef.current;
    if (canvasEl && canvasEl.width > 0 && canvasEl.height > 0) {
      renderFromSource(canvasEl);
    } else if (fallbackImageSrc) {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => renderFromSource(img);
      img.onerror = () => drawFallbackPattern(ctx);
      img.src = fallbackImageSrc;
    } else {
      drawFallbackPattern(ctx);
    }
  }, [preset, sourceCanvasRef, fallbackImageSrc, version]);

  return (
    <canvas
      ref={thumbCanvasRef}
      width={40}
      height={26}
      className="w-10 h-6.5 rounded bg-black/90 border border-purple-500/30 shrink-0 shadow-inner group-hover:border-purple-400/60 transition"
      title={`${preset.name} (${preset.colorMode} palette)`}
    />
  );
};

export const AsciiApp: React.FC<{ onShowToast?: (title: string, msg: string) => void }> = ({ onShowToast }) => {
  // Input source mode: image, webcam, or remote viewer
  const [sourceMode, setSourceMode] = useState<'image' | 'webcam' | 'viewer'>('image');

  // Image state
  const [imageSrc, setImageSrc] = useState<string>(SAMPLE_IMAGES[0].url);

  // Conversion options
  const [width, setWidth] = useState<number>(85);
  const [charSetKey, setCharSetKey] = useState<CharSetType>('blocks');
  const [customChars, setCustomChars] = useState<string>('@%#*+=-:. ');
  const [invert, setInvert] = useState<boolean>(false);
  const [contrast, setContrast] = useState<number>(1.5);
  const [brightness, setBrightness] = useState<number>(1.0);
  const [colorMode, setColorMode] = useState<ColorModeType>('neon');

  // Outputs
  const [asciiOutput, setAsciiOutput] = useState<string>('Initializing ASCII engine...');
  const [htmlOutput, setHtmlOutput] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Presets State
  const [presets, setPresets] = useState<ArtPreset[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PRESETS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const userPresets = parsed.filter((p: ArtPreset) => !p.isBuiltIn);
          return [...DEFAULT_ART_PRESETS, ...userPresets];
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved presets from localStorage', e);
    }
    return DEFAULT_ART_PRESETS;
  });

  const [activePresetId, setActivePresetId] = useState<string>('cyber-neon');
  const [showSavePresetModal, setShowSavePresetModal] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');

  // Live Webcam Feed State
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [isWebcamPaused, setIsWebcamPaused] = useState<boolean>(false);
  const [mirrorWebcam, setMirrorWebcam] = useState<boolean>(true);
  const [targetFps, setTargetFps] = useState<number>(24);
  const [measuredFps, setMeasuredFps] = useState<number>(0);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [showWebcamPip, setShowWebcamPip] = useState<boolean>(true);
  const [isSimulatedFeed, setIsSimulatedFeed] = useState<boolean>(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------
  // AUDIO FREQUENCY ANALYZER & REACTIVE PULSING STATE (MusicFX)
  // -------------------------------------------------------------
  const [isAudioReactive, setIsAudioReactive] = useState<boolean>(false);
  const [audioSourceType, setAudioSourceType] = useState<'musicfx' | 'mic'>('musicfx');
  const [musicFxPlaying, setMusicFxPlaying] = useState<boolean>(false);
  const [musicFxGenre, setMusicFxGenre] = useState<FlowGenre>('techno');
  const [musicFxBpm, setMusicFxBpm] = useState<number>(130);
  const [audioSensitivity, setAudioSensitivity] = useState<number>(1.2); // 0.5 to 2.5
  const [audioPulseScale, setAudioPulseScale] = useState<number>(0.15); // Scale expand intensity
  const [audioBloomEnabled, setAudioBloomEnabled] = useState<boolean>(true);
  const [audioMorphEnabled, setAudioMorphEnabled] = useState<boolean>(true);

  // Real-time audio metrics
  const [audioMetrics, setAudioMetrics] = useState<{
    bass: number;
    mid: number;
    treble: number;
    overall: number;
    rawFft: Uint8Array;
  }>({
    bass: 0,
    mid: 0,
    treble: 0,
    overall: 0,
    rawFft: new Uint8Array(16),
  });

  // Dynamic visual feedback values for smooth animation
  const [visualScale, setVisualScale] = useState<number>(1);
  const [visualGlow, setVisualGlow] = useState<number>(0);

  // -------------------------------------------------------------
  // PEER-TO-PEER WEBRTC BROADCAST STATE
  // -------------------------------------------------------------
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastRoomId, setBroadcastRoomId] = useState<string>('');
  const [connectedPeers, setConnectedPeers] = useState<ConnectedPeer[]>([]);
  const [broadcastStats, setBroadcastStats] = useState<{ packets: number; bytes: number }>({ packets: 0, bytes: 0 });
  const [reactions, setReactions] = useState<AsciiReaction[]>([]);

  // Remote Viewer State
  const [discoveredBroadcasts, setDiscoveredBroadcasts] = useState<BroadcastSessionInfo[]>([]);
  const [joinRoomInput, setJoinRoomInput] = useState<string>('');
  const [viewerStatus, setViewerStatus] = useState<{
    isConnected: boolean;
    isConnecting: boolean;
    rtt: number;
    fps: number;
    roomId: string | null;
  }>({
    isConnected: false,
    isConnecting: false,
    rtt: 0,
    fps: 0,
    roomId: null,
  });
  const [remoteFrame, setRemoteFrame] = useState<AsciiBroadcastFrame | null>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const presetFileInputRef = useRef<HTMLInputElement>(null);
  const [previewVersion, setPreviewVersion] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFpsUpdateRef = useRef<number>(Date.now());
  const audioAnalysisAnimRef = useRef<number | null>(null);

  // WebRTC instances
  const broadcasterRef = useRef<AsciiBroadcaster | null>(null);
  const viewerRef = useRef<AsciiViewer | null>(null);

  const activeCharSet = charSetKey === 'custom' ? customChars : CHAR_SETS[charSetKey];

  // Initialize WebRTC broadcaster and viewer on mount
  useEffect(() => {
    const broadcaster = new AsciiBroadcaster();
    broadcasterRef.current = broadcaster;

    const unregPeers = broadcaster.onPeersChange((peers) => {
      setConnectedPeers(peers);
    });

    const unregReactions = broadcaster.onReaction((rx) => {
      setReactions((prev) => [rx, ...prev.slice(0, 8)]);
      soundEngine.playSfx('success');
    });

    const viewer = new AsciiViewer();
    viewerRef.current = viewer;

    const unregRooms = viewer.onDiscoveredRoomsChange((rooms) => {
      setDiscoveredBroadcasts(rooms);
    });

    const unregStatus = viewer.onStatusChange((status) => {
      setViewerStatus(status);
    });

    const unregFrame = viewer.onFrame((frame) => {
      setRemoteFrame(frame);
    });

    return () => {
      unregPeers();
      unregReactions();
      broadcaster.destroy();
      unregRooms();
      unregStatus();
      unregFrame();
      viewer.destroy();
    };
  }, []);

  // Update broadcaster metadata when settings change
  useEffect(() => {
    if (broadcasterRef.current) {
      broadcasterRef.current.setStreamMetadata(targetFps, colorMode, isAudioReactive);
    }
  }, [targetFps, colorMode, isAudioReactive]);

  // Persist custom presets whenever presets change
  const savePresetsToStorage = (updatedPresets: ArtPreset[]) => {
    setPresets(updatedPresets);
    try {
      const customOnly = updatedPresets.filter((p) => !p.isBuiltIn);
      localStorage.setItem(LOCAL_STORAGE_PRESETS_KEY, JSON.stringify(customOnly));
    } catch (e) {
      console.error('Failed to save presets to localStorage', e);
    }
  };

  // Apply a preset
  const handleApplyPreset = (preset: ArtPreset) => {
    setActivePresetId(preset.id);
    setCharSetKey(preset.charSetKey);
    if (preset.customChars) setCustomChars(preset.customChars);
    setWidth(preset.width);
    setContrast(preset.contrast);
    setBrightness(preset.brightness);
    setInvert(preset.invert);
    setColorMode(preset.colorMode);

    soundEngine.playSfx('click');
    if (onShowToast) onShowToast('Preset Applied', `Configured with "${preset.name}"`);
  };

  // Save current config as new preset
  const handleSavePreset = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPresetName.trim()) return;

    const newPreset: ArtPreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName.trim(),
      isBuiltIn: false,
      charSetKey,
      customChars,
      width,
      contrast,
      brightness,
      invert,
      colorMode,
      createdAt: Date.now(),
    };

    const updated = [...presets, newPreset];
    savePresetsToStorage(updated);
    setActivePresetId(newPreset.id);
    setNewPresetName('');
    setShowSavePresetModal(false);
    setPreviewVersion((v) => v + 1);

    soundEngine.playSfx('open');
    if (onShowToast) onShowToast('Preset Saved!', `Saved "${newPreset.name}" to localStorage.`);
  };

  // Delete a custom preset
  const handleDeletePreset = (id: string, name: string) => {
    const updated = presets.filter((p) => p.id !== id);
    savePresetsToStorage(updated);
    if (activePresetId === id) {
      setActivePresetId('cyber-neon');
    }
    setPreviewVersion((v) => v + 1);
    soundEngine.playSfx('click');
    if (onShowToast) onShowToast('Preset Removed', `Deleted "${name}"`);
  };

  // Export all custom presets (or current preset library) to a single JSON file
  const handleExportPresets = () => {
    const customPresets = presets.filter((p) => !p.isBuiltIn);
    // If user has saved custom presets, export all custom presets.
    // If none yet, export the current library as custom presets so user gets an immediate starter pack!
    const presetsToExport =
      customPresets.length > 0
        ? customPresets
        : presets.map((p) => ({ ...p, isBuiltIn: false }));

    const exportPayload = {
      app: 'AsciiArtStudio',
      version: 1,
      exportedAt: new Date().toISOString(),
      count: presetsToExport.length,
      isStarterPack: customPresets.length === 0,
      presets: presetsToExport,
    };

    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ascii-art-presets-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    soundEngine.playSfx('open');
    if (onShowToast) {
      onShowToast(
        'Presets Exported',
        customPresets.length > 0
          ? `Exported ${customPresets.length} custom Art Preset(s) to JSON file.`
          : `Exported preset library (${presetsToExport.length} presets) as JSON starter pack.`
      );
    }
  };

  // Import custom presets from a JSON file and restore to localStorage
  const handleImportPresetsFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so selecting the same file triggers onChange
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content) throw new Error('Selected file is empty.');

        const parsed = JSON.parse(content);
        let rawList: any[] = [];
        if (Array.isArray(parsed)) {
          rawList = parsed;
        } else if (parsed && Array.isArray(parsed.presets)) {
          rawList = parsed.presets;
        } else if (parsed && typeof parsed === 'object' && parsed.name) {
          rawList = [parsed];
        } else {
          throw new Error('Unrecognized preset JSON format. Expected an array or { presets: [...] } object.');
        }

        const validCharSets: CharSetType[] = ['standard', 'blocks', 'binary', 'matrix', 'minimal', 'custom'];
        const validColorModes: ColorModeType[] = ['mono', 'matrix', 'amber', 'neon', 'rgb'];
        const validPresets: ArtPreset[] = [];

        rawList.forEach((item, idx) => {
          if (!item || typeof item !== 'object') return;
          const name =
            typeof item.name === 'string' && item.name.trim()
              ? item.name.trim()
              : `Imported Preset ${idx + 1}`;
          const charSetKey = validCharSets.includes(item.charSetKey) ? item.charSetKey : 'blocks';
          const colorMode = validColorModes.includes(item.colorMode) ? item.colorMode : 'neon';
          const customChars = typeof item.customChars === 'string' ? item.customChars : '';
          const width =
            typeof item.width === 'number' && !isNaN(item.width)
              ? Math.max(20, Math.min(180, item.width))
              : 85;
          const contrast =
            typeof item.contrast === 'number' && !isNaN(item.contrast)
              ? Math.max(0.2, Math.min(4.0, item.contrast))
              : 1.5;
          const brightness =
            typeof item.brightness === 'number' && !isNaN(item.brightness)
              ? Math.max(0.2, Math.min(3.0, item.brightness))
              : 1.0;
          const invert = Boolean(item.invert);

          validPresets.push({
            id: `imported-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            name,
            isBuiltIn: false,
            charSetKey,
            customChars,
            width,
            contrast,
            brightness,
            invert,
            colorMode,
            createdAt: Date.now(),
          });
        });

        if (validPresets.length === 0) {
          throw new Error('No valid Art Presets found in the JSON file.');
        }

        const updated = [...presets, ...validPresets];
        savePresetsToStorage(updated);
        handleApplyPreset(validPresets[0]);
        setPreviewVersion((v) => v + 1);

        soundEngine.playSfx('success');
        if (onShowToast) {
          onShowToast(
            'Presets Imported!',
            `Successfully restored ${validPresets.length} Art Preset(s) from "${file.name}".`
          );
        }
      } catch (err: any) {
        console.error('Failed to import presets:', err);
        soundEngine.playSfx('click');
        if (onShowToast) {
          onShowToast('Import Failed', err.message || 'Invalid JSON preset file format.');
        }
      }
    };

    reader.onerror = () => {
      if (onShowToast) onShowToast('File Read Error', 'Could not read preset JSON file.');
    };

    reader.readAsText(file);
  };

  // Core conversion method given an image or video frame source
  const processFrameToAscii = useCallback(
    (source: HTMLImageElement | HTMLVideoElement, audioAnalysis?: { bass: number; mid: number; treble: number; overall: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const sourceWidth =
        'videoWidth' in source
          ? (source as HTMLVideoElement).videoWidth
          : (source as HTMLImageElement).naturalWidth || (source as HTMLImageElement).width;
      const sourceHeight =
        'videoHeight' in source
          ? (source as HTMLVideoElement).videoHeight
          : (source as HTMLImageElement).naturalHeight || (source as HTMLImageElement).height;

      if (!sourceWidth || !sourceHeight) return;

      const aspectRatio = sourceHeight / sourceWidth;
      const targetWidth = Math.max(20, Math.min(180, width));
      const targetHeight = Math.max(10, Math.round(targetWidth * aspectRatio * 0.55));

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Handle mirroring for webcam feed if enabled
      ctx.save();
      if ('videoWidth' in source && mirrorWebcam) {
        ctx.translate(targetWidth, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
      ctx.restore();

      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const pixels = imgData.data;

      // Audio-reactive modulation calculations
      const bassLevel = audioAnalysis ? audioAnalysis.bass * audioSensitivity : 0;
      const trebleLevel = audioAnalysis ? audioAnalysis.treble * audioSensitivity : 0;

      // Dynamic character morphing on bass drops / high energy
      let chars = activeCharSet || '@%#*+=-:. ';
      if (isAudioReactive && audioMorphEnabled && bassLevel > 0.45) {
        // Mutate into intense shaded blocks and matrix glyphs on heavy bass hits
        chars = '█▓▒░⚡*+-. ';
      } else if (isAudioReactive && audioMorphEnabled && trebleLevel > 0.5) {
        // High treble spark symbols
        chars = '※*+~°^:· ';
      }
      const charLen = chars.length;

      // Audio bloom modulates effective contrast & brightness
      let effectiveContrast = contrast;
      let effectiveBrightness = brightness;
      if (isAudioReactive && audioBloomEnabled && audioAnalysis) {
        effectiveContrast = contrast + bassLevel * 0.45;
        effectiveBrightness = brightness + bassLevel * 0.35;
      }

      let textResult = '';
      let htmlResult = '';
      const isRgb = colorMode === 'rgb';

      for (let y = 0; y < targetHeight; y++) {
        let rowText = '';
        let rowHtml = '';
        const yOffset = y * targetWidth * 4;

        for (let x = 0; x < targetWidth; x++) {
          const offset = yOffset + x * 4;
          let r = pixels[offset];
          let g = pixels[offset + 1];
          let b = pixels[offset + 2];
          const a = pixels[offset + 3];

          if (a < 120) {
            rowText += ' ';
            if (isRgb) rowHtml += '&nbsp;';
            continue;
          }

          // Apply contrast and brightness
          if (effectiveContrast !== 1.0 || effectiveBrightness !== 1.0) {
            r = Math.min(255, Math.max(0, (r - 128) * effectiveContrast + 128 * effectiveBrightness));
            g = Math.min(255, Math.max(0, (g - 128) * effectiveContrast + 128 * effectiveBrightness));
            b = Math.min(255, Math.max(0, (b - 128) * effectiveContrast + 128 * effectiveBrightness));
          }

          // Luminance calculation
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;
          if (invert) gray = 255 - gray;

          const charIndex = Math.floor((gray / 255) * (charLen - 1));
          const char = chars[Math.max(0, Math.min(charLen - 1, charIndex))] || ' ';

          rowText += char;

          if (isRgb) {
            rowHtml += `<span style="color: rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})">${
              char === ' ' ? '&nbsp;' : char
            }</span>`;
          }
        }

        textResult += rowText + '\n';
        if (isRgb) {
          htmlResult += rowHtml + '<br/>';
        }
      }

      setAsciiOutput(textResult);
      if (isRgb) {
        setHtmlOutput(htmlResult);
      }

      // If P2P WebRTC broadcast is running, broadcast frame over data channel to all connected peers
      if (broadcasterRef.current && broadcasterRef.current.getIsBroadcasting()) {
        broadcasterRef.current.broadcastFrame(textResult, {
          html: isRgb ? htmlResult : undefined,
          width: targetWidth,
          colorMode,
          fps: targetFps,
          audioMetrics: audioAnalysis
            ? {
                bass: audioAnalysis.bass,
                mid: audioAnalysis.mid,
                treble: audioAnalysis.treble,
                overall: audioAnalysis.overall,
                genre: musicFxGenre,
                bpm: musicFxBpm,
              }
            : undefined,
        });
        const stats = broadcasterRef.current.getStats();
        setBroadcastStats({ packets: stats.packetsSent, bytes: stats.bytesSent });
      }
    },
    [
      width,
      mirrorWebcam,
      activeCharSet,
      colorMode,
      contrast,
      brightness,
      invert,
      isAudioReactive,
      audioSensitivity,
      audioBloomEnabled,
      audioMorphEnabled,
      targetFps,
      musicFxGenre,
      musicFxBpm,
    ]
  );

  // Static Image renderer
  const generateAsciiFromImage = useCallback(() => {
    if (sourceMode !== 'image' || !imageSrc) return;
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const currentAudio = isAudioReactive ? flowAudioEngine.getAudioAnalysis() : undefined;
      processFrameToAscii(img, currentAudio);
      setIsProcessing(false);
      setPreviewVersion((v) => v + 1);
    };
    img.onerror = () => {
      setIsProcessing(false);
      if (onShowToast) onShowToast('Image Error', 'Failed to load selected image.');
    };
    img.src = imageSrc;
  }, [sourceMode, imageSrc, processFrameToAscii, isAudioReactive, onShowToast]);

  // Update static image conversion when parameters change
  useEffect(() => {
    if (sourceMode === 'image') {
      generateAsciiFromImage();
    }
  }, [sourceMode, generateAsciiFromImage]);

  // Periodic refresh of preset previews during live webcam
  useEffect(() => {
    if (!isWebcamActive || isWebcamPaused) return;
    const interval = setInterval(() => {
      setPreviewVersion((v) => v + 1);
    }, 1800);
    return () => clearInterval(interval);
  }, [isWebcamActive, isWebcamPaused]);

  // -------------------------------------------------------------
  // AUDIO FREQUENCY ANALYZER LOOP (MusicFX + Reactivity)
  // -------------------------------------------------------------
  useEffect(() => {
    let animId: number;

    const audioLoop = () => {
      const analysis = flowAudioEngine.getAudioAnalysis();

      // Extract 16 sub-bands for mini EQ visualizer
      const miniFft = new Uint8Array(16);
      const step = Math.floor(analysis.frequencyData.length / 16);
      for (let i = 0; i < 16; i++) {
        miniFft[i] = analysis.frequencyData[i * step] || 0;
      }

      setAudioMetrics({
        bass: analysis.bass,
        mid: analysis.mid,
        treble: analysis.treble,
        overall: analysis.overall,
        rawFft: miniFft,
      });

      if (isAudioReactive) {
        // Calculate smooth spring/pulse scaling
        const rawPulse = analysis.bass * audioSensitivity;
        const currentScale = 1 + rawPulse * audioPulseScale;
        setVisualScale(currentScale);

        const currentGlow = Math.min(30, (analysis.mid + analysis.treble) * 25 * audioSensitivity);
        setVisualGlow(currentGlow);

        // If in static photo mode and audio is active, re-render frame to pulse character glyphs/brightness
        if (sourceMode === 'image' && (analysis.overall > 0.03 || analysis.isPlaying)) {
          const img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = () => processFrameToAscii(img, analysis);
          img.src = imageSrc;
        }
      } else {
        setVisualScale(1);
        setVisualGlow(0);
      }

      animId = requestAnimationFrame(audioLoop);
    };

    animId = requestAnimationFrame(audioLoop);
    audioAnalysisAnimRef.current = animId;

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [
    isAudioReactive,
    audioSensitivity,
    audioPulseScale,
    sourceMode,
    imageSrc,
    processFrameToAscii,
  ]);

  // Refresh camera devices
  const refreshCameraDevices = async () => {
    try {
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableCameras(videoDevs);
      }
    } catch (e) {
      // ignore
    }
  };

  // Start Webcam Stream with resilient fallback to Virtual Cyber Cam
  const startWebcam = async (deviceId?: string, autoFallback: boolean = true) => {
    setWebcamError(null);
    setIsSimulatedFeed(false);
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam mediaDevices API is not supported in this browser environment.');
      }

      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user',
            },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }

      setIsWebcamActive(true);
      setIsWebcamPaused(false);
      setSourceMode('webcam');
      if (deviceId) setSelectedCameraId(deviceId);
      refreshCameraDevices();

      soundEngine.playSfx('success');
      if (onShowToast) onShowToast('Webcam Live', 'Streaming dynamic live video directly into ASCII converter!');
    } catch (err: any) {
      console.warn('Webcam initialization notice:', err);
      const isPermissionRestricted =
        err.name === 'NotAllowedError' ||
        err.name === 'SecurityError' ||
        (err.message && err.message.toLowerCase().includes('not allowed'));

      const errMsg = isPermissionRestricted
        ? 'Camera permission is restricted by user agent/iframe context. Switched to high-speed Virtual Cyber Cam feed.'
        : err.name === 'NotFoundError'
        ? 'No physical camera detected on system. Switched to Virtual Cyber Cam feed.'
        : err.message || 'Camera device unavailable. Switched to Virtual Cyber Cam feed.';

      setWebcamError(errMsg);

      if (autoFallback) {
        // Automatically start the virtual feed so real-time dynamic ASCII video continues seamlessly!
        startSimulatedFeed(false);
        if (onShowToast) {
          onShowToast('Virtual Cam Active', isPermissionRestricted ? 'Camera restricted: Switched to Virtual Cyber Cam stream.' : errMsg);
        }
      } else {
        if (onShowToast) onShowToast('Camera Notice', errMsg);
      }
    }
  };

  // Start Simulated Virtual Cyber Camera Feed
  const startSimulatedFeed = (playSoundParam?: boolean | React.MouseEvent) => {
    const playSound = typeof playSoundParam === 'boolean' ? playSoundParam : true;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsSimulatedFeed(true);
    setIsWebcamActive(true);
    setIsWebcamPaused(false);
    setSourceMode('webcam');
    if (playSound) soundEngine.playSfx('success');
    if (playSound && onShowToast) {
      onShowToast('Virtual Cam Active', 'Streaming dynamic cyber-motion loop directly into ASCII converter!');
    }
  };

  // Stop Webcam Stream
  const stopWebcam = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
    setIsWebcamPaused(false);
    setIsSimulatedFeed(false);
    setMeasuredFps(0);
    soundEngine.playSfx('click');
  }, []);

  // Cleanup webcam stream on unmount
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioAnalysisAnimRef.current) {
        cancelAnimationFrame(audioAnalysisAnimRef.current);
      }
      flowAudioEngine.disableMicInput();
    };
  }, []);

  // Real-time animation loop for webcam feed
  useEffect(() => {
    if (sourceMode !== 'webcam' || !isWebcamActive || isWebcamPaused) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return;
    }

    const intervalMs = 1000 / targetFps;

    const renderLoop = (timestamp: number) => {
      if (!lastFrameTimeRef.current) lastFrameTimeRef.current = timestamp;
      const elapsed = timestamp - lastFrameTimeRef.current;

      if (elapsed >= intervalMs) {
        lastFrameTimeRef.current = timestamp - (elapsed % intervalMs);

        if (isSimulatedFeed) {
          if (!simCanvasRef.current) {
            simCanvasRef.current = document.createElement('canvas');
            simCanvasRef.current.width = 320;
            simCanvasRef.current.height = 240;
          }
          const sCanvas = simCanvasRef.current;
          const sCtx = sCanvas.getContext('2d');
          if (sCtx) {
            drawSimulatedMotionFrame(sCtx, sCanvas.width, sCanvas.height, timestamp);
            const currentAudio = isAudioReactive ? flowAudioEngine.getAudioAnalysis() : undefined;
            processFrameToAscii(sCanvas as unknown as HTMLImageElement, currentAudio);
            frameCountRef.current += 1;

            if (pipCanvasRef.current) {
              const pCtx = pipCanvasRef.current.getContext('2d');
              if (pCtx) {
                pCtx.drawImage(sCanvas, 0, 0, pipCanvasRef.current.width, pipCanvasRef.current.height);
              }
            }
          }
        } else if (videoRef.current && (videoRef.current.readyState >= 2 || videoRef.current.videoWidth > 0)) {
          const currentAudio = isAudioReactive ? flowAudioEngine.getAudioAnalysis() : undefined;
          processFrameToAscii(videoRef.current, currentAudio);
          frameCountRef.current += 1;
        }

        // Measure actual FPS every 500ms
        const now = Date.now();
        if (now - lastFpsUpdateRef.current >= 500) {
          const actualFps = Math.round((frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current));
          setMeasuredFps(actualFps);
          frameCountRef.current = 0;
          lastFpsUpdateRef.current = now;
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [
    sourceMode,
    isWebcamActive,
    isWebcamPaused,
    targetFps,
    processFrameToAscii,
    isAudioReactive,
    isSimulatedFeed,
  ]);

  // Snapshot current webcam frame and freeze into Image mode
  const handleCaptureSnapshot = () => {
    if (isSimulatedFeed && simCanvasRef.current) {
      const dataUrl = simCanvasRef.current.toDataURL('image/png');
      setImageSrc(dataUrl);
      setSourceMode('image');
      stopWebcam();
      soundEngine.playSfx('success');
      if (onShowToast) onShowToast('Snapshot Captured', 'Frozen virtual frame loaded into Image mode.');
      return;
    }
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    setImageSrc(dataUrl);
    setSourceMode('image');
    stopWebcam();
    soundEngine.playSfx('success');
    if (onShowToast) onShowToast('Snapshot Captured', 'Frozen camera frame loaded into Image mode.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          setSourceMode('image');
          if (isWebcamActive) stopWebcam();
          soundEngine.playSfx('click');
          if (onShowToast) onShowToast('Image Loaded', file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyText = (textToCopy = asciiOutput) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    soundEngine.playSfx('click');
    if (onShowToast) onShowToast('Copied', 'ASCII art copied to clipboard as plain text.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = (textToDownload = asciiOutput) => {
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ascii-art-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    soundEngine.playSfx('open');
    if (onShowToast) onShowToast('Downloaded', 'Saved ASCII art as .txt file.');
  };

  // -------------------------------------------------------------
  // MUSICFX SYNTHESIS CONTROLS
  // -------------------------------------------------------------
  const handleToggleMusicFx = () => {
    if (musicFxPlaying) {
      flowAudioEngine.stopSequencer();
      setMusicFxPlaying(false);
      soundEngine.playSfx('click');
      if (onShowToast) onShowToast('MusicFX Stopped', 'Sequencer playback stopped.');
    } else {
      flowAudioEngine.setBpm(musicFxBpm);
      flowAudioEngine.startSequencer(createDefaultMusicTracks(), [musicFxGenre], () => {});
      setMusicFxPlaying(true);
      setIsAudioReactive(true);
      soundEngine.playSfx('open');
      if (onShowToast) {
        onShowToast(
          'MusicFX Active',
          `Playing ${FLOW_GENRES[musicFxGenre]?.name || musicFxGenre} (${musicFxBpm} BPM) // Frequency analyzer pulse linked!`
        );
      }
    }
  };

  const handleToggleMic = async () => {
    if (audioSourceType === 'mic') {
      flowAudioEngine.disableMicInput();
      setAudioSourceType('musicfx');
      soundEngine.playSfx('click');
    } else {
      const ok = await flowAudioEngine.enableMicInput();
      if (ok) {
        setAudioSourceType('mic');
        setIsAudioReactive(true);
        soundEngine.playSfx('success');
        if (onShowToast) onShowToast('Microphone Linked', 'Live system/room audio now feeding ASCII analyzer!');
      } else {
        if (onShowToast) onShowToast('Microphone Failed', 'Permission denied or no microphone found.');
      }
    }
  };

  // -------------------------------------------------------------
  // WEBRTC BROADCAST / VIEWER HANDLERS
  // -------------------------------------------------------------
  const handleStartBroadcast = () => {
    if (!broadcasterRef.current) return;
    const roomId = broadcasterRef.current.startBroadcast(undefined, 'Live ASCII Art Matrix');
    setBroadcastRoomId(roomId);
    setIsBroadcasting(true);
    setShowBroadcastModal(true);
    soundEngine.playSfx('success');
    if (onShowToast) onShowToast('Broadcast Live!', `Room ID: ${roomId} broadcasting to OS peers via WebRTC.`);
  };

  const handleStopBroadcast = () => {
    if (!broadcasterRef.current) return;
    broadcasterRef.current.stopBroadcast();
    setIsBroadcasting(false);
    setBroadcastRoomId('');
    soundEngine.playSfx('click');
    if (onShowToast) onShowToast('Broadcast Ended', 'P2P WebRTC broadcast terminated.');
  };

  const handleJoinBroadcast = (roomIdToJoin: string) => {
    if (!viewerRef.current || !roomIdToJoin.trim()) return;
    viewerRef.current.connect(roomIdToJoin.trim().toUpperCase());
    setSourceMode('viewer');
    soundEngine.playSfx('open');
    if (onShowToast) onShowToast('Connecting to Stream', `Negotiating WebRTC peer connection with ${roomIdToJoin}...`);
  };

  const handleSendReaction = (emoji: string) => {
    if (viewerRef.current) {
      viewerRef.current.sendReaction(emoji);
      soundEngine.playSfx('click');
      if (onShowToast) onShowToast('Reaction Sent', emoji);
    }
  };

  const getColorClasses = (mode = colorMode) => {
    switch (mode) {
      case 'matrix':
        return 'text-emerald-400 bg-black font-mono shadow-[0_0_20px_rgba(16,185,129,0.15)]';
      case 'amber':
        return 'text-amber-500 bg-black font-mono shadow-[0_0_20px_rgba(245,158,11,0.15)]';
      case 'neon':
        return 'text-fuchsia-400 bg-[#0d0714] font-mono shadow-[0_0_25px_rgba(217,70,239,0.2)]';
      case 'mono':
        return 'text-slate-100 bg-[#0c0d12] font-mono';
      case 'rgb':
        return 'text-slate-100 bg-black font-mono';
      default:
        return 'text-purple-300 bg-black font-mono';
    }
  };

  const getGlowColor = () => {
    switch (colorMode) {
      case 'matrix':
        return 'rgba(16, 185, 129, 0.6)';
      case 'amber':
        return 'rgba(245, 158, 11, 0.6)';
      case 'neon':
        return 'rgba(217, 70, 239, 0.7)';
      default:
        return 'rgba(168, 85, 247, 0.5)';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080511] select-none text-slate-100 overflow-hidden font-sans">
      {/* Top Bar */}
      <div className="h-14 px-4 border-b border-purple-500/20 flex items-center justify-between bg-black/60 backdrop-blur shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-wide">ASCII Art Studio</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-900/50 border border-purple-500/30 text-purple-300">
                v3.0 // P2P WebRTC & Audio Pulse
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>Matrix Synthesis Engine</span>
              {sourceMode === 'webcam' && isWebcamActive && (
                <span className="flex items-center gap-1 text-rose-400 font-semibold animate-pulse">
                  <Circle className="w-2 h-2 fill-rose-500" /> LIVE CAMERA ({measuredFps} FPS)
                </span>
              )}
              {isBroadcasting && (
                <span className="flex items-center gap-1 text-emerald-400 font-semibold font-mono bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" /> BROADCASTING ({connectedPeers.length} PEERS)
                </span>
              )}
              {sourceMode === 'viewer' && viewerStatus.isConnected && (
                <span className="flex items-center gap-1 text-cyan-400 font-semibold font-mono bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-500/30">
                  <Tv className="w-2.5 h-2.5 text-cyan-400" /> WATCHING: {viewerStatus.roomId} ({viewerStatus.fps} FPS)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Source Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-purple-950/40 border border-purple-500/30 shadow-inner">
            <button
              onClick={() => {
                setSourceMode('image');
                soundEngine.playSfx('click');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                sourceMode === 'image'
                  ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Photo
            </button>
            <button
              onClick={() => {
                if (!isWebcamActive) {
                  startWebcam();
                } else {
                  setSourceMode('webcam');
                }
                soundEngine.playSfx('click');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                sourceMode === 'webcam'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" /> Webcam
            </button>
            <button
              onClick={() => {
                setSourceMode('viewer');
                soundEngine.playSfx('click');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                sourceMode === 'viewer'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tv className="w-3.5 h-3.5" /> P2P Viewer
            </button>
          </div>

          {/* WebRTC Broadcast Button */}
          {!isBroadcasting ? (
            <button
              onClick={handleStartBroadcast}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 text-emerald-300 transition shadow-sm hover:scale-105"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Broadcast P2P</span>
            </button>
          ) : (
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold flex items-center gap-1.5 text-white shadow-lg shadow-emerald-600/30 transition animate-pulse"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Live Cast ({connectedPeers.length})</span>
            </button>
          )}

          {/* MusicFX Audio Pulse Button */}
          <button
            onClick={() => {
              setIsAudioReactive(!isAudioReactive);
              soundEngine.playSfx('click');
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition ${
              isAudioReactive
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 border-amber-400 text-white shadow-md shadow-amber-500/30'
                : 'bg-purple-950/60 hover:bg-purple-900/60 border-purple-500/40 text-purple-300'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${isAudioReactive ? 'animate-bounce text-yellow-300' : 'text-purple-400'}`} />
            <span>Audio Pulse {isAudioReactive ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setShowSavePresetModal(true)}
            className="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-xs font-medium flex items-center gap-1.5 transition text-purple-200 hover:text-white"
            title="Save current config as reusable Art Preset"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-fuchsia-400" />
            Preset
          </button>

          <button
            onClick={() => presetFileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-xs font-medium flex items-center gap-1.5 transition text-cyan-200 hover:text-white"
            title="Import custom Art Presets from JSON file"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import Presets</span>
          </button>
          <input
            ref={presetFileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImportPresetsFile}
          />

          <button
            onClick={handleExportPresets}
            className="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-xs font-medium flex items-center gap-1.5 transition text-fuchsia-200 hover:text-white"
            title="Export all custom Art Presets to a single JSON file"
          >
            <FileDown className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Export Presets</span>
          </button>

          <button
            onClick={() => handleCopyText(sourceMode === 'viewer' && remoteFrame ? remoteFrame.text : asciiOutput)}
            className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-xs font-medium flex items-center gap-1.5 transition text-purple-200"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>

          <button
            onClick={() => handleDownloadTxt(sourceMode === 'viewer' && remoteFrame ? remoteFrame.text : asciiOutput)}
            className="px-3 py-1.5 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-xs font-semibold flex items-center gap-1.5 transition text-white shadow-lg shadow-fuchsia-600/30"
            title="Download rendered ASCII output as text file"
          >
            <Download className="w-3.5 h-3.5" />
            Export TXT
          </button>
        </div>
      </div>

      {/* Reusable Art Presets Carousel / Quick Bar with Inline Canvas Previews */}
      <div className="min-h-[58px] py-1.5 px-4 bg-purple-950/20 border-b border-purple-500/20 flex items-center justify-between gap-3 overflow-x-auto shrink-0 scrollbar-thin">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-purple-300 uppercase tracking-wider shrink-0 mr-1">
            <Bookmark className="w-3.5 h-3.5 text-fuchsia-400" /> Presets:
          </div>
          <div className="flex items-center gap-2">
            {presets.map((preset) => {
              const isActive = activePresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  className={`group flex items-center rounded-xl border text-xs transition shrink-0 p-1 gap-2 ${
                    isActive
                      ? 'bg-fuchsia-600/30 border-fuchsia-400 text-white font-medium shadow-md shadow-fuchsia-600/20'
                      : 'bg-black/50 border-purple-500/20 text-slate-300 hover:border-purple-400/50 hover:bg-purple-950/50'
                  }`}
                >
                  <button
                    onClick={() => handleApplyPreset(preset)}
                    className="flex items-center gap-2 text-left"
                    title={`Click to apply preset: ${preset.name} (${preset.colorMode})`}
                  >
                    <div className="relative">
                      <PresetThumbnailPreview
                        preset={preset}
                        sourceCanvasRef={canvasRef}
                        fallbackImageSrc={imageSrc}
                        version={previewVersion}
                      />
                      {isActive && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-fuchsia-400 rounded-full border-2 border-black" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 pr-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs truncate max-w-[120px] text-white">
                          {preset.name}
                        </span>
                        {!preset.isBuiltIn && (
                          <span className="text-[9px] bg-purple-500/30 text-purple-200 px-1 py-0.2 rounded font-mono">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                        <span className="capitalize">{preset.colorMode}</span>
                        <span>•</span>
                        <span>{preset.charSetKey}</span>
                      </div>
                    </div>
                  </button>
                  {!preset.isBuiltIn && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePreset(preset.id, preset.name);
                      }}
                      title="Delete custom preset"
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition mr-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Bar Utility Controls */}
        <div className="flex items-center gap-1.5 shrink-0 pl-3 border-l border-purple-500/20">
          <button
            onClick={() => setShowSavePresetModal(true)}
            className="px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-[11px] font-medium flex items-center gap-1 text-purple-200 hover:text-white transition"
            title="Save current configuration as new preset"
          >
            <BookmarkPlus className="w-3 h-3 text-fuchsia-400" />
            <span>+ Save</span>
          </button>
          <button
            onClick={handleExportPresets}
            className="px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-[11px] font-medium flex items-center gap-1 text-fuchsia-200 hover:text-white transition"
            title="Export custom presets to JSON"
          >
            <FileDown className="w-3 h-3 text-fuchsia-400" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => presetFileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-[11px] font-medium flex items-center gap-1 text-cyan-200 hover:text-white transition"
            title="Import presets from JSON"
          >
            <Upload className="w-3 h-3 text-cyan-400" />
            <span>Import JSON</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Controls */}
        <div className="w-84 border-r border-purple-500/20 bg-black/40 backdrop-blur p-4 flex flex-col space-y-4 overflow-y-auto shrink-0">
          {/* Source specific controls */}
          {sourceMode === 'image' && (
            <div>
              <label className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Image Source
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/30 hover:bg-purple-900/40 text-xs flex items-center justify-center gap-1.5 text-purple-200 transition"
                >
                  <FileUp className="w-3.5 h-3.5 text-fuchsia-400" /> Upload File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  onClick={() => generateAsciiFromImage()}
                  className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/30 hover:bg-purple-900/40 text-xs flex items-center justify-center gap-1.5 text-purple-200 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-fuchsia-400 ${isProcessing ? 'animate-spin' : ''}`} /> Re-render
                </button>
              </div>

              <div className="text-[11px] text-slate-400 mb-1">Sample Gallery:</div>
              <div className="grid grid-cols-2 gap-1.5">
                {SAMPLE_IMAGES.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setImageSrc(sample.url);
                      soundEngine.playSfx('click');
                      if (onShowToast) onShowToast('Image Selected', sample.name);
                    }}
                    className={`p-1.5 rounded text-left text-[11px] truncate border transition ${
                      imageSrc === sample.url
                        ? 'bg-fuchsia-600/30 border-fuchsia-500 text-white font-medium'
                        : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-purple-500/40'
                    }`}
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sourceMode === 'webcam' && (
            <div className="p-3 rounded-xl bg-purple-950/30 border border-rose-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-rose-400" /> Live Webcam Feed
                </label>
                {isWebcamActive && (
                  <span className="flex items-center gap-1 text-[10px] text-rose-400 font-mono font-bold">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                    {isWebcamPaused ? 'PAUSED' : isSimulatedFeed ? 'VIRTUAL' : 'LIVE'}
                  </span>
                )}
              </div>

              {webcamError && (
                <div className="text-[11px] p-2.5 rounded-lg bg-rose-950/70 border border-rose-500/50 text-rose-200 space-y-2">
                  <div className="leading-snug">{webcamError}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={startSimulatedFeed}
                      className="px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[10px] flex items-center gap-1 transition"
                    >
                      <Sparkles className="w-3 h-3" /> Launch Virtual Cam Loop
                    </button>
                    <button
                      onClick={() => startWebcam()}
                      className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] transition"
                    >
                      Retry Camera
                    </button>
                  </div>
                </div>
              )}

              {/* Webcam Video Preview & Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {!isWebcamActive ? (
                  <>
                    <button
                      onClick={() => startWebcam()}
                      className="col-span-2 py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition"
                    >
                      <Video className="w-4 h-4" /> Start Live Camera
                    </button>
                    <button
                      onClick={startSimulatedFeed}
                      className="col-span-2 py-1.5 px-3 rounded-lg bg-purple-900/40 hover:bg-purple-900/70 border border-purple-500/40 text-purple-200 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" /> Test with Virtual Cam Feed
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setIsWebcamPaused(!isWebcamPaused);
                        soundEngine.playSfx('click');
                      }}
                      className="py-1.5 px-2 rounded-lg bg-purple-900/50 hover:bg-purple-800/50 border border-purple-500/40 text-xs flex items-center justify-center gap-1.5 text-purple-200 transition"
                    >
                      {isWebcamPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                      {isWebcamPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button
                      onClick={stopWebcam}
                      className="py-1.5 px-2 rounded-lg bg-rose-950/50 hover:bg-rose-900/50 border border-rose-500/40 text-xs flex items-center justify-center gap-1.5 text-rose-200 transition"
                    >
                      <VideoOff className="w-3.5 h-3.5 text-rose-400" /> Stop
                    </button>
                    <button
                      onClick={() => setMirrorWebcam(!mirrorWebcam)}
                      className={`col-span-1 py-1.5 px-2 rounded-lg border text-xs flex items-center justify-center gap-1.5 transition ${
                        mirrorWebcam
                          ? 'bg-purple-600/30 border-purple-400 text-white'
                          : 'bg-black/40 border-purple-500/20 text-slate-300'
                      }`}
                    >
                      <FlipHorizontal className="w-3.5 h-3.5 text-fuchsia-400" /> Mirror {mirrorWebcam ? 'On' : 'Off'}
                    </button>
                    <button
                      onClick={handleCaptureSnapshot}
                      className="col-span-1 py-1.5 px-2 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-xs flex items-center justify-center gap-1.5 text-emerald-200 transition"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-400" /> Snap Photo
                    </button>
                  </>
                )}
              </div>

              {/* Camera Hardware Switcher if multiple devices */}
              {availableCameras.length > 1 && (
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Select Camera Device</label>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => startWebcam(e.target.value)}
                    className="w-full bg-slate-900 border border-purple-500/30 rounded-lg p-1.5 text-[11px] text-slate-200 focus:outline-none"
                  >
                    {availableCameras.map((dev, i) => (
                      <option key={dev.deviceId || i} value={dev.deviceId}>
                        {dev.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Framerate Selection */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Target FPS</span>
                  <span className="text-rose-300 font-mono">{targetFps} FPS ({measuredFps} actual)</span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[12, 18, 24, 30].map((fps) => (
                    <button
                      key={fps}
                      onClick={() => setTargetFps(fps)}
                      className={`py-1 rounded text-[11px] border font-mono transition ${
                        targetFps === fps
                          ? 'bg-rose-600/40 border-rose-400 text-white font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {fps}
                    </button>
                  ))}
                </div>
              </div>

              {/* Picture-in-Picture Toggle */}
              {isWebcamActive && (
                <div className="pt-1">
                  <button
                    onClick={() => setShowWebcamPip(!showWebcamPip)}
                    className={`w-full py-1.5 px-2 rounded-lg border text-xs flex items-center justify-center gap-1.5 transition ${
                      showWebcamPip
                        ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                        : 'bg-black/40 border-purple-500/20 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {showWebcamPip ? <Eye className="w-3.5 h-3.5 text-rose-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>Camera Monitor PiP: {showWebcamPip ? 'Visible' : 'Hidden'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {sourceMode === 'viewer' && (
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5 text-cyan-400" /> Remote ASCII Receiver
                </label>
                {viewerStatus.isConnected && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    CONNECTED
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-300 leading-relaxed">
                Tune into real-time ASCII video streams broadcasted by other clients in the OS via WebRTC DataChannels.
              </div>

              {/* Join by Code Input */}
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="ROOM CODE (e.g. CAST-7421)"
                  value={joinRoomInput}
                  onChange={(e) => setJoinRoomInput(e.target.value.toUpperCase())}
                  className="flex-1 bg-black/60 border border-cyan-500/30 rounded-lg px-2.5 py-1.5 text-xs text-cyan-200 uppercase font-mono focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={() => handleJoinBroadcast(joinRoomInput)}
                  disabled={!joinRoomInput.trim() || viewerStatus.isConnecting}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs transition"
                >
                  Join
                </button>
              </div>

              {/* Discovered OS Broadcasts */}
              <div>
                <div className="text-[11px] font-semibold text-cyan-300 mb-1.5 flex items-center justify-between">
                  <span>Active OS Channels:</span>
                  <span className="text-[10px] text-slate-400 font-mono">{discoveredBroadcasts.length} found</span>
                </div>
                {discoveredBroadcasts.length === 0 ? (
                  <div className="text-[11px] p-2.5 rounded-lg bg-black/40 border border-purple-500/20 text-slate-400 text-center">
                    No active broadcasts detected in OS. Start a broadcast or check other tabs!
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {discoveredBroadcasts.map((b) => (
                      <div
                        key={b.roomId}
                        className="p-2 rounded-lg bg-black/60 border border-cyan-500/30 flex items-center justify-between hover:border-cyan-400 transition"
                      >
                        <div>
                          <div className="text-xs font-bold font-mono text-cyan-300">{b.roomId}</div>
                          <div className="text-[10px] text-slate-400">
                            {b.title} • {b.fps} FPS
                          </div>
                        </div>
                        <button
                          onClick={() => handleJoinBroadcast(b.roomId)}
                          className="px-2 py-1 rounded bg-cyan-600/40 hover:bg-cyan-600 text-[11px] font-semibold text-cyan-200 hover:text-white transition"
                        >
                          Watch
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {viewerStatus.isConnected && (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Channel:</span>
                    <span className="font-mono text-emerald-300 font-bold">{viewerStatus.roomId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Stream FPS:</span>
                    <span className="font-mono text-emerald-300">{viewerStatus.fps} FPS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Round-Trip Latency:</span>
                    <span className="font-mono text-emerald-300">{viewerStatus.rtt} ms</span>
                  </div>
                  <button
                    onClick={() => viewerRef.current?.disconnect()}
                    className="w-full mt-1 py-1 rounded bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 border border-rose-500/30 text-xs transition"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}

          <hr className="border-purple-500/10" />

          {/* MUSICFX AUDIO REACTIVE ENGINE CONTROLS */}
          <div className="p-3 rounded-xl bg-purple-950/30 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-amber-400" /> MusicFX Audio Pulse
              </label>
              <button
                onClick={() => {
                  setIsAudioReactive(!isAudioReactive);
                  soundEngine.playSfx('click');
                }}
                className={`w-9 h-5 rounded-full transition relative p-0.5 ${
                  isAudioReactive ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition transform ${
                    isAudioReactive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Audio Source & Transport */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleToggleMusicFx}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    musicFxPlaying
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30'
                      : 'bg-purple-900/50 hover:bg-purple-800/50 text-amber-200 border border-amber-500/30'
                  }`}
                >
                  {musicFxPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                  <span>{musicFxPlaying ? 'Stop MusicFX' : 'Play MusicFX Synth'}</span>
                </button>
                <button
                  onClick={handleToggleMic}
                  title="Toggle Microphone / System Audio"
                  className={`p-1.5 rounded-lg border text-xs transition ${
                    audioSourceType === 'mic'
                      ? 'bg-rose-600 border-rose-400 text-white'
                      : 'bg-black/40 border-purple-500/30 text-slate-300 hover:text-white'
                  }`}
                >
                  {audioSourceType === 'mic' ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
              </div>

              {/* MusicFX Genre Selector */}
              <div>
                <div className="text-[10px] text-slate-400 mb-1 flex justify-between">
                  <span>Synthesizer Genre:</span>
                  <span className="text-amber-300 font-mono">{musicFxBpm} BPM</span>
                </div>
                <select
                  value={musicFxGenre}
                  onChange={(e) => {
                    const g = e.target.value as FlowGenre;
                    setMusicFxGenre(g);
                    setMusicFxBpm(FLOW_GENRES[g]?.defaultBpm || 128);
                    if (musicFxPlaying) {
                      flowAudioEngine.stopSequencer();
                      flowAudioEngine.setBpm(FLOW_GENRES[g]?.defaultBpm || 128);
                      flowAudioEngine.startSequencer(createDefaultMusicTracks(), [g], () => {});
                    }
                    soundEngine.playSfx('click');
                  }}
                  className="w-full bg-slate-900 border border-amber-500/30 rounded-lg p-1.5 text-xs text-amber-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="techno">Techno (130 BPM)</option>
                  <option value="stone_techno">Stone Techno (136 BPM)</option>
                  <option value="industrial_techno">Industrial Techno (142 BPM)</option>
                  <option value="trap_phonk">Trap Phonk Mutation (145 BPM)</option>
                  <option value="dubstep">Dubstep Wobble (140 BPM)</option>
                  <option value="dnb">Drum & Bass (174 BPM)</option>
                  <option value="synthwave">Synthwave (118 BPM)</option>
                  <option value="lofi">Lo-Fi Chill (84 BPM)</option>
                  <option value="grunge">Grunge Sludge (116 BPM)</option>
                </select>
              </div>

              {/* Real-Time Frequency Spectrum Meter Overlay */}
              <div className="p-2 rounded-lg bg-black/60 border border-amber-500/20 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-300">
                  <span className="flex items-center gap-1 font-mono text-amber-300">
                    <Activity className="w-2.5 h-2.5" /> 16-BAND SPECTRUM
                  </span>
                  <span className="font-mono text-[9px] text-slate-400">
                    BASS: {Math.round(audioMetrics.bass * 100)}% • MID: {Math.round(audioMetrics.mid * 100)}%
                  </span>
                </div>
                {/* 16-bar mini EQ */}
                <div className="h-8 flex items-end gap-1 px-1 bg-[#05030a] rounded overflow-hidden">
                  {Array.from(audioMetrics.rawFft).map((val, idx) => {
                    const heightPercent = Math.min(100, Math.max(8, (val / 255) * 100));
                    const isBassBand = idx < 4;
                    const isMidBand = idx >= 4 && idx < 10;
                    return (
                      <div
                        key={idx}
                        className={`flex-1 rounded-t transition-all duration-75 ${
                          isBassBand ? 'bg-amber-500' : isMidBand ? 'bg-fuchsia-500' : 'bg-cyan-400'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Pulse Modulation Sliders */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Pulse Sensitivity</span>
                  <span className="text-amber-300 font-mono">{audioSensitivity.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.5}
                  step={0.1}
                  value={audioSensitivity}
                  onChange={(e) => setAudioSensitivity(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <button
                  onClick={() => setAudioBloomEnabled(!audioBloomEnabled)}
                  className={`p-1.5 rounded-lg border flex items-center justify-center gap-1 transition ${
                    audioBloomEnabled
                      ? 'bg-amber-500/30 border-amber-400 text-white font-medium'
                      : 'bg-black/40 border-purple-500/20 text-slate-400'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-400" /> Audio Bloom
                </button>
                <button
                  onClick={() => setAudioMorphEnabled(!audioMorphEnabled)}
                  className={`p-1.5 rounded-lg border flex items-center justify-center gap-1 transition ${
                    audioMorphEnabled
                      ? 'bg-fuchsia-500/30 border-fuchsia-400 text-white font-medium'
                      : 'bg-black/40 border-purple-500/20 text-slate-400'
                  }`}
                >
                  <RefreshCw className="w-3 h-3 text-fuchsia-400" /> Morph Glyphs
                </button>
              </div>
            </div>
          </div>

          <hr className="border-purple-500/10" />

          {/* Character Set */}
          <div>
            <label className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Character Ramp
            </label>
            <select
              value={charSetKey}
              onChange={(e) => {
                setCharSetKey(e.target.value as CharSetType);
                soundEngine.playSfx('click');
              }}
              className="w-full bg-slate-900 border border-purple-500/30 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-fuchsia-500"
            >
              <option value="blocks">Shaded Blocks (█▓▒░ )</option>
              <option value="standard">Standard Ramp (@%#*+=-:. )</option>
              <option value="matrix">Matrix Katakana Stream</option>
              <option value="binary">Binary Bits (10 )</option>
              <option value="minimal">Minimal Dots (#+. )</option>
              <option value="custom">Custom Character String</option>
            </select>

            {charSetKey === 'custom' && (
              <input
                type="text"
                value={customChars}
                onChange={(e) => setCustomChars(e.target.value)}
                placeholder="Enter characters dark to light..."
                className="mt-2 w-full bg-slate-900 border border-purple-500/30 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-fuchsia-500"
              />
            )}
          </div>

          {/* Color Mode */}
          <div>
            <label className="text-xs font-semibold text-purple-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" /> Color Palette
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['neon', 'matrix', 'amber', 'mono', 'rgb'] as ColorModeType[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setColorMode(mode);
                    soundEngine.playSfx('click');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs capitalize border transition font-medium ${
                    colorMode === mode
                      ? 'bg-fuchsia-600 border-fuchsia-400 text-white shadow-md shadow-fuchsia-600/30'
                      : 'bg-slate-900/60 border-purple-500/20 text-slate-300 hover:bg-purple-950/30'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-purple-500/10" />

          {/* Sliders & Adjustments */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Image & Stream Tuning
            </label>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Resolution Width</span>
                <span className="text-fuchsia-300 font-mono">{width} cols</span>
              </div>
              <input
                type="range"
                min={30}
                max={sourceMode === 'webcam' ? 120 : 150}
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full accent-fuchsia-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Contrast</span>
                <span className="text-fuchsia-300 font-mono">{contrast.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={3.0}
                step={0.1}
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full accent-fuchsia-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Brightness</span>
                <span className="text-fuchsia-300 font-mono">{brightness.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.1}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full accent-fuchsia-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-300">Invert Luminance</span>
              <button
                onClick={() => {
                  setInvert(!invert);
                  soundEngine.playSfx('click');
                }}
                className={`w-10 h-6 rounded-full transition relative p-1 ${
                  invert ? 'bg-fuchsia-600' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition transform ${
                    invert ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Main ASCII Viewer Area */}
        <div className="flex-1 flex flex-col bg-[#050308] p-4 overflow-hidden relative">
          {/* Hidden helper canvas */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Picture-in-Picture Floating Camera Monitor / Video Element */}
          <div
            className={
              sourceMode === 'webcam' && isWebcamActive && showWebcamPip
                ? 'absolute bottom-6 right-6 z-30 w-56 rounded-2xl border border-rose-500/40 bg-black/90 backdrop-blur-md shadow-2xl p-2.5 flex flex-col gap-2 transition-all'
                : 'fixed -top-[9999px] -left-[9999px] opacity-0 pointer-events-none w-48 h-36'
            }
          >
            <div className="flex items-center justify-between px-1 text-[11px] text-rose-300 font-mono">
              <div className="flex items-center gap-1.5 font-bold">
                <Circle className="w-2 h-2 fill-rose-500 animate-pulse" />
                <span>{isSimulatedFeed ? 'VIRTUAL CAM' : 'RAW CAMERA'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">{measuredFps} FPS</span>
                <button
                  onClick={() => setShowWebcamPip(false)}
                  className="text-slate-400 hover:text-white p-0.5 rounded transition"
                  title="Minimize camera PiP monitor"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Video or Simulated Canvas Viewport */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-purple-500/30 shadow-inner">
              {isSimulatedFeed ? (
                <canvas
                  ref={pipCanvasRef}
                  width={160}
                  height={120}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className={`w-full h-full object-cover ${mirrorWebcam ? 'scale-x-[-1]' : ''}`}
                />
              )}

              {/* Cyber Crosshair Target Overlay */}
              <div className="absolute inset-0 pointer-events-none border border-rose-500/20 flex items-center justify-center">
                <div className="w-10 h-10 border border-rose-500/40 rounded-lg flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                </div>
              </div>
            </div>

            {/* Quick PiP Controls */}
            <div className="grid grid-cols-3 gap-1 pt-0.5">
              <button
                onClick={() => setIsWebcamPaused(!isWebcamPaused)}
                className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] flex items-center justify-center gap-1 text-slate-200 transition"
                title={isWebcamPaused ? 'Resume video stream' : 'Pause video stream'}
              >
                {isWebcamPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
                <span>{isWebcamPaused ? 'Play' : 'Pause'}</span>
              </button>
              <button
                onClick={() => setMirrorWebcam(!mirrorWebcam)}
                className={`py-1 px-1.5 rounded-lg text-[10px] flex items-center justify-center gap-1 transition ${
                  mirrorWebcam ? 'bg-purple-600/40 text-purple-200' : 'bg-slate-800 text-slate-300'
                }`}
                title="Mirror camera horizontally"
              >
                <FlipHorizontal className="w-3 h-3 text-fuchsia-400" />
                <span>Mirror</span>
              </button>
              <button
                onClick={handleCaptureSnapshot}
                className="py-1 px-1.5 rounded-lg bg-emerald-600/40 hover:bg-emerald-600/60 text-[10px] flex items-center justify-center gap-1 text-emerald-200 transition"
                title="Snap current frame into photo mode"
              >
                <Camera className="w-3 h-3 text-emerald-400" />
                <span>Snap</span>
              </button>
            </div>
          </div>

          {/* Collapsed PiP Reopen Button */}
          {sourceMode === 'webcam' && isWebcamActive && !showWebcamPip && (
            <button
              onClick={() => setShowWebcamPip(true)}
              className="absolute bottom-6 right-6 z-30 px-3.5 py-2 rounded-full bg-black/90 hover:bg-black border border-rose-500/50 backdrop-blur shadow-2xl text-xs text-rose-300 flex items-center gap-2 transition hover:scale-105"
            >
              <Monitor className="w-4 h-4 text-rose-400" />
              <span>Show Camera Monitor ({measuredFps} FPS)</span>
            </button>
          )}

          {/* Floating Emoji Reactions Overlay */}
          <div className="absolute top-6 right-6 z-30 pointer-events-none flex flex-col-reverse items-end gap-2">
            {reactions.slice(0, 5).map((rx) => (
              <div
                key={rx.id}
                className="animate-bounce flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 border border-purple-500/50 backdrop-blur shadow-xl text-xs text-purple-200"
              >
                <span className="text-lg">{rx.emoji}</span>
                <span className="text-[10px] font-mono font-semibold">{rx.senderName}</span>
              </div>
            ))}
          </div>

          {/* Main Display Container */}
          <div className="flex-1 rounded-xl border border-purple-500/20 bg-black/80 overflow-auto p-4 shadow-2xl flex items-center justify-center relative">
            {/* Live Streaming Badge Overlay */}
            {sourceMode === 'webcam' && isWebcamActive && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 border border-rose-500/50 backdrop-blur">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
                <span className="text-xs font-mono font-bold text-rose-400 tracking-wider">
                  {isSimulatedFeed ? 'VIRTUAL ASCII STREAM' : 'LIVE ASCII WEBCAM'}
                </span>
                <span className="text-[11px] font-mono text-slate-300 pl-1 border-l border-rose-500/30">
                  {measuredFps} FPS
                </span>
                {isWebcamPaused && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-bold">
                    PAUSED
                  </span>
                )}
                {isAudioReactive && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/30 text-amber-300 font-mono font-bold flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5 text-amber-400 animate-bounce" /> AUDIO PULSE
                  </span>
                )}
              </div>
            )}

            {/* Remote Viewer Header Overlay */}
            {sourceMode === 'viewer' && viewerStatus.isConnected && remoteFrame && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 border border-cyan-500/50 backdrop-blur">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                <span className="text-xs font-mono font-bold text-cyan-300 tracking-wider">
                  REMOTE P2P FEED: {remoteFrame.roomId}
                </span>
                <span className="text-[11px] font-mono text-slate-300 pl-1 border-l border-cyan-500/30">
                  {viewerStatus.fps} FPS ({viewerStatus.rtt}ms RTT)
                </span>
              </div>
            )}

            {/* Inactive webcam placeholder */}
            {sourceMode === 'webcam' && !isWebcamActive && (
              <div className="text-center p-8 max-w-md bg-purple-950/20 rounded-2xl border border-purple-500/30 backdrop-blur">
                <Video className="w-12 h-12 text-rose-400 mx-auto mb-3 animate-pulse" />
                <h3 className="text-lg font-bold text-white mb-2">Live Webcam Stream Inactive</h3>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                  Stream your camera in real time directly into the dynamic ASCII matrix converter. Experience live cyberpunk video rasterization!
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-2.5">
                  <button
                    onClick={() => startWebcam()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:from-rose-500 hover:to-fuchsia-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition transform hover:scale-105"
                  >
                    <Video className="w-4 h-4" /> Start Live Camera
                  </button>
                  <button
                    onClick={startSimulatedFeed}
                    className="px-4 py-2.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/40 text-purple-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 shadow transition"
                  >
                    <Sparkles className="w-4 h-4 text-fuchsia-400" /> Virtual Cyber Cam
                  </button>
                </div>
              </div>
            )}

            {/* Inactive viewer placeholder */}
            {sourceMode === 'viewer' && !viewerStatus.isConnected && (
              <div className="text-center p-8 max-w-md bg-cyan-950/20 rounded-2xl border border-cyan-500/30 backdrop-blur">
                <Tv className="w-12 h-12 text-cyan-400 mx-auto mb-3 animate-pulse" />
                <h3 className="text-lg font-bold text-white mb-2">WebRTC P2P Receiver Inactive</h3>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                  Connect to a live broadcast running anywhere in the OS via WebRTC DataChannels. Stream live ASCII frames with zero loss and sub-frame latency.
                </p>
                <div className="flex justify-center gap-2">
                  {discoveredBroadcasts.length > 0 ? (
                    <button
                      onClick={() => handleJoinBroadcast(discoveredBroadcasts[0].roomId)}
                      className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition"
                    >
                      <Wifi className="w-4 h-4" /> Connect to {discoveredBroadcasts[0].roomId}
                    </button>
                  ) : (
                    <button
                      onClick={handleStartBroadcast}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition"
                    >
                      <Radio className="w-4 h-4" /> Start Host Broadcast
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ASCII Output Display with Dynamic Audio-Reactive Transform & Glow */}
            {(sourceMode === 'image' || isWebcamActive || (sourceMode === 'viewer' && viewerStatus.isConnected)) && (
              <pre
                className={`text-[8px] sm:text-[9.5px] md:text-[10.5px] leading-[1.05] whitespace-pre select-all selection:bg-fuchsia-500 selection:text-white transition-transform duration-75 ${getColorClasses(
                  sourceMode === 'viewer' && remoteFrame ? (remoteFrame.colorMode as ColorModeType) : colorMode
                )}`}
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  transform: `scale(${visualScale})`,
                  filter: visualGlow > 2 ? `drop-shadow(0 0 ${visualGlow}px ${getGlowColor()})` : undefined,
                }}
                dangerouslySetInnerHTML={{
                  __html:
                    sourceMode === 'viewer' && remoteFrame
                      ? remoteFrame.html || remoteFrame.text
                      : colorMode === 'rgb'
                      ? htmlOutput
                      : asciiOutput,
                }}
              />
            )}
          </div>

          {/* Footer Bar & Viewer Reactions Toolbar */}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 px-1 shrink-0">
            <div className="flex items-center gap-3">
              <span>
                Grid: <span className="text-fuchsia-400 font-mono">{width} cols</span>
              </span>
              <span>•</span>
              <span>
                Ramp: <span className="text-purple-300 font-mono">{charSetKey}</span>
              </span>
              <span>•</span>
              <span>
                Palette: <span className="text-emerald-400 font-mono uppercase">{colorMode}</span>
              </span>
              {isAudioReactive && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-400 font-mono">
                    <Activity className="w-3 h-3 animate-pulse" />
                    PULSE: {Math.round(audioMetrics.bass * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* Interactive Reactions Toolbar for Viewers / Broadcasters */}
            {sourceMode === 'viewer' && viewerStatus.isConnected ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-cyan-300 font-medium">Cheer Stream:</span>
                {(['🔥', '⚡', '🚀', '❤️', '👏'] as const).map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSendReaction(emoji)}
                    className="p-1 rounded bg-black/60 hover:bg-cyan-900/40 border border-cyan-500/30 text-sm hover:scale-125 transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {isBroadcasting && (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>Broadcasting to {connectedPeers.length} clients</span>
                  </div>
                )}
                {sourceMode === 'webcam' && isWebcamActive ? (
                  <div className="flex items-center gap-1.5 text-rose-300">
                    <Gauge className="w-3.5 h-3.5" />
                    <span>Real-time dynamic synthesis active</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse" />
                    <span>Audio pulse & WebRTC P2P active</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WEBRTC BROADCAST CONTROL MODAL */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0d0917] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowBroadcastModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Peer-to-Peer WebRTC Broadcast</h3>
                <div className="text-xs text-emerald-400 font-mono">Status: {isBroadcasting ? 'ACTIVE & STREAMING' : 'OFFLINE'}</div>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Streams your live ASCII video output across other windows, tabs, and clients in the OS with WebRTC DataChannels.
            </p>

            {/* Room Code Banner */}
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 mb-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">OS Broadcast Room ID</div>
                <div className="text-lg font-black font-mono text-white tracking-widest">{broadcastRoomId}</div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(broadcastRoomId);
                  soundEngine.playSfx('click');
                  if (onShowToast) onShowToast('Room ID Copied', broadcastRoomId);
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5 transition shadow"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Code
              </button>
            </div>

            {/* Broadcast Statistics */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-2.5 rounded-lg bg-black/60 border border-purple-500/20 text-center">
                <div className="text-[10px] text-slate-400">Connected Peers</div>
                <div className="text-base font-bold text-white font-mono">{connectedPeers.length}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-black/60 border border-purple-500/20 text-center">
                <div className="text-[10px] text-slate-400">Packets Broadcasted</div>
                <div className="text-base font-bold text-emerald-400 font-mono">{broadcastStats.packets}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-black/60 border border-purple-500/20 text-center">
                <div className="text-[10px] text-slate-400">Data Transferred</div>
                <div className="text-base font-bold text-cyan-400 font-mono">
                  {(broadcastStats.bytes / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>

            {/* Connected Peers List */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-purple-300 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Active Connected Clients ({connectedPeers.length}):
              </div>
              {connectedPeers.length === 0 ? (
                <div className="p-3 rounded-lg bg-black/40 border border-purple-500/20 text-center text-xs text-slate-400">
                  Waiting for other clients in the OS to join room <span className="font-mono text-emerald-300 font-bold">{broadcastRoomId}</span>...
                </div>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {connectedPeers.map((p) => (
                    <div
                      key={p.id}
                      className="p-2 rounded-lg bg-black/60 border border-purple-500/30 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-bold text-white">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({p.id})</span>
                      </div>
                      <div className="font-mono text-emerald-400 text-[11px]">{p.latencyMs} ms latency</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
              >
                Close Window
              </button>
              <button
                onClick={() => {
                  handleStopBroadcast();
                  setShowBroadcastModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg transition"
              >
                End Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Art Preset Modal */}
      {showSavePresetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0f0b1a] border border-purple-500/40 rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setShowSavePresetModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <BookmarkPlus className="w-5 h-5 text-fuchsia-400" />
              <h3 className="text-base font-bold text-white">Save Custom Art Preset</h3>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Persist your current character ramp, color palette, dimensions, contrast, and brightness settings as a reusable Art Preset in localStorage.
            </p>

            {/* Current Config Summary */}
            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 mb-4 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Character Ramp:</span>
                <span className="text-fuchsia-300 font-mono">{charSetKey}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Color Palette:</span>
                <span className="text-purple-200 font-mono capitalize">{colorMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Resolution Width:</span>
                <span className="text-slate-200 font-mono">{width} cols</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Contrast / Brightness:</span>
                <span className="text-slate-200 font-mono">
                  {contrast.toFixed(1)}x / {brightness.toFixed(1)}x
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Invert Luminance:</span>
                <span className="text-slate-200 font-mono">{invert ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <form onSubmit={handleSavePreset}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Preset Name</label>
                <input
                  type="text"
                  autoFocus
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="e.g. My Synthwave Rig, Dark Matrix 2.0"
                  className="w-full bg-slate-900 border border-purple-500/40 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-fuchsia-400"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSavePresetModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPresetName.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 disabled:opacity-50 text-xs font-semibold text-white shadow-lg shadow-fuchsia-600/30 transition"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
