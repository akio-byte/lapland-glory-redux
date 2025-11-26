import { GameState } from '../types.js';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const useThemeVars = (state: GameState) => {
  const entropy = clamp(state.time.day / 30, 0, 1);
  const fatigue = 1 - clamp(state.resources.energy / 100, 0, 1);
  const frost = 1 - clamp(state.resources.heat / 100, 0, 1);
  // Shiver tracks static discomfort in typography as heat drops without introducing motion.
  const shiver = clamp(1 - state.resources.heat / 100, 0, 1);
  const anomalyLevel = clamp(state.resources.anomaly / 100, 0, 1);
  const phase = state.time.phase;

  return {
    entropy,
    fatigue,
    frost,
    shiver,
    anomalyLevel,
    phase,
  } as const;
};
