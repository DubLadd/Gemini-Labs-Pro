import {
  ResearchSource,
  KnowledgeGraphNode,
  KnowledgeGraphEdge,
  Flashcard,
  QuizQuestion,
  AudioChapter,
  ConfirmedFinding,
} from './types';

export const INITIAL_SOURCES: ResearchSource[] = [
  {
    id: 'src-1',
    name: 'Autonomous_Agents_2026.pdf',
    type: 'pdf',
    tag: 'Agentic AI',
    color: '#38bdf8', // cyan
    pages: 14,
    wordCount: 8420,
    chunkCount: 24,
    status: 'READY',
    indexingProgress: 100,
    selectedForContext: true,
    dateAdded: 'Oct 8, 2026',
    summary:
      'Covers hierarchical planning, bounded memory architectures, and asynchronous tool-calling pipelines for autonomous code generation and error recovery.',
    chunks: [
      {
        id: 'chunk-1-1',
        page: 2,
        section: '1. Introduction & Problem Formulation',
        text: 'Autonomous agents operating in non-deterministic environments must decouple high-level strategic reasoning from low-level deterministic tool invocation. Monolithic prompting structures exhibit cascading hallucinations when task sequences exceed eight discrete steps.',
        isKeyFinding: true,
      },
      {
        id: 'chunk-1-2',
        page: 4,
        section: '2. Bounded Context & Memory Paging',
        text: 'Rather than injecting exhaustive message histories into LLM contexts, modern agents employ structured episodic buffers paired with bounded semantic caches. Benchmarks indicate a 44% reduction in token burn and an 18% improvement in AST semantic correctness when memory depth is capped at 4,000 tokens.',
        isKeyFinding: true,
      },
      {
        id: 'chunk-1-3',
        page: 7,
        section: '3. Asynchronous Execution Models',
        text: 'By dispatching agent workers to execute in isolated sub-threads, the orchestration layer avoids synchronous blocking on compiler passes or test harnesses. In practice, this enables sub-linear task completion curves across multi-file refactoring benchmarks.',
        isKeyFinding: false,
      },
      {
        id: 'chunk-1-4',
        page: 11,
        section: '4. Error Recovery & Invariant Verification',
        text: 'Self-correcting agent loops verify abstract syntax tree (AST) invariants prior to committing diffs. Invariant failures trigger localized backtracking rather than full replanning, preventing destructive cyclic loops.',
        isKeyFinding: true,
      },
    ],
  },
  {
    id: 'src-2',
    name: 'Transformer_Scaling_Laws.md',
    type: 'md',
    tag: 'Compute & Scaling',
    color: '#34d399', // emerald
    pages: 8,
    wordCount: 5120,
    chunkCount: 16,
    status: 'READY',
    indexingProgress: 100,
    selectedForContext: true,
    dateAdded: 'Oct 7, 2026',
    summary:
      'Investigates the Pareto frontier between compute expenditure, pretraining tokens, and inference-time search, demonstrating compute trade-offs.',
    chunks: [
      {
        id: 'chunk-2-1',
        page: 1,
        section: '1. Scaling Frontiers Overview',
        text: 'Cross-entropy test loss scales as a power-law with compute, dataset size, and parameter count, provided model architecture does not bottleneck memory bandwidth. However, downstream task efficacy increasingly depends on inference-time compute scaling rather than pretraining alone.',
        isKeyFinding: true,
      },
      {
        id: 'chunk-2-2',
        page: 3,
        section: '2. Inference-Time Search vs Parameter Growth',
        text: 'Allocating additional FLOPs during token generation via Monte Carlo tree search and verification loops yields performance comparable to models with 4x higher parameter counts trained on equivalent corpus scales.',
        isKeyFinding: true,
      },
      {
        id: 'chunk-2-3',
        page: 6,
        section: '3. Data Saturation & Synthetic Filtering',
        text: 'High-quality synthetic reasoning chains filtered through automated unit test verifiers demonstrate a 3.2x data efficiency multiplier relative to uncurated web crawls.',
        isKeyFinding: false,
      },
    ],
  },
  {
    id: 'src-3',
    name: 'Neural_Compilers_DeepDive.txt',
    type: 'txt',
    tag: 'Execution & JIT',
    color: '#a78bfa', // purple
    pages: 12,
    wordCount: 7600,
    chunkCount: 20,
    status: 'READY',
    indexingProgress: 100,
    selectedForContext: true,
    dateAdded: 'Oct 5, 2026',
    summary:
      'Technical breakdown of Triton kernels, operator fusion, and just-in-time compilation techniques for reducing memory bandwidth bottlenecks in modern attention layers.',
    chunks: [
      {
        id: 'chunk-3-1',
        page: 3,
        section: '1. Memory Bandwidth Dominance',
        text: 'In modern transformer architectures, latency is predominantly constrained by memory bus saturation during KV-cache reads rather than arithmetic tensor-core saturation. High arithmetic intensity is achievable only during batch prefill phases.',
        isKeyFinding: true,
      },
      {
        id: 'chunk-3-2',
        page: 5,
        section: '2. Operator Fusion & JIT Compilation',
        text: 'Fusing normalization, rotary position embeddings (RoPE), and softmax into single-pass hardware kernels eliminates intermediate global memory roundtrips, reducing activation memory overhead by up to 58%.',
        isKeyFinding: true,
      },
      {
        id: 'chunk-3-3',
        page: 9,
        section: '3. Speculative Decoding Kernels',
        text: 'Custom draft-target verification kernels run speculative candidate validation in parallel, achieving effective speedups of 2.1x without altering deterministic greedy or top-p output probability distributions.',
        isKeyFinding: false,
      },
    ],
  },
  {
    id: 'src-4',
    name: 'Memory_Hierarchy_Boundaries.pdf',
    type: 'pdf',
    tag: 'Systems',
    color: '#fbbf24', // amber
    pages: 10,
    wordCount: 6280,
    chunkCount: 18,
    status: 'READY',
    indexingProgress: 100,
    selectedForContext: true,
    dateAdded: 'Oct 3, 2026',
    summary:
      'Examines HBM3e vs SRAM bandwidth limitations, paged attention strategies, and token context memory boundaries in server-class deployments.',
    chunks: [
      {
        id: 'chunk-4-1',
        page: 2,
        section: '1. KV-Cache Growth Dynamics',
        text: 'At a context length of 128k tokens, KV-cache storage demands exceed 16 GB per concurrent batch query on 70B parameter models, displacing model weights unless paged attention or multi-head latent compression is deployed.',
        isKeyFinding: true,
      },
      {
        id: 'chunk-4-2',
        page: 5,
        section: '2. Paged Attention & Fragmentation',
        text: 'Virtual memory paging for key-value caches decreases memory waste from internal fragmentation from 60-80% down to under 4%, directly enabling 2.8x higher throughput on identical GPU hardware clusters.',
        isKeyFinding: true,
      },
    ],
  },
  {
    id: 'src-5',
    name: 'Quantum_Annealing_Study.pdf',
    type: 'pdf',
    tag: 'Hardware Frontiers',
    color: '#f43f5e', // rose
    pages: 6,
    wordCount: 3800,
    chunkCount: 12,
    status: 'READY',
    indexingProgress: 100,
    selectedForContext: false,
    dateAdded: 'Oct 1, 2026',
    summary:
      'Explores physical coherence windows and adiabatic optimization for non-linear constraint satisfaction problems in routing and cryptography.',
    chunks: [
      {
        id: 'chunk-5-1',
        page: 2,
        section: '1. Coherence Time Limits',
        text: 'Superconducting flux qubits face decoherence limits under room-temperature coupling, requiring sub-15mK dilution refrigeration. Adiabatic transition fidelity falls sharply when energy gaps shrink below 12 GHz.',
        isKeyFinding: true,
      },
    ],
  },
];

