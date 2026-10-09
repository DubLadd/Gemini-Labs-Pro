import React, { useState, useEffect, useRef } from 'react';
import { Activity, Cpu, HardDrive, X, Minus } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface PerformanceWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PerformanceWidget: React.FC<PerformanceWidgetProps> = ({ isOpen, onClose }) => {
  const [cpuUsage, setCpuUsage] = useState<number>(24);
  const [memUsage, setMemUsage] = useState<number>(48);
  const [cpuHistory, setCpuHistory] = useState<number[]>([20, 22, 25, 24, 28, 22, 24]);
  const [memHistory, setMemHistory] = useState<number[]>([45, 46, 48, 48, 47, 49, 48]);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Position state for floating widget
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: window.innerWidth - 320, y: 70 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialX: number; initialY: number }>({
    mouseX: 0,
    mouseY: 0,
    initialX: 0,
    initialY: 0,
  });

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      // Simulate realistic fluctuation
      setCpuUsage((prev) => {
        const delta = (Math.random() - 0.48) * 12;
        const next = Math.max(8, Math.min(92, Math.round(prev + delta)));
        setCpuHistory((h) => [...h.slice(1), next]);
        return next;
      });

      setMemUsage((prev) => {
        const delta = (Math.random() - 0.5) * 3;
        const next = Math.max(30, Math.min(85, Math.round(prev + delta)));
        setMemHistory((h) => [...h.slice(1), next]);
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };

    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = moveEvent.clientX - dragStartRef.current.mouseX;
      const dy = moveEvent.clientY - dragStartRef.current.mouseY;
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 260, dragStartRef.current.initialX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 200, dragStartRef.current.initialY + dy)),
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="absolute w-72 mica-acrylic bg-slate-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl z-[900] flex flex-col overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Title Bar */}
      <div
        onMouseDown={handleMouseDown}
        className="h-9 bg-white/5 border-b border-white/10 px-3 flex items-center justify-between cursor-move select-none"
      >
        <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-300">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>Performance Monitor</span>
        </div>
        <div className="flex items-center space-x-1" onMouseDown={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsMinimized((prev) => !prev)}
            className="w-6 h-6 rounded hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              onClose();
            }}
            className="w-6 h-6 rounded hover:bg-rose-500/80 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-3.5 space-y-3 text-xs text-slate-200">
          {/* CPU Stats */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>CPU Load (8 Cores)</span>
              </span>
              <span className="font-mono font-semibold text-cyan-400">{cpuUsage}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${cpuUsage}%` }}
              />
            </div>
            {/* Mini sparkline bars */}
            <div className="flex items-end space-x-1 h-6 pt-1">
              {cpuHistory.map((val, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-cyan-500/40 hover:bg-cyan-400 rounded-t transition-all duration-300"
                  style={{ height: `${val}%` }}
                />
              ))}
            </div>
          </div>

          {/* Memory Stats */}
          <div className="space-y-1 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300">
                <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                <span>Memory (16 GB)</span>
              </span>
              <span className="font-mono font-semibold text-purple-400">
                {memUsage}% ({((memUsage / 100) * 16).toFixed(1)} GB)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${memUsage}%` }}
              />
            </div>
            {/* Mini sparkline bars */}
            <div className="flex items-end space-x-1 h-6 pt-1">
              {memHistory.map((val, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-purple-500/40 hover:bg-purple-400 rounded-t transition-all duration-300"
                  style={{ height: `${val}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
