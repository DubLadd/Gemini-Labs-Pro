import React, { useState, useRef, useEffect, useCallback } from 'react';
import { soundEngine } from '../../utils/audio';
import {
  Zap,
  Sparkles,
  Shield,
  Terminal,
  Play,
  RotateCw,
  Search,
  Filter,
  Layers,
  Copy,
  Check,
  Plus,
  GitBranch,
  Sliders,
  Maximize2,
  ExternalLink,
  Cpu,
  Code,
  Flame,
  Volume2,
  RefreshCw,
  Share2,
  HelpCircle,
  Eye,
  ArrowRight,
  Info,
  X,
} from 'lucide-react';

interface BrainstormerAppProps {
  onShowToast?: (title: string, msg: string, type?: 'info' | 'success' | 'warn') => void;
}

export type ConceptCategory = 'SPARK' | 'PROTOTYPE' | 'HARDENED' | 'VECTOR' | 'SHOOTOUT' | 'SCAFFOLD' | 'AUDIO';

export interface ConceptNode {
  id: string;
  title: string;
  badge: ConceptCategory;
  categoryTag: string; // !proto, !harden, etc.
  description: string;
  twist: string;
  bullets?: string[];
  snippet?: string;
  ratings?: {
    potential: number;
    novelty: number;
    viability: number;
    risk: number;
  };
  position: { x: number; y: number };
  connectedTo?: { targetId: string; relation: string }[];
  accentColor: string;
  sandboxMode?: 'gravity-lab' | 'synthwave' | 'vault' | 'vector';
}

