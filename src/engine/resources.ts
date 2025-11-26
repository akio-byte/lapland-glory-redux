import { GameState } from '../types.js';

// Keep core resources within sane gameplay bounds so random events cannot softlock the state.
export const clampResources = (state: GameState) => {
  const clamp = (value: number, min: number, max?: number) => {
    const upperBound = max ?? Number.POSITIVE_INFINITY;
    return Math.min(upperBound, Math.max(min, value));
  };

  state.resources.money = clamp(state.resources.money, 0); // Money can accumulate but never go negative.
  state.resources.sanity = clamp(state.resources.sanity, 0, 100);
  state.resources.energy = clamp(state.resources.energy, 0, 100);
  state.resources.heat = clamp(state.resources.heat, 0, 100);
  state.resources.anomaly = clamp(state.resources.anomaly, 0, 100);
};
