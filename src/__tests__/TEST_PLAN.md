# Runedeck Test Plan

## Overview
Comprehensive test suite for the Runedeck roguelite deckbuilder game engine. Tests cover all core systems from low-level utilities up through full integration scenarios.

---

## 1. Unit Tests: BuffUtils (`BuffUtils.test.ts`)

| # | Test Case | Description |
|---|-----------|-------------|
| 1 | `getBuffStacks` returns 0 for missing buff | Query a buff type not in the array |
| 2 | `getBuffStacks` returns correct stacks | Query an existing buff |
| 3 | `addBuff` creates new buff entry | Add a buff type not yet present |
| 4 | `addBuff` stacks onto existing buff | Add stacks to an already-present buff |
| 5 | `addBuff` with duration | Add a buff with a duration value |
| 6 | `addBuff` accumulates duration | Add duration to an existing timed buff |
| 7 | `removeBuff` removes a specific buff | Remove one buff type, keep others |
| 8 | `removeBuff` returns original array when type not found | No-op removal |
| 9 | `reduceBuffDurations` decrements durations | Timed buffs tick down by 1 |
| 10 | `reduceBuffDurations` removes expired buffs | Buffs at duration=1 are removed |
| 11 | `reduceBuffDurations` keeps permanent buffs | Buffs without duration survive |
| 12 | `tickDebuffs` decrements Vulnerable stacks | Vulnerable ticks down each turn |
| 13 | `tickDebuffs` decrements Weak stacks | Weak ticks down |
| 14 | `tickDebuffs` removes debuff at 1 stack | Debuff removed when hitting 0 |
| 15 | `tickDebuffs` preserves non-debuff buffs | Strength, Thorns, etc. unaffected |
| 16 | `hasBuff` returns true/false correctly | Boolean check for buff presence |

---

## 2. Unit Tests: SeededRandom (`SeededRandom.test.ts`)

| # | Test Case | Description |
|---|-----------|-------------|
| 1 | Deterministic output | Same seed produces same sequence |
| 2 | Different seeds produce different output | Two seeds diverge |
| 3 | `next()` returns values in [0, 1) | Boundary check |
| 4 | `nextInt()` returns values in [min, max] | Integer range check |
| 5 | `pick()` selects from array | Random element selection |
| 6 | `shuffle()` returns all elements | No elements lost |
| 7 | `shuffle()` is deterministic | Same seed = same shuffle |
| 8 | `shuffle()` mutates in-place | Original array is modified |
| 9 | `weightedPick()` respects weights | High-weight items picked more often |
| 10 | `weightedPick()` with single item | Always returns that item |
| 11 | `shuffleArray()` utility creates a copy | Original array unmodified |
| 12 | `seedFromDateString()` is deterministic | Same date string = same seed |
| 13 | `seedFromDateString()` differs for different dates | Different strings produce different seeds |
| 14 | `getSeed()` returns current seed state | Verify getter |

---

## 3. Unit Tests: DungeonGenerator (`DungeonGenerator.test.ts`)

| # | Test Case | Description |
|---|-----------|-------------|
| 1 | Generates correct total floor count | 3 acts x 8 floors = 24 |
| 2 | Each act has correct number of floors | 8 floors per act |
| 3 | Last floor of each act is Boss | Boss placement |
| 4 | First floor of each act is CombatNormal | Guaranteed opening combat |
| 5 | Floor numbers are sequential | 1, 2, 3... 24 |
| 6 | Act numbers are correct | Floors assigned to correct acts |
| 7 | Deterministic with same seed | Same seed = same dungeon |
| 8 | Different seeds produce different layouts | Variance check |
| 9 | No more than 2 consecutive same floor types | Anti-repetition rule |
| 10 | Custom config: different floors per act | Config override works |
| 11 | Custom config: different total acts | Config override works |
| 12 | All generated floor types are valid | Only known FloorType values |

---

