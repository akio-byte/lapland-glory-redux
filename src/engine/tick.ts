import { Difficulty, GameState, WeatherType } from '../types.js';
import { clampResources } from './resources.js';

// Minimal base upkeep to mirror the harsh winter: warmth declines over time
export const BASE_HEAT_LOSS = -2;
const BASE_ENERGY_LOSS = -1;
const BASE_SLEEP_RECOVERY = { energy: 10, heat: 3, sanity: 1 } as const;

const DIFFICULTY_TUNING: Record<
  Difficulty,
  {
    heatLossMultiplier: number;
    energyLossMultiplier: number;
    sleepRecoveryBoost: number;
  }
> = {
  EASY: {
    heatLossMultiplier: 0.8,
    energyLossMultiplier: 0.8,
    sleepRecoveryBoost: 1.15,
  },
  NORMAL: {
    heatLossMultiplier: 1,
    energyLossMultiplier: 1,
    sleepRecoveryBoost: 1,
  },
  HARD: {
    heatLossMultiplier: 1.2,
    energyLossMultiplier: 1.15,
    sleepRecoveryBoost: 0.95,
  },
};

const getDifficultyTuning = (difficulty: Difficulty | undefined) =>
  DIFFICULTY_TUNING[difficulty ?? 'NORMAL'];

const WEATHER_PROBABILITIES: { type: WeatherType; threshold: number }[] = [
  { type: 'MILD', threshold: 0.3 },
  { type: 'CLEAR', threshold: 0.6 },
  { type: 'SNOWSTORM', threshold: 0.8 },
  { type: 'FOG', threshold: 1 },
];

const rollWeather = (): WeatherType => {
  const roll = Math.random();
  return WEATHER_PROBABILITIES.find(({ threshold }) => roll < threshold)?.type ?? 'CLEAR';
};

const getHeatLoss = (state: GameState) => {
  const { heatLossMultiplier, energyLossMultiplier } = getDifficultyTuning(state.meta?.difficulty);
  const tunedHeatLoss = BASE_HEAT_LOSS * heatLossMultiplier;
  const tunedEnergyLoss = BASE_ENERGY_LOSS * energyLossMultiplier;

  // Reading the forecast gives a tiny buffer against the cold regardless of difficulty.
  const baseHeatLoss = state.flags['forecast_read'] ? tunedHeatLoss + 1 : tunedHeatLoss;

  const weatherModifiers: Record<WeatherType, { heat: number; energy: number; sanity: number }> = {
    CLEAR: { heat: baseHeatLoss, energy: tunedEnergyLoss, sanity: 0 },
    SNOWSTORM: { heat: baseHeatLoss * 2, energy: tunedEnergyLoss * 2, sanity: 0 },
    MILD: { heat: baseHeatLoss / 2, energy: tunedEnergyLoss / 2, sanity: 0 },
    FOG: { heat: baseHeatLoss, energy: tunedEnergyLoss, sanity: -0.5 },
  };

  return weatherModifiers[state.time.weather] ?? weatherModifiers.CLEAR;
};

const getSleepRecovery = (state: GameState) => {
  const { sleepRecoveryBoost } = getDifficultyTuning(state.meta?.difficulty);
  return {
    energy: BASE_SLEEP_RECOVERY.energy * sleepRecoveryBoost,
    heat: BASE_SLEEP_RECOVERY.heat * sleepRecoveryBoost,
    sanity: BASE_SLEEP_RECOVERY.sanity * sleepRecoveryBoost,
  };
};

export const advancePhase = (state: GameState): GameState => {
  const nextState: GameState = {
    ...state,
    resources: { ...state.resources },
    time: { ...state.time },
    flags: { ...state.flags },
    history: [...state.history],
  };

  const upkeep = getHeatLoss(nextState);

  switch (nextState.time.phase) {
    case 'DAY':
      // Daytime bureaucracy is exhausting
      nextState.resources.energy += upkeep.energy;
      nextState.resources.heat += upkeep.heat;
      nextState.resources.sanity += upkeep.sanity;
      clampResources(nextState); // Clamp after baseline drains to avoid compounding negatives.
      nextState.time.phase = 'NIGHT';
      break;
    case 'NIGHT':
      // Night drains heat faster
      nextState.resources.heat += upkeep.heat * 2;
      nextState.resources.energy += upkeep.energy;
      nextState.resources.sanity += upkeep.sanity;
      clampResources(nextState); // Clamp after harsher night drain before resolving sleep.
      nextState.time.phase = 'SLEEP';
      break;
    case 'SLEEP':
      // Resting partially offsets the loss and starts a new day
      const sleepRecovery = getSleepRecovery(nextState);
      nextState.resources.energy += sleepRecovery.energy;
      nextState.resources.heat += sleepRecovery.heat;
      nextState.resources.sanity += sleepRecovery.sanity;
      nextState.flags['forecast_read'] = false;
      clampResources(nextState); // Clamp after nightly recovery to keep refreshed values in range.
      nextState.time.day += 1;
      nextState.time.phase = 'DAY';
      nextState.time.weather = rollWeather();
      break;
  }

  return nextState;
};
