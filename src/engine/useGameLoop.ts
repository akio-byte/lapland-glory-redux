import { useEffect, useState } from 'react';
import { ENDINGS, EndingMeta } from '../ending/endingMeta.js';
import { adaptChoiceLabel, maybeDistortText } from '../narrative/narrativeUtils.js';
import {
  Choice,
  Difficulty,
  Event,
  GameState,
  ResourceDelta,
  Resources,
  TimeState,
} from '../types.js';
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
import { MAX_LOG_ENTRIES, appendLog } from './log.js';
import { loadGame, saveGame } from './storage.js';
import { evaluateTasks, getDefaultTasks, TaskCheckContext } from './tasks.js';
import { CompletedTask } from '../types.js';

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
  resetForMenu: () => void;
  debug: {
    addMoney: () => void;
    restoreSanity: () => void;
    triggerFreezeEnding: () => void;
    skipDay: () => void;
  };
  taskToast: CompletedTask | null;
  clearTaskToast: () => void;
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
  const [taskToast, setTaskToast] = useState<CompletedTask | null>(null);

  const MAX_PHASE_SKIPS = 4;

  type Resolution = {
    state: GameState;
    event: Event | null;
    ending: EndingMeta | null;
    skippedPhases: number;
    exhausted: boolean;
  };

  const findNextEventOrAdvance = (baseState: GameState): Resolution => {
    let workingState = baseState;
    let skipped = 0;
    let lastPickReason: ReturnType<typeof pickEventForPhase> | null = null;

    while (skipped <= MAX_PHASE_SKIPS) {
      const ending = checkEnding(workingState);
      if (ending) {
        return { state: workingState, event: null, ending, skippedPhases: skipped, exhausted: false };
      }

      const pick = pickEventForPhase(workingState);
      lastPickReason = pick;

      if (pick.event) {
        return {
          state: workingState,
          event: pick.event,
          ending: null,
          skippedPhases: skipped,
          exhausted: false,
        };
      }

      if (skipped === MAX_PHASE_SKIPS) break;

      workingState = advancePhase(workingState);
      skipped += 1;
    }

    if (lastPickReason) {
      console.warn(
        `No events available after ${MAX_PHASE_SKIPS} phase skips. Reason: ${lastPickReason.reason}.`
      );
    }

    return {
      state: workingState,
      event: null,
      ending: ENDINGS.dataExhausted,
      skippedPhases: skipped,
      exhausted: true,
    };
  };

  const updateState = (
    updater: GameState | ((prev: GameState) => GameState),
    options: { trackDelta?: boolean; skipTasks?: boolean; context?: TaskCheckContext } = {}
  ) => {
    const { trackDelta = true, skipTasks = false, context } = options;
    setState((prev) => {
      const baseNext =
        typeof updater === 'function' ? (updater as (state: GameState) => GameState)(prev) : updater;
      const { state: next, completed } = skipTasks
        ? { state: baseNext, completed: [] as CompletedTask[] }
        : evaluateTasks(prev, baseNext, context);
      if (completed.length > 0) {
        const latest = completed[completed.length - 1];
        setTaskToast(latest);
        setLastMessage(`Tehtävä suoritettu: ${latest.description}`);
      }
      const delta = trackDelta ? computeResourceDelta(prev.resources, next.resources) : createEmptyDelta();
      setLastResourceDelta(delta);
      return next;
    });
  };

  const continueFromSave = (savedState: GameState) => {
    const hydratedState: GameState = {
      ...savedState,
      flags: { sound_muted: false, ...(savedState.flags ?? {}) },
      log: (savedState.log ?? []).slice(-MAX_LOG_ENTRIES),
      meta: {
        difficulty: savedState.meta?.difficulty ?? defaultDifficulty,
        anomalyHighDays: savedState.meta?.anomalyHighDays ?? 0,
        activeTasks: savedState.meta?.activeTasks ?? getDefaultTasks(),
        completedTasks: savedState.meta?.completedTasks ?? [],
      },
    };

    const resolution = findNextEventOrAdvance(hydratedState);
    if (!resolution.event && !resolution.ending) {
      console.warn('No event found when continuing from save. Falling back to empty state.');
    }
    updateState(resolution.state, { trackDelta: false, skipTasks: true });
    setCurrentEvent(resolution.event);
    setCurrentEnding(resolution.ending);
    setLastMessage(resolution.exhausted ? 'Tallennus oli vanhentunut.' : 'Jatketaan aiempaa peliä.');
    setHasHydrated(true);
  };

  const startNewGame = (difficulty: Difficulty = defaultDifficulty) => {
    const initialState = createInitialState(difficulty);
    const resolution = findNextEventOrAdvance(initialState);
    if (!resolution.event && !resolution.ending) {
      console.warn('No starting event found. Continuing without initial event.');
    }
    updateState(resolution.state, { trackDelta: false, skipTasks: true });
    setCurrentEvent(resolution.event);
    setCurrentEnding(resolution.ending);
    setLastMessage('Talvi alkaa. Päätä selviytymisen suunta.');
    if (!resolution.exhausted) {
      saveGame(resolution.state);
    }
    setHasHydrated(true);
  };

  const chooseOption = (optionIndex: number) => {
    const event = currentEvent;
    if (!event) return;

    updateState(
      (prev) => {
        const { nextState, choice } = applyEvent(prev, event, optionIndex);
        const choiceLabel = choice ? adaptChoiceLabel(choice.text, prev) : 'Ratkaisu';
        const loggedState = appendLog(nextState, {
          title: event.title,
          outcome: choiceLabel,
          time: prev.time,
        });
        const endingAfterEvent = checkEnding(loggedState);
        const describedChoice = describeChoice(event, choice, loggedState);

        if (endingAfterEvent) {
          setCurrentEnding(endingAfterEvent);
          setCurrentEvent(null);
          setLastMessage(describedChoice);
          return loggedState;
        }

        const advancedState = advancePhase(loggedState);
        const resolution = findNextEventOrAdvance(advancedState);

        if (resolution.ending) {
          setCurrentEnding(resolution.ending);
          setCurrentEvent(null);
        } else {
          setCurrentEvent(resolution.event);
        }

        setLastMessage(describedChoice);
        return resolution.state;
      },
      { context: { lastEventFamily: event.family } }
    );
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
    updateState((prev) => {
      const updated = updateMoney(prev, delta);
      if (!note) return updated;

      const title = currentEvent?.title ?? 'Toiminta';
      return appendLog(updated, { title, outcome: note, time: prev.time });
    });
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
      if (!note) return next;

      const title = currentEvent?.title ?? 'Toiminta';
      return appendLog(next, { title, outcome: note, time: prev.time });
    });

    if (note) {
      setLastMessage(note);
    }
  };

  const setFlag = (key: string, value: boolean) => {
    updateState((prev) => setFlagInternal(prev, key, value));
  };

  const resetForMenu = () => {
    const base = createInitialState(defaultDifficulty);
    setState(base);
    setCurrentEvent(null);
    setCurrentEnding(null);
    setLastResourceDelta(createEmptyDelta());
    setTaskToast(null);
    setLastMessage('Valmiina Lapin talveen.');
    setHasHydrated(false);
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
    console.log('GameLoop debug', {
      day: state.time.day,
      phase: state.time.phase,
      currentEventId: currentEvent?.id,
      currentEvent,
    });
  }, [state.time.day, state.time.phase, currentEvent]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (currentEnding?.id === ENDINGS.dataExhausted.id) return;

    const endingId = currentEnding?.id;
    if (endingId && endingId === ENDINGS.dataExhausted.id) return;

    saveGame(state);
  }, [state, hasHydrated, currentEnding]);

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

      const resolution = findNextEventOrAdvance(next);
      if (resolution.ending) {
        setCurrentEnding(resolution.ending);
        setCurrentEvent(null);
      } else {
        setCurrentEnding(null);
        setCurrentEvent(resolution.event);
      }

      return resolution.state;
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
    resetForMenu,
    buyItem: (itemId: string) => {
      let purchaseSuccess = false;
      updateState(
        (prev) => {
          const { nextState, message, success } = buyItemInternal(prev, itemId);
          setLastMessage(message);
          purchaseSuccess = success;
          return nextState;
        },
        { context: { purchasedItemId: itemId } }
      );

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
    taskToast,
    clearTaskToast: () => setTaskToast(null),
  };
};
