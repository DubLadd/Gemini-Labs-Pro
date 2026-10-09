import React, { useState, useEffect, useRef } from 'react';
import { AudioBriefingConfig, AudioChapter } from './types';
import { MOCK_AUDIO_BRIEFING } from './mockCorpus';
import { soundEngine } from '../../../utils/audio';
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Users,
  User,
  Sliders,
  CheckCircle2,
  FastForward,
} from 'lucide-react';

interface AudioStudioProps {
  onShowToast?: (title: string, msg: string) => void;
}

export const AudioStudio: React.FC<AudioStudioProps> = ({ onShowToast }) => {
  const [format, setFormat] = useState<'two_hosts' | 'solo_briefing'>('two_hosts');
  const [depth, setDepth] = useState<'deep_dive' | 'executive_summary' | 'critique'>('deep_dive');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [chapters] = useState<AudioChapter[]>(MOCK_AUDIO_BRIEFING);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const startVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    let step = 0;
    const render = () => {
      step += 0.05 * playbackSpeed;
      ctx.fillStyle = 'rgba(7, 11, 20, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const bars = 36;
      const barWidth = canvas.width / bars;

      for (let i = 0; i < bars; i++) {
        const wave = Math.sin(step + i * 0.25) * Math.cos(step * 0.8 + i * 0.15);
        const height = Math.abs(wave) * (canvas.height * 0.75) + 6;
        const hue = 195 + i * 3;
        ctx.fillStyle = `hsl(${hue}, 85%, 60%)`;
        ctx.fillRect(i * barWidth, canvas.height - height, barWidth - 2, height);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };
    render();
  };

  const playChapterSpeech = (index: number) => {
    const chapter = chapters[index];
    if (!chapter) {
      setIsPlaying(false);
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const textToSpeak = `${chapter.speaker} says: ${chapter.text}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = playbackSpeed;

      // Select voices if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        if (chapter.speaker === 'Sarah') {
          const femaleVoice = voices.find((v) => v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.lang.startsWith('en'));
          if (femaleVoice) utterance.voice = femaleVoice;
        } else {
          const maleVoice = voices.find((v) => v.name.includes('David') || v.name.includes('Male') || v.name.includes('Daniel') || v.lang.startsWith('en'));
          if (maleVoice) utterance.voice = maleVoice;
        }
      }

      utterance.onend = () => {
        if (index + 1 < chapters.length) {
          setActiveChapterIndex(index + 1);
          playChapterSpeech(index + 1);
        } else {
          setIsPlaying(false);
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        }
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback tone
      soundEngine.playSfx('open');
    }

    startVisualizer();
  };

  const togglePlay = () => {
    soundEngine.playSfx('click');

    if (isPlaying) {
      setIsPlaying(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    } else {
      setIsPlaying(true);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        startVisualizer();
      } else {
        playChapterSpeech(activeChapterIndex);
      }
      if (onShowToast) onShowToast('Audio Briefing Playing', `Streaming synthesized briefing: Chapter ${activeChapterIndex + 1}`);
    }
  };

  const handleSkipNext = () => {
    soundEngine.playSfx('click');
    const nextIdx = (activeChapterIndex + 1) % chapters.length;
    setActiveChapterIndex(nextIdx);
    if (isPlaying) {
      playChapterSpeech(nextIdx);
    }
  };

  const handleReset = () => {
    soundEngine.playSfx('click');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setActiveChapterIndex(0);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const handleSpeedChange = () => {
    soundEngine.playSfx('click');
    const nextSpeed = playbackSpeed === 1.0 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : 1.0;
    setPlaybackSpeed(nextSpeed);
    if (isPlaying) {
      playChapterSpeech(activeChapterIndex);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Studio Toolbar */}
      <div className="h-12 border-b border-white/10 px-4 flex items-center justify-between bg-black/40 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
            <Headphones className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white leading-tight">Configurable Audio Briefing Studio</h3>
            <p className="text-[10px] text-slate-400">Two-Host AI Speech Synthesis & Chapter Markers</p>
          </div>
        </div>

        {/* Configuration pills */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setFormat((f) => (f === 'two_hosts' ? 'solo_briefing' : 'two_hosts'));
            }}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 text-slate-300 transition-colors"
          >
            {format === 'two_hosts' ? <Users className="w-3.5 h-3.5 text-cyan-400" /> : <User className="w-3.5 h-3.5 text-purple-400" />}
            <span>{format === 'two_hosts' ? 'Two Hosts (Alex & Sarah)' : 'Solo Executive'}</span>
          </button>

          <select
            value={depth}
            onChange={(e) => setDepth(e.target.value as any)}
            className="bg-slate-900 border border-white/10 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-400"
          >
            <option value="deep_dive">Deep Dive (~8 min)</option>
            <option value="executive_summary">Quick Summary (2 min)</option>
            <option value="critique">Technical Critique (4 min)</option>
          </select>
        </div>
      </div>

      {/* Main Studio Workspace */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 max-w-3xl mx-auto w-full">
        {/* Animated Spectrum Display & Player Controls Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-black border border-cyan-500/30 shadow-2xl space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-cyan-400 flex items-center gap-1.5 font-bold">
              <Volume2 className="w-4 h-4" />
              <span>{isPlaying ? 'Synthesizing Live Voice Stream...' : 'Voice Synthesizer Ready'}</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Chapter {activeChapterIndex + 1} of {chapters.length} · Rate: {playbackSpeed}x
            </span>
          </div>

          {/* Oscilloscope Canvas */}
          <div className="h-24 w-full rounded-xl bg-slate-950/80 border border-white/10 overflow-hidden relative flex items-center justify-center">
            <canvas ref={canvasRef} className="w-full h-full block" />
            {!isPlaying && (
              <span className="absolute text-[11px] font-mono text-slate-500">
                Click Play to start spoken dialogue synthesis
              </span>
            )}
          </div>

          {/* Player controls */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-all"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={handleSkipNext}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Next Chapter"
              >
                <FastForward className="w-4 h-4" />
              </button>

              <button
                onClick={handleReset}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Reset Audio"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleSpeedChange}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-mono text-cyan-300 transition-colors"
            >
              {playbackSpeed}x Speed
            </button>
          </div>
        </div>

        {/* Chapters & Active Transcript */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono block px-1">
            Interactive Briefing Transcript & Chapters
          </span>

          {chapters.map((ch, idx) => {
            const isActive = activeChapterIndex === idx;

            return (
              <div
                key={idx}
                onClick={() => {
                  soundEngine.playSfx('click');
                  setActiveChapterIndex(idx);
                  if (isPlaying) playChapterSpeech(idx);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-500/30 shadow-md'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-500/30">
                      {ch.time}
                    </span>
                    <span className="font-bold text-white text-xs">{ch.title}</span>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                      ch.speaker === 'Sarah' ? 'bg-pink-500/20 text-pink-300' : 'bg-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    Speaker: {ch.speaker}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-serif select-text">
                  &ldquo;{ch.text}&rdquo;
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