## 4. Unit Tests: CardEffects (`CardEffects.test.ts`)

| # | Test Case | Description |
|---|-----------|-------------|
| 1 | `DealDamageEffect` deals base damage | Simple damage to enemy |
| 2 | `DealDamageEffect` applies Strength bonus | Player Strength increases damage |
| 3 | `DealDamageEffect` applies Weak penalty | Player Weak reduces damage by 25% |
| 4 | `DealDamageEffect` applies Vulnerable on enemy | Enemy takes 50% more |
| 5 | `DealDamageEffect` respects enemy block | Block absorbs damage first |
| 6 | `DealDamageEffect` does not overkill below 0 | HP floors at 0 |
| 7 | `DealDamageAllEffect` hits all enemies | Damage applied to each |
| 8 | `DealDamageAllEffect` skips dead enemies | Dead enemies not hit |
| 9 | `GainBlockEffect` adds block | Block increases |
| 10 | `GainBlockEffect` applies Dexterity bonus | Dexterity adds block |
| 11 | `GainBlockEffect` applies Frail penalty | 25% less block when Frail |
| 12 | `DrawCardsEffect` moves cards from draw to hand | Cards drawn correctly |
| 13 | `DrawCardsEffect` reshuffles discard when draw empty | Reshuffle mechanic |
| 14 | `ApplyBuffEffect` adds buff to player | Buff applied |
| 15 | `ApplyDebuffEffect` adds debuff to enemy | Debuff applied |
| 16 | `ApplyDebuffEffect` blocked by Artifact | Artifact negates debuff |
| 17 | `GainEnergyEffect` increases energy | Energy gained |
| 18 | `HealEffect` heals HP | HP increased |
| 19 | `HealEffect` does not exceed max HP | Capped at max |
| 20 | `ExhaustEffect` logs exhaust | Log entry created |

---

## 5. Unit Tests: CombatEngine (`CombatEngine.test.ts`)

| # | Test Case | Description |
|---|-----------|-------------|
| 1 | `startCombat` initializes state | State is valid after start |
| 2 | `startCombat` draws 5 cards | Initial hand size |
| 3 | `startCombat` sets energy to max | Energy initialized |
| 4 | `getState` returns current state | State accessor works |
| 5 | `canPlayCard` returns true for playable card | Energy + in hand |
| 6 | `canPlayCard` returns false when not enough energy | Energy gating |
| 7 | `canPlayCard` returns false for Curse cards | Curses are unplayable |
| 8 | `canPlayCard` returns false for attacks when Entangled | Entangle blocks attacks |
| 9 | `playCard` deducts energy | Energy spent on play |
| 10 | `playCard` moves card from hand to discard | Card lifecycle |
| 11 | `playCard` exhausts Power cards | Powers go to exhaust pile |
| 12 | `playCard` executes primary and secondary effects | Both effects fire |
| 13 | `endTurn` discards remaining hand | Hand cleared |
| 14 | `endTurn` processes enemy attacks | Enemy damage applied |
| 15 | `endTurn` resets energy | Energy restored next turn |
| 16 | `endTurn` draws new hand | Cards drawn for next turn |
| 17 | Combat ends when all enemies die | Win condition |
| 18 | Combat ends when player HP reaches 0 | Loss condition |
| 19 | Rune: Burning Candle gives extra energy | Rune effect |
| 20 | Rune: Iron Heart gives starting block | Rune effect |
| 21 | Block resets each turn (no Barricade) | Block lifecycle |
| 22 | Block persists with Barricade | Barricade mechanic |
| 23 | Metallicize grants block at end of turn | End-of-turn buff |
| 24 | Rage grants block on attack play | Rage mechanic |
| 25 | Event listener receives events | Event system |

---

## 6. Unit Tests: RunManager (`RunManager.test.ts`)

