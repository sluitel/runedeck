import { ICardEffect } from './ICardEffect';
import { CombatState } from '../CombatState';

export class HealEffect implements ICardEffect {
  execute(state: CombatState, value: number): void {
    const oldHp = state.playerHp;
    state.playerHp = Math.min(state.playerHp + value, state.playerMaxHp);
    const healed = state.playerHp - oldHp;
    state.combatLog.push(`Healed ${healed} HP`);
  }
}
