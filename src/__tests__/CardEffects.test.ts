import { describe, it, expect, beforeEach } from 'vitest';
import { CombatState, createCombatState } from '../engine/CombatState';
import { CardInstance, createCardInstance } from '../models/Card';
import { EnemyInstance, createEnemyInstance } from '../models/Enemy';
import { BuffType, CardType, CardRarity, TargetType, EnemyTier, IntentType } from '../models/Enums';
import { DealDamageEffect } from '../engine/effects/DealDamageEffect';
import { DealDamageAllEffect } from '../engine/effects/DealDamageAllEffect';
import { GainBlockEffect } from '../engine/effects/GainBlockEffect';
import { DrawCardsEffect } from '../engine/effects/DrawCardsEffect';
import { ApplyBuffEffect } from '../engine/effects/ApplyBuffEffect';
import { ApplyDebuffEffect } from '../engine/effects/ApplyDebuffEffect';
import { GainEnergyEffect } from '../engine/effects/GainEnergyEffect';
import { HealEffect } from '../engine/effects/HealEffect';
import { ExhaustEffect } from '../engine/effects/ExhaustEffect';
import { getEffect } from '../engine/effects/EffectRegistry';
import { addBuff } from '../engine/BuffUtils';

function makeEnemy(hp: number = 50, name: string = 'Test Enemy'): EnemyInstance {
  return createEnemyInstance({
    enemyId: 'test_enemy',
    enemyName: name,
    maxHp: hp,
    intentPattern: [{ type: IntentType.Attack, value: 5, description: 'Attacks for 5' }],
    passives: [],
    tier: EnemyTier.Normal,
    act: 1,
  });
}

function makeCard(): CardInstance {
  return createCardInstance({
    cardId: 'test_card',
    cardName: 'Test Card',
    type: CardType.Attack,
    rarity: CardRarity.Common,
    energyCost: 1,
    effectId: 'deal_damage',
    effectValue: 6,
    description: 'Test',
    isUpgraded: false,
    targetType: TargetType.Enemy,
    characterClass: 'Neutral',
  });
}

function makeState(enemyCount: number = 1, enemyHp: number = 50): CombatState {
  const enemies = Array.from({ length: enemyCount }, () => makeEnemy(enemyHp));
  const deck = Array.from({ length: 10 }, () => makeCard());
  return createCombatState(80, 80, 3, deck, enemies, [], []);
}

