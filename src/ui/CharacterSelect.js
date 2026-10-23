import { CHARACTERS } from '../characters/characterData.js';
import { drawCharacter } from '../characters/CharacterSprite.js';
import { getAnimation } from '../characters/characterAnimations.js';

const COLS = Math.ceil(Math.sqrt(CHARACTERS.length));

function moveIndex(current, dir, total) {
  const cols = COLS;
  const rows = Math.ceil(total / cols);
  let row = Math.floor(current / cols);
  let col = current % cols;
  if (dir === 'left') col = (col - 1 + cols) % cols;
  if (dir === 'right') col = (col + 1) % cols;
  if (dir === 'up') row = (row - 1 + rows) % rows;
  if (dir === 'down') row = (row + 1) % rows;
  const idx = row * cols + col;
  return idx < total ? idx : current;
}

function paintPortrait(canvas, character, big = false) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const grad = ctx.createRadialGradient(w / 2, h * 0.55, 10, w / 2, h * 0.55, h * 0.65);
  grad.addColorStop(0, '#2a2a40');
  grad.addColorStop(1, '#101018');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  const idlePose = getAnimation('idle').frames[0].pose;
  const scale = big ? 1.5 : 1;
  ctx.save();
  ctx.scale(scale, scale);
  drawCharacter(ctx, w / scale / 2, h / scale - 14, 1, idlePose);
  ctx.restore();
}

export class CharacterSelect {
  constructor(root, audio, mode, callbacks) {
    this.audio = audio;
    this.mode = mode; // 'versus' | 'training' | 'gallery'
    this.callbacks = callbacks;
    this.p1Index = 0;
    this.p2Index = Math.min(1, CHARACTERS.length - 1);
    this.p1Confirmed = false;
    this.p2Confirmed = this.mode !== 'versus';
    this.cpuThinking = false;
    this.input = null;
    this.prev = { p1: {}, p2: {} };
    this.build(root);
    this.updateAll();
  }

  setInput(input) {
    this.input = input;
  }

  build(root) {
    this.el = document.createElement('div');
    this.el.className = 'screen char-select';
    this.el.innerHTML = `
      <div class="cs-bg"></div>
      <h2 class="cs-title">${this.mode === 'gallery' ? 'PERSONAGENS' : 'SELECIONE SEU LUTADOR'}</h2>
      <div class="cs-body">
        <div class="cs-grid"></div>
        <div class="cs-detail">
          <canvas class="cs-portrait" width="200" height="260"></canvas>
          <div class="cs-info">
            <h3 class="cs-name"></h3>
            <p class="cs-title-text"></p>
            <p class="cs-bio"></p>
          </div>
        </div>
      </div>
      <div class="cs-players">
        <span class="cs-player-tag cs-player-tag--p1">JOGADOR 1</span>
        ${this.mode === 'versus' ? '<span class="cs-player-tag cs-player-tag--p2">JOGADOR 2</span>' : ''}
        ${this.mode === 'training' ? '<span class="cs-player-tag cs-player-tag--p2">CPU</span>' : ''}
      </div>
      <div class="cs-footer">
        <button data-action="back">VOLTAR</button>
        ${this.mode !== 'gallery' ? '<button data-action="confirm">CONFIRMAR</button>' : ''}
      </div>
    `;
    root.appendChild(this.el);

    this.gridEl = this.el.querySelector('.cs-grid');
    CHARACTERS.forEach((ch, i) => {
      const tile = document.createElement('button');
      tile.className = 'cs-tile';
      tile.dataset.index = i;
      tile.innerHTML = `<canvas width="120" height="150"></canvas><span>${ch.name}</span>`;
      paintPortrait(tile.querySelector('canvas'), ch);
      tile.addEventListener('click', () => {
        this.p1Index = i;
        this.audio.sfx('select');
        this.updateAll();
      });
      tile.addEventListener('mouseenter', () => this.audio.sfx('select'));
      this.gridEl.appendChild(tile);
    });

    this.el.querySelector('[data-action="back"]').addEventListener('click', () => {
      this.audio.sfx('back');
      this.callbacks.onBack();
    });
    const confirmBtn = this.el.querySelector('[data-action="confirm"]');
    confirmBtn?.addEventListener('click', () => {
      this.p1Confirmed = true;
      this.audio.sfx('confirm');
      this.tryFinish();
    });
  }

