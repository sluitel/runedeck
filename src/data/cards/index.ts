import { CardData } from '../../models/Card';
import { CharacterClass, CardRarity } from '../../models/Enums';
import { IRONCLAD_STARTER_CARDS, IRONCLAD_CARDS } from './ironclad';
import { HEXBLADE_STARTER_CARDS, HEXBLADE_CARDS } from './hexblade';
import { SHADOWSTEP_STARTER_CARDS, SHADOWSTEP_CARDS } from './shadowstep';
import { NEUTRAL_CARDS } from './neutral';
import { SeededRandom } from '../../engine/SeededRandom';

export function getStarterDeck(characterClass: CharacterClass): CardData[] {
  switch (characterClass) {
    case CharacterClass.Ironclad:
      return [...IRONCLAD_STARTER_CARDS];
    case CharacterClass.Hexblade:
      return [...HEXBLADE_STARTER_CARDS];
    case CharacterClass.Shadowstep:
      return [...SHADOWSTEP_STARTER_CARDS];
  }
}

export function getClassCards(characterClass: CharacterClass): CardData[] {
  switch (characterClass) {
    case CharacterClass.Ironclad:
      return IRONCLAD_CARDS;
    case CharacterClass.Hexblade:
      return HEXBLADE_CARDS;
    case CharacterClass.Shadowstep:
      return SHADOWSTEP_CARDS;
  }
}

export function getAllDraftableCards(characterClass: CharacterClass): CardData[] {
  return [...getClassCards(characterClass), ...NEUTRAL_CARDS.filter(c => c.rarity !== CardRarity.Curse)];
}

export function getDraftOptions(characterClass: CharacterClass, rng: SeededRandom, count: number = 3, hasLuckyCharm: boolean = false): CardData[] {
  const pool = getAllDraftableCards(characterClass);
  const options: CardData[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < count; i++) {
    // Weighted rarity selection
    let rarityRoll = rng.next();

    // Lucky Charm increases rare chance
    if (hasLuckyCharm) {
      rarityRoll *= 0.8; // shifts distribution toward rarer cards
    }

    let targetRarity: CardRarity;
    if (rarityRoll < 0.05) {
      targetRarity = CardRarity.Legendary;
    } else if (rarityRoll < 0.20) {
      targetRarity = CardRarity.Rare;
    } else if (rarityRoll < 0.50) {
      targetRarity = CardRarity.Uncommon;
    } else {
      targetRarity = CardRarity.Common;
    }

    // Find cards of that rarity
    let candidates = pool.filter(c => c.rarity === targetRarity && !usedIds.has(c.cardId));

    // Fallback to any non-used card if no candidates
    if (candidates.length === 0) {
      candidates = pool.filter(c => !usedIds.has(c.cardId));
    }

    if (candidates.length > 0) {
      const card = rng.pick(candidates);
      options.push({ ...card });
      usedIds.add(card.cardId);
    }
  }

  return options;
}

export { IRONCLAD_CARDS, HEXBLADE_CARDS, SHADOWSTEP_CARDS, NEUTRAL_CARDS };
export { IRONCLAD_STARTER_CARDS, HEXBLADE_STARTER_CARDS, SHADOWSTEP_STARTER_CARDS };
