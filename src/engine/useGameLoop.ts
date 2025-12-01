import { useEffect, useState } from 'react';
import { EndingMeta } from '../ending/endingMeta.js';
import { adaptChoiceLabel, maybeDistortText } from '../narrative/narrativeUtils.js';
import { Choice, Difficulty, Event, GameState, ResourceDelta, Resources } from '../types.js';
import {
  advancePhase,
  applyEvent,
  buyItem as buyItemInternal,
  checkEnding,
  createInitialState,
  pickEventForPhase,
  setFlag as setFlagInternal,
  updateMoney,
  useItem,
} from './gameApi.js';
import { clampResources } from './resources.js';
import { loadGame, saveGame } from './storage.js';

export type GameLoopState = {
  state: GameState;
  currentEvent: Event | null;
  currentEnding: EndingMeta | null;
  lastMessage: string;
  resourceDelta: ResourceDelta;
  continueFromSave: (savedState: GameState) => void;
  startNewGame: (difficulty?: Difficulty) => void;
  chooseOption: (optionIndex: number) => void;
  spendEnergy: (amount: number, note?: string, exhaustedNote?: string) => boolean;
  adjustMoney: (delta: number, note?: string) => void;
  adjustResources: (delta: Partial<Resources>, note?: string) => void;
  setFlag: (key: string, value: boolean) => void;
  useItem: (itemId: string) => void;
  buyItem: (itemId: string) => boolean;
  debug: {
    addMoney: () => void;
    restoreSanity: () => void;
    triggerFreezeEnding: () => void;
    skipDay: () => void;
  };
};

const createEmptyDelta = (): ResourceDelta => ({
  money: 0,
  sanity: 0,
  energy: 0,
  heat: 0,
  anomaly: 0,
});

const computeResourceDelta = (prev: Resources, next: Resources): ResourceDelta => ({
  money: next.money - prev.money,
  sanity: next.sanity - prev.sanity,
  energy: next.energy - prev.energy,
  heat: next.heat - prev.heat,
  anomaly: next.anomaly - prev.anomaly,
});

const describeChoice = (event: Event, choice: Choice | undefined, state: GameState) => {
  const { anomaly } = state.resources;
  const title = maybeDistortText(event.title, anomaly);

  if (!choice) return title;

  const adaptedChoice = adaptChoiceLabel(choice.text, state);
  const distortedChoice = maybeDistortText(adaptedChoice, anomaly);
  return `${title}: ${distortedChoice}`;
};

type UseGameLoopOptions = {
  /**
   * When false, the hook skips the automatic hydration on mount.
   * Consumers can call `startNewGame` or `continueFromSave` manually to begin play.
   */
  autoStart?: boolean;
  /**
   * Default difficulty used when starting a new run without an explicit selection.
   */
  defaultDifficulty?: Difficulty;
};

