import { rectsOverlap, separateFighters } from './CollisionSystem.js';
import { STAGE_LEFT, STAGE_RIGHT, GROUND_Y } from '../utils/constants.js';

let nextProjectileId = 1;

export class CombatSystem {
  constructor() {
    this.projectiles = [];
    this.hitEvents = [];
  }

  spawnProjectile(event) {
    this.projectiles.push({
      id: nextProjectileId++,
      x: event.x,
      y: event.y,
      vx: event.facing * 460,
      facing: event.facing,
      owner: event.owner,
      move: event.move,
      life: 1100,
      hasHit: false
    });
  }

  update(dt, fighters) {
    this.hitEvents.length = 0;
    this.updateProjectiles(dt, fighters);
    this.resolveMeleeAttacks(fighters);
    separateFighters(fighters[0], fighters[1]);
  }

  updateProjectiles(dt, fighters) {
    for (const proj of this.projectiles) {
      proj.x += proj.vx * dt;
      proj.life -= dt * 1000;
      const defender = fighters.find((f) => f.playerIndex !== proj.owner);
      if (!proj.hasHit && defender.health > 0) {
        const box = { x: proj.x - 16, y: proj.y - 16, w: 32, h: 32 };
        if (rectsOverlap(box, defender.getHurtbox())) {
          const blocked = defender.state === 'block';
          const { damage, critical } = defender.receiveHit(proj.move, proj.facing, { blocked });
          this.hitEvents.push({ attackerIndex: proj.owner, defenderIndex: defender.playerIndex, damage, blocked, critical, x: defender.x, y: proj.y });
          proj.hasHit = true;
          proj.life = 0;
        }
      }
    }
    this.projectiles = this.projectiles.filter(
      (p) => p.life > 0 && p.x > STAGE_LEFT - 60 && p.x < STAGE_RIGHT + 60
    );
  }

  resolveMeleeAttacks(fighters) {
    const [a, b] = fighters;
    this.resolveOneDirection(a, b);
    this.resolveOneDirection(b, a);
  }

  resolveOneDirection(attacker, defender) {
    if (!attacker.isHitActive() || defender.health <= 0) return;
    const pulseIndex = attacker.currentPulseIndex();
    if (pulseIndex < attacker.hitsLandedThisAttack) return;

    const hitbox = attacker.getHitbox();
    if (!hitbox || attacker.activeMove.projectile) return;
    if (!rectsOverlap(hitbox, defender.getHurtbox())) return;

    attacker.hitsLandedThisAttack = pulseIndex + 1;

    const blocked = defender.state === 'block';
    const { damage, critical } = defender.receiveHit(attacker.activeMove, attacker.facing, { blocked });
    this.hitEvents.push({ attackerIndex: attacker.playerIndex, defenderIndex: defender.playerIndex, damage, blocked, critical, x: defender.x, y: defender.y - 100 });
  }

  reset() {
    this.projectiles = [];
    this.hitEvents.length = 0;
  }
}
