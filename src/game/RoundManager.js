import { ROUND_TIME_SECONDS, ROUNDS_TO_WIN } from '../utils/constants.js';

const INTRO_MS = 1300;
const FIGHT_MS = 700;
const ROUND_END_MS = 2000;

export class RoundManager {
  constructor(p1, p2, { infiniteTime = false, trainingMode = false } = {}) {
    this.p1 = p1;
    this.p2 = p2;
    this.infiniteTime = infiniteTime;
    this.trainingMode = trainingMode;
    this.roundNumber = 1;
    this.timeLeft = ROUND_TIME_SECONDS;
    this.phase = 'intro';
    this.phaseTime = 0;
    this.message = `ROUND ${this.roundNumber}`;
    this.matchWinner = null;
    this.onPhaseChange = null;
  }

  startRound() {
    this.p1.reset(this.p1.startX, this.p1.startFacing);
    this.p2.reset(this.p2.startX, this.p2.startFacing);
    this.timeLeft = ROUND_TIME_SECONDS;
    this.phase = 'intro';
    this.phaseTime = 0;
    this.message = `ROUND ${this.roundNumber}`;
  }

  isActive() {
    return this.phase === 'active';
  }

  update(dt) {
    this.phaseTime += dt * 1000;
    if (this.phase === 'intro') {
      if (this.phaseTime >= INTRO_MS) {
        this.phase = 'fight';
        this.phaseTime = 0;
        this.message = 'FIGHT!';
      }
    } else if (this.phase === 'fight') {
      if (this.phaseTime >= FIGHT_MS) {
        this.phase = 'active';
        this.phaseTime = 0;
        this.message = '';
      }
    } else if (this.phase === 'active') {
      if (!this.infiniteTime) {
        this.timeLeft = Math.max(0, this.timeLeft - dt);
      }
      const p1Down = this.p1.health <= 0;
      const p2Down = this.p2.health <= 0;
      if (p1Down || p2Down || this.timeLeft <= 0) {
        this.endRound(p1Down, p2Down);
      }
    } else if (this.phase === 'roundend') {
      if (this.phaseTime >= ROUND_END_MS) {
        if (this.trainingMode) {
          this.startRound();
        } else if (this.matchWinner) {
          this.phase = 'matchend';
        } else {
          this.roundNumber += 1;
          this.startRound();
        }
      }
    }
  }

  endRound(p1Down, p2Down) {
    this.phase = 'roundend';
    this.phaseTime = 0;
    if (p1Down && p2Down) {
      this.message = 'EMPATE DUPLO';
    } else if (p1Down) {
      if (!this.trainingMode) this.p2.roundsWon += 1;
      this.message = 'K.O.';
    } else if (p2Down) {
      if (!this.trainingMode) this.p1.roundsWon += 1;
      this.message = 'K.O.';
    } else {
      this.message = 'TEMPO ESGOTADO';
      if (!this.trainingMode) {
        if (this.p1.health > this.p2.health) this.p1.roundsWon += 1;
        else if (this.p2.health > this.p1.health) this.p2.roundsWon += 1;
      }
    }
    if (this.trainingMode) return;
    if (this.p1.roundsWon >= ROUNDS_TO_WIN) {
      this.matchWinner = this.p1;
    } else if (this.p2.roundsWon >= ROUNDS_TO_WIN) {
      this.matchWinner = this.p2;
    }
  }
}
