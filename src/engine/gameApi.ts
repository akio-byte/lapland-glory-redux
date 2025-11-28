import { Choice, Event, GameState, Phase } from '../types.js';
import { EndingMeta } from '../ending/endingMeta.js';
import { checkEnding as checkEndingInternal } from './checkEnding.js';
import { applyChoiceEffects, getEventForPhase } from './resolveEvent.js';
import { advancePhase as advancePhaseInternal } from './tick.js';
import { INVENTORY_CAPACITY, addItem as addItemInternal, removeItem as removeItemInternal } from './resources.js';

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
