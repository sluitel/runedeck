import { ICardEffect } from './ICardEffect';
import { CombatState } from '../CombatState';
import { BuffType } from '../../models/Enums';
import { getBuffStacks } from '../BuffUtils';

export class DealDamageEffect implements ICardEffect {
  execute(state: CombatState, value: number, targetIndex: number = 0): void {
    if (targetIndex < 0 || targetIndex >= state.enemies.length) return;
    const enemy = state.enemies[targetIndex];
    if (enemy.currentHp <= 0) return;

    let damage = value;

    // Apply player Strength
    damage += getBuffStacks(state.playerBuffs, BuffType.Strength);

    // Apply Weak (player deals 25% less)
    if (getBuffStacks(state.playerBuffs, BuffType.Weak) > 0) {
      damage = Math.floor(damage * 0.75);
    }

    // Apply Vulnerable on enemy (takes 50% more)
    if (getBuffStacks(enemy.buffs, BuffType.Vulnerable) > 0) {
      damage = Math.floor(damage * 1.5);
    }

    if (damage < 0) damage = 0;

    // Apply damage to block first, then HP
    const blockedDamage = Math.min(enemy.block, damage);
    enemy.block -= blockedDamage;
    const remainingDamage = damage - blockedDamage;

    if (remainingDamage > 0) {
      enemy.currentHp -= remainingDamage;
      if (enemy.currentHp < 0) enemy.currentHp = 0;
    }

    state.combatLog.push(`Dealt ${damage} damage to ${enemy.data.enemyName} (${blockedDamage} blocked)`);
  }
}
