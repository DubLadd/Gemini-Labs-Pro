import React, { useState } from 'react';
import { soundEngine } from '../../utils/audio';
import {
  ResearchSource,
  ChatMessage,
  CitationReference,
  CenterWorkspaceTab,
  NotebookTheme,
  ConfirmedFinding,
} from './notebook/types';
import {
  INITIAL_SOURCES,
  MOCK_GRAPH_NODES,
  MOCK_GRAPH_EDGES,
  INITIAL_CONFIRMED_FINDINGS,
} from './notebook/mockCorpus';

import { SourceManager } from './notebook/SourceManager';
import { DocumentViewer } from './notebook/DocumentViewer';
import { KnowledgeGraph } from './notebook/KnowledgeGraph';
import { StudyAndReports } from './notebook/StudyAndReports';
import { AudioStudio } from './notebook/AudioStudio';

import {
  BookOpen,
  Send,
  Sparkles,
  GitCompare,
  Share2,
  FileCheck,
  GraduationCap,
  Headphones,
  CheckCircle2,
  AlertTriangle,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  BookmarkCheck,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Palette,
} from 'lucide-react';

interface NotebookAppProps {
  onShowToast?: (title: string, msg: string) => void;
}

export const NotebookApp: React.FC<NotebookAppProps> = ({ onShowToast }) => {
  // Theme state
  const [theme, setTheme] = useState<NotebookTheme>('research_blue');

  // Panel collapse state
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Center workspace tab
  const [centerTab, setCenterTab] = useState<CenterWorkspaceTab>('viewer');

  // Sources state
  const [sources, setSources] = useState<ResearchSource[]>(INITIAL_SOURCES);
  const [activeSource, setActiveSource] = useState<ResearchSource>(INITIAL_SOURCES[0]);
  const [highlightChunkId, setHighlightChunkId] = useState<string | null>(null);

  // Knowledge memory / Confirmed findings
  const [confirmedFindings, setConfirmedFindings] = useState<ConfirmedFinding[]>(INITIAL_CONFIRMED_FINDINGS);
  const [isFindingsDrawerOpen, setIsFindingsDrawerOpen] = useState(false);

  // Active citation detail drawer in chat
  const [activeCitationDetail, setActiveCitationDetail] = useState<CitationReference | null>(null);

  // Messages stream
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      timestamp: '10:02 AM',
      text: 'I have parsed, chunked, and synthesized your 5 research sources (31,220 total words). I can compare cross-document claims, explore the multi-document knowledge graph, or produce evidence-backed literature reviews with verified citations.',
      suggestedFollowUps: [
        'How does inference search compute trade off against parameter scale?',
        'What memory bottleneck does paged KV-caching solve?',
        'Where do the Scaling Laws and Neural Compilers papers conflict?',
      ],
    },
  ]);

  const [queryInput, setQueryInput] = useState('');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Toggle source in AI retrieval context
  const handleToggleSourceContext = (sourceId: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, selectedForContext: !s.selectedForContext } : s))
    );
  };

  // Add new source and run background processing pipeline
  const handleAddSource = (newSource: ResearchSource) => {
    setSources((prev) => [newSource, ...prev]);
    setActiveSource(newSource);
    setCenterTab('viewer');

    if (onShowToast) onShowToast('Source Queued', `"${newSource.name}" entered background ingestion queue.`);

    // Pipeline Step 1: Text extraction & parsing (35%)
    setTimeout(() => {
      setSources((current) =>
        current.map((s) =>
          s.id === newSource.id
            ? {
                ...s,
                status: 'INDEXING',
                indexingProgress: 35,
                summary: 'Extracting text structure, headings, and section page numbers...',
              }
            : s
        )
      );
      if (onShowToast) onShowToast('Text Extraction', `Extracting text and structure for "${newSource.name}"...`);
    }, 500);

    // Pipeline Step 2: Vector embedding generation (75%)
    setTimeout(() => {
      setSources((current) =>
        current.map((s) =>
          s.id === newSource.id
            ? {
                ...s,
                status: 'INDEXING',
                indexingProgress: 75,
                summary: 'Generating semantic vector embeddings and building search index...',
              }
            : s
        )
      );
      if (onShowToast) onShowToast('Vector Embeddings', `Generating embeddings and chunk index for "${newSource.name}"...`);
    }, 1200);

    // Pipeline Step 3: Ready (100%)
    setTimeout(() => {
      setSources((current) =>
        current.map((s) =>
          s.id === newSource.id
            ? {
                ...s,
                status: 'READY',
                indexingProgress: 100,
                summary: 'Successfully extracted, chunked, and embedded into vector store. Ready for grounded synthesis.',
              }
            : s
        )
      );
      soundEngine.playSfx('agent');
      if (onShowToast) onShowToast('Indexing Complete', `"${newSource.name}" is fully indexed and ready in retrieval store.`);
    }, 1800);
  };

  const handleDeleteSource = (sourceId: string) => {
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
    if (activeSource.id === sourceId && sources.length > 1) {
      setActiveSource(sources.find((s) => s.id !== sourceId) || sources[0]);
    }
    if (onShowToast) onShowToast('Source Removed', 'Deleted source from research library.');
  };

  // Bookmark a finding
  const handleBookmarkFinding = (finding: { claim: string; source: string; page: number }) => {
    const newFinding: ConfirmedFinding = {
      id: `find-${Date.now()}`,
      claim: finding.claim,
      source: finding.source,
      page: finding.page,
      timestamp: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
    };
    setConfirmedFindings((prev) => [newFinding, ...prev]);
  };

  // Handle citation click: open inspector or jump to passage
  const handleCitationClick = (citation: CitationReference) => {
    soundEngine.playSfx('click');
    setActiveCitationDetail(citation);
  };

  // Jump straight to the document and chunk
  const handleJumpToPassage = (citation: CitationReference) => {
    soundEngine.playSfx('open');
    const targetSource = sources.find((s) => s.name === citation.sourceName || s.id === citation.sourceId);
    if (targetSource) {
      setActiveSource(targetSource);
      setCenterTab('viewer');
      // Find matching chunk
      const matchingChunk = targetSource.chunks.find((c) => c.page === citation.page) || targetSource.chunks[0];
      if (matchingChunk) {
        setHighlightChunkId(matchingChunk.id);
      }
    }
  };

  // Handle AI query submission
  const handleSendQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim() || isSynthesizing) return;
    const text = queryInput.trim();
    setQueryInput('');
    soundEngine.playSfx('click');

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsSynthesizing(true);

    // Simulate multi-document grounded reasoning
    setTimeout(() => {
      soundEngine.playSfx('agent');
      setIsSynthesizing(false);

      const isConflictQuery = text.toLowerCase().includes('conflict') || text.toLowerCase().includes('disagree') || text.toLowerCase().includes('gap');
      const isOutQuery = text.toLowerCase().includes('quantum') && !sources.find((s) => s.name.includes('Quantum'))?.selectedForContext;

      let replyMsg: ChatMessage;

      if (isOutQuery) {
        replyMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'The active sources selected in your research library do not contain evidence for quantum annealing or physical flux coherence windows. Please enable "Quantum_Annealing_Study.pdf" in the left sidebar to ground answers on this topic.',
          outOfCorpusNote: 'Out of context boundary: Zero active citations found in selected corpus.',
          suggestedFollowUps: ['Enable Quantum_Annealing_Study.pdf in sidebar context', 'Query classical KV-cache memory limits instead'],
        };
      } else if (isConflictQuery) {
        replyMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Cross-document analysis surfaces a structural contradiction between pretraining scaling theory and compiler memory limits. While scaling exponents assume compute alone yields continuous loss improvements, hardware execution measurements prove memory bus bandwidth saturates token generation speed without kernel fusion.',
          citations: [
            {
              id: 'c-1',
              sourceId: 'src-2',
              sourceName: 'Transformer_Scaling_Laws.md',
              page: 1,
              section: '1. Scaling Frontiers Overview',
              excerpt: 'Cross-entropy test loss scales as a power-law with compute, dataset size, and parameter count...',
              isDirectEvidence: true,
              confidence: 0.98,
            },
            {
              id: 'c-2',
              sourceId: 'src-3',
              sourceName: 'Neural_Compilers_DeepDive.txt',
              page: 3,
              section: '1. Memory Bandwidth Dominance',
              excerpt: 'Latency is predominantly constrained by memory bus saturation during KV-cache reads rather than arithmetic tensor-core saturation.',
              isDirectEvidence: true,
              confidence: 0.96,
            },
          ],
          conflictWarning: {
            claimA: 'Continuous power-law efficiency gains solely from compute investment (Scaling Laws §1)',
            sourceA: 'Transformer_Scaling_Laws.md',
            claimB: 'Severe execution latency asymptote caused by HBM read bottleneck (Neural Compilers §1)',
            sourceB: 'Neural_Compilers_DeepDive.txt',
          },
          suggestedFollowUps: ['How does paged attention resolve this conflict?', 'Compare memory bounds across sequence lengths'],
        };
      } else {
        replyMsg = {
          id: `msg-${Date.now() + 1}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'Synthesizing across active documents: Modern agentic architectures achieve accuracy parity with 4x larger models by trading pretraining bulk for inference-time verification loops [1]. However, at 128k context lengths, KV-cache storage demands exceed 16 GB per query [2], requiring virtual paged attention and operator fusion to avoid hardware memory stall [3].',
          citations: [
            {
              id: 'c-1',
              sourceId: 'src-2',
              sourceName: 'Transformer_Scaling_Laws.md',
              page: 3,
              section: '2. Inference-Time Search vs Parameter Growth',
              excerpt: 'Allocating additional FLOPs during token generation via Monte Carlo tree search and verification loops yields performance comparable to models with 4x higher parameter counts.',
              isDirectEvidence: true,
              confidence: 0.99,
            },
            {
              id: 'c-2',
              sourceId: 'src-4',
              sourceName: 'Memory_Hierarchy_Boundaries.pdf',
              page: 2,
              section: '1. KV-Cache Growth Dynamics',
              excerpt: 'At a context length of 128k tokens, KV-cache storage demands exceed 16 GB per concurrent batch query on 70B parameter models...',
              isDirectEvidence: true,
              confidence: 0.97,
            },
            {
              id: 'c-3',
              sourceId: 'src-3',
              sourceName: 'Neural_Compilers_DeepDive.txt',
              page: 5,
              section: '2. Operator Fusion & JIT Compilation',
              excerpt: 'Fusing normalization, RoPE, and softmax into single-pass hardware kernels eliminates intermediate global memory roundtrips...',
              isDirectEvidence: false,
              confidence: 0.92,
            },
          ],
          suggestedFollowUps: [
            'Examine AST invariant recovery in autonomous agents',
            'View concepts in the cross-document Knowledge Graph',
            'Generate a comparative synthesis report',
          ],
        };
      }

      setMessages((prev) => [...prev, replyMsg]);
    }, 750);
  };

  // Theme styling helpers
  const getThemeBg = () => {
    switch (theme) {
      case 'deep_ocean':
        return 'bg-[#030712]';
      case 'phosphor_lab':
        return 'bg-[#021512]';
      default:
        return 'bg-[#080d1a]';
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-full ${getThemeBg()} text-slate-100 overflow-hidden font-sans select-none relative`}>
      {/* Top Application Ribbon */}
      <div className="h-11 border-b border-white/10 px-3 flex items-center justify-between bg-black/50 shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 flex items-center justify-center shadow">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-xs text-white tracking-wider font-mono">
              NOTEBOOK<span className="text-cyan-400">LABS</span>
            </span>
          </div>

          <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-cyan-300 font-mono border border-blue-400/20">
            Multi-Document Intelligence Workstation
          </span>
        </div>

        {/* Center Workspace Mode Switcher */}
        <div className="flex items-center space-x-1 p-0.5 bg-white/5 rounded-lg text-xs border border-white/10">
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setCenterTab('viewer');
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              centerTab === 'viewer' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Viewer</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setCenterTab('graph');
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              centerTab === 'graph' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Knowledge Graph</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setCenterTab('compare');
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              centerTab === 'compare' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Compare</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setCenterTab('reports');
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              centerTab === 'reports' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reports</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setCenterTab('study');
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              centerTab === 'study' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Study</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setCenterTab('audio');
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              centerTab === 'audio' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Audio Studio</span>
          </button>
        </div>

        {/* Right Tools & Theme */}
        <div className="flex items-center space-x-2">
          {/* Confirmed findings toggle */}
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setIsFindingsDrawerOpen((prev) => !prev);
            }}
            className={`px-2 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
              isFindingsDrawerOpen
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/40'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
            title="Confirmed Research Knowledge Memory"
          >
            <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[11px] hidden lg:inline">{confirmedFindings.length} Verified</span>
          </button>

          {/* Theme selector */}
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              const nextTheme: NotebookTheme =
                theme === 'research_blue' ? 'deep_ocean' : theme === 'deep_ocean' ? 'phosphor_lab' : 'research_blue';
              setTheme(nextTheme);
              if (onShowToast) onShowToast('Workspace Theme', `Switched theme to ${nextTheme.replace('_', ' ')}`);
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-cyan-300 transition-colors"
            title="Cycle Research Theme"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Three-Pane Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ======================================================== */}
        {/* PANE 1 (LEFT): SOURCES INTELLIGENCE ENGINE               */}
        {/* ======================================================== */}
        {!isLeftCollapsed && (
          <div className="w-64 sm:w-72 border-r border-white/10 flex flex-col shrink-0 overflow-hidden relative z-10 animate-in slide-in-from-left-2 duration-150">
            <SourceManager
              sources={sources}
              activeSourceId={activeSource.id}
              onSelectSource={(source) => {
                setActiveSource(source);
                setCenterTab('viewer');
              }}
              onToggleContext={handleToggleSourceContext}
              onAddSource={handleAddSource}
              onDeleteSource={handleDeleteSource}
              onOpenViewer={(source) => {
                setActiveSource(source);
                setCenterTab('viewer');
              }}
              onShowToast={onShowToast}
            />

            {/* Left collapse handle */}
            <button
              onClick={() => setIsLeftCollapsed(true)}
              className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300"
              title="Collapse Source Library"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {isLeftCollapsed && (
          <button
            onClick={() => setIsLeftCollapsed(false)}
            className="w-8 border-r border-white/10 bg-black/40 hover:bg-white/5 flex flex-col items-center py-4 text-slate-400 hover:text-cyan-300 transition-colors shrink-0"
            title="Expand Source Library"
          >
            <PanelLeftOpen className="w-4 h-4 mb-4" />
            <span className="font-mono text-[9px] uppercase tracking-widest [writing-mode:vertical-lr] rotate-180">
              Sources ({sources.length})
            </span>
          </button>
        )}

        {/* ======================================================== */}
        {/* PANE 2 (CENTER): MULTI-MODE WORKSPACE (VIEWER / GRAPH)    */}
        {/* ======================================================== */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/60 min-w-0">
          {centerTab === 'viewer' && (
            <DocumentViewer
              source={activeSource}
              highlightChunkId={highlightChunkId}
              onBookmarkFinding={handleBookmarkFinding}
              onShowToast={onShowToast}
            />
          )}

          {centerTab === 'graph' && (
            <KnowledgeGraph
              nodes={MOCK_GRAPH_NODES}
              edges={MOCK_GRAPH_EDGES}
              sources={sources}
              onOpenSourceViewer={(sid) => {
                const found = sources.find((s) => s.id === sid);
                if (found) {
                  setActiveSource(found);
                  setCenterTab('viewer');
                }
              }}
              onShowToast={onShowToast}
            />
          )}

          {(centerTab === 'compare' || centerTab === 'reports' || centerTab === 'study') && (
            <StudyAndReports
              sources={sources}
              activeSubTab={centerTab}
              onShowToast={onShowToast}
            />
          )}

          {centerTab === 'audio' && <AudioStudio onShowToast={onShowToast} />}
        </div>

        {/* ======================================================== */}
        {/* PANE 3 (RIGHT): AI RESEARCH ASSISTANT & EVIDENCE ENGINE   */}
        {/* ======================================================== */}
        {!isRightCollapsed && (
          <div className="w-80 sm:w-96 border-l border-white/10 flex flex-col shrink-0 bg-slate-950/95 overflow-hidden relative z-10 animate-in slide-in-from-right-2 duration-150">
            {/* Assistant Header */}
            <div className="h-12 border-b border-white/10 px-3.5 flex items-center justify-between bg-black/40 shrink-0">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Evidence Assistant
                </span>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setIsRightCollapsed(true)}
                  className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300"
                  title="Collapse Assistant"
                >
                  <PanelRightClose className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Specialist Research Command Palette */}
            <div className="p-2 border-b border-white/10 bg-white/[0.02] flex items-center space-x-1 overflow-x-auto no-scrollbar shrink-0 text-[10px]">
              <button
                onClick={() => {
                  soundEngine.playSfx('click');
                  setCenterTab('compare');
                }}
                className="px-2 py-1 rounded bg-white/5 hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-200 border border-white/5 whitespace-nowrap transition-colors"
              >
                Compare Sources
              </button>
              <button
                onClick={() => {
                  soundEngine.playSfx('click');
                  setCenterTab('graph');
                }}
                className="px-2 py-1 rounded bg-white/5 hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-200 border border-white/5 whitespace-nowrap transition-colors"
              >
                Graph Matrix
              </button>
              <button
                onClick={() => {
                  soundEngine.playSfx('click');
                  setCenterTab('reports');
                }}
                className="px-2 py-1 rounded bg-white/5 hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-200 border border-white/5 whitespace-nowrap transition-colors"
              >
                Draft Report
              </button>
              <button
                onClick={() => {
                  soundEngine.playSfx('click');
                  setCenterTab('audio');
                }}
                className="px-2 py-1 rounded bg-white/5 hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-200 border border-white/5 whitespace-nowrap transition-colors"
              >
                Audio Briefing
              </button>
            </div>

            {/* Conversation Stream */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 select-text">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'ml-auto bg-cyan-600/25 border border-cyan-500/40 text-white max-w-[88%]'
                      : 'bg-white/[0.03] border border-white/10 text-slate-200'
                  }`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/5 text-[10px]">
                      <span className="font-bold text-cyan-400 font-mono flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Grounded Synthesis
                      </span>
                      <span className="text-slate-500 font-mono">{msg.timestamp}</span>
                    </div>
                  )}

                  <p className="font-serif leading-relaxed">{msg.text}</p>

                  {/* Conflict Detection Banner */}
                  {msg.conflictWarning && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-400 font-mono text-[10px]">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Contradiction Detected Across Sources:</span>
                      </div>
                      <p className="text-[10px] text-slate-300">
                        • {msg.conflictWarning.claimA}
                      </p>
                      <p className="text-[10px] text-slate-300">
                        • {msg.conflictWarning.claimB}
                      </p>
                    </div>
                  )}

                  {/* Out of corpus note */}
                  {msg.outOfCorpusNote && (
                    <div className="mt-2 p-2 rounded bg-rose-950/40 border border-rose-500/30 text-[10px] text-rose-300 font-mono">
                      {msg.outOfCorpusNote}
                    </div>
                  )}

                  {/* Clickable Grounding Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-white/10">
                      <span className="text-[10px] font-mono text-slate-400 block mb-1 font-semibold">
                        Clickable Evidence Citations:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, i) => (
                          <button
                            key={c.id}
                            onClick={() => handleCitationClick(c)}
                            className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-cyan-600/30 border border-white/10 hover:border-cyan-400/50 text-[10px] text-cyan-300 font-mono flex items-center gap-1 transition-all"
                            title={`Inspect page ${c.page} in ${c.sourceName}`}
                          >
                            <span>[{i + 1}]</span>
                            <span className="truncate max-w-[120px]">{c.sourceName}</span>
                            <span className="text-slate-500">p.{c.page}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested follow-up prompt chips */}
                  {msg.suggestedFollowUps && (
                    <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                      {msg.suggestedFollowUps.map((promptText, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setQueryInput(promptText);
                          }}
                          className="w-full text-left text-[10px] text-slate-400 hover:text-cyan-300 hover:bg-white/5 p-1 rounded transition-colors truncate block"
                        >
                          ↳ {promptText}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isSynthesizing && (
                <div className="p-3 rounded-xl bg-white/[0.02] border border-cyan-500/30 text-xs text-cyan-300 flex items-center space-x-2 animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Synthesizing multi-document citations across active corpus...</span>
                </div>
              )}
            </div>

            {/* Inline Citation Drawer when clicked */}
            {activeCitationDetail && (
              <div className="p-3 border-t border-cyan-500/30 bg-slate-900/95 space-y-2 text-xs animate-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10 text-[10px]">
                  <span className="font-bold text-white flex items-center gap-1 truncate font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    {activeCitationDetail.sourceName} (p. {activeCitationDetail.page})
                  </span>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span
                      className={`px-1.5 py-0.2 rounded font-mono ${
                        activeCitationDetail.isDirectEvidence
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {activeCitationDetail.isDirectEvidence ? 'Direct Evidence' : 'Inference'}
                    </span>
                    <button
                      onClick={() => setActiveCitationDetail(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <p className="font-serif italic text-slate-200 text-xs leading-relaxed bg-black/40 p-2 rounded-lg border border-white/5">
                  &ldquo;{activeCitationDetail.excerpt}&rdquo;
                </p>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleJumpToPassage(activeCitationDetail)}
                    className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-semibold flex items-center gap-1 shadow"
                  >
                    <span>Jump to Document Passage</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Query Input Box */}
            <form onSubmit={handleSendQuery} className="p-3 border-t border-white/10 bg-black/40 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Ask a grounded research question..."
                  className="w-full bg-white/10 border border-white/15 rounded-xl pl-3 pr-9 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!queryInput.trim() || isSynthesizing}
                  className="absolute right-1.5 top-1.5 p-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-40 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {isRightCollapsed && (
          <button
            onClick={() => setIsRightCollapsed(false)}
            className="w-8 border-l border-white/10 bg-black/40 hover:bg-white/5 flex flex-col items-center py-4 text-slate-400 hover:text-cyan-300 transition-colors shrink-0"
            title="Expand Research Assistant"
          >
            <PanelRightOpen className="w-4 h-4 mb-4" />
            <span className="font-mono text-[9px] uppercase tracking-widest [writing-mode:vertical-lr] rotate-180">
              Assistant
            </span>
          </button>
        )}
      </div>

      {/* Confirmed Findings Drawer Overlay */}
      {isFindingsDrawerOpen && (
        <div className="absolute inset-y-0 right-0 w-80 sm:w-96 bg-slate-900/95 border-l border-amber-500/40 shadow-2xl z-40 p-4 flex flex-col animate-in slide-in-from-right-4 duration-150">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <BookmarkCheck className="w-4 h-4 text-amber-400" />
              Verified Knowledge Memory
            </span>
            <button
              onClick={() => setIsFindingsDrawerOpen(false)}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <p className="text-[11px] text-slate-400 mb-3">
            Persistent confirmed claims bookmarked by the researcher. Independent from generative hypotheses.
          </p>

          <div className="flex-1 overflow-y-auto space-y-2.5">
            {confirmedFindings.map((f) => (
              <div key={f.id} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-xs text-slate-200">
                <p className="font-serif leading-relaxed">&ldquo;{f.claim}&rdquo;</p>
                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-slate-400 font-mono">
                  <span>{f.source} (p. {f.page})</span>
                  <span>{f.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
