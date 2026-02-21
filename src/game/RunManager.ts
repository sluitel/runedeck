import { RunState, createInitialRunState } from '../models/RunState';
import { CharacterClass, FloorType, CardRarity } from '../models/Enums';
import { CardData, CardInstance, createCardInstance } from '../models/Card';
import { RuneData, RuneInstance, createRuneInstance } from '../models/Rune';
import { EnemyData, EnemyInstance, createEnemyInstance } from '../models/Enemy';
import { CombatEngine, CombatResult } from '../engine/CombatEngine';
import { DungeonGenerator, FloorData } from '../engine/DungeonGenerator';
import { SeededRandom } from '../engine/SeededRandom';
import { getStarterDeck, getDraftOptions } from '../data/cards/index';
import { getEnemiesForFloor, getBossForAct } from '../data/enemies';
import { ALL_RUNES } from '../data/runes';
import { GAME_EVENTS, GameEvent } from '../data/events';

export type RunPhase = 'draft' | 'combat' | 'reward' | 'rest' | 'shop' | 'event' | 'treasure' | 'map' | 'boss_reward' | 'game_over' | 'victory';

export interface ShopItem {
  type: 'card' | 'rune' | 'remove_card';
  card?: CardData;
  rune?: RuneData;
  cost: number;
  sold: boolean;
}

export class RunManager {
  state: RunState;
  combatEngine: CombatEngine;
  dungeonFloors: FloorData[];
  currentFloorIndex: number;
  rng: SeededRandom;
  currentPhase: RunPhase;
  draftOptions: CardData[];
  currentEnemies: EnemyInstance[];
  currentEvent: GameEvent | null;
  shopItems: ShopItem[];
  rewardCards: CardData[];
  rewardRune: RuneData | null;
  rewardGold: number;

  constructor(characterClass: CharacterClass, seed: number, isDailyRun: boolean = false) {
    this.state = createInitialRunState(characterClass, seed, isDailyRun);
    this.combatEngine = new CombatEngine();
    this.rng = new SeededRandom(seed);
    this.currentFloorIndex = -1;
    this.currentPhase = 'map';
    this.draftOptions = [];
    this.currentEnemies = [];
    this.currentEvent = null;
    this.shopItems = [];
    this.rewardCards = [];
    this.rewardRune = null;
    this.rewardGold = 0;

    // Generate dungeon
    const dungeonGen = new DungeonGenerator(seed);
    this.dungeonFloors = dungeonGen.generateRun();

    // Build starter deck
    const starterCards = getStarterDeck(characterClass);
    this.state.deck = starterCards.map(cardData => createCardInstance(cardData));
  }

  getCurrentFloor(): FloorData | null {
    if (this.currentFloorIndex < 0 || this.currentFloorIndex >= this.dungeonFloors.length) {
      return null;
    }
    return this.dungeonFloors[this.currentFloorIndex];
  }

  advanceToNextFloor(): FloorData {
    this.currentFloorIndex++;

    if (this.currentFloorIndex >= this.dungeonFloors.length) {
      // All floors cleared — victory!
      this.currentPhase = 'victory';
      return this.dungeonFloors[this.dungeonFloors.length - 1];
    }

    const floor = this.dungeonFloors[this.currentFloorIndex];
    this.state.floor = floor.floorNumber;
    this.state.act = floor.act;

    // Start draft phase before combat floors
    if (floor.type === FloorType.CombatNormal ||
        floor.type === FloorType.CombatElite ||
        floor.type === FloorType.Boss) {
      this.startDraft();
    } else {
      this.handleNonCombatFloor(floor);
    }

    return floor;
  }

  private startDraft(): void {
    this.currentPhase = 'draft';
    const hasLuckyCharm = this.state.runes.some(r => r.data.runeId === 'rune_lucky_charm');
    this.draftOptions = getDraftOptions(this.state.playerClass, this.rng, 3, hasLuckyCharm);
  }

  selectDraftCard(index: number): void {
    if (index < 0 || index >= this.draftOptions.length) return;

    const cardData = this.draftOptions[index];
    const instance = createCardInstance(cardData);
    this.state.deck.push(instance);

    // Start combat
    this.startCombat();
  }

  skipDraft(): void {
    this.startCombat();
  }

