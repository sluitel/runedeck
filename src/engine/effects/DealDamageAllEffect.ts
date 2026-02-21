import { ICardEffect } from './ICardEffect';
import { CombatState } from '../CombatState';
import { DealDamageEffect } from './DealDamageEffect';

export class DealDamageAllEffect implements ICardEffect {
  private singleDamage = new DealDamageEffect();

  execute(state: CombatState, value: number): void {
    for (let i = 0; i < state.enemies.length; i++) {
      if (state.enemies[i].currentHp > 0) {
        this.singleDamage.execute(state, value, i);
      }
    }
  }
}
