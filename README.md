# Google Labs OS Shell & Flow Music Producer Studio

A high-performance, in-browser Web OS desktop environment featuring **Google Flow Music Producer**, **ASCII Art Matrix Studio**, **Jules Asynchronous Coding Agent**, **Labs Shell Terminal**, and a full suite of interactive creative experiments.

Built with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Vite**, **Web Audio API DSP Synthesis**, and **Google GenAI (Gemini)**.

---

## 🌟 Highlights & Capabilities

- 🎛️ **Google Flow Music Producer (`MusicFXApp` / `flowAudioEngine.ts`)**:
  - Full Web Audio API modular synthesis engine (no external audio assets required).
  - Multi-genre blending and mutation: *Techno, Stone Techno, Industrial Techno, Drum & Bass, Dubstep, Trap Phonk, Lo-Fi, Chill, Hip Hop, Grunge, Synthwave, Electronic*.
  - Custom DSP audio FX rack: Overdrive Distortion, Haunted Flanger, Dub Delay & Echo, Cavern Reverb, Bounce Drop Riser.
  - 16-step polyphonic drum & synth sequencer with BPM control, swing, mute, and solo.
  - Real-time 16-band FFT audio frequency analyzer exposing bass/mid/treble metrics for system-wide audio-reactive visuals.
  - AI Lyric Writer & Style Forge powered by Gemini API.

- 🖥️ **ASCII Art Matrix Studio (`AsciiApp` / `asciiWebRTC.ts`)**:
  - Real-time image and live webcam rasterization into colored ASCII characters.
  - Audio-reactive ASCII character pulsation and glyph morphing driven by the Flow Music engine.
  - P2P WebRTC live broadcast and remote receiver for streaming ASCII video across OS clients.
  - Reusable Art Presets with import/export to JSON and live inline canvas thumbnail previews.

- 🤖 **Jules Coding Agent (`JulesApp`)**:
  - Real-time D3.js hierarchical task graph visualizer showing AST parsing and test cycles.

- 💻 **Labs Shell Terminal (`TerminalApp`)**:
  - Realistic typewriter output animation, command history persisted in `localStorage`, and theme switching (`theme matrix`, `cyberpunk`, `minimal`, `dracula`, `synthwave`, `amber`).

- 🎮 **Playground Studio // Game & App Forge (`ArcadeApp`)**:
  - **ZIP Archive & SPCK Node.js Integration**: Upload and unpack `.zip` archives directly in-browser. Inspect extracted files (`index.html`, `main.js`, `game.js`, `package.json`), automatically bridge code to the engine, or download your games as full `.zip` bundles ready for web hosting or the SPCK editor.
  - **Prompt-to-Game AI Synthesizer**: Upload game source or `.zip` packages to attach as reference context and prompt Gemini 3.8 Flash to adapt, modernize, or add custom boss encounters.
  - **Sprite Forge & Pixel Animator**: 16×16 pixel art editor with frame animation reel, palette swatches, and live sprite engine injection.
  - **Tilemap Level Forge**: 28×21 visual grid level designer with solid walls, pass-through platforms, hazard spikes, keys, and gates.
  - **SFX Synth Forge**: Web Audio API retro chiptune synthesizer with oscilloscope waveform visualizer.
  - **Particle FX Designer**: Interactive real-time particle emitter sandbox.
  - **In-Cabinet Debug Inspector**: Live collision hitboxes, slow-motion time scaling, frame stepping, quick cheats, and interactive REPL console.

- 📦 **Mini Apps Engine & Game Launcher (`MiniAppsApp`)**:
  - **Standalone Mini App Execution**: Run lightweight game mini apps in their own dedicated player window with virtual D-Pad and [A]/[B] action buttons, audio synthesis, and high score tracking.
  - **Desktop Pinning**: Pin any installed game mini app directly to the OS Desktop as an independent shortcut with custom icons and mini badges.
  - **In-Place AI Upgrades ("Maybe later we do some upgrades")**: Upgrade games on the fly without losing high scores. 1-Click upgrade presets (Hyper-Charge Shields, Boss Encounters, Cyberpunk Glow & Bloom, Multi-Harmonic Synth, Bullet-Time Slow-Mo) or custom AI prompts, bumping versions (e.g. `v1.0.0` -> `v1.1.0`) with real-time changelogs.
  - **SPCK Node.js & ZIP Package Integration**: Drop or upload any `.zip` or `.js` package to unpack and install immediately as a standalone Mini App.
  - **Full ZIP Export**: Export any Mini App into a complete bundle containing `index.html`, `game.js`, `package.json`, and `README.md` for sharing or testing in SPCK / Node.js.
  - **Playground Studio Bridge**: One-click jump to Playground Studio for deep sprite, tilemap, and SFX modding.

