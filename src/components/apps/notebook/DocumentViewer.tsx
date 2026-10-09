import React, { useEffect, useRef, useState } from 'react';
import { ResearchSource, DocumentChunk } from './types';
import { soundEngine } from '../../../utils/audio';
import {
  FileText,
  BookmarkPlus,
  Copy,
  Check,
  Search,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';

interface DocumentViewerProps {
  source: ResearchSource;
  highlightChunkId?: string | null;
  onBookmarkFinding?: (finding: { claim: string; source: string; page: number }) => void;
  onShowToast?: (title: string, msg: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  source,
  highlightChunkId,
  onBookmarkFinding,
  onShowToast,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchInDoc, setSearchInDoc] = useState('');
  const [copiedChunkId, setCopiedChunkId] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const chunkRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (highlightChunkId && chunkRefs.current[highlightChunkId]) {
      chunkRefs.current[highlightChunkId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const foundChunk = source.chunks.find((c) => c.id === highlightChunkId);
      if (foundChunk) {
        setCurrentPage(foundChunk.page);
      }
    }
  }, [highlightChunkId, source]);

  const handleCopyChunk = (chunk: DocumentChunk) => {
    soundEngine.playSfx('click');
    navigator.clipboard.writeText(`"${chunk.text}" — ${source.name} (p. ${chunk.page})`);
    setCopiedChunkId(chunk.id);
    setTimeout(() => setCopiedChunkId(null), 2000);
    if (onShowToast) onShowToast('Citation Copied', `Copied excerpt from ${source.name}`);
  };

  const handleBookmark = (chunk: DocumentChunk) => {
    soundEngine.playSfx('success');
    if (onBookmarkFinding) {
      onBookmarkFinding({
        claim: chunk.text,
        source: source.name,
        page: chunk.page,
      });
    }
    if (onShowToast) onShowToast('Finding Saved', 'Added quote to Verified Research Knowledge Memory.');
  };

  const filteredChunks = source.chunks.filter((c) =>
    c.text.toLowerCase().includes(searchInDoc.toLowerCase()) ||
    c.section.toLowerCase().includes(searchInDoc.toLowerCase())
  );

  return (
    <div
      className={`flex-1 flex flex-col h-full bg-slate-950/90 text-slate-100 overflow-hidden font-sans select-text ${
        isFocusMode ? 'fixed inset-0 z-50 p-6 bg-slate-950' : ''
      }`}
    >
      {/* Top Document Header */}
      <div className="h-12 border-b border-white/10 px-4 flex items-center justify-between bg-black/40 shrink-0">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-blue-500/20 text-cyan-300">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-white truncate max-w-sm">{source.name}</h3>
            <p className="text-[10px] text-slate-400 font-mono">
              {source.tag} · {source.pages} Pages · {source.wordCount.toLocaleString()} Words · Status: Ready
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Quick in-document search */}
          <div className="relative hidden md:block">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInDoc}
              onChange={(e) => setSearchInDoc(e.target.value)}
              placeholder="Find in text..."
              className="bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-1 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 w-36"
            />
          </div>

          {/* Page navigator */}
          <div className="flex items-center space-x-1 text-xs bg-white/5 rounded-lg px-2 py-1 border border-white/10 font-mono">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-0.5 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-cyan-300">
              p. {currentPage} / {source.pages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(source.pages, p + 1))}
              disabled={currentPage >= source.pages}
              className="p-0.5 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Focus Mode button */}
          <button
            onClick={() => setIsFocusMode((prev) => !prev)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-colors"
            title={isFocusMode ? 'Exit Reading Mode' : 'Distraction-Free Reading Mode'}
          >
            {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Document Body & Excerpts */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {/* Document Summary Overview Card */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/40 to-slate-900 border border-blue-500/20 text-xs text-slate-300 leading-relaxed shadow-sm">
          <div className="flex items-center gap-1.5 text-cyan-300 font-semibold mb-1 text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Extracted Executive Overview</span>
          </div>
          <p>{source.summary}</p>
        </div>

        {/* Chunks stream */}
        {filteredChunks.map((chunk) => {
          const isHighlighted = chunk.id === highlightChunkId;

          return (
            <div
              key={chunk.id}
              ref={(el) => {
                chunkRefs.current[chunk.id] = el;
              }}
              className={`p-4 rounded-xl border transition-all ${
                isHighlighted
                  ? 'bg-cyan-950/50 border-cyan-400 ring-2 ring-cyan-400/40 shadow-xl shadow-cyan-950/60'
                  : 'bg-white/[0.03] border-white/10 hover:border-white/20'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-xs text-slate-400">
                <span className="font-semibold text-slate-200 flex items-center gap-2">
                  <span className="font-mono text-cyan-400 text-[11px]">Page {chunk.page}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-300">{chunk.section}</span>
                </span>

                <div className="flex items-center space-x-1.5">
                  {chunk.isKeyFinding && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-mono border border-emerald-500/30">
                      Key Finding
                    </span>
                  )}

                  <button
                    onClick={() => handleCopyChunk(chunk)}
                    className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
                    title="Copy Citation Quote"
                  >
                    {copiedChunkId === chunk.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => handleBookmark(chunk)}
                    className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-amber-300 transition-colors"
                    title="Add to Knowledge Memory"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Text Body */}
              <p className="text-xs text-slate-200 leading-relaxed font-serif tracking-wide select-text">
                {chunk.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
