function wireButtonNav(container, audio) {
  const buttons = [...container.querySelectorAll('button')];
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
          <button data-action="play">JOGAR</button>
          <button data-action="training">TREINAMENTO</button>
          <button data-action="characters">PERSONAGENS</button>
          <button data-action="settings">CONFIGURACOES</button>
          <button data-action="credits">CREDITOS</button>
        </nav>
        <p class="menu-footer">Satira ficticia e nao-oficial. Personagens e eventos sao fictícios para fins de entretenimento.</p>
      </div>
    `;
    root.appendChild(this.el);

    this.el.querySelector('[data-action="play"]').addEventListener('click', () => {
      audio.sfx('confirm');
      callbacks.onPlay();
    });
    this.el.querySelector('[data-action="training"]').addEventListener('click', () => {
      audio.sfx('confirm');
      callbacks.onTraining();
    });
    this.el.querySelector('[data-action="characters"]').addEventListener('click', () => {
      audio.sfx('confirm');
      callbacks.onCharacters();
    });
    this.el.querySelector('[data-action="settings"]').addEventListener('click', () => {
      audio.sfx('confirm');
      callbacks.onSettings();
    });
    this.el.querySelector('[data-action="credits"]').addEventListener('click', () => {
      audio.sfx('confirm');
      callbacks.onCredits();
    });

    wireButtonNav(this.el.querySelector('.menu-buttons'), audio);
  }

  destroy() {
    this.el.remove();
  }
}
