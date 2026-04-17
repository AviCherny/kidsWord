export const STICKER_RING_GOAL = 16;

const WORLD_HEIGHT = 576;
const WORLD_WIDTH = 4300;
const GROUND_Y = 448;
const PLAYER_WIDTH = 86;
const PLAYER_HEIGHT = 96;
const PLAYER_ROLL_HEIGHT = 62;
const START_X = 96;
const START_Y = GROUND_Y - PLAYER_HEIGHT;
const MAX_FALL_SPEED = 1080;
const GROUND_ACCEL = 1780;
const AIR_ACCEL = 1220;
const GROUND_FRICTION = 2450;
const AIR_DRAG = 180;
const ROLL_FRICTION = 360;
const GRAVITY = 1960;
const JUMP_VELOCITY = -810;
const SPRING_VELOCITY = -1140;
const CAMERA_SMOOTHING = 0.14;
const DEFAULT_OPTIONS = { facilitatorMode: false };

const SOLIDS = [
  { x: 0, y: GROUND_Y, w: WORLD_WIDTH, h: WORLD_HEIGHT - GROUND_Y },
  { x: 360, y: 388, w: 120, h: 60 },
  { x: 580, y: 320, w: 180, h: 22 },
  { x: 930, y: 360, w: 120, h: 88 },
  { x: 1160, y: 270, w: 170, h: 22 },
  { x: 1480, y: 340, w: 130, h: 108 },
  { x: 1740, y: 290, w: 190, h: 22 },
  { x: 2140, y: 320, w: 120, h: 128 },
  { x: 2440, y: 250, w: 190, h: 22 },
  { x: 2820, y: 340, w: 220, h: 22 },
  { x: 3140, y: 370, w: 130, h: 78 },
  { x: 3460, y: 280, w: 170, h: 22 },
  { x: 3900, y: 380, w: 160, h: 68 },
];

const SPRINGS = [
  { x: 952, y: 332, w: 76, h: 28 },
  { x: 2162, y: 292, w: 76, h: 28 },
  { x: 3170, y: 342, w: 76, h: 28 },
];

const SPIKES = [
  { x: 720, y: 414, w: 86, h: 34 },
  { x: 1348, y: 414, w: 84, h: 34 },
  { x: 1978, y: 414, w: 86, h: 34 },
  { x: 2750, y: 414, w: 108, h: 34 },
  { x: 3322, y: 414, w: 84, h: 34 },
  { x: 1544, y: 306, w: 58, h: 34 },
];

const CHECKPOINTS = [
  { x: 1270, y: 296 },
  { x: 2940, y: 296 },
];

const GOAL = { x: 4040, y: 272, w: 30, h: 176 };
const PALM_TREES = [260, 640, 1260, 2020, 2580, 3360, 3880];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function approach(value, target, delta) {
  if (value < target) return Math.min(target, value + delta);
  if (value > target) return Math.max(target, value - delta);
  return target;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function circleRectOverlap(circle, rect) {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy < circle.radius * circle.radius;
}

function addRingLine(target, startX, y, count, spacing) {
  for (let index = 0; index < count; index += 1) {
    target.push({ x: startX + index * spacing, y, radius: 14, collected: false, wobble: index * 0.4 });
  }
}

function addRingArc(target, centerX, centerY, radius, count, startAngle, endAngle) {
  const step = count === 1 ? 0 : (endAngle - startAngle) / (count - 1);
  for (let index = 0; index < count; index += 1) {
    const angle = startAngle + step * index;
    target.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      radius: 14,
      collected: false,
      wobble: index * 0.45,
    });
  }
}

function buildRings() {
  const rings = [];
  addRingLine(rings, 190, 394, 5, 34);
  addRingArc(rings, 650, 275, 76, 5, Math.PI * 0.95, Math.PI * 0.05);
  addRingLine(rings, 948, 322, 4, 28);
  addRingLine(rings, 1186, 220, 4, 32);
  addRingArc(rings, 1538, 272, 84, 5, Math.PI * 1.08, Math.PI * 0.02);
  addRingLine(rings, 1768, 240, 5, 34);
  addRingArc(rings, 2215, 220, 88, 5, Math.PI * 1.1, Math.PI * -0.08);
  addRingLine(rings, 2468, 200, 4, 30);
  addRingLine(rings, 2848, 288, 5, 34);
  addRingArc(rings, 3520, 214, 90, 6, Math.PI * 1.08, Math.PI * -0.08);
  addRingLine(rings, 3924, 324, 4, 32);
  return rings;
}

