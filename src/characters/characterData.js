// Fighters are identical stick-figure swordsmen (see CharacterSprite.js).
// Move timings (ms) are matched to the keyframes in characterAnimations.js:
// startup + active + recovery == total travel time of the animation, and the
// blade reaches its contact pose inside the active window. If you retune a
// move here, retune its animation durations too.
//
// lunge = forward speed (px/s) applied during startup+active (footwork).
// critChance = chance a landed, unblocked hit is a critical (more damage and
// knocks the defender's sword away).

export const SWORD_MOVES = {
  slash: { name: 'Corte Rapido', damage: 6, startup: 90, active: 70, recovery: 170, range: 88, critChance: 0.08, lunge: 130 },
  heavySlash: { name: 'Golpe Descendente', damage: 13, startup: 170, active: 90, recovery: 300, range: 96, critChance: 0.26, lunge: 150 },
  thrust: { name: 'Estocada', damage: 8, startup: 90, active: 70, recovery: 200, range: 118, critChance: 0.12, lunge: 420 },
  lowSlash: { name: 'Rasteira', damage: 7, startup: 100, active: 80, recovery: 220, range: 92, critChance: 0.16, lunge: 110 },
  airSlash: { name: 'Golpe Aereo', damage: 8, startup: 70, active: 110, recovery: 170, range: 90, critChance: 0.14 }
};

const STATS = { maxHealth: 100, walkSpeed: 210, jumpVelocity: -760, strength: 1.0, defense: 1.0, weight: 1.0 };

export function createFighter(name) {
  return {
    id: 'guerreiro',
    name,
    stats: { ...STATS },
    moves: SWORD_MOVES
  };
}
