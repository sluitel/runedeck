import { CardType, CardRarity, TargetType, CharacterClass } from './Enums';

export interface CardData {
  cardId: string;
  cardName: string;
  type: CardType;
  rarity: CardRarity;
  energyCost: number;
  effectId: string;
  effectValue: number;
  secondaryEffectId?: string;
  secondaryEffectValue?: number;
  description: string;
  isUpgraded: boolean;
  upgradedCardId?: string;
  targetType: TargetType;
  characterClass: string;
  playCondition?: 'all_attacks' | 'turn_1' | 'empty_draw_pile';
}

export interface CardInstance {
  instanceId: string;
  data: CardData;
}

let nextInstanceId = 0;

export function createCardInstance(data: CardData): CardInstance {
  return {
    instanceId: `card_${nextInstanceId++}`,
    data: { ...data },
  };
}

export function resetCardInstanceCounter(): void {
  nextInstanceId = 0;
}
