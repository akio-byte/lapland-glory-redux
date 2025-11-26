import events from '../events.json' with { type: 'json' };
import { Event, GameState, Phase } from '../types.js';
import { pickOne } from '../utils/rng.js';

const phaseFamilyMap: Record<Phase, Event['family']> = {
  DAY: 'paperwar',
  NIGHT: 'nightlife',
  SLEEP: 'survival',
};

export const getEventForPhase = (phase: Phase): Event | undefined => {
  const family = phaseFamilyMap[phase];
  const pool = (events as Event[]).filter((evt) => evt.family === family);
  return pickOne(pool);
};

export const applyChoiceEffects = (state: GameState, event: Event) => {
  const choice = pickOne(event.choices);
  if (!choice) return { choiceText: 'No choice available' };

  // Apply effects to the game state resources
  for (const [resource, delta] of Object.entries(choice.effects)) {
    const key = resource as keyof GameState['resources'];
    state.resources[key] += delta ?? 0;
  }

  state.history.push(event.id);
  return { choiceText: choice.text };
};
