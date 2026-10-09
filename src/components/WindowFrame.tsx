import React, { useRef, useState, useEffect } from 'react';
import { WindowState } from '../types/os';
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
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const frameRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number }>({
    mouseX: 0,
    mouseY: 0,
    initialX: 0,
    initialY: 0,
  });

  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; initialW: number; initialH: number }>({
    mouseX: 0,
    mouseY: 0,
    initialW: 0,
    initialH: 0,
  });

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
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
    if (win.isMaximized) return;
    // Only drag with primary mouse button
    if (e.button !== 0) return;

    onFocus();
    setIsDragging(true);

    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: win.position.x,
      initialY: win.position.y,
    };

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
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
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
      className={`pointer-events-auto mica-acrylic bg-slate-900/90 rounded-2xl border border-white/15 window-shadow flex flex-col overflow-hidden select-none ${
        isDragging || isResizing ? 'transition-none shadow-2xl opacity-95' : 'transition-[box-shadow,opacity] duration-150'
      } ${isActive ? 'ring-1 ring-cyan-500/30' : 'opacity-90'}`}
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
        </div>

        {/* Window Controls */}
        <div
          className="flex items-center space-x-1 z-10"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
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

