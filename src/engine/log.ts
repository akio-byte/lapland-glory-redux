import { GameState, LogEntry, TimeState } from '../types.js';

export const MAX_LOG_ENTRIES = 20;

export const appendLog = (
  state: GameState,
  entry: { title: string; outcome: string; time?: TimeState }
): GameState => {
  const time = entry.time ?? state.time;
  const logEntry: LogEntry = {
    day: time.day,
    phase: time.phase,
    title: entry.title,
    outcome: entry.outcome,
  };

  const nextLog = [...(state.log ?? []), logEntry];
  if (nextLog.length > MAX_LOG_ENTRIES) {
    nextLog.shift();
  }

  return { ...state, log: nextLog };
};