- 🪟 **Desktop Window Management**:
  - Drag-and-drop window positioning, smooth resizing, z-indexing, minimize/maximize.
  - Start menu, system tray clock, quick settings, audio toggle, and desktop wallpaper engine.

---

## 🚀 Quickstart & Replication

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm**, **pnpm**, or **yarn**

### 2. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd google-labs-os

# Install packages
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Add your Gemini API key (optional for core OS & audio synthesis, required for AI lyrics generation):

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run Development Server

```bash
npm run dev
```

Open your browser at `http://localhost:3000`.

### 5. Production Build

```bash
npm run build
npm run preview
```

---

## 📂 Project Architecture

```
├── metadata.json                 # AI Studio applet configuration & capabilities
├── package.json                  # Dependencies & scripts
├── vite.config.ts                # Vite config with React & Tailwind plugins
└── src/
    ├── App.tsx                   # OS Root Shell (Window manager, taskbar, desktop)
    ├── main.tsx                  # React DOM entrypoint
    ├── index.css                 # Global styles & Tailwind CSS v4 setup
    ├── types/
    │   └── os.ts                 # WindowState, AppId, AppConfig, Wallpaper definitions
    ├── data/
    │   └── apps.ts               # App catalog, default window dimensions, icons, wallpapers
    ├── utils/
    │   ├── audio.ts              # System UI sound effects engine (beeps, clicks, toasts)
    │   ├── flowAudioEngine.ts    # Web Audio API multi-genre DSP synthesizer & sequencer
    │   └── asciiWebRTC.ts        # P2P WebRTC data broadcast & receiver protocol
    └── components/
        ├── layout/               # WindowFrame, Taskbar, StartMenu, SystemTray, Widgets
        └── apps/                 # Desktop Application Components:
            ├── MusicFXApp.tsx    # Flow Music Producer & Lyric Forge UI
            ├── AsciiApp.tsx      # ASCII Art Studio with webcam & WebRTC broadcast
            ├── JulesApp.tsx      # Jules Agent internal queue D3 graph
            ├── TerminalApp.tsx   # Shell terminal with themes and typewriter effect
            ├── NotebookApp.tsx   # NotebookLM research laboratory
            ├── BrainstormerApp.tsx# Brainstorming & mindmap canvas
            ├── PuttyApp.tsx      # Play with Putty vibe coding
            ├── PromptLabApp.tsx  # Prompt Studio & GenAI tester
            ├── ScienceLabApp.tsx # Scientific data visualization & research
            ├── ArcadeApp.tsx     # Game studio & emulator
            ├── FilesApp.tsx      # File manager
            └── SettingsApp.tsx   # Wallpapers, sound volume & system preferences
```

---

## 🎵 Using & Integrating the Flow Music DSP Engine

The audio synthesizer lives in `src/utils/flowAudioEngine.ts` as a standalone singleton (`flowAudioEngine`). You can import and use it in any custom tool or outside project.

### 1. Basic Playback & Sequencer

```typescript
import { flowAudioEngine, FLOW_GENRES, TrackSequence } from './utils/flowAudioEngine';

// 1. Set sequencer tempo (BPM)
flowAudioEngine.setBpm(130);

// 2. Define tracks (kick, snare, hihat, bass, perc)
const tracks: TrackSequence[] = [
  {
    id: 'kick-1',
    name: 'Kick',
    type: 'kick',
    color: '#ef4444',
    steps: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],
    volume: 0.9,
    isMuted: false,
    isSolo: false,
  },
  {
    id: 'bass-1',
    name: 'Sub Bass',
    type: 'bass',
    color: '#8b5cf6',
    steps: [true, false, true, false, false, true, false, false, true, false, true, false, false, true, false, false],
    volume: 0.85,
    isMuted: false,
    isSolo: false,
  }
];

// 3. Start playback with desired genre mutation
flowAudioEngine.startSequencer(
  tracks,
  ['industrial_techno', 'dubstep'], // Blend multiple genres!
  (stepIndex) => {
    console.log(`Current 16th-step: ${stepIndex}`);
  }
);

// 4. Stop playback
flowAudioEngine.stopSequencer();
```

### 2. Hooking Up Audio-Reactive Visuals (FFT Analysis)

