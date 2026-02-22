import { ICardEffect } from './ICardEffect';
import { CombatState } from '../CombatState';
import { SeededRandom } from '../SeededRandom';

export class DrawCardsEffect implements ICardEffect {
  execute(state: CombatState, value: number): void {
    for (let i = 0; i < value; i++) {
      if (state.drawPile.length === 0) {
        if (state.discardPile.length === 0) {
          state.combatLog.push('No cards left to draw');
          return;
        }
        // Shuffle discard into draw using deterministic seed from game state
        const rng = new SeededRandom(state.turn * 1000 + state.cardsPlayedThisTurn * 100 + i);
        state.drawPile = [...state.discardPile];
        state.discardPile = [];
        rng.shuffle(state.drawPile);
        state.combatLog.push('Shuffled discard pile into draw pile');
      }

      const card = state.drawPile.pop()!;
      state.hand.push(card);
    }

    state.combatLog.push(`Drew ${value} card(s)`);
  }
}
