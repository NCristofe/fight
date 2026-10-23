import { Storage } from '../utils/Storage.js';

const ACTION_LABELS = {
  left: 'Esquerda',
  right: 'Direita',
  up: 'Pular',
  down: 'Agachar',
  punch: 'Soco',
  kick: 'Chute',
  block: 'Defesa',
  special: 'Especial'
};

const KEY_LABELS = {
  ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Space: 'Espaco'
};

function keyLabel(code) {
  if (!code) return '-';
  if (KEY_LABELS[code]) return KEY_LABELS[code];
  return code.replace('Key', '').replace('Digit', '').replace('Arrow', '');
}

export class SettingsMenu {
  constructor(root, audio, settings, callbacks) {
    this.audio = audio;
    this.settings = settings;
    this.callbacks = callbacks;
    this.awaiting = null;
    this.build(root);
  }

  build(root) {
    this.el = document.createElement('div');
    this.el.className = 'screen settings-menu';
    this.el.innerHTML = `
      <div class="settings-bg"></div>
      <h2>CONFIGURACOES</h2>
      <div class="settings-body">
        <section class="settings-section">
          <h3>AUDIO</h3>
          <label>Musica <input type="range" min="0" max="1" step="0.05" data-setting="musicVolume" /></label>
          <label>Efeitos <input type="range" min="0" max="1" step="0.05" data-setting="sfxVolume" /></label>
        </section>
        <section class="settings-section">
          <h3>DIFICULDADE DA CPU</h3>
          <select data-setting="difficulty">
            <option value="facil">Facil</option>
            <option value="normal">Normal</option>
            <option value="dificil">Dificil</option>
          </select>
        </section>
        <section class="settings-section">
          <h3>CONTROLES</h3>
          <select data-setting="controlMode">
            <option value="auto">Automatico (deteccao de toque)</option>
            <option value="keyboard">Sempre teclado</option>
            <option value="touch">Sempre tela de toque</option>
          </select>
        </section>
        <section class="settings-section settings-keymap">
          <h3>TECLAS - JOGADOR 1</h3>
          <div class="keymap-grid" data-player="p1"></div>
          <h3>TECLAS - JOGADOR 2</h3>
          <div class="keymap-grid" data-player="p2"></div>
        </section>
      </div>
      <button class="settings-back" data-action="back">VOLTAR</button>
    `;
    root.appendChild(this.el);

    this.el.querySelector('[data-setting="musicVolume"]').value = this.settings.musicVolume;
    this.el.querySelector('[data-setting="sfxVolume"]').value = this.settings.sfxVolume;
    this.el.querySelector('[data-setting="difficulty"]').value = this.settings.difficulty;
    this.el.querySelector('[data-setting="controlMode"]').value = this.settings.controlMode;

    this.el.querySelector('[data-setting="musicVolume"]').addEventListener('input', (e) => {
      this.settings.musicVolume = Number(e.target.value);
      this.audio.setMusicVolume(this.settings.musicVolume);
      this.persist();
    });
    this.el.querySelector('[data-setting="sfxVolume"]').addEventListener('input', (e) => {
      this.settings.sfxVolume = Number(e.target.value);
      this.audio.setSfxVolume(this.settings.sfxVolume);
      this.audio.sfx('menu');
      this.persist();
    });
    this.el.querySelector('[data-setting="difficulty"]').addEventListener('change', (e) => {
      this.settings.difficulty = e.target.value;
      this.persist();
    });
    this.el.querySelector('[data-setting="controlMode"]').addEventListener('change', (e) => {
      this.settings.controlMode = e.target.value;
      this.persist();
      this.callbacks.onControlModeChange?.();
    });

    this.renderKeymap('p1');
    this.renderKeymap('p2');

    this.el.querySelector('[data-action="back"]').addEventListener('click', () => {
      this.audio.sfx('back');
      this.callbacks.onBack();
    });
  }

  renderKeymap(player) {
    const grid = this.el.querySelector(`.keymap-grid[data-player="${player}"]`);
    grid.innerHTML = '';
    const map = this.settings.keymap[player];
    Object.keys(map).forEach((action) => {
      const row = document.createElement('div');
      row.className = 'keymap-row';
      row.innerHTML = `<span>${ACTION_LABELS[action]}</span><button data-action="${action}">${keyLabel(map[action])}</button>`;
      row.querySelector('button').addEventListener('click', (e) => this.beginRemap(player, action, e.target));
      grid.appendChild(row);
    });
  }

  beginRemap(player, action, btn) {
    if (this.awaiting) return;
    btn.textContent = '...';
    this.awaiting = { player, action, btn };
    const handler = (e) => {
      e.preventDefault();
      this.settings.keymap[player][action] = e.code;
      btn.textContent = keyLabel(e.code);
      this.persist();
      this.callbacks.onKeymapChange?.();
      window.removeEventListener('keydown', handler, true);
      this.awaiting = null;
    };
    window.addEventListener('keydown', handler, true);
  }

  persist() {
    Storage.saveSettings(this.settings);
  }

  destroy() {
    this.el.remove();
  }
}
