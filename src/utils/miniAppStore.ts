import JSZip from 'jszip';
import { COMPLEX_GAME_PRESETS } from '../components/apps/arcade/complexGamePresets';
import { SpriteData, TilemapData, SfxPreset, ParticleEmitterConfig } from '../components/apps/arcade/types';
import { DEFAULT_SPRITES, INITIAL_TILEMAP, DEFAULT_SFX_PRESETS, DEFAULT_EMITTERS } from '../components/apps/arcade/defaults';

export interface MiniAppDefinition {
  id: string;
  title: string;
  shortTitle: string;
  version: string;
  genre: 'Dungeon Crawler' | 'Platformer' | 'Shooter' | 'Arcade' | 'SPCK Port' | 'Physics' | 'Custom';
  icon: string;
  color: string;
  description: string;
  code: string;
  upgradesApplied: string[];
  createdAt: string;
  updatedAt: string;
  isPinnedToDesktop: boolean;
  tags: string[];
  author?: string;
  highScore?: number;
  packageInfo?: {
    originalZipName?: string;
    entryFile?: string;
    filesCount?: number;
    spckEngine?: boolean;
  };
}

const STORAGE_KEY = 'labs_miniapps_installed_v1';
const ACTIVE_APP_KEY = 'labs_miniapp_active_id';

