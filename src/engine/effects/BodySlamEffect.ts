import { ICardEffect } from './ICardEffect';
import { CombatState } from '../CombatState';
import { DealDamageEffect } from './DealDamageEffect';

// Deal damage equal to your current Block
export class BodySlamEffect implements ICardEffect {
  private dealDamage = new DealDamageEffect();

  execute(state: CombatState, _value: number, targetIndex: number = 0): void {
    this.dealDamage.execute(state, state.playerBlock, targetIndex);
  }
}
