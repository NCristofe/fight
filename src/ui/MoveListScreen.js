import { keyLabel } from '../utils/keyLabel.js';

const MOVES = [
  { label: 'Golpe Rapido', combo: (km) => keyLabel(km.punch), desc: 'Corte rapido, pouco dano' },
  { label: 'Golpe Forte', combo: (km) => `${keyLabel(km.down)} + ${keyLabel(km.punch)}`, desc: 'Corte pesado, lento, alto risco de critico' },
  { label: 'Estocada', combo: (km) => keyLabel(km.kick), desc: 'Investida com a ponta da espada' },
  { label: 'Golpe Baixo', combo: (km) => `${keyLabel(km.down)} + ${keyLabel(km.kick)}`, desc: 'Corte rente ao chao' },
  { label: 'Defesa', combo: (km) => keyLabel(km.block), desc: 'Segure para reduzir o dano recebido' },
  { label: 'Pular', combo: (km) => keyLabel(km.up), desc: '' },
  { label: 'Agachar', combo: (km) => keyLabel(km.down), desc: '' }
];

function buildMoveColumn(keymap) {
  const col = document.createElement('div');
  col.className = 'movelist-col';
  col.innerHTML = '<h3>VOCE</h3>';
  const table = document.createElement('div');
  table.className = 'movelist-table';
  MOVES.forEach((m) => {
    const row = document.createElement('div');
    row.className = 'movelist-row';
    row.innerHTML = `
      <span class="movelist-name">${m.label}</span>
      <span class="movelist-keys">${m.combo(keymap)}</span>
      <span class="movelist-desc">${m.desc}</span>
    `;
    table.appendChild(row);
  });
  col.appendChild(table);
  return col;
}

export class MoveListScreen {
  constructor(root, audio, settings, callbacks) {
    this.el = document.createElement('div');
    this.el.className = 'screen movelist-screen';
    this.el.innerHTML = `
      <div class="movelist-bg"></div>
      <h2>GOLPES</h2>
      <div class="movelist-body"></div>
      <div class="movelist-footer">
        <button data-action="back">VOLTAR</button>
        <button data-action="start">LUTAR!</button>
      </div>
    `;
    root.appendChild(this.el);

    const body = this.el.querySelector('.movelist-body');
    body.appendChild(buildMoveColumn(settings.keymap.p1));

    const rules = document.createElement('div');
    rules.className = 'movelist-col movelist-col--rules';
    rules.innerHTML = `
      <h3>GOLPE CRITICO</h3>
      <p>Um golpe critico causa mais dano e <strong>derruba a espada</strong> de quem foi atingido.</p>
      <p>Sem espada voce nao ataca e defende pior. Caminhe ate a espada caida para pega-la de volta.</p>
      <p>Isso vale para a CPU tambem.</p>
    `;
    body.appendChild(rules);

    this.el.querySelector('[data-action="back"]').addEventListener('click', () => {
      audio.sfx('back');
      callbacks.onBack();
    });
    const startBtn = this.el.querySelector('[data-action="start"]');
    startBtn.addEventListener('click', () => {
      audio.sfx('confirm');
      callbacks.onStart();
    });
    startBtn.focus();

    this.onKey = (e) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        audio.sfx('confirm');
        callbacks.onStart();
      }
    };
    window.addEventListener('keydown', this.onKey);
  }

  destroy() {
    window.removeEventListener('keydown', this.onKey);
    this.el.remove();
  }
}
