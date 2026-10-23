// Data-driven roster. Everything that makes a fighter unique lives here:
// stats, move names/damage/costs and visual palette/prop. CombatSystem and
// Character only read generic fields, so adding a new fighter never touches
// the combat code - see README.md ("Como adicionar personagens e golpes").
//
// IMPORTANT: these are fictional, satirical caricatures for a comedy fighting
// game. Names reference real public figures the way satirical shows do, but
// no biographical claim here is presented as fact, and no real likeness,
// photo or proprietary art is used - fighters are original stylized shapes.

export const CHARACTERS = [
  {
    id: 'lula',
    name: 'Lula',
    title: 'O Estrategista',
    bio: 'Satira ficticia. Luta no corpo a corpo tatico, controlando o espaco com discursos e mobilizacoes.',
    palette: { primary: '#c0392b', secondary: '#f1c40f', skin: '#c99a73', accent: '#ecf0f1' },
    prop: 'hair_gray',
    stats: { maxHealth: 100, walkSpeed: 205, jumpVelocity: -750, strength: 1.0, defense: 1.0, weight: 1.05 },
    moves: {
      punch: { id: 'jab_articulado', name: 'Jab Articulado', damage: 6, startup: 80, active: 80, recovery: 180, range: 78, energyGain: 6 },
      kick: { id: 'chute_tatico', name: 'Chute Tatico', damage: 9, startup: 110, active: 90, recovery: 260, range: 92, energyGain: 8 },
      special1: { id: 'discurso_poderoso', name: 'Discurso Poderoso', damage: 14, startup: 160, active: 220, recovery: 300, range: 320, energyCost: 40, projectile: true, color: '#f1c40f' },
      special2: { id: 'debate_acirrado', name: 'Debate Acirrado', damage: 18, hits: 3, startup: 120, active: 260, recovery: 280, range: 110, energyCost: 60, dash: true },
      super: { id: 'mobilizacao_popular', name: 'Mobilizacao Popular', damage: 34, startup: 220, active: 300, recovery: 360, range: 180, energyCost: 100, aoe: true, color: '#f39c12' }
    }
  },
  {
    id: 'bolsonaro',
    name: 'Bolsonaro',
    title: 'O Capitao',
    bio: 'Satira ficticia. Luta com ataques fortes, investidas rapidas e pressao ofensiva constante.',
    palette: { primary: '#1e8449', secondary: '#f4d03f', skin: '#d8ad85', accent: '#ecf0f1' },
    prop: 'cap_green',
    stats: { maxHealth: 100, walkSpeed: 225, jumpVelocity: -770, strength: 1.08, defense: 0.95, weight: 1.0 },
    moves: {
      punch: { id: 'direto_capitao', name: 'Direto de Capitao', damage: 7, startup: 70, active: 80, recovery: 170, range: 76, energyGain: 6 },
      kick: { id: 'chute_bota', name: 'Chute de Bota', damage: 8, startup: 100, active: 90, recovery: 240, range: 90, energyGain: 8 },
      special1: { id: 'motociata', name: 'Motociata', damage: 16, startup: 120, active: 220, recovery: 260, range: 260, energyCost: 40, dash: true, color: '#f4d03f' },
      special2: { id: 'grito_de_guerra', name: 'Grito de Guerra', damage: 16, startup: 140, active: 180, recovery: 260, range: 150, energyCost: 60, shockwave: true },
      super: { id: 'ordem_e_progresso', name: 'Ordem e Progresso', damage: 36, hits: 4, startup: 200, active: 320, recovery: 360, range: 140, energyCost: 100, color: '#27ae60' }
    }
  },
  {
    id: 'marina',
    name: 'Marina Silva',
    title: 'A Guardia',
    bio: 'Satira ficticia. Estilo defensivo, usa contra-ataques e rajadas de vento para punir o adversario.',
    palette: { primary: '#117a65', secondary: '#a9dfbf', skin: '#8d6447', accent: '#f4d03f' },
    prop: 'braids',
    stats: { maxHealth: 100, walkSpeed: 195, jumpVelocity: -740, strength: 0.95, defense: 1.12, weight: 0.95 },
    moves: {
      punch: { id: 'golpe_sustentavel', name: 'Golpe Sustentavel', damage: 6, startup: 85, active: 80, recovery: 190, range: 76, energyGain: 7 },
      kick: { id: 'chute_verde', name: 'Chute Verde', damage: 8, startup: 110, active: 90, recovery: 250, range: 90, energyGain: 8 },
      special1: { id: 'vento_amazonia', name: 'Vento da Amazonia', damage: 13, startup: 170, active: 240, recovery: 300, range: 340, energyCost: 40, projectile: true, color: '#a9dfbf' },
      special2: { id: 'barreira_ambiental', name: 'Barreira Ambiental', damage: 15, startup: 60, active: 260, recovery: 300, range: 90, energyCost: 55, counter: true },
      super: { id: 'forca_da_natureza', name: 'Forca da Natureza', damage: 33, startup: 220, active: 300, recovery: 360, range: 190, energyCost: 100, aoe: true, color: '#1abc9c' }
    }
  },
  {
    id: 'ciro',
    name: 'Ciro Gomes',
    title: 'O Combatente',
    bio: 'Satira ficticia. Agressivo e passional, encurta distancia rapido e ataca em sequencias intensas.',
    palette: { primary: '#2980b9', secondary: '#ecf0f1', skin: '#c99a73', accent: '#e67e22' },
    prop: 'hair_dark',
    stats: { maxHealth: 100, walkSpeed: 215, jumpVelocity: -760, strength: 1.03, defense: 1.0, weight: 1.0 },
    moves: {
      punch: { id: 'jab_fluminense', name: 'Jab Fluminense', damage: 7, startup: 75, active: 80, recovery: 175, range: 78, energyGain: 6 },
      kick: { id: 'chute_firme', name: 'Chute Firme', damage: 9, startup: 105, active: 90, recovery: 250, range: 90, energyGain: 8 },
      special1: { id: 'bate_boca', name: 'Bate-Boca', damage: 14, startup: 140, active: 220, recovery: 280, range: 300, energyCost: 40, projectile: true, color: '#ecf0f1' },
      special2: { id: 'climao_no_debate', name: 'Climao no Debate', damage: 17, startup: 110, active: 200, recovery: 270, range: 130, energyCost: 58, dash: true },
      super: { id: 'discurso_inflamado', name: 'Discurso Inflamado', damage: 35, hits: 3, startup: 210, active: 300, recovery: 360, range: 160, energyCost: 100, color: '#5dade2' }
    }
  }
];

export function getCharacterById(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
}
