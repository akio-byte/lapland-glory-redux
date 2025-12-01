import { Event, Item } from '../types.js';

export const isValidItem = (value: Partial<Item> | null | undefined): value is Item =>
  Boolean(
    value &&
      typeof value.id === 'string' &&
      value.id.trim().length > 0 &&
      typeof value.name === 'string' &&
      typeof value.description === 'string' &&
      (value.type === 'consumable' || value.type === 'tool') &&
      typeof value.price === 'number'
  );

export const isValidEvent = (value: Partial<Event> | null | undefined): value is Event => {
  if (!value) return false;
  if (typeof value.id !== 'string' || value.id.trim().length === 0) return false;
  if (value.phase !== 'DAY' && value.phase !== 'NIGHT' && value.phase !== 'SLEEP') return false;
  if (!value.family || typeof value.title !== 'string' || typeof value.description !== 'string') return false;
  if (!Array.isArray(value.choices) || value.choices.length === 0) return false;
  return true;
};
