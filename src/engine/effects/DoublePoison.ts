import { ICardEffect } from './ICardEffect';
import { CombatState } from '../CombatState';
import { BuffType } from '../../models/Enums';
import { getBuffStacks } from '../BuffUtils';

// Double the enemy's current Poison stacks
export class DoublePoisonEffect implements ICardEffect {
  execute(state: CombatState, _value: number, targetIndex: number = 0): void {
    if (targetIndex < 0 || targetIndex >= state.enemies.length) return;
    const enemy = state.enemies[targetIndex];
    if (enemy.currentHp <= 0) return;

    const poisonBuff = enemy.buffs.find(b => b.type === BuffType.Poison);
    if (poisonBuff && poisonBuff.stacks > 0) {
      const doubled = poisonBuff.stacks;
      poisonBuff.stacks *= 2;
      state.combatLog.push(`Doubled ${enemy.data.enemyName}'s Poison: ${doubled} -> ${poisonBuff.stacks}`);
    } else {
      state.combatLog.push(`${enemy.data.enemyName} has no Poison to double`);
    }
  }
}
