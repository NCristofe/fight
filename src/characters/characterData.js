// Data-driven roster. Visuals are intentionally generic (plain black stick
// figures, see CharacterSprite.js) - what differs between fighters today is
// name/bio and the small stat spread in `stats`. Moves are a shared basic
// set for all fighters for now (see BASIC_MOVES below); CombatSystem and
// Character only read generic fields, so adding a new fighter or move never
// touches the combat code - see README.md ("Como adicionar personagens e golpes").
//
// IMPORTANT: these are fictional, satirical caricatures for a comedy fighting
// game. Names reference real public figures the way satirical shows do, but
// no biographical claim here is presented as fact, and no real likeness,
// photo or proprietary art is used - fighters are generic stick figures.

const BASIC_MOVES = {
  jab: { name: 'Jab', damage: 5, startup: 60, active: 70, recovery: 150, range: 72, energyGain: 5 },
  hook: { name: 'Gancho', damage: 9, startup: 140, active: 90, recovery: 260, range: 82, energyGain: 8 },
  highKick: { name: 'Chute Alto', damage: 8, startup: 110, active: 90, recovery: 240, range: 95, energyGain: 7 },
  lowKick: { name: 'Chute Baixo', damage: 7, startup: 90, active: 80, recovery: 200, range: 86, energyGain: 7 }
};

export const CHARACTERS = [
  {
    id: 'lula',
    name: 'Lula',
    title: 'O Estrategista',
    bio: 'Satira ficticia. Luta no corpo a corpo tatico, controlando o espaco com discursos e mobilizacoes.',
    stats: { maxHealth: 100, walkSpeed: 205, jumpVelocity: -750, strength: 1.0, defense: 1.0, weight: 1.05 },
    moves: BASIC_MOVES
  },
  {
    id: 'bolsonaro',
    name: 'Bolsonaro',
    title: 'O Capitao',
    bio: 'Satira ficticia. Luta com ataques fortes, investidas rapidas e pressao ofensiva constante.',
    stats: { maxHealth: 100, walkSpeed: 225, jumpVelocity: -770, strength: 1.08, defense: 0.95, weight: 1.0 },
    moves: BASIC_MOVES
  },
  {
    id: 'marina',
    name: 'Marina Silva',
    title: 'A Guardia',
    bio: 'Satira ficticia. Estilo defensivo, usa contra-ataques para punir o adversario.',
    stats: { maxHealth: 100, walkSpeed: 195, jumpVelocity: -740, strength: 0.95, defense: 1.12, weight: 0.95 },
    moves: BASIC_MOVES
  },
  {
    id: 'ciro',
    name: 'Ciro Gomes',
    title: 'O Combatente',
    bio: 'Satira ficticia. Agressivo e passional, encurta distancia rapido e ataca em sequencias intensas.',
    stats: { maxHealth: 100, walkSpeed: 215, jumpVelocity: -760, strength: 1.03, defense: 1.0, weight: 1.0 },
    moves: BASIC_MOVES
  }
];

export function getCharacterById(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}
