export enum CardType {
  Attack = 'Attack',
  Block = 'Block',
  Skill = 'Skill',
  Power = 'Power',
  Curse = 'Curse',
}

export enum CardRarity {
  Common = 'Common',
  Uncommon = 'Uncommon',
  Rare = 'Rare',
  Legendary = 'Legendary',
  Starter = 'Starter',
  Curse = 'Curse',
}

export enum CharacterClass {
  Ironclad = 'Ironclad',
  Hexblade = 'Hexblade',
  Shadowstep = 'Shadowstep',
}

export enum FloorType {
  CombatNormal = 'CombatNormal',
  CombatElite = 'CombatElite',
  RestNode = 'RestNode',
  Shop = 'Shop',
  Event = 'Event',
  Treasure = 'Treasure',
  Boss = 'Boss',
}

export enum EnemyTier {
  Normal = 'Normal',
  Elite = 'Elite',
  Boss = 'Boss',
}

export enum IntentType {
  Attack = 'Attack',
  Defend = 'Defend',
  Buff = 'Buff',
  Debuff = 'Debuff',
  AttackDefend = 'AttackDefend',
  Special = 'Special',
}

export enum BuffType {
  Strength = 'Strength',
  Dexterity = 'Dexterity',
  Vulnerable = 'Vulnerable',
  Weak = 'Weak',
  Poison = 'Poison',
  Rage = 'Rage',
  Charge = 'Charge',
  Thorns = 'Thorns',
  Regeneration = 'Regeneration',
  Ritual = 'Ritual',
  Barricade = 'Barricade',
  Metallicize = 'Metallicize',
  PlatedArmor = 'PlatedArmor',
  Artifact = 'Artifact',
  Intangible = 'Intangible',
  Frail = 'Frail',
  DrawReduction = 'DrawReduction',
  Entangle = 'Entangle',
  NoDraw = 'NoDraw',
}

export enum RuneRarity {
  Common = 'Common',
  Uncommon = 'Uncommon',
  Rare = 'Rare',
}

export enum GameScreen {
  MainMenu = 'MainMenu',
  CharacterSelect = 'CharacterSelect',
  Map = 'Map',
  Combat = 'Combat',
  Draft = 'Draft',
  Reward = 'Reward',
  Rest = 'Rest',
  Shop = 'Shop',
  Event = 'Event',
  Treasure = 'Treasure',
  Vault = 'Vault',
  RunEnd = 'RunEnd',
  DailyRun = 'DailyRun',
  CardPreview = 'CardPreview',
  DeckView = 'DeckView',
}

export enum TargetType {
  Enemy = 'Enemy',
  Self = 'Self',
  All = 'All',
  None = 'None',
}
