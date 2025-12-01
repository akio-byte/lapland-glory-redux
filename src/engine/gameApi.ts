import items from '../data/items.json' with { type: 'json' };
import { Choice, Difficulty, Event, GameState, Item, Phase } from '../types.js';
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
  meta: { ...state.meta },
});

const DIFFICULTY_STARTING_RESOURCES: Record<Difficulty, GameState['resources']> = {
  EASY: {
    money: 110,
    sanity: 60,
    energy: 55,
    heat: 55,
    anomaly: 0,
  },
  NORMAL: {
    money: 80,
    sanity: 50,
    energy: 45,
    heat: 40,
    anomaly: 0,
  },
  HARD: {
    money: 65,
    sanity: 45,
    energy: 45,
    heat: 35,
    anomaly: 0,
  },
};

export const createInitialState = (difficulty: Difficulty = 'NORMAL'): GameState => ({
  resources: {
    ...DIFFICULTY_STARTING_RESOURCES[difficulty],
  },
  time: {
    day: 1,
    phase: 'DAY',
    weather: 'CLEAR',
  },
  flags: {
    sound_muted: false,
  },
  history: [],
  inventory: [],
  paths: {
    bureaucrat: 0,
    hustler: 0,
    shaman: 0,
    tech: 0,
    drifter: 0,
  },
  meta: {
    difficulty,
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

export const buyItem = (
  state: GameState,
  itemId: string
): { nextState: GameState; success: boolean; message: string } => {
  const item = (items as Item[]).find((entry) => entry.id === itemId);
  if (!item) {
    return { nextState: state, success: false, message: 'Kioski hämmentyy: tuntematon esine.' };
  }

  if (state.resources.money < item.price) {
    return { nextState: state, success: false, message: 'Ei varaa tähän ostokseen.' };
  }

  if (state.inventory.length >= INVENTORY_CAPACITY) {
    return { nextState: state, success: false, message: 'Reppu on täynnä.' };
  }

  const nextState = cloneState(state);
  nextState.resources.money -= item.price;
  addItemInternal(nextState, itemId, INVENTORY_CAPACITY);
  clampResources(nextState);

  return {
    nextState,
    success: true,
    message: `Ostit esineen: ${item.name}.`,
  };
};

export const updateMoney = (state: GameState, delta: number): GameState => {
  const nextState = cloneState(state);
  nextState.resources.money += delta;
  clampResources(nextState);
  return nextState;
};

export const setFlag = (state: GameState, key: string, value: boolean): GameState => {
  if (state.flags[key] === value) return state;

  const nextState = cloneState(state);
  nextState.flags[key] = value;
  return nextState;
};

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

  const effects = itemData.onUse.effects ?? {};
  const positiveResources = (['energy', 'heat', 'sanity'] as const).filter(
    (resource) => (effects[resource] ?? 0) > 0
  );

  if (
    positiveResources.length > 0 &&
    positiveResources.every((resource) => state.resources[resource] > 95)
  ) {
    const blockerMessages: Record<(typeof positiveResources)[number], string> = {
      energy: 'Olet jo aivan tärinöissä, et tarvitse tätä.',
      heat: 'Olet jo lämmin.',
      sanity: 'Psyyke on jo täysissä, et tarvitse tätä.',
    };

    const blockedResource = positiveResources[0];
    return { nextState: state, message: blockerMessages[blockedResource] };
  }

  const nextState = cloneState(state);

  for (const [resource, delta] of Object.entries(effects)) {
    const key = resource as keyof GameState['resources'];
    nextState.resources[key] += delta ?? 0;
  }

  for (const [flag, value] of Object.entries(itemData.onUse.flags ?? {})) {
    nextState.flags[flag] = value;
  }

  clampResources(nextState);

  if (itemData.onUse.consume) {
    removeItemInternal(nextState, itemId);
  }

  const message = itemData.onUse.message ?? `Käytit esinettä: ${itemData.name}.`;

  return { nextState, message };
};
