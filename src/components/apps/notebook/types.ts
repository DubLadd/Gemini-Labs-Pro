export type IndexingStatus = 'QUEUED' | 'INDEXING' | 'READY' | 'ERROR';

export interface DocumentChunk {
  id: string;
  page: number;
  section: string;
  text: string;
  isKeyFinding?: boolean;
}

export interface ResearchSource {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'md' | 'txt' | 'code' | 'url';
  tag: string;
  color: string;
  pages: number;
  wordCount: number;
  chunkCount: number;
  status: IndexingStatus;
  indexingProgress: number; // 0 - 100
  selectedForContext: boolean;
  dateAdded: string;
  summary: string;
  chunks: DocumentChunk[];
}

export interface CitationReference {
  id: string;
  sourceId: string;
  sourceName: string;
  page: number;
  section: string;
  excerpt: string;
  isDirectEvidence: boolean; // true = direct evidence (green), false = inference (blue)
  confidence: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  citations?: CitationReference[];
  conflictWarning?: {
    claimA: string;
    sourceA: string;
    claimB: string;
    sourceB: string;
  };
  outOfCorpusNote?: string;
  suggestedFollowUps?: string[];
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  category: 'agent' | 'compute' | 'compiler' | 'hardware' | 'memory';
  sourceIds: string[];
  summary: string;
  x: number;
  y: number;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  citation: string;
  sourceDoc: string;
}

export interface ResearchReport {
  id: string;
  title: string;
  type: 'literature_review' | 'executive_summary' | 'evidence_table';
  date: string;
  content: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  sourceRef: string;
  page: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceRef: string;
}

export interface AudioChapter {
  time: string;
  title: string;
  speaker: 'Alex' | 'Sarah';
  text: string;
}

export interface AudioBriefingConfig {
  format: 'two_hosts' | 'solo_briefing';
  depth: 'deep_dive' | 'executive_summary' | 'critique';
  targetDuration: string;
  chapters: AudioChapter[];
}

export interface ConfirmedFinding {
  id: string;
  claim: string;
  source: string;
  page: number;
  timestamp: string;
}

export type NotebookTheme = 'research_blue' | 'deep_ocean' | 'phosphor_lab';

export type CenterWorkspaceTab =
  | 'viewer'
  | 'graph'
  | 'compare'
  | 'reports'
  | 'study'
  | 'audio';
