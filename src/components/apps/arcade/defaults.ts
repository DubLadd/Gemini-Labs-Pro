import { SpriteData, TileDef, TilemapData, SfxPreset, ParticleEmitterConfig } from './types';

export const DEFAULT_TILE_DEFS: TileDef[] = [
  { id: 0, name: 'Air / Empty', color: 'transparent', solid: false },
  { id: 1, name: 'Cyber Block', color: '#1e293b', solid: true, icon: '■' },
  { id: 2, name: 'Pass-through Platform', color: '#0f766e', solid: false, platform: true, icon: '═' },
  { id: 3, name: 'Plasma Spikes', color: '#ef4444', solid: false, hazard: true, icon: '▲' },
  { id: 4, name: 'Energy Crystal', color: '#06b6d4', solid: false, collectible: true, icon: '◆' },
  { id: 5, name: 'Security Barrier', color: '#b45309', solid: true, icon: '▤' },
  { id: 6, name: 'Access Keycard', color: '#fbbf24', solid: false, collectible: true, icon: '🔑' },
  { id: 7, name: 'Gravity Jump Pad', color: '#ec4899', solid: false, icon: '▲' },
  { id: 8, name: 'Player Spawn', color: '#10b981', solid: false, spawnPlayer: true, icon: 'P' },
  { id: 9, name: 'Enemy Sentinel Spawn', color: '#e11d48', solid: false, spawnEnemy: true, icon: 'E' },
];

export const INITIAL_TILEMAP: TilemapData = {
  id: 'dungeon-sector-1',
  name: 'Sector 01: Neon Catacombs',
  cols: 28,
  rows: 21,
  tileSize: 25,
  grid: (() => {
    const grid: number[][] = Array.from({ length: 21 }, () => Array(28).fill(0));
    // Border walls
    for (let x = 0; x < 28; x++) {
      grid[0][x] = 1;
      grid[20][x] = 1;
    }
    for (let y = 0; y < 21; y++) {
      grid[y][0] = 1;
      grid[y][27] = 1;
    }
    // Ground floor
    for (let x = 0; x < 28; x++) grid[19][x] = 1;
    // Some platforms
    for (let x = 3; x < 10; x++) grid[15][x] = 2;
    for (let x = 12; x < 19; x++) grid[12][x] = 2;
    for (let x = 4; x < 11; x++) grid[8][x] = 2;
    for (let x = 18; x < 25; x++) grid[16][x] = 2;

    // Hazards
    grid[19][11] = 3;
    grid[19][12] = 3;
    grid[19][13] = 3;

    // Collectibles & Keycard
    grid[14][6] = 4;
    grid[11][15] = 4;
    grid[7][7] = 6; // Keycard
    grid[15][21] = 4;

    // Security barrier
    grid[18][22] = 5;
    grid[17][22] = 5;

    // Jump pad
    grid[19][10] = 7;

    // Spawns
    grid[18][2] = 8; // Player
    grid[18][16] = 9; // Enemy
    grid[11][17] = 9; // Enemy

    return grid;
  })(),
};

// 16x16 Helper to generate sprite matrix
function createEmptyGrid(w: number, h: number): string[][] {
  return Array.from({ length: h }, () => Array(w).fill(''));
}

