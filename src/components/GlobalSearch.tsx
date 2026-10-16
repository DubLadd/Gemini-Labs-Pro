import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppId, AppConfig } from '../types/os';
import { APPS } from '../data/apps';
import { MiniAppDefinition, getInstalledMiniApps, setActiveMiniAppId } from '../utils/miniAppStore';
import { getAllFlatFiles, FlattenedFile } from '../utils/fileSystem';
import { soundEngine } from '../utils/audio';
import {
  Search,
  X,
  Layers,
  FileText,
  FileCode,
  FileJson,
  File,
  Sparkles,
  Command,
  ArrowRight,
  ExternalLink,
  Sliders,
  Maximize2,
  Volume2,
  VolumeX,
  Palette,
  Power,
  RotateCcw,
  Zap,
  Tag,
  GitPullRequest,
  Users,
  BookOpen,
  Disc,
  PenTool,
  Terminal,
  Settings,
  FolderKanban,
  Atom,
  Gamepad2,
  HelpCircle,
  Play,
  Pin,
} from 'lucide-react';

export type SearchCategory = 'all' | 'apps' | 'miniapps' | 'files' | 'actions';

export interface SystemAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'actions';
  shortcut?: string;
  run: () => void;
}

export type SearchResultItem =
  | { type: 'app'; data: AppConfig }
  | { type: 'miniapp'; data: MiniAppDefinition }
  | { type: 'file'; data: FlattenedFile }
  | { type: 'action'; data: SystemAction };

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onLaunchApp: (appId: AppId) => void;
  onLaunchMiniApp: (miniAppId: string) => void;
  onOpenFileInFiles: (file: FlattenedFile) => void;
  onToggleFullscreen: () => void;
  onCycleWallpaper: () => void;
  onToggleAudio: () => void;
  isAudioMuted: boolean;
  onShowPowerDialog: (action: 'restart' | 'shutdown') => void;
  onShowToast: (title: string, message: string, type?: 'info' | 'success' | 'warn') => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  onLaunchApp,
  onLaunchMiniApp,
  onOpenFileInFiles,
  onToggleFullscreen,
  onCycleWallpaper,
  onToggleAudio,
  isAudioMuted,
  onShowPowerDialog,
  onShowToast,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      soundEngine.playSfx('open');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      setQuery('');
      setCategory('all');
    }
  }, [isOpen]);

  // System actions list
  const systemActions: SystemAction[] = useMemo(
    () => [
      {
        id: 'toggle-fullscreen',
        title: 'Toggle Fullscreen Mode',
        description: 'Switch between full desktop view and windowed frame',
        icon: 'Maximize2',
        category: 'actions',
        shortcut: 'F11',
        run: () => {
          onToggleFullscreen();
          onShowToast('Display', 'Toggled fullscreen view.');
        },
      },
      {
        id: 'cycle-wallpaper',
        title: 'Cycle Desktop Wallpaper',
        description: 'Rotate to next cyber wallpaper theme',
        icon: 'Palette',
        category: 'actions',
        shortcut: 'Desktop Menu',
        run: () => {
          onCycleWallpaper();
        },
      },
      {
        id: 'toggle-audio',
        title: isAudioMuted ? 'Unmute System Sound FX' : 'Mute System Sound FX',
        description: 'Toggle OS retro audio synthesis and beeps',
        icon: isAudioMuted ? 'VolumeX' : 'Volume2',
        category: 'actions',
        run: () => {
          onToggleAudio();
          onShowToast('Audio', isAudioMuted ? 'Sound FX enabled' : 'Sound FX muted');
        },
      },
      {
        id: 'system-restart',
        title: 'Restart Session State',
        description: 'Clear running windows and reset desktop session',
        icon: 'RotateCcw',
        category: 'actions',
        run: () => {
          onShowPowerDialog('restart');
        },
      },
      {
        id: 'system-shutdown',
        title: 'Shutdown Workspace',
        description: 'Close active processes and display power dialog',
        icon: 'Power',
        category: 'actions',
        run: () => {
          onShowPowerDialog('shutdown');
        },
      },
    ],
    [isAudioMuted, onToggleFullscreen, onCycleWallpaper, onToggleAudio, onShowPowerDialog, onShowToast]
  );

  // Retrieve current mini apps
  const miniApps = useMemo(() => getInstalledMiniApps(), [isOpen]);

  // Retrieve flat files
  const flatFiles = useMemo(() => getAllFlatFiles(), [isOpen]);

  // Apps list
  const appsList = useMemo(() => Object.values(APPS), []);

  // Filter and compute search results
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items: SearchResultItem[] = [];

    // 1. Applications
    if (category === 'all' || category === 'apps') {
      for (const app of appsList) {
        if (
          !q ||
          app.title.toLowerCase().includes(q) ||
          app.shortTitle.toLowerCase().includes(q) ||
          app.id.toLowerCase().includes(q)
        ) {
          items.push({ type: 'app', data: app });
        }
      }
    }

    // 2. MiniApps
    if (category === 'all' || category === 'miniapps') {
      for (const ma of miniApps) {
        if (
          !q ||
          ma.title.toLowerCase().includes(q) ||
          ma.shortTitle.toLowerCase().includes(q) ||
          ma.genre.toLowerCase().includes(q) ||
          ma.tags.some((t) => t.toLowerCase().includes(q)) ||
          ma.description.toLowerCase().includes(q)
        ) {
          items.push({ type: 'miniapp', data: ma });
        }
      }
    }

    // 3. Files
    if (category === 'all' || category === 'files') {
      for (const f of flatFiles) {
        if (
          !q ||
          f.file.name.toLowerCase().includes(q) ||
          f.path.toLowerCase().includes(q) ||
          f.file.extension.toLowerCase().includes(q) ||
          f.file.content.toLowerCase().includes(q)
        ) {
          items.push({ type: 'file', data: f });
        }
      }
    }

    // 4. System Actions
    if (category === 'all' || category === 'actions') {
      for (const action of systemActions) {
        if (
          !q ||
          action.title.toLowerCase().includes(q) ||
          action.description.toLowerCase().includes(q) ||
          (action.shortcut && action.shortcut.toLowerCase().includes(q))
        ) {
          items.push({ type: 'action', data: action });
        }
      }
    }

    return items;
  }, [query, category, appsList, miniApps, flatFiles, systemActions]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= results.length) {
      setSelectedIndex(Math.max(0, results.length - 1));
    }
  }, [results.length, selectedIndex]);

  // Execute selected item
  const executeItem = (item: SearchResultItem) => {
    soundEngine.playSfx('open');
    onClose();

    if (item.type === 'app') {
      onLaunchApp(item.data.id);
    } else if (item.type === 'miniapp') {
      setActiveMiniAppId(item.data.id);
      onLaunchMiniApp(item.data.id);
    } else if (item.type === 'file') {
      onOpenFileInFiles(item.data);
    } else if (item.type === 'action') {
      item.data.run();
    }
  };

  // Keyboard navigation inside search dialog
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
      scrollSelectedIntoView((selectedIndex + 1) % Math.max(1, results.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + Math.max(1, results.length)) % Math.max(1, results.length));
      scrollSelectedIntoView((selectedIndex - 1 + Math.max(1, results.length)) % Math.max(1, results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        executeItem(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const categories: SearchCategory[] = ['all', 'apps', 'miniapps', 'files', 'actions'];
      const nextIdx = (categories.indexOf(category) + (e.shiftKey ? -1 : 1) + categories.length) % categories.length;
      setCategory(categories[nextIdx]);
      setSelectedIndex(0);
    }
  };

  const scrollSelectedIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-search-item]');
    const target = items[index] as HTMLElement;
    if (target) {
      target.scrollIntoView({ block: 'nearest' });
    }
  };

  const getAppIcon = (iconName: string) => {
    const props = { className: 'w-4 h-4 text-white' };
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

  const getFileIcon = (ext: string) => {
    const props = { className: 'w-4 h-4' };
    switch (ext) {
      case 'ts':
      case 'js':
        return <FileCode {...props} className="w-4 h-4 text-cyan-400" />;
      case 'json':
        return <FileJson {...props} className="w-4 h-4 text-amber-400" />;
      case 'md':
      case 'txt':
        return <FileText {...props} className="w-4 h-4 text-emerald-400" />;
      default:
        return <File {...props} className="w-4 h-4 text-slate-400" />;
    }
  };

  if (!isOpen) return null;

  const currentSelection = results[selectedIndex];

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-slate-900/95 border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[80vh] mica-acrylic animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar Input Row */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3 bg-white/5">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type to search apps, files, mini apps, or actions..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-white/10 shrink-0">
            ESC
          </kbd>
        </div>

        {/* Filter Category Segmented Controls */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-slate-950/60 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            {(
              [
                { id: 'all', label: 'All Results' },
                { id: 'apps', label: 'Apps' },
                { id: 'miniapps', label: 'MiniApps' },
                { id: 'files', label: 'Files' },
                { id: 'actions', label: 'Actions' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id);
                  setSelectedIndex(0);
                  inputRef.current?.focus();
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  category === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 hidden sm:block">
            {results.length} {results.length === 1 ? 'match' : 'matches'}
          </div>
        </div>

        {/* Main Content Area: Split List & Live Detail Preview */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-[340px]">
          {/* Results List */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-2 divide-y divide-white/5 space-y-1"
          >
            {results.length > 0 ? (
              results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={
                      item.type === 'app'
                        ? `app-${item.data.id}`
                        : item.type === 'miniapp'
                        ? `miniapp-${item.data.id}`
                        : item.type === 'file'
                        ? `file-${item.data.file.id}`
                        : `action-${item.data.id}`
                    }
                    data-search-item
                    onClick={() => executeItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/15 text-white border border-cyan-500/30'
                        : 'text-slate-300 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Icon */}
                      <div className="shrink-0">
                        {item.type === 'app' && (
                          <div
                            className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${item.data.color} p-1.5 flex items-center justify-center shadow-sm`}
                          >
                            {getAppIcon(item.data.icon)}
                          </div>
                        )}
                        {item.type === 'miniapp' && (
                          <div
                            className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${item.data.color} p-1.5 flex items-center justify-center shadow-sm text-white`}
                          >
                            <Gamepad2 className="w-4 h-4" />
                          </div>
                        )}
                        {item.type === 'file' && (
                          <div className="w-8 h-8 rounded-lg bg-slate-800 p-1.5 flex items-center justify-center border border-white/10">
                            {getFileIcon(item.data.file.extension)}
                          </div>
                        )}
                        {item.type === 'action' && (
                          <div className="w-8 h-8 rounded-lg bg-purple-600/30 text-purple-300 p-1.5 flex items-center justify-center border border-purple-500/30">
                            <Zap className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Title & Metadata */}
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate flex items-center gap-2">
                          <span>
                            {item.type === 'app'
                              ? item.data.title
                              : item.type === 'miniapp'
                              ? item.data.title
                              : item.type === 'file'
                              ? item.data.file.name
                              : item.data.title}
                          </span>
                        </div>

                        {/* Unboxed clean metadata text */}
                        <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                          {item.type === 'app' && (
                            <>
                              <span className="text-cyan-400 font-medium">Application</span>
                              <span aria-hidden="true">·</span>
                              <span>{item.data.shortTitle}</span>
                            </>
                          )}
                          {item.type === 'miniapp' && (
                            <>
                              <span className="text-amber-400 font-medium">MiniApp</span>
                              <span aria-hidden="true">·</span>
                              <span>{item.data.genre}</span>
                              <span aria-hidden="true">·</span>
                              <span>v{item.data.version}</span>
                            </>
                          )}
                          {item.type === 'file' && (
                            <>
                              <span className="text-emerald-400 font-medium">File</span>
                              <span aria-hidden="true">·</span>
                              <span>{item.data.path}</span>
                              <span aria-hidden="true">·</span>
                              <span>{item.data.file.size}</span>
                            </>
                          )}
                          {item.type === 'action' && (
                            <>
                              <span className="text-purple-400 font-medium">System Action</span>
                              <span aria-hidden="true">·</span>
                              <span>{item.data.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Hint */}
                    <div className="shrink-0 flex items-center gap-2 text-[11px] text-slate-400">
                      {item.type === 'action' && item.data.shortcut && (
                        <kbd className="hidden sm:inline-block font-mono bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300 border border-white/10">
                          {item.data.shortcut}
                        </kbd>
                      )}
                      {isSelected ? (
                        <span className="text-cyan-400 font-medium flex items-center gap-1 text-[11px]">
                          <span>Enter</span>
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center">
                <Search className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-white">No results found</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  We couldn't find any apps, files, or actions matching &quot;{query}&quot;
                </p>
              </div>
            )}
          </div>

          {/* Right-Hand Detail Preview Panel */}
          {currentSelection && (
            <div className="hidden md:flex flex-col w-80 bg-slate-950/70 border-l border-white/10 p-4 justify-between shrink-0 overflow-y-auto">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
                  Preview & Details
                </span>

                {/* Big Icon + Title */}
                <div className="flex items-center gap-3 mb-3">
                  {currentSelection.type === 'app' && (
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${currentSelection.data.color} p-2.5 flex items-center justify-center shadow-md`}
                    >
                      {getAppIcon(currentSelection.data.icon)}
                    </div>
                  )}
                  {currentSelection.type === 'miniapp' && (
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${currentSelection.data.color} p-2.5 flex items-center justify-center shadow-md text-white`}
                    >
                      <Gamepad2 className="w-6 h-6" />
                    </div>
                  )}
                  {currentSelection.type === 'file' && (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 p-2.5 flex items-center justify-center border border-white/10">
                      {getFileIcon(currentSelection.data.file.extension)}
                    </div>
                  )}
                  {currentSelection.type === 'action' && (
                    <div className="w-12 h-12 rounded-xl bg-purple-600/30 text-purple-300 p-2.5 flex items-center justify-center border border-purple-500/30">
                      <Zap className="w-6 h-6" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white leading-tight truncate">
                      {currentSelection.type === 'app'
                        ? currentSelection.data.title
                        : currentSelection.type === 'miniapp'
                        ? currentSelection.data.title
                        : currentSelection.type === 'file'
                        ? currentSelection.data.file.name
                        : currentSelection.data.title}
                    </h4>
                    <span className="text-xs text-slate-400 capitalize">
                      {currentSelection.type}
                    </span>
                  </div>
                </div>

                {/* Type-Specific Details */}
                {currentSelection.type === 'app' && (
                  <div className="text-xs text-slate-300 space-y-2 mt-4">
                    <p className="text-slate-400 leading-relaxed">
                      Launch full window application in desktop environment.
                    </p>
                    <div className="bg-slate-900 border border-white/5 rounded-xl p-3 text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Default Width:</span>
                        <span className="text-slate-300">{currentSelection.data.defaultWidth}px</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Default Height:</span>
                        <span className="text-slate-300">{currentSelection.data.defaultHeight}px</span>
                      </div>
                    </div>
                  </div>
                )}

                {currentSelection.type === 'miniapp' && (
                  <div className="text-xs text-slate-300 space-y-3 mt-4">
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                      {currentSelection.data.description}
                    </p>
                    <div className="bg-slate-900 border border-white/5 rounded-xl p-3 text-[11px] space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Genre:</span>
                        <span className="text-cyan-400 font-medium">{currentSelection.data.genre}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Version:</span>
                        <span className="text-amber-400 font-mono">v{currentSelection.data.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Upgrades:</span>
                        <span className="text-slate-300">{currentSelection.data.upgradesApplied.length} applied</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pinned:</span>
                        <span className="text-slate-300">{currentSelection.data.isPinnedToDesktop ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {currentSelection.type === 'file' && (
                  <div className="text-xs text-slate-300 space-y-3 mt-4">
                    <div className="bg-slate-900 border border-white/5 rounded-xl p-2.5 text-[11px] space-y-1">
                      <div className="text-slate-400 truncate">
                        <span className="text-slate-500">Path:</span> {currentSelection.data.path}
                      </div>
                      <div className="text-slate-400">
                        <span className="text-slate-500">Size:</span> {currentSelection.data.file.size}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                        Content Preview:
                      </span>
                      <pre className="text-[11px] font-mono bg-black/60 p-2.5 rounded-xl border border-white/5 text-slate-300 overflow-x-auto max-h-36 line-clamp-6 whitespace-pre-wrap leading-tight">
                        {currentSelection.data.file.content.slice(0, 300)}
                      </pre>
                    </div>
                  </div>
                )}

                {currentSelection.type === 'action' && (
                  <div className="text-xs text-slate-400 space-y-2 mt-4 leading-relaxed">
                    <p>{currentSelection.data.description}</p>
                    {currentSelection.data.shortcut && (
                      <div className="mt-2 text-[11px] text-slate-300">
                        Shortcut: <kbd className="font-mono bg-slate-800 px-2 py-0.5 rounded border border-white/10">{currentSelection.data.shortcut}</kbd>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-white/10 mt-4">
                <button
                  onClick={() => executeItem(currentSelection)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>
                    {currentSelection.type === 'app'
                      ? 'Launch Application'
                      : currentSelection.type === 'miniapp'
                      ? 'Play Mini App'
                      : currentSelection.type === 'file'
                      ? 'Open in File Explorer'
                      : 'Execute Action'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dialog Footer with Keyboard Shortcuts */}
        <div className="px-4 py-2 bg-slate-950 border-t border-white/10 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-slate-800 px-1 rounded text-[10px] text-slate-300">↑↓</kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-slate-800 px-1 rounded text-[10px] text-slate-300">↵</kbd>
              <span>Open</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono bg-slate-800 px-1 rounded text-[10px] text-slate-300">Tab</kbd>
              <span>Filter</span>
            </span>
          </div>

          <div className="text-slate-500 text-[10px]">
            Press <kbd className="font-mono bg-slate-800 px-1 rounded text-[10px] text-slate-300">Ctrl+K</kbd> or <kbd className="font-mono bg-slate-800 px-1 rounded text-[10px] text-slate-300">Alt+Space</kbd> anywhere
          </div>
        </div>
      </div>
    </div>
  );
};