  private startCombat(): void {
    const floor = this.getCurrentFloor();
    if (!floor) return;

    this.currentPhase = 'combat';

    // Select enemies
    let enemies: EnemyInstance[];
    if (floor.type === FloorType.Boss) {
      const bossData = getBossForAct(floor.act);
      enemies = [createEnemyInstance(bossData)];
    } else {
      const isElite = floor.type === FloorType.CombatElite;
      const enemyPool = getEnemiesForFloor(floor.act, isElite);

      if (isElite) {
        // 1 elite enemy
        enemies = [createEnemyInstance(this.rng.pick(enemyPool))];
      } else {
        // 1-2 normal enemies
        const numEnemies = this.rng.nextInt(1, 2);
        enemies = [];
        for (let i = 0; i < numEnemies; i++) {
          enemies.push(createEnemyInstance(this.rng.pick(enemyPool)));
        }
      }
    }

    this.currentEnemies = enemies;

    // Start combat engine
    this.combatEngine.startCombat(
      this.state.currentHp,
      this.state.maxHp,
      this.state.maxEnergy,
      this.state.deck.map(c => createCardInstance(c.data)),
      enemies,
      this.state.runes,
      this.state.buffs,
      this.rng.nextInt(0, 999999)
    );
  }

  playCard(instanceId: string, targetIndex: number = 0): boolean {
    return this.combatEngine.playCard(instanceId, targetIndex);
  }

  endTurn(): void {
    this.combatEngine.endTurn();

    // Check if combat ended
    const combatState = this.combatEngine.getState();
    if (combatState.combatOver) {
      this.handleCombatEnd();
    }
  }

  private handleCombatEnd(): void {
    const result = this.combatEngine.getCombatResult();
    const combatState = this.combatEngine.getState();

    // Update run state
    this.state.currentHp = combatState.playerHp;
    this.state.cardsPlayed += result.cardsPlayed;
    this.state.damageDealt += result.damageDealt;

    if (!result.playerWon) {
      this.currentPhase = 'game_over';
      return;
    }

    this.state.floorsCleared++;
    this.state.gold += result.goldEarned;
    this.rewardGold = result.goldEarned;

    // Heal from Preservation Flask rune
    if (this.state.runes.some(r => r.data.runeId === 'rune_preservation_flask')) {
      this.state.currentHp = Math.min(this.state.currentHp + 5, this.state.maxHp);
    }

    const floor = this.getCurrentFloor();
    if (floor?.type === FloorType.Boss) {
      this.state.bossesKilled++;
      this.currentPhase = 'boss_reward';
      // Generate legendary reward card
      const hasLuckyCharm = this.state.runes.some(r => r.data.runeId === 'rune_lucky_charm');
      this.rewardCards = getDraftOptions(this.state.playerClass, this.rng, 3, hasLuckyCharm);
      this.rewardRune = this.rng.pick(ALL_RUNES);
    } else {
      this.currentPhase = 'reward';
      // Generate reward options
      const hasLuckyCharm = this.state.runes.some(r => r.data.runeId === 'rune_lucky_charm');
      this.rewardCards = getDraftOptions(this.state.playerClass, this.rng, 3, hasLuckyCharm);
      if (floor?.type === FloorType.CombatElite) {
        // Elite guaranteed rare card
        this.rewardCards = this.rewardCards.map(c => {
          if (c.rarity === CardRarity.Common) {
            return { ...c, rarity: CardRarity.Rare };
          }
          return c;
        });
        this.rewardRune = this.rng.pick(ALL_RUNES);
      } else {
        this.rewardRune = this.rng.next() < 0.3 ? this.rng.pick(ALL_RUNES) : null;
      }
    }
  }

  selectRewardCard(index: number): void {
    if (index < 0 || index >= this.rewardCards.length) return;
    const cardData = this.rewardCards[index];
    this.state.deck.push(createCardInstance(cardData));
  }

  selectRewardRune(): void {
    if (!this.rewardRune) return;
    if (this.state.runes.length >= this.state.maxRuneSlots) return;
    this.state.runes.push(createRuneInstance(this.rewardRune));
    this.rewardRune = null;
  }

  proceedAfterReward(): void {
    this.currentPhase = 'map';
  }

  private handleNonCombatFloor(floor: FloorData): void {
    switch (floor.type) {
      case FloorType.RestNode:
        this.currentPhase = 'rest';
        break;
      case FloorType.Shop:
        this.currentPhase = 'shop';
        this.generateShop();
        break;
      case FloorType.Event:
        this.currentPhase = 'event';
        this.currentEvent = this.rng.pick(GAME_EVENTS);
        break;
      case FloorType.Treasure:
        this.currentPhase = 'treasure';
        this.rewardRune = this.rng.pick(ALL_RUNES);
        this.rewardCards = getDraftOptions(
          this.state.playerClass,
          this.rng,
          3,
          this.state.runes.some(r => r.data.runeId === 'rune_lucky_charm')
        );
        break;
      default:
        this.currentPhase = 'map';
    }
  }

  // Rest node
  restHeal(): void {
    const healAmount = Math.floor(this.state.maxHp * 0.3);
    this.state.currentHp = Math.min(this.state.currentHp + healAmount, this.state.maxHp);
    this.currentPhase = 'map';
  }