  edgePressed(playerKey, input, field) {
    const prev = this.prev[playerKey];
    const pressed = input[field] && !prev[field];
    prev[field] = input[field];
    return pressed;
  }

  handlePlayer(playerKey, playerIdx, confirmedFlagName) {
    if (!this.input) return;
    const input = this.input.pollPlayer(playerIdx);
    if (this[confirmedFlagName]) {
      if (this.edgePressed(playerKey, input, 'kickPressed')) {
        this[confirmedFlagName] = false;
        this.audio.sfx('back');
      }
      return;
    }
    const total = CHARACTERS.length;
    const indexProp = playerKey === 'p1' ? 'p1Index' : 'p2Index';
    if (this.edgePressed(playerKey, input, 'left')) {
      this[indexProp] = moveIndex(this[indexProp], 'left', total);
      this.audio.sfx('select');
    } else if (this.edgePressed(playerKey, input, 'right')) {
      this[indexProp] = moveIndex(this[indexProp], 'right', total);
      this.audio.sfx('select');
    } else if (this.edgePressed(playerKey, input, 'up')) {
      this[indexProp] = moveIndex(this[indexProp], 'up', total);
      this.audio.sfx('select');
    } else if (this.edgePressed(playerKey, input, 'down')) {
      this[indexProp] = moveIndex(this[indexProp], 'down', total);
      this.audio.sfx('select');
    }
    if (this.edgePressed(playerKey, input, 'punchPressed')) {
      this[confirmedFlagName] = true;
      this.audio.sfx('confirm');
    }
  }

  update() {
    if (this.mode === 'gallery') {
      this.handlePlayer('p1', 0, 'p1Confirmed');
      this.p1Confirmed = false; // gallery never "locks", punch just browses
      this.updateAll();
      return;
    }
    this.handlePlayer('p1', 0, 'p1Confirmed');
    if (this.mode === 'versus') {
      this.handlePlayer('p2', 1, 'p2Confirmed');
    }
    this.updateAll();
    this.tryFinish();
  }

  tryFinish() {
    if (this.mode === 'gallery') return;
    if (this.p1Confirmed && this.mode === 'training' && !this.cpuThinking) {
      this.cpuThinking = true;
      const choices = CHARACTERS.filter((c) => c.id !== CHARACTERS[this.p1Index].id);
      const cpuPick = choices[Math.floor(Math.random() * choices.length)] || CHARACTERS[this.p2Index];
      this.p2Index = CHARACTERS.indexOf(cpuPick);
      setTimeout(() => {
        this.p2Confirmed = true;
        this.updateAll();
        this.finish();
      }, 650);
    } else if (this.p1Confirmed && this.p2Confirmed && this.mode === 'versus') {
      this.finish();
    }
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    this.callbacks.onConfirm(CHARACTERS[this.p1Index].id, CHARACTERS[this.p2Index].id);
  }

  updateAll() {
    const tiles = [...this.gridEl.querySelectorAll('.cs-tile')];
    tiles.forEach((tile, i) => {
      tile.classList.toggle('cursor-p1', i === this.p1Index);
      tile.classList.toggle('cursor-p2', this.mode !== 'gallery' && i === this.p2Index);
      tile.classList.toggle('locked-p1', i === this.p1Index && this.p1Confirmed);
      tile.classList.toggle('locked-p2', i === this.p2Index && this.p2Confirmed && this.mode === 'versus');
    });

    const focusChar = CHARACTERS[this.p1Index];
    paintPortrait(this.el.querySelector('.cs-portrait'), focusChar, true);
    this.el.querySelector('.cs-name').textContent = focusChar.name;
    this.el.querySelector('.cs-title-text').textContent = focusChar.title;
    this.el.querySelector('.cs-bio').textContent = focusChar.bio;

    if (this.mode === 'training' && this.cpuThinking && !this.p2Confirmed) {
      this.el.querySelector('.cs-title').textContent = 'CPU ESCOLHENDO...';
    }
  }

  destroy() {
    this.el.remove();
  }
}
