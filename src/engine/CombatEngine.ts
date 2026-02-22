import { CombatState, createCombatState } from './CombatState';
import { CardInstance } from '../models/Card';
import { EnemyInstance, getEnemyCurrentIntent, advanceEnemyIntent } from '../models/Enemy';
import { RuneInstance } from '../models/Rune';
import { Buff } from '../models/Buff';
import { BuffType, IntentType, CardType } from '../models/Enums';
import { getEffect } from './effects/EffectRegistry';
import { getBuffStacks, addBuff, tickDebuffs, hasBuff } from './BuffUtils';
import { SeededRandom } from './SeededRandom';

export interface CombatResult {
  playerWon: boolean;
  playerHp: number;
  goldEarned: number;
  cardsPlayed: number;
  damageDealt: number;
}

export type CombatEventType =
  | 'combat_start'
  | 'turn_start'
  | 'card_played'
  | 'card_drawn'
  | 'enemy_action'
  | 'enemy_died'
  | 'player_damaged'
  | 'player_healed'
  | 'player_blocked'
  | 'enemy_damaged'
  | 'buff_applied'
  | 'turn_end'
  | 'combat_end'
  | 'shuffle';

export interface CombatEvent {
  type: CombatEventType;
  data?: Record<string, unknown>;
}

type EventListener = (event: CombatEvent) => void;

export class CombatEngine {
  private state!: CombatState;
  private rng!: SeededRandom;
  private listeners: EventListener[] = [];
  private totalDamageDealt: number = 0;
  private totalCardsPlayed: number = 0;

  addEventListener(listener: EventListener): void {
    this.listeners.push(listener);
  }

