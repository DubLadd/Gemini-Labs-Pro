export interface FileItem {
  id: string;
  name: string;
  type: 'file';
  extension: 'md' | 'ts' | 'json' | 'txt' | 'js' | 'png' | 'html';
  size: string;
  modified: string;
  content: string;
}

export interface FolderItem {
  id: string;
  name: string;
  type: 'folder';
  children: (FolderItem | FileItem)[];
}

export const INITIAL_VIRTUAL_FILE_SYSTEM: FolderItem = {
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
        {
          id: 'p3',
          name: 'GameCanvasEngine.ts',
          type: 'file',
          extension: 'ts',
          size: '6.4 KB',
          modified: 'Today, 10:14 AM',
          content: `// 60FPS Hardware accelerated canvas loop
export function runGameLoop(engine: GameEngine, ctx: CanvasRenderingContext2D) {
  let last = performance.now();
  function step(now: number) {
    const dt = (now - last) / 1000;
    engine.update(dt);
    engine.render(ctx);
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}`,
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
- Jules asynchronous coding agent
- Playground Studio & Mini Apps Game Engine
- Global Shell Search (Ctrl+K) & Window Snapping`,
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
  "sandbox": "Chrome V8 Isolation",
  "features": [
    "Global Shell Search",
    "Window Snapping & Layouts",
    "Offline MiniApps PWA"
  ]
}`,
        },
        {
          id: 'd3',
          name: 'QuantumNotes.md',
          type: 'file',
          extension: 'md',
          size: '2.1 KB',
          modified: 'Yesterday',
          content: `# Research Notes: Quantum Dimension Runner
Investigating real-time gravity inversion dynamics.
- Peak velocity: 420px/s
- Flip cooldown: 0.35s
- Laser gate frequency: 1.8Hz cycle`,
        },
      ],
    },
    {
      id: 'miniapps_folder',
      name: 'MiniApps',
      type: 'folder',
      children: [
        {
          id: 'ma1',
          name: 'CyberRogue.miniapp.json',
          type: 'file',
          extension: 'json',
          size: '14.2 KB',
          modified: 'Today, 09:15 AM',
          content: JSON.stringify(
            {
              id: 'cyber-rogue',
              title: 'Cyber Rogue: Neon Dungeon Crawl',
              version: '1.2.0',
              genre: 'Dungeon Crawler',
              status: 'Installed & Pinned',
              upgradesCount: 5,
              engine: 'Mini Apps Web Canvas',
            },
            null,
            2
          ),
        },
        {
          id: 'ma2',
          name: 'SpckCyberRacer.miniapp.json',
          type: 'file',
          extension: 'json',
          size: '8.6 KB',
          modified: 'Today, 09:30 AM',
          content: JSON.stringify(
            {
              id: 'spck-cyber-racer',
              title: 'SPCK Cyber Racer: Turbo Highway',
              version: '1.0.0',
              genre: 'SPCK Port',
              status: 'Installed & Pinned',
              sourcePackage: 'spck-cyber-racer.zip',
              engine: 'Node.js SPCK Web Canvas',
            },
            null,
            2
          ),
        },
        {
          id: 'ma3',
          name: 'GraviFlip.miniapp.json',
          type: 'file',
          extension: 'json',
          size: '11.0 KB',
          modified: 'Yesterday',
          content: JSON.stringify(
            {
              id: 'gravi-flip',
              title: 'Gravi-Flip: Quantum Dimension',
              version: '1.1.0',
              genre: 'Platformer',
              status: 'Installed & Pinned',
            },
            null,
            2
          ),
        },
        {
          id: 'ma4',
          name: 'Starfire2088.miniapp.json',
          type: 'file',
          extension: 'json',
          size: '9.8 KB',
          modified: 'Today, 10:00 AM',
          content: JSON.stringify(
            {
              id: 'starfire-defender',
              title: 'Starfire 2088: Orbital Defense',
              version: '1.3.0',
              genre: 'Shooter',
              status: 'Installed',
            },
            null,
            2
          ),
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
        {
          id: 's2',
          name: 'shell_shortcuts.json',
          type: 'file',
          extension: 'json',
          size: '540 B',
          modified: 'Today, 07:45 AM',
          content: `{
  "globalSearch": "Ctrl+K or Alt+Space",
  "fullscreen": "F11",
  "snapLeft": "Alt+Left",
  "snapRight": "Alt+Right",
  "snapMaximize": "Alt+Up",
  "restoreWindow": "Alt+Down"
}`,
        },
      ],
    },
  ],
};

const FS_STORAGE_KEY = 'labs_virtual_fs_v1';

export function getVirtualFileSystem(): FolderItem {
  try {
    const raw = localStorage.getItem(FS_STORAGE_KEY);
    if (!raw) return INITIAL_VIRTUAL_FILE_SYSTEM;
    const parsed = JSON.parse(raw);
    return parsed?.children ? parsed : INITIAL_VIRTUAL_FILE_SYSTEM;
  } catch {
    return INITIAL_VIRTUAL_FILE_SYSTEM;
  }
}

export function saveVirtualFileSystem(root: FolderItem): void {
  try {
    localStorage.setItem(FS_STORAGE_KEY, JSON.stringify(root));
  } catch {
    // Ignore storage quota
  }
}

export interface FlattenedFile {
  file: FileItem;
  path: string;
  folderName: string;
}

export function getAllFlatFiles(root: FolderItem = getVirtualFileSystem(), currentPath = ''): FlattenedFile[] {
  const result: FlattenedFile[] = [];
  const base = currentPath ? `${currentPath}/${root.name}` : root.name;

  for (const item of root.children) {
    if (item.type === 'file') {
      result.push({
        file: item,
        path: `${base}/${item.name}`,
        folderName: root.name,
      });
    } else if (item.type === 'folder') {
      result.push(...getAllFlatFiles(item, base));
    }
  }

  return result;
}
