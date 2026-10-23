export const ACTION_LABELS = {
  left: 'Esquerda',
  right: 'Direita',
  up: 'Pular',
  down: 'Agachar',
  punch: 'Soco',
  kick: 'Chute',
  block: 'Defesa'
};

const KEY_LABELS = {
  ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Space: 'Espaco'
};

export function keyLabel(code) {
  if (!code) return '-';
  if (KEY_LABELS[code]) return KEY_LABELS[code];
  return code.replace('Key', '').replace('Digit', '').replace('Arrow', '');
}