// Default SPCK Node.js Cyber Racer code
const SPCK_CYBER_RACER_CODE = `// --- SPCK NODE.JS CYBER RACER: TURBO HIGHWAY ---
// Ported SPCK Node.js canvas game engine with procedural traffic, nitro boost, and high score combo

function init(engine) {
  engine.player = {
    x: 350,
    y: 430,
    lane: 2,
    speed: 0,
    maxSpeed: 420,
    accel: 280,
    friction: 0.94,
    nitro: 100,
    isNitroActive: false,
    scoreMultiplier: 1,
    shield: 100,
    color: '#06b6d4',
  };

  engine.traffic = [];
  engine.nitroPickups = [];
  engine.roadOffset = 0;
  engine.lanes = [160, 255, 350, 445, 540];
  engine.trafficTimer = 0;
  engine.pickupTimer = 0;
  engine.particles = [];
  engine.score = 0;
  engine.lives = 3;
}

function update(engine, dt) {
  const p = engine.player;

  // Steering Controls
  if (engine.keys['ArrowLeft'] || engine.keys['KeyA']) {
    p.x -= 280 * dt;
    if (Math.random() < 0.3) {
      engine.spawnParticles(p.x + 12, p.y + 35, 2, '#38bdf8');
    }
  }
  if (engine.keys['ArrowRight'] || engine.keys['KeyD']) {
    p.x += 280 * dt;
    if (Math.random() < 0.3) {
      engine.spawnParticles(p.x - 12, p.y + 35, 2, '#38bdf8');
    }
  }

  // Boundary clamp
  p.x = Math.max(130, Math.min(570, p.x));

  // Nitro Boost (SPACE or [A] or [B])
  if ((engine.keys['Space'] || engine.keys['KeyW'] || engine.keys['ShiftLeft']) && p.nitro > 5) {
    p.isNitroActive = true;
    p.speed = Math.min(p.maxSpeed * 1.5, p.speed + p.accel * 2.5 * dt);
    p.nitro = Math.max(0, p.nitro - 25 * dt);
    p.scoreMultiplier = 2;
    engine.spawnParticles(p.x, p.y + 38, 3, '#f43f5e');
    if (Math.random() < 0.1) engine.playSound('laser');
  } else {
    p.isNitroActive = false;
    p.speed = Math.min(p.maxSpeed, p.speed + p.accel * dt);
    p.nitro = Math.min(100, p.nitro + 6 * dt);
    p.scoreMultiplier = 1;
  }

  // Road scrolling
  engine.roadOffset = (engine.roadOffset + p.speed * dt * 1.5) % 80;

  // Score accumulation based on speed
  engine.addScore(Math.floor(p.speed * 0.05 * p.scoreMultiplier));

  // Spawn oncoming traffic
  engine.trafficTimer += dt;
  if (engine.trafficTimer > Math.max(0.7, 1.6 - (engine.score / 8000))) {
    engine.trafficTimer = 0;
    const laneX = engine.lanes[Math.floor(Math.random() * engine.lanes.length)];
    const colors = ['#f43f5e', '#a855f7', '#eab308', '#ec4899', '#6366f1'];
    engine.traffic.push({
      x: laneX,
      y: -60,
      width: 32,
      height: 55,
      speed: 120 + Math.random() * 80,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  // Spawn Nitro energy orbs
  engine.pickupTimer += dt;
  if (engine.pickupTimer > 3.2) {
    engine.pickupTimer = 0;
    const laneX = engine.lanes[Math.floor(Math.random() * engine.lanes.length)];
    engine.nitroPickups.push({
      x: laneX,
      y: -40,
      radius: 12,
    });
  }

  // Update traffic
  for (let i = engine.traffic.length - 1; i >= 0; i--) {
    const car = engine.traffic[i];
    car.y += (car.speed + p.speed * 0.7) * dt;

    // Check collision with player
    const dist = Math.hypot(p.x - car.x, p.y - car.y);
    if (dist < 34) {
      engine.playSound('explosion');
      engine.spawnParticles(p.x, p.y, 18, '#f43f5e');
      p.speed = 80;
      p.shield -= 40;
      engine.traffic.splice(i, 1);
      if (p.shield <= 0) {
        p.shield = 100;
        engine.loseLife();
      }
      continue;
    }

    if (car.y > 600) {
      engine.traffic.splice(i, 1);
      engine.addScore(50);
    }
  }

  // Update nitro pickups
  for (let i = engine.nitroPickups.length - 1; i >= 0; i--) {
    const orb = engine.nitroPickups[i];
    orb.y += (p.speed * 0.9) * dt;

    const dist = Math.hypot(p.x - orb.x, p.y - orb.y);
    if (dist < 28) {
      engine.playSound('success');
      p.nitro = Math.min(100, p.nitro + 35);
      p.shield = Math.min(100, p.shield + 15);
      engine.addScore(250);
      engine.spawnParticles(orb.x, orb.y, 12, '#06b6d4');
      engine.nitroPickups.splice(i, 1);
      continue;
    }

    if (orb.y > 600) {
      engine.nitroPickups.splice(i, 1);
    }
  }
}

function render(engine, ctx) {
  // Highway floor
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, 700, 525);

  // Neon Highway Road
  const roadLeft = 100;
  const roadWidth = 500;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(roadLeft, 0, roadWidth, 525);

  // Outer guardrails glow
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(roadLeft, 0);
  ctx.lineTo(roadLeft, 525);
  ctx.moveTo(roadLeft + roadWidth, 0);
  ctx.lineTo(roadLeft + roadWidth, 525);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Lane dividers with offset scrolling
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  ctx.setLineDash([25, 25]);
  ctx.lineDashOffset = -engine.roadOffset;
  for (let i = 1; i < 5; i++) {
    const lx = roadLeft + i * 100;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, 525);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Render Nitro Pickups
  for (const orb of engine.nitroPickups) {
    ctx.save();
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // Render Traffic Cars
  for (const car of engine.traffic) {
    ctx.save();
    ctx.shadowColor = car.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = car.color;
    ctx.beginPath();
    ctx.roundRect(car.x - 16, car.y - 28, 32, 56, 6);
    ctx.fill();

    // Windshield
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(car.x - 12, car.y + 4, 24, 12);
    // Headlights
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(car.x - 14, car.y + 24, 8, 4);
    ctx.fillRect(car.x + 6, car.y + 24, 8, 4);
    ctx.restore();
  }

  // Render Player Cyber Racer
  const p = engine.player;
  ctx.save();
  ctx.shadowColor = p.isNitroActive ? '#f43f5e' : '#06b6d4';
  ctx.shadowBlur = p.isNitroActive ? 20 : 12;

  // Car chassis
  ctx.fillStyle = p.isNitroActive ? '#f43f5e' : '#06b6d4';
  ctx.beginPath();
  ctx.roundRect(p.x - 18, p.y - 30, 36, 60, 8);
  ctx.fill();

  // Cockpit canopy
  ctx.fillStyle = '#020617';
  ctx.beginPath();
  ctx.roundRect(p.x - 12, p.y - 14, 24, 24, 4);
  ctx.fill();

  // Taillights
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(p.x - 15, p.y + 26, 8, 4);
  ctx.fillRect(p.x + 7, p.y + 26, 8, 4);

  // Nitro Thruster Flame
  if (p.isNitroActive) {
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(p.x - 10, p.y + 30);
    ctx.lineTo(p.x + 10, p.y + 30);
    ctx.lineTo(p.x, p.y + 48 + Math.random() * 8);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // On-Screen HUD Overlay
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.fillRect(20, 20, 200, 68);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(20, 20, 200, 68);

  // Speedometer
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('SPEED: ' + Math.floor(p.speed) + ' KM/H', 30, 40);

  // Nitro Gauge Bar
  ctx.fillStyle = '#475569';
  ctx.fillRect(30, 48, 180, 10);
  ctx.fillStyle = p.isNitroActive ? '#f43f5e' : '#06b6d4';
  ctx.fillRect(30, 48, 180 * (p.nitro / 100), 10);

  // Shield Gauge
  ctx.fillStyle = '#475569';
  ctx.fillRect(30, 64, 180, 8);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(30, 64, 180 * (p.shield / 100), 8);
}
`;

