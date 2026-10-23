import { Storage } from '../utils/Storage.js';
import { Renderer } from './Renderer.js';
import { GameLoop } from './GameLoop.js';
import { CombatSystem } from './CombatSystem.js';
import { RoundManager } from './RoundManager.js';
import { AIController } from './AIController.js';
import { ARENAS, getArenaById } from './arenas.js';
import { Character } from '../characters/Character.js';
import { getCharacterById } from '../characters/characterData.js';
import { InputManager } from '../controls/InputManager.js';
import { AudioManager } from '../audio/AudioManager.js';
import { MainMenu } from '../ui/MainMenu.js';
import { CharacterSelect } from '../ui/CharacterSelect.js';
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
      onPlay: () => this.goToCharacterSelect('versus'),
      onTraining: () => this.goToCharacterSelect('training'),
      onCharacters: () => this.goToCharacterSelect('gallery'),
      onSettings: () => this.goToSettings(),
      onCredits: () => this.goToCredits()
    });
  }

  goToCharacterSelect(mode) {
    this.clearScene();
    this.sceneName = 'select';
    this.audio.startMusic('select');
    this.scene = new CharacterSelect(this.uiRoot, this.audio, mode, {
      onConfirm: (p1Id, p2Id) => this.goToMoveList({ p1Id, p2Id, isTraining: mode === 'training' }),
      onBack: () => this.goToMainMenu()
    });
    this.scene.setInput(this.input);
  }

  goToMoveList({ p1Id, p2Id, isTraining }) {
    this.clearScene();
    this.sceneName = 'movelist';
    this.scene = new MoveListScreen(this.uiRoot, this.audio, this.settings, {
      isTraining,
      onStart: () => this.startFight({ p1Id, p2Id, isTraining }),
      onBack: () => this.goToCharacterSelect(isTraining ? 'training' : 'versus')
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

  startFight({ p1Id, p2Id, isTraining }) {
    this.clearScene();
    this.sceneName = 'fight';
    const arena = ARENAS[Math.floor(Math.random() * ARENAS.length)];
    const p1Data = getCharacterById(p1Id);
    const p2Data = getCharacterById(p2Id);

    const p1 = new Character(p1Data, { playerIndex: 0, x: 280, facing: 1 });
    const p2 = new Character(p2Data, { playerIndex: 1, x: 680, facing: -1, isAI: isTraining, difficulty: this.settings.difficulty });
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
      ai: isTraining ? new AIController(this.settings.difficulty) : null,
      p2IsAI: isTraining,
      lastPhase: round.phase,
      matchEndHandled: false,
      hitStopTimer: 0
    };

    this.setupTouchForFight();

    this.hud = new FightHUD(this.uiRoot, p1, p2, round, {
      onRestart: () => this.startFight({ p1Id, p2Id, isTraining }),
      onMenu: () => this.goToMainMenu(),
      onRematch: () => this.startFight({ p1Id, p2Id, isTraining }),
      onReselect: () => this.goToCharacterSelect(isTraining ? 'training' : 'versus'),
      onPauseToggle: (paused) => this.loop.setPaused(paused)
    });

    this.audio.startMusic('fight');
  }

  setupTouchForFight() {
    if (!this.shouldShowTouch()) return;
    const humanPlayers = this.fight.p2IsAI ? [0] : [0, 1];
    const mode = humanPlayers.length > 1 ? 'dual' : 'single';
    this.input.enableTouch(humanPlayers, mode, this.uiRoot);
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

    const { p1, p2, round, ai, p2IsAI } = this.fight;

    if (round.isActive()) {
      const input1 = this.input.pollPlayer(0);
      const input2 = p2IsAI ? ai.getInput(dt, p2, p1) : this.input.pollPlayer(1);
      p1.update(dt, input1, p2);
      p2.update(dt, input2, p1);
      this.processEvents(p1);
      this.processEvents(p2);
      this.combat.update(dt, [p1, p2]);
      let hitStop = 0;
      for (const ev of this.combat.hitEvents) {
        if (ev.blocked) {
          this.renderer.particles.spawnImpact(ev.x, ev.y, '#9fd8ff', 6);
          hitStop = Math.max(hitStop, 25);
        } else {
          const color = ev.countered ? '#ffe08a' : '#fff6a0';
          this.renderer.particles.spawnImpact(ev.x, ev.y, color, 10);
          this.renderer.particles.spawnSpark(ev.x, ev.y, '#ffffff', 10);
          this.renderer.particles.spawnRing(ev.x, ev.y, color);
          hitStop = Math.max(hitStop, 70);
        }
      }
      if (hitStop > 0) this.fight.hitStopTimer = hitStop;
    }

    this.renderer.particles.update(dt);
    const prevPhase = round.phase;
    round.update(dt);
    if (round.phase !== prevPhase) {
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
      if (ev.type === 'sfx') this.audio.sfx(ev.sound);
    }
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
