import { MetaState, createDefaultMetaState, saveMetaState, loadMetaState } from '../models/MetaState';
import { CharacterClass } from '../models/Enums';

export interface VaultItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  unlocked: boolean;
  category: 'rune' | 'card' | 'character' | 'slot';
}

export const VAULT_ITEMS: VaultItem[] = [
  { id: 'vault_extra_slot_1', name: 'Rune Slot +1', description: 'Start with 4 rune slots instead of 3.', cost: 50, unlocked: false, category: 'slot' },
  { id: 'vault_extra_slot_2', name: 'Rune Slot +2', description: 'Start with 5 rune slots instead of 4.', cost: 100, unlocked: false, category: 'slot' },
  { id: 'vault_starting_gold', name: 'Gold Hoard', description: 'Start each run with 150 gold instead of 100.', cost: 30, unlocked: false, category: 'rune' },
  { id: 'vault_starting_hp', name: 'Vitality', description: 'Start each run with 90 HP instead of 80.', cost: 40, unlocked: false, category: 'rune' },
  { id: 'vault_iron_will', name: 'Iron Will', description: 'Unlock a new starting rune for Ironclad.', cost: 60, unlocked: false, category: 'rune' },
  { id: 'vault_hexblade', name: 'Unlock Hexblade', description: 'Unlock the Hexblade character class.', cost: 0, unlocked: false, category: 'character' },
  { id: 'vault_shadowstep', name: 'Unlock Shadowstep', description: 'Unlock the Shadowstep character class.', cost: 0, unlocked: false, category: 'character' },
  { id: 'vault_daily_run', name: 'Daily Challenge', description: 'Unlock Daily Run mode.', cost: 20, unlocked: false, category: 'rune' },
];

export class MetaManager {
  state: MetaState;

  constructor() {
    this.state = loadMetaState();
  }

  save(): void {
    saveMetaState(this.state);
  }

  addShards(amount: number): void {
    this.state.totalShards += amount;
    this.save();
  }

  canUnlockVaultItem(itemId: string): boolean {
    const item = VAULT_ITEMS.find(v => v.id === itemId);
    if (!item) return false;
    if (this.state.unlockedItemIds.includes(itemId)) return false;
    return this.state.totalShards >= item.cost;
  }

  unlockVaultItem(itemId: string): boolean {
    const item = VAULT_ITEMS.find(v => v.id === itemId);
    if (!item || !this.canUnlockVaultItem(itemId)) return false;

    this.state.totalShards -= item.cost;
    this.state.unlockedItemIds.push(itemId);

    // Apply character unlocks
    if (itemId === 'vault_hexblade') {
      this.state.unlockedCharacterIds.push('Hexblade');
    } else if (itemId === 'vault_shadowstep') {
      this.state.unlockedCharacterIds.push('Shadowstep');
    }

    this.save();
    return true;
  }

  isCharacterUnlocked(characterClass: CharacterClass): boolean {
    // Ironclad is always unlocked
    if (characterClass === CharacterClass.Ironclad) return true;

    // Check if unlocked via vault
    if (this.state.unlockedCharacterIds.includes(characterClass)) return true;

    // Check if unlocked via completing 5 runs with previous character
    if (characterClass === CharacterClass.Hexblade) {
      return this.state.runsWithIronclad >= 5;
    }
    if (characterClass === CharacterClass.Shadowstep) {
      return this.state.runsWithHexblade >= 5 || this.state.runsWithIronclad >= 10;
    }

    return false;
  }

  recordRunCompleted(characterClass: CharacterClass, score: number): void {
    this.state.totalRunsCompleted++;
    if (score > this.state.highScore) {
      this.state.highScore = score;
    }

    switch (characterClass) {
      case CharacterClass.Ironclad:
        this.state.runsWithIronclad++;
        break;
      case CharacterClass.Hexblade:
        this.state.runsWithHexblade++;
        break;
      case CharacterClass.Shadowstep:
        this.state.runsWithShadowstep++;
        break;
    }

    this.save();
  }

  getStartingMaxHp(): number {
    return this.state.unlockedItemIds.includes('vault_starting_hp') ? 90 : 80;
  }

  getStartingGold(): number {
    return this.state.unlockedItemIds.includes('vault_starting_gold') ? 150 : 100;
  }

  getStartingRuneSlots(): number {
    let slots = 3;
    if (this.state.unlockedItemIds.includes('vault_extra_slot_1')) slots++;
    if (this.state.unlockedItemIds.includes('vault_extra_slot_2')) slots++;
    return slots;
  }

  getVaultItems(): VaultItem[] {
    return VAULT_ITEMS.map(item => ({
      ...item,
      unlocked: this.state.unlockedItemIds.includes(item.id),
    }));
  }
}
