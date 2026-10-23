import { Storage } from '../utils/Storage.js';
import { GROUND_Y, STAGE_LEFT, STAGE_RIGHT } from '../utils/constants.js';
import { Renderer } from './Renderer.js';
import { GameLoop } from './GameLoop.js';
import { CombatSystem } from './CombatSystem.js';
import { RoundManager } from './RoundManager.js';
import { AIController } from './AIController.js';
import { ARENAS, getArenaById } from './arenas.js';
import { Character } from '../characters/Character.js';
import { createFighter } from '../characters/characterData.js';
import { InputManager } from '../controls/InputManager.js';
import { AudioManager } from '../audio/AudioManager.js';
import { MainMenu } from '../ui/MainMenu.js';
import { MoveListScreen } from '../ui/MoveListScreen.js';
import { FightHUD } from '../ui/FightHUD.js';
import { SettingsMenu } from '../ui/SettingsMenu.js';
import { CreditsScreen } from '../ui/CreditsScreen.js';

const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

export class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.uiRoot = document.getElementById('ui-root');
    this.settings = Storage.loadSettings();
    this.records = Storage.loadRecords();

    this.renderer = new Renderer(this.canvas);
    this.audio = new AudioManager(this.settings);
    this.input = new InputManager(this.settings);
    this.combat = new CombatSystem();

    this.sceneName = null;
    this.scene = null;
    this.bgTime = 0;
    this.bgArena = ARENAS[2];
    this.fight = null;

    this.loop = new GameLoop(this.update.bind(this), this.render.bind(this));
    this.wireVisibility();
    this.wireFirstGesture();
    this.loop.start();
    this.goToMainMenu();
  }

  wireFirstGesture() {
    const unlock = () => {
      this.audio.ensureContext();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  wireVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.loop.setPaused(true);
        if (this.fight && this.hud) this.hud.setPaused(true);
      }
    });
    window.addEventListener('blur', () => {
      this.loop.setPaused(true);
      if (this.fight && this.hud) this.hud.setPaused(true);
    });
  }

  clearScene() {
    if (this.scene && this.scene.destroy) this.scene.destroy();
    this.scene = null;
    if (this.hud) {
      this.hud.destroy();
      this.hud = null;
    }
    this.uiRoot.innerHTML = '';
    this.input.disableTouch();
    this.fight = null;
    this.loop.setPaused(false);
  }

  shouldShowTouch() {
    if (this.settings.controlMode === 'touch') return true;
    if (this.settings.controlMode === 'keyboard') return false;
    return isTouchDevice();
  }

  // ----- Menu / navigation -----

  goToMainMenu() {
    this.clearScene();
    this.sceneName = 'menu';
    this.audio.startMusic('menu');
    this.scene = new MainMenu(this.uiRoot, this.audio, {
      onPlay: () => this.goToMoveList({ isTraining: false }),
      onTraining: () => this.goToMoveList({ isTraining: true }),
      onSettings: () => this.goToSettings(),
      onCredits: () => this.goToCredits()
    });
  }

  goToMoveList({ isTraining }) {
    this.clearScene();
    this.sceneName = 'movelist';
    this.scene = new MoveListScreen(this.uiRoot, this.audio, this.settings, {
      onStart: () => this.startFight({ isTraining }),
      onBack: () => this.goToMainMenu()
    });
  }

  goToSettings() {
    this.clearScene();
    this.sceneName = 'settings';
    this.scene = new SettingsMenu(this.uiRoot, this.audio, this.settings, {
      onBack: () => this.goToMainMenu(),
      onKeymapChange: () => this.input.refreshGameCodes(),
      onControlModeChange: () => {}
    });
  }

  goToCredits() {
    this.clearScene();
    this.sceneName = 'credits';
    this.scene = new CreditsScreen(this.uiRoot, this.audio, {
      onBack: () => this.goToMainMenu()
    });
  }

  // ----- Fight -----

  startFight({ isTraining }) {
    this.clearScene();
    this.sceneName = 'fight';
    const arena = ARENAS[Math.floor(Math.random() * ARENAS.length)];

    const p1 = new Character(createFighter('Jogador'), { playerIndex: 0, x: 280, facing: 1 });
    const p2 = new Character(createFighter('CPU'), { playerIndex: 1, x: 680, facing: -1, isAI: true, difficulty: this.settings.difficulty });
    p1.startX = 280;
    p1.startFacing = 1;
    p2.startX = 680;
    p2.startFacing = -1;

    this.combat.reset();
    const round = new RoundManager(p1, p2, { infiniteTime: isTraining, trainingMode: isTraining });
    round.startRound();

    this.fight = {
      p1,
      p2,
      round,
      arena,
      isTraining,
      ai: new AIController(this.settings.difficulty),
      matchEndHandled: false,
      hitStopTimer: 0,
      groundSword: null
    };

    this.setupTouchForFight();

    this.hud = new FightHUD(this.uiRoot, p1, p2, round, {
      onRestart: () => this.startFight({ isTraining }),
      onMenu: () => this.goToMainMenu(),
      onRematch: () => this.startFight({ isTraining }),
      onPauseToggle: (paused) => this.loop.setPaused(paused)
    });

    this.audio.startMusic('fight');
  }

  setupTouchForFight() {
    if (!this.shouldShowTouch()) return;
    this.input.enableTouch([0], 'single', this.uiRoot);
  }

  // ----- Loop -----

  update(dt) {
    this.bgTime += dt * 1000;
    if (this.sceneName === 'fight' && this.fight) {
      this.updateFight(dt);
    } else if (this.scene && typeof this.scene.update === 'function') {
      this.scene.update(dt);
    }
  }

  updateFight(dt) {
    if (this.fight.hitStopTimer > 0) {
      this.fight.hitStopTimer -= dt * 1000;
      this.renderer.particles.update(dt);
      this.input.endStep();
      return;
    }

    const { p1, p2, round, ai } = this.fight;

    if (round.isActive()) {
      const input1 = this.input.pollPlayer(0);
      const input2 = ai.getInput(dt, p2, p1, this.fight.groundSword);
      p1.update(dt, input1, p2);
      p2.update(dt, input2, p1);
      // pickup must run before processEvents so its sfx event is consumed this frame
      this.checkSwordPickup(p1);
      this.checkSwordPickup(p2);
      this.processEvents(p1);
      this.processEvents(p2);
      this.spawnBladeTrail(p1);
      this.spawnBladeTrail(p2);
      this.combat.update(dt, [p1, p2]);
      // hits/disarms raised inside combat.update queue new events
      this.processEvents(p1);
      this.processEvents(p2);

      let hitStop = 0;
      for (const ev of this.combat.hitEvents) {
        if (ev.blocked) {
          this.renderer.particles.spawnImpact(ev.x, ev.y, '#9fd8ff', 6);
          hitStop = Math.max(hitStop, 25);
        } else if (ev.critical) {
          this.renderer.particles.spawnImpact(ev.x, ev.y, '#ff6b6b', 16);
          this.renderer.particles.spawnSpark(ev.x, ev.y, '#ffffff', 18);
          this.renderer.particles.spawnRing(ev.x, ev.y, '#ff6b6b');
          this.renderer.particles.spawnRing(ev.x, ev.y, '#ffffff');
          hitStop = Math.max(hitStop, 160);
        } else {
          this.renderer.particles.spawnImpact(ev.x, ev.y, '#fff6a0', 10);
          this.renderer.particles.spawnSpark(ev.x, ev.y, '#ffffff', 10);
          this.renderer.particles.spawnRing(ev.x, ev.y, '#fff6a0');
          hitStop = Math.max(hitStop, 70);
        }
      }
      if (hitStop > 0) this.fight.hitStopTimer = hitStop;
    }

    this.renderer.particles.update(dt);
    const prevPhase = round.phase;
    round.update(dt);
    if (round.phase !== prevPhase) {
      if (round.phase === 'intro') this.fight.groundSword = null;
      if (round.phase === 'fight') this.audio.sfx('round');
      if (round.phase === 'roundend') this.audio.sfx(round.message === 'K.O.' ? 'ko' : 'round');
    }
    this.input.endStep();
    if (this.hud) this.hud.refresh();

    if (round.phase === 'matchend' && !this.fight.matchEndHandled) {
      this.fight.matchEndHandled = true;
      this.onMatchEnd(round.matchWinner);
    }
  }

  processEvents(character) {
    for (const ev of character.events) {
      if (ev.type === 'sfx') {
        this.audio.sfx(ev.sound);
      } else if (ev.type === 'disarmed') {
        // sword flies a little away from the opponent before landing
        const opponent = character === this.fight.p1 ? this.fight.p2 : this.fight.p1;
        const away = character.x >= opponent.x ? 1 : -1;
        const landX = Math.max(STAGE_LEFT + 20, Math.min(STAGE_RIGHT - 20, ev.x + away * 120));
        this.fight.groundSword = { x: landX, owner: character.playerIndex };
        this.renderer.particles.spawnSpark(ev.x, ev.y, '#d0d6dc', 12);
      }
    }
    character.events.length = 0;
  }

  checkSwordPickup(character) {
    const sword = this.fight.groundSword;
    if (character.hasSword || !sword || sword.owner !== character.playerIndex) return;
    if (Math.abs(character.x - sword.x) > 36) return;
    character.pickUpSword();
    this.fight.groundSword = null;
    this.renderer.particles.spawnRing(sword.x, GROUND_Y - 20, '#d0d6dc');
  }

  spawnBladeTrail(character) {
    if (!character.hasSword || !character.isHitActive()) return;
    const hb = character.getHitbox();
    if (!hb) return;
    const tipX = character.facing > 0 ? hb.x + hb.w : hb.x;
    this.renderer.particles.spawnSpark(tipX, hb.y + hb.h / 2, 'rgba(255,255,255,0.8)', 2);
  }

  onMatchEnd(winner) {
    this.records.matches += 1;
    this.records.wins[winner.data.id] = (this.records.wins[winner.data.id] || 0) + 1;
    Storage.saveRecords(this.records);
  }

  render() {
    this.renderer.beginFrame();
    if (this.sceneName === 'fight' && this.fight) {
      this.renderer.drawArena(this.fight.arena, this.bgTime);
      if (this.fight.groundSword) this.renderer.drawSwordOnGround(this.fight.groundSword.x);
      this.renderer.drawShadow(this.fight.p1);
      this.renderer.drawShadow(this.fight.p2);
      const order = this.fight.p1.x <= this.fight.p2.x ? [this.fight.p1, this.fight.p2] : [this.fight.p2, this.fight.p1];
      for (const fighter of order) this.renderer.drawFighter(fighter);
      this.renderer.particles.draw(this.renderer.ctx);
    } else {
      this.renderer.drawArena(this.bgArena, this.bgTime);
      this.renderer.particles.draw(this.renderer.ctx);
    }
  }
}
