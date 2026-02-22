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
    intentPattern: [
      { type: IntentType.Attack, value: 5, description: 'Attacks for 5' },
    ],
    passives: [],
    tier: EnemyTier.Normal,
    act: 1,
  });
}

function makeCard(overrides: Partial<CardInstance['data']> = {}): CardInstance {
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
    characterClass: 'Ironclad',
    ...overrides,
  });
}

function makeState(enemyCount: number = 1, enemyHp: number = 50): CombatState {
  const deck = Array.from({ length: 10 }, () => makeCard());
  const enemies = Array.from({ length: enemyCount }, () => makeEnemy(enemyHp));
  return createCombatState(80, 80, 3, deck, enemies, [], []);
}

describe('DealDamageEffect', () => {
  const effect = new DealDamageEffect();

  it('deals base damage to enemy', () => {
    const state = makeState();
    effect.execute(state, 10, 0);
    expect(state.enemies[0].currentHp).toBe(40);
  });

  it('applies player Strength bonus', () => {
    const state = makeState();
    addBuff(state.playerBuffs, BuffType.Strength, 3);
    effect.execute(state, 10, 0);
    // 10 + 3 Strength = 13 damage
    expect(state.enemies[0].currentHp).toBe(37);
  });

  it('applies Weak penalty (25% less damage)', () => {
    const state = makeState();
    addBuff(state.playerBuffs, BuffType.Weak, 2);
    effect.execute(state, 10, 0);
    // floor(10 * 0.75) = 7
    expect(state.enemies[0].currentHp).toBe(43);
  });

  it('applies Vulnerable on enemy (50% more damage)', () => {
    const state = makeState();
    addBuff(state.enemies[0].buffs, BuffType.Vulnerable, 2);
    effect.execute(state, 10, 0);
    // floor(10 * 1.5) = 15
    expect(state.enemies[0].currentHp).toBe(35);
  });

  it('applies both Weak on player and Vulnerable on enemy', () => {
    const state = makeState();
    addBuff(state.playerBuffs, BuffType.Weak, 2);
    addBuff(state.enemies[0].buffs, BuffType.Vulnerable, 2);
    effect.execute(state, 10, 0);
    // floor(floor(10 * 0.75) * 1.5) = floor(7 * 1.5) = floor(10.5) = 10
    expect(state.enemies[0].currentHp).toBe(40);
  });

  it('respects enemy block - block absorbs damage first', () => {
    const state = makeState();
    state.enemies[0].block = 6;
    effect.execute(state, 10, 0);
    // 6 blocked, 4 to HP: 50 - 4 = 46
    expect(state.enemies[0].currentHp).toBe(46);
    expect(state.enemies[0].block).toBe(0);
  });

  it('does not reduce HP below 0', () => {
    const state = makeState(1, 5);
    effect.execute(state, 100, 0);
    expect(state.enemies[0].currentHp).toBe(0);
  });

  it('skips dead enemies (HP <= 0)', () => {
    const state = makeState();
    state.enemies[0].currentHp = 0;
    effect.execute(state, 10, 0);
    expect(state.enemies[0].currentHp).toBe(0); // unchanged
  });

  it('does nothing for invalid target index', () => {
    const state = makeState();
    effect.execute(state, 10, 5); // no enemy at index 5
    expect(state.enemies[0].currentHp).toBe(50); // unchanged
  });
});

describe('DealDamageAllEffect', () => {
  const effect = new DealDamageAllEffect();

  it('deals damage to all living enemies', () => {
    const state = makeState(3, 30);
    effect.execute(state, 10);
    expect(state.enemies[0].currentHp).toBe(20);
    expect(state.enemies[1].currentHp).toBe(20);
    expect(state.enemies[2].currentHp).toBe(20);
  });

  it('skips dead enemies', () => {
    const state = makeState(3, 30);
    state.enemies[1].currentHp = 0;
    effect.execute(state, 10);
    expect(state.enemies[0].currentHp).toBe(20);
    expect(state.enemies[1].currentHp).toBe(0); // stays dead
    expect(state.enemies[2].currentHp).toBe(20);
  });
});

describe('GainBlockEffect', () => {
  const effect = new GainBlockEffect();

  it('adds block to player', () => {
    const state = makeState();
    effect.execute(state, 8);
    expect(state.playerBlock).toBe(8);
  });

  it('stacks block', () => {
    const state = makeState();
    state.playerBlock = 5;
    effect.execute(state, 8);
    expect(state.playerBlock).toBe(13);
  });

  it('applies Dexterity bonus', () => {
    const state = makeState();
    addBuff(state.playerBuffs, BuffType.Dexterity, 3);
    effect.execute(state, 5);
    // 5 + 3 = 8
    expect(state.playerBlock).toBe(8);
  });

  it('applies Frail penalty (25% less block)', () => {
    const state = makeState();
    addBuff(state.playerBuffs, BuffType.Frail, 2);
    effect.execute(state, 8);
    // floor(8 * 0.75) = 6
    expect(state.playerBlock).toBe(6);
  });

  it('does not go below 0 block', () => {
    const state = makeState();
    addBuff(state.playerBuffs, BuffType.Dexterity, -10); // hypothetical negative dexterity scenario
    addBuff(state.playerBuffs, BuffType.Frail, 2);
    effect.execute(state, 5);
    // (5 + (-10)) = -5, clamped by Frail: floor(-5 * 0.75) = -3, then clamped to 0
    expect(state.playerBlock).toBe(0);
  });
});

