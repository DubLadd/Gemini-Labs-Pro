import React from 'react';
import { AppId, WindowState } from '../types/os';
import { APPS } from '../data/apps';
import { soundEngine } from '../utils/audio';
import {
  Sparkles,
  Search,
  Wifi,
  Volume2,
  Battery,
  Maximize2,
  Minimize2,
  GitPullRequest,
  Users,
  BookOpen,
  Disc,
  PenTool,
  Terminal,
  Settings,
  FolderKanban,
  Atom,
  Zap,
  Gamepad2,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface TaskbarProps {
  activeWindows: WindowState[];
  activeWindowId: AppId | null;
  startMenuOpen: boolean;
  onToggleStartMenu: () => void;
  quickSettingsOpen: boolean;
  onToggleQuickSettings: () => void;
  onLaunchOrFocusApp: (appId: AppId) => void;
  currentTime: string;
  currentDate: string;
  onShowDesktop: () => void;
  onToggleWidget: () => void;
  onOpenSearch: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  activeWindows,
  activeWindowId,
  startMenuOpen,
  onToggleStartMenu,
  quickSettingsOpen,
  onToggleQuickSettings,
  onLaunchOrFocusApp,
  currentTime,
  currentDate,
  onShowDesktop,
  onToggleWidget,
  onOpenSearch,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const getIcon = (iconName: string) => {
    const props = { className: 'w-3.5 h-3.5 text-white' };
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
    <footer className="relative z-50 h-12 w-full mica-acrylic bg-slate-900/80 border-t border-slate-700/50 flex items-center justify-between px-3 taskbar-glow select-none">
      {/* Left Labs Widget Button */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleWidget}
          className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 active:bg-white/15 transition-all text-xs text-slate-300 group"
          title="Google Labs Network Status"
        >
          <Sparkles className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline font-medium">Google Labs</span>
        </button>
      </div>

      {/* Centered Taskbar Dock */}
      <div className="flex items-center space-x-1.5 absolute left-1/2 -translate-x-1/2">
        {/* Start Button */}
        <button
          onClick={() => {
            soundEngine.playSfx('click');
            onToggleStartMenu();
          }}
          className={`p-2 rounded-lg transition-all flex items-center justify-center group relative ${
            startMenuOpen ? 'bg-white/15 shadow-inner' : 'hover:bg-white/10 active:scale-95'
          }`}
          title="Start"
        >
          <div className="w-5 h-5 grid grid-cols-2 gap-0.5 group-hover:scale-105 transition-transform">
            <div className="bg-cyan-400 rounded-sm"></div>
            <div className="bg-blue-500 rounded-sm"></div>
            <div className="bg-indigo-400 rounded-sm"></div>
            <div className="bg-emerald-400 rounded-sm"></div>
          </div>
        </button>

        {/* Taskbar Search Pill */}
        <button
          onClick={onOpenSearch}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-slate-400 transition-all"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Search experiments...</span>
        </button>

        {/* Running Apps Dock */}
        <div className="flex items-center space-x-1.5 pl-1">
          {activeWindows.map((win) => {
            const app = APPS[win.id];
            if (!app) return null;
            const isCurrentActive = activeWindowId === win.id && !win.isMinimized;

            return (
              <button
                key={win.id}
                onClick={() => onLaunchOrFocusApp(win.id)}
                className={`relative p-2 rounded-lg transition-all flex items-center justify-center ${
                  isCurrentActive ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
                title={app.title}
              >
                <div
                  className={`w-5 h-5 rounded-md bg-gradient-to-tr ${app.color} flex items-center justify-center shadow`}
                >
                  {getIcon(app.icon)}
                </div>

                {/* Active pip indicator */}
                <div
                  className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full transition-all ${
                    isCurrentActive
                      ? 'w-4 h-1 bg-cyan-400'
                      : win.isMinimized
                      ? 'w-1.5 h-1 bg-slate-500'
                      : 'w-2 h-1 bg-slate-300'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Right System Tray */}
      <div className="flex items-center space-x-1 text-slate-300">
        {/* Fullscreen Toggle Button */}
        <button
          onClick={() => {
            soundEngine.playSfx('click');
            onToggleFullscreen();
          }}
          className="p-1.5 rounded-lg hover:bg-white/10 active:bg-white/15 text-slate-300 hover:text-cyan-400 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>

        {/* Quick Settings Indicator Pill */}
        <button
          onClick={() => {
            soundEngine.playSfx('click');
            onToggleQuickSettings();
          }}
          className={`flex items-center space-x-2 px-2 py-1 rounded-lg transition-all text-xs group ${
            quickSettingsOpen ? 'bg-white/15' : 'hover:bg-white/10'
          }`}
          title="Quick Settings (Volume, Wi-Fi, Theme)"
        >
          <Wifi className="w-3.5 h-3.5 text-slate-300 group-hover:text-cyan-400 transition-colors" />
          <Volume2 className="w-3.5 h-3.5 text-slate-300 group-hover:text-cyan-400 transition-colors" />
          <Battery className="w-3.5 h-3.5 text-emerald-400" />
        </button>

        {/* Live Clock & Date */}
        <div className="flex flex-col items-end px-2 py-0.5 rounded-lg text-right leading-tight select-none">
          <span className="text-xs font-semibold tracking-wide text-slate-100">{currentTime}</span>
          <span className="text-[10px] text-slate-400">{currentDate}</span>
        </div>

        {/* Show Desktop Peek Edge */}
        <div
          onClick={onShowDesktop}
          className="w-1.5 h-7 border-l border-white/20 hover:bg-white/20 cursor-pointer ml-1 transition-colors"
          title="Show Desktop"
        />
      </div>
    </footer>
  );
};