To make any UI element, 3D mesh, or canvas pulse to the beat:

```typescript
import { flowAudioEngine } from './utils/flowAudioEngine';

// Inside a requestAnimationFrame loop or useEffect:
function animate() {
  const analysis = flowAudioEngine.getAudioAnalysis();

  // Normalized values (0.0 to 1.0)
  const bass = analysis.bass;       // Kick & sub-bass energy
  const mid = analysis.mid;         // Snares & synths
  const treble = analysis.treble;   // Hi-hats & noise
  const rawFft = analysis.frequencyData; // Full Uint8Array frequency bins

  // Example: Scale a UI element on kick hits
  const scale = 1 + bass * 0.25;
  document.getElementById('visualizer-box').style.transform = `scale(${scale})`;

  requestAnimationFrame(animate);
}
```

### 3. Microphone Room Input Mode

To feed live microphone input instead of the sequencer:

```typescript
// Enable live mic input
await flowAudioEngine.enableMicInput();

// Disable live mic
flowAudioEngine.disableMicInput();
```

---

## 🛠️ Step-by-Step: Adding Your Own Tool / App to the OS

Adding a custom app to the desktop takes only 4 quick steps:

### Step 1: Create your React Component
Create `src/components/apps/MyCustomToolApp.tsx`:

```tsx
import React, { useState } from 'react';
import { Sparkles, Play } from 'lucide-react';

interface MyCustomToolProps {
  onShowToast?: (title: string, message: string) => void;
}

export const MyCustomToolApp: React.FC<MyCustomToolProps> = ({ onShowToast }) => {
  const [status, setStatus] = useState('Idle');

  const handleAction = () => {
    setStatus('Running...');
    if (onShowToast) onShowToast('Tool Started', 'Processing payload!');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0814] text-slate-100 p-6">
      <div className="flex items-center gap-3 pb-4 border-b border-purple-500/20">
        <Sparkles className="w-5 h-5 text-fuchsia-400" />
        <h2 className="text-lg font-bold">My Custom Tool Studio</h2>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-slate-300">Status: {status}</p>
        <button
          onClick={handleAction}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white font-semibold text-xs flex items-center gap-2 hover:scale-105 transition"
        >
          <Play className="w-4 h-4" /> Run Action
        </button>
      </div>
    </div>
  );
};
```

### Step 2: Register the `AppId` in `src/types/os.ts`
Add your app's ID to the union type:

```typescript
export type AppId =
  | 'jules'
  | 'putty'
  | 'musicfx'
  | 'ascii'
  | 'mycustomtool' // <-- Add your ID here
  // ... other apps
```

### Step 3: Register Metadata in `src/data/apps.ts`
Add the configuration and icon:

```typescript
export const APPS: Record<string, AppConfig> = {
  // ... existing apps
  mycustomtool: {
    id: 'mycustomtool',
    title: 'My Custom Tool Studio',
    shortTitle: 'Custom Tool',
    icon: 'Sparkles', // Any Lucide icon name
    color: 'from-fuchsia-500 via-purple-600 to-indigo-600',
    defaultWidth: 860,
    defaultHeight: 560,
  },
};
```

### Step 4: Mount inside `<WindowFrame>` in `src/App.tsx`
Import your component and render it inside the window mapping:

```tsx
import { MyCustomToolApp } from './components/apps/MyCustomToolApp';

// Inside the windows.map loop:
<WindowFrame ...>
  {win.id === 'mycustomtool' && <MyCustomToolApp onShowToast={showToast} />}
  {/* other apps */}
</WindowFrame>
```

Your app will automatically:
1. Appear in the desktop **Start Menu**.
2. Be launchable from the desktop **Taskbar**.
3. Be launchable from the **Terminal** via `launch mycustomtool`.
4. Support window dragging, resizing, focus stacking, and minimize/maximize.

---

## 🎨 Theme & Styling System

- **Tailwind CSS v4**: Imported through `@import "tailwindcss";` in `src/index.css`.
- **System Sound Engine (`src/utils/audio.ts`)**: Built-in Web Audio sound effects for clicks, window opens, error chirps, and success notifications (`soundEngine.playSfx('click')`).
- **Wallpapers**: Change wallpapers in the Settings app or directly via the `Terminal` command `theme <matrix | cyberpunk | minimal | dracula | synthwave | amber>`.

---

## 📜 License

Created for Google Labs experiments and AI Studio Build. Free to use, adapt, and extend for your own web OS projects and audio workstations!
