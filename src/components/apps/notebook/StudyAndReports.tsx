import React, { useState } from 'react';
import { ResearchSource, Flashcard, QuizQuestion } from './types';
import { MOCK_FLASHCARDS, MOCK_QUIZ } from './mockCorpus';
import { soundEngine } from '../../../utils/audio';
import {
  GitCompare,
  FileCheck,
  GraduationCap,
  Download,
  Copy,
  Check,
  RotateCw,
  Sparkles,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface StudyAndReportsProps {
  sources: ResearchSource[];
  activeSubTab?: 'compare' | 'reports' | 'study';
  onShowToast?: (title: string, msg: string) => void;
}

export const StudyAndReports: React.FC<StudyAndReportsProps> = ({
  sources,
  activeSubTab = 'compare',
  onShowToast,
}) => {
  const [subTab, setSubTab] = useState<'compare' | 'reports' | 'study'>(activeSubTab);

  // Compare Tab State
  const [selectedSourceA, setSelectedSourceA] = useState<string>(sources[0]?.id || 'src-1');
  const [selectedSourceB, setSelectedSourceB] = useState<string>(sources[1]?.id || 'src-2');

  // Report Builder State
  const [reportType, setReportType] = useState<'review' | 'executive' | 'table'>('review');
  const [reportContent, setReportContent] = useState<string>(
    `# Cross-Document Synthesis: The Frontier of Bounded Reasoning

**Corpus Scope:** Autonomous Agents (2026), Transformer Scaling Laws, Neural Compilers, Memory Hierarchy Boundaries.

## 1. Executive Summary & Core Thesis
Modern AI system architecture is transitioning from unconstrained pretraining parameter growth to structured inference-time compute allocation and bounded memory hierarchies. While scaling exponents dictate foundational representations, real-world task execution is strictly bottlenecked by memory bandwidth during token-by-token KV-cache retrieval.

## 2. Comparative Findings
* **Inference-Time FLOPs:** Allocating verification loops and Monte Carlo search during inference yields accuracy parity with models possessing up to 4x higher parameter counts (Scaling Laws §2).
* **Memory Saturation Limits:** At 128k context windows, KV-cache consumption exceeds 16 GB per concurrent query, establishing an architectural imperative for paged virtual attention (Memory Boundaries §1).
* **AST Invariant Verification:** Rather than monolithic replanning, self-correcting agents utilize localized backtracking, reducing token expenditure by 44% (Autonomous Agents §2).

## 3. Discrepancies & Contradictions
* *Scaling vs Memory Limits:* Scaling literature presumes continuous power-law advantages with compute, whereas compiler engineering demonstrates severe sub-linear saturation without operator kernel fusion.

## 4. Citation Matrix
1. Autonomous_Agents_2026.pdf (p. 4, §2)
2. Transformer_Scaling_Laws.md (p. 3, §2)
3. Neural_Compilers_DeepDive.txt (p. 5, §2)
4. Memory_Hierarchy_Boundaries.pdf (p. 5, §2)`
  );
  const [isCopied, setIsCopied] = useState(false);

  // Study Mode State
  const [flashcards] = useState<Flashcard[]>(MOCK_FLASHCARDS);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz State
  const [quizQuestions] = useState<QuizQuestion[]>(MOCK_QUIZ);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const docA = sources.find((s) => s.id === selectedSourceA) || sources[0];
  const docB = sources.find((s) => s.id === selectedSourceB) || sources[1];

  const handleCopyReport = () => {
    soundEngine.playSfx('click');
    navigator.clipboard.writeText(reportContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    if (onShowToast) onShowToast('Report Copied', 'Markdown research synthesis copied to clipboard.');
  };

  const handleExportMarkdown = () => {
    soundEngine.playSfx('success');
    const blob = new Blob([reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NotebookLabs_Research_Synthesis_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    if (onShowToast) onShowToast('Export Complete', 'Downloaded research report as Markdown.');
  };

  const handleSelectQuizOption = (qIdx: number, optIdx: number) => {
    if (quizSubmitted) return;
    soundEngine.playSfx('click');
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const calculateScore = () => {
    let correct = 0;
    quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) correct++;
    });
    return correct;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-sans select-text">
      {/* Sub-header Navigation */}
      <div className="h-11 border-b border-white/10 px-4 flex items-center justify-between bg-black/40 shrink-0">
        <div className="flex items-center space-x-1.5 p-1 bg-white/5 rounded-lg text-xs">
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setSubTab('compare');
            }}
            className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              subTab === 'compare' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare Sources</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setSubTab('reports');
            }}
            className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              subTab === 'reports' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Report Builder</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setSubTab('study');
            }}
            className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              subTab === 'study' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Study & Quizzes</span>
          </button>
        </div>

        {subTab === 'reports' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyReport}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-slate-200 flex items-center gap-1 transition-colors"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleExportMarkdown}
              className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white flex items-center gap-1 shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .MD</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 overflow-y-auto">
        {/* ========================================= */}
        {/* 1. COMPARE SOURCES VIEW */}
        {/* ========================================= */}
        {subTab === 'compare' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {/* Source selectors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Document Baseline A:</label>
                <select
                  value={selectedSourceA}
                  onChange={(e) => setSelectedSourceA(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.tag})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Comparative Target B:</label>
                <select
                  value={selectedSourceB}
                  onChange={(e) => setSelectedSourceB(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                >
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.tag})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Side-by-side Comparative Matrix */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              {/* Doc A Card */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h4 className="font-bold text-cyan-300 text-xs truncate">{docA?.name}</h4>
                  <span className="text-[10px] font-mono text-slate-400">{docA?.tag}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Primary Thesis:</span>
                  <p className="text-xs text-slate-200 leading-relaxed">{docA?.summary}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 block">Core Mechanism:</span>
                  <p className="text-xs text-slate-300 font-serif leading-relaxed">
                    {docA?.chunks[0]?.text || 'Analyzes system trade-offs.'}
                  </p>
                </div>
              </div>

              {/* Doc B Card */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h4 className="font-bold text-emerald-300 text-xs truncate">{docB?.name}</h4>
                  <span className="text-[10px] font-mono text-slate-400">{docB?.tag}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Primary Thesis:</span>
                  <p className="text-xs text-slate-200 leading-relaxed">{docB?.summary}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 block">Core Mechanism:</span>
                  <p className="text-xs text-slate-300 font-serif leading-relaxed">
                    {docB?.chunks[0]?.text || 'Identifies execution parameters.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contradiction & Alignment Inspector */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/30 to-slate-900 border border-purple-500/30 text-xs space-y-2">
              <span className="font-bold text-purple-300 flex items-center gap-1.5 text-xs font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                Cross-Corpus Synthesis & Potential Conflicts
              </span>
              <p className="text-slate-300 leading-relaxed">
                While <strong>{docA?.name}</strong> assumes linear scaling holds provided data efficiency multipliers are verified, <strong>{docB?.name}</strong> demonstrates that without hardware kernel fusion or paged virtual caching, memory bus throughput creates an unavoidable latency asymptote.
              </p>
            </div>
          </div>
        )}

        {/* ========================================= */}
        {/* 2. REPORT BUILDER VIEW */}
        {/* ========================================= */}
        {subTab === 'reports' && (
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center space-x-2 pb-2">
              <span className="text-xs text-slate-400">Report Template:</span>
              <button
                onClick={() => setReportType('review')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  reportType === 'review' ? 'bg-cyan-600 text-white font-medium' : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Literature Review
              </button>
              <button
                onClick={() => setReportType('executive')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  reportType === 'executive' ? 'bg-cyan-600 text-white font-medium' : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Executive Summary
              </button>
              <button
                onClick={() => setReportType('table')}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  reportType === 'table' ? 'bg-cyan-600 text-white font-medium' : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                Evidence Table
              </button>
            </div>

            <textarea
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
              className="w-full h-[420px] bg-black/60 border border-white/15 rounded-xl p-4 font-mono text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-cyan-400 resize-none selection:bg-cyan-600"
            />
          </div>
        )}

        {/* ========================================= */}
        {/* 3. STUDY MODE (FLASHCARDS & QUIZ) */}
        {/* ========================================= */}
        {subTab === 'study' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Flashcard Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider font-mono">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Interactive Research Flashcards ({activeCardIndex + 1}/{flashcards.length})
                </span>
                <span className="text-[11px] text-slate-400">Click card to reveal evidence</span>
              </div>

              {/* Flip Card */}
              {flashcards[activeCardIndex] && (
                <div
                  onClick={() => {
                    soundEngine.playSfx('click');
                    setIsFlipped((prev) => !prev);
                  }}
                  className={`w-full min-h-[170px] p-6 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between shadow-xl ${
                    isFlipped
                      ? 'bg-gradient-to-tr from-cyan-950/70 to-slate-900 border-cyan-400/60 ring-1 ring-cyan-500/30'
                      : 'bg-gradient-to-tr from-slate-900 to-black border-white/15 hover:border-white/30'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block mb-2">
                      {isFlipped ? 'Verified Evidence Answer:' : 'Core Research Inquiry:'}
                    </span>
                    <p className={`text-sm leading-relaxed ${isFlipped ? 'text-slate-100 font-serif' : 'text-white font-medium'}`}>
                      {isFlipped ? flashcards[activeCardIndex].answer : flashcards[activeCardIndex].question}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[10px] text-slate-400 font-mono mt-3">
                    <span>Citation: {flashcards[activeCardIndex].sourceRef} (p. {flashcards[activeCardIndex].page})</span>
                    <span className="text-cyan-400">{isFlipped ? 'Click to view question' : 'Click to flip'}</span>
                  </div>
                </div>
              )}

              {/* Flashcard navigation controls */}
              <div className="flex items-center justify-center space-x-3 mt-3">
                <button
                  onClick={() => {
                    soundEngine.playSfx('click');
                    setIsFlipped(false);
                    setActiveCardIndex((prev) => Math.max(0, prev - 1));
                  }}
                  disabled={activeCardIndex === 0}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white disabled:opacity-30"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    soundEngine.playSfx('click');
                    setIsFlipped(false);
                    setActiveCardIndex((prev) => Math.min(flashcards.length - 1, prev + 1));
                  }}
                  disabled={activeCardIndex === flashcards.length - 1}
                  className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-medium text-white disabled:opacity-30"
                >
                  Next Card
                </button>
              </div>
            </div>

            {/* Quiz Section */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider font-mono">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Corpus Mastery Quiz
                </span>
                {quizSubmitted && (
                  <span className="text-xs font-bold font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
                    Score: {calculateScore()}/{quizQuestions.length} Correct
                  </span>
                )}
              </div>

              {quizQuestions.map((q, qIdx) => {
                const userSelected = selectedAnswers[qIdx];
                return (
                  <div key={q.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                    <p className="text-xs font-semibold text-white leading-snug">
                      {qIdx + 1}. {q.question}
                    </p>

                    <div className="space-y-1.5">
                      {q.options.map((opt, optIdx) => {
                        let btnStyle = 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300';
                        if (userSelected === optIdx) {
                          btnStyle = 'bg-cyan-600/30 border-cyan-400 text-white font-medium';
                        }
                        if (quizSubmitted) {
                          if (optIdx === q.correctIndex) {
                            btnStyle = 'bg-emerald-950/60 border-emerald-400 text-emerald-200 font-semibold';
                          } else if (userSelected === optIdx && userSelected !== q.correctIndex) {
                            btnStyle = 'bg-rose-950/60 border-rose-500 text-rose-200 line-through';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectQuizOption(qIdx, optIdx)}
                            className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors ${btnStyle}`}
                          >
                            <span className="font-mono mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-slate-300 leading-relaxed space-y-1 font-mono">
                        <span className="font-bold text-emerald-400 block">Explanation:</span>
                        <p>{q.explanation}</p>
                        <span className="text-slate-500 block">Source: {q.sourceRef}</span>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex justify-end space-x-2 pt-2">
                {quizSubmitted ? (
                  <button
                    onClick={() => {
                      soundEngine.playSfx('click');
                      setQuizSubmitted(false);
                      setSelectedAnswers({});
                    }}
                    className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white flex items-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Reset Quiz</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      soundEngine.playSfx('agent');
                      setQuizSubmitted(true);
                      if (onShowToast) onShowToast('Quiz Evaluated', `Scored ${calculateScore()}/${quizQuestions.length}`);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-lg shadow-emerald-600/30"
                  >
                    Grade Answers
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
