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
};

export type Choice = {
  text: string;
  effects: Partial<Resources>;
};

export type Event = {
  id: string;
  phase: Phase;
  family: 'paperwar' | 'nightlife' | 'survival' | 'flavor';
  title: string;
  description: string;
  choices: Choice[];
};
