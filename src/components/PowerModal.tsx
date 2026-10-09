import React from 'react';
import { Power, RotateCw } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface PowerModalProps {
  isOpen: boolean;
  action: 'restart' | 'shutdown' | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const PowerModal: React.FC<PowerModalProps> = ({
  isOpen,
  action,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !action) return null;

  return (
    <div className="fixed inset-0 z-[1001] backdrop-blur-md bg-black/60 flex items-center justify-center p-4 select-none">
      <div className="mica-acrylic bg-slate-900/95 border border-white/15 rounded-2xl p-6 max-w-sm w-full text-center window-shadow">
        <div className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-3">
          {action === 'restart' ? <RotateCw className="w-6 h-6" /> : <Power className="w-6 h-6" />}
        </div>

        <h3 className="text-base font-semibold text-white mb-1">
          {action === 'restart' ? 'Restart Google Labs Shell' : 'Power Down Shell Session'}
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          {action === 'restart'
            ? 'This will reset all experimental windows, clear cached state, and reboot UI.'
            : 'Close all open active experiments and clean up state memory.'}
        </p>

        <div className="flex space-x-2">
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              onClose();
            }}
            className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              soundEngine.playSfx('open');
              onConfirm();
            }}
            className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white shadow-lg shadow-cyan-600/30 transition-all"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
