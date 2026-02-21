import { ICardEffect } from './ICardEffect';
import { CombatState } from '../CombatState';

export class ExhaustEffect implements ICardEffect {
  execute(state: CombatState, _value: number): void {
    // This effect is used as a secondary — the card itself is exhausted
    // The exhaustion is handled by CombatEngine when processing the card
    state.combatLog.push('Card exhausted');
  }
}