export const MOCK_GRAPH_NODES: KnowledgeGraphNode[] = [
  {
    id: 'node-planning',
    label: 'Hierarchical Planning',
    category: 'agent',
    sourceIds: ['src-1'],
    summary: 'Decoupling high-level goals into bounded sub-tasks to prevent execution divergence.',
    x: 180,
    y: 120,
  },
  {
    id: 'node-inference-search',
    label: 'Inference-Time Search',
    category: 'compute',
    sourceIds: ['src-2'],
    summary: 'Allocating test-time FLOPs via tree exploration yields equivalent results to 4x model sizes.',
    x: 390,
    y: 110,
  },
  {
    id: 'node-memory-paging',
    label: 'KV-Cache Paging',
    category: 'memory',
    sourceIds: ['src-4', 'src-1'],
    summary: 'Virtual memory abstraction eliminating internal fragmentation across long contexts.',
    x: 230,
    y: 290,
  },
  {
    id: 'node-operator-fusion',
    label: 'Operator Kernel Fusion',
    category: 'compiler',
    sourceIds: ['src-3'],
    summary: 'Fusing attention operations into single-pass hardware kernels to bypass memory bus limits.',
    x: 480,
    y: 280,
  },
  {
    id: 'node-bandwidth-bottleneck',
    label: 'Memory Bandwidth Bounds',
    category: 'hardware',
    sourceIds: ['src-3', 'src-4'],
    summary: 'Inference latency is dictated by HBM read rates during token generation rather than tensor FLOPs.',
    x: 350,
    y: 410,
  },
  {
    id: 'node-ast-verification',
    label: 'AST Invariant Verification',
    category: 'agent',
    sourceIds: ['src-1'],
    summary: 'Validating semantic syntax trees prior to commits to guarantee zero syntax regressions.',
    x: 120,
    y: 220,
  },
];

