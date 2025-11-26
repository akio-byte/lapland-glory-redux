import { useEffect, useState } from 'react';
import { EndingMeta } from '../ending/endingMeta.js';
import { adaptChoiceLabel, maybeDistortText } from '../narrative/narrativeUtils.js';
import { Choice, Event, GameState } from '../types.js';
import {
  advancePhase,
  applyEvent,
  checkEnding,
  createInitialState,
  pickEventForPhase,
} from './gameApi.js';
import { clampResources } from './resources.js';

export type GameLoopState = {
  state: GameState;
  currentEvent: Event | null;
  currentEnding: EndingMeta | null;
  lastMessage: string;
  startNewGame: () => void;
  chooseOption: (optionIndex: number) => void;
  spendEnergy: (amount: number, note?: string, exhaustedNote?: string) => boolean;
};

const describeChoice = (event: Event, choice: Choice | undefined, state: GameState) => {
  const { anomaly } = state.resources;
  const title = maybeDistortText(event.title, anomaly);

  if (!choice) return title;

  const adaptedChoice = adaptChoiceLabel(choice.text, state);
  const distortedChoice = maybeDistortText(adaptedChoice, anomaly);
  return `${title}: ${distortedChoice}`;
};

export const useGameLoop = (): GameLoopState => {
  const [state, setState] = useState<GameState>(createInitialState);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [currentEnding, setCurrentEnding] = useState<EndingMeta | null>(null);
  const [lastMessage, setLastMessage] = useState<string>('Valmiina Lapin talveen.');

  const startNewGame = () => {
    const initialState = createInitialState();
    setState(initialState);
    setCurrentEvent(pickEventForPhase(initialState) ?? null);
    setCurrentEnding(null);
    setLastMessage('Talvi alkaa. Päätä selviytymisen suunta.');
  };

  const chooseOption = (optionIndex: number) => {
    const event = currentEvent;
    if (!event) return;

    setState((prev) => {
      const { nextState, choice } = applyEvent(prev, event, optionIndex);
      const endingAfterEvent = checkEnding(nextState);

      if (endingAfterEvent) {
        setCurrentEnding(endingAfterEvent);
        setCurrentEvent(null);
        setLastMessage(describeChoice(event, choice, nextState));
        return nextState;
      }

      const advancedState = advancePhase(nextState);
      const endingAfterAdvance = checkEnding(advancedState);

      if (endingAfterAdvance) {
        setCurrentEnding(endingAfterAdvance);
        setCurrentEvent(null);
        setLastMessage(describeChoice(event, choice, advancedState));
        return advancedState;
      }

      const nextEvent = pickEventForPhase(advancedState) ?? null;
      setCurrentEvent(nextEvent);
      setLastMessage(describeChoice(event, choice, advancedState));
      return advancedState;
    });
  };

  const spendEnergy = (amount: number, note?: string, exhaustedNote?: string) => {
    let allowed = false;
    setState((prev) => {
      if (prev.resources.energy < amount) {
        return prev;
      }

      allowed = true;
      const nextState: GameState = {
        ...prev,
        resources: { ...prev.resources, energy: prev.resources.energy - amount },
      };

      clampResources(nextState);
      return nextState;
    });

    if (note && allowed) {
      setLastMessage(note);
    } else if (!allowed && exhaustedNote) {
      setLastMessage(exhaustedNote);
    }

    return allowed;
  };

  useEffect(() => {
    startNewGame();
  }, []);

  return { state, currentEvent, currentEnding, lastMessage, startNewGame, chooseOption, spendEnergy };
};
