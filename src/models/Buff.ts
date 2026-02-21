import { BuffType } from './Enums';

export interface Buff {
  type: BuffType;
  stacks: number;
  duration?: number; // undefined = permanent until stacks removed
}

export function createBuff(type: BuffType, stacks: number, duration?: number): Buff {
  return { type, stacks, duration };
}

export function isDebuff(type: BuffType): boolean {
  return [
    BuffType.Vulnerable,
    BuffType.Weak,
    BuffType.Poison,
    BuffType.Frail,
    BuffType.DrawReduction,
    BuffType.Entangle,
    BuffType.NoDraw,
  ].includes(type);
}

export function getBuffName(type: BuffType): string {
  const names: Record<BuffType, string> = {
    [BuffType.Strength]: 'Strength',
    [BuffType.Dexterity]: 'Dexterity',
    [BuffType.Vulnerable]: 'Vulnerable',
    [BuffType.Weak]: 'Weak',
    [BuffType.Poison]: 'Poison',
    [BuffType.Rage]: 'Rage',
    [BuffType.Charge]: 'Charge',
    [BuffType.Thorns]: 'Thorns',
    [BuffType.Regeneration]: 'Regeneration',
    [BuffType.Ritual]: 'Ritual',
    [BuffType.Barricade]: 'Barricade',
    [BuffType.Metallicize]: 'Metallicize',
    [BuffType.PlatedArmor]: 'Plated Armor',
    [BuffType.Artifact]: 'Artifact',
    [BuffType.Intangible]: 'Intangible',
    [BuffType.Frail]: 'Frail',
    [BuffType.DrawReduction]: 'Draw Reduction',
    [BuffType.Entangle]: 'Entangle',
    [BuffType.NoDraw]: 'No Draw',
  };
  return names[type];
}

export function getBuffDescription(type: BuffType): string {
  const descriptions: Record<BuffType, string> = {
    [BuffType.Strength]: 'Increases attack damage by {x}',
    [BuffType.Dexterity]: 'Increases block gained by {x}',
    [BuffType.Vulnerable]: 'Takes 50% more damage for {x} turns',
    [BuffType.Weak]: 'Deals 25% less damage for {x} turns',
    [BuffType.Poison]: 'Takes {x} damage at end of turn, then reduces by 1',
    [BuffType.Rage]: 'Gain {x} block when playing an Attack',
    [BuffType.Charge]: '{x} Charge stacks — spend for bonus effects',
    [BuffType.Thorns]: 'Deal {x} damage when attacked',
    [BuffType.Regeneration]: 'Heal {x} HP at end of turn',
    [BuffType.Ritual]: 'Gain {x} Strength at end of turn',
    [BuffType.Barricade]: 'Block is not removed at start of turn',
    [BuffType.Metallicize]: 'Gain {x} block at end of turn',
    [BuffType.PlatedArmor]: 'Gain {x} block at end of turn. Reduced by 1 when hit unblocked.',
    [BuffType.Artifact]: 'Negates {x} debuff applications',
    [BuffType.Intangible]: 'Reduce all damage to 1 for {x} turns',
    [BuffType.Frail]: 'Block gained reduced by 25% for {x} turns',
    [BuffType.DrawReduction]: 'Draw {x} fewer cards next turn',
    [BuffType.Entangle]: 'Cannot play attacks for {x} turns',
    [BuffType.NoDraw]: 'Cannot draw cards for {x} turns',
  };
  return descriptions[type];
}
