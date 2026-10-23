import { KeyboardController } from './KeyboardController.js';
import { TouchController } from './TouchController.js';

function mergeOr(a, b) {
  const out = {};
  for (const key of Object.keys(a)) out[key] = Boolean(a[key] || b[key]);
  return out;
}

export class InputManager {
  constructor(settings) {
    this.settings = settings;
    this.keyboard = new KeyboardController();
    this.touch = {};
    this.refreshGameCodes();
  }

  refreshGameCodes() {
    const km = this.settings.keymap;
    const codes = [...Object.values(km.p1), ...Object.values(km.p2)];
    this.keyboard.setGameCodes(codes);
  }

  enableTouch(playerIndices, mode, root) {
    this.disableTouch();
    for (const idx of playerIndices) {
      const controller = new TouchController(idx, mode);
      controller.mount(root);
      this.touch[idx] = controller;
    }
  }

  disableTouch() {
    for (const idx of Object.keys(this.touch)) {
      this.touch[idx].destroy();
    }
    this.touch = {};
  }

  pollPlayer(playerIndex) {
    const km = playerIndex === 0 ? this.settings.keymap.p1 : this.settings.keymap.p2;
    const kb = this.keyboard;
    const kbState = {
      left: kb.isHeld(km.left),
      right: kb.isHeld(km.right),
      up: kb.isHeld(km.up),
      down: kb.isHeld(km.down),
      punch: kb.isHeld(km.punch),
      kick: kb.isHeld(km.kick),
      block: kb.isHeld(km.block),
      upPressed: kb.wasPressed(km.up),
      punchPressed: kb.wasPressed(km.punch),
      kickPressed: kb.wasPressed(km.kick)
    };
    const touchCtrl = this.touch[playerIndex];
    if (!touchCtrl) return kbState;
    return mergeOr(kbState, touchCtrl.getState());
  }

  endStep() {
    this.keyboard.clearJustPressed();
    for (const idx of Object.keys(this.touch)) this.touch[idx].clearJustPressed();
  }

  destroy() {
    this.keyboard.destroy();
    this.disableTouch();
  }
}
