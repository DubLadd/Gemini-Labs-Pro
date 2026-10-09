/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AppId, WindowState, WallpaperPreset, ToastMessage } from './types/os';
import { APPS, WALLPAPERS } from './data/apps';
import { soundEngine } from './utils/audio';

import { Taskbar } from './components/Taskbar';
import { StartMenu } from './components/StartMenu';
import { QuickSettings } from './components/QuickSettings';
import { ContextMenu } from './components/ContextMenu';
import { PowerModal } from './components/PowerModal';
import { Toast } from './components/Toast';
import { WindowFrame } from './components/WindowFrame';

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
import { PerformanceWidget } from './components/PerformanceWidget';

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

  // Keyboard shortcut listener for F11 or Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

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
            prevPosition: { ...w.position },
            prevSize: { ...w.size },
          };
        } else {
          return {
            ...w,
            isMaximized: false,
            position: w.prevPosition || { x: 40, y: 40 },
            size: w.prevSize || { width: 700, height: 480 },
          };
        }
      })
    );
    bringToFront(appId);
  }, [bringToFront]);

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
              </WindowFrame>
            );
          })}
        </div>

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
          setContextMenu({ isOpen: false, x: 0, y: 0 });
        }}
        quickSettingsOpen={quickSettingsOpen}
        onToggleQuickSettings={() => {
          setQuickSettingsOpen((prev) => !prev);
          setStartMenuOpen(false);
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
          setStartMenuOpen(true);
          setQuickSettingsOpen(false);
        }}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
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
    </div>
  );
}
