import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
  Wand2,
  FileArchive,
  UploadCloud,
  Download,
  Pin,
  PinOff,
  Code2,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  Shield,
  Zap,
  Gamepad2,
  Flame,
  ArrowLeft,
  Search,
  X,
  ExternalLink,
  Tag,
  Clock,
  Award,
  AlertTriangle,
  RefreshCw,
  Wifi,
  CheckCircle2,
} from 'lucide-react';
import {
  MiniAppDefinition,
  getInstalledMiniApps,
  saveMiniApp,
  deleteMiniApp,
  togglePinDesktop,
  getActiveMiniAppId,
  setActiveMiniAppId,
  applyMiniAppUpgrade,
  exportMiniAppToZip,
  resetMiniAppToDefault,
  restoreAllDefaults,
  cacheMiniAppOffline,
  isMiniAppCachedOffline,
  cacheAllMiniAppsOffline,
} from '../../utils/miniAppStore';
import { unpackGameZip, adaptCodeToPlaygroundEngine } from './arcade/zipUtils';
import { DEFAULT_SPRITES, INITIAL_TILEMAP } from './arcade/defaults';
import { soundEngine } from '../../utils/audio';

interface MiniAppsAppProps {
  onShowToast?: (title: string, msg: string, type?: 'info' | 'success' | 'warn') => void;
  onOpenStudio?: (gameCode: string, gameTitle: string) => void;
  initialAppId?: string;
}

