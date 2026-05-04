import React, { useEffect, useRef } from 'react';
import './PawPatrol.css';
import { speak } from '../../speak';

// ─────────────────────────────────────────────
// CHARACTER CONTENT
// ─────────────────────────────────────────────
const DOG_ITEMS = {
  Marshall: [
    { emoji: '💧', word: 'WATER',  sentence: "Water!"  },
    { emoji: '🍎', word: 'APPLE',  sentence: "Apple!"  },
    { emoji: '🥚', word: 'EGG',    sentence: "Egg!"    },
    { emoji: '🐟', word: 'FISH',   sentence: "Fish!"   },
    { emoji: '☀️', word: 'SUN',    sentence: "Sun!"    },
    { emoji: '☕', word: 'CUP',    sentence: "Cup!"    },
  ],
  Chase: [
    { emoji: '🦴', word: 'BONE',   sentence: "Bone!"   },
    { emoji: '⭐', word: 'STAR',   sentence: "Star!"   },
    { emoji: '🏀', word: 'BALL',   sentence: "Ball!"   },
    { emoji: '🚗', word: 'CAR',    sentence: "Car!"    },
    { emoji: '🐱', word: 'CAT',    sentence: "Cat!"    },
    { emoji: '🐶', word: 'DOG',    sentence: "Dog!"    },
  ],
  Rubble: [
    { emoji: '🧱', word: 'BRICK',  sentence: "Brick!"  },
    { emoji: '🎂', word: 'CAKE',   sentence: "Cake!"   },
    { emoji: '🌙', word: 'MOON',   sentence: "Moon!"   },
    { emoji: '🦆', word: 'DUCK',   sentence: "Duck!"   },
    { emoji: '🚌', word: 'BUS',    sentence: "Bus!"    },
    { emoji: '🎩', word: 'HAT',    sentence: "Hat!"    },
  ],
};

const DOG_OBSTACLES = {
  Marshall: ['🔥', '🔥', '🔥', '🌋'],
  Chase:    ['⚡', '⚡', '🌩️', '⚡'],
  Rubble:   ['🪨', '🪨', '🌊', '🪵'],
};

const DOG_DEFS = [
  { name: 'Chase',    color: '#1565C0', tagline: "Chase is on the case!" },
  { name: 'Marshall', color: '#C62828', tagline: "I'm all fired up!"     },
  { name: 'Rubble',   color: '#F9A825', tagline: "Rubble on the double!" },
];

const POSTER_PATHS = {
  Chase:    '/paw-patrol/chase-poster.jpg',
  Marshall: '/paw-patrol/marshall-poster.jpg',
  Rubble:   '/paw-patrol/rubble-poster.jpg',
};

