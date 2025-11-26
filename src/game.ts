// Entry file targeted by the npm dev/start scripts (added to address missing script error)
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

// Support a bounded run via `--days=N` for quick playtesting without changing game logic.
const parseDayLimit = (): number | null => {
  const args = process.argv.slice(2);
  const daysArg = args.find((arg) => arg === '--days' || arg.startsWith('--days='));

  if (!daysArg) return null;

  const value = daysArg.includes('=')
    ? daysArg.split('=')[1]
    : args[args.indexOf(daysArg) + 1];

  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const dayLimit = parseDayLimit();

const state = createInitialState();

// Core simulation loop: DAY → NIGHT → SLEEP until an ending is met
while (true) {
  if (dayLimit !== null && state.time.day > dayLimit) {
    // Honor the optional day cap for bounded simulations even without an ending.
    console.log(`Reached day limit (${dayLimit}). Ending run.`);
    break;
  }

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