  restUpgradeCard(instanceId: string): void {
    const card = this.state.deck.find(c => c.instanceId === instanceId);
    if (!card || card.data.isUpgraded) return;

    // Upgrade the card — increase primary effect
    card.data.isUpgraded = true;
    card.data.cardName = card.data.cardName + '+';
    card.data.effectValue = Math.floor(card.data.effectValue * 1.5);
    if (card.data.secondaryEffectValue) {
      card.data.secondaryEffectValue = Math.floor(card.data.secondaryEffectValue * 1.25);
    }
    // Update description
    card.data.description = card.data.description.replace(/\d+/g, (match) => {
      return String(Math.floor(Number(match) * 1.25));
    });

    this.currentPhase = 'map';
  }

  // Shop
  private generateShop(): void {
    this.shopItems = [];

    // 3 cards
    const hasLuckyCharm = this.state.runes.some(r => r.data.runeId === 'rune_lucky_charm');
    const shopCards = getDraftOptions(this.state.playerClass, this.rng, 3, hasLuckyCharm);
    for (const card of shopCards) {
      let cost = 50;
      if (card.rarity === CardRarity.Uncommon) cost = 75;
      if (card.rarity === CardRarity.Rare) cost = 150;
      if (card.rarity === CardRarity.Legendary) cost = 250;
      this.shopItems.push({ type: 'card', card, cost, sold: false });
    }

    // 1-2 runes
    const numRunes = this.rng.nextInt(1, 2);
    for (let i = 0; i < numRunes; i++) {
      const rune = this.rng.pick(ALL_RUNES);
      let cost = 100;
      if (rune.rarity === 'Uncommon') cost = 150;
      if (rune.rarity === 'Rare') cost = 250;
      this.shopItems.push({ type: 'rune', rune, cost, sold: false });
    }

    // Remove card option
    this.shopItems.push({ type: 'remove_card', cost: 75, sold: false });
  }

  buyShopItem(index: number): boolean {
    if (index < 0 || index >= this.shopItems.length) return false;
    const item = this.shopItems[index];
    if (item.sold || this.state.gold < item.cost) return false;

    this.state.gold -= item.cost;
    item.sold = true;

    if (item.type === 'card' && item.card) {
      this.state.deck.push(createCardInstance(item.card));
    } else if (item.type === 'rune' && item.rune) {
      if (this.state.runes.length < this.state.maxRuneSlots) {
        this.state.runes.push(createRuneInstance(item.rune));
      }
    }

    return true;
  }

  removeCardFromDeck(instanceId: string): boolean {
    const idx = this.state.deck.findIndex(c => c.instanceId === instanceId);
    if (idx === -1) return false;
    this.state.deck.splice(idx, 1);
    return true;
  }

  leaveShop(): void {
    this.currentPhase = 'map';
  }

  // Event
  selectEventChoice(choiceIndex: number): void {
    if (!this.currentEvent || choiceIndex < 0 || choiceIndex >= this.currentEvent.choices.length) return;

    const choice = this.currentEvent.choices[choiceIndex];

    switch (choice.effectType) {
      case 'heal': {
        const healAmount = Math.floor(this.state.maxHp * (choice.effectValue / 100));
        this.state.currentHp = Math.min(this.state.currentHp + healAmount, this.state.maxHp);
        break;
      }
      case 'damage':
        this.state.currentHp = Math.max(0, this.state.currentHp - choice.effectValue);
        break;
      case 'gold':
        this.state.gold = Math.max(0, this.state.gold + choice.effectValue);
        break;
      case 'max_hp':
        this.state.maxHp += choice.effectValue;
        if (choice.effectValue > 0) {
          this.state.currentHp += choice.effectValue;
        }
        break;
      case 'rune': {
        const rune = this.rng.pick(ALL_RUNES);
        if (this.state.runes.length < this.state.maxRuneSlots) {
          this.state.runes.push(createRuneInstance(rune));
        }
        break;
      }
      case 'remove_card':
        // Will be handled by UI
        break;
      case 'curse':
        // Add a curse card
        break;
    }

    if (this.state.currentHp <= 0) {
      this.currentPhase = 'game_over';
    } else {
      this.currentPhase = 'map';
    }
  }

  // Treasure
  collectTreasureCard(index: number): void {
    if (index < 0 || index >= this.rewardCards.length) return;
    this.state.deck.push(createCardInstance(this.rewardCards[index]));
  }

  collectTreasureRune(): void {
    if (!this.rewardRune || this.state.runes.length >= this.state.maxRuneSlots) return;
    this.state.runes.push(createRuneInstance(this.rewardRune));
    this.rewardRune = null;
  }

  leaveTreasure(): void {
    this.currentPhase = 'map';
  }

  // Run end calculations
  calculateShards(): number {
    let shards = this.state.floorsCleared * 2;
    shards += this.state.bossesKilled * 10;
    if (this.currentPhase === 'victory') {
      shards += 50;
    }
    return shards;
  }
}