function solidRect(solid) {
  return { x: solid.x, y: solid.y, width: solid.w, height: solid.h };
}

function createPlayer() {
  return {
    x: START_X,
    y: START_Y,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    isGrounded: true,
    isRolling: false,
    facing: 1,
    invulnerable: 0,
    runTime: 0,
    respawnX: START_X,
    respawnY: START_Y,
  };
}

export class SonicPlatformerEngine {
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.viewportWidth = 1024;
    this.viewportHeight = WORLD_HEIGHT;
    this.controls = { left: false, right: false, down: false };
    this.reset();
  }

  reset() {
    this.player = createPlayer();
    this.elapsed = 0;
    this.phase = 'playing';
    this.cameraX = 0;
    this.flashTimer = 0;
    this.ringsCollected = 0;
    this.ringGoal = this.options.facilitatorMode ? 12 : STICKER_RING_GOAL;
    this.maxLives = this.options.facilitatorMode ? 5 : 3;
    this.lives = this.maxLives;
    this.goal = { ...GOAL, activated: false };
    this.checkpoints = CHECKPOINTS.map((checkpoint) => ({ ...checkpoint, activated: false }));
    this.rings = buildRings();
    this.totalRings = this.rings.length;
  }

  resize(width, height) {
    this.viewportWidth = Math.max(320, Math.round(width || this.viewportWidth));
    this.viewportHeight = Math.max(360, Math.round(height || this.viewportHeight));
    this.updateCamera(true);
  }

  setControl(action, active) {
    if (action in this.controls) {
      this.controls[action] = Boolean(active);
    }
  }

  clearControls() {
    this.controls.left = false;
    this.controls.right = false;
    this.controls.down = false;
  }

  jump() {
    if (this.phase !== 'playing' || !this.player.isGrounded) return false;
    this.player.vy = JUMP_VELOCITY;
    this.player.isGrounded = false;
    this.enterRoll();
    return true;
  }

  getScale() {
    return this.viewportHeight / WORLD_HEIGHT;
  }

  getVisibleWorldWidth() {
    return this.viewportWidth / this.getScale();
  }

  getMaxRunSpeed() {
    return this.options.facilitatorMode ? 520 : 620;
  }

  getPlayerRect() {
    return { x: this.player.x, y: this.player.y, width: this.player.width, height: this.player.height };
  }

  getPlayerHurtbox() {
    return this.player.isRolling
      ? { x: this.player.x + 14, y: this.player.y + 10, width: this.player.width - 28, height: this.player.height - 14 }
      : { x: this.player.x + 18, y: this.player.y + 8, width: this.player.width - 36, height: this.player.height - 12 };
  }

  canOccupy(rect) {
    return !SOLIDS.some((solid) => rectsOverlap(rect, solidRect(solid)));
  }

  enterRoll() {
    if (this.player.isRolling) return;
    const bottom = this.player.y + this.player.height;
    this.player.isRolling = true;
    this.player.height = PLAYER_ROLL_HEIGHT;
    this.player.y = bottom - this.player.height;
  }

  exitRoll(force = false) {
    if (!this.player.isRolling) return true;
    const bottom = this.player.y + this.player.height;
    const next = { x: this.player.x, y: bottom - PLAYER_HEIGHT, width: this.player.width, height: PLAYER_HEIGHT };
    if (!force && !this.canOccupy(next)) return false;
    this.player.isRolling = false;
    this.player.height = PLAYER_HEIGHT;
    this.player.y = bottom - this.player.height;
    return true;
  }

  updateCamera(force = false) {
    const visibleWidth = this.getVisibleWorldWidth();
    const target = clamp(
      this.player.x + this.player.width * 0.5 - visibleWidth * 0.36 + this.player.vx * 0.16,
      0,
      WORLD_WIDTH - visibleWidth,
    );
    this.cameraX = force ? target : lerp(this.cameraX, target, CAMERA_SMOOTHING);
  }

  hitPlayer() {
    if (this.phase !== 'playing' || this.player.invulnerable > 0) return;
    this.lives -= 1;
    this.flashTimer = 0.26;
    if (this.lives <= 0) {
      this.phase = 'lost';
      this.player.vx = 0;
      this.player.vy = 0;
      this.clearControls();
      return;
    }
    this.exitRoll(true);
    this.player.x = this.player.respawnX;
    this.player.y = this.player.respawnY;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isGrounded = true;
    this.player.invulnerable = 1.7;
    this.clearControls();
    this.updateCamera(true);
  }

  update(dt) {
    this.flashTimer = Math.max(0, this.flashTimer - dt);
    this.rings.forEach((ring) => {
      ring.wobble += dt * 5.4;
    });
    if (this.phase !== 'playing') {
      this.updateCamera();
      return;
    }

    this.elapsed += dt;
    this.player.invulnerable = Math.max(0, this.player.invulnerable - dt);
    this.player.runTime += dt * (3 + Math.abs(this.player.vx) * 0.012);

    const moveIntent = (this.controls.right ? 1 : 0) - (this.controls.left ? 1 : 0);
    if (moveIntent !== 0) {
      const accel = this.player.isGrounded ? GROUND_ACCEL : AIR_ACCEL;
      const rollPenalty = this.player.isRolling && this.player.isGrounded ? 0.28 : 1;
      this.player.vx += moveIntent * accel * rollPenalty * dt;
      this.player.facing = moveIntent > 0 ? 1 : -1;
    } else if (this.player.isGrounded) {
      this.player.vx = approach(this.player.vx, 0, (this.player.isRolling ? ROLL_FRICTION : GROUND_FRICTION) * dt);
    } else {
      this.player.vx = approach(this.player.vx, 0, AIR_DRAG * dt);
    }

    this.player.vx = clamp(this.player.vx, -this.getMaxRunSpeed(), this.getMaxRunSpeed());
    if (this.controls.down && this.player.isGrounded && !this.player.isRolling && Math.abs(this.player.vx) > 220) this.enterRoll();
    if (!this.controls.down && this.player.isGrounded && this.player.isRolling && Math.abs(this.player.vx) < 170) this.exitRoll();

    const previousBottom = this.player.y + this.player.height;
    this.player.x += this.player.vx * dt;
    let playerRect = this.getPlayerRect();
    for (const solid of SOLIDS) {
      if (!rectsOverlap(playerRect, solidRect(solid))) continue;
      this.player.x = this.player.vx > 0 ? solid.x - this.player.width : solid.x + solid.w;
      this.player.vx = 0;
      playerRect = this.getPlayerRect();
    }

    this.player.vy = Math.min(MAX_FALL_SPEED, this.player.vy + GRAVITY * dt);
    this.player.y += this.player.vy * dt;
    this.player.isGrounded = false;
    playerRect = this.getPlayerRect();

    let bounced = false;
    for (const spring of SPRINGS) {
      const springRect = { x: spring.x, y: spring.y, width: spring.w, height: spring.h };
      if (rectsOverlap(playerRect, springRect) && previousBottom <= spring.y + spring.h * 0.5 && this.player.vy >= 0) {
        this.player.y = spring.y - this.player.height + 4;
        this.player.vy = SPRING_VELOCITY;
        this.enterRoll();
        bounced = true;
        playerRect = this.getPlayerRect();
        break;
      }
    }

    if (!bounced) {
      for (const solid of SOLIDS) {
        if (!rectsOverlap(playerRect, solidRect(solid))) continue;
        if (this.player.vy > 0) {
          this.player.y = solid.y - this.player.height;
          this.player.vy = 0;
          this.player.isGrounded = true;
        } else if (this.player.vy < 0) {
          this.player.y = solid.y + solid.h;
          this.player.vy = 0;
        }
        playerRect = this.getPlayerRect();
      }
    }

    if (this.player.isGrounded && !this.controls.down && this.player.isRolling && Math.abs(this.player.vx) < 170) this.exitRoll();

    const hurtbox = this.getPlayerHurtbox();
    for (const ring of this.rings) {
      if (!ring.collected && circleRectOverlap({ x: ring.x, y: ring.y + Math.sin(ring.wobble) * 3, radius: ring.radius }, hurtbox)) {
        ring.collected = true;
        this.ringsCollected += 1;
      }
    }

    for (const checkpoint of this.checkpoints) {
      if (!checkpoint.activated && this.player.x + this.player.width * 0.5 > checkpoint.x) {
        checkpoint.activated = true;
        this.player.respawnX = checkpoint.x - 20;
        this.player.respawnY = START_Y;
      }
    }

    if (this.player.invulnerable <= 0) {
      for (const spike of SPIKES) {
        if (rectsOverlap(hurtbox, { x: spike.x + 6, y: spike.y + 4, width: spike.w - 12, height: spike.h - 4 })) {
          this.hitPlayer();
          break;
        }
      }
    }

    if (this.phase === 'playing' && this.player.y > WORLD_HEIGHT + 180) this.hitPlayer();
    if (this.phase === 'playing' && this.player.x + this.player.width * 0.55 >= this.goal.x && this.player.y + this.player.height > this.goal.y) {
      this.phase = 'won';
      this.goal.activated = true;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.isGrounded = true;
      this.clearControls();
    }

    this.updateCamera();
  }

  getSnapshot() {
    return {
      phase: this.phase,
      rings: this.ringsCollected,
      totalRings: this.totalRings,
      ringGoal: this.ringGoal,
      lives: this.lives,
      maxLives: this.maxLives,
      canClaimSticker: this.phase === 'won' && this.ringsCollected >= this.ringGoal,
      progress: clamp(Math.round(((this.player.x - START_X) / (this.goal.x - START_X)) * 100), 0, 100),
      speed: Math.round(Math.abs(this.player.vx) / 6),
      playerRolling: this.player.isRolling,
      playerAirborne: !this.player.isGrounded,
    };
  }

  render(ctx) {
    const scale = this.getScale();
    const visibleWidth = this.getVisibleWorldWidth();

    drawSky(ctx, this.viewportWidth, this.viewportHeight);
    ctx.save();
    ctx.scale(scale, scale);
    drawClouds(ctx, this.cameraX, visibleWidth, 86, 0.2, 'rgba(255,255,255,0.85)');
    drawClouds(ctx, this.cameraX, visibleWidth, 142, 0.34, 'rgba(255,255,255,0.55)');
    drawHills(ctx, this.cameraX, visibleWidth, 338, 0.24, '#7db4f4', '#4f86dc');
    drawHills(ctx, this.cameraX, visibleWidth, 392, 0.45, '#4aa85c', '#2f7f45');
    ctx.restore();

    ctx.save();
    ctx.scale(scale, scale);
    ctx.translate(-this.cameraX, 0);
    for (const solid of SOLIDS) drawSolid(ctx, solid);
    for (const treeX of PALM_TREES) drawPalmTree(ctx, treeX);
    for (const checkpoint of this.checkpoints) drawCheckpoint(ctx, checkpoint);
    drawGoal(ctx, this.goal);
    for (const spring of SPRINGS) drawSpring(ctx, spring);
    for (const spike of SPIKES) drawSpikes(ctx, spike);
    for (const ring of this.rings) if (!ring.collected) drawRing(ctx, ring);
    drawPlayer(ctx, this.player, this.getMaxRunSpeed());
    ctx.restore();

    if (this.flashTimer > 0) {
      ctx.save();
      ctx.globalAlpha = this.flashTimer * 0.48;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);
      ctx.restore();
    }
  }
}

