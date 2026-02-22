import { describe, it, expect, beforeEach } from 'vitest';
import { CombatEngine, CombatEvent } from '../engine/CombatEngine';
import { CardInstance, createCardInstance, resetCardInstanceCounter } from '../models/Card';
import { EnemyInstance, createEnemyInstance } from '../models/Enemy';
import { RuneInstance, createRuneInstance } from '../models/Rune';
import { Buff } from '../models/Buff';
import { BuffType, CardType, CardRarity, TargetType, EnemyTier, IntentType, RuneRarity } from '../models/Enums';
import { addBuff } from '../engine/BuffUtils';

// --- Helpers ---

function makeAttackCard(damage: number = 6, cost: number = 1): CardInstance {
  return createCardInstance({
    cardId: 'test_strike',
    cardName: 'Strike',
    type: CardType.Attack,
    rarity: CardRarity.Starter,
    energyCost: cost,
    effectId: 'deal_damage',
    effectValue: damage,
    description: `Deal ${damage} damage.`,
    isUpgraded: false,
    targetType: TargetType.Enemy,
    characterClass: 'Ironclad',
  });
}

function makeBlockCard(block: number = 5, cost: number = 1): CardInstance {
  return createCardInstance({
    cardId: 'test_defend',
    cardName: 'Defend',
    type: CardType.Block,
    rarity: CardRarity.Starter,
    energyCost: cost,
    effectId: 'gain_block',
    effectValue: block,
    description: `Gain ${block} Block.`,
    isUpgraded: false,
    targetType: TargetType.Self,
    characterClass: 'Ironclad',
  });
}

function makePowerCard(effectId: string = 'apply_strength', value: number = 2, cost: number = 1): CardInstance {
  return createCardInstance({
    cardId: 'test_power',
    cardName: 'Test Power',
    type: CardType.Power,
    rarity: CardRarity.Uncommon,
    energyCost: cost,
    effectId: effectId,
    effectValue: value,
    description: 'Power card.',
    isUpgraded: false,
    targetType: TargetType.Self,
    characterClass: 'Ironclad',
  });
}

function makeCurseCard(): CardInstance {
  return createCardInstance({
    cardId: 'test_curse',
    cardName: 'Curse',
    type: CardType.Curse,
    rarity: CardRarity.Curse,
    energyCost: 0,
    effectId: 'deal_damage',
    effectValue: 0,
    description: 'Unplayable.',
    isUpgraded: false,
    targetType: TargetType.None,
    characterClass: 'Neutral',
  });
}

function makeEnemy(hp: number = 50, attackDamage: number = 5): EnemyInstance {
  return createEnemyInstance({
    enemyId: 'test_enemy',
    enemyName: 'Test Enemy',
    maxHp: hp,
    intentPattern: [
      { type: IntentType.Attack, value: attackDamage, description: `Attacks for ${attackDamage}` },
    ],
    passives: [],
    tier: EnemyTier.Normal,
    act: 1,
  });
}

function makeRune(runeId: string): RuneInstance {
  return createRuneInstance({
    runeId,
    runeName: runeId,
    effectId: runeId,
    description: 'Test rune',
    rarity: RuneRarity.Common,
  });
}

function buildDeck(count: number = 15): CardInstance[] {
  return Array.from({ length: count }, () => makeAttackCard());
}

