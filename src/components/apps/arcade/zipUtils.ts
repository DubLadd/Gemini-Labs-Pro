import JSZip from 'jszip';
import { GameTemplate } from '../ArcadeApp';
import { SpriteData, TilemapData } from './types';

export interface UnpackedGame {
  fileName: string;
  fileList: { path: string; size: number; isCode: boolean }[];
  fileContents: Record<string, string>;
  detectedMainCode: string;
  detectedMainFile: string;
  htmlEntry?: string;
  suggestedTitle: string;
}

/**
 * Extracts and unpacks a game ZIP archive (e.g. from SPCK, GitHub, or web game bundles)
 */
export async function unpackGameZip(file: File): Promise<UnpackedGame> {
  const zip = new JSZip();
  const loaded = await zip.loadAsync(file);

  const fileList: { path: string; size: number; isCode: boolean }[] = [];
  const fileContents: Record<string, string> = {};

  let suggestedTitle = file.name.replace(/\.zip$/i, '').replace(/[-_]/g, ' ');
  let detectedMainCode = '';
  let detectedMainFile = '';
  let htmlEntry = '';

  const entries = Object.keys(loaded.files);

  for (const path of entries) {
    const zipEntry = loaded.files[path];
    if (zipEntry.dir) continue;

    // Check if text or code
    const lower = path.toLowerCase();
    const isCode = lower.endsWith('.js') || lower.endsWith('.ts') || lower.endsWith('.html') || lower.endsWith('.json') || lower.endsWith('.css') || lower.endsWith('.txt');

    if (isCode) {
      try {
        const text = await zipEntry.async('string');
        fileContents[path] = text;
        fileList.push({ path, size: text.length, isCode: true });

        if (lower.endsWith('.html') && (!htmlEntry || lower.includes('index.html'))) {
          htmlEntry = text;
        }

        // Check if package.json has a title / name
        if (lower.endsWith('package.json')) {
          try {
            const pkg = JSON.parse(text);
            if (pkg.name) suggestedTitle = pkg.name;
          } catch {}
        }
      } catch (err) {
        console.warn('Failed to read file in zip', path, err);
      }
    } else {
      fileList.push({ path, size: 0, isCode: false });
    }
  }

  // Detect main game code file
  // Priority: game.js > main.js > index.js > app.js > any .js > embedded script in index.html
  const jsFiles = Object.keys(fileContents).filter((f) => f.toLowerCase().endsWith('.js') && !f.includes('node_modules'));

  const priorityOrder = ['game.js', 'main.js', 'index.js', 'app.js', 'script.js'];
  for (const p of priorityOrder) {
    const match = jsFiles.find((f) => f.toLowerCase().endsWith(p));
    if (match) {
      detectedMainFile = match;
      detectedMainCode = fileContents[match];
      break;
    }
  }

  if (!detectedMainCode && jsFiles.length > 0) {
    detectedMainFile = jsFiles[0];
    detectedMainCode = fileContents[jsFiles[0]];
  }

  // If no standalone js file found, try extracting script tag from HTML
  if (!detectedMainCode && htmlEntry) {
    const scriptMatch = htmlEntry.match(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/i);
    if (scriptMatch && scriptMatch[1].trim()) {
      detectedMainFile = 'index.html (inline script)';
      detectedMainCode = scriptMatch[1].trim();
    }
  }

  return {
    fileName: file.name,
    fileList,
    fileContents,
    detectedMainCode,
    detectedMainFile: detectedMainFile || 'Unknown',
    htmlEntry,
    suggestedTitle,
  };
}

/**
 * Smart adapter that wraps raw Canvas / SPCK code into Playground Studio's engine
 * hooks (init, update, render) if not already formatted.
 */
export function adaptCodeToPlaygroundEngine(rawCode: string, title: string): string {
  // If the code already has Playground engine hooks, return as is
  if (rawCode.includes('function init') && (rawCode.includes('function update') || rawCode.includes('function render'))) {
    return rawCode;
  }

  // Otherwise, create a clean compatibility bridge so standard SPCK canvas games run smoothly!
  return `// --- IMPORTED GAME: ${title.toUpperCase()} ---
// Bridged from external SPCK / Web source into Playground Studio Engine

function init(engine) {
  // Engine state initialization
  engine.importedState = {
    initialized: false,
    width: engine.width,
    height: engine.height,
  };
  
  // Custom user parameters
  engine.player = engine.player || { x: engine.width / 2, y: engine.height / 2, speed: 240 };
}

// Original game code body:
${rawCode}

// Fallback update & render hooks if not explicitly declared in source:
if (typeof update !== 'function') {
  function update(engine, dt) {
    // Forward arrow keys & touch pad to player
    if (engine.player) {
      if (engine.keys['ArrowLeft'] || engine.pad.left) engine.player.x -= (engine.player.speed || 200) * dt;
      if (engine.keys['ArrowRight'] || engine.pad.right) engine.player.x += (engine.player.speed || 200) * dt;
      if (engine.keys['ArrowUp'] || engine.pad.up) engine.player.y -= (engine.player.speed || 200) * dt;
      if (engine.keys['ArrowDown'] || engine.pad.down) engine.player.y += (engine.player.speed || 200) * dt;
    }
  }
}

if (typeof render !== 'function') {
  function render(engine, ctx) {
    // If original code drew on its own canvas, provide a default visualization
    if (engine.player) {
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(engine.player.x, engine.player.y, 16, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
`;
}

