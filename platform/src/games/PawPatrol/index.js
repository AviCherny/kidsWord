import React, { useEffect, useRef } from 'react';
import './PawPatrol.css';

// ─────────────────────────────────────────────
// WORD CURRICULUM
// ─────────────────────────────────────────────
const WORDS = [
  { word:'CAT', emoji:'🐱' }, { word:'DOG', emoji:'🐶' }, { word:'SUN', emoji:'☀️'  },
  { word:'BUS', emoji:'🚌' }, { word:'RUN', emoji:'🏃' }, { word:'HAT', emoji:'🎩' },
  { word:'BED', emoji:'🛏️'}, { word:'CUP', emoji:'☕' }, { word:'MAP', emoji:'🗺️' },
  { word:'PIG', emoji:'🐷' }, { word:'HEN', emoji:'🐔' }, { word:'FOX', emoji:'🦊' },
  { word:'FAN', emoji:'💨' }, { word:'JAM', emoji:'🍓' }, { word:'NET', emoji:'🕸️' },
  { word:'PEN', emoji:'✏️' }, { word:'TEN', emoji:'🔟' }, { word:'HOP', emoji:'🐸' },
  { word:'TOP', emoji:'🌀' }, { word:'MOP', emoji:'🧹' }, { word:'HUG', emoji:'🤗' },
  { word:'BUG', emoji:'🐛' }, { word:'MUG', emoji:'🍵' }, { word:'NUT', emoji:'🥜' },
  { word:'BAT', emoji:'🦇' }, { word:'CAR', emoji:'🚗' }, { word:'COW', emoji:'🐄' },
  { word:'EGG', emoji:'🥚' }, { word:'FLY', emoji:'🦋' }, { word:'BOX', emoji:'📦' },
];

const DOG_DEFS = [
  { name:'Chase',    color:'#1565C0', tagline:"Chase is on the case!" },
  { name:'Marshall', color:'#C62828', tagline:"I'm all fired up!"     },
  { name:'Rubble',   color:'#F9A825', tagline:"Rubble on the double!" },
];

