import React from 'react';
import { SnapZone } from '../types/os';
import {
  Maximize2,
  Columns2,
  Grid2X2,
  Square,
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
} from 'lucide-react';

interface SnapPreviewOverlayProps {
  zone: SnapZone | null;
}

export const SnapPreviewOverlay: React.FC<SnapPreviewOverlayProps> = ({ zone }) => {
  if (!zone) return null;

  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const screenH = typeof window !== 'undefined' ? window.innerHeight - 48 : 752; // 48px taskbar
  const halfW = Math.floor(screenW / 2);
  const halfH = Math.floor(screenH / 2);

  let style: React.CSSProperties = {};
  let title = '';
  let Icon = Square;

  switch (zone) {
    case 'left':
      style = {
        left: 8,
        top: 8,
        width: halfW - 12,
        height: screenH - 16,
      };
      title = 'Snap Left (50%)';
      Icon = ArrowLeft;
      break;

    case 'right':
      style = {
        left: halfW + 4,
        top: 8,
        width: screenW - halfW - 12,
        height: screenH - 16,
      };
      title = 'Snap Right (50%)';
      Icon = ArrowRight;
      break;

    case 'top':
      style = {
        left: 8,
        top: 8,
        width: screenW - 16,
        height: screenH - 16,
      };
      title = 'Maximize Screen';
      Icon = Maximize2;
      break;

    case 'top-left':
      style = {
        left: 8,
        top: 8,
        width: halfW - 12,
        height: halfH - 12,
      };
      title = 'Snap Corner (Top-Left)';
      Icon = ArrowUpLeft;
      break;

    case 'top-right':
      style = {
        left: halfW + 4,
        top: 8,
        width: screenW - halfW - 12,
        height: halfH - 12,
      };
      title = 'Snap Corner (Top-Right)';
      Icon = ArrowUpRight;
      break;

    case 'bottom-left':
      style = {
        left: 8,
        top: halfH + 4,
        width: halfW - 12,
        height: screenH - halfH - 12,
      };
      title = 'Snap Corner (Bottom-Left)';
      Icon = ArrowDownLeft;
      break;

    case 'bottom-right':
      style = {
        left: halfW + 4,
        top: halfH + 4,
        width: screenW - halfW - 12,
        height: screenH - halfH - 12,
      };
      title = 'Snap Corner (Bottom-Right)';
      Icon = ArrowDownRight;
      break;
  }

  return (
    <div
      style={style}
      className="fixed z-[85] pointer-events-none rounded-2xl bg-cyan-500/20 backdrop-blur-[2px] border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400/40 transition-all duration-150 ease-out flex items-center justify-center animate-in fade-in zoom-in-95"
    >
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 text-cyan-300 border border-cyan-500/50 shadow-lg text-xs font-semibold backdrop-blur-md">
        <Icon className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span>{title}</span>
      </div>
    </div>
  );
};
