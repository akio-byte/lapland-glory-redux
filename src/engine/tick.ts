import { GameState } from '../types.js';
import { clampResources } from './resources.js';

// Minimal base upkeep to mirror the harsh winter: warmth declines over time
export const BASE_HEAT_LOSS = -2;
const BASE_ENERGY_LOSS = -1;
const SLEEP_RECOVERY = { energy: 10, heat: 3, sanity: 1 } as const;

export const advancePhase = (state: GameState): GameState => {
  const nextState: GameState = {
    ...state,
    resources: { ...state.resources },
    time: { ...state.time },
    flags: { ...state.flags },
    history: [...state.history],
  };

  switch (nextState.time.phase) {
    case 'DAY':
      // Daytime bureaucracy is exhausting
      nextState.resources.energy += BASE_ENERGY_LOSS;
      nextState.resources.heat += BASE_HEAT_LOSS;
      clampResources(nextState); // Clamp after baseline drains to avoid compounding negatives.
      nextState.time.phase = 'NIGHT';
      break;
    case 'NIGHT':
      // Night drains heat faster
      nextState.resources.heat += BASE_HEAT_LOSS * 2;
      nextState.resources.energy += BASE_ENERGY_LOSS;
      clampResources(nextState); // Clamp after harsher night drain before resolving sleep.
      nextState.time.phase = 'SLEEP';
      break;
    case 'SLEEP':
      // Resting partially offsets the loss and starts a new day
      nextState.resources.energy += SLEEP_RECOVERY.energy;
      nextState.resources.heat += SLEEP_RECOVERY.heat;
      nextState.resources.sanity += SLEEP_RECOVERY.sanity;
      clampResources(nextState); // Clamp after nightly recovery to keep refreshed values in range.
      nextState.time.day += 1;
      nextState.time.phase = 'DAY';
      break;
  }

  return nextState;
};
