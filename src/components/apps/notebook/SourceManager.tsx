import React, { useState } from 'react';
import { ResearchSource, IndexingStatus } from './types';
import { soundEngine } from '../../../utils/audio';
import {
  FileText,
  FileCode,
  Globe,
  Plus,
  Search,
  CheckSquare,
  Square,
  Trash2,
  UploadCloud,
  X,
  FileCheck2,
  Tag,
  AlertCircle,
  Eye,
} from 'lucide-react';

interface SourceManagerProps {
  sources: ResearchSource[];
  activeSourceId: string | null;
  onSelectSource: (source: ResearchSource) => void;
  onToggleContext: (sourceId: string) => void;
  onAddSource: (newSource: ResearchSource) => void;
  onDeleteSource: (sourceId: string) => void;
  onOpenViewer: (source: ResearchSource) => void;
  onShowToast?: (title: string, msg: string) => void;
}

export const SourceManager: React.FC<SourceManagerProps> = ({
  sources,
  activeSourceId,
  onSelectSource,
  onToggleContext,
  onAddSource,
  onDeleteSource,
  onOpenViewer,
  onShowToast,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload modal state
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file');
  const [fileName, setFileName] = useState('');
  const [fileTag, setFileTag] = useState('Research');
  const [urlInput, setUrlInput] = useState('');
  const [isIndexingSimulated, setIsIndexingSimulated] = useState(false);

  const tags = ['all', ...Array.from(new Set(sources.map((s) => s.tag)))];

  const filteredSources = sources.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesTag = selectedTag === 'all' || s.tag === selectedTag;
    return matchesSearch && matchesTag;
  });

  const activeCount = sources.filter((s) => s.selectedForContext).length;

  const handleStartUpload = (e: React.FormEvent) => {
    e.preventDefault();
    const name = uploadType === 'file' ? fileName.trim() || 'Uploaded_Paper_2026.pdf' : urlInput.trim();
    if (!name) return;

    // Check for duplicate
    const isDuplicate = sources.some((s) => s.name.toLowerCase() === name.toLowerCase());
    if (isDuplicate) {
      if (onShowToast) onShowToast('Duplicate Detected', `"${name}" is already in your research library.`);
      return;
    }

    setIsIndexingSimulated(true);
    soundEngine.playSfx('open');

    const newSourceId = `src-${Date.now()}`;
    const fileExt = name.split('.').pop()?.toLowerCase() || 'pdf';
    const type = fileExt === 'md' ? 'md' : fileExt === 'txt' ? 'txt' : uploadType === 'url' ? 'url' : 'pdf';

    const stagedSource: ResearchSource = {
      id: newSourceId,
      name,
      type,
      tag: fileTag,
      color: '#06b6d4',
      pages: Math.floor(Math.random() * 12) + 4,
      wordCount: Math.floor(Math.random() * 4500) + 2100,
      chunkCount: Math.floor(Math.random() * 16) + 8,
      status: 'QUEUED',
      indexingProgress: 0,
      selectedForContext: true,
      dateAdded: 'Just now',
      summary: `Queued in background processing pipeline for text extraction and vector embedding generation.`,
      chunks: [
        {
          id: `chunk-${Date.now()}-1`,
          page: 1,
          section: '1. Abstract & Key Claims',
          text: `Comprehensive analysis of ${name}. Synthetic benchmarks demonstrate structured multi-document indexing improves retrieval precision over naive chunking by 38%.`,
          isKeyFinding: true,
        },
      ],
    };

    onAddSource(stagedSource);
    setIsUploadModalOpen(false);
    setFileName('');
    setUrlInput('');
    setIsIndexingSimulated(false);

    if (onShowToast) onShowToast('Source Ingested', `Indexing "${name}" across semantic chunks...`);
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-400" />;
      case 'md':
        return <FileCode className="w-4 h-4 text-emerald-400" />;
      case 'txt':
        return <FileText className="w-4 h-4 text-amber-400" />;
      case 'url':
        return <Globe className="w-4 h-4 text-cyan-400" />;
      default:
        return <FileText className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80 border-r border-white/10 select-none overflow-hidden">
      {/* Header & Upload Button */}
      <div className="p-3.5 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Research Library
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
              {activeCount}/{sources.length} in Context
            </span>
          </div>

          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setIsUploadModalOpen(true);
            }}
            className="p-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 transition-all flex items-center gap-1 text-xs"
            title="Import Documents"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium hidden sm:inline">Add</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search sources & topics..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Tag filter pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                soundEngine.playSfx('click');
                setSelectedTag(tag);
              }}
              className={`px-2 py-0.5 rounded-md transition-colors whitespace-nowrap capitalize ${
                selectedTag === tag
                  ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 font-medium'
                  : 'text-slate-400 hover:text-slate-200 bg-white/5'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Sources List */}
      <div className="flex-1 p-2.5 overflow-y-auto space-y-2">
        {filteredSources.map((source) => {
          const isSelected = source.id === activeSourceId;

          return (
            <div
              key={source.id}
              onClick={() => onSelectSource(source)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer group flex flex-col space-y-1.5 ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500/30'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]'
              }`}
            >
              {/* Row 1: Checkbox + Icon + Title + Status */}
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-start space-x-2 flex-1 min-w-0">
                  {/* Select for AI context toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.playSfx('click');
                      onToggleContext(source.id);
                    }}
                    className="mt-0.5 text-slate-400 hover:text-cyan-400 transition-colors"
                    title={source.selectedForContext ? 'Remove from AI Context' : 'Include in AI Context'}
                  >
                    {source.selectedForContext ? (
                      <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="mt-0.5 shrink-0">{getSourceIcon(source.type)}</div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate leading-tight group-hover:text-cyan-300 transition-colors">
                      {source.name}
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{source.pages} pages</span>
                      <span>·</span>
                      <span>{source.wordCount.toLocaleString()} words</span>
                    </div>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="shrink-0 flex items-center space-x-1">
                  {source.status === 'READY' ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono border border-emerald-500/30">
                      READY
                    </span>
                  ) : source.status === 'INDEXING' ? (
                    <div className="flex flex-col items-end">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono border border-amber-500/30 animate-pulse">
                        INDEXING ({source.indexingProgress}%)
                      </span>
                    </div>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-300 text-[9px] font-mono border border-slate-500/30">
                      QUEUED
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar if indexing or queued */}
              {source.status !== 'READY' && (
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(10, source.indexingProgress)}%` }}
                  />
                </div>
              )}

              {/* Row 2: Tag + Quick Actions */}
              <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-slate-400">
                <span className="px-1.5 py-0.5 rounded bg-white/5 text-slate-300 font-mono text-[9px] flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5 text-cyan-400" />
                  {source.tag}
                </span>

                <div className="flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.playSfx('open');
                      onOpenViewer(source);
                    }}
                    className="p-1 hover:bg-white/10 rounded text-cyan-400 hover:text-cyan-200 transition-colors"
                    title="View Document"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.playSfx('click');
                      onDeleteSource(source.id);
                    }}
                    className="p-1 hover:bg-rose-500/20 rounded text-slate-400 hover:text-rose-400 transition-colors"
                    title="Remove Source"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredSources.length === 0 && (
          <div className="text-center p-6 text-slate-500 text-xs">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p>No research sources matched filter.</p>
          </div>
        )}
      </div>

      {/* Upload & Add Source Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="mica-acrylic bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-5 max-w-md w-full window-shadow animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center space-x-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
                <UploadCloud className="w-4 h-4 text-cyan-400" />
                <span>Import Research Source</span>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type selector */}
            <div className="flex rounded-lg bg-white/5 p-1 mb-4 text-xs">
              <button
                type="button"
                onClick={() => setUploadType('file')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                  uploadType === 'file' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                File Upload (PDF / DOCX / MD)
              </button>
              <button
                type="button"
                onClick={() => setUploadType('url')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                  uploadType === 'url' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Web URL / ArXiv
              </button>
            </div>

            <form onSubmit={handleStartUpload} className="space-y-3.5">
              {uploadType === 'file' ? (
                <>
                  <div className="border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-xl p-5 text-center cursor-pointer transition-colors bg-white/[0.02]">
                    <UploadCloud className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-80" />
                    <p className="text-xs text-slate-200 font-medium">Drag & Drop research paper or notes</p>
                    <p className="text-[10px] text-slate-400 mt-1">Supports PDF, Markdown, Word DOCX, and TXT</p>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Document Name / Title:</label>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="e.g. KV_Cache_Optimization_2026.pdf"
                      className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-[11px] text-slate-300 block mb-1">Paper URL / Web Link:</label>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://arxiv.org/abs/2610.04812"
                    className="w-full bg-white/10 border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] text-slate-300 block mb-1">Research Tag / Domain:</label>
                <select
                  value={fileTag}
                  onChange={(e) => setFileTag(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Agentic AI">Agentic AI</option>
                  <option value="Compute & Scaling">Compute & Scaling</option>
                  <option value="Execution & JIT">Execution & JIT</option>
                  <option value="Systems">Systems & Hardware</option>
                  <option value="Physics & Quantum">Physics & Quantum</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-lg shadow-cyan-600/30 flex items-center gap-1.5 transition-all"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Begin Indexing</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
