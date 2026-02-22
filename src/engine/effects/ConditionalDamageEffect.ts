import { ICardEffect } from './ICardEffect';
import { CombatState } from '../CombatState';
import { DealDamageEffect } from './DealDamageEffect';
import { BuffType } from '../../models/Enums';
import { getBuffStacks } from '../BuffUtils';

// Deal damage, and if the enemy has Poison, deal it again (Bane)
export class BaneEffect implements ICardEffect {
  private dealDamage = new DealDamageEffect();

  execute(state: CombatState, value: number, targetIndex: number = 0): void {
    this.dealDamage.execute(state, value, targetIndex);

    if (targetIndex >= 0 && targetIndex < state.enemies.length) {
      const enemy = state.enemies[targetIndex];
      if (enemy.currentHp > 0 && getBuffStacks(enemy.buffs, BuffType.Poison) > 0) {
        this.dealDamage.execute(state, value, targetIndex);
        state.combatLog.push('Bane: dealt damage again (enemy is Poisoned)');
      }
    }
  }
}
