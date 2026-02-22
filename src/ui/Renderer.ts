import { GameManager } from '../game/GameManager';
import { GameScreen, CardType, BuffType, IntentType, FloorType } from '../models/Enums';
import { CardInstance, CardData } from '../models/Card';
import { EnemyInstance, getEnemyCurrentIntent } from '../models/Enemy';
import { CombatState } from '../engine/CombatState';
import { RunManager } from '../game/RunManager';
import { isDebuff, getBuffName } from '../models/Buff';
import { Buff } from '../models/Buff';
import { escapeHtml } from './sanitize';

// Helper: sanitize all data-driven strings for safe innerHTML usage
const h = escapeHtml;

const CARD_ICONS: Record<string, string> = {
  'Strike': '\u2694',
  'Defend': '\u{1F6E1}',
  'Bash': '\u{1F4A5}',
  'Iron Will': '\u{1F6E1}',
  'Cleave': '\u{1FA93}',
  'Iron Wave': '\u{1F30A}',
  'Pommel Strike': '\u{1F44A}',
  'Shrug It Off': '\u{1F4AA}',
  'Anger': '\u{1F525}',
  'Body Slam': '\u{1F4A2}',
  'Clash': '\u26A1',
  'Flex': '\u{1F4AA}',
  'Heavy Blade': '\u2694',
  'Thunderclap': '\u26A1',
  'Battle Trance': '\u{1F9D8}',
  'Carnage': '\u{1F480}',
  'Demon Form': '\u{1F608}',
  'Bludgeon': '\u{1F528}',
  'Barricade': '\u{1F3F0}',
  'Impervious': '\u{1F6E1}',
  'Reaper': '\u{1F480}',
  'Arcane Spark': '\u2728',
  'Zap': '\u26A1',
  'Channel': '\u{1F52E}',
  'Chain Lightning': '\u26A1',
  'Mana Surge': '\u{1F4AB}',
  'Ultimate Hex': '\u{1F52E}',
  'Envenom': '\u{1F40D}',
  'Deadly Poison': '\u2620',
  'Slice': '\u{1F5E1}',
  'Dodge Roll': '\u{1F3C3}',
  'Noxious Fumes': '\u2620',
  'Wraith Form': '\u{1F47B}',
  'Grand Finale': '\u{1F387}',
  'Wound': '\u274C',
  'Decay': '\u{1F480}',
};

const ENEMY_ICONS: Record<string, string> = {
  'Small Slime': '\u{1F7E2}',
  'Cultist': '\u{1F9D9}',
  'Jaw Worm': '\u{1F40D}',
  'Red Louse': '\u{1F41E}',
  'Green Louse': '\u{1F41B}',
  'Fungi Beast': '\u{1F344}',
  'Gremlin Nob': '\u{1F479}',
  'Lagavulin': '\u{1F47A}',
  'Chosen': '\u{1F9DD}',
  'Byrd': '\u{1F426}',
  'Snecko': '\u{1F40D}',
  'Shelled Parasite': '\u{1F41A}',
  'Book of Stabbing': '\u{1F4D6}',
  'Gremlin Leader': '\u{1F451}',
  'Darkling': '\u{1F47E}',
  'Orb Walker': '\u{1F916}',
  'Spiker': '\u{1F994}',
  'Giant Head': '\u{1F5FF}',
  'Nemesis': '\u2620',
  'Slime King': '\u{1F451}',
  'Bronze Automaton': '\u{1F916}',
  'The Corrupted Heart': '\u{1F5A4}',
};

const BUFF_SHORT: Record<string, string> = {
  [BuffType.Strength]: 'STR',
  [BuffType.Dexterity]: 'DEX',
  [BuffType.Vulnerable]: 'VUL',
  [BuffType.Weak]: 'WK',
  [BuffType.Poison]: 'PSN',
  [BuffType.Rage]: 'RGE',
  [BuffType.Charge]: 'CHG',
  [BuffType.Thorns]: 'THN',
  [BuffType.Regeneration]: 'RGN',
  [BuffType.Ritual]: 'RIT',
  [BuffType.Barricade]: 'BAR',
  [BuffType.Metallicize]: 'MTL',
  [BuffType.PlatedArmor]: 'PLT',
  [BuffType.Artifact]: 'ART',
  [BuffType.Intangible]: 'INT',
  [BuffType.Frail]: 'FRL',
  [BuffType.DrawReduction]: 'DR',
  [BuffType.Entangle]: 'ENT',
  [BuffType.NoDraw]: 'ND',
};

export class Renderer {
  private root: HTMLElement;
  private gameManager: GameManager;
  private dragState: {
    card: CardInstance | null;
    element: HTMLElement | null;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isDragging: boolean;
  } = { card: null, element: null, startX: 0, startY: 0, currentX: 0, currentY: 0, isDragging: false };
  private cardPreviewVisible: boolean = false;
  private deckViewVisible: boolean = false;
  private deckViewContext: 'deck' | 'upgrade' | 'remove' = 'deck';
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundMouseUp: (() => void) | null = null;

  constructor(root: HTMLElement, gameManager: GameManager) {
    this.root = root;
    this.gameManager = gameManager;

    this.gameManager.setScreenChangeListener(() => {
      this.render();
    });
  }

