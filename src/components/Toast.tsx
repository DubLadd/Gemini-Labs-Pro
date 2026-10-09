import React, { useEffect } from 'react';
import { ToastMessage } from '../types/os';
import { Info, CheckCircle, AlertTriangle } from 'lucide-react';

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3600);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed top-5 right-5 z-[1000] mica-acrylic bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-3.5 shadow-2xl flex items-center space-x-3 max-w-sm pointer-events-auto animate-in slide-in-from-top-2 duration-200 select-none">
      <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
        {toast.type === 'success' ? (
          <CheckCircle className="w-5 h-5 text-emerald-400" />
        ) : toast.type === 'warn' ? (
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        ) : (
          <Info className="w-5 h-5 text-cyan-400" />
        )}
      </div>

      <div className="flex-1 pr-1">
        <p className="text-xs font-semibold text-white">{toast.title}</p>
        <p className="text-[11px] text-slate-300 leading-snug">{toast.message}</p>
      </div>

      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white p-1 rounded-md text-xs hover:bg-white/10"
      >
        ✕
      </button>
    </div>
  );
};