// ─────────────────────────────────────────────
// GAME ENGINE
// ─────────────────────────────────────────────
function runGame(canvas, { onSuccess, onExit, difficulty }) {
  const ctx = canvas.getContext('2d');
  let speedMult = 1; // updated in resetGame based on chosen difficulty

  // ── Image loading ────────────────────────────
  const dogImages = {};
  DOG_DEFS.forEach(d => {
    const img = new Image();
    img.onload = () => { dogImages[d.name] = img; };
    img.src = POSTER_PATHS[d.name];
  });

  // ── Sizing ──────────────────────────────────
  let dog = null;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    if (dog) dog.resetGround();
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Utils ────────────────────────────────────
  const lerp     = (a, b, t) => a + (b - a) * t;
  const clamp    = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const approach = (v, t, d) => v < t ? Math.min(t, v + d) : Math.max(t, v - d);

  // ── Background ───────────────────────────────
  let bgTick = 0;
  let cameraX = 0;
  let clouds = [];
  const GROUND_RATIO = 0.76;

  function initBg() {
    clouds = Array.from({ length: 7 }, () => ({
      x: Math.random() * canvas.width,
      y: 30 + Math.random() * 130,
      rx: 50 + Math.random() * 65,
      ry: 25 + Math.random() * 20,
      speed: 0.25 + Math.random() * 0.45,
      alpha: 0.55 + Math.random() * 0.35,
    }));
  }

  function drawBg() {
    bgTick++;
    const gY = canvas.height * GROUND_RATIO;

    const sky = ctx.createLinearGradient(0, 0, 0, gY);
    sky.addColorStop(0, '#5CB8FF'); sky.addColorStop(1, '#D6F0FF');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, gY);

    clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x < -c.rx * 2.5) c.x = canvas.width + c.rx;
      ctx.save(); ctx.globalAlpha = c.alpha; ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.ellipse(c.x,                c.y,     c.rx,        c.ry,        0, 0, Math.PI * 2);
      ctx.ellipse(c.x - c.rx * 0.45, c.y + 6, c.rx * 0.65, c.ry * 0.7, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + c.rx * 0.45, c.y + 6, c.rx * 0.65, c.ry * 0.7, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.restore();
    });

    const grd = ctx.createLinearGradient(0, gY, 0, canvas.height);
    grd.addColorStop(0,    '#5DA83B'); grd.addColorStop(0.12, '#4A8B2A');
    grd.addColorStop(0.12, '#7B5020'); grd.addColorStop(1,    '#5A3810');
    ctx.fillStyle = grd; ctx.fillRect(0, gY, canvas.width, canvas.height - gY);

    const tW = 55, off = cameraX % tW;
    ctx.fillStyle = '#6DC242';
    for (let x = -off; x < canvas.width + tW; x += tW) {
      ctx.beginPath(); ctx.ellipse(x, gY, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
    }

    const stripeOff = cameraX % 60;
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let x = -stripeOff; x < canvas.width + 60; x += 60)
      ctx.fillRect(x, gY + 4, 36, 6);
  }

  // ── Particles ────────────────────────────────
  let lastDt = 1 / 60; // shared dt for frame-rate-independent subsystems
  let particles = [];

  function burst(x, y, color, count = 14) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i / count) + Math.random() * 0.6;
      const sp = 3 + Math.random() * 7;
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2,
        life: 1, decay: 0.018 + Math.random() * 0.015, size: 5 + Math.random() * 8,
        color, type: 'dot' });
    }
  }

  function starBurst(x, y) {
    ['⭐','🌟','✨','🎉'].forEach((em, i) => {
      const a = (Math.PI * 2 * i / 4) - Math.PI / 2;
      const sp = 5 + Math.random() * 5;
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 4,
        life: 1, decay: 0.013, size: 22, color: em, type: 'emoji' });
    });
  }

  function tickParticles() {
    const s = lastDt * 60;
    particles = particles.filter(p => {
      p.x += p.vx * s; p.y += p.vy * s; p.vy += 0.25 * s; p.life -= p.decay * s; return p.life > 0;
    });
  }

  function drawParticles() {
    particles.forEach(p => {
      ctx.save(); ctx.globalAlpha = p.life;
      if (p.type === 'emoji') {
        ctx.font = `${p.size}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p.color, p.x, p.y);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });
  }

  // ── Paw prints (unused — car leaves no prints) ──
  function tickPaws() {}
  function drawPaws() {}

  // ── Car helpers ──────────────────────────────
  function lightenColor(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0xFF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  function drawCarWheel(cx, r, runT, carColor) {
    const angle = runT * 0.22;
    cx.fillStyle = '#222';
    cx.beginPath(); cx.arc(0, 0, r, 0, Math.PI * 2); cx.fill();
    cx.strokeStyle = '#555'; cx.lineWidth = 2;
    cx.beginPath(); cx.arc(0, 0, r, 0, Math.PI * 2); cx.stroke();
    cx.fillStyle = '#ccc';
    cx.beginPath(); cx.arc(0, 0, r * 0.50, 0, Math.PI * 2); cx.fill();
    cx.strokeStyle = '#aaa'; cx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const a = angle + i * (Math.PI * 2 / 5);
      cx.beginPath();
      cx.moveTo(Math.cos(a) * r * 0.12, Math.sin(a) * r * 0.12);
      cx.lineTo(Math.cos(a) * r * 0.46, Math.sin(a) * r * 0.46);
      cx.stroke();
    }
    cx.fillStyle = carColor;
    cx.beginPath(); cx.arc(0, 0, r * 0.20, 0, Math.PI * 2); cx.fill();
  }

  // ── Dog class ────────────────────────────────
  // Physics — identical constants to the Sonic engine (dt-based, px/s or px/s²)
  const GRAVITY         = 1960;   // px/s²
  const JUMP_VY         = -860;   // px/s  (softer arc — easier to time)
  const MAX_SPEED       = 340;    // px/s  (comfortable auto-run pace)
  const MAX_FALL_SPEED  = 1080;   // px/s
  const GROUND_ACCEL    = 1780;   // px/s²
  const GROUND_FRICTION = 2450;   // px/s²
  const AIR_DRAG        = 180;    // px/s²
  const CAMERA_SMOOTHING = 0.14;

  class Dog {
    constructor(data) {
      this.data = data;
      this.vx = 0; this.vy = 0;
      this.onGround = true; this.facing = 1;
      this.runT = 0;
      this.leftHeld = false; this.rightHeld = false;
      this.state = 'idle';
      this.stateT = 0; this.landSquash = 0;
      this.invincibleT = 0;
      this.w = clamp(canvas.width * 0.22, 120, 165);
      this.h = this.w * 0.60;
      this.resetGround();
    }
    resetGround() {
      this.gY = canvas.height * GROUND_RATIO;
      if (this.onGround || this.y === undefined) this.y = this.gY;
      if (this.x === undefined) this.x = canvas.width / 2;
    }
    jump() {
      if (this.onGround && this.state !== 'ouch') {
        this.vy = JUMP_VY; this.onGround = false; this.state = 'jump';
      }
    }
    celebrate() {
      this.state = 'celebrate'; this.stateT = 80 / 60;
      starBurst(this.x, this.y - this.h * 0.9);
      burst(this.x, this.y - this.h * 0.5, '#FFD700', 14);
    }
    ouch() {
      this.state = 'ouch'; this.stateT = 45 / 60;
      this.invincibleT = 1.8; // 1.8 s of invincibility — prevents double-hit from same obstacle
      this.vx = -this.facing * 420; this.vy = -420; this.onGround = false;
      burst(this.x, this.y - this.h * 0.5, '#FF4444', 10);
    }
    update(dt) {
      if (this.invincibleT > 0) this.invincibleT -= dt;
      if (this.stateT > 0) {
        this.stateT -= dt;
        if (this.stateT <= 0 && (this.state === 'celebrate' || this.state === 'ouch'))
          this.state = this.onGround ? 'idle' : 'jump';
      }
      const locked = this.state === 'ouch'; // celebrate no longer freezes movement
      if (!locked) {
        const moveIntent = (this.rightHeld ? 1 : 0) - (this.leftHeld ? 1 : 0);
        if (moveIntent !== 0) {
          const accel = this.onGround ? GROUND_ACCEL : AIR_DRAG;
          this.vx += moveIntent * accel * dt;
          this.vx = clamp(this.vx, -MAX_SPEED, MAX_SPEED);
          this.facing = moveIntent;
        } else if (this.onGround) {
          this.vx = approach(this.vx, 0, GROUND_FRICTION * dt);
        } else {
          this.vx = approach(this.vx, 0, AIR_DRAG * dt);
        }
      } else {
        this.vx = approach(this.vx, 0, GROUND_FRICTION * dt);
      }

      if (!this.onGround) this.vy = Math.min(MAX_FALL_SPEED, this.vy + GRAVITY * dt);
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      if (this.y >= this.gY) {
        const wasAir = !this.onGround;
        this.y = this.gY; this.vy = 0; this.onGround = true;
        if (wasAir && this.state === 'jump') {
          this.landSquash = 9 / 60;
          this.state = Math.abs(this.vx) > 30 ? 'run' : 'idle';
        }
      }
      // Can't retreat behind the camera's left edge
      this.x = Math.max(cameraX + this.w * 0.5, this.x);
      if (this.onGround && !locked)
        this.state = Math.abs(this.vx) > 30 ? 'run' : 'idle';
      if (this.state === 'run') {
        this.runT += dt * 60;
      }
      if (this.landSquash > 0) this.landSquash -= dt;
    }
    draw() {
      const w = this.w, h = this.h;
      const def = DOG_DEFS.find(d => d.name === this.data.name);
      const carColor = def ? def.color : '#888';

      // Animation transforms
      let tilt = 0, sx = 1, sy = 1, bY = 0;
      switch (this.state) {
        case 'run':
          bY   = Math.sin(this.runT * 0.38) * 2.5;
          tilt = Math.sin(this.runT * 0.22) * 0.04;
          break;
        case 'jump':
          tilt = 0.08 * this.facing;
          if (this.vy < 0) { sx = 0.90; sy = 1.10; } else { sx = 1.10; sy = 0.92; }
          break;
        case 'celebrate':
          bY   = Math.sin(bgTick * 0.3) * 8;
          tilt = Math.sin(bgTick * 0.25) * 0.18;
          sx   = 1 + Math.abs(Math.sin(bgTick * 0.3)) * 0.10; sy = sx;
          break;
        case 'ouch':
          tilt = -0.35 * this.facing; sx = 1.15; sy = 0.85;
          break;
        default: break;
      }
      if (this.landSquash > 0) {
        const q = this.landSquash / (9 / 60); sx = 1 + q * 0.22; sy = 1 - q * 0.18; bY = q * 3;
      }

      const wheelR   = h * 0.22;
      const bodyH    = h * 0.42;
      const cabH     = h - wheelR * 2 - bodyH;
      const bodyX    = -w / 2;
      const bodyYBot = -wheelR * 1.2;
      const bodyYTop = bodyYBot - bodyH;
      const cabW     = w * 0.60;
      const cabX     = bodyX + w * 0.25;
      const cabYBot  = bodyYTop;
      const cabYTop  = cabYBot - cabH;

      // Shadow
      const airH = Math.max(0, this.gY - this.y);
      const shSc = lerp(1, 0.35, airH / 220);
      ctx.save();
      ctx.translate(this.x, this.gY + 10); ctx.scale(shSc, 0.22);
      ctx.beginPath(); ctx.ellipse(0, 0, w * 0.60, w * 0.60, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,0,0,${0.22 * shSc})`; ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(this.facing, 1);
      ctx.rotate(tilt);
      ctx.scale(sx, sy);
      ctx.translate(0, bY);

      // Rear wheel (behind body)
      ctx.save();
      ctx.translate(bodyX + w * 0.22, -wheelR);
      drawCarWheel(ctx, wheelR, this.runT, carColor);
      ctx.restore();

      // Car body
      const bodyGrad = ctx.createLinearGradient(0, bodyYTop, 0, bodyYBot);
      bodyGrad.addColorStop(0, lightenColor(carColor, 20));
      bodyGrad.addColorStop(1, carColor);
      ctx.fillStyle = bodyGrad;
      ctx.beginPath(); ctx.roundRect(bodyX, bodyYTop, w, bodyH, [2, 8, 8, 2]); ctx.fill();

      // Cab / roof
      const cabGrad = ctx.createLinearGradient(0, cabYTop, 0, cabYBot);
      cabGrad.addColorStop(0, lightenColor(carColor, -10));
      cabGrad.addColorStop(1, lightenColor(carColor, 15));
      ctx.fillStyle = cabGrad;
      ctx.beginPath(); ctx.roundRect(cabX, cabYTop, cabW, cabH, [10, 10, 0, 0]); ctx.fill();

      // Window — shows character face
      const winPad = 4;
      const winX = cabX + winPad;
      const winY = cabYTop + winPad;
      const winW = cabW - winPad * 2;
      const winH = cabH - winPad;
      ctx.save();
      ctx.beginPath(); ctx.roundRect(winX, winY, winW, winH, 4); ctx.clip();
      const img = dogImages[this.data.name];
      if (img) {
        // Show the top 60% of the poster (face / upper body)
        const srcH = img.naturalHeight * 0.60;
        ctx.drawImage(img, 0, 0, img.naturalWidth, srcH, winX, winY, winW, winH);
      } else {
        ctx.fillStyle = 'rgba(180,220,255,0.90)';
        ctx.fillRect(winX, winY, winW, winH);
        ctx.fillStyle = 'white'; ctx.font = `bold ${winW * 0.45}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.data.name.charAt(0), winX + winW / 2, winY + winH / 2);
      }
      ctx.restore();
      // Window frame
      ctx.strokeStyle = 'rgba(255,255,255,0.80)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(winX, winY, winW, winH, 4); ctx.stroke();

      // Body outline
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(bodyX, bodyYTop, w, bodyH, [2, 8, 8, 2]); ctx.stroke();

      // Headlight (front = right side when facing right)
      ctx.fillStyle = '#FFF59D';
      ctx.shadowColor = '#FFE082'; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.ellipse(bodyX + w - 4, bodyYTop + bodyH * 0.38, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // Front wheel (overlaps body, drawn last)
      ctx.save();
      ctx.translate(bodyX + w * 0.80, -wheelR);
      drawCarWheel(ctx, wheelR, this.runT, carColor);
      ctx.restore();

      // Speed lines (behind car = left side)
      if (Math.abs(this.vx) > 3.5 && this.onGround) {
        ctx.save(); ctx.globalAlpha = 0.40; ctx.strokeStyle = 'white'; ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
          const ly = bodyYTop + bodyH * (0.20 + i * 0.25);
          ctx.beginPath(); ctx.moveTo(bodyX + 4, ly); ctx.lineTo(bodyX - 18 - i * 8, ly); ctx.stroke();
        }
        ctx.restore();
      }

      ctx.restore();
    }
    bounds() {
      return { left:   this.x - this.w * 0.44,
               right:  this.x + this.w * 0.44,
               top:    this.y - this.h * 0.98,
               bottom: this.y + 4 };
    }
  }

  // ── Collectible ground items ──────────────────
  const ITEM_COLORS = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#DDA0DD','#F4A261','#FFD93D'];

  class CollectItem {
    constructor(itemData) {
      this.item = itemData;
      this.gY = canvas.height * GROUND_RATIO;
      this.r = 36;
      // Spawn ahead of the camera in world space
      this.x = cameraX + canvas.width + this.r * 2 + Math.random() * 80;
      // 40% chance of being elevated — requires a jump to collect
      this.elevated = Math.random() < 0.4;
      this.baseY = this.elevated
        ? this.gY - this.r - 105 - Math.random() * 40
        : this.gY - this.r;
      this.y = this.baseY;
      this.speed = (2.2 + Math.random() * 1.0) * speedMult * gameSpeedRamp * 60; // px/s
      this.bobT = Math.random() * Math.PI * 2;
      this.sparkT = 0;
      this.alive = true;
      this.collectT = 0;
      this.rot = 0;
      this.bgColor = ITEM_COLORS[Math.floor(Math.random() * ITEM_COLORS.length)];
    }
    update(dt) {
      if (this.collectT > 0) {
        this.collectT -= dt;
        this.y -= 5 * dt * 60; this.rot += 0.2 * dt * 60;
        if (this.collectT <= 0) this.alive = false;
        return;
      }
      this.x -= this.speed * dt;
      this.bobT += 0.035 * dt * 60;
      this.y = this.baseY - Math.abs(Math.sin(this.bobT)) * 10;
      this.sparkT += 0.08 * dt * 60;
      // Gone past the left edge of the visible world
      if (this.x < cameraX - this.r * 2) this.alive = false;
    }
    draw() {
      const r = this.r;
      ctx.save();
      ctx.translate(this.x, this.y); ctx.rotate(this.rot);

      // Glow
      const pulse = 0.5 + Math.sin(this.sparkT * 1.5) * 0.5;
      ctx.shadowColor = this.bgColor; ctx.shadowBlur = 8 + pulse * 10;
      ctx.fillStyle = this.bgColor;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3;
      ctx.stroke();

      ctx.font = `${r * 1.3}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(this.item.emoji, 0, 2);

      ctx.restore();

      // Orbiting sparkle dots
      for (let i = 0; i < 3; i++) {
        const a = this.sparkT + i * (Math.PI * 2 / 3);
        const sx = this.x + Math.cos(a) * (r + 10);
        const sy = this.y + Math.sin(a) * (r + 10);
        ctx.save(); ctx.globalAlpha = 0.65; ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }

      // Elevated item: dashed guide line + bouncing arrow pointing up
      if (this.elevated && this.collectT <= 0) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.setLineDash([5, 7]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y + r);
        ctx.lineTo(this.x, this.gY);
        ctx.stroke();
        ctx.setLineDash([]);
        const bounce = Math.sin(this.sparkT * 1.8) * 5;
        ctx.font = '20px serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.globalAlpha = 0.85;
        ctx.fillText('⬆️', this.x, this.y + r + 6 + bounce);
        ctx.restore();
      }
    }
    bounds() {
      return { left: this.x - this.r * 0.85, right: this.x + this.r * 0.85,
               top:  this.y - this.r * 0.85, bottom: this.y + this.r * 0.85 };
    }
  }

  function hits(a, b) {
    return a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
  }

  function getObstacleWarning(emoji) {
    if (emoji === '🔥' || emoji === '🌋') return 'I see fire! Jump!';
    if (emoji === '⚡' || emoji === '🌩️') return 'Lightning! Jump!';
    if (emoji === '🌊') return 'Big wave! Jump!';
    return 'Watch out! Jump!';
  }

  // ── Obstacles (character-specific) ──────────────
  class Obstacle {
    constructor() {
      const obsEmojis = dog ? DOG_OBSTACLES[dog.data.name] : ['🚧'];
      this.emoji = obsEmojis[Math.floor(Math.random() * obsEmojis.length)];
      this.gY = canvas.height * GROUND_RATIO;
      this.w = 70; this.h = 72;
      this.speed = (1.8 + Math.random() * 1.2) * speedMult * gameSpeedRamp * 60; // px/s
      // Spawn ahead of the camera in world space
      this.x = cameraX + canvas.width + this.w;
      this.alive = true;
      this.warnT = 0;
      this.warned = false;
    }
    update(dt) {
      this.x -= this.speed * dt;
      this.warnT += 0.15 * dt * 60;
      if (this.x < cameraX - this.w * 2) this.alive = false;
      // Voice warning once when obstacle enters the right 65% of screen
      if (!this.warned) {
        const screenX = this.x - cameraX;
        if (screenX < canvas.width * 0.65) {
          this.warned = true;
          speak(getObstacleWarning(this.emoji), 'en');
        }
      }
    }
    draw() {
      const gY = this.gY;
      const pulse = 0.5 + Math.sin(this.warnT) * 0.5;
      const isFireType  = this.emoji === '🔥' || this.emoji === '🌋';
      const isThunder   = this.emoji === '⚡' || this.emoji === '🌩️';
      const haloColor   = isFireType ? `rgba(255,100,0,${0.55 + pulse * 0.45})`
                        : isThunder  ? `rgba(180,200,255,${0.55 + pulse * 0.45})`
                        :              `rgba(150,120,80,${0.55 + pulse * 0.45})`;
      const bgFill      = isFireType ? '#FF5500'
                        : isThunder  ? '#5C6BC0'
                        :              '#8D6E63';
      const labelColor  = isFireType ? '#FF3300'
                        : isThunder  ? '#7986CB'
                        :              '#8D6E63';

      ctx.save();

      // Ground shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(this.x, gY + 5, this.w * 0.58, 10, 0, 0, Math.PI * 2); ctx.fill();

      // Halo ring
      ctx.strokeStyle = haloColor; ctx.lineWidth = 5 + pulse * 4;
      ctx.beginPath(); ctx.arc(this.x, gY - this.h * 0.5, this.w * 0.58 + pulse * 6, 0, Math.PI * 2); ctx.stroke();

      // Solid background circle
      ctx.fillStyle = bgFill;
      ctx.beginPath(); ctx.arc(this.x, gY - this.h * 0.5, this.w * 0.52, 0, Math.PI * 2); ctx.fill();

      // Emoji
      ctx.font = `${this.h}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText(this.emoji, this.x, gY + 5);

      // JUMP! label — compare screen-space position (world x minus camera)
      const screenX = this.x - cameraX;
      if (screenX < canvas.width * 0.60 && screenX > 0) {
        ctx.font = `bold ${18 + pulse * 5}px "Arial Black", Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.strokeStyle = labelColor; ctx.lineWidth = 5;
        ctx.strokeText('JUMP!', this.x, gY - this.h - 4);
        ctx.fillStyle = 'white'; ctx.lineWidth = 0;
        ctx.fillText('JUMP!', this.x, gY - this.h - 4);
      }

      ctx.restore();
    }
    bounds() {
      return { left: this.x - this.w * 0.30, right: this.x + this.w * 0.30,
               top:  this.gY - this.h * 0.90, bottom: this.gY + 4 };
    }
  }

  // ── Game state ───────────────────────────────
  const ST = { MENU: 'menu', PLAY: 'play', OVER: 'over', WIN: 'win' };
  let winTarget = 10; // updated in resetGame based on difficulty
  let state = ST.MENU;

  let score = 0;
  let lives = 5;
  let combo = 0;
  let catchCount = 0;
  let items = [];
  let itemSpawnTimer = 60;
  let obstacles = [];
  let obsTimer = 220;

  // ── Difficulty & feedback state ──────────────
  let gameTick = 0;       // seconds since game start
  let gameSpeedRamp = 1;  // speed multiplier — grows over time (capped at ×1.4)
  let comboPopup = null;  // { text, t } — on-screen callout
  let wordPopup  = null;  // { emoji, word, x, y, t } — word learning callout

  function setComboPopup(text) { comboPopup = { text, t: 1.6 }; }
  function setWordPopup(emoji, word, x, y) { wordPopup = { emoji, word, x, y, t: 1.8 }; }

  function updateComboPopup(dt) {
    if (comboPopup) { comboPopup.t -= dt; if (comboPopup.t <= 0) comboPopup = null; }
  }
  function updateWordPopup(dt) {
    if (wordPopup) { wordPopup.t -= dt; if (wordPopup.t <= 0) wordPopup = null; }
  }

  function drawComboPopup() {
    if (!comboPopup || !dog) return;
    const alpha = Math.min(1, comboPopup.t * 2.5);
    const rise  = (1.6 - comboPopup.t) * 28;
    const screenX = dog.x - cameraX;
    const screenY = dog.y - dog.h - 20 - rise;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 26px "Arial Black", Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'white'; ctx.lineWidth = 4;
    ctx.strokeText(comboPopup.text, screenX, screenY);
    ctx.fillStyle = '#FF6B35';
    ctx.fillText(comboPopup.text, screenX, screenY);
    ctx.restore();
  }

  function drawWordPopup() {
    if (!wordPopup) return;
    const alpha = Math.min(1, wordPopup.t * 2);
    const rise  = (1.8 - wordPopup.t) * 40;
    const sx = wordPopup.x - cameraX;
    const sy = wordPopup.y - rise;
    ctx.save();
    ctx.globalAlpha = alpha;
    // Big emoji
    ctx.font = '56px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(wordPopup.emoji, sx, sy - 8);
    // Word text
    ctx.font = 'bold 34px "Arial Black", Arial';
    ctx.textBaseline = 'top';
    ctx.strokeStyle = '#1A237E'; ctx.lineWidth = 6;
    ctx.strokeText(wordPopup.word, sx, sy - 6);
    ctx.fillStyle = 'white';
    ctx.fillText(wordPopup.word, sx, sy - 6);
    ctx.restore();
  }

  function updatePlay(dt) {
    // ── Speed ramp: +10% every 30 s, capped at ×1.4 (gentler for young audience) ──
    gameTick += dt;
    gameSpeedRamp = Math.min(1.4, 1 + Math.floor(gameTick / 30) * 0.10);
    updateComboPopup(dt);
    updateWordPopup(dt);

    // Spawn items — interval shrinks with ramp
    itemSpawnTimer -= dt * 60;
    if (itemSpawnTimer <= 0) {
      const dogItemList = DOG_ITEMS[dog.data.name];
      const item = dogItemList[Math.floor(Math.random() * dogItemList.length)];
      items.push(new CollectItem(item));
      const base = Math.max(60, 110 - Math.floor(gameTick / 15) * 8);
      itemSpawnTimer = base + Math.floor(Math.random() * base * 0.8);
    }

    items.forEach(it => it.update(dt));

    // Collect
    if (dog.state !== 'ouch') {
      const db = dog.bounds();
      for (const it of items) {
        if (!it.alive || it.collectT > 0) continue;
        if (hits(db, it.bounds())) {
          it.collectT = 25 / 60;
          dog.celebrate();
          score += 10 * Math.max(1, combo);
          combo++;
          catchCount++;
          burst(it.x, it.y, it.bgColor, 14);
          // Word learning popup — show emoji + word prominently
          setWordPopup(it.item.emoji, it.item.word, it.x, it.y - it.r - 20);
          // Voice: speak the word (short, clear, for word learning)
          speak(it.item.sentence, 'en');
          // Combo callouts
          if (combo === 3) { setComboPopup('🐾 Paw-some!'); }
          else if (combo === 5) { setComboPopup('🔥 Amazing! ×5'); speak('Amazing!', 'en'); }
          else if (combo === 8) { setComboPopup('⭐ Incredible! ×8'); speak('Incredible!', 'en'); }
          else if (combo > 8 && combo % 5 === 0) { setComboPopup(`🌟 ×${combo} streak!`); }
          // Win when enough items collected
          if (catchCount >= winTarget) {
            state = ST.WIN; dog.celebrate();
            speak('You win! Amazing job!', 'en');
            if (onSuccess) onSuccess();
          }
          break;
        }
      }
    }
    items = items.filter(i => i.alive || i.collectT > 0);

    // Spawn obstacles — interval shrinks with ramp
    obsTimer -= dt * 60;
    if (obsTimer <= 0) {
      obstacles.push(new Obstacle());
      const base = Math.max(140, 280 - Math.floor(gameTick / 15) * 15);
      obsTimer = base + Math.floor(Math.random() * base * 0.6);
    }
    obstacles.forEach(o => o.update(dt));

    if (dog.invincibleT <= 0) {
      const db = dog.bounds();
      for (const o of obstacles) {
        if (hits(db, o.bounds())) {
          dog.ouch(); combo = 0; lives--;
          speak('Ouch! Watch out!', 'en');
          setComboPopup('💥 Ouch!');
          if (lives <= 0) { state = ST.OVER; }
          break;
        }
      }
    }
    obstacles = obstacles.filter(o => o.alive);
  }

  // ── Camera ───────────────────────────────────
  function updateCamera(force = false) {
    if (!dog) return;
    // Same formula as Sonic: offset to left-of-center + velocity look-ahead
    const target = Math.max(0, dog.x - canvas.width * 0.36 + dog.vx * 0.16);
    cameraX = force ? target : lerp(cameraX, target, CAMERA_SMOOTHING);
  }

  // ── HUD ──────────────────────────────────────
  let exitBtn = {};
  function drawHUD() {
    // Danger vignette when 1 life left
    if (lives === 1) {
      const pulse = 0.5 + Math.sin(bgTick * 0.12) * 0.5;
      ctx.save();
      ctx.globalAlpha = 0.10 + pulse * 0.08;
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    const px = 18, py = 70;

    // Score box
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath(); ctx.roundRect(px, py, 124, 42, 12); ctx.fill();
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 21px "Arial Black", Arial';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`⭐ ${score}`, px + 12, py + 21);

    // Combo
    if (combo >= 2) {
      ctx.save();
      ctx.font = `bold ${Math.min(26, 17 + combo * 1.5)}px "Arial Black", Arial`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#FF6B35';
      ctx.fillText(`🔥 ×${combo}`, px + 133, py + 21); ctx.restore();
    }

    // Lives box (5 max)
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath(); ctx.roundRect(canvas.width - px - 148, py, 148, 42, 12); ctx.fill();
    const hearts = '❤️'.repeat(clamp(lives, 0, 5)) + '🖤'.repeat(clamp(5 - lives, 0, 5));
    ctx.font = '17px serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(hearts, canvas.width - px - 10, py + 21);

    // Progress indicator: items caught / goal
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    const progW = 130, progH = 38;
    const progX = canvas.width / 2 - progW / 2;
    ctx.beginPath(); ctx.roundRect(progX, py, progW, progH, 12); ctx.fill();
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 16px "Arial Black", Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`🐾 ${catchCount} / ${winTarget}`, canvas.width / 2, py + 19);

    // Danger label when 1 life
    if (lives === 1) {
      const pulse = 0.5 + Math.sin(bgTick * 0.12) * 0.5;
      ctx.save();
      ctx.font = 'bold 14px "Arial Black", Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(255,80,80,${0.75 + pulse * 0.25})`;
      ctx.fillText('Be careful!', canvas.width / 2, py + 55);
      ctx.restore();
    }

    // Bottom hint — simplified for touch audience
    ctx.fillStyle = 'rgba(255,255,255,0.50)';
    ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('TAP to jump!  Collect items!  Jump over dangers!', canvas.width / 2, canvas.height - 10);

    // Exit button (top-left, above score)
    const ebSize = 40;
    const ebX = px, ebY = py - ebSize - 8;
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath(); ctx.roundRect(ebX, ebY, ebSize, ebSize, 10); ctx.fill();
    ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🏠', ebX + ebSize / 2, ebY + ebSize / 2);
    exitBtn = { x: ebX, y: ebY, w: ebSize, h: ebSize };
  }

  // ── Touch buttons ────────────────────────────
  // Auto-run: only a jump button needed
  let btnJump = {};
  const isTouch = 'ontouchstart' in window;

  function drawTouchBtns() {
    if (!isTouch) return;
    const bh = 80, bw = 100, by = canvas.height - bh - 20;
    btnJump.x = canvas.width / 2 - bw / 2;
    btnJump.y = by; btnJump.w = bw; btnJump.h = bh;
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath(); ctx.roundRect(btnJump.x, by, bw, bh, 20); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.font = '40px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🦘', btnJump.x + bw / 2, by + bh / 2);
  }


  // ── Menu ─────────────────────────────────────
  let menuDifficulty = 2; // 1=Easy 2=Normal 3=Hard
  let diffBtns = [];
  let hoverDog = -1;
  let menuCards = [];

  function drawMenu() {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, '#0D47A1'); sky.addColorStop(1, '#1976D2');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 0.07; ctx.font = '32px serif'; ctx.textAlign = 'center';
    for (let row = 0; row < 6; row++) for (let col = 0; col < 7; col++)
      ctx.fillText('🐾', col * 80 + 40, row * 80 + 40);
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const ts = Math.min(50, canvas.width * 0.11);
    ctx.font = `bold ${ts}px "Arial Black", Arial`;
    ctx.strokeStyle = '#C62828'; ctx.lineWidth = 7;
    ctx.strokeText('PAW PATROL', canvas.width / 2, canvas.height * 0.10);
    ctx.fillStyle = '#FFD700';
    ctx.fillText('PAW PATROL', canvas.width / 2, canvas.height * 0.10);

    ctx.font = `bold ${Math.min(32, canvas.width * 0.07)}px "Arial Black", Arial`;
    ctx.fillStyle = 'white';
    ctx.fillText('WORD RUN!', canvas.width / 2, canvas.height * 0.19);

    ctx.font = `${Math.min(20, canvas.width * 0.05)}px Arial`;
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText('Pick your pup!', canvas.width / 2, canvas.height * 0.26);

    // Difficulty selector
    const diffLabels = ['EASY', 'NORMAL', 'HARD'];
    const diffColors = ['#43A047', '#1976D2', '#C62828'];
    const dbW = clamp(canvas.width * 0.22, 72, 100);
    const dbH = 34, dbGap = 10;
    const totalDbW = dbW * 3 + dbGap * 2;
    const dbStartX = canvas.width / 2 - totalDbW / 2;
    const dbY = canvas.height * 0.33;

    diffBtns = [];
    diffLabels.forEach((label, i) => {
      const bx = dbStartX + i * (dbW + dbGap);
      const active = menuDifficulty === i + 1;
      ctx.fillStyle = active ? diffColors[i] : 'rgba(255,255,255,0.12)';
      ctx.strokeStyle = active ? 'white' : 'rgba(255,255,255,0.25)';
      ctx.lineWidth = active ? 2.5 : 1.5;
      ctx.beginPath(); ctx.roundRect(bx, dbY, dbW, dbH, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = active ? 'white' : 'rgba(255,255,255,0.55)';
      ctx.font = `bold ${Math.min(13, canvas.width * 0.032)}px "Arial Black", Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, bx + dbW / 2, dbY + dbH / 2);
      diffBtns[i] = { x: bx, y: dbY, w: dbW, h: dbH };
    });

    const cW = clamp(canvas.width * 0.26, 90, 145);
    const cH = cW * 1.52, gap = 18;
    const totalW = cW * 3 + gap * 2;
    const startX = canvas.width / 2 - totalW / 2;
    const cardY  = canvas.height * 0.42;
    menuCards = [];

    DOG_DEFS.forEach((d, i) => {
      const cx = startX + i * (cW + gap);
      const hov = hoverDog === i;
      const sc = hov ? 1.07 : 1;
      const midX = cx + cW / 2, midY = cardY + cH / 2;

      ctx.save();
      ctx.translate(midX, midY); ctx.scale(sc, sc); ctx.translate(-cW / 2, -cH / 2);

      // Card shadow + background
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath(); ctx.roundRect(4, 6, cW, cH, 18); ctx.fill();
      ctx.fillStyle = d.color;
      ctx.beginPath(); ctx.roundRect(0, 0, cW, cH, 18); ctx.fill();
      if (hov) { ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 4; ctx.stroke(); }

      // Poster image in upper portion of card
      const imgArea = { x: 5, y: 5, w: cW - 10, h: cH * 0.74 - 2 };
      ctx.save();
      ctx.beginPath(); ctx.roundRect(imgArea.x, imgArea.y, imgArea.w, imgArea.h, 14); ctx.clip();
      const img = dogImages[d.name];
      if (img) {
        ctx.drawImage(img, imgArea.x, imgArea.y, imgArea.w, imgArea.h);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(imgArea.x, imgArea.y, imgArea.w, imgArea.h);
        ctx.font = `${cW * 0.3}px serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText('🐾', cW / 2, imgArea.y + imgArea.h / 2);
      }
      ctx.restore();

      // Dog name label
      ctx.fillStyle = 'white';
      ctx.font = `bold ${Math.floor(cW * 0.155)}px "Arial Black", Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 3;
      ctx.strokeText(d.name.toUpperCase(), cW / 2, cH * 0.88);
      ctx.fillText(d.name.toUpperCase(), cW / 2, cH * 0.88);

      ctx.restore();
      menuCards[i] = { x: midX - cW/2*sc, y: midY - cH/2*sc, w: cW*sc, h: cH*sc };
    });

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = `${Math.min(14, canvas.width * 0.036)}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('TAP or SPACE to jump!  Collect items!', canvas.width / 2, canvas.height - 18);
  }

  // ── Game Over ────────────────────────────────
  let goBtn = {};
  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const bw = clamp(canvas.width * 0.78, 260, 360), bh = 300;
    const bx = canvas.width/2 - bw/2, by = canvas.height/2 - bh/2;
    ctx.fillStyle = '#1565C0';
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 24); ctx.fill();
    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 4; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // Friendly tone — no harsh "GAME OVER" red
    ctx.font = '42px serif'; ctx.fillText('🐾', canvas.width/2, by + bh*0.15);
    ctx.fillStyle = 'white';
    ctx.font = `bold ${clamp(canvas.width * 0.09, 26, 36)}px "Arial Black", Arial`;
    ctx.fillText('Oops! Keep trying!', canvas.width/2, by + bh*0.33);
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 28px "Arial Black", Arial';
    ctx.fillText(`Score: ${score}`, canvas.width/2, by + bh*0.52);
    const stars = score >= 100 ? 3 : score >= 50 ? 2 : score >= 10 ? 1 : 0;
    ctx.font = '36px serif';
    ctx.fillText('⭐'.repeat(stars) + '☆'.repeat(3 - stars), canvas.width/2, by + bh*0.68);
    const btnW = 210, btnH = 54;
    const btnX = canvas.width/2 - btnW/2, btnY = by + bh*0.85 - btnH/2;
    ctx.fillStyle = '#43A047';
    ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 14); ctx.fill();
    ctx.fillStyle = 'white'; ctx.font = 'bold 21px "Arial Black", Arial';
    ctx.fillText('Try Again! 🐾', canvas.width/2, btnY + btnH/2);
    goBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
  }

  // ── Win screen ───────────────────────────────
  let winBtn = {};
  function drawWin() {
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const bw = clamp(canvas.width * 0.82, 270, 380), bh = 320;
    const bx = canvas.width/2 - bw/2, by = canvas.height/2 - bh/2;
    // Gold background for victory
    ctx.fillStyle = '#E65100';
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 24); ctx.fill();
    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 5; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // Celebratory top
    const pulse = 0.5 + Math.sin(bgTick * 0.15) * 0.5;
    ctx.font = `${38 + pulse * 8}px serif`;
    ctx.fillText('🎉 🐾 🎉', canvas.width/2, by + bh*0.15);
    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${clamp(canvas.width * 0.1, 30, 40)}px "Arial Black", Arial`;
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 4;
    ctx.strokeText('YOU WIN!', canvas.width/2, by + bh*0.33);
    ctx.fillText('YOU WIN!', canvas.width/2, by + bh*0.33);
    ctx.fillStyle = 'white'; ctx.font = 'bold 24px "Arial Black", Arial';
    ctx.fillText(`Score: ${score}`, canvas.width/2, by + bh*0.50);
    ctx.font = '38px serif';
    ctx.fillText('⭐⭐⭐', canvas.width/2, by + bh*0.65);
    const btnW = 210, btnH = 54;
    const btnX = canvas.width/2 - btnW/2, btnY = by + bh*0.83 - btnH/2;
    ctx.fillStyle = '#1565C0';
    ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 14); ctx.fill();
    ctx.fillStyle = 'white'; ctx.font = 'bold 21px "Arial Black", Arial';
    ctx.fillText('Play Again! 🐾', canvas.width/2, btnY + btnH/2);
    winBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
  }

  function resetGame(dogData) {
    dog = new Dog(dogData);
    cameraX = 0;
    updateCamera(true);
    // Apply difficulty
    speedMult = menuDifficulty === 1 ? 0.75 : menuDifficulty === 3 ? 1.35 : 1.0;
    winTarget = menuDifficulty === 3 ? 20 : 10;
    score = 0;
    lives = menuDifficulty === 1 ? 7 : menuDifficulty === 3 ? 3 : 5;
    combo = 0; catchCount = 0;
    gameTick = 0; gameSpeedRamp = 1; comboPopup = null; wordPopup = null;
    particles = []; pawPrints = []; items = []; obstacles = [];
    obsTimer = 220; itemSpawnTimer = 60;
    initBg();
    state = ST.PLAY;
  }

  // ── Input ────────────────────────────────────
  function handleMenuClick(x, y) {
    // Difficulty buttons — just select, don't start game
    let hitDiff = false;
    diffBtns.forEach((b, i) => {
      if (b && x >= b.x && x <= b.x+b.w && y >= b.y && y <= b.y+b.h) {
        menuDifficulty = i + 1;
        hitDiff = true;
      }
    });
    if (hitDiff) return;
    // Dog cards — start game
    menuCards.forEach((c, i) => {
      if (c && x >= c.x && x <= c.x+c.w && y >= c.y && y <= c.y+c.h) resetGame(DOG_DEFS[i]);
    });
  }
  function handleOverClick(x, y) {
    if (goBtn.x && x >= goBtn.x && x <= goBtn.x+goBtn.w && y >= goBtn.y && y <= goBtn.y+goBtn.h)
      state = ST.MENU;
  }
  function handleWinClick(x, y) {
    if (winBtn.x && x >= winBtn.x && x <= winBtn.x+winBtn.w && y >= winBtn.y && y <= winBtn.y+winBtn.h)
      state = ST.MENU;
  }
  function handleExitBtn(x, y) {
    if (exitBtn.x != null && x >= exitBtn.x && x <= exitBtn.x+exitBtn.w && y >= exitBtn.y && y <= exitBtn.y+exitBtn.h) {
      if (onExit) onExit();
      else state = ST.MENU;
      return true;
    }
    return false;
  }

  function onKeyDown(e) {
    if (state === ST.PLAY && dog) {
      // Auto-run: only jump is needed
      if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); dog.jump(); }
    }
  }
  function onTouchStart(e) {
    e.preventDefault();
    const t = e.changedTouches[0];
    if (state === ST.PLAY && dog) {
      if (handleExitBtn(t.clientX, t.clientY)) return;
      dog.jump(); // tap anywhere = jump
      return;
    }
    if (state === ST.MENU) handleMenuClick(t.clientX, t.clientY);
    if (state === ST.OVER) handleOverClick(t.clientX, t.clientY);
    if (state === ST.WIN)  handleWinClick(t.clientX, t.clientY);
  }
  function onTouchMove(e) { e.preventDefault(); }
  function onTouchEnd(e)  { e.preventDefault(); }
  function onClick(e) {
    if (state === ST.PLAY && dog) { handleExitBtn(e.clientX, e.clientY); return; }
    if (state === ST.MENU) handleMenuClick(e.clientX, e.clientY);
    if (state === ST.OVER) handleOverClick(e.clientX, e.clientY);
    if (state === ST.WIN)  handleWinClick(e.clientX, e.clientY);
  }
  function onMouseMove(e) {
    if (state !== ST.MENU) return;
    hoverDog = -1;
    menuCards.forEach((c, i) => {
      if (c && e.clientX >= c.x && e.clientX <= c.x+c.w && e.clientY >= c.y && e.clientY <= c.y+c.h)
        hoverDog = i;
    });
  }

  document.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
  canvas.addEventListener('touchend',   onTouchEnd,   { passive: false });
  canvas.addEventListener('click',      onClick);
  canvas.addEventListener('mousemove',  onMouseMove);

  // ── Main loop ─────────────────────────────────
  initBg();
  let rafId = null;
  let lastTime = 0;

  function loop(timestamp) {
    const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 1 / 60;
    lastTime = timestamp;
    lastDt = dt;
    rafId = requestAnimationFrame(loop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state === ST.MENU) { drawMenu(); return; }

    bgTick += dt * 60;

    // ── Update logic ──────────────────────────
    if (state === ST.PLAY) {
      if (dog) {
        // Auto-run: always move forward — only jump is needed
        if (dog.state !== 'ouch') { dog.rightHeld = true; dog.leftHeld = false; }
        dog.gY = canvas.height * GROUND_RATIO;
        if (dog.onGround && dog.y < dog.gY) dog.onGround = false;
      }
      dog.update(dt);
      updatePlay(dt);
      updateCamera();
    }

    // ── Draw background (screen-space, uses cameraX for parallax) ──
    drawBg();

    // ── Draw world objects (translated by camera) ──
    ctx.save();
    ctx.translate(-Math.round(cameraX), 0);

    tickPaws(); drawPaws();
    tickParticles(); drawParticles();

    if (state === ST.PLAY || state === ST.WIN) {
      obstacles.forEach(o => o.draw());
      items.forEach(it => it.draw());
      if (dog) dog.draw();
    }
    if (state === ST.OVER) {
      if (dog) dog.draw();
    }

    ctx.restore();

    // ── Draw HUD / overlays (screen-space) ──
    if (state === ST.PLAY)  { drawHUD(); drawTouchBtns(); drawComboPopup(); drawWordPopup(); }
    if (state === ST.OVER)  { drawGameOver(); }
    if (state === ST.WIN)   { drawWin(); }
  }
  rafId = requestAnimationFrame(loop);

  // ── Cleanup ───────────────────────────────────
  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    document.removeEventListener('keydown', onKeyDown);
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchmove',  onTouchMove);
    canvas.removeEventListener('touchend',   onTouchEnd);
    canvas.removeEventListener('click',      onClick);
    canvas.removeEventListener('mousemove',  onMouseMove);
  };
}

// ─────────────────────────────────────────────
// REACT COMPONENT
// ─────────────────────────────────────────────
export default function PawPatrol({ onSuccess, onExit, sharedDifficulty = 1 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    return runGame(canvas, { onSuccess, onExit, difficulty: sharedDifficulty });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <canvas ref={canvasRef} className="pawpatrol-canvas" />;
}