function drawSky(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0f5bc9');
  gradient.addColorStop(0.55, '#43b8ff');
  gradient.addColorStop(1, '#7ae7ff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const sun = ctx.createRadialGradient(width - 140, 96, 18, width - 140, 96, 120);
  sun.addColorStop(0, 'rgba(255,247,190,0.95)');
  sun.addColorStop(0.4, 'rgba(255,227,122,0.42)');
  sun.addColorStop(1, 'rgba(255,227,122,0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(width - 140, 96, 120, 0, Math.PI * 2);
  ctx.fill();
}

function drawClouds(ctx, cameraX, visibleWidth, y, parallax, fill) {
  const spacing = 210;
  const start = -((cameraX * parallax) % spacing) - spacing;
  ctx.fillStyle = fill;
  for (let x = start; x < visibleWidth + spacing * 2; x += spacing) {
    ctx.beginPath();
    ctx.ellipse(x + 46, y, 42, 20, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 80, y - 8, 34, 18, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 116, y, 42, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHills(ctx, cameraX, visibleWidth, baseY, parallax, fill, shadow) {
  const spacing = 320;
  const offset = -((cameraX * parallax) % spacing) - spacing;
  for (let x = offset; x < visibleWidth + spacing * 2; x += spacing) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x, WORLD_HEIGHT);
    ctx.quadraticCurveTo(x + spacing * 0.18, baseY - 96, x + spacing * 0.42, baseY);
    ctx.quadraticCurveTo(x + spacing * 0.62, baseY - 62, x + spacing * 0.88, baseY + 12);
    ctx.lineTo(x + spacing, WORLD_HEIGHT);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.moveTo(x + spacing * 0.42, baseY);
    ctx.quadraticCurveTo(x + spacing * 0.54, baseY - 22, x + spacing * 0.88, baseY + 12);
    ctx.lineTo(x + spacing, WORLD_HEIGHT);
    ctx.lineTo(x + spacing * 0.42, WORLD_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }
}

function drawSolid(ctx, solid) {
  const grassHeight = Math.min(26, solid.h);
  const grass = ctx.createLinearGradient(0, solid.y, 0, solid.y + grassHeight);
  grass.addColorStop(0, '#88f26b');
  grass.addColorStop(1, '#29b14a');
  ctx.fillStyle = grass;
  roundRect(ctx, solid.x, solid.y, solid.w, grassHeight, 8);
  ctx.fill();

  const dirtY = solid.y + grassHeight - 2;
  const dirtHeight = Math.max(10, solid.h - grassHeight + 2);
  const dirt = ctx.createLinearGradient(0, dirtY, 0, dirtY + dirtHeight);
  dirt.addColorStop(0, '#b66c29');
  dirt.addColorStop(1, '#7a4217');
  ctx.fillStyle = dirt;
  roundRect(ctx, solid.x, dirtY, solid.w, dirtHeight, 6);
  ctx.fill();

  const cell = 24;
  ctx.fillStyle = 'rgba(63,32,12,0.18)';
  for (let x = solid.x; x < solid.x + solid.w; x += cell) {
    for (let y = dirtY; y < solid.y + solid.h; y += cell) {
      const parity = (Math.floor((x - solid.x) / cell) + Math.floor((y - dirtY) / cell)) % 2;
      if (parity === 0) {
        ctx.fillRect(x, y, Math.min(cell, solid.x + solid.w - x), Math.min(cell, solid.y + solid.h - y));
      }
    }
  }
}

function drawPalmTree(ctx, x) {
  ctx.save();
  ctx.translate(x, GROUND_Y - 8);
  ctx.strokeStyle = '#8a5426';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(10, -58, -4, -132);
  ctx.stroke();
  ctx.fillStyle = '#2db74f';
  for (let index = 0; index < 5; index += 1) {
    ctx.save();
    ctx.translate(-2, -132);
    ctx.rotate(-1.1 + index * 0.55);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(48, -10, 82, -2);
    ctx.quadraticCurveTo(42, 18, 0, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawCheckpoint(ctx, checkpoint) {
  ctx.save();
  ctx.translate(checkpoint.x, checkpoint.y);
  ctx.strokeStyle = '#d9f0ff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 152);
  ctx.stroke();
  ctx.fillStyle = checkpoint.activated ? '#ffe16e' : '#67d5ff';
  ctx.beginPath();
  ctx.arc(0, 38, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = checkpoint.activated ? '#0f5bc9' : '#ffffff';
  drawStar(ctx, 0, 38, 10, 5);
  ctx.restore();
}

function drawGoal(ctx, goal) {
  ctx.save();
  ctx.translate(goal.x, goal.y);
  ctx.fillStyle = '#e8f6ff';
  ctx.fillRect(0, 0, 10, goal.h);
  ctx.fillStyle = '#ff5252';
  ctx.beginPath();
  ctx.arc(5, 0, 18, 0, Math.PI * 2);
  ctx.fill();
  const signY = goal.activated ? 110 : 42;
  ctx.fillStyle = '#ffe36d';
  roundRect(ctx, 18, signY, 82, 54, 12);
  ctx.fill();
  ctx.fillStyle = '#0f4aa5';
  ctx.font = '900 18px "Trebuchet MS", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GO!', 58, signY + 33);
  ctx.restore();
}

function drawSpring(ctx, spring) {
  ctx.save();
  ctx.translate(spring.x, spring.y);
  ctx.fillStyle = '#e23434';
  roundRect(ctx, 0, 10, spring.w, spring.h - 10, 8);
  ctx.fill();
  ctx.fillStyle = '#ffe166';
  for (let x = 10; x < spring.w - 6; x += 14) {
    roundRect(ctx, x, 0, 8, 20, 4);
    ctx.fill();
  }
  ctx.fillStyle = '#f4f7fb';
  roundRect(ctx, 6, spring.h - 10, spring.w - 12, 8, 4);
  ctx.fill();
  ctx.restore();
}

function drawSpikes(ctx, spike) {
  ctx.save();
  ctx.translate(spike.x, spike.y);
  ctx.fillStyle = '#d5e6f9';
  for (let x = 0; x < spike.w; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, spike.h);
    ctx.lineTo(x + 9, 0);
    ctx.lineTo(x + 18, spike.h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#8ea3c5';
  ctx.fillRect(0, spike.h - 6, spike.w, 6);
  ctx.restore();
}

function drawRing(ctx, ring) {
  const scaleX = 0.55 + Math.abs(Math.sin(ring.wobble)) * 0.45;
  ctx.save();
  ctx.translate(ring.x, ring.y + Math.sin(ring.wobble) * 3);
  ctx.scale(scaleX, 1);
  ctx.strokeStyle = '#ffd84e';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, ring.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.56)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-2, -2, ring.radius - 4, -0.5, 1.5);
  ctx.stroke();
  ctx.restore();
}

function drawPlayer(ctx, player, maxSpeed) {
  const centerX = player.x + player.width * 0.5;
  const centerY = player.y + player.height * 0.48;
  const alpha = player.invulnerable > 0 && Math.floor(player.invulnerable * 14) % 2 === 0 ? 0.44 : 1;
  const speedRatio = clamp(Math.abs(player.vx) / maxSpeed, 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(6,18,31,0.22)';
  ctx.beginPath();
  ctx.ellipse(centerX + 8, GROUND_Y + 10, player.width * 0.42, player.height * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(centerX, centerY);
  if (player.facing === -1) ctx.scale(-1, 1);
  if (player.isRolling || !player.isGrounded) {
    ctx.rotate(player.runTime * 8);
    ctx.fillStyle = '#0f73ef';
    ctx.beginPath();
    ctx.arc(0, 0, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0b56b8';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 18, -1, 1.2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,255,255,${0.18 + speedRatio * 0.24})`;
    ctx.beginPath();
    ctx.arc(0, 0, 25, -0.3, 1.4);
    ctx.stroke();
  } else {
    const bounce = Math.sin(player.runTime * 5.6) * 4;
    ctx.translate(0, bounce);
    ctx.fillStyle = '#0f73ef';
    ctx.beginPath();
    ctx.moveTo(-38, -6);
    ctx.lineTo(-66, -16);
    ctx.lineTo(-40, 10);
    ctx.lineTo(-70, 14);
    ctx.lineTo(-30, 26);
    ctx.lineTo(-54, 42);
    ctx.lineTo(-8, 34);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-4, -4, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4c99a';
    ctx.beginPath();
    ctx.ellipse(18, 8, 22, 18, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(6, -16, 9, 16, -0.15, 0, Math.PI * 2);
    ctx.ellipse(24, -12, 8, 15, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.ellipse(7, -12, 3, 6, -0.15, 0, Math.PI * 2);
    ctx.ellipse(24, -8, 3, 6, 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.ellipse(37, 2, 8, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-18, 26, 10, 0, Math.PI * 2);
    ctx.arc(10, 22, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dc2f2f';
    ctx.beginPath();
    ctx.ellipse(-20, 42, 20, 10, -0.08, 0, Math.PI * 2);
    ctx.ellipse(16, 38, 20, 10, 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStar(ctx, x, y, radius, innerRadius) {
  ctx.beginPath();
  for (let point = 0; point < 10; point += 1) {
    const angle = -Math.PI / 2 + point * (Math.PI / 5);
    const length = point % 2 === 0 ? radius : innerRadius;
    const px = x + Math.cos(angle) * length;
    const py = y + Math.sin(angle) * length;
    if (point === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}
