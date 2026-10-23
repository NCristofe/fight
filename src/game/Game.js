import { Storage } from '../utils/Storage.js';
import { GROUND_Y, STAGE_LEFT, STAGE_RIGHT } from '../utils/constants.js';
import { Renderer } from './Renderer.js';
import { GameLoop } from './GameLoop.js';
import { CombatSystem } from './CombatSystem.js';
import { RoundManager } from './RoundManager.js';
import { AIController } from './AIController.js';
import { ARENAS } from './arenas.js';
import { Character } from '../characters/Character.js';
import { createFighter } from '../characters/characterData.js';
import { InputManager } from '../controls/InputManager.js';
import { AudioManager } from '../audio/AudioManager.js';
import { NetClient } from '../net/NetClient.js';
import { MainMenu } from '../ui/MainMenu.js';
import { OnlineLobby } from '../ui/OnlineLobby.js';
import { MoveListScreen } from '../ui/MoveListScreen.js';
import { FightHUD } from '../ui/FightHUD.js';
import { SettingsMenu } from '../ui/SettingsMenu.js';
import { CreditsScreen } from '../ui/CreditsScreen.js';

const isTouchDevice = () => 'ontouchstart' in window || navigator.maxTouchPoints > 0;

const INPUT_KEYS = ['left', 'right', 'up', 'down', 'block', 'punch', 'kick', 'upPressed', 'punchPressed', 'kickPressed'];

