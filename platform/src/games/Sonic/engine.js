export const SONIC_MAX_LIVES = 5;

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
const FOOD_GOOD = 'good';
const FOOD_BAD = 'bad';
const PLAYER_SIZE_SMALL = 0;
const PLAYER_SIZE_NORMAL = 1;
const PLAYER_SIZE_BIG = 2;
const PLAYER_SIZE_SCALES = [0.82, 1, 1.16];

function makeGround() {
  return { x: 0, y: GROUND_Y, w: WORLD_WIDTH, h: WORLD_HEIGHT - GROUND_Y };
}

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

function createFood(x, y, kind, wobble) {
  return {
    x,
    y,
    kind,
    radius: kind === FOOD_GOOD ? 16 : 15,
    collected: false,
    wobble,
  };
}

function addFoodLine(target, startX, y, pattern, spacing) {
  for (let index = 0; index < pattern.length; index += 1) {
    target.push(createFood(startX + index * spacing, y, pattern[index], index * 0.4));
  }
}

function addFoodArc(target, centerX, centerY, radius, pattern, startAngle, endAngle) {
  const step = pattern.length === 1 ? 0 : (endAngle - startAngle) / (pattern.length - 1);
  for (let index = 0; index < pattern.length; index += 1) {
    const angle = startAngle + step * index;
    target.push(
      createFood(
        centerX + Math.cos(angle) * radius,
        centerY + Math.sin(angle) * radius,
        pattern[index],
        index * 0.45,
      ),
    );
  }
}

function buildLevelOneFoods() {
  const foods = [];
  addFoodLine(foods, 190, 394, [FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], 34);
  addFoodArc(foods, 650, 275, 76, [FOOD_GOOD, FOOD_GOOD, FOOD_BAD, FOOD_GOOD, FOOD_GOOD], Math.PI * 0.95, Math.PI * 0.05);
  addFoodLine(foods, 948, 322, [FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], 28);
  addFoodLine(foods, 1186, 220, [FOOD_BAD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], 32);
  addFoodArc(foods, 1538, 272, 84, [FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], Math.PI * 1.08, Math.PI * 0.02);
  addFoodLine(foods, 1768, 240, [FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_BAD], 34);
  addFoodArc(foods, 2215, 220, 88, [FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], Math.PI * 1.1, Math.PI * -0.08);
  addFoodLine(foods, 2468, 200, [FOOD_BAD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], 30);
  addFoodLine(foods, 2848, 288, [FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], 34);
  addFoodArc(foods, 3520, 214, 90, [FOOD_GOOD, FOOD_GOOD, FOOD_BAD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], Math.PI * 1.08, Math.PI * -0.08);
  addFoodLine(foods, 3924, 324, [FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], 32);
  return foods;
}

function buildLevelTwoFoods() {
  const foods = [];
  addFoodLine(foods, 210, 394, [FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], 32);
  addFoodArc(foods, 712, 262, 84, [FOOD_GOOD, FOOD_GOOD, FOOD_BAD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], Math.PI * 0.96, Math.PI * 0.04);
  addFoodLine(foods, 1010, 320, [FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], 28);
  addFoodLine(foods, 1256, 240, [FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_BAD], 30);
  addFoodArc(foods, 1720, 238, 82, [FOOD_BAD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], Math.PI * 1.02, Math.PI * -0.02);
  addFoodLine(foods, 2140, 282, [FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], 32);
  addFoodArc(foods, 2550, 188, 92, [FOOD_GOOD, FOOD_GOOD, FOOD_BAD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], Math.PI * 1.08, Math.PI * -0.08);
  addFoodLine(foods, 3040, 316, [FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_BAD], 32);
  addFoodLine(foods, 3520, 224, [FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], 30);
  addFoodArc(foods, 3908, 282, 84, [FOOD_GOOD, FOOD_BAD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], Math.PI * 0.95, Math.PI * 0.05);
  return foods;
}

