import { GROUND_Y, STAGE_LEFT, STAGE_RIGHT, GRAVITY, MAX_ENERGY } from '../utils/constants.js';
import { getAnimation } from './characterAnimations.js';
import { interpolateFrame, lerpPose } from './CharacterSprite.js';

let nextAttackId = 1;

const ATTACK_STATES = new Set(['slash', 'heavySlash', 'thrust', 'lowSlash', 'airSlash']);
const BUSY_STATES = new Set(['slash', 'heavySlash', 'thrust', 'lowSlash', 'airSlash', 'hitstun', 'stunned']);

// Where each move's hitbox sits vertically (purely cosmetic/flavor for
// now - block still stops all of them the same way; see README if that
// changes later).
const HIT_HEIGHT = {
  slash: { y: 100, h: 65 },
  heavySlash: { y: 95, h: 75 },
  thrust: { y: 100, h: 55 },
  lowSlash: { y: 55, h: 55 },
  airSlash: { y: 90, h: 80 }
};

export class Character {
  constructor(data, { playerIndex, x, facing, isAI = false, difficulty = 'normal' }) {
    this.data = data;
    this.playerIndex = playerIndex;
    this.isAI = isAI;
    this.difficulty = difficulty;

    this.x = x;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.grounded = true;
    this.hasSword = true;

    this.maxHealth = data.stats.maxHealth;
    this.health = this.maxHealth;
    this.maxEnergy = MAX_ENERGY;
    this.energy = 0;

    this.state = 'idle';
    this.stateTime = 0;
    this.animElapsed = 0;

    this.activeMoveKey = null;
    this.activeMove = null;
    this.hitsLandedThisAttack = 0;
    this.hitInvulnerable = false;
    this.flashTimer = 0;
    this.comboCount = 0;
    this.lastHitLandedAt = -Infinity;
    this.roundsWon = 0;
    this.koAnimPlayed = false;

    this.events = [];
    this.facingLocked = false;
  }

  canAct() {
    return this.grounded && !BUSY_STATES.has(this.state);
  }

  isAttacking() {
    return ATTACK_STATES.has(this.state);
  }

  setState(state) {
    if (this.state === state) return;
    this.state = state;
    this.stateTime = 0;
    this.animElapsed = 0;
    if (!this.isAttacking()) {
      this.activeMoveKey = null;
      this.activeMove = null;
      this.hitsLandedThisAttack = 0;
    }
  }

  startAttack(key) {
    const move = this.data.moves[key];
    if (!move) return;
    this.setState(key);
    this.activeMoveKey = key;
    this.activeMove = move;
    this.hitsLandedThisAttack = 0;
    this.attackId = nextAttackId++;
    if (key !== 'airSlash') this.vx = 0;
    this.events.push({ type: 'sfx', sound: key });
  }

  isHitActive() {
    if (!this.isAttacking() || !this.activeMove) return false;
    return this.stateTime >= this.activeMove.startup && this.stateTime < this.activeMove.startup + this.activeMove.active;
  }

  currentPulseIndex() {
    if (!this.activeMove) return -1;
    const hits = this.activeMove.hits || 1;
    const progress = this.stateTime - this.activeMove.startup;
    const slice = this.activeMove.active / hits;
    return Math.min(hits - 1, Math.floor(progress / slice));
  }

  getHurtbox() {
    const crouch = this.state === 'crouch';
    const h = crouch ? 95 : 150;
    const w = 56;
    return { x: this.x - w / 2, y: this.y - h, w, h };
  }

  getHitbox() {
    if (!this.isHitActive() || !this.activeMove) return null;
    const range = this.activeMove.range;
    const w = Math.min(range, 120);
    const originX = this.x + (this.facing > 0 ? 20 : -20 - w);
    const hb = HIT_HEIGHT[this.activeMoveKey] || { y: 120, h: 70 };
    return { x: originX, y: this.y - hb.y, w, h: hb.h };
  }

  receiveHit(move, attackerFacing, { blocked = false } = {}) {
    const defenseFactor = this.data.stats.defense;
    let damage = move.damage * defenseFactor;
    let critical = false;
    if (blocked) {
      damage *= this.hasSword ? 0.12 : 0.4;
      this.energy = Math.min(this.maxEnergy, this.energy + 4);
      this.events.push({ type: 'sfx', sound: 'block' });
      this.flashTimer = 80;
      this.vx = -attackerFacing * 70;
    } else {
      critical = this.hasSword && Math.random() < (move.critChance || 0);
      if (critical) damage *= 1.4;
      this.energy = Math.min(this.maxEnergy, this.energy + 10);
      this.setState('hitstun');
      this.vx = -attackerFacing * (critical ? 220 : 160);
      this.flashTimer = critical ? 180 : 120;
      this.events.push({ type: 'sfx', sound: 'hit' });
      const now = performance.now();
      if (now - this.lastHitLandedAt < 1400) this.comboCount += 1;
      else this.comboCount = 1;
      this.lastHitLandedAt = now;
      if (critical) this.disarm();
    }
    this.health = Math.max(0, this.health - damage);
    if (this.health <= 0) {
      this.setState('lose');
    }
    return { damage, critical };
  }