export const MOCK_GRAPH_EDGES: KnowledgeGraphEdge[] = [
  {
    id: 'edge-1',
    source: 'node-planning',
    target: 'node-inference-search',
    label: 'Guided by test-time FLOPs',
    citation: 'Autonomous_Agents_2026.pdf p.4 ↔ Scaling_Laws.md p.3',
    sourceDoc: 'Transformer_Scaling_Laws.md',
  },
  {
    id: 'edge-2',
    source: 'node-planning',
    target: 'node-memory-paging',
    label: 'Constrained by memory buffers',
    citation: 'Autonomous_Agents_2026.pdf p.4',
    sourceDoc: 'Autonomous_Agents_2026.pdf',
  },
  {
    id: 'edge-3',
    source: 'node-memory-paging',
    target: 'node-bandwidth-bottleneck',
    label: 'Mitigates global memory saturation',
    citation: 'Memory_Hierarchy_Boundaries.pdf p.5',
    sourceDoc: 'Memory_Hierarchy_Boundaries.pdf',
  },
  {
    id: 'edge-4',
    source: 'node-operator-fusion',
    target: 'node-bandwidth-bottleneck',
    label: 'Circumvents memory roundtrips',
    citation: 'Neural_Compilers_DeepDive.txt p.5',
    sourceDoc: 'Neural_Compilers_DeepDive.txt',
  },
  {
    id: 'edge-5',
    source: 'node-inference-search',
    target: 'node-operator-fusion',
    label: 'Accelerated by speculative kernels',
    citation: 'Neural_Compilers_DeepDive.txt p.9',
    sourceDoc: 'Neural_Compilers_DeepDive.txt',
  },
  {
    id: 'edge-6',
    source: 'node-planning',
    target: 'node-ast-verification',
    label: 'Backtracking upon invariant break',
    citation: 'Autonomous_Agents_2026.pdf p.11',
    sourceDoc: 'Autonomous_Agents_2026.pdf',
  },
];

export const MOCK_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    question: 'Why does inference latency scale with memory bandwidth rather than raw compute in generative transformers?',
    answer:
      'During token generation, each token requires reloading model weights and the entire KV-cache from HBM to SRAM for arithmetic operations, creating a low arithmetic-intensity regime constrained by bus throughput.',
    sourceRef: 'Neural_Compilers_DeepDive.txt',
    page: 3,
  },
  {
    id: 'fc-2',
    question: 'What is the performance advantage of inference-time search over parameter scaling?',
    answer:
      'Allocating test-time compute via Monte Carlo search and verifiers achieves accuracy parity with models having up to 4x higher parameter counts trained on equivalent data.',
    sourceRef: 'Transformer_Scaling_Laws.md',
    page: 3,
  },
  {
    id: 'fc-3',
    question: 'How does virtual memory paging for KV-caches reduce memory waste in server clusters?',
    answer:
      'Traditional contiguous allocation wastes 60-80% of cache memory to internal fragmentation. Paged attention allocates cache blocks on demand, reducing waste to under 4% and boosting throughput by 2.8x.',
    sourceRef: 'Memory_Hierarchy_Boundaries.pdf',
    page: 5,
  },
  {
    id: 'fc-4',
    question: 'Why do monolithic prompt histories degrade agentic task performance beyond 8 steps?',
    answer:
      'Unbounded message histories introduce cascading hallucinations and prompt noise. Capping context to episodic caches and AST verifiers reduces token burn by 44% and prevents cyclic failure modes.',
    sourceRef: 'Autonomous_Agents_2026.pdf',
    page: 4,
  },
];

