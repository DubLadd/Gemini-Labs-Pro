/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AppId, WindowState, WallpaperPreset, ToastMessage, SnapZone } from './types/os';
import { APPS, WALLPAPERS } from './data/apps';
import { soundEngine } from './utils/audio';

import { Taskbar } from './components/Taskbar';
import { StartMenu } from './components/StartMenu';
import { QuickSettings } from './components/QuickSettings';
import { ContextMenu } from './components/ContextMenu';
import { PowerModal } from './components/PowerModal';
import { Toast } from './components/Toast';
import { WindowFrame } from './components/WindowFrame';
import { GlobalSearch } from './components/GlobalSearch';
import { SnapPreviewOverlay } from './components/SnapPreviewOverlay';
import { FlattenedFile } from './utils/fileSystem';

// Apps
import { JulesApp } from './components/apps/JulesApp';
import { PuttyApp } from './components/apps/PuttyApp';
import { PromptLabApp } from './components/apps/PromptLabApp';
import { NotebookApp } from './components/apps/NotebookApp';
import { MusicFXApp } from './components/apps/MusicFXApp';
import { DoodleApp } from './components/apps/DoodleApp';
import { TerminalApp } from './components/apps/TerminalApp';
import { SettingsApp } from './components/apps/SettingsApp';
import { FilesApp } from './components/apps/FilesApp';
import { ScienceLabApp } from './components/apps/ScienceLabApp';
import { BrainstormerApp } from './components/apps/BrainstormerApp';
import { ArcadeApp } from './components/apps/ArcadeApp';
import { AsciiApp } from './components/apps/AsciiApp';
import { MiniAppsApp } from './components/apps/MiniAppsApp';
import { PerformanceWidget } from './components/PerformanceWidget';
import {
  MiniAppDefinition,
  getInstalledMiniApps,
  setActiveMiniAppId,
} from './utils/miniAppStore';

import {
  GitPullRequest,
  Users,
  Sparkles,
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
  Shield,
  HelpCircle,
} from 'lucide-react';

