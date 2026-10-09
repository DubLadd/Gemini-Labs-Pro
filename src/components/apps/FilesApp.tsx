import React, { useState, useRef, useMemo } from 'react';
import lunr from 'lunr';
import { soundEngine } from '../../utils/audio';
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileJson,
  ChevronRight,
  ChevronDown,
  HardDrive,
  Search,
  Download,
  Info,
  Edit3,
  Trash2,
  Upload,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  type: 'file';
  extension: 'md' | 'ts' | 'json' | 'txt';
  size: string;
  modified: string;
  content: string;
}

interface FolderItem {
  id: string;
  name: string;
  type: 'folder';
  children: (FolderItem | FileItem)[];
}

const INITIAL_VIRTUAL_FILE_SYSTEM: FolderItem = {
  id: 'root',
  name: 'LabsDrive (C:)',
  type: 'folder',
  children: [
    {
      id: 'projects',
      name: 'Projects',
      type: 'folder',
      children: [
        {
          id: 'p1',
          name: 'UserOnboarding.ts',
          type: 'file',
          extension: 'ts',
          size: '4.2 KB',
          modified: 'Today, 08:30 AM',
          content: `export class UserOnboardingFlow {
  constructor(private user: UserContext) {}

  public async advance(): Promise<void> {
    await this.telemetry.flush();
    console.log('User advanced successfully');
  }
}`,
        },
        {
          id: 'p2',
          name: 'AuthValidator.test.ts',
          type: 'file',
          extension: 'ts',
          size: '2.8 KB',
          modified: 'Yesterday',
          content: `describe('TokenValidator', () => {
  it('should reject clock-skew tokens > 60s', async () => {
    const result = await validator.verify(expiredPayload);
    expect(result.isValid).toBe(false);
  });
});`,
        },
      ],
    },
    {
      id: 'documents',
      name: 'Documents',
      type: 'folder',
      children: [
        {
          id: 'd1',
          name: 'README.md',
          type: 'file',
          extension: 'md',
          size: '1.5 KB',
          modified: 'Oct 5, 2026',
          content: `# Google Labs OS Shell
Welcome to the Google Labs OS Shell environment.
- High performance web desktop
- Collaborative vibe coding with Putty
- Jules asynchronous coding agent`,
        },
        {
          id: 'd2',
          name: 'system_manifest.json',
          type: 'file',
          extension: 'json',
          size: '850 B',
          modified: 'Oct 1, 2026',
          content: `{
  "os": "Google Labs OS",
  "version": "26.10.5",
  "kernel": "React 19 / Vite",
  "sandbox": "Chrome V8 Isolation"
}`,
        },
      ],
    },
    {
      id: 'system',
      name: 'System Config',
      type: 'folder',
      children: [
        {
          id: 's1',
          name: 'env_vars.txt',
          type: 'file',
          extension: 'txt',
          size: '320 B',
          modified: 'Sep 28, 2026',
          content: `GEMINI_API_KEY=injected_by_runtime
APP_URL=https://labs-os.internal
LOG_LEVEL=verbose`,
        },
      ],
    },
  ],
};

type SortField = 'name' | 'size' | 'modified';
type SortOrder = 'asc' | 'desc';

