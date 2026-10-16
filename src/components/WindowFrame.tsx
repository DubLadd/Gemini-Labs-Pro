import React, { useRef, useState, useEffect } from 'react';
import { WindowState, SnapZone } from '../types/os';
import { soundEngine } from '../utils/audio';
import {
  Minus,
  Square,
  X,
  GitPullRequest,
  Users,
  Sparkles,
  BookOpen,
  Disc,
  PenTool,
  Terminal,
  Settings,
  HelpCircle,
  LayoutGrid,
  Columns2,
  Grid2X2,
  Maximize2,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

interface WindowFrameProps {
  window: WindowState;
  isActive: boolean;
  onFocus: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onUpdatePosition: (x: number, y: number) => void;
  onUpdateSize: (w: number, h: number) => void;
  onSnap?: (zone: SnapZone) => void;
  onUnsnap?: () => void;
  onDragSnapChange?: (zone: SnapZone | null) => void;
  children: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  window: win,
  isActive,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onUpdatePosition,
  onUpdateSize,
  onSnap,
  onUnsnap,
  onDragSnapChange,
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showSnapMenu, setShowSnapMenu] = useState(false);
  const snapMenuTimeoutRef = useRef<number | null>(null);

  const frameRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const candidateZoneRef = useRef<SnapZone | null>(null);

  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    initialX: number;
    initialY: number;
    wasSnapped: boolean;
    wasMaximized: boolean;
  }>({
    mouseX: 0,
    mouseY: 0,
    initialX: 0,
    initialY: 0,
    wasSnapped: false,
    wasMaximized: false,
  });

  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; initialW: number; initialH: number }>({
    mouseX: 0,
    mouseY: 0,
    initialW: 0,
    initialH: 0,
  });

  // Clean up RAF and timer on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (snapMenuTimeoutRef.current) clearTimeout(snapMenuTimeoutRef.current);
    };
  }, []);

  const getIcon = (iconName: string) => {
    const props = { className: 'w-4 h-4 text-cyan-400' };
    switch (iconName) {
      case 'GitPullRequest':
        return <GitPullRequest {...props} className="w-4 h-4 text-purple-400" />;
      case 'Users':
        return <Users {...props} className="w-4 h-4 text-amber-400" />;
      case 'Sparkles':
        return <Sparkles {...props} className="w-4 h-4 text-rose-400" />;
      case 'BookOpen':
        return <BookOpen {...props} className="w-4 h-4 text-blue-400" />;
      case 'Disc':
        return <Disc {...props} className="w-4 h-4 text-pink-400" />;
      case 'PenTool':
        return <PenTool {...props} className="w-4 h-4 text-emerald-400" />;
      case 'Terminal':
        return <Terminal {...props} className="w-4 h-4 text-emerald-300" />;
      case 'Settings':
        return <Settings {...props} className="w-4 h-4 text-cyan-400" />;
      default:
        return <HelpCircle {...props} />;
    }
  };

  const handleTitleMouseDown = (e: React.MouseEvent) => {
    // Only drag with primary mouse button
    if (e.button !== 0) return;

    onFocus();
    setIsDragging(true);
    setShowSnapMenu(false);

    const wasSnapped = Boolean(win.snappedZone);
    const wasMaximized = Boolean(win.isMaximized);

    // If already snapped or maximized, dragging will restore standard dimensions
    let initialX = win.position.x;
    let initialY = win.position.y;

    if (wasSnapped || wasMaximized) {
      const restoredW = win.prevSize?.width || 720;
      const restoredH = win.prevSize?.height || 480;
      // Center restored window under cursor horizontally
      initialX = Math.max(10, Math.min(e.clientX - Math.floor(restoredW / 2), window.innerWidth - restoredW - 10));
      initialY = Math.max(10, Math.min(e.clientY - 20, window.innerHeight - restoredH - 60));
      onUpdateSize(restoredW, restoredH);
      onUpdatePosition(initialX, initialY);
      onUnsnap?.();
    }

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX,
      initialY,
      wasSnapped,
      wasMaximized,
    };
    candidateZoneRef.current = null;

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'move';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const dx = moveEvent.clientX - dragStartRef.current.mouseX;
        const dy = moveEvent.clientY - dragStartRef.current.mouseY;

        const newX = Math.max(-100, dragStartRef.current.initialX + dx);
        const newY = Math.max(0, dragStartRef.current.initialY + dy);
        onUpdatePosition(newX, newY);

        // Detect screen bounds for automatic window snapping
        const screenW = window.innerWidth;
        const screenH = window.innerHeight - 48; // 48px taskbar
        const CORNER_THRESHOLD = 55;
        const EDGE_THRESHOLD = 26;

        let detectedZone: SnapZone | null = null;

        const curX = moveEvent.clientX;
        const curY = moveEvent.clientY;

        // Check Corners first
        if (curX <= CORNER_THRESHOLD && curY <= CORNER_THRESHOLD) {
          detectedZone = 'top-left';
        } else if (curX >= screenW - CORNER_THRESHOLD && curY <= CORNER_THRESHOLD) {
          detectedZone = 'top-right';
        } else if (curX <= CORNER_THRESHOLD && curY >= screenH - CORNER_THRESHOLD) {
          detectedZone = 'bottom-left';
        } else if (curX >= screenW - CORNER_THRESHOLD && curY >= screenH - CORNER_THRESHOLD) {
          detectedZone = 'bottom-right';
        } else if (curY <= 14) {
          // Top edge (Maximize)
          detectedZone = 'top';
        } else if (curX <= EDGE_THRESHOLD) {
          // Left edge
          detectedZone = 'left';
        } else if (curX >= screenW - EDGE_THRESHOLD) {
          // Right edge
          detectedZone = 'right';
        }

        candidateZoneRef.current = detectedZone;
        onDragSnapChange?.(detectedZone);
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      const zoneToSnap = candidateZoneRef.current;
      candidateZoneRef.current = null;
      onDragSnapChange?.(null);

      if (zoneToSnap && onSnap) {
        onSnap(zoneToSnap);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (win.isMaximized) return;
    if (e.button !== 0) return;

    onFocus();
    setIsResizing(true);
    setShowSnapMenu(false);

    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialW: win.size.width,
      initialH: win.size.height,
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'se-resize';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const dx = moveEvent.clientX - resizeStartRef.current.mouseX;
        const dy = moveEvent.clientY - resizeStartRef.current.mouseY;

        const newW = Math.max(360, resizeStartRef.current.initialW + dx);
        const newH = Math.max(240, resizeStartRef.current.initialH + dy);
        onUpdateSize(newW, newH);
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (win.isMinimized) return null;

  const style: React.CSSProperties = win.isMaximized
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: win.zIndex,
        borderRadius: 0,
      }
    : {
        position: 'absolute',
        left: `${win.position.x}px`,
        top: `${win.position.y}px`,
        width: `${win.size.width}px`,
        height: `${win.size.height}px`,
        zIndex: win.zIndex,
      };

  return (
    <div
      ref={frameRef}
      onMouseDown={onFocus}
      style={style}
      className={`pointer-events-auto mica-acrylic bg-slate-900/90 rounded-2xl border border-white/15 window-shadow flex flex-col overflow-hidden select-none relative ${
        isDragging || isResizing
          ? 'transition-none shadow-2xl opacity-95'
          : 'transition-[box-shadow,opacity] duration-150'
      } ${isActive ? 'ring-1 ring-cyan-500/40' : 'opacity-90'}`}
    >
      {/* Title Bar */}
      <div
        onMouseDown={handleTitleMouseDown}
        onDoubleClick={(e) => {
          e.stopPropagation();
          soundEngine.playSfx('click');
          onToggleMaximize();
        }}
        className={`h-10 bg-white/5 border-b border-white/10 px-3 flex items-center justify-between select-none shrink-0 ${
          win.isMaximized ? 'cursor-default' : isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div className="flex items-center space-x-2 text-xs font-medium text-slate-200 pointer-events-none">
          {getIcon(win.icon)}
          <span className="font-sans truncate max-w-[280px] sm:max-w-[400px]">{win.title}</span>
          {win.snappedZone && (
            <span className="hidden sm:inline-block text-[10px] text-cyan-400 font-mono">
              [{win.snappedZone.toUpperCase()}]
            </span>
          )}
        </div>

        {/* Window Controls & Snap Menu Trigger */}
        <div
          className="flex items-center space-x-1 z-10 relative"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick Snap Layouts Menu Button */}
          <div
            className="relative"
            onMouseEnter={() => {
              if (snapMenuTimeoutRef.current) clearTimeout(snapMenuTimeoutRef.current);
              setShowSnapMenu(true);
            }}
            onMouseLeave={() => {
              snapMenuTimeoutRef.current = window.setTimeout(() => {
                setShowSnapMenu(false);
              }, 300);
            }}
          >
            <button
              type="button"
              onClick={() => setShowSnapMenu((prev) => !prev)}
              className="w-7 h-7 rounded-md hover:bg-white/15 active:bg-white/25 flex items-center justify-center text-slate-400 hover:text-cyan-300 transition-colors"
              title="Window Snap Layouts (Alt+Arrows)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>

            {/* Snap Layouts Popover Panel */}
            {showSnapMenu && (
              <div
                className="absolute top-full right-0 mt-1 w-64 bg-slate-900/95 border border-white/20 rounded-xl shadow-2xl p-2.5 z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                  Snap Layouts
                </div>

                <div className="space-y-2">
                  {/* 2-Column Split (Left / Right) */}
                  <div className="p-1 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block px-1 mb-1">Split Half (50 / 50)</span>
                    <div className="grid grid-cols-2 gap-1.5 h-12">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSnapMenu(false);
                          onSnap?.('left');
                        }}
                        className="rounded-md bg-white/10 hover:bg-cyan-500/30 border border-white/10 hover:border-cyan-400 flex flex-col items-center justify-center gap-1 text-[10px] text-slate-300 hover:text-cyan-200 transition-all group"
                        title="Snap Left (Alt+Left)"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span>Left</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSnapMenu(false);
                          onSnap?.('right');
                        }}
                        className="rounded-md bg-white/10 hover:bg-cyan-500/30 border border-white/10 hover:border-cyan-400 flex flex-col items-center justify-center gap-1 text-[10px] text-slate-300 hover:text-cyan-200 transition-all group"
                        title="Snap Right (Alt+Right)"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                        <span>Right</span>
                      </button>
                    </div>
                  </div>

                  {/* 4-Quadrant Corners */}
                  <div className="p-1 rounded-lg bg-white/5 border border-white/10">
                    <span className="text-[10px] text-slate-400 block px-1 mb-1">Corner Quadrants (25%)</span>
                    <div className="grid grid-cols-2 gap-1.5 h-20">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSnapMenu(false);
                          onSnap?.('top-left');
                        }}
                        className="rounded-md bg-white/10 hover:bg-cyan-500/30 border border-white/10 hover:border-cyan-400 flex items-center justify-center gap-1 text-[10px] text-slate-300 hover:text-cyan-200 transition-all"
                        title="Top-Left"
                      >
                        <ArrowUpLeft className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Top-Left</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSnapMenu(false);
                          onSnap?.('top-right');
                        }}
                        className="rounded-md bg-white/10 hover:bg-cyan-500/30 border border-white/10 hover:border-cyan-400 flex items-center justify-center gap-1 text-[10px] text-slate-300 hover:text-cyan-200 transition-all"
                        title="Top-Right"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Top-Right</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSnapMenu(false);
                          onSnap?.('bottom-left');
                        }}
                        className="rounded-md bg-white/10 hover:bg-cyan-500/30 border border-white/10 hover:border-cyan-400 flex items-center justify-center gap-1 text-[10px] text-slate-300 hover:text-cyan-200 transition-all"
                        title="Bottom-Left"
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Btm-Left</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSnapMenu(false);
                          onSnap?.('bottom-right');
                        }}
                        className="rounded-md bg-white/10 hover:bg-cyan-500/30 border border-white/10 hover:border-cyan-400 flex items-center justify-center gap-1 text-[10px] text-slate-300 hover:text-cyan-200 transition-all"
                        title="Bottom-Right"
                      >
                        <ArrowDownRight className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Btm-Right</span>
                      </button>
                    </div>
                  </div>

                  {/* Maximize / Restore */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSnapMenu(false);
                      onSnap?.('top');
                    }}
                    className="w-full py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-all"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Maximize Window (Alt+Up)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Minimize Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            className="w-7 h-7 rounded-md hover:bg-white/15 active:bg-white/25 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Maximize / Restore Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              soundEngine.playSfx('click');
              onToggleMaximize();
            }}
            className="w-7 h-7 rounded-md hover:bg-white/15 active:bg-white/25 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title={win.isMaximized ? 'Restore' : 'Maximize'}
          >
            <Square className="w-3 h-3" />
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-7 h-7 rounded-md hover:bg-rose-500 active:bg-rose-600 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inner Application Workspace */}
      <div className="flex-1 w-full overflow-hidden flex flex-col bg-slate-950/40 relative">
        {children}
      </div>

      {/* Corner Resize Handle */}
      {!win.isMaximized && (
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-40 hover:opacity-100 z-50 select-none"
          title="Resize window"
        >
          <div className="w-2 h-2 border-r-2 border-b-2 border-white/70" />
        </div>
      )}
    </div>
  );
};
