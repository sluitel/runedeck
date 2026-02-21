import { RuneRarity } from './Enums';

export interface RuneData {
  runeId: string;
  runeName: string;
  effectId: string;
  description: string;
  rarity: RuneRarity;
}

export interface RuneInstance {
  instanceId: string;
  data: RuneData;
}

let nextRuneInstanceId = 0;

export function createRuneInstance(data: RuneData): RuneInstance {
  return {
    instanceId: `rune_${nextRuneInstanceId++}`,
    data: { ...data },
  };
}
