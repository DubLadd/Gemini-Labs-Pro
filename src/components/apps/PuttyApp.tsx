import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../../utils/audio';
import {
  Users,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Send,
  X,
  Palette,
  RefreshCw,
} from 'lucide-react';

interface Teammate {
  id: string;
  name: string;
  badgeBg: string;
  badgeText: string;
  x: number;
  y: number;
}

interface FeedItem {
  id: string;
  author: string;
  time: string;
  message: string;
  colorClass: string;
}

export const PuttyApp: React.FC<{ onShowToast?: (title: string, msg: string) => void }> = ({ onShowToast }) => {
  const [teammates, setTeammates] = useState<Teammate[]>([
    { id: 'amit', name: 'Amit', badgeBg: 'bg-yellow-400', badgeText: 'text-yellow-950', x: 28, y: 22 },
    { id: 'tania', name: 'Tania', badgeBg: 'bg-pink-400', badgeText: 'text-pink-950', x: 56, y: 32 },
    { id: 'aaron', name: 'Aaron', badgeBg: 'bg-emerald-400', badgeText: 'text-emerald-950', x: 34, y: 58 },
    { id: 'kelsie', name: 'Kelsie', badgeBg: 'bg-cyan-400', badgeText: 'text-cyan-950', x: 62, y: 54 },
  ]);

  const [feed, setFeed] = useState<FeedItem[]>([
    {
      id: 'f1',
      author: 'Amit',
      time: '2m ago',
      message: "Let's adjust the corner radius on that main white card to 28px.",
      colorClass: 'text-yellow-400',
    },
    {
      id: 'f2',
      author: 'Kelsie',
      time: '4m ago',
      message: 'I just scaffolded the nav header. Thoughts on the spacing?',
      colorClass: 'text-cyan-400',
    },
  ]);

  const [chatInput, setChatInput] = useState('');
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorTarget, setInspectorTarget] = useState<'card' | 'header'>('card');
  const [elementPrompt, setElementPrompt] = useState('');

  // Prototype styling states mutated by vibe coding
  const [cardGlow, setCardGlow] = useState<string>('none');
  const [isBouncing, setIsBouncing] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(14820);
  const [navTitle, setNavTitle] = useState({ about: 'About', experiments: 'Experiments', connect: 'Stay connected' });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Animate teammate cursors roaming
  useEffect(() => {
    const interval = setInterval(() => {
      setTeammates((prev) =>
        prev.map((m) => {
          const dx = (Math.random() - 0.5) * 16;
          const dy = (Math.random() - 0.5) * 16;
          return {
            ...m,
            x: Math.max(12, Math.min(84, m.x + dx)),
            y: Math.max(16, Math.min(82, m.y + dy)),
          };
        })
      );
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  const openInspector = (target: 'card' | 'header') => {
    soundEngine.playSfx('click');
    setInspectorTarget(target);
    setInspectorOpen(true);
  };

  const handleApplySuggestion = (type: 'bouncy' | 'glow' | 'counter') => {
    soundEngine.playSfx('click');
    if (type === 'bouncy') {
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 1600);
      if (onShowToast) onShowToast('Putty Vibe Applied', 'Added elastic bounce spring physics to component.');
    } else if (type === 'glow') {
      setCardGlow('0 0 35px rgba(236, 72, 153, 0.45)');
      if (onShowToast) onShowToast('Putty Vibe Applied', 'Injected neon aura glow styling.');
    } else if (type === 'counter') {
      setWaitlistCount((prev) => prev + 250);
      if (onShowToast) onShowToast('Putty Vibe Applied', 'Updated live attendee metric.');
    }
    setInspectorOpen(false);
  };

  const handleElementPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!elementPrompt.trim()) return;
    const text = elementPrompt.trim();
    setElementPrompt('');
    setInspectorOpen(false);
    soundEngine.playSfx('open');

    // Add to feed
    const userMsg: FeedItem = {
      id: Date.now().toString(),
      author: 'You',
      time: 'Just now',
      message: `[Vibe prompt on ${inspectorTarget}]: "${text}"`,
      colorClass: 'text-purple-400',
    };
    setFeed((prev) => [userMsg, ...prev]);
    if (onShowToast) onShowToast('Putty Vibe Transpiled', `Rebuilding ${inspectorTarget}: "${text}"`);

    // Teammate react
    setTimeout(() => {
      soundEngine.playSfx('agent');
      setIsBouncing(true);
      setTimeout(() => setIsBouncing(false), 1200);
      const teamMsg: FeedItem = {
        id: (Date.now() + 1).toString(),
        author: 'Amit',
        time: 'Just now',
        message: 'Synthesized your vibe! Component hot-reloaded across all 5 clients.',
        colorClass: 'text-yellow-400',
      };
      setFeed((prev) => [teamMsg, ...prev]);
    }, 700);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    soundEngine.playSfx('click');

    const userMsg: FeedItem = {
      id: Date.now().toString(),
      author: 'You',
      time: 'Just now',
      message: text,
      colorClass: 'text-purple-400',
    };
    setFeed((prev) => [userMsg, ...prev]);

    setTimeout(() => {
      const replies = [
        { author: 'Amit', color: 'text-yellow-400', msg: 'Love that vibe! Adding the interactive logic right now.' },
        { author: 'Tania', color: 'text-pink-400', msg: 'On it! Polishing the component gradients to match.' },
        { author: 'Aaron', color: 'text-emerald-400', msg: 'Hot-reloaded the element AST tree.' },
        { author: 'Kelsie', color: 'text-cyan-400', msg: 'Looking crisp! Just pushed a branch update.' },
      ];
      const rep = replies[Math.floor(Math.random() * replies.length)];
      soundEngine.playSfx('minimize');
      setFeed((prev) => [
        {
          id: (Date.now() + 1).toString(),
          author: rep.author,
          time: 'Just now',
          message: rep.msg,
          colorClass: rep.color,
        },
        ...prev,
      ]);
    }, 600);
  };

  const handleSyncCelebration = () => {
    soundEngine.playSfx('open');
    if (onShowToast) onShowToast('Play with Putty', 'Synchronized live state across all 5 collaborators.');

    // Pull cursors toward center
    setTeammates((prev) =>
      prev.map((m, i) => ({
        ...m,
        x: 36 + i * 8,
        y: 42,
      }))
    );

    const celebrationMsg: FeedItem = {
      id: Date.now().toString(),
      author: 'Multiplayer Sync',
      time: 'Just now',
      message: 'Amit, Tania, Aaron, and Kelsie merged UI modifications cleanly!',
      colorClass: 'text-cyan-300 font-bold',
    };
    setFeed((prev) => [celebrationMsg, ...prev]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1a1c23] text-slate-100 overflow-hidden font-sans relative">
      {/* Top Nav */}
      <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-slate-950/80 shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-cyan-500 flex items-center justify-center shadow">
            <Users className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white leading-tight">Play with Putty</h3>
            <p className="text-[10px] text-slate-400">Collaborative Vibe Coding Session</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSyncCelebration}
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-xs text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3 h-3 text-cyan-400" />
            <span>Sync Live</span>
          </button>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-medium flex items-center gap-1.5 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            5 Online
          </span>
        </div>
      </div>

      {/* Main Layout Split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Canvas Area */}
        <div
          ref={canvasRef}
          className="flex-1 bg-[#282a36] relative flex flex-col items-center p-8 overflow-hidden"
        >
          {/* Navigation Header in Canvas */}
          <div
            onClick={() => openInspector('header')}
            className="absolute top-0 w-full flex justify-center space-x-8 pt-8 text-white text-base font-semibold drop-shadow-md z-10 select-none cursor-pointer group"
          >
            <span className="group-hover:opacity-80 transition-opacity">{navTitle.about}</span>
            <span className="group-hover:opacity-80 transition-opacity">{navTitle.experiments}</span>
            <span className="group-hover:opacity-80 transition-opacity">{navTitle.connect}</span>
          </div>

          {/* Animated Collaborative Teammate Cursors */}
          {teammates.map((m) => (
            <div
              key={m.id}
              className="absolute z-50 pointer-events-none transition-all duration-1000 ease-in-out"
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
            >
              <div className="flex flex-col items-start">
                <svg
                  className="w-6 h-6 text-white drop-shadow-lg -ml-1 -mt-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                </svg>
                <span
                  className={`${m.badgeBg} ${m.badgeText} text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow mt-1 ml-3`}
                >
                  {m.name}
                </span>
              </div>
            </div>
          ))}

          {/* Interactive Prototype Card */}
          <div
            onClick={() => openInspector('card')}
            className={`bg-[#f8f9fa] text-slate-900 rounded-[28px] p-8 w-[430px] max-w-full mt-32 shadow-2xl relative z-10 transition-all cursor-pointer hover:shadow-cyan-500/20 border border-transparent ${
              isBouncing ? 'animate-bounce' : ''
            }`}
            style={{ boxShadow: cardGlow !== 'none' ? cardGlow : undefined }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Google Labs Prototype
              </span>
              <span className="text-[11px] font-mono text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">
                {waitlistCount.toLocaleString()} Waiting
              </span>
            </div>
            <h2 className="text-[28px] font-medium tracking-tight mb-3 text-slate-900">
              Play with Putty
            </h2>
            <p className="text-slate-600 text-[15px] leading-relaxed mb-8">
              A research experiment in collaborative vibe coding that lets teams build tools and websites together in real time.
            </p>
            <div className="flex items-center justify-between">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  soundEngine.playSfx('click');
                  setWaitlistCount((prev) => prev + 1);
                  if (onShowToast) onShowToast('Putty Waitlist', 'You joined the research waitlist!');
                }}
                className="text-slate-700 hover:text-slate-950 text-sm font-semibold flex items-center transition-colors group"
              >
                <span>Join Waitlist</span>
                <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </button>
              <span className="text-[10px] text-slate-400">Click card to edit vibe</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Team Feed & Vibe Prompts */}
        <div className="w-72 sm:w-80 bg-slate-950/80 border-l border-white/10 flex flex-col shrink-0 z-20">
          <div className="p-3 border-b border-white/10 text-xs font-bold text-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              Team Vibe Feed
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Live AST Sync</span>
          </div>

          {/* Feed Items */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 flex flex-col">
            {feed.map((item) => (
              <div key={item.id} className="bg-white/5 p-2.5 rounded-xl border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`font-bold ${item.colorClass} text-[11px]`}>{item.author}</span>
                  <span className="text-[9px] text-slate-500">{item.time}</span>
                </div>
                <p className="text-slate-300 leading-snug text-xs">{item.message}</p>
              </div>
            ))}
          </div>

          {/* Quick Color Accent Palette */}
          <div className="p-2.5 border-t border-white/10 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Palette className="w-3.5 h-3.5" />
              Glow Vibe:
            </span>
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setCardGlow('0 0 35px rgba(34, 211, 238, 0.45)')}
                className="w-4 h-4 rounded-full bg-cyan-400 border border-white/40 hover:scale-110 transition-transform"
                title="Cyan"
              />
              <button
                onClick={() => setCardGlow('0 0 35px rgba(236, 72, 153, 0.45)')}
                className="w-4 h-4 rounded-full bg-pink-500 border border-white/40 hover:scale-110 transition-transform"
                title="Pink"
              />
              <button
                onClick={() => setCardGlow('0 0 35px rgba(234, 179, 8, 0.45)')}
                className="w-4 h-4 rounded-full bg-yellow-400 border border-white/40 hover:scale-110 transition-transform"
                title="Yellow"
              />
              <button
                onClick={() => setCardGlow('0 0 35px rgba(16, 185, 129, 0.45)')}
                className="w-4 h-4 rounded-full bg-emerald-400 border border-white/40 hover:scale-110 transition-transform"
                title="Emerald"
              />
              <button
                onClick={() => setCardGlow('none')}
                className="w-4 h-4 rounded-full bg-slate-600 border border-white/40 hover:scale-110 transition-transform"
                title="Reset"
              />
            </div>
          </div>

          {/* Chat / Vibe prompt input */}
          <div className="p-3 border-t border-white/10 bg-slate-900">
            <form onSubmit={handleChatSubmit} className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Prompt the team & UI..."
                className="w-full bg-slate-950 border border-white/20 rounded-lg pl-3 pr-8 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 p-1 text-cyan-400 hover:text-cyan-300 transition-colors rounded"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Talk to Element Modal Overlay */}
      {inspectorOpen && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-80 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-4 flex flex-col pointer-events-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Talk to: {inspectorTarget === 'card' ? 'Prototype Card' : 'Navigation Header'}</span>
              </span>
              <button
                onClick={() => setInspectorOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleElementPromptSubmit} className="space-y-3">
              <input
                type="text"
                value={elementPrompt}
                onChange={(e) => setElementPrompt(e.target.value)}
                placeholder="e.g. Make it bouncy, add gradient..."
                className="w-full bg-black/60 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                autoFocus
              />
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplySuggestion('bouncy')}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-slate-300 hover:text-white transition-colors"
                >
                  Make it bouncy
                </button>
                <button
                  type="button"
                  onClick={() => handleApplySuggestion('glow')}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-slate-300 hover:text-white transition-colors"
                >
                  Add cyber glow
                </button>
                <button
                  type="button"
                  onClick={() => handleApplySuggestion('counter')}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] text-slate-300 hover:text-white transition-colors"
                >
                  +250 waitlist
                </button>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white shadow"
                >
                  Transpile Vibe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