  update(dt, input, opponent) {
    this.events.length = 0;
    this.stateTime += dt * 1000;
    this.animElapsed += dt * 1000;
    if (this.flashTimer > 0) this.flashTimer -= dt * 1000;

    if (this.health <= 0) {
      this.vx *= 0.9;
      this.x += this.vx * dt;
      this.clampToStage();
      return;
    }

    // auto-face opponent unless mid-attack/hitstun
    if (!BUSY_STATES.has(this.state) && opponent) {
      this.facing = opponent.x >= this.x ? 1 : -1;
    }

    if (this.state === 'hitstun') {
      this.vx *= 0.85;
      if (this.stateTime > 320) this.setState('idle');
    } else if (this.state === 'stunned') {
      if (this.stateTime > 900) this.setState('idle');
    } else if (this.isAttacking()) {
      const move = this.activeMove;
      if (move) {
        const total = move.startup + move.active + move.recovery;
        if (move.lunge && this.stateTime < move.startup + move.active) {
          this.vx = this.facing * move.lunge;
        } else if (this.grounded) {
          this.vx *= 0.8;
        }
        if (this.stateTime >= total) this.setState(this.grounded ? 'idle' : 'jump');
      } else {
        this.setState('idle');
      }
    } else {
      this.handleFreeInput(input);
    }

    // physics
    if (!this.grounded) {
      this.vy += GRAVITY * dt;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.y >= GROUND_Y) {
      this.y = GROUND_Y;
      if (!this.grounded) {
        this.grounded = true;
        this.vy = 0;
        if (this.state === 'jump' || this.state === 'airSlash') this.setState('idle');
      }
    }
    this.clampToStage();
  }

  handleFreeInput(input) {
    if (!this.grounded) {
      if (input.punchPressed && this.hasSword && this.state === 'jump') this.startAttack('airSlash');
      return;
    }

    if (input.upPressed && this.canAct()) {
      this.vy = this.data.stats.jumpVelocity;
      this.grounded = false;
      this.setState('jump');
      return;
    }

    if (input.punchPressed && this.canAct() && this.hasSword) {
      this.startAttack(input.down ? 'heavySlash' : 'slash');
      return;
    }
    if (input.kickPressed && this.canAct() && this.hasSword) {
      this.startAttack(input.down ? 'lowSlash' : 'thrust');
      return;
    }

    if (input.block) {
      this.setState('block');
      this.vx = 0;
      return;
    }

    if (input.down) {
      this.setState('crouch');
      this.vx = 0;
      return;
    }

    const speed = this.data.stats.walkSpeed;
    if (input.left && !input.right) {
      this.vx = -speed;
      this.setState(this.facing > 0 ? 'walk_back' : 'walk_forward');
    } else if (input.right && !input.left) {
      this.vx = speed;
      this.setState(this.facing > 0 ? 'walk_forward' : 'walk_back');
    } else {
      this.vx = 0;
      this.setState('idle');
    }
  }

  clampToStage() {
    this.x = Math.max(STAGE_LEFT, Math.min(STAGE_RIGHT, this.x));
  }

  getRenderPose() {
    if (this.state === 'jump') {
      const rise = getAnimation('jump').frames[0].pose;
      const fall = getAnimation('fall').frames[0].pose;
      return lerpPose(rise, fall, Math.max(0, Math.min(1, (this.vy + 250) / 500)));
    }
    const anim = getAnimation(this.state);
    const { pose } = interpolateFrame(anim, this.animElapsed);
    return pose;
  }

  reset(x, facing) {
    this.x = x;
    this.y = GROUND_Y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.grounded = true;
    this.hasSword = true;
    this.flashTimer = 0;
    this.health = this.maxHealth;
    this.energy = 0;
    this.comboCount = 0;
    this.setState('idle');
  }

  disarm() {
    if (!this.hasSword) return;
    this.hasSword = false;
    this.events.push({ type: 'disarmed', x: this.x, y: GROUND_Y - 90 });
    this.events.push({ type: 'sfx', sound: 'disarm' });
  }

  pickUpSword() {
    this.hasSword = true;
    this.events.push({ type: 'sfx', sound: 'pickup' });
  }
}
