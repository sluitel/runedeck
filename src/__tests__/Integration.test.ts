import { describe, it, expect, beforeEach } from 'vitest';
import { CombatEngine, CombatEvent } from '../engine/CombatEngine';
import { RunManager } from '../game/RunManager';
import { CardInstance, createCardInstance } from '../models/Card';
import { EnemyInstance, createEnemyInstance } from '../models/Enemy';
import { RuneInstance, createRuneInstance } from '../models/Rune';
import { Buff } from '../models/Buff';
import { BuffType, CardType, CardRarity, TargetType, EnemyTier, IntentType, RuneRarity, CharacterClass, FloorType } from '../models/Enums';
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

function makeDefendingEnemy(hp: number = 50): EnemyInstance {
  return createEnemyInstance({
    enemyId: 'test_defending_enemy',
    enemyName: 'Defending Enemy',
    maxHp: hp,
    intentPattern: [
      { type: IntentType.Defend, value: 5, description: 'Gains 5 block' },
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

function buildMixedDeck(attackCount: number = 8, blockCount: number = 7): CardInstance[] {
  const attacks = Array.from({ length: attackCount }, () => makeAttackCard(6));
  const blocks = Array.from({ length: blockCount }, () => makeBlockCard(5));
  return [...attacks, ...blocks];
}

describe('Integration Tests', () => {
  // --- Full combat: play cards and win ---
  it('plays cards each turn until all enemies die', () => {
    const engine = new CombatEngine();
    const deck = Array.from({ length: 20 }, () => makeAttackCard(15));
    const enemy = makeEnemy(30, 3);

    engine.startCombat(80, 80, 3, deck, [enemy], [], [], 42);

    let turns = 0;
    while (!engine.getState().combatOver && turns < 20) {
      const hand = engine.getState().hand;
      for (const card of [...hand]) {
        if (engine.canPlayCard(card.instanceId)) {
          engine.playCard(card.instanceId, 0);
        }
        if (engine.getState().combatOver) break;
      }
      if (!engine.getState().combatOver) {
        engine.endTurn();
      }
      turns++;
    }

    expect(engine.getState().combatOver).toBe(true);
    expect(engine.getState().playerWon).toBe(true);
    expect(engine.getState().enemies[0].currentHp).toBeLessThanOrEqual(0);
  });

  // --- Full combat: player loses ---
  it('player loses when enemy damage exceeds HP', () => {
    const engine = new CombatEngine();
    // deck of expensive cards the player can't play much
    const deck = Array.from({ length: 15 }, () => makeBlockCard(3, 2));
    const enemy = makeEnemy(999, 30);

    engine.startCombat(50, 80, 3, deck, [enemy], [], [], 42);

    let turns = 0;
    while (!engine.getState().combatOver && turns < 10) {
      engine.endTurn();
      turns++;
    }

    expect(engine.getState().combatOver).toBe(true);
    expect(engine.getState().playerWon).toBe(false);
    expect(engine.getState().playerHp).toBe(0);
  });

  // --- Multi-turn combat with buffs and debuffs ---
  it('strength increases damage over multiple turns', () => {
    const engine = new CombatEngine();
    const deck = buildMixedDeck(15, 0);
    const enemy = makeDefendingEnemy(200);

    engine.startCombat(80, 80, 3, deck, [enemy], [], [], 42);

    // Apply strength
    addBuff(engine.getState().playerBuffs, BuffType.Strength, 5);

    // Track damage over turns
    const startHp = engine.getState().enemies[0].currentHp;

    // Play all attack cards in hand
    const hand = engine.getState().hand;
    for (const card of [...hand]) {
      if (engine.canPlayCard(card.instanceId)) {
        engine.playCard(card.instanceId, 0);
      }
    }

    const endHp = engine.getState().enemies[0].currentHp;
    const totalDamage = startHp - endHp;

    // Each attack: 6 base + 5 strength = 11 damage per card
    // Player has 3 energy, each card costs 1, so plays 3 attack cards = 33 damage
    // (enemy has only block from defend intent, which hasn't occurred yet)
    expect(totalDamage).toBe(33);
  });

  // --- Combat with multiple enemies ---
  it('handles combat with multiple enemies', () => {
    const engine = new CombatEngine();
    const deck = Array.from({ length: 20 }, () => makeAttackCard(30));
    const enemies = [makeEnemy(20, 2), makeEnemy(20, 2), makeEnemy(20, 2)];

    engine.startCombat(80, 80, 3, deck, enemies, [], [], 42);

    // Kill enemies one by one
    let killCount = 0;
    let turns = 0;
    while (!engine.getState().combatOver && turns < 10) {
      const hand = [...engine.getState().hand];
      for (const card of hand) {
        if (engine.getState().combatOver) break;
        // Find first living enemy
        const livingIdx = engine.getState().enemies.findIndex(e => e.currentHp > 0);
        if (livingIdx >= 0 && engine.canPlayCard(card.instanceId)) {
          engine.playCard(card.instanceId, livingIdx);
        }
      }
      if (!engine.getState().combatOver) engine.endTurn();
      turns++;
    }

    expect(engine.getState().combatOver).toBe(true);
    expect(engine.getState().playerWon).toBe(true);
    expect(engine.getState().enemies.every(e => e.currentHp <= 0)).toBe(true);
  });

  // --- Full run: advance through multiple floors ---
  it('advances through multiple floors in a run', () => {
    const rm = new RunManager(CharacterClass.Ironclad, 42);

    // Advance through the first few floors
    for (let i = 0; i < 3; i++) {
      rm.advanceToNextFloor();
      if (rm.currentPhase === 'draft') {
        rm.skipDraft();
      }
      // Just skip to map for non-combat floors
      rm.currentPhase = 'map';
    }

    expect(rm.currentFloorIndex).toBe(2);
    expect(rm.state.floor).toBeGreaterThan(0);
  });

  // --- Run with rest, shop, and event ---
  it('handles rest node correctly in a run', () => {
    const rm = new RunManager(CharacterClass.Ironclad, 42);
    rm.state.currentHp = 50;

    rm.restHeal();
    // 30% of 80 = 24 => 50 + 24 = 74
    expect(rm.state.currentHp).toBe(74);
    expect(rm.currentPhase).toBe('map');
  });

  // --- Card draft, combat, reward cycle ---
  it('completes a draft -> combat -> reward cycle', () => {
    const rm = new RunManager(CharacterClass.Ironclad, 42);

    // Advance to first floor (CombatNormal -> draft)
    rm.advanceToNextFloor();
    expect(rm.currentPhase).toBe('draft');
    expect(rm.draftOptions.length).toBe(3);

    // Select a draft card
    const deckBefore = rm.state.deck.length;
    rm.selectDraftCard(0);
    expect(rm.state.deck.length).toBe(deckBefore + 1);
    expect(rm.currentPhase).toBe('combat');

    // Combat is now active -- the combat engine has started
    const combatState = rm.combatEngine.getState();
    expect(combatState.hand.length).toBe(5);
    expect(combatState.isPlayerTurn).toBe(true);
  });

  // --- Poison kills enemy between turns ---
  it('poison damages enemy at end of enemy turn', () => {
    const engine = new CombatEngine();
    const deck = Array.from({ length: 15 }, () => makeBlockCard(5));
    const enemy = makeEnemy(10, 0); // 10 HP, 0 attack damage

    engine.startCombat(80, 80, 3, deck, [enemy], [], [], 42);

    // Apply 12 poison to enemy (enough to kill in 1 tick)
    addBuff(engine.getState().enemies[0].buffs, BuffType.Poison, 12);

    engine.endTurn();

    // Poison deals 12 damage to 10 HP enemy = dead
    expect(engine.getState().enemies[0].currentHp).toBeLessThanOrEqual(0);
    expect(engine.getState().combatOver).toBe(true);
    expect(engine.getState().playerWon).toBe(true);
  });

  // --- Artifact blocks debuffs then expires ---
  it('artifact blocks debuffs and is consumed', () => {
    const engine = new CombatEngine();
    const deck = Array.from({ length: 15 }, () => makeAttackCard());

    // Enemy that applies debuffs
    const debuffEnemy = createEnemyInstance({
      enemyId: 'debuffer',
      enemyName: 'Debuffer',
      maxHp: 100,
      intentPattern: [
        { type: IntentType.Debuff, value: 2, description: 'Applies 2 Weak' },
      ],
      passives: [],
      tier: EnemyTier.Normal,
      act: 1,
    });

    engine.startCombat(80, 80, 3, deck, [debuffEnemy], [], [], 42);

    // Give player 1 Artifact
    addBuff(engine.getState().playerBuffs, BuffType.Artifact, 1);

    // End turn: enemy tries to apply Weak, Artifact should block it
    engine.endTurn();

    const state = engine.getState();
    // Artifact should have been consumed (negated the debuff)
    const artifact = state.playerBuffs.find(b => b.type === BuffType.Artifact);
    expect(artifact).toBeUndefined();

    // Weak should not be on the player
    const weak = state.playerBuffs.find(b => b.type === BuffType.Weak);
    expect(weak).toBeUndefined();
  });

  // --- Soul Anchor rune saves from death ---
  it('Soul Anchor rune prevents death and is consumed', () => {
    const engine = new CombatEngine();
    const deck = Array.from({ length: 15 }, () => makeBlockCard(3));
    const enemy = makeEnemy(100, 500); // Massive damage

    const soulAnchor = makeRune('rune_soul_anchor');
    engine.startCombat(10, 80, 3, deck, [enemy], [soulAnchor], [], 42);

    engine.endTurn();

    const state = engine.getState();
    // Player should survive with 1 HP
    expect(state.playerHp).toBe(1);
    // Soul Anchor should be consumed
    expect(state.runes.some(r => r.data.runeId === 'rune_soul_anchor')).toBe(false);
    // Combat should NOT be over (player survived)
    // Note: After soul anchor saves, enemy turn continues
    // The next turn should still happen
  });

  // --- Thorns damage on enemy attack ---
  it('thorns deal damage back to attacking enemy', () => {
    const engine = new CombatEngine();
    const deck = Array.from({ length: 15 }, () => makeBlockCard(100)); // lots of block
    const enemy = makeEnemy(50, 5);

    engine.startCombat(80, 80, 3, deck, [enemy], [], [], 42);

    // Give player Thorns
    addBuff(engine.getState().playerBuffs, BuffType.Thorns, 7);

    // Play block cards to survive
    const hand = engine.getState().hand;
    for (const card of [...hand]) {
      if (engine.canPlayCard(card.instanceId)) {
        engine.playCard(card.instanceId, 0);
      }
    }

    engine.endTurn();

    // Enemy attacked, thorns should have dealt 7 damage
    // Enemy started with 50 HP
    expect(engine.getState().enemies[0].currentHp).toBe(43);
  });

  // --- Draw pile reshuffles from discard ---
  it('reshuffles discard pile into draw pile when draw is exhausted', () => {
    const engine = new CombatEngine();
    // Small deck to force reshuffle
    const deck = Array.from({ length: 6 }, () => makeAttackCard(1, 0)); // 0-cost cards
    const enemy = makeDefendingEnemy(999);

    engine.startCombat(80, 80, 3, deck, [enemy], [], [], 42);

    // Hand: 5 cards, Draw: 1 card
    expect(engine.getState().hand.length).toBe(5);
    expect(engine.getState().drawPile.length).toBe(1);

    // Play all cards (0-cost)
    for (const card of [...engine.getState().hand]) {
      engine.playCard(card.instanceId, 0);
    }

    // After playing: hand empty, discard has 5, draw has 1
    expect(engine.getState().discardPile.length).toBe(5);
    expect(engine.getState().drawPile.length).toBe(1);

    engine.endTurn();

    // End turn discards hand (0 cards), then draws 5
    // Draw pile had 1 card, so after drawing 1, reshuffle needed for 4 more
    // After end turn: hand should have 5 cards again
    expect(engine.getState().hand.length).toBe(5);
    // Discard should be 0 (reshuffled into draw)
    expect(engine.getState().discardPile.length).toBe(0);
  });
});
