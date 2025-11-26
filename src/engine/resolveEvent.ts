import events from '../events.json' with { type: 'json' };
import { Choice, Event, GameState, Phase } from '../types.js';
import { pickOne, randomInt } from '../utils/rng.js';
import { clampResources } from './resources.js';

export const getEventForPhase = (phase: Phase): Event | undefined => {
  const pool = (events as Event[]).filter((evt) => evt.phase === phase);
  const flavorPool = pool.filter((evt) => evt.family === 'flavor');
  const mainPool = pool.filter((evt) => evt.family !== 'flavor');

  if (mainPool.length === 0 && flavorPool.length === 0) return undefined;

  // Flavor events are integrated here with a lighter weight so they stay rare.
  if (flavorPool.length > 0 && randomInt(100) < 20) {
    return pickOne(flavorPool);
  }

  return pickOne(mainPool.length > 0 ? mainPool : flavorPool);
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

  clampResources(state); // Keep resource updates from choices within expected bounds.

  state.history.push(event.id);
  return { choiceText: choice.text, choice };
};
