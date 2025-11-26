import { Event, GameState } from '../types.js';

export const logPhaseHeader = (state: GameState) => {
  const { day, phase } = state.time;
  console.log(`\n=== Day ${day} :: ${phase} ===`);
};

export const logEvent = (event: Event, choiceText: string) => {
  console.log(`Event: ${event.title} (${event.family})`);
  console.log(`- ${event.description}`);
  console.log(`Choice: ${choiceText}`);
};

export const logResources = (state: GameState) => {
  const { money, sanity, energy, heat, anomaly } = state.resources;
  console.log(
    `Resources => money: ${money}, sanity: ${sanity}, energy: ${energy}, heat: ${heat}, anomaly: ${anomaly}`
  );
};

export const logEnding = (ending: { id: string; title: string; description: string }) => {
  console.log(`\n*** ${ending.title} (${ending.id}) ***`);
  console.log(ending.description);
};
