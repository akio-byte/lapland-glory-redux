export type Phase = 'DAY' | 'NIGHT' | 'SLEEP';
export type WeatherType = 'CLEAR' | 'SNOWSTORM' | 'FOG' | 'MILD';
export type Difficulty = 'EASY' | 'NORMAL' | 'HARD';

export type Resources = {
  money: number;
  sanity: number;
  energy: number;
  heat: number;
  anomaly: number;
};

export type ResourceDelta = Record<keyof Resources, number>;

export type Item = {
  id: string;
  name: string;
  description: string;
  type: 'consumable' | 'tool';
  price: number;
  onUse?: {
    effects?: Partial<Resources>;
    consume?: boolean;
    flags?: Record<string, boolean>;
    message?: string;
  };
};

export type TimeState = {
  day: number;
  phase: Phase;
  weather: WeatherType;
};

export type TaskCondition =
  | { type: 'event_family'; value: Event['family'] }
  | { type: 'purchase_heat_item' }
  | { type: 'reach_phase'; value: Phase }
  | { type: 'reach_day'; value: number };

export type Task = {
  id: string;
  description: string;
  condition: TaskCondition;
  reward: Partial<Resources>;
};

export type CompletedTask = Task & { completedOnDay: number };

export type LogEntry = {
  day: number;
  phase: Phase;
  title: string;
  outcome: string;
};

export type GameState = {
  resources: Resources;
  time: TimeState;
  flags: Record<string, boolean>;
  history: string[];
  inventory: string[];
  log: LogEntry[];
  paths: Record<'bureaucrat' | 'hustler' | 'shaman' | 'tech' | 'drifter', number>;
  meta: {
    difficulty: Difficulty;
    anomalyHighDays?: number;
    activeTasks?: Task[];
    completedTasks?: CompletedTask[];
  };
};

export type Choice = {
  text: string;
  effects: Partial<Resources>;
  loot?: string;
  xp?: Partial<Record<keyof GameState['paths'], number>>;
  flags?: Record<string, boolean>;
};

export type Event = {
  id: string;
  phase: Phase;
  family: 'paperwar' | 'nightlife' | 'survival' | 'flavor' | 'anomaly' | 'fallback';
  title: string;
  description: string;
  imageSrc?: string;
  visual?: string;
  minigame?: 'slots' | 'hack';
  choices: Choice[];
  requirements?: {
    minAnomaly?: number;
    maxSanity?: number;
    requiredFlag?: string;
    requiredPath?: { path: keyof GameState['paths']; minLevel: number };
    requiredItem?: string;
    weather?: WeatherType | WeatherType[];
  };
  tags?: string[];
};