export const useGameLoop = ({
  autoStart = true,
  defaultDifficulty = 'NORMAL',
}: UseGameLoopOptions = {}): GameLoopState => {
  const [state, setState] = useState<GameState>(() => createInitialState(defaultDifficulty));
  const [lastResourceDelta, setLastResourceDelta] = useState<ResourceDelta>(() => createEmptyDelta());
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [currentEnding, setCurrentEnding] = useState<EndingMeta | null>(null);
  const [lastMessage, setLastMessage] = useState<string>('Valmiina Lapin talveen.');
  const [hasHydrated, setHasHydrated] = useState(false);

  const updateState = (
    updater: GameState | ((prev: GameState) => GameState),
    options: { trackDelta?: boolean } = {}
  ) => {
    const { trackDelta = true } = options;
    setState((prev) => {
      const next = typeof updater === 'function' ? (updater as (state: GameState) => GameState)(prev) : updater;
      const delta = trackDelta ? computeResourceDelta(prev.resources, next.resources) : createEmptyDelta();
      setLastResourceDelta(delta);
      return next;
    });
  };

  const continueFromSave = (savedState: GameState) => {
    const hydratedState: GameState = {
      ...savedState,
      flags: { sound_muted: false, ...(savedState.flags ?? {}) },
      meta: {
        difficulty: savedState.meta?.difficulty ?? defaultDifficulty,
      },
    };

    updateState(hydratedState, { trackDelta: false });
    setCurrentEvent(pickEventForPhase(hydratedState) ?? null);
    setCurrentEnding(checkEnding(hydratedState));
    setLastMessage('Jatketaan aiempaa peliä.');
    setHasHydrated(true);
  };

  const startNewGame = (difficulty: Difficulty = defaultDifficulty) => {
    const initialState = createInitialState(difficulty);
    updateState(initialState);
    setCurrentEvent(pickEventForPhase(initialState) ?? null);
    setCurrentEnding(null);
    setLastMessage('Talvi alkaa. Päätä selviytymisen suunta.');
    saveGame(initialState);
    setHasHydrated(true);
  };

  const chooseOption = (optionIndex: number) => {
    const event = currentEvent;
    if (!event) return;

    updateState((prev) => {
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
    updateState((prev) => {
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

  const adjustMoney = (delta: number, note?: string) => {
    updateState((prev) => updateMoney(prev, delta));
    if (note) {
      setLastMessage(note);
    }
  };

  const adjustResources = (delta: Partial<Resources>, note?: string) => {
    updateState((prev) => {
      const next: GameState = {
        ...prev,
        resources: { ...prev.resources },
      };

      for (const [resource, amount] of Object.entries(delta)) {
        const key = resource as keyof Resources;
        next.resources[key] += amount ?? 0;
      }

      clampResources(next);
      return next;
    });

    if (note) {
      setLastMessage(note);
    }
  };

  const setFlag = (key: string, value: boolean) => {
    updateState((prev) => setFlagInternal(prev, key, value));
  };

  useEffect(() => {
    if (!autoStart || hasHydrated) return;

    const savedState = loadGame();
    if (savedState) {
      continueFromSave(savedState);
      return;
    }

    startNewGame();
  }, [autoStart, hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;

    saveGame(state);
  }, [state, hasHydrated]);

  const addMoney = () => {
    updateState((prev) => {
      const next: GameState = {
        ...prev,
        resources: { ...prev.resources, money: prev.resources.money + 50 },
      };
      clampResources(next);
      return next;
    });
    setLastMessage('Debug: Lisätty 50€ kassaan.');
  };

  const restoreSanity = () => {
    updateState((prev) => {
      const next: GameState = {
        ...prev,
        resources: { ...prev.resources, sanity: 100 },
      };
      clampResources(next);
      return next;
    });
    setLastMessage('Debug: Mielenrauha palautettu.');
  };

  const triggerFreezeEnding = () => {
    updateState((prev) => {
      const next: GameState = {
        ...prev,
        resources: { ...prev.resources, heat: 0 },
      };
      clampResources(next);
      const ending = checkEnding(next);
      setCurrentEnding(ending);
      setCurrentEvent(null);
      return next;
    });
    setLastMessage('Debug: Jäätyminen laukaisi lopun.');
  };

  const skipDay = () => {
    updateState((prev) => {
      let next = prev;
      for (let i = 0; i < 3; i += 1) {
        next = advancePhase(next);
      }

      const ending = checkEnding(next);
      if (ending) {
        setCurrentEnding(ending);
        setCurrentEvent(null);
      } else {
        setCurrentEnding(null);
        setCurrentEvent(pickEventForPhase(next) ?? null);
      }

      return next;
    });
    setLastMessage('Debug: Hypättiin seuraavaan päivään.');
  };

  return {
    state,
    currentEvent,
    currentEnding,
    lastMessage,
    resourceDelta: lastResourceDelta,
    startNewGame,
    chooseOption,
    spendEnergy,
    adjustMoney,
    adjustResources,
    setFlag,
    buyItem: (itemId: string) => {
      let purchaseSuccess = false;
      updateState((prev) => {
        const { nextState, message, success } = buyItemInternal(prev, itemId);
        setLastMessage(message);
        purchaseSuccess = success;
        return nextState;
      });

      return purchaseSuccess;
    },
    useItem: (itemId: string) => {
      updateState((prev) => {
        const { nextState, message } = useItem(prev, itemId);
        setLastMessage(message);
        return nextState;
      });
    },
    continueFromSave,
    debug: {
      addMoney,
      restoreSanity,
      triggerFreezeEnding,
      skipDay,
    },
  };
};