const INITIAL_NODES: ConceptNode[] = [
  {
    id: 'seed-engine',
    title: 'SEED: REAL-TIME CREATIVE E...',
    badge: 'SPARK',
    categoryTag: '!seed',
    description: 'A high-agency software fabrication laboratory, lateral-thinking engine, and live prototyping runtime.',
    twist: 'Eliminates the split between brainstorming ideas and writing code—ideas on the canvas become running software artifacts in one click.',
    position: { x: 380, y: 40 },
    connectedTo: [
      { targetId: 'proto-lab', relation: 'Diverge' },
      { targetId: 'defensive-vault', relation: '!harden Audit' },
      { targetId: 'synthwave-audio', relation: 'Acoustic' },
      { targetId: 'shootout-arch', relation: 'Fork' },
    ],
    accentColor: '#38bdf8', // sky-400
  },
  {
    id: 'proto-lab',
    title: 'DISPOSABLE LAB (!PROTO)',
    badge: 'PROTOTYPE',
    categoryTag: '!proto',
    description: 'Single-file zero-dependency in-memory particle physics engine running at 120 FPS.',
    twist: 'Zero external dependencies or cloud orchestration. 100% native Web APIs and pure mathematical vectors.',
    bullets: [
      'Self-contained in-memory canvas loop with Verlet integration',
      'Zero gatekeeping: runs immediately in browser with zero setup',
    ],
    ratings: {
      potential: 9,
      novelty: 8,
      viability: 10,
      risk: 1,
    },
    position: { x: 380, y: 260 },
    connectedTo: [
      { targetId: 'shootout-arch', relation: 'Benchmarking' },
    ],
    accentColor: '#0ea5e9', // cyan-500
    sandboxMode: 'gravity-lab',
  },
  {
    id: 'defensive-vault',
    title: 'DEFENSIVE VAULT (!HARDEN)',
    badge: 'HARDENED',
    categoryTag: '!harden',
    description: 'Zero-network isolation with AES-GCM WebCrypto local encrypted store and strict input boundaries.',
    twist: 'Total defense by construction: memory isolation, sanitized state mutations, and zero-permission execution.',
    bullets: [
      'WebCrypto subtle API AES-GCM 256-bit encryption for local state',
      'Strict input boundary sanitization guarding against XSS & injection',
    ],
    ratings: {
      potential: 8,
      novelty: 8,
      viability: 9,
      risk: 1,
    },
    position: { x: 740, y: 160 },
    connectedTo: [
      { targetId: 'vector-harness', relation: 'Verify' },
    ],
    accentColor: '#10b981', // emerald-500
    sandboxMode: 'vault',
  },
  {
    id: 'vector-harness',
    title: 'EXECUTION VECTOR HARNESS...',
    badge: 'VECTOR',
    categoryTag: '!vector',
    description: 'Zero-dependency standalone test runner and execution vector harness.',
    twist: 'Immediate execution vector without environment prerequisites or npm setup rituals.',
    snippet: 'node test-runner.js || open runner.html',
    bullets: [
      'Self-contained headless test assertions in plain JavaScript',
      'Instant run command for terminal, browser, or edge runtime',
    ],
    ratings: {
      potential: 9,
      novelty: 8,
      viability: 10,
      risk: 1,
    },
    position: { x: 740, y: 440 },
    accentColor: '#6366f1', // indigo-500
    sandboxMode: 'vector',
  },
  {
    id: 'synthwave-audio',
    title: 'ACOUSTIC SYNTHWAVE S...',
    badge: 'AUDIO',
    categoryTag: '!proto',
    description: 'A visual audio synthesizer where gravitational celestial bodies generate synth pads as they orbit the cursor.',
    twist: 'Users compose music not with timelines or piano rolls, but by setting orbital velocities of glowing planets.',
    bullets: [
      'N-body celestial gravitational physics in HTML5 Canvas',
      'Web Audio API polyphonic frequency oscillators mapped to orbital radius',
    ],
    ratings: {
      potential: 9,
      novelty: 9,
      viability: 8,
      risk: 2,
    },
    position: { x: 40, y: 220 },
    connectedTo: [
      { targetId: 'factory-primitives', relation: 'Extends' },
    ],
    accentColor: '#ec4899', // pink-500
    sandboxMode: 'synthwave',
  },
  {
    id: 'factory-primitives',
    title: 'FACTORY REUSABLE PRIMITIV...',
    badge: 'SCAFFOLD',
    categoryTag: '!scaffold',
    description: 'Modular primitives, typed state container, and zero-dependency math utilities for infinite reuse.',
    twist: 'Build the machinery that builds the applications, establishing reusable software contracts.',
    bullets: [
      'Typed EventBus & reactive store without external state library',
      'Shared vector math and spatial utilities library',
    ],
    ratings: {
      potential: 8,
      novelty: 7,
      viability: 10,
      risk: 1,
    },
    position: { x: 40, y: 500 },
    accentColor: '#f59e0b', // amber-500
  },
  {
    id: 'shootout-arch',
    title: '3-WAY ARCHITECTURE SHOOT...',
    badge: 'SHOOTOUT',
    categoryTag: '!fork',
    description: 'Fork concept into 3 competing architectures to test trade-offs side-by-side.',
    twist: 'Never guess the best architecture: benchmark Minimal vs Fast vs Radical simultaneously.',
    bullets: [
      '3-WAY SHOOTOUT VARIANTS:',
      '[Minimal] Minimal Canvas - Tiny, clean, readable zero-dep code',
      '[Fast] Turbo Buffer - High-throughput Float32Array vector pool',
    ],
    ratings: {
      potential: 8,
      novelty: 7,
      viability: 9,
      risk: 2,
    },
    position: { x: 380, y: 560 },
    accentColor: '#a855f7', // purple-500
  },
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  glow: string;
  alpha: number;
}

const PALETTES = [
  {
    name: 'Cyberpunk Neon',
    colors: ['#00f0ff', '#ff0077', '#7928ca', '#00ffcc', '#ff0055'],
  },
  {
    name: 'Solar Flare',
    colors: ['#ffb703', '#fb8500', '#ff0054', '#9d0208', '#ff4d6d'],
  },
  {
    name: 'Electric Aurora',
    colors: ['#06d6a0', '#118ab2', '#073b4c', '#8338ec', '#3a86ff'],
  },
  {
    name: 'Synthwave Matrix',
    colors: ['#f72585', '#7209b7', '#3a0ca3', '#4361ee', '#4cc9f0'],
  },
];

