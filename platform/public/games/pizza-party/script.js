"use strict";

const STAGES = {
  DOUGH: "dough",
  SAUCE: "sauce",
  TOPPINGS: "toppings",
  CUTTING: "cutting",
  SHARING: "sharing",
  COMPLETE: "complete",
};

const STAGE_ORDER = [
  { id: STAGES.DOUGH, label: "Dough" },
  { id: STAGES.SAUCE, label: "Sauce" },
  { id: STAGES.TOPPINGS, label: "Toppings" },
  { id: STAGES.CUTTING, label: "Cut" },
  { id: STAGES.SHARING, label: "Share" },
];

const SAUCES = [
  { id: "tomato", name: "Tomato", color: "#db5041", swirl: "#bd392b" },
  { id: "pesto", name: "Pesto", color: "#58a650", swirl: "#3f7f3c" },
  { id: "cheese", name: "Cheese", color: "#f6f0de", swirl: "#e4d7bf" },
];

const TOPPINGS = [
  { id: "onion", name: "Onion" },
  { id: "olive", name: "Olive" },
  { id: "mushroom", name: "Mushroom" },
  { id: "pepperoni", name: "Pepperoni" },
];

const RECIPES = [
  {
    id: "garden",
    name: "Garden Pizza",
    requirements: [
      { id: "onion", count: 2 },
      { id: "olive", count: 2 },
    ],
  },
  {
    id: "forest",
    name: "Forest Pizza",
    requirements: [
      { id: "mushroom", count: 2 },
      { id: "onion", count: 2 },
    ],
  },
  {
    id: "party",
    name: "Party Pizza",
    requirements: [
      { id: "pepperoni", count: 2 },
      { id: "olive", count: 2 },
    ],
  },
];

const KIDS = [
  { id: "maya", name: "Maya", accent: "#ffb770", shirt: "#ff7fa6" },
  { id: "leo", name: "Leo", accent: "#ffd37a", shirt: "#64cf59" },
  { id: "nina", name: "Nina", accent: "#f6b0e8", shirt: "#68d7ff" },
  { id: "sam", name: "Sam", accent: "#a1d6ff", shirt: "#ffd44d" },
];

const VALID_CUT_ANGLES = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];
const FINAL_SLICE_COUNT = 8;
const SLICE_LABELS = ["top", "top-right", "right", "bottom-right", "bottom", "bottom-left", "left", "top-left"];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function easeOutBack(value) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(value - 1, 3) + c1 * Math.pow(value - 1, 2);
}

function normalizeAngle(angle) {
  const twoPi = Math.PI * 2;
  let normalized = angle % twoPi;
  if (normalized < 0) {
    normalized += twoPi;
  }
  return normalized;
}

function normalizeLineAngle(angle) {
  let normalized = angle % Math.PI;
  if (normalized < 0) {
    normalized += Math.PI;
  }
  return normalized;
}

