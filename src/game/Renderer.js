import { LOGICAL_WIDTH, LOGICAL_HEIGHT, GROUND_Y } from '../utils/constants.js';
import { drawCharacter } from '../characters/CharacterSprite.js';

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

  update(dt) {
    for (const p of this.particles) {
      p.vy += 500 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 1000;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = new ParticleSystem();
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

  beginFrame() {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
  }

  drawArena(arena, t) {
    arena.draw(this.ctx, t);
  }

  drawFighter(fighter) {
    const pose = fighter.getRenderPose();
    const flash = fighter.flashTimer > 0;
    drawCharacter(this.ctx, fighter.x, fighter.y, fighter.facing, pose, fighter.data.palette, fighter.data.prop, { flash });
  }

  drawProjectile(proj) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(proj.x, proj.y);
    ctx.fillStyle = proj.move.color || '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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
