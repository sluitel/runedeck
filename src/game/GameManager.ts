import { CharacterClass, GameScreen } from '../models/Enums';
import { RunManager } from './RunManager';
import { MetaManager } from './MetaManager';
import { getDailyRunSeed } from '../engine/SeededRandom';

export class GameManager {
  currentScreen: GameScreen;
  runManager: RunManager | null;
  metaManager: MetaManager;
  private onScreenChange: ((screen: GameScreen) => void) | null = null;

  constructor() {
    this.currentScreen = GameScreen.MainMenu;
    this.runManager = null;
    this.metaManager = new MetaManager();
  }

  setScreenChangeListener(listener: (screen: GameScreen) => void): void {
    this.onScreenChange = listener;
  }

  changeScreen(screen: GameScreen): void {
    this.currentScreen = screen;
    if (this.onScreenChange) {
      this.onScreenChange(screen);
    }
  }

  startNewRun(characterClass: CharacterClass): void {
    const seed = Date.now();
    this.runManager = new RunManager(characterClass, seed);

    // Apply meta progression bonuses
    this.runManager.state.maxHp = this.metaManager.getStartingMaxHp();
    this.runManager.state.currentHp = this.runManager.state.maxHp;
    this.runManager.state.gold = this.metaManager.getStartingGold();
    this.runManager.state.maxRuneSlots = this.metaManager.getStartingRuneSlots();

    this.changeScreen(GameScreen.Map);
  }

  startDailyRun(characterClass: CharacterClass): void {
    const seed = getDailyRunSeed();
    this.runManager = new RunManager(characterClass, seed, true);

    this.runManager.state.maxHp = this.metaManager.getStartingMaxHp();
    this.runManager.state.currentHp = this.runManager.state.maxHp;
    this.runManager.state.gold = this.metaManager.getStartingGold();
    this.runManager.state.maxRuneSlots = this.metaManager.getStartingRuneSlots();

    this.changeScreen(GameScreen.Map);
  }

  advanceFloor(): void {
    if (!this.runManager) return;

    this.runManager.advanceToNextFloor();

    switch (this.runManager.currentPhase) {
      case 'draft':
        this.changeScreen(GameScreen.Draft);
        break;
      case 'combat':
        this.changeScreen(GameScreen.Combat);
        break;
      case 'rest':
        this.changeScreen(GameScreen.Rest);
        break;
      case 'shop':
        this.changeScreen(GameScreen.Shop);
        break;
      case 'event':
        this.changeScreen(GameScreen.Event);
        break;
      case 'treasure':
        this.changeScreen(GameScreen.Treasure);
        break;
      case 'game_over':
        this.handleRunEnd(false);
        break;
      case 'victory':
        this.handleRunEnd(true);
        break;
      default:
        this.changeScreen(GameScreen.Map);
    }
  }

  handleCombatEnd(): void {
    if (!this.runManager) return;

    switch (this.runManager.currentPhase) {
      case 'reward':
        this.changeScreen(GameScreen.Reward);
        break;
      case 'boss_reward':
        this.changeScreen(GameScreen.Reward);
        break;
      case 'game_over':
        this.handleRunEnd(false);
        break;
      case 'victory':
        this.handleRunEnd(true);
        break;
    }
  }

  handleRunEnd(victory: boolean): void {
    if (!this.runManager) return;

    const shards = this.runManager.calculateShards();
    this.metaManager.addShards(shards);
    this.metaManager.recordRunCompleted(
      this.runManager.state.playerClass,
      this.runManager.state.floorsCleared
    );

    this.changeScreen(GameScreen.RunEnd);
  }

  returnToMainMenu(): void {
    this.runManager = null;
    this.changeScreen(GameScreen.MainMenu);
  }

  abandonRun(): void {
    if (this.runManager) {
      this.handleRunEnd(false);
    }
  }
}
