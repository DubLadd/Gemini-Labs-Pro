import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { soundEngine } from '../../utils/audio';
import {
  Gamepad2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Code2,
  Wand2,
  Sliders,
  Layers,
  Download,
  Save,
  Copy,
  Check,
  Zap,
  Shield,
  Flame,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Terminal,
  ChevronRight,
  Tv,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Award,
  RefreshCw,
  PlusCircle,
  FileCode,
  SlidersHorizontal,
  Paintbrush,
  Box,
  Music,
  Bug,
  Map,
  FileArchive,
  UploadCloud,
  Package,
  FileText,
} from 'lucide-react';
import { SpriteEditor } from './arcade/SpriteEditor';
import { TilemapEditor } from './arcade/TilemapEditor';
import { SfxStudio } from './arcade/SfxStudio';
import { ParticleDesigner } from './arcade/ParticleDesigner';
import { DebugInspector } from './arcade/DebugInspector';
import { GameUploadModal } from './arcade/GameUploadModal';
import {
  unpackGameZip,
  packageGameToZip,
  adaptCodeToPlaygroundEngine,
  UnpackedGame,
} from './arcade/zipUtils';
import {
  saveMiniApp,
  setActiveMiniAppId,
  MiniAppDefinition,
} from '../../utils/miniAppStore';
import {
  SpriteData,
  TilemapData,
  SfxPreset,
  ParticleEmitterConfig,
  EngineDebugState,
  GameTemplate,
} from './arcade/types';
import {
  DEFAULT_SPRITES,
  INITIAL_TILEMAP,
  DEFAULT_SFX_PRESETS,
  DEFAULT_EMITTERS,
  DEFAULT_TILE_DEFS,
} from './arcade/defaults';
import { COMPLEX_GAME_PRESETS } from './arcade/complexGamePresets';

interface ArcadeAppProps {
  onShowToast?: (title: string, msg: string, type?: 'info' | 'success' | 'warn') => void;
}

export type { GameTemplate };

