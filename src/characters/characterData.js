// Fighters are generic/identical stick figures (see CharacterSprite.js), so
// there is no character roster or selection anymore - createFighter() just
// stamps out two instances of the same template with different display
// names. Moves are shared (SWORD_MOVES below); CombatSystem/Character only
// read these generic fields, so tuning a move or adding a new one never
// touches the combat code - see README.md ("Como ajustar os golpes").

export const SWORD_MOVES = {
  slash: { name: 'Golpe Rapido', damage: 6, startup: 70, active: 80, recovery: 160, range: 82, critChance: 0.08 },
  heavySlash: { name: 'Golpe Forte', damage: 12, startup: 160, active: 100, recovery: 280, range: 92, critChance: 0.24 },
  thrust: { name: 'Estocada', damage: 8, startup: 90, active: 70, recovery: 200, range: 100, critChance: 0.12 },
  lowSlash: { name: 'Golpe Baixo', damage: 7, startup: 90, active: 80, recovery: 210, range: 86, critChance: 0.16 }
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