describe('DrawCardsEffect', () => {
  const effect = new DrawCardsEffect();

  it('draws cards from draw pile to hand', () => {
    const state = makeState();
    // Move deck to drawPile
    state.drawPile = Array.from({ length: 5 }, () => makeCard());
    state.hand = [];
    effect.execute(state, 3);
    expect(state.hand).toHaveLength(3);
    expect(state.drawPile).toHaveLength(2);
  });

  it('reshuffles discard pile when draw pile is empty', () => {
    const state = makeState();
    state.drawPile = [];
    state.hand = [];
    state.discardPile = Array.from({ length: 5 }, () => makeCard());
    effect.execute(state, 2);
    expect(state.hand).toHaveLength(2);
    expect(state.discardPile).toHaveLength(0);
    expect(state.drawPile).toHaveLength(3);
  });

  it('stops drawing when both piles are empty', () => {
    const state = makeState();
    state.drawPile = [];
    state.hand = [];
    state.discardPile = [];
    effect.execute(state, 3);
    expect(state.hand).toHaveLength(0);
  });
});

describe('ApplyBuffEffect', () => {
  it('adds Strength buff to player', () => {
    const effect = new ApplyBuffEffect(BuffType.Strength);
    const state = makeState();
    effect.execute(state, 3);
    expect(state.playerBuffs).toHaveLength(1);
    expect(state.playerBuffs[0].type).toBe(BuffType.Strength);
    expect(state.playerBuffs[0].stacks).toBe(3);
  });

  it('stacks buff on existing', () => {
    const effect = new ApplyBuffEffect(BuffType.Strength);
    const state = makeState();
    addBuff(state.playerBuffs, BuffType.Strength, 2);
    effect.execute(state, 3);
    expect(state.playerBuffs[0].stacks).toBe(5);
  });

  it('adds Barricade buff', () => {
    const effect = new ApplyBuffEffect(BuffType.Barricade);
    const state = makeState();
    effect.execute(state, 1);
    expect(state.playerBuffs[0].type).toBe(BuffType.Barricade);
  });
});

describe('ApplyDebuffEffect', () => {
  it('applies debuff to enemy', () => {
    const effect = new ApplyDebuffEffect(BuffType.Vulnerable);
    const state = makeState();
    effect.execute(state, 2, 0);
    expect(state.enemies[0].buffs).toHaveLength(1);
    expect(state.enemies[0].buffs[0].type).toBe(BuffType.Vulnerable);
    expect(state.enemies[0].buffs[0].stacks).toBe(2);
  });

  it('is blocked by enemy Artifact', () => {
    const effect = new ApplyDebuffEffect(BuffType.Weak);
    const state = makeState();
    addBuff(state.enemies[0].buffs, BuffType.Artifact, 1);
    effect.execute(state, 2, 0);
    // Debuff should not be applied; Artifact consumed
    expect(state.enemies[0].buffs.find(b => b.type === BuffType.Weak)).toBeUndefined();
    expect(state.enemies[0].buffs.find(b => b.type === BuffType.Artifact)).toBeUndefined();
  });

  it('consumes one Artifact stack when blocking debuff', () => {
    const effect = new ApplyDebuffEffect(BuffType.Vulnerable);
    const state = makeState();
    addBuff(state.enemies[0].buffs, BuffType.Artifact, 2);
    effect.execute(state, 3, 0);
    const artifact = state.enemies[0].buffs.find(b => b.type === BuffType.Artifact);
    expect(artifact?.stacks).toBe(1);
  });

  it('does nothing for invalid target index', () => {
    const effect = new ApplyDebuffEffect(BuffType.Poison);
    const state = makeState();
    effect.execute(state, 5, 99);
    expect(state.enemies[0].buffs).toHaveLength(0);
  });
});

describe('GainEnergyEffect', () => {
  const effect = new GainEnergyEffect();

  it('increases player energy', () => {
    const state = makeState();
    state.playerEnergy = 3;
    effect.execute(state, 2);
    expect(state.playerEnergy).toBe(5);
  });

  it('adds energy from zero', () => {
    const state = makeState();
    state.playerEnergy = 0;
    effect.execute(state, 1);
    expect(state.playerEnergy).toBe(1);
  });
});

describe('HealEffect', () => {
  const effect = new HealEffect();

  it('heals player HP', () => {
    const state = makeState();
    state.playerHp = 50;
    effect.execute(state, 10);
    expect(state.playerHp).toBe(60);
  });

  it('does not exceed max HP', () => {
    const state = makeState();
    state.playerHp = 75;
    state.playerMaxHp = 80;
    effect.execute(state, 20);
    expect(state.playerHp).toBe(80);
  });

  it('heals zero when already at max', () => {
    const state = makeState();
    state.playerHp = 80;
    state.playerMaxHp = 80;
    effect.execute(state, 10);
    expect(state.playerHp).toBe(80);
  });
});

describe('ExhaustEffect', () => {
  const effect = new ExhaustEffect();

  it('adds a combat log entry', () => {
    const state = makeState();
    effect.execute(state, 0);
    expect(state.combatLog).toContain('Card exhausted');
  });
});

describe('EffectRegistry', () => {
  it('returns registered effects by ID', () => {
    expect(getEffect('deal_damage')).toBeDefined();
    expect(getEffect('deal_damage_all')).toBeDefined();
    expect(getEffect('gain_block')).toBeDefined();
    expect(getEffect('draw_cards')).toBeDefined();
    expect(getEffect('gain_energy')).toBeDefined();
    expect(getEffect('heal')).toBeDefined();
    expect(getEffect('exhaust')).toBeDefined();
    expect(getEffect('apply_strength')).toBeDefined();
    expect(getEffect('apply_vulnerable')).toBeDefined();
    expect(getEffect('apply_weak')).toBeDefined();
    expect(getEffect('apply_poison')).toBeDefined();
  });

  it('returns undefined for unknown effect', () => {
    expect(getEffect('nonexistent_effect')).toBeUndefined();
  });
});
