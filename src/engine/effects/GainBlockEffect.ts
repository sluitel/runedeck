import { ICardEffect } from './ICardEffect';
import { CombatState } from '../CombatState';
import { BuffType } from '../../models/Enums';
import { getBuffStacks } from '../BuffUtils';

export class GainBlockEffect implements ICardEffect {
  execute(state: CombatState, value: number): void {
    let block = value;

    // Apply Dexterity
    block += getBuffStacks(state.playerBuffs, BuffType.Dexterity);

    // Apply Frail (25% less block)
    if (getBuffStacks(state.playerBuffs, BuffType.Frail) > 0) {
      block = Math.floor(block * 0.75);
    }

    if (block < 0) block = 0;

    state.playerBlock += block;
    state.combatLog.push(`Gained ${block} Block`);
  }
}