  removeEventListener(listener: EventListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private emit(event: CombatEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  startCombat(
    playerHp: number,
    playerMaxHp: number,
    playerMaxEnergy: number,
    deck: CardInstance[],
    enemies: EnemyInstance[],
    runes: RuneInstance[],
    playerBuffs: Buff[],
    seed: number
  ): void {
    this.rng = new SeededRandom(seed);
    this.state = createCombatState(playerHp, playerMaxHp, playerMaxEnergy, deck, enemies, runes, playerBuffs);
    this.totalDamageDealt = 0;
    this.totalCardsPlayed = 0;

    // Shuffle draw pile
    this.rng.shuffle(this.state.drawPile);

    // Apply rune start-of-combat effects
    this.applyRuneEffects('combat_start');

    this.emit({ type: 'combat_start' });

    // Draw initial hand
    this.drawCards(5);

    this.emit({ type: 'turn_start', data: { turn: this.state.turn } });
  }

  getState(): CombatState {
    return this.state;
  }

  canPlayCard(instanceId: string): boolean {
    if (!this.state.isPlayerTurn || this.state.combatOver) return false;

    const card = this.state.hand.find(c => c.instanceId === instanceId);
    if (!card) return false;

    // Check energy
    if (card.data.energyCost > this.state.playerEnergy) return false;

    // Check if card is unplayable (Curse type)
    if (card.data.type === CardType.Curse) return false;

    // Check Entangle — can't play attacks
    if (card.data.type === CardType.Attack && hasBuff(this.state.playerBuffs, BuffType.Entangle)) return false;

    return true;
  }

  playCard(instanceId: string, targetIndex: number = 0): boolean {
    if (!this.canPlayCard(instanceId)) return false;

    const cardIndex = this.state.hand.findIndex(c => c.instanceId === instanceId);
    if (cardIndex === -1) return false;

    const card = this.state.hand[cardIndex];

    // Spend energy
    this.state.playerEnergy -= card.data.energyCost;

    // Remove from hand
    this.state.hand.splice(cardIndex, 1);

    // Execute primary effect
    const primaryEffect = getEffect(card.data.effectId);
    if (primaryEffect) {
      primaryEffect.execute(this.state, card.data.effectValue, targetIndex);
    }

    // Execute secondary effect
    if (card.data.secondaryEffectId) {
      const secondaryEffect = getEffect(card.data.secondaryEffectId);
      if (secondaryEffect) {
        secondaryEffect.execute(this.state, card.data.secondaryEffectValue ?? 0, targetIndex);
      }
    }

    this.state.cardsPlayedThisTurn++;
    this.totalCardsPlayed++;

    // Track damage
    this.trackDamageDealt();

    // Rage mechanic: gain block when playing attacks
    if (card.data.type === CardType.Attack) {
      const rageStacks = getBuffStacks(this.state.playerBuffs, BuffType.Rage);
      if (rageStacks > 0) {
        this.state.playerBlock += rageStacks;
        this.state.combatLog.push(`Rage: gained ${rageStacks} Block`);
      }
    }

    // Charge mechanic: gain charge when playing certain cards
    if (card.data.secondaryEffectId === 'apply_charge') {
      // Already handled by effect
    }

    this.emit({
      type: 'card_played',
      data: { card: card.data, instanceId: card.instanceId }
    });

    // Power cards are exhausted after play
    if (card.data.type === CardType.Power) {
      this.state.exhaustPile.push(card);
    } else if (card.data.secondaryEffectId === 'exhaust') {
      this.state.exhaustPile.push(card);
    } else {
      this.state.discardPile.push(card);
    }

    // Check for enemy deaths
    this.checkEnemyDeaths();

    // Check win condition
    if (this.state.enemies.every(e => e.currentHp <= 0)) {
      this.endCombat(true);
    }

    return true;
  }

  endTurn(): void {
    if (!this.state.isPlayerTurn || this.state.combatOver) return;

    this.state.isPlayerTurn = false;

    // Discard remaining hand
    while (this.state.hand.length > 0) {
      const card = this.state.hand.pop()!;
      this.state.discardPile.push(card);
    }

    // Player end-of-turn effects
    this.processPlayerEndOfTurn();

    // Enemy turn
    this.processEnemyTurn();

    // Check if player died
    if (this.state.playerHp <= 0) {
      this.endCombat(false);
      return;
    }

    // Start new turn
    this.state.turn++;
    this.state.isPlayerTurn = true;
    this.state.cardsPlayedThisTurn = 0;

    // Reset block (unless Barricade)
    if (!hasBuff(this.state.playerBuffs, BuffType.Barricade)) {
      this.state.playerBlock = 0;
    }

    // Restore energy
    this.state.playerEnergy = this.state.playerMaxEnergy;

    // Apply rune start-of-turn effects
    this.applyRuneEffects('turn_start');

    // Tick player debuffs
    this.state.playerBuffs = tickDebuffs(this.state.playerBuffs);

    // Draw new hand (skip if NoDraw debuff)
    if (!hasBuff(this.state.playerBuffs, BuffType.NoDraw)) {
      let drawCount = 5;
      const drawReduction = getBuffStacks(this.state.playerBuffs, BuffType.DrawReduction);
      drawCount -= drawReduction;
      if (drawCount < 0) drawCount = 0;

      // Inkwell rune: draw 1 extra
      if (this.hasRune('rune_inkwell')) {
        drawCount++;
      }

      this.drawCards(drawCount);
    } else {
      this.state.combatLog.push('Cannot draw cards this turn (NoDraw)');
    }

    this.emit({ type: 'turn_start', data: { turn: this.state.turn } });
  }

  private drawCards(count: number): void {
    for (let i = 0; i < count; i++) {
      if (this.state.drawPile.length === 0) {
        if (this.state.discardPile.length === 0) return;
        this.state.drawPile = [...this.state.discardPile];
        this.state.discardPile = [];
        this.rng.shuffle(this.state.drawPile);
        this.emit({ type: 'shuffle' });
      }
      const card = this.state.drawPile.pop()!;
      this.state.hand.push(card);
      this.emit({ type: 'card_drawn', data: { card: card.data } });
    }
  }

  private processPlayerEndOfTurn(): void {
    // Metallicize
    const metallicize = getBuffStacks(this.state.playerBuffs, BuffType.Metallicize);
    if (metallicize > 0) {
      this.state.playerBlock += metallicize;
      this.state.combatLog.push(`Metallicize: gained ${metallicize} Block`);
    }

    // Plated Armor
    const platedArmor = getBuffStacks(this.state.playerBuffs, BuffType.PlatedArmor);
    if (platedArmor > 0) {
      this.state.playerBlock += platedArmor;
      this.state.combatLog.push(`Plated Armor: gained ${platedArmor} Block`);
    }

    // Regeneration
    const regen = getBuffStacks(this.state.playerBuffs, BuffType.Regeneration);
    if (regen > 0) {
      const oldHp = this.state.playerHp;
      this.state.playerHp = Math.min(this.state.playerHp + regen, this.state.playerMaxHp);
      this.state.combatLog.push(`Regeneration: healed ${this.state.playerHp - oldHp} HP`);
    }

    // Ritual: gain strength
    const ritual = getBuffStacks(this.state.playerBuffs, BuffType.Ritual);
    if (ritual > 0) {
      addBuff(this.state.playerBuffs, BuffType.Strength, ritual);
      this.state.combatLog.push(`Ritual: gained ${ritual} Strength`);
    }

    this.emit({ type: 'turn_end', data: { turn: this.state.turn } });
  }

  private processEnemyTurn(): void {
    for (const enemy of this.state.enemies) {
      if (enemy.currentHp <= 0) continue;

      // Reset enemy block
      enemy.block = 0;

      // Process enemy passives
      this.processEnemyPassives(enemy);

      // Get and execute intent
      const intent = getEnemyCurrentIntent(enemy);

      switch (intent.type) {
        case IntentType.Attack:
          this.enemyAttack(enemy, intent.value);
          break;
        case IntentType.Defend:
          enemy.block += intent.value;
          this.state.combatLog.push(`${enemy.data.enemyName} gains ${intent.value} Block`);
          break;
        case IntentType.Buff:
          addBuff(enemy.buffs, BuffType.Strength, intent.value);
          this.state.combatLog.push(`${enemy.data.enemyName} gains ${intent.value} Strength`);
          break;
        case IntentType.Debuff:
          this.applyDebuffToPlayer(BuffType.Weak, intent.value);
          this.state.combatLog.push(`${enemy.data.enemyName} applies ${intent.value} Weak`);
          break;
        case IntentType.AttackDefend:
          this.enemyAttack(enemy, intent.value);
          enemy.block += intent.secondaryValue ?? 0;
          break;
        case IntentType.Special:
          // Handled per-enemy by passives
          this.enemyAttack(enemy, intent.value);
          break;
      }

      this.emit({ type: 'enemy_action', data: { enemy: enemy.data, intent } });

      // Advance to next intent
      advanceEnemyIntent(enemy);

      // Tick enemy debuffs
      // Poison: deal damage, then reduce by 1
      const poisonStacks = getBuffStacks(enemy.buffs, BuffType.Poison);
      if (poisonStacks > 0) {
        enemy.currentHp -= poisonStacks;
        this.state.combatLog.push(`Poison deals ${poisonStacks} damage to ${enemy.data.enemyName}`);
        const poisonBuff = enemy.buffs.find(b => b.type === BuffType.Poison);
        if (poisonBuff) {
          poisonBuff.stacks--;
          if (poisonBuff.stacks <= 0) {
            enemy.buffs = enemy.buffs.filter(b => b.type !== BuffType.Poison);
          }
        }
      }

      enemy.buffs = tickDebuffs(enemy.buffs);
    }

    // Check for enemy deaths from poison
    this.checkEnemyDeaths();

    if (this.state.enemies.every(e => e.currentHp <= 0)) {
      this.endCombat(true);
    }
  }

  private enemyAttack(enemy: EnemyInstance, baseDamage: number): void {
    let damage = baseDamage;

    // Apply enemy Strength
    damage += getBuffStacks(enemy.buffs, BuffType.Strength);

    // Apply Weak on enemy
    if (hasBuff(enemy.buffs, BuffType.Weak)) {
      damage = Math.floor(damage * 0.75);
    }

    // Apply Vulnerable on player
    if (hasBuff(this.state.playerBuffs, BuffType.Vulnerable)) {
      damage = Math.floor(damage * 1.5);
    }

    if (damage < 0) damage = 0;

    // Intangible: reduce ALL incoming damage to 1 (before block)
    if (hasBuff(this.state.playerBuffs, BuffType.Intangible) && damage > 1) {
      damage = 1;
    }

    // Apply to player block first
    const blocked = Math.min(this.state.playerBlock, damage);
    this.state.playerBlock -= blocked;
    let remainingDamage = damage - blocked;

    if (remainingDamage > 0) {
      this.state.playerHp -= remainingDamage;
      if (this.state.playerHp < 0) this.state.playerHp = 0;

      // Soul Anchor rune: survive killing blow
      if (this.state.playerHp <= 0 && this.hasRune('rune_soul_anchor')) {
        this.state.playerHp = 1;
        this.removeRune('rune_soul_anchor');
        this.state.combatLog.push('Soul Anchor saved you from death!');
      }

      // Plated Armor: reduce by 1 when hit unblocked
      const platedBuff = this.state.playerBuffs.find(b => b.type === BuffType.PlatedArmor);
      if (platedBuff) {
        platedBuff.stacks--;
        if (platedBuff.stacks <= 0) {
          this.state.playerBuffs = this.state.playerBuffs.filter(b => b.type !== BuffType.PlatedArmor);
        }
      }

      // Rage mechanic (Ironclad): gain attack when taking damage
      // Handled as Rage buff — gain block, not attack
      // The actual Ironclad rage mechanic adds block on attack play, already handled

      this.emit({ type: 'player_damaged', data: { damage: remainingDamage, blocked, source: enemy.data.enemyName } });
    }

    if (blocked > 0) {
      this.emit({ type: 'player_blocked', data: { blocked } });
    }

    // Thorns: deal damage back to attacker
    const thorns = getBuffStacks(this.state.playerBuffs, BuffType.Thorns);
    if (thorns > 0) {
      enemy.currentHp -= thorns;
      this.state.combatLog.push(`Thorns deals ${thorns} damage to ${enemy.data.enemyName}`);
    }

    // Thorn Ring rune
    if (this.hasRune('rune_thorn_ring') && remainingDamage > 0) {
      enemy.currentHp -= 2;
      this.state.combatLog.push(`Thorn Ring deals 2 damage to ${enemy.data.enemyName}`);
    }

    this.state.combatLog.push(
      `${enemy.data.enemyName} attacks for ${damage} (${blocked} blocked, ${remainingDamage} to HP)`
    );
  }

  private applyDebuffToPlayer(type: BuffType, stacks: number): void {
    // Check Artifact
    const artifactStacks = getBuffStacks(this.state.playerBuffs, BuffType.Artifact);
    if (artifactStacks > 0) {
      const buff = this.state.playerBuffs.find(b => b.type === BuffType.Artifact);
      if (buff) {
        buff.stacks--;
        if (buff.stacks <= 0) {
          this.state.playerBuffs = this.state.playerBuffs.filter(b => b.type !== BuffType.Artifact);
        }
      }
      this.state.combatLog.push(`Artifact negated ${type}`);
      return;
    }
    addBuff(this.state.playerBuffs, type, stacks);
  }

  private processEnemyPassives(enemy: EnemyInstance): void {
    for (const passive of enemy.data.passives) {
      switch (passive.effectId) {
        case 'gain_strength_per_turn':
          addBuff(enemy.buffs, BuffType.Strength, passive.effectValue);
          this.state.combatLog.push(`${enemy.data.enemyName}: ${passive.name} — gained ${passive.effectValue} Strength`);
          break;
        case 'gain_block_per_turn':
          enemy.block += passive.effectValue;
          this.state.combatLog.push(`${enemy.data.enemyName}: ${passive.name} — gained ${passive.effectValue} Block`);
          break;
        case 'heal_per_turn':
          const healed = Math.min(passive.effectValue, enemy.data.maxHp - enemy.currentHp);
          enemy.currentHp += healed;
          if (healed > 0) {
            this.state.combatLog.push(`${enemy.data.enemyName}: ${passive.name} — healed ${healed} HP`);
          }
          break;
      }
    }
  }

  private checkEnemyDeaths(): void {
    for (const enemy of this.state.enemies) {
      if (enemy.currentHp <= 0 && enemy.currentHp !== -999) {
        enemy.currentHp = -999; // Mark as dead (prevent double-processing)
        this.emit({ type: 'enemy_died', data: { enemy: enemy.data } });
        this.state.combatLog.push(`${enemy.data.enemyName} was defeated!`);
      }
    }
  }

  private applyRuneEffects(trigger: string): void {
    for (const rune of this.state.runes) {
      switch (rune.data.runeId) {
        case 'rune_burning_candle':
          if (trigger === 'combat_start') {
            this.state.playerEnergy++;
            this.state.combatLog.push('Burning Candle: +1 Energy this turn');
          }
          break;
        case 'rune_inkwell':
          // Handled in drawCards logic
          break;
        case 'rune_thorn_ring':
          // Handled in enemyAttack
          break;
        case 'rune_soul_anchor':
          // Handled in enemyAttack
          break;
        case 'rune_iron_heart':
          if (trigger === 'combat_start') {
            this.state.playerBlock += 5;
            this.state.combatLog.push('Iron Heart: +5 Block at start of combat');
          }
          break;
        case 'rune_blood_vial':
          if (trigger === 'combat_start') {
            this.state.playerHp = Math.min(this.state.playerHp + 3, this.state.playerMaxHp);
            this.state.combatLog.push('Blood Vial: healed 3 HP');
          }
          break;
        case 'rune_war_paint':
          if (trigger === 'combat_start') {
            addBuff(this.state.playerBuffs, BuffType.Strength, 1);
            this.state.combatLog.push('War Paint: +1 Strength');
          }
          break;
      }
    }
  }

  private hasRune(runeId: string): boolean {
    return this.state.runes.some(r => r.data.runeId === runeId);
  }

  private removeRune(runeId: string): void {
    const idx = this.state.runes.findIndex(r => r.data.runeId === runeId);
    if (idx !== -1) {
      this.state.runes.splice(idx, 1);
    }
  }

  private trackDamageDealt(): void {
    // Sum up total damage dealt based on enemy HP changes
    let totalEnemyDamage = 0;
    for (const enemy of this.state.enemies) {
      totalEnemyDamage += enemy.data.maxHp - Math.max(enemy.currentHp, 0);
    }
    this.totalDamageDealt = totalEnemyDamage;
  }

  private endCombat(playerWon: boolean): void {
    this.state.combatOver = true;
    this.state.playerWon = playerWon;
    this.emit({
      type: 'combat_end',
      data: { playerWon, playerHp: this.state.playerHp }
    });
  }

  getCombatResult(): CombatResult {
    return {
      playerWon: this.state.playerWon,
      playerHp: this.state.playerHp,
      goldEarned: this.state.playerWon ? 15 + this.rng.nextInt(0, 9) : 0,
      cardsPlayed: this.totalCardsPlayed,
      damageDealt: this.totalDamageDealt,
    };
  }
}
