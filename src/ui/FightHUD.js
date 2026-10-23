import { ROUNDS_TO_WIN } from '../utils/constants.js';

export class FightHUD {
  constructor(root, p1, p2, round, callbacks) {
    this.p1 = p1;
    this.p2 = p2;
    this.round = round;
    this.callbacks = callbacks;
    this.paused = false;
    this.matchEndShown = false;
    this.root = root;

    this.el = document.createElement('div');
    this.el.className = 'fight-hud';
    this.el.innerHTML = `
      <div class="hud-top">
        <div class="hud-player hud-player--p1">
          <div class="hud-name">${p1.data.name}</div>
          <div class="health-bar"><div class="health-fill" data-p="1"></div></div>
          <div class="round-pips" data-p="1"></div>
        </div>
        <div class="hud-center">
          <div class="hud-timer">60</div>
        </div>
        <div class="hud-player hud-player--p2">
          <div class="hud-name">${p2.data.name}</div>
          <div class="health-bar"><div class="health-fill" data-p="2"></div></div>
          <div class="round-pips" data-p="2"></div>
        </div>
      </div>
      <div class="hud-bottom">
        <div class="energy-bar"><div class="energy-fill" data-p="1"></div></div>
        <div class="energy-bar"><div class="energy-fill" data-p="2"></div></div>
      </div>
      <div class="hud-combo hud-combo--p1"></div>
      <div class="hud-combo hud-combo--p2"></div>
      <div class="hud-banner"></div>
      <button class="hud-pause-btn" aria-label="Pausar">II</button>
      <div class="hud-pause-overlay hidden">
        <div class="pause-box">
          <h2>PAUSADO</h2>
          <button data-action="resume">CONTINUAR</button>
          <button data-action="restart">REINICIAR LUTA</button>
          <button data-action="menu">MENU PRINCIPAL</button>
        </div>
      </div>
      <div class="hud-matchend hidden">
        <div class="matchend-box">
          <h2 class="matchend-title"></h2>
          <button data-action="rematch">REVANCHE</button>
          <button data-action="select">ESCOLHER PERSONAGEM</button>
          <button data-action="menu">MENU PRINCIPAL</button>
        </div>
      </div>
    `;
    root.appendChild(this.el);

    for (let i = 1; i <= ROUNDS_TO_WIN; i++) {
      this.el.querySelector('[data-p="1"].round-pips')?.insertAdjacentHTML('beforeend', '<span></span>');
      this.el.querySelector('[data-p="2"].round-pips')?.insertAdjacentHTML('beforeend', '<span></span>');
    }

    this.el.querySelector('.hud-pause-btn').addEventListener('click', () => this.togglePause());
    this.el.querySelectorAll('.hud-pause-overlay button').forEach((btn) => {
      btn.addEventListener('click', () => this.handlePauseAction(btn.dataset.action));
    });
    this.el.querySelectorAll('.hud-matchend button').forEach((btn) => {
      btn.addEventListener('click', () => this.handleMatchEndAction(btn.dataset.action));
    });

    this.onKey = (e) => {
      if (e.code === 'Escape') this.togglePause();
    };
    window.addEventListener('keydown', this.onKey);
  }

  togglePause() {
    this.setPaused(!this.paused);
  }

  setPaused(paused) {
    this.paused = paused;
    this.el.querySelector('.hud-pause-overlay').classList.toggle('hidden', !paused);
    if (this.callbacks.onPauseToggle) this.callbacks.onPauseToggle(paused);
  }

  handlePauseAction(action) {
    if (action === 'resume') this.setPaused(false);
    else if (action === 'restart') this.callbacks.onRestart?.();
    else if (action === 'menu') this.callbacks.onMenu?.();
  }

  handleMatchEndAction(action) {
    if (action === 'rematch') this.callbacks.onRematch?.();
    else if (action === 'select') this.callbacks.onReselect?.();
    else if (action === 'menu') this.callbacks.onMenu?.();
  }

  refresh() {
    const { p1, p2, round } = this;
    this.el.querySelector('.health-fill[data-p="1"]').style.width = `${Math.max(0, (p1.health / p1.maxHealth) * 100)}%`;
    this.el.querySelector('.health-fill[data-p="2"]').style.width = `${Math.max(0, (p2.health / p2.maxHealth) * 100)}%`;
    this.el.querySelector('.energy-fill[data-p="1"]').style.width = `${(p1.energy / p1.maxEnergy) * 100}%`;
    this.el.querySelector('.energy-fill[data-p="2"]').style.width = `${(p2.energy / p2.maxEnergy) * 100}%`;
    this.el.querySelector('.energy-fill[data-p="1"]').classList.toggle('is-full', p1.energy >= p1.maxEnergy);
    this.el.querySelector('.energy-fill[data-p="2"]').classList.toggle('is-full', p2.energy >= p2.maxEnergy);
    this.el.querySelector('.hud-timer').textContent = Math.ceil(round.timeLeft);

    const pips1 = this.el.querySelectorAll('[data-p="1"].round-pips span');
    const pips2 = this.el.querySelectorAll('[data-p="2"].round-pips span');
    pips1.forEach((s, i) => s.classList.toggle('won', i < p1.roundsWon));
    pips2.forEach((s, i) => s.classList.toggle('won', i < p2.roundsWon));

    const banner = this.el.querySelector('.hud-banner');
    if (round.message && round.phase !== 'matchend') {
      banner.textContent = round.message;
      banner.classList.add('is-visible');
    } else {
      banner.classList.remove('is-visible');
    }

    const now = performance.now();
    this.updateCombo(1, p1, now);
    this.updateCombo(2, p2, now);

    if (round.phase === 'matchend' && !this.matchEndShown) {
      this.matchEndShown = true;
      this.el.querySelector('.hud-matchend').classList.remove('hidden');
      this.el.querySelector('.matchend-title').textContent = `VITORIA: ${round.matchWinner.data.name.toUpperCase()}`;
    }
  }

  updateCombo(playerNum, fighter, now) {
    const el = this.el.querySelector(`.hud-combo--p${playerNum}`);
    if (fighter.comboCount > 1 && now - fighter.lastHitLandedAt < 1200) {
      el.textContent = `COMBO x${fighter.comboCount}`;
      el.classList.add('is-visible');
    } else {
      el.classList.remove('is-visible');
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.onKey);
    this.el.remove();
  }
}
