import items from '../data/items.json' with { type: 'json' };
import { Choice, Event, GameState, Item, Phase } from '../types.js';
import { EndingMeta } from '../ending/endingMeta.js';
import { checkEnding as checkEndingInternal } from './checkEnding.js';
import { applyChoiceEffects, getEventForPhase } from './resolveEvent.js';
import { advancePhase as advancePhaseInternal } from './tick.js';
import {
  INVENTORY_CAPACITY,
  addItem as addItemInternal,
  clampResources,
  removeItem as removeItemInternal,
} from './resources.js';

const cloneState = (state: GameState): GameState => ({
  resources: { ...state.resources },
  time: { ...state.time },
  flags: { ...state.flags },
  history: [...state.history],
  inventory: [...state.inventory],
  paths: { ...state.paths },
});

export const createInitialState = (): GameState => ({
  resources: {
    money: 80,
    sanity: 50,
    energy: 45,
    heat: 40,
    anomaly: 0,
  },
  time: {
    day: 1,
    phase: 'DAY',
  },
  flags: {},
  history: [],
  inventory: [],
  paths: {
    bureaucrat: 0,
    hustler: 0,
    shaman: 0,
    tech: 0,
    drifter: 0,
  },
});

export const getCurrentPhase = (state: GameState): Phase => state.time.phase;

export const pickEventForPhase = (state: GameState): Event | undefined =>
  getEventForPhase(state, getCurrentPhase(state));

export const applyEvent = (
  state: GameState,
  event: Event,
  choiceIndex?: number
): { nextState: GameState; choice: Choice | undefined } => {
  const nextState = cloneState(state);
  const { choice } = applyChoiceEffects(nextState, event, choiceIndex);
  return { nextState, choice };
};

export const advancePhase = (state: GameState): GameState => {
  const nextState = cloneState(state);
  return advancePhaseInternal(nextState);
};

export const checkEnding = (state: GameState): EndingMeta | null => checkEndingInternal(state);

export const addItem = (state: GameState, itemId: string): GameState =>
  addItemInternal(state, itemId, INVENTORY_CAPACITY);

export const removeItem = (state: GameState, itemId: string): GameState =>
  removeItemInternal(state, itemId);

export const useItem = (state: GameState, itemId: string): { nextState: GameState; message: string } => {
  const itemData = (items as Item[]).find((item) => item.id === itemId);
  if (!itemData) {
    return { nextState: state, message: 'Tuntematon esine.' };
  }

  if (!state.inventory.includes(itemId)) {
    return { nextState: state, message: `${itemData.name} ei ole mukana.` };
  }

  if (!itemData.onUse) {
    return { nextState: state, message: `${itemData.name} ei tee mitään kummempaa.` };
  }

  const nextState = cloneState(state);

  for (const [resource, delta] of Object.entries(itemData.onUse.effects ?? {})) {
    const key = resource as keyof GameState['resources'];
    nextState.resources[key] += delta ?? 0;
  }

  clampResources(nextState);

  if (itemData.onUse.consume) {
    removeItemInternal(nextState, itemId);
  }

  return { nextState, message: `Käytit esinettä: ${itemData.name}.` };
};