describe('CardEffects', () => {
  // --- DealDamageEffect ---
  describe('DealDamageEffect', () => {
    it('deals base damage to enemy', () => {
      const state = makeState();
      const effect = new DealDamageEffect();
      effect.execute(state, 10, 0);
      expect(state.enemies[0].currentHp).toBe(40);
    });

    it('applies Strength bonus', () => {
      const state = makeState();
      addBuff(state.playerBuffs, BuffType.Strength, 3);
      const effect = new DealDamageEffect();
      effect.execute(state, 10, 0);
      // 10 + 3 = 13 damage => 50 - 13 = 37
      expect(state.enemies[0].currentHp).toBe(37);
    });

    it('applies Weak penalty (25% less)', () => {
      const state = makeState();
      addBuff(state.playerBuffs, BuffType.Weak, 2);
      const effect = new DealDamageEffect();
      effect.execute(state, 10, 0);
      // floor(10 * 0.75) = 7 => 50 - 7 = 43
      expect(state.enemies[0].currentHp).toBe(43);
    });

    it('applies Vulnerable on enemy (50% more)', () => {
      const state = makeState();
      addBuff(state.enemies[0].buffs, BuffType.Vulnerable, 2);
      const effect = new DealDamageEffect();
      effect.execute(state, 10, 0);
      // floor(10 * 1.5) = 15 => 50 - 15 = 35
      expect(state.enemies[0].currentHp).toBe(35);
    });

    it('applies Strength and Vulnerable together', () => {
      const state = makeState();
      addBuff(state.playerBuffs, BuffType.Strength, 2);
      addBuff(state.enemies[0].buffs, BuffType.Vulnerable, 2);
      const effect = new DealDamageEffect();
      effect.execute(state, 10, 0);
      // (10 + 2) = 12 => floor(12 * 1.5) = 18 => 50 - 18 = 32
      expect(state.enemies[0].currentHp).toBe(32);
    });

    it('respects enemy block', () => {
      const state = makeState();
      state.enemies[0].block = 6;
      const effect = new DealDamageEffect();
      effect.execute(state, 10, 0);
      // 10 damage - 6 block = 4 to HP => 50 - 4 = 46
      expect(state.enemies[0].currentHp).toBe(46);
      expect(state.enemies[0].block).toBe(0);
    });

    it('does not reduce HP below 0', () => {
      const state = makeState(1, 5);
      const effect = new DealDamageEffect();
      effect.execute(state, 100, 0);
      expect(state.enemies[0].currentHp).toBe(0);
    });

    it('does nothing for invalid target index', () => {
      const state = makeState();
      const effect = new DealDamageEffect();
      effect.execute(state, 10, 5); // index 5 is out of bounds
      expect(state.enemies[0].currentHp).toBe(50);
    });

    it('does nothing for dead enemies', () => {
      const state = makeState();
      state.enemies[0].currentHp = 0;
      const effect = new DealDamageEffect();
      effect.execute(state, 10, 0);
      expect(state.enemies[0].currentHp).toBe(0);
    });
  });

  // --- DealDamageAllEffect ---
  describe('DealDamageAllEffect', () => {
    it('deals damage to all living enemies', () => {
      const state = makeState(3, 30);
      const effect = new DealDamageAllEffect();
      effect.execute(state, 8);
      expect(state.enemies[0].currentHp).toBe(22);
      expect(state.enemies[1].currentHp).toBe(22);
      expect(state.enemies[2].currentHp).toBe(22);
    });

    it('skips dead enemies', () => {
      const state = makeState(3, 30);
      state.enemies[1].currentHp = 0;
      const effect = new DealDamageAllEffect();
      effect.execute(state, 8);
      expect(state.enemies[0].currentHp).toBe(22);
      expect(state.enemies[1].currentHp).toBe(0);
      expect(state.enemies[2].currentHp).toBe(22);
    });
  });

  // --- GainBlockEffect ---
  describe('GainBlockEffect', () => {
    it('adds block to player', () => {
      const state = makeState();
      const effect = new GainBlockEffect();
      effect.execute(state, 5);
      expect(state.playerBlock).toBe(5);
    });

    it('stacks block on existing block', () => {
      const state = makeState();
      state.playerBlock = 3;
      const effect = new GainBlockEffect();
      effect.execute(state, 5);
      expect(state.playerBlock).toBe(8);
    });

    it('applies Dexterity bonus', () => {
      const state = makeState();
      addBuff(state.playerBuffs, BuffType.Dexterity, 2);
      const effect = new GainBlockEffect();
      effect.execute(state, 5);
      // 5 + 2 = 7
      expect(state.playerBlock).toBe(7);
    });

    it('applies Frail penalty (25% less)', () => {
      const state = makeState();
      addBuff(state.playerBuffs, BuffType.Frail, 2);
      const effect = new GainBlockEffect();
      effect.execute(state, 8);
      // floor(8 * 0.75) = 6
      expect(state.playerBlock).toBe(6);
    });

    it('block does not go below 0', () => {
      const state = makeState();
      addBuff(state.playerBuffs, BuffType.Frail, 2);
      addBuff(state.playerBuffs, BuffType.Dexterity, -5); // negative dex (hypothetical)
      const effect = new GainBlockEffect();
      effect.execute(state, 2);
      // (2 - 5) = -3, floor(-3 * 0.75) would be negative, clamped to 0
      expect(state.playerBlock).toBe(0);
    });
  });

  // --- DrawCardsEffect ---
  describe('DrawCardsEffect', () => {
    it('moves cards from draw pile to hand', () => {
      const state = makeState();
      // Put cards into drawPile
      const cards = Array.from({ length: 5 }, () => makeCard());
      state.drawPile = cards;
      state.hand = [];

      const effect = new DrawCardsEffect();
      effect.execute(state, 3);
      expect(state.hand).toHaveLength(3);
      expect(state.drawPile).toHaveLength(2);
    });

    it('reshuffles discard pile when draw pile is empty', () => {
      const state = makeState();
      state.drawPile = [];
      state.discardPile = Array.from({ length: 5 }, () => makeCard());
      state.hand = [];

      const effect = new DrawCardsEffect();
      effect.execute(state, 2);
      expect(state.hand).toHaveLength(2);
      // 5 discard shuffled into draw, then 2 drawn
      expect(state.drawPile).toHaveLength(3);
      expect(state.discardPile).toHaveLength(0);
    });

    it('stops drawing when no cards left at all', () => {
      const state = makeState();
      state.drawPile = [];
      state.discardPile = [];
      state.hand = [];

      const effect = new DrawCardsEffect();
      effect.execute(state, 3);
      expect(state.hand).toHaveLength(0);
    });
  });

  // --- ApplyBuffEffect ---
  describe('ApplyBuffEffect', () => {
    it('adds Strength buff to player', () => {
      const state = makeState();
      const effect = new ApplyBuffEffect(BuffType.Strength);
      effect.execute(state, 3);
      const buff = state.playerBuffs.find(b => b.type === BuffType.Strength);
      expect(buff).toBeDefined();
      expect(buff!.stacks).toBe(3);
    });

    it('stacks onto existing buff', () => {
      const state = makeState();
      addBuff(state.playerBuffs, BuffType.Strength, 2);
      const effect = new ApplyBuffEffect(BuffType.Strength);
      effect.execute(state, 3);
      const buff = state.playerBuffs.find(b => b.type === BuffType.Strength);
      expect(buff!.stacks).toBe(5);
    });

    it('adds combat log entry', () => {
      const state = makeState();
      const effect = new ApplyBuffEffect(BuffType.Thorns);
      effect.execute(state, 4);
      expect(state.combatLog.some(l => l.includes('Thorns'))).toBe(true);
    });
  });

  // --- ApplyDebuffEffect ---
  describe('ApplyDebuffEffect', () => {
    it('applies debuff to enemy', () => {
      const state = makeState();
      const effect = new ApplyDebuffEffect(BuffType.Vulnerable);
      effect.execute(state, 2, 0);
      const buff = state.enemies[0].buffs.find(b => b.type === BuffType.Vulnerable);
      expect(buff).toBeDefined();
      expect(buff!.stacks).toBe(2);
    });

    it('is blocked by Artifact', () => {
      const state = makeState();
      addBuff(state.enemies[0].buffs, BuffType.Artifact, 1);
      const effect = new ApplyDebuffEffect(BuffType.Vulnerable);
      effect.execute(state, 2, 0);

      // Vulnerable should not be applied
      const vulnBuff = state.enemies[0].buffs.find(b => b.type === BuffType.Vulnerable);
      expect(vulnBuff).toBeUndefined();

      // Artifact should be consumed
      const artifactBuff = state.enemies[0].buffs.find(b => b.type === BuffType.Artifact);
      expect(artifactBuff).toBeUndefined(); // 1 stack consumed => removed
    });

    it('Artifact decrements but persists when multiple stacks', () => {
      const state = makeState();
      addBuff(state.enemies[0].buffs, BuffType.Artifact, 3);
      const effect = new ApplyDebuffEffect(BuffType.Vulnerable);
      effect.execute(state, 2, 0);

      const artifactBuff = state.enemies[0].buffs.find(b => b.type === BuffType.Artifact);
      expect(artifactBuff).toBeDefined();
      expect(artifactBuff!.stacks).toBe(2);
    });

    it('does nothing for invalid target index', () => {
      const state = makeState();
      const effect = new ApplyDebuffEffect(BuffType.Weak);
      effect.execute(state, 2, 99);
      // No crash, no buff applied
      expect(state.enemies[0].buffs).toHaveLength(0);
    });
  });

  // --- GainEnergyEffect ---
  describe('GainEnergyEffect', () => {
    it('increases player energy', () => {
      const state = makeState();
      state.playerEnergy = 2;
      const effect = new GainEnergyEffect();
      effect.execute(state, 2);
      expect(state.playerEnergy).toBe(4);
    });
  });

  // --- HealEffect ---
  describe('HealEffect', () => {
    it('heals player HP', () => {
      const state = makeState();
      state.playerHp = 50;
      const effect = new HealEffect();
      effect.execute(state, 10);
      expect(state.playerHp).toBe(60);
    });

    it('does not exceed max HP', () => {
      const state = makeState();
      state.playerHp = 75;
      state.playerMaxHp = 80;
      const effect = new HealEffect();
      effect.execute(state, 20);
      expect(state.playerHp).toBe(80);
    });

    it('heals 0 when already at max HP', () => {
      const state = makeState();
      state.playerHp = 80;
      state.playerMaxHp = 80;
      const effect = new HealEffect();
      effect.execute(state, 10);
      expect(state.playerHp).toBe(80);
    });
  });

  // --- ExhaustEffect ---
  describe('ExhaustEffect', () => {
    it('adds a combat log entry', () => {
      const state = makeState();
      const effect = new ExhaustEffect();
      effect.execute(state, 0);
      expect(state.combatLog.some(l => l.includes('exhausted'))).toBe(true);
    });
  });

  // --- EffectRegistry ---
  describe('EffectRegistry', () => {
    it('returns DealDamageEffect for "deal_damage"', () => {
      const effect = getEffect('deal_damage');
      expect(effect).toBeDefined();
    });

    it('returns GainBlockEffect for "gain_block"', () => {
      const effect = getEffect('gain_block');
      expect(effect).toBeDefined();
    });

    it('returns undefined for unknown effect id', () => {
      const effect = getEffect('unknown_effect');
      expect(effect).toBeUndefined();
    });

    it('returns buff effects for apply_strength', () => {
      const effect = getEffect('apply_strength');
      expect(effect).toBeDefined();
    });

    it('returns debuff effects for apply_vulnerable', () => {
      const effect = getEffect('apply_vulnerable');
      expect(effect).toBeDefined();
    });
  });
});
