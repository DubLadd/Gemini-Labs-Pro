import React, { useState } from 'react';
import { KnowledgeGraphNode, KnowledgeGraphEdge, ResearchSource } from './types';
import { soundEngine } from '../../../utils/audio';
import {
  Share2,
  FileText,
  Info,
  ExternalLink,
  Search,
  Maximize2,
} from 'lucide-react';

interface KnowledgeGraphProps {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  sources: ResearchSource[];
  onOpenSourceViewer?: (sourceId: string) => void;
  onShowToast?: (title: string, msg: string) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  nodes,
  edges,
  sources,
  onOpenSourceViewer,
  onShowToast,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('node-planning');
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  const filteredNodes = nodes.filter((n) => {
    const matchesCat = filterCategory === 'all' || n.category === filterCategory;
    const matchesSearch = n.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getNodeColor = (cat: string) => {
    switch (cat) {
      case 'agent':
        return '#38bdf8'; // cyan
      case 'compute':
        return '#34d399'; // emerald
      case 'compiler':
        return '#a78bfa'; // purple
      case 'memory':
        return '#fbbf24'; // amber
      case 'hardware':
        return '#f43f5e'; // rose
      default:
        return '#60a5fa';
    }
  };

  const handleNodeClick = (node: KnowledgeGraphNode) => {
    soundEngine.playSfx('click');
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
  };

  const handleEdgeClick = (edge: KnowledgeGraphEdge) => {
    soundEngine.playSfx('click');
    setSelectedEdgeId(edge.id);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070b14] select-none text-slate-100 overflow-hidden font-sans">
      {/* Graph Toolbar */}
      <div className="h-12 px-4 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white leading-tight">Cross-Document Knowledge Graph</h3>
            <p className="text-[10px] text-slate-400">
              {nodes.length} Concepts · {edges.length} Evidence-Linked Relationships
            </p>
          </div>
        </div>

        {/* Filter categories */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find concept..."
              className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 w-32"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-900 border border-white/10 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-cyan-400"
          >
            <option value="all">All Domains</option>
            <option value="agent">Agentic AI</option>
            <option value="compute">Compute & Scaling</option>
            <option value="compiler">Neural Compilers</option>
            <option value="memory">KV-Cache & Memory</option>
            <option value="hardware">Hardware Bottlenecks</option>
          </select>
        </div>
      </div>

      {/* Main Graph Canvas + Detail Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* SVG Interactive Canvas */}
        <div className="flex-1 relative overflow-hidden bg-radial from-slate-900/60 to-black p-4">
          <svg className="w-full h-full min-h-[420px]" viewBox="0 0 640 480">
            {/* Defs for gradients & glowing drop shadows */}
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Connecting Edges */}
            {edges.map((edge) => {
              const srcNode = nodes.find((n) => n.id === edge.source);
              const tgtNode = nodes.find((n) => n.id === edge.target);
              if (!srcNode || !tgtNode) return null;

              const isEdgeSelected = selectedEdgeId === edge.id;
              const isConnectedToSelectedNode =
                selectedNodeId === edge.source || selectedNodeId === edge.target;

              return (
                <g key={edge.id} className="cursor-pointer" onClick={() => handleEdgeClick(edge)}>
                  <line
                    x1={srcNode.x}
                    y1={srcNode.y}
                    x2={tgtNode.x}
                    y2={tgtNode.y}
                    stroke={isEdgeSelected ? '#38bdf8' : isConnectedToSelectedNode ? '#60a5fa' : '#334155'}
                    strokeWidth={isEdgeSelected ? 3 : isConnectedToSelectedNode ? 2 : 1.2}
                    strokeDasharray={edge.label.includes('Backtracking') ? '4,4' : 'none'}
                    className="transition-all hover:stroke-cyan-400"
                  />
                  {/* Midpoint relation pill */}
                  <rect
                    x={(srcNode.x + tgtNode.x) / 2 - 35}
                    y={(srcNode.y + tgtNode.y) / 2 - 9}
                    width={70}
                    height={18}
                    rx={4}
                    fill="#090d16"
                    stroke={isEdgeSelected ? '#38bdf8' : '#1e293b'}
                    strokeWidth={1}
                  />
                  <text
                    x={(srcNode.x + tgtNode.x) / 2}
                    y={(srcNode.y + tgtNode.y) / 2 + 3}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize={8}
                    fontFamily="monospace"
                  >
                    {edge.label.length > 14 ? edge.label.substring(0, 13) + '..' : edge.label}
                  </text>
                </g>
              );
            })}

            {/* Interactive Concept Nodes */}
            {filteredNodes.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const color = getNodeColor(node.category);

              return (
                <g
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className="cursor-pointer group transition-transform"
                >
                  {/* Outer halo */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 26 : 20}
                    fill={color}
                    fillOpacity={isSelected ? 0.25 : 0.12}
                    stroke={color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    filter={isSelected ? 'url(#glow)' : undefined}
                  />
                  {/* Inner node center */}
                  <circle cx={node.x} cy={node.y} r={isSelected ? 10 : 8} fill={color} />

                  {/* Label */}
                  <text
                    x={node.x}
                    y={node.y + 36}
                    textAnchor="middle"
                    fill={isSelected ? '#ffffff' : '#cbd5e1'}
                    fontSize={10}
                    fontWeight={isSelected ? 600 : 500}
                    fontFamily="sans-serif"
                    className="drop-shadow"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Quick Legend Bar */}
          <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-white/10 rounded-xl px-3 py-1.5 flex items-center space-x-3 text-[10px] text-slate-300 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Agentic
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Compute
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              Compiler
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Memory
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Hardware
            </span>
          </div>
        </div>

        {/* Right Detail Inspector Drawer */}
        <div className="w-80 border-l border-white/10 bg-slate-950/95 p-4 flex flex-col shrink-0 overflow-y-auto">
          {selectedEdge ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
                  <Info className="w-3.5 h-3.5" />
                  Evidence Relationship
                </span>
              </div>
              <p className="text-xs font-semibold text-white">{selectedEdge.label}</p>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-xs text-slate-300">
                <span className="text-[10px] text-cyan-400 font-mono font-semibold block">Grounded Citation:</span>
                <p className="font-serif italic text-slate-200">↳ {selectedEdge.citation}</p>
                <p className="text-[10px] text-slate-400 font-mono">Source: {selectedEdge.sourceDoc}</p>
              </div>
            </div>
          ) : selectedNode ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
                  <Info className="w-3.5 h-3.5" />
                  Concept Node
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono capitalize"
                  style={{ backgroundColor: `${getNodeColor(selectedNode.category)}25`, color: getNodeColor(selectedNode.category) }}
                >
                  {selectedNode.category}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white">{selectedNode.label}</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{selectedNode.summary}</p>

              {/* Linked Sources */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block font-mono">
                  Substantiating Documents:
                </span>
                {selectedNode.sourceIds.map((sid) => {
                  const src = sources.find((s) => s.id === sid);
                  if (!src) return null;
                  return (
                    <div
                      key={src.id}
                      onClick={() => onOpenSourceViewer && onOpenSourceViewer(src.id)}
                      className="p-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-400/40 cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="text-xs text-slate-200 font-medium truncate group-hover:text-cyan-300">
                          {src.name}
                        </span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-cyan-400 shrink-0 ml-1" />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs text-center p-6">
              <Share2 className="w-8 h-8 opacity-30 mb-2" />
              <p>Click any node or relationship edge to inspect underlying evidence citations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
