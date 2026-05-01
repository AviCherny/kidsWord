import React, { useEffect, useRef } from 'react';
import './PawPatrol.css';

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
  const lerp  = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ── Speech ───────────────────────────────────
  function speak(text, rate = 1.0, pitch = 1.8) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = rate;
    u.pitch = pitch;
    window.speechSynthesis.speak(u);
  }

  // ── Background ───────────────────────────────
  let bgTick = 0;
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

    const tW = 55, off = (bgTick * 1.8) % tW;
    ctx.fillStyle = '#6DC242';
    for (let x = -off; x < canvas.width + tW; x += tW) {
      ctx.beginPath(); ctx.ellipse(x, gY, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
    }

    const stripeOff = (bgTick * 1.8) % 60;
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (let x = -stripeOff; x < canvas.width + 60; x += 60)
      ctx.fillRect(x, gY + 4, 36, 6);
  }

  // ── Particles ────────────────────────────────
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
    particles = particles.filter(p => {
      p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.life -= p.decay; return p.life > 0;
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
  let pawTimer = 0;
  function addPaw(x, y) { pawPrints.push({ x, y, alpha: 0.55 }); }
  function tickPaws() { pawPrints = pawPrints.filter(p => { p.alpha -= 0.005; return p.alpha > 0; }); }
  function drawPaws() {
    ctx.save(); ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    pawPrints.forEach(p => { ctx.globalAlpha = p.alpha; ctx.fillText('🐾', p.x, p.y); });
    ctx.restore();
  }

  // ── Dog class ────────────────────────────────
  const GRAVITY    = 0.52;
  const JUMP_VY    = -15;
  const MOVE_SPEED = 5.5;

  class Dog {
    constructor(data) {
      this.data = data;
      this.vx = 0; this.vy = 0;
      this.onGround = true; this.facing = 1;
      this.runT = 0;
      this.leftHeld = false; this.rightHeld = false;
      this.state = 'idle';
      this.stateT = 0; this.landSquash = 0;
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
      this.state = 'celebrate'; this.stateT = 80;
      starBurst(this.x, this.y - this.h * 0.9);
      burst(this.x, this.y - this.h * 0.5, '#FFD700', 14);
    }
    ouch() {
      this.state = 'ouch'; this.stateT = 45;
      this.vx = -this.facing * 7; this.vy = -7; this.onGround = false;
      burst(this.x, this.y - this.h * 0.5, '#FF4444', 10);
    }
    update() {
      if (this.stateT > 0) {
        this.stateT--;
        if (this.stateT === 0 && (this.state === 'celebrate' || this.state === 'ouch'))
          this.state = this.onGround ? 'idle' : 'jump';
      }
      const locked = this.state === 'celebrate' || this.state === 'ouch';
      if (!locked) {
        if (this.leftHeld)       { this.vx = -MOVE_SPEED; this.facing = -1; }
        else if (this.rightHeld) { this.vx =  MOVE_SPEED; this.facing =  1; }
        else { this.vx *= 0.68; if (Math.abs(this.vx) < 0.4) this.vx = 0; }
      } else { this.vx *= 0.8; }

      if (!this.onGround) this.vy += GRAVITY;
      this.x += this.vx; this.y += this.vy;

      if (this.y >= this.gY) {
        const wasAir = !this.onGround;
        this.y = this.gY; this.vy = 0; this.onGround = true;
        if (wasAir && this.state === 'jump') {
          this.landSquash = 9;
          this.state = Math.abs(this.vx) > 0.5 ? 'run' : 'idle';
        }
      }
      this.x = clamp(this.x, this.w * 0.5, canvas.width - this.w * 0.5);
      if (this.onGround && !locked)
        this.state = Math.abs(this.vx) > 0.5 ? 'run' : 'idle';
      if (this.state === 'run') {
        this.runT++;
        if (++pawTimer % 20 === 0) addPaw(this.x - this.facing * this.w * 0.2, this.gY + 9);
      }
      if (this.landSquash > 0) this.landSquash--;
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
        const q = this.landSquash / 9; sx = 1 + q * 0.28; sy = 1 - q * 0.22; bY = q * 4;
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
      this.x = canvas.width + this.r * 2 + Math.random() * 80;
      this.y = this.gY - this.r;
      this.speed = (2.2 + Math.random() * 1.0) * speedMult;
      this.bobT = Math.random() * Math.PI * 2;
      this.sparkT = 0;
      this.alive = true;
      this.collectT = 0;
      this.rot = 0;
      this.bgColor = ITEM_COLORS[Math.floor(Math.random() * ITEM_COLORS.length)];
    }
    update() {
      if (this.collectT > 0) {
        this.collectT--; this.y -= 5; this.rot += 0.2;
        if (this.collectT === 0) this.alive = false;
        return;
      }
      this.x -= this.speed;
      this.bobT += 0.035;
      this.y = this.gY - this.r - Math.abs(Math.sin(this.bobT)) * 10;
      this.sparkT += 0.08;
      if (this.x < -this.r * 2) this.alive = false;
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

  // ── Obstacles (character-specific) ──────────────
  class Obstacle {
    constructor() {
      const obsEmojis = dog ? DOG_OBSTACLES[dog.data.name] : ['🚧'];
      this.emoji = obsEmojis[Math.floor(Math.random() * obsEmojis.length)];
      this.gY = canvas.height * GROUND_RATIO;
      this.w = 70; this.h = 72;
      this.speed = (1.8 + Math.random() * 1.2) * speedMult;
      this.x = canvas.width + this.w;
      this.alive = true;
      this.warnT = 0;
    }
    update() {
      this.x -= this.speed;
      this.warnT += 0.15;
      if (this.x < -this.w * 2) this.alive = false;
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

      // JUMP! label
      if (this.x < canvas.width * 0.60 && this.x > 0) {
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

  function updatePlay() {
    // Spawn items — keep 2-3 on screen
    itemSpawnTimer--;
    if (itemSpawnTimer <= 0) {
      const dogItemList = DOG_ITEMS[dog.data.name];
      const item = dogItemList[Math.floor(Math.random() * dogItemList.length)];
      items.push(new CollectItem(item));
      itemSpawnTimer = 110 + Math.floor(Math.random() * 110);
    }

    items.forEach(it => it.update());

    // Collect
    if (dog.state !== 'ouch') {
      const db = dog.bounds();
      for (const it of items) {
        if (!it.alive || it.collectT > 0) continue;
        if (hits(db, it.bounds())) {
          it.collectT = 25;
          dog.celebrate();
          score += 10 * Math.max(1, combo);
          combo++;
          catchCount++;
          burst(it.x, it.y, it.bgColor, 14);
          speak(it.item.sentence, 1.0, 1.8);
          if (catchCount === 5) setTimeout(() => onSuccess(), 1500);
          break;
        }
      }
    }
    items = items.filter(i => i.alive || i.collectT > 0);

    // Spawn obstacles
    if (--obsTimer <= 0) {
      obstacles.push(new Obstacle());
      obsTimer = 280 + Math.floor(Math.random() * 180);
    }
    obstacles.forEach(o => o.update());

    if (dog.state !== 'ouch') {
      const db = dog.bounds();
      for (const o of obstacles) {
        if (hits(db, o.bounds())) {
          dog.ouch(); lives--; combo = 0;
          speak('Ouch! Jump over it!', 1.0, 1.7);
          if (lives <= 0) { state = ST.OVER; }
          break;
        }
      }
    }
    obstacles = obstacles.filter(o => o.alive);
  }

  // ── HUD ──────────────────────────────────────
  function drawHUD() {
    const px = 18, py = 14;
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
    score = 0; lives = 3; combo = 0; catchCount = 0;
    particles = []; pawPrints = []; items = []; obstacles = [];
    obsTimer = 220; itemSpawnTimer = 60;
    initBg();
    state = ST.PLAY;
    speak(dogData.tagline, 0.9, 1.7);
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

  function loop() {
    rafId = requestAnimationFrame(loop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state === ST.MENU) { drawMenu(); return; }

    drawBg();
    tickPaws(); drawPaws();
    tickParticles(); drawParticles();

    if (state === ST.PLAY) {
      obstacles.forEach(o => o.draw());
      items.forEach(it => it.draw());
      dog.update(); updatePlay(); dog.draw();
      drawHUD(); drawTouchBtns();
    }
    if (state === ST.OVER) {
      if (dog) dog.draw();
      drawGameOver();
    }
  }
  loop();

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
    if (window.speechSynthesis) window.speechSynthesis.cancel();
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
