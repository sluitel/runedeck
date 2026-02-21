import { CharacterClass } from './Enums';
import { CardInstance } from './Card';
import { RuneInstance } from './Rune';
import { Buff } from './Buff';

export interface RunState {
  playerClass: CharacterClass;
  currentHp: number;
  maxHp: number;
  gold: number;
  floor: number;
  act: number;
  deck: CardInstance[];
  runes: RuneInstance[];
  maxRuneSlots: number;
  energy: number;
  maxEnergy: number;
  buffs: Buff[];
  seed: number;
  isDailyRun: boolean;
  floorsCleared: number;
  bossesKilled: number;
  cardsPlayed: number;
  damageDealt: number;
  damageBlocked: number;
}

export function createInitialRunState(playerClass: CharacterClass, seed: number, isDailyRun: boolean = false): RunState {
  return {
    playerClass,
    currentHp: 80,
    maxHp: 80,
    gold: 100,
    floor: 0,
    act: 1,
    deck: [],
    runes: [],
    maxRuneSlots: 3,
    energy: 3,
    maxEnergy: 3,
    buffs: [],
    seed,
    isDailyRun,
    floorsCleared: 0,
    bossesKilled: 0,
    cardsPlayed: 0,
    damageDealt: 0,
    damageBlocked: 0,
  };
}
