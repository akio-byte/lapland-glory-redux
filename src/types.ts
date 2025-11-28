export type Phase = 'DAY' | 'NIGHT' | 'SLEEP';
export type WeatherType = 'CLEAR' | 'SNOWSTORM' | 'FOG' | 'MILD';

export type Resources = {
  money: number;
  sanity: number;
  energy: number;
  heat: number;
  anomaly: number;
};

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

export type GameState = {
  resources: Resources;
  time: TimeState;
  flags: Record<string, boolean>;
  history: string[];
  inventory: string[];
  paths: Record<'bureaucrat' | 'hustler' | 'shaman' | 'tech' | 'drifter', number>;
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
  family: 'paperwar' | 'nightlife' | 'survival' | 'flavor' | 'anomaly';
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
};
