import { decorateEventDescription, adaptChoiceLabel, maybeDistortText } from '../narrative/narrativeUtils.js';
import { Event, GameState } from '../types.js';
import { EndingMeta } from '../ending/endingMeta.js';

export const logPhaseHeader = (state: GameState) => {
  const { day, phase } = state.time;
  console.log(`\n=== Day ${day} :: ${phase} ===`);
};

export const logEvent = (state: GameState, event: Event, choiceText: string) => {
  const { anomaly } = state.resources;
  const decoratedDescription = decorateEventDescription(event.description, state);
  const distortedDescription = maybeDistortText(decoratedDescription, anomaly);
  const distortedTitle = maybeDistortText(event.title, anomaly);
  const adaptedChoice = adaptChoiceLabel(choiceText, state);
  const distortedChoice = maybeDistortText(adaptedChoice, anomaly);

  console.log(`Event: ${distortedTitle} (${event.family})`);
  console.log(`- ${distortedDescription}`);
  console.log(`Choice: ${distortedChoice}`);
};

export const logResources = (state: GameState) => {
  const { money, sanity, energy, heat, anomaly } = state.resources;
  console.log(
    `Resources => money: ${money}, sanity: ${sanity}, energy: ${energy}, heat: ${heat}, anomaly: ${anomaly}`
  );
};

export const logEnding = (ending: EndingMeta) => {
  console.log(`\n*** ${ending.title} (${ending.id}) ***`);
  console.log(ending.description);
};