// Starfire Retro Space Defender code
const STARFIRE_DEFENDER_CODE = `// --- STARFIRE 2088: ORBITAL DEFENSE ---
// High-octane space shoot-em-up with plasma blasters, asteroid splits, and boss dreadnought

function init(engine) {
  engine.player = {
    x: 350,
    y: 440,
    speed: 260,
    shield: 100,
    overdrive: 0,
    weaponLevel: 2,
    shootTimer: 0,
  };

  engine.bullets = [];
  engine.asteroids = [];
  engine.stars = [];
  engine.boss = null;
  engine.bossSpawnTimer = 18;
  engine.score = 0;
  engine.lives = 3;

  for (let i = 0; i < 70; i++) {
    engine.stars.push({
      x: Math.random() * 700,
      y: Math.random() * 525,
      speed: 20 + Math.random() * 120,
      size: Math.random() * 2 + 0.5,
    });
  }
}

function update(engine, dt) {
  const p = engine.player;

  // Starfield scrolling
  for (const s of engine.stars) {
    s.y = (s.y + s.speed * dt) % 525;
  }

  // Player movement
  if (engine.keys['ArrowLeft'] || engine.keys['KeyA']) p.x -= p.speed * dt;
  if (engine.keys['ArrowRight'] || engine.keys['KeyD']) p.x += p.speed * dt;
  if (engine.keys['ArrowUp'] || engine.keys['KeyW']) p.y -= p.speed * dt;
  if (engine.keys['ArrowDown'] || engine.keys['KeyS']) p.y += p.speed * dt;

  p.x = Math.max(30, Math.min(670, p.x));
  p.y = Math.max(60, Math.min(480, p.y));

  // Shooting
  p.shootTimer += dt;
  if ((engine.keys['Space'] || engine.keys['KeyJ'] || engine.keys['ShiftLeft']) && p.shootTimer > 0.16) {
    p.shootTimer = 0;
    engine.playSound('laser');
    if (p.weaponLevel >= 2) {
      engine.bullets.push({ x: p.x - 12, y: p.y - 18, vx: -25, vy: -550, color: '#38bdf8' });
      engine.bullets.push({ x: p.x + 12, y: p.y - 18, vx: 25, vy: -550, color: '#38bdf8' });
    } else {
      engine.bullets.push({ x: p.x, y: p.y - 20, vx: 0, vy: -520, color: '#38bdf8' });
    }
  }

  // Update bullets
  for (let i = engine.bullets.length - 1; i >= 0; i--) {
    const b = engine.bullets[i];
    b.x += (b.vx || 0) * dt;
    b.y += b.vy * dt;
    if (b.y < -20 || b.x < 0 || b.x > 700) {
      engine.bullets.splice(i, 1);
    }
  }

  // Asteroid spawn
  if (Math.random() < 0.04 && engine.asteroids.length < 8) {
    engine.asteroids.push({
      x: 40 + Math.random() * 620,
      y: -30,
      vy: 80 + Math.random() * 110,
      vx: (Math.random() - 0.5) * 40,
      radius: 16 + Math.random() * 18,
      hp: 2,
    });
  }

  // Update Asteroids
  for (let i = engine.asteroids.length - 1; i >= 0; i--) {
    const ast = engine.asteroids[i];
    ast.x += ast.vx * dt;
    ast.y += ast.vy * dt;

    // Bullet collision
    for (let j = engine.bullets.length - 1; j >= 0; j--) {
      const b = engine.bullets[j];
      const d = Math.hypot(b.x - ast.x, b.y - ast.y);
      if (d < ast.radius + 6) {
        engine.bullets.splice(j, 1);
        ast.hp--;
        engine.spawnParticles(b.x, b.y, 6, '#f59e0b');
        engine.playSound('hit');
        if (ast.hp <= 0) {
          engine.playSound('explosion');
          engine.spawnParticles(ast.x, ast.y, 16, '#f97316');
          engine.addScore(150);
          engine.asteroids.splice(i, 1);
          break;
        }
      }
    }

    // Player collision
    const pd = Math.hypot(p.x - ast.x, p.y - ast.y);
    if (pd < ast.radius + 18) {
      engine.playSound('explosion');
      engine.spawnParticles(p.x, p.y, 22, '#ef4444');
      engine.asteroids.splice(i, 1);
      engine.loseLife();
      continue;
    }

    if (ast.y > 540) {
      engine.asteroids.splice(i, 1);
    }
  }
}

function render(engine, ctx) {
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, 700, 525);

  // Render Stars
  ctx.fillStyle = '#e2e8f0';
  for (const s of engine.stars) {
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }

  // Render Bullets
  for (const b of engine.bullets) {
    ctx.save();
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x - 2, b.y - 8, 4, 16);
    ctx.restore();
  }

  // Render Asteroids
  for (const ast of engine.asteroids) {
    ctx.save();
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ast.x, ast.y, ast.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Render Player Starfighter
  const p = engine.player;
  ctx.save();
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 14;

  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 24);
  ctx.lineTo(p.x + 22, p.y + 18);
  ctx.lineTo(p.x, p.y + 10);
  ctx.lineTo(p.x - 22, p.y + 18);
  ctx.closePath();
  ctx.fill();

  // Cockpit
  ctx.fillStyle = '#e0f2fe';
  ctx.beginPath();
  ctx.arc(p.x, p.y - 4, 5, 0, Math.PI * 2);
  ctx.fill();

  // Engine thruster glow
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(p.x - 6, p.y + 12, 12, 6);
  ctx.restore();
}
`;

