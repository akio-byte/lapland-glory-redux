import items from '../data/items.json' with { type: 'json' };
import { clampResources } from './resources.js';
import { CompletedTask, Event, GameState, Item, Phase, Task } from '../types.js';
import { isValidItem } from '../utils/typeGuards.js';

export type TaskCheckContext = {
  lastEventFamily?: Event['family'];
  purchasedItemId?: string;
  phase?: Phase;
};

const BASE_TASKS: Task[] = [
  {
    id: 'task_job_1',
    description: 'Tee yksi työkeikka ennen päivän loppua.',
    condition: { type: 'event_family', value: 'paperwar' },
    reward: { money: 35, heat: 5 },
  },
  {
    id: 'task_heat_purchase',
    description: 'Käy kioskilla ja osta mikä tahansa lämmittävä item.',
    condition: { type: 'purchase_heat_item' },
    reward: { heat: 10, sanity: 5 },
  },
  {
    id: 'task_first_night',
    description: 'Pysy hengissä ensimmäiseen yöhön asti.',
    condition: { type: 'reach_phase', value: 'NIGHT' },
    reward: { sanity: 5, money: 15 },
  },
];

const safeItems = (items as Partial<Item>[]).filter((entry): entry is Item => isValidItem(entry));

const isHeatItem = (itemId: string): boolean => {
  const item = safeItems.find((entry) => entry.id === itemId);
  if (!item) return false;

  const heatEffect = item.onUse?.effects?.heat ?? 0;
  return heatEffect > 0;
};

const isTaskComplete = (task: Task, state: GameState, context: TaskCheckContext | undefined) => {
  switch (task.condition.type) {
    case 'event_family':
      return context?.lastEventFamily === task.condition.value;
    case 'purchase_heat_item':
      return context?.purchasedItemId ? isHeatItem(context.purchasedItemId) : false;
    case 'reach_phase':
      return (context?.phase ?? state.time.phase) === task.condition.value;
    case 'reach_day':
      return state.time.day >= task.condition.value;
    default:
      return false;
  }
};

export const getDefaultTasks = (): Task[] => BASE_TASKS.map((task) => ({ ...task }));

export const evaluateTasks = (
  prevState: GameState,
  nextState: GameState,
  context?: TaskCheckContext
): { state: GameState; completed: CompletedTask[] } => {
  const activeTasks = nextState.meta.activeTasks ?? [];
  if (activeTasks.length === 0) {
    return { state: nextState, completed: [] };
  }

  const completed: CompletedTask[] = [];
  const remaining: Task[] = [];

  for (const task of activeTasks) {
    if (isTaskComplete(task, nextState, context)) {
      completed.push({ ...task, completedOnDay: nextState.time.day });
      for (const [resource, delta] of Object.entries(task.reward)) {
        const key = resource as keyof GameState['resources'];
        nextState.resources[key] += delta ?? 0;
      }
    } else {
      remaining.push(task);
    }
  }

  if (completed.length === 0) {
    return { state: nextState, completed: [] };
  }

  const updatedState: GameState = {
    ...nextState,
    meta: {
      ...nextState.meta,
      activeTasks: remaining,
      completedTasks: [...(nextState.meta.completedTasks ?? []), ...completed],
    },
  };

  clampResources(updatedState);

  return { state: updatedState, completed };
};
