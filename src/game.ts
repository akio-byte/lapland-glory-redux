// Entry file targeted by the npm start script
import { advancePhase, applyEvent, checkEnding, createInitialState, pickEventForPhase } from './engine/gameApi.js';
import { logEnding, logEvent, logPhaseHeader, logResources } from './utils/log.js';

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

let state = createInitialState();

// Core simulation loop: DAY → NIGHT → SLEEP until an ending is met
while (true) {
  if (dayLimit !== null && state.time.day > dayLimit) {
    // Honor the optional day cap for bounded simulations even without an ending.
    console.log(`Reached day limit (${dayLimit}). Ending run.`);
    break;
  }

  logPhaseHeader(state);

  const event = pickEventForPhase(state);
  if (event) {
    const { nextState, choice } = applyEvent(state, event);
    state = nextState;
    logEvent(state, event, choice);
  } else {
    console.log('No event available for this phase.');
  }

  logResources(state);

  const endingAfterEvent = checkEnding(state);
  if (endingAfterEvent) {
    logEnding(endingAfterEvent);
    break;
  }

  state = advancePhase(state);

  const endingAfterAdvance = checkEnding(state);
  if (endingAfterAdvance) {
    logEnding(endingAfterAdvance);
    break;
  }
}