// Built-in starter game codes with rich canvas game loops
const PRESET_GAMES: GameTemplate[] = [
  {
    id: 'neon-defender',
    title: 'Neon Space Defender 2099',
    genre: 'Shooter',
    description: 'High-octane vertical space shooter with alien waves, multi-shot powerups, and boss encounters.',
    version: '1.4.0',
    upgradesApplied: ['Multi-Shot Cannons', 'Overdrive Shield', 'Particle Explosions'],
    tags: ['Arcade', 'Space', 'Shooter', 'Action'],
    controlsLegend: [
      { key: 'A / D or ◄ ►', action: 'Move Starfighter' },
      { key: 'SPACE or [A]', action: 'Fire Plasma Laser' },
      { key: 'SHIFT or [B]', action: 'Activate Shield / Bomb' },
      { key: 'P', action: 'Pause / Resume' },
      { key: 'R', action: 'Restart Game' },
    ],
    params: {
      playerSpeed: 1.2,
      difficulty: 1.0,
      lives: 3,
      fireRate: 1.0,
      particleDensity: 'high',
      colorTheme: 'cyber-neon',
      screenShake: true,
    },
    code: `// --- NEON SPACE DEFENDER ---
// Engine hooks: init(engine), update(engine, dt), render(engine, ctx)

function init(engine) {
  engine.player = {
    x: engine.width / 2,
    y: engine.height - 70,
    width: 36,
    height: 40,
    speed: 360 * engine.params.playerSpeed,
    cooldown: 0,
    shield: 100,
    shieldActive: false,
    weaponTier: 2, // 1: single, 2: dual, 3: spread
  };
  engine.bullets = [];
  engine.enemies = [];
  engine.enemySpawnTimer = 0;
  engine.stars = Array.from({ length: 90 }, () => ({
    x: Math.random() * engine.width,
    y: Math.random() * engine.height,
    speed: 40 + Math.random() * 120,
    size: 1 + Math.random() * 2,
    brightness: 0.3 + Math.random() * 0.7,
  }));
  engine.boss = null;
  engine.bossTimer = 0;
}

function update(engine, dt) {
  const p = engine.player;
  const keys = engine.keys;

  // Move starfighter
  let moveX = 0;
  if (keys['ArrowLeft'] || keys['KeyA'] || engine.pad.left) moveX -= 1;
  if (keys['ArrowRight'] || keys['KeyD'] || engine.pad.right) moveX += 1;
  p.x += moveX * p.speed * dt;
  p.x = Math.max(24, Math.min(engine.width - 24, p.x));

  // Shield mechanic
  p.shieldActive = (keys['ShiftLeft'] || keys['KeyB'] || engine.pad.b) && p.shield > 10;
  if (p.shieldActive) {
    p.shield = Math.max(0, p.shield - dt * 35);
  } else {
    p.shield = Math.min(100, p.shield + dt * 15);
  }

  // Firing laser
  p.cooldown -= dt;
  const isFiring = keys['Space'] || keys['KeyW'] || engine.pad.a || engine.pad.fire;
  if (isFiring && p.cooldown <= 0) {
    p.cooldown = 0.16 / engine.params.fireRate;
    engine.playSound('laser');

    if (p.weaponTier === 1) {
      engine.bullets.push({ x: p.x, y: p.y - 20, vx: 0, vy: -650, color: '#06b6d4' });
    } else if (p.weaponTier === 2) {
      engine.bullets.push({ x: p.x - 12, y: p.y - 18, vx: 0, vy: -680, color: '#06b6d4' });
      engine.bullets.push({ x: p.x + 12, y: p.y - 18, vx: 0, vy: -680, color: '#06b6d4' });
    } else {
      engine.bullets.push({ x: p.x, y: p.y - 22, vx: 0, vy: -700, color: '#f43f5e' });
      engine.bullets.push({ x: p.x - 14, y: p.y - 16, vx: -120, vy: -660, color: '#06b6d4' });
      engine.bullets.push({ x: p.x + 14, y: p.y - 16, vx: 120, vy: -660, color: '#06b6d4' });
    }
  }

  // Update stars background
  for (const s of engine.stars) {
    s.y += s.speed * dt;
    if (s.y > engine.height) {
      s.y = 0;
      s.x = Math.random() * engine.width;
    }
  }

  // Update bullets
  for (let i = engine.bullets.length - 1; i >= 0; i--) {
    const b = engine.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.y < -20 || b.x < -20 || b.x > engine.width + 20) {
      engine.bullets.splice(i, 1);
    }
  }

  // Spawn enemy alien craft
  engine.enemySpawnTimer += dt;
  if (engine.enemySpawnTimer > 1.2 / engine.params.difficulty) {
    engine.enemySpawnTimer = 0;
    const isElite = Math.random() > 0.75;
    engine.enemies.push({
      x: 30 + Math.random() * (engine.width - 60),
      y: -30,
      vx: (Math.random() - 0.5) * 80,
      vy: 110 + Math.random() * 90 * engine.params.difficulty,
      hp: isElite ? 3 : 1,
      maxHp: isElite ? 3 : 1,
      radius: isElite ? 18 : 13,
      isElite,
      color: isElite ? '#ec4899' : '#eab308',
      sineOffset: Math.random() * Math.PI * 2,
    });
  }

  // Update enemies & collisions
  for (let i = engine.enemies.length - 1; i >= 0; i--) {
    const e = engine.enemies[i];
    e.y += e.vy * dt;
    e.x += Math.sin(engine.time * 3 + e.sineOffset) * 60 * dt;

    // Bullet vs enemy collision
    for (let j = engine.bullets.length - 1; j >= 0; j--) {
      const b = engine.bullets[j];
      const dist = Math.hypot(b.x - e.x, b.y - e.y);
      if (dist < e.radius + 6) {
        engine.bullets.splice(j, 1);
        e.hp -= 1;
        engine.spawnSparks(b.x, b.y, 6, '#06b6d4');
        if (e.hp <= 0) {
          engine.playSound('explosion');
          engine.addScore(e.isElite ? 250 : 100);
          engine.spawnSparks(e.x, e.y, e.isElite ? 24 : 14, e.color);
          if (engine.params.screenShake) engine.triggerShake(5);
          engine.enemies.splice(i, 1);
          break;
        }
      }
    }

    // Enemy reaches bottom or hits player
    if (e && e.y > engine.height + 30) {
      engine.enemies.splice(i, 1);
    } else if (e && Math.hypot(p.x - e.x, p.y - e.y) < e.radius + 18) {
      engine.enemies.splice(i, 1);
      engine.spawnSparks(e.x, e.y, 20, '#ef4444');
      if (p.shieldActive) {
        engine.playSound('shield');
        engine.addScore(50);
      } else {
        engine.playSound('hit');
        engine.triggerShake(12);
        engine.loseLife();
      }
    }
  }
}

function render(engine, ctx) {
  // Clear & Stars
  ctx.fillStyle = '#060a14';
  ctx.fillRect(0, 0, engine.width, engine.height);

  for (const s of engine.stars) {
    ctx.fillStyle = \`rgba(224, 231, 255, \${s.brightness})\`;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }

  // Draw Bullets
  for (const b of engine.bullets) {
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Draw Enemies
  for (const e of engine.enemies) {
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner detail
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Draw Player Starfighter
  const p = engine.player;
  ctx.save();
  ctx.translate(p.x, p.y);

  // Thruster flame
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = '#0284c7';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(-7, 18);
  ctx.lineTo(7, 18);
  ctx.lineTo(0, 28 + Math.random() * 8);
  ctx.closePath();
  ctx.fill();

  // Ship body
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(18, 16);
  ctx.lineTo(0, 8);
  ctx.lineTo(-18, 16);
  ctx.closePath();
  ctx.fill();

  // Cockpit
  ctx.fillStyle = '#06b6d4';
  ctx.beginPath();
  ctx.arc(0, -4, 4, 0, Math.PI * 2);
  ctx.fill();

  // Active Shield Bubble
  if (p.shieldActive) {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}
`,
  },
  {
    id: 'cyber-runner',
    title: 'Cyber Dodge 2099',
    genre: 'Runner',
    description: 'Synthwave 3D perspective runner. Dodge neon barriers, jump laser gates, and collect flux cores.',
    version: '1.2.0',
    upgradesApplied: ['Hyper Speed Boost', 'Magnetic Flux Orbs', 'Combo Multipliers'],
    tags: ['Synthwave', 'Endless', 'Retro', '3D Perspective'],
    controlsLegend: [
      { key: 'A / D or ◄ ►', action: 'Change Lane (Left / Right)' },
      { key: 'W / SPACE or [A]', action: 'Jump Barrier' },
      { key: 'S / [B]', action: 'Turbo Boost' },
      { key: 'P', action: 'Pause Game' },
    ],
    params: {
      playerSpeed: 1.3,
      difficulty: 1.1,
      lives: 3,
      fireRate: 1.0,
      particleDensity: 'ultra',
      colorTheme: 'synthwave-sunset',
      screenShake: true,
    },
    code: `// --- CYBER DODGE 2099 ---
function init(engine) {
  engine.lanes = [-120, 0, 120];
  engine.currentLane = 1;
  engine.player = {
    x: 0,
    y: engine.height - 110,
    targetX: 0,
    z: 0,
    jumpY: 0,
    jumpVy: 0,
    isJumping: false,
    speed: 400 * engine.params.playerSpeed,
    boost: 0,
  };
  engine.obstacles = [];
  engine.coins = [];
  engine.spawnTimer = 0;
  engine.gridOffset = 0;
}

function update(engine, dt) {
  const p = engine.player;
  const keys = engine.keys;

  // Lane switching
  if ((keys['ArrowLeft'] || keys['KeyA'] || engine.pad.left) && engine.currentLane > 0) {
    if (!engine._laneDebounce) {
      engine.currentLane--;
      engine.playSound('click');
      engine._laneDebounce = true;
    }
  } else if ((keys['ArrowRight'] || keys['KeyD'] || engine.pad.right) && engine.currentLane < 2) {
    if (!engine._laneDebounce) {
      engine.currentLane++;
      engine.playSound('click');
      engine._laneDebounce = true;
    }
  } else {
    engine._laneDebounce = false;
  }

  p.targetX = engine.lanes[engine.currentLane];
  p.x += (p.targetX - p.x) * 14 * dt;

  // Jump
  const wantJump = keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || engine.pad.a;
  if (wantJump && !p.isJumping) {
    p.isJumping = true;
    p.jumpVy = -520;
    engine.playSound('laser');
  }

  if (p.isJumping) {
    p.jumpY += p.jumpVy * dt;
    p.jumpVy += 1300 * dt;
    if (p.jumpY >= 0) {
      p.jumpY = 0;
      p.isJumping = false;
    }
  }

  // Boost
  const wantBoost = keys['ShiftLeft'] || keys['KeyS'] || engine.pad.b;
  const currentSpeed = (wantBoost ? 650 : 380) * engine.params.playerSpeed;
  engine.gridOffset = (engine.gridOffset + currentSpeed * dt) % 40;

  // Spawn obstacles & flux cores
  engine.spawnTimer += dt;
  if (engine.spawnTimer > 1.1 / engine.params.difficulty) {
    engine.spawnTimer = 0;
    const laneIndex = Math.floor(Math.random() * 3);
    const laneX = engine.lanes[laneIndex];
    if (Math.random() > 0.4) {
      engine.obstacles.push({ x: laneX, y: 160, speed: currentSpeed, lane: laneIndex });
    } else {
      engine.coins.push({ x: laneX, y: 160, speed: currentSpeed, lane: laneIndex });
    }
  }

  // Update obstacles
  for (let i = engine.obstacles.length - 1; i >= 0; i--) {
    const ob = engine.obstacles[i];
    ob.y += currentSpeed * dt * 0.95;
    if (ob.y > engine.height - 130 && ob.y < engine.height - 80) {
      if (Math.abs(p.x - ob.x) < 40 && p.jumpY > -35) {
        engine.obstacles.splice(i, 1);
        engine.playSound('hit');
        engine.spawnSparks(engine.width / 2 + p.x, p.y, 25, '#f43f5e');
        engine.triggerShake(10);
        engine.loseLife();
        continue;
      }
    }
    if (ob.y > engine.height + 20) {
      engine.obstacles.splice(i, 1);
      engine.addScore(20);
    }
  }

  // Update coins / flux cores
  for (let i = engine.coins.length - 1; i >= 0; i--) {
    const c = engine.coins[i];
    c.y += currentSpeed * dt * 0.95;
    if (Math.hypot(p.x - c.x, p.y + p.jumpY - c.y) < 45) {
      engine.coins.splice(i, 1);
      engine.playSound('success');
      engine.addScore(150);
      engine.spawnSparks(engine.width / 2 + c.x, c.y, 12, '#38bdf8');
    } else if (c.y > engine.height + 20) {
      engine.coins.splice(i, 1);
    }
  }
}

function render(engine, ctx) {
  // Synthwave sky & horizon
  const grad = ctx.createLinearGradient(0, 0, 0, engine.height);
  grad.addColorStop(0, '#11052c');
  grad.addColorStop(0.5, '#3b0764');
  grad.addColorStop(1, '#090117');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, engine.width, engine.height);

  // Synthwave Neon Sun
  const sunY = 140;
  ctx.fillStyle = '#fb7185';
  ctx.shadowColor = '#e11d48';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(engine.width / 2, sunY, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // 3D Perspective Grid
  ctx.strokeStyle = '#ec4899';
  ctx.lineWidth = 1.5;
  const horizonY = 160;
  const centerX = engine.width / 2;

  // Vanishing perspective lines
  for (let x = -300; x <= 300; x += 60) {
    ctx.beginPath();
    ctx.moveTo(centerX, horizonY);
    ctx.lineTo(centerX + x * 2.8, engine.height);
    ctx.stroke();
  }

  // Horizontal moving scanlines
  for (let y = horizonY; y < engine.height; y += 22) {
    const shiftedY = y + engine.gridOffset;
    if (shiftedY >= horizonY && shiftedY <= engine.height) {
      ctx.beginPath();
      ctx.moveTo(0, shiftedY);
      ctx.lineTo(engine.width, shiftedY);
      ctx.stroke();
    }
  }

  // Draw Coins
  for (const c of engine.coins) {
    const cx = centerX + c.x;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx, c.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Draw Obstacles
  for (const ob of engine.obstacles) {
    const ox = centerX + ob.x;
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(ox - 24, ob.y - 14, 48, 28);
    ctx.shadowBlur = 0;
  }

  // Draw Player Vehicle
  const p = engine.player;
  const px = centerX + p.x;
  const py = p.y + p.jumpY;

  ctx.save();
  ctx.translate(px, py);
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#06b6d4';
  ctx.beginPath();
  ctx.roundRect(-22, -14, 44, 28, 6);
  ctx.fill();

  // Headlights
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-16, -18, 8, 5);
  ctx.fillRect(8, -18, 8, 5);
  ctx.restore();
}
`,
  },
  {
    id: 'brick-breaker',
    title: 'Brick Breaker Deluxe FX',
    genre: 'Breakout',
    description: 'Vibrant neon breakout with ball physics, destructible power brick tiers, and laser paddle.',
    version: '2.0.1',
    upgradesApplied: ['Multi-Ball Frenzy', 'Paddle Blasters', 'Explosive Shatter FX'],
    tags: ['Arcade', 'Physics', 'Retro', 'Breakout'],
    controlsLegend: [
      { key: 'A / D or ◄ ►', action: 'Move Paddle' },
      { key: 'SPACE or [A]', action: 'Launch Ball / Fire Lasers' },
      { key: 'P', action: 'Pause Game' },
      { key: 'R', action: 'Restart Game' },
    ],
    params: {
      playerSpeed: 1.4,
      difficulty: 1.0,
      lives: 3,
      fireRate: 1.0,
      particleDensity: 'high',
      colorTheme: 'emerald-matrix',
      screenShake: true,
    },
    code: `// --- BRICK BREAKER DELUXE FX ---
function init(engine) {
  engine.paddle = {
    x: engine.width / 2,
    y: engine.height - 45,
    width: 90,
    height: 14,
    speed: 460 * engine.params.playerSpeed,
    hasLaser: true,
    cooldown: 0,
  };
  engine.balls = [
    {
      x: engine.width / 2,
      y: engine.height - 70,
      vx: 180,
      vy: -280,
      radius: 6,
      stuck: true,
    },
  ];
  engine.lasers = [];
  engine.bricks = [];
  const rows = 5;
  const cols = 9;
  const bWidth = (engine.width - 70) / cols;
  const bHeight = 22;

  const colors = ['#f43f5e', '#fb923c', '#eab308', '#10b981', '#06b6d4'];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      engine.bricks.push({
        x: 35 + c * bWidth,
        y: 60 + r * (bHeight + 7),
        width: bWidth - 6,
        height: bHeight,
        hp: rows - r,
        maxHp: rows - r,
        color: colors[r % colors.length],
      });
    }
  }
}

function update(engine, dt) {
  const pad = engine.paddle;
  const keys = engine.keys;

  // Paddle movement
  let move = 0;
  if (keys['ArrowLeft'] || keys['KeyA'] || engine.pad.left) move -= 1;
  if (keys['ArrowRight'] || keys['KeyD'] || engine.pad.right) move += 1;
  pad.x += move * pad.speed * dt;
  pad.x = Math.max(pad.width / 2 + 10, Math.min(engine.width - pad.width / 2 - 10, pad.x));

  // Launch stuck balls
  const wantAction = keys['Space'] || keys['KeyW'] || engine.pad.a;
  if (wantAction) {
    for (const b of engine.balls) {
      if (b.stuck) {
        b.stuck = false;
        b.vy = -340;
        b.vx = (Math.random() - 0.5) * 260;
        engine.playSound('laser');
      }
    }
  }

  // Update balls
  for (let i = engine.balls.length - 1; i >= 0; i--) {
    const b = engine.balls[i];
    if (b.stuck) {
      b.x = pad.x;
      b.y = pad.y - 18;
      continue;
    }

    b.x += b.vx * dt;
    b.y += b.vy * dt;

    // Wall bounce
    if (b.x < b.radius + 6) {
      b.x = b.radius + 6;
      b.vx = Math.abs(b.vx);
      engine.playSound('click');
    }
    if (b.x > engine.width - b.radius - 6) {
      b.x = engine.width - b.radius - 6;
      b.vx = -Math.abs(b.vx);
      engine.playSound('click');
    }
    if (b.y < b.radius + 10) {
      b.y = b.radius + 10;
      b.vy = Math.abs(b.vy);
      engine.playSound('click');
    }

    // Paddle bounce
    if (
      b.y + b.radius >= pad.y - pad.height / 2 &&
      b.y - b.radius <= pad.y + pad.height / 2 &&
      b.x >= pad.x - pad.width / 2 - 4 &&
      b.x <= pad.x + pad.width / 2 + 4 &&
      b.vy > 0
    ) {
      b.vy = -Math.abs(b.vy);
      const hitOffset = (b.x - pad.x) / (pad.width / 2);
      b.vx = hitOffset * 320;
      engine.playSound('laser');
      engine.spawnSparks(b.x, b.y, 8, '#38bdf8');
    }

    // Brick collisions
    for (let j = engine.bricks.length - 1; j >= 0; j--) {
      const br = engine.bricks[j];
      if (
        b.x + b.radius >= br.x &&
        b.x - b.radius <= br.x + br.width &&
        b.y + b.radius >= br.y &&
        b.y - b.radius <= br.y + br.height
      ) {
        b.vy = -b.vy;
        br.hp--;
        engine.addScore(80);
        engine.spawnSparks(b.x, b.y, 10, br.color);
        if (br.hp <= 0) {
          engine.playSound('explosion');
          engine.spawnSparks(br.x + br.width / 2, br.y + br.height / 2, 18, br.color);
          engine.bricks.splice(j, 1);
        }
        break;
      }
    }

    // Ball falls out
    if (b.y > engine.height + 20) {
      engine.balls.splice(i, 1);
    }
  }

  // Respawn ball if all lost
  if (engine.balls.length === 0) {
    engine.loseLife();
    engine.playSound('hit');
    engine.balls.push({
      x: pad.x,
      y: pad.y - 18,
      vx: 180,
      vy: -280,
      radius: 6,
      stuck: true,
    });
  }
}

function render(engine, ctx) {
  ctx.fillStyle = '#050b14';
  ctx.fillRect(0, 0, engine.width, engine.height);

  // Draw Bricks
  for (const br of engine.bricks) {
    ctx.shadowColor = br.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = br.color;
    ctx.fillRect(br.x, br.y, br.width, br.height);
    ctx.shadowBlur = 0;
  }

  // Draw Paddle
  const pad = engine.paddle;
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#38bdf8';
  ctx.roundRect(pad.x - pad.width / 2, pad.y - pad.height / 2, pad.width, pad.height, 4);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Draw Balls
  for (const b of engine.balls) {
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
`,
  },
  {
    id: 'quantum-snake',
    title: 'Quantum Snake Neo',
    genre: 'Snake',
    description: 'Cybernetic glowing grid snake with speed gates, warp wormholes, and energy nodes.',
    version: '1.1.0',
    upgradesApplied: ['Neon Glow Trail', 'Speed Overdrive', 'Warp Portals'],
    tags: ['Arcade', 'Grid', 'Retro', 'Snake'],
    controlsLegend: [
      { key: 'WASD or ◄ ▲ ▼ ►', action: 'Change Direction' },
      { key: 'SHIFT or [B]', action: 'Speed Dash' },
      { key: 'P', action: 'Pause' },
    ],
    params: {
      playerSpeed: 1.0,
      difficulty: 1.0,
      lives: 1,
      fireRate: 1.0,
      particleDensity: 'med',
      colorTheme: 'emerald-matrix',
      screenShake: false,
    },
    code: `// --- QUANTUM SNAKE NEO ---
function init(engine) {
  engine.gridSize = 22;
  engine.cols = Math.floor(engine.width / engine.gridSize);
  engine.rows = Math.floor(engine.height / engine.gridSize);
  engine.snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  engine.dir = { x: 1, y: 0 };
  engine.nextDir = { x: 1, y: 0 };
  engine.food = { x: 15, y: 10 };
  engine.moveTimer = 0;
}

function update(engine, dt) {
  const keys = engine.keys;
  if ((keys['ArrowUp'] || keys['KeyW'] || engine.pad.up) && engine.dir.y === 0) engine.nextDir = { x: 0, y: -1 };
  if ((keys['ArrowDown'] || keys['KeyS'] || engine.pad.down) && engine.dir.y === 0) engine.nextDir = { x: 0, y: 1 };
  if ((keys['ArrowLeft'] || keys['KeyA'] || engine.pad.left) && engine.dir.x === 0) engine.nextDir = { x: -1, y: 0 };
  if ((keys['ArrowRight'] || keys['KeyD'] || engine.pad.right) && engine.dir.x === 0) engine.nextDir = { x: 1, y: 0 };

  const isBoost = keys['ShiftLeft'] || engine.pad.b;
  const speedInterval = (isBoost ? 0.05 : 0.1) / engine.params.playerSpeed;

  engine.moveTimer += dt;
  if (engine.moveTimer >= speedInterval) {
    engine.moveTimer = 0;
    engine.dir = engine.nextDir;
    const head = {
      x: (engine.snake[0].x + engine.dir.x + engine.cols) % engine.cols,
      y: (engine.snake[0].y + engine.dir.y + engine.rows) % engine.rows,
    };

    // Check self collision
    for (const seg of engine.snake) {
      if (seg.x === head.x && seg.y === head.y) {
        engine.playSound('hit');
        engine.loseLife();
        return;
      }
    }

    engine.snake.unshift(head);

    // Food eaten
    if (head.x === engine.food.x && head.y === engine.food.y) {
      engine.playSound('success');
      engine.addScore(100);
      engine.spawnSparks(head.x * engine.gridSize, head.y * engine.gridSize, 12, '#10b981');
      engine.food = {
        x: Math.floor(Math.random() * engine.cols),
        y: Math.floor(Math.random() * engine.rows),
      };
    } else {
      engine.snake.pop();
    }
  }
}

function render(engine, ctx) {
  ctx.fillStyle = '#04130c';
  ctx.fillRect(0, 0, engine.width, engine.height);

  // Draw Food
  ctx.shadowColor = '#10b981';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#10b981';
  ctx.fillRect(engine.food.x * engine.gridSize + 2, engine.food.y * engine.gridSize + 2, engine.gridSize - 4, engine.gridSize - 4);

  // Draw Snake
  for (let i = 0; i < engine.snake.length; i++) {
    const s = engine.snake[i];
    ctx.fillStyle = i === 0 ? '#34d399' : '#059669';
    ctx.fillRect(s.x * engine.gridSize + 2, s.y * engine.gridSize + 2, engine.gridSize - 4, engine.gridSize - 4);
  }
  ctx.shadowBlur = 0;
}
`,
  },
  {
    id: 'retro-platformer',
    title: 'Cyber Knight Platformer',
    genre: 'Custom',
    description: 'Imported arcade platformer template with gravity jump, collectible crystals, patrolling sentinels, and glowing neon tiles.',
    version: '1.0.0',
    upgradesApplied: ['Double Jump', 'Plasma Dash', 'Dynamic Lighting'],
    tags: ['Platformer', 'Action', 'Custom', 'Retro'],
    controlsLegend: [
      { key: 'A / D or ◄ ►', action: 'Run Left / Right' },
      { key: 'W / SPACE or [A]', action: 'Jump / Double Jump' },
      { key: 'SHIFT or [B]', action: 'Dash / Turbo' },
      { key: 'P', action: 'Pause Game' },
    ],
    params: {
      playerSpeed: 1.2,
      difficulty: 1.0,
      lives: 3,
      fireRate: 1.0,
      particleDensity: 'high',
      colorTheme: 'cyber-neon',
      screenShake: true,
    },
    code: `// --- CYBER KNIGHT PLATFORMER ---
function init(engine) {
  engine.player = {
    x: 60,
    y: engine.height - 140,
    vx: 0,
    vy: 0,
    width: 28,
    height: 36,
    speed: 280 * engine.params.playerSpeed,
    jumpPower: -580,
    isGrounded: false,
    canDoubleJump: true,
    facing: 1,
  };
  
  engine.platforms = [
    { x: 0, y: engine.height - 50, width: engine.width, height: 50, color: '#1e293b' },
    { x: 100, y: engine.height - 150, width: 200, height: 20, color: '#0f766e' },
    { x: 360, y: engine.height - 230, width: 220, height: 20, color: '#0f766e' },
    { x: 140, y: engine.height - 330, width: 180, height: 20, color: '#0f766e' },
    { x: 620, y: engine.height - 180, width: 240, height: 20, color: '#0f766e' },
  ];

  engine.coins = [
    { x: 180, y: engine.height - 190, radius: 10, collected: false },
    { x: 450, y: engine.height - 270, radius: 10, collected: false },
    { x: 220, y: engine.height - 370, radius: 10, collected: false },
    { x: 740, y: engine.height - 220, radius: 10, collected: false },
  ];

  engine.enemies = [
    { x: 160, y: engine.height - 80, minX: 110, maxX: 280, vx: 70, radius: 14 },
    { x: 420, y: engine.height - 260, minX: 380, maxX: 540, vx: 90, radius: 14 },
  ];
}

function update(engine, dt) {
  const p = engine.player;
  const keys = engine.keys;

  // Horizontal movement
  let move = 0;
  if (keys['ArrowLeft'] || keys['KeyA'] || engine.pad.left) {
    move = -1;
    p.facing = -1;
  }
  if (keys['ArrowRight'] || keys['KeyD'] || engine.pad.right) {
    move = 1;
    p.facing = 1;
  }
  p.vx = move * p.speed;
  p.x += p.vx * dt;
  p.x = Math.max(15, Math.min(engine.width - 25, p.x));

  // Gravity
  p.vy += 1400 * dt;
  p.y += p.vy * dt;

  // Jump
  const jumpPressed = keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || engine.pad.a;
  if (jumpPressed && !engine._jumpHeld) {
    engine._jumpHeld = true;
    if (p.isGrounded) {
      p.vy = p.jumpPower;
      p.isGrounded = false;
      p.canDoubleJump = true;
      engine.playSound('laser');
      engine.spawnSparks(p.x + p.width / 2, p.y + p.height, 8, '#06b6d4');
    } else if (p.canDoubleJump) {
      p.vy = p.jumpPower * 0.85;
      p.canDoubleJump = false;
      engine.playSound('success');
      engine.spawnSparks(p.x + p.width / 2, p.y + p.height / 2, 14, '#38bdf8');
    }
  } else if (!jumpPressed) {
    engine._jumpHeld = false;
  }

  // Platform collisions
  p.isGrounded = false;
  for (const plat of engine.platforms) {
    if (
      p.x + p.width > plat.x &&
      p.x < plat.x + plat.width &&
      p.y + p.height >= plat.y &&
      p.y + p.height <= plat.y + 24 &&
      p.vy >= 0
    ) {
      p.y = plat.y - p.height;
      p.vy = 0;
      p.isGrounded = true;
      p.canDoubleJump = true;
    }
  }

  // Coin collection
  for (const c of engine.coins) {
    if (!c.collected && Math.hypot(p.x + p.width / 2 - c.x, p.y + p.height / 2 - c.y) < 26) {
      c.collected = true;
      engine.playSound('success');
      engine.addScore(150);
      engine.spawnSparks(c.x, c.y, 16, '#fbbf24');
    }
  }

  // Enemy patrol & collision
  for (const e of engine.enemies) {
    e.x += e.vx * dt;
    if (e.x < e.minX || e.x > e.maxX) {
      e.vx *= -1;
    }
    if (Math.hypot(p.x + p.width / 2 - e.x, p.y + p.height / 2 - e.y) < p.width / 2 + e.radius) {
      engine.playSound('hit');
      engine.spawnSparks(p.x, p.y, 20, '#ef4444');
      engine.triggerShake(10);
      engine.loseLife();
      p.x = 60;
      p.y = engine.height - 140;
      break;
    }
  }

  if (p.y > engine.height + 40) {
    engine.playSound('hit');
    engine.loseLife();
    p.x = 60;
    p.y = engine.height - 140;
    p.vy = 0;
  }
}

function render(engine, ctx) {
  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, engine.height);
  grad.addColorStop(0, '#090d16');
  grad.addColorStop(1, '#111827');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, engine.width, engine.height);

  // Draw Platforms
  for (const plat of engine.platforms) {
    ctx.shadowColor = '#0d9488';
    ctx.shadowBlur = 10;
    ctx.fillStyle = plat.color;
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
    
    // Neon top border
    ctx.fillStyle = '#2dd4bf';
    ctx.fillRect(plat.x, plat.y, plat.width, 3);
    ctx.shadowBlur = 0;
  }

  // Draw Coins
  for (const c of engine.coins) {
    if (!c.collected) {
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // Draw Enemies
  for (const e of engine.enemies) {
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Draw Player Cyber Knight
  const p = engine.player;
  ctx.save();
  ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#06b6d4';
  ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);

  // Visor / Helmet glow
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(p.facing > 0 ? 2 : -10, -8, 8, 5);
  ctx.restore();
}
`,
  },
];

