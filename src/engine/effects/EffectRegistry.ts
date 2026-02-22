import { ICardEffect } from './ICardEffect';
import { DealDamageEffect } from './DealDamageEffect';
import { GainBlockEffect } from './GainBlockEffect';
import { DrawCardsEffect } from './DrawCardsEffect';
import { ApplyBuffEffect } from './ApplyBuffEffect';
import { ApplyDebuffEffect } from './ApplyDebuffEffect';
import { ApplyDebuffAllEffect } from './ApplyDebuffAllEffect';
import { DealDamageAllEffect } from './DealDamageAllEffect';
import { GainEnergyEffect } from './GainEnergyEffect';
import { HealEffect } from './HealEffect';
import { ExhaustEffect } from './ExhaustEffect';
import { BodySlamEffect } from './BodySlamEffect';
import { MultiHitEffect } from './MultiHitEffect';
import { DoublePoisonEffect } from './DoublePoison';
import { BaneEffect } from './ConditionalDamageEffect';
import { BuffType } from '../../models/Enums';

const effectRegistry: Map<string, ICardEffect> = new Map();

function registerEffect(id: string, effect: ICardEffect): void {
  effectRegistry.set(id, effect);
}

export function getEffect(effectId: string): ICardEffect | undefined {
  return effectRegistry.get(effectId);
}

// Register all effects
registerEffect('deal_damage', new DealDamageEffect());
registerEffect('deal_damage_all', new DealDamageAllEffect());
registerEffect('gain_block', new GainBlockEffect());
registerEffect('draw_cards', new DrawCardsEffect());
registerEffect('gain_energy', new GainEnergyEffect());
registerEffect('heal', new HealEffect());
registerEffect('exhaust', new ExhaustEffect());

// Special card effects
registerEffect('body_slam', new BodySlamEffect());
registerEffect('multi_hit_3', new MultiHitEffect(3));
registerEffect('multi_hit_2', new MultiHitEffect(2));
registerEffect('double_poison', new DoublePoisonEffect());
registerEffect('bane', new BaneEffect());

// Buff effects (self-targeting)
registerEffect('apply_strength', new ApplyBuffEffect(BuffType.Strength));
registerEffect('apply_dexterity', new ApplyBuffEffect(BuffType.Dexterity));
registerEffect('apply_rage', new ApplyBuffEffect(BuffType.Rage));
registerEffect('apply_charge', new ApplyBuffEffect(BuffType.Charge));
registerEffect('apply_thorns', new ApplyBuffEffect(BuffType.Thorns));
registerEffect('apply_regeneration', new ApplyBuffEffect(BuffType.Regeneration));
registerEffect('apply_ritual', new ApplyBuffEffect(BuffType.Ritual));
registerEffect('apply_barricade', new ApplyBuffEffect(BuffType.Barricade));
registerEffect('apply_metallicize', new ApplyBuffEffect(BuffType.Metallicize));
registerEffect('apply_plated_armor', new ApplyBuffEffect(BuffType.PlatedArmor));
registerEffect('apply_artifact', new ApplyBuffEffect(BuffType.Artifact));
registerEffect('apply_intangible', new ApplyBuffEffect(BuffType.Intangible));

// Debuff effects (single target)
registerEffect('apply_vulnerable', new ApplyDebuffEffect(BuffType.Vulnerable));
registerEffect('apply_weak', new ApplyDebuffEffect(BuffType.Weak));
registerEffect('apply_poison', new ApplyDebuffEffect(BuffType.Poison));
registerEffect('apply_frail', new ApplyDebuffEffect(BuffType.Frail));

// Debuff effects (ALL enemies)
registerEffect('apply_vulnerable_all', new ApplyDebuffAllEffect(BuffType.Vulnerable));
registerEffect('apply_weak_all', new ApplyDebuffAllEffect(BuffType.Weak));
registerEffect('apply_poison_all', new ApplyDebuffAllEffect(BuffType.Poison));
registerEffect('apply_frail_all', new ApplyDebuffAllEffect(BuffType.Frail));

export { effectRegistry };