export default function App() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<AppId | null>(null);
  const [topZIndex, setTopZIndex] = useState<number>(100);

  // Shell Customization State
  const [currentWallpaper, setCurrentWallpaper] = useState<WallpaperPreset>(WALLPAPERS[0]);
  const [wallpaperOpacity, setWallpaperOpacity] = useState<number>(0.9);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.8);
  const [wifiActive, setWifiActive] = useState<boolean>(true);
  const [bluetoothActive, setBluetoothActive] = useState<boolean>(true);
  const [showPerfWidget, setShowPerfWidget] = useState<boolean>(true);

  // Menus & Modals State
  const [startMenuOpen, setStartMenuOpen] = useState<boolean>(false);
  const [quickSettingsOpen, setQuickSettingsOpen] = useState<boolean>(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState<boolean>(false);
  const [dragSnapZone, setDragSnapZone] = useState<SnapZone | null>(null);

  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number }>({
    isOpen: false,
    x: 0,
    y: 0,
  });
  const [powerModal, setPowerModal] = useState<{
    isOpen: boolean;
    action: 'restart' | 'shutdown' | null;
  }>({
    isOpen: false,
    action: null,
  });
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [installedMiniApps, setInstalledMiniApps] = useState<MiniAppDefinition[]>(() => getInstalledMiniApps());

  useEffect(() => {
    const syncApps = () => setInstalledMiniApps(getInstalledMiniApps());
    window.addEventListener('labs_miniapps_updated', syncApps);
    return () => window.removeEventListener('labs_miniapps_updated', syncApps);
  }, []);

  // Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  const showToast = useCallback((title: string, message: string, type: 'info' | 'success' | 'warn' = 'info') => {
    setToast({ id: Date.now().toString(), title, message, type });
  }, []);

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fullscreen State & Listener
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }, []);

  // Sync soundEngine settings
  useEffect(() => {
    soundEngine.setEnabled(soundEnabled);
    soundEngine.setVolume(volume);
  }, [soundEnabled, volume]);

  const bringToFront = useCallback((appId: AppId) => {
    setTopZIndex((prev) => {
      const nextZ = prev + 1;
      setWindows((wins) =>
        wins.map((w) => (w.id === appId ? { ...w, zIndex: nextZ, isMinimized: false } : w))
      );
      return nextZ;
    });
    setActiveWindowId(appId);
  }, []);

  const launchApp = useCallback((appId: AppId) => {
    soundEngine.playSfx('open');
    const appConfig = APPS[appId];
    if (!appConfig) return;

    setWindows((prev) => {
      const existing = prev.find((w) => w.id === appId);
      if (existing) {
        // If already exists, unminimize & focus
        return prev.map((w) => (w.id === appId ? { ...w, isMinimized: false } : w));
      }

      const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

      const maxW = Math.min(appConfig.defaultWidth, screenW - 40);
      const maxH = Math.min(appConfig.defaultHeight, screenH - 80);

      const offset = (prev.length * 30) % 150;
      const posX = Math.max(20, Math.floor((screenW - maxW) / 2) + offset);
      const posY = Math.max(20, Math.floor((screenH - maxH - 48) / 2) + offset);

      const newWin: WindowState = {
        id: appId,
        title: appConfig.title,
        icon: appConfig.icon,
        isMinimized: false,
        isMaximized: false,
        zIndex: 100 + prev.length + 1,
        position: { x: posX, y: posY },
        size: { width: maxW, height: maxH },
        snappedZone: null,
      };

      return [...prev, newWin];
    });

    setTopZIndex((z) => z + 1);
    setActiveWindowId(appId);
  }, []);

  const closeWindow = useCallback((appId: AppId) => {
    soundEngine.playSfx('click');
    setWindows((prev) => prev.filter((w) => w.id !== appId));
    setActiveWindowId((current) => (current === appId ? null : current));
  }, []);

  const minimizeWindow = useCallback((appId: AppId) => {
    soundEngine.playSfx('minimize');
    setWindows((prev) =>
      prev.map((w) => (w.id === appId ? { ...w, isMinimized: true } : w))
    );
    setActiveWindowId((current) => (current === appId ? null : current));
  }, []);

  const toggleMaximizeWindow = useCallback((appId: AppId) => {
    soundEngine.playSfx('click');
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== appId) return w;
        if (!w.isMaximized) {
          return {
            ...w,
            isMaximized: true,
            snappedZone: null,
            prevPosition: { ...w.position },
            prevSize: { ...w.size },
          };
        } else {
          return {
            ...w,
            isMaximized: false,
            snappedZone: null,
            position: w.prevPosition || { x: 40, y: 40 },
            size: w.prevSize || { width: 700, height: 480 },
          };
        }
      })
    );
    bringToFront(appId);
  }, [bringToFront]);

  const snapWindow = useCallback((appId: AppId, zone: SnapZone) => {
    soundEngine.playSfx('click');
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const screenH = typeof window !== 'undefined' ? window.innerHeight - 48 : 752; // subtract 48px taskbar

    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== appId) return w;

        const prevPos = w.prevPosition || { ...w.position };
        const prevSz = w.prevSize || { ...w.size };

        const halfW = Math.floor(screenW / 2);
        const halfH = Math.floor(screenH / 2);

        let newPos = { x: 0, y: 0 };
        let newSize = { width: halfW, height: screenH };
        let isMax = false;

        switch (zone) {
          case 'left':
            newPos = { x: 0, y: 0 };
            newSize = { width: halfW, height: screenH };
            break;
          case 'right':
            newPos = { x: halfW, y: 0 };
            newSize = { width: screenW - halfW, height: screenH };
            break;
          case 'top':
            newPos = { x: 0, y: 0 };
            newSize = { width: screenW, height: screenH };
            isMax = true;
            break;
          case 'top-left':
            newPos = { x: 0, y: 0 };
            newSize = { width: halfW, height: halfH };
            break;
          case 'top-right':
            newPos = { x: halfW, y: 0 };
            newSize = { width: screenW - halfW, height: halfH };
            break;
          case 'bottom-left':
            newPos = { x: 0, y: halfH };
            newSize = { width: halfW, height: screenH - halfH };
            break;
          case 'bottom-right':
            newPos = { x: halfW, y: halfH };
            newSize = { width: screenW - halfW, height: screenH - halfH };
            break;
        }

        return {
          ...w,
          position: newPos,
          size: newSize,
          prevPosition: prevPos,
          prevSize: prevSz,
          isMaximized: isMax,
          snappedZone: zone,
        };
      })
    );
    bringToFront(appId);
  }, [bringToFront]);

  const unsnapWindow = useCallback((appId: AppId) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id !== appId) return w;
        return {
          ...w,
          snappedZone: null,
          isMaximized: false,
        };
      })
    );
  }, []);

  const updateWindowPosition = useCallback((appId: AppId, x: number, y: number) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === appId ? { ...w, position: { x, y } } : w))
    );
  }, []);

  const updateWindowSize = useCallback((appId: AppId, width: number, height: number) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === appId ? { ...w, size: { width, height } } : w))
    );
  }, []);

  // Global Keyboard Shortcuts (Global Search & Snapping)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
        return;
      }

      // Global Search: Ctrl+K, Cmd+K, Alt+Space, or Ctrl+Space
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) ||
        (e.altKey && e.code === 'Space') ||
        (e.ctrlKey && e.code === 'Space')
      ) {
        e.preventDefault();
        setGlobalSearchOpen((prev) => !prev);
        setStartMenuOpen(false);
        setQuickSettingsOpen(false);
        setContextMenu({ isOpen: false, x: 0, y: 0 });
        return;
      }

      // Slash shortcut for search when outside inputs
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName) &&
        !(e.target as HTMLElement)?.isContentEditable
      ) {
        e.preventDefault();
        setGlobalSearchOpen(true);
        setStartMenuOpen(false);
        setQuickSettingsOpen(false);
        return;
      }

      // Snapping Shortcuts: Alt + Arrow keys
      if (e.altKey && activeWindowId) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          snapWindow(activeWindowId, 'left');
          showToast('Window Snapped', 'Snapped to left half.', 'info');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          snapWindow(activeWindowId, 'right');
          showToast('Window Snapped', 'Snapped to right half.', 'info');
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          snapWindow(activeWindowId, 'top');
          showToast('Window Maximized', 'Window maximized to full screen.', 'info');
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const targetWin = windows.find((w) => w.id === activeWindowId);
          if (targetWin?.snappedZone || targetWin?.isMaximized) {
            toggleMaximizeWindow(activeWindowId);
          } else {
            minimizeWindow(activeWindowId);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    toggleFullscreen,
    activeWindowId,
    snapWindow,
    windows,
    toggleMaximizeWindow,
    minimizeWindow,
    showToast,
  ]);

  const showDesktopOrRestore = () => {
    soundEngine.playSfx('minimize');
    const anyVisible = windows.some((w) => !w.isMinimized);
    setWindows((prev) =>
      prev.map((w) => ({
        ...w,
        isMinimized: anyVisible,
      }))
    );
    if (anyVisible) {
      setActiveWindowId(null);
    } else if (windows.length > 0) {
      bringToFront(windows[windows.length - 1].id);
    }
  };

  const handleLaunchOrFocusApp = (appId: AppId) => {
    const existing = windows.find((w) => w.id === appId);
    if (existing) {
      if (existing.isMinimized) {
        setWindows((prev) =>
          prev.map((w) => (w.id === appId ? { ...w, isMinimized: false } : w))
        );
        bringToFront(appId);
      } else if (activeWindowId === appId) {
        minimizeWindow(appId);
      } else {
        bringToFront(appId);
      }
    } else {
      launchApp(appId);
    }
  };

  const handleDesktopContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    soundEngine.playSfx('click');
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
    });
    setStartMenuOpen(false);
    setQuickSettingsOpen(false);
    setGlobalSearchOpen(false);
  };

  const closeAllFlyouts = () => {
    setStartMenuOpen(false);
    setQuickSettingsOpen(false);
    setContextMenu({ isOpen: false, x: 0, y: 0 });
  };

  const cycleWallpaper = () => {
    const currentIdx = WALLPAPERS.findIndex((w) => w.id === currentWallpaper.id);
    const nextIdx = (currentIdx + 1) % WALLPAPERS.length;
    const nextWp = WALLPAPERS[nextIdx];
    setCurrentWallpaper(nextWp);
    showToast('Desktop Theme', `Wallpaper updated to: ${nextWp.name}`);
  };

  const handlePowerConfirm = () => {
    setPowerModal({ isOpen: false, action: null });
    setWindows([]);
    setActiveWindowId(null);
    showToast('System Reset', 'All windows closed and session state cleared.', 'success');
  };

  const getDesktopIcon = (iconName: string) => {
    const props = { className: 'w-6 h-6 text-white drop-shadow' };
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
      case 'Shield':
        return <Shield {...props} />;
      default:
        return <HelpCircle {...props} />;
    }
  };

  return (
    <div
      onContextMenu={handleDesktopContextMenu}
      onClick={closeAllFlyouts}
      className="h-screen w-screen overflow-hidden select-none font-sans bg-gray-950 text-slate-100 flex flex-col relative"
    >
      {/* Dynamic Wallpaper Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700 pointer-events-none"
        style={{
          backgroundImage: currentWallpaper.style,
          opacity: wallpaperOpacity,
        }}
      >
        {/* Subtle animated light sheen */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/15 via-transparent to-indigo-900/20 mix-blend-screen pointer-events-none" />
      </div>

      {/* Main Desktop Workspace */}
      <main className="relative flex-1 w-full h-[calc(100vh-48px)] p-4 overflow-hidden">
        {/* Desktop Icons Grid */}
        <div className="grid grid-flow-col grid-rows-6 gap-2 w-max h-full content-start select-none">
          {Object.values(APPS).map((app) => (
            <div
              key={app.id}
              onClick={(e) => {
                e.stopPropagation();
                launchApp(app.id);
              }}
              title={`Open ${app.title}`}
              className="w-24 h-24 flex flex-col items-center justify-center rounded-2xl hover:bg-white/10 active:bg-white/20 text-slate-100 cursor-pointer p-2 transition-all group text-center"
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${app.color} p-2.5 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform mb-1.5`}
              >
                {getDesktopIcon(app.icon)}
              </div>
              <span className="text-[11px] font-medium leading-tight line-clamp-2 px-1 text-slate-200 group-hover:text-white drop-shadow">
                {app.shortTitle}
              </span>
            </div>
          ))}

          {/* Pinned Mini Apps on Desktop */}
          {installedMiniApps
            .filter((mini) => mini.isPinnedToDesktop)
            .map((mini) => (
              <div
                key={`miniapp-pin-${mini.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  soundEngine.playSfx('open');
                  setActiveMiniAppId(mini.id);
                  launchApp('miniapps');
                }}
                title={`Launch Mini App: ${mini.title} (v${mini.version})`}
                className="w-24 h-24 flex flex-col items-center justify-center rounded-2xl hover:bg-white/10 active:bg-white/20 text-slate-100 cursor-pointer p-2 transition-all group text-center relative"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${mini.color} p-2.5 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform mb-1.5 relative border border-white/20`}
                >
                  <Gamepad2 className="w-6 h-6 text-white drop-shadow" />
                  <span className="absolute -top-1 -right-1 px-1 py-0.2 text-[8px] font-bold bg-amber-400 text-slate-950 rounded-full shadow">
                    MINI
                  </span>
                </div>
                <span className="text-[11px] font-medium leading-tight line-clamp-2 px-1 text-slate-200 group-hover:text-white drop-shadow">
                  {mini.shortTitle || mini.title}
                </span>
              </div>
            ))}
        </div>

        {/* Windows Layer */}
        <div className="absolute inset-0 pointer-events-none">
          {windows.map((win) => {
            return (
              <WindowFrame
                key={win.id}
                window={win}
                isActive={activeWindowId === win.id}
                onFocus={() => bringToFront(win.id)}
                onClose={() => closeWindow(win.id)}
                onMinimize={() => minimizeWindow(win.id)}
                onToggleMaximize={() => toggleMaximizeWindow(win.id)}
                onUpdatePosition={(x, y) => updateWindowPosition(win.id, x, y)}
                onUpdateSize={(w, h) => updateWindowSize(win.id, w, h)}
                onSnap={(zone) => snapWindow(win.id, zone)}
                onUnsnap={() => unsnapWindow(win.id)}
                onDragSnapChange={(zone) => setDragSnapZone(zone)}
              >
                {win.id === 'jules' && <JulesApp onShowToast={showToast} />}
                {win.id === 'putty' && <PuttyApp onShowToast={showToast} />}
                {win.id === 'promptlab' && <PromptLabApp onShowToast={showToast} />}
                {win.id === 'notebook' && <NotebookApp onShowToast={showToast} />}
                {win.id === 'musicfx' && <MusicFXApp onShowToast={showToast} />}
                {win.id === 'doodle' && <DoodleApp onShowToast={showToast} />}
                {win.id === 'terminal' && (
                  <TerminalApp
                    onLaunchApp={launchApp}
                    onCycleTheme={cycleWallpaper}
                    activeWindowsCount={windows.length}
                  />
                )}
                {win.id === 'settings' && (
                  <SettingsApp
                    currentWallpaper={currentWallpaper}
                    onSelectWallpaper={(wp) => {
                      setCurrentWallpaper(wp);
                      showToast('Wallpaper Applied', wp.name);
                    }}
                    soundEnabled={soundEnabled}
                    onToggleSound={setSoundEnabled}
                    volume={volume}
                    onVolumeChange={setVolume}
                    wallpaperOpacity={wallpaperOpacity}
                    onOpacityChange={setWallpaperOpacity}
                  />
                )}
                {win.id === 'files' && <FilesApp onShowToast={showToast} />}
                {win.id === 'science' && <ScienceLabApp onShowToast={showToast} />}
                {win.id === 'brainstormer' && <BrainstormerApp onShowToast={showToast} />}
                {win.id === 'arcade' && <ArcadeApp onShowToast={showToast} />}
                {win.id === 'ascii' && <AsciiApp onShowToast={showToast} />}
                {win.id === 'miniapps' && (
                  <MiniAppsApp
                    onShowToast={showToast}
                    onOpenStudio={(gameCode, gameTitle) => {
                      launchApp('arcade');
                      showToast('Studio Loaded', `Switched to Playground Studio for "${gameTitle}".`, 'info');
                    }}
                  />
                )}
              </WindowFrame>
            );
          })}
        </div>

        {/* Dynamic Snap Preview Ghost Overlay when Dragging near Edges/Corners */}
        <SnapPreviewOverlay zone={dragSnapZone} />

        {/* Floating Performance Monitor Widget */}
        <PerformanceWidget
          isOpen={showPerfWidget}
          onClose={() => setShowPerfWidget(false)}
        />
      </main>

      {/* Taskbar */}
      <Taskbar
        activeWindows={windows}
        activeWindowId={activeWindowId}
        startMenuOpen={startMenuOpen}
        onToggleStartMenu={() => {
          setStartMenuOpen((prev) => !prev);
          setQuickSettingsOpen(false);
          setGlobalSearchOpen(false);
          setContextMenu({ isOpen: false, x: 0, y: 0 });
        }}
        quickSettingsOpen={quickSettingsOpen}
        onToggleQuickSettings={() => {
          setQuickSettingsOpen((prev) => !prev);
          setStartMenuOpen(false);
          setGlobalSearchOpen(false);
          setContextMenu({ isOpen: false, x: 0, y: 0 });
        }}
        onLaunchOrFocusApp={handleLaunchOrFocusApp}
        currentTime={currentTime}
        currentDate={currentDate}
        onShowDesktop={showDesktopOrRestore}
        onToggleWidget={() =>
          showToast('Google Labs Connected', 'Synchronized with your AI experiments cluster.')
        }
        onOpenSearch={() => {
          setGlobalSearchOpen(true);
          setStartMenuOpen(false);
          setQuickSettingsOpen(false);
          setContextMenu({ isOpen: false, x: 0, y: 0 });
        }}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Global Spotlight Search Flyout */}
      <GlobalSearch
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        onLaunchApp={handleLaunchOrFocusApp}
        onLaunchMiniApp={(id) => {
          setActiveMiniAppId(id);
          launchApp('miniapps');
          showToast('Mini App Launched', `Launched mini app "${id}"`, 'success');
        }}
        onOpenFileInFiles={(file: FlattenedFile) => {
          launchApp('files');
          showToast('File Opened', `Opened "${file.file.name}" in Files explorer.`, 'info');
        }}
        onToggleFullscreen={toggleFullscreen}
        onCycleWallpaper={cycleWallpaper}
        onToggleAudio={() => setSoundEnabled((prev) => !prev)}
        isAudioMuted={!soundEnabled}
        onShowPowerDialog={(action) => {
          setGlobalSearchOpen(false);
          setPowerModal({ isOpen: true, action });
        }}
        onShowToast={showToast}
      />

      {/* Start Menu Flyout */}
      <StartMenu
        isOpen={startMenuOpen}
        onClose={() => setStartMenuOpen(false)}
        onLaunchApp={launchApp}
        onShowPowerDialog={(action) => {
          setStartMenuOpen(false);
          setPowerModal({ isOpen: true, action });
        }}
      />

      {/* Quick Settings Flyout */}
      <QuickSettings
        isOpen={quickSettingsOpen}
        onClose={() => setQuickSettingsOpen(false)}
        wifiActive={wifiActive}
        onToggleWifi={() => {
          setWifiActive((prev) => !prev);
          showToast('Wi-Fi Status', wifiActive ? 'Disconnected from LabsNet' : 'Connected to LabsNet');
        }}
        bluetoothActive={bluetoothActive}
        onToggleBluetooth={() => {
          setBluetoothActive((prev) => !prev);
          showToast('Bluetooth Status', bluetoothActive ? 'Bluetooth turned off' : 'Bluetooth scanning enabled');
        }}
        onCycleWallpaper={cycleWallpaper}
        wallpaperOpacity={wallpaperOpacity}
        onOpacityChange={setWallpaperOpacity}
        volume={volume}
        onVolumeChange={setVolume}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        showPerfWidget={showPerfWidget}
        onTogglePerfWidget={() => setShowPerfWidget((prev) => !prev)}
      />

      {/* Desktop Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu({ isOpen: false, x: 0, y: 0 })}
        onOpenTerminal={() => launchApp('terminal')}
        onOpenSettings={() => launchApp('settings')}
        onCycleTheme={cycleWallpaper}
        onRefresh={() => showToast('Desktop Shell', 'Workspace refreshed and cached buffers cleared.')}
        onOpenNotebook={() => launchApp('notebook')}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Power Dialog Modal */}
      <PowerModal
        isOpen={powerModal.isOpen}
        action={powerModal.action}
        onClose={() => setPowerModal({ isOpen: false, action: null })}
        onConfirm={handlePowerConfirm}
      />

      {/* System Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Offline Connectivity Indicator */}
      <OfflineIndicator />
    </div>
  );
}

/**
 * Offline status monitoring hook
 */
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Offline UI Indicator Component
 */
const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-14 left-4 z-[100] flex items-center gap-2.5 rounded-xl bg-amber-500/90 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-slate-950 shadow-2xl border border-amber-400/50 animate-in slide-in-from-left-4 duration-300">
      <div className="h-2 w-2 rounded-full bg-slate-950 animate-pulse" />
      <span>DISCONNECTED — MINIAPPS RUNNING FROM CACHE</span>
    </div>
  );
};