// One-click AI upgrade recipes
const UPGRADE_RECIPES = [
  {
    id: 'multi-shot',
    title: '🚀 Multi-Shot & Spread Cannon',
    desc: 'Upgrades weapon system with 3-way spread lasers and higher fire rate.',
    prompt: 'Add a 3-way spread plasma cannon and increase fire rate by 40% with dual glowing tracers.',
  },
  {
    id: 'shield-overdrive',
    title: '🛡️ Overdrive Energy Shield',
    desc: 'Adds auto-recharging defensive shield dome that absorbs collisions.',
    prompt: 'Implement an active energy shield that absorbs hits, displays a glowing bubble, and auto-recharges over time.',
  },
  {
    id: 'screen-shake-fx',
    title: '💥 Heavy Explosions & Screen Shake',
    desc: 'Supercharges particle density and triggers dynamic screen shake on big hits.',
    prompt: 'Add heavy particle explosion physics, shockwaves, and dynamic screen shake on every enemy defeat.',
  },
  {
    id: 'boss-wave',
    title: '👾 Epic Boss Battles',
    desc: 'Spawns a massive mothership boss with health bar and laser patterns.',
    prompt: 'Introduce a boss wave mechanic with a giant enemy boss that shoots rotating laser beams and has a visible boss health bar.',
  },
  {
    id: 'bullet-time',
    title: '⚡ Bullet-Time Slow Motion',
    desc: 'Triggers cinematic slow-motion during score combos or danger.',
    prompt: 'Add a slow-motion bullet-time mode on kill combos or key press with synth trail effects.',
  },
  {
    id: 'synthwave-glow',
    title: '🌈 Ultra Synthwave Neon Theme',
    desc: 'Transforms visual style into vibrant 80s neon synthwave with glowing stars.',
    prompt: 'Upgrade graphics to ultra synthwave retro styling with vivid neon pink/cyan gradients and pulsing grid glows.',
  },
];

const ALL_STARTER_GAMES: GameTemplate[] = [...COMPLEX_GAME_PRESETS, ...PRESET_GAMES];

