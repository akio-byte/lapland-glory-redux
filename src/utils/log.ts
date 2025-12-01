import { decorateEventDescription, adaptChoiceLabel, maybeDistortText } from '../narrative/narrativeUtils.js';
import { Choice, Event, GameState } from '../types.js';
import { EndingMeta } from '../ending/endingMeta.js';

export const logPhaseHeader = (state: GameState) => {
  const { day, phase } = state.time;
  console.log(`\n=== Day ${day} :: ${phase} ===`);
};

export const logEvent = (state: GameState, event?: Event | null, choice?: Choice) => {
  if (!event) {
    console.warn('logEvent called without an event. Skipping event log.');
    return;
  }
  const { anomaly } = state.resources;
  const decoratedDescription = decorateEventDescription(event.description, state);
  const distortedDescription = maybeDistortText(decoratedDescription, anomaly);
  const distortedTitle = maybeDistortText(event.title, anomaly);
  const adaptedChoice = adaptChoiceLabel(choice?.text ?? 'No choice available', state);
  const distortedChoice = maybeDistortText(adaptedChoice, anomaly);

  console.log(`Event: ${distortedTitle} (${event.family})`);
  console.log(`- ${distortedDescription}`);
  console.log(`Choice: ${distortedChoice}`);

  const xpEntries = Object.entries(choice?.xp ?? {}).filter(([, amount]) => (amount ?? 0) !== 0);
  if (xpEntries.length > 0) {
    const xpText = xpEntries.map(([path, amount]) => `${path}: ${amount ?? 0}`).join(', ');
    console.log(`XP gained => ${xpText}`);
  }
};

export const logResources = (state: GameState) => {
  const { money, sanity, energy, heat, anomaly } = state.resources;
  console.log(
    `Resources => money: ${money}, sanity: ${sanity}, energy: ${energy}, heat: ${heat}, anomaly: ${anomaly}`
  );
};

export const logEnding = (ending?: EndingMeta | null) => {
  if (!ending) {
    console.warn('logEnding called without an ending.');
    return;
  }
  console.log(`\n*** ${ending.title} (${ending.id}) ***`);
  console.log(ending.description);
};