export const MiniAppsApp: React.FC<MiniAppsAppProps> = ({
  onShowToast,
  onOpenStudio,
  initialAppId,
}) => {
  const [apps, setApps] = useState<MiniAppDefinition[]>(getInstalledMiniApps());
  const [selectedAppId, setSelectedAppId] = useState<string>(initialAppId || getActiveMiniAppId());
  const [viewMode, setViewMode] = useState<'player' | 'hub'>('player');

  // Search & Filter in Hub
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pinned' | 'spck' | 'upgraded'>('all');

  // Player & Engine States
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);

  // Upgrade Panel State ("Maybe later we do some upgrades")
  const [showUpgradeDrawer, setShowUpgradeDrawer] = useState<boolean>(false);
  const [customUpgradePrompt, setCustomUpgradePrompt] = useState<string>('');
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);
  const [upgradeChangelogOpen, setUpgradeChangelogOpen] = useState<boolean>(false);

  // Upload ZIP modal inside MiniApps
  const [isUploadingZip, setIsUploadingZip] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Canvas and loop refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const engineRef = useRef<any>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const padRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    a: false,
    b: false,
    fire: false,
    jump: false,
  });

  const [scriptError, setScriptError] = useState<string | null>(null);
  const [offlineCount, setOfflineCount] = useState<number>(0);
  const [isCachingOffline, setIsCachingOffline] = useState<boolean>(false);

  const currentApp = apps.find((a) => a.id === selectedAppId) || apps[0];

  // Refresh apps list when store updates
  useEffect(() => {
    const handleStoreUpdate = () => {
      const updated = getInstalledMiniApps();
      setApps(updated);
    };
    window.addEventListener('labs_miniapps_updated', handleStoreUpdate);
    return () => window.removeEventListener('labs_miniapps_updated', handleStoreUpdate);
  }, []);

  // Update padRef when keys change
  const updateKeyAndPad = useCallback((code: string, isDown: boolean) => {
    keysRef.current[code] = isDown;
    if (code === 'ArrowLeft' || code === 'KeyA') padRef.current.left = isDown;
    if (code === 'ArrowRight' || code === 'KeyD') padRef.current.right = isDown;
    if (code === 'ArrowUp' || code === 'KeyW') {
      padRef.current.up = isDown;
      padRef.current.jump = isDown;
    }
    if (code === 'ArrowDown' || code === 'KeyS') padRef.current.down = isDown;
    if (code === 'Space' || code === 'KeyJ') {
      padRef.current.a = isDown;
      padRef.current.fire = isDown;
    }
    if (code === 'ShiftLeft' || code === 'KeyK' || code === 'KeyB') padRef.current.b = isDown;
  }, []);

  // Web Audio Synth for retro sound FX
  const playSfx = useCallback((type: string) => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'laser') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'explosion') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.28);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'hit') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'shield' || type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.16);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        osc.start(now);
        osc.stop(now + 0.16);
      }
    } catch {
      // Audio autoplay policy
    }
  }, [isMuted]);

  // Particle emission helper
  const spawnParticles = useCallback((x: number, y: number, count: number, color: string) => {
    if (!engineRef.current) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 200;
      engineRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.35 + Math.random() * 0.45,
        maxLife: 0.8,
        color,
        size: 1.5 + Math.random() * 2.5,
      });
    }
  }, []);

  // Compile user game code cleanly with error isolation
  const compiledGame = useMemo(() => {
    const rawCode = currentApp?.code;
    if (!rawCode || typeof rawCode !== 'string' || !rawCode.trim()) {
      return { init: undefined, update: undefined, render: undefined, error: 'No code provided for mini app' };
    }

    let cleanCode = rawCode.trim();
    if (cleanCode.startsWith('```')) {
      cleanCode = cleanCode.replace(/^```(?:javascript|js|ts)?\n?/i, '').replace(/\n?```$/i, '').trim();
    }
    if (cleanCode.includes('<script')) {
      const scriptMatch = cleanCode.match(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/i);
      if (scriptMatch && scriptMatch[1].trim()) {
        cleanCode = scriptMatch[1].trim();
      }
    }

    try {
      const factory = new Function(`
        ${cleanCode}
        return {
          init: typeof init === 'function' ? init : undefined,
          update: typeof update === 'function' ? update : undefined,
          render: typeof render === 'function' ? render : undefined,
        };
      `);
      const result = factory();
      return {
        init: result.init,
        update: result.update,
        render: result.render,
        error: null as string | null,
      };
    } catch (err: any) {
      return {
        init: undefined,
        update: undefined,
        render: undefined,
        error: err?.message || 'Syntax error in mini app script',
      };
    }
  }, [currentApp?.code]);

  // Initialize engine instance
  const initEngine = useCallback(() => {
    if (!currentApp) return;

    if (compiledGame.error) {
      setScriptError(compiledGame.error);
    } else {
      setScriptError(null);
    }

    const engineInstance: any = {
      width: 700,
      height: 525,
      keys: keysRef.current,
      pad: padRef.current,
      score: 0,
      lives: 3,
      level: 1,
      gameOver: false,
      victory: false,
      paused: false,
      shake: 0,
      particles: [] as any[],
      params: {
        playerSpeed: 1.2,
        difficulty: 1.0,
        lives: 3,
        fireRate: 1.0,
        particleDensity: 'high',
        colorTheme: 'cyber-neon',
        screenShake: true,
      },
      addScore: (pts: number) => {
        engineInstance.score += pts;
        setCurrentScore(engineInstance.score);
      },
      loseLife: () => {
        engineInstance.lives = Math.max(0, engineInstance.lives - 1);
        setLives(engineInstance.lives);
        if (engineInstance.lives <= 0) {
          engineInstance.gameOver = true;
          playSfx('explosion');
        } else {
          playSfx('hit');
        }
      },
      playSound: (type: string) => playSfx(type),
      playCustomSfx: (type: string) => playSfx(type),
      spawnParticles: (x: number, y: number, count: number, color: string) => spawnParticles(x, y, count, color),
      spawnSparks: (x: number, y: number, count: number, color: string) => spawnParticles(x, y, count, color),
      spawnCustomEmitter: (id: string, x: number, y: number) => spawnParticles(x, y, 16, '#38bdf8'),
      triggerShake: (amt: number) => {
        engineInstance.shake = Math.min(25, (engineInstance.shake || 0) + (amt || 4));
      },
      sprites: DEFAULT_SPRITES,
      tilemap: INITIAL_TILEMAP,
      drawSprite: (name: string, x: number, y: number, opts: any = {}) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const spr = DEFAULT_SPRITES.find((s) => s.id === name || s.name === name);
        if (spr && spr.frames && spr.frames[0]) {
          const frame = spr.frames[0];
          const size = opts.size || (opts.scale ? 2 * opts.scale : 2);
          ctx.save();
          ctx.translate(x, y);
          if (opts.facing < 0) ctx.scale(-1, 1);
          for (let r = 0; r < spr.height; r++) {
            for (let c = 0; c < spr.width; c++) {
              const col = frame[r]?.[c];
              if (col) {
                ctx.fillStyle = col;
                ctx.fillRect(-(spr.width * size) / 2 + c * size, -(spr.height * size) / 2 + r * size, size, size);
              }
            }
          }
          ctx.restore();
        }
      },
      drawTilemap: () => {
        const canvas = canvasRef.current;
        if (!canvas || !INITIAL_TILEMAP) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const ts = INITIAL_TILEMAP.tileSize || 25;
        for (let r = 0; r < INITIAL_TILEMAP.rows; r++) {
          for (let c = 0; c < INITIAL_TILEMAP.cols; c++) {
            const id = INITIAL_TILEMAP.grid[r]?.[c];
            if (id === 1) {
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(c * ts, r * ts, ts, ts);
            }
          }
        }
      },
      checkTileCollision: (x: number, y: number, w: number, h: number, solidIds: number[] = [1, 5]) => {
        if (!INITIAL_TILEMAP) return false;
        const ts = INITIAL_TILEMAP.tileSize || 25;
        const leftCol = Math.floor((x - w / 2) / ts);
        const rightCol = Math.floor((x + w / 2) / ts);
        const topRow = Math.floor((y - h / 2) / ts);
        const bottomRow = Math.floor((y + h / 2) / ts);
        for (let r = topRow; r <= bottomRow; r++) {
          for (let c = leftCol; c <= rightCol; c++) {
            if (r < 0 || r >= INITIAL_TILEMAP.rows || c < 0 || c >= INITIAL_TILEMAP.cols) return true;
            const id = INITIAL_TILEMAP.grid[r]?.[c];
            if (solidIds.includes(id)) return true;
          }
        }
        return false;
      },
      time: 0,
      timeScale: 1.0,
      debug: { godMode: false, hitboxes: false, timeScale: 1.0 },
    };

    engineRef.current = engineInstance;
    setCurrentScore(0);
    setLives(3);

    // Safely execute compiled user code init()
    if (compiledGame.init) {
      try {
        compiledGame.init(engineInstance);
      } catch (err: any) {
        console.warn('Mini App Init warning:', err);
        setScriptError(err?.message || 'Error occurred during game init()');
      }
    }
  }, [currentApp, compiledGame, playSfx, spawnParticles]);

  // Restart Game
  const handleRestart = () => {
    soundEngine.playSfx('click');
    initEngine();
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      updateKeyAndPad(e.code, true);

      if (e.code === 'KeyP') {
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'KeyR') {
        handleRestart();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      updateKeyAndPad(e.code, false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [updateKeyAndPad]);

  // Game Loop
  useEffect(() => {
    if (viewMode !== 'player') return;
    initEngine();

    let frameCount = 0;
    let fpsTimer = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.min(0.08, (timestamp - (lastTimeRef.current || timestamp)) / 1000);
      lastTimeRef.current = timestamp;

      frameCount++;
      if (timestamp - fpsTimer >= 500) {
        setFps(Math.round((frameCount * 1000) / (timestamp - fpsTimer)));
        frameCount = 0;
        fpsTimer = timestamp;
      }

      const canvas = canvasRef.current;
      const engine = engineRef.current;

      if (canvas && engine) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.save();
          // Shake handling
          if (engine.shake > 0) {
            const sx = (Math.random() - 0.5) * engine.shake;
            const sy = (Math.random() - 0.5) * engine.shake;
            ctx.translate(sx, sy);
            engine.shake = Math.max(0, engine.shake - dt * 25);
          }

          if (isPlaying && !engine.gameOver) {
            engine.time += dt;

            // Execute compiled update(engine, dt)
            if (compiledGame.update) {
              try {
                compiledGame.update(engine, dt);
              } catch (err: any) {
                // Throttled warning
              }
            }

            // Update particles
            for (let i = engine.particles.length - 1; i >= 0; i--) {
              const p = engine.particles[i];
              p.x += p.vx * dt;
              p.y += p.vy * dt;
              p.life -= dt;
              if (p.life <= 0) {
                engine.particles.splice(i, 1);
              }
            }
          }

          // Execute compiled render(engine, ctx)
          if (compiledGame.render) {
            try {
              compiledGame.render(engine, ctx);
            } catch (err) {
              // Draw fallback background
              ctx.fillStyle = '#090d16';
              ctx.fillRect(0, 0, 700, 525);
            }
          } else {
            // Default background if render not declared
            ctx.fillStyle = '#090d16';
            ctx.fillRect(0, 0, 700, 525);
            ctx.fillStyle = '#38bdf8';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(currentApp.title, 350, 240);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px monospace';
            ctx.fillText('Game Engine Active - Running in Standalone Mode', 350, 270);
          }

          // Render active particles
          for (const p of engine.particles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Game Over overlay
          if (engine.gameOver) {
            ctx.save();
            ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
            ctx.fillRect(0, 0, 700, 525);
            ctx.font = 'bold 36px monospace';
            ctx.fillStyle = '#ef4444';
            ctx.textAlign = 'center';
            ctx.fillText('MISSION FAILED', 350, 240);
            ctx.font = '16px monospace';
            ctx.fillStyle = '#94a3b8';
            ctx.fillText('Press [R] to Restart Floor or Click Restart Button', 350, 280);
            ctx.restore();
          }

          ctx.restore();
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [currentApp, compiledGame, isPlaying, viewMode, initEngine]);

  // Apply Upgrade Handler
  const handleApplyUpgrade = (presetName: string, customText?: string) => {
    setIsUpgrading(true);
    soundEngine.playSfx('open');

    setTimeout(() => {
      try {
        const upgraded = applyMiniAppUpgrade(currentApp.id, presetName, customText);
        setApps(getInstalledMiniApps());
        soundEngine.playSfx('success');
        if (onShowToast) {
          onShowToast(
            'Mini App Upgraded!',
            `Upgraded ${upgraded.title} to v${upgraded.version} with "${presetName}".`,
            'success'
          );
        }
        setShowUpgradeDrawer(false);
        setCustomUpgradePrompt('');
      } catch (err: any) {
        if (onShowToast) onShowToast('Upgrade Failed', err.message, 'warn');
      } finally {
        setIsUpgrading(false);
      }
    }, 450);
  };

  // ZIP Unpack & Install as Mini App
  const handleUnpackAndInstall = async (file: File) => {
    setIsUploadingZip(true);
    soundEngine.playSfx('click');
    try {
      if (file.name.toLowerCase().endsWith('.zip')) {
        const res = await unpackGameZip(file);
        const code = adaptCodeToPlaygroundEngine(res.detectedMainCode, res.suggestedTitle);
        const newMiniApp: MiniAppDefinition = {
          id: `spck-${Date.now().toString(36)}`,
          title: res.suggestedTitle,
          shortTitle: res.suggestedTitle.slice(0, 16),
          version: '1.0.0',
          genre: 'SPCK Port',
          icon: 'Gamepad2',
          color: 'from-cyan-500 via-indigo-600 to-purple-600',
          description: `Imported from ${file.name} (${res.fileList.length} files extracted). Ready for upgrades!`,
          code,
          upgradesApplied: ['Extracted from ZIP Package', 'Node.js/Web Canvas Port'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isPinnedToDesktop: true,
          tags: ['SPCK Port', 'ZIP', 'Imported'],
          author: 'Unpacked Package',
          packageInfo: {
            originalZipName: file.name,
            entryFile: res.detectedMainFile,
            filesCount: res.fileList.length,
            spckEngine: true,
          },
        };
        saveMiniApp(newMiniApp);
        setSelectedAppId(newMiniApp.id);
        setActiveMiniAppId(newMiniApp.id);
        setViewMode('player');
        soundEngine.playSfx('success');
        if (onShowToast) {
          onShowToast('Mini App Installed!', `Installed "${newMiniApp.title}" from ${file.name}.`, 'success');
        }
      } else {
        // Single code file
        const reader = new FileReader();
        reader.onload = (e) => {
          const raw = (e.target?.result as string) || '';
          const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          const adapted = adaptCodeToPlaygroundEngine(raw, title);
          const newMiniApp: MiniAppDefinition = {
            id: `custom-${Date.now().toString(36)}`,
            title,
            shortTitle: title.slice(0, 16),
            version: '1.0.0',
            genre: 'Custom',
            icon: 'FileCode',
            color: 'from-pink-500 via-rose-600 to-amber-500',
            description: `Imported from ${file.name}.`,
            code: adapted,
            upgradesApplied: ['Single Source File Import'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isPinnedToDesktop: true,
            tags: ['Custom', 'Imported'],
          };
          saveMiniApp(newMiniApp);
          setSelectedAppId(newMiniApp.id);
          setActiveMiniAppId(newMiniApp.id);
          setViewMode('player');
          soundEngine.playSfx('success');
          if (onShowToast) {
            onShowToast('Mini App Installed!', `Loaded ${title} into Mini Apps.`, 'success');
          }
        };
        reader.readAsText(file);
      }
    } catch (err: any) {
      if (onShowToast) onShowToast('Install Error', 'Failed to unpack game file', 'warn');
    } finally {
      setIsUploadingZip(false);
    }
  };

  // Filtered Apps in Hub
  const filteredApps = apps.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeFilter === 'pinned') return a.isPinnedToDesktop;
    if (activeFilter === 'spck') return a.genre === 'SPCK Port' || a.tags.includes('SPCK Port');
    if (activeFilter === 'upgraded') return a.upgradesApplied.length > 2;
    return true;
  });

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="h-12 bg-slate-900/90 border-b border-white/10 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 via-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white tracking-wide">Mini Apps</h2>
            <span className="text-[10px] font-mono text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              {apps.length} INSTALLED
            </span>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setViewMode('player');
            }}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'player'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            Play Mini App
          </button>
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setViewMode('hub');
            }}
            className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'hub'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3 h-3" />
            Mini Apps Hub
          </button>
        </div>

        {/* Quick Hub Upload / Actions */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.js,.html,.ts"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUnpackAndInstall(file);
              e.target.value = '';
            }}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Import SPCK Node.js or Web Game ZIP package"
          >
            <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Install ZIP / Game</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      {viewMode === 'player' ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Main Canvas Player Area */}
          <div className="flex-1 flex flex-col items-center justify-between p-3 sm:p-4 bg-slate-950 overflow-y-auto">
            {/* Top Game Action Bar */}
            <div className="w-full max-w-[700px] bg-slate-900/90 border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between gap-2 shadow-lg mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => setViewMode('hub')}
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Back to Mini Apps Hub"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">{currentApp.title}</span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/30">
                      v{currentApp.version}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{currentApp.genre}</span>
                    <span>•</span>
                    <button
                      onClick={() => setUpgradeChangelogOpen(true)}
                      className="text-amber-400 hover:underline flex items-center gap-0.5"
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      {currentApp.upgradesApplied.length} upgrades applied
                    </button>
                  </div>
                </div>
              </div>

              {/* Status and Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Score & Lives HUD */}
                <div className="hidden sm:flex items-center gap-3 px-2 py-1 bg-slate-950/80 rounded-lg border border-white/5 font-mono text-xs">
                  <span className="text-pink-400 font-bold">SCORE: {currentScore}</span>
                  <span className="text-rose-400">♥ {lives}</span>
                  <span className="text-slate-500 text-[10px]">{fps} FPS</span>
                </div>

                {/* AI Upgrade Button ("Maybe later we do some upgrades") */}
                <button
                  onClick={() => setShowUpgradeDrawer(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/20 transition-transform active:scale-95"
                  title="Upgrade this Mini App with AI"
                >
                  <Wand2 className="w-3.5 h-3.5 text-yellow-200" />
                  <span>Upgrade</span>
                </button>

                {/* Mod in Playground Studio */}
                <button
                  onClick={() => {
                    soundEngine.playSfx('open');
                    if (onOpenStudio) {
                      onOpenStudio(currentApp.code, currentApp.title);
                    } else if (onShowToast) {
                      onShowToast('Studio Bridge', 'Open Playground Studio to mod this code directly.');
                    }
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors"
                  title="Mod in Playground Studio"
                >
                  <Code2 className="w-3.5 h-3.5" />
                </button>

                {/* Pin to Desktop */}
                <button
                  onClick={() => {
                    const pinned = togglePinDesktop(currentApp.id);
                    soundEngine.playSfx('click');
                    if (onShowToast) {
                      onShowToast(
                        pinned ? 'Pinned to Desktop' : 'Unpinned from Desktop',
                        `"${currentApp.title}" is ${pinned ? 'now' : 'no longer'} on your desktop.`
                      );
                    }
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    currentApp.isPinnedToDesktop
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title={currentApp.isPinnedToDesktop ? 'Unpin from Desktop' : 'Pin to Desktop'}
                >
                  {currentApp.isPinnedToDesktop ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </button>

                {/* Export ZIP */}
                <button
                  onClick={() => {
                    soundEngine.playSfx('click');
                    exportMiniAppToZip(currentApp);
                    if (onShowToast) onShowToast('Exported ZIP', `Downloaded ${currentApp.title} bundle.`, 'success');
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Export Mini App as ZIP Archive"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {/* Sound Mute */}
                <button
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              </div>
            </div>

            {/* Game Canvas Box */}
            <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black flex items-center justify-center max-w-[700px] w-full">
              <canvas
                ref={canvasRef}
                width={700}
                height={525}
                className="w-full h-auto aspect-[4/3] block bg-black"
              />

              {/* Pause Overlay */}
              {!isPlaying && !engineRef.current?.gameOver && !scriptError && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center">
                  <div className="px-5 py-3 rounded-2xl bg-slate-900 border border-white/20 shadow-2xl flex flex-col items-center">
                    <h3 className="text-base font-bold text-white mb-1">GAME PAUSED</h3>
                    <p className="text-xs text-slate-400 mb-3">Press [P] or click button to resume</p>
                    <button
                      onClick={() => setIsPlaying(true)}
                      className="px-4 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      Resume Game
                    </button>
                  </div>
                </div>
              )}

              {/* Script Error / Diagnostic Recovery Overlay */}
              {scriptError && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20">
                  <div className="max-w-md w-full bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-2xl flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">Mini App Script Notice</h3>
                    <p className="text-xs text-amber-300 font-mono bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 w-full mb-3 break-words text-left">
                      {scriptError}
                    </p>
                    <p className="text-[11px] text-slate-400 mb-4">
                      The game code ran into an issue. You can instantly restore the factory code or tweak it in Playground Studio.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 w-full">
                      <button
                        onClick={() => {
                          const repaired = resetMiniAppToDefault(currentApp.id);
                          setScriptError(null);
                          if (onShowToast) onShowToast('Code Repaired', `Reset "${repaired.title}" to clean factory default.`, 'success');
                          handleRestart();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/20"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Restore Factory Code
                      </button>
                      <button
                        onClick={() => {
                          if (onOpenStudio) onOpenStudio(currentApp.code, currentApp.title);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        Open Studio
                      </button>
                      <button
                        onClick={() => setScriptError(null)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Responsive On-Screen Controls Bar */}
            <div className="w-full max-w-[700px] mt-2 bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 flex items-center justify-between gap-3">
              {/* Virtual D-Pad / Move Controls */}
              <div className="flex items-center gap-1">
                <button
                  onMouseDown={() => updateKeyAndPad('ArrowLeft', true)}
                  onMouseUp={() => updateKeyAndPad('ArrowLeft', false)}
                  onTouchStart={() => updateKeyAndPad('ArrowLeft', true)}
                  onTouchEnd={() => updateKeyAndPad('ArrowLeft', false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 active:bg-pink-600 text-slate-200 text-xs font-bold flex items-center justify-center border border-white/10"
                >
                  ◄
                </button>
                <div className="flex flex-col gap-1">
                  <button
                    onMouseDown={() => updateKeyAndPad('ArrowUp', true)}
                    onMouseUp={() => updateKeyAndPad('ArrowUp', false)}
                    onTouchStart={() => updateKeyAndPad('ArrowUp', true)}
                    onTouchEnd={() => updateKeyAndPad('ArrowUp', false)}
                    className="w-8 h-8 rounded-lg bg-slate-800 active:bg-pink-600 text-slate-200 text-xs font-bold flex items-center justify-center border border-white/10"
                  >
                    ▲
                  </button>
                  <button
                    onMouseDown={() => updateKeyAndPad('ArrowDown', true)}
                    onMouseUp={() => updateKeyAndPad('ArrowDown', false)}
                    onTouchStart={() => updateKeyAndPad('ArrowDown', true)}
                    onTouchEnd={() => updateKeyAndPad('ArrowDown', false)}
                    className="w-8 h-8 rounded-lg bg-slate-800 active:bg-pink-600 text-slate-200 text-xs font-bold flex items-center justify-center border border-white/10"
                  >
                    ▼
                  </button>
                </div>
                <button
                  onMouseDown={() => updateKeyAndPad('ArrowRight', true)}
                  onMouseUp={() => updateKeyAndPad('ArrowRight', false)}
                  onTouchStart={() => updateKeyAndPad('ArrowRight', true)}
                  onTouchEnd={() => updateKeyAndPad('ArrowRight', false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 active:bg-pink-600 text-slate-200 text-xs font-bold flex items-center justify-center border border-white/10"
                >
                  ►
                </button>
              </div>

              {/* Action Buttons [A] and [B] */}
              <div className="flex items-center gap-2">
                <button
                  onMouseDown={() => updateKeyAndPad('Space', true)}
                  onMouseUp={() => updateKeyAndPad('Space', false)}
                  onTouchStart={() => updateKeyAndPad('Space', true)}
                  onTouchEnd={() => updateKeyAndPad('Space', false)}
                  className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-pink-500/20"
                >
                  <span>[A] Action / Jump</span>
                </button>
                <button
                  onMouseDown={() => updateKeyAndPad('ShiftLeft', true)}
                  onMouseUp={() => updateKeyAndPad('ShiftLeft', false)}
                  onTouchStart={() => updateKeyAndPad('ShiftLeft', true)}
                  onTouchEnd={() => updateKeyAndPad('ShiftLeft', false)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-purple-600/20"
                >
                  <span>[B] Nitro / Magic</span>
                </button>
              </div>

              {/* Pause & Restart */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsPlaying((prev) => !prev)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Pause / Resume"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleRestart}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Restart Floor / Game [R]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Slide-out AI Upgrade Engine Drawer ("Maybe later we do some upgrades") */}
          {showUpgradeDrawer && (
            <div className="w-full md:w-80 bg-slate-900 border-l border-white/10 flex flex-col h-full shrink-0 shadow-2xl p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center">
                    <Wand2 className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">AI Upgrade Engine</h4>
                    <p className="text-[10px] text-slate-400">Upgrade & evolve this Mini App</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpgradeDrawer(false)}
                  className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4 bg-slate-950/70 border border-white/5 rounded-xl p-3">
                <div className="text-[11px] font-semibold text-slate-200 mb-1">
                  Current Version: <span className="text-cyan-400 font-mono">v{currentApp.version}</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {currentApp.upgradesApplied.length} upgrades applied so far. Upgrading hot-reloads the code without wiping high scores.
                </div>
              </div>

              {/* Quick Upgrade Presets */}
              <div className="mb-4">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                  ⚡ 1-Click Upgrade Presets
                </span>
                <div className="flex flex-col gap-1.5">
                  {[
                    {
                      title: 'Hyper-Charge Shields & Overdrive',
                      desc: 'Regenerating forcefield and speed boost',
                      icon: Shield,
                    },
                    {
                      title: 'Boss Encounter & Elite Waves',
                      desc: 'Giant boss with multi-phase bullet barrage',
                      icon: Flame,
                    },
                    {
                      title: 'Cyberpunk Glow & Particle Trails',
                      desc: 'Neon bloom sparks, chromatic impacts',
                      icon: Sparkles,
                    },
                    {
                      title: 'Multi-Harmonic Web Audio Synth',
                      desc: 'Dynamic reactive audio chords & bass drops',
                      icon: Volume2,
                    },
                    {
                      title: 'Matrix Bullet-Time Slow-Mo',
                      desc: 'Slow motion focus dodge on close calls',
                      icon: Zap,
                    },
                  ].map((preset, idx) => {
                    const IconComp = preset.icon;
                    return (
                      <button
                        key={idx}
                        disabled={isUpgrading}
                        onClick={() => handleApplyUpgrade(preset.title)}
                        className="text-left p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-850 border border-white/10 hover:border-amber-500/40 transition-all group flex items-start gap-2.5"
                      >
                        <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform mt-0.5">
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">
                            {preset.title}
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight">
                            {preset.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom AI Upgrade Prompt */}
              <div className="mt-auto pt-3 border-t border-white/10">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Custom AI Upgrade Prompt
                </label>
                <textarea
                  value={customUpgradePrompt}
                  onChange={(e) => setCustomUpgradePrompt(e.target.value)}
                  placeholder="e.g. Add a 3x combo streak multiplier, cyber drones, and screen shake on explosion..."
                  rows={3}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none mb-2"
                />
                <button
                  disabled={isUpgrading || !customUpgradePrompt.trim()}
                  onClick={() => handleApplyUpgrade('Custom AI Upgrade', customUpgradePrompt)}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-500/20"
                >
                  <Wand2 className="w-3.5 h-3.5 text-yellow-200" />
                  {isUpgrading ? 'Synthesizing Upgrade...' : 'Apply Custom Upgrade'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Mini Apps Hub & Installed Library View */
        <div className="flex-1 p-5 overflow-y-auto bg-slate-950 flex flex-col items-center">
          <div className="w-full max-w-5xl">
            {/* Hub Banner & Search */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-white/10 rounded-2xl p-6 mb-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-amber-500/10 via-rose-500/10 to-transparent pointer-events-none" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Layers className="w-6 h-6 text-amber-400" />
                    Mini Apps Engine & Game Launcher
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Run, upgrade, and manage standalone lightweight game mini apps. Pack and unpack SPCK Node.js or web games, pin them to your desktop, or apply real-time AI upgrades.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    disabled={isCachingOffline}
                    onClick={async () => {
                      setIsCachingOffline(true);
                      soundEngine.playSfx('click');
                      const count = await cacheAllMiniAppsOffline();
                      setOfflineCount(count);
                      setIsCachingOffline(false);
                      if (onShowToast) onShowToast('Offline Ready', `Cached ${count} Mini Apps for offline browser play.`, 'success');
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Cache all Mini Apps into browser storage so they remain playable offline"
                  >
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isCachingOffline ? 'Caching...' : 'Cache for Offline'}</span>
                  </button>

                  <button
                    onClick={() => {
                      restoreAllDefaults();
                      if (onShowToast) onShowToast('Defaults Restored', 'Reset all Mini Apps to original factory versions.', 'info');
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Reset all games to factory defaults"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reset Defaults</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-500/20 transition-all"
                  >
                    <UploadCloud className="w-4 h-4 text-white" />
                    Install Game ZIP
                  </button>
                </div>
              </div>

              {/* Search & Filter Tabs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-5 pt-4 border-t border-white/10">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search installed mini apps..."
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-8 pr-9 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 p-0.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-white/10">
                  {(['all', 'pinned', 'spck', 'upgraded'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveFilter(tab)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                        activeFilter === tab
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab === 'spck' ? 'SPCK Ports' : tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Installed Apps Grid */}
            {filteredApps.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredApps.map((app) => (
                  <div
                    key={app.id}
                    className="bg-slate-900/90 hover:bg-slate-900 border border-white/10 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between transition-all group shadow-lg"
                  >
                    <div>
                      {/* Top Row: Icon + Version + Pin */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${app.color} p-2.5 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0`}>
                          <Gamepad2 className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                            v{app.version}
                          </span>
                          <button
                            onClick={() => {
                              const pinned = togglePinDesktop(app.id);
                              soundEngine.playSfx('click');
                              if (onShowToast) {
                                onShowToast(
                                  pinned ? 'Pinned to Desktop' : 'Unpinned',
                                  `"${app.title}" is ${pinned ? 'now' : 'no longer'} on your desktop.`
                                );
                              }
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              app.isPinnedToDesktop
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'text-slate-500 hover:text-white'
                            }`}
                            title={app.isPinnedToDesktop ? 'Pinned to Desktop' : 'Pin to Desktop'}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* App Title & Description */}
                      <h4 className="text-sm font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">
                        {app.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                        {app.description}
                      </p>

                      {/* Tags & Upgrade Badge */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        <span className="text-[10px] font-mono text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/20">
                          {app.genre}
                        </span>
                        <span className="text-[10px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          {app.upgradesApplied.length} upgrades
                        </span>
                        {isMiniAppCachedOffline(app.id) && (
                          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                            <Wifi className="w-2.5 h-2.5" />
                            Offline
                          </span>
                        )}
                        {app.tags.slice(0, 3).map((t) => (
                          <button
                            key={t}
                            onClick={() => setSearchQuery(t)}
                            className="text-[10px] text-slate-400 hover:text-cyan-300 bg-slate-800 hover:bg-slate-750 px-1.5 py-0.5 rounded transition-colors"
                            title={`Filter by tag: ${t}`}
                          >
                            #{t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            soundEngine.playSfx('click');
                            exportMiniAppToZip(app);
                            if (onShowToast) onShowToast('Exported ZIP', `Downloaded ${app.title}.`, 'success');
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          title="Export as ZIP"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {apps.length > 1 && (
                          <button
                            onClick={() => {
                              soundEngine.playSfx('click');
                              deleteMiniApp(app.id);
                              if (onShowToast) onShowToast('Mini App Removed', `Deleted ${app.title}.`);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete Mini App"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          soundEngine.playSfx('open');
                          setSelectedAppId(app.id);
                          setActiveMiniAppId(app.id);
                          setViewMode('player');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/20 transition-all"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        Launch Mini App
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 border border-white/5 rounded-3xl">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-slate-600" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">No Mini Apps Found</h4>
                <p className="text-xs text-slate-400 max-w-xs text-center">
                  We couldn't find any mini apps matching "{searchQuery}" with the current filter.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  className="mt-6 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upgrade Changelog Modal */}
      {upgradeChangelogOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-white/20 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {currentApp.title} — Changelog
              </h4>
              <button
                onClick={() => setUpgradeChangelogOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              This mini app has received the following upgrades and enhancements over time:
            </p>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {currentApp.upgradesApplied.map((upg, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-white/5 text-xs text-slate-200"
                >
                  <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] flex items-center justify-center shrink-0">
                    #{currentApp.upgradesApplied.length - idx}
                  </span>
                  <span>{upg}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setUpgradeChangelogOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
