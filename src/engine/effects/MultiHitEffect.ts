import { ICardEffect } from './ICardEffect';
import { CombatState } from '../CombatState';
import { DealDamageEffect } from './DealDamageEffect';

// Deal damage multiple times. value = damage per hit, hits stored as secondary
export class MultiHitEffect implements ICardEffect {
  private dealDamage = new DealDamageEffect();
  private hits: number;

  constructor(hits: number) {
    this.hits = hits;
  }

  execute(state: CombatState, value: number, targetIndex: number = 0): void {
    for (let i = 0; i < this.hits; i++) {
      // Pick random alive enemy for each hit (for Sword Boomerang style)
      const aliveEnemies = state.enemies
        .map((e, idx) => ({ e, idx }))
        .filter(({ e }) => e.currentHp > 0);
      if (aliveEnemies.length === 0) return;

      const target = targetIndex >= 0 && targetIndex < state.enemies.length && state.enemies[targetIndex].currentHp > 0
        ? targetIndex
        : aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)].idx;

      this.dealDamage.execute(state, value, target);
    }
  }
}
