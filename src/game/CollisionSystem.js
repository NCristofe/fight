import { PUSH_DISTANCE, STAGE_LEFT, STAGE_RIGHT } from '../utils/constants.js';

export function rectsOverlap(a, b) {
  if (!a || !b) return false;
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Keeps the two fighters from standing on top of each other. */
export function separateFighters(p1, p2) {
  if (p1.health <= 0 || p2.health <= 0) return;
  const dx = p2.x - p1.x;
  const dist = Math.abs(dx);
  if (dist >= PUSH_DISTANCE || dist === 0) return;
  const overlap = (PUSH_DISTANCE - dist) / 2;
  const dir = dx >= 0 ? 1 : -1;
  p1.x = clampStage(p1.x - dir * overlap);
  p2.x = clampStage(p2.x + dir * overlap);
}

function clampStage(x) {
  return Math.max(STAGE_LEFT, Math.min(STAGE_RIGHT, x));
}
