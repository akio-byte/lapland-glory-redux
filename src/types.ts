export type Phase = 'DAY' | 'NIGHT' | 'SLEEP';

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
};

export type Event = {
  id: string;
  phase: Phase;
  family: 'paperwar' | 'nightlife' | 'survival' | 'flavor';
  title: string;
  description: string;
  choices: Choice[];
  requirements?: {
    minAnomaly?: number;
    maxSanity?: number;
    requiredFlag?: string;
    requiredPath?: { path: string; minLevel: number };
  };
};
