import { EnemyData } from '../models/Enemy';
import { EnemyTier, IntentType } from '../models/Enums';

// Act 1 Normal Enemies
export const ACT1_NORMAL_ENEMIES: EnemyData[] = [
  {
    enemyId: 'slime_small',
    enemyName: 'Small Slime',
    maxHp: 14,
    intentPattern: [
      { type: IntentType.Attack, value: 4, description: 'Attacks for 4' },
      { type: IntentType.Defend, value: 3, description: 'Gains 3 Block' },
    ],
    passives: [],
    tier: EnemyTier.Normal,
    act: 1,
  },
  {
    enemyId: 'cultist',
    enemyName: 'Cultist',
    maxHp: 50,
    intentPattern: [
      { type: IntentType.Buff, value: 3, description: 'Performs a ritual (+3 Strength)' },
      { type: IntentType.Attack, value: 6, description: 'Attacks for 6' },
      { type: IntentType.Attack, value: 6, description: 'Attacks for 6' },
      { type: IntentType.Attack, value: 6, description: 'Attacks for 6' },
    ],
    passives: [],
    tier: EnemyTier.Normal,
    act: 1,
  },
  {
    enemyId: 'jaw_worm',
    enemyName: 'Jaw Worm',
    maxHp: 44,
    intentPattern: [
      { type: IntentType.Attack, value: 11, description: 'Attacks for 11' },
      { type: IntentType.AttackDefend, value: 7, secondaryValue: 5, description: 'Attacks for 7 and gains 5 Block' },
      { type: IntentType.Buff, value: 3, description: 'Grows stronger (+3 Strength)' },
    ],
    passives: [],
    tier: EnemyTier.Normal,
    act: 1,
  },
  {
    enemyId: 'louse_red',
    enemyName: 'Red Louse',
    maxHp: 16,
    intentPattern: [
      { type: IntentType.Attack, value: 6, description: 'Bites for 6' },
      { type: IntentType.Attack, value: 6, description: 'Bites for 6' },
      { type: IntentType.Buff, value: 3, description: 'Curls up (+3 Strength)' },
    ],
    passives: [],
    tier: EnemyTier.Normal,
    act: 1,
  },
  {
    enemyId: 'louse_green',
    enemyName: 'Green Louse',
    maxHp: 18,
    intentPattern: [
      { type: IntentType.Attack, value: 5, description: 'Bites for 5' },
      { type: IntentType.Debuff, value: 2, description: 'Weakens you (2 Weak)' },
      { type: IntentType.Attack, value: 5, description: 'Bites for 5' },
    ],
    passives: [],
    tier: EnemyTier.Normal,
    act: 1,
  },
  {
    enemyId: 'fungi_beast',
    enemyName: 'Fungi Beast',
    maxHp: 28,
    intentPattern: [
      { type: IntentType.Attack, value: 6, description: 'Attacks for 6' },
      { type: IntentType.Buff, value: 3, description: 'Grows (+3 Strength)' },
    ],
    passives: [],
    tier: EnemyTier.Normal,
    act: 1,
  },
];

// Act 1 Elite Enemies
export const ACT1_ELITE_ENEMIES: EnemyData[] = [
  {
    enemyId: 'gremlin_nob',
    enemyName: 'Gremlin Nob',
    maxHp: 85,
    intentPattern: [
      { type: IntentType.Buff, value: 2, description: 'Roars (+2 Strength)' },
      { type: IntentType.Attack, value: 14, description: 'Rushes for 14' },
      { type: IntentType.Attack, value: 14, description: 'Rushes for 14' },
      { type: IntentType.Attack, value: 16, description: 'Skull Bash for 16' },
    ],
    passives: [],
    tier: EnemyTier.Elite,
    act: 1,
  },
  {
    enemyId: 'lagavulin',
    enemyName: 'Lagavulin',
    maxHp: 112,
    intentPattern: [
      { type: IntentType.Defend, value: 8, description: 'Sleeping... (gains 8 Block)' },
      { type: IntentType.Defend, value: 8, description: 'Sleeping... (gains 8 Block)' },
      { type: IntentType.Attack, value: 18, description: 'Attacks for 18' },
      { type: IntentType.Debuff, value: 1, description: 'Drains you (-1 Strength)' },
      { type: IntentType.Attack, value: 18, description: 'Attacks for 18' },
    ],
    passives: [],
    tier: EnemyTier.Elite,
    act: 1,
  },
];

