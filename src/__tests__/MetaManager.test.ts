import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetaManager, VAULT_ITEMS } from '../game/MetaManager';
import { CharacterClass } from '../models/Enums';
import { createDefaultMetaState } from '../models/MetaState';

// Mock localStorage since we're in a Node.js test environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('MetaManager', () => {
  let meta: MetaManager;

  beforeEach(() => {
    localStorageMock.clear();
    meta = new MetaManager();
  });

  // --- Constructor ---
  describe('constructor', () => {
    it('loads default state when no saved data exists', () => {
      expect(meta.state.totalShards).toBe(0);
      expect(meta.state.unlockedItemIds).toEqual([]);
      expect(meta.state.totalRunsCompleted).toBe(0);
    });

    it('loads previously saved state from localStorage', () => {
      const savedState = createDefaultMetaState();
      savedState.totalShards = 200;
      savedState.totalRunsCompleted = 5;
      localStorageMock.setItem('runedeck_meta', JSON.stringify(savedState));

      const loadedMeta = new MetaManager();
      expect(loadedMeta.state.totalShards).toBe(200);
      expect(loadedMeta.state.totalRunsCompleted).toBe(5);
    });
  });

  // --- addShards ---
  describe('addShards', () => {
    it('increases total shards', () => {
      meta.addShards(50);
      expect(meta.state.totalShards).toBe(50);
    });

    it('accumulates shards across multiple calls', () => {
      meta.addShards(30);
      meta.addShards(20);
      expect(meta.state.totalShards).toBe(50);
    });

    it('persists shards to localStorage', () => {
      meta.addShards(100);
      const saved = JSON.parse(localStorageMock.getItem('runedeck_meta')!);
      expect(saved.totalShards).toBe(100);
    });
  });

  // --- canUnlockVaultItem ---
  describe('canUnlockVaultItem', () => {
    it('returns true when player can afford the item', () => {
      meta.state.totalShards = 100;
      expect(meta.canUnlockVaultItem('vault_extra_slot_1')).toBe(true); // cost: 50
    });

    it('returns false when player cannot afford the item', () => {
      meta.state.totalShards = 10;
      expect(meta.canUnlockVaultItem('vault_extra_slot_1')).toBe(false); // cost: 50
    });

    it('returns false when item is already unlocked', () => {
      meta.state.totalShards = 200;
      meta.state.unlockedItemIds.push('vault_extra_slot_1');
      expect(meta.canUnlockVaultItem('vault_extra_slot_1')).toBe(false);
    });

    it('returns false for nonexistent item id', () => {
      meta.state.totalShards = 999;
      expect(meta.canUnlockVaultItem('nonexistent')).toBe(false);
    });

    it('returns true for 0-cost items with 0 shards', () => {
      meta.state.totalShards = 0;
      expect(meta.canUnlockVaultItem('vault_hexblade')).toBe(true); // cost: 0
    });
  });

  // --- unlockVaultItem ---
  describe('unlockVaultItem', () => {
    it('deducts shards when unlocking', () => {
      meta.state.totalShards = 100;
      meta.unlockVaultItem('vault_extra_slot_1'); // cost: 50
      expect(meta.state.totalShards).toBe(50);
    });

    it('adds item to unlockedItemIds', () => {
      meta.state.totalShards = 100;
      meta.unlockVaultItem('vault_extra_slot_1');
      expect(meta.state.unlockedItemIds).toContain('vault_extra_slot_1');
    });

    it('returns true on successful unlock', () => {
      meta.state.totalShards = 100;
      expect(meta.unlockVaultItem('vault_extra_slot_1')).toBe(true);
    });

    it('returns false when cannot afford', () => {
      meta.state.totalShards = 10;
      expect(meta.unlockVaultItem('vault_extra_slot_1')).toBe(false);
    });

    it('returns false when already unlocked', () => {
      meta.state.totalShards = 200;
      meta.unlockVaultItem('vault_extra_slot_1');
      expect(meta.unlockVaultItem('vault_extra_slot_1')).toBe(false);
    });

    it('unlocking vault_hexblade adds Hexblade to character ids', () => {
      meta.state.totalShards = 0;
      meta.unlockVaultItem('vault_hexblade');
      expect(meta.state.unlockedCharacterIds).toContain('Hexblade');
    });

    it('unlocking vault_shadowstep adds Shadowstep to character ids', () => {
      meta.state.totalShards = 0;
      meta.unlockVaultItem('vault_shadowstep');
      expect(meta.state.unlockedCharacterIds).toContain('Shadowstep');
    });
  });

  // --- isCharacterUnlocked ---
  describe('isCharacterUnlocked', () => {
    it('Ironclad is always unlocked', () => {
      expect(meta.isCharacterUnlocked(CharacterClass.Ironclad)).toBe(true);
    });

    it('Hexblade is locked by default', () => {
      expect(meta.isCharacterUnlocked(CharacterClass.Hexblade)).toBe(false);
    });

    it('Hexblade unlocks after 5 Ironclad runs', () => {
      meta.state.runsWithIronclad = 5;
      expect(meta.isCharacterUnlocked(CharacterClass.Hexblade)).toBe(true);
    });

    it('Hexblade unlocks via vault purchase', () => {
      meta.state.totalShards = 0;
      meta.unlockVaultItem('vault_hexblade');
      expect(meta.isCharacterUnlocked(CharacterClass.Hexblade)).toBe(true);
    });

    it('Shadowstep is locked by default', () => {
      expect(meta.isCharacterUnlocked(CharacterClass.Shadowstep)).toBe(false);
    });

    it('Shadowstep unlocks after 5 Hexblade runs', () => {
      meta.state.runsWithHexblade = 5;
      expect(meta.isCharacterUnlocked(CharacterClass.Shadowstep)).toBe(true);
    });

    it('Shadowstep unlocks after 10 Ironclad runs', () => {
      meta.state.runsWithIronclad = 10;
      expect(meta.isCharacterUnlocked(CharacterClass.Shadowstep)).toBe(true);
    });
  });

  // --- recordRunCompleted ---
  describe('recordRunCompleted', () => {
    it('increments total runs completed', () => {
      meta.recordRunCompleted(CharacterClass.Ironclad, 10);
      expect(meta.state.totalRunsCompleted).toBe(1);
    });

    it('increments character-specific run count for Ironclad', () => {
      meta.recordRunCompleted(CharacterClass.Ironclad, 10);
      expect(meta.state.runsWithIronclad).toBe(1);
    });

    it('increments character-specific run count for Hexblade', () => {
      meta.recordRunCompleted(CharacterClass.Hexblade, 10);
      expect(meta.state.runsWithHexblade).toBe(1);
    });

    it('increments character-specific run count for Shadowstep', () => {
      meta.recordRunCompleted(CharacterClass.Shadowstep, 10);
      expect(meta.state.runsWithShadowstep).toBe(1);
    });

    it('updates high score when new score is higher', () => {
      meta.recordRunCompleted(CharacterClass.Ironclad, 50);
      expect(meta.state.highScore).toBe(50);
      meta.recordRunCompleted(CharacterClass.Ironclad, 100);
      expect(meta.state.highScore).toBe(100);
    });

    it('does not decrease high score for lower score', () => {
      meta.recordRunCompleted(CharacterClass.Ironclad, 100);
      meta.recordRunCompleted(CharacterClass.Ironclad, 50);
      expect(meta.state.highScore).toBe(100);
    });
  });

  // --- Meta progression getters ---
  describe('meta progression getters', () => {
    it('getStartingMaxHp returns 80 by default', () => {
      expect(meta.getStartingMaxHp()).toBe(80);
    });

    it('getStartingMaxHp returns 90 with vault_starting_hp unlocked', () => {
      meta.state.unlockedItemIds.push('vault_starting_hp');
      expect(meta.getStartingMaxHp()).toBe(90);
    });

    it('getStartingGold returns 100 by default', () => {
      expect(meta.getStartingGold()).toBe(100);
    });

    it('getStartingGold returns 150 with vault_starting_gold unlocked', () => {
      meta.state.unlockedItemIds.push('vault_starting_gold');
      expect(meta.getStartingGold()).toBe(150);
    });

    it('getStartingRuneSlots returns 3 by default', () => {
      expect(meta.getStartingRuneSlots()).toBe(3);
    });

    it('getStartingRuneSlots returns 4 with vault_extra_slot_1', () => {
      meta.state.unlockedItemIds.push('vault_extra_slot_1');
      expect(meta.getStartingRuneSlots()).toBe(4);
    });

    it('getStartingRuneSlots returns 5 with both slot unlocks', () => {
      meta.state.unlockedItemIds.push('vault_extra_slot_1');
      meta.state.unlockedItemIds.push('vault_extra_slot_2');
      expect(meta.getStartingRuneSlots()).toBe(5);
    });
  });

  // --- getVaultItems ---
  describe('getVaultItems', () => {
    it('returns all vault items with unlocked status', () => {
      const items = meta.getVaultItems();
      expect(items.length).toBe(VAULT_ITEMS.length);
      expect(items.every(i => i.unlocked === false)).toBe(true);
    });

    it('marks unlocked items correctly', () => {
      meta.state.unlockedItemIds.push('vault_extra_slot_1');
      const items = meta.getVaultItems();
      const slot1 = items.find(i => i.id === 'vault_extra_slot_1');
      expect(slot1?.unlocked).toBe(true);
    });
  });
});
