import { FIXED_DT } from '../utils/constants.js';

export class GameLoop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.rafId = null;
    this.tick = this.tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  setPaused(paused) {
    this.paused = paused;
    if (!paused) this.lastTime = performance.now();
  }

  tick(now) {
    if (!this.running) return;
    let delta = (now - this.lastTime) / 1000;
    this.lastTime = now;
    delta = Math.min(delta, 0.25);

    if (!this.paused) {
      this.accumulator += delta;
      let steps = 0;
      while (this.accumulator >= FIXED_DT && steps < 8) {
        this.update(FIXED_DT, now);
        this.accumulator -= FIXED_DT;
        steps += 1;
      }
    }
    this.render(now);
    this.rafId = requestAnimationFrame(this.tick);
  }
}
