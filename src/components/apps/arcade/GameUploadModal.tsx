import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileArchive,
  FileCode,
  FileText,
  Play,
  Code2,
  Sparkles,
  Check,
  RefreshCw,
  FolderOpen,
  Package,
  Layers,
} from 'lucide-react';
import { unpackGameZip, adaptCodeToPlaygroundEngine, UnpackedGame } from './zipUtils';
import { GameTemplate } from '../ArcadeApp';
import { soundEngine } from '../../../utils/audio';
import {
  saveMiniApp,
  setActiveMiniAppId,
  MiniAppDefinition,
} from '../../../utils/miniAppStore';

interface GameUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportGame: (game: GameTemplate, targetTab: 'play' | 'code') => void;
  onSendToSynthesizer: (unpacked: UnpackedGame) => void;
  onShowToast?: (title: string, msg: string, type?: 'info' | 'success' | 'warn') => void;
}

export const GameUploadModal: React.FC<GameUploadModalProps> = ({
  isOpen,
  onClose,
  onImportGame,
  onSendToSynthesizer,
  onShowToast,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUnpacking, setIsUnpacking] = useState<boolean>(false);
  const [unpacked, setUnpacked] = useState<UnpackedGame | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    soundEngine.playSfx('click');
    const lower = file.name.toLowerCase();

    if (lower.endsWith('.zip')) {
      setIsUnpacking(true);
      try {
        const result = await unpackGameZip(file);
        setUnpacked(result);
        setSelectedFile(result.detectedMainFile);
        setCustomTitle(result.suggestedTitle);
        soundEngine.playSfx('success');
        if (onShowToast) {
          onShowToast('Archive Unpacked', `Extracted ${result.fileList.length} files from ${file.name}`, 'success');
        }
      } catch (err: any) {
        console.error('ZIP unpack error:', err);
        if (onShowToast) onShowToast('Unpack Failed', 'Could not extract ZIP archive.', 'warn');
      } finally {
        setIsUnpacking(false);
      }
    } else {
      // Single code file (.js, .html, .json, .ts)
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = (e.target?.result as string) || '';
        const title = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const result: UnpackedGame = {
          fileName: file.name,
          fileList: [{ path: file.name, size: content.length, isCode: true }],
          fileContents: { [file.name]: content },
          detectedMainCode: content,
          detectedMainFile: file.name,
          suggestedTitle: title,
        };
        setUnpacked(result);
        setSelectedFile(file.name);
        setCustomTitle(title);
        soundEngine.playSfx('success');
      };
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileProcess(files[0]);
    }
  };

  const handleCreateGameTemplate = (): GameTemplate | null => {
    if (!unpacked) return null;
    const rawCode = unpacked.fileContents[selectedFile] || unpacked.detectedMainCode;
    const finalCode = adaptCodeToPlaygroundEngine(rawCode, customTitle || unpacked.suggestedTitle);

    return {
      id: `imported-${Date.now().toString(36)}`,
      title: customTitle || unpacked.suggestedTitle,
      genre: 'Custom',
      description: `Imported from archive: ${unpacked.fileName} (${selectedFile})`,
      version: '1.0.0',
      upgradesApplied: ['Unpacked from ZIP Archive'],
      tags: ['Imported', 'SPCK', 'Custom'],
      controlsLegend: [
        { key: 'WASD / Arrows', action: 'Move / Action' },
        { key: 'SPACE or [A]', action: 'Primary Fire / Jump' },
        { key: 'P', action: 'Pause Game' },
      ],
      params: {
        playerSpeed: 1.2,
        difficulty: 1.0,
        lives: 3,
        fireRate: 1.0,
        particleDensity: 'high',
        colorTheme: 'cyber-neon',
        screenShake: true,
      },
      code: finalCode,
    };
  };

  const handleImportAndPlay = () => {
    const game = handleCreateGameTemplate();
    if (!game) return;
    onImportGame(game, 'play');
    onClose();
  };

  const handleImportAndCode = () => {
    const game = handleCreateGameTemplate();
    if (!game) return;
    onImportGame(game, 'code');
    onClose();
  };

  const handleForwardToSynthesizer = () => {
    if (!unpacked) return;
    onSendToSynthesizer(unpacked);
    onClose();
  };

  const handleDeployAsMiniApp = () => {
    if (!unpacked) return;
    const rawCode = unpacked.fileContents[selectedFile] || unpacked.detectedMainCode;
    const title = customTitle.trim() || unpacked.suggestedTitle;
    const adapted = adaptCodeToPlaygroundEngine(rawCode, title);
    const newMiniApp: MiniAppDefinition = {
      id: `unpacked-${Date.now().toString(36)}`,
      title,
      shortTitle: title.slice(0, 16),
      version: '1.0.0',
      genre: 'SPCK Port',
      icon: 'Gamepad2',
      color: 'from-amber-400 via-orange-500 to-rose-600',
      description: `Imported from ${unpacked.fileName}. Standalone Mini App ready for upgrades.`,
      code: adapted,
      upgradesApplied: ['Unpacked ZIP Engine Port'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPinnedToDesktop: true,
      tags: ['SPCK Port', 'Unpacked', 'Mini App'],
    };
    saveMiniApp(newMiniApp);
    setActiveMiniAppId(newMiniApp.id);
    soundEngine.playSfx('success');
    if (onShowToast) {
      onShowToast('Mini App Deployed!', `Pinned "${title}" to Desktop & Mini Apps Hub.`, 'success');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
              <FileArchive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Import Game Package (ZIP / JS / HTML)</h3>
              <p className="text-[11px] text-slate-400">Unpack SPCK Node.js projects, ZIP archives, or raw game scripts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.js,.ts,.html,.json"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileProcess(e.target.files[0]);
              e.target.value = '';
            }}
            className="hidden"
          />

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragging
                ? 'border-pink-500 bg-pink-500/10 scale-[0.99]'
                : 'border-white/20 bg-slate-950/60 hover:border-pink-500/50 hover:bg-slate-950'
            }`}
          >
            {isUnpacking ? (
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="w-8 h-8 text-pink-400 animate-spin" />
                <span className="text-xs font-mono text-pink-300">Extracting & Analyzing ZIP Archive...</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-pink-500/20 to-rose-500/20 text-pink-400 flex items-center justify-center mb-2 border border-pink-500/30">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  Drag and drop a <span className="text-pink-400">.ZIP</span>, <span className="text-pink-400">.JS</span>, or <span className="text-pink-400">.HTML</span> file here
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Supports SPCK editor exports, HTML5 games, Node.js packages, and arcade templates
                </div>
                <button
                  type="button"
                  className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-white/10"
                >
                  Browse Files...
                </button>
              </>
            )}
          </div>

          {/* Unpacked Archive Inspector */}
          {unpacked && (
            <div className="bg-slate-950 rounded-xl border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Unpacked: {unpacked.fileName}
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    {unpacked.fileList.length} files
                  </span>
                </div>
              </div>

              {/* Game Title Input */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Game Title:</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. My Retro Platformer"
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Two Column Layout: File Tree & Code Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* File List */}
                <div className="bg-slate-900/80 rounded-lg border border-white/10 p-2 max-h-52 overflow-y-auto space-y-1">
                  <div className="text-[10px] font-mono font-bold text-slate-400 px-1 mb-1 uppercase">Files in Archive:</div>
                  {unpacked.fileList.map((f, i) => {
                    const isSelected = f.path === selectedFile;
                    const isDetected = f.path === unpacked.detectedMainFile;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSelectedFile(f.path);
                          soundEngine.playSfx('click');
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs font-mono flex items-center justify-between transition ${
                          isSelected
                            ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          {f.path.endsWith('.html') ? (
                            <FileText className="w-3 h-3 text-amber-400 shrink-0" />
                          ) : (
                            <FileCode className="w-3 h-3 text-cyan-400 shrink-0" />
                          )}
                          <span className="truncate">{f.path}</span>
                        </span>
                        {isDetected && (
                          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 rounded shrink-0">
                            MAIN
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Code Preview */}
                <div className="md:col-span-2 bg-slate-900/80 rounded-lg border border-white/10 p-2.5 flex flex-col justify-between max-h-52">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1 border-b border-white/5 pb-1">
                    <span className="text-white truncate font-semibold">{selectedFile}</span>
                    <span>
                      {(unpacked.fileContents[selectedFile] || '').split('\n').length} lines
                    </span>
                  </div>
                  <pre className="flex-1 overflow-auto text-[10px] font-mono text-slate-300 bg-black/50 p-2 rounded border border-white/5 whitespace-pre">
                    {unpacked.fileContents[selectedFile]
                      ? unpacked.fileContents[selectedFile].slice(0, 1500) +
                        (unpacked.fileContents[selectedFile].length > 1500 ? '\n\n... (truncated preview)' : '')
                      : '// Selected file has no text preview.'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-slate-950/80 flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>

          {unpacked && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleForwardToSynthesizer}
                className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                Mod with AI Synthesizer
              </button>

              <button
                onClick={handleImportAndCode}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                Open in Code Studio
              </button>

              <button
                onClick={handleDeployAsMiniApp}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-500/20 transition-all"
                title="Deploy as standalone Mini App pinned to Desktop"
              >
                <Layers className="w-3.5 h-3.5 text-white" />
                Deploy as Mini App
              </button>

              <button
                onClick={handleImportAndPlay}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-pink-500/20 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Import & Play Live
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
