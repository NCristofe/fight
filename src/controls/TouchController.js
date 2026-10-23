// Renders on-screen touch controls for one player and exposes the same
// held/justPressed shape as KeyboardController (keyed by action name
// instead of key code), so InputManager can merge both uniformly.
const ACTIONS = ['left', 'right', 'up', 'down', 'punch', 'kick', 'block'];

export class TouchController {
  constructor(playerIndex, mode = 'single') {
    this.playerIndex = playerIndex;
    this.mode = mode;
    this.held = new Set();
    this.justPressed = new Set();
    this.container = document.createElement('div');
    this.container.className = `touch-controls touch-controls--${mode} touch-controls--p${playerIndex + 1}`;
    this.buttons = [];
    this.build();
  }

  addButton(action, label, groupEl, extraClass = '') {
    const btn = document.createElement('button');
    btn.className = `touch-btn touch-btn--${action} ${extraClass}`;
    btn.textContent = label;
    btn.dataset.action = action;

    const press = (e) => {
      e.preventDefault();
      try {
        btn.setPointerCapture(e.pointerId);
      } catch {
        /* ignore capture errors on unsupported browsers */
      }
      if (!this.held.has(action)) this.justPressed.add(action);
      this.held.add(action);
      btn.classList.add('is-active');
    };
    const release = (e) => {
      e.preventDefault();
      this.held.delete(action);
      btn.classList.remove('is-active');
    };

    btn.addEventListener('pointerdown', press, { passive: false });
    btn.addEventListener('pointerup', release, { passive: false });
    btn.addEventListener('pointercancel', release, { passive: false });
    btn.addEventListener('contextmenu', (e) => e.preventDefault());

    groupEl.appendChild(btn);
    this.buttons.push(btn);
    return btn;
  }

  build() {
    const moveGroup = document.createElement('div');
    moveGroup.className = 'touch-group touch-group--move';
    this.addButton('left', '◀', moveGroup);
    this.addButton('right', '▶', moveGroup);
    this.addButton('up', 'PULAR', moveGroup, 'touch-btn--wide');
    this.addButton('down', 'AGACHAR', moveGroup, 'touch-btn--wide');

    const actionGroup = document.createElement('div');
    actionGroup.className = 'touch-group touch-group--action';
    this.addButton('block', 'DEF', actionGroup);
    this.addButton('punch', 'CORTE', actionGroup);
    this.addButton('kick', 'ESTOC.', actionGroup);

    this.container.appendChild(moveGroup);
    this.container.appendChild(actionGroup);
  }

  mount(root) {
    root.appendChild(this.container);
  }

  getState() {
    return {
      left: this.held.has('left'),
      right: this.held.has('right'),
      up: this.held.has('up'),
      down: this.held.has('down'),
      punch: this.held.has('punch'),
      kick: this.held.has('kick'),
      block: this.held.has('block'),
      upPressed: this.justPressed.has('up'),
      punchPressed: this.justPressed.has('punch'),
      kickPressed: this.justPressed.has('kick')
    };
  }

  clearJustPressed() {
    this.justPressed.clear();
  }

  destroy() {
    this.container.remove();
  }
}

export { ACTIONS };