/*
 * Online play (2 devices) is host-authoritative:
 *  - The room creator ("host") runs the whole fight (p1 = host, p2 = guest)
 *    and streams a snapshot of the state every step, plus the one-shot
 *    effects (hits, sounds) that happened since the last snapshot.
 *  - The joiner ("guest") runs no simulation: it sends its inputs every step
 *    and just draws the latest snapshot and replays the effects.
 * The guest therefore sees its own actions after one network round trip.
 */
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

    this.net = null;
    this.online = null;

    this.sceneName = null;
    this.scene = null;
    this.bgTime = 0;
    this.bgArena = ARENAS[1];
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
    // Offline fights pause when the window loses focus. Online fights can't:
    // pausing the host would freeze the opponent's game too.
    const pauseIfOffline = () => {
      if (this.fight && this.fight.online) return;
      this.loop.setPaused(true);
      if (this.fight && this.hud) this.hud.setPaused(true);
    };
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) pauseIfOffline();
    });
    window.addEventListener('blur', pauseIfOffline);
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

  showToast(message) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add('is-leaving'), 3200);
    setTimeout(() => el.remove(), 3800);
  }

  // ----- Menu / navigation -----

  goToMainMenu() {
    this.leaveOnline();
    this.clearScene();
    this.sceneName = 'menu';
    this.audio.startMusic('menu');
    this.scene = new MainMenu(this.uiRoot, this.audio, {
      onPlay: () => this.goToMoveList({ isTraining: false, pvp: false }),
      onTraining: () => this.goToMoveList({ isTraining: true, pvp: false }),
      onPvp: () => this.goToMoveList({ isTraining: false, pvp: true }),
      onOnline: () => this.goToOnlineLobby(),
      onSettings: () => this.goToSettings(),
      onCredits: () => this.goToCredits()
    });
  }

  goToMoveList({ isTraining, pvp }) {
    this.clearScene();
    this.sceneName = 'movelist';
    this.scene = new MoveListScreen(this.uiRoot, this.audio, this.settings, {
      pvp,
      onStart: () => this.startFight({ isTraining, pvp }),
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

  // ----- Online lobby / connection -----

  goToOnlineLobby() {
    this.leaveOnline();
    this.clearScene();
    this.sceneName = 'lobby';
    const lobby = new OnlineLobby(this.uiRoot, this.audio, {
      onCreate: () => this.openRoom({ t: 'create' }),
      onJoin: (code) => this.openRoom({ t: 'join', code }),
      onBack: () => this.goToMainMenu()
    });
    this.scene = lobby;
  }

  async openRoom(firstMessage) {
    const lobby = this.scene;
    try {
      const net = new NetClient();
      net.onmessage = (m) => this.handleNetMessage(m);
      net.onclose = () => this.handlePeerGone('A conexao com o servidor foi perdida.');
      await net.connect();
      this.net = net;
      net.send(firstMessage);
    } catch (err) {
      if (lobby && lobby === this.scene) lobby.showError(err.message);
    }
  }

  leaveOnline() {
    if (this.net) {
      this.net.close();
      this.net = null;
    }
    this.online = null;
  }

  handlePeerGone(message) {
    if (!this.net) return;
    this.showToast(message);
    this.goToMainMenu();
  }

  handleNetMessage(m) {
    switch (m.t) {
      case 'created':
        this.online = { role: 'host', hostReady: false, guestReady: false };
        if (this.sceneName === 'lobby') this.scene.showCode(m.code);
        break;
      case 'error':
        if (this.sceneName === 'lobby') this.scene.showError(m.message);
        break;
      case 'joined':
        this.online = { role: 'guest' };
        this.goToOnlineMoveList();
        break;
      case 'peer-joined':
        if (this.online && this.online.role === 'host') this.goToOnlineMoveList();
        break;
      case 'peer-left':
        this.handlePeerGone('O oponente saiu da partida.');
        break;
      case 'ready':
        if (this.online && this.online.role === 'host') {
          this.online.guestReady = true;
          this.maybeStartOnline();
        }
        break;
      case 'go':
      case 'rematch':
        if (this.online && this.online.role === 'guest') this.startFight({ online: 'guest' });
        break;
      case 'rematch-req':
        if (this.online && this.online.role === 'host') this.restartOnlineAsHost();
        break;
      case 'in':
        this.onRemoteInput(m.i);
        break;
      case 'snap':
        this.onSnapshot(m);
        break;
      default:
        break;
    }
  }

  goToOnlineMoveList() {
    this.clearScene();
    this.sceneName = 'movelist';
    this.scene = new MoveListScreen(this.uiRoot, this.audio, this.settings, {
      online: true,
      pvp: false,
      onStart: () => this.onlineReady(),
      onBack: () => this.goToMainMenu()
    });
  }

  onlineReady() {
    if (!this.online) return;
    if (this.online.role === 'host') {
      this.online.hostReady = true;
      this.maybeStartOnline();
    } else {
      this.net.send({ t: 'ready' });
    }
  }

  maybeStartOnline() {
    if (!this.online.hostReady || !this.online.guestReady) return;
    this.net.send({ t: 'go' });
    this.startFight({ online: 'host' });
  }

  restartOnlineAsHost() {
    this.net.send({ t: 'rematch' });
    this.startFight({ online: 'host' });
  }

  // ----- Fight -----

  startFight({ isTraining = false, pvp = false, online = null }) {
    this.clearScene();
    this.sceneName = 'fight';
    const arena = ARENAS[Math.floor(Math.random() * ARENAS.length)];

    let name1 = pvp ? 'Jogador 1' : 'Jogador';
    let name2 = pvp ? 'Jogador 2' : 'CPU';
    if (online === 'host') [name1, name2] = ['Voce', 'Oponente'];
    if (online === 'guest') [name1, name2] = ['Oponente', 'Voce'];

    const p1 = new Character(createFighter(name1), { playerIndex: 0, x: 280, facing: 1 });
    const p2 = new Character(createFighter(name2), { playerIndex: 1, x: 680, facing: -1, isAI: !pvp && !online, difficulty: this.settings.difficulty });
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
      pvp,
      online,
      ai: !pvp && !online ? new AIController(this.settings.difficulty) : null,
      matchEndHandled: false,
      hitStopTimer: 0,
      groundSword: null,
      netEvents: [],
      remote: { held: {}, pressed: {} },
      latest: null
    };

    this.setupTouchForFight();

    this.hud = new FightHUD(this.uiRoot, p1, p2, round, {
      online: Boolean(online),
      onRestart: () => this.startFight({ isTraining, pvp }),
      onMenu: () => this.goToMainMenu(),
      onRematch: () => {
        if (online === 'host') this.restartOnlineAsHost();
        else if (online === 'guest') this.net.send({ t: 'rematch-req' });
        else this.startFight({ isTraining, pvp });
      },
      onPauseToggle: (paused) => {
        if (!online) this.loop.setPaused(paused);
      }
    });

    this.audio.startMusic('fight');
  }

  setupTouchForFight() {
    if (!this.shouldShowTouch()) return;
    if (this.fight.pvp) this.input.enableTouch([0, 1], 'dual', this.uiRoot);
    else this.input.enableTouch([0], 'single', this.uiRoot);
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
    if (this.fight.online === 'guest') {
      this.updateGuest(dt);
      return;
    }
    const isHost = this.fight.online === 'host';

    if (this.fight.hitStopTimer > 0) {
      this.fight.hitStopTimer -= dt * 1000;
      this.renderer.particles.update(dt);
      this.input.endStep();
      if (isHost) this.sendSnapshot();
      return;
    }

    const { p1, p2, round, ai } = this.fight;

    if (round.isActive()) {
      const input1 = isHost ? this.pollLocalOnline() : this.input.pollPlayer(0);
      let input2;
      if (isHost) input2 = this.takeRemoteInput();
      else if (this.fight.pvp) input2 = this.input.pollPlayer(1);
      else input2 = ai.getInput(dt, p2, p1, this.fight.groundSword);

      p1.update(dt, input1, p2);
      p2.update(dt, input2, p1);
      // pickup must run before processEvents so its sfx event is consumed this frame
      this.checkSwordPickup(p1);
      this.checkSwordPickup(p2);
      this.processEvents(p1);
      this.processEvents(p2);
      this.spawnLungeDust(p1);
      this.spawnLungeDust(p2);
      this.combat.update(dt, [p1, p2]);
      // hits/disarms raised inside combat.update queue new events
      this.processEvents(p1);
      this.processEvents(p2);

      let hitStop = 0;
      for (const ev of this.combat.hitEvents) {
        const attacker = ev.attackerIndex === 0 ? p1 : p2;
        this.fx({
          k: 'hit',
          x: Math.round(ev.x),
          y: Math.round(ev.y),
          blocked: ev.blocked,
          critical: ev.critical,
          heavy: attacker.activeMoveKey === 'heavySlash'
        });
        hitStop = Math.max(hitStop, ev.blocked ? 45 : ev.critical ? 160 : 70);
      }
      if (hitStop > 0) this.fight.hitStopTimer = hitStop;
    }

    this.renderer.particles.update(dt);
    if (!round.isActive()) {
      // Character.update (which normally ticks the hit flash) is skipped between rounds
      p1.flashTimer = Math.max(0, p1.flashTimer - dt * 1000);
      p2.flashTimer = Math.max(0, p2.flashTimer - dt * 1000);
    }
    const prevPhase = round.phase;
    round.update(dt);
    if (round.phase !== prevPhase) {
      if (round.phase === 'intro') this.fight.groundSword = null;
      if (round.phase === 'fight') this.fx({ k: 'sfx', s: 'round' });
      if (round.phase === 'roundend') this.fx({ k: 'sfx', s: round.message === 'K.O.' ? 'ko' : 'round' });
    }
    this.input.endStep();
    if (this.hud) this.hud.refresh();
    if (isHost) this.sendSnapshot();

    if (round.phase === 'matchend' && !this.fight.matchEndHandled) {
      this.fight.matchEndHandled = true;
      this.onMatchEnd(round.matchWinner);
    }
  }

  // One-shot effects. On the host they are also queued for the guest.
  fx(ev) {
    if (this.fight && this.fight.online === 'host') this.fight.netEvents.push(ev);
    this.applyEffect(ev);
  }

  applyEffect(ev) {
    const particles = this.renderer.particles;
    switch (ev.k) {
      case 'sfx':
        this.audio.sfx(ev.s);
        break;
      case 'hit':
        if (ev.blocked) {
          particles.spawnSpark(ev.x, ev.y, '#ffe9a8', 14);
          particles.spawnRing(ev.x, ev.y, '#ffe9a8');
          this.renderer.shake(3, 90);
        } else if (ev.critical) {
          this.renderer.shake(11, 260);
          particles.spawnImpact(ev.x, ev.y, '#ff6b6b', 16);
          particles.spawnSpark(ev.x, ev.y, '#ffffff', 18);
          particles.spawnRing(ev.x, ev.y, '#ff6b6b');
          particles.spawnRing(ev.x, ev.y, '#ffffff');
        } else {
          this.renderer.shake(ev.heavy ? 7 : 3, ev.heavy ? 170 : 100);
          particles.spawnImpact(ev.x, ev.y, '#fff6a0', 10);
          particles.spawnSpark(ev.x, ev.y, '#ffffff', 10);
          particles.spawnRing(ev.x, ev.y, '#fff6a0');
        }
        break;
      case 'disarm':
        particles.spawnSpark(ev.x, ev.y, '#d0d6dc', 12);
        break;
      case 'pickup':
        particles.spawnRing(ev.x, GROUND_Y - 20, '#d0d6dc');
        break;
      default:
        break;
    }
  }

  processEvents(character) {
    for (const ev of character.events) {
      if (ev.type === 'sfx') {
        this.fx({ k: 'sfx', s: ev.sound });
      } else if (ev.type === 'disarmed') {
        // sword flies a little away from the opponent before landing
        const opponent = character === this.fight.p1 ? this.fight.p2 : this.fight.p1;
        const away = character.x >= opponent.x ? 1 : -1;
        const landX = Math.max(STAGE_LEFT + 20, Math.min(STAGE_RIGHT - 20, ev.x + away * 120));
        this.fight.groundSword = { x: landX, owner: character.playerIndex };
        this.fx({ k: 'disarm', x: Math.round(ev.x), y: Math.round(ev.y) });
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
    this.fx({ k: 'pickup', x: Math.round(sword.x) });
  }

  spawnLungeDust(character) {
    const move = character.activeMove;
    if (!move || !move.lunge || !character.grounded) return;
    if (character.stateTime >= move.startup + move.active) return;
    this.fight.dustTick = (this.fight.dustTick || 0) + 1;
    if (this.fight.dustTick % 3 === 0) this.renderer.particles.spawnDust(character.x, character.y, character.facing);
  }

  // ----- Online: host side -----

  // The local player on an online match may use either keyboard layout.
  pollLocalOnline() {
    const a = this.input.pollPlayer(0);
    const b = this.input.pollPlayer(1);
    const out = {};
    for (const key of Object.keys(a)) out[key] = Boolean(a[key] || b[key]);
    return out;
  }

  onRemoteInput(i) {
    if (!this.fight || this.fight.online !== 'host' || !i) return;
    const r = this.fight.remote;
    for (const key of ['left', 'right', 'up', 'down', 'block', 'punch', 'kick']) r.held[key] = Boolean(i[key]);
    // press edges are latched until the host simulation consumes them, so a tap is never lost
    for (const key of ['upPressed', 'punchPressed', 'kickPressed']) r.pressed[key] = r.pressed[key] || Boolean(i[key]);
  }

  takeRemoteInput() {
    const r = this.fight.remote;
    const out = {};
    for (const key of INPUT_KEYS) out[key] = false;
    Object.assign(out, r.held, r.pressed);
    r.pressed = {};
    return out;
  }

  fighterSnapshot(c, now) {
    return {
      x: Math.round(c.x * 10) / 10,
      y: Math.round(c.y * 10) / 10,
      f: c.facing,
      s: c.state,
      st: Math.round(c.stateTime),
      vy: Math.round(c.vy),
      g: c.grounded ? 1 : 0,
      hp: Math.round(c.health * 100) / 100,
      sw: c.hasSword ? 1 : 0,
      fl: c.flashTimer > 0 ? 1 : 0,
      mk: c.activeMoveKey,
      cc: c.comboCount,
      ca: Math.min(99999, Math.round(now - c.lastHitLandedAt)),
      rw: c.roundsWon
    };
  }

  sendSnapshot() {
    if (!this.net) return;
    const { p1, p2, round, groundSword, netEvents } = this.fight;
    const now = performance.now();
    const snap = {
      t: 'snap',
      a: this.fighterSnapshot(p1, now),
      b: this.fighterSnapshot(p2, now),
      r: {
        ph: round.phase,
        msg: round.message,
        tl: Math.round(round.timeLeft * 100) / 100,
        rn: round.roundNumber,
        mw: round.matchWinner ? (round.matchWinner === p1 ? 0 : 1) : -1
      },
      sw: groundSword ? { x: Math.round(groundSword.x), o: groundSword.owner } : null
    };
    if (netEvents.length) {
      snap.ev = netEvents.slice();
      netEvents.length = 0;
    }
    this.net.send(snap);
  }

  // ----- Online: guest side -----

  updateGuest(dt) {
    const f = this.fight;
    const { p1, p2 } = f;

    const input = this.pollLocalOnline();
    const msg = { t: 'in', i: {} };
    for (const key of INPUT_KEYS) msg.i[key] = input[key] ? 1 : 0;
    if (this.net) this.net.send(msg);
    this.input.endStep();

    // keep animations flowing between snapshots
    for (const c of [p1, p2]) {
      c.stateTime += dt * 1000;
      c.animElapsed += dt * 1000;
      if (c.flashTimer > 0) c.flashTimer -= dt * 1000;
    }
    if (f.latest) {
      this.applySnapshot(f.latest);
      f.latest = null;
    }
    this.spawnLungeDust(p1);
    this.spawnLungeDust(p2);
    this.renderer.particles.update(dt);
    if (this.hud) this.hud.refresh();
  }

  onSnapshot(m) {
    if (!this.fight || this.fight.online !== 'guest') return;
    if (m.ev) for (const ev of m.ev) this.applyEffect(ev);
    this.fight.latest = m;
  }

  applySnapshot(m) {
    const { p1, p2, round } = this.fight;
    this.applyFighter(p1, m.a);
    this.applyFighter(p2, m.b);
    round.phase = m.r.ph;
    round.message = m.r.msg;
    round.timeLeft = m.r.tl;
    round.roundNumber = m.r.rn;
    round.matchWinner = m.r.mw < 0 ? null : m.r.mw === 0 ? p1 : p2;
    this.fight.groundSword = m.sw ? { x: m.sw.x, owner: m.sw.o } : null;
  }

  applyFighter(c, d) {
    c.x = d.x;
    c.y = d.y;
    c.facing = d.f;
    c.state = d.s;
    c.stateTime = d.st;
    c.animElapsed = d.st;
    c.vy = d.vy;
    c.grounded = Boolean(d.g);
    c.health = d.hp;
    c.hasSword = Boolean(d.sw);
    c.flashTimer = d.fl ? 100 : 0;
    c.activeMoveKey = d.mk;
    c.activeMove = d.mk ? c.data.moves[d.mk] : null;
    c.comboCount = d.cc;
    c.lastHitLandedAt = performance.now() - d.ca;
    c.roundsWon = d.rw;
  }

  onMatchEnd(winner) {
    this.records.matches += 1;
    this.records.wins[winner.data.id] = (this.records.wins[winner.data.id] || 0) + 1;
    Storage.saveRecords(this.records);
  }

  render(now = performance.now()) {
    this.renderer.beginFrame(now);
    if (this.sceneName === 'fight' && this.fight) {
      this.renderer.drawArena(this.fight.arena, this.bgTime);
      if (this.fight.groundSword) this.renderer.drawSwordOnGround(this.fight.groundSword.x, now);
      this.renderer.drawShadow(this.fight.p1);
      this.renderer.drawShadow(this.fight.p2);
      const order = this.fight.p1.x <= this.fight.p2.x ? [this.fight.p1, this.fight.p2] : [this.fight.p2, this.fight.p1];
      for (const fighter of order) this.renderer.drawFighter(fighter, now);
      this.renderer.particles.draw(this.renderer.ctx);
    } else {
      this.renderer.drawArena(this.bgArena, this.bgTime);
      this.renderer.particles.draw(this.renderer.ctx);
    }
  }
}
