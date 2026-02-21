import { ICardEffect } from './ICardEffect';
import { CombatState } from '../CombatState';
import { BuffType } from '../../models/Enums';
import { addBuff } from '../BuffUtils';
import { getBuffName } from '../../models/Buff';

export class ApplyBuffEffect implements ICardEffect {
  private buffType: BuffType;

  constructor(buffType: BuffType) {
    this.buffType = buffType;
  }

  execute(state: CombatState, value: number): void {
    addBuff(state.playerBuffs, this.buffType, value);
    state.combatLog.push(`Gained ${value} ${getBuffName(this.buffType)}`);
  }
}
