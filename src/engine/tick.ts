import { GameState } from '../types.js';
import { clampResources } from './resources.js';

// Minimal base upkeep to mirror the harsh winter: warmth declines over time
const BASE_HEAT_LOSS = -2;
const BASE_ENERGY_LOSS = -1;
const SLEEP_RECOVERY = { energy: 10, heat: 3, sanity: 1 } as const;

export const advancePhase = (state: GameState) => {
  switch (state.time.phase) {
    case 'DAY':
      // Daytime bureaucracy is exhausting
      state.resources.energy += BASE_ENERGY_LOSS;
      state.resources.heat += BASE_HEAT_LOSS;
      clampResources(state); // Clamp after baseline drains to avoid compounding negatives.
      state.time.phase = 'NIGHT';
      break;
    case 'NIGHT':
      // Night drains heat faster
      state.resources.heat += BASE_HEAT_LOSS * 2;
      state.resources.energy += BASE_ENERGY_LOSS;
      clampResources(state); // Clamp after harsher night drain before resolving sleep.
      state.time.phase = 'SLEEP';
      break;
    case 'SLEEP':
      // Resting partially offsets the loss and starts a new day
      state.resources.energy += SLEEP_RECOVERY.energy;
      state.resources.heat += SLEEP_RECOVERY.heat;
      state.resources.sanity += SLEEP_RECOVERY.sanity;
      clampResources(state); // Clamp after nightly recovery to keep refreshed values in range.
      state.time.day += 1;
      state.time.phase = 'DAY';
      break;
  }
};
