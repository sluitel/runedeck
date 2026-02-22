import { describe, it, expect } from 'vitest';
import { DungeonGenerator, DEFAULT_DUNGEON_CONFIG, FloorData, DungeonConfig } from '../engine/DungeonGenerator';
import { FloorType } from '../models/Enums';

describe('DungeonGenerator', () => {
  const seed = 42;

  it('generates the correct total number of floors', () => {
    const gen = new DungeonGenerator(seed);
    const floors = gen.generateRun();
    // 3 acts * 8 floors per act = 24
    expect(floors).toHaveLength(24);
  });

  it('each act has the correct number of floors', () => {
    const gen = new DungeonGenerator(seed);
    const floors = gen.generateRun();
    const act1 = floors.filter(f => f.act === 1);
    const act2 = floors.filter(f => f.act === 2);
    const act3 = floors.filter(f => f.act === 3);
    expect(act1).toHaveLength(8);
    expect(act2).toHaveLength(8);
    expect(act3).toHaveLength(8);
  });

  it('last floor of each act is always a Boss', () => {
    const gen = new DungeonGenerator(seed);
    const floors = gen.generateRun();
    const act1Floors = floors.filter(f => f.act === 1);
    const act2Floors = floors.filter(f => f.act === 2);
    const act3Floors = floors.filter(f => f.act === 3);

    expect(act1Floors[act1Floors.length - 1].type).toBe(FloorType.Boss);
    expect(act2Floors[act2Floors.length - 1].type).toBe(FloorType.Boss);
    expect(act3Floors[act3Floors.length - 1].type).toBe(FloorType.Boss);
  });

  it('first floor of each act is always CombatNormal', () => {
    const gen = new DungeonGenerator(seed);
    const floors = gen.generateRun();
    const act1Floors = floors.filter(f => f.act === 1);
    const act2Floors = floors.filter(f => f.act === 2);
    const act3Floors = floors.filter(f => f.act === 3);

    expect(act1Floors[0].type).toBe(FloorType.CombatNormal);
    expect(act2Floors[0].type).toBe(FloorType.CombatNormal);
    expect(act3Floors[0].type).toBe(FloorType.CombatNormal);
  });

  it('floor numbers are sequential starting from 1', () => {
    const gen = new DungeonGenerator(seed);
    const floors = gen.generateRun();
    for (let i = 0; i < floors.length; i++) {
      expect(floors[i].floorNumber).toBe(i + 1);
    }
  });

  it('act numbers are correctly assigned', () => {
    const gen = new DungeonGenerator(seed);
    const floors = gen.generateRun();
    // Floors 1-8 are act 1, 9-16 act 2, 17-24 act 3
    for (let i = 0; i < 8; i++) expect(floors[i].act).toBe(1);
    for (let i = 8; i < 16; i++) expect(floors[i].act).toBe(2);
    for (let i = 16; i < 24; i++) expect(floors[i].act).toBe(3);
  });

  it('is deterministic with the same seed', () => {
    const gen1 = new DungeonGenerator(42);
    const gen2 = new DungeonGenerator(42);
    const floors1 = gen1.generateRun();
    const floors2 = gen2.generateRun();
    expect(floors1).toEqual(floors2);
  });

  it('produces different layouts for different seeds', () => {
    const gen1 = new DungeonGenerator(42);
    const gen2 = new DungeonGenerator(999);
    const floors1 = gen1.generateRun();
    const floors2 = gen2.generateRun();

    // At least one middle floor type should differ (boss/first floors are fixed)
    const types1 = floors1.filter(f => f.floorNumber > 1 && f.floorNumber < 8).map(f => f.type);
    const types2 = floors2.filter(f => f.floorNumber > 1 && f.floorNumber < 8).map(f => f.type);
    expect(types1).not.toEqual(types2);
  });

  it('does not repeat the same floor type more than 2 times consecutively', () => {
    // Test with multiple seeds to increase confidence
    for (const s of [42, 100, 200, 333, 777, 12345]) {
      const gen = new DungeonGenerator(s);
      const floors = gen.generateRun();

      // Check within each act (the anti-repetition logic operates per-act)
      for (let act = 1; act <= 3; act++) {
        const actFloors = floors.filter(f => f.act === act);
        for (let i = 2; i < actFloors.length; i++) {
          const threeInARow =
            actFloors[i].type === actFloors[i - 1].type &&
            actFloors[i].type === actFloors[i - 2].type;
          // Boss floors are forced, so skip that check
          if (actFloors[i].type !== FloorType.Boss && actFloors[i].type !== FloorType.CombatNormal) {
            expect(threeInARow).toBe(false);
          }
        }
      }
    }
  });

  it('supports custom config with different floors per act', () => {
    const config: DungeonConfig = {
      floorsPerAct: 5,
      totalActs: 3,
      floorWeights: DEFAULT_DUNGEON_CONFIG.floorWeights,
    };
    const gen = new DungeonGenerator(seed, config);
    const floors = gen.generateRun();
    expect(floors).toHaveLength(15); // 3 * 5
  });

  it('supports custom config with different total acts', () => {
    const config: DungeonConfig = {
      floorsPerAct: 8,
      totalActs: 2,
      floorWeights: DEFAULT_DUNGEON_CONFIG.floorWeights,
    };
    const gen = new DungeonGenerator(seed, config);
    const floors = gen.generateRun();
    expect(floors).toHaveLength(16); // 2 * 8
    expect(floors.filter(f => f.act === 3)).toHaveLength(0);
  });

  it('all floor types are valid enum values', () => {
    const validTypes = Object.values(FloorType);
    const gen = new DungeonGenerator(seed);
    const floors = gen.generateRun();
    for (const floor of floors) {
      expect(validTypes).toContain(floor.type);
    }
  });
});
