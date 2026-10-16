import React, { useState, useRef, useEffect } from 'react';
import { AppId } from '../types/os';
import { APPS } from '../data/apps';
import { soundEngine } from '../utils/audio';
import {
  Search,
  RotateCw,
  Power,
  GitPullRequest,
  Users,
  BookOpen,
  Disc,
  PenTool,
  Terminal,
  Settings,
  Sparkles,
  FolderKanban,
  Atom,
  Zap,
  Gamepad2,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchApp: (appId: AppId) => void;
  onShowPowerDialog: (action: 'restart' | 'shutdown') => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  isOpen,
  onClose,
  onLaunchApp,
  onShowPowerDialog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const appList = Object.values(APPS);
  const filteredApps = searchQuery.trim()
    ? appList.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : appList;

  const getIcon = (iconName: string) => {
    const props = { className: 'w-5 h-5 text-white' };
    switch (iconName) {
      case 'GitPullRequest':
        return <GitPullRequest {...props} />;
      case 'Users':
        return <Users {...props} />;
      case 'Sparkles':
        return <Sparkles {...props} />;
      case 'BookOpen':
        return <BookOpen {...props} />;
      case 'Disc':
        return <Disc {...props} />;
      case 'PenTool':
        return <PenTool {...props} />;
      case 'Terminal':
        return <Terminal {...props} />;
      case 'Settings':
        return <Settings {...props} />;
      case 'FolderKanban':
        return <FolderKanban {...props} />;
      case 'Atom':
        return <Atom {...props} />;
      case 'Zap':
        return <Zap {...props} />;
      case 'Gamepad2':
        return <Gamepad2 {...props} />;
      case 'Layers':
        return <Layers {...props} />;
      default:
        return <HelpCircle {...props} />;
    }
  };

  return (
    <div
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[92vw] max-w-[540px] h-[550px] mica-acrylic bg-slate-900/95 rounded-2xl border border-white/15 window-shadow z-50 p-5 flex flex-col pointer-events-auto select-none"
    >
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search experiments, tools, and docs..."
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:bg-white/10 transition-all font-sans"
        />
      </div>

      {/* Pinned Experiments Header */}
      <div className="flex items-center justify-between mb-3 px-1 shrink-0">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Pinned Experiments
        </span>
        <button
          onClick={() => {
            soundEngine.playSfx('click');
            onLaunchApp('promptlab');
            onClose();
          }}
          className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
        >
          All Experiments
        </button>
      </div>

      {/* Pinned Experiments Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 mb-4 overflow-y-auto max-h-[170px] pr-1 shrink-0">
        {filteredApps.map((app) => (
          <div
            key={app.id}
            onClick={() => {
              soundEngine.playSfx('click');
              onLaunchApp(app.id);
              onClose();
            }}
            className="flex flex-col items-center p-2 rounded-xl hover:bg-white/10 cursor-pointer transition-all text-center group"
          >
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${app.color} flex items-center justify-center shadow mb-1.5 group-hover:scale-105 transition-transform`}
            >
              {getIcon(app.icon)}
            </div>
            <span className="text-[11px] text-slate-200 line-clamp-1 font-medium">{app.shortTitle}</span>
          </div>
        ))}
      </div>

      {/* Recent Artifacts Section */}
      <div className="flex items-center justify-between mb-2 px-1 shrink-0">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Recent Artifacts
        </span>
        <span className="text-[10px] text-slate-400">Google Labs Cloud Sync</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs">
        {/* Jules PR */}
        <div
          onClick={() => {
            onLaunchApp('jules');
            onClose();
          }}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors bg-purple-950/20 border border-purple-500/20"
        >
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white rounded-md shadow">
              <GitPullRequest className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-slate-200 flex items-center gap-1.5">
                Jules_Task_OnboardingFlow.pr{' '}
                <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-purple-500/25 text-purple-300 font-mono">
                  Agent Active
                </span>
              </p>
              <p className="text-[10px] text-slate-400">Async bugfix & test generation · Jules Agent</p>
            </div>
          </div>
          <span className="text-[10px] text-purple-400 font-mono">Running</span>
        </div>

        {/* Putty */}
        <div
          onClick={() => {
            onLaunchApp('putty');
            onClose();
          }}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors bg-white/[0.03] border border-amber-500/20"
        >
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 text-white rounded-md shadow">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-slate-200 flex items-center gap-1.5">
                Team_Vibe_Prototype.putty{' '}
                <span className="px-1.5 py-0.2 text-[9px] rounded-full bg-emerald-500/20 text-emerald-300">
                  Live 5 users
                </span>
              </p>
              <p className="text-[10px] text-slate-400">
                Collaborative session with Amit, Tania, Aaron, Kelsie · Putty
              </p>
            </div>
          </div>
          <span className="text-[10px] text-cyan-400 font-mono">Synced</span>
        </div>

        {/* Notebook */}
        <div
          onClick={() => {
            onLaunchApp('notebook');
            onClose();
          }}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-md">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-slate-200">Quantum_Computing_Notes.lab</p>
              <p className="text-[10px] text-slate-400">Modified 15 min ago · NotebookLM</p>
            </div>
          </div>
          <span className="text-[10px] text-slate-500">2.4 MB</span>
        </div>

        {/* MusicFX */}
        <div
          onClick={() => {
            onLaunchApp('musicfx');
            onClose();
          }}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-md">
              <Disc className="w-4 h-4" />
            </div>
            <div>
              <p className="font-medium text-slate-200">Cyber_Ambient_Loop_48k.wav</p>
              <p className="text-[10px] text-slate-400">Synthesized 1 hr ago · MusicFX</p>
            </div>
          </div>
          <span className="text-[10px] text-slate-500">Audio Synth</span>
        </div>
      </div>

      {/* Start Menu Footer: Profile & Power */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between mt-auto shrink-0">
        <div className="flex items-center space-x-3 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center font-bold text-xs shadow text-white">
            G
          </div>
          <div className="text-left">
            <p className="text-xs font-medium text-slate-200 leading-tight">Labs Explorer</p>
            <p className="text-[10px] text-cyan-400">Signed In · Tier Pro</p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onShowPowerDialog('restart')}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            title="Restart Shell"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => onShowPowerDialog('shutdown')}
            className="p-2 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
            title="Power Options"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