/**
 * Packages a game, its code, and metadata into a complete downloadable ZIP package
 */
export async function packageGameToZip(
  game: GameTemplate,
  sprites?: SpriteData[],
  tilemap?: TilemapData
): Promise<Blob> {
  const zip = new JSZip();

  // 1. Standalone runnable index.html
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${game.title} - Playground Studio</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #030712; color: #f8fafc; font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; overflow: hidden; }
    #header { margin-bottom: 12px; font-size: 16px; font-weight: bold; letter-spacing: 1px; color: #ec4899; }
    canvas { border: 3px solid #ec4899; border-radius: 12px; box-shadow: 0 0 40px rgba(236, 72, 153, 0.3); background: #000; }
    #controls { margin-top: 12px; font-size: 12px; color: #94a3b8; font-family: monospace; }
  </style>
</head>
<body>
  <div id="header">${game.title} (v${game.version})</div>
  <canvas id="gameCanvas" width="700" height="525"></canvas>
  <div id="controls">Controls: WASD / Arrows = Move | SPACE = Action | P = Pause</div>
  <script src="game.js"></script>
  <script src="engine-runner.js"></script>
</body>
</html>`;
  zip.file('index.html', htmlContent);

  // 2. Main game code
  zip.file('game.js', game.code);

  // 3. Engine runner bridge
  const runnerContent = `// Playground Studio Standalone Engine Runner
window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  
  const engine = {
    width: canvas.width,
    height: canvas.height,
    time: 0,
    score: 0,
    lives: ${game.params.lives},
    params: ${JSON.stringify(game.params, null, 2)},
    keys: {},
    pad: {},
    particles: [],
    shake: 0,
    playSound: (type) => console.log('SFX:', type),
    spawnSparks: (x, y, count, color) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 40 + Math.random() * 150;
        engine.particles.push({ x, y, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd, life: 0.4, maxLife: 0.4, color, size: 2 });
      }
    },
    triggerShake: (amt) => { engine.shake = amt; },
    addScore: (pts) => { engine.score += pts; document.title = '${game.title} - Score: ' + engine.score; },
    loseLife: () => { engine.lives--; if (engine.lives <= 0) alert('Game Over! Score: ' + engine.score); },
  };

  window.addEventListener('keydown', (e) => { engine.keys[e.code] = true; engine.keys[e.key] = true; });
  window.addEventListener('keyup', (e) => { engine.keys[e.code] = false; engine.keys[e.key] = false; });

  if (typeof init === 'function') init(engine);

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.08, (now - last) / 1000);
    last = now;
    engine.time += dt;

    if (typeof update === 'function') update(engine, dt);
    
    // Particles
    for (let i = engine.particles.length - 1; i >= 0; i--) {
      const p = engine.particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) engine.particles.splice(i, 1);
    }

    if (typeof render === 'function') render(engine, ctx);

    for (const p of engine.particles) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
});`;
  zip.file('engine-runner.js', runnerContent);

  // 4. package.json for SPCK / Node compatibility
  const packageJson = {
    name: game.id,
    version: game.version,
    description: game.description,
    main: 'game.js',
    scripts: {
      start: 'npx serve .',
    },
    keywords: game.tags,
    author: 'Playground Studio Game Forge',
    license: 'MIT',
  };
  zip.file('package.json', JSON.stringify(packageJson, null, 2));

  // 5. Assets / Sprites / Tilemaps if provided
  if (sprites && sprites.length > 0) {
    zip.file('sprites.json', JSON.stringify(sprites, null, 2));
  }
  if (tilemap) {
    zip.file('tilemap.json', JSON.stringify(tilemap, null, 2));
  }

  // 6. README.md
  const readme = `# ${game.title}
Created with **Playground Studio // Game & App Forge**

## How to Run / Play:
1. Open \`index.html\` in any browser or web server.
2. In **SPCK Editor** or Node.js:
   - Import this folder or ZIP directly.
   - Run with live server or preview.

## Controls:
${game.controlsLegend.map((c) => `- **${c.key}**: ${c.action}`).join('\n')}
`;
  zip.file('README.md', readme);

  return await zip.generateAsync({ type: 'blob' });
}
