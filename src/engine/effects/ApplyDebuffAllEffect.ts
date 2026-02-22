import { ICardEffect } from './ICardEffect';
import { CombatState } from '../CombatState';
import { BuffType } from '../../models/Enums';
import { addBuff, getBuffStacks } from '../BuffUtils';
import { getBuffName } from '../../models/Buff';

// Apply a debuff to ALL enemies
export class ApplyDebuffAllEffect implements ICardEffect {
  private buffType: BuffType;

  constructor(buffType: BuffType) {
    this.buffType = buffType;
  }

  execute(state: CombatState, value: number): void {
    for (const enemy of state.enemies) {
      if (enemy.currentHp <= 0) continue;

      // Check for Artifact
      const artifactBuff = enemy.buffs.find(b => b.type === BuffType.Artifact);
      if (artifactBuff && artifactBuff.stacks > 0) {
        artifactBuff.stacks--;
        if (artifactBuff.stacks <= 0) {
          enemy.buffs = enemy.buffs.filter(b => b.type !== BuffType.Artifact);
        }
        state.combatLog.push(`${enemy.data.enemyName} negated ${getBuffName(this.buffType)} with Artifact`);
        continue;
      }

      addBuff(enemy.buffs, this.buffType, value);
      state.combatLog.push(`Applied ${value} ${getBuffName(this.buffType)} to ${enemy.data.enemyName}`);
    }
  }
}
