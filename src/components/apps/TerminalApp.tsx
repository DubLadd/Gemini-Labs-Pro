import React, { useState, useRef, useEffect, memo } from 'react';
import { soundEngine } from '../../utils/audio';
import { AppId } from '../../types/os';
import { APPS } from '../../data/apps';
import { Terminal, Palette, RotateCcw, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { getInstalledMiniApps, setActiveMiniAppId } from '../../utils/miniAppStore';

export type TerminalThemeId = 'matrix' | 'cyberpunk' | 'minimal' | 'amber' | 'dracula' | 'synthwave';

export interface TerminalThemeConfig {
  id: TerminalThemeId;
  name: string;
  bg: string;
  border: string;
  promptUser: string;
  promptText: string;
  output: string;
  error: string;
  success: string;
  caret: string;
  accent: string;
  badgeBg: string;
}

export const TERMINAL_THEMES: Record<TerminalThemeId, TerminalThemeConfig> = {
  matrix: {
    id: 'matrix',
    name: 'Matrix',
    bg: 'bg-black',
    border: 'border-emerald-900/60',
    promptUser: 'text-emerald-400 font-bold',
    promptText: 'text-emerald-300',
    output: 'text-emerald-400/90',
    error: 'text-rose-400',
    success: 'text-emerald-300 font-medium',
    caret: 'caret-emerald-400',
    accent: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
    badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-800',
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    bg: 'bg-[#0d0221]',
    border: 'border-fuchsia-800/60',
    promptUser: 'text-yellow-400 font-bold',
    promptText: 'text-cyan-300',
    output: 'text-pink-300/90',
    error: 'text-rose-400 font-bold',
    success: 'text-cyan-300 font-medium',
    caret: 'caret-yellow-400',
    accent: 'text-yellow-400 border-fuchsia-500/40 bg-fuchsia-950/40',
    badgeBg: 'bg-fuchsia-950 text-yellow-300 border-fuchsia-700',
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    bg: 'bg-zinc-950',
    border: 'border-zinc-800',
    promptUser: 'text-zinc-200 font-semibold',
    promptText: 'text-zinc-100',
    output: 'text-zinc-300',
    error: 'text-rose-400',
    success: 'text-zinc-100 font-medium',
    caret: 'caret-zinc-100',
    accent: 'text-zinc-200 border-zinc-700 bg-zinc-900',
    badgeBg: 'bg-zinc-900 text-zinc-300 border-zinc-700',
  },
  amber: {
    id: 'amber',
    name: 'Retro Amber',
    bg: 'bg-[#120a02]',
    border: 'border-amber-900/60',
    promptUser: 'text-amber-400 font-bold',
    promptText: 'text-amber-300',
    output: 'text-amber-400/90',
    error: 'text-red-400',
    success: 'text-amber-200 font-medium',
    caret: 'caret-amber-400',
    accent: 'text-amber-400 border-amber-600/40 bg-amber-950/40',
    badgeBg: 'bg-amber-950 text-amber-300 border-amber-800',
  },
  dracula: {
    id: 'dracula',
    name: 'Dracula',
    bg: 'bg-[#1e1f29]',
    border: 'border-purple-900/60',
    promptUser: 'text-[#50fa7b] font-bold',
    promptText: 'text-[#f8f8f2]',
    output: 'text-[#8be9fd]',
    error: 'text-[#ff5555]',
    success: 'text-[#bd93f9]',
    caret: 'caret-[#ff79c6]',
    accent: 'text-[#bd93f9] border-purple-500/40 bg-purple-950/40',
    badgeBg: 'bg-purple-950/80 text-[#50fa7b] border-purple-800',
  },
  synthwave: {
    id: 'synthwave',
    name: 'Synthwave',
    bg: 'bg-[#1a0933]',
    border: 'border-violet-800/60',
    promptUser: 'text-[#05d9e8] font-bold',
    promptText: 'text-[#ff2a6d]',
    output: 'text-[#d1f7ff]',
    error: 'text-[#ff2a6d]',
    success: 'text-[#05d9e8] font-medium',
    caret: 'caret-[#05d9e8]',
    accent: 'text-[#05d9e8] border-pink-500/40 bg-pink-950/40',
    badgeBg: 'bg-pink-950 text-[#05d9e8] border-pink-800',
  },
};

interface TerminalLine {
  id: string;
  type: 'prompt' | 'output' | 'error' | 'success';
  text: string;
  animate?: boolean;
}

interface TerminalAppProps {
  onLaunchApp?: (appId: AppId) => void;
  onCycleTheme?: () => void;
  activeWindowsCount?: number;
}

const STORAGE_KEYS = {
  COMMAND_HISTORY: 'google_labs_terminal_history_v1',
  THEME: 'google_labs_terminal_theme_v1',
};

// Typewriter line component for smooth, responsive character streaming
const TypewriterLine: React.FC<{
  text: string;
  animate?: boolean;
  className: string;
  onDone?: () => void;
}> = memo(({ text, animate = false, className, onDone }) => {
  const [displayedText, setDisplayedText] = useState(animate ? '' : text);
  const [isDone, setIsDone] = useState(!animate);

  useEffect(() => {
    if (!animate) {
      setDisplayedText(text);
      setIsDone(true);
      return;
    }

    let currentIndex = 0;
    const totalChars = text.length;

    // Fast dynamic typing: adjust speed based on length so long outputs don't lag
    // For short lines, type 1-2 chars every ~8ms. For long lines, jump 3-6 chars per tick.
    const step = totalChars > 200 ? 5 : totalChars > 60 ? 3 : 1;
    const intervalTime = 10;

    const timer = setInterval(() => {
      currentIndex = Math.min(currentIndex + step, totalChars);
      setDisplayedText(text.slice(0, currentIndex));

      if (currentIndex >= totalChars) {
        clearInterval(timer);
        setIsDone(true);
        if (onDone) onDone();
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [text, animate, onDone]);

  return (
    <div className={`leading-relaxed whitespace-pre-wrap ${className}`}>
      {displayedText}
      {!isDone && (
        <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current align-middle animate-pulse" />
      )}
    </div>
  );
});

TypewriterLine.displayName = 'TypewriterLine';

export const TerminalApp: React.FC<TerminalAppProps> = ({
  onLaunchApp,
  onCycleTheme,
  activeWindowsCount = 1,
}) => {
  // Theme state initialized from localStorage with fallback to matrix
  const [themeId, setThemeId] = useState<TerminalThemeId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved && TERMINAL_THEMES[saved as TerminalThemeId]) {
        return saved as TerminalThemeId;
      }
    } catch {
      // ignore storage errors
    }
    return 'matrix';
  });

  const activeTheme = TERMINAL_THEMES[themeId] || TERMINAL_THEMES.matrix;

  // Persist theme changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, themeId);
    } catch {
      // ignore storage errors
    }
  }, [themeId]);

  // Terminal scrollback history
  const [history, setHistory] = useState<TerminalLine[]>([
    { id: '1', type: 'output', text: 'Google Labs Shell Interface [Version 26.10.5]', animate: false },
    { id: '2', type: 'output', text: "Type 'help' to see available shell commands, or 'theme <matrix|cyberpunk|minimal|amber|dracula|synthwave>' to customize.", animate: false },
    { id: '3', type: 'output', text: '--------------------------------------------------', animate: false },
  ]);

  const [inputVal, setInputVal] = useState('');

  // Command history initialized from localStorage
  const [commandHistory, setCommandHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMMAND_HISTORY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore parse errors
    }
    return [];
  });

  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Persist command history to localStorage (keep last 200 commands)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.COMMAND_HISTORY, JSON.stringify(commandHistory.slice(-200)));
    } catch {
      // ignore storage errors
    }
  }, [commandHistory]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom whenever history updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    soundEngine.playSfx('keystroke');

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex + 1 < commandHistory.length ? historyIndex + 1 : historyIndex;
      setHistoryIndex(nextIdx);
      setInputVal(commandHistory[commandHistory.length - 1 - nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[commandHistory.length - 1 - nextIdx] || '');
      } else {
        setHistoryIndex(-1);
        setInputVal('');
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = inputVal.trim();
      setInputVal('');
      setHistoryIndex(-1);

      if (cmd) {
        setCommandHistory((prev) => {
          // Avoid duplicate immediate repeat if identical
          if (prev.length > 0 && prev[prev.length - 1] === cmd) {
            return prev;
          }
          return [...prev, cmd];
        });
      }

      const promptEntry: TerminalLine = {
        id: `prompt-${Date.now()}`,
        type: 'prompt',
        text: `labs@shell:~$ ${cmd}`,
        animate: false,
      };

      if (!cmd) {
        setHistory((prev) => [...prev, promptEntry]);
        return;
      }

      const parts = cmd.split(' ').filter(Boolean);
      const root = parts[0]?.toLowerCase() || '';
      const args = parts.slice(1);
      const lowerArgs = args.map((a) => a.toLowerCase());

      const newLines: TerminalLine[] = [promptEntry];
      const timeBase = Date.now();

      if (root === 'help') {
        newLines.push({
          id: `out-${timeBase}`,
          type: 'output',
          animate: true,
          text: `Available Shell Commands:
  apps                   - List installed Google Labs experiments
  open <app_id>          - Launch experiment window (e.g. open jules, open ascii)
  theme [name]           - Get current theme or switch theme:
                           matrix | cyberpunk | minimal | amber | dracula | synthwave
  history                - Display persistent command history log
  history clear          - Clear saved command history
  sysinfo                - Display runtime kernel, memory and system metrics
  clear                  - Clear terminal scrollback buffer
  date                   - Show current system date and timestamp
  whoami                 - Current session authorization profile
  echo <message>         - Print text to shell`,
        });
      } else if (root === 'theme') {
        const chosen = lowerArgs[0];
        if (!chosen) {
          // Show current theme and options
          newLines.push({
            id: `out-${timeBase}`,
            type: 'output',
            animate: true,
            text: `Current theme: '${themeId}' (${activeTheme.name})\nAvailable themes: ${Object.keys(TERMINAL_THEMES).join(', ')}\nUsage: 'theme <name>' or 'theme random' to change.\n(Also run 'theme desktop' to cycle desktop wallpapers)`,
          });
        } else if (chosen === 'desktop' || chosen === 'wall' || chosen === 'wallpaper') {
          if (onCycleTheme) onCycleTheme();
          newLines.push({
            id: `out-${timeBase}`,
            type: 'success',
            animate: true,
            text: 'Toggled desktop wallpaper theme preset.',
          });
        } else if (chosen === 'random') {
          const themeKeys = Object.keys(TERMINAL_THEMES) as TerminalThemeId[];
          const filtered = themeKeys.filter((k) => k !== themeId);
          const next = filtered[Math.floor(Math.random() * filtered.length)];
          setThemeId(next);
          newLines.push({
            id: `out-${timeBase}`,
            type: 'success',
            animate: true,
            text: `Random theme selected: '${next}' (${TERMINAL_THEMES[next].name}). Theme saved to localStorage.`,
          });
        } else if (TERMINAL_THEMES[chosen as TerminalThemeId]) {
          const targetTheme = chosen as TerminalThemeId;
          setThemeId(targetTheme);
          newLines.push({
            id: `out-${timeBase}`,
            type: 'success',
            animate: true,
            text: `Terminal color theme switched to '${targetTheme}' (${TERMINAL_THEMES[targetTheme].name})!\nSaved preference to persistent storage.`,
          });
        } else {
          newLines.push({
            id: `out-${timeBase}`,
            type: 'error',
            animate: true,
            text: `Unknown theme '${chosen}'.\nValid themes: ${Object.keys(TERMINAL_THEMES).join(', ')}. Example: 'theme matrix' or 'theme cyberpunk'`,
          });
        }
      } else if (root === 'history') {
        if (lowerArgs[0] === 'clear') {
          setCommandHistory([]);
          try {
            localStorage.removeItem(STORAGE_KEYS.COMMAND_HISTORY);
          } catch {
            // ignore
          }
          newLines.push({
            id: `out-${timeBase}`,
            type: 'success',
            animate: true,
            text: 'Cleared persistent command history from local storage.',
          });
        } else {
          if (commandHistory.length === 0) {
            newLines.push({
              id: `out-${timeBase}`,
              type: 'output',
              animate: true,
              text: 'Command history is empty. Commands typed in this session are automatically persisted.',
            });
          } else {
            const list = commandHistory
              .map((c, i) => `  ${String(i + 1).padStart(3, ' ')}  ${c}`)
              .join('\n');
            newLines.push({
              id: `out-${timeBase}`,
              type: 'output',
              animate: true,
              text: `Command History (${commandHistory.length} persisted commands):\n${list}\n\nTip: Press Up/Down arrow keys to cycle through previous commands, or 'history clear' to reset.`,
            });
          }
        }
      } else if (root === 'apps') {
        newLines.push({
          id: `out-${timeBase}`,
          type: 'success',
          animate: true,
          text: `Installed Experiments:\n${Object.keys(APPS)
            .map((k) => `  * ${k.padEnd(12, ' ')} : ${APPS[k].title}`)
            .join('\n')}`,
        });
      } else if (root === 'open') {
        const targetId = lowerArgs[0] as AppId;
        if (targetId && APPS[targetId]) {
          if (onLaunchApp) onLaunchApp(targetId);
          newLines.push({
            id: `out-${timeBase}`,
            type: 'success',
            animate: true,
            text: `Launched process: [${targetId}] ${APPS[targetId].title}`,
          });
        } else {
          newLines.push({
            id: `out-${timeBase}`,
            type: 'error',
            animate: true,
            text: `App not found: '${args[0]}'. Run 'apps' to view available IDs.`,
          });
        }
      } else if (root === 'play' || root === 'arcade' || root === 'game') {
        if (onLaunchApp) onLaunchApp('arcade');
        newLines.push({
          id: `out-${timeBase}`,
          type: 'success',
          animate: true,
          text: '🕹️ Launching Playground Studio // Game & App Forge Engine...',
        });
      } else if (root === 'ascii') {
        if (onLaunchApp) onLaunchApp('ascii');
        newLines.push({
          id: `out-${timeBase}`,
          type: 'success',
          animate: true,
          text: '👾 Launching ASCII Art Studio // WebRTC Broadcast & Audio Pulse...',
        });
      } else if (root === 'miniapp' || root === 'miniapps') {
        const sub = lowerArgs[0];
        if (sub === 'list') {
          const list = getInstalledMiniApps();
          newLines.push({
            id: `out-${timeBase}`,
            type: 'success',
            animate: true,
            text: `Installed Mini Apps (${list.length}):\n` +
              list.map((m) => `  * [${m.id}] ${m.title} (v${m.version}) - ${m.upgradesApplied.length} upgrades`).join('\n'),
          });
        } else if (sub === 'run' || sub === 'play') {
          const targetId = lowerArgs[1];
          if (targetId) setActiveMiniAppId(targetId);
          if (onLaunchApp) onLaunchApp('miniapps');
          newLines.push({
            id: `out-${timeBase}`,
            type: 'success',
            animate: true,
            text: `🚀 Launching Mini App engine${targetId ? ` for [${targetId}]` : ''}...`,
          });
        } else {
          if (onLaunchApp) onLaunchApp('miniapps');
          newLines.push({
            id: `out-${timeBase}`,
            type: 'success',
            animate: true,
            text: '🕹️ Opening Mini Apps // Game & Web Engine...',
          });
        }
      } else if (root === 'flow' || root === 'music' || root === 'beat' || root === 'synth') {
        if (onLaunchApp) onLaunchApp('musicfx');
        newLines.push({
          id: `out-${timeBase}`,
          type: 'success',
          animate: true,
          text: '🎵 Launching Google Flow Music // AI Genre Studio & Lyric Forge...',
        });
      } else if (root === 'clear') {
        setHistory([]);
        return;
      } else if (root === 'sysinfo') {
        newLines.push({
          id: `out-${timeBase}`,
          type: 'output',
          animate: true,
          text: `OS: Google Labs Shell for Web
Kernel: React 19 / TypeScript 5.8
Client Sandbox: Chrome V8 Isolation Layer
Active Windows: ${activeWindowsCount}
Terminal Theme: ${activeTheme.name} (${activeTheme.id})
Persisted Commands: ${commandHistory.length}
Local Storage Sync: Active (Encrypted Client Storage)
Memory Allocation: Nominal (AST JIT Cached)`,
        });
      } else if (root === 'date') {
        newLines.push({
          id: `out-${timeBase}`,
          type: 'output',
          animate: true,
          text: new Date().toString(),
        });
      } else if (root === 'whoami') {
        newLines.push({
          id: `out-${timeBase}`,
          type: 'output',
          animate: true,
          text: 'labs_explorer (Tier Pro Developer)',
        });
      } else if (root === 'echo') {
        newLines.push({
          id: `out-${timeBase}`,
          type: 'output',
          animate: true,
          text: args.join(' '),
        });
      } else {
        newLines.push({
          id: `out-${timeBase}`,
          type: 'error',
          animate: true,
          text: `Command not recognized: '${cmd}'. Type 'help' for instructions or 'theme <name>' to customize colors.`,
        });
      }

      setHistory((prev) => [...prev, ...newLines]);
    }
  };

  const cycleThemeQuickly = () => {
    const themeKeys = Object.keys(TERMINAL_THEMES) as TerminalThemeId[];
    const curIdx = themeKeys.indexOf(themeId);
    const nextTheme = themeKeys[(curIdx + 1) % themeKeys.length];
    setThemeId(nextTheme);
    soundEngine.playSfx('keystroke');
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={`flex-1 flex flex-col h-full ${activeTheme.bg} p-3 font-mono text-xs select-text overflow-hidden cursor-text transition-colors duration-200`}
    >
      {/* Top Terminal Status Header Bar */}
      <div className={`flex items-center justify-between pb-2 mb-2 border-b ${activeTheme.border} shrink-0 text-[11px]`}>
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-300">labs@shell</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">interactive v26.10.5</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick theme selector pill */}
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 text-[10px] hidden sm:inline">Theme:</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cycleThemeQuickly();
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-medium border flex items-center space-x-1 transition-all hover:scale-105 ${activeTheme.badgeBg}`}
              title="Click to cycle theme or type 'theme <name>'"
            >
              <Palette className="w-3 h-3 inline" />
              <span>{activeTheme.name}</span>
            </button>
          </div>

          {/* Persistent commands count pill */}
          <span
            className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 border border-slate-800"
            title={`${commandHistory.length} commands saved in localStorage`}
          >
            {commandHistory.length} cmds saved
          </span>

          {/* Clear screen button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setHistory([]);
            }}
            className="p-1 text-slate-500 hover:text-slate-200 transition-colors"
            title="Clear terminal scrollback (or type 'clear')"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 overflow-y-auto space-y-1 mb-2 no-scrollbar pr-1">
        {history.map((line) => {
          let color = activeTheme.output;
          if (line.type === 'prompt') color = activeTheme.promptUser;
          else if (line.type === 'error') color = activeTheme.error;
          else if (line.type === 'success') color = activeTheme.success;

          return (
            <TypewriterLine
              key={line.id}
              text={line.text}
              animate={line.animate}
              className={color}
              onDone={scrollToBottom}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Prompt */}
      <div className={`flex items-center space-x-2 pt-2 border-t ${activeTheme.border} shrink-0`}>
        <span className={`${activeTheme.promptUser} select-none flex items-center space-x-1`}>
          <span>labs@shell:~$</span>
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className={`flex-1 bg-transparent border-none ${activeTheme.promptText} focus:outline-none font-mono ${activeTheme.caret} text-xs`}
        />
        {commandHistory.length > 0 && (
          <div className="hidden md:flex items-center space-x-1 text-[10px] text-slate-500 select-none">
            <span className="flex items-center"><ArrowUp className="w-2.5 h-2.5 mr-0.5" /><ArrowDown className="w-2.5 h-2.5 mr-0.5" /> hist</span>
          </div>
        )}
      </div>
    </div>
  );
};
