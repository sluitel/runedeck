import { ICardEffect } from './ICardEffect';
import { CombatState } from '../CombatState';
import { BuffType } from '../../models/Enums';
import { addBuff, getBuffStacks } from '../BuffUtils';
import { getBuffName } from '../../models/Buff';

export class ApplyDebuffEffect implements ICardEffect {
  private buffType: BuffType;

  constructor(buffType: BuffType) {
    this.buffType = buffType;
  }

  execute(state: CombatState, value: number, targetIndex: number = 0): void {
    if (targetIndex < 0 || targetIndex >= state.enemies.length) return;
    const enemy = state.enemies[targetIndex];

    // Check for Artifact
    const artifactStacks = getBuffStacks(enemy.buffs, BuffType.Artifact);
    if (artifactStacks > 0) {
      // Consume one Artifact stack
      const artifactBuff = enemy.buffs.find(b => b.type === BuffType.Artifact);
      if (artifactBuff) {
        artifactBuff.stacks--;
        if (artifactBuff.stacks <= 0) {
          enemy.buffs = enemy.buffs.filter(b => b.type !== BuffType.Artifact);
        }
      }
      state.combatLog.push(`${enemy.data.enemyName} negated ${getBuffName(this.buffType)} with Artifact`);
      return;
    }

    addBuff(enemy.buffs, this.buffType, value);
    state.combatLog.push(`Applied ${value} ${getBuffName(this.buffType)} to ${enemy.data.enemyName}`);
  }
}