export const DEFAULT_MINI_APPS: MiniAppDefinition[] = [
  {
    id: 'cyber-rogue',
    title: 'Cyber Rogue: Neon Dungeon Crawl',
    shortTitle: 'Cyber Rogue',
    version: '1.2.0',
    genre: 'Dungeon Crawler',
    icon: 'Shield',
    color: 'from-purple-600 via-pink-600 to-rose-600',
    description: 'Top-down dungeon crawler featuring 28x21 tilemap walls, locked keycard security gates, enemy patrol AI, melee sword slashes, and ranged firebolts.',
    code: COMPLEX_GAME_PRESETS[0].code,
    upgradesApplied: ['Tilemap Collision System', 'Sprite Animation Engine', 'Enemy Patrol AI', 'Melee & Ranged Combat', 'Keycard Security Gates'],
    createdAt: '2026-03-01T12:00:00Z',
    updatedAt: '2026-03-09T18:30:00Z',
    isPinnedToDesktop: true,
    tags: ['RPG', 'Dungeon', 'Tilemap', 'Sprite', 'AI'],
    author: 'Playground Studio',
  },
  {
    id: 'gravi-flip',
    title: 'Gravi-Flip: Quantum Dimension',
    shortTitle: 'Gravi-Flip',
    version: '1.1.0',
    genre: 'Platformer',
    icon: 'Zap',
    color: 'from-cyan-500 via-blue-600 to-indigo-600',
    description: 'Quantum dimension runner with instant gravity inversion, laser hazard beams, moving quantum platforms, and speed multiplier energy portals.',
    code: COMPLEX_GAME_PRESETS[1].code,
    upgradesApplied: ['Quantum Dimension Shifts', 'Laser Pulse Timing', 'Dynamic Gravity Physics'],
    createdAt: '2026-03-02T10:00:00Z',
    updatedAt: '2026-03-09T19:00:00Z',
    isPinnedToDesktop: true,
    tags: ['Platformer', 'Physics', 'Gravity', 'Precision'],
    author: 'Playground Studio',
  },
  {
    id: 'spck-cyber-racer',
    title: 'SPCK Cyber Racer: Turbo Highway',
    shortTitle: 'Cyber Racer',
    version: '1.0.0',
    genre: 'SPCK Port',
    icon: 'Gamepad2',
    color: 'from-emerald-500 via-teal-600 to-cyan-600',
    description: 'Imported SPCK Node.js arcade racer with procedural cyber traffic, nitro boost pickups, shield energy meters, and high-speed multiplier scoring.',
    code: SPCK_CYBER_RACER_CODE,
    upgradesApplied: ['Node.js SPCK Web Port', 'Nitro Hyperdrive Particle Trail', 'Shield Energy Meter'],
    createdAt: '2026-03-08T15:00:00Z',
    updatedAt: '2026-03-09T20:00:00Z',
    isPinnedToDesktop: true,
    tags: ['SPCK Port', 'Node.js', 'Racing', 'Arcade'],
    author: 'SPCK Node.js Community',
    packageInfo: {
      originalZipName: 'spck-cyber-racer.zip',
      entryFile: 'game.js',
      filesCount: 4,
      spckEngine: true,
    },
  },
  {
    id: 'starfire-defender',
    title: 'Starfire 2088: Orbital Defense',
    shortTitle: 'Starfire 2088',
    version: '1.3.0',
    genre: 'Shooter',
    icon: 'Sparkles',
    color: 'from-amber-500 via-orange-600 to-red-600',
    description: 'High-octane space shoot-em-up with dual plasma blasters, procedural asteroid splitting physics, homing missile salvos, and starfield parallax.',
    code: STARFIRE_DEFENDER_CODE,
    upgradesApplied: ['Split Plasma Cannons', 'Overdrive Shield Pulse', 'Starfield Parallax Depth'],
    createdAt: '2026-03-04T08:00:00Z',
    updatedAt: '2026-03-09T20:45:00Z',
    isPinnedToDesktop: false,
    tags: ['Shooter', 'Sci-Fi', 'Space', 'Arcade'],
    author: 'Arcade Engine',
  },
];

