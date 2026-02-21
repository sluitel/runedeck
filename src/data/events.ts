export interface GameEvent {
  eventId: string;
  title: string;
  description: string;
  choices: EventChoice[];
}

export interface EventChoice {
  label: string;
  description: string;
  effectType: 'heal' | 'damage' | 'gold' | 'card' | 'rune' | 'max_hp' | 'remove_card' | 'curse';
  effectValue: number;
}

export const GAME_EVENTS: GameEvent[] = [
  {
    eventId: 'event_mysterious_merchant',
    title: 'Mysterious Merchant',
    description: 'A hooded figure blocks the path. "I deal in power, not coin."',
    choices: [
      { label: 'Trade HP for Power', description: 'Lose 10 HP, gain 50 gold', effectType: 'damage', effectValue: 10 },
      { label: 'Walk Away', description: 'Nothing happens', effectType: 'gold', effectValue: 0 },
    ],
  },
  {
    eventId: 'event_healing_spring',
    title: 'Healing Spring',
    description: 'You find a pool of glowing water. It smells of fresh rain.',
    choices: [
      { label: 'Drink Deep', description: 'Heal 25% of max HP', effectType: 'heal', effectValue: 25 },
      { label: 'Bathe in It', description: 'Gain +5 max HP', effectType: 'max_hp', effectValue: 5 },
    ],
  },
  {
    eventId: 'event_abandoned_chest',
    title: 'Abandoned Chest',
    description: 'A dusty chest sits in the corner, its lock broken. Something glints inside.',
    choices: [
      { label: 'Open It', description: 'Gain 30 gold, but add a Curse', effectType: 'gold', effectValue: 30 },
      { label: 'Kick It Away', description: 'Nothing happens', effectType: 'gold', effectValue: 0 },
    ],
  },
  {
    eventId: 'event_ancient_altar',
    title: 'Ancient Altar',
    description: 'An altar hums with power. Strange runes glow on its surface.',
    choices: [
      { label: 'Offer Blood', description: 'Lose 15 HP, remove a card from your deck', effectType: 'damage', effectValue: 15 },
      { label: 'Pray', description: 'Heal 10 HP', effectType: 'heal', effectValue: 10 },
    ],
  },
  {
    eventId: 'event_training_dummy',
    title: 'Training Dummy',
    description: 'A battered training dummy stands here. Good for practice.',
    choices: [
      { label: 'Train', description: 'Gain +3 max HP', effectType: 'max_hp', effectValue: 3 },
      { label: 'Smash It', description: 'Gain 15 gold', effectType: 'gold', effectValue: 15 },
    ],
  },
  {
    eventId: 'event_dark_pact',
    title: 'Dark Pact',
    description: 'A swirling portal of shadow beckons. Power whispers from within.',
    choices: [
      { label: 'Embrace the Darkness', description: 'Lose 8 max HP, gain a random rare card', effectType: 'max_hp', effectValue: -8 },
      { label: 'Resist', description: 'Nothing happens', effectType: 'gold', effectValue: 0 },
    ],
  },
  {
    eventId: 'event_golden_shrine',
    title: 'Golden Shrine',
    description: 'A golden shrine with an offering bowl. It feels... hungry.',
    choices: [
      { label: 'Offer Gold', description: 'Spend 50 gold, heal to full HP', effectType: 'gold', effectValue: -50 },
      { label: 'Take the Gold', description: 'Gain 25 gold, add a Curse', effectType: 'gold', effectValue: 25 },
      { label: 'Leave', description: 'Nothing happens', effectType: 'gold', effectValue: 0 },
    ],
  },
  {
    eventId: 'event_forgotten_library',
    title: 'Forgotten Library',
    description: 'Shelves of ancient tomes stretch to the ceiling. Knowledge awaits.',
    choices: [
      { label: 'Study', description: 'Remove a card from your deck', effectType: 'remove_card', effectValue: 1 },
      { label: 'Search for Treasure', description: 'Gain 20 gold', effectType: 'gold', effectValue: 20 },
    ],
  },
];