  render(): void {
    const screen = this.gameManager.currentScreen;

    switch (screen) {
      case GameScreen.MainMenu:
        this.renderMainMenu();
        break;
      case GameScreen.CharacterSelect:
        this.renderCharacterSelect();
        break;
      case GameScreen.Map:
        this.renderMap();
        break;
      case GameScreen.Combat:
        this.renderCombat();
        break;
      case GameScreen.Draft:
        this.renderDraft();
        break;
      case GameScreen.Reward:
        this.renderReward();
        break;
      case GameScreen.Rest:
        this.renderRest();
        break;
      case GameScreen.Shop:
        this.renderShop();
        break;
      case GameScreen.Event:
        this.renderEvent();
        break;
      case GameScreen.Treasure:
        this.renderTreasure();
        break;
      case GameScreen.Vault:
        this.renderVault();
        break;
      case GameScreen.RunEnd:
        this.renderRunEnd();
        break;
    }
  }

  private renderMainMenu(): void {
    const meta = this.gameManager.metaManager;
    this.root.innerHTML = `
      <div class="main-menu">
        <div class="game-title">RUNEDECK</div>
        <div class="game-subtitle">Roguelite Deckbuilder</div>
        <button class="menu-btn primary" id="btn-new-run">New Run</button>
        <button class="menu-btn" id="btn-daily-run">Daily Run</button>
        <button class="menu-btn" id="btn-vault">Vault</button>
        <div class="menu-stats">
          <div>Runs Completed: ${meta.state.totalRunsCompleted}</div>
          <div>High Score: ${meta.state.highScore} floors</div>
          <div>Shards: ${meta.state.totalShards}</div>
        </div>
      </div>
    `;

    this.root.querySelector('#btn-new-run')!.addEventListener('click', () => {
      this.gameManager.changeScreen(GameScreen.CharacterSelect);
    });

    this.root.querySelector('#btn-daily-run')!.addEventListener('click', () => {
      this.gameManager.startDailyRun(this.getUnlockedClass());
    });

    this.root.querySelector('#btn-vault')!.addEventListener('click', () => {
      this.gameManager.changeScreen(GameScreen.Vault);
    });
  }

  private getUnlockedClass(): any {
    // Default to Ironclad
    return 'Ironclad';
  }

