function wireButtonNav(container, audio) {
  const buttons = [...container.querySelectorAll('button:not([disabled])')];
  buttons.forEach((btn) => {
    btn.addEventListener('mouseenter', () => audio.sfx('menu'));
    btn.addEventListener('focus', () => audio.sfx('menu'));
  });
  container.addEventListener('keydown', (e) => {
    const idx = buttons.indexOf(document.activeElement);
    if (e.code === 'ArrowDown') {
      e.preventDefault();
      buttons[(idx + 1 + buttons.length) % buttons.length]?.focus();
    } else if (e.code === 'ArrowUp') {
      e.preventDefault();
      buttons[(idx - 1 + buttons.length) % buttons.length]?.focus();
    }
  });
  if (buttons[0]) buttons[0].focus();
}

export class MainMenu {
  constructor(root, audio, callbacks) {
    this.el = document.createElement('div');
    this.el.className = 'screen main-menu';
    this.el.innerHTML = `
      <div class="menu-bg-grid"></div>
      <div class="menu-content">
        <h1 class="logo">BR <span>FIGHTER</span><small>DUELO DE PODER</small></h1>
        <nav class="menu-buttons">
          <button data-action="play">LUTAR CONTRA A CPU</button>
          <button data-action="training">TREINAMENTO</button>
          <button data-action="pvp" class="is-coming-soon" disabled aria-disabled="true">PVP <em>EM BREVE</em></button>
          <button data-action="settings">CONFIGURACOES</button>
          <button data-action="credits">CREDITOS</button>
        </nav>
      </div>
    `;
    root.appendChild(this.el);

    const wire = (action, handler) => {
      this.el.querySelector(`[data-action="${action}"]`).addEventListener('click', () => {
        audio.sfx('confirm');
        handler();
      });
    };
    wire('play', callbacks.onPlay);
    wire('training', callbacks.onTraining);
    wire('settings', callbacks.onSettings);
    wire('credits', callbacks.onCredits);

    wireButtonNav(this.el.querySelector('.menu-buttons'), audio);
  }

  destroy() {
    this.el.remove();
  }
}