/**
 * Returns all installed Mini Apps (retrieving saved ones from localStorage or seeding defaults)
 */
export function getInstalledMiniApps(): MiniAppDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MINI_APPS));
      return DEFAULT_MINI_APPS;
    }
    const parsed = JSON.parse(raw) as MiniAppDefinition[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MINI_APPS));
      return DEFAULT_MINI_APPS;
    }
    // Verify each app has valid code and id, repairing corrupted entries
    return parsed.map((app) => {
      if (!app.code || typeof app.code !== 'string' || app.code.trim().length === 0) {
        const fallback = DEFAULT_MINI_APPS.find((d) => d.id === app.id) || DEFAULT_MINI_APPS[0];
        return { ...app, code: fallback.code };
      }
      return app;
    });
  } catch (err) {
    console.warn('Failed to load mini apps, restoring defaults', err);
    return DEFAULT_MINI_APPS;
  }
}

/**
 * Resets a single mini app to factory default code
 */
export function resetMiniAppToDefault(id: string): MiniAppDefinition {
  const defaultApp = DEFAULT_MINI_APPS.find((d) => d.id === id);
  if (defaultApp) {
    saveMiniApp(defaultApp);
    return defaultApp;
  }
  const all = getInstalledMiniApps();
  const found = all.find((a) => a.id === id);
  if (found) {
    const reset = { ...found, code: DEFAULT_MINI_APPS[0].code, version: '1.0.0', upgradesApplied: [] };
    saveMiniApp(reset);
    return reset;
  }
  return DEFAULT_MINI_APPS[0];
}

