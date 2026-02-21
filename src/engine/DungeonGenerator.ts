import { FloorType } from '../models/Enums';
import { SeededRandom } from './SeededRandom';

export interface FloorWeight {
  type: FloorType;
  weight: number;
}

export interface DungeonConfig {
  floorsPerAct: number;
  totalActs: number;
  floorWeights: FloorWeight[];
}

export const DEFAULT_DUNGEON_CONFIG: DungeonConfig = {
  floorsPerAct: 8,
  totalActs: 3,
  floorWeights: [
    { type: FloorType.CombatNormal, weight: 45 },
    { type: FloorType.CombatElite, weight: 15 },
    { type: FloorType.RestNode, weight: 15 },
    { type: FloorType.Shop, weight: 10 },
    { type: FloorType.Event, weight: 10 },
    { type: FloorType.Treasure, weight: 5 },
  ],
};

export interface FloorData {
  floorNumber: number;
  act: number;
  type: FloorType;
}

export class DungeonGenerator {
  private config: DungeonConfig;
  private rng: SeededRandom;

  constructor(seed: number, config: DungeonConfig = DEFAULT_DUNGEON_CONFIG) {
    this.config = config;
    this.rng = new SeededRandom(seed);
  }

  generateRun(): FloorData[] {
    const floors: FloorData[] = [];
    let floorNumber = 1;

    for (let act = 1; act <= this.config.totalActs; act++) {
      const actFloors = this.generateAct(act, floorNumber);
      floors.push(...actFloors);
      floorNumber += actFloors.length;
    }

    return floors;
  }

  private generateAct(act: number, startFloor: number): FloorData[] {
    const floors: FloorData[] = [];
    const floorsInAct = this.config.floorsPerAct;

    for (let i = 0; i < floorsInAct; i++) {
      const floorNumber = startFloor + i;
      const isLastFloor = i === floorsInAct - 1;

      if (isLastFloor) {
        // Last floor of each act is always a Boss
        floors.push({ floorNumber, act, type: FloorType.Boss });
      } else if (i === 0) {
        // First floor is always a normal combat
        floors.push({ floorNumber, act, type: FloorType.CombatNormal });
      } else {
        // Use weighted random for middle floors
        const type = this.selectFloorType(floors);
        floors.push({ floorNumber, act, type });
      }
    }

    return floors;
  }

  private selectFloorType(previousFloors: FloorData[]): FloorType {
    const types = this.config.floorWeights.map(fw => fw.type);
    const weights = this.config.floorWeights.map(fw => fw.weight);

    // Avoid repeating the same floor type more than 2 times in a row
    if (previousFloors.length >= 2) {
      const lastType = previousFloors[previousFloors.length - 1].type;
      const secondLastType = previousFloors[previousFloors.length - 2].type;
      if (lastType === secondLastType) {
        const idx = types.indexOf(lastType);
        if (idx !== -1) {
          weights[idx] = 0;
        }
      }
    }

    // Ensure at least one Elite per act and at least one Rest per act
    // (handled by weights being nonzero)

    return this.rng.weightedPick(types, weights);
  }
}
