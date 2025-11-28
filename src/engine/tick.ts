import { GameState, WeatherType } from '../types.js';
import { clampResources } from './resources.js';

// Minimal base upkeep to mirror the harsh winter: warmth declines over time
export const BASE_HEAT_LOSS = -2;
const BASE_ENERGY_LOSS = -1;
const SLEEP_RECOVERY = { energy: 10, heat: 3, sanity: 1 } as const;

const rollWeather = (): WeatherType => {
  const roll = Math.random();

  if (roll < 0.3) return 'MILD';
  if (roll < 0.6) return 'CLEAR';
  if (roll < 0.8) return 'SNOWSTORM';
  return 'FOG';
};

const getHeatLoss = (state: GameState) => {
  const baseHeatLoss = state.flags['forecast_read'] ? BASE_HEAT_LOSS + 1 : BASE_HEAT_LOSS;

  const weatherModifiers: Record<WeatherType, { heat: number; energy: number; sanity: number }> = {
    CLEAR: { heat: baseHeatLoss, energy: BASE_ENERGY_LOSS, sanity: 0 },
    SNOWSTORM: { heat: baseHeatLoss * 2, energy: BASE_ENERGY_LOSS * 2, sanity: 0 },
    MILD: { heat: baseHeatLoss / 2, energy: BASE_ENERGY_LOSS / 2, sanity: 0 },
    FOG: { heat: baseHeatLoss, energy: BASE_ENERGY_LOSS, sanity: -0.5 },
  };

  return weatherModifiers[state.time.weather] ?? weatherModifiers.CLEAR;
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
      nextState.resources.energy += SLEEP_RECOVERY.energy;
      nextState.resources.heat += SLEEP_RECOVERY.heat;
      nextState.resources.sanity += SLEEP_RECOVERY.sanity;
      nextState.flags['forecast_read'] = false;
      clampResources(nextState); // Clamp after nightly recovery to keep refreshed values in range.
      nextState.time.day += 1;
      nextState.time.phase = 'DAY';
      nextState.time.weather = rollWeather();
      break;
  }

  return nextState;
};
