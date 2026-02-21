import { EnemyTier, IntentType, BuffType } from './Enums';
import { Buff } from './Buff';

export interface Intent {
  type: IntentType;
  value: number;
  secondaryValue?: number;
  description: string;
}

export interface PassiveAbility {
  id: string;
  name: string;
  description: string;
  effectId: string;
  effectValue: number;
}

export interface EnemyData {
  enemyId: string;
  enemyName: string;
  maxHp: number;
  intentPattern: Intent[];
  passives: PassiveAbility[];
  tier: EnemyTier;
  act: number;
}

export interface EnemyInstance {
  instanceId: string;
  data: EnemyData;
  currentHp: number;
  maxHp: number;
  block: number;
  buffs: Buff[];
  currentIntentIndex: number;
  turnsElapsed: number;
}

let nextEnemyInstanceId = 0;

export function createEnemyInstance(data: EnemyData): EnemyInstance {
  return {
    instanceId: `enemy_${nextEnemyInstanceId++}`,
    data,
    currentHp: data.maxHp,
    maxHp: data.maxHp,
    block: 0,
    buffs: [],
    currentIntentIndex: 0,
    turnsElapsed: 0,
  };
}

export function getEnemyCurrentIntent(enemy: EnemyInstance): Intent {
  return enemy.data.intentPattern[enemy.currentIntentIndex % enemy.data.intentPattern.length];
}

export function advanceEnemyIntent(enemy: EnemyInstance): void {
  enemy.currentIntentIndex = (enemy.currentIntentIndex + 1) % enemy.data.intentPattern.length;
  enemy.turnsElapsed++;
}
