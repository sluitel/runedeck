export interface DailyRunResult {
  date: string;
  score: number;
  floorsCleared: number;
  won: boolean;
}

export interface MetaState {
  totalShards: number;
  unlockedItemIds: string[];
  unlockedCharacterIds: string[];
  totalRunsCompleted: number;
  highScore: number;
  lastDailyRun: DailyRunResult | null;
  runsWithIronclad: number;
  runsWithHexblade: number;
  runsWithShadowstep: number;
}

export function createDefaultMetaState(): MetaState {
  return {
    totalShards: 0,
    unlockedItemIds: [],
    unlockedCharacterIds: ['Ironclad'],
    totalRunsCompleted: 0,
    highScore: 0,
    lastDailyRun: null,
    runsWithIronclad: 0,
    runsWithHexblade: 0,
    runsWithShadowstep: 0,
  };
}

export function saveMetaState(state: MetaState): void {
  try {
    localStorage.setItem('runedeck_meta', JSON.stringify(state));
  } catch {
    // Silently fail if storage is unavailable
  }
}

export function loadMetaState(): MetaState {
  try {
    const saved = localStorage.getItem('runedeck_meta');
    if (saved) {
      return JSON.parse(saved) as MetaState;
    }
  } catch {
    // Return default if parse fails
  }
  return createDefaultMetaState();
}
