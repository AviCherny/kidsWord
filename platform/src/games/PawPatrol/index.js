import React, { useEffect, useRef } from 'react';
import './PawPatrol.css';
import { speak } from '../../speak';

// ─────────────────────────────────────────────
// CHARACTER CONTENT
// ─────────────────────────────────────────────
const DOG_ITEMS = {
  Marshall: [
    { emoji: '💧', sentence: "I have a water!" },
    { emoji: '🪣', sentence: "Got the bucket!" },
    { emoji: '🧊', sentence: "So icy and cool!" },
    { emoji: '🏊', sentence: "Splash splash splash!" },
    { emoji: '🍎', sentence: "An apple a day!" },
    { emoji: '🦺', sentence: "Safety first!" },
  ],
  Chase: [
    { emoji: '🍌', sentence: "I just ate a banana!" },
    { emoji: '🦴', sentence: "Found a yummy bone!" },
    { emoji: '🍕', sentence: "Pizza time yeah!" },
    { emoji: '🍩', sentence: "Mmm donuts!" },
    { emoji: '🎾', sentence: "I love to fetch!" },
    { emoji: '⭐', sentence: "Chase is on the case!" },
  ],
  Rubble: [
    { emoji: '🔧', sentence: "Got the wrench!" },
    { emoji: '⚙️', sentence: "Gears go click click!" },
    { emoji: '🍪', sentence: "Cookies for Rubble!" },
    { emoji: '🥪', sentence: "Lunchtime already?" },
    { emoji: '🍦', sentence: "Yummy ice cream!" },
    { emoji: '🧱', sentence: "One more brick!" },
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
function runGame(canvas, { onSuccess, difficulty }) {
  const ctx = canvas.getContext('2d');
  const speedMult = 1 + (difficulty - 1) * 0.18;

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

  // ── Paw prints ───────────────────────────────
  let pawPrints = [];
  function addPaw(x, y) { pawPrints.push({ x, y, alpha: 0.55 }); }
  function tickPaws() { pawPrints = pawPrints.filter(p => { p.alpha -= 0.005 * lastDt * 60; return p.alpha > 0; }); }
  function drawPaws() {
    ctx.save(); ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    pawPrints.forEach(p => { ctx.globalAlpha = p.alpha; ctx.fillText('🐾', p.x, p.y); });
    ctx.restore();
  }

  // ── Dog class ────────────────────────────────
  // Physics — identical constants to the Sonic engine (dt-based, px/s or px/s²)
  const GRAVITY         = 1960;   // px/s²
  const JUMP_VY         = -810;   // px/s
  const MAX_SPEED       = 620;    // px/s
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
      this.pawAccum = 0;
      this.w = clamp(canvas.width * 0.15, 70, 110);
      this.h = this.w * 1.28;
      this.resetGround();
    }
    resetGround() {
      this.gY = canvas.height * GROUND_RATIO;
      if (this.onGround || this.y === undefined) this.y = this.gY;
      if (this.x === undefined) this.x = canvas.width / 2;
    }
    jump() {
      if (this.onGround && this.state !== 'celebrate' && this.state !== 'ouch') {
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
      this.vx = -this.facing * 420; this.vy = -420; this.onGround = false;
      burst(this.x, this.y - this.h * 0.5, '#FF4444', 10);
    }
    update(dt) {
      if (this.stateT > 0) {
        this.stateT -= dt;
        if (this.stateT <= 0 && (this.state === 'celebrate' || this.state === 'ouch'))
          this.state = this.onGround ? 'idle' : 'jump';
      }
      const locked = this.state === 'celebrate' || this.state === 'ouch';
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
        this.pawAccum += dt;
        if (this.pawAccum >= 20 / 60) {
          this.pawAccum -= 20 / 60;
          addPaw(this.x - this.facing * this.w * 0.2, this.gY + 9);
        }
      }
      if (this.landSquash > 0) this.landSquash -= dt;
    }
    draw() {
      const w = this.w, h = this.h;

      // Animation transforms
      let tilt = 0, sx = 1, sy = 1, bY = 0;
      switch (this.state) {
        case 'run':
          bY   = Math.sin(this.runT * 0.38) * 4;
          tilt = Math.sin(this.runT * 0.22) * 0.07 + 0.10;
          break;
        case 'jump':
          tilt = 0.12 * this.facing;
          if (this.vy < 0) { sx = 0.84; sy = 1.16; } else { sx = 1.12; sy = 0.90; }
          break;
        case 'celebrate':
          bY   = Math.sin(bgTick * 0.3) * 10;
          tilt = Math.sin(bgTick * 0.25) * 0.25;
          sx   = 1 + Math.abs(Math.sin(bgTick * 0.3)) * 0.12; sy = sx;
          break;
        case 'ouch':
          tilt = -0.5 * this.facing; sx = 1.2; sy = 0.8;
          break;
        default: break;
      }
      if (this.landSquash > 0) {
        const q = this.landSquash / (9 / 60); sx = 1 + q * 0.28; sy = 1 - q * 0.22; bY = q * 4;
      }

      // Shadow
      const airH = Math.max(0, this.gY - this.y);
      const shSc = lerp(1, 0.35, airH / 220);
      ctx.save();
      ctx.translate(this.x, this.gY + 12); ctx.scale(shSc, 0.28);
      ctx.beginPath(); ctx.ellipse(0, 0, w * 0.52, w * 0.52, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,0,0,${0.22 * shSc})`; ctx.fill();
      ctx.restore();

      // Body with poster image
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(this.facing, 1);
      ctx.rotate(tilt);
      ctx.scale(sx, sy);
      ctx.translate(0, bY);

      const img = dogImages[this.data.name];
      if (img) {
        ctx.save();
        ctx.beginPath(); ctx.roundRect(-w / 2, -h, w, h, 12); ctx.clip();
        ctx.drawImage(img, -w / 2, -h, w, h);
        ctx.restore();
        // White border ring
        ctx.beginPath(); ctx.roundRect(-w / 2, -h, w, h, 12);
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2.5; ctx.stroke();
      } else {
        // Fallback: colored card
        const def = DOG_DEFS.find(d => d.name === this.data.name);
        ctx.fillStyle = def ? def.color : '#888';
        ctx.beginPath(); ctx.roundRect(-w / 2, -h, w, h, 12); ctx.fill();
        ctx.fillStyle = 'white'; ctx.font = `bold ${w * 0.35}px Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.data.name.charAt(0), 0, -h / 2);
      }

      // Speed lines behind character
      if (Math.abs(this.vx) > 3.5 && this.onGround) {
        ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = 'white'; ctx.lineWidth = 2.5;
        for (let i = 0; i < 3; i++) {
          const ly = -h * (0.45 + i * 0.13);
          ctx.beginPath(); ctx.moveTo(-w * 0.2, ly); ctx.lineTo(-w * (0.6 + i * 0.12), ly); ctx.stroke();
        }
        ctx.restore();
      }

      ctx.restore();
    }
    bounds() {
      return { left: this.x - this.w * 0.38, right: this.x + this.w * 0.38,
               top:  this.y - this.h * 0.95, bottom: this.y + 15 };
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
      this.y = this.gY - this.r;
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
      this.y = this.gY - this.r - Math.abs(Math.sin(this.bobT)) * 10;
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
        ctx.font = `bold ${14 + pulse * 4}px "Arial Black", Arial`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillStyle = labelColor; ctx.strokeStyle = 'white'; ctx.lineWidth = 3;
        ctx.strokeText('JUMP!', this.x, gY - this.h - 4);
        ctx.fillText('JUMP!', this.x, gY - this.h - 4);
      }

      ctx.restore();
    }
    bounds() {
      return { left: this.x - this.w * 0.30, right: this.x + this.w * 0.30,
               top:  this.gY - this.h * 0.90, bottom: this.gY + 4 };
    }
  }

  // ── Mario-style block helpers ─────────────────
  const BLOCK = 42;

  function drawBrickBlock(x, y) {
    const B = BLOCK;
    // Face
    ctx.fillStyle = '#C8601A';
    ctx.fillRect(x, y, B, B);
    // Mortar: horizontal centre
    ctx.fillStyle = '#7A3500';
    ctx.fillRect(x, y + B / 2 - 1.5, B, 3);
    // Mortar: vertical top-half (centred)
    ctx.fillRect(x + B / 2 - 1.5, y, 3, B / 2 - 1.5);
    // Mortar: vertical bottom-half (offset ¼ & ¾)
    ctx.fillRect(x + B / 4 - 1.5, y + B / 2 + 1.5, 3, B / 2 - 1.5);
    ctx.fillRect(x + B * 3 / 4 - 1.5, y + B / 2 + 1.5, 3, B / 2 - 1.5);
    // Bevel — top/left bright
    ctx.fillStyle = '#E87830';
    ctx.fillRect(x, y, B, 4);
    ctx.fillRect(x, y, 4, B);
    // Bevel — bottom/right dark
    ctx.fillStyle = '#8B3A00';
    ctx.fillRect(x, y + B - 3, B, 3);
    ctx.fillRect(x + B - 3, y, 3, B);
  }

  function drawQuestionBlock(x, y, active) {
    const B = BLOCK;
    ctx.fillStyle = active ? '#F8C800' : '#B09850';
    ctx.fillRect(x, y, B, B);
    // Bevel — top/left
    ctx.fillStyle = active ? '#FFE840' : '#C8B060';
    ctx.fillRect(x, y, B, 4);
    ctx.fillRect(x, y, 4, B);
    // Bevel — bottom/right
    ctx.fillStyle = active ? '#B08000' : '#806040';
    ctx.fillRect(x, y + B - 3, B, 3);
    ctx.fillRect(x + B - 3, y, 3, B);
    // Inner border ring
    ctx.fillStyle = active ? '#8B6000' : '#5A4030';
    ctx.fillRect(x + 4, y + 4, B - 8, 2);
    ctx.fillRect(x + 4, y + B - 6, B - 8, 2);
    ctx.fillRect(x + 4, y + 6, 2, B - 12);
    ctx.fillRect(x + B - 6, y + 6, 2, B - 12);
    // Glyph
    ctx.font = `bold ${Math.round(B * 0.55)}px "Arial Black", Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = active ? '#5A3A00' : '#8B7050';
    ctx.fillText(active ? '?' : '·', x + B / 2, y + B / 2 + 1);
  }

  // ── Platforms ────────────────────────────────
  class Platform {
    constructor() {
      const groundY = canvas.height * GROUND_RATIO;
      const cols = 3 + Math.floor(Math.random() * 4); // 3–6 blocks wide
      this.w = cols * BLOCK;
      this.surfaceY = groundY - (100 + Math.random() * 85);
      this.speed = (1.8 + Math.random() * 0.9) * speedMult * 60;
      this.x = cameraX + canvas.width + this.w / 2 + 60;
      this.alive = true;
    }
    get left()  { return this.x - this.w / 2; }
    get right() { return this.x + this.w / 2; }
    update(dt) {
      this.x -= this.speed * dt;
      if (this.right < cameraX - 80) this.alive = false;
    }
    draw() {
      const cols = Math.round(this.w / BLOCK);
      for (let i = 0; i < cols; i++) drawBrickBlock(this.left + i * BLOCK, this.surfaceY);
    }
  }

  // ── Question blocks ───────────────────────────
  class QuestionBlock {
    constructor() {
      const groundY = canvas.height * GROUND_RATIO;
      this.surfaceY = groundY - (130 + Math.random() * 90);
      this.speed = (1.8 + Math.random() * 0.9) * speedMult * 60;
      this.x = cameraX + canvas.width + BLOCK / 2 + 60;
      this.alive = true;
      this.active = true;
      this.bumpY = 0; // vertical offset for hit animation
    }
    get left()  { return this.x - BLOCK / 2; }
    get right() { return this.x + BLOCK / 2; }
    get top()   { return this.surfaceY + this.bumpY; }
    update(dt) {
      this.x -= this.speed * dt;
      // Spring the bump back
      if (this.bumpY < 0) this.bumpY = Math.min(0, this.bumpY + 280 * dt);
      if (this.right < cameraX - 80) this.alive = false;
    }
    hit() {
      if (!this.active) return;
      this.active = false;
      this.bumpY = -14;
      score += 5;
      burst(this.x, this.surfaceY, '#FFD700', 10);
    }
    draw() {
      drawQuestionBlock(this.left, this.top, this.active);
    }
  }

  // ── Game state ───────────────────────────────
  const ST = { MENU: 'menu', PLAY: 'play', OVER: 'over' };
  let state = ST.MENU;

  let score = 0;
  let lives = 3;
  let combo = 0;
  let catchCount = 0;
  let items = [];
  let itemSpawnTimer = 60;
  let obstacles = [];
  let obsTimer = 220;
  let platforms = [];
  let platformTimer = 380;
  let questionBlocks = [];
  let qbTimer = 500;

  // ── Difficulty & feedback state ──────────────
  let gameTick = 0;       // seconds since game start
  let gameSpeedRamp = 1;  // speed multiplier — grows over time
  let comboPopup = null;  // { text, t } — on-screen callout

  function setComboPopup(text) { comboPopup = { text, t: 1.6 }; }

  function updateComboPopup(dt) {
    if (comboPopup) { comboPopup.t -= dt; if (comboPopup.t <= 0) comboPopup = null; }
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

  function updatePlay(dt) {
    // ── Speed ramp: +10% every 15 s, capped at ×2.2 ──
    gameTick += dt;
    gameSpeedRamp = Math.min(2.2, 1 + Math.floor(gameTick / 15) * 0.10);
    updateComboPopup(dt);

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
          // Voice: speak the item's sentence
          speak(it.item.sentence, 'en');
          // Combo callouts
          if (combo === 3) { setComboPopup('🐾 Paw-some!'); }
          else if (combo === 5) { setComboPopup('🔥 On fire! ×5'); speak('Amazing!', 'en'); }
          else if (combo === 8) { setComboPopup('⭐ Unstoppable! ×8'); speak('Incredible!', 'en'); }
          else if (combo > 8 && combo % 5 === 0) { setComboPopup(`🌟 ×${combo} streak!`); }
          break;
        }
      }
    }
    items = items.filter(i => i.alive || i.collectT > 0);

    // Spawn platforms
    platformTimer -= dt * 60;
    if (platformTimer <= 0) {
      platforms.push(new Platform());
      platformTimer = 320 + Math.floor(Math.random() * 260);
    }
    platforms.forEach(p => p.update(dt));
    platforms = platforms.filter(p => p.alive);

    // Spawn question blocks
    qbTimer -= dt * 60;
    if (qbTimer <= 0) {
      questionBlocks.push(new QuestionBlock());
      qbTimer = 400 + Math.floor(Math.random() * 300);
    }
    questionBlocks.forEach(qb => qb.update(dt));
    // Hit-from-below detection (dog jumps up into ? block)
    if (dog.state !== 'ouch' && dog.vy < 0) {
      const dogTop = dog.y - dog.h * 0.95;
      for (const qb of questionBlocks) {
        if (!qb.active) continue;
        if (dog.x + dog.w * 0.3 > qb.left && dog.x - dog.w * 0.3 < qb.right) {
          const blockBot = qb.top + BLOCK;
          if (dogTop <= blockBot && dogTop >= blockBot - 22) {
            qb.hit();
            dog.vy = 300; // bounce back down
            break;
          }
        }
      }
    }
    questionBlocks = questionBlocks.filter(qb => qb.alive);

    // Spawn obstacles — interval shrinks with ramp
    obsTimer -= dt * 60;
    if (obsTimer <= 0) {
      obstacles.push(new Obstacle());
      const base = Math.max(140, 280 - Math.floor(gameTick / 15) * 15);
      obsTimer = base + Math.floor(Math.random() * base * 0.6);
    }
    obstacles.forEach(o => o.update(dt));

    if (dog.state !== 'ouch') {
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
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath(); ctx.roundRect(px, py, 124, 42, 12); ctx.fill();
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 21px "Arial Black", Arial';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(`⭐ ${score}`, px + 12, py + 21);

    if (combo >= 2) {
      ctx.save();
      ctx.font = `bold ${Math.min(26, 17 + combo * 1.5)}px "Arial Black", Arial`;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#FF6B35';
      ctx.fillText(`🔥 ×${combo}`, px + 133, py + 21); ctx.restore();
    }

    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath(); ctx.roundRect(canvas.width - px - 124, py, 124, 42, 12); ctx.fill();
    const hearts = '❤️'.repeat(clamp(lives, 0, 3)) + '🖤'.repeat(clamp(3 - lives, 0, 3));
    ctx.font = '20px serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(hearts, canvas.width - px - 10, py + 21);

    // Danger label when 1 life
    if (lives === 1) {
      const pulse = 0.5 + Math.sin(bgTick * 0.12) * 0.5;
      ctx.save();
      ctx.font = 'bold 14px "Arial Black", Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(255,80,80,${0.75 + pulse * 0.25})`;
      ctx.fillText('⚠️  Humdinger is catching up!  ⚠️', canvas.width / 2, py + 21);
      ctx.restore();
    }

    // Speed phase indicator (shows after first ramp)
    if (gameSpeedRamp > 1) {
      const phase = Math.floor(gameTick / 15);
      ctx.save();
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = `rgba(255,220,100,0.7)`;
      ctx.fillText(`Speed ×${gameSpeedRamp.toFixed(1)}  📈`, canvas.width / 2, py - 4);
      ctx.restore();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.font = '13px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('← → run  |  Space / ↑ jump  |  Collect items, jump over obstacles!', canvas.width / 2, canvas.height - 10);
  }

  // ── Touch buttons ────────────────────────────
  let btnLeft = {}, btnRight = {}, btnJump = {};
  const isTouch = 'ontouchstart' in window;

  function drawTouchBtns() {
    if (!isTouch) return;
    const bh = 70, bw = 80, by = canvas.height - bh - 20;
    const drawBtn = (b, label, x) => {
      b.x = x; b.y = by; b.w = bw; b.h = bh;
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath(); ctx.roundRect(x, by, bw, bh, 16); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'white'; ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, x + bw / 2, by + bh / 2);
    };
    drawBtn(btnLeft,  '◀', 22);
    drawBtn(btnRight, '▶', 22 + bw + 14);
    drawBtn(btnJump,  '🦘', canvas.width - bw - 22);
  }

  function inBtn(b, x, y) { return b.x != null && x >= b.x && x <= b.x+b.w && y >= b.y && y <= b.y+b.h; }

  // ── Menu ─────────────────────────────────────
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
    ctx.fillText('Pick your pup!', canvas.width / 2, canvas.height * 0.28);

    const cW = clamp(canvas.width * 0.26, 90, 145);
    const cH = cW * 1.52, gap = 18;
    const totalW = cW * 3 + gap * 2;
    const startX = canvas.width / 2 - totalW / 2;
    const cardY  = canvas.height * 0.33;
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
    ctx.fillText('Run  ←→  |  Jump  Space/↑  |  Collect items!', canvas.width / 2, canvas.height - 18);
  }

  // ── Game Over ────────────────────────────────
  let goBtn = {};
  function drawGameOver() {
    ctx.fillStyle = 'rgba(0,0,0,0.62)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const bw = clamp(canvas.width * 0.78, 260, 360), bh = 290;
    const bx = canvas.width/2 - bw/2, by = canvas.height/2 - bh/2;
    ctx.fillStyle = '#1A237E';
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 24); ctx.fill();
    ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 4; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FF6B6B';
    ctx.font = `bold ${clamp(canvas.width * 0.1, 30, 42)}px "Arial Black", Arial`;
    ctx.fillText('GAME OVER', canvas.width/2, by + bh*0.22);
    ctx.fillStyle = '#FFD700'; ctx.font = 'bold 30px "Arial Black", Arial';
    ctx.fillText(`Score: ${score}`, canvas.width/2, by + bh*0.42);
    const stars = score >= 150 ? 3 : score >= 70 ? 2 : score >= 20 ? 1 : 0;
    ctx.font = '38px serif';
    ctx.fillText('⭐'.repeat(stars) + '☆'.repeat(3 - stars), canvas.width/2, by + bh*0.60);
    const btnW = 200, btnH = 52;
    const btnX = canvas.width/2 - btnW/2, btnY = by + bh*0.77 - btnH/2;
    ctx.fillStyle = '#43A047';
    ctx.beginPath(); ctx.roundRect(btnX, btnY, btnW, btnH, 14); ctx.fill();
    ctx.fillStyle = 'white'; ctx.font = 'bold 21px "Arial Black", Arial';
    ctx.fillText('PLAY AGAIN! 🐾', canvas.width/2, btnY + btnH/2);
    goBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
  }

  function resetGame(dogData) {
    dog = new Dog(dogData);
    cameraX = 0;
    updateCamera(true); // snap camera to initial dog position
    score = 0; lives = 3; combo = 0; catchCount = 0;
    gameTick = 0; gameSpeedRamp = 1; comboPopup = null;
    particles = []; pawPrints = []; items = []; obstacles = []; platforms = []; questionBlocks = [];
    obsTimer = 220; itemSpawnTimer = 60; platformTimer = 380; qbTimer = 500;
    initBg();
    state = ST.PLAY;
  }

  // ── Input ────────────────────────────────────
  function handleMenuClick(x, y) {
    menuCards.forEach((c, i) => {
      if (c && x >= c.x && x <= c.x+c.w && y >= c.y && y <= c.y+c.h) resetGame(DOG_DEFS[i]);
    });
  }
  function handleOverClick(x, y) {
    if (goBtn.x && x >= goBtn.x && x <= goBtn.x+goBtn.w && y >= goBtn.y && y <= goBtn.y+goBtn.h)
      state = ST.MENU;
  }

  let touchAnchorX = 0;
  function onKeyDown(e) {
    if (state === ST.PLAY && dog) {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); dog.leftHeld  = true; }
      if (e.key === 'ArrowRight') { e.preventDefault(); dog.rightHeld = true; }
      if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); dog.jump(); }
    }
  }
  function onKeyUp(e) {
    if (dog) {
      if (e.key === 'ArrowLeft')  dog.leftHeld  = false;
      if (e.key === 'ArrowRight') dog.rightHeld = false;
    }
  }
  function onTouchStart(e) {
    e.preventDefault();
    const t = e.changedTouches[0];
    touchAnchorX = t.clientX;
    if (state === ST.PLAY && dog) {
      if (inBtn(btnJump, t.clientX, t.clientY)) { dog.jump(); return; }
      if (inBtn(btnLeft, t.clientX, t.clientY)) { dog.leftHeld = true; return; }
      if (inBtn(btnRight, t.clientX, t.clientY)) { dog.rightHeld = true; return; }
      dog.jump();
    }
    if (state === ST.MENU) handleMenuClick(t.clientX, t.clientY);
    if (state === ST.OVER) handleOverClick(t.clientX, t.clientY);
  }
  function onTouchMove(e) {
    e.preventDefault();
    if (state !== ST.PLAY || !dog) return;
    const dx = e.changedTouches[0].clientX - touchAnchorX;
    if (dx > 25)       { dog.rightHeld = true;  dog.leftHeld  = false; }
    else if (dx < -25) { dog.leftHeld  = true;  dog.rightHeld = false; }
    else               { dog.leftHeld  = false; dog.rightHeld = false; }
  }
  function onTouchEnd(e) {
    e.preventDefault();
    if (dog) { dog.leftHeld = false; dog.rightHeld = false; }
  }
  function onClick(e) {
    if (state === ST.MENU) handleMenuClick(e.clientX, e.clientY);
    if (state === ST.OVER) handleOverClick(e.clientX, e.clientY);
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
  document.addEventListener('keyup', onKeyUp);
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
      // Set dog's floor to the highest platform/block it's on, else real ground
      if (dog) {
        const realGround = canvas.height * GROUND_RATIO;
        dog.gY = realGround;
        for (const p of platforms) {
          if (dog.x + dog.w * 0.35 > p.left && dog.x - dog.w * 0.35 < p.right) {
            if (dog.y <= p.surfaceY + 8) { dog.gY = p.surfaceY; break; }
          }
        }
        for (const qb of questionBlocks) {
          if (dog.x + dog.w * 0.35 > qb.left && dog.x - dog.w * 0.35 < qb.right) {
            if (dog.y <= qb.top + 8) { dog.gY = qb.top; break; }
          }
        }
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

    if (state === ST.PLAY) {
      platforms.forEach(p => p.draw());
      questionBlocks.forEach(qb => qb.draw());
      obstacles.forEach(o => o.draw());
      items.forEach(it => it.draw());
      dog.draw();
    }
    if (state === ST.OVER) {
      if (dog) dog.draw();
    }

    ctx.restore();

    // ── Draw HUD / overlays (screen-space) ──
    if (state === ST.PLAY)  { drawHUD(); drawTouchBtns(); drawComboPopup(); }
    if (state === ST.OVER)  { drawGameOver(); }
  }
  rafId = requestAnimationFrame(loop);

  // ── Cleanup ───────────────────────────────────
  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
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
    return runGame(canvas, { onSuccess, difficulty: sharedDifficulty });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <canvas ref={canvasRef} className="pawpatrol-canvas" />;
}