/**
 * Restores all mini apps back to factory defaults
 */
export function restoreAllDefaults(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MINI_APPS));
  setActiveMiniAppId(DEFAULT_MINI_APPS[0].id);
  dispatchMiniAppsChanged();
}

/**
 * Persists a mini app (insert or update)
 */
export function saveMiniApp(app: MiniAppDefinition): void {
  const all = getInstalledMiniApps();
  const existingIdx = all.findIndex((a) => a.id === app.id);
  let updated: MiniAppDefinition[];
  if (existingIdx >= 0) {
    updated = [...all];
    updated[existingIdx] = { ...app, updatedAt: new Date().toISOString() };
  } else {
    updated = [app, ...all];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  dispatchMiniAppsChanged();
}

/**
 * Removes a mini app by ID
 */
export function deleteMiniApp(id: string): void {
  const all = getInstalledMiniApps();
  const filtered = all.filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  dispatchMiniAppsChanged();
}

/**
 * Toggles desktop pin status
 */
export function togglePinDesktop(id: string): boolean {
  const all = getInstalledMiniApps();
  let nextState = false;
  const updated = all.map((a) => {
    if (a.id === id) {
      nextState = !a.isPinnedToDesktop;
      return { ...a, isPinnedToDesktop: nextState, updatedAt: new Date().toISOString() };
    }
    return a;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  dispatchMiniAppsChanged();
  return nextState;
}

/**
 * Gets active mini app ID for launching
 */
export function getActiveMiniAppId(): string {
  return localStorage.getItem(ACTIVE_APP_KEY) || DEFAULT_MINI_APPS[0].id;
}

/**
 * Sets active mini app ID for launching
 */
export function setActiveMiniAppId(id: string): void {
  localStorage.setItem(ACTIVE_APP_KEY, id);
  dispatchMiniAppsChanged();
}

/**
 * Dispatches a window event so all OS windows/components stay synchronized
 */
export function dispatchMiniAppsChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('labs_miniapps_updated'));
  }
}

/**
 * Applies an AI/Engine upgrade to an existing Mini App
 * (Increments version, logs upgrade entry, and injects code features)
 */
export function applyMiniAppUpgrade(
  id: string,
  upgradeName: string,
  customPrompt?: string
): MiniAppDefinition {
  const all = getInstalledMiniApps();
  const target = all.find((a) => a.id === id);
  if (!target) throw new Error(`Mini App ${id} not found`);

  // Bump version: 1.0.0 -> 1.1.0 or 1.1.0 -> 1.2.0
  const versionParts = target.version.split('.').map(Number);
  if (versionParts.length === 3) {
    versionParts[1] = (versionParts[1] || 0) + 1;
    versionParts[2] = 0;
  }
  const nextVersion = versionParts.join('.');

  let upgradedCode = target.code;

  // Smart feature injection into code based on upgrade type
  if (upgradeName.toLowerCase().includes('shield') || upgradeName.toLowerCase().includes('power-up')) {
    upgradedCode += `\n\n// --- UPGRADE: Overdrive Energy Shield & Auto-Regen ---\n// Added in v${nextVersion}\nif (typeof engine !== 'undefined' && engine.player) {\n  engine.player.shield = Math.min(100, (engine.player.shield || 50) + 0.1);\n}\n`;
  } else if (upgradeName.toLowerCase().includes('boss') || upgradeName.toLowerCase().includes('elite')) {
    upgradedCode += `\n\n// --- UPGRADE: Elite Boss Encounter Mechanics ---\n// Added in v${nextVersion}\nif (typeof engine !== 'undefined' && engine.score > 2000 && !engine.bossActive) {\n  engine.bossActive = true;\n  if (engine.playSound) engine.playSound('explosion');\n}\n`;
  } else if (upgradeName.toLowerCase().includes('particle') || upgradeName.toLowerCase().includes('glow') || upgradeName.toLowerCase().includes('visual')) {
    upgradedCode += `\n\n// --- UPGRADE: Cyberpunk Particle Bloom & Dynamic Shaders ---\n// Added in v${nextVersion}\nif (typeof engine !== 'undefined' && Math.random() < 0.25) {\n  engine.spawnParticles(Math.random() * 700, Math.random() * 525, 2, '#38bdf8');\n}\n`;
  } else if (upgradeName.toLowerCase().includes('sound') || upgradeName.toLowerCase().includes('audio')) {
    upgradedCode += `\n\n// --- UPGRADE: Reactive Multi-Harmonic Synth Tones ---\n// Added in v${nextVersion}\n`;
  } else {
    // Custom upgrade prompt
    const cleanPrompt = (customPrompt || upgradeName).slice(0, 100);
    upgradedCode += `\n\n// --- UPGRADE: ${upgradeName} ---\n// Specification: ${cleanPrompt}\n// Applied to v${nextVersion}\n`;
  }

  const updatedMiniApp: MiniAppDefinition = {
    ...target,
    version: nextVersion,
    code: upgradedCode,
    upgradesApplied: [upgradeName, ...target.upgradesApplied],
    updatedAt: new Date().toISOString(),
  };

  saveMiniApp(updatedMiniApp);
  return updatedMiniApp;
}