export const MOCK_QUIZ: QuizQuestion[] = [
  {
    id: 'quiz-1',
    question: 'According to Memory_Hierarchy_Boundaries.pdf, at 128k context length, what is the memory footprint of KV-cache on a 70B model?',
    options: [
      'Under 2 GB per concurrent query',
      'Exceeds 16 GB per concurrent query',
      'Scales logarithmically with sequence length',
      'Zero overhead when using float16',
    ],
    correctIndex: 1,
    explanation:
      'At 128k tokens, linear growth in KV-cache entries consumes >16 GB per query on 70B models, requiring paged attention or multi-head latent compression.',
    sourceRef: 'Memory_Hierarchy_Boundaries.pdf (p. 2)',
  },
  {
    id: 'quiz-2',
    question: 'What is the primary mechanism Neural Compilers use to avoid global memory roundtrips?',
    options: [
      'Quantizing weights to 1-bit integers',
      'Operator fusion combining RoPE, Norm, and Softmax in single kernels',
      'Running all calculations exclusively in CPU system RAM',
      'Ignoring past attention tokens',
    ],
    correctIndex: 1,
    explanation:
      'Fusing operations into a single Triton/hardware kernel keeps intermediate tensor activations in SRAM without writing back to HBM.',
    sourceRef: 'Neural_Compilers_DeepDive.txt (p. 5)',
  },
  {
    id: 'quiz-3',
    question: 'In Autonomous_Agents_2026.pdf, how do self-correcting agents handle invariant verification failure?',
    options: [
      'Completely restart planning from step zero',
      'Trigger localized backtracking to the last verified AST invariant',
      'Suppress the error and force git commit',
      'Prompt the human operator synchronously',
    ],
    correctIndex: 1,
    explanation:
      'Localized backtracking isolates the failing sub-step rather than wiping progress, preventing destructive replanning loops.',
    sourceRef: 'Autonomous_Agents_2026.pdf (p. 11)',
  },
];

export const MOCK_AUDIO_BRIEFING: AudioChapter[] = [
  {
    time: '0:00',
    title: 'Introduction & Core Paradox',
    speaker: 'Alex',
    text: "Welcome back to NotebookLabs Research Deep Dive. Today we're looking at a fundamental shift in AI architecture. For years the mantra was simple: make the models bigger, train on more tokens, and wait for emergent capabilities.",
  },
  {
    time: '0:45',
    title: 'The Shift to Inference FLOPs',
    speaker: 'Sarah',
    text: "Right, Alex. But the documents we're reviewing—especially the Transformer Scaling Laws paper and the Autonomous Agents report—paint a radically different picture. They show that allocating FLOPs at inference time, through search and verification, can rival a model four times larger.",
  },
  {
    time: '1:30',
    title: 'Memory Hardware Realities',
    speaker: 'Alex',
    text: "And that's where the hardware papers enter the picture. The Neural Compilers text makes it explicit: modern inference isn't arithmetic-bound. It's choked by the memory bus. When you generate tokens one by one, you're constantly reloading gigabytes of weights and KV-caches.",
  },
  {
    time: '2:15',
    title: 'Operator Fusion & Paged Attention',
    speaker: 'Sarah',
    text: "Exactly. Which explains why techniques like paged attention and Triton operator fusion are yielding such dramatic speedups. It's not about training faster—it's about making memory access sub-linear.",
  },
];

export const INITIAL_CONFIRMED_FINDINGS: ConfirmedFinding[] = [
  {
    id: 'f-1',
    claim: 'Inference-time search with verification achieves parity with models 4x larger in parameter scale.',
    source: 'Transformer_Scaling_Laws.md',
    page: 3,
    timestamp: 'Oct 9, 2026',
  },
  {
    id: 'f-2',
    claim: 'Paged attention reduces KV-cache internal fragmentation from 60-80% down to under 4%, improving throughput by 2.8x.',
    source: 'Memory_Hierarchy_Boundaries.pdf',
    page: 5,
    timestamp: 'Oct 9, 2026',
  },
  {
    id: 'f-3',
    claim: 'Capping agent context to 4k tokens with semantic episodic buffers reduces token burn by 44% and increases AST accuracy by 18%.',
    source: 'Autonomous_Agents_2026.pdf',
    page: 4,
    timestamp: 'Oct 8, 2026',
  },
];