// Act 2 Normal Enemies
export const ACT2_NORMAL_ENEMIES: EnemyData[] = [
  {
    enemyId: 'chosen',
    enemyName: 'Chosen',
    maxHp: 96,
    intentPattern: [
      { type: IntentType.Debuff, value: 3, description: 'Hexes you (3 Vulnerable)' },
      { type: IntentType.Attack, value: 12, description: 'Pokes for 12' },
      { type: IntentType.Attack, value: 12, description: 'Pokes for 12' },
      { type: IntentType.Buff, value: 3, description: 'Gains strength (+3 Strength)' },
    ],
    passives: [],
    tier: EnemyTier.Normal,
    act: 2,
  },
  {
    enemyId: 'byrd',
    enemyName: 'Byrd',
    maxHp: 28,
    intentPattern: [
      { type: IntentType.Attack, value: 3, description: 'Pecks for 3' },
      { type: IntentType.Attack, value: 3, description: 'Pecks for 3' },
      { type: IntentType.Buff, value: 1, description: 'Flaps (+1 Strength)' },
      { type: IntentType.Attack, value: 5, description: 'Swoops for 5' },
    ],
    passives: [],
    tier: EnemyTier.Normal,
    act: 2,
  },
  {
    enemyId: 'snecko',
    enemyName: 'Snecko',
    maxHp: 60,
    intentPattern: [
      { type: IntentType.Attack, value: 15, description: 'Bites for 15' },
      { type: IntentType.Debuff, value: 1, description: 'Glares (1 Weak)' },
      { type: IntentType.Attack, value: 8, description: 'Tail whips for 8' },
    ],
    passives: [],
    tier: EnemyTier.Normal,
    act: 2,
  },
  {
    enemyId: 'shelled_parasite',
    enemyName: 'Shelled Parasite',
    maxHp: 72,
    intentPattern: [
      { type: IntentType.Attack, value: 10, description: 'Attacks for 10' },
      { type: IntentType.AttackDefend, value: 6, secondaryValue: 9, description: 'Attacks for 6 and gains 9 Block' },
      { type: IntentType.Attack, value: 14, description: 'Crushes for 14' },
    ],
    passives: [],
    tier: EnemyTier.Normal,
    act: 2,
  },
];

// Act 2 Elite Enemies
export const ACT2_ELITE_ENEMIES: EnemyData[] = [
  {
    enemyId: 'book_of_stabbing',
    enemyName: 'Book of Stabbing',
    maxHp: 160,
    intentPattern: [
      { type: IntentType.Attack, value: 6, description: 'Stabs for 6' },
      { type: IntentType.Attack, value: 8, description: 'Multi-stab for 8' },
      { type: IntentType.Attack, value: 12, description: 'Multi-stab for 12' },
      { type: IntentType.Attack, value: 16, description: 'Multi-stab for 16' },
    ],
    passives: [
      { id: 'escalate', name: 'Escalate', description: 'Gains 1 Strength each turn', effectId: 'gain_strength_per_turn', effectValue: 1 },
    ],
    tier: EnemyTier.Elite,
    act: 2,
  },
  {
    enemyId: 'gremlin_leader',
    enemyName: 'Gremlin Leader',
    maxHp: 140,
    intentPattern: [
      { type: IntentType.Buff, value: 3, description: 'Rallies allies (+3 Strength)' },
      { type: IntentType.Attack, value: 12, description: 'Attacks for 12' },
      { type: IntentType.AttackDefend, value: 8, secondaryValue: 10, description: 'Attacks for 8 and gains 10 Block' },
      { type: IntentType.Attack, value: 18, description: 'Charges for 18' },
    ],
    passives: [],
    tier: EnemyTier.Elite,
    act: 2,
  },
];

// Act 3 Normal Enemies
export const ACT3_NORMAL_ENEMIES: EnemyData[] = [
  {
    enemyId: 'darkling',
    enemyName: 'Darkling',
    maxHp: 52,
    intentPattern: [
      { type: IntentType.Attack, value: 9, description: 'Attacks for 9' },
      { type: IntentType.AttackDefend, value: 6, secondaryValue: 6, description: 'Attacks for 6, gains 6 Block' },
      { type: IntentType.Attack, value: 12, description: 'Charges for 12' },
    ],
    passives: [],
    tier: EnemyTier.Normal,
    act: 3,
  },
  {
    enemyId: 'orb_walker',
    enemyName: 'Orb Walker',
    maxHp: 96,
    intentPattern: [
      { type: IntentType.Attack, value: 15, description: 'Laser for 15' },
      { type: IntentType.Debuff, value: 2, description: 'Burns you (2 Frail)' },
      { type: IntentType.Attack, value: 15, description: 'Laser for 15' },
      { type: IntentType.Buff, value: 5, description: 'Powers up (+5 Strength)' },
    ],
    passives: [],
    tier: EnemyTier.Normal,
    act: 3,
  },
  {
    enemyId: 'spiker',
    enemyName: 'Spiker',
    maxHp: 54,
    intentPattern: [
      { type: IntentType.Attack, value: 8, description: 'Slams for 8' },
      { type: IntentType.Attack, value: 8, description: 'Slams for 8' },
      { type: IntentType.Defend, value: 12, description: 'Curls up (12 Block)' },
    ],
    passives: [
      { id: 'thorns', name: 'Thorny', description: 'Deals 3 damage when attacked', effectId: 'gain_strength_per_turn', effectValue: 0 },
    ],
    tier: EnemyTier.Normal,
    act: 3,
  },
];

