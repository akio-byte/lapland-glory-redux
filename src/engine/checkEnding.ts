import { ENDINGS, EndingMeta } from '../ending/endingMeta.js';
import { GameState } from '../types.js';

export const MAX_DAYS = 30;

export const checkEnding = (state: GameState): EndingMeta | null => {
  const { money, sanity, heat } = state.resources;

  if (heat <= 0) return ENDINGS.freeze;
  if (money <= 0) return ENDINGS.bankrupt;
  if (sanity <= 0) return ENDINGS.breakdown;
  if (state.time.day > MAX_DAYS) return ENDINGS.spring;

  return null;
};
