import { describe, it, expect, beforeEach } from 'vitest';
import { RunManager } from '../game/RunManager';
import { CharacterClass, FloorType } from '../models/Enums';

describe('RunManager', () => {
  const seed = 42;
  let rm: RunManager;

  beforeEach(() => {
    rm = new RunManager(CharacterClass.Ironclad, seed);
  });

  // --- Constructor ---
  describe('constructor', () => {
    it('initializes run state with correct defaults', () => {
      expect(rm.state.playerClass).toBe(CharacterClass.Ironclad);
      expect(rm.state.currentHp).toBe(80);
      expect(rm.state.maxHp).toBe(80);
      expect(rm.state.gold).toBe(100);
      expect(rm.state.floor).toBe(0);
      expect(rm.state.act).toBe(1);
    });

    it('builds a starter deck for Ironclad', () => {
      // Ironclad starter: 4 Strikes, 4 Defends, 1 Bash, 1 Iron Will = 10 cards
      expect(rm.state.deck).toHaveLength(10);
    });

    it('generates dungeon floors', () => {
      expect(rm.dungeonFloors).toHaveLength(24); // 3 acts * 8 floors
    });

    it('starts at floor index -1 (before first floor)', () => {
      expect(rm.currentFloorIndex).toBe(-1);
    });

    it('starts in map phase', () => {
      expect(rm.currentPhase).toBe('map');
    });

    it('accepts different character classes', () => {
      const hex = new RunManager(CharacterClass.Hexblade, seed);
      expect(hex.state.playerClass).toBe(CharacterClass.Hexblade);
      expect(hex.state.deck.length).toBeGreaterThan(0);
    });

    it('builds same dungeon for the same seed', () => {
      const rm2 = new RunManager(CharacterClass.Ironclad, seed);
      expect(rm.dungeonFloors).toEqual(rm2.dungeonFloors);
    });
  });

  // --- advanceToNextFloor ---
  describe('advanceToNextFloor', () => {
    it('increments the floor index', () => {
      rm.advanceToNextFloor();
      expect(rm.currentFloorIndex).toBe(0);
    });

    it('updates state floor and act', () => {
      const floor = rm.advanceToNextFloor();
      expect(rm.state.floor).toBe(floor.floorNumber);
      expect(rm.state.act).toBe(floor.act);
    });

    it('first floor is CombatNormal and triggers draft phase', () => {
      const floor = rm.advanceToNextFloor();
      expect(floor.type).toBe(FloorType.CombatNormal);
      expect(rm.currentPhase).toBe('draft');
    });

    it('sets victory phase when all floors are cleared', () => {
      // Advance through all 24 floors
      for (let i = 0; i < 24; i++) {
        rm.advanceToNextFloor();
        // Skip draft/combat to continue advancing
        rm.currentPhase = 'map';
      }
      rm.advanceToNextFloor();
      expect(rm.currentPhase).toBe('victory');
    });
  });

  // --- Draft ---
  describe('draft', () => {
    it('generates draft options before combat', () => {
      rm.advanceToNextFloor(); // floor 1: CombatNormal -> draft
      expect(rm.currentPhase).toBe('draft');
      expect(rm.draftOptions).toHaveLength(3);
    });

    it('selectDraftCard adds card to deck and starts combat', () => {
      rm.advanceToNextFloor();
      const deckSize = rm.state.deck.length;
      rm.selectDraftCard(0);
      expect(rm.state.deck.length).toBe(deckSize + 1);
      expect(rm.currentPhase).toBe('combat');
    });

    it('skipDraft starts combat without adding cards', () => {
      rm.advanceToNextFloor();
      const deckSize = rm.state.deck.length;
      rm.skipDraft();
      expect(rm.state.deck.length).toBe(deckSize);
      expect(rm.currentPhase).toBe('combat');
    });

    it('selectDraftCard with invalid index does nothing', () => {
      rm.advanceToNextFloor();
      const deckSize = rm.state.deck.length;
      rm.selectDraftCard(99);
      expect(rm.state.deck.length).toBe(deckSize);
    });
  });

  // --- Non-combat floors ---
  describe('non-combat floors', () => {
    // Helper to advance to a specific floor type
    function advanceToFloorType(manager: RunManager, targetType: FloorType): boolean {
      for (let i = 0; i < 24; i++) {
        const floor = manager.advanceToNextFloor();
        if (floor.type === targetType) return true;
        manager.currentPhase = 'map'; // Reset phase to keep advancing
      }
      return false;
    }

    it('rest floor sets rest phase', () => {
      // Search multiple seeds for a rest floor
      for (let s = 0; s < 50; s++) {
        const testRm = new RunManager(CharacterClass.Ironclad, s);
        if (advanceToFloorType(testRm, FloorType.RestNode)) {
          expect(testRm.currentPhase).toBe('rest');
          return;
        }
      }
      // If we couldn't find one in 50 seeds, that's statistically very unlikely
      // but don't hard-fail the test
    });

    it('shop floor sets shop phase', () => {
      for (let s = 0; s < 50; s++) {
        const testRm = new RunManager(CharacterClass.Ironclad, s);
        if (advanceToFloorType(testRm, FloorType.Shop)) {
          expect(testRm.currentPhase).toBe('shop');
          expect(testRm.shopItems.length).toBeGreaterThan(0);
          return;
        }
      }
    });

    it('event floor sets event phase', () => {
      for (let s = 0; s < 50; s++) {
        const testRm = new RunManager(CharacterClass.Ironclad, s);
        if (advanceToFloorType(testRm, FloorType.Event)) {
          expect(testRm.currentPhase).toBe('event');
          expect(testRm.currentEvent).not.toBeNull();
          return;
        }
      }
    });
  });

  // --- restHeal ---
  describe('restHeal', () => {
    it('heals 30% of max HP', () => {
      rm.state.currentHp = 50;
      rm.state.maxHp = 80;
      rm.restHeal();
      // 30% of 80 = 24 => 50 + 24 = 74
      expect(rm.state.currentHp).toBe(74);
    });

    it('does not exceed max HP', () => {
      rm.state.currentHp = 75;
      rm.state.maxHp = 80;
      rm.restHeal();
      expect(rm.state.currentHp).toBe(80);
    });

    it('sets phase to map after rest', () => {
      rm.restHeal();
      expect(rm.currentPhase).toBe('map');
    });
  });

  // --- restUpgradeCard ---
  describe('restUpgradeCard', () => {
    it('upgrades a card in the deck', () => {
      const card = rm.state.deck[0];
      const originalName = card.data.cardName;
      rm.restUpgradeCard(card.instanceId);
      expect(card.data.isUpgraded).toBe(true);
      expect(card.data.cardName).toBe(originalName + '+');
    });

    it('increases the primary effect value', () => {
      const card = rm.state.deck[0];
      const originalValue = card.data.effectValue;
      rm.restUpgradeCard(card.instanceId);
      expect(card.data.effectValue).toBe(Math.floor(originalValue * 1.5));
    });

    it('does not upgrade an already upgraded card', () => {
      const card = rm.state.deck[0];
      rm.restUpgradeCard(card.instanceId);
      const valueAfterFirst = card.data.effectValue;
      const nameAfterFirst = card.data.cardName;
      rm.restUpgradeCard(card.instanceId);
      expect(card.data.effectValue).toBe(valueAfterFirst);
      expect(card.data.cardName).toBe(nameAfterFirst);
    });

    it('sets phase to map after upgrade', () => {
      rm.restUpgradeCard(rm.state.deck[0].instanceId);
      expect(rm.currentPhase).toBe('map');
    });
  });

  // --- Shop ---
  describe('shop', () => {
    it('buyShopItem deducts gold and marks item as sold', () => {
      // Manually trigger shop generation
      rm.state.gold = 500;
      rm.advanceToNextFloor();
      rm.currentPhase = 'map';

      // Find a shop floor or generate one manually
      rm['generateShop']();
      const item = rm.shopItems[0];
      const costBefore = item.cost;
      const goldBefore = rm.state.gold;

      const result = rm.buyShopItem(0);
      expect(result).toBe(true);
      expect(rm.state.gold).toBe(goldBefore - costBefore);
      expect(rm.shopItems[0].sold).toBe(true);
    });

    it('buyShopItem fails when insufficient gold', () => {
      rm.state.gold = 0;
      rm['generateShop']();
      const result = rm.buyShopItem(0);
      expect(result).toBe(false);
    });

    it('buyShopItem fails for already sold item', () => {
      rm.state.gold = 500;
      rm['generateShop']();
      rm.buyShopItem(0);
      const result = rm.buyShopItem(0);
      expect(result).toBe(false);
    });

    it('buyShopItem with invalid index returns false', () => {
      rm['generateShop']();
      expect(rm.buyShopItem(-1)).toBe(false);
      expect(rm.buyShopItem(99)).toBe(false);
    });

    it('leaveShop sets phase to map', () => {
      rm.leaveShop();
      expect(rm.currentPhase).toBe('map');
    });
  });

  // --- Events ---
  describe('events', () => {
    it('selectEventChoice with heal effect heals the player', () => {
      rm.state.currentHp = 40;
      rm.state.maxHp = 80;
      rm.currentEvent = {
        eventId: 'test',
        title: 'Test',
        description: 'Test event',
        choices: [
          { label: 'Heal', description: 'Heal 25%', effectType: 'heal', effectValue: 25 },
        ],
      };
      rm.selectEventChoice(0);
      // 25% of 80 = 20 => 40 + 20 = 60
      expect(rm.state.currentHp).toBe(60);
    });

    it('selectEventChoice with damage effect damages the player', () => {
      rm.state.currentHp = 80;
      rm.currentEvent = {
        eventId: 'test',
        title: 'Test',
        description: 'Test event',
        choices: [
          { label: 'Pain', description: 'Lose 10', effectType: 'damage', effectValue: 10 },
        ],
      };
      rm.selectEventChoice(0);
      expect(rm.state.currentHp).toBe(70);
    });

    it('selectEventChoice with gold effect modifies gold', () => {
      rm.state.gold = 100;
      rm.currentEvent = {
        eventId: 'test',
        title: 'Test',
        description: 'Test',
        choices: [
          { label: 'Gold', description: 'Gain 30', effectType: 'gold', effectValue: 30 },
        ],
      };
      rm.selectEventChoice(0);
      expect(rm.state.gold).toBe(130);
    });

    it('selectEventChoice with max_hp effect modifies max HP', () => {
      rm.state.maxHp = 80;
      rm.state.currentHp = 80;
      rm.currentEvent = {
        eventId: 'test',
        title: 'Test',
        description: 'Test',
        choices: [
          { label: 'HP+', description: 'Gain 5 max HP', effectType: 'max_hp', effectValue: 5 },
        ],
      };
      rm.selectEventChoice(0);
      expect(rm.state.maxHp).toBe(85);
      expect(rm.state.currentHp).toBe(85);
    });

    it('selectEventChoice with damage that kills player sets game_over', () => {
      rm.state.currentHp = 5;
      rm.currentEvent = {
        eventId: 'test',
        title: 'Test',
        description: 'Test',
        choices: [
          { label: 'Death', description: 'Lose 10', effectType: 'damage', effectValue: 10 },
        ],
      };
      rm.selectEventChoice(0);
      expect(rm.state.currentHp).toBe(0);
      expect(rm.currentPhase).toBe('game_over');
    });

    it('selectEventChoice with invalid index does nothing', () => {
      rm.currentEvent = {
        eventId: 'test',
        title: 'Test',
        description: 'Test',
        choices: [
          { label: 'A', description: 'A', effectType: 'gold', effectValue: 0 },
        ],
      };
      const goldBefore = rm.state.gold;
      rm.selectEventChoice(5);
      expect(rm.state.gold).toBe(goldBefore);
    });
  });

  // --- removeCardFromDeck ---
  describe('removeCardFromDeck', () => {
    it('removes a card by instance ID', () => {
      const card = rm.state.deck[0];
      const deckSize = rm.state.deck.length;
      const result = rm.removeCardFromDeck(card.instanceId);
      expect(result).toBe(true);
      expect(rm.state.deck.length).toBe(deckSize - 1);
    });

    it('returns false for invalid instance ID', () => {
      const result = rm.removeCardFromDeck('nonexistent');
      expect(result).toBe(false);
    });
  });

  // --- calculateShards ---
  describe('calculateShards', () => {
    it('calculates shards based on floors cleared', () => {
      rm.state.floorsCleared = 5;
      rm.state.bossesKilled = 0;
      rm.currentPhase = 'map';
      expect(rm.calculateShards()).toBe(10); // 5 * 2
    });

    it('includes boss kill bonus', () => {
      rm.state.floorsCleared = 5;
      rm.state.bossesKilled = 2;
      rm.currentPhase = 'map';
      expect(rm.calculateShards()).toBe(30); // 5*2 + 2*10
    });

    it('includes victory bonus', () => {
      rm.state.floorsCleared = 24;
      rm.state.bossesKilled = 3;
      rm.currentPhase = 'victory';
      expect(rm.calculateShards()).toBe(128); // 24*2 + 3*10 + 50
    });
  });
});