// Act 3 Elite Enemies
export const ACT3_ELITE_ENEMIES: EnemyData[] = [
  {
    enemyId: 'giant_head',
    enemyName: 'Giant Head',
    maxHp: 500,
    intentPattern: [
      { type: IntentType.Attack, value: 13, description: 'Glares for 13' },
      { type: IntentType.Attack, value: 13, description: 'Glares for 13' },
      { type: IntentType.Buff, value: 2, description: 'Grows (+2 Strength)' },
      { type: IntentType.Attack, value: 20, description: 'Headbutt for 20' },
    ],
    passives: [
      { id: 'slow', name: 'Slow', description: 'Gains 1 Strength each turn', effectId: 'gain_strength_per_turn', effectValue: 1 },
    ],
    tier: EnemyTier.Elite,
    act: 3,
  },
  {
    enemyId: 'nemesis',
    enemyName: 'Nemesis',
    maxHp: 200,
    intentPattern: [
      { type: IntentType.Attack, value: 7, description: 'Scythes for 7' },
      { type: IntentType.Debuff, value: 2, description: 'Inflicts burns (2 Frail)' },
      { type: IntentType.Attack, value: 18, description: 'Mega slash for 18' },
      { type: IntentType.Attack, value: 7, description: 'Scythes for 7' },
    ],
    passives: [],
    tier: EnemyTier.Elite,
    act: 3,
  },
];

// Boss Enemies
export const BOSS_ENEMIES: EnemyData[] = [
  // Act 1 Boss
  {
    enemyId: 'boss_slime_king',
    enemyName: 'Slime King',
    maxHp: 150,
    intentPattern: [
      { type: IntentType.Attack, value: 12, description: 'Slams for 12' },
      { type: IntentType.AttackDefend, value: 8, secondaryValue: 10, description: 'Attacks for 8, gains 10 Block' },
      { type: IntentType.Debuff, value: 1, description: 'Oozes (1 Frail)' },
      { type: IntentType.Attack, value: 18, description: 'Charges for 18' },
      { type: IntentType.Buff, value: 3, description: 'Grows (+3 Strength)' },
    ],
    passives: [
      { id: 'split', name: 'Armored', description: 'Gains 5 Block each turn', effectId: 'gain_block_per_turn', effectValue: 5 },
    ],
    tier: EnemyTier.Boss,
    act: 1,
  },
  // Act 2 Boss
  {
    enemyId: 'boss_automaton',
    enemyName: 'Bronze Automaton',
    maxHp: 300,
    intentPattern: [
      { type: IntentType.Attack, value: 10, description: 'Flails for 10' },
      { type: IntentType.Buff, value: 3, description: 'Boosts systems (+3 Strength)' },
      { type: IntentType.Attack, value: 16, description: 'Hyper Beam for 16' },
      { type: IntentType.AttackDefend, value: 10, secondaryValue: 15, description: 'Attacks for 10, gains 15 Block' },
      { type: IntentType.Attack, value: 22, description: 'Mega Flail for 22' },
    ],
    passives: [
      { id: 'artifact', name: 'Artifact', description: 'Starts with 3 Artifact', effectId: 'gain_strength_per_turn', effectValue: 0 },
    ],
    tier: EnemyTier.Boss,
    act: 2,
  },
  // Act 3 Boss
  {
    enemyId: 'boss_heart',
    enemyName: 'The Corrupted Heart',
    maxHp: 750,
    intentPattern: [
      { type: IntentType.Debuff, value: 2, description: 'Afflicts (2 Vulnerable, 2 Weak)' },
      { type: IntentType.Attack, value: 15, description: 'Blood Shots for 15' },
      { type: IntentType.Attack, value: 25, description: 'Echoed Slam for 25' },
      { type: IntentType.Buff, value: 5, description: 'Empowers (+5 Strength)' },
      { type: IntentType.Attack, value: 35, description: 'Devastate for 35' },
      { type: IntentType.AttackDefend, value: 15, secondaryValue: 20, description: 'Attacks for 15, gains 20 Block' },
    ],
    passives: [
      { id: 'beat', name: 'Beat of Death', description: 'Deals 1 damage when you play a card', effectId: 'gain_strength_per_turn', effectValue: 0 },
    ],
    tier: EnemyTier.Boss,
    act: 3,
  },
];

export function getEnemiesForFloor(act: number, isElite: boolean): EnemyData[] {
  if (isElite) {
    switch (act) {
      case 1: return ACT1_ELITE_ENEMIES;
      case 2: return ACT2_ELITE_ENEMIES;
      case 3: return ACT3_ELITE_ENEMIES;
      default: return ACT1_ELITE_ENEMIES;
    }
  }
  switch (act) {
    case 1: return ACT1_NORMAL_ENEMIES;
    case 2: return ACT2_NORMAL_ENEMIES;
    case 3: return ACT3_NORMAL_ENEMIES;
    default: return ACT1_NORMAL_ENEMIES;
  }
}

export function getBossForAct(act: number): EnemyData {
  return BOSS_ENEMIES[Math.min(act - 1, BOSS_ENEMIES.length - 1)];
}