| # | Test Case | Description |
|---|-----------|-------------|
| 1 | Constructor initializes run state | State defaults correct |
| 2 | Constructor builds starter deck | Deck has starter cards |
| 3 | Constructor generates dungeon floors | Floors generated |
| 4 | `advanceToNextFloor` increments floor | Floor advances |
| 5 | Combat floors trigger draft phase | Draft before combat |
| 6 | `selectDraftCard` adds card to deck | Draft selection |
| 7 | `skipDraft` starts combat without adding | Skip works |
| 8 | Non-combat floors set correct phase | Rest, Shop, Event, Treasure |
| 9 | `restHeal` heals 30% max HP | Rest node healing |
| 10 | `restUpgradeCard` upgrades a card | Card upgrade mechanics |
| 11 | `buyShopItem` deducts gold and adds item | Shop purchase |
| 12 | `buyShopItem` fails when insufficient gold | Gold check |
| 13 | `selectEventChoice` applies heal effect | Event healing |
| 14 | `selectEventChoice` applies damage effect | Event damage |
| 15 | `selectEventChoice` applies gold effect | Event gold |
| 16 | `calculateShards` returns correct shard count | Shard calculation |
| 17 | Victory phase when all floors cleared | Victory detection |

---

## 7. Unit Tests: MetaManager (`MetaManager.test.ts`)

| # | Test Case | Description |
|---|-----------|-------------|
| 1 | Constructor loads default state | Fresh state initialization |
| 2 | `addShards` increases total | Shard accumulation |
| 3 | `canUnlockVaultItem` returns true when affordable | Unlock check |
| 4 | `canUnlockVaultItem` returns false when too expensive | Cost check |
| 5 | `canUnlockVaultItem` returns false when already unlocked | Duplicate check |
| 6 | `unlockVaultItem` deducts shards | Shard spending |
| 7 | `unlockVaultItem` adds to unlockedItemIds | Track unlocks |
| 8 | Hexblade unlock via vault | Character unlock |
| 9 | Shadowstep unlock via vault | Character unlock |
| 10 | `isCharacterUnlocked` Ironclad always true | Default unlock |
| 11 | `isCharacterUnlocked` Hexblade after 5 Ironclad runs | Progression unlock |
| 12 | `isCharacterUnlocked` Shadowstep after 10 Ironclad runs | Progression unlock |
| 13 | `recordRunCompleted` updates stats | Run tracking |
| 14 | `recordRunCompleted` updates high score | Score tracking |
| 15 | `getStartingMaxHp` with and without vault unlock | Meta progression |
| 16 | `getStartingGold` with and without vault unlock | Meta progression |
| 17 | `getStartingRuneSlots` with vault unlocks | Meta progression |

---

## 8. Integration Tests (`Integration.test.ts`)

| # | Test Case | Description |
|---|-----------|-------------|
| 1 | Full combat: play cards and win | Complete combat loop |
| 2 | Full combat: player loses to enemy | Loss scenario |
| 3 | Multi-turn combat with buffs and debuffs | Complex combat |
| 4 | Combat with multiple enemies | Multi-enemy fight |
| 5 | Full run: advance through multiple floors | Floor progression |
| 6 | Run with rest, shop, and event nodes | Non-combat floors |
| 7 | Card draft, combat, reward cycle | Complete game loop |
| 8 | Poison kills enemy between turns | Poison timing |
| 9 | Artifact blocks debuffs then expires | Artifact lifecycle |
| 10 | Soul Anchor rune saves from death | Death-save mechanic |
| 11 | Thorns damage on enemy attack | Thorns mechanic |
| 12 | Draw pile reshuffles from discard | Deck cycling |

---

## Test Coverage Goals

- All public methods of every engine class are tested
- All card effect types have at least one dedicated test
- All buff/debuff interactions are verified
- Edge cases: empty arrays, zero values, max values, boundary conditions
- Determinism: seeded random produces reproducible results
- State transitions: phases change correctly across the run lifecycle