/**
 * Packages a Mini App into a complete downloadable ZIP archive
 */
export async function exportMiniAppToZip(miniApp: MiniAppDefinition): Promise<void> {
  const zip = new JSZip();

  const slug = miniApp.id.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

  // metadata.json (Full definition for re-import)
  const metadata = {
    ...miniApp,
    exportedAt: new Date().toISOString(),
    engine: 'Google Labs OS Mini App Engine',
  };
  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

  // package.json
  const pkgJson = {
    name: slug,
    version: miniApp.version,
    description: miniApp.description,
    main: 'game.js',
    scripts: {
      start: 'node server.js',
    },
    keywords: ['game', 'arcade', 'spck', 'nodejs', 'miniapp', ...miniApp.tags],
    author: miniApp.author || 'Google Labs OS',
    license: 'MIT',
  };
  zip.file('package.json', JSON.stringify(pkgJson, null, 2));

  // game.js
  const codeWithHeader = `/**
 * ${miniApp.title} (v${miniApp.version})
 * Generated by Google Labs OS // Playground
 * Genre: ${miniApp.genre}
 * Tags: ${miniApp.tags.join(', ')}
 */

${miniApp.code}`;
  zip.file('game.js', codeWithHeader);

  // README.md
  const readme = `# ${miniApp.title} (v${miniApp.version})\n\n${miniApp.description}\n\n## Applied Upgrades\n${miniApp.upgradesApplied.length > 0 ? miniApp.upgradesApplied.map((u) => `- ${u}`).join('\n') : '- No upgrades yet'}\n\n## Controls\n- Arrow Keys / WASD: Movement\n- Space / [A]: Action / Jump / Slash\n- Shift / [B]: Secondary Action / Nitro / Firebolt\n- P: Pause\n- R: Restart\n\n## Assets & Metadata\nThis package includes a \`metadata.json\` containing the full Mini App definition, which can be re-imported into the Google Labs OS Playground.\n\nGenerated by Google Labs Playground Studio & Mini App Engine.`;
  zip.file('README.md', readme);

  // engine-runner.js (Allows standalone browser execution)
  const engineRunner = `// Standalone Mini App Runtime Engine
window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const keys = {};

  window.addEventListener('keydown', (e) => { keys[e.code] = true; });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });

  const engine = {
    width: canvas.width,
    height: canvas.height,
    keys,
    pad: { left: false, right: false, up: false, down: false, a: false, b: false, fire: false, jump: false },
    score: 0,
    lives: 3,
    level: 1,
    time: 0,
    gameOver: false,
    particles: [],
    shake: 0,
    params: { playerSpeed: 1.2, difficulty: 1.0, lives: 3, fireRate: 1.0, particleDensity: 'high', colorTheme: 'cyber-neon', screenShake: true },
    addScore: (pts) => { engine.score += pts; },
    loseLife: () => { engine.lives = Math.max(0, engine.lives - 1); if (engine.lives <= 0) engine.gameOver = true; },
    playSound: () => {},
    playCustomSfx: () => {},
    spawnParticles: (x, y, count, color) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 180;
        engine.particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0.4, color: color || '#38bdf8' });
      }
    },
    spawnSparks: (x, y, count, color) => { engine.spawnParticles(x, y, count, color); },
    triggerShake: (amt) => { engine.shake = Math.min(20, engine.shake + (amt || 4)); },
  };

  if (typeof init === 'function') init(engine);

  let lastTime = performance.now();
  function loop(time) {
    const dt = Math.min(0.08, (time - lastTime) / 1000);
    lastTime = time;

    if (!engine.gameOver) {
      engine.time += dt;
      if (typeof update === 'function') update(engine, dt);
      for (let i = engine.particles.length - 1; i >= 0; i--) {
        const p = engine.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) engine.particles.splice(i, 1);
      }
    }

    if (typeof render === 'function') render(engine, ctx);

    for (const p of engine.particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 2.5, 2.5);
    }

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
});`;
  zip.file('engine-runner.js', engineRunner);

  // assets/bundle.json
  const assetData = {
    sprites: DEFAULT_SPRITES,
    tilemap: INITIAL_TILEMAP,
    sfx: DEFAULT_SFX_PRESETS,
  };
  zip.file('assets/assets-bundle.json', JSON.stringify(assetData, null, 2));

  // index.html standalone web player
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${miniApp.title}</title>
  <style>
    body { margin: 0; background: #030712; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif; color: white; overflow: hidden; }
    canvas { background: #000; border: 2px solid #334155; border-radius: 12px; box-shadow: 0 20px 40px rgba(0,0,0,0.8); max-width: 95vw; max-height: 80vh; object-fit: contain; }
    .hud { margin-bottom: 16px; font-size: 14px; color: #94a3b8; text-align: center; }
    .badge { background: #1e293b; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; color: #38bdf8; margin-left: 8px; vertical-align: middle; border: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="hud">
    <strong>${miniApp.title}</strong> <span class="badge">v${miniApp.version}</span>
    <div style="margin-top: 4px; font-size: 11px;">[Arrows/WASD] Move • [Space] Action • [P] Pause • [R] Restart</div>
  </div>
  <canvas id="gameCanvas" width="700" height="525"></canvas>
  <script src="game.js"></script>
  <script src="engine-runner.js"></script>
</body>
</html>`;
  zip.file('index.html', indexHtml);

  // Generate and download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}-v${miniApp.version}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const OFFLINE_CACHE_KEY = 'labs_miniapps_offline_cache_manifest';

/**
 * Caches a mini app for offline playback via CacheStorage and localStorage
 */
export async function cacheMiniAppOffline(miniApp: MiniAppDefinition): Promise<boolean> {
  try {
    if ('caches' in window) {
      const cache = await caches.open('miniapps-offline-cache-v1');
      const response = new Response(JSON.stringify(miniApp), {
        headers: { 'Content-Type': 'application/json' },
      });
      await cache.put(`/api/miniapp/${miniApp.id}`, response);
    }
    const manifest = getOfflineManifest();
    manifest[miniApp.id] = { cachedAt: new Date().toISOString(), version: miniApp.version };
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(manifest));
    return true;
  } catch (err) {
    console.warn('Could not cache mini app offline:', err);
    return false;
  }
}

/**
 * Checks if a mini app is cached for offline mode
 */
export function isMiniAppCachedOffline(id: string): boolean {
  const manifest = getOfflineManifest();
  return !!manifest[id];
}

/**
 * Caches all installed mini apps for offline readiness
 */
export async function cacheAllMiniAppsOffline(): Promise<number> {
  const apps = getInstalledMiniApps();
  let count = 0;
  for (const app of apps) {
    const success = await cacheMiniAppOffline(app);
    if (success) count++;
  }
  return count;
}

function getOfflineManifest(): Record<string, { cachedAt: string; version: string }> {
  try {
    const raw = localStorage.getItem(OFFLINE_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
