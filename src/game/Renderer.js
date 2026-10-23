import { LOGICAL_WIDTH, LOGICAL_HEIGHT, GROUND_Y } from '../utils/constants.js';
import { drawCharacter, drawGroundSword } from '../characters/CharacterSprite.js';

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnImpact(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 180;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60,
        life: 260 + Math.random() * 200,
        maxLife: 460,
        size: 3 + Math.random() * 4,
        color
      });
    }
  }

  spawnDust(x, y, facing) {
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: x - facing * 10,
        y,
        vx: -facing * (40 + Math.random() * 60),
        vy: -30 - Math.random() * 40,
        life: 300,
        maxLife: 300,
        size: 5 + Math.random() * 4,
        color: 'rgba(200,190,160,0.6)'
      });
    }
  }

  /** Short streak lines flying out from a hit - the "impact" juice. */
  spawnSpark(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 240 + Math.random() * 260;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 140 + Math.random() * 100,
        maxLife: 220,
        length: 14 + Math.random() * 12,
        color
      });
    }
  }

  /** One expanding ring on a landed hit. */
  spawnRing(x, y, color) {
    this.particles.push({ type: 'ring', x, y, radius: 6, life: 220, maxLife: 220, color });
  }

  update(dt) {
    for (const p of this.particles) {
      if (p.type === 'ring') {
        p.life -= dt * 1000;
        continue;
      }
      if (p.type !== 'spark') p.vy += 500 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 1000;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  draw(ctx) {
    for (const p of this.particles) {
      const t = Math.max(0, p.life / p.maxLife);
      if (p.type === 'ring') {
        ctx.globalAlpha = t * 0.85;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + (1 - t) * 34, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'spark') {
        ctx.save();
        ctx.globalAlpha = t;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.globalAlpha = t;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = new ParticleSystem();
    this.trails = new Map();
    this.shakeMag = 0;
    this.shakeUntil = 0;
    this.shakeStart = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => this.resize());
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = this.canvas.parentElement;
    const availW = parent.clientWidth;
    const availH = parent.clientHeight;
    const scale = Math.min(availW / LOGICAL_WIDTH, availH / LOGICAL_HEIGHT);
    const cssW = LOGICAL_WIDTH * scale;
    const cssH = LOGICAL_HEIGHT * scale;
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    this.canvas.width = Math.round(LOGICAL_WIDTH * dpr);
    this.canvas.height = Math.round(LOGICAL_HEIGHT * dpr);
    this.dpr = dpr;
  }

  shake(magnitude, durationMs) {
    const now = performance.now();
    if (magnitude < this.shakeMag * this.shakeRemaining(now)) return;
    this.shakeMag = magnitude;
    this.shakeStart = now;
    this.shakeUntil = now + durationMs;
  }

  shakeRemaining(now) {
    if (now >= this.shakeUntil) return 0;
    return (this.shakeUntil - now) / (this.shakeUntil - this.shakeStart);
  }

  beginFrame(now = performance.now()) {
    const ctx = this.ctx;
    const k = this.shakeRemaining(now) * this.shakeMag;
    const ox = k ? (Math.random() - 0.5) * 2 * k : 0;
    const oy = k ? (Math.random() - 0.5) * 2 * k : 0;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, ox * this.dpr, oy * this.dpr);
    ctx.clearRect(-20, -20, LOGICAL_WIDTH + 40, LOGICAL_HEIGHT + 40);
  }

  drawArena(arena, t) {
    arena.draw(this.ctx, t);
  }

  drawFighter(fighter, now = performance.now()) {
    const pose = fighter.getRenderPose();
    const flash = fighter.flashTimer > 0;
    const tip = drawCharacter(this.ctx, fighter.x, fighter.y, fighter.facing, pose, { flash, hasSword: fighter.hasSword });
    this.updateTrail(fighter, tip, now);
  }

  // Records the blade tip while a swing is in its fast part, then fades it out.
  updateTrail(fighter, tip, now) {
    let trail = this.trails.get(fighter);
    if (!trail) {
      trail = [];
      this.trails.set(fighter, trail);
    }
    const move = fighter.activeMove;
    const swinging =
      tip &&
      move &&
      fighter.isAttacking() &&
      fighter.stateTime > move.startup * 0.3 &&
      fighter.stateTime < move.startup + move.active + 70;
    if (swinging) trail.push({ x: tip.x, y: tip.y, t: now });
    while (trail.length && now - trail[0].t > 170) trail.shift();
    if (trail.length < 2) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 1; i < trail.length; i++) {
      const life = 1 - (now - trail[i].t) / 170;
      if (life <= 0) continue;
      ctx.globalAlpha = life * 0.35;
      ctx.strokeStyle = '#bfe3ff';
      ctx.lineWidth = 16 * life;
      ctx.beginPath();
      ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x, trail[i].y);
      ctx.stroke();
      ctx.globalAlpha = life * 0.9;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6 * life;
      ctx.stroke();
    }
    ctx.restore();
  }

  drawSwordOnGround(x, now = performance.now()) {
    drawGroundSword(this.ctx, x, GROUND_Y, now);
  }

  drawShadow(fighter) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(fighter.x, GROUND_Y + 6, 34, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
