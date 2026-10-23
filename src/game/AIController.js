const DIFFICULTY_PROFILES = {
  facil: { reaction: 480, aggressiveness: 0.22, blockChance: 0.12, heavyChance: 0.15, jumpChance: 0.04 },
  normal: { reaction: 300, aggressiveness: 0.4, blockChance: 0.3, heavyChance: 0.3, jumpChance: 0.06 },
  dificil: { reaction: 150, aggressiveness: 0.62, blockChance: 0.52, heavyChance: 0.45, jumpChance: 0.08 }
};

const ATTACK_RANGE = 95;
const PREFERRED_RANGE = 140;

export class AIController {
  constructor(difficulty = 'normal') {
    this.setDifficulty(difficulty);
    this.decisionTimer = 0;
    this.intent = { moveDir: 0, wantBlock: false, wantJump: false };
    this.held = { left: false, right: false, up: false, down: false, punch: false, kick: false, block: false };
    this.prevHeld = { ...this.held };
  }

  setDifficulty(difficulty) {
    this.profile = DIFFICULTY_PROFILES[difficulty] || DIFFICULTY_PROFILES.normal;
  }

  decide(self, opponent, groundSword) {
    const dx = opponent.x - self.x;
    const dist = Math.abs(dx);
    const dir = Math.sign(dx) || 1;
    const p = this.profile;

    this.intent.moveDir = 0;
    this.intent.wantBlock = false;
    this.intent.wantJump = false;
    this.wantPunch = false;
    this.wantKick = false;
    this.wantCrouch = false;

    if (!self.hasSword) {
      if (groundSword && groundSword.owner === self.playerIndex) {
        this.intent.moveDir = Math.sign(groundSword.x - self.x);
        // jump over the opponent if they stand between us and the sword
        const blocking = Math.sign(opponent.x - self.x) === this.intent.moveDir && dist < 70;
        if (blocking && Math.random() < 0.5) this.intent.wantJump = true;
      }
      return;
    }

    const opponentAttacking = opponent.isAttacking() && opponent.stateTime < (opponent.activeMove?.startup || 0) + (opponent.activeMove?.active || 0) + 60;

    if (opponentAttacking && dist < 150 && Math.random() < p.blockChance) {
      this.intent.wantBlock = true;
      return;
    }

    if (dist > PREFERRED_RANGE) {
      this.intent.moveDir = dir;
      if (Math.random() < p.jumpChance) this.intent.wantJump = true;
      return;
    }

    if (dist < ATTACK_RANGE * 0.5 && Math.random() < 0.3) {
      this.intent.moveDir = -dir; // back off a bit to avoid always trading
      return;
    }

    if (dist <= ATTACK_RANGE && Math.random() < p.aggressiveness) {
      this.wantPunch = Math.random() < 0.55;
      this.wantKick = !this.wantPunch;
      // sometimes throws the heavier crouching variant (hook / low kick)
      this.wantCrouch = Math.random() < p.heavyChance;
      return;
    }

    if (dist > ATTACK_RANGE && dist <= PREFERRED_RANGE) {
      this.intent.moveDir = dir;
    }
  }

  getInput(dt, self, opponent, groundSword = null) {
    this.decisionTimer -= dt * 1000;
    if (this.decisionTimer <= 0) {
      this.decide(self, opponent, groundSword);
      // while hunting for a dropped sword, re-evaluate more often so it doesn't overshoot
      this.decisionTimer = self.hasSword ? this.profile.reaction : 80;
    }

    this.prevHeld = { ...this.held };
    this.held.left = this.intent.moveDir < 0;
    this.held.right = this.intent.moveDir > 0;
    this.held.up = this.intent.wantJump;
    this.held.down = this.wantCrouch;
    this.held.block = this.intent.wantBlock;
    this.held.punch = this.wantPunch;
    this.held.kick = this.wantKick;

    const edge = (key) => this.held[key] && !this.prevHeld[key];
    return {
      left: this.held.left,
      right: this.held.right,
      up: this.held.up,
      down: this.held.down,
      block: this.held.block,
      punch: this.held.punch,
      kick: this.held.kick,
      upPressed: edge('up'),
      punchPressed: edge('punch'),
      kickPressed: edge('kick')
    };
  }
}