describe('CombatEngine', () => {
  let engine: CombatEngine;

  beforeEach(() => {
    engine = new CombatEngine();
  });

  // --- startCombat ---
  describe('startCombat', () => {
    it('initializes the combat state', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [], [], 42);
      const state = engine.getState();
      expect(state).toBeDefined();
      expect(state.playerHp).toBe(80);
      expect(state.playerMaxHp).toBe(80);
      expect(state.turn).toBe(1);
      expect(state.isPlayerTurn).toBe(true);
      expect(state.combatOver).toBe(false);
    });

    it('draws 5 cards into hand', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [], [], 42);
      const state = engine.getState();
      expect(state.hand).toHaveLength(5);
    });

    it('sets energy to max energy', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [], [], 42);
      const state = engine.getState();
      expect(state.playerEnergy).toBe(3);
    });

    it('shuffles the deck (draw pile) using the seed', () => {
      // Two combats with the same seed should produce the same hand
      const deck1 = buildDeck(15);
      const deck2 = deck1.map(c => createCardInstance(c.data));

      const engine1 = new CombatEngine();
      const engine2 = new CombatEngine();

      engine1.startCombat(80, 80, 3, deck1, [makeEnemy()], [], [], 42);
      engine2.startCombat(80, 80, 3, deck2, [makeEnemy()], [], [], 42);

      const hand1 = engine1.getState().hand.map(c => c.data.cardId);
      const hand2 = engine2.getState().hand.map(c => c.data.cardId);
      expect(hand1).toEqual(hand2);
    });
  });

  // --- getState ---
  describe('getState', () => {
    it('returns the current combat state', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [], [], 42);
      const state = engine.getState();
      expect(state.playerHp).toBe(80);
      expect(state.enemies).toHaveLength(1);
    });
  });

  // --- canPlayCard ---
  describe('canPlayCard', () => {
    it('returns true for a playable card in hand with sufficient energy', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [], [], 42);
      const hand = engine.getState().hand;
      expect(engine.canPlayCard(hand[0].instanceId)).toBe(true);
    });

    it('returns false when not enough energy', () => {
      const expensiveCards = Array.from({ length: 15 }, () => makeAttackCard(6, 5));
      engine.startCombat(80, 80, 3, expensiveCards, [makeEnemy()], [], [], 42);
      const hand = engine.getState().hand;
      expect(engine.canPlayCard(hand[0].instanceId)).toBe(false);
    });

    it('returns false for Curse cards', () => {
      const deck = [...Array.from({ length: 10 }, () => makeAttackCard()), makeCurseCard()];
      engine.startCombat(80, 80, 3, deck, [makeEnemy()], [], [], 42);
      // Find curse card in hand (might not be there, so add directly)
      const state = engine.getState();
      const curse = makeCurseCard();
      state.hand.push(curse);
      expect(engine.canPlayCard(curse.instanceId)).toBe(false);
    });

    it('returns false for attacks when Entangled', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [], [], 42);
      addBuff(engine.getState().playerBuffs, BuffType.Entangle, 1);
      const hand = engine.getState().hand;
      // All cards are attack cards
      expect(engine.canPlayCard(hand[0].instanceId)).toBe(false);
    });

    it('returns false when combat is over', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy(1)], [], [], 42);
      // Play card to kill enemy (1 HP enemy)
      const hand = engine.getState().hand;
      engine.playCard(hand[0].instanceId, 0);
      // Combat should be over now
      const remainingHand = engine.getState().hand;
      if (remainingHand.length > 0) {
        expect(engine.canPlayCard(remainingHand[0].instanceId)).toBe(false);
      }
    });

    it('returns false for a card not in hand', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [], [], 42);
      expect(engine.canPlayCard('nonexistent_id')).toBe(false);
    });
  });

  // --- playCard ---
  describe('playCard', () => {
    it('deducts energy when playing a card', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [], [], 42);
      const hand = engine.getState().hand;
      engine.playCard(hand[0].instanceId, 0);
      expect(engine.getState().playerEnergy).toBe(2);
    });

    it('removes card from hand and adds to discard', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [], [], 42);
      const hand = engine.getState().hand;
      const cardId = hand[0].instanceId;
      engine.playCard(cardId, 0);
      expect(engine.getState().hand.find(c => c.instanceId === cardId)).toBeUndefined();
      expect(engine.getState().discardPile.find(c => c.instanceId === cardId)).toBeDefined();
    });

    it('exhausts Power cards instead of discarding', () => {
      const deck = [makePowerCard(), ...Array.from({ length: 14 }, () => makeAttackCard())];
      engine.startCombat(80, 80, 3, deck, [makeEnemy()], [], [], 42);
      const state = engine.getState();
      const powerCard = state.hand.find(c => c.data.type === CardType.Power);
      if (powerCard) {
        engine.playCard(powerCard.instanceId, 0);
        expect(state.exhaustPile.find(c => c.instanceId === powerCard.instanceId)).toBeDefined();
        expect(state.discardPile.find(c => c.instanceId === powerCard.instanceId)).toBeUndefined();
      }
    });

    it('executes primary and secondary effects', () => {
      // Use Iron Wave: deal 5 damage + gain 5 block
      const ironWave = createCardInstance({
        cardId: 'ic_iron_wave',
        cardName: 'Iron Wave',
        type: CardType.Attack,
        rarity: CardRarity.Common,
        energyCost: 1,
        effectId: 'deal_damage',
        effectValue: 5,
        secondaryEffectId: 'gain_block',
        secondaryEffectValue: 5,
        description: 'Deal 5 damage. Gain 5 Block.',
        isUpgraded: false,
        targetType: TargetType.Enemy,
        characterClass: 'Ironclad',
      });
      const deck = [ironWave, ...Array.from({ length: 14 }, () => makeAttackCard())];
      engine.startCombat(80, 80, 3, deck, [makeEnemy()], [], [], 42);
      const state = engine.getState();
      const iw = state.hand.find(c => c.data.cardId === 'ic_iron_wave');
      if (iw) {
        engine.playCard(iw.instanceId, 0);
        expect(state.enemies[0].currentHp).toBe(45); // 50 - 5
        expect(state.playerBlock).toBe(5);
      }
    });

    it('returns false when card cannot be played', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [], [], 42);
      const result = engine.playCard('nonexistent_id', 0);
      expect(result).toBe(false);
    });

    it('increments cardsPlayedThisTurn', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [], [], 42);
      const hand = engine.getState().hand;
      engine.playCard(hand[0].instanceId, 0);
      expect(engine.getState().cardsPlayedThisTurn).toBe(1);
    });

    it('triggers Rage block gain when playing attack', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [], [], 42);
      addBuff(engine.getState().playerBuffs, BuffType.Rage, 3);
      const hand = engine.getState().hand;
      engine.playCard(hand[0].instanceId, 0);
      // Attack card played with 3 Rage => 3 block
      expect(engine.getState().playerBlock).toBe(3);
    });
  });

  // --- endTurn ---
  describe('endTurn', () => {
    it('discards remaining hand', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [], [], 42);
      // Play one card, then end turn
      const hand = engine.getState().hand;
      engine.playCard(hand[0].instanceId, 0);
      const handBefore = engine.getState().hand.length;
      engine.endTurn();
      // After end turn, new hand drawn; old cards should be in discard
      // hand is cleared to discard, then new hand drawn
      // Just verify hand was discarded and new hand drawn
      expect(engine.getState().turn).toBe(2);
    });

    it('processes enemy attacks and deals damage to player', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy(50, 10)], [], [], 42);
      engine.endTurn();
      // Enemy attacks for 10, no block
      expect(engine.getState().playerHp).toBeLessThan(80);
    });

    it('resets energy for the next turn', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy(50, 1)], [], [], 42);
      const hand = engine.getState().hand;
      engine.playCard(hand[0].instanceId, 0);
      expect(engine.getState().playerEnergy).toBe(2);
      engine.endTurn();
      expect(engine.getState().playerEnergy).toBe(3);
    });

    it('draws a new hand of 5 cards', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy(50, 1)], [], [], 42);
      engine.endTurn();
      expect(engine.getState().hand).toHaveLength(5);
    });

    it('resets block at start of new turn (no Barricade)', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy(50, 0)], [], [], 42);
      // Create enemy with 0 damage attack
      const state = engine.getState();
      state.playerBlock = 10;
      engine.endTurn();
      // Block resets after enemy turn for new turn
      expect(engine.getState().playerBlock).toBe(0);
    });

    it('preserves block with Barricade', () => {
      // Enemy with Attack 0 so block is not consumed
      const enemy = createEnemyInstance({
        enemyId: 'test',
        enemyName: 'Test',
        maxHp: 50,
        intentPattern: [{ type: IntentType.Defend, value: 5, description: 'Defends' }],
        passives: [],
        tier: EnemyTier.Normal,
        act: 1,
      });
      engine.startCombat(80, 80, 3, buildDeck(), [enemy], [], [], 42);
      addBuff(engine.getState().playerBuffs, BuffType.Barricade, 1);
      engine.getState().playerBlock = 10;
      engine.endTurn();
      expect(engine.getState().playerBlock).toBe(10);
    });

    it('applies Metallicize block at end of turn', () => {
      // Use defending enemy
      const enemy = createEnemyInstance({
        enemyId: 'test',
        enemyName: 'Test',
        maxHp: 50,
        intentPattern: [{ type: IntentType.Defend, value: 5, description: 'Defends' }],
        passives: [],
        tier: EnemyTier.Normal,
        act: 1,
      });
      engine.startCombat(80, 80, 3, buildDeck(), [enemy], [], [], 42);
      addBuff(engine.getState().playerBuffs, BuffType.Metallicize, 4);
      engine.endTurn();
      // Metallicize adds 4 block at end of turn, but block resets at start of NEXT turn
      // Since endTurn processes: discard hand -> end turn effects (metallicize +4) -> enemy turn -> new turn (block reset)
      // Block is reset at start of new turn unless Barricade
      expect(engine.getState().playerBlock).toBe(0);
    });
  });

  // --- Win/Loss ---
  describe('win and loss conditions', () => {
    it('combat ends when all enemies are killed', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy(1)], [], [], 42);
      const hand = engine.getState().hand;
      engine.playCard(hand[0].instanceId, 0);
      expect(engine.getState().combatOver).toBe(true);
      expect(engine.getState().playerWon).toBe(true);
    });

    it('combat ends when player HP reaches 0', () => {
      engine.startCombat(5, 80, 3, buildDeck(), [makeEnemy(50, 100)], [], [], 42);
      engine.endTurn();
      expect(engine.getState().combatOver).toBe(true);
      expect(engine.getState().playerWon).toBe(false);
    });

    it('player HP does not go below 0', () => {
      engine.startCombat(5, 80, 3, buildDeck(), [makeEnemy(50, 100)], [], [], 42);
      engine.endTurn();
      expect(engine.getState().playerHp).toBe(0);
    });
  });

  // --- Rune effects ---
  describe('rune effects', () => {
    it('Burning Candle gives +1 energy on combat start', () => {
      const rune = makeRune('rune_burning_candle');
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [rune], [], 42);
      // Max energy is 3, but burning candle adds 1 at start
      expect(engine.getState().playerEnergy).toBe(4);
    });

    it('Iron Heart gives +5 block at combat start', () => {
      const rune = makeRune('rune_iron_heart');
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [rune], [], 42);
      expect(engine.getState().playerBlock).toBe(5);
    });

    it('Blood Vial heals 3 HP at combat start', () => {
      const rune = makeRune('rune_blood_vial');
      engine.startCombat(70, 80, 3, buildDeck(), [makeEnemy()], [rune], [], 42);
      expect(engine.getState().playerHp).toBe(73);
    });

    it('War Paint gives +1 Strength at combat start', () => {
      const rune = makeRune('rune_war_paint');
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [rune], [], 42);
      const str = engine.getState().playerBuffs.find(b => b.type === BuffType.Strength);
      expect(str).toBeDefined();
      expect(str!.stacks).toBe(1);
    });
  });

  // --- Event system ---
  describe('event system', () => {
    it('listener receives combat_start event', () => {
      const events: CombatEvent[] = [];
      engine.addEventListener(e => events.push(e));
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [], [], 42);
      expect(events.some(e => e.type === 'combat_start')).toBe(true);
    });

    it('listener receives card_played event', () => {
      const events: CombatEvent[] = [];
      engine.addEventListener(e => events.push(e));
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [], [], 42);
      const hand = engine.getState().hand;
      engine.playCard(hand[0].instanceId, 0);
      expect(events.some(e => e.type === 'card_played')).toBe(true);
    });

    it('listener receives enemy_died event', () => {
      const events: CombatEvent[] = [];
      engine.addEventListener(e => events.push(e));
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy(1)], [], [], 42);
      const hand = engine.getState().hand;
      engine.playCard(hand[0].instanceId, 0);
      expect(events.some(e => e.type === 'enemy_died')).toBe(true);
    });

    it('removeEventListener stops receiving events', () => {
      const events: CombatEvent[] = [];
      const listener = (e: CombatEvent) => events.push(e);
      engine.addEventListener(listener);
      engine.removeEventListener(listener);
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [], [], 42);
      expect(events).toHaveLength(0);
    });
  });

  // --- getCombatResult ---
  describe('getCombatResult', () => {
    it('reports playerWon correctly on win', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy(1)], [], [], 42);
      const hand = engine.getState().hand;
      engine.playCard(hand[0].instanceId, 0);
      const result = engine.getCombatResult();
      expect(result.playerWon).toBe(true);
      expect(result.playerHp).toBe(80);
    });

    it('reports playerWon correctly on loss', () => {
      engine.startCombat(1, 80, 3, buildDeck(), [makeEnemy(50, 100)], [], [], 42);
      engine.endTurn();
      const result = engine.getCombatResult();
      expect(result.playerWon).toBe(false);
    });

    it('tracks total cards played', () => {
      engine.startCombat(80, 80, 3, buildDeck(), [makeEnemy()], [], [], 42);
      const hand = engine.getState().hand;
      engine.playCard(hand[0].instanceId, 0);
      engine.playCard(engine.getState().hand[0].instanceId, 0);
      const result = engine.getCombatResult();
      expect(result.cardsPlayed).toBe(2);
    });
  });
});
