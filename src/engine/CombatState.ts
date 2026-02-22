import { CardInstance } from '../models/Card';
import { EnemyInstance } from '../models/Enemy';
import { Buff } from '../models/Buff';
import { RuneInstance } from '../models/Rune';

export interface CombatState {
  playerHp: number;
  playerMaxHp: number;
  playerBlock: number;
  playerEnergy: number;
  playerMaxEnergy: number;
  playerBuffs: Buff[];
  hand: CardInstance[];
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  exhaustPile: CardInstance[];
  enemies: EnemyInstance[];
  runes: RuneInstance[];
  turn: number;
  cardsPlayedThisTurn: number;
  isPlayerTurn: boolean;
  combatOver: boolean;
  playerWon: boolean;
  combatLog: string[];
  attacksPlayedThisCombat: number;
}

export function createCombatState(
  playerHp: number,
  playerMaxHp: number,
  playerMaxEnergy: number,
  deck: CardInstance[],
  enemies: EnemyInstance[],
  runes: RuneInstance[],
  playerBuffs: Buff[]
): CombatState {
  return {
    playerHp,
    playerMaxHp,
    playerBlock: 0,
    playerEnergy: playerMaxEnergy,
    playerMaxEnergy,
    playerBuffs: [...playerBuffs],
    hand: [],
    drawPile: [...deck],
    discardPile: [],
    exhaustPile: [],
    enemies,
    runes,
    turn: 1,
    cardsPlayedThisTurn: 0,
    isPlayerTurn: true,
    combatOver: false,
    playerWon: false,
    combatLog: [],
    attacksPlayedThisCombat: 0,
  };
}
