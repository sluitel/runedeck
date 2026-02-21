import { Buff } from '../models/Buff';
import { BuffType } from '../models/Enums';

export function getBuffStacks(buffs: Buff[], type: BuffType): number {
  const buff = buffs.find(b => b.type === type);
  return buff ? buff.stacks : 0;
}

export function addBuff(buffs: Buff[], type: BuffType, stacks: number, duration?: number): void {
  const existing = buffs.find(b => b.type === type);
  if (existing) {
    existing.stacks += stacks;
    if (duration !== undefined) {
      existing.duration = (existing.duration ?? 0) + duration;
    }
  } else {
    buffs.push({ type, stacks, duration });
  }
}

export function removeBuff(buffs: Buff[], type: BuffType): Buff[] {
  return buffs.filter(b => b.type !== type);
}

export function reduceBuffDurations(buffs: Buff[]): Buff[] {
  return buffs.filter(buff => {
    if (buff.duration !== undefined) {
      buff.duration--;
      return buff.duration > 0;
    }
    return true;
  });
}

export function tickDebuffs(buffs: Buff[]): Buff[] {
  return buffs.filter(buff => {
    // Vulnerable, Weak, Frail reduce by 1 stack at end of turn
    if ([BuffType.Vulnerable, BuffType.Weak, BuffType.Frail, BuffType.Entangle, BuffType.NoDraw, BuffType.DrawReduction].includes(buff.type)) {
      buff.stacks--;
      return buff.stacks > 0;
    }
    return true;
  });
}

export function hasBuff(buffs: Buff[], type: BuffType): boolean {
  return getBuffStacks(buffs, type) > 0;
}
