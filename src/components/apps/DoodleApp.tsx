import React, { useState, useRef, useEffect } from 'react';
import { soundEngine } from '../../utils/audio';
import { Wand2, RotateCcw, PenTool } from 'lucide-react';

export const DoodleApp: React.FC<{ onShowToast?: (title: string, msg: string) => void }> = ({ onShowToast }) => {
  const [brushColor, setBrushColor] = useState('#38bdf8');
  const [brushSize, setBrushSize] = useState(4);
  const [prediction, setPrediction] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = brushSize;
    ctx.strokeStyle = brushColor;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    soundEngine.playSfx('click');
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPrediction(null);
  };

  const handleRecognize = () => {
    soundEngine.playSfx('open');
    const guesses = [
      'Orbital Space Station or Satellite (98.4% match)',
      'Autonomous Drone Quadcopter (96.1% match)',
      'Futuristic Electric Hypercar (94.8% match)',
      'Neural Mesh Computing Node (97.2% match)',
      'Cosmic Telescope Array (95.5% match)',
    ];
    const picked = guesses[Math.floor(Math.random() * guesses.length)];
    setPrediction(picked);
    if (onShowToast) onShowToast('GenDoodle Prediction', `Model recognized: ${picked.split('(')[0]}`);
  };

  const colors = ['#38bdf8', '#a855f7', '#10b981', '#f43f5e', '#fbbf24', '#ffffff'];

  return (
    <div className="flex-1 flex flex-col h-full p-4 overflow-hidden bg-slate-950/70 select-none">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10 shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mr-2">
            <PenTool className="w-3.5 h-3.5 text-emerald-400" />
            <span>GenDoodle</span>
          </span>

          {colors.map((c) => (
            <button
              key={c}
              onClick={() => {
                soundEngine.playSfx('click');
                setBrushColor(c);
              }}
              className={`w-6 h-6 rounded-full border border-white/40 transition-transform ${
                brushColor === c ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}

          <div className="h-4 w-px bg-white/20 mx-1"></div>
          <span className="text-[11px] text-slate-400">Size:</span>
          <input
            type="range"
            min="2"
            max="24"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-16 accent-emerald-400 h-1 bg-slate-700 cursor-pointer"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={clearCanvas}
            className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/15 text-xs text-slate-300 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear</span>
          </button>
          <button
            onClick={handleRecognize}
            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white flex items-center space-x-1.5 shadow transition-all"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Recognize Doodle</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 w-full bg-slate-900 border border-white/10 rounded-xl relative overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {prediction && (
          <div className="absolute bottom-3 left-3 bg-slate-950/90 backdrop-blur border border-emerald-500/30 px-3 py-2 rounded-xl text-xs text-emerald-300 font-mono shadow-lg flex items-center space-x-2 animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>AI Recognition: {prediction}</span>
          </div>
        )}
      </div>
    </div>
  );
};
