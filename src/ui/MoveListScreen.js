import { keyLabel } from '../utils/keyLabel.js';

const MOVES = [
  { label: 'Jab', combo: (km) => keyLabel(km.punch), desc: 'Soco rapido e fraco' },
  { label: 'Gancho', combo: (km) => `${keyLabel(km.down)} + ${keyLabel(km.punch)}`, desc: 'Soco forte, mais lento' },
  { label: 'Chute Alto', combo: (km) => keyLabel(km.kick), desc: 'Chute de media distancia' },
  { label: 'Chute Baixo', combo: (km) => `${keyLabel(km.down)} + ${keyLabel(km.kick)}`, desc: 'Chute baixo, mais rapido' },
  { label: 'Defesa', combo: (km) => keyLabel(km.block), desc: 'Segure para reduzir o dano recebido' },
  { label: 'Pular', combo: (km) => keyLabel(km.up), desc: '' },
  { label: 'Agachar', combo: (km) => keyLabel(km.down), desc: '' }
];

function buildColumn(title, keymap) {
  const col = document.createElement('div');
  col.className = 'movelist-col';
  col.innerHTML = `<h3>${title}</h3>`;
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
    this.audio = audio;
    this.callbacks = callbacks;

    this.el = document.createElement('div');
    this.el.className = 'screen movelist-screen';
    this.el.innerHTML = `
      <div class="movelist-bg"></div>
      <h2>GOLPES BASICOS</h2>
      <div class="movelist-body"></div>
      <div class="movelist-footer">
        <button data-action="back">VOLTAR</button>
        <button data-action="start">LUTAR!</button>
      </div>
    `;
    root.appendChild(this.el);

    const body = this.el.querySelector('.movelist-body');
    body.appendChild(buildColumn('JOGADOR 1', settings.keymap.p1));
    if (!callbacks.isTraining) {
      body.appendChild(buildColumn('JOGADOR 2', settings.keymap.p2));
    } else {
      const cpuCol = document.createElement('div');
      cpuCol.className = 'movelist-col movelist-col--cpu';
      cpuCol.innerHTML = '<h3>CPU</h3><p>O adversario controlado pelo computador usa os mesmos golpes.</p>';
      body.appendChild(cpuCol);
    }

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
