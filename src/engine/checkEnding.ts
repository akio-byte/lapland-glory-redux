import { Ending, GameState } from '../types.js';

const ENDINGS: Record<string, Ending> = {
  freeze: {
    id: 'freeze',
    title: 'Jäätyminen',
    description: 'Lämpö laski nollaan ja kylmä otti vallan.',
  },
  bankrupt: {
    id: 'bankrupt',
    title: 'Vararikko',
    description: 'Rahasi loppuivat ja velkojat koputtavat ovelle.',
  },
  breakdown: {
    id: 'breakdown',
    title: 'Romahdus',
    description: 'Järki murtuu ja matka päättyy mielesi pimeyteen.',
  },
  spring: {
    id: 'spring',
    title: 'Keväänkoitto',
    description: 'Selvisit Lapin talvesta. Aurinko nousee horisonttiin.',
  },
};

export const MAX_DAYS = 30;

export const checkEnding = (state: GameState): Ending | null => {
  const { money, sanity, heat } = state.resources;

  if (heat <= 0) return ENDINGS.freeze;
  if (money <= 0) return ENDINGS.bankrupt;
  if (sanity <= 0) return ENDINGS.breakdown;
  if (state.time.day > MAX_DAYS) return ENDINGS.spring;

  return null;
};
