import { Choice, Ending, Event, GameState, Phase } from '../types.js';
import { checkEnding as checkEndingInternal } from './checkEnding.js';
import { applyChoiceEffects, getEventForPhase } from './resolveEvent.js';
import { advancePhase as advancePhaseInternal } from './tick.js';

const cloneState = (state: GameState): GameState => ({
  resources: { ...state.resources },
  time: { ...state.time },
  flags: { ...state.flags },
  history: [...state.history],
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
});

export const getCurrentPhase = (state: GameState): Phase => state.time.phase;

export const pickEventForPhase = (state: GameState): Event | undefined =>
  getEventForPhase(getCurrentPhase(state));

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

export const checkEnding = (state: GameState): Ending | null => checkEndingInternal(state);