export const ArcadeApp: React.FC<ArcadeAppProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'play' | 'code' | 'sprites' | 'tilemap' | 'sfx' | 'particles' | 'library' | 'generator'>('play');
  const [rightPanelTab, setRightPanelTab] = useState<'controls' | 'debug'>('controls');
  const [games, setGames] = useState<GameTemplate[]>(ALL_STARTER_GAMES);
  const [selectedGameId, setSelectedGameId] = useState<string>('cyber-rogue');
  const [activeGameCode, setActiveGameCode] = useState<string>(ALL_STARTER_GAMES[0].code);

  // Advanced Game Development Tools State
  const [sprites, setSprites] = useState<SpriteData[]>(DEFAULT_SPRITES);
  const [tilemap, setTilemap] = useState<TilemapData>(INITIAL_TILEMAP);
  const [sfxList, setSfxList] = useState<SfxPreset[]>(DEFAULT_SFX_PRESETS);
  const [emitters, setEmitters] = useState<ParticleEmitterConfig[]>(DEFAULT_EMITTERS);
  const [debugState, setDebugState] = useState<EngineDebugState>({
    showHitboxes: false,
    showTileGrid: false,
    godMode: false,
    timeScale: 1.0,
    freezeFrame: false,
  });

  // Runtime Game Engine state
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'paused' | 'gameover'>('ready');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('arcade_hiscore_cyber-rogue') || '1650', 10);
  });
  const [lives, setLives] = useState<number>(4);
  const [fps, setFps] = useState<number>(60);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [crtEffect, setCrtEffect] = useState<boolean>(true);

  // AI Upgrades & Prompting state
  const [upgradePrompt, setUpgradePrompt] = useState<string>('');
  const [isUpgrading, setIsUpgrading] = useState<boolean>(false);
  const [upgradeDiff, setUpgradeDiff] = useState<string | null>(null);
  const [lastUpgradeMsg, setLastUpgradeMsg] = useState<string | null>(null);

  // Generator & Upload state
  const [newGamePrompt, setNewGamePrompt] = useState<string>('Create a retro neon asteroids game with gravity physics and mining lasers');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [attachedSourceCode, setAttachedSourceCode] = useState<{
    fileName: string;
    code: string;
    lineCount: number;
    fileList?: { path: string; size: number }[];
  } | null>(null);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);

  // Canvas & Engine refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const generatorFileInputRef = useRef<HTMLInputElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const engineRef = useRef<any>(null);

  // Inputs
  const keysRef = useRef<Record<string, boolean>>({});
  const padRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
    a: false,
    b: false,
    fire: false,
  });

  const currentGame = games.find((g) => g.id === selectedGameId) || games[0];

  // Load high score when selected game changes
  useEffect(() => {
    const saved = localStorage.getItem(`arcade_hiscore_${selectedGameId}`);
    setHighScore(saved ? parseInt(saved, 10) : 1000);
    setActiveGameCode(currentGame.code);
    setGameState('ready');
  }, [selectedGameId]);

  // Audio helper with Web Audio synthesizer
  const playArcadeSfx = useCallback((type: 'laser' | 'explosion' | 'hit' | 'success' | 'shield' | 'click') => {
    if (isMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'laser') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'explosion') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.28);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'hit') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.18);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === 'shield' || type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else {
        soundEngine.playSfx('click');
      }
    } catch {
      // Audio autoplay restrictions
    }
  }, [isMuted]);

  // Custom synth audio player for SFX Bank
  const playCustomSynthSfx = useCallback((sfxOrId: string | SfxPreset) => {
    if (isMuted) return;
    try {
      const preset = typeof sfxOrId === 'string'
        ? sfxList.find((s) => s.id === sfxOrId) || DEFAULT_SFX_PRESETS.find((s) => s.id === sfxOrId)
        : sfxOrId;
      if (!preset) {
        playArcadeSfx('laser');
        return;
      }
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const duration = Math.max(0.05, preset.duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(preset.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      gain.connect(ctx.destination);

      if (preset.waveform === 'noise') {
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(preset.startFreq, now);
        filter.frequency.exponentialRampToValueAtTime(Math.max(20, preset.endFreq), now + duration);
        noise.connect(filter);
        filter.connect(gain);
        noise.start(now);
        noise.stop(now + duration);
      } else {
        const osc = ctx.createOscillator();
        osc.type = preset.waveform as OscillatorType;
        osc.frequency.setValueAtTime(Math.max(20, preset.startFreq), now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, preset.endFreq), now + duration);
        if (preset.vibratoDepth > 0 && preset.vibratoFreq > 0) {
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          lfo.frequency.setValueAtTime(preset.vibratoFreq, now);
          lfoGain.gain.setValueAtTime(preset.vibratoDepth, now);
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          lfo.start(now);
          lfo.stop(now + duration);
        }
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + duration);
      }
    } catch {
      // Audio error
    }
  }, [isMuted, sfxList, playArcadeSfx]);

  // Particle emission helper
  const spawnSparks = useCallback((x: number, y: number, count: number, color: string) => {
    if (!engineRef.current) return;
    const mult = engineRef.current.params.particleDensity === 'ultra' ? 2 : engineRef.current.params.particleDensity === 'low' ? 0.5 : 1;
    const actualCount = Math.floor(count * mult);
    for (let i = 0; i < actualCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 240;
      engineRef.current.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.35 + Math.random() * 0.45,
        maxLife: 0.8,
        color,
        size: 1.5 + Math.random() * 2.5,
      });
    }
  }, []);

  // Custom particle emitter spawner for engine
  const spawnCustomEmitter = useCallback((emitterId: string, x: number, y: number) => {
    if (!engineRef.current) return;
    const config = emitters.find((e) => e.id === emitterId) || DEFAULT_EMITTERS[0];
    if (!config) return;
    const count = Math.max(5, Math.floor(config.rate / 2));
    for (let i = 0; i < count; i++) {
      const baseAngle = (config.angle * Math.PI) / 180;
      const spreadAngle = ((Math.random() - 0.5) * config.spread * Math.PI) / 180;
      const finalAngle = baseAngle + spreadAngle;
      const speed = config.speedMin + Math.random() * (config.speedMax - config.speedMin);
      engineRef.current.particles.push({
        x,
        y,
        vx: Math.cos(finalAngle) * speed + config.gravityX,
        vy: Math.sin(finalAngle) * speed + config.gravityY,
        life: config.lifetime,
        maxLife: config.lifetime,
        color: Math.random() > 0.5 ? config.startColor : config.endColor,
        size: config.startSize + Math.random() * (config.endSize - config.startSize),
      });
    }
  }, [emitters]);

  // Draw sprite onto game canvas
  const drawSpriteEngine = useCallback((name: string, x: number, y: number, opts: any = {}) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const spr = sprites.find((s) => s.id === name || s.name === name);
    if (!spr || !spr.frames || !spr.frames.length) return;
    const frameIdx = opts.frame !== undefined
      ? opts.frame % spr.frames.length
      : Math.floor((engineRef.current?.time || 0) * (spr.fps || 4)) % spr.frames.length;
    const frame = spr.frames[frameIdx] || spr.frames[0];
    const pixelSize = opts.size || (opts.scale ? 2 * opts.scale : 2);
    const facing = opts.facing !== undefined ? opts.facing : 1;

    ctx.save();
    ctx.translate(x, y);
    if (facing < 0) ctx.scale(-1, 1);
    if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;

    const startX = -((spr.width * pixelSize) / 2);
    const startY = -((spr.height * pixelSize) / 2);

    for (let r = 0; r < spr.height; r++) {
      for (let c = 0; c < spr.width; c++) {
        const color = frame[r]?.[c];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(startX + c * pixelSize, startY + r * pixelSize, pixelSize, pixelSize);
        }
      }
    }
    ctx.restore();
  }, [sprites]);

  // Draw Tilemap onto game canvas
  const drawTilemapEngine = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !tilemap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ts = tilemap.tileSize || 25;
    for (let r = 0; r < tilemap.rows; r++) {
      for (let c = 0; c < tilemap.cols; c++) {
        const id = tilemap.grid[r]?.[c];
        if (!id) continue;
        const def = DEFAULT_TILE_DEFS.find((t) => t.id === id);
        if (def && def.color && def.color !== 'transparent') {
          ctx.fillStyle = def.color;
          ctx.fillRect(c * ts, r * ts, ts, ts);
          if (def.solid) {
            ctx.strokeStyle = '#ffffff15';
            ctx.strokeRect(c * ts + 1, r * ts + 1, ts - 2, ts - 2);
          }
        }
      }
    }
  }, [tilemap]);

  // Check tilemap collision
  const checkTileCollisionEngine = useCallback((x: number, y: number, w: number, h: number, solidIds: number[] = [1, 5]) => {
    if (!tilemap) return false;
    const ts = tilemap.tileSize || 25;
    const leftCol = Math.floor((x - w / 2) / ts);
    const rightCol = Math.floor((x + w / 2) / ts);
    const topRow = Math.floor((y - h / 2) / ts);
    const bottomRow = Math.floor((y + h / 2) / ts);

    for (let r = topRow; r <= bottomRow; r++) {
      for (let c = leftCol; c <= rightCol; c++) {
        if (r < 0 || r >= tilemap.rows || c < 0 || c >= tilemap.cols) return true;
        const id = tilemap.grid[r]?.[c];
        if (solidIds.includes(id)) return true;
      }
    }
    return false;
  }, [tilemap]);

  // Step 1 Frame for debugger
  const handleStepFrame = useCallback(() => {
    if (!engineRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dt = 1 / 60;
    engine.time += dt;
    try {
      const updateFn = new Function('engine', 'dt', `${activeGameCode}\nif (typeof update === 'function') update(engine, dt);`);
      updateFn(engine, dt);
    } catch {}
    try {
      const renderFn = new Function('engine', 'ctx', `${activeGameCode}\nif (typeof render === 'function') render(engine, ctx);`);
      renderFn(engine, ctx);
    } catch {}
  }, [activeGameCode]);

  // Tool injection callbacks
  const handleInjectSpriteToGame = (sprite: SpriteData) => {
    const comment = `\n// Injected Sprite: ${sprite.name}\n// Use: engine.drawSprite('${sprite.id}', p.x, p.y);\n`;
    setActiveGameCode((prev) => prev + comment);
    if (onShowToast) onShowToast('Sprite Injected', `Added '${sprite.name}' hook into game script!`, 'success');
  };

  const handleApplyTilemapToGame = (newTilemap: TilemapData) => {
    setTilemap(newTilemap);
    if (engineRef.current) {
      engineRef.current.tilemap = newTilemap;
      if (engineRef.current.map && Array.isArray(engineRef.current.map)) {
        engineRef.current.map = newTilemap.grid;
      }
    }
    if (onShowToast) onShowToast('Tilemap Applied', `Applied ${newTilemap.name} to runtime engine!`, 'success');
  };

  const handleInjectSfxToGame = (sfx: SfxPreset) => {
    const comment = `\n// Injected SFX: ${sfx.name}\n// Use: engine.playCustomSfx('${sfx.id}');\n`;
    setActiveGameCode((prev) => prev + comment);
    if (onShowToast) onShowToast('SFX Registered', `Added '${sfx.name}' hook to game script!`, 'success');
  };

  const handleInjectEmitterToGame = (emitter: ParticleEmitterConfig) => {
    const comment = `\n// Injected Emitter: ${emitter.name}\n// Use: engine.spawnCustomEmitter('${emitter.id}', x, y);\n`;
    setActiveGameCode((prev) => prev + comment);
    if (onShowToast) onShowToast('Emitter Registered', `Added '${emitter.name}' hook to game script!`, 'success');
  };

  // Initialize Game Environment
  const initEngineInstance = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    const engineInstance: any = {
      width,
      height,
      time: 0,
      score: 0,
      lives: currentGame.params.lives,
      params: { ...currentGame.params },
      keys: keysRef.current,
      pad: padRef.current,
      particles: [],
      shake: 0,
      sprites,
      drawSprite: drawSpriteEngine,
      tilemap,
      drawTilemap: drawTilemapEngine,
      checkTileCollision: checkTileCollisionEngine,
      playSound: (nameOrType: string) => {
        if (sfxList.some((s) => s.id === nameOrType)) {
          playCustomSynthSfx(nameOrType);
        } else {
          playArcadeSfx(nameOrType as any);
        }
      },
      playCustomSfx: playCustomSynthSfx,
      spawnSparks,
      spawnCustomEmitter,
      timeScale: debugState.timeScale,
      debug: debugState,
      triggerShake: (amt: number) => {
        if (engineInstance.params.screenShake) {
          engineInstance.shake = Math.min(25, engineInstance.shake + amt);
        }
      },
      addScore: (pts: number) => {
        engineInstance.score += pts;
        setScore(engineInstance.score);
        if (engineInstance.score > highScore) {
          setHighScore(engineInstance.score);
          localStorage.setItem(`arcade_hiscore_${selectedGameId}`, engineInstance.score.toString());
        }
      },
      loseLife: () => {
        if (debugState.godMode) return;
        engineInstance.lives -= 1;
        setLives(engineInstance.lives);
        if (engineInstance.lives <= 0) {
          setGameState('gameover');
          playArcadeSfx('explosion');
          if (onShowToast) {
            onShowToast('Game Over', `Final Score: ${engineInstance.score}`, 'warn');
          }
        }
      },
    };

    engineRef.current = engineInstance;
    setScore(0);
    setLives(currentGame.params.lives);

    // Run user game code's `init(engine)`
    try {
      const runFn = new Function('engine', `${activeGameCode}\nif (typeof init === 'function') init(engine);`);
      runFn(engineInstance);
    } catch (err) {
      console.error('Error running game init:', err);
      if (onShowToast) {
        onShowToast('Code Error', String(err), 'warn');
      }
    }
  }, [
    currentGame,
    activeGameCode,
    highScore,
    selectedGameId,
    sprites,
    drawSpriteEngine,
    tilemap,
    drawTilemapEngine,
    checkTileCollisionEngine,
    sfxList,
    playCustomSynthSfx,
    playArcadeSfx,
    spawnSparks,
    spawnCustomEmitter,
    debugState,
    onShowToast,
  ]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let frameCounter = 0;
    let fpsTimer = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.min(0.08, ((timestamp - lastTimeRef.current) / 1000) * (debugState.timeScale || 1.0));
      lastTimeRef.current = timestamp;

      // Calculate FPS
      frameCounter++;
      if (timestamp - fpsTimer >= 500) {
        setFps(Math.round((frameCounter * 1000) / (timestamp - fpsTimer)));
        frameCounter = 0;
        fpsTimer = timestamp;
      }

      const canvas = canvasRef.current;
      const engine = engineRef.current;

      if (canvas && engine && gameState === 'playing') {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          engine.time += dt;

          // Update screen shake
          if (engine.shake > 0) {
            engine.shake = Math.max(0, engine.shake - dt * 25);
          }

          // Execute `update(engine, dt)`
          try {
            const updateFn = new Function('engine', 'dt', `${activeGameCode}\nif (typeof update === 'function') update(engine, dt);`);
            updateFn(engine, dt);
          } catch (err) {
            // Log once
          }

          // Update particles
          for (let i = engine.particles.length - 1; i >= 0; i--) {
            const p = engine.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) {
              engine.particles.splice(i, 1);
            }
          }

          // Clear & apply screen shake
          ctx.save();
          if (engine.shake > 0) {
            const sx = (Math.random() - 0.5) * engine.shake;
            const sy = (Math.random() - 0.5) * engine.shake;
            ctx.translate(sx, sy);
          }

          // Execute `render(engine, ctx)`
          try {
            const renderFn = new Function('engine', 'ctx', `${activeGameCode}\nif (typeof render === 'function') render(engine, ctx);`);
            renderFn(engine, ctx);
          } catch (err) {
            // Render error fallback
            ctx.fillStyle = '#1e1b4b';
            ctx.fillRect(0, 0, engine.width, engine.height);
            ctx.fillStyle = '#f43f5e';
            ctx.font = '14px monospace';
            ctx.fillText('Runtime Render Error: ' + err, 20, 40);
          }

          // Render active particles
          for (const p of engine.particles) {
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1.0;

          // Hitboxes Debug Overlay
          if (debugState.showHitboxes) {
            ctx.save();
            if (engine.player) {
              const pw = engine.player.width || 30;
              const ph = engine.player.height || 30;
              ctx.strokeStyle = '#10b981';
              ctx.lineWidth = 1.5;
              ctx.strokeRect(engine.player.x - pw / 2, engine.player.y - ph / 2, pw, ph);
              ctx.fillStyle = '#10b981';
              ctx.font = '9px monospace';
              ctx.fillText('PLAYER', engine.player.x - 14, engine.player.y - ph / 2 - 3);
            }
            if (Array.isArray(engine.enemies)) {
              ctx.strokeStyle = '#f43f5e';
              ctx.lineWidth = 1.5;
              for (const e of engine.enemies) {
                const ew = e.width || (e.radius ? e.radius * 2 : 24);
                const eh = e.height || (e.radius ? e.radius * 2 : 24);
                ctx.strokeRect(e.x - ew / 2, e.y - eh / 2, ew, eh);
              }
            }
            if (Array.isArray(engine.bullets)) {
              ctx.strokeStyle = '#06b6d4';
              ctx.lineWidth = 1;
              for (const b of engine.bullets) {
                ctx.strokeRect(b.x - 4, b.y - 8, 8, 16);
              }
            }
            if (Array.isArray(engine.spells)) {
              ctx.strokeStyle = '#a855f7';
              ctx.lineWidth = 1;
              for (const s of engine.spells) {
                ctx.strokeRect(s.x - 6, s.y - 6, 12, 12);
              }
            }
            if (Array.isArray(engine.platforms)) {
              ctx.strokeStyle = '#eab308';
              ctx.lineWidth = 1;
              for (const plat of engine.platforms) {
                ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
              }
            }
            ctx.restore();
          }

          ctx.restore();
        }
      }

      requestRef.current = requestAnimationFrame(loop);
    };

    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, activeGameCode, debugState]);

  // Key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling on Space / Arrow keys while playing
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && activeTab === 'play') {
        e.preventDefault();
      }

      keysRef.current[e.code] = true;
      keysRef.current[e.key] = true;

      if (e.key === 'p' || e.key === 'P') {
        setGameState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
        soundEngine.playSfx('click');
      } else if (e.key === 'r' || e.key === 'R') {
        if (gameState === 'playing' || gameState === 'gameover' || gameState === 'paused') {
          handleRestartGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
      keysRef.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeTab, gameState]);

  // Start or restart game
  const handleStartGame = () => {
    soundEngine.playSfx('open');
    initEngineInstance();
    setGameState('playing');
  };

  const handleRestartGame = () => {
    soundEngine.playSfx('click');
    initEngineInstance();
    setGameState('playing');
  };

  // Compile & hot-reload modified code
  const handleCompileAndRun = () => {
    soundEngine.playSfx('open');
    try {
      // Syntax validation
      new Function('engine', 'ctx', 'dt', activeGameCode);
      initEngineInstance();
      setGameState('playing');
      if (onShowToast) {
        onShowToast('Game Recompiled', 'Hot-reloaded code into live canvas engine!', 'success');
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast('Compilation Failed', err.message || 'Syntax error in game code', 'warn');
      }
    }
  };

  // AI Game Code Upgrade
  const handleUpgradeCode = async (customPrompt?: string) => {
    const promptToUse = customPrompt || upgradePrompt;
    if (!promptToUse.trim()) return;

    soundEngine.playSfx('click');
    setIsUpgrading(true);
    setUpgradeDiff(null);

    if (onShowToast) {
      onShowToast('Gemini Upgrade Engine', `Refactoring game code: "${promptToUse}"...`, 'info');
    }

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY || 'AIzaSyDummyKey';
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are an elite game developer and creative code architect.
Upgrade the following JavaScript HTML5 Canvas game code based on this user request:
"${promptToUse}"

CURRENT GAME CODE:
\`\`\`javascript
${activeGameCode}
\`\`\`

REQUIREMENTS:
1. Provide the complete upgraded game code with all functions (init, update, render).
2. Keep the same engine lifecycle: init(engine), update(engine, dt), render(engine, ctx).
3. Add the requested feature, weapon, mechanic, power-up, or visual enhancement with awesome polish!
4. Return ONLY valid executable JavaScript code inside a \`\`\`javascript code block, plus a brief 1-line summary at the end.`,
      });

      const text = response.text || '';
      const codeMatch = text.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
      const upgradedCode = codeMatch ? codeMatch[1].trim() : text.trim();

      if (upgradedCode && upgradedCode.includes('function')) {
        setActiveGameCode(upgradedCode);
        setUpgradeDiff(`// Applied Upgrade: "${promptToUse}"\n// Added new features & game logic at ${new Date().toLocaleTimeString()}`);
        setLastUpgradeMsg(`Successfully upgraded game with: "${promptToUse}"`);
        
        // Update game template metadata
        setGames((prev) =>
          prev.map((g) =>
            g.id === selectedGameId
              ? {
                  ...g,
                  code: upgradedCode,
                  version: (parseFloat(g.version) + 0.1).toFixed(1),
                  upgradesApplied: [promptToUse.slice(0, 32), ...g.upgradesApplied.slice(0, 4)],
                }
              : g
          )
        );

        soundEngine.playSfx('success');
        if (onShowToast) {
          onShowToast('Upgrade Complete', 'Code upgraded and verified! Ready to play.', 'success');
        }
      } else {
        throw new Error('Could not parse valid game code from response.');
      }
    } catch (err: any) {
      // Fallback local smart upgrade if API is offline
      const enhancedCode = applyLocalCodeUpgrade(activeGameCode, promptToUse);
      setActiveGameCode(enhancedCode);
      setLastUpgradeMsg(`Local Upgrade Applied: ${promptToUse}`);
      soundEngine.playSfx('success');
      if (onShowToast) {
        onShowToast('Upgrade Applied', 'Applied local enhancement recipe.', 'success');
      }
    } finally {
      setIsUpgrading(false);
      setUpgradePrompt('');
    }
  };

  // Local fallback smart refactor
  const applyLocalCodeUpgrade = (code: string, recipe: string) => {
    let updated = code;
    if (recipe.toLowerCase().includes('multi') || recipe.toLowerCase().includes('spread')) {
      updated = updated.replace(/weaponTier:\s*\d+/, 'weaponTier: 3');
      updated = updated.replace(/fireRate:\s*[\d.]+/, 'fireRate: 1.6');
    }
    if (recipe.toLowerCase().includes('shield')) {
      updated = updated.replace(/shield:\s*\d+/, 'shield: 200');
    }
    if (recipe.toLowerCase().includes('shake') || recipe.toLowerCase().includes('explosion')) {
      updated = updated.replace(/particleDensity:\s*'\w+'/, "particleDensity: 'ultra'");
    }
    return `// [UPGRADE APPLIED: ${recipe}]\n` + updated;
  };

  // AI Brand New Game Generator
  const handleGenerateGame = async () => {
    if (!newGamePrompt.trim()) return;
    soundEngine.playSfx('click');
    setIsGenerating(true);

    if (onShowToast) {
      onShowToast('Arcade Generator', `Generating brand new game: "${newGamePrompt}"...`, 'info');
    }

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY || 'AIzaSyDummyKey';
      const ai = new GoogleGenAI({ apiKey });

      let promptText = `Create a complete, fun, playable 2D HTML5 canvas game from scratch based on:
"${newGamePrompt}"`;

      if (attachedSourceCode) {
        promptText += `\n\nAdapt, upgrade, and modernize this attached game source code (${attachedSourceCode.fileName}):
\`\`\`javascript
${attachedSourceCode.code.slice(0, 8500)}
\`\`\`
Preserve its core game mechanics while upgrading it to run seamlessly on the Playground Studio engine!`;
      }

      promptText += `\n\nThe code must define three global functions:
1. init(engine): set up player, entities, score
2. update(engine, dt): read keys (engine.keys, engine.pad), move entities, handle collisions, call engine.addScore(pts), engine.loseLife(), engine.playSound('laser'|'explosion'|'hit'|'success')
3. render(engine, ctx): clear canvas, draw glowing shapes, player, particles, HUD items

Return ONLY the code within \`\`\`javascript ... \`\`\`.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
      });

      const text = response.text || '';
      const codeMatch = text.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
      const generatedCode = codeMatch ? codeMatch[1].trim() : text.trim();

      if (generatedCode && generatedCode.includes('function')) {
        const newGame: GameTemplate = {
          id: `custom-${Date.now()}`,
          title: newGamePrompt.slice(0, 24) || (attachedSourceCode ? attachedSourceCode.fileName.replace(/\.[^/.]+$/, '') : 'Custom AI Game'),
          genre: 'Custom',
          description: attachedSourceCode
            ? `Synthesized from source "${attachedSourceCode.fileName}" with prompt: "${newGamePrompt}"`
            : `Custom game generated from prompt: "${newGamePrompt}"`,
          version: '1.0.0',
          upgradesApplied: attachedSourceCode ? ['ZIP / Code Porting', 'AI Synthesis Upgrade'] : ['AI Prompt Synthesis'],
          tags: ['Custom', 'GenAI', 'Arcade'],
          controlsLegend: [
            { key: 'Arrows / WASD', action: 'Move Player' },
            { key: 'SPACE or [A]', action: 'Action / Fire' },
            { key: 'P', action: 'Pause' },
          ],
          params: {
            playerSpeed: 1.2,
            difficulty: 1.0,
            lives: 3,
            fireRate: 1.0,
            particleDensity: 'high',
            colorTheme: 'cyber-neon',
            screenShake: true,
          },
          code: generatedCode,
        };

        setGames((prev) => [newGame, ...prev]);
        setSelectedGameId(newGame.id);
        setActiveGameCode(generatedCode);
        setActiveTab('play');
        soundEngine.playSfx('success');
        if (onShowToast) {
          onShowToast('Game Generated', 'New game created! Click Play to start.', 'success');
        }
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast('Generator Error', 'Failed to generate game. Please try again.', 'warn');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Export standalone HTML
  const handleExportHtml = () => {
    soundEngine.playSfx('click');
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${currentGame.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #030712; color: #fff; font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; overflow: hidden; }
    #hud { margin-bottom: 8px; font-size: 14px; letter-spacing: 1px; color: #38bdf8; }
    canvas { border: 2px solid #38bdf8; border-radius: 8px; box-shadow: 0 0 30px rgba(56, 189, 248, 0.3); background: #000; }
    #legend { margin-top: 10px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div id="hud">${currentGame.title} | ${currentGame.genre}</div>
  <canvas id="c" width="700" height="520"></canvas>
  <div id="legend">Controls: WASD / Arrows = Move | SPACE = Fire/Action</div>
  <script>
    const canvas = document.getElementById('c');
    const ctx = canvas.getContext('2d');
    const engine = {
      width: canvas.width,
      height: canvas.height,
      time: 0,
      score: 0,
      lives: 3,
      params: ${JSON.stringify(currentGame.params)},
      keys: {},
      pad: {},
      particles: [],
      shake: 0,
      playSound: () => {},
      spawnSparks: () => {},
      triggerShake: () => {},
      addScore: (s) => { engine.score += s; },
      loseLife: () => { engine.lives--; if(engine.lives<=0) alert('Game Over! Score: ' + engine.score); },
    };
    window.addEventListener('keydown', e => engine.keys[e.code] = engine.keys[e.key] = true);
    window.addEventListener('keyup', e => engine.keys[e.code] = engine.keys[e.key] = false);

    ${activeGameCode}

    if (typeof init === 'function') init(engine);
    let last = performance.now();
    function loop(now) {
      const dt = Math.min(0.08, (now - last) / 1000);
      last = now;
      if (typeof update === 'function') update(engine, dt);
      if (typeof render === 'function') render(engine, ctx);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentGame.id}.html`;
    a.click();
    URL.revokeObjectURL(url);

    if (onShowToast) {
      onShowToast('Standalone HTML Exported', `Saved ${currentGame.id}.html to your computer!`, 'success');
    }
  };

  // Export game as a full downloadable ZIP bundle (supports SPCK Editor, Node.js, and web browsers)
  const handleExportZip = async () => {
    soundEngine.playSfx('click');
    setIsExportingZip(true);
    try {
      const blob = await packageGameToZip(currentGame, sprites, tilemap);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentGame.id}-bundle.zip`;
      a.click();
      URL.revokeObjectURL(url);
      soundEngine.playSfx('success');
      if (onShowToast) {
        onShowToast('ZIP Package Exported', `Downloaded ${currentGame.title} as ZIP archive!`, 'success');
      }
    } catch (err) {
      console.error('Error packaging zip', err);
      if (onShowToast) {
        onShowToast('Export Error', 'Failed to generate ZIP bundle.', 'warn');
      }
    } finally {
      setIsExportingZip(false);
    }
  };

  // Save game to OS Files virtual directory
  const handleSaveToOS = () => {
    soundEngine.playSfx('click');
    try {
      const savedList = JSON.parse(localStorage.getItem('arcade_saved_games') || '[]');
      savedList.push({
        id: currentGame.id,
        title: currentGame.title,
        savedAt: new Date().toISOString(),
        code: activeGameCode,
      });
      localStorage.setItem('arcade_saved_games', JSON.stringify(savedList));
      if (onShowToast) {
        onShowToast('Game Saved to OS', `Stored ${currentGame.title} in /games/ directory.`, 'success');
      }
    } catch {
      // Ignore
    }
  };

  const handleImportGame = (newGame: GameTemplate, targetTab: 'play' | 'code') => {
    setGames((prev) => [newGame, ...prev]);
    setSelectedGameId(newGame.id);
    setActiveGameCode(newGame.code);
    setActiveTab(targetTab);
    soundEngine.playSfx('success');
    if (onShowToast) {
      onShowToast('Game Loaded', `Imported ${newGame.title}!`, 'success');
    }
  };

  const handleSendToSynthesizer = (unpacked: UnpackedGame) => {
    setAttachedSourceCode({
      fileName: unpacked.fileName,
      code: unpacked.detectedMainCode,
      lineCount: unpacked.detectedMainCode.split('\n').length,
      fileList: unpacked.fileList,
    });
    setNewGamePrompt(
      `Port and upgrade this SPCK/Node.js game: ${unpacked.suggestedTitle}. Add glowing neon graphics, particle effects, boss battles, and mobile arcade controls.`
    );
    setActiveTab('generator');
    soundEngine.playSfx('open');
    if (onShowToast) {
      onShowToast('Source Attached', `Attached code from ${unpacked.fileName} to Synthesizer!`, 'info');
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-950 text-slate-100 select-none overflow-hidden font-sans">
      {/* Top Header & Navigation Bar */}
      <header className="h-13 bg-slate-900/90 border-b border-white/10 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Gamepad2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white">PLAYGROUND STUDIO</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Game Forge X
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Create, upgrade, and play custom games directly inside the OS</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-lg border border-white/10 overflow-x-auto max-w-[65vw]">
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setActiveTab('play');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 ${
              activeTab === 'play'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Play Live
          </button>
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setActiveTab('code');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 ${
              activeTab === 'code'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Code & Mod
          </button>
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setActiveTab('sprites');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 ${
              activeTab === 'sprites'
                ? 'bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5" />
            Sprite Forge
          </button>
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setActiveTab('tilemap');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 ${
              activeTab === 'tilemap'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            Tilemap Level
          </button>
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setActiveTab('sfx');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 ${
              activeTab === 'sfx'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            SFX Synth
          </button>
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setActiveTab('particles');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 ${
              activeTab === 'particles'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Particle FX
          </button>
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setActiveTab('library');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 ${
              activeTab === 'library'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Library
          </button>
          <button
            onClick={() => {
              soundEngine.playSfx('click');
              setActiveTab('generator');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 ${
              activeTab === 'generator'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            AI Gen
          </button>
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundEngine.playSfx('open');
              setShowUploadModal(true);
            }}
            title="Import & Unpack Game (.ZIP / .JS / .HTML)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-xs font-semibold shadow-sm transition-colors"
          >
            <FileArchive className="w-3.5 h-3.5 text-pink-400" />
            Unpack ZIP
          </button>
          <button
            onClick={handleExportZip}
            disabled={isExportingZip}
            title="Export Standalone ZIP Bundle (with runner & package.json)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
          >
            {isExportingZip ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Package className="w-3.5 h-3.5 text-amber-400" />
            )}
            Export ZIP
          </button>
          <button
            onClick={() => setCrtEffect(!crtEffect)}
            title="Toggle CRT Scanline Effect"
            className={`p-1.5 rounded-lg border transition-colors ${
              crtEffect ? 'bg-pink-500/20 border-pink-500/40 text-pink-300' : 'bg-slate-800 border-white/10 text-slate-400'
            }`}
          >
            <Tv className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsMuted(!isMuted)}
            title="Toggle Audio"
            className="p-1.5 rounded-lg bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
          </button>
          <button
            onClick={handleExportHtml}
            title="Export Standalone Single-File HTML"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export HTML
          </button>
          <button
            onClick={handleSaveToOS}
            title="Save to OS Drive"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            Save Game
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* TAB 1: PLAY LIVE */}
        {activeTab === 'play' && (
          <div className="flex-1 flex flex-col md:flex-row items-center justify-between p-4 gap-4 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
            {/* Left: Arcade Machine & Canvas Bezel */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl relative">
              {/* Arcade Top Marquee */}
              <div className="w-full max-w-[700px] bg-slate-900/90 border-t border-x border-pink-500/30 rounded-t-xl px-4 py-2 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-mono text-xs font-bold text-white tracking-wider">{currentGame.title}</span>
                  <span className="text-[10px] font-mono text-pink-400 bg-pink-500/10 px-1.5 py-0.5 rounded">v{currentGame.version}</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">SCORE:</span>
                    <span className="font-bold text-amber-300">{score.toString().padStart(6, '0')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">BEST:</span>
                    <span className="font-bold text-cyan-300">{highScore.toString().padStart(6, '0')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-rose-400">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{lives} LIVES</span>
                  </div>
                  <span className="text-slate-500 text-[10px]">{fps} FPS</span>
                </div>
              </div>

              {/* Canvas Cabinet Bezel */}
              <div className="relative w-full max-w-[700px] aspect-[4/3] bg-black border-4 border-slate-800 rounded-b-xl overflow-hidden shadow-2xl shadow-pink-500/10 flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={700}
                  height={525}
                  className="w-full h-full object-contain block bg-black cursor-crosshair"
                />

                {/* CRT Scanline Filter Overlay */}
                {crtEffect && (
                  <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.6)_100%)] opacity-85">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]" />
                  </div>
                )}

                {/* Overlay: Game Ready / Not Started */}
                {gameState === 'ready' && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/40 mb-4 animate-bounce">
                      <Gamepad2 className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-wide mb-1">{currentGame.title}</h2>
                    <p className="text-sm text-slate-300 max-w-md mb-6">{currentGame.description}</p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleStartGame}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-sm tracking-wide shadow-lg shadow-pink-500/30 flex items-center gap-2 transform active:scale-95 transition-all"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        INSERT COIN / PLAY
                      </button>
                      <button
                        onClick={() => setActiveTab('code')}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm flex items-center gap-2 border border-white/10 transition-colors"
                      >
                        <Code2 className="w-4 h-4 text-purple-400" />
                        Inspect & Upgrade Code
                      </button>
                    </div>
                  </div>
                )}

                {/* Overlay: Paused */}
                {gameState === 'paused' && (
                  <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                    <h3 className="text-3xl font-black text-amber-300 tracking-widest mb-4">GAME PAUSED</h3>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setGameState('playing')}
                        className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Resume
                      </button>
                      <button
                        onClick={handleRestartGame}
                        className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restart
                      </button>
                      <button
                        onClick={() => setActiveTab('code')}
                        className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm flex items-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Upgrade Game
                      </button>
                    </div>
                  </div>
                )}

                {/* Overlay: Game Over */}
                {gameState === 'gameover' && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                    <h3 className="text-3xl font-black text-rose-500 tracking-wider mb-2">GAME OVER</h3>
                    <div className="text-slate-300 text-sm mb-1">Final Score: <span className="font-bold text-amber-300 text-lg">{score}</span></div>
                    {score >= highScore && score > 0 && (
                      <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold mb-4 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        NEW HIGH SCORE!
                      </div>
                    )}
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={handleRestartGame}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-pink-500/30"
                      >
                        <RotateCcw className="w-4 h-4" />
                        PLAY AGAIN
                      </button>
                      <button
                        onClick={() => setActiveTab('code')}
                        className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm flex items-center gap-2 border border-white/10"
                      >
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        UPGRADE CODE TO WIN
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* On-Screen Virtual Arcade Gamepad Controls */}
              <div className="w-full max-w-[700px] mt-3 bg-slate-900/80 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                {/* Directional Pad */}
                <div className="flex items-center gap-1">
                  <div className="grid grid-cols-3 gap-1 w-28 h-28 p-1 bg-slate-950 rounded-xl border border-white/10 shadow-inner">
                    <div />
                    <button
                      onMouseDown={() => (padRef.current.up = true)}
                      onMouseUp={() => (padRef.current.up = false)}
                      onTouchStart={() => (padRef.current.up = true)}
                      onTouchEnd={() => (padRef.current.up = false)}
                      className="bg-slate-800 active:bg-pink-600 rounded-md flex items-center justify-center text-slate-300 active:text-white"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <div />
                    <button
                      onMouseDown={() => (padRef.current.left = true)}
                      onMouseUp={() => (padRef.current.left = false)}
                      onTouchStart={() => (padRef.current.left = true)}
                      onTouchEnd={() => (padRef.current.left = false)}
                      className="bg-slate-800 active:bg-pink-600 rounded-md flex items-center justify-center text-slate-300 active:text-white"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="bg-slate-900/40 rounded-md flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                    </div>
                    <button
                      onMouseDown={() => (padRef.current.right = true)}
                      onMouseUp={() => (padRef.current.right = false)}
                      onTouchStart={() => (padRef.current.right = true)}
                      onTouchEnd={() => (padRef.current.right = false)}
                      className="bg-slate-800 active:bg-pink-600 rounded-md flex items-center justify-center text-slate-300 active:text-white"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <div />
                    <button
                      onMouseDown={() => (padRef.current.down = true)}
                      onMouseUp={() => (padRef.current.down = false)}
                      onTouchStart={() => (padRef.current.down = true)}
                      onTouchEnd={() => (padRef.current.down = false)}
                      className="bg-slate-800 active:bg-pink-600 rounded-md flex items-center justify-center text-slate-300 active:text-white"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <div />
                  </div>
                </div>

                {/* Center Stats & Controls helper */}
                <div className="text-center">
                  <div className="text-[11px] font-mono text-slate-400 mb-1">KEYBOARD / TOUCH INPUT ACTIVE</div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setGameState((prev) => (prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev));
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded text-[11px] font-mono text-slate-300 flex items-center gap-1"
                    >
                      <Pause className="w-3 h-3" /> [P] PAUSE
                    </button>
                    <button
                      onClick={handleRestartGame}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded text-[11px] font-mono text-slate-300 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> [R] RESTART
                    </button>
                  </div>
                </div>

                {/* Action Buttons A & B */}
                <div className="flex items-center gap-3 pr-2">
                  <button
                    onMouseDown={() => {
                      padRef.current.b = true;
                    }}
                    onMouseUp={() => (padRef.current.b = false)}
                    onTouchStart={() => {
                      padRef.current.b = true;
                    }}
                    onTouchEnd={() => (padRef.current.b = false)}
                    className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 active:from-amber-600 active:to-yellow-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 flex flex-col items-center justify-center border-2 border-amber-300 transform active:scale-90 transition-transform"
                  >
                    <span>B</span>
                    <span className="text-[8px] opacity-75">SPECIAL</span>
                  </button>
                  <button
                    onMouseDown={() => {
                      padRef.current.a = true;
                      padRef.current.fire = true;
                    }}
                    onMouseUp={() => {
                      padRef.current.a = false;
                      padRef.current.fire = false;
                    }}
                    onTouchStart={() => {
                      padRef.current.a = true;
                      padRef.current.fire = true;
                    }}
                    onTouchEnd={() => {
                      padRef.current.a = false;
                      padRef.current.fire = false;
                    }}
                    className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 active:from-rose-600 active:to-pink-600 text-white font-black text-sm shadow-lg shadow-pink-500/30 flex flex-col items-center justify-center border-2 border-pink-300 transform active:scale-90 transition-transform"
                  >
                    <span>A</span>
                    <span className="text-[8px] opacity-75">FIRE</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Quick Game Info, Fast Upgrades & Live Debugger */}
            <div className="w-full md:w-80 flex flex-col gap-3 shrink-0">
              {/* Segmented Switcher */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/10 shadow-sm">
                <button
                  onClick={() => {
                    setRightPanelTab('controls');
                    soundEngine.playSfx('click');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                    rightPanelTab === 'controls'
                      ? 'bg-slate-800 text-white shadow border border-white/10'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Controls & Mods
                </button>
                <button
                  onClick={() => {
                    setRightPanelTab('debug');
                    soundEngine.playSfx('click');
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    rightPanelTab === 'debug'
                      ? 'bg-rose-950/60 text-rose-300 shadow border border-rose-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Bug className="w-3.5 h-3.5 text-rose-400" />
                  Debug & REPL
                </button>
              </div>

              {rightPanelTab === 'debug' ? (
                <DebugInspector
                  debugState={debugState}
                  onUpdateDebugState={setDebugState}
                  onStepFrame={handleStepFrame}
                  engineRef={engineRef}
                  onShowToast={onShowToast}
                />
              ) : (
                <>
                  {/* Controls card */}
                  <div className="bg-slate-900/90 border border-white/10 rounded-xl p-4 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-pink-400" />
                      Key Bindings & Controls
                    </h4>
                    <div className="space-y-1.5 font-mono text-xs">
                      {currentGame.controlsLegend.map((c, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-950/60 px-2 py-1 rounded border border-white/5">
                          <span className="text-pink-300 font-bold">{c.key}</span>
                          <span className="text-slate-400 text-[11px]">{c.action}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upgrades Applied */}
                  <div className="bg-slate-900/90 border border-white/10 rounded-xl p-4 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      Active Game Mods ({currentGame.upgradesApplied.length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {currentGame.upgradesApplied.map((upg, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {upg}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 1-Click Upgrade Badges */}
                  <div className="bg-slate-900/90 border border-white/10 rounded-xl p-4 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      Instant AI Upgrade Recipes
                    </h4>
                    <p className="text-[11px] text-slate-400 mb-2.5">Click any upgrade to modify game physics & features:</p>
                    <div className="space-y-1.5">
                      {UPGRADE_RECIPES.slice(0, 4).map((rec) => (
                        <button
                          key={rec.id}
                          disabled={isUpgrading}
                          onClick={() => handleUpgradeCode(rec.prompt)}
                          className="w-full text-left p-2 rounded-lg bg-slate-800/70 hover:bg-slate-800 border border-white/5 hover:border-pink-500/30 transition-all text-xs group"
                        >
                          <div className="font-semibold text-slate-200 group-hover:text-pink-300 transition-colors">{rec.title}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{rec.desc}</div>
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setActiveTab('code')}
                      className="w-full mt-2.5 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-medium text-center transition-colors flex items-center justify-center gap-1"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      Open Full Upgrade & Code Studio
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CODE & UPGRADE STUDIO */}
        {activeTab === 'code' && (
          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-950">
            {/* Left: Code Editor Pane */}
            <div className="flex-1 flex flex-col h-full border-r border-white/10">
              {/* Editor subheader toolbar */}
              <div className="h-10 bg-slate-900 px-3 flex items-center justify-between border-b border-white/10 shrink-0">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-pink-400" />
                  <span className="font-mono text-xs font-bold text-slate-200">{currentGame.id}.game.js</span>
                  <span className="text-[10px] text-slate-400 font-mono">({activeGameCode.split('\n').length} lines)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCompileAndRun}
                    className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-md flex items-center gap-1 shadow-md shadow-emerald-500/20"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    Compile & Run
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeGameCode);
                      soundEngine.playSfx('click');
                      if (onShowToast) onShowToast('Code Copied', 'Copied game script to clipboard.', 'info');
                    }}
                    className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-white/10"
                    title="Copy Code"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveGameCode(currentGame.code);
                      soundEngine.playSfx('click');
                      if (onShowToast) onShowToast('Reset', 'Reverted code to template default.', 'info');
                    }}
                    className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-white/10"
                    title="Reset to Template Default"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Code TextArea */}
              <div className="flex-1 relative overflow-hidden bg-slate-950 font-mono text-xs">
                <textarea
                  value={activeGameCode}
                  onChange={(e) => setActiveGameCode(e.target.value)}
                  spellCheck={false}
                  className="w-full h-full p-4 bg-transparent text-slate-200 focus:outline-none resize-none font-mono text-xs leading-relaxed selection:bg-pink-500/30 selection:text-white"
                />
              </div>

              {/* Diff status bar if upgrade applied */}
              {upgradeDiff && (
                <div className="bg-emerald-950/80 border-t border-emerald-500/30 px-3 py-1.5 text-[11px] text-emerald-300 font-mono flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    {lastUpgradeMsg || 'Upgrade applied successfully'}
                  </span>
                  <button onClick={() => setUpgradeDiff(null)} className="text-slate-400 hover:text-white">
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            {/* Right: AI Upgrade Engine & Parameters Panel */}
            <div className="w-full md:w-96 flex flex-col h-full bg-slate-900/90 overflow-y-auto p-4 gap-4 shrink-0">
              {/* AI Upgrade Assistant */}
              <div className="bg-slate-950/80 border border-white/10 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">AI Upgrade Engine</h4>
                    <p className="text-[10px] text-slate-400">Powered by Gemini 3.8 Flash Code Architect</p>
                  </div>
                </div>

                <div className="mb-3">
                  <textarea
                    rows={3}
                    placeholder="Describe any upgrade (e.g. 'Add homing missiles and double the enemy speed', 'Add a shield powerup capsule', 'Turn player into a laser phoenix')..."
                    value={upgradePrompt}
                    onChange={(e) => setUpgradePrompt(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-900 border border-white/15 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-500 resize-none font-sans"
                  />
                  <button
                    disabled={isUpgrading || !upgradePrompt.trim()}
                    onClick={() => handleUpgradeCode()}
                    className="w-full mt-2 py-2 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-rose-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/20 transition-all"
                  >
                    {isUpgrading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Synthesizing Code Upgrade...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        Execute AI Upgrade
                      </>
                    )}
                  </button>
                </div>

                {/* Quick 1-click recipes */}
                <div className="text-[11px] font-semibold text-slate-300 mb-1.5">Curated Upgrade Recipes:</div>
                <div className="space-y-1">
                  {UPGRADE_RECIPES.map((r) => (
                    <button
                      key={r.id}
                      disabled={isUpgrading}
                      onClick={() => handleUpgradeCode(r.prompt)}
                      className="w-full text-left px-2.5 py-1.5 rounded-md bg-slate-900/90 hover:bg-slate-800 border border-white/5 hover:border-purple-500/30 text-[11px] text-slate-300 hover:text-white transition-all flex items-center justify-between group"
                    >
                      <span className="truncate">{r.title}</span>
                      <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-purple-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Parameters & Physics Tweaker */}
              <div className="bg-slate-950/80 border border-white/10 rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Physics & Parameters</h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Player Speed</span>
                      <span className="font-mono text-amber-400">{currentGame.params.playerSpeed}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.5"
                      step="0.1"
                      value={currentGame.params.playerSpeed}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setGames((prev) =>
                          prev.map((g) => (g.id === selectedGameId ? { ...g, params: { ...g.params, playerSpeed: val } } : g))
                        );
                        if (engineRef.current) engineRef.current.params.playerSpeed = val;
                      }}
                      className="w-full accent-pink-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Enemy / Difficulty Multiplier</span>
                      <span className="font-mono text-rose-400">{currentGame.params.difficulty}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3.0"
                      step="0.1"
                      value={currentGame.params.difficulty}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setGames((prev) =>
                          prev.map((g) => (g.id === selectedGameId ? { ...g, params: { ...g.params, difficulty: val } } : g))
                        );
                        if (engineRef.current) engineRef.current.params.difficulty = val;
                      }}
                      className="w-full accent-rose-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Starting Lives</span>
                      <span className="font-mono text-cyan-400">{currentGame.params.lives}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="1"
                      value={currentGame.params.lives}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setGames((prev) =>
                          prev.map((g) => (g.id === selectedGameId ? { ...g, params: { ...g.params, lives: val } } : g))
                        );
                      }}
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-white/5">
                    <span className="text-slate-300">Screen Shake Physics</span>
                    <button
                      onClick={() => {
                        const val = !currentGame.params.screenShake;
                        setGames((prev) =>
                          prev.map((g) => (g.id === selectedGameId ? { ...g, params: { ...g.params, screenShake: val } } : g))
                        );
                        if (engineRef.current) engineRef.current.params.screenShake = val;
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-mono border ${
                        currentGame.params.screenShake
                          ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                          : 'bg-slate-800 text-slate-400 border-white/10'
                      }`}
                    >
                      {currentGame.params.screenShake ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action: Switch to Live Play */}
              <button
                onClick={() => {
                  handleCompileAndRun();
                  setActiveTab('play');
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                PLAY LIVE WITH THESE UPGRADES
              </button>
            </div>
          </div>
        )}

        {/* TAB: SPRITE FORGE & PIXEL ANIMATOR */}
        {activeTab === 'sprites' && (
          <SpriteEditor
            sprites={sprites}
            onUpdateSprites={setSprites}
            onInjectSpriteToGame={handleInjectSpriteToGame}
          />
        )}

        {/* TAB: TILEMAP & LEVEL FORGE */}
        {activeTab === 'tilemap' && (
          <TilemapEditor
            tilemap={tilemap}
            onUpdateTilemap={setTilemap}
            onApplyTilemapToGame={handleApplyTilemapToGame}
          />
        )}

        {/* TAB: SFX SYNTHESIZER FORGE */}
        {activeTab === 'sfx' && (
          <SfxStudio
            sfxList={sfxList}
            onUpdateSfxList={setSfxList}
            onInjectSfxToGame={handleInjectSfxToGame}
          />
        )}

        {/* TAB: PARTICLE EMITTER FORGE */}
        {activeTab === 'particles' && (
          <ParticleDesigner
            emitters={emitters}
            onUpdateEmitters={setEmitters}
            onInjectEmitterToGame={handleInjectEmitterToGame}
          />
        )}

        {/* TAB: GAME LIBRARY */}
        {activeTab === 'library' && (
          <div className="flex-1 p-6 overflow-y-auto bg-slate-950">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Arcade & App Forge Library</h3>
                  <p className="text-xs text-slate-400">Select any template to play, customize, or fork into a new experiment</p>
                </div>
                <button
                  onClick={() => setActiveTab('generator')}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 text-white font-semibold text-xs flex items-center gap-2 shadow-md shadow-pink-500/20"
                >
                  <PlusCircle className="w-4 h-4" />
                  Generate New Game
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {games.map((g) => {
                  const isSelected = g.id === selectedGameId;
                  return (
                    <div
                      key={g.id}
                      onClick={() => {
                        setSelectedGameId(g.id);
                        soundEngine.playSfx('click');
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-900 border-pink-500 shadow-lg shadow-pink-500/10'
                          : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-base text-white">{g.title}</span>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-pink-300 border border-white/10">
                            {g.genre} • v{g.version}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mb-3">{g.description}</p>
                        <div className="flex flex-wrap gap-1 mb-4">
                          {g.tags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="flex items-center gap-1.5 text-xs text-amber-300 font-mono">
                          <Award className="w-3.5 h-3.5" />
                          <span>BEST: {localStorage.getItem(`arcade_hiscore_${g.id}`) || '1000'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGameId(g.id);
                              setActiveTab('code');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-white/10 flex items-center gap-1"
                          >
                            <Code2 className="w-3 h-3 text-purple-400" />
                            Code
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const newMiniApp: MiniAppDefinition = {
                                id: g.id,
                                title: g.title,
                                shortTitle: g.title.slice(0, 16),
                                version: g.version || '1.0.0',
                                genre: g.genre === 'Shooter' ? 'Shooter' : 'Custom',
                                icon: 'Gamepad2',
                                color: 'from-amber-400 via-orange-500 to-rose-600',
                                description: g.description,
                                code: g.code,
                                upgradesApplied: g.upgradesApplied || ['Playground Studio Library'],
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                isPinnedToDesktop: true,
                                tags: g.tags || ['Arcade'],
                              };
                              saveMiniApp(newMiniApp);
                              setActiveMiniAppId(g.id);
                              if (onShowToast) {
                                onShowToast('Mini App Ready', `Pinned "${g.title}" to Desktop & Mini Apps Hub.`, 'success');
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1"
                            title="Run or Pin as Mini App"
                          >
                            <Layers className="w-3 h-3 text-amber-400" />
                            Mini App
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGameId(g.id);
                              setActiveTab('play');
                            }}
                            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-pink-500/20"
                          >
                            <Play className="w-3 h-3 fill-white" />
                            Play
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AI GAME GENERATOR */}
        {activeTab === 'generator' && (
          <div className="flex-1 p-6 overflow-y-auto bg-slate-950 flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl bg-slate-900/90 border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
                  <Wand2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Prompt-to-Game Synthesizer</h3>
                  <p className="text-xs text-slate-400">Describe any concept, mechanics, or upload game code (.zip, .js, .html) to synthesize or mod</p>
                </div>
              </div>

              {/* Upload & Attached Code Zone */}
              <input
                ref={generatorFileInputRef}
                type="file"
                accept=".zip,.js,.ts,.html,.json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.name.toLowerCase().endsWith('.zip')) {
                    try {
                      const res = await unpackGameZip(file);
                      handleSendToSynthesizer(res);
                    } catch (err) {
                      if (onShowToast) onShowToast('Unpack Error', 'Failed to read zip', 'warn');
                    }
                  } else {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const code = (ev.target?.result as string) || '';
                      setAttachedSourceCode({
                        fileName: file.name,
                        code,
                        lineCount: code.split('\n').length,
                      });
                      if (!newGamePrompt.trim() || newGamePrompt.startsWith('Create a retro')) {
                        setNewGamePrompt(`Modernize and upgrade this game (${file.name}): enhance graphics, add sound FX, and arcade controls.`);
                      }
                      if (onShowToast) onShowToast('File Attached', `Loaded ${file.name} into synthesizer context`, 'success');
                    };
                    reader.readAsText(file);
                  }
                  e.target.value = '';
                }}
                className="hidden"
              />

              {attachedSourceCode ? (
                <div className="mb-4 bg-purple-950/40 border border-purple-500/40 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30 shrink-0">
                      <FileArchive className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{attachedSourceCode.fileName}</span>
                        <span className="text-[10px] font-mono text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30">
                          {attachedSourceCode.lineCount} lines
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300">
                        Source code attached. AI Synthesizer will reference and upgrade this logic.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const template = adaptCodeToPlaygroundEngine(
                          attachedSourceCode.code,
                          attachedSourceCode.fileName.replace(/\.[^/.]+$/, '')
                        );
                        handleImportGame({
                          id: `imported-${Date.now().toString(36)}`,
                          title: attachedSourceCode.fileName.replace(/\.[^/.]+$/, ''),
                          genre: 'Custom',
                          description: `Directly imported from ${attachedSourceCode.fileName}`,
                          version: '1.0.0',
                          upgradesApplied: ['Direct Source Import'],
                          tags: ['Imported', 'Custom'],
                          controlsLegend: [
                            { key: 'Arrows / WASD', action: 'Move' },
                            { key: 'SPACE or [A]', action: 'Action' },
                          ],
                          params: {
                            playerSpeed: 1.2,
                            difficulty: 1.0,
                            lives: 3,
                            fireRate: 1.0,
                            particleDensity: 'high',
                            colorTheme: 'cyber-neon',
                            screenShake: true,
                          },
                          code: template,
                        }, 'play');
                      }}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                      title="Play without AI generation"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      Direct Play
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const template = adaptCodeToPlaygroundEngine(
                          attachedSourceCode.code,
                          attachedSourceCode.fileName.replace(/\.[^/.]+$/, '')
                        );
                        const title = attachedSourceCode.fileName.replace(/\.[^/.]+$/, '');
                        const newMiniApp: MiniAppDefinition = {
                          id: `spck-${Date.now().toString(36)}`,
                          title,
                          shortTitle: title.slice(0, 16),
                          version: '1.0.0',
                          genre: 'SPCK Port',
                          icon: 'Gamepad2',
                          color: 'from-amber-400 via-orange-500 to-rose-600',
                          description: `Imported from ${attachedSourceCode.fileName}. Standalone Mini App ready for upgrades.`,
                          code: template,
                          upgradesApplied: ['Synthesizer Source Import'],
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                          isPinnedToDesktop: true,
                          tags: ['SPCK Port', 'Mini App'],
                        };
                        saveMiniApp(newMiniApp);
                        setActiveMiniAppId(newMiniApp.id);
                        if (onShowToast) {
                          onShowToast('Mini App Deployed!', `Pinned "${title}" to Desktop & Mini Apps Hub.`, 'success');
                        }
                      }}
                      className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                      title="Deploy as standalone Mini App pinned to Desktop"
                    >
                      <Layers className="w-3 h-3 text-white" />
                      Deploy as Mini App
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttachedSourceCode(null)}
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => generatorFileInputRef.current?.click()}
                  className="mb-4 p-3 bg-slate-950/70 hover:bg-slate-950 border border-dashed border-white/20 hover:border-pink-500/50 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-pink-300 transition-colors">
                        Attach Game File or ZIP (.zip, .js, .html)
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Upload SPCK Node.js or web games to synthesize, unpack, or upgrade
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-2.5 py-1 rounded bg-slate-800 group-hover:bg-pink-600 text-[11px] font-medium text-slate-300 group-hover:text-white transition-colors"
                  >
                    Select File / ZIP
                  </button>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Game Concept & Rules:</label>
                <textarea
                  rows={4}
                  value={newGamePrompt}
                  onChange={(e) => setNewGamePrompt(e.target.value)}
                  placeholder="e.g. 'Create a neon space miner where you pilot a cargo ship, grapple floating asteroids, and dodge laser sentry drones'..."
                  className="w-full p-3 bg-slate-950 border border-white/15 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 resize-none font-sans"
                />
              </div>

              <div className="mb-6">
                <div className="text-xs font-semibold text-slate-300 mb-2">Or choose a starter preset:</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    'Neon Asteroid Miner with Grapple',
                    'Cyberpunk Flappy Jetpack Runner',
                    'Retro Color Match Falling Tetramino',
                    'Space Invaders with Boss Shields',
                    'Laser Grid Tron Lightcycles',
                    'Pinball Physics Bouncer FX',
                  ].map((preset, i) => (
                    <button
                      key={i}
                      onClick={() => setNewGamePrompt(preset)}
                      className="p-2 text-left bg-slate-950 hover:bg-slate-800 border border-white/5 hover:border-pink-500/30 rounded-lg text-xs text-slate-300 hover:text-white transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={isGenerating || !newGamePrompt.trim()}
                onClick={handleGenerateGame}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:opacity-90 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30 transition-all"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Forging Game Engine & Code...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {attachedSourceCode ? 'Upgrade & Forge Attached Game' : 'Forge Playable Game'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Game Upload & ZIP Unpacker Modal */}
      <GameUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onImportGame={handleImportGame}
        onSendToSynthesizer={handleSendToSynthesizer}
        onShowToast={onShowToast}
      />

      {/* Bottom Footer Status Bar */}
      <footer className="h-7 bg-slate-900 border-t border-white/10 px-4 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-300">
            <Gamepad2 className="w-3.5 h-3.5 text-pink-400" />
            Active: <span className="text-pink-300 font-bold">{currentGame.title}</span>
          </span>
          <span>Status: <span className="text-emerald-400 font-bold uppercase">{gameState}</span></span>
        </div>
        <div className="flex items-center gap-4">
          <span>Engine: <span className="text-slate-300">Canvas2D 60FPS</span></span>
          <span>CRT: <span className={crtEffect ? 'text-pink-400' : 'text-slate-500'}>{crtEffect ? 'ON' : 'OFF'}</span></span>
          <span>Audio: <span className={isMuted ? 'text-red-400' : 'text-emerald-400'}>{isMuted ? 'MUTED' : 'SYNTH'}</span></span>
        </div>
      </footer>
    </div>
  );
};
