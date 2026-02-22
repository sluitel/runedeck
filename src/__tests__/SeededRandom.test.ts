import { describe, it, expect } from 'vitest';
import { SeededRandom, shuffleArray, seedFromDateString, getDailyRunSeed } from '../engine/SeededRandom';

describe('SeededRandom', () => {
  describe('next()', () => {
    it('produces deterministic output for the same seed', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);

      const seq1 = Array.from({ length: 10 }, () => rng1.next());
      const seq2 = Array.from({ length: 10 }, () => rng2.next());

      expect(seq1).toEqual(seq2);
    });

    it('produces different output for different seeds', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(999);

      const val1 = rng1.next();
      const val2 = rng2.next();

      expect(val1).not.toBe(val2);
    });

    it('returns values in the range [0, 1)', () => {
      const rng = new SeededRandom(12345);
      for (let i = 0; i < 1000; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('nextInt()', () => {
    it('returns values within [min, max] inclusive', () => {
      const rng = new SeededRandom(42);
      for (let i = 0; i < 200; i++) {
        const value = rng.nextInt(1, 6);
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(6);
      }
    });

    it('returns min when min equals max', () => {
      const rng = new SeededRandom(42);
      expect(rng.nextInt(5, 5)).toBe(5);
    });

    it('is deterministic for the same seed', () => {
      const rng1 = new SeededRandom(100);
      const rng2 = new SeededRandom(100);
      for (let i = 0; i < 20; i++) {
        expect(rng1.nextInt(0, 100)).toBe(rng2.nextInt(0, 100));
      }
    });
  });

  describe('pick()', () => {
    it('selects an element from the array', () => {
      const rng = new SeededRandom(42);
      const arr = ['a', 'b', 'c', 'd'];
      const picked = rng.pick(arr);
      expect(arr).toContain(picked);
    });

    it('picks from a single-element array', () => {
      const rng = new SeededRandom(42);
      expect(rng.pick([99])).toBe(99);
    });

    it('is deterministic for the same seed', () => {
      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);
      const arr = [10, 20, 30, 40, 50];
      expect(rng1.pick(arr)).toBe(rng2.pick(arr));
    });
  });

  describe('shuffle()', () => {
    it('returns an array with all the original elements', () => {
      const rng = new SeededRandom(42);
      const arr = [1, 2, 3, 4, 5];
      const result = rng.shuffle(arr);
      expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
    });

    it('is deterministic for the same seed', () => {
      const arr1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const arr2 = [...arr1];

      const rng1 = new SeededRandom(42);
      const rng2 = new SeededRandom(42);

      rng1.shuffle(arr1);
      rng2.shuffle(arr2);

      expect(arr1).toEqual(arr2);
    });

    it('mutates the array in-place', () => {
      const rng = new SeededRandom(42);
      const arr = [1, 2, 3, 4, 5];
      const result = rng.shuffle(arr);
      expect(result).toBe(arr); // same reference
    });

    it('handles an empty array', () => {
      const rng = new SeededRandom(42);
      const arr: number[] = [];
      const result = rng.shuffle(arr);
      expect(result).toEqual([]);
    });

    it('handles a single-element array', () => {
      const rng = new SeededRandom(42);
      const arr = [99];
      const result = rng.shuffle(arr);
      expect(result).toEqual([99]);
    });
  });

  describe('weightedPick()', () => {
    it('always picks the single available item', () => {
      const rng = new SeededRandom(42);
      const items = ['only'];
      const weights = [1];
      for (let i = 0; i < 20; i++) {
        expect(rng.weightedPick(items, weights)).toBe('only');
      }
    });

    it('respects weights over many trials', () => {
      const rng = new SeededRandom(42);
      const items = ['common', 'rare'];
      const weights = [99, 1];
      const counts: Record<string, number> = { common: 0, rare: 0 };

      for (let i = 0; i < 1000; i++) {
        const picked = rng.weightedPick(items, weights);
        counts[picked]++;
      }

      // Common should be picked far more often
      expect(counts['common']).toBeGreaterThan(counts['rare'] * 5);
    });

    it('picks an item with weight 0 only as fallback', () => {
      const rng = new SeededRandom(42);
      // Item B has 0 weight, should (almost) never be picked
      const items = ['A', 'B'];
      const weights = [100, 0];
      for (let i = 0; i < 100; i++) {
        expect(rng.weightedPick(items, weights)).toBe('A');
      }
    });
  });

  describe('getSeed()', () => {
    it('returns the current internal seed state', () => {
      const rng = new SeededRandom(42);
      const initialSeed = rng.getSeed();
      rng.next();
      const afterSeed = rng.getSeed();
      // Seed should have changed after calling next()
      expect(initialSeed).not.toBe(afterSeed);
    });
  });
});

describe('shuffleArray utility', () => {
  it('returns a new shuffled copy without modifying the original', () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    const result = shuffleArray(original, 42);
    expect(original).toEqual(copy); // original unchanged
    expect(result.sort()).toEqual([1, 2, 3, 4, 5]); // all elements present
  });

  it('is deterministic for the same seed', () => {
    const arr = [10, 20, 30, 40, 50];
    const r1 = shuffleArray(arr, 42);
    const r2 = shuffleArray(arr, 42);
    expect(r1).toEqual(r2);
  });
});

describe('seedFromDateString', () => {
  it('produces the same seed for the same date string', () => {
    expect(seedFromDateString('20260101')).toBe(seedFromDateString('20260101'));
  });

  it('produces different seeds for different date strings', () => {
    expect(seedFromDateString('20260101')).not.toBe(seedFromDateString('20260102'));
  });

  it('returns a non-negative number', () => {
    const seed = seedFromDateString('20260222');
    expect(seed).toBeGreaterThanOrEqual(0);
  });
});
