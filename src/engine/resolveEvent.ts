import events from '../events.json' with { type: 'json' };
import { Choice, Event, GameState, Phase } from '../types.js';
import { pickOne, randomInt } from '../utils/rng.js';
import { INVENTORY_CAPACITY, addItem, clampResources } from './resources.js';

export type EventPickResult = {
  event: Event | null;
  reason: 'none' | 'no_events_for_phase' | 'requirements_blocked';
  eligibleCount: number;
  fallbackUsed: boolean;
};

const isFallback = (event: Event) => event.tags?.includes('fallback') ?? false;

const meetsRequirements = (event: Event, state: GameState): boolean => {
  const reqs = event.requirements;
  if (!reqs) return true;

  if (reqs.minAnomaly !== undefined && state.resources.anomaly < reqs.minAnomaly) {
    return false;
  }

  if (reqs.maxSanity !== undefined && state.resources.sanity > reqs.maxSanity) {
    return false;
  }

  if (reqs.requiredFlag && state.flags[reqs.requiredFlag] !== true) {
    return false;
  }

  if (reqs.requiredPath) {
    const { path, minLevel } = reqs.requiredPath;
    const currentLevel = state.paths[path as keyof GameState['paths']];
    if (currentLevel === undefined || currentLevel < minLevel) {
      return false;
    }
  }

  if (reqs.requiredItem && !state.inventory.includes(reqs.requiredItem)) {
    return false;
  }

  if (reqs.weather) {
    const currentWeather = state.time.weather;
    if (Array.isArray(reqs.weather)) {
      if (!reqs.weather.includes(currentWeather)) {
        return false;
      }
    } else if (reqs.weather !== currentWeather) {
      return false;
    }
  }

  return true;
};

export const getEventForPhase = (state: GameState, phase: Phase): EventPickResult => {
  const allForPhase = (events as Event[]).filter((evt) => evt.phase === phase);
  const pool = allForPhase.filter((evt) => meetsRequirements(evt, state));
  const flavorPool = pool.filter((evt) => evt.family === 'flavor' && !isFallback(evt));
  const fallbackPool = pool.filter((evt) => isFallback(evt));
  const mainPool = pool.filter((evt) => evt.family !== 'flavor' && !isFallback(evt));

  let chosenPool: Event[] = [];
  let fallbackUsed = false;

  if (mainPool.length === 0 && flavorPool.length === 0 && fallbackPool.length === 0) {
    return {
      event: null,
      reason: allForPhase.length === 0 ? 'no_events_for_phase' : 'requirements_blocked',
      eligibleCount: pool.length,
      fallbackUsed,
    };
  }

  if (flavorPool.length > 0 && randomInt(100) < 20) {
    chosenPool = flavorPool;
  } else if (mainPool.length > 0) {
    chosenPool = mainPool;
  } else if (flavorPool.length > 0) {
    chosenPool = flavorPool;
  }

  if (chosenPool.length === 0 && fallbackPool.length > 0) {
    chosenPool = fallbackPool;
    fallbackUsed = true;
  }

  if (chosenPool.length === 0) {
    return {
      event: null,
      reason: 'requirements_blocked',
      eligibleCount: pool.length,
      fallbackUsed,
    };
  }

  return {
    event: pickOne(chosenPool),
    reason: 'none',
    eligibleCount: pool.length,
    fallbackUsed,
  };
};

export const applyChoiceEffects = (state: GameState, event: Event, choiceIndex?: number) => {
  const explicitChoice =
    choiceIndex !== undefined ? (event.choices[choiceIndex] as Choice | undefined) : undefined;
  const choice = explicitChoice ?? pickOne(event.choices) ?? event.choices[0];
  if (!choice) return { choiceText: 'No choice available', choice: undefined };

  // Apply effects to the game state resources
  for (const [resource, delta] of Object.entries(choice.effects)) {
    const key = resource as keyof GameState['resources'];
    state.resources[key] += delta ?? 0;
  }

  for (const [path, xp] of Object.entries(choice.xp ?? {})) {
    const key = path as keyof GameState['paths'];
    state.paths[key] += xp ?? 0;
  }

  for (const [flag, value] of Object.entries(choice.flags ?? {})) {
    state.flags[flag] = value;
  }

  clampResources(state); // Keep resource updates from choices within expected bounds.

  if (choice.loot) {
    addItem(state, choice.loot, INVENTORY_CAPACITY);
  }

  state.history.push(event.id);
  return { choiceText: choice.text, choice };
};
