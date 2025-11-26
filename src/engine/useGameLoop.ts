import { useEffect, useState } from 'react';
import { Choice, Ending, Event, GameState } from '../types.js';
import {
  advancePhase,
  applyEvent,
  checkEnding,
  createInitialState,
  pickEventForPhase,
} from './gameApi.js';

export type GameLoopState = {
  state: GameState;
  currentEvent: Event | null;
  currentEnding: Ending | null;
  lastMessage: string;
  startNewGame: () => void;
  chooseOption: (optionIndex: number) => void;
};

const describeChoice = (event: Event, choice: Choice | undefined) =>
  choice ? `${event.title}: ${choice.text}` : event.title;

export const useGameLoop = (): GameLoopState => {
  const [state, setState] = useState<GameState>(createInitialState);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [currentEnding, setCurrentEnding] = useState<Ending | null>(null);
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
        setLastMessage(describeChoice(event, choice));
        return nextState;
      }

      const advancedState = advancePhase(nextState);
      const endingAfterAdvance = checkEnding(advancedState);

      if (endingAfterAdvance) {
        setCurrentEnding(endingAfterAdvance);
        setCurrentEvent(null);
        setLastMessage(describeChoice(event, choice));
        return advancedState;
      }

      const nextEvent = pickEventForPhase(advancedState) ?? null;
      setCurrentEvent(nextEvent);
      setLastMessage(describeChoice(event, choice));
      return advancedState;
    });
  };

  useEffect(() => {
    startNewGame();
  }, []);

  return { state, currentEvent, currentEnding, lastMessage, startNewGame, chooseOption };
};
