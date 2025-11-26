export type Phase = 'DAY' | 'NIGHT' | 'SLEEP';

export type Resources = {
  money: number;
  sanity: number;
  energy: number;
  heat: number;
  anomaly: number;
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
};

export type Choice = {
  text: string;
  effects: Partial<Resources>;
};

export type Event = {
  id: string;
  family: 'paperwar' | 'nightlife' | 'survival';
  title: string;
  description: string;
  choices: Choice[];
};

export type EndingId = 'freeze' | 'bankrupt' | 'breakdown' | 'spring';

export type Ending = {
  id: EndingId;
  title: string;
  description: string;
};
