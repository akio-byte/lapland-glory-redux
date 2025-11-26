import { GameState } from '../types.js';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const useThemeVars = (state: GameState) => {
  const entropy = clamp(state.time.day / 30, 0, 1);
  const fatigue = 1 - clamp(state.resources.energy / 100, 0, 1);
  const frost = 1 - clamp(state.resources.heat / 100, 0, 1);
  const phase = state.time.phase;

  return {
    entropy,
    fatigue,
    frost,
    phase,
  } as const;
};