// ─────────────────────────────────────────────
// GAME ENGINE  (runs inside useEffect, returns cleanup fn)
// ─────────────────────────────────────────────
function runGame(canvas, { onSuccess, difficulty }) {
  const ctx = canvas.getContext('2d');
  const speedMult = 1 + (difficulty - 1) * 0.18; // difficulty 1-4

  // ── sizing ──────────────────────────────────
  let dog = null; // declared here so resize() can safely reference it

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    if (dog) dog.resetGround();
  }
  resize();
  const onResize = () => resize();
  window.addEventListener('resize', onResize);

  // ── utils ────────────────────────────────────
  const lerp  = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function shuffle(a) {
    const r = [...a];
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  }

  // ── speech ───────────────────────────────────
  function speak(text, rate = 0.85) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = rate; u.pitch = 1.2;
    window.speechSynthesis.speak(u);
  }

  // ── dog drawing helpers ──────────────────────
  function getDogsColors(name) {
    if (name === 'Chase') return {
      body:'#D4A030', dark:'#7A4800', belly:'#ECD498',
      ear:'#7A4800', earInner:'#FFCCAA', earStyle:'pointy',
      uniform:'#1565C0', badge:'#FFD700',
      leg:'#D4A030', paw:'#C49030',
      nose:'#2A1200', eye:'#1E88E5',
      spots:null, hat:'police',
    };
    if (name === 'Marshall') return {
      body:'#F8F4EE', dark:'#1A1A1A', belly:'#F8F4EE',
      ear:'#EDE5D8', earInner:'#FFBBBB', earStyle:'floppy',
      uniform:'#D32F2F', badge:'#FFFFFF',
      leg:'#F8F4EE', paw:'#F8F4EE',
      nose:'#111', eye:'#3B2A1A',
      spots:'#1A1A1A', hat:'fire',
    };
    return { // Rubble
      body:'#A0652A', dark:'#6B4018', belly:'#D4A060',
      ear:'#6B4018', earInner:'#E8A890', earStyle:'folded',
      uniform:'#F57C00', badge:'#FFD700',
      leg:'#A0652A', paw:'#C48040',
      nose:'#111', eye:'#3A2A10',
      spots:null, hat:'hardhat',
    };
  }

  function drawLegSeg(attX, attY, uLen, lLen, legW, pawR, uAng, kAng, legCol, pawCol) {
    ctx.save();
    ctx.translate(attX, attY); ctx.rotate(uAng);
    ctx.fillStyle = legCol;
    ctx.beginPath(); ctx.roundRect(-legW/2, 0, legW, uLen, legW*0.45); ctx.fill();
    ctx.translate(0, uLen); ctx.rotate(kAng);
    ctx.beginPath(); ctx.roundRect(-legW/2, 0, legW, lLen, legW*0.45); ctx.fill();
    ctx.translate(0, lLen);
    ctx.fillStyle = pawCol;
    ctx.beginPath(); ctx.ellipse(0, 0, pawR, pawR*0.55, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function drawDogFull(w, h, name, state, runT, vy, onGround) {
    const c = getDogsColors(name);
    const ph = runT * 0.38;
    const running = state === 'run';
    const jumping = !onGround;
    const celebrate = state === 'celebrate';

    // Layout (local coords: ground = y:0, dog faces right = +x)
    const bCY  = -h * 0.52;
    const bRx  = w * 0.40;
    const bRy  = h * 0.175;
    const legY  = bCY + bRy * 0.95;
    const fLX  =  w * 0.22;
    const bLX  = -w * 0.18;
    const uLen = h * 0.23;
    const lLen = h * 0.20;
    const legW = w * 0.09;
    const pawR = w * 0.075;
    const hR   = w * 0.26;          // bigger cartoon head
    const hX   =  w * 0.27;
    const hY   = bCY - bRy * 0.82 - hR * 0.72;
    const tX   = -bRx * 0.85;
    const tY   = bCY - bRy * 0.15;

    // Leg angles — diagonal trot
    const sw = 0.52;
    let fA=0, fB=0, bA=0, bB=0, fKA=0, fKB=0, bKA=0, bKB=0;
    if (running) {
      fA =  Math.sin(ph) * sw;   fB = -Math.sin(ph) * sw;
      bA = -Math.sin(ph) * sw * 0.85; bB =  Math.sin(ph) * sw * 0.85;
      const kn = 0.38;
      fKA = Math.max(0, Math.sin(ph + 0.8)) * kn;
      fKB = Math.max(0, Math.sin(ph + 0.8 + Math.PI)) * kn;
      bKA = Math.max(0, Math.sin(ph + 0.8 + Math.PI)) * kn * 0.7;
      bKB = Math.max(0, Math.sin(ph + 0.8)) * kn * 0.7;
    } else if (jumping) {
      const ext = vy < 0 ? 0.40 : -0.28;
      fA = fB = ext * 0.9; bA = bB = -ext * 0.6;
    }

    const wag = Math.sin(bgTick * (running||celebrate ? 0.28 : 0.1)) * (running||celebrate ? 0.5 : 0.2);

    // ── Tail
    ctx.save();
    ctx.strokeStyle = c.body; ctx.lineWidth = legW * 1.1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tX, tY);
    const tLen = w * 0.4;
    ctx.bezierCurveTo(
      tX - tLen*0.3, tY - tLen*0.5,
      tX - tLen*0.55 + Math.cos(-0.8+wag)*tLen*0.25, tY - tLen*0.75 + Math.sin(-0.8+wag)*tLen*0.25,
      tX - tLen*0.6  + Math.cos(-0.8+wag)*tLen*0.45, tY - tLen     + Math.sin(-0.8+wag)*tLen*0.45
    );
    ctx.stroke(); ctx.restore();

    // ── Far legs (behind body — slightly dimmed)
    ctx.save(); ctx.globalAlpha = 0.72;
    drawLegSeg(fLX, legY, uLen, lLen, legW, pawR, fB, fKB, c.leg, c.paw);
    drawLegSeg(bLX, legY, uLen, lLen, legW, pawR, bB, bKB, c.leg, c.paw);
    ctx.restore();

    // ── Body (fur base)
    ctx.fillStyle = c.body;
    ctx.beginPath(); ctx.ellipse(0, bCY, bRx, bRy, 0, 0, Math.PI*2); ctx.fill();
    if (c.dark !== c.body) { // saddle marking (Chase / Rubble)
      ctx.fillStyle = c.dark;
      ctx.beginPath(); ctx.ellipse(-bRx*0.1, bCY - bRy*0.3, bRx*0.55, bRy*0.5, 0, 0, Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = c.belly;
    ctx.beginPath(); ctx.ellipse(bRx*0.1, bCY + bRy*0.3, bRx*0.45, bRy*0.42, 0, 0, Math.PI*2); ctx.fill();
    if (c.spots) { // Marshall body spots
      ctx.fillStyle = c.spots;
      [[-bRx*0.28, bCY-bRy*0.32, 5.5],[bRx*0.14, bCY-bRy*0.05, 7],
       [-bRx*0.52, bCY+bRy*0.12, 4.5],[bRx*0.38, bCY+bRy*0.28, 4]].forEach(([sx,sy,sr]) => {
         ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI*2); ctx.fill();
       });
    }

    // ── Uniform vest (front half of body, character color)
    ctx.save();
    ctx.fillStyle = c.uniform;
    ctx.beginPath(); ctx.ellipse(bRx*0.12, bCY, bRx*0.62, bRy*0.88, 0, 0, Math.PI*2); ctx.clip();
    ctx.beginPath(); ctx.rect(0, bCY - bRy*1.2, bRx*1.3, bRy*2.4); ctx.fill();
    ctx.restore();
    // Vest detail
    if (name === 'Chase') { // gold badge star on vest
      ctx.fillStyle = c.badge;
      ctx.beginPath(); ctx.arc(bRx*0.42, bCY, bRy*0.42, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#1565C0'; ctx.font = `bold ${Math.round(bRy*0.44)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('★', bRx*0.42, bCY + 1);
    } else if (name === 'Marshall') { // white cross on vest
      ctx.fillStyle = 'white';
      const cxB = bRx*0.4, vw = bRy*0.28, vl = bRy*0.75;
      ctx.fillRect(cxB - vw/2, bCY - vl/2, vw, vl);
      ctx.fillRect(cxB - vl/2, bCY - vw/2, vl, vw);
    }

    // ── Neck + collar (uniform color)
    ctx.fillStyle = c.body;
    ctx.beginPath(); ctx.ellipse(fLX + w*0.08, bCY - bRy*0.72, w*0.13, bRy*0.58, -0.25, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = c.uniform;
    ctx.beginPath(); ctx.ellipse(fLX + w*0.06, bCY - bRy*0.66, w*0.14, w*0.05, -0.2, 0, Math.PI*2); ctx.fill();

    // ── Ears  (Chase: after hat; Marshall/Rubble: before hat, drawn here)
    const drawEars = () => {
      if (c.earStyle === 'pointy') { // Chase — upright German Shepherd ears
        [[-hR*0.3, -0.12],[hR*0.25, 0.12]].forEach(([ex, rot]) => {
          ctx.save(); ctx.translate(hX + ex, hY - hR*0.5); ctx.rotate(rot);
          ctx.fillStyle = c.ear;
          ctx.beginPath(); ctx.moveTo(-hR*0.22, hR*0.32); ctx.lineTo(0, -hR*0.6); ctx.lineTo(hR*0.22, hR*0.32); ctx.closePath(); ctx.fill();
          ctx.fillStyle = c.earInner;
          ctx.beginPath(); ctx.moveTo(-hR*0.11, hR*0.22); ctx.lineTo(0, -hR*0.38); ctx.lineTo(hR*0.11, hR*0.22); ctx.closePath(); ctx.fill();
          ctx.restore();
        });
      } else if (c.earStyle === 'floppy') { // Marshall — Dalmatian floppy ears
        [[-hR*0.42, hR*0.58],[hR*0.12, hR*0.52]].forEach(([ex, ey], i) => {
          ctx.fillStyle = c.ear;
          ctx.beginPath(); ctx.ellipse(hX+ex, hY - hR*0.38 + ey, hR*0.22, hR*0.5, i===0 ? -0.22 : 0.22, 0, Math.PI*2); ctx.fill();
          if (c.spots) { ctx.fillStyle = c.spots; ctx.beginPath(); ctx.arc(hX+ex, hY-hR*0.1+ey*0.55, 3.5, 0, Math.PI*2); ctx.fill(); }
        });
      } else { // Rubble — bulldog side ears, small and folded
        [[-hR*0.58, -hR*0.42],[hR*0.52, -hR*0.38]].forEach(([ex, ey]) => {
          ctx.fillStyle = c.ear;
          ctx.beginPath(); ctx.ellipse(hX+ex, hY+ey, hR*0.26, hR*0.2, ex>0 ? 0.6 : -0.6, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = c.earInner;
          ctx.beginPath(); ctx.ellipse(hX+ex, hY+ey, hR*0.14, hR*0.11, ex>0 ? 0.6 : -0.6, 0, Math.PI*2); ctx.fill();
        });
      }
    };

    // Marshall/Rubble: ears behind helmet
    if (c.hat !== 'police') drawEars();

    // ── Head
    ctx.fillStyle = c.body;
    ctx.beginPath(); ctx.arc(hX, hY, hR, 0, Math.PI*2); ctx.fill();

    // Chase — darker mask/saddle pattern wraps around top of head
    if (name === 'Chase') {
      ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = c.dark;
      ctx.beginPath(); ctx.ellipse(hX - hR*0.05, hY - hR*0.35, hR*0.88, hR*0.52, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }
    // Marshall head spots
    if (c.spots) {
      ctx.fillStyle = c.spots;
      [[hR*0.32, -hR*0.26, 4],[-hR*0.08, hR*0.22, 3.5]].forEach(([sx,sy,sr]) => {
        ctx.beginPath(); ctx.arc(hX+sx, hY+sy, sr, 0, Math.PI*2); ctx.fill();
      });
    }

    // Snout
    const snRx = name==='Rubble' ? hR*0.46 : hR*0.37;
    const snRy = name==='Rubble' ? hR*0.34 : hR*0.26;
    const snX  = hX + hR*0.60;
    const snY  = hY + hR*0.18;
    ctx.fillStyle = c.belly;
    ctx.beginPath(); ctx.ellipse(snX, snY, snRx, snRy, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = c.nose;
    ctx.beginPath(); ctx.ellipse(snX + snRx*0.5, snY - snRy*0.28, snRx*0.38, snRy*0.52, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(snX + snRx*0.35, snY - snRy*0.48, snRx*0.12, 0, Math.PI*2); ctx.fill();
    // Rubble underbite
    if (name === 'Rubble') {
      ctx.strokeStyle = c.dark; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(snX - snRx*0.22, snY + snRy*0.55);
      ctx.quadraticCurveTo(snX, snY + snRy*0.95, snX + snRx*0.22, snY + snRy*0.55); ctx.stroke();
    }

    // Eye — bigger, cartoon style, colored iris
    const eR = hR * 0.25;
    const eX = hX + hR * 0.16;
    const eY = hY - hR * 0.18;
    ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(eX, eY, eR*1.1, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = name === 'Chase' ? '#1E88E5' : '#3A2A1A';
    ctx.beginPath(); ctx.arc(eX, eY, eR*0.72, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(eX + eR*0.08, eY, eR*0.44, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(eX + eR*0.3, eY - eR*0.3, eR*0.28, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = c.dark; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(eX-eR, eY-eR*1.28); ctx.lineTo(eX+eR*0.9, eY-eR*1.55); ctx.stroke();

    // ── Hat — drawn last so it sits on top
    if (c.hat === 'police') {
      // Chase: blue police cap with flat top, brim, and forward visor
      const hbY = hY - hR * 0.48; // brim Y
      ctx.fillStyle = '#1565C0';
      // Crown (flat-top cylinder shape)
      ctx.beginPath(); ctx.roundRect(hX - hR*0.85, hbY - hR*0.55, hR*1.7, hR*0.58, [hR*0.18, hR*0.18, 0, 0]); ctx.fill();
      // Hat band (darker stripe at base of crown)
      ctx.fillStyle = '#0A3080';
      ctx.beginPath(); ctx.roundRect(hX - hR*0.85, hbY - hR*0.18, hR*1.7, hR*0.18, 2); ctx.fill();
      // Brim (wide flat ellipse)
      ctx.fillStyle = '#0D47A1';
      ctx.beginPath(); ctx.ellipse(hX, hbY, hR*1.12, hR*0.17, 0, 0, Math.PI*2); ctx.fill();
      // Visor (forward peak, pointing right)
      ctx.beginPath();
      ctx.moveTo(hX + hR*0.82, hbY - hR*0.05);
      ctx.lineTo(hX + hR*1.62, hbY + hR*0.08);
      ctx.lineTo(hX + hR*0.82, hbY + hR*0.17);
      ctx.closePath(); ctx.fill();
      // Gold badge on crown
      ctx.fillStyle = '#FFD700';
      ctx.beginPath(); ctx.arc(hX, hbY - hR*0.36, hR*0.23, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#1565C0'; ctx.font = `bold ${Math.round(hR*0.22)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('★', hX, hbY - hR*0.35);
      // Chase's ears on TOP of hat (stick up from sides)
      drawEars();

    } else if (c.hat === 'fire') {
      // Marshall: red fire helmet — dome + wide brim + white stripe
      ctx.fillStyle = '#D32F2F';
      ctx.save();
      ctx.beginPath(); ctx.arc(hX, hY - hR*0.48, hR*1.12, -Math.PI, 0); ctx.closePath(); ctx.fill();
      // Brim
      ctx.beginPath(); ctx.ellipse(hX, hY - hR*0.48, hR*1.38, hR*0.2, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
      // White reflective stripe across dome
      ctx.save(); ctx.globalAlpha = 0.75; ctx.fillStyle = 'white';
      ctx.save();
      ctx.beginPath(); ctx.arc(hX, hY - hR*0.48, hR*1.12, -Math.PI, 0); ctx.closePath(); ctx.clip();
      ctx.beginPath(); ctx.rect(hX - hR*1.4, hY - hR*0.72, hR*2.8, hR*0.23); ctx.fill();
      ctx.restore(); ctx.restore();
      // Front plate on helmet
      ctx.fillStyle = '#B71C1C';
      ctx.beginPath(); ctx.roundRect(hX + hR*0.12, hY - hR*0.68, hR*0.52, hR*0.32, 4); ctx.fill();

    } else { // hardhat — Rubble's yellow construction hat
      ctx.fillStyle = '#F9A825';
      ctx.save();
      ctx.beginPath(); ctx.arc(hX, hY - hR*0.38, hR*1.08, -Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(hX, hY - hR*0.38, hR*1.32, hR*0.19, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();
      // Darker accent band near brim
      ctx.save(); ctx.globalAlpha = 0.45; ctx.fillStyle = '#E65100';
      ctx.save();
      ctx.beginPath(); ctx.arc(hX, hY - hR*0.38, hR*1.08, -Math.PI, 0); ctx.closePath(); ctx.clip();
      ctx.beginPath(); ctx.rect(hX - hR*1.4, hY - hR*0.52, hR*2.8, hR*0.15); ctx.fill();
      ctx.restore(); ctx.restore();
    }

    // ── Near legs (front plane)
    drawLegSeg(fLX, legY, uLen, lLen, legW, pawR, fA, fKA, c.leg, c.paw);
    drawLegSeg(bLX, legY, uLen, lLen, legW, pawR, bA, bKA, c.leg, c.paw);
  }

  // ── scrolling bg ─────────────────────────────
  let clouds = [];
  let bgTick = 0;
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
      ctx.ellipse(c.x,                c.y,     c.rx,       c.ry,       0, 0, Math.PI * 2);
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

  // ── particles ────────────────────────────────
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

  // ── paw prints ───────────────────────────────
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
      this.state = 'celebrate'; this.stateT = 100;
      starBurst(this.x, this.y - this.h * 0.9);
      burst(this.x, this.y - this.h * 0.5, '#FFD700', 18);
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
      // Shadow
      const airH = Math.max(0, this.gY - this.y);
      const shSc = lerp(1, 0.35, airH / 220);
      ctx.save(); ctx.translate(this.x, this.gY + 12); ctx.scale(shSc, 0.28);
      ctx.beginPath(); ctx.ellipse(0, 0, this.w * 0.52, this.w * 0.52, 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,0,0,${0.22 * shSc})`; ctx.fill(); ctx.restore();

      // Body transform
      const t = this.runT;
      let tilt = 0, sx = 1, sy = 1, bY = 0;
      switch (this.state) {
        case 'run':
          bY = Math.sin(t * 0.38) * 4;
          tilt = Math.sin(t * 0.22) * 0.07 + 0.10; break;
        case 'jump':
          tilt = 0.12 * this.facing;
          if (this.vy < 0) { sx = 0.84; sy = 1.16; } else { sx = 1.12; sy = 0.90; } break;
        case 'celebrate':
          bY   = Math.sin(bgTick * 0.3) * 10;
          tilt = Math.sin(bgTick * 0.25) * 0.25;
          sx   = 1 + Math.abs(Math.sin(bgTick * 0.3)) * 0.12; sy = sx; break;
        case 'ouch': tilt = -0.5 * this.facing; sx = 1.2; sy = 0.8; break;
        default: break;
      }
      if (this.landSquash > 0) {
        const q = this.landSquash / 9; sx = 1 + q * 0.28; sy = 1 - q * 0.22; bY = q * 4;
      }

      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.scale(this.facing, 1);
      ctx.rotate(tilt);
      ctx.scale(sx, sy);
      ctx.translate(0, bY);

      const w = this.w, h = this.h;
      drawDogFull(w, h, this.data.name, this.state, this.runT, this.vy, this.onGround);

      // Speed lines
      if (Math.abs(this.vx) > 3.5 && this.onGround) {
        ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = 'white'; ctx.lineWidth = 2.5;
        for (let i = 0; i < 3; i++) {
          const ly = -h * (0.45 + i * 0.13), lx = w * 0.35;
          ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + w * (0.35 + i * 0.1), ly); ctx.stroke();
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

  // ── Falling word item ─────────────────────────
  const BADGE_COLORS = ['#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#DDA0DD','#F4A261'];

  class WordItem {
    constructor(wordObj, isTarget, x, startY) {
      this.w      = wordObj;
      this.target = isTarget;
      this.x = x; this.y = startY;
      this.vy = (1.4 + Math.random() * 0.8) * speedMult;
      this.vx = (Math.random() - 0.5) * 0.6;
      this.bobT = Math.random() * Math.PI * 2;
      this.bw = 96; this.bh = 54;
      this.alive  = true; this.catchT = 0; this.rot = 0; this.sparkT = 0;
      this.color  = isTarget ? '#FFD700' : BADGE_COLORS[Math.floor(Math.random() * BADGE_COLORS.length)];
    }
    update() {
      if (this.catchT > 0) {
        this.catchT--; this.rot += 0.18; this.y -= 4;
        if (this.catchT === 0) this.alive = false;
        return;
      }
      this.y += this.vy; this.x += this.vx + Math.sin(this.bobT) * 0.6;
      this.bobT += 0.028;
      if (this.target) this.sparkT += 0.12;
      if (this.x < this.bw / 2 + 5 || this.x > canvas.width - this.bw / 2 - 5) this.vx *= -1;
      if (this.y > canvas.height + 70) this.alive = false;
    }
    draw() {
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot);
      const w = this.bw, h = this.bh;
      if (this.target) { ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 16 + Math.sin(this.sparkT) * 8; }
      ctx.beginPath(); ctx.roundRect(-w/2, -h/2, w, h, 13);
      ctx.fillStyle = this.color; ctx.fill();
      ctx.strokeStyle = this.target ? '#E65100' : 'rgba(255,255,255,0.65)';
      ctx.lineWidth = this.target ? 3.5 : 2; ctx.stroke(); ctx.shadowBlur = 0;
      ctx.font = '14px serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(this.w.emoji, -w/2 + 5, -h/2 + 11);
      ctx.fillStyle = this.target ? '#1A1A1A' : '#FFFFFF';
      ctx.font = `bold ${Math.floor(w * 0.25)}px 'Arial Black', Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 3;
      ctx.fillText(this.w.word, 0, 4); ctx.shadowBlur = 0;
      ctx.restore();
      if (this.target) {
        for (let i = 0; i < 3; i++) {
          const a = this.sparkT + i * (Math.PI * 2 / 3);
          ctx.save(); ctx.translate(this.x + Math.cos(a) * this.bw * 0.58, this.y + Math.sin(a) * this.bh * 0.65);
          ctx.fillStyle = '#FFD700'; ctx.globalAlpha = 0.8;
          ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
      }
    }
    bounds() { return { left: this.x-this.bw/2, right: this.x+this.bw/2, top: this.y-this.bh/2, bottom: this.y+this.bh/2 }; }
  }

  function hits(a, b) {
    return a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
  }

  // ── Game state ───────────────────────────────
  const ST = { MENU:'menu', PLAY:'play', OVER:'over' };
  let state = ST.MENU;

  let score     = 0;
  let lives     = 3;
  let combo     = 0;
  // eslint-disable-next-line no-unused-vars
  let roundNum  = 0;
  let catchCount = 0; // how many words caught correctly this session

  let wordPool  = shuffle(WORDS);
  let wordIdx   = 0;
  let curWord   = null;
  let items     = [];
  let roundPhase = 'idle';
  let roundTimer = 0;

  function nextWord() {
    if (wordIdx >= wordPool.length) { wordPool = shuffle(WORDS); wordIdx = 0; }
    return wordPool[wordIdx++];
  }

  function startRound() {
    roundNum++;
    curWord = nextWord();
    const distractors = shuffle(WORDS.filter(w => w.word !== curWord.word)).slice(0, 3);
    const all = shuffle([curWord, ...distractors]);
    items = all.map((w, i) => {
      const spacing = canvas.width / 5;
      const it = new WordItem(w, w === curWord, spacing * (i + 1), -70 - i * 90);
      return it;
    });
    roundPhase = 'announce'; roundTimer = 55;
    speak(curWord.word);
  }

  function endGame() { roundPhase = 'idle'; state = ST.OVER; }

  function updateRound() {
    if (roundTimer > 0) {
      roundTimer--;
      if (roundTimer === 0) {
        if      (roundPhase === 'announce') roundPhase = 'active';
        else if (roundPhase === 'won')      startRound();
        else if (roundPhase === 'missed')   { lives > 0 ? startRound() : endGame(); }
      }
    }

    items.forEach(it => it.update());

    if (roundPhase === 'active') {
      const db = dog.bounds();
      for (const it of items) {
        if (!it.alive || it.catchT > 0) continue;
        if (hits(db, it.bounds())) {
          if (it.target) {
            it.catchT = 22; dog.celebrate();
            score += 10 * Math.max(1, combo); combo++;
            catchCount++;
            roundPhase = 'won'; roundTimer = 90;
            speak('Great job!');
            // onSuccess after 5 correct catches
            if (catchCount === 5) { setTimeout(() => onSuccess(), 1200); }
          } else {
            if (dog.state !== 'ouch') {
              it.catchT = 10; dog.ouch();
              lives--; combo = 0; speak('Try again!');
              if (lives <= 0) { endGame(); return; }
            }
          }
          break;
        }
      }
      const tgt = items.find(i => i.target);
      if (!tgt || (!tgt.alive && tgt.catchT === 0)) {
        lives--; combo = 0; speak('Missed!');
        if (lives <= 0) { endGame(); return; }
        roundPhase = 'missed'; roundTimer = 55;
      }
    }
    items = items.filter(i => i.alive || i.catchT > 0);
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

    if (curWord) {
      const pw = Math.min(290, canvas.width * 0.68);
      const ph = 68, px2 = canvas.width / 2 - pw / 2, py2 = py;
      ctx.fillStyle = 'rgba(10,25,80,0.78)';
      ctx.beginPath(); ctx.roundRect(px2, py2, pw, ph, 16); ctx.fill();
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '13px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('CATCH:', canvas.width / 2, py2 + 9);
      ctx.fillStyle = '#FFD700';
      ctx.font = `bold 28px "Arial Black", Arial`; ctx.textBaseline = 'middle';
      ctx.fillText(`${curWord.emoji}  ${curWord.word}`, canvas.width / 2, py2 + ph * 0.67);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.font = '13px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('← → run  |  Space / ↑ jump', canvas.width / 2, canvas.height - 10);
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

      ctx.save(); ctx.translate(midX, midY); ctx.scale(sc, sc); ctx.translate(-cW/2, -cH/2);
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath(); ctx.roundRect(4, 6, cW, cH, 18); ctx.fill();
      ctx.fillStyle = d.color;
      ctx.beginPath(); ctx.roundRect(0, 0, cW, cH, 18); ctx.fill();
      if (hov) { ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 4; ctx.stroke(); }

      {
        const baseW = 90, baseH = baseW * 1.28;
        const scale = (cW * 0.60) / baseW;
        ctx.save();
        ctx.beginPath(); ctx.roundRect(5, 5, cW-10, cH*0.74-2, 14); ctx.clip();
        ctx.translate(cW/2, cH*0.74 - 10);
        ctx.scale(scale, scale);
        drawDogFull(baseW, baseH, d.name, 'run', bgTick * 0.7, 0, true);
        ctx.restore();
      }

      ctx.fillStyle = 'white';
      ctx.font = `bold ${Math.floor(cW * 0.155)}px "Arial Black", Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 3;
      ctx.strokeText(d.name.toUpperCase(), cW/2, cH * 0.88);
      ctx.fillText(d.name.toUpperCase(), cW/2, cH * 0.88);
      ctx.restore();

      menuCards[i] = { x: midX - cW/2*sc, y: midY - cH/2*sc, w: cW*sc, h: cH*sc };
    });

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = `${Math.min(14, canvas.width * 0.036)}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('Run  ←→  |  Jump  Space/↑  |  Catch the right word!', canvas.width/2, canvas.height - 18);
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
    score = 0; lives = 3; combo = 0; roundNum = 0; catchCount = 0;
    particles = []; pawPrints = []; items = [];
    wordPool = shuffle(WORDS); wordIdx = 0;
    initBg();
    state = ST.PLAY;
    speak(dogData.tagline, 0.9);
    roundTimer = 70; roundPhase = 'announce'; // slight delay before first round
    setTimeout(() => startRound(), 1300);
  }

  // ── Input ────────────────────────────────────
  function handleMenuClick(x, y) {
    menuCards.forEach((c, i) => {
      if (c && x >= c.x && x <= c.x+c.w && y >= c.y && y <= c.y+c.h) resetGame(DOG_DEFS[i]);
    });
  }
  function handleOverClick(x, y) {
    if (goBtn.x && x >= goBtn.x && x <= goBtn.x+goBtn.w && y >= goBtn.y && y <= goBtn.y+goBtn.h) {
      state = ST.MENU;
    }
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
    bgTick++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state === ST.MENU) { drawMenu(); return; }

    drawBg();
    tickPaws(); drawPaws();
    tickParticles(); drawParticles();

    if (state === ST.PLAY) {
      items.forEach(it => it.draw());
      dog.update(); updateRound(); dog.draw();
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
    window.removeEventListener('resize', onResize);
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