export const BrainstormerApp: React.FC<BrainstormerAppProps> = ({ onShowToast }) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'brainstormer' | 'sandbox' | 'shell'>('brainstormer');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Canvas Graph state
  const [nodes, setNodes] = useState<ConceptNode[]>(INITIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('proto-lab');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [slashInput, setSlashInput] = useState('');
  const [matrixMutationCount, setMatrixMutationCount] = useState(0);

  // Canvas pan & drag state
  const [canvasOffset, setCanvasOffset] = useState<{ x: number; y: number }>({ x: 60, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Neon Gravity Lab state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [particleCount, setParticleCount] = useState<number>(250);
  const [gravityStrength, setGravityStrength] = useState<number>(0.4);
  const [forceMode, setForceMode] = useState<'repel' | 'attract'>('repel');
  const [paletteIndex, setPaletteIndex] = useState<number>(0);
  const [mousePos, setMousePos] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    'Neon Gravity Physics Engine initialized. 120 FPS hardware acceleration active.',
  ]);
  const [consoleInput, setConsoleInput] = useState('');
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  // Initialize particles for Neon Gravity Lab
  const initParticles = useCallback((count: number, paletteIdx: number) => {
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width : 800;
    const height = canvas ? canvas.height : 500;
    const palette = PALETTES[paletteIdx % PALETTES.length].colors;

    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const color = palette[Math.floor(Math.random() * palette.length)];
      newParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 2.5 + 1.5,
        color,
        glow: color,
        alpha: Math.random() * 0.5 + 0.5,
      });
    }
    particlesRef.current = newParticles;
  }, []);

  // Run particle simulation loop
  useEffect(() => {
    if (activeTab !== 'sandbox') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high resolution canvas dimensions
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
      initParticles(particleCount, paletteIndex);
    }

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      // Dark semi-transparent clear for neon motion blur trails
      ctx.fillStyle = 'rgba(7, 10, 20, 0.22)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const mx = mousePos.x;
      const my = mousePos.y;
      const mouseActive = mousePos.active;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Mouse forcefield interaction
        if (mouseActive) {
          const dx = mx - p.x;
          const dy = my - p.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);

          if (dist > 1 && dist < 260) {
            const force = (gravityStrength * 400) / distSq;
            const dir = forceMode === 'repel' ? -1 : 1;
            p.vx += (dx / dist) * force * dir;
            p.vy += (dy / dist) * force * dir;
          }
        }

        // Apply velocities & slight damping
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.985;
        p.vy *= 0.985;

        // Boundary bounce
        if (p.x < 0) {
          p.x = 0;
          p.vx *= -1;
        } else if (p.x > canvas.width) {
          p.x = canvas.width;
          p.vx *= -1;
        }

        if (p.y < 0) {
          p.y = 0;
          p.vy *= -1;
        } else if (p.y > canvas.height) {
          p.y = canvas.height;
          p.vy *= -1;
        }

        // Draw glowing particle
        ctx.save();
        ctx.shadowColor = p.glow;
        ctx.shadowBlur = 10;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connected filaments between very close particles
        for (let j = i + 1; j < Math.min(i + 5, particles.length); j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cdist = cdx * cdx + cdy * cdy;
          if (cdist < 1400) {
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = 0.25;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      // Draw cursor interactive ring if active
      if (mouseActive) {
        ctx.save();
        ctx.strokeStyle = forceMode === 'repel' ? 'rgba(244, 63, 94, 0.4)' : 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(mx, my, 40, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [activeTab, particleCount, gravityStrength, forceMode, paletteIndex, mousePos, initParticles]);

  const handleImpulseBurst = () => {
    soundEngine.playSfx('open');
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.width / 2 : 400;
    const cy = canvas ? canvas.height / 2 : 250;

    particlesRef.current.forEach((p) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 9 + 4;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
    });

    setConsoleLogs((prev) => [
      `Impulse burst triggered: +${particleCount} vectors accelerated outward.`,
      ...prev.slice(0, 10),
    ]);

    if (onShowToast) {
      onShowToast('Kinetic Burst', `Accelerated ${particleCount} particles with radial shockwave.`, 'info');
    }
  };

  const handleCyclePalette = () => {
    soundEngine.playSfx('click');
    const nextIdx = (paletteIndex + 1) % PALETTES.length;
    setPaletteIndex(nextIdx);
    initParticles(particleCount, nextIdx);
    const palName = PALETTES[nextIdx].name;
    setConsoleLogs((prev) => [`Palette switched to: ${palName}`, ...prev.slice(0, 10)]);
    if (onShowToast) {
      onShowToast('Palette Cycled', `Color matrix set to ${palName}`, 'info');
    }
  };

  const handleAddConceptFromSlash = (text: string) => {
    if (!text.trim()) return;
    soundEngine.playSfx('success');
    const parts = text.split(' ');
    const tag = parts[0].startsWith('/') || parts[0].startsWith('!') ? parts[0] : '!proto';
    const rest = parts[0].startsWith('/') || parts[0].startsWith('!') ? parts.slice(1).join(' ') : text;

    const newId = `node-${Date.now()}`;
    const newNode: ConceptNode = {
      id: newId,
      title: (rest || 'NEW CONCEPT FORK').toUpperCase().slice(0, 26),
      badge: tag.includes('harden') ? 'HARDENED' : tag.includes('fork') ? 'SHOOTOUT' : tag.includes('scaffold') ? 'SCAFFOLD' : 'PROTOTYPE',
      categoryTag: tag.replace('/', '!'),
      description: rest || 'Generated concept vector with lateral mutation.',
      twist: 'Eliminates friction between concept formulation and live interactive runtime.',
      bullets: [
        'Zero-dependency standalone module',
        'Directly executable via Web APIs and micro-runtime',
      ],
      ratings: {
        potential: Math.floor(Math.random() * 2) + 8,
        novelty: Math.floor(Math.random() * 2) + 8,
        viability: 9,
        risk: 1,
      },
      position: {
        x: (selectedNode ? selectedNode.position.x : 400) + (Math.random() * 140 - 70),
        y: (selectedNode ? selectedNode.position.y : 200) + 240,
      },
      connectedTo: [
        { targetId: selectedNode ? selectedNode.id : 'seed-engine', relation: 'Mutate' },
      ],
      accentColor: tag.includes('harden') ? '#10b981' : tag.includes('fork') ? '#a855f7' : '#ec4899',
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newId);
    setMatrixMutationCount((prev) => prev + 1);
    setSlashInput('');

    if (onShowToast) {
      onShowToast('Concept Mutated', `Added node "${newNode.title}" to graph matrix.`, 'success');
    }
  };

  const handleCopySnippet = (snippet: string) => {
    soundEngine.playSfx('click');
    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
    if (onShowToast) {
      onShowToast('Copied', 'Run command copied to clipboard.', 'info');
    }
  };

  // Filtered nodes
  const filteredNodes = nodes.filter((node) => {
    if (activeFilter !== 'all' && node.categoryTag !== activeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        node.title.toLowerCase().includes(q) ||
        node.description.toLowerCase().includes(q) ||
        node.twist.toLowerCase().includes(q) ||
        node.categoryTag.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070a13] text-slate-100 font-sans select-none overflow-hidden relative">
      {/* Top Header / Bar matching Screenshots */}
      <header className="h-11 bg-[#0c1020] border-b border-white/10 px-3 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => { soundEngine.playSfx('click'); }}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Gemini Agent</span>
          </button>

          <button
            onClick={() => { soundEngine.playSfx('click'); }}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
          >
            <Code className="w-3.5 h-3.5 text-slate-400" />
            <span>Live IDE</span>
          </button>

          {/* Active Brainstormer Tab with vibrant purple/magenta pill */}
          <button
            onClick={() => { soundEngine.playSfx('click'); setActiveTab('brainstormer'); }}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold shadow-md transition-all ${
              activeTab === 'brainstormer'
                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-fuchsia-900/40 ring-1 ring-white/20'
                : 'text-slate-300 hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300 animate-pulse" />
            <span>Brainstormer</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white/90 font-mono ml-1">PRO X</span>
          </button>

          <button
            onClick={() => { soundEngine.playSfx('click'); setActiveTab('sandbox'); }}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'sandbox'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Sandbox</span>
          </button>

          <button
            onClick={() => { soundEngine.playSfx('click'); }}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>Shell</span>
          </button>

          <button
            onClick={() => { soundEngine.playSfx('click'); }}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>App Gallery</span>
          </button>

          <button
            onClick={() => { soundEngine.playSfx('click'); }}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Architect</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setCanvasOffset({ x: 60, y: 30 });
              if (onShowToast) onShowToast('Canvas Centered', 'Reset matrix pan coordinates.');
            }}
            title="Recenter Canvas"
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 text-xs"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
            Zero-Key Local First
          </span>
        </div>
      </header>

      {/* Subheader Filters & Search Bar */}
      {activeTab === 'brainstormer' && (
        <div className="h-10 bg-[#090d1a] border-b border-white/10 px-4 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-mono font-bold">
              Concept Matrix Mutations ({matrixMutationCount})
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono">
              4 Laws Active
            </span>

            <div className="h-4 w-px bg-white/10 mx-1" />

            {/* Filter Pills */}
            <div className="flex items-center space-x-1">
              {[
                { label: 'All (7)', val: 'all' },
                { label: '!proto (1)', val: '!proto' },
                { label: '!harden (1)', val: '!harden' },
                { label: '!vector (1)', val: '!vector' },
                { label: '!scaffold (1)', val: '!scaffold' },
                { label: '!fork (1)', val: '!fork' },
              ].map((f) => (
                <button
                  key={f.val}
                  onClick={() => {
                    soundEngine.playSfx('click');
                    setActiveFilter(f.val);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all ${
                    activeFilter === f.val
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts or tags..."
              className="w-full bg-black/40 border border-white/15 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* VIEW 1: BRAINSTORMER GRAPH CANVAS */}
        {activeTab === 'brainstormer' && (
          <div
            className="flex-1 relative overflow-hidden bg-[#070913] cursor-grab active:cursor-grabbing"
            style={{
              backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
            onMouseDown={(e) => {
              if ((e.target as HTMLElement).closest('.concept-card')) return;
              setIsPanning(true);
              setPanStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
            }}
            onMouseMove={(e) => {
              if (isPanning) {
                setCanvasOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
              } else if (draggingNodeId) {
                setNodes((prev) =>
                  prev.map((n) =>
                    n.id === draggingNodeId
                      ? {
                          ...n,
                          position: {
                            x: e.clientX - canvasOffset.x - dragOffset.x,
                            y: e.clientY - canvasOffset.y - dragOffset.y,
                          },
                        }
                      : n
                  )
                );
              }
            }}
            onMouseUp={() => {
              setIsPanning(false);
              setDraggingNodeId(null);
            }}
          >
            {/* SVG Connecting Links Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0.7" />
                </linearGradient>
              </defs>
              {nodes.map((node) => {
                if (!node.connectedTo) return null;
                return node.connectedTo.map((conn, idx) => {
                  const target = nodes.find((n) => n.id === conn.targetId);
                  if (!target) return null;

                  const startX = node.position.x + canvasOffset.x + 160;
                  const startY = node.position.y + canvasOffset.y + 100;
                  const endX = target.position.x + canvasOffset.x + 160;
                  const endY = target.position.y + canvasOffset.y + 100;

                  const midX = (startX + endX) / 2;
                  const midY = (startY + endY) / 2;

                  return (
                    <g key={`${node.id}-${conn.targetId}-${idx}`}>
                      <path
                        d={`M ${startX} ${startY} Q ${midX} ${startY + 20} ${endX} ${endY}`}
                        fill="none"
                        stroke="url(#lineGrad)"
                        strokeWidth="1.8"
                        strokeDasharray="4 4"
                      />
                      <rect
                        x={midX - 35}
                        y={midY - 9}
                        width="70"
                        height="18"
                        rx="4"
                        fill="#0c1020"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="1"
                      />
                      <text
                        x={midX}
                        y={midY + 3}
                        fill="#94a3b8"
                        fontSize="9"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {conn.relation}
                      </text>
                    </g>
                  );
                });
              })}
            </svg>

            {/* Render Nodes / Cards */}
            <div className="absolute inset-0 pointer-events-auto">
              {filteredNodes.map((node) => {
                const isSelected = node.id === selectedNodeId;
                return (
                  <div
                    key={node.id}
                    onClick={() => {
                      soundEngine.playSfx('click');
                      setSelectedNodeId(node.id);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggingNodeId(node.id);
                      setDragOffset({
                        x: e.clientX - canvasOffset.x - node.position.x,
                        y: e.clientY - canvasOffset.y - node.position.y,
                      });
                    }}
                    style={{
                      transform: `translate(${node.position.x + canvasOffset.x}px, ${node.position.y + canvasOffset.y}px)`,
                      borderColor: isSelected ? node.accentColor : 'rgba(255, 255, 255, 0.12)',
                    }}
                    className={`concept-card absolute w-[310px] rounded-2xl bg-[#0b1022]/95 backdrop-blur-md border shadow-2xl p-4 transition-all group ${
                      isSelected ? 'ring-2 ring-cyan-400/40 shadow-cyan-500/10' : 'hover:border-white/30'
                    }`}
                  >
                    {/* Header: Title & Category Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-1.5">
                        {node.badge === 'SPARK' && <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                        {node.badge === 'PROTOTYPE' && <Zap className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                        {node.badge === 'HARDENED' && <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        {node.badge === 'VECTOR' && <Terminal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                        {node.badge === 'SHOOTOUT' && <GitBranch className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                        {node.badge === 'SCAFFOLD' && <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        {node.badge === 'AUDIO' && <Volume2 className="w-3.5 h-3.5 text-pink-400 shrink-0" />}
                        <h4 className="text-xs font-bold text-white tracking-wide truncate">{node.title}</h4>
                      </div>

                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono shrink-0"
                        style={{
                          backgroundColor: `${node.accentColor}25`,
                          color: node.accentColor,
                          border: `1px solid ${node.accentColor}50`,
                        }}
                      >
                        {node.badge}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">{node.description}</p>

                    {/* THE TWIST Box */}
                    <div className="bg-[#050711]/70 border border-white/10 rounded-xl p-2.5 mb-2.5 text-[11px]">
                      <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider block mb-0.5">
                        THE TWIST:
                      </span>
                      <p className="text-slate-300 text-[10.5px] leading-tight">{node.twist}</p>
                    </div>

                    {/* Optional Snippet / Command Box */}
                    {node.snippet && (
                      <div className="mb-2.5 flex items-center justify-between bg-black/60 border border-white/15 rounded-lg px-2.5 py-1.5 font-mono text-[10px] text-emerald-300">
                        <span className="truncate">{node.snippet}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopySnippet(node.snippet!);
                          }}
                          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white shrink-0 ml-1"
                        >
                          {copiedSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    )}

                    {/* Optional Bullets */}
                    {node.bullets && (
                      <div className="space-y-1 mb-2.5 text-[10px] text-slate-400">
                        {node.bullets.map((b, i) => (
                          <div key={i} className="leading-tight flex items-start space-x-1">
                            <span className="text-cyan-400">•</span>
                            <span className="truncate">{b}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ratings Grid */}
                    {node.ratings && (
                      <div className="grid grid-cols-4 gap-1 py-1.5 mb-2.5 border-y border-white/10 text-center font-mono">
                        <div>
                          <div className="text-[8px] text-slate-500 uppercase">Potential</div>
                          <div className="text-[10px] font-bold text-amber-400">{node.ratings.potential}/10</div>
                        </div>
                        <div>
                          <div className="text-[8px] text-slate-500 uppercase">Novelty</div>
                          <div className="text-[10px] font-bold text-cyan-400">{node.ratings.novelty}/10</div>
                        </div>
                        <div>
                          <div className="text-[8px] text-slate-500 uppercase">Viability</div>
                          <div className="text-[10px] font-bold text-emerald-400">{node.ratings.viability}/10</div>
                        </div>
                        <div>
                          <div className="text-[8px] text-slate-500 uppercase">Risk</div>
                          <div className="text-[10px] font-bold text-rose-400">{node.ratings.risk}/10</div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons matching screenshot */}
                    <div className="flex items-center justify-between gap-1 pt-1">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            soundEngine.playSfx('click');
                            handleAddConceptFromSlash(`!proto ${node.title} Proto`);
                          }}
                          className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-cyan-300"
                        >
                          !proto
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            soundEngine.playSfx('click');
                            handleAddConceptFromSlash(`!harden ${node.title} Guard`);
                          }}
                          className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-emerald-300"
                        >
                          !harden
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            soundEngine.playSfx('click');
                            handleAddConceptFromSlash(`!mutate ${node.title} Mutation`);
                          }}
                          className="px-2 py-1 rounded-md bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-[10px] font-mono text-pink-300"
                        >
                          !mutate
                        </button>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          soundEngine.playSfx('open');
                          setActiveTab('sandbox');
                          if (onShowToast) {
                            onShowToast('Building in IDE', `Launching interactive sandbox for ${node.title}`);
                          }
                        }}
                        className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center space-x-1 shadow-md shadow-emerald-950"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Build in IDE</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* RIGHT DRAWER / INSPECTOR: SOFTWARE FABRICATION */}
        {activeTab === 'brainstormer' && selectedNode && (
          <aside className="w-80 bg-[#0a0e1c] border-l border-white/10 p-4 flex flex-col justify-between shrink-0 z-20 overflow-y-auto">
            <div>
              <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-white/10">
                <Code className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white tracking-wider uppercase font-mono">
                  # Software Fabrication
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Title & Artifact Badge
                  </span>
                  <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 font-bold text-xs text-white">
                    {selectedNode.title}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Core Hook
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed p-2.5 rounded-xl bg-black/30 border border-white/10">
                    {selectedNode.description}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-400 block mb-1">
                    The Non-Obvious Twist
                  </span>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed font-sans">
                    {selectedNode.twist}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5">
                    Dynamic Skill Triggers
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-300">
                      <Zap className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span className="font-mono">!proto Disposable Lab</span>
                    </div>
                    <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                      <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="font-mono">!scaffold Factory Primitives</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2 mt-4">
              <button
                onClick={() => {
                  soundEngine.playSfx('open');
                  setActiveTab('sandbox');
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white shadow-lg shadow-cyan-900/30 flex items-center justify-center space-x-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Fabricate [PROTO]</span>
              </button>

              <button
                onClick={() => {
                  soundEngine.playSfx('click');
                  if (onShowToast) onShowToast('Pair Program Active', 'Attached Gemini AI live pair programming agent.');
                }}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 flex items-center justify-center space-x-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Pair Program</span>
              </button>
            </div>
          </aside>
        )}

        {/* VIEW 2: NEON GRAVITY LAB (Matching Screenshots 1 & 2) */}
        {activeTab === 'sandbox' && (
          <div className="flex-1 flex flex-col bg-[#050711] overflow-hidden">
            {/* Top Toolbar matching screenshot 1 & 2 */}
            <div className="h-12 bg-[#0c1022] border-b border-white/10 px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-400 animate-pulse" />
                  <span className="text-xs font-bold text-white tracking-wider font-mono">
                    NEON GRAVITY LAB
                  </span>
                </div>

                <div className="h-4 w-px bg-white/10" />

                {/* Particle slider */}
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Particles: {particleCount}</span>
                  <input
                    type="range"
                    min="50"
                    max="500"
                    value={particleCount}
                    onChange={(e) => {
                      const count = parseInt(e.target.value);
                      setParticleCount(count);
                      initParticles(count, paletteIndex);
                    }}
                    className="w-20 accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* Gravity slider */}
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Gravity: {gravityStrength}</span>
                  <input
                    type="range"
                    min="0.1"
                    max="1.5"
                    step="0.1"
                    value={gravityStrength}
                    onChange={(e) => setGravityStrength(parseFloat(e.target.value))}
                    className="w-20 accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    soundEngine.playSfx('click');
                    setForceMode((prev) => (prev === 'repel' ? 'attract' : 'repel'));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    forceMode === 'repel'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  }`}
                >
                  Force: {forceMode === 'repel' ? 'Repel' : 'Attract'}
                </button>

                <button
                  onClick={handleImpulseBurst}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white shadow"
                >
                  Impulse Burst
                </button>

                <button
                  onClick={handleCyclePalette}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-slate-200"
                >
                  Cycle Palette
                </button>

                <button
                  onClick={() => {
                    soundEngine.playSfx('click');
                    setActiveTab('brainstormer');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 flex items-center space-x-1"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  <span>Matrix</span>
                </button>
              </div>
            </div>

            {/* Neon Physics Canvas Viewport */}
            <div className="flex-1 relative overflow-hidden bg-[#04060d]">
              <canvas
                ref={canvasRef}
                className="w-full h-full block cursor-crosshair"
                onMouseMove={(e) => {
                  const rect = canvasRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setMousePos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                    active: true,
                  });
                }}
                onMouseLeave={() => setMousePos((prev) => ({ ...prev, active: false }))}
                onMouseDown={() => {
                  soundEngine.playSfx('click');
                  handleImpulseBurst();
                }}
              />

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-cyan-300 font-mono pointer-events-none shadow-lg">
                Click or drag cursor to exert physical forcefield
              </div>
            </div>

            {/* Bottom Console Panel matching Screenshot 1 & 2 */}
            <div className="h-32 bg-[#080b18] border-t border-white/10 flex flex-col shrink-0">
              <div className="h-7 px-3 bg-[#0a0e1f] border-b border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-400">Active</span>
                  <span>|</span>
                  <span className="text-white font-semibold">&gt;_ CONSOLE</span>
                  <span className="text-slate-500">1 messages</span>
                </div>

                <div className="flex items-center space-x-2 text-[10px]">
                  <span>Format: html</span>
                  <span>UTF-8</span>
                  <span>2 spaces</span>
                </div>
              </div>

              {/* Console log list */}
              <div className="flex-1 p-2 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
                {consoleLogs.map((log, i) => (
                  <div key={i} className="text-slate-400 flex items-center space-x-2">
                    <span className="text-emerald-400">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>

              {/* Quick CLI command chips */}
              <div className="h-7 px-3 bg-[#050711] border-t border-white/10 flex items-center space-x-1.5 overflow-x-auto text-[10px] font-mono">
                {['node', 'npm i lodash', 'git status', 'chmod +x', 'clear', 'history', 'help'].map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => {
                      soundEngine.playSfx('click');
                      if (cmd === 'clear') {
                        setConsoleLogs([]);
                      } else {
                        setConsoleLogs((prev) => [`Executing: ${cmd}`, ...prev]);
                      }
                    }}
                    className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Command Prompt Bar (matching Screenshots 3, 4, 5, 6) */}
      {activeTab === 'brainstormer' && (
        <div className="h-12 bg-[#090d1c] border-t border-white/10 px-4 flex items-center space-x-3 shrink-0 z-30">
          {/* Quick Slash Command Chips */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={() => { soundEngine.playSfx('click'); handleAddConceptFromSlash('/proto High-Throughput Canvas Lab'); }}
              className="px-2 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-[10px] font-mono text-sky-300 font-bold"
            >
              /proto LAB
            </button>
            <button
              onClick={() => { soundEngine.playSfx('click'); handleAddConceptFromSlash('/scamper Lateral Mutation Node'); }}
              className="px-2 py-1 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-[10px] font-mono text-pink-300 font-bold"
            >
              /scamper MUTATE
            </button>
            <button
              onClick={() => { soundEngine.playSfx('click'); handleAddConceptFromSlash('/harden Cryptographic Audit Vault'); }}
              className="px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 font-bold"
            >
              /harden SECURITY
            </button>
            <button
              onClick={() => { soundEngine.playSfx('click'); handleAddConceptFromSlash('/fork 3-Way Benchmark Shootout'); }}
              className="px-2 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-[10px] font-mono text-purple-300 font-bold"
            >
              /fork SHOOTOUT
            </button>
            <button
              onClick={() => { soundEngine.playSfx('click'); handleAddConceptFromSlash('/scaffold Factory Reusable Toolkit'); }}
              className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-[10px] font-mono text-amber-300 font-bold"
            >
              /scaffold FACTORY
            </button>
          </div>

          {/* Prompt input field */}
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={slashInput}
              onChange={(e) => setSlashInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddConceptFromSlash(slashInput);
                }
              }}
              placeholder="Type slash command (/proto, /scamper, /harden, /mutate) or enter concept idea..."
              className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
            <button
              onClick={() => handleAddConceptFromSlash(slashInput)}
              className="absolute right-2 px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold"
            >
              Enter
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