function buildLevelThreeFoods() {
  const foods = [];
  addFoodLine(foods, 220, 394, [FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], 34);
  addFoodArc(foods, 660, 260, 78, [FOOD_GOOD, FOOD_GOOD, FOOD_BAD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], Math.PI * 0.96, Math.PI * 0.04);
  addFoodLine(foods, 1120, 178, [FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_BAD, FOOD_GOOD], 30);
  addFoodArc(foods, 1596, 208, 88, [FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_BAD, FOOD_GOOD, FOOD_GOOD], Math.PI * 1.04, Math.PI * -0.04);
  addFoodLine(foods, 2110, 236, [FOOD_GOOD, FOOD_BAD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], 30);
  addFoodArc(foods, 2520, 146, 96, [FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_BAD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], Math.PI * 1.08, Math.PI * -0.08);
  addFoodLine(foods, 3040, 200, [FOOD_BAD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], 30);
  addFoodArc(foods, 3500, 220, 86, [FOOD_GOOD, FOOD_GOOD, FOOD_BAD, FOOD_GOOD, FOOD_GOOD, FOOD_GOOD], Math.PI * 1.02, Math.PI * -0.02);
  addFoodLine(foods, 3940, 284, [FOOD_GOOD, FOOD_GOOD, FOOD_GOOD, FOOD_BAD, FOOD_GOOD], 30);
  return foods;
}

