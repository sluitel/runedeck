import { describe, it, expect } from 'vitest';
import { Buff } from '../models/Buff';
import { BuffType } from '../models/Enums';
import {
  getBuffStacks,
  addBuff,
  removeBuff,
  reduceBuffDurations,
  tickDebuffs,
  hasBuff,
} from '../engine/BuffUtils';

describe('BuffUtils', () => {
  // --- getBuffStacks ---
  describe('getBuffStacks', () => {
    it('returns 0 when buff type is not present', () => {
      const buffs: Buff[] = [];
      expect(getBuffStacks(buffs, BuffType.Strength)).toBe(0);
    });

    it('returns 0 when a different buff type is present', () => {
      const buffs: Buff[] = [{ type: BuffType.Weak, stacks: 3 }];
      expect(getBuffStacks(buffs, BuffType.Strength)).toBe(0);
    });

    it('returns correct stacks for an existing buff', () => {
      const buffs: Buff[] = [{ type: BuffType.Strength, stacks: 5 }];
      expect(getBuffStacks(buffs, BuffType.Strength)).toBe(5);
    });

    it('returns correct stacks when multiple buff types exist', () => {
      const buffs: Buff[] = [
        { type: BuffType.Strength, stacks: 2 },
        { type: BuffType.Dexterity, stacks: 4 },
        { type: BuffType.Vulnerable, stacks: 1 },
      ];
      expect(getBuffStacks(buffs, BuffType.Dexterity)).toBe(4);
    });
  });

  // --- addBuff ---
  describe('addBuff', () => {
    it('creates a new buff entry when type not present', () => {
      const buffs: Buff[] = [];
      addBuff(buffs, BuffType.Strength, 3);
      expect(buffs).toHaveLength(1);
      expect(buffs[0].type).toBe(BuffType.Strength);
      expect(buffs[0].stacks).toBe(3);
    });

    it('stacks onto existing buff of the same type', () => {
      const buffs: Buff[] = [{ type: BuffType.Strength, stacks: 2 }];
      addBuff(buffs, BuffType.Strength, 3);
      expect(buffs).toHaveLength(1);
      expect(buffs[0].stacks).toBe(5);
    });

    it('creates buff with duration when specified', () => {
      const buffs: Buff[] = [];
      addBuff(buffs, BuffType.Regeneration, 2, 3);
      expect(buffs[0].stacks).toBe(2);
      expect(buffs[0].duration).toBe(3);
    });

    it('accumulates duration on existing timed buff', () => {
      const buffs: Buff[] = [{ type: BuffType.Regeneration, stacks: 2, duration: 3 }];
      addBuff(buffs, BuffType.Regeneration, 1, 2);
      expect(buffs[0].stacks).toBe(3);
      expect(buffs[0].duration).toBe(5);
    });

    it('does not set duration when adding to an existing buff without specifying duration', () => {
      const buffs: Buff[] = [{ type: BuffType.Strength, stacks: 2 }];
      addBuff(buffs, BuffType.Strength, 1);
      expect(buffs[0].duration).toBeUndefined();
    });
  });

  // --- removeBuff ---
  describe('removeBuff', () => {
    it('removes a specific buff type and returns the rest', () => {
      const buffs: Buff[] = [
        { type: BuffType.Strength, stacks: 3 },
        { type: BuffType.Weak, stacks: 2 },
      ];
      const result = removeBuff(buffs, BuffType.Strength);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(BuffType.Weak);
    });

    it('returns original array contents when type is not found', () => {
      const buffs: Buff[] = [{ type: BuffType.Strength, stacks: 3 }];
      const result = removeBuff(buffs, BuffType.Poison);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(BuffType.Strength);
    });

    it('returns empty array when removing the only buff', () => {
      const buffs: Buff[] = [{ type: BuffType.Strength, stacks: 1 }];
      const result = removeBuff(buffs, BuffType.Strength);
      expect(result).toHaveLength(0);
    });
  });

  // --- reduceBuffDurations ---
  describe('reduceBuffDurations', () => {
    it('decrements duration of timed buffs by 1', () => {
      const buffs: Buff[] = [{ type: BuffType.Intangible, stacks: 1, duration: 3 }];
      const result = reduceBuffDurations(buffs);
      expect(result).toHaveLength(1);
      expect(result[0].duration).toBe(2);
    });

    it('removes buffs whose duration reaches 0', () => {
      const buffs: Buff[] = [{ type: BuffType.Intangible, stacks: 1, duration: 1 }];
      const result = reduceBuffDurations(buffs);
      expect(result).toHaveLength(0);
    });

    it('keeps permanent buffs (no duration field)', () => {
      const buffs: Buff[] = [
        { type: BuffType.Strength, stacks: 5 },
        { type: BuffType.Intangible, stacks: 1, duration: 1 },
      ];
      const result = reduceBuffDurations(buffs);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(BuffType.Strength);
    });
  });

  // --- tickDebuffs ---
  describe('tickDebuffs', () => {
    it('decrements Vulnerable stacks by 1', () => {
      const buffs: Buff[] = [{ type: BuffType.Vulnerable, stacks: 3 }];
      const result = tickDebuffs(buffs);
      expect(result).toHaveLength(1);
      expect(result[0].stacks).toBe(2);
    });

    it('decrements Weak stacks by 1', () => {
      const buffs: Buff[] = [{ type: BuffType.Weak, stacks: 2 }];
      const result = tickDebuffs(buffs);
      expect(result).toHaveLength(1);
      expect(result[0].stacks).toBe(1);
    });

    it('decrements Frail stacks by 1', () => {
      const buffs: Buff[] = [{ type: BuffType.Frail, stacks: 2 }];
      const result = tickDebuffs(buffs);
      expect(result).toHaveLength(1);
      expect(result[0].stacks).toBe(1);
    });

    it('removes a debuff when stacks reach 0', () => {
      const buffs: Buff[] = [{ type: BuffType.Vulnerable, stacks: 1 }];
      const result = tickDebuffs(buffs);
      expect(result).toHaveLength(0);
    });

    it('preserves non-debuff buffs untouched', () => {
      const buffs: Buff[] = [
        { type: BuffType.Strength, stacks: 5 },
        { type: BuffType.Thorns, stacks: 3 },
        { type: BuffType.Vulnerable, stacks: 1 },
      ];
      const result = tickDebuffs(buffs);
      expect(result).toHaveLength(2);
      expect(result.find(b => b.type === BuffType.Strength)?.stacks).toBe(5);
      expect(result.find(b => b.type === BuffType.Thorns)?.stacks).toBe(3);
    });

    it('decrements Entangle stacks', () => {
      const buffs: Buff[] = [{ type: BuffType.Entangle, stacks: 2 }];
      const result = tickDebuffs(buffs);
      expect(result).toHaveLength(1);
      expect(result[0].stacks).toBe(1);
    });

    it('decrements DrawReduction stacks', () => {
      const buffs: Buff[] = [{ type: BuffType.DrawReduction, stacks: 1 }];
      const result = tickDebuffs(buffs);
      expect(result).toHaveLength(0);
    });
  });

  // --- hasBuff ---
  describe('hasBuff', () => {
    it('returns true when buff is present with stacks > 0', () => {
      const buffs: Buff[] = [{ type: BuffType.Strength, stacks: 1 }];
      expect(hasBuff(buffs, BuffType.Strength)).toBe(true);
    });

    it('returns false when buff is not present', () => {
      const buffs: Buff[] = [];
      expect(hasBuff(buffs, BuffType.Strength)).toBe(false);
    });

    it('returns false when a different buff is present', () => {
      const buffs: Buff[] = [{ type: BuffType.Weak, stacks: 2 }];
      expect(hasBuff(buffs, BuffType.Strength)).toBe(false);
    });
  });
});
