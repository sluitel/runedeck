import { ICardEffect } from './ICardEffect';
import { CombatState } from '../CombatState';

export class GainEnergyEffect implements ICardEffect {
  execute(state: CombatState, value: number): void {
    state.playerEnergy += value;
    state.combatLog.push(`Gained ${value} Energy`);
  }
}