export const DEFAULT_SPRITES: SpriteData[] = [
  {
    id: 'hero-knight',
    name: 'Cyber Knight',
    width: 16,
    height: 16,
    fps: 4,
    frames: [
      // Frame 1: Idle
      (() => {
        const f = createEmptyGrid(16, 16);
        // Head / Helmet
        for (let x = 6; x <= 9; x++) f[2][x] = '#06b6d4';
        for (let x = 5; x <= 10; x++) { f[3][x] = '#0891b2'; f[4][x] = '#0891b2'; }
        f[4][7] = '#38bdf8'; f[4][8] = '#38bdf8'; // Visor glow
        // Torso armor
        for (let y = 5; y <= 9; y++) {
          for (let x = 5; x <= 10; x++) f[y][x] = '#1e293b';
        }
        for (let x = 7; x <= 8; x++) { f[6][x] = '#ec4899'; f[7][x] = '#ec4899'; } // Chest reactor
        // Arms / Sword
        f[7][4] = '#06b6d4'; f[8][4] = '#06b6d4';
        f[7][11] = '#06b6d4'; f[8][11] = '#06b6d4';
        for (let y = 4; y <= 9; y++) f[y][12] = '#f43f5e'; // Energy blade
        // Legs
        for (let y = 10; y <= 14; y++) {
          f[y][6] = '#0f172a'; f[y][9] = '#0f172a';
        }
        f[14][5] = '#38bdf8'; f[14][10] = '#38bdf8'; // Boots
        return f;
      })(),
      // Frame 2: Walk
      (() => {
        const f = createEmptyGrid(16, 16);
        for (let x = 6; x <= 9; x++) f[2][x] = '#06b6d4';
        for (let x = 5; x <= 10; x++) { f[3][x] = '#0891b2'; f[4][x] = '#0891b2'; }
        f[4][7] = '#38bdf8'; f[4][8] = '#38bdf8';
        for (let y = 5; y <= 9; y++) {
          for (let x = 5; x <= 10; x++) f[y][x] = '#1e293b';
        }
        for (let x = 7; x <= 8; x++) { f[6][x] = '#ec4899'; f[7][x] = '#ec4899'; }
        f[6][4] = '#06b6d4'; f[7][3] = '#06b6d4';
        f[8][11] = '#06b6d4';
        for (let y = 3; y <= 8; y++) f[y][12] = '#f43f5e';
        // Legs stride
        f[10][6] = '#0f172a'; f[11][5] = '#0f172a'; f[12][4] = '#38bdf8';
        f[10][9] = '#0f172a'; f[11][10] = '#0f172a'; f[12][11] = '#38bdf8';
        return f;
      })(),
    ],
  },
  {
    id: 'cyber-goblin',
    name: 'Cyber Sentinel Alien',
    width: 16,
    height: 16,
    fps: 4,
    frames: [
      (() => {
        const f = createEmptyGrid(16, 16);
        // Horns / Spikes
        f[2][4] = '#f43f5e'; f[3][5] = '#f43f5e';
        f[2][11] = '#f43f5e'; f[3][10] = '#f43f5e';
        // Head
        for (let y = 4; y <= 7; y++) {
          for (let x = 5; x <= 10; x++) f[y][x] = '#9333ea';
        }
        f[5][6] = '#facc15'; f[5][9] = '#facc15'; // Glowing yellow eyes
        f[6][7] = '#f43f5e'; f[6][8] = '#f43f5e'; // Mouth
        // Body
        for (let y = 8; y <= 12; y++) {
          for (let x = 4; x <= 11; x++) f[y][x] = '#581c87';
        }
        f[9][7] = '#ec4899'; f[9][8] = '#ec4899';
        // Legs / Claws
        f[13][5] = '#f43f5e'; f[14][4] = '#f43f5e';
        f[13][10] = '#f43f5e'; f[14][11] = '#f43f5e';
        return f;
      })(),
    ],
  },
  {
    id: 'energy-crystal',
    name: 'Energy Core Shard',
    width: 16,
    height: 16,
    fps: 6,
    frames: [
      (() => {
        const f = createEmptyGrid(16, 16);
        f[3][7] = '#38bdf8'; f[3][8] = '#38bdf8';
        for (let x = 6; x <= 9; x++) f[4][x] = '#06b6d4';
        for (let x = 5; x <= 10; x++) f[5][x] = '#0891b2';
        for (let x = 4; x <= 11; x++) { f[6][x] = '#67e8f9'; f[7][x] = '#a5f3fc'; f[8][x] = '#67e8f9'; }
        for (let x = 5; x <= 10; x++) f[9][x] = '#0891b2';
        for (let x = 6; x <= 9; x++) f[10][x] = '#06b6d4';
        f[11][7] = '#38bdf8'; f[11][8] = '#38bdf8';
        return f;
      })(),
      (() => {
        const f = createEmptyGrid(16, 16);
        f[3][7] = '#f472b6'; f[3][8] = '#f472b6';
        for (let x = 6; x <= 9; x++) f[4][x] = '#ec4899';
        for (let x = 5; x <= 10; x++) f[5][x] = '#db2777';
        for (let x = 4; x <= 11; x++) { f[6][x] = '#fbcfe8'; f[7][x] = '#fdf2f8'; f[8][x] = '#fbcfe8'; }
        for (let x = 5; x <= 10; x++) f[9][x] = '#db2777';
        for (let x = 6; x <= 9; x++) f[10][x] = '#ec4899';
        f[11][7] = '#f472b6'; f[11][8] = '#f472b6';
        return f;
      })(),
    ],
  },
];