function distanceBetweenPoints(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function pointFromAngle(angle, radius) {
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function angleDifferenceModuloPi(a, b) {
  const diff = Math.abs(a - b);
  return Math.min(diff, Math.PI - diff);
}

function distancePointToSegment(point, a, b) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lengthSquared = abx * abx + aby * aby;
  if (lengthSquared === 0) {
    return Math.hypot(point.x - a.x, point.y - a.y);
  }

  const t = clamp(((point.x - a.x) * abx + (point.y - a.y) * aby) / lengthSquared, 0, 1);
  const projectionX = a.x + abx * t;
  const projectionY = a.y + aby * t;
  return Math.hypot(point.x - projectionX, point.y - projectionY);
}

function segmentIntersectsCircle(start, end, center, radius) {
  if (distanceBetweenPoints(start, center) <= radius || distanceBetweenPoints(end, center) <= radius) {
    return true;
  }
  return distancePointToSegment(center, start, end) <= radius;
}

function angleWithinSector(testAngle, startAngle, endAngle) {
  const adjusted = testAngle < startAngle ? testAngle + Math.PI * 2 : testAngle;
  return adjusted > startAngle && adjusted < endAngle;
}

function describeSlice(sliceIndex) {
  return SLICE_LABELS[sliceIndex] || "special";
}

function shuffle(array) {
  const result = [...array];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

class AudioManager {
  constructor() {
    this.ctx = null;
    this.musicTimer = null;
    this.musicStep = 0;
    this.enabled = true;
    this.visibilityHandler = () => {
      if (document.hidden) {
        this.stopMusicLoop();
      } else if (this.enabled) {
        this.startMusicLoop();
      }
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);
  }

  ensureContext() {
    if (!this.enabled) {
      return null;
    }

    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopMusicLoop();
      if (this.ctx && this.ctx.state === "running") {
        this.ctx.suspend().catch(() => {});
      }
    } else {
      this.ensureContext();
      this.startMusicLoop();
    }
  }

  playTone({
    frequency = 440,
    endFrequency = frequency,
    duration = 0.12,
    type = "sine",
    gain = 0.02,
  }) {
    const ctx = this.ensureContext();
    if (!ctx) {
      return;
    }

    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const amp = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.linearRampToValueAtTime(endFrequency, now + duration);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(gain, now + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(amp);
    amp.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  }

  startMusicLoop() {
    if (!this.enabled || this.musicTimer || document.hidden) {
      return;
    }

    this.ensureContext();
    const melody = [523, 659, 587, 659, 784, 659, 523, 587];
    this.musicTimer = window.setInterval(() => {
      const note = melody[this.musicStep % melody.length];
      this.playTone({
        frequency: note,
        endFrequency: note * 1.015,
        duration: 0.24,
        type: "triangle",
        gain: 0.008,
      });
      if (this.musicStep % 2 === 0) {
        this.playTone({
          frequency: note / 2,
          endFrequency: note / 2,
          duration: 0.28,
          type: "sine",
          gain: 0.004,
        });
      }
      this.musicStep += 1;
    }, 420);
  }

  stopMusicLoop() {
    if (this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  playRoll() {
    this.playTone({
      frequency: 180 + Math.random() * 26,
      endFrequency: 120 + Math.random() * 18,
      duration: 0.07,
      type: "triangle",
      gain: 0.012,
    });
  }

  playSauce() {
    this.playTone({
      frequency: 320,
      endFrequency: 510,
      duration: 0.15,
      type: "sine",
      gain: 0.02,
    });
  }

  playCorrectTopping() {
    this.playTone({
      frequency: 520,
      endFrequency: 620,
      duration: 0.08,
      type: "square",
      gain: 0.016,
    });
  }

  playWrong() {
    this.playTone({
      frequency: 240,
      endFrequency: 180,
      duration: 0.16,
      type: "triangle",
      gain: 0.02,
    });
  }

  playCut() {
    this.playTone({
      frequency: 720,
      endFrequency: 260,
      duration: 0.16,
      type: "sawtooth",
      gain: 0.024,
    });
  }

  playDrop() {
    this.playTone({
      frequency: 420,
      endFrequency: 520,
      duration: 0.12,
      type: "triangle",
      gain: 0.014,
    });
  }

  playSuccess() {
    [523, 659, 784].forEach((note, index) => {
      window.setTimeout(() => {
        this.playTone({
          frequency: note,
          endFrequency: note * 1.03,
          duration: 0.16,
          type: "triangle",
          gain: 0.02,
        });
      }, index * 60);
    });
  }

  playCelebrate() {
    [523, 659, 784, 988].forEach((note, index) => {
      window.setTimeout(() => {
        this.playTone({
          frequency: note,
          endFrequency: note * 1.02,
          duration: 0.2,
          type: "triangle",
          gain: 0.024,
        });
      }, index * 70);
    });
  }
}

class KidPanel {
  constructor(container) {
    this.container = container;
    this.kids = [];
  }

  setup(assignments) {
    this.container.innerHTML = "";
    this.container.className = "kids-scroll";
    this.kids = assignments.map((assignment, index) => {
      const card = document.createElement("article");
      card.className = "kid-card";
      card.innerHTML = `
        <div class="kid-top">
          <div class="kid-character" style="--float-speed:${3.4 + index * 0.25}s;">
            <div class="kid-head" style="--kid-accent:${assignment.accent};">
              <span class="kid-smile"></span>
            </div>
            <div class="kid-body" style="--shirt-color:${assignment.shirt};"></div>
          </div>
          <div class="kid-info">
            <div class="kid-name">${assignment.name}</div>
            <div class="kid-wish">I want the ${describeSlice(assignment.sliceIndex)} slice.</div>
          </div>
        </div>
        <div class="hint-row">
          <canvas class="hint-canvas" width="58" height="58"></canvas>
          <span>Match the piece pointing <strong>${describeSlice(assignment.sliceIndex)}</strong>.</span>
        </div>
        <div class="kid-plate" data-kid-id="${assignment.id}">
          <span class="kid-plate-label">Slice goes here</span>
          <div class="kid-bubble">Yum Yum!</div>
        </div>
      `;

      const plate = card.querySelector(".kid-plate");
      const bubble = card.querySelector(".kid-bubble");
      const hintCanvas = card.querySelector(".hint-canvas");
      this.drawHint(hintCanvas, assignment.sliceIndex);
      plate.addEventListener("dragover", (event) => {
        event.preventDefault();
      });
      this.container.appendChild(card);

      return {
        ...assignment,
        card,
        plate,
        bubble,
        fed: false,
      };
    });
  }

  drawHint(canvas, sliceIndex) {
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const center = size / 2;
    const radius = size / 2 - 5;
    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = "#ffe9ae";
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#dca15b";
    ctx.beginPath();
    ctx.arc(center, center, radius - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#db5d4a";
    ctx.beginPath();
    ctx.arc(center, center, radius - 8, 0, Math.PI * 2);
    ctx.fill();

    const start = -Math.PI / 2 + sliceIndex * (Math.PI / 4);
    const end = start + Math.PI / 4;
    ctx.save();
    ctx.translate(center, center);
    ctx.fillStyle = "#fff2b7";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius - 5, start, end);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  setHover(targetKidId) {
    this.kids.forEach((kid) => {
      const active = kid.id === targetKidId && !kid.fed;
      kid.card.classList.toggle("is-hover", active);
      kid.plate.classList.toggle("is-targeted", active);
    });
  }

  findTarget(clientX, clientY) {
    return this.kids.find((kid) => {
      if (kid.fed) {
        return false;
      }
      const rect = kid.plate.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    }) || null;
  }

  markFed(kidId) {
    const kid = this.kids.find((entry) => entry.id === kidId);
    if (!kid) {
      return;
    }

    kid.fed = true;
    kid.card.classList.add("is-fed", "is-happy");
    kid.card.classList.remove("is-hover");
    kid.plate.classList.remove("is-targeted");
    kid.plate.classList.add("is-fed");
    kid.plate.querySelector(".kid-plate-label").textContent = "Yummy slice";
    kid.bubble.classList.add("visible");
    window.setTimeout(() => {
      kid.card.classList.remove("is-happy");
      kid.bubble.classList.remove("visible");
    }, 850);
  }

  allFed() {
    return this.kids.every((kid) => kid.fed);
  }
}

class PizzaRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.center = { x: 0, y: 0 };
    this.pizzaRadius = 0;
  }

  resize(width, height, dpr) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(width * dpr));
    this.canvas.height = Math.max(1, Math.round(height * dpr));
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.center = { x: width / 2, y: height / 2 + height * 0.04 };
    this.pizzaRadius = Math.min(width, height) * 0.31;
  }

  render(state) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawBoard(ctx);

    if (!state.showSlices) {
      if (state.stage === STAGES.DOUGH) {
        this.drawDough(ctx, state.doughProgress);
      } else {
        this.drawPizza(ctx, this.center.x, this.center.y, this.pizzaRadius, state);
      }
    } else {
      this.drawTrayShadow(ctx);
    }

    this.drawGuides(ctx, state);
    this.drawCutPreview(ctx, state.cutPreview);
  }

  drawBoard(ctx) {
    const boardRadius = this.pizzaRadius + 62;
    ctx.save();
    ctx.fillStyle = "#dff8b0";
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = "rgba(255,255,255,0.58)";
    [
      { x: 0.14, y: 0.18, r: 14 },
      { x: 0.84, y: 0.16, r: 10 },
      { x: 0.22, y: 0.82, r: 8 },
      { x: 0.8, y: 0.78, r: 12 },
    ].forEach((sparkle) => {
      ctx.beginPath();
      ctx.arc(this.width * sparkle.x, this.height * sparkle.y, sparkle.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.translate(this.center.x, this.center.y);

    ctx.fillStyle = "rgba(100, 70, 29, 0.15)";
    ctx.beginPath();
    ctx.ellipse(0, boardRadius + 30, boardRadius * 0.82, boardRadius * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f8dc99";
    ctx.beginPath();
    ctx.arc(0, 0, boardRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#efc872";
    ctx.beginPath();
    ctx.arc(0, 0, boardRadius - 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.42)";
    for (let index = 0; index < 18; index += 1) {
      const angle = (Math.PI * 2 * index) / 18;
      const radius = boardRadius * (0.66 + (index % 4) * 0.07);
      const point = pointFromAngle(angle, radius);
      ctx.beginPath();
      ctx.arc(point.x, point.y, 3 + (index % 2), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawTrayShadow(ctx) {
    ctx.save();
    ctx.translate(this.center.x, this.center.y);
    ctx.fillStyle = "rgba(92, 59, 22, 0.14)";
    ctx.beginPath();
    ctx.ellipse(0, this.pizzaRadius + 28, this.pizzaRadius * 0.84, this.pizzaRadius * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawDough(ctx, progress) {
    const eased = easeOutBack(clamp(progress, 0, 1));
    const radius = lerp(this.pizzaRadius * 0.46, this.pizzaRadius, eased);
    const squash = lerp(0.76, 1, progress);
    const lumpiness = lerp(0.18, 0.03, progress);

    ctx.save();
    ctx.translate(this.center.x, this.center.y);
    ctx.fillStyle = "rgba(92, 59, 22, 0.14)";
    ctx.beginPath();
    ctx.ellipse(0, radius * 0.86, radius * 0.88, radius * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    const gradient = ctx.createRadialGradient(-radius * 0.22, -radius * 0.24, radius * 0.1, 0, 0, radius);
    gradient.addColorStop(0, "#fff1c4");
    gradient.addColorStop(0.72, "#f1cd8d");
    gradient.addColorStop(1, "#dea564");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    for (let index = 0; index <= 80; index += 1) {
      const angle = (Math.PI * 2 * index) / 80;
      const wave = 1 + lumpiness * Math.sin(angle * 3) + lumpiness * 0.42 * Math.sin(angle * 5 + 1.2);
      const x = Math.cos(angle) * radius * wave;
      const y = Math.sin(angle) * radius * squash * wave;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawPizza(ctx, centerX, centerY, radius, state) {
    const sauce = SAUCES.find((entry) => entry.id === state.sauceId);
    const sauceRadius = radius * 0.79;

    ctx.save();
    ctx.translate(centerX, centerY);

    ctx.fillStyle = "rgba(92, 59, 22, 0.16)";
    ctx.beginPath();
    ctx.ellipse(0, radius + 20, radius * 0.8, radius * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    const crust = ctx.createRadialGradient(-radius * 0.2, -radius * 0.22, radius * 0.12, 0, 0, radius);
    crust.addColorStop(0, "#ffe5a0");
    crust.addColorStop(0.72, "#e0a452");
    crust.addColorStop(1, "#c77b30");
    ctx.fillStyle = crust;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = sauce ? sauce.color : "#f7e7b6";
    ctx.beginPath();
    ctx.arc(0, 0, sauceRadius, 0, Math.PI * 2);
    ctx.fill();

    if (sauce) {
      ctx.strokeStyle = sauce.swirl;
      ctx.lineWidth = radius * 0.028;
      ctx.beginPath();
      ctx.arc(radius * 0.03, -radius * 0.03, sauceRadius * 0.74, 0.15, Math.PI * 1.72);
      ctx.stroke();
    }

    state.toppings.forEach((topping) => {
      const x = topping.xRatio * sauceRadius;
      const y = topping.yRatio * sauceRadius;
      this.drawTopping(ctx, topping, x, y, radius);
    });

    ctx.restore();
  }

  drawTopping(ctx, topping, x, y, radius) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(topping.rotation);
    ctx.scale(topping.scale, topping.scale);

    if (topping.id === "onion") {
      ctx.strokeStyle = "#ebcdff";
      ctx.lineWidth = radius * 0.028;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.07, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = radius * 0.018;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.04, 0, Math.PI * 2);
      ctx.stroke();
    } else if (topping.id === "olive") {
      ctx.strokeStyle = "#334728";
      ctx.lineWidth = radius * 0.024;
      [-radius * 0.03, radius * 0.03].forEach((offsetX) => {
        ctx.beginPath();
        ctx.arc(offsetX, 0, radius * 0.045, 0, Math.PI * 2);
        ctx.stroke();
      });
    } else if (topping.id === "mushroom") {
      ctx.fillStyle = "#debc91";
      ctx.beginPath();
      ctx.arc(0, -radius * 0.01, radius * 0.075, Math.PI, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#f0d5b0";
      ctx.fillRect(-radius * 0.02, 0, radius * 0.04, radius * 0.07);
    } else if (topping.id === "pepperoni") {
      ctx.fillStyle = "#c7493e";
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.065, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.beginPath();
      ctx.arc(-radius * 0.02, -radius * 0.02, radius * 0.016, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawGuides(ctx, state) {
    if (state.stage !== STAGES.CUTTING && state.stage !== STAGES.SHARING && state.stage !== STAGES.COMPLETE) {
      return;
    }

    ctx.save();
    ctx.translate(this.center.x, this.center.y);

    VALID_CUT_ANGLES.forEach((angle) => {
      const accepted = state.acceptedCuts.some((cutAngle) => angleDifferenceModuloPi(cutAngle, angle) < 0.001);
      const vector = pointFromAngle(angle, this.pizzaRadius * 1.03);
      ctx.strokeStyle = accepted ? "rgba(255,255,255,0.88)" : "rgba(75, 163, 70, 0.68)";
      ctx.lineWidth = accepted ? 4 : 3;
      ctx.setLineDash(accepted ? [] : [14, 12]);
      ctx.beginPath();
      ctx.moveTo(-vector.x, -vector.y);
      ctx.lineTo(vector.x, vector.y);
      ctx.stroke();
    });

    ctx.restore();
  }

  drawCutPreview(ctx, preview) {
    if (!preview) {
      return;
    }

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.96)";
    ctx.lineWidth = 6;
    ctx.setLineDash([18, 12]);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(preview.start.x, preview.start.y);
    ctx.lineTo(preview.end.x, preview.end.y);
    ctx.stroke();
    ctx.restore();
  }
}

class PizzaGame {
  constructor() {
    this.canvas = document.getElementById("pizzaCanvas");
    this.boardStack = document.getElementById("boardStack");
    this.boardCard = document.getElementById("boardCard");
    this.sliceLayer = document.getElementById("sliceLayer");
    this.effectLayer = document.getElementById("effectLayer");
    this.celebrationLayer = document.getElementById("celebrationLayer");
    this.sauceSpread = document.getElementById("sauceSpread");
    this.rollingPin = document.getElementById("rollingPin");
    this.knifeTrail = document.getElementById("knifeTrail");
    this.floatingMessage = document.getElementById("floatingMessage");
    this.leftTitle = document.getElementById("leftTitle");
    this.leftContent = document.getElementById("leftContent");
    this.rightTitle = document.getElementById("rightTitle");
    this.rightContent = document.getElementById("rightContent");
    this.progressStrip = document.getElementById("progressStrip");
    this.soundButton = document.getElementById("soundButton");
    this.resetButton = document.getElementById("resetButton");
    this.stageKicker = document.getElementById("stageKicker");
    this.stageTitle = document.getElementById("stageTitle");
    this.stageInstruction = document.getElementById("stageInstruction");

    this.audio = new AudioManager();
    this.renderer = new PizzaRenderer(this.canvas);
    this.kidPanel = null;

    this.stage = STAGES.DOUGH;
    this.doughProgress = 0;
    this.sauceId = null;
    this.recipe = RECIPES[0];
    this.recipeCounts = {};
    this.toppings = [];
    this.acceptedCuts = [];
    this.cutPreview = null;
    this.pointerSession = null;
    this.draggedSlice = null;
    this.messageTimer = null;
    this.resizeTimer = null;
    this.slices = [];
    this.assignments = [];
    this.availableSpots = [];
    this.soundEnabled = true;
    this.lastLeftMode = "";
    this.lastRightMode = "";

    this.buildProgress();
    this.bindEvents();
    this.resizeBoard();
    this.resetGame();
  }

  bindEvents() {
    this.resetButton.addEventListener("click", () => this.resetGame());
    this.soundButton.addEventListener("click", () => this.toggleSound());

    this.boardStack.addEventListener("pointerdown", (event) => this.onBoardPointerDown(event));
    this.boardStack.addEventListener("pointermove", (event) => this.onBoardPointerMove(event));
    this.boardStack.addEventListener("pointerup", (event) => this.onBoardPointerUp(event));
    this.boardStack.addEventListener("pointercancel", (event) => this.cancelBoardPointer(event));
    this.boardStack.addEventListener("pointerleave", (event) => this.onBoardPointerLeave(event));

    window.addEventListener("resize", () => {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => this.resizeBoard(), 60);
    });
  }

  buildProgress() {
    this.progressStrip.innerHTML = "";
    STAGE_ORDER.forEach((stage) => {
      const pill = document.createElement("div");
      pill.className = "progress-pill";
      pill.textContent = stage.label;
      pill.dataset.stage = stage.id;
      this.progressStrip.appendChild(pill);
    });
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.audio.setEnabled(this.soundEnabled);
    this.soundButton.textContent = this.soundEnabled ? "Sound On" : "Sound Off";
    this.soundButton.setAttribute("aria-pressed", String(this.soundEnabled));
  }

  resetGame() {
    this.audio.ensureContext();
    if (this.soundEnabled) {
      this.audio.startMusicLoop();
    }

    this.stage = STAGES.DOUGH;
    this.doughProgress = 0;
    this.sauceId = null;
    this.recipe = shuffle(RECIPES)[0];
    this.recipeCounts = {};
    this.recipe.requirements.forEach((entry) => {
      this.recipeCounts[entry.id] = 0;
    });
    this.toppings = [];
    this.acceptedCuts = [];
    this.cutPreview = null;
    this.pointerSession = null;
    this.draggedSlice = null;
    this.assignments = [];
    this.availableSpots = shuffle([
      { xRatio: -0.46, yRatio: -0.22 },
      { xRatio: -0.24, yRatio: -0.48 },
      { xRatio: 0.02, yRatio: -0.43 },
      { xRatio: 0.3, yRatio: -0.18 },
      { xRatio: 0.4, yRatio: 0.14 },
      { xRatio: 0.16, yRatio: 0.38 },
      { xRatio: -0.16, yRatio: 0.34 },
      { xRatio: -0.4, yRatio: 0.08 },
      { xRatio: -0.06, yRatio: 0.02 },
    ]);
    this.rollingPin.classList.remove("exit");
    this.hideRollingPin();
    this.hideKnifeTrail();
    this.sliceLayer.innerHTML = "";
    this.effectLayer.innerHTML = "";
    this.celebrationLayer.innerHTML = "";
    this.slices = [];
    this.kidPanel = null;
    this.lastLeftMode = "";
    this.lastRightMode = "";
    this.showMessage("Roll the dough to start the pizza.");
    this.updateUI(true);
    this.render();
  }

  resizeBoard() {
    const rect = this.boardStack.getBoundingClientRect();
    const width = Math.max(320, rect.width);
    const height = Math.max(320, rect.height);
    const dpr = window.devicePixelRatio || 1;
    this.renderer.resize(width, height, dpr);
    this.render();
    this.refreshSlices();
  }

  getRenderState() {
    return {
      stage: this.stage,
      doughProgress: this.doughProgress,
      sauceId: this.sauceId,
      toppings: this.toppings,
      acceptedCuts: this.acceptedCuts,
      cutPreview: this.cutPreview,
      showSlices:
        (this.stage === STAGES.CUTTING && this.acceptedCuts.length > 0) ||
        this.stage === STAGES.SHARING ||
        this.stage === STAGES.COMPLETE,
    };
  }

  render() {
    this.renderer.render(this.getRenderState());
  }

  updateUI(forcePanelRebuild = false) {
    this.updateProgress();
    this.updateStageCopy();
    this.renderSidePanels(forcePanelRebuild);
    this.refreshSlices();
  }

  updateProgress() {
    const activeIndex = STAGE_ORDER.findIndex((entry) => entry.id === this.stage);
    const completeIndex = this.stage === STAGES.COMPLETE ? STAGE_ORDER.length : activeIndex;
    this.progressStrip.querySelectorAll(".progress-pill").forEach((pill, index) => {
      pill.classList.toggle("is-active", index === activeIndex && this.stage !== STAGES.COMPLETE);
      pill.classList.toggle("is-done", index < completeIndex);
    });
  }

  updateStageCopy() {
    if (this.stage === STAGES.DOUGH) {
      this.stageKicker.textContent = "Step 1";
      this.stageTitle.textContent = "Roll the dough";
      this.stageInstruction.textContent = "Drag on the dough with the rolling pin until it becomes a smooth round pizza base.";
      return;
    }

    if (this.stage === STAGES.SAUCE) {
      this.stageKicker.textContent = "Step 2";
      this.stageTitle.textContent = "Pick one sauce bottle";
      this.stageInstruction.textContent = "Tap a bottle on the right. The whole pizza gets covered with that sauce instantly.";
      return;
    }

    if (this.stage === STAGES.TOPPINGS) {
      this.stageKicker.textContent = "Step 3";
      this.stageTitle.textContent = "Make the recipe";
      this.stageInstruction.textContent = "Tap only the toppings shown in the recipe tray. Wrong toppings get a gentle no.";
      return;
    }

    if (this.stage === STAGES.CUTTING) {
      this.stageKicker.textContent = "Step 4";
      this.stageTitle.textContent = "Cut on the guide lines";
      this.stageInstruction.textContent = "Draw along the green guides. Good cuts snap into place and split the pizza.";
      return;
    }

    if (this.stage === STAGES.SHARING) {
      this.stageKicker.textContent = "Step 5";
      this.stageTitle.textContent = "Share the slices";
      this.stageInstruction.textContent = "Drag each slice to the kid who wants it. Correct drops make them jump and say Yum Yum!";
      return;
    }

    this.stageKicker.textContent = "Amazing";
    this.stageTitle.textContent = "Pizza party complete";
    this.stageInstruction.textContent = "The kids are happy and the pizza sharing is done.";
  }

  renderSidePanels(force = false) {
    const leftMode = this.stage === STAGES.TOPPINGS ? "recipe" : "helper";
    const rightMode = this.stage === STAGES.SAUCE ? "sauces" : (this.stage === STAGES.SHARING || this.stage === STAGES.COMPLETE ? "kids" : "helper");

    if (force || leftMode !== this.lastLeftMode) {
      if (leftMode === "recipe") {
        this.renderRecipeTray();
      } else {
        this.renderHelperPanel("left");
      }
      this.lastLeftMode = leftMode;
    } else if (leftMode === "recipe") {
      this.refreshRecipeTray();
    }

    if (force || rightMode !== this.lastRightMode) {
      if (rightMode === "sauces") {
        this.renderSaucePanel();
      } else if (rightMode === "kids") {
        this.renderKidsPanel();
      } else {
        this.renderHelperPanel("right");
      }
      this.lastRightMode = rightMode;
    }
  }

  renderHelperPanel(side) {
    const isLeft = side === "left";
    const title = isLeft ? this.leftTitle : this.rightTitle;
    const content = isLeft ? this.leftContent : this.rightContent;
    title.textContent = isLeft ? "Kitchen Coach" : "Happy Helper";

    const steps = STAGE_ORDER.map((entry, index) => {
      const done = STAGE_ORDER.findIndex((item) => item.id === this.stage) > index || this.stage === STAGES.COMPLETE;
      return `
        <div class="helper-step">
          <span class="helper-step-bullet">${done ? "OK" : index + 1}</span>
          <span>${entry.label}</span>
        </div>
      `;
    }).join("");

    let tip = "Warm up the pizza fun.";
    if (this.stage === STAGES.DOUGH) {
      tip = "Move the rolling pin back and forth until the dough is a perfect circle.";
    } else if (this.stage === STAGES.CUTTING) {
      tip = `Follow the glowing guides. Cuts made: ${this.acceptedCuts.length}/4.`;
    } else if (this.stage === STAGES.COMPLETE) {
      tip = "The pizza party is full of smiles.";
    }

    content.innerHTML = `
      <div class="helper-card">
        <div class="helper-mascot">
          <div class="helper-avatar"><span class="mouth"></span></div>
          <div class="helper-copy">
            <strong>${this.stageTitle.textContent}</strong>
            <p>${tip}</p>
          </div>
        </div>
        <div class="helper-steps">${steps}</div>
      </div>
    `;
  }

  renderRecipeTray() {
    this.leftTitle.textContent = "Recipe Tray";
    this.leftContent.innerHTML = `
      <div class="recipe-card">
        <div>
          <div class="recipe-title">${this.recipe.name}</div>
          <p>Tap only the toppings this recipe wants.</p>
        </div>
        <div id="recipeTargets" class="recipe-targets"></div>
        <div id="toppingTray" class="topping-tray"></div>
      </div>
    `;

    const targets = this.leftContent.querySelector("#recipeTargets");
    this.recipe.requirements.forEach((entry) => {
      const chip = document.createElement("div");
      chip.className = "recipe-chip";
      chip.dataset.toppingId = entry.id;
      chip.innerHTML = `
        ${this.getToppingArtMarkup(entry.id)}
        <span>${this.getToppingName(entry.id)}</span>
        <span class="recipe-count">0/${entry.count}</span>
      `;
      targets.appendChild(chip);
    });

    const tray = this.leftContent.querySelector("#toppingTray");
    TOPPINGS.forEach((topping) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "topping-button";
      button.dataset.toppingId = topping.id;
      button.innerHTML = `
        ${this.getToppingArtMarkup(topping.id)}
        <span class="topping-name">${topping.name}</span>
      `;
      button.addEventListener("click", () => this.handleToppingTap(topping.id, button));
      tray.appendChild(button);
    });

    this.refreshRecipeTray();
  }

  refreshRecipeTray() {
    const targets = this.leftContent.querySelectorAll(".recipe-chip");
    targets.forEach((chip) => {
      const toppingId = chip.dataset.toppingId;
      const requirement = this.recipe.requirements.find((entry) => entry.id === toppingId);
      const currentCount = this.recipeCounts[toppingId] || 0;
      chip.querySelector(".recipe-count").textContent = `${currentCount}/${requirement.count}`;
      chip.classList.toggle("done", currentCount >= requirement.count);
    });

    const buttons = this.leftContent.querySelectorAll(".topping-button");
    buttons.forEach((button) => {
      const toppingId = button.dataset.toppingId;
      const requirement = this.recipe.requirements.find((entry) => entry.id === toppingId);
      const done = requirement && (this.recipeCounts[toppingId] || 0) >= requirement.count;
      button.classList.toggle("is-done", !!done);
      button.classList.toggle("is-correct", !!requirement);
    });
  }

  renderSaucePanel() {
    this.rightTitle.textContent = "Sauce Bottles";
    this.rightContent.innerHTML = `
      <div class="sauce-card">
        <p>Tap one bottle to cover the whole pizza.</p>
        <div class="sauce-bottles" id="sauceBottles"></div>
      </div>
    `;

    const container = this.rightContent.querySelector("#sauceBottles");
    SAUCES.forEach((sauce) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sauce-bottle";
      button.dataset.sauceId = sauce.id;
      button.innerHTML = `
        <div class="bottle-shape" style="--bottle-color:${sauce.color};"></div>
        <span class="bottle-label">${sauce.name}</span>
      `;
      button.addEventListener("click", () => this.handleSaucePick(sauce.id));
      container.appendChild(button);
    });
  }

  renderKidsPanel() {
    this.rightTitle.textContent = "Sharing Time";
    this.rightContent.innerHTML = "";
    this.kidPanel = new KidPanel(this.rightContent);
    if (this.assignments.length === 0) {
      this.assignments = this.createAssignments();
    }
    this.kidPanel.setup(this.assignments);
    this.updateKidPlacements();
  }

  updateKidPlacements() {
    if (!this.kidPanel) {
      return;
    }

    this.slices.filter((slice) => slice.placedKidId).forEach((slice) => {
      const kid = this.kidPanel.kids.find((entry) => entry.id === slice.placedKidId);
      if (kid && !kid.fed) {
        this.kidPanel.markFed(kid.id);
      }
    });
  }

  getToppingName(id) {
    const topping = TOPPINGS.find((entry) => entry.id === id);
    return topping ? topping.name : id;
  }

  getToppingArtMarkup(id) {
    return `<span class="topping-art topping-${id}"></span>`;
  }

  onBoardPointerDown(event) {
    this.audio.ensureContext();
    if (this.soundEnabled) {
      this.audio.startMusicLoop();
    }

    if (this.stage === STAGES.DOUGH) {
      const point = this.getLocalPoint(event);
      if (!this.isInsidePizza(point, this.renderer.pizzaRadius * 0.7)) {
        return;
      }

      this.pointerSession = {
        type: "rolling",
        pointerId: event.pointerId,
        lastPoint: point,
      };
      this.showRollingPin(point, -16);
      this.boardStack.setPointerCapture(event.pointerId);
      return;
    }

    if (this.stage === STAGES.CUTTING) {
      const point = this.getLocalPoint(event);
      if (!this.isInsidePizza(point, this.renderer.pizzaRadius * 1.24)) {
        return;
      }

      this.pointerSession = {
        type: "cutting",
        pointerId: event.pointerId,
        start: point,
        lastPoint: point,
      };
      this.cutPreview = { start: point, end: point };
      this.showKnifeTrail(point, point);
      this.boardStack.setPointerCapture(event.pointerId);
      this.render();
    }
  }

  onBoardPointerMove(event) {
    if (!this.pointerSession || this.pointerSession.pointerId !== event.pointerId) {
      return;
    }

    const point = this.getLocalPoint(event);

    if (this.pointerSession.type === "rolling") {
      const distance = distanceBetweenPoints(this.pointerSession.lastPoint, point);
      this.pointerSession.lastPoint = point;
      if (distance > 0) {
        this.doughProgress = clamp(this.doughProgress + distance / 520, 0, 1);
        const rotation = clamp(point.x - this.renderer.center.x, -120, 120) / 7;
        this.showRollingPin(point, rotation);
        this.audio.playRoll();
        this.render();
        if (this.doughProgress >= 1) {
          this.finishRolling();
        }
      }
      return;
    }

    if (this.pointerSession.type === "cutting") {
      this.pointerSession.lastPoint = point;
      this.cutPreview = { start: this.pointerSession.start, end: point };
      this.showKnifeTrail(this.pointerSession.start, point);
      this.render();
    }
  }

  onBoardPointerUp(event) {
    if (!this.pointerSession || this.pointerSession.pointerId !== event.pointerId) {
      return;
    }

    if (this.pointerSession.type === "rolling") {
      this.hideRollingPin();
      this.pointerSession = null;
      return;
    }

    if (this.pointerSession.type === "cutting") {
      const start = this.pointerSession.start;
      const end = this.getLocalPoint(event);
      this.pointerSession = null;
      this.hideKnifeTrail();
      this.handleCutRelease(start, end);
    }
  }

  onBoardPointerLeave(event) {
    if (!this.pointerSession || this.pointerSession.pointerId !== event.pointerId) {
      return;
    }

    if (this.pointerSession.type === "rolling") {
      this.hideRollingPin();
    }
  }

  cancelBoardPointer(event) {
    if (!this.pointerSession || this.pointerSession.pointerId !== event.pointerId) {
      return;
    }

    this.pointerSession = null;
    this.cutPreview = null;
    this.hideRollingPin();
    this.hideKnifeTrail();
    this.render();
  }

  finishRolling() {
    if (this.stage !== STAGES.DOUGH) {
      return;
    }

    this.pointerSession = null;
    this.rollingPin.classList.add("exit");
    this.showMessage("Smooth dough ready. Pick a sauce bottle!");
    window.setTimeout(() => {
      this.hideRollingPin();
      this.rollingPin.classList.remove("exit");
      this.stage = STAGES.SAUCE;
      this.updateUI(true);
      this.render();
    }, 520);
  }

  handleSaucePick(sauceId) {
    if (this.stage !== STAGES.SAUCE) {
      return;
    }

    this.sauceId = sauceId;
    this.audio.playSauce();
    const sauce = SAUCES.find((entry) => entry.id === sauceId);
    this.sauceSpread.style.setProperty("--spread-color", sauce.color);
    this.sauceSpread.classList.remove("active");
    void this.sauceSpread.offsetWidth;
    this.sauceSpread.classList.add("active");
    this.render();
    this.showMessage(`${sauce.name} sauce spread all over the pizza!`);
    this.rightContent.querySelectorAll(".sauce-bottle").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.sauceId === sauceId);
    });

    window.setTimeout(() => {
      this.stage = STAGES.TOPPINGS;
      this.updateUI(true);
      this.render();
      this.showMessage(`Make the ${this.recipe.name} recipe.`);
    }, 620);
  }

  handleToppingTap(toppingId, button) {
    if (this.stage !== STAGES.TOPPINGS) {
      return;
    }

    const requirement = this.recipe.requirements.find((entry) => entry.id === toppingId);
    if (!requirement) {
      this.audio.playWrong();
      button.classList.remove("is-wrong");
      void button.offsetWidth;
      button.classList.add("is-wrong");
      this.showMessage(`Not for this recipe. Use the picture clues.`);
      return;
    }

    const currentCount = this.recipeCounts[toppingId] || 0;
    if (currentCount >= requirement.count) {
      this.audio.playWrong();
      button.classList.remove("is-wrong");
      void button.offsetWidth;
      button.classList.add("is-wrong");
      this.showMessage(`You already added enough ${this.getToppingName(toppingId).toLowerCase()}.`);
      return;
    }

    const nextSpot = this.availableSpots.shift();
    if (!nextSpot) {
      return;
    }

    this.recipeCounts[toppingId] = currentCount + 1;
    this.toppings.push({
      id: toppingId,
      xRatio: nextSpot.xRatio,
      yRatio: nextSpot.yRatio,
      rotation: Math.random() * Math.PI * 2,
      scale: 0.9 + Math.random() * 0.16,
    });
    this.audio.playCorrectTopping();
    this.render();
    this.refreshRecipeTray();

    const boardPoint = {
      x: this.renderer.center.x + nextSpot.xRatio * this.renderer.pizzaRadius * 0.79,
      y: this.renderer.center.y + nextSpot.yRatio * this.renderer.pizzaRadius * 0.79,
    };
    this.spawnBurst(boardPoint, "#ffe56c", "star");
    this.showMessage(`${this.getToppingName(toppingId)} added!`);

    if (this.recipe.requirements.every((entry) => (this.recipeCounts[entry.id] || 0) >= entry.count)) {
      window.setTimeout(() => {
        this.stage = STAGES.CUTTING;
        this.updateUI(true);
        this.render();
        this.showMessage("Now cut along the green guides.");
      }, 420);
    }
  }

  handleCutRelease(start, end) {
    const result = this.evaluateCut(start, end);
    this.cutPreview = null;
    this.render();

    if (!result.accepted) {
      this.audio.playWrong();
      this.showMessage(result.message);
      return;
    }

    this.acceptedCuts.push(result.angle);
    this.acceptedCuts.sort((a, b) => a - b);
    this.audio.playCut();
    this.showMessage(result.message);
    this.updateUI();
    this.render();

    if (this.acceptedCuts.length === VALID_CUT_ANGLES.length) {
      window.setTimeout(() => {
        this.stage = STAGES.SHARING;
        this.assignments = this.createAssignments();
        this.updateUI(true);
        this.render();
        this.showMessage("Share the slices with the kids.");
      }, 380);
    }
  }

  evaluateCut(start, end) {
    const length = distanceBetweenPoints(start, end);
    const center = this.renderer.center;
    const radius = this.renderer.pizzaRadius;

    if (length < radius * 0.9) {
      return { accepted: false, message: "Draw a longer line right across the pizza." };
    }

    if (!segmentIntersectsCircle(start, end, center, radius)) {
      return { accepted: false, message: "Try again. The cut must cross the pizza." };
    }

    const centerDistance = distancePointToSegment(center, start, end);
    if (centerDistance > radius * 0.2) {
      return { accepted: false, message: "Cut closer to the middle guide." };
    }

    const rawAngle = normalizeLineAngle(Math.atan2(end.y - start.y, end.x - start.x));
    const nearestAngle = VALID_CUT_ANGLES.reduce((best, candidate) => {
      if (!best) {
        return { angle: candidate, diff: angleDifferenceModuloPi(rawAngle, candidate) };
      }
      const diff = angleDifferenceModuloPi(rawAngle, candidate);
      return diff < best.diff ? { angle: candidate, diff } : best;
    }, null);

    if (nearestAngle.diff > 0.28) {
      return { accepted: false, message: "Follow the green guide line a little closer." };
    }

    const alreadyUsed = this.acceptedCuts.some((cutAngle) => angleDifferenceModuloPi(cutAngle, nearestAngle.angle) < 0.001);
    if (alreadyUsed) {
      return { accepted: false, message: "That guide is already cut. Try another one." };
    }

    return {
      accepted: true,
      angle: nearestAngle.angle,
      message: `Great cut! ${this.acceptedCuts.length + 1} of 4 is done.`,
    };
  }

  createAssignments() {
    const sliceChoices = shuffle([...Array(FINAL_SLICE_COUNT).keys()]).slice(0, 4);
    return KIDS.map((kid, index) => ({
      ...kid,
      sliceIndex: sliceChoices[index],
    }));
  }

  getDisplayedSectors() {
    if (this.acceptedCuts.length === 0) {
      return [];
    }

    const rays = this.acceptedCuts
      .flatMap((angle) => [normalizeAngle(angle), normalizeAngle(angle + Math.PI)])
      .sort((a, b) => a - b);

    const sectors = [];
    for (let index = 0; index < rays.length; index += 1) {
      const start = rays[index];
      const end = index === rays.length - 1 ? rays[0] + Math.PI * 2 : rays[index + 1];
      const mid = start + (end - start) / 2;
      sectors.push({
        id: `${Math.round(start * 1000)}-${Math.round(end * 1000)}`,
        start,
        end,
        mid,
        sliceIndex: this.computeSliceIndex(mid),
      });
    }

    sectors.sort((a, b) => a.sliceIndex - b.sliceIndex);
    return sectors;
  }

  computeSliceIndex(midAngle) {
    const clockwiseFromTop = normalizeAngle(midAngle + Math.PI / 2);
    return Math.floor(clockwiseFromTop / (Math.PI / 4)) % FINAL_SLICE_COUNT;
  }

  refreshSlices() {
    const shouldShowSlices =
      (this.stage === STAGES.CUTTING && this.acceptedCuts.length > 0) ||
      this.stage === STAGES.SHARING ||
      this.stage === STAGES.COMPLETE;

    this.sliceLayer.style.pointerEvents = this.stage === STAGES.SHARING ? "auto" : "none";

    if (!shouldShowSlices) {
      this.sliceLayer.innerHTML = "";
      this.slices = [];
      return;
    }

    const placements = new Map(this.slices.filter((slice) => slice.placedKidId).map((slice) => [slice.sliceIndex, slice.placedKidId]));
    const sectors = this.getDisplayedSectors();
    this.sliceLayer.innerHTML = "";
    this.slices = sectors.map((sector) => this.createSlice(sector, placements.get(sector.sliceIndex) || null));
    this.slices.forEach((slice) => {
      this.sliceLayer.appendChild(slice.element);
      if (slice.placedKidId && this.kidPanel) {
        const kid = this.kidPanel.kids.find((entry) => entry.id === slice.placedKidId);
        if (kid) {
          this.positionSliceOnKid(slice, kid, true);
        }
      }
    });
  }

  createSlice(sector, placedKidId) {
    const radius = this.renderer.pizzaRadius;
    const pad = 20;
    const bounds = this.getSectorBounds(sector.start, sector.end, radius, pad);
    const dpr = window.devicePixelRatio || 1;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.ceil(bounds.width * dpr));
    canvas.height = Math.max(1, Math.ceil(bounds.height * dpr));
    canvas.style.width = `${bounds.width}px`;
    canvas.style.height = `${bounds.height}px`;
    canvas.className = "slice-piece";

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(-bounds.minX + pad, -bounds.minY + pad);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, sector.start, sector.end);
    ctx.closePath();
    ctx.clip();
    this.renderer.drawPizza(ctx, 0, 0, radius, this.getRenderState());
    ctx.restore();

    ctx.strokeStyle = "rgba(255,255,255,0.84)";
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, sector.start, sector.end);
    ctx.closePath();
    ctx.stroke();

    const distance = this.stage === STAGES.CUTTING ? 12 + this.acceptedCuts.length * 2 : 24;
    const homeOffset = pointFromAngle(sector.mid, distance);
    const slice = {
      id: sector.id,
      sliceIndex: sector.sliceIndex,
      element: canvas,
      baseLeft: this.renderer.center.x + bounds.minX - pad,
      baseTop: this.renderer.center.y + bounds.minY - pad,
      homeOffset,
      currentOffset: { ...homeOffset },
      placedKidId,
      sector,
    };

    canvas.style.left = `${slice.baseLeft}px`;
    canvas.style.top = `${slice.baseTop}px`;
    this.setSliceTransform(slice, slice.homeOffset.x, slice.homeOffset.y, placedKidId ? 0.7 : 1);

    if (this.stage === STAGES.SHARING && !placedKidId) {
      canvas.classList.add("is-draggable");
      canvas.addEventListener("pointerdown", (event) => this.startDraggingSlice(event, slice));
    } else if (placedKidId) {
      canvas.classList.add("is-placed");
    }

    return slice;
  }

  getSectorBounds(start, end, radius, pad) {
    const points = [
      { x: 0, y: 0 },
      pointFromAngle(start, radius),
      pointFromAngle(end, radius),
    ];

    [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].forEach((angle) => {
      if (angleWithinSector(angle, start, end)) {
        points.push(pointFromAngle(angle, radius));
      }
    });

    const minX = Math.min(...points.map((point) => point.x));
    const maxX = Math.max(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxY = Math.max(...points.map((point) => point.y));
    return {
      minX,
      minY,
      width: maxX - minX + pad * 2,
      height: maxY - minY + pad * 2,
    };
  }

  startDraggingSlice(event, slice) {
    if (this.stage !== STAGES.SHARING || slice.placedKidId) {
      return;
    }

    event.preventDefault();
    this.audio.playDrop();
    this.draggedSlice = {
      slice,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffsetX: slice.currentOffset.x,
      startOffsetY: slice.currentOffset.y,
    };
    slice.element.classList.add("is-dragging");
    slice.element.style.zIndex = "7";
    slice.element.setPointerCapture(event.pointerId);
    slice.element.addEventListener("pointermove", this.boundSliceMove || (this.boundSliceMove = (moveEvent) => this.onSlicePointerMove(moveEvent)));
    slice.element.addEventListener("pointerup", this.boundSliceUp || (this.boundSliceUp = (upEvent) => this.onSlicePointerUp(upEvent)));
    slice.element.addEventListener("pointercancel", this.boundSliceUp || (this.boundSliceUp = (upEvent) => this.onSlicePointerUp(upEvent)));
  }

  onSlicePointerMove(event) {
    if (!this.draggedSlice || this.draggedSlice.pointerId !== event.pointerId) {
      return;
    }

    const { slice, startClientX, startClientY, startOffsetX, startOffsetY } = this.draggedSlice;
    const dx = event.clientX - startClientX;
    const dy = event.clientY - startClientY;
    slice.currentOffset = { x: startOffsetX + dx, y: startOffsetY + dy };
    this.setSliceTransform(slice, slice.currentOffset.x, slice.currentOffset.y, 1.04);
    const targetKid = this.kidPanel ? this.kidPanel.findTarget(event.clientX, event.clientY) : null;
    if (this.kidPanel) {
      this.kidPanel.setHover(targetKid ? targetKid.id : null);
    }
  }

  onSlicePointerUp(event) {
    if (!this.draggedSlice || this.draggedSlice.pointerId !== event.pointerId) {
      return;
    }

    const { slice } = this.draggedSlice;
    slice.element.classList.remove("is-dragging");
    slice.element.style.zIndex = "4";
    slice.element.releasePointerCapture(event.pointerId);
    slice.element.removeEventListener("pointermove", this.boundSliceMove);
    slice.element.removeEventListener("pointerup", this.boundSliceUp);
    slice.element.removeEventListener("pointercancel", this.boundSliceUp);

    const targetKid = this.kidPanel ? this.kidPanel.findTarget(event.clientX, event.clientY) : null;
    if (this.kidPanel) {
      this.kidPanel.setHover(null);
    }

    if (targetKid && targetKid.sliceIndex === slice.sliceIndex) {
      this.audio.playSuccess();
      slice.placedKidId = targetKid.id;
      slice.element.classList.add("is-placed");
      this.positionSliceOnKid(slice, targetKid, false);
      this.kidPanel.markFed(targetKid.id);
      this.showMessage(`${targetKid.name} says Yum Yum!`);
      this.spawnBurst({
        x: this.renderer.center.x + slice.currentOffset.x + 20,
        y: this.renderer.center.y + slice.currentOffset.y,
      }, "#ffd85e", "star");

      if (this.kidPanel.allFed()) {
        this.finishSharing();
      }
    } else {
      if (targetKid) {
        this.audio.playWrong();
        this.showMessage("That slice belongs to a different kid.");
      }
      slice.placedKidId = null;
      slice.currentOffset = { ...slice.homeOffset };
      this.setSliceTransform(slice, slice.homeOffset.x, slice.homeOffset.y, 1);
    }

    this.draggedSlice = null;
  }

  positionSliceOnKid(slice, kid, skipSound) {
    const plateRect = kid.plate.getBoundingClientRect();
    const boardRect = this.boardStack.getBoundingClientRect();
    const sliceRect = slice.element.getBoundingClientRect();
    const targetX = plateRect.left + plateRect.width / 2 - boardRect.left - (slice.baseLeft + sliceRect.width / 2);
    const targetY = plateRect.top + plateRect.height / 2 - boardRect.top - (slice.baseTop + sliceRect.height / 2);
    slice.currentOffset = { x: targetX, y: targetY };
    this.setSliceTransform(slice, targetX, targetY, 0.7);
    if (!skipSound) {
      this.audio.playDrop();
    }
  }

  setSliceTransform(slice, x, y, scale) {
    slice.element.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  }

  finishSharing() {
    this.stage = STAGES.COMPLETE;
    this.audio.playCelebrate();
    this.showMessage("Hooray! Everyone got a yummy slice.");
    this.spawnCelebration();
    window.parent.postMessage({ type: "pizza-party-complete" }, "*");
    this.updateUI(true);
    this.render();
  }

  spawnBurst(point, color, variant = "") {
    for (let index = 0; index < 9; index += 1) {
      const piece = document.createElement("span");
      piece.className = `effect-piece${variant ? ` ${variant}` : ""}`;
      piece.style.left = `${point.x}px`;
      piece.style.top = `${point.y}px`;
      piece.style.setProperty("--burst-color", color);
      piece.style.setProperty("--dx", `${Math.cos((Math.PI * 2 * index) / 9) * (26 + Math.random() * 18)}px`);
      piece.style.setProperty("--dy", `${Math.sin((Math.PI * 2 * index) / 9) * (26 + Math.random() * 18)}px`);
      this.effectLayer.appendChild(piece);
      window.setTimeout(() => piece.remove(), 680);
    }
  }

  spawnCelebration() {
    this.celebrationLayer.innerHTML = "";
    const colors = ["#ffe569", "#ff8cb4", "#67d8ff", "#a2ef5c"];
    for (let index = 0; index < 28; index += 1) {
      const star = document.createElement("span");
      star.className = "celebration-star";
      star.style.left = `${12 + Math.random() * 76}%`;
      star.style.top = `${-8 - Math.random() * 10}%`;
      star.style.setProperty("--star-color", colors[index % colors.length]);
      star.style.setProperty("--from-x", `${Math.random() * 40 - 20}px`);
      star.style.setProperty("--to-x", `${Math.random() * 120 - 60}px`);
      star.style.setProperty("--to-y", `${180 + Math.random() * 160}px`);
      this.celebrationLayer.appendChild(star);
      window.setTimeout(() => star.remove(), 1400);
    }
  }

  getLocalPoint(event) {
    const rect = this.boardStack.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  isInsidePizza(point, radius = this.renderer.pizzaRadius) {
    return distanceBetweenPoints(point, this.renderer.center) <= radius;
  }

  showRollingPin(point, rotation) {
    this.rollingPin.classList.add("visible");
    this.rollingPin.style.left = `${point.x}px`;
    this.rollingPin.style.top = `${point.y}px`;
    this.rollingPin.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
  }

  hideRollingPin() {
    this.rollingPin.classList.remove("visible");
  }

  showKnifeTrail(start, end) {
    const length = distanceBetweenPoints(start, end);
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    this.knifeTrail.classList.remove("hidden");
    this.knifeTrail.style.left = `${start.x}px`;
    this.knifeTrail.style.top = `${start.y}px`;
    this.knifeTrail.style.width = `${Math.max(1, length)}px`;
    this.knifeTrail.style.transform = `rotate(${angle}rad)`;
  }

  hideKnifeTrail() {
    this.knifeTrail.classList.add("hidden");
  }

  showMessage(text) {
    window.clearTimeout(this.messageTimer);
    this.floatingMessage.textContent = text;
    this.floatingMessage.classList.add("visible");
    this.messageTimer = window.setTimeout(() => {
      this.floatingMessage.classList.remove("visible");
    }, 1850);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new PizzaGame();
});
