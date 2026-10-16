export interface SpriteData {
  id: string;
  name: string;
  width: number;
  height: number;
  frames: string[][][]; // [frameIndex][y][x] = hex color or '' for transparent
  fps: number;
}

export interface TileDef {
  id: number;
  name: string;
  color: string;
  solid: boolean;
  platform?: boolean;
  hazard?: boolean;
  collectible?: boolean;
  spawnPlayer?: boolean;
  spawnEnemy?: boolean;
  icon?: string;
}

export interface TilemapData {
  id: string;
  name: string;
  cols: number; // e.g. 28
  rows: number; // e.g. 21
  tileSize: number; // 25 px (28 * 25 = 700, 21 * 25 = 525)
  grid: number[][]; // grid[y][x] = tileId
}

export interface SfxPreset {
  id: string;
  name: string;
  type: 'laser' | 'jump' | 'explosion' | 'coin' | 'powerup' | 'hit' | 'warp' | 'boss_laser' | 'shield';
  waveform: OscillatorType | 'noise';
  startFreq: number;
  endFreq: number;
  duration: number; // seconds
  decay: number;
  vibratoFreq: number;
  vibratoDepth: number;
  volume: number;
}

export interface ParticleEmitterConfig {
  id: string;
  name: string;
  rate: number; // particles per burst / second
  speedMin: number;
  speedMax: number;
  angle: number; // radians or degrees
  spread: number; // degrees
  lifetime: number; // seconds
  gravityX: number;
  gravityY: number;
  startColor: string;
  endColor: string;
  startSize: number;
  endSize: number;
  glow: boolean;
}

export interface EngineDebugState {
  showHitboxes: boolean;
  showTileGrid: boolean;
  godMode: boolean;
  timeScale: number; // 1 = normal, 0.5 = half speed, etc.
  freezeFrame: boolean;
}

export type GameGenre = 'Shooter' | 'Runner' | 'Breakout' | 'Snake' | 'Physics' | 'Custom' | 'Arcade' | 'Puzzle' | 'Dungeon Crawler' | 'Platformer';

export interface GameTemplate {
  id: string;
  title: string;
  genre: GameGenre;
  description: string;
  version: string;
  upgradesApplied: string[];
  tags: string[];
  controlsLegend: { key: string; action: string }[];
  params: {
    playerSpeed: number;
    difficulty: number;
    lives: number;
    fireRate: number;
    particleDensity: 'low' | 'med' | 'high' | 'ultra';
    colorTheme: 'cyber-neon' | 'synthwave-sunset' | 'emerald-matrix' | 'solar-amber';
    screenShake: boolean;
  };
  code: string;
}