const LEVELS = [
  {
    solids: [
      makeGround(),
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
    ],
    springs: [
      { x: 952, y: 332, w: 76, h: 28 },
      { x: 2162, y: 292, w: 76, h: 28 },
      { x: 3170, y: 342, w: 76, h: 28 },
    ],
    spikes: [
      { x: 720, y: 414, w: 86, h: 34 },
      { x: 1348, y: 414, w: 84, h: 34 },
      { x: 1978, y: 414, w: 86, h: 34 },
      { x: 2750, y: 414, w: 108, h: 34 },
      { x: 3322, y: 414, w: 84, h: 34 },
      { x: 1544, y: 306, w: 58, h: 34 },
    ],
    checkpoints: [
      { x: 1270, y: 296 },
      { x: 2940, y: 296 },
    ],
    goal: { x: 4040, y: 272, w: 30, h: 176 },
    palmTrees: [260, 640, 1260, 2020, 2580, 3360, 3880],
    buildFoods: buildLevelOneFoods,
  },
  {
    solids: [
      makeGround(),
      { x: 300, y: 388, w: 140, h: 60 },
      { x: 560, y: 332, w: 190, h: 22 },
      { x: 960, y: 360, w: 150, h: 88 },
      { x: 1220, y: 284, w: 200, h: 22 },
      { x: 1600, y: 320, w: 160, h: 128 },
      { x: 1960, y: 336, w: 180, h: 22 },
      { x: 2360, y: 250, w: 190, h: 22 },
      { x: 2880, y: 360, w: 160, h: 88 },
      { x: 3280, y: 270, w: 190, h: 22 },
      { x: 3720, y: 320, w: 190, h: 128 },
    ],
    springs: [
      { x: 980, y: 332, w: 76, h: 28 },
      { x: 2390, y: 222, w: 76, h: 28 },
      { x: 3748, y: 292, w: 76, h: 28 },
    ],
    spikes: [
      { x: 820, y: 414, w: 84, h: 34 },
      { x: 1480, y: 414, w: 88, h: 34 },
      { x: 2200, y: 414, w: 96, h: 34 },
      { x: 3090, y: 414, w: 96, h: 34 },
      { x: 3478, y: 236, w: 60, h: 34 },
    ],
    checkpoints: [
      { x: 1440, y: 296 },
      { x: 3200, y: 296 },
    ],
    goal: { x: 4010, y: 272, w: 30, h: 176 },
    palmTrees: [220, 860, 1520, 2440, 3180, 3920],
    buildFoods: buildLevelTwoFoods,
  },
  {
    solids: [
      makeGround(),
      { x: 340, y: 388, w: 140, h: 60 },
      { x: 560, y: 316, w: 180, h: 22 },
      { x: 900, y: 250, w: 160, h: 22 },
      { x: 1120, y: 206, w: 180, h: 22 },
      { x: 1500, y: 290, w: 180, h: 22 },
      { x: 1920, y: 344, w: 180, h: 104 },
      { x: 2280, y: 236, w: 180, h: 22 },
      { x: 2700, y: 188, w: 180, h: 22 },
      { x: 3120, y: 292, w: 190, h: 156 },
      { x: 3460, y: 224, w: 190, h: 22 },
      { x: 3840, y: 340, w: 170, h: 108 },
    ],
    springs: [
      { x: 582, y: 288, w: 76, h: 28 },
      { x: 2308, y: 208, w: 76, h: 28 },
      { x: 3490, y: 196, w: 76, h: 28 },
    ],
    spikes: [
      { x: 760, y: 414, w: 88, h: 34 },
      { x: 1760, y: 414, w: 96, h: 34 },
      { x: 2108, y: 310, w: 58, h: 34 },
      { x: 2980, y: 414, w: 94, h: 34 },
      { x: 3664, y: 190, w: 58, h: 34 },
    ],
    checkpoints: [
      { x: 1380, y: 296 },
      { x: 3200, y: 296 },
    ],
    goal: { x: 4040, y: 272, w: 30, h: 176 },
    palmTrees: [260, 1180, 2060, 2860, 3600, 4100],
    buildFoods: buildLevelThreeFoods,
  },
];

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
    sizeTier: PLAYER_SIZE_NORMAL,
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
    this.levels = LEVELS;
    this.reset();
  }

  reset() {
    this.maxLives = SONIC_MAX_LIVES;
    this.loadLevel(0);
    this.clearControls();
  }

  loadLevel(levelIndex) {
    const level = this.levels[levelIndex];
    this.currentLevelIndex = levelIndex;
    this.player = createPlayer();
    this.elapsed = 0;
    this.phase = 'playing';
    this.cameraX = 0;
    this.flashTimer = 0;
    this.lives = this.maxLives;
    this.goodFoodEaten = 0;
    this.badFoodEaten = 0;
    this.solids = level.solids.map((solid) => ({ ...solid }));
    this.springs = level.springs.map((spring) => ({ ...spring }));
    this.spikes = level.spikes.map((spike) => ({ ...spike }));
    this.goal = { ...level.goal, activated: false };
    this.checkpoints = level.checkpoints.map((checkpoint) => ({ ...checkpoint, activated: false }));
    this.palmTrees = [...level.palmTrees];
    this.foods = level.buildFoods();
    this.updateCamera(true);
  }

  nextLevel() {
    if (this.currentLevelIndex >= this.levels.length - 1) return false;
    this.loadLevel(this.currentLevelIndex + 1);
    this.clearControls();
    return true;
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
    return !this.solids.some((solid) => rectsOverlap(rect, solidRect(solid)));
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

  hitPlayer(respawn = true) {
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
    if (!respawn) {
      this.player.invulnerable = 1.1;
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
    this.foods.forEach((food) => {
      food.wobble += dt * 5.4;
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
    for (const solid of this.solids) {
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
    for (const spring of this.springs) {
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
      for (const solid of this.solids) {
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
    for (const food of this.foods) {
      if (!food.collected && circleRectOverlap({ x: food.x, y: food.y + Math.sin(food.wobble) * 3, radius: food.radius }, hurtbox)) {
        food.collected = true;
        if (food.kind === FOOD_GOOD) {
          this.goodFoodEaten += 1;
          this.player.sizeTier = Math.min(PLAYER_SIZE_BIG, this.player.sizeTier + 1);
        } else {
          this.badFoodEaten += 1;
          if (this.player.sizeTier > PLAYER_SIZE_SMALL) {
            this.player.sizeTier -= 1;
          } else {
            this.hitPlayer(false);
          }
        }
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
      for (const spike of this.spikes) {
        if (rectsOverlap(hurtbox, { x: spike.x + 6, y: spike.y + 4, width: spike.w - 12, height: spike.h - 4 })) {
          this.hitPlayer();
          break;
        }
      }
    }

    if (this.phase === 'playing' && this.player.y > WORLD_HEIGHT + 180) this.hitPlayer();
    if (this.phase === 'playing' && rectsOverlap(hurtbox, { x: this.goal.x, y: this.goal.y, width: this.goal.w, height: this.goal.h })) {
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
    const canAdvanceLevel = this.phase === 'won' && this.currentLevelIndex < this.levels.length - 1;

    return {
      phase: this.phase,
      levelIndex: this.currentLevelIndex + 1,
      totalLevels: this.levels.length,
      goodFood: this.goodFoodEaten,
      badFood: this.badFoodEaten,
      sizeTier: this.player.sizeTier,
      lives: this.lives,
      maxLives: this.maxLives,
      canAdvanceLevel,
      canClaimSticker: this.phase === 'won' && !canAdvanceLevel,
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
    for (const solid of this.solids) drawSolid(ctx, solid);
    for (const treeX of this.palmTrees) drawPalmTree(ctx, treeX);
    for (const checkpoint of this.checkpoints) drawCheckpoint(ctx, checkpoint);
    drawGoal(ctx, this.goal);
    for (const spring of this.springs) drawSpring(ctx, spring);
    for (const spike of this.spikes) drawSpikes(ctx, spike);
    for (const food of this.foods) if (!food.collected) drawFood(ctx, food);
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

function drawFood(ctx, food) {
  ctx.save();
  ctx.translate(food.x, food.y + Math.sin(food.wobble) * 3);
  if (food.kind === FOOD_GOOD) {
    drawApple(ctx);
  } else {
    drawDonut(ctx);
  }
  ctx.restore();
}

function drawApple(ctx) {
  ctx.fillStyle = '#2f8f41';
  ctx.beginPath();
  ctx.ellipse(4, -16, 6, 12, -0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#6f3f1d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(2, -17);
  ctx.stroke();

  const appleBody = ctx.createRadialGradient(-3, -5, 4, 0, 0, 18);
  appleBody.addColorStop(0, '#ff9d8d');
  appleBody.addColorStop(0.6, '#ff5b44');
  appleBody.addColorStop(1, '#cf2415');
  ctx.fillStyle = appleBody;
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.bezierCurveTo(-14, -18, -20, -4, -16, 10);
  ctx.bezierCurveTo(-12, 20, -3, 23, 0, 19);
  ctx.bezierCurveTo(3, 23, 12, 20, 16, 10);
  ctx.bezierCurveTo(20, -4, 14, -18, 0, -13);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.34)';
  ctx.beginPath();
  ctx.ellipse(-6, -3, 5, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawDonut(ctx) {
  const donut = ctx.createLinearGradient(-18, -18, 18, 18);
  donut.addColorStop(0, '#f9d7a1');
  donut.addColorStop(1, '#d08b4b');
  ctx.fillStyle = donut;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.arc(0, 0, 7, 0, Math.PI * 2, true);
  ctx.fill('evenodd');

  ctx.strokeStyle = '#ff74a8';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, -1, 11, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();

  ctx.fillStyle = '#59d9ff';
  for (const sprinkle of [
    [-8, -6, 0.5],
    [-2, -9, 1.2],
    [6, -7, -0.3],
    [8, -1, 0.7],
    [-5, 3, -0.6],
  ]) {
    ctx.save();
    ctx.translate(sprinkle[0], sprinkle[1]);
    ctx.rotate(sprinkle[2]);
    ctx.fillRect(-1.5, -4, 3, 8);
    ctx.restore();
  }
}

function drawPlayer(ctx, player, maxSpeed) {
  const sizeScale = PLAYER_SIZE_SCALES[player.sizeTier] || 1;
  const centerX = player.x + player.width * 0.5;
  const centerY = player.y + player.height * 0.48;
  const alpha = player.invulnerable > 0 && Math.floor(player.invulnerable * 14) % 2 === 0 ? 0.44 : 1;
  const speedRatio = clamp(Math.abs(player.vx) / maxSpeed, 0, 1);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(6,18,31,0.22)';
  ctx.beginPath();
  ctx.ellipse(centerX + 8, GROUND_Y + 10, player.width * 0.42 * sizeScale, player.height * 0.14 * sizeScale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.translate(centerX, centerY - (sizeScale - 1) * 24);
  ctx.scale(sizeScale, sizeScale);
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
