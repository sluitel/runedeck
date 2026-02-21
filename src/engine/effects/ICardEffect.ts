import { CombatState } from '../CombatState';

export interface ICardEffect {
  execute(state: CombatState, value: number, targetIndex?: number): void;
}
