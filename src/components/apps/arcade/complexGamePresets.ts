import { GameTemplate } from './types';

export const COMPLEX_GAME_PRESETS: GameTemplate[] = [
  {
    id: 'cyber-rogue',
    title: 'Cyber Rogue: Neon Dungeon Crawl',
    genre: 'Custom',
    description: 'Complex top-down dungeon crawler with 28x21 tilemap walls, locked security gates, enemy patrol & chase AI, melee sword arcs, ranged spells, animated sprite rendering, and inventory keys.',
    version: '2.0.0',
    upgradesApplied: ['Tilemap Collision System', 'Sprite Animation Engine', 'Enemy Patrol AI', 'Melee & Ranged Combat', 'Keycard Gates'],
    tags: ['RPG', 'Dungeon', 'Tilemap', 'Sprite', 'AI'],
    controlsLegend: [
      { key: 'W A S D or ◄ ▲ ▼ ►', action: 'Move Knight in 8 Directions' },
      { key: 'SPACE or [A]', action: 'Plasma Sword Melee Slash' },
      { key: 'SHIFT or [B]', action: 'Cast Ranged Mana Firebolt' },
      { key: 'P', action: 'Pause Game' },
      { key: 'R', action: 'Restart Floor' },
    ],
    params: {
      playerSpeed: 1.2,
      difficulty: 1.0,
      lives: 4,
      fireRate: 1.0,
      particleDensity: 'high',
      colorTheme: 'cyber-neon',
      screenShake: true,
    },
    code: `// --- CYBER ROGUE: NEON DUNGEON CRAWL ---
// Advanced multi-system RPG engine featuring tilemap collision, AI states, inventory, and animated sprites

function init(engine) {
  engine.player = {
    x: 80,
    y: 80,
    vx: 0,
    vy: 0,
    width: 24,
    height: 24,
    speed: 210 * engine.params.playerSpeed,
    hp: 100,
    maxHp: 100,
    mana: 100,
    maxMana: 100,
    keys: 0,
    facing: 1, // 1: right, -1: left
    slashCooldown: 0,
    isSlashing: false,
    slashTimer: 0,
    animTimer: 0,
    frame: 0,
  };

  engine.spells = [];
  engine.slashes = [];
  engine.damagePopups = [];

  // Generate 28x21 dungeon grid: 1=wall, 0=floor, 5=gate, 4=crystal, 6=key
  engine.tileCols = 28;
  engine.tileRows = 21;
  engine.tileSize = 25;
  engine.map = Array.from({ length: 21 }, () => Array(28).fill(0));

  // Outer border
  for (let x = 0; x < 28; x++) {
    engine.map[0][x] = 1;
    engine.map[20][x] = 1;
  }
  for (let y = 0; y < 21; y++) {
    engine.map[y][0] = 1;
    engine.map[y][27] = 1;
  }

  // Dungeon rooms & hallways
  for (let x = 8; x <= 20; x++) { engine.map[7][x] = 1; engine.map[14][x] = 1; }
  for (let y = 1; y <= 7; y++) engine.map[y][14] = 1;
  for (let y = 14; y <= 19; y++) engine.map[y][10] = 1;

  // Doorways & Security Gate
  engine.map[7][11] = 0;
  engine.map[14][16] = 5; // Locked gate
  engine.map[4][14] = 0;

  // Keycard placement in upper right room
  engine.keyItem = { x: 23 * 25 + 12, y: 3 * 25 + 12, collected: false };

  // Crystals (Score pickups)
  engine.crystals = [
    { x: 3 * 25 + 12, y: 17 * 25 + 12, collected: false },
    { x: 17 * 25 + 12, y: 10 * 25 + 12, collected: false },
    { x: 24 * 25 + 12, y: 17 * 25 + 12, collected: false },
    { x: 5 * 25 + 12, y: 4 * 25 + 12, collected: false },
  ];

  // Enemies with Patrol and Chase AI
  engine.enemies = [
    {
      x: 18 * 25,
      y: 11 * 25,
      width: 22,
      height: 22,
      hp: 40,
      maxHp: 40,
      state: 'patrol',
      patrolMinX: 15 * 25,
      patrolMaxX: 24 * 25,
      speed: 75 * engine.params.difficulty,
      vx: 75,
      vy: 0,
      cooldown: 0,
    },
    {
      x: 5 * 25,
      y: 17 * 25,
      width: 22,
      height: 22,
      hp: 40,
      maxHp: 40,
      state: 'patrol',
      patrolMinX: 3 * 25,
      patrolMaxX: 9 * 25,
      speed: 80 * engine.params.difficulty,
      vx: 80,
      vy: 0,
      cooldown: 0,
    },
    {
      x: 22 * 25,
      y: 18 * 25,
      width: 26,
      height: 26,
      hp: 75,
      maxHp: 75,
      state: 'boss',
      speed: 60 * engine.params.difficulty,
      vx: 60,
      vy: 0,
      cooldown: 0,
    },
  ];
}

// Check tilemap collision at coordinate
function isSolid(engine, x, y) {
  const col = Math.floor(x / 25);
  const row = Math.floor(y / 25);
  if (col < 0 || col >= 28 || row < 0 || row >= 21) return true;
  const tile = engine.map[row][col];
  return tile === 1 || tile === 5;
}

function update(engine, dt) {
  const p = engine.player;
  const keys = engine.keys;

  // 8-Direction Player Movement
  let mx = 0;
  let my = 0;
  if (keys['ArrowLeft'] || keys['KeyA'] || engine.pad.left) { mx -= 1; p.facing = -1; }
  if (keys['ArrowRight'] || keys['KeyD'] || engine.pad.right) { mx += 1; p.facing = 1; }
  if (keys['ArrowUp'] || keys['KeyW'] || engine.pad.up) my -= 1;
  if (keys['ArrowDown'] || keys['KeyS'] || engine.pad.down) my += 1;

  if (mx !== 0 && my !== 0) {
    mx *= 0.707;
    my *= 0.707;
  }

  // Horizontal motion with collision
  const targetX = p.x + mx * p.speed * dt;
  const halfW = p.width / 2;
  const halfH = p.height / 2;

  if (
    !isSolid(engine, targetX - halfW, p.y - halfH + 4) &&
    !isSolid(engine, targetX + halfW, p.y - halfH + 4) &&
    !isSolid(engine, targetX - halfW, p.y + halfH - 4) &&
    !isSolid(engine, targetX + halfW, p.y + halfH - 4)
  ) {
    p.x = targetX;
  }

  // Vertical motion with collision
  const targetY = p.y + my * p.speed * dt;
  if (
    !isSolid(engine, p.x - halfW + 4, targetY - halfH) &&
    !isSolid(engine, p.x + halfW - 4, targetY - halfH) &&
    !isSolid(engine, p.x - halfW + 4, targetY + halfH) &&
    !isSolid(engine, p.x + halfW - 4, targetY + halfH)
  ) {
    p.y = targetY;
  }

  // Animation cycle
  if (mx !== 0 || my !== 0) {
    p.animTimer += dt * 6;
    p.frame = Math.floor(p.animTimer) % 2;
  } else {
    p.frame = 0;
  }

  // Mana regen
  p.mana = Math.min(p.maxMana, p.mana + dt * 15);

  // Melee Attack (SPACE / A)
  p.slashCooldown -= dt;
  const wantSlash = keys['Space'] || engine.pad.a || engine.pad.fire;
  if (wantSlash && p.slashCooldown <= 0) {
    p.slashCooldown = 0.32;
    p.isSlashing = true;
    p.slashTimer = 0.16;
    engine.playSound('hit');
    engine.triggerShake(4);

    const slashBox = {
      x: p.x + p.facing * 28,
      y: p.y,
      radius: 32,
    };

    // Hit enemies
    for (let i = engine.enemies.length - 1; i >= 0; i--) {
      const e = engine.enemies[i];
      const dist = Math.hypot(e.x - slashBox.x, e.y - slashBox.y);
      if (dist < slashBox.radius + 14) {
        e.hp -= 25;
        engine.spawnSparks(e.x, e.y, 8, '#f43f5e');
        engine.playSound('hit');
        if (e.hp <= 0) {
          engine.enemies.splice(i, 1);
          engine.addScore(150);
          engine.spawnSparks(e.x, e.y, 25, '#ec4899');
          engine.playSound('explosion');
        }
      }
    }
  }

  if (p.isSlashing) {
    p.slashTimer -= dt;
    if (p.slashTimer <= 0) p.isSlashing = false;
  }

  // Ranged Magic Firebolt (SHIFT / B)
  const wantSpell = keys['ShiftLeft'] || keys['KeyE'] || engine.pad.b;
  if (wantSpell && p.slashCooldown <= 0 && p.mana >= 25) {
    p.mana -= 25;
    p.slashCooldown = 0.28;
    engine.playSound('laser');
    engine.spells.push({
      x: p.x + p.facing * 16,
      y: p.y,
      vx: p.facing * 480,
      vy: 0,
      radius: 6,
      color: '#38bdf8',
    });
  }

  // Update Spells
  for (let i = engine.spells.length - 1; i >= 0; i--) {
    const s = engine.spells[i];
    s.x += s.vx * dt;
    s.y += s.vy * dt;

    if (isSolid(engine, s.x, s.y) || s.x < 0 || s.x > engine.width) {
      engine.spawnSparks(s.x, s.y, 6, '#38bdf8');
      engine.spells.splice(i, 1);
      continue;
    }

    // Spell hit enemies
    let hit = false;
    for (let j = engine.enemies.length - 1; j >= 0; j--) {
      const e = engine.enemies[j];
      if (Math.hypot(e.x - s.x, e.y - s.y) < e.width / 2 + s.radius) {
        e.hp -= 35;
        hit = true;
        engine.spawnSparks(e.x, e.y, 10, '#38bdf8');
        engine.playSound('hit');
        if (e.hp <= 0) {
          engine.enemies.splice(j, 1);
          engine.addScore(200);
          engine.spawnSparks(e.x, e.y, 25, '#38bdf8');
          engine.playSound('explosion');
        }
        break;
      }
    }
    if (hit) {
      engine.spells.splice(i, 1);
    }
  }

  // Pickup Keycard
  if (!engine.keyItem.collected && Math.hypot(p.x - engine.keyItem.x, p.y - engine.keyItem.y) < 22) {
    engine.keyItem.collected = true;
    p.keys += 1;
    engine.playSound('success');
    engine.addScore(100);
    engine.spawnSparks(p.x, p.y, 15, '#fbbf24');
  }

  // Unlock Gate Door if adjacent
  if (p.keys > 0) {
    const nearGateCol = 16;
    const nearGateRow = 14;
    const gateX = nearGateCol * 25 + 12;
    const gateY = nearGateRow * 25 + 12;
    if (Math.hypot(p.x - gateX, p.y - gateY) < 36 && engine.map[nearGateRow][nearGateCol] === 5) {
      engine.map[nearGateRow][nearGateCol] = 0; // Opened!
      p.keys -= 1;
      engine.playSound('shield');
      engine.spawnSparks(gateX, gateY, 20, '#10b981');
      engine.addScore(300);
    }
  }

  // Pickup Crystals
  for (const c of engine.crystals) {
    if (!c.collected && Math.hypot(p.x - c.x, p.y - c.y) < 20) {
      c.collected = true;
      engine.addScore(50);
      engine.playSound('success');
      engine.spawnSparks(c.x, c.y, 8, '#06b6d4');
    }
  }

  // Update Enemies AI
  for (let i = engine.enemies.length - 1; i >= 0; i--) {
    const e = engine.enemies[i];
    const distToPlayer = Math.hypot(p.x - e.x, p.y - e.y);

    if (distToPlayer < 180) {
      // Chase AI mode
      const angle = Math.atan2(p.y - e.y, p.x - e.x);
      const nx = e.x + Math.cos(angle) * e.speed * dt;
      const ny = e.y + Math.sin(angle) * e.speed * dt;
      if (!isSolid(engine, nx, ny)) {
        e.x = nx;
        e.y = ny;
      }
    } else {
      // Patrol mode
      e.x += e.vx * dt;
      if (e.x > e.patrolMaxX) e.vx = -Math.abs(e.vx);
      if (e.x < e.patrolMinX) e.vx = Math.abs(e.vx);
    }

    // Damage Player
    if (distToPlayer < 24) {
      p.hp -= 25 * dt;
      engine.triggerShake(2);
      if (p.hp <= 0) {
        engine.loseLife();
        p.hp = p.maxHp;
        p.x = 80;
        p.y = 80;
      }
    }
  }
}

function render(engine, ctx) {
  // Clear Dungeon Floor
  ctx.fillStyle = '#080c18';
  ctx.fillRect(0, 0, engine.width, engine.height);

  // Render 28x21 Tilemap
  const ts = 25;
  for (let r = 0; r < 21; r++) {
    for (let c = 0; c < 28; c++) {
      const tile = engine.map[r][c];
      const x = c * ts;
      const y = r * ts;

      if (tile === 1) {
        // Neon Solid Wall
        ctx.fillStyle = '#111827';
        ctx.fillRect(x, y, ts, ts);
        ctx.strokeStyle = '#1e3a8a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 1, y + 1, ts - 2, ts - 2);
      } else if (tile === 5) {
        // Locked Security Barrier
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(x, y, ts, ts);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, ts - 4, ts - 4);
        ctx.fillStyle = '#fef08a';
        ctx.font = '10px sans-serif';
        ctx.fillText('▤', x + 8, y + 16);
      } else {
        // Floor Grid Dot
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.fillRect(x + 12, y + 12, 2, 2);
      }
    }
  }

  // Draw Crystals
  for (const c of engine.crystals) {
    if (c.collected) continue;
    ctx.save();
    ctx.fillStyle = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#06b6d4';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw Keycard
  if (!engine.keyItem.collected) {
    ctx.save();
    ctx.fillStyle = '#fbbf24';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#fbbf24';
    ctx.fillRect(engine.keyItem.x - 5, engine.keyItem.y - 7, 10, 14);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(engine.keyItem.x - 3, engine.keyItem.y - 4, 6, 3);
    ctx.restore();
  }

  // Draw Spells
  for (const s of engine.spells) {
    ctx.save();
    ctx.fillStyle = s.color;
    ctx.shadowBlur = 12;
    ctx.shadowColor = s.color;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw Enemies
  for (const e of engine.enemies) {
    ctx.save();
    ctx.fillStyle = e.state === 'boss' ? '#e11d48' : '#9333ea';
    ctx.shadowBlur = 8;
    ctx.shadowColor = e.state === 'boss' ? '#f43f5e' : '#a855f7';
    ctx.fillRect(e.x - e.width / 2, e.y - e.height / 2, e.width, e.height);

    // Glowing alien eyes
    ctx.fillStyle = '#facc15';
    ctx.fillRect(e.x - 4, e.y - 3, 3, 3);
    ctx.fillRect(e.x + 2, e.y - 3, 3, 3);

    // HP Bar
    const hpPct = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = '#374151';
    ctx.fillRect(e.x - 12, e.y - e.height / 2 - 8, 24, 3);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(e.x - 12, e.y - e.height / 2 - 8, 24 * hpPct, 3);
    ctx.restore();
  }

  // Draw Player Knight
  const p = engine.player;
  ctx.save();
  ctx.fillStyle = '#06b6d4';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#06b6d4';
  ctx.fillRect(p.x - p.width / 2, p.y - p.height / 2, p.width, p.height);

  // Visor
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(p.x + (p.facing === 1 ? 2 : -6), p.y - 6, 6, 4);

  // Sword Slash Arc
  if (p.isSlashing) {
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#f43f5e';
    ctx.beginPath();
    const arcAngle = p.facing === 1 ? 0 : Math.PI;
    ctx.arc(p.x, p.y, 30, arcAngle - 0.7, arcAngle + 0.7);
    ctx.stroke();
  }
  ctx.restore();

  // Draw Top HUD (Health, Mana, Keycards)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(10, 10, 240, 48);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.strokeRect(10, 10, 240, 48);

  // HP Bar
  ctx.fillStyle = '#f43f5e';
  ctx.fillRect(20, 20, 120 * (p.hp / p.maxHp), 8);
  ctx.strokeStyle = '#ffffff20';
  ctx.strokeRect(20, 20, 120, 8);

  // Mana Bar
  ctx.fillStyle = '#06b6d4';
  ctx.fillRect(20, 34, 120 * (p.mana / p.maxMana), 6);
  ctx.strokeStyle = '#ffffff20';
  ctx.strokeRect(20, 34, 120, 6);

  // Keycard icon
  ctx.fillStyle = '#fbbf24';
  ctx.font = '12px monospace';
  ctx.fillText('KEYS: ' + p.keys, 155, 28);
  ctx.fillStyle = '#a5b4fc';
  ctx.fillText('ENEMIES: ' + engine.enemies.length, 155, 42);
}
`,
  },
  {
    id: 'gravi-flip',
    title: 'Gravi-Flip: Quantum Dimension Platformer',
    genre: 'Physics',
    description: 'Precision physics platformer with real-time gravity inversion mechanics. Flip world gravity between floor and ceiling with [B] or [SHIFT] to avoid lasers and navigate impossible obstacle corridors.',
    version: '1.5.0',
    upgradesApplied: ['Quantum Gravity Flip', 'Laser Hazard Gates', 'Moving Kinetic Platforms', 'Stardust Particles'],
    tags: ['Physics', 'Platformer', 'Gravity', 'Precision'],
    controlsLegend: [
      { key: 'A / D or ◄ ►', action: 'Run Left / Right' },
      { key: 'W / SPACE or [A]', action: 'Standard Jump' },
      { key: 'SHIFT or [B]', action: 'FLIP GRAVITY (Floor ⇄ Ceiling)' },
      { key: 'P', action: 'Pause Game' },
      { key: 'R', action: 'Restart Run' },
    ],
    params: {
      playerSpeed: 1.2,
      difficulty: 1.0,
      lives: 3,
      fireRate: 1.0,
      particleDensity: 'high',
      colorTheme: 'synthwave-sunset',
      screenShake: true,
    },
    code: `// --- GRAVI-FLIP: QUANTUM DIMENSION PLATFORMER ---
// Features real-time gravity inversion, moving platforms, and precision kinetic hazards

function init(engine) {
  engine.player = {
    x: 60,
    y: engine.height - 120,
    vx: 0,
    vy: 0,
    width: 26,
    height: 32,
    speed: 290 * engine.params.playerSpeed,
    gravityDir: 1, // 1 = down, -1 = up (ceiling)
    isGrounded: false,
    facing: 1,
    flipCooldown: 0,
  };

  // Static platforms
  engine.platforms = [
    // Bottom floor & Top ceiling
    { x: 0, y: engine.height - 40, width: engine.width, height: 40, color: '#1e293b' },
    { x: 0, y: 0, width: engine.width, height: 40, color: '#1e293b' },
    // Mid platforms
    { x: 120, y: 150, width: 140, height: 18, color: '#ec4899' },
    { x: 320, y: 220, width: 160, height: 18, color: '#8b5cf6' },
    { x: 530, y: 140, width: 130, height: 18, color: '#06b6d4' },
    { x: 220, y: 360, width: 160, height: 18, color: '#10b981' },
    { x: 440, y: 380, width: 180, height: 18, color: '#f59e0b' },
  ];

  // Moving platforms
  engine.movingPlatforms = [
    { x: 260, y: 290, width: 100, height: 16, minX: 200, maxX: 460, speed: 110, vx: 110, color: '#06b6d4' },
  ];

  // Laser Hazards
  engine.lasers = [
    { x: 180, y: 40, height: 90, color: '#f43f5e' },
    { x: 390, y: engine.height - 130, height: 90, color: '#f43f5e' },
    { x: 580, y: 40, height: 80, color: '#f43f5e' },
  ];

  // Collectible Energy Orbs
  engine.orbs = [
    { x: 190, y: 120, radius: 9, collected: false },
    { x: 400, y: 190, radius: 9, collected: false },
    { x: 300, y: 430, radius: 9, collected: false },
    { x: 600, y: 110, radius: 9, collected: false },
    { x: 640, y: 460, radius: 9, collected: false },
  ];
}

function update(engine, dt) {
  const p = engine.player;
  const keys = engine.keys;

  // Run left/right
  let move = 0;
  if (keys['ArrowLeft'] || keys['KeyA'] || engine.pad.left) { move = -1; p.facing = -1; }
  if (keys['ArrowRight'] || keys['KeyD'] || engine.pad.right) { move = 1; p.facing = 1; }
  p.vx = move * p.speed;
  p.x += p.vx * dt;
  p.x = Math.max(20, Math.min(engine.width - 20, p.x));

  // Quantum Gravity Inversion (SHIFT / B)
  p.flipCooldown -= dt;
  const wantFlip = keys['ShiftLeft'] || keys['KeyQ'] || engine.pad.b;
  if (wantFlip && p.flipCooldown <= 0) {
    p.gravityDir *= -1;
    p.flipCooldown = 0.35;
    engine.playSound('shield');
    engine.triggerShake(5);
    engine.spawnSparks(p.x, p.y, 18, '#ec4899');
  }

  // Apply vertical gravity
  p.vy += 1200 * p.gravityDir * dt;
  p.y += p.vy * dt;

  // Standard Jump (W / SPACE / A)
  const jumpKey = keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || engine.pad.a;
  if (jumpKey && p.isGrounded) {
    p.vy = -540 * p.gravityDir;
    p.isGrounded = false;
    engine.playSound('jump');
    engine.spawnSparks(p.x, p.y, 8, '#06b6d4');
  }

  // Update moving platforms
  for (const mp of engine.movingPlatforms) {
    mp.x += mp.vx * dt;
    if (mp.x > mp.maxX) mp.vx = -Math.abs(mp.vx);
    if (mp.x < mp.minX) mp.vx = Math.abs(mp.vx);
  }

  // Platform Collisions (both static & moving)
  p.isGrounded = false;
  const allPlatforms = [...engine.platforms, ...engine.movingPlatforms];

  for (const plat of allPlatforms) {
    if (
      p.x + p.width / 2 > plat.x &&
      p.x - p.width / 2 < plat.x + plat.width
    ) {
      if (p.gravityDir === 1) {
        // Falling down onto platform
        if (p.y + p.height / 2 >= plat.y && p.y + p.height / 2 <= plat.y + 24 && p.vy >= 0) {
          p.y = plat.y - p.height / 2;
          p.vy = 0;
          p.isGrounded = true;
        }
      } else {
        // Falling up towards ceiling platform
        if (p.y - p.height / 2 <= plat.y + plat.height && p.y - p.height / 2 >= plat.y && p.vy <= 0) {
          p.y = plat.y + plat.height + p.height / 2;
          p.vy = 0;
          p.isGrounded = true;
        }
      }
    }
  }

  // Laser Hazard collision
  for (const laser of engine.lasers) {
    if (
      Math.abs(p.x - laser.x) < 14 &&
      p.y >= laser.y &&
      p.y <= laser.y + laser.height
    ) {
      engine.triggerShake(8);
      engine.playSound('explosion');
      engine.loseLife();
      p.x = 60;
      p.y = engine.height - 120;
      p.vy = 0;
      p.gravityDir = 1;
      break;
    }
  }

  // Energy Orb collection
  for (const orb of engine.orbs) {
    if (!orb.collected && Math.hypot(p.x - orb.x, p.y - orb.y) < p.width / 2 + orb.radius) {
      orb.collected = true;
      engine.addScore(100);
      engine.playSound('success');
      engine.spawnSparks(orb.x, orb.y, 16, '#facc15');
    }
  }
}

function render(engine, ctx) {
  // Synthwave gradient void
  const grad = ctx.createLinearGradient(0, 0, 0, engine.height);
  grad.addColorStop(0, '#0c0a20');
  grad.addColorStop(1, '#02040a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, engine.width, engine.height);

  // Render static & moving platforms
  const allPlatforms = [...engine.platforms, ...engine.movingPlatforms];
  for (const plat of allPlatforms) {
    ctx.save();
    ctx.fillStyle = plat.color;
    ctx.shadowBlur = 8;
    ctx.shadowColor = plat.color;
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
    ctx.restore();
  }

  // Render Lasers with glowing beams
  for (const laser of engine.lasers) {
    ctx.save();
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(laser.x, laser.y);
    ctx.lineTo(laser.x, laser.y + laser.height);
    ctx.stroke();

    // Laser emitter diodes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(laser.x - 5, laser.y - 4, 10, 8);
    ctx.fillRect(laser.x - 5, laser.y + laser.height - 4, 10, 8);
    ctx.restore();
  }

  // Render Energy Orbs
  for (const orb of engine.orbs) {
    if (orb.collected) continue;
    ctx.save();
    ctx.fillStyle = '#facc15';
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#facc15';
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Render Player Cube / Knight
  const p = engine.player;
  ctx.save();
  ctx.fillStyle = p.gravityDir === 1 ? '#06b6d4' : '#ec4899';
  ctx.shadowBlur = 12;
  ctx.shadowColor = p.gravityDir === 1 ? '#06b6d4' : '#ec4899';
  ctx.fillRect(p.x - p.width / 2, p.y - p.height / 2, p.width, p.height);

  // Gravity arrow indicator on player
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px sans-serif';
  ctx.fillText(p.gravityDir === 1 ? '▼' : '▲', p.x - 6, p.y + 5);
  ctx.restore();

  // Gravity Mode HUD Banner
  ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.fillRect(15, 12, 220, 26);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.strokeRect(15, 12, 220, 26);
  ctx.fillStyle = p.gravityDir === 1 ? '#38bdf8' : '#f472b6';
  ctx.font = '11px monospace';
  ctx.fillText('GRAVITY: ' + (p.gravityDir === 1 ? 'FLOOR (NORMAL)' : 'CEILING (INVERTED)'), 24, 29);
}
`,
  },
];