export const FilesApp: React.FC<{
  onShowToast?: (title: string, msg: string, type?: 'info' | 'success' | 'warn') => void;
}> = ({ onShowToast }) => {
  const [fsRoot, setFsRoot] = useState<FolderItem>(INITIAL_VIRTUAL_FILE_SYSTEM);
  const [currentFolderId, setCurrentFolderId] = useState<string>('root');
  const [folderPath, setFolderPath] = useState<string[]>(['LabsDrive (C:)']);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(
    (INITIAL_VIRTUAL_FILE_SYSTEM.children[0] as FolderItem).children[0] as FileItem
  );
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    root: true,
    projects: true,
    documents: true,
    system: true,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    file: FileItem | null;
  }>({ isOpen: false, x: 0, y: 0, file: null });

  // Rename modal state
  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    file: FileItem | null;
    newName: string;
  }>({ isOpen: false, file: null, newName: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to get all files recursively for Lunr search index
  const getAllFiles = (node: FolderItem): FileItem[] => {
    let files: FileItem[] = [];
    for (const child of node.children) {
      if (child.type === 'file') files.push(child);
      else if (child.type === 'folder') files.push(...getAllFiles(child));
    }
    return files;
  };

  const allFiles = useMemo(() => getAllFiles(fsRoot), [fsRoot]);

  // Build Lunr.js search index
  const searchIndex = useMemo(() => {
    return lunr(function () {
      this.field('name', { boost: 10 });
      this.field('content');
      this.ref('id');
      allFiles.forEach((file) => {
        this.add({
          id: file.id,
          name: file.name,
          content: file.content,
        });
      }, this);
    });
  }, [allFiles]);

  // Search matching IDs across folders using Lunr.js (with wildcard fallback)
  const matchingFileIds = useMemo(() => {
    if (!searchQuery.trim()) return null;
    try {
      const results = searchIndex.search(`${searchQuery}*`);
      return new Set(results.map((r) => r.ref));
    } catch {
      // Fallback substring search if query syntax is complex
      return new Set(
        allFiles
          .filter(
            (f) =>
              f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              f.content.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((f) => f.id)
      );
    }
  }, [searchQuery, searchIndex, allFiles]);

  const findFolderById = (node: FolderItem, id: string): FolderItem | null => {
    if (node.id === id) return node;
    for (const child of node.children) {
      if (child.type === 'folder') {
        const found = findFolderById(child, id);
        if (found) return found;
      }
    }
    return null;
  };

  const currentFolder = findFolderById(fsRoot, currentFolderId) || fsRoot;

  // Determine items to display in the center panel (either filtered by search across folders or current folder children)
  const displayItems = useMemo(() => {
    if (searchQuery.trim() && matchingFileIds) {
      return allFiles.filter((f) => matchingFileIds.has(f.id));
    }
    return currentFolder.children;
  }, [searchQuery, matchingFileIds, allFiles, currentFolder]);

  // Apply sorting
  const sortedDisplayItems = useMemo(() => {
    return [...displayItems].sort((a, b) => {
      // Folders first if mixed
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }

      let valA: any = a.name;
      let valB: any = b.name;

      if (sortField === 'size') {
        const parseSize = (s: string) => {
          if (s.includes('KB')) return parseFloat(s) * 1024;
          if (s.includes('B')) return parseFloat(s);
          return 0;
        };
        valA = a.type === 'file' ? parseSize((a as FileItem).size) : 0;
        valB = b.type === 'file' ? parseSize((b as FileItem).size) : 0;
      } else if (sortField === 'modified') {
        valA = a.type === 'file' ? (a as FileItem).modified : '';
        valB = b.type === 'file' ? (b as FileItem).modified : '';
      } else {
        valA = a.name;
        valB = b.name;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [displayItems, sortField, sortOrder]);

  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playSfx('click');
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleSelectFolder = (folder: FolderItem, pathArr: string[]) => {
    soundEngine.playSfx('click');
    setCurrentFolderId(folder.id);
    setFolderPath(pathArr);
    if (searchQuery) setSearchQuery(''); // clear search when navigating folders
  };

  const handleSelectFile = (file: FileItem) => {
    soundEngine.playSfx('click');
    setSelectedFile(file);
  };

  const handleDownload = (file: FileItem) => {
    soundEngine.playSfx('click');
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    if (onShowToast) {
      onShowToast('File Downloaded', `Successfully downloaded "${file.name}" via browser Blob.`);
    }
  };

  const handleRenameSubmit = () => {
    if (!renameModal.file || !renameModal.newName.trim()) return;
    const fileId = renameModal.file.id;
    const newName = renameModal.newName.trim();

    const renameInTree = (node: FolderItem): FolderItem => {
      const newChildren = node.children.map((child) => {
        if (child.type === 'file' && child.id === fileId) {
          return { ...child, name: newName };
        }
        if (child.type === 'folder') {
          return renameInTree(child);
        }
        return child;
      });
      return { ...node, children: newChildren };
    };

    const updatedRoot = renameInTree(fsRoot);
    setFsRoot(updatedRoot);
    if (selectedFile?.id === fileId) {
      setSelectedFile({ ...selectedFile, name: newName });
    }
    setRenameModal({ isOpen: false, file: null, newName: '' });
    soundEngine.playSfx('click');
    if (onShowToast) {
      onShowToast('File Renamed', `Renamed to "${newName}".`, 'success');
    }
  };

  const handleDeleteFile = (fileId: string) => {
    const deleteInTree = (node: FolderItem): FolderItem => {
      const newChildren = node.children
        .map((child) => {
          if (child.type === 'file' && child.id === fileId) {
            return null;
          }
          if (child.type === 'folder') {
            return deleteInTree(child);
          }
          return child;
        })
        .filter(Boolean) as (FolderItem | FileItem)[];
      return { ...node, children: newChildren };
    };

    const updatedRoot = deleteInTree(fsRoot);
    setFsRoot(updatedRoot);
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }
    soundEngine.playSfx('click');
    if (onShowToast) {
      onShowToast('File Deleted', 'File removed from virtual storage.', 'warn');
    }
  };

  // Ingestion Pipeline for Desktop Uploads
  const handleDesktopFileUpload = async (files: FileList | File[], targetFolderId: string) => {
    for (const file of Array.from(files)) {
      try {
        const textContent = await file.text();
        const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
        const validExt: 'md' | 'ts' | 'json' | 'txt' = ['md', 'ts', 'json', 'txt'].includes(ext)
          ? (ext as any)
          : 'txt';

        const newFileItem: FileItem = {
          id: 'upload_' + Math.random().toString(36).substring(2, 9),
          name: file.name,
          type: 'file',
          extension: validExt,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          modified: 'Just now',
          content: textContent || `// Uploaded file: ${file.name}`,
        };

        if (onShowToast) {
          onShowToast('Ingestion Pipeline', `[QUEUED] Processing ${file.name}...`, 'info');
        }

        setTimeout(() => {
          if (onShowToast) {
            onShowToast(
              'Ingestion Pipeline',
              `[INDEXING] Extracting chunks & embeddings for ${file.name}...`,
              'info'
            );
          }
        }, 700);

        setTimeout(() => {
          const addToFileSystem = (node: FolderItem): FolderItem => {
            if (node.id === targetFolderId) {
              return { ...node, children: [...node.children, newFileItem] };
            }
            const newChildren = node.children.map((child) => {
              if (child.type === 'folder') {
                return addToFileSystem(child);
              }
              return child;
            });
            return { ...node, children: newChildren };
          };

          setFsRoot((prevRoot) => addToFileSystem(prevRoot));
          soundEngine.playSfx('open');
          if (onShowToast) {
            onShowToast(
              'Ingestion Pipeline',
              `[READY] "${file.name}" indexed and ready in virtual storage!`,
              'success'
            );
          }
        }, 1600);
      } catch (err) {
        console.error(err);
        if (onShowToast) {
          onShowToast('Upload Error', `Failed to ingest ${file.name}`, 'warn');
        }
      }
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, file: FileItem) => {
    e.dataTransfer.setData('text/plain', file.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnFolder = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleDesktopFileUpload(e.dataTransfer.files, targetFolderId);
      return;
    }

    const fileId = e.dataTransfer.getData('text/plain');
    if (!fileId) return;

    let fileToMove: FileItem | null = null;

    const removeFile = (folder: FolderItem): FolderItem => {
      const newChildren = folder.children
        .map((child) => {
          if (child.type === 'file' && child.id === fileId) {
            fileToMove = child;
            return null;
          }
          if (child.type === 'folder') {
            return removeFile(child);
          }
          return child;
        })
        .filter(Boolean) as (FolderItem | FileItem)[];
      return { ...folder, children: newChildren };
    };

    const cleanedRoot = removeFile(fsRoot);
    if (!fileToMove) return;

    const addFile = (folder: FolderItem): FolderItem => {
      if (folder.id === targetFolderId) {
        return { ...folder, children: [...folder.children, fileToMove!] };
      }
      const newChildren = folder.children.map((child) => {
        if (child.type === 'folder') {
          return addFile(child);
        }
        return child;
      });
      return { ...folder, children: newChildren };
    };

    const finalRoot = addFile(cleanedRoot);
    setFsRoot(finalRoot);
    soundEngine.playSfx('click');
    if (onShowToast) {
      onShowToast('File Moved', `Successfully moved file to folder.`, 'success');
    }
  };

  const getFileIcon = (ext: string) => {
    if (ext === 'ts') return <FileCode className="w-4 h-4 text-cyan-400" />;
    if (ext === 'json') return <FileJson className="w-4 h-4 text-amber-400" />;
    if (ext === 'md') return <FileText className="w-4 h-4 text-blue-400" />;
    return <FileText className="w-4 h-4 text-slate-400" />;
  };

  // Highlight search query in file name
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-cyan-500/30 text-cyan-200 px-0.5 rounded font-bold underline">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const renderTree = (node: FolderItem | FileItem, path: string[]) => {
    if (node.type === 'file') return null;
    const isExpanded = expandedFolders[node.id];
    const isCurrent = currentFolderId === node.id;

    return (
      <div
        key={node.id}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDropOnFolder(e, node.id)}
        className="select-none text-xs"
      >
        <div
          onClick={() => handleSelectFolder(node, path)}
          className={`flex items-center space-x-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
            isCurrent ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'hover:bg-white/5 text-slate-300'
          }`}
        >
          <button
            onClick={(e) => toggleFolderExpand(node.id, e)}
            className="p-0.5 hover:bg-white/10 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </div>

        {isExpanded && node.children && (
          <div className="pl-4 space-y-0.5 mt-0.5 border-l border-white/10 ml-3">
            {node.children.map((child) => {
              if (child.type === 'folder') {
                return renderTree(child, [...path, child.name]);
              } else {
                const isSelected = selectedFile?.id === child.id;
                return (
                  <div
                    key={child.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, child)}
                    onClick={() => handleSelectFile(child)}
                    className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing transition-colors group ${
                      isSelected ? 'bg-cyan-600/30 text-white font-medium' : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      {getFileIcon(child.extension)}
                      <span className="truncate">{child.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(child);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded text-cyan-300 transition-opacity"
                      title={`Download ${child.name}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={() => setContextMenu({ isOpen: false, x: 0, y: 0, file: null })}
      className="flex-1 flex h-full overflow-hidden bg-slate-950/80 text-slate-100 font-sans select-none relative"
    >
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files) {
            handleDesktopFileUpload(e.target.files, currentFolder.id);
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      {/* Left Sidebar: Directory Tree */}
      <div className="w-64 bg-white/[0.02] border-r border-white/10 p-3 flex flex-col shrink-0">
        <div className="flex items-center space-x-2 pb-2 mb-2 border-b border-white/10 text-xs font-semibold text-slate-300 justify-between">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span>Labs Virtual Storage</span>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 hover:bg-white/10 rounded text-cyan-400 transition-colors"
            title="Upload Files"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {renderTree(fsRoot, ['LabsDrive (C:)'])}
        </div>
      </div>

      {/* Center: File List */}
      <div
        onDragOver={handleDragOver}
        onDrop={(e) => handleDropOnFolder(e, currentFolder.id)}
        className="flex-1 flex flex-col border-r border-white/10 overflow-hidden bg-slate-950/40"
      >
        {/* Breadcrumb Path Bar */}
        <div className="h-10 bg-white/5 border-b border-white/10 px-4 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center space-x-1.5 text-slate-300 font-mono">
            {searchQuery ? (
              <span className="text-cyan-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Lunr Search Results for "{searchQuery}" ({sortedDisplayItems.length})
              </span>
            ) : (
              folderPath.map((seg, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-slate-500">/</span>}
                  <span className={i === folderPath.length - 1 ? 'text-cyan-400 font-semibold' : ''}>
                    {seg}
                  </span>
                </React.Fragment>
              ))
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/30 flex items-center space-x-1.5 text-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across folders (Lunr)..."
                className="bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-52"
              />
            </div>
          </div>
        </div>

        {/* Sorting Controls Bar */}
        <div className="h-9 bg-white/[0.02] border-b border-white/10 px-4 flex items-center justify-between text-[11px] text-slate-300 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort by:
            </span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="bg-black/50 border border-white/15 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="modified">Modified Date</option>
            </select>
          </div>
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            }}
            className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-cyan-300 transition-colors flex items-center gap-1"
            title="Toggle Sort Order"
          >
            <span>{sortOrder === 'asc' ? 'Ascending (A-Z)' : 'Descending (Z-A)'}</span>
          </button>
        </div>

        {/* Desktop File Drop Zone Banner */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropOnFolder(e, currentFolder.id)}
          onClick={() => fileInputRef.current?.click()}
          className="mx-3 mt-3 p-2.5 border-2 border-dashed border-white/15 hover:border-cyan-500/50 rounded-xl bg-white/[0.02] hover:bg-cyan-500/[0.03] cursor-pointer flex items-center justify-center space-x-2 text-slate-400 hover:text-slate-200 transition-all text-xs shrink-0"
        >
          <Upload className="w-4 h-4 text-cyan-400" />
          <span>
            Drag & drop desktop files here or click to ingest into{' '}
            <strong className="text-cyan-300">{currentFolder.name}</strong>
          </span>
        </div>

        {/* Files Grid / List */}
        <div className="flex-1 p-3 overflow-y-auto">
          {sortedDisplayItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
              <Search className="w-8 h-8 mb-2 opacity-40" />
              <p>No matching files found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sortedDisplayItems.map((item) => {
                if (item.type === 'folder') {
                  return (
                    <div
                      key={item.id}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDropOnFolder(e, item.id)}
                      onClick={() => handleSelectFolder(item, [...folderPath, item.name])}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 cursor-pointer flex items-center space-x-3 transition-all group"
                    >
                      <FolderOpen className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <p className="text-xs font-medium text-slate-200">
                          {highlightMatch(item.name, searchQuery)}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {(item as FolderItem).children.length} items
                        </p>
                      </div>
                    </div>
                  );
                } else {
                  const isSelected = selectedFile?.id === item.id;
                  const fileItem = item as FileItem;
                  return (
                    <div
                      key={fileItem.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, fileItem)}
                      onClick={() => handleSelectFile(fileItem)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({
                          isOpen: true,
                          x: e.clientX,
                          y: e.clientY,
                          file: fileItem,
                        });
                      }}
                      className={`p-3 rounded-xl border cursor-grab active:cursor-grabbing flex items-center justify-between transition-all group ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500/50'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-2 rounded-lg bg-white/5 group-hover:scale-110 transition-transform shrink-0">
                          {getFileIcon(fileItem.extension)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-200 truncate">
                            {highlightMatch(fileItem.name, searchQuery)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {fileItem.size} · {fileItem.modified}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(fileItem);
                          }}
                          className="p-1.5 hover:bg-white/15 rounded-lg text-slate-300 hover:text-cyan-300 transition-colors"
                          title={`Download ${fileItem.name}`}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: File Preview Pane */}
      <div className="w-80 sm:w-96 bg-slate-900/90 flex flex-col shrink-0 select-text">
        <div className="h-10 bg-white/5 border-b border-white/10 px-4 flex items-center justify-between text-xs font-semibold text-slate-200 shrink-0">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>File Preview</span>
          </span>
          {selectedFile && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() =>
                  setRenameModal({ isOpen: true, file: selectedFile, newName: selectedFile.name })
                }
                className="p-1.5 hover:bg-white/10 rounded text-slate-300 hover:text-white transition-colors"
                title="Rename File"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDeleteFile(selectedFile.id)}
                className="p-1.5 hover:bg-white/10 rounded text-rose-400 hover:text-rose-300 transition-colors"
                title="Delete File"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDownload(selectedFile)}
                className="p-1.5 hover:bg-white/10 rounded text-cyan-400 transition-colors"
                title="Download File"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {selectedFile ? (
          <div className="flex-1 p-4 flex flex-col overflow-hidden">
            <div className="mb-3 pb-3 border-b border-white/10 space-y-1">
              <div className="flex items-center space-x-2">
                {getFileIcon(selectedFile.extension)}
                <h4 className="text-xs font-bold text-white truncate">{selectedFile.name}</h4>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Size: {selectedFile.size} · Modified: {selectedFile.modified}
              </p>
            </div>

            {/* Code / Text Preview */}
            <div className="flex-1 bg-black/60 border border-white/10 rounded-xl p-3 font-mono text-[11px] text-emerald-300 overflow-y-auto leading-relaxed whitespace-pre-wrap">
              {selectedFile.content}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 text-xs">
            <FileText className="w-8 h-8 mb-2 opacity-40" />
            <p>Select a file to preview its content.</p>
          </div>
        )}
      </div>

      {/* Context Menu Popup */}
      {contextMenu.isOpen && contextMenu.file && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="absolute z-50 w-44 bg-slate-900 border border-white/15 rounded-xl shadow-2xl py-1.5 text-xs text-slate-200 select-none backdrop-blur-xl"
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 border-b border-white/10 truncate">
            {contextMenu.file.name}
          </div>
          <button
            onClick={() => {
              if (contextMenu.file) handleDownload(contextMenu.file);
              setContextMenu({ isOpen: false, x: 0, y: 0, file: null });
            }}
            className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors text-left"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download</span>
          </button>
          <button
            onClick={() => {
              if (contextMenu.file) {
                setRenameModal({ isOpen: true, file: contextMenu.file, newName: contextMenu.file.name });
              }
              setContextMenu({ isOpen: false, x: 0, y: 0, file: null });
            }}
            className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-white/10 transition-colors text-left"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Rename</span>
          </button>
          <button
            onClick={() => {
              if (contextMenu.file) {
                handleDeleteFile(contextMenu.file.id);
              }
              setContextMenu({ isOpen: false, x: 0, y: 0, file: null });
            }}
            className="w-full flex items-center space-x-2 px-3 py-2 hover:bg-rose-500/20 hover:text-rose-300 transition-colors text-left border-t border-white/10 text-rose-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {/* Rename Modal */}
      {renameModal.isOpen && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white">Rename File</h3>
            <input
              type="text"
              value={renameModal.newName}
              onChange={(e) => setRenameModal({ ...renameModal, newName: e.target.value })}
              className="w-full bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') setRenameModal({ isOpen: false, file: null, newName: '' });
              }}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRenameModal({ isOpen: false, file: null, newName: '' })}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameSubmit}
                className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
