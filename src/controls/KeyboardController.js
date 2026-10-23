export class KeyboardController {
  constructor() {
    this.held = new Set();
    this.justPressed = new Set();
    this.gameCodes = new Set();

    this.onKeyDown = (e) => {
      const tag = e.target && e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (this.gameCodes.has(e.code)) e.preventDefault();
      if (!this.held.has(e.code)) this.justPressed.add(e.code);
      this.held.add(e.code);
    };
    this.onKeyUp = (e) => {
      this.held.delete(e.code);
    };
    this.onBlur = () => {
      this.held.clear();
    };

    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  setGameCodes(codes) {
    this.gameCodes = new Set(codes);
  }

  isHeld(code) {
    return this.held.has(code);
  }

  wasPressed(code) {
    return this.justPressed.has(code);
  }

  clearJustPressed() {
    this.justPressed.clear();
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
  }
}