  private renderCharacterSelect(): void {
    const meta = this.gameManager.metaManager;

    const characters = [
      {
        id: 'Ironclad',
        name: 'Ironclad',
        mechanic: 'Rage — gains block when playing attacks',
        desc: 'Tank/control — block and counter. A sturdy warrior that thrives on taking hits and striking back.',
        locked: false,
        unlockInfo: '',
      },
      {
        id: 'Hexblade',
        name: 'Hexblade',
        mechanic: 'Charge — build and spend for bonus effects',
        desc: 'Combo/burst — chain spells for big turns. A mage that channels arcane energy into devastating combos.',
        locked: !meta.isCharacterUnlocked('Hexblade' as any),
        unlockInfo: 'Complete 5 runs with Ironclad or unlock in Vault',
      },
      {
        id: 'Shadowstep',
        name: 'Shadowstep',
        mechanic: 'Toxin — poison stacks deal damage each turn',
        desc: 'Poison/tempo — apply debuffs and outlast. A rogue that weakens foes with toxins and strikes from the shadows.',
        locked: !meta.isCharacterUnlocked('Shadowstep' as any),
        unlockInfo: 'Complete 5 runs with Hexblade or unlock in Vault',
      },
    ];

    this.root.innerHTML = `
      <div class="character-select">
        <button class="icon-btn" id="btn-back" style="align-self:flex-start;margin-bottom:8px;">\u2190</button>
        <h2>Choose Your Class</h2>
        <div class="character-list">
          ${characters.map(c => `
            <div class="character-card ${c.locked ? 'locked' : ''}" data-class="${c.id}">
              <h3>${c.name}</h3>
              <div class="class-mechanic">${c.mechanic}</div>
              <div class="class-desc">${c.desc}</div>
              ${c.locked ? `<div class="unlock-info">${c.unlockInfo}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.root.querySelector('#btn-back')!.addEventListener('click', () => {
      this.gameManager.changeScreen(GameScreen.MainMenu);
    });

    this.root.querySelectorAll('.character-card:not(.locked)').forEach(card => {
      card.addEventListener('click', () => {
        const cls = (card as HTMLElement).dataset.class as any;
        this.gameManager.startNewRun(cls);
      });
    });
  }

  private renderMap(): void {
    const run = this.gameManager.runManager;
    if (!run) return;

    const nextFloorIndex = run.currentFloorIndex + 1;
    const nextFloor = nextFloorIndex < run.dungeonFloors.length
      ? run.dungeonFloors[nextFloorIndex]
      : null;

    const floorTypeNames: Record<string, string> = {
      CombatNormal: 'Combat',
      CombatElite: 'Elite Combat',
      RestNode: 'Rest',
      Shop: 'Shop',
      Event: 'Event',
      Treasure: 'Treasure',
      Boss: 'BOSS',
    };

    const floorTypeIcons: Record<string, string> = {
      CombatNormal: '\u2694',
      CombatElite: '\u{1F480}',
      RestNode: '\u{1F525}',
      Shop: '\u{1F6D2}',
      Event: '\u2753',
      Treasure: '\u{1F4E6}',
      Boss: '\u{1F451}',
    };

    this.root.innerHTML = `
      <div class="map-screen">
        ${this.renderTopBar(run)}
        ${this.renderPlayerStatus(run)}
        <div class="map-content">
          ${nextFloor ? `
            <div class="floor-preview">
              <div class="floor-icon">${floorTypeIcons[nextFloor.type] || '\u2694'}</div>
              <h3>Floor ${nextFloor.floorNumber}</h3>
              <div class="floor-type">Act ${nextFloor.act} — ${floorTypeNames[nextFloor.type] || nextFloor.type}</div>
            </div>
            <button class="proceed-btn" id="btn-proceed">Proceed</button>
          ` : `
            <div class="floor-preview">
              <div class="floor-icon">\u{1F3C6}</div>
              <h3>Victory!</h3>
              <div class="floor-type">You have conquered the dungeon!</div>
            </div>
            <button class="proceed-btn" id="btn-proceed">Continue</button>
          `}
          <button class="skip-btn" id="btn-view-deck">View Deck (${run.state.deck.length})</button>
        </div>
        ${this.renderRuneSlots(run)}
      </div>
    `;

    this.root.querySelector('#btn-proceed')!.addEventListener('click', () => {
      if (nextFloor) {
        this.gameManager.advanceFloor();
      } else {
        this.gameManager.handleRunEnd(true);
      }
    });

    this.root.querySelector('#btn-view-deck')!.addEventListener('click', () => {
      this.showDeckView(run, 'deck');
    });

    this.attachSettingsListeners(run);
  }

  private renderCombat(): void {
    const run = this.gameManager.runManager;
    if (!run) return;

    const state = run.combatEngine.getState();

    this.root.innerHTML = `
      <div class="screen combat-screen">
        ${this.renderTopBar(run)}
        <div class="enemy-area" id="enemy-area">
          <div class="play-zone" id="play-zone"></div>
          <div class="enemies-row">
            ${state.enemies.map((enemy, i) => this.renderEnemy(enemy, i)).join('')}
          </div>
        </div>
        <div class="game-info-bar">
          <div class="energy-display">
            <div class="energy-orb">${state.playerEnergy}</div>
            <span>/${state.playerMaxEnergy}</span>
          </div>
          ${state.playerBlock > 0 ? `<div class="block-display">\u{1F6E1} ${state.playerBlock}</div>` : ''}
          <div style="display:flex;gap:12px;">
            <div class="deck-count" id="btn-draw-pile">Draw: ${state.drawPile.length}</div>
            <div class="discard-count">Disc: ${state.discardPile.length}</div>
          </div>
        </div>
        ${this.renderPlayerStatusCombat(state, run)}
        <div class="hand-area" id="hand-area">
          <div class="hand-cards" id="hand-cards">
            ${state.hand.map((card, i) => this.renderCard(card, state, i)).join('')}
          </div>
        </div>
        <div class="end-turn-area">
          <button class="end-turn-btn" id="btn-end-turn"${!state.isPlayerTurn || state.combatOver ? ' disabled' : ''}>
            ${state.combatOver ? (state.playerWon ? 'VICTORY' : 'DEFEAT') : 'END TURN'}
          </button>
        </div>
      </div>
    `;

    // Card preview overlay
    const previewEl = document.createElement('div');
    previewEl.className = 'card-preview-overlay hidden';
    previewEl.id = 'card-preview-overlay';
    this.root.appendChild(previewEl);

    if (state.combatOver) {
      const btn = this.root.querySelector('#btn-end-turn') as HTMLButtonElement;
      btn.disabled = false;
      btn.textContent = state.playerWon ? 'COLLECT REWARDS' : 'CONTINUE';
      btn.addEventListener('click', () => {
        this.gameManager.handleCombatEnd();
      });
    } else {
      this.root.querySelector('#btn-end-turn')!.addEventListener('click', () => {
        if (state.isPlayerTurn && !state.combatOver) {
          run.endTurn();
          const newState = run.combatEngine.getState();
          if (newState.combatOver) {
            this.render();
          } else {
            this.renderCombat();
          }
        }
      });
    }

    // Attach card drag handlers
    this.attachCardDragHandlers(run, state);

    this.attachSettingsListeners(run);
  }

  private renderCard(card: CardInstance, state: CombatState, index: number): string {
    const canPlay = this.gameManager.runManager?.combatEngine.canPlayCard(card.instanceId) ?? false;
    const typeClass = card.data.type.toLowerCase();
    const icon = CARD_ICONS[card.data.cardName.replace('+', '')] || '\u2728';
    const rarityClass = card.data.rarity.toLowerCase();

    return `
      <div class="card ${typeClass} ${canPlay ? 'playable' : 'unplayable'}"
           data-instance-id="${card.instanceId}"
           data-index="${index}"
           id="card-${card.instanceId}">
        <div class="card-header">
          <div class="card-name">${h(card.data.cardName)}</div>
          <div class="card-cost">${card.data.energyCost >= 0 ? card.data.energyCost : 'X'}</div>
        </div>
        <div class="card-art">${icon}</div>
        <div class="card-desc">${h(card.data.description)}</div>
        <div class="card-type">${h(card.data.type)}</div>
        <div class="card-rarity ${rarityClass}"></div>
      </div>
    `;
  }

  private renderDraftCard(card: CardData, index: number): string {
    const typeClass = card.type.toLowerCase();
    const icon = CARD_ICONS[card.cardName.replace('+', '')] || '\u2728';
    const rarityClass = card.rarity.toLowerCase();

    return `
      <div class="draft-card ${typeClass}" data-index="${index}">
        <div class="card-header">
          <div class="card-name">${h(card.cardName)}</div>
          <div class="card-cost">${card.energyCost >= 0 ? card.energyCost : 'X'}</div>
        </div>
        <div class="card-art">${icon}</div>
        <div class="card-desc">${h(card.description)}</div>
        <div class="card-type">${h(card.type)}</div>
        <div class="card-rarity ${rarityClass}"></div>
      </div>
    `;
  }

  private renderEnemy(enemy: EnemyInstance, index: number): string {
    if (enemy.currentHp <= 0) {
      return `<div class="enemy-container enemy-dead">
        <div class="enemy-sprite normal">\u{1F480}</div>
        <div class="enemy-name">${h(enemy.data.enemyName)}</div>
        <div class="enemy-hp-bar"><div class="enemy-hp-fill" style="width:0%"></div></div>
      </div>`;
    }

    const intent = getEnemyCurrentIntent(enemy);
    const intentClass = intent.type.toLowerCase().replace('attackdefend', 'attack');
    const hpPercent = (enemy.currentHp / enemy.maxHp) * 100;
    const tierClass = enemy.data.tier.toLowerCase();
    const icon = ENEMY_ICONS[enemy.data.enemyName] || '\u{1F47E}';

    return `
      <div class="enemy-container" data-enemy-index="${index}">
        <div class="enemy-intent ${intentClass}">${h(intent.description)}</div>
        <div class="enemy-sprite ${tierClass}">${icon}</div>
        <div class="enemy-name">${h(enemy.data.enemyName)}</div>
        <div class="enemy-hp-bar">
          <div class="enemy-hp-fill" style="width:${hpPercent}%"></div>
          <div class="enemy-hp-text">${enemy.currentHp}/${enemy.maxHp}</div>
        </div>
        ${enemy.block > 0 ? `<div class="enemy-block">\u{1F6E1} ${enemy.block}</div>` : ''}
        ${enemy.buffs.length > 0 ? `
          <div class="enemy-buffs">
            ${enemy.buffs.map(b => this.renderBuffIcon(b)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderBuffIcon(buff: Buff): string {
    const isNeg = isDebuff(buff.type);
    const short = BUFF_SHORT[buff.type] || buff.type.substring(0, 3).toUpperCase();
    const name = getBuffName(buff.type);
    return `
      <div class="buff-icon ${isNeg ? 'negative' : 'positive'}" title="${name}: ${buff.stacks}">
        ${short}
        <span class="buff-stack">${buff.stacks}</span>
      </div>
    `;
  }

  private renderTopBar(run: RunManager): string {
    const floor = run.getCurrentFloor();
    return `
      <div class="top-bar">
        <div class="top-bar-left">
          <div class="floor-indicator">
            <span>Act ${run.state.act}</span> Floor <span>${run.state.floor || 1}</span>
          </div>
        </div>
        <div class="top-bar-right">
          <div class="gold-display">${run.state.gold}g</div>
          <button class="icon-btn" id="btn-settings" title="Menu">\u2630</button>
        </div>
      </div>
    `;
  }

  private renderPlayerStatus(run: RunManager): string {
    const hpPercent = (run.state.currentHp / run.state.maxHp) * 100;
    return `
      <div class="player-status">
        <div class="hp-bar-container">
          <div class="hp-bar">
            <div class="hp-bar-fill" style="width:${hpPercent}%"></div>
            <div class="hp-bar-text">${run.state.currentHp}/${run.state.maxHp}</div>
          </div>
        </div>
        ${run.state.buffs.length > 0 ? `
          <div class="player-buffs">
            ${run.state.buffs.map(b => this.renderBuffIcon(b)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderPlayerStatusCombat(state: CombatState, run: RunManager): string {
    const hpPercent = (state.playerHp / state.playerMaxHp) * 100;
    return `
      <div class="player-status">
        <div class="hp-bar-container">
          <div class="hp-bar">
            <div class="hp-bar-fill" style="width:${hpPercent}%"></div>
            <div class="hp-bar-text">${state.playerHp}/${state.playerMaxHp}</div>
          </div>
        </div>
        ${state.playerBuffs.length > 0 ? `
          <div class="player-buffs">
            ${state.playerBuffs.map(b => this.renderBuffIcon(b)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderRuneSlots(run: RunManager): string {
    return `
      <div style="padding:4px 12px;background:var(--bg-secondary);border-top:1px solid var(--border-color);">
        <div class="rune-slots">
          ${Array.from({ length: run.state.maxRuneSlots }, (_, i) => {
            const rune = run.state.runes[i];
            if (rune) {
              return `<div class="rune-slot filled" title="${h(rune.data.runeName)}: ${h(rune.data.description)}">\u{1F48E}</div>`;
            }
            return `<div class="rune-slot">\u25CB</div>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  private renderDraft(): void {
    const run = this.gameManager.runManager;
    if (!run) return;

    this.root.innerHTML = `
      <div class="draft-screen">
        ${this.renderTopBar(run)}
        ${this.renderPlayerStatus(run)}
        <div class="draft-content">
          <div class="draft-title">Draft a Card</div>
          <div class="draft-subtitle">Choose 1 card to add to your deck</div>
          <div class="draft-cards">
            ${run.draftOptions.map((card, i) => this.renderDraftCard(card, i)).join('')}
          </div>
          <button class="skip-btn" id="btn-skip-draft">Skip</button>
        </div>
      </div>
    `;

    this.root.querySelectorAll('.draft-card').forEach(card => {
      card.addEventListener('click', () => {
        const index = parseInt((card as HTMLElement).dataset.index || '0');
        run.selectDraftCard(index);
        this.renderCombat();
      });
    });

    this.root.querySelector('#btn-skip-draft')!.addEventListener('click', () => {
      run.skipDraft();
      this.renderCombat();
    });

    this.attachSettingsListeners(run);
  }

  private renderReward(): void {
    const run = this.gameManager.runManager;
    if (!run) return;

    this.root.innerHTML = `
      <div class="reward-screen">
        ${this.renderTopBar(run)}
        <div class="reward-content">
          <div class="reward-title">Victory!</div>
          <div class="reward-gold">+${run.rewardGold} Gold</div>
          <div class="reward-section">
            <h4>Choose a card (optional)</h4>
            <div class="reward-cards">
              ${run.rewardCards.map((card, i) => this.renderDraftCard(card, i)).join('')}
            </div>
          </div>
          ${run.rewardRune ? `
            <div class="reward-section">
              <h4>Rune</h4>
              <div class="reward-rune" id="btn-take-rune">
                <div class="rune-name">${h(run.rewardRune.runeName)}</div>
                <div class="rune-desc">${h(run.rewardRune.description)}</div>
              </div>
            </div>
          ` : ''}
          <button class="proceed-btn" id="btn-proceed-reward" style="margin-top:16px;">Continue</button>
        </div>
      </div>
    `;

    this.root.querySelectorAll('.draft-card').forEach(card => {
      card.addEventListener('click', () => {
        const index = parseInt((card as HTMLElement).dataset.index || '0');
        run.selectRewardCard(index);
        (card as HTMLElement).style.border = '2px solid var(--accent-green)';
        this.root.querySelectorAll('.draft-card').forEach(c => {
          if (c !== card) (c as HTMLElement).style.opacity = '0.4';
        });
      });
    });

    const runeBtn = this.root.querySelector('#btn-take-rune');
    if (runeBtn) {
      runeBtn.addEventListener('click', () => {
        run.selectRewardRune();
        (runeBtn as HTMLElement).style.border = '2px solid var(--accent-green)';
        (runeBtn as HTMLElement).style.opacity = '0.6';
      });
    }

    this.root.querySelector('#btn-proceed-reward')!.addEventListener('click', () => {
      run.proceedAfterReward();
      this.gameManager.changeScreen(GameScreen.Map);
    });

    this.attachSettingsListeners(run);
  }

  private renderRest(): void {
    const run = this.gameManager.runManager;
    if (!run) return;

    const healAmount = Math.floor(run.state.maxHp * 0.3);

    this.root.innerHTML = `
      <div class="rest-screen">
        ${this.renderTopBar(run)}
        ${this.renderPlayerStatus(run)}
        <div class="rest-content">
          <div class="rest-title">Rest</div>
          <div class="rest-option" id="btn-rest-heal">
            <h4>Rest</h4>
            <p>Heal ${healAmount} HP (30% of max)</p>
          </div>
          <div class="rest-option" id="btn-rest-upgrade">
            <h4>Upgrade a Card</h4>
            <p>Improve one card's stats permanently</p>
          </div>
        </div>
      </div>
    `;

    this.root.querySelector('#btn-rest-heal')!.addEventListener('click', () => {
      run.restHeal();
      this.gameManager.changeScreen(GameScreen.Map);
    });

    this.root.querySelector('#btn-rest-upgrade')!.addEventListener('click', () => {
      this.showDeckView(run, 'upgrade');
    });

    this.attachSettingsListeners(run);
  }

  private renderShop(): void {
    const run = this.gameManager.runManager;
    if (!run) return;

    this.root.innerHTML = `
      <div class="shop-screen">
        ${this.renderTopBar(run)}
        <div class="shop-content">
          <div class="shop-title">Shop</div>
          <div class="shop-items">
            ${run.shopItems.map((item, i) => `
              <div class="shop-item ${item.sold ? 'sold' : ''} ${run.state.gold < item.cost ? 'unaffordable' : ''}" data-index="${i}">
                <div class="shop-item-info">
                  <h4>${item.type === 'card' ? h(item.card!.cardName) :
                        item.type === 'rune' ? h(item.rune!.runeName) :
                        'Remove a Card'}</h4>
                  <p>${item.type === 'card' ? h(item.card!.description) :
                       item.type === 'rune' ? h(item.rune!.description) :
                       'Remove one card from your deck'}</p>
                </div>
                <div class="shop-item-price">${item.sold ? 'SOLD' : `${item.cost}g`}</div>
              </div>
            `).join('')}
          </div>
          <button class="shop-leave-btn" id="btn-leave-shop">Leave Shop</button>
        </div>
      </div>
    `;

    this.root.querySelectorAll('.shop-item:not(.sold)').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt((item as HTMLElement).dataset.index || '0');
        const shopItem = run.shopItems[index];

        if (shopItem.type === 'remove_card' && !shopItem.sold && run.state.gold >= shopItem.cost) {
          this.showDeckView(run, 'remove');
          return;
        }

        if (run.buyShopItem(index)) {
          this.renderShop();
        }
      });
    });

    this.root.querySelector('#btn-leave-shop')!.addEventListener('click', () => {
      run.leaveShop();
      this.gameManager.changeScreen(GameScreen.Map);
    });

    this.attachSettingsListeners(run);
  }

  private renderEvent(): void {
    const run = this.gameManager.runManager;
    if (!run || !run.currentEvent) return;

    const event = run.currentEvent;

    this.root.innerHTML = `
      <div class="event-screen">
        ${this.renderTopBar(run)}
        ${this.renderPlayerStatus(run)}
        <div class="event-content">
          <div class="event-title">${h(event.title)}</div>
          <div class="event-description">${h(event.description)}</div>
          <div class="event-choices">
            ${event.choices.map((choice, i) => `
              <div class="event-choice" data-index="${i}">
                <h4>${h(choice.label)}</h4>
                <p>${h(choice.description)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.root.querySelectorAll('.event-choice').forEach(choice => {
      choice.addEventListener('click', () => {
        const index = parseInt((choice as HTMLElement).dataset.index || '0');
        run.selectEventChoice(index);
        if (run.currentPhase === 'game_over') {
          this.gameManager.handleRunEnd(false);
        } else {
          this.gameManager.changeScreen(GameScreen.Map);
        }
      });
    });

    this.attachSettingsListeners(run);
  }

  private renderTreasure(): void {
    const run = this.gameManager.runManager;
    if (!run) return;

    this.root.innerHTML = `
      <div class="treasure-screen">
        ${this.renderTopBar(run)}
        <div class="treasure-content">
          <div class="treasure-title">Treasure!</div>
          <div class="reward-section">
            <h4>Choose a card (optional)</h4>
            <div class="reward-cards">
              ${run.rewardCards.map((card, i) => this.renderDraftCard(card, i)).join('')}
            </div>
          </div>
          ${run.rewardRune ? `
            <div class="reward-section">
              <h4>Rune</h4>
              <div class="reward-rune" id="btn-take-rune">
                <div class="rune-name">${h(run.rewardRune.runeName)}</div>
                <div class="rune-desc">${h(run.rewardRune.description)}</div>
              </div>
            </div>
          ` : ''}
          <button class="proceed-btn" id="btn-leave-treasure" style="margin-top:16px;">Continue</button>
        </div>
      </div>
    `;

    this.root.querySelectorAll('.draft-card').forEach(card => {
      card.addEventListener('click', () => {
        const index = parseInt((card as HTMLElement).dataset.index || '0');
        run.collectTreasureCard(index);
        (card as HTMLElement).style.border = '2px solid var(--accent-green)';
        this.root.querySelectorAll('.draft-card').forEach(c => {
          if (c !== card) (c as HTMLElement).style.opacity = '0.4';
        });
      });
    });

    const runeBtn = this.root.querySelector('#btn-take-rune');
    if (runeBtn) {
      runeBtn.addEventListener('click', () => {
        run.collectTreasureRune();
        (runeBtn as HTMLElement).style.border = '2px solid var(--accent-green)';
        (runeBtn as HTMLElement).style.opacity = '0.6';
      });
    }

    this.root.querySelector('#btn-leave-treasure')!.addEventListener('click', () => {
      run.leaveTreasure();
      this.gameManager.changeScreen(GameScreen.Map);
    });

    this.attachSettingsListeners(run);
  }

  private renderVault(): void {
    const meta = this.gameManager.metaManager;
    const items = meta.getVaultItems();

    this.root.innerHTML = `
      <div class="vault-screen">
        <div class="top-bar">
          <button class="icon-btn" id="btn-back">\u2190</button>
          <div></div>
        </div>
        <div class="vault-content">
          <div class="vault-header">
            <h2>The Vault</h2>
            <div class="vault-shards">Shards: ${meta.state.totalShards}</div>
          </div>
          <div class="vault-items">
            ${items.map(item => `
              <div class="vault-item ${item.unlocked ? 'unlocked' : ''}" data-id="${item.id}">
                <div class="vault-item-info">
                  <h4>${h(item.name)}</h4>
                  <p>${h(item.description)}</p>
                </div>
                <div class="vault-item-cost">
                  ${item.unlocked ? 'UNLOCKED' : `${item.cost} shards`}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.root.querySelector('#btn-back')!.addEventListener('click', () => {
      this.gameManager.changeScreen(GameScreen.MainMenu);
    });

    this.root.querySelectorAll('.vault-item:not(.unlocked)').forEach(item => {
      item.addEventListener('click', () => {
        const id = (item as HTMLElement).dataset.id!;
        if (meta.unlockVaultItem(id)) {
          this.renderVault();
        }
      });
    });
  }

  private renderRunEnd(): void {
    const run = this.gameManager.runManager;
    if (!run) return;

    const isVictory = run.currentPhase === 'victory';
    const shards = run.calculateShards();

    this.root.innerHTML = `
      <div class="run-end-screen">
        <div class="run-end-title ${isVictory ? 'victory' : 'defeat'}">
          ${isVictory ? 'VICTORY' : 'DEFEAT'}
        </div>
        <div class="run-end-stats">
          <div>Class: <span>${run.state.playerClass}</span></div>
          <div>Floors Cleared: <span>${run.state.floorsCleared}</span></div>
          <div>Bosses Killed: <span>${run.state.bossesKilled}</span></div>
          <div>Cards Played: <span>${run.state.cardsPlayed}</span></div>
          <div>Damage Dealt: <span>${run.state.damageDealt}</span></div>
          <div>Gold Earned: <span>${run.state.gold}</span></div>
        </div>
        <div class="shards-earned">+${shards} Shards</div>
        <button class="menu-btn primary" id="btn-main-menu" style="margin-top:24px;">Main Menu</button>
        <button class="menu-btn" id="btn-new-run" style="margin-top:12px;">New Run</button>
      </div>
    `;

    this.root.querySelector('#btn-main-menu')!.addEventListener('click', () => {
      this.gameManager.returnToMainMenu();
    });

    this.root.querySelector('#btn-new-run')!.addEventListener('click', () => {
      this.gameManager.changeScreen(GameScreen.CharacterSelect);
    });
  }

  private showDeckView(run: RunManager, context: 'deck' | 'upgrade' | 'remove'): void {
    this.deckViewContext = context;
    this.deckViewVisible = true;

    const overlay = document.createElement('div');
    overlay.className = 'deck-view';
    overlay.id = 'deck-view';
    overlay.innerHTML = `
      <div class="deck-view-header">
        <h3>${context === 'upgrade' ? 'Upgrade a Card' : context === 'remove' ? 'Remove a Card' : 'Your Deck'}</h3>
        <button class="deck-view-close" id="btn-close-deck">Close</button>
      </div>
      <div class="deck-view-cards">
        ${run.state.deck.map(card => {
          const typeClass = card.data.type.toLowerCase();
          const icon = CARD_ICONS[card.data.cardName.replace('+', '')] || '\u2728';
          const rarityClass = card.data.rarity.toLowerCase();
          const isUpgradeable = context === 'upgrade' && !card.data.isUpgraded && card.data.type !== CardType.Curse;
          const isRemovable = context === 'remove';
          const selectable = isUpgradeable || isRemovable || context === 'deck';

          return `
            <div class="card ${typeClass} ${selectable && context !== 'deck' ? 'playable' : ''}"
                 data-instance-id="${card.instanceId}"
                 style="margin-left:0;cursor:${context !== 'deck' ? 'pointer' : 'default'}">
              <div class="card-header">
                <div class="card-name">${card.data.cardName}</div>
                <div class="card-cost">${card.data.energyCost >= 0 ? card.data.energyCost : 'X'}</div>
              </div>
              <div class="card-art">${icon}</div>
              <div class="card-desc">${card.data.description}</div>
              <div class="card-type">${card.data.type}</div>
              <div class="card-rarity ${rarityClass}"></div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.root.appendChild(overlay);

    overlay.querySelector('#btn-close-deck')!.addEventListener('click', () => {
      overlay.remove();
      this.deckViewVisible = false;
    });

    if (context === 'upgrade') {
      overlay.querySelectorAll('.card.playable').forEach(card => {
        card.addEventListener('click', () => {
          const instanceId = (card as HTMLElement).dataset.instanceId!;
          run.restUpgradeCard(instanceId);
          overlay.remove();
          this.deckViewVisible = false;
          this.gameManager.changeScreen(GameScreen.Map);
        });
      });
    } else if (context === 'remove') {
      overlay.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', () => {
          const instanceId = (card as HTMLElement).dataset.instanceId!;
          // Find the remove_card shop item and mark it sold
          const removeItem = run.shopItems.find(item => item.type === 'remove_card' && !item.sold);
          if (removeItem && run.state.gold >= removeItem.cost) {
            run.state.gold -= removeItem.cost;
            removeItem.sold = true;
            run.removeCardFromDeck(instanceId);
          }
          overlay.remove();
          this.deckViewVisible = false;
          this.renderShop();
        });
      });
    }
  }

  private attachCardDragHandlers(run: RunManager, state: CombatState): void {
    const handCards = this.root.querySelectorAll('.hand-cards .card');
    const enemyArea = this.root.querySelector('#enemy-area') as HTMLElement;
    const playZone = this.root.querySelector('#play-zone') as HTMLElement;

    handCards.forEach(cardEl => {
      const el = cardEl as HTMLElement;
      const instanceId = el.dataset.instanceId!;
      const card = state.hand.find(c => c.instanceId === instanceId);
      if (!card) return;

      const canPlay = run.combatEngine.canPlayCard(instanceId);
      if (!canPlay) return;

      // Touch events
      el.addEventListener('touchstart', (e: TouchEvent) => {
        e.preventDefault();
        const touch = e.touches[0];
        this.startDrag(card, el, touch.clientX, touch.clientY);
      }, { passive: false });

      el.addEventListener('touchmove', (e: TouchEvent) => {
        e.preventDefault();
        if (!this.dragState.isDragging) return;
        const touch = e.touches[0];
        this.moveDrag(touch.clientX, touch.clientY, enemyArea, playZone);
      }, { passive: false });

      el.addEventListener('touchend', (e: TouchEvent) => {
        e.preventDefault();
        this.endDrag(run, enemyArea);
      });

      // Mouse events (for desktop testing)
      el.addEventListener('mousedown', (e: MouseEvent) => {
        e.preventDefault();
        this.startDrag(card, el, e.clientX, e.clientY);
      });

      // Single tap for preview
      el.addEventListener('click', (e) => {
        if (this.dragState.isDragging) return;
        this.showCardPreview(card);
      });
    });

    // Global mouse handlers — remove old listeners to prevent leaks
    if (this.boundMouseMove) {
      document.removeEventListener('mousemove', this.boundMouseMove);
    }
    if (this.boundMouseUp) {
      document.removeEventListener('mouseup', this.boundMouseUp);
    }

    this.boundMouseMove = (e: MouseEvent) => {
      if (!this.dragState.isDragging) return;
      this.moveDrag(e.clientX, e.clientY, enemyArea, playZone);
    };
    this.boundMouseUp = () => {
      if (!this.dragState.isDragging) return;
      this.endDrag(run, enemyArea);
    };

    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
  }

  private startDrag(card: CardInstance, el: HTMLElement, x: number, y: number): void {
    this.dragState = {
      card,
      element: el,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      isDragging: false,
    };

    // Start drag after small movement threshold
    const startDragCheck = () => {
      const dx = this.dragState.currentX - this.dragState.startX;
      const dy = this.dragState.currentY - this.dragState.startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        this.dragState.isDragging = true;
        el.classList.add('dragging');
      }
    };

    setTimeout(startDragCheck, 50);
  }

  private moveDrag(x: number, y: number, enemyArea: HTMLElement, playZone: HTMLElement): void {
    this.dragState.currentX = x;
    this.dragState.currentY = y;

    if (!this.dragState.isDragging) {
      const dx = x - this.dragState.startX;
      const dy = y - this.dragState.startY;
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        this.dragState.isDragging = true;
        this.dragState.element?.classList.add('dragging');
      }
      return;
    }

    const el = this.dragState.element;
    if (!el) return;

    const dx = x - this.dragState.startX;
    const dy = y - this.dragState.startY;
    el.style.transform = `translate(${dx}px, ${dy}px) scale(1.2)`;
    el.style.zIndex = '100';

    // Check if in play zone (top half of screen)
    const screenHeight = window.innerHeight;
    if (y < screenHeight * 0.5) {
      playZone.classList.add('active');
      el.classList.add('in-play-zone');
    } else {
      playZone.classList.remove('active');
      el.classList.remove('in-play-zone');
    }
  }

  private endDrag(run: RunManager, enemyArea: HTMLElement): void {
    const el = this.dragState.element;
    const card = this.dragState.card;

    if (el) {
      el.classList.remove('dragging', 'in-play-zone');
      el.style.transform = '';
      el.style.zIndex = '';
    }

    const playZone = this.root.querySelector('#play-zone');
    if (playZone) playZone.classList.remove('active');

    // Check if released in play zone
    const screenHeight = window.innerHeight;
    if (this.dragState.isDragging && card && this.dragState.currentY < screenHeight * 0.5) {
      // Find target enemy (closest to drop point, or default 0)
      const enemyContainers = this.root.querySelectorAll('.enemy-container:not(.enemy-dead)');
      let targetIndex = 0;
      let closestDist = Infinity;

      enemyContainers.forEach(container => {
        const rect = container.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.sqrt(
          (this.dragState.currentX - cx) ** 2 +
          (this.dragState.currentY - cy) ** 2
        );
        if (dist < closestDist) {
          closestDist = dist;
          targetIndex = parseInt((container as HTMLElement).dataset.enemyIndex || '0');
        }
      });

      const success = run.playCard(card.instanceId, targetIndex);
      if (success) {
        const newState = run.combatEngine.getState();
        if (newState.combatOver) {
          this.render();
        } else {
          this.renderCombat();
        }
      } else {
        // Snap back — just re-render
        this.renderCombat();
      }
    }

    this.dragState = { card: null, element: null, startX: 0, startY: 0, currentX: 0, currentY: 0, isDragging: false };
  }

  private showCardPreview(card: CardInstance): void {
    const overlay = this.root.querySelector('#card-preview-overlay') as HTMLElement;
    if (!overlay) return;

    const typeClass = card.data.type.toLowerCase();
    const icon = CARD_ICONS[card.data.cardName.replace('+', '')] || '\u2728';
    const rarityClass = card.data.rarity.toLowerCase();

    overlay.className = 'card-preview-overlay';
    overlay.innerHTML = `
      <div class="card-preview-large ${typeClass}">
        <div class="card-header">
          <div class="card-name">${card.data.cardName}</div>
          <div class="card-cost">${card.data.energyCost >= 0 ? card.data.energyCost : 'X'}</div>
        </div>
        <div class="card-art">${icon}</div>
        <div class="card-desc">${card.data.description}</div>
        <div class="card-type">${card.data.type} — ${card.data.rarity}</div>
        <div class="card-rarity ${rarityClass}"></div>
      </div>
    `;

    overlay.addEventListener('click', () => {
      overlay.className = 'card-preview-overlay hidden';
    });
  }

  private attachSettingsListeners(run: RunManager): void {
    const settingsBtn = this.root.querySelector('#btn-settings');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        // Simple confirm to abandon run
        if (confirm('Abandon this run?')) {
          this.gameManager.abandonRun();
        }
      });
    }
  }
}
