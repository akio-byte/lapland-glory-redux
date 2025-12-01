import { ENDINGS, EndingMeta } from '../ending/endingMeta.js';
import { GameState } from '../types.js';

export const MAX_DAYS = 30;
export const SPRING_GRACE_DAYS = 2;
export const ANOMALIA_THRESHOLD = 80;
export const ANOMALIA_STREAK_DAYS = 3;
export const BUREAUCRAT_MIN_SANITY = 30;
export const BUREAUCRAT_MONEY_THRESHOLD = 180;
export const BUREAUCRAT_PATH_REQUIREMENT = 3;

export const checkEnding = (state: GameState): EndingMeta | null => {
  const { money, sanity, heat, anomaly } = state.resources;
  const sisu = state.sisu ?? { active: false, turnsLeft: 0, triggerReason: null, recovered: false };

  if (sisu.active && sisu.turnsLeft <= 0) {
    return sisu.triggerReason === 'heat' ? ENDINGS.freeze : ENDINGS.breakdown;
  }

  if (sisu.active) {
    return null;
  }

  if (heat <= 0 || sanity <= 0) {
    if (!sisu.recovered) {
      return null;
    }

    return heat <= 0 ? ENDINGS.freeze : ENDINGS.breakdown;
  }

  if (money <= 0) return ENDINGS.bankrupt;

  const anomalyStreak = state.meta?.anomalyHighDays ?? 0;
  const anomalyAwakened = state.flags['anomaly_awakening'] === true;
  const sustainedAnomaly = anomaly >= ANOMALIA_THRESHOLD && anomalyStreak >= ANOMALIA_STREAK_DAYS;

  if (anomalyAwakened || sustainedAnomaly) {
    return ENDINGS.anomalia;
  }

  const paperwarExpert =
    (state.paths?.bureaucrat ?? 0) >= BUREAUCRAT_PATH_REQUIREMENT ||
    state.flags['paperwar_survivor'] === true ||
    state.flags['paperwar_rumor'] === true;
  const wealthyBureaucrat = money >= BUREAUCRAT_MONEY_THRESHOLD && sanity >= BUREAUCRAT_MIN_SANITY;

  if (paperwarExpert && wealthyBureaucrat && anomaly < ANOMALIA_THRESHOLD) {
    return ENDINGS.bureaucrat;
  }

  const survivedTrial =
    state.time.day > 3 && money > 0 && sanity > 0 && heat > 0 && anomaly < ANOMALIA_THRESHOLD;

  if (survivedTrial) {
    return ENDINGS.trial_victory;
  }

  if (state.time.day > MAX_DAYS + SPRING_GRACE_DAYS) return ENDINGS.spring;

  return null;
};
