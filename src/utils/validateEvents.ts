import events from '../events.json' with { type: 'json' };
import { Event, Phase, Resources } from '../types';
import { isValidEvent } from './typeGuards.js';

const allowedPhases: Phase[] = ['DAY', 'NIGHT', 'SLEEP'];
const allowedResourceKeys = ['money', 'sanity', 'energy', 'heat', 'anomaly'] as const satisfies Array<keyof Resources>;

const errors: string[] = [];

const ids = new Set<string>();

(
  (events as unknown[]).filter((event): event is Event => isValidEvent(event as Partial<Event>))
).forEach((event, eventIndex) => {
  if (ids.has(event.id)) {
    errors.push(`Duplicate id '${event.id}' at index ${eventIndex}`);
  } else {
    ids.add(event.id);
  }

  if (!allowedPhases.includes(event.phase)) {
    errors.push(`Invalid phase '${event.phase}' in event '${event.id}'. Allowed phases: ${allowedPhases.join(', ')}`);
  }

  if (!Array.isArray(event.choices) || event.choices.length === 0) {
    errors.push(`Event '${event.id}' must include at least one choice.`);
  }

  event.choices.forEach((choice, choiceIndex) => {
    const effects = choice.effects ?? {};
    Object.keys(effects).forEach((key) => {
      if (!allowedResourceKeys.includes(key as keyof Resources)) {
        errors.push(
          `Invalid resource key '${key}' in event '${event.id}' choice ${choiceIndex}. Allowed keys: ${allowedResourceKeys.join(', ')}`,
        );
      }
    });
  });
});

if (errors.length > 0) {
  console.error('Validation failed for events.json:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('events.json validation passed.');
