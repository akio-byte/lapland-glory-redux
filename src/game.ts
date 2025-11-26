import { applyChoiceEffects, getEventForPhase } from './engine/resolveEvent.js';
import { advancePhase } from './engine/tick.js';
import { checkEnding } from './engine/checkEnding.js';
import { GameState } from './types.js';
import { logEnding, logEvent, logPhaseHeader, logResources } from './utils/log.js';

const createInitialState = (): GameState => ({
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

const state = createInitialState();

// Core simulation loop: DAY → NIGHT → SLEEP until an ending is met
while (true) {
  logPhaseHeader(state);

  const event = getEventForPhase(state.time.phase);
  if (event) {
    const { choiceText } = applyChoiceEffects(state, event);
    logEvent(event, choiceText);
  } else {
    console.log('No event available for this phase.');
  }

  logResources(state);

  const endingAfterEvent = checkEnding(state);
  if (endingAfterEvent) {
    logEnding(endingAfterEvent);
    break;
  }

  advancePhase(state);

  const endingAfterAdvance = checkEnding(state);
  if (endingAfterAdvance) {
    logEnding(endingAfterAdvance);
    break;
  }
}