export const DEFAULT_SFX_PRESETS: SfxPreset[] = [
  {
    id: 'plasma-laser',
    name: 'Plasma Beam Blaster',
    type: 'laser',
    waveform: 'sawtooth',
    startFreq: 920,
    endFreq: 140,
    duration: 0.14,
    decay: 0.12,
    vibratoFreq: 15,
    vibratoDepth: 30,
    volume: 0.2,
  },
  {
    id: 'cyber-jump',
    name: 'Anti-Gravity Jump',
    type: 'jump',
    waveform: 'square',
    startFreq: 160,
    endFreq: 640,
    duration: 0.18,
    decay: 0.16,
    vibratoFreq: 0,
    vibratoDepth: 0,
    volume: 0.22,
  },
  {
    id: 'core-pickup',
    name: 'Energy Core Pickup',
    type: 'coin',
    waveform: 'sine',
    startFreq: 520,
    endFreq: 1040,
    duration: 0.2,
    decay: 0.18,
    vibratoFreq: 24,
    vibratoDepth: 50,
    volume: 0.24,
  },
  {
    id: 'plasma-explosion',
    name: 'Sub-Atomic Blast',
    type: 'explosion',
    waveform: 'noise',
    startFreq: 160,
    endFreq: 30,
    duration: 0.38,
    decay: 0.35,
    vibratoFreq: 8,
    vibratoDepth: 40,
    volume: 0.3,
  },
  {
    id: 'boss-alarm',
    name: 'Dungeon Boss Warning',
    type: 'boss_laser',
    waveform: 'triangle',
    startFreq: 240,
    endFreq: 120,
    duration: 0.45,
    decay: 0.4,
    vibratoFreq: 12,
    vibratoDepth: 80,
    volume: 0.25,
  },
];

export const DEFAULT_EMITTERS: ParticleEmitterConfig[] = [
  {
    id: 'plasma-burst',
    name: 'Plasma Burst FX',
    rate: 25,
    speedMin: 80,
    speedMax: 260,
    angle: 0,
    spread: 360,
    lifetime: 0.5,
    gravityX: 0,
    gravityY: 180,
    startColor: '#06b6d4',
    endColor: '#3b82f6',
    startSize: 3,
    endSize: 1,
    glow: true,
  },
  {
    id: 'fire-thruster',
    name: 'Rocket Jet Thruster',
    rate: 30,
    speedMin: 120,
    speedMax: 320,
    angle: 90,
    spread: 35,
    lifetime: 0.35,
    gravityX: 0,
    gravityY: -40,
    startColor: '#f97316',
    endColor: '#ef4444',
    startSize: 4,
    endSize: 1.5,
    glow: true,
  },
  {
    id: 'magic-sparkles',
    name: 'Arcane Stardust',
    rate: 15,
    speedMin: 40,
    speedMax: 140,
    angle: 270,
    spread: 90,
    lifetime: 0.8,
    gravityX: 0,
    gravityY: -60,
    startColor: '#ec4899',
    endColor: '#a855f7',
    startSize: 3,
    endSize: 0.5,
    glow: true,
  },
];
